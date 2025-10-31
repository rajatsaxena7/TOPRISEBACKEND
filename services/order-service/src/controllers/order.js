const Order = require("../models/order");
const PickList = require("../models/pickList");
const dealerAssignmentQueue = require("../queues/assignmentQueue");
const { v4: uuidv4 } = require("uuid"); // npm install uuid
const Cart = require("../models/cart");
const { Parser } = require("json2csv");
//added picklist model
const {
  cacheGet,
  cacheSet,
  cacheDel, // ⬅️ writer-side "del" helper
} = require("/packages/utils/cache");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const Redis = require("redis");
const axios = require("axios");
const redisClient = require("/packages/utils/redisClient");
const {
  createUnicastOrMulticastNotificationUtilityFunction,
  sendOrderConfirmationEmail,
} = require("../../../../packages/utils/notificationService");
const {
  checkSLAViolationOnPacking,
  recordSLAViolation,
  updateOrderWithSLAViolation,
} = require("../utils/slaViolationUtils");
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL ||
  "http://user-service:5001/api/users/api/users";

// Geocode an address string to { latitude, longitude }
async function geocodeAddress(address) {
  try {
    if (!address || typeof address !== "string") return null;
    const resp = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: { q: address, format: "json", limit: 1 },
        headers: { "User-Agent": "toprise-order-service/1.0" },
        timeout: 10000,
      }
    );
    const first = Array.isArray(resp.data) ? resp.data[0] : null;
    if (first && first.lat && first.lon) {
      return { latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) };
    }
    return null;
  } catch (e) {
    logger.warn(`Geocoding failed for address: ${address} -> ${e.message}`);
    return null;
  }
}

function buildAddressString(parts) {
  return [
    parts?.building_no,
    parts?.street,
    parts?.area,
    parts?.city,
    parts?.state,
    parts?.pincode,
    parts?.country,
  ]
    .filter(Boolean)
    .join(", ");
}

// Helper function to fetch dealer information from user service
async function fetchDealerInfo(dealerId, authorizationHeader) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }

    const response = await axios.get(
      `http://user-service:5001/api/users/dealer/${dealerId}`,
      { timeout: 5000, headers }
    );

    return response.data?.data || null;
  } catch (error) {
    logger.warn(`Failed to fetch dealer info for ${dealerId}:`, error.message);
    return null;
  }
}

// Helper function to fetch user information from user service
async function fetchUserInfo(userId, authorizationHeader) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }

    const response = await axios.get(
      `http://user-service:5001/api/users/${userId}`,
      { timeout: 5000, headers }
    );

    return response.data?.data || null;
  } catch (error) {
    logger.warn(`Failed to fetch user info for ${userId}:`, error.message);
    return null;
  }
}

// Helper function to fetch multiple dealers information
async function fetchMultipleDealersInfo(dealerIds, authorizationHeader) {
  try {
    const headers = { "Content-Type": "application/json" };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }

    const response = await axios.post(
      `http://user-service:5001/api/users/dealers/batch`,
      { dealerIds },
      { timeout: 10000, headers }
    );

    return response.data?.data || [];
  } catch (error) {
    logger.warn(`Failed to fetch multiple dealers info:`, error.message);
    return [];
  }
}
const {
  updateSkuStatus,
  calculateOrderStatus,
} = require("../utils/orderStatusCalculator");
const { logOrderAction } = require("../utils/auditLogger");
const { generatePdfAndUploadInvoice } = require("../../../../packages/utils/generateInvoice");

async function fetchUser(userId) {
  try {
    const { data } = await axios.get(`${USER_SERVICE_URL}/${userId}`);
    return data.data || null;
  } catch (e) {
    return null;
  }
}

async function fetchDealer(dealerId) {
  try {
    const { data } = await axios.get(`${USER_SERVICE_URL}/dealer/${dealerId}`);
    return data.data || null;
  } catch (e) {
    return null;
  }
}

// Enhanced helper functions for multi-service data fetching
async function fetchUser(userId) {
  try {
    if (!userId) return null;

    const response = await axios.get(`${USER_SERVICE_URL}/user/${userId}`, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data?.data || response.data || null;
  } catch (e) {
    logger.warn(`Failed to fetch user ${userId}:`, e.message);
    return null;
  }
}

async function fetchDealerDetails(dealerId) {
  try {
    if (!dealerId) return null;

    const response = await axios.get(`${USER_SERVICE_URL}/dealer/${dealerId}`, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data?.data || response.data || null;
  } catch (e) {
    logger.warn(`Failed to fetch dealer ${dealerId}:`, e.message);
    return null;
  }
}

async function fetchStaffDetails(staffId) {
  try {
    if (!staffId) return null;

    const response = await axios.get(`${USER_SERVICE_URL}/staff/${staffId}`, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data?.data || response.data || null;
  } catch (e) {
    logger.warn(`Failed to fetch staff ${staffId}:`, e.message);
    return null;
  }
}

async function fetchOrderDetails(orderId) {
  try {
    const order = await Order.findById(orderId).lean();
    if (!order) return null;

    // Fetch customer details from user service
    const customerInfo = await fetchUser(order.customerDetails?.userId);

    // Fetch dealer details for each dealer in dealerMapping
    const dealerMappingWithDetails = await Promise.allSettled(
      (order.dealerMapping || []).map(async (dealerMapping) => {
        const dealerDetails = await fetchDealerDetails(dealerMapping.dealerId);
        return {
          ...dealerMapping,
          dealerDetails
        };
      })
    );

    // Fetch product details for each SKU
    const skuDetails = await Promise.allSettled(
      (order.skus || []).map(async (skuItem) => {
        try {
          const response = await axios.get(
            `http://product-service:5002/products/v1/get-ProductBySKU/${skuItem.sku}`,
            { timeout: 5000 }
          );

          return {
            ...skuItem,
            productDetails: response.data?.data || response.data || null
          };
        } catch (error) {
          logger.warn(`Failed to fetch product details for SKU ${skuItem.sku}:`, error.message);
          return {
            ...skuItem,
            productDetails: null
          };
        }
      })
    );

    return {
      _id: order._id,
      orderId: order.orderId,
      order_number: order.order_number,
      status: order.status,
      totalAmount: order.totalAmount,
      order_Amount: order.order_Amount,
      paymentType: order.paymentType,
      deliveryType: order.deliveryType,
      type_of_delivery: order.type_of_delivery,
      deliveryCharges: order.deliveryCharges,
      customerDetails: {
        ...order.customerDetails,
        customerInfo
      },
      dealerMapping: dealerMappingWithDetails
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value),
      skuDetails: skuDetails
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value),
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: order.invoiceUrl,
      timestamps: order.timestamps,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  } catch (e) {
    logger.warn(`Failed to fetch order details ${orderId}:`, e.message);
    return null;
  }
}

async function fetchProductDetailsForSKUs(skuList) {
  try {
    if (!skuList || skuList.length === 0) return [];

    const productDetails = await Promise.allSettled(
      skuList.map(async (skuItem) => {
        try {
          // Fetch product details from product service
          const response = await axios.get(
            `http://product-service:5002/products/v1/get-ProductBySKU/${skuItem.sku}`,
            { timeout: 5000 }
          );

          return {
            sku: skuItem.sku,
            quantity: skuItem.quantity,
            barcode: skuItem.barcode,
            productDetails: response.data.data || response.data
          };
        } catch (error) {
          logger.warn(`Failed to fetch product details for SKU ${skuItem.sku}:`, error.message);
          return {
            sku: skuItem.sku,
            quantity: skuItem.quantity,
            barcode: skuItem.barcode,
            productDetails: null,
            error: 'Failed to fetch product details'
          };
        }
      })
    );

    return productDetails
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
  } catch (e) {
    logger.warn('Failed to fetch product details for SKUs:', e.message);
    return [];
  }
}

function isPicklistOverdue(picklist) {
  if (picklist.scanStatus === 'Completed') return false;

  const createdDate = new Date(picklist.createdAt);
  const now = new Date();
  const hoursSinceCreated = (now - createdDate) / (1000 * 60 * 60);

  // Consider overdue if more than 24 hours and still not started
  // or more than 48 hours and still in progress
  if (picklist.scanStatus === 'Not Started' && hoursSinceCreated > 24) return true;
  if (picklist.scanStatus === 'In Progress' && hoursSinceCreated > 48) return true;

  return false;
}

function calculateEstimatedCompletionTime(picklist) {
  const baseTime = 30; // 30 minutes base time
  const itemTime = 5; // 5 minutes per item
  const totalItems = picklist.skuList.reduce((sum, item) => sum + item.quantity, 0);

  return baseTime + (totalItems * itemTime);
}

async function getOrSetCache(key, callback, ttl) {
  try {
    const cachedData = await cacheGet(key);

    if (cachedData !== null) {
      return cachedData;
    }

    const freshData = await callback();

    await cacheSet(key, freshData, ttl);
    return freshData;
  } catch (err) {
    console.warn(`getOrSetCache failed for key ${key}: ${err.message}`);
    return callback();
  }
}
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};
exports.createOrder = async (req, res) => {
  try {
    const orderId = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;

    const orderPayload = {
      orderId,
      ...req.body,
      orderDate: new Date(),
      type_of_delivery: req.body.type_of_delivery || "Express",
      delivery_type:
        req.body.delivery_type || req.body.type_of_delivery || "Express",
      status: "Confirmed",
      timestamps: { createdAt: new Date() },
      // ensure skus have uppercase SKU and empty dealerMapping slots
      skus: (req.body.skus || []).map((s) => ({
        sku: String(s.sku).toUpperCase().trim(),
        quantity: s.quantity,
        productId: s.productId,
        productName: s.productName,
        selling_price: s.selling_price,
        mrp: s.mrp,
        mrp_gst_amount: s.mrp_gst_amount,
        gst_percentage: s.gst_percentage,
        gst_amount: s.gst_amount,
        product_total: s.product_total,
        totalPrice: s.totalPrice,
        dealerMapped: [],
      })),
      dealerMapping: [],
    };

    const newOrder = await Order.create(orderPayload);

    const invoiceNumber = `INV-${Date.now()}`;
    const customerDetails = newOrder.customerDetails;
    const items = newOrder.skus.map((s) => ({
      productName: s.productName,
      sku: s.sku,
      unitPrice: s.selling_price,
      quantity: s.quantity,
      taxRate: `${s.gst_percentage || 0}%`,
      cgstPercent: (s.gst_percentage || 0) / 2,
      cgstAmount: (s.gst_amount || 0) / 2,
      sgstPercent: (s.gst_percentage || 0) / 2,
      sgstAmount: (s.gst_amount || 0) / 2,
      totalAmount: s.totalPrice,
    }));
    const shippingCharges = Number(req.body.deliveryCharges) || 0;
    const totalOrderAmount = Number(req.body.order_Amount) || 0;

    console.log("🧾 Generating invoice for order:", invoiceNumber, customerDetails, items, shippingCharges, totalOrderAmount);
    const invoiceResult = await generatePdfAndUploadInvoice(
      customerDetails,
      newOrder.orderId,
      formatDate(newOrder.orderDate),
      "Delhi", // Place of supply
      customerDetails.address, // Place of delivery
      items,
      shippingCharges,
      totalOrderAmount,
      invoiceNumber
    );

    newOrder.invoiceNumber = invoiceNumber;
    newOrder.invoiceUrl = invoiceResult.Location;
    await newOrder.save();

    // Log order creation audit
    // await logOrderAction({
    //   orderId: newOrder._id,
    //   action: "ORDER_CREATED",
    //   performedBy: req.body.customerDetails?.userId || "system",
    //   performedByRole: "customer",
    //   details: {
    //     orderId: newOrder.orderId,
    //     customerId: req.body.customerDetails?.userId,
    //     totalAmount: req.body.totalAmount,
    //     skuCount: req.body.skus?.length || 0,
    //     deliveryType: req.body.delivery_type || req.body.type_of_delivery,
    //     paymentType: req.body.paymentType,
    //     source: "mobile_app",
    //   },
    //   timestamp: new Date(),
    // });

    await dealerAssignmentQueue.add(
      { orderId: newOrder._id.toString() },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    if (req.body.paymentType === "COD") {
      const cart = await Cart.findOne({
        userId: req.body.customerDetails.userId,
      });
      if (!cart) {
        logger.error(
          `❌ Cart not found for user: ${req.body.customerDetails.userId}`
        );
      } else {
        cart.items = [];
        cart.totalPrice = 0;
        cart.itemTotal = 0;
        cart.handlingCharge = 0;
        cart.deliveryCharge = 0;
        cart.gst_amount = 0;
        cart.total_mrp = 0;
        cart.total_mrp_gst_amount = 0;
        cart.total_mrp_with_gst = 0;
        cart.grandTotal = 0;
        await cart.save();
        logger.info(
          `✅ Cart cleared for user: ${req.body.customerDetails.userId}`
        );
        const successData =
          await createUnicastOrMulticastNotificationUtilityFunction(
            [req.body.customerDetails.userId],
            ["INAPP", "PUSH", "EMAIL"],
            "Order Placed",
            `Order Placed Successfully with order id ${orderId}`,
            "",
            "",
            "Order",
            {
              order_id: newOrder._id,
            },
            req.headers.authorization
          );
        if (!successData.success) {
          logger.error("❌ Create notification error:", successData.message);
        } else {
          logger.info(
            "✅ Notification created successfully",
            successData.message
          );
        }

        // Send order confirmation email
        try {
          const emailResult = await sendOrderConfirmationEmail(
            req.body.customerDetails.email,
            newOrder,
            req.headers.authorization
          );
          if (emailResult.success) {
            logger.info("✅ Order confirmation email sent successfully");
          } else {
            logger.error("❌ Failed to send order confirmation email:", emailResult.message);
          }
        } catch (emailError) {
          logger.error("❌ Error sending order confirmation email:", emailError);
        }
        // Get Super-admin users for notification (using internal endpoint)
        let superAdminIds = [];
        try {
          const userData = await axios.get(
            "http://user-service:5001/api/users/internal/super-admins"
          );
          if (userData.data.success) {
            superAdminIds = userData.data.data.map((u) => u._id);
          }
        } catch (error) {
          logger.warn(
            "Failed to fetch Super-admin users for notification:",
            error.message
          );
        }

        const notify =
          await createUnicastOrMulticastNotificationUtilityFunction(
            superAdminIds,
            ["INAPP", "PUSH", "EMAIL"],
            "Order Created Alert",
            `Order Placed Successfully with order id ${orderId}`,
            "",
            "",
            "Order",
            {
              order_id: newOrder._id,
            },
            req.headers.authorization
          );
        if (!notify.success)
          logger.error("❌ Create notification error:", notify.message);
        else logger.info("✅ Notification created successfully");
      }
    }

    return sendSuccess(res, newOrder, "Order created successfully");
  } catch (error) {
    console.error("Create Order failed:", error);
    return sendError(res, error.message || "Failed to create order");
  }
};
exports.assignOrderItemsToDealers = async (req, res) => {
  try {
    const { orderId, assignments } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, "Order not found", 404);

    order.dealerMapping = assignments;
    order.status = "Assigned";
    order.timestamps.assignedAt = new Date();

    await order.save();

    // Log dealer assignment audit
    await logOrderAction({
      orderId: order._id,
      action: "DEALER_ASSIGNMENT",
      performedBy: req.user?.userId || "system",
      performedByRole: req.user?.role || "admin",
      details: {
        orderId: order.orderId,
        assignmentCount: assignments.length,
        assignments: assignments.map((a) => ({
          sku: a.sku,
          dealerId: a.dealerId,
          quantity: a.quantity,
        })),
        previousStatus: "Confirmed",
        newStatus: "Assigned",
      },
      timestamp: new Date(),
    });
    assignments.forEach(async (assignment) => {
      const successData =
        await createUnicastOrMulticastNotificationUtilityFunction(
          [assignment.dealerId],
          ["INAPP", "PUSH"],
          "New Item Assignment",
          `You have been assigned a new item with SKU: ${assignment.sku} `,
          "",
          "",
          "Order",
          {},
          req.headers.authorization
        );
      if (!successData.success) {
        logger.error("❌ Create notification error:", successData.message);
      } else {
        logger.info("✅ Notification created successfully");
      }
    });

    return sendSuccess(res, order, "Items assigned to dealers successfully");
  } catch (error) {
    logger.error("Assignment failed:", error);
    return sendError(res, "Failed to assign items to dealers");
  }
};

exports.reassignOrderItemsToDealers = async (req, res) => {
  try {
    const { orderId, assignments } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, "Order not found", 404);

    order.dealerMapping = assignments;
    order.timestamps.reassignedAt = new Date();

    await order.save();

    return sendSuccess(res, order, "Items reassigned to dealers successfully");
  } catch (error) {
    logger.error("Reassignment failed:", error);
    return sendError(res, "Failed to reassign items to dealers");
  }
};

exports.createPickup = async (req, res) => {
  try {
    const { orderId, dealerId, skuList, fulfilmentStaff } = req.body;

    const picklist = await PickList.create({
      linkedOrderId: orderId,
      dealerId,
      fulfilmentStaff,
      skuList,
      scanStatus: "Not Started",
      updatedAt: new Date(),
    });

    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [dealerId],
        ["INAPP", "PUSH"],
        "New Pickup list created",
        `New Pickup list created for order id ${orderId}`,
        "",
        "",
        "Order",
        {},
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }
    const successDataFullfillmentStaff =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [fulfilmentStaff],
        ["INAPP", "PUSH"],
        "New Pickup list assigned",
        `New Pickup list assigned for order id ${orderId}`,
        "",
        "",
        "Order",
        {},
        req.headers.authorization
      );
    if (!successDataFullfillmentStaff.success) {
      logger.error(
        "❌ Create notification error:",
        successDataFullfillmentStaff.message
      );
    } else {
      logger.info("✅ Notification created successfully");
    }

    return sendSuccess(res, picklist, "Pickup created successfully");
  } catch (error) {
    logger.error("Create pickup failed:", error);
    return sendError(res, "Failed to create pickup");
  }
};

const assignPicklistToStaff = async (req, res) => {
  try {
    const { picklistId, staffId } = req.body;

    const picklist = await PickList.findById(picklistId);
    if (!picklist) return sendError(res, "Picklist not found", 404);

    picklist.fulfilmentStaff = staffId;
    picklist.updatedAt = new Date();
    await picklist.save();
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [staffId],
        ["INAPP", "PUSH"],
        "New Pickup list assigned",
        `New Pickup list assigned with picklist id ${picklistId}`,
        "",
        "",
        "Order",
        {},
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    return sendSuccess(res, picklist, "Staff assigned to picklist");
  } catch (error) {
    logger.error("Assign staff failed:", error);
    return sendError(res, "Failed to assign staff");
  }
};

exports.assignPicklistToStaff = assignPicklistToStaff;

exports.scanSku = async (req, res) => {
  try {
    const { orderId, dealerId, staffId, sku, result, deviceInfo } = req.body;

    const scanLog = await ScanLog.create({
      scan_log_id: `${orderId}-${sku}-${Date.now()}`,
      order_id: orderId,
      dealer_id: dealerId,
      staff_id: staffId,
      sku,
      result,
      device_info: deviceInfo,
      timeStamp: new Date(),
    });

    return sendSuccess(res, scanLog, "SKU scanned successfully");
  } catch (error) {
    logger.error("Scan failed:", error);
    return sendError(res, "Failed to log scan");
  }
};

exports.UpdateOrderForDealer = async (req, res) => {
  try {
    const { orderId, dealerId, updates } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, "Order not found", 404);

    order.dealerMapping = order.dealerMapping.map((item) =>
      item.sku === updates.sku ? { ...item, ...updates } : item
    );

    await order.save();

    return sendSuccess(res, order, "Dealer-specific order updated");
  } catch (error) {
    logger.error("Update dealer order failed:", error);
    return sendError(res, "Failed to update dealer order");
  }
};

exports.shipOrder = async (req, res) => {
  try {
    const { orderId, trackingInfo } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, "Order not found", 404);

    order.status = "Shipped";
    order.trackingInfo = trackingInfo;
    order.timestamps.shippedAt = new Date();

    await order.save();

    return sendSuccess(res, order, "Order marked as shipped");
  } catch (error) {
    logger.error("Ship order failed:", error);
    return sendError(res, "Failed to mark order as shipped");
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().lean();

    for (let order of orders) {
      order.customerDetails.userInfo = await fetchUser(
        order.customerDetails.userId
      );
      order.dealerMapping = await Promise.all(
        order.dealerMapping.map(async (m) => ({
          ...m,
          dealerInfo: await fetchDealer(m.dealerId),
        }))
      );
    }

    return sendSuccess(res, orders, "Orders fetched");
  } catch (err) {
    return sendError(res, "Failed to get orders", 500);
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return sendError(res, "Order not found", 404);

    order.customerDetails.userInfo = await fetchUser(
      order.customerDetails.userId
    );
    order.dealerMapping = await Promise.all(
      order.dealerMapping.map(async (m) => ({
        ...m,
        dealerInfo: await fetchDealer(m.dealerId),
      }))
    );

    return sendSuccess(res, order, "Order details fetched");
  } catch (err) {
    return sendError(res, "Failed to get order", 500);
  }
};

exports.getPickList = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, dealerId, fulfilmentStaff } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.scanStatus = status;
    if (dealerId) filter.dealerId = dealerId;
    if (fulfilmentStaff) filter.fulfilmentStaff = fulfilmentStaff;

    // Get picklists with pagination
    const picklists = await PickList.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await PickList.countDocuments(filter);

    // Enhanced data population from multiple services
    const enhancedPicklists = await Promise.all(
      picklists.map(async (picklist) => {
        try {
          // Fetch data from multiple services in parallel
          const [dealerInfo, staffInfo, orderInfo, productDetails] = await Promise.allSettled([
            // User Service - Dealer details (enhanced)
            fetchDealerDetails(picklist.dealerId),
            // User Service - Fulfilment staff details (enhanced)
            picklist.fulfilmentStaff ? fetchStaffDetails(picklist.fulfilmentStaff) : null,
            // Order Service - Linked order details (enhanced with dealer and product details)
            picklist.linkedOrderId ? fetchOrderDetails(picklist.linkedOrderId) : null,
            // Product Service - SKU details for each item
            fetchProductDetailsForSKUs(picklist.skuList)
          ]);

          return {
            ...picklist,
            // Dealer information from user service
            dealerInfo: dealerInfo.status === 'fulfilled' ? dealerInfo.value : null,
            // Staff information from user service
            staffInfo: staffInfo.status === 'fulfilled' ? staffInfo.value : null,
            // Order information from order service
            orderInfo: orderInfo.status === 'fulfilled' ? orderInfo.value : null,
            // Product details from product service
            skuDetails: productDetails.status === 'fulfilled' ? productDetails.value : [],
            // Additional computed fields
            totalItems: picklist.skuList.reduce((sum, item) => sum + item.quantity, 0),
            uniqueSKUs: picklist.skuList.length,
            // Status indicators
            isOverdue: isPicklistOverdue(picklist),
            estimatedCompletionTime: calculateEstimatedCompletionTime(picklist)
          };
        } catch (error) {
          logger.error(`Error enhancing picklist ${picklist._id}:`, error);
          return {
            ...picklist,
            dealerInfo: null,
            staffInfo: null,
            orderInfo: null,
            skuDetails: [],
            error: 'Failed to fetch additional details'
          };
        }
      })
    );

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPreviousPage: page > 1
    };

    return sendSuccess(res, {
      data: enhancedPicklists,
      pagination,
      summary: {
        totalPicklists: totalCount,
        completedPicklists: enhancedPicklists.filter(p => p.scanStatus === 'Completed').length,
        inProgressPicklists: enhancedPicklists.filter(p => p.scanStatus === 'In Progress').length,
        notStartedPicklists: enhancedPicklists.filter(p => p.scanStatus === 'Not Started').length,
        overduePicklists: enhancedPicklists.filter(p => p.isOverdue).length
      }
    }, "Enhanced picklists fetched successfully");
  } catch (err) {
    logger.error("Error fetching picklists:", err);
    return sendError(res, "Failed to get picklists", 500);
  }
};

exports.getPickListByDealer = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { dealerId };
    if (status) filter.scanStatus = status;

    // Get picklists with pagination
    const picklists = await PickList.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalCount = await PickList.countDocuments(filter);

    // Fetch dealer info once (enhanced)
    const dealerInfo = await fetchDealerDetails(dealerId);

    // Enhanced data population from multiple services
    const enhancedPicklists = await Promise.all(
      picklists.map(async (picklist) => {
        try {
          // Fetch data from multiple services in parallel
          const [staffInfo, orderInfo, productDetails] = await Promise.allSettled([
            // User Service - Fulfilment staff details (enhanced)
            picklist.fulfilmentStaff ? fetchStaffDetails(picklist.fulfilmentStaff) : null,
            // Order Service - Linked order details (enhanced with dealer and product details)
            picklist.linkedOrderId ? fetchOrderDetails(picklist.linkedOrderId) : null,
            // Product Service - SKU details for each item
            fetchProductDetailsForSKUs(picklist.skuList)
          ]);

          return {
            ...picklist,
            // Dealer information (already fetched)
            dealerInfo,
            // Staff information from user service
            staffInfo: staffInfo.status === 'fulfilled' ? staffInfo.value : null,
            // Order information from order service
            orderInfo: orderInfo.status === 'fulfilled' ? orderInfo.value : null,
            // Product details from product service
            skuDetails: productDetails.status === 'fulfilled' ? productDetails.value : [],
            // Additional computed fields
            totalItems: picklist.skuList.reduce((sum, item) => sum + item.quantity, 0),
            uniqueSKUs: picklist.skuList.length,
            // Status indicators
            isOverdue: isPicklistOverdue(picklist),
            estimatedCompletionTime: calculateEstimatedCompletionTime(picklist)
          };
        } catch (error) {
          logger.error(`Error enhancing picklist ${picklist._id}:`, error);
          return {
            ...picklist,
            dealerInfo,
            staffInfo: null,
            orderInfo: null,
            skuDetails: [],
            error: 'Failed to fetch additional details'
          };
        }
      })
    );

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPreviousPage: page > 1
    };

    return sendSuccess(res, {
      data: enhancedPicklists,
      pagination,
      dealerInfo,
      summary: {
        totalPicklists: totalCount,
        completedPicklists: enhancedPicklists.filter(p => p.scanStatus === 'Completed').length,
        inProgressPicklists: enhancedPicklists.filter(p => p.scanStatus === 'In Progress').length,
        notStartedPicklists: enhancedPicklists.filter(p => p.scanStatus === 'Not Started').length,
        overduePicklists: enhancedPicklists.filter(p => p.isOverdue).length
      }
    }, "Enhanced dealer picklists fetched successfully");
  } catch (err) {
    logger.error("Error fetching dealer picklists:", err);
    return sendError(res, "Failed to get picklists for dealer", 500);
  }
};

// Get comprehensive picklist details by ID
exports.getPickListById = async (req, res) => {
  try {
    const { id } = req.params;

    const picklist = await PickList.findById(id).lean();
    if (!picklist) {
      return sendError(res, "Picklist not found", 404);
    }

    // Fetch comprehensive data from all services
    const [dealerInfo, staffInfo, orderInfo, productDetails] = await Promise.allSettled([
      fetchDealerDetails(picklist.dealerId),
      picklist.fulfilmentStaff ? fetchStaffDetails(picklist.fulfilmentStaff) : null,
      picklist.linkedOrderId ? fetchOrderDetails(picklist.linkedOrderId) : null,
      fetchProductDetailsForSKUs(picklist.skuList)
    ]);

    const enhancedPicklist = {
      ...picklist,
      dealerInfo: dealerInfo.status === 'fulfilled' ? dealerInfo.value : null,
      staffInfo: staffInfo.status === 'fulfilled' ? staffInfo.value : null,
      orderInfo: orderInfo.status === 'fulfilled' ? orderInfo.value : null,
      skuDetails: productDetails.status === 'fulfilled' ? productDetails.value : [],
      totalItems: picklist.skuList.reduce((sum, item) => sum + item.quantity, 0),
      uniqueSKUs: picklist.skuList.length,
      isOverdue: isPicklistOverdue(picklist),
      estimatedCompletionTime: calculateEstimatedCompletionTime(picklist)
    };

    return sendSuccess(res, enhancedPicklist, "Picklist details fetched successfully");
  } catch (err) {
    logger.error("Error fetching picklist details:", err);
    return sendError(res, "Failed to get picklist details", 500);
  }
};

// Get picklist statistics
exports.getPickListStatistics = async (req, res) => {
  try {
    const { startDate, endDate, dealerId } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Add dealer filter if provided
    if (dealerId) {
      dateFilter.dealerId = dealerId;
    }

    // Get basic statistics
    const totalPicklists = await PickList.countDocuments(dateFilter);
    const completedPicklists = await PickList.countDocuments({ ...dateFilter, scanStatus: 'Completed' });
    const inProgressPicklists = await PickList.countDocuments({ ...dateFilter, scanStatus: 'In Progress' });
    const notStartedPicklists = await PickList.countDocuments({ ...dateFilter, scanStatus: 'Not Started' });

    // Get overdue picklists
    const allPicklists = await PickList.find(dateFilter).lean();
    const overduePicklists = allPicklists.filter(picklist => isPicklistOverdue(picklist)).length;

    // Get statistics by dealer
    const dealerStats = await PickList.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$dealerId',
          totalPicklists: { $sum: 1 },
          completedPicklists: {
            $sum: { $cond: [{ $eq: ['$scanStatus', 'Completed'] }, 1, 0] }
          },
          inProgressPicklists: {
            $sum: { $cond: [{ $eq: ['$scanStatus', 'In Progress'] }, 1, 0] }
          },
          notStartedPicklists: {
            $sum: { $cond: [{ $eq: ['$scanStatus', 'Not Started'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalPicklists: -1 } },
      { $limit: 10 }
    ]);

    // Enhance dealer stats with dealer details
    const enhancedDealerStats = await Promise.all(
      dealerStats.map(async (stat) => {
        const dealerDetails = await fetchDealerDetails(stat._id);
        return {
          ...stat,
          dealerDetails
        };
      })
    );

    // Get statistics by staff
    const staffStats = await PickList.aggregate([
      { $match: { ...dateFilter, fulfilmentStaff: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$fulfilmentStaff',
          totalPicklists: { $sum: 1 },
          completedPicklists: {
            $sum: { $cond: [{ $eq: ['$scanStatus', 'Completed'] }, 1, 0] }
          },
          inProgressPicklists: {
            $sum: { $cond: [{ $eq: ['$scanStatus', 'In Progress'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalPicklists: -1 } },
      { $limit: 10 }
    ]);

    // Enhance staff stats with staff details
    const enhancedStaffStats = await Promise.all(
      staffStats.map(async (stat) => {
        const staffDetails = await fetchStaffDetails(stat._id);
        return {
          ...stat,
          staffDetails
        };
      })
    );

    const statistics = {
      overview: {
        totalPicklists,
        completedPicklists,
        inProgressPicklists,
        notStartedPicklists,
        overduePicklists,
        completionRate: totalPicklists > 0 ? ((completedPicklists / totalPicklists) * 100).toFixed(2) + '%' : '0%',
        overdueRate: totalPicklists > 0 ? ((overduePicklists / totalPicklists) * 100).toFixed(2) + '%' : '0%'
      },
      byDealer: enhancedDealerStats,
      byStaff: enhancedStaffStats,
      recentActivity: {
        last7Days: await PickList.countDocuments({
          ...dateFilter,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        last30Days: await PickList.countDocuments({
          ...dateFilter,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      }
    };

    return sendSuccess(res, statistics, "Picklist statistics fetched successfully");
  } catch (err) {
    logger.error("Error fetching picklist statistics:", err);
    return sendError(res, "Failed to get picklist statistics", 500);
  }
};

exports.getScanLogs = async (req, res) => {
  try {
    const logs = await ScanLog.find().lean();

    for (let log of logs) {
      log.staffInfo = await fetchUser(log.staff_id);
      log.dealerInfo = await fetchDealer(log.dealer_id);
    }

    return sendSuccess(res, logs, "Scan logs fetched");
  } catch (err) {
    return sendError(res, "Failed to get scan logs", 500);
  }
};

exports.getScanLogsByDealer = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const logs = await ScanLog.find({ dealer_id: dealerId }).lean();
    const dealerInfo = await fetchDealer(dealerId);

    for (let log of logs) {
      log.dealerInfo = dealerInfo;
      log.staffInfo = await fetchUser(log.staff_id);
    }

    return sendSuccess(res, logs, "Dealer scan logs fetched");
  } catch (err) {
    return sendError(res, "Failed to get scan logs for dealer", 500);
  }
};

exports.getOrderByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({
      "customerDetails.userId": userId,
    })
      .populate("skus.return_info.return_id")
      .lean();
    const userInfo = await fetchUser(userId);

    for (let order of orders) {
      order.customerDetails.userInfo = userInfo;
      order.dealerMapping = await Promise.all(
        order.dealerMapping.map(async (m) => ({
          ...m,
          dealerInfo: await fetchDealer(m.dealerId),
        }))
      );
    }

    return sendSuccess(res, orders, "Orders for user fetched");
  } catch (err) {
    return sendError(res, "Failed to get orders by user", 500);
  }
};

exports.markAsPacked = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { skus } = req.body; // Optional: specific SKUs to mark as packed
    const packedAt = new Date();

    // First, get the current order to check SLA
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return sendError(res, "Order not found", 404);
    }

    let updatedOrder = currentOrder;

    // If specific SKUs are provided, mark only those as packed
    if (skus && Array.isArray(skus) && skus.length > 0) {
      for (const sku of skus) {
        updatedOrder = await updateSkuStatus(orderId, sku, "Packed", {
          timestamps: {
            packedAt: packedAt,
          },
        });
      }
    } else {
      // Mark all SKUs as packed (legacy behavior)
      for (const sku of currentOrder.skus) {
        updatedOrder = await updateSkuStatus(orderId, sku.sku, "Packed", {
          timestamps: {
            packedAt: packedAt,
          },
        });
      }
    }

    // Check for SLA violation after marking as packed
    const slaCheck = await checkSLAViolationOnPacking(updatedOrder, packedAt);

    let responseData = {
      order: updatedOrder,
      message: "Order SKUs marked as packed successfully",
    };

    // If SLA violation detected, record it
    if (slaCheck.hasViolation && slaCheck.violation) {
      try {
        // Record the violation in SLA violations table
        const violationRecord = await recordSLAViolation(slaCheck.violation);

        // Update order with SLA violation information
        await updateOrderWithSLAViolation(orderId, slaCheck.violation);

        logger.info(
          `SLA violation recorded for order ${orderId}: ${slaCheck.violation.violation_minutes} minutes`
        );

        responseData.slaViolation = violationRecord;
        responseData.message += `. SLA violation detected: ${slaCheck.violation.violation_minutes} minutes late.`;
      } catch (violationError) {
        logger.error("Failed to record SLA violation:", violationError);
        responseData.warning =
          "Order packed successfully but failed to record SLA violation";
      }
    }

    return sendSuccess(res, responseData, responseData.message);
  } catch (error) {
    logger.error("Mark as packed failed:", error);
    return sendError(res, "Failed to mark order as packed");
  }
};

exports.markAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { skus, deliveryProof } = req.body; // Optional: specific SKUs to mark as delivered

    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return sendError(res, "Order not found", 404);
    }

    let updatedOrder = currentOrder;

    // If specific SKUs are provided, mark only those as delivered
    if (skus && Array.isArray(skus) && skus.length > 0) {
      for (const sku of skus) {
        updatedOrder = await updateSkuStatus(orderId, sku, "Delivered", {
          timestamps: {
            deliveredAt: new Date(),
          },
          borzoData: {
            borzo_tracking_status: "Delivered",
            borzo_event_type: "delivered",
          },
        });
      }
    } else {
      // Mark all SKUs as delivered (legacy behavior)
      for (const sku of currentOrder.skus) {
        updatedOrder = await updateSkuStatus(orderId, sku.sku, "Delivered", {
          timestamps: {
            deliveredAt: new Date(),
          },
          borzoData: {
            borzo_tracking_status: "Delivered",
            borzo_event_type: "delivered",
          },
        });
      }
    }

    // Update delivery proof if provided
    if (deliveryProof) {
      updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { deliveryProof },
        { new: true }
      );
    }

    // Calculate SLA compliance if order is fully delivered
    if (
      updatedOrder.status === "Delivered" &&
      updatedOrder.slaInfo?.expectedFulfillmentTime
    ) {
      const violationMinutes = Math.round(
        (new Date() - updatedOrder.slaInfo.expectedFulfillmentTime) /
        (1000 * 60)
      );

      updatedOrder.slaInfo.isSLAMet = violationMinutes <= 0;
      updatedOrder.slaInfo.violationMinutes = Math.max(0, violationMinutes);
      await updatedOrder.save();
    }

    return sendSuccess(
      res,
      updatedOrder,
      "Order SKUs marked as delivered successfully"
    );
  } catch (error) {
    logger.error("Mark as delivered failed:", error);
    return sendError(res, "Failed to mark order as delivered");
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "Cancelled",
        auditLogs: {
          action: "CANCELLED",
          actorId: req.user._id,
          role: req.user.role,
          timestamp: new Date(),
          reason,
        },
      },
      { new: true }
    );

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    // Add any cancellation logic here (refunds, inventory return, etc.)

    return sendSuccess(res, order, "Order cancelled successfully");
  } catch (error) {
    logger.error("Cancel order failed:", error);
    return sendError(res, "Failed to cancel order");
  }
};

exports.batchAssignOrders = async (req, res) => {
  try {
    const { assignments } = req.body; // Array of { orderId, assignments }

    const results = await Promise.all(
      assignments.map(async ({ orderId, assignments }) => {
        try {
          const order = await Order.findByIdAndUpdate(
            orderId,
            {
              dealerMapping: assignments,
              status: "Assigned",
              "timestamps.assignedAt": new Date(),
            },
            { new: true }
          );
          return { orderId, success: true, order };
        } catch (error) {
          return { orderId, success: false, error: error.message };
        }
      })
    );

    return sendSuccess(res, results, "Batch assignment completed");
  } catch (error) {
    logger.error("Batch assign failed:", error);
    return sendError(res, "Failed to batch assign orders");
  }
};

exports.batchUpdateStatus = async (req, res) => {
  try {
    const { updates } = req.body;

    const results = await Promise.all(
      updates.map(async ({ orderId, status }) => {
        try {
          const updateData = { status };
          let slaViolation = null;

          if (status === "Packed") {
            const packedAt = new Date();
            updateData["timestamps.packedAt"] = packedAt;

            // Check for SLA violation when marking as packed
            const currentOrder = await Order.findById(orderId);
            if (currentOrder) {
              const slaCheck = await checkSLAViolationOnPacking(
                currentOrder,
                packedAt
              );
              if (slaCheck.hasViolation && slaCheck.violation) {
                try {
                  slaViolation = await recordSLAViolation(slaCheck.violation);
                  await updateOrderWithSLAViolation(
                    orderId,
                    slaCheck.violation
                  );
                  logger.info(
                    `SLA violation recorded for order ${orderId}: ${slaCheck.violation.violation_minutes} minutes`
                  );
                } catch (violationError) {
                  logger.error(
                    `Failed to record SLA violation for order ${orderId}:`,
                    violationError
                  );
                }
              }
            }
          }
          if (status === "Shipped")
            updateData["timestamps.shippedAt"] = new Date();
          if (status === "Delivered") {
            updateData["timestamps.deliveredAt"] = new Date();
            updateData["slaInfo.actualFulfillmentTime"] = new Date();
          }

          const order = await Order.findByIdAndUpdate(orderId, updateData, {
            new: true,
          });

          // Log status update audit
          await logOrderAction({
            orderId: order._id,
            action: "STATUS_UPDATE",
            performedBy: req.user?.userId || "system",
            performedByRole: req.user?.role || "admin",
            details: {
              orderId: order.orderId,
              previousStatus: order.status,
              newStatus: status,
              updateType: "batch_update",
              slaViolation: slaViolation
                ? {
                  violationMinutes: slaViolation.violation_minutes,
                  message: `SLA violation detected: ${slaViolation.violation_minutes} minutes late`,
                }
                : null,
            },
            timestamp: new Date(),
          });

          return {
            orderId,
            success: true,
            order,
            slaViolation: slaViolation
              ? {
                violationMinutes: slaViolation.violation_minutes,
                message: `SLA violation detected: ${slaViolation.violation_minutes} minutes late`,
              }
              : null,
          };
        } catch (error) {
          return { orderId, success: false, error: error.message };
        }
      })
    );

    return sendSuccess(res, results, "Batch status update completed");
  } catch (error) {
    logger.error("Batch status update failed:", error);
    return sendError(res, "Failed to batch update order statuses");
  }
};

exports.getFulfillmentMetrics = async (req, res) => {
  try {
    const { startDate, endDate, includeDealerInfo = false } = req.query;
    const authorizationHeader = req.headers.authorization;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    // Base aggregation pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          avgFulfillmentTime: {
            $avg: {
              $subtract: [
                { $ifNull: ["$timestamps.deliveredAt", new Date()] },
                "$timestamps.createdAt",
              ],
            },
          },
          statusCounts: {
            $push: {
              status: "$status",
              count: 1,
            },
          },
          dealerIds: {
            $addToSet: "$dealerMapping.dealerId",
          },
        },
      },
      {
        $project: {
          totalOrders: 1,
          avgFulfillmentTime: 1,
          statusDistribution: {
            $arrayToObject: {
              $map: {
                input: "$statusCounts",
                as: "status",
                in: {
                  k: "$$status.status",
                  v: "$$status.count",
                },
              },
            },
          },
          dealerIds: 1,
        },
      },
    ];

    const metrics = await Order.aggregate(pipeline);
    const result = metrics[0] || {};

    // If dealer info is requested, fetch it
    if (
      includeDealerInfo === "true" &&
      result.dealerIds &&
      result.dealerIds.length > 0
    ) {
      const validDealerIds = result.dealerIds.filter((id) => id != null);
      if (validDealerIds.length > 0) {
        const dealersInfo = await fetchMultipleDealersInfo(
          validDealerIds,
          authorizationHeader
        );
        result.dealersInfo = dealersInfo;
      }
    }

    // Remove dealerIds from response if not needed
    if (includeDealerInfo !== "true") {
      delete result.dealerIds;
    }

    return sendSuccess(res, result, "Fulfillment metrics fetched");
  } catch (error) {
    logger.error("Get fulfillment metrics failed:", error);
    return sendError(res, "Failed to get fulfillment metrics");
  }
};

exports.getSLAComplianceReport = async (req, res) => {
  try {
    const {
      dealerId,
      startDate,
      endDate,
      includeDealerInfo = false,
      includeUserInfo = false,
    } = req.query;
    const authorizationHeader = req.headers.authorization;

    const matchStage = {
      "slaInfo.expectedFulfillmentTime": { $exists: true },
      "slaInfo.actualFulfillmentTime": { $exists: true },
    };

    if (dealerId) matchStage["dealerMapping.dealerId"] = dealerId;
    if (startDate || endDate) {
      matchStage["timestamps.createdAt"] = {};
      if (startDate)
        matchStage["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) matchStage["timestamps.createdAt"].$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: dealerId ? null : "$dealerMapping.dealerId",
          totalOrders: { $sum: 1 },
          metSLA: {
            $sum: {
              $cond: [{ $eq: ["$slaInfo.isSLAMet", true] }, 1, 0],
            },
          },
          avgViolationMinutes: {
            $avg: "$slaInfo.violationMinutes",
          },
          maxViolationMinutes: {
            $max: "$slaInfo.violationMinutes",
          },
          customerIds: {
            $addToSet: "$customerDetails.userId",
          },
        },
      },
      {
        $project: {
          dealerId: dealerId ? dealerId : "$_id",
          totalOrders: 1,
          slaComplianceRate: {
            $divide: ["$metSLA", "$totalOrders"],
          },
          avgViolationMinutes: 1,
          maxViolationMinutes: 1,
          customerIds: 1,
        },
      },
    ];

    const report = await Order.aggregate(pipeline);
    let result = report;

    // If dealer info is requested and we have dealer IDs
    if (includeDealerInfo === "true") {
      const dealerIds = result
        .map((item) => item.dealerId)
        .filter((id) => id != null);

      if (dealerIds.length > 0) {
        const dealersInfo = await fetchMultipleDealersInfo(
          dealerIds,
          authorizationHeader
        );

        // Map dealer info to results
        result = result.map((item) => {
          const dealerInfo = dealersInfo.find(
            (dealer) => dealer._id === item.dealerId
          );
          return {
            ...item,
            dealerInfo: dealerInfo || null,
          };
        });
      }
    }

    // If user info is requested and we have customer IDs
    if (includeUserInfo === "true") {
      const allCustomerIds = result
        .flatMap((item) => item.customerIds || [])
        .filter((id) => id != null);

      if (allCustomerIds.length > 0) {
        const uniqueCustomerIds = [...new Set(allCustomerIds)];
        const usersInfo = await Promise.all(
          uniqueCustomerIds.map((userId) =>
            fetchUserInfo(userId, authorizationHeader)
          )
        );

        // Map user info to results
        result = result.map((item) => {
          const customerInfos = (item.customerIds || [])
            .map((userId) => usersInfo.find((user) => user?._id === userId))
            .filter(Boolean);

          return {
            ...item,
            customerInfos: customerInfos,
          };
        });
      }
    }

    // Clean up customerIds if not needed
    if (includeUserInfo !== "true") {
      result = result.map((item) => {
        const { customerIds, ...rest } = item;
        return rest;
      });
    }

    return sendSuccess(res, result, "SLA compliance report fetched");
  } catch (error) {
    logger.error("Get SLA compliance report failed:", error);
    return sendError(res, "Failed to get SLA compliance report");
  }
};

exports.getDealerPerformance = async (req, res) => {
  try {
    const { dealerId, startDate, endDate, includeUserInfo = false } = req.query;
    const authorizationHeader = req.headers.authorization;

    const matchStage = { "dealerMapping.dealerId": dealerId };
    if (startDate || endDate) {
      matchStage["timestamps.createdAt"] = {};
      if (startDate)
        matchStage["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) matchStage["timestamps.createdAt"].$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: "$dealerMapping" },
      { $match: { "dealerMapping.dealerId": dealerId } },
      {
        $group: {
          _id: "$dealerMapping.dealerId",
          totalOrders: { $sum: 1 },
          avgProcessingTime: {
            $avg: {
              $subtract: [
                { $ifNull: ["$timestamps.shippedAt", new Date()] },
                "$timestamps.assignedAt",
              ],
            },
          },
          statusCounts: {
            $push: {
              status: "$status",
              count: 1,
            },
          },
          customerIds: {
            $addToSet: "$customerDetails.userId",
          },
          totalRevenue: {
            $sum: "$grandTotal",
          },
          avgOrderValue: {
            $avg: "$grandTotal",
          },
        },
      },
      {
        $lookup: {
          from: "dealers",
          localField: "_id",
          foreignField: "_id",
          as: "dealerInfo",
        },
      },
      { $unwind: "$dealerInfo" },
      {
        $project: {
          dealerId: "$_id",
          dealerName: "$dealerInfo.name",
          dealerEmail: "$dealerInfo.email",
          dealerPhone: "$dealerInfo.phone",
          dealerAddress: "$dealerInfo.address",
          totalOrders: 1,
          totalRevenue: 1,
          avgOrderValue: 1,
          avgProcessingTime: 1,
          statusDistribution: {
            $arrayToObject: {
              $map: {
                input: "$statusCounts",
                as: "status",
                in: {
                  k: "$$status.status",
                  v: "$$status.count",
                },
              },
            },
          },
          customerIds: 1,
        },
      },
    ];

    const performance = await Order.aggregate(pipeline);
    let result = performance[0] || {};

    // If user info is requested and we have customer IDs
    if (
      includeUserInfo === "true" &&
      result.customerIds &&
      result.customerIds.length > 0
    ) {
      const validCustomerIds = result.customerIds.filter((id) => id != null);
      if (validCustomerIds.length > 0) {
        const usersInfo = await Promise.all(
          validCustomerIds.map((userId) =>
            fetchUserInfo(userId, authorizationHeader)
          )
        );

        result.customerInfos = usersInfo.filter(Boolean);
      }
    }

    // Clean up customerIds if not needed
    if (includeUserInfo !== "true") {
      delete result.customerIds;
    }

    return sendSuccess(res, result, "Dealer performance fetched");
  } catch (error) {
    logger.error("Get dealer performance failed:", error);
    return sendError(res, "Failed to get dealer performance");
  }
};

exports.getTotalNumberOfOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    return sendSuccess(res, { totalOrders }, "Total number of orders fetched");
  } catch (error) {
    logger.error("Get total orders failed:", error);
    return sendError(res, "Failed to get total number of orders");
  }
};

exports.getTotalOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    const matchStage = {};
    if (status) matchStage.status = status;

    const totalOrders = await Order.countDocuments(matchStage);
    return sendSuccess(res, { totalOrders }, "Total orders by status fetched");
  } catch (error) {
    logger.error("Get total orders by status failed:", error);
    return sendError(res, "Failed to get total orders by status");
  }
};
exports.getOrderStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      includeDealerInfo = false,
      includeUserInfo = false,
    } = req.query;
    const authorizationHeader = req.headers.authorization;

    // Default to today if no dates provided
    let queryStartDate, queryEndDate;

    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
      // Set end date to end of day
      queryEndDate.setHours(23, 59, 59, 999);
    } else {
      // Default to today
      const today = new Date();
      queryStartDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      queryEndDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );
    }

    // Build the date filter
    const dateFilter = {
      createdAt: {
        $gte: queryStartDate,
        $lte: queryEndDate,
      },
    };

    // Get total orders for the period
    const totalOrders = await Order.countDocuments(dateFilter);

    // Get orders by status
    const packedOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Packed",
    });

    const shippedOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Shipped",
    });

    const cancelledOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Cancelled",
    });

    const returnedOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Returned",
    });

    // Get orders by other common statuses
    const pendingOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Pending",
    });

    const confirmedOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Confirmed",
    });

    const assignedOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Assigned",
    });

    const deliveredOrders = await Order.countDocuments({
      ...dateFilter,
      status: "Delivered",
    });

    // Calculate total revenue and get dealer/customer info
    const revenueData = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          averageOrderValue: { $avg: "$grandTotal" },
          dealerIds: { $addToSet: "$dealerMapping.dealerId" },
          customerIds: { $addToSet: "$customerDetails.userId" },
        },
      },
    ]);

    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue || 0 : 0;
    const averageOrderValue =
      revenueData.length > 0 ? revenueData[0].averageOrderValue || 0 : 0;

    // Get recent orders (last 10) with more details
    const recentOrders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "orderId status grandTotal createdAt customerDetails dealerMapping"
      );

    // Get status distribution for chart
    const statusDistribution = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const stats = {
      period: {
        startDate: queryStartDate,
        endDate: queryEndDate,
        isToday: !startDate && !endDate,
      },
      summary: {
        totalOrders: totalOrders || 0,
        totalRevenue: parseFloat((totalRevenue || 0).toFixed(2)),
        averageOrderValue: parseFloat((averageOrderValue || 0).toFixed(2)),
      },
      byStatus: {
        pending: pendingOrders || 0,
        confirmed: confirmedOrders || 0,
        assigned: assignedOrders || 0,
        packed: packedOrders || 0,
        shipped: shippedOrders || 0,
        delivered: deliveredOrders || 0,
        cancelled: cancelledOrders || 0,
        returned: returnedOrders || 0,
      },
      statusDistribution,
      recentOrders: (recentOrders || []).map((order) => ({
        orderId: order.orderId || "",
        status: order.status || "",
        grandTotal: order.grandTotal || 0,
        createdAt: order.createdAt || new Date(),
        customerName: order.customerDetails?.name || "",
        customerId: order.customerDetails?.userId || "",
        dealerIds: order.dealerMapping?.map((d) => d.dealerId) || [],
      })),
    };

    // If dealer info is requested
    if (includeDealerInfo === "true" && revenueData.length > 0) {
      const dealerIds =
        revenueData[0].dealerIds?.filter((id) => id != null) || [];
      if (dealerIds.length > 0) {
        const dealersInfo = await fetchMultipleDealersInfo(
          dealerIds,
          authorizationHeader
        );
        stats.dealersInfo = dealersInfo;
      }
    }

    // If user info is requested
    if (includeUserInfo === "true" && revenueData.length > 0) {
      const customerIds =
        revenueData[0].customerIds?.filter((id) => id != null) || [];
      if (customerIds.length > 0) {
        const usersInfo = await Promise.all(
          customerIds.map((userId) =>
            fetchUserInfo(userId, authorizationHeader)
          )
        );
        stats.customersInfo = usersInfo.filter(Boolean);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error getting order stats:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.createReturnRequest = async (req, res) => { };

//Online Payment-logic

// exports.createRazorPayOrder = async (req, res) => {
//   const { orderData } = req.body;

//   const razorpayOrder = await razorpay.orders.create({
//     amount: orderData.totalAmount * 100,
//     currency: "INR",
//     receipt: `receipt_${Date.now()}`,
//     notes: {
//       userId: orderData.customerDetails.userId,
//       name: orderData.customerDetails.name,
//       email: orderData.customerDetails.email,
//       phone: orderData.customerDetails.phone,
//       address: orderData.customerDetails.address,
//       skus: JSON.stringify(orderData.skus), // must be stringified
//       orderType: orderData.orderType,
//       orderSource: orderData.orderSource,
//       deliveryCharges: orderData.deliveryCharges,
//       totalAmount: orderData.totalAmount,
//     },
//   });

//   res.json(razorpayOrder); // Send this to frontend
// };

// exports.RazorpayWebhook = async (req, res) => {
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//   const signature = req.headers["x-razorpay-signature"];
//   const body = req.body;
//   const expected = crypto
//     .createHmac("sha256", secret)
//     .update(JSON.stringify(body))
//     .digest("hex");

//   if (expected !== signature) return res.status(400).send("Invalid signature");

//   const payment = body.payload.payment.entity;

//   if (body.event === "payment.captured") {
//     const notes = payment.notes;

//     // 1. Create Order
//     const order = new Order({
//       orderId: `ORD_${Date.now()}`,
//       orderDate: new Date(),
//       deliveryCharges: Number(notes.deliveryCharges),
//       totalAmount: Number(notes.totalAmount),
//       orderType: notes.orderType,
//       orderSource: notes.orderSource,
//       skus: JSON.parse(notes.skus),
//       customerDetails: {
//         userId: notes.userId,
//         name: notes.name,
//         phone: notes.phone,
//         address: notes.address,
//         email: notes.email,
//         pincode: "", // Add pincode if needed
//       },
//       paymentType: "Prepaid",
//       status: "Confirmed",
//     });

//     await order.save();

//     // 2. Create Payment
//     await new Payment({
//       order_id: order._id,
//       payment_id: payment.id,
//       payment_method: payment.method,
//       payment_status: payment.status,
//       amount: payment.amount / 100,
//       created_at: new Date(payment.created_at * 1000),
//     }).save();

//     return res.status(200).send("Order & Payment recorded");
//   }

//   res.status(200).send("Webhook handled");
// };

//Generate Reports For Order

exports.generateOrderReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      paymentType,
      orderSource,
      orderType,
      isSLAMet,
      exportType = "json", // or 'csv'
    } = req.query;

    const filter = {};

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (paymentType) filter.paymentType = paymentType;
    if (orderSource) filter.orderSource = orderSource;
    if (orderType) filter.orderType = orderType;
    if (isSLAMet !== undefined)
      filter["slaInfo.isSLAMet"] = isSLAMet === "true";

    const orders = await Order.find(filter).lean();

    // Optional: Add summary KPIs
    const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const orderCount = orders.length;
    const avgOrderValue = orderCount ? totalSales / orderCount : 0;

    if (exportType === "csv") {
      const fields = [
        "orderId",
        "orderDate",
        "status",
        "paymentType",
        "orderType",
        "orderSource",
        "totalAmount",
        "deliveryCharges",
        "customerDetails.name",
        "customerDetails.email",
        "customerDetails.phone",
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(orders);

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=order-report.csv"
      );
      res.setHeader("Content-Type", "text/csv");
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      summary: {
        orderCount,
        totalSales,
        avgOrderValue,
      },
      data: orders,
    });
  } catch (err) {
    console.error("Report generation failed", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate report" });
  }
};

exports.markDealerPackedAndUpdateOrderStatus = async (req, res) => {
  try {
    const { orderId, dealerId, total_weight_kg } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    let dealerFound = false;

    order.dealerMapping = order.dealerMapping.map((mapping) => {
      if (mapping.dealerId.toString() === dealerId) {
        dealerFound = true;
        return { ...mapping.toObject(), status: "Packed" };
      }
      return mapping;
    });



    const allPacked = order.dealerMapping.every(
      (mapping) => mapping.status === "Packed"
    );

    // Visibility logs for Borzo creation criteria
    console.log(
      `[BORZO] Dealer packed update: orderId=${order.orderId}, dealerId=${dealerId}, allPacked=${allPacked}, delivery_type=${order.delivery_type || "N/A"}`
    );
    if (!allPacked) {
      console.log(
        `[BORZO] Skipping Borzo creation for order ${order.orderId}: not all dealers are packed`
      );
    }
    if (!order.delivery_type) {
      console.log(
        `[BORZO] Skipping Borzo creation for order ${order.orderId}: delivery_type missing`
      );
    }

    if (allPacked) {
      const packedAt = new Date();
      order.status = "Packed";
      order.timestamps.packedAt = packedAt;

      // Check for SLA violation when order is marked as packed
      const slaCheck = await checkSLAViolationOnPacking(order, packedAt);
      if (slaCheck.hasViolation && slaCheck.violation) {
        try {
          const violationRecord = await recordSLAViolation(slaCheck.violation);
          await updateOrderWithSLAViolation(orderId, slaCheck.violation);
          logger.info(
            `SLA violation recorded for order ${orderId}: ${slaCheck.violation.violation_minutes} minutes`
          );

          // Add SLA violation info to response
          order.slaViolation = {
            violationMinutes: slaCheck.violation.violation_minutes,
            message: `SLA violation detected: ${slaCheck.violation.violation_minutes} minutes late`,
          };
        } catch (violationError) {
          logger.error("Failed to record SLA violation:", violationError);
        }
      }
    }

    await order.save();

    // Log dealer packing audit
    // await logOrderAction({
    //   orderId: order._id,
    //   action: "DEALER_PACKED",
    //   performedBy: req.user?.userId || dealerId,
    //   performedByRole: req.user?.role || "dealer",
    //   details: {
    //     orderId: order.orderId,
    //     dealerId: dealerId,
    //     totalWeightKg: total_weight_kg,
    //     allDealersPacked: allPacked,
    //     orderStatusChanged: allPacked,
    //     newOrderStatus: allPacked ? "Packed" : order.status,
    //     slaViolation: order.slaViolation
    //       ? {
    //         violationMinutes: order.slaViolation.violationMinutes,
    //         message: order.slaViolation.message,
    //       }
    //       : null,
    //   },
    //   timestamp: new Date(),
    // });

    let borzoOrderResponse = null;
    let borzoPointsUsed = null;
    if (order.delivery_type) {
      try {
        console.log(
          `[BORZO] Attempting Borzo order creation for ${order.orderId} with delivery_type=${order.delivery_type}`
        );
        const authHeader = req.headers.authorization;
        let pickupDealerId = dealerId || (Array.isArray(order.dealerMapping) && order.dealerMapping.length > 0
          ? order.dealerMapping[0]?.dealerId?.toString()
          : null);
        const dealerInfo = pickupDealerId ? await fetchDealerInfo(pickupDealerId, authHeader) : null;
        const dealerAddressString =
          dealerInfo?.address?.full ||
          buildAddressString({
            building_no: dealerInfo?.address?.building_no,
            street: dealerInfo?.address?.street,
            area: dealerInfo?.address?.area,
            city: dealerInfo?.address?.city,
            state: dealerInfo?.address?.state,
            pincode: dealerInfo?.address?.pincode,
            country: dealerInfo?.address?.country || "India",
          }) ||
          dealerInfo?.business_address ||
          dealerInfo?.registered_address ||
          "Pickup Address";
        const dealerGeo = await geocodeAddress(dealerAddressString);

        const customerAddressString =
          order.customerDetails?.address ||
          buildAddressString({
            building_no: order.customerDetails?.building_no,
            street: order.customerDetails?.street,
            area: order.customerDetails?.area,
            city: order.customerDetails?.city,
            state: order.customerDetails?.state,
            pincode: order.customerDetails?.pincode,
            country: order.customerDetails?.country || "India",
          }) ||
          "Delivery Address";
        const customerGeo = await geocodeAddress(customerAddressString);

        const pickupPoint = {
          address: dealerAddressString,
          contact_person: {
            name: dealerInfo?.business_name || dealerInfo?.legal_name || "Dealer",
            phone:
              dealerInfo?.mobile_number ||
              dealerInfo?.contact_number ||
              dealerInfo?.phone ||
              "0000000000",
          },
          latitude: dealerGeo?.latitude || 28.57908,
          longitude: dealerGeo?.longitude || 77.31912,
          client_order_id: order.orderId,
        };

        const dropPoint = {
          address: customerAddressString,
          contact_person: {
            name: order.customerDetails?.name || "Customer",
            phone: order.customerDetails?.phone || "0000000000",
          },
          latitude: customerGeo?.latitude || 28.583905,
          longitude: customerGeo?.longitude || 77.322733,
          client_order_id: order.orderId,
        };
        borzoPointsUsed = [pickupPoint, dropPoint];
        const orderData = {
          matter: "Food",
          total_weight_kg: total_weight_kg || "3", // Dynamic weight from request body
          insurance_amount: "500.00", // Default insurance
          is_client_notification_enabled: true,
          is_contact_person_notification_enabled: true,
          points: borzoPointsUsed,
        };

        // Call appropriate Borzo function based on delivery_type
        if (order.delivery_type.toLowerCase() === "standard") {
          console.log(
            `[BORZO] Creating instant Borzo order for ${order.orderId}`
          );
          // Create instant order
          const instantReq = { body: { ...orderData, type: "standard" } };
          const instantRes = {
            status: (code) => ({
              json: async (data) => {
                if (code === 200) {
                  borzoOrderResponse = { type: "instant", data };
                  if (data.order_id) {
                    console.log(
                      `Storing Borzo order ID: ${data.order_id} for order: ${order.orderId}`
                    );

                    order.order_track_info = {
                      ...order.order_track_info,
                      borzo_order_id: data.order_id.toString(),
                      borzo_tracking_url: data.tracking_url || order.order_track_info?.borzo_tracking_url,
                      borzo_tracking_number: data.tracking_number || order.order_track_info?.borzo_tracking_number,
                    };

                    if (order.skus && order.skus.length > 0) {
                      order.skus.forEach((sku, index) => {
                        if (!sku.tracking_info) {
                          sku.tracking_info = {};
                        }
                        sku.tracking_info.borzo_order_id = data.order_id.toString();
                        if (data.tracking_url) sku.tracking_info.borzo_tracking_url = data.tracking_url;
                        if (data.tracking_number) sku.tracking_info.borzo_tracking_number = data.tracking_number;
                        sku.tracking_info.status = "Confirmed";
                        if (!sku.tracking_info.timestamps) {
                          sku.tracking_info.timestamps = {};
                        }
                        sku.tracking_info.timestamps.confirmedAt = new Date();
                      });
                    }

                    await order.save();
                    try {
                      await logOrderAction({
                        orderId: order._id,
                        action: "BORZO_ORDER_CREATED_SUCCESS",
                        performedBy: req.user?.userId || "system",
                        performedByRole: req.user?.role || "system",
                        details: { type: "instant", borzo_order_id: data.order_id, response: data },
                        timestamp: new Date(),
                      });
                    } catch (_) { }
                    console.log(
                      `Successfully saved Borzo order ID: ${data.order_id} for order: ${order.orderId} and ${order.skus.length} SKUs`
                    );
                  }
                } else {
                  console.error("Borzo Instant Order Error:", data);
                  // Audit log failure
                  // try {
                  //   await logOrderAction({
                  //     orderId: order._id,
                  //     action: "BORZO_ORDER_CREATED_FAILED",
                  //     performedBy: req.user?.userId || "system",
                  //     performedByRole: req.user?.role || "system",
                  //     details: { type: "instant", error: data },
                  //     timestamp: new Date(),
                  //   });
                  // } catch (_) { }
                }
              },
            }),
          };

          await exports.createOrderBorzoInstant(instantReq, instantRes);
        } else if (order.delivery_type.toLowerCase() === "endofday") {
          console.log(
            `[BORZO] Creating end-of-day Borzo order for ${order.orderId}`
          );
          // Create end of day order
          const endofdayReq = {
            body: {
              ...orderData,
              type: "endofday",
              vehicle_type_id: "8", // Default vehicle type
            },
          };
          const endofdayRes = {
            status: (code) => ({
              json: async (data) => {
                if (code === 200) {
                  borzoOrderResponse = { type: "endofday", data };
                  // Store Borzo order ID in the order and SKUs
                  if (data.order_id) {
                    console.log(
                      `Storing Borzo order ID: ${data.order_id} for order: ${order.orderId}`
                    );

                    // Update order-level tracking
                    order.order_track_info = {
                      ...order.order_track_info,
                      borzo_order_id: data.order_id.toString(),
                      borzo_tracking_url: data.tracking_url || order.order_track_info?.borzo_tracking_url,
                      borzo_tracking_number: data.tracking_number || order.order_track_info?.borzo_tracking_number,
                    };

                    // Update SKU-level tracking
                    if (order.skus && order.skus.length > 0) {
                      order.skus.forEach((sku, index) => {
                        if (!sku.tracking_info) {
                          sku.tracking_info = {};
                        }
                        sku.tracking_info.borzo_order_id = data.order_id.toString();
                        if (data.tracking_url) sku.tracking_info.borzo_tracking_url = data.tracking_url;
                        if (data.tracking_number) sku.tracking_info.borzo_tracking_number = data.tracking_number;
                        sku.tracking_info.status = "Confirmed";
                        if (!sku.tracking_info.timestamps) {
                          sku.tracking_info.timestamps = {};
                        }
                        sku.tracking_info.timestamps.confirmedAt = new Date();
                      });
                    }

                    await order.save();
                    // Audit log success
                    try {
                      await logOrderAction({
                        orderId: order._id,
                        action: "BORZO_ORDER_CREATED_SUCCESS",
                        performedBy: req.user?.userId || "system",
                        performedByRole: req.user?.role || "system",
                        details: { type: "endofday", borzo_order_id: data.order_id, response: data },
                        timestamp: new Date(),
                      });
                    } catch (_) { }
                    console.log(
                      `Successfully saved Borzo order ID: ${data.order_id} for order: ${order.orderId} and ${order.skus.length} SKUs`
                    );
                  }
                } else {
                  console.error("Borzo End of Day Order Error:", data);
                  // Audit log failure
                  try {
                    await logOrderAction({
                      orderId: order._id,
                      action: "BORZO_ORDER_CREATED_FAILED",
                      performedBy: req.user?.userId || "system",
                      performedByRole: req.user?.role || "system",
                      details: { type: "endofday", error: data },
                      timestamp: new Date(),
                    });
                  } catch (_) { }
                }
              },
            }),
          };

          await exports.createOrderBorzoEndofDay(endofdayReq, endofdayRes);
        }
      } catch (borzoError) {
        console.error("Error creating Borzo order:", borzoError);
        // Audit log failure
        try {
          await logOrderAction({
            orderId: order._id,
            action: "BORZO_ORDER_CREATED_FAILED",
            performedBy: req.user?.userId || "system",
            performedByRole: req.user?.role || "system",
            details: { error: borzoError?.message || String(borzoError) },
            timestamp: new Date(),
          });
        } catch (_) { }
        // Don't fail the main request if Borzo order creation fails
      }
    }

    const refreshedOrder = await Order.findById(order._id).lean();
    return res.json({
      message: "Dealer status updated successfully",
      orderStatus: refreshedOrder?.status || order.status,
      order: refreshedOrder || order.toObject(),
      borzoOrder: borzoOrderResponse,
      borzoPoints: borzoPointsUsed,
    });
  } catch (error) {
    console.error("Error updating dealer status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getOrdersByDealerId = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { status } = req.query;
    let filter = { "dealerMapping.dealerId": dealerId };
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter).lean();

    const result = orders.map((order) => {
      const dealerSkus = order.dealerMapping
        .filter((sku) => {
          if (sku.dealerId.toString() === dealerId) {
            return sku;
          }
        })
        .map((sku) => sku.sku);

      return {
        orderId: order.orderId,
        orderDetails: order,
        status: order.status,
        customerDetails: order.customerDetails,
        dealerStatus: order.dealerMapping.find(
          (dm) => dm.dealerId.toString() === dealerId
        )?.status,
        DealerProducts: order.skus.filter((sku) => {
          return dealerSkus.includes(sku.sku);
        }),
      };
    });

    return res.json({ orders: result });
  } catch (error) {
    console.error("Error fetching dealer orders:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { orderId, ratting, review } = req.body;
    if (ratting < 1 || ratting > 5) {
      return res
        .status(400)
        .json({ success: false, error: "Rating must be between 1 and 5" });
    }
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    order.ratting = ratting;
    order.review = review;
    order.review_Date = new Date();
    await order.save();

    // Log review addition audit
    await logOrderAction({
      orderId: order._id,
      action: "REVIEW_ADDED",
      performedBy: req.user?.userId || "customer",
      performedByRole: req.user?.role || "customer",
      details: {
        orderId: order.orderId,
        rating: ratting,
        review: review,
        reviewDate: new Date(),
        customerId: order.customerDetails?.userId,
      },
      timestamp: new Date(),
    });

    return res.json({
      success: true,
      data: order,
      message: "Review added successfully",
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error });
  }
};

exports.createOrderBySuperAdmin = async (req, res) => {
  try {
    // 1. Generate a unique orderId (you can change this format)
    const orderId = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // 2. Build the order payload
    const orderPayload = {
      orderId,
      ...req.body,
      orderDate: new Date(),
      status: "Confirmed",
      timestamps: { createdAt: new Date() },
      // ensure skus have uppercase SKU and empty dealerMapping slots
      skus: (req.body.skus || []).map((s) => ({
        sku: String(s.sku).toUpperCase().trim(),
        quantity: s.quantity,
        productId: s.productId,
        productName: s.productName,
        selling_price: s.selling_price,
        dealerMapped: [], // will be populated by the worker
      })),
      dealerMapping: [], // populated by the worker
    };
    const existingOrder = await Order.findOne({
      purchaseOrderId: req.body.purchaseOrderId,
    });
    if (existingOrder) {
      logger.error("Order already exists");
      return sendError(
        res,
        "Order already exists for this purchase order id",
        400
      );
    }

    // 3. Persist the order
    const newOrder = await Order.create(orderPayload);

    // Log order creation audit for super admin
    await logOrderAction({
      orderId: newOrder._id,
      action: "ORDER_CREATED_BY_SUPER_ADMIN",
      performedBy: req.user?.userId || "super_admin",
      performedByRole: "super_admin",
      details: {
        orderId: newOrder.orderId,
        customerId: req.body.customerDetails?.userId,
        totalAmount: req.body.totalAmount,
        skuCount: req.body.skus?.length || 0,
        deliveryType: req.body.delivery_type || req.body.type_of_delivery,
        paymentType: req.body.paymentType,
        source: "admin_panel",
        purchaseOrderId: req.body.purchaseOrderId,
      },
      timestamp: new Date(),
    });

    // 4. Enqueue background job for dealer assignment
    await dealerAssignmentQueue.add(
      { orderId: newOrder._id.toString() },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    if (req.body.customerDetails.userId) {
      const successData =
        await createUnicastOrMulticastNotificationUtilityFunction(
          [req.body.customerDetails.userId],
          ["INAPP", "PUSH"],
          "Order Placed",
          `Order Placed Successfully with order id ${orderId}`,
          "",
          "",
          "Order",
          {
            order_id: newOrder._id,
          },
          req.headers.authorization
        );
      if (!successData.success) {
        logger.error("❌ Create notification error:", successData.message);
      } else {
        logger.info(
          "✅ Notification created successfully",
          successData.message
        );
      }
    }

    // 5. Return the created order
    return sendSuccess(res, newOrder, "Order created successfully");
  } catch (error) {
    console.error("Create Order failed:", error);
    return sendError(res, error.message || "Failed to create order");
  }
};
exports.getOrderByPurchaseOrderId = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    const order = await Order.findOne({ purchaseOrderId });
    if (!order) return sendError(res, "Order not found", 404);
    return sendSuccess(res, order, "Order fetched successfully");
  } catch (error) {
    logger.error("Get order by purchase order id failed:", error);
    return sendError(res, "Failed to get order by purchase order id");
  }
};
exports.updateCartWithDelivery = async (req, res) => {
  try {
    const { cartId, deliveryType } = req.body;

    // Validate input
    if (!cartId || !deliveryType) {
      return res
        .status(400)
        .json({ error: "Cart ID and delivery type are required" });
    }

    // Validate delivery type
    const validDeliveryTypes = ["express", "standard"];
    if (!validDeliveryTypes.includes(deliveryType.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "Delivery type must be 'express' or 'standard'" });
    }

    // Find the cart first to get current total
    const cart = await Cart.findById(cartId);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Calculate delivery charges based on delivery type and total amount
    let deliveryCharge = 0;
    const totalAmount = cart.totalPrice || 0;

    if (totalAmount < 1500) {
      if (deliveryType.toLowerCase() === "express") {
        deliveryCharge = 200;
      } else if (deliveryType.toLowerCase() === "standard") {
        deliveryCharge = 90;
      }
    }
    // If total amount is >= 1500, delivery is free (deliveryCharge remains 0)

    // Calculate new grand total (total_mrp_with_gst should not include delivery charges)
    const newGrandTotal = totalAmount + cart.handlingCharge + deliveryCharge;

    // Update the cart with delivery type, delivery charges, and new grand total
    const updatedCart = await Cart.findByIdAndUpdate(
      cartId,
      {
        type_of_delivery: deliveryType.toLowerCase(),
        delivery_type: deliveryType.toLowerCase(), // Also update delivery_type field
        deliveryCharge: deliveryCharge,
        grandTotal: newGrandTotal,
      },
      { new: true }
    );

    return res.json({
      message: "Cart updated successfully",
      cart: updatedCart,
      deliveryCharge: deliveryCharge,
      grandTotal: newGrandTotal,
    });
  } catch (error) {
    console.error("Error updating cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.createOrderBorzoInstant = async (req, res) => {
  try {
    const {
      type = "standard",
      matter = "Food",
      total_weight_kg = "3",
      insurance_amount = "500.00",
      is_client_notification_enabled = true,
      is_contact_person_notification_enabled = true,
      points = [],
    } = req.body;

    // Validate required fields
    if (!points || points.length < 2) {
      return res.status(400).json({
        error: "At least 2 points (pickup and delivery) are required",
      });
    }

    // Validate total_weight_kg
    if (
      total_weight_kg &&
      (isNaN(parseFloat(total_weight_kg)) || parseFloat(total_weight_kg) <= 0)
    ) {
      return res.status(400).json({
        error: "total_weight_kg must be a positive number",
      });
    }

    // Validate each point has required fields
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (
        !point.address ||
        !point.contact_person ||
        !point.contact_person.name ||
        !point.contact_person.phone ||
        !point.latitude ||
        !point.longitude
      ) {
        return res.status(400).json({
          error: `Point ${i + 1
            } is missing required fields (address, contact_person, latitude, longitude)`,
        });
      }
    }

    // Create Borzo order payload with dynamic total_weight_kg
    const borzoOrderPayload = {
      type,
      matter,
      total_weight_kg: total_weight_kg.toString(),
      insurance_amount: insurance_amount.toString(),
      is_client_notification_enabled,
      is_contact_person_notification_enabled,
      points: points.map((point) => ({
        address: point.address,
        contact_person: {
          name: point.contact_person.name,
          phone: point.contact_person.phone,
        },
        latitude: point.latitude,
        longitude: point.longitude,
        client_order_id:
          point.client_order_id ||
          `BORZO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    };

    // Make the actual API call to Borzo
    console.log(
      "Borzo Order Payload:",
      JSON.stringify(borzoOrderPayload, null, 2)
    );

    try {
      const response = await axios.post(
        "https://robotapitest-in.borzodelivery.com/api/business/1.6/create-order",
        borzoOrderPayload,
        {
          headers: {
            "X-DV-Auth-Token": "29C64BE0ED20FC6C654F947F7E3D8E33496F51F6",
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      console.log(
        "Borzo API Response:",
        JSON.stringify(response.data, null, 2)
      );

      return res.status(200).json({
        message: "Borzo order created successfully",
        borzo_order: response.data,
        request_payload: borzoOrderPayload,
      });
    } catch (apiError) {
      console.error("Borzo API Error:", {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message,
      });

      // Return appropriate error response
      if (apiError.response) {
        return res.status(apiError.response.status).json({
          error: "Borzo API Error",
          status: apiError.response.status,
          message:
            apiError.response.data?.message || apiError.response.statusText,
          borzo_error: apiError.response.data,
          request_payload: borzoOrderPayload,
        });
      } else if (apiError.request) {
        return res.status(503).json({
          error: "Borzo API Unavailable",
          message: "Unable to reach Borzo API. Please try again later.",
          request_payload: borzoOrderPayload,
        });
      } else {
        return res.status(500).json({
          error: "Internal Error",
          message: apiError.message,
          request_payload: borzoOrderPayload,
        });
      }
    }
  } catch (error) {
    console.error("Error creating Borzo order:", error);
    return res.status(500).json({
      error: "Failed to create Borzo order",
      details: error.message,
    });
  }
};
exports.createOrderBorzoEndofDay = async (req, res) => {
  try {
    const {
      type = "endofday",
      matter = "Food",
      vehicle_type_id = "8",
      total_weight_kg = "3",
      insurance_amount = "500.00",
      is_client_notification_enabled = true,
      is_contact_person_notification_enabled = true,
      points = [],
    } = req.body;

    // Validate required fields
    if (!points || points.length < 2) {
      return res.status(400).json({
        error: "At least 2 points (pickup and delivery) are required",
      });
    }

    // Validate total_weight_kg
    if (
      total_weight_kg &&
      (isNaN(parseFloat(total_weight_kg)) || parseFloat(total_weight_kg) <= 0)
    ) {
      return res.status(400).json({
        error: "total_weight_kg must be a positive number",
      });
    }

    // Validate vehicle_type_id
    if (!vehicle_type_id) {
      return res.status(400).json({
        error: "vehicle_type_id is required",
      });
    }

    // Validate each point has required fields
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (
        !point.address ||
        !point.contact_person ||
        !point.contact_person.name ||
        !point.contact_person.phone ||
        !point.latitude ||
        !point.longitude
      ) {
        return res.status(400).json({
          error: `Point ${i + 1
            } is missing required fields (address, contact_person, latitude, longitude)`,
        });
      }
    }

    // Create Borzo order payload with dynamic parameters
    const borzoOrderPayload = {
      type,
      matter,
      vehicle_type_id,
      total_weight_kg: total_weight_kg.toString(),
      insurance_amount: insurance_amount.toString(),
      is_client_notification_enabled,
      is_contact_person_notification_enabled,
      points: points.map((point) => ({
        address: point.address,
        contact_person: {
          name: point.contact_person.name,
          phone: point.contact_person.phone,
        },
        latitude: point.latitude,
        longitude: point.longitude,
        client_order_id:
          point.client_order_id ||
          `BORZO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    };

    // Make the actual API call to Borzo
    console.log(
      "Borzo End of Day Order Payload:",
      JSON.stringify(borzoOrderPayload, null, 2)
    );

    try {
      const response = await axios.post(
        "https://robotapitest-in.borzodelivery.com/api/business/1.6/create-order",
        borzoOrderPayload,
        {
          headers: {
            "X-DV-Auth-Token": "29C64BE0ED20FC6C654F947F7E3D8E33496F51F6",
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      console.log(
        "Borzo End of Day API Response:",
        JSON.stringify(response.data, null, 2)
      );

      return res.status(200).json({
        message: "Borzo end of day order created successfully",
        borzo_order: response.data,
        request_payload: borzoOrderPayload,
      });
    } catch (apiError) {
      console.error("Borzo End of Day API Error:", {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data,
        message: apiError.message,
      });

      // Return appropriate error response
      if (apiError.response) {
        return res.status(apiError.response.status).json({
          error: "Borzo End of Day API Error",
          status: apiError.response.status,
          message:
            apiError.response.data?.message || apiError.response.statusText,
          borzo_error: apiError.response.data,
          request_payload: borzoOrderPayload,
        });
      } else if (apiError.request) {
        return res.status(503).json({
          error: "Borzo End of Day API Unavailable",
          message: "Unable to reach Borzo API. Please try again later.",
          request_payload: borzoOrderPayload,
        });
      } else {
        return res.status(500).json({
          error: "Internal Error",
          message: apiError.message,
          request_payload: borzoOrderPayload,
        });
      }
    }
  } catch (error) {
    console.error("Error creating Borzo end of day order:", error);
    return res.status(500).json({
      error: "Failed to create Borzo end of day order",
      details: error.message,
    });
  }
};

const createShiprocketOrder = async (req, res) => { };

exports.getBorzoOrderLabels = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({
        error: "Order ID is required",
      });
    }

    // Call Borzo API to get labels
    const response = await axios.get(
      `https://robotapitest-in.borzodelivery.com/api/business/1.6/labels?type=pdf&order_id[]=${order_id}`,
      {
        headers: {
          "X-DV-Auth-Token":
            process.env.BORZO_AUTH_TOKEN ||
            "29C64BE0ED20FC6C654F947F7E3D8E33496F51F6",
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (
      !response.data.is_successful ||
      !response.data.labels ||
      response.data.labels.length === 0
    ) {
      return res.status(404).json({
        error: "No labels found for this order",
      });
    }

    // Convert base64 to PDF and send
    const label = response.data.labels[0];
    const pdfBuffer = Buffer.from(label.content_base64, "base64");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="borzo-label-${order_id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error fetching Borzo labels:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.getBorzoOrderLabelsAsJSON = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({
        error: "Order ID is required",
      });
    }

    // Call Borzo API to get labels
    const response = await axios.get(
      `https://robotapitest-in.borzodelivery.com/api/business/1.6/labels?type=pdf&order_id[]=${order_id}`,
      {
        headers: {
          "X-DV-Auth-Token":
            process.env.BORZO_AUTH_TOKEN ||
            "29C64BE0ED20FC6C654F947F7E3D8E33496F51F6",
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("Error fetching Borzo labels:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.getBorzoOrderLabelsByInternalOrderId = async (req, res) => {
  try {
    const { internalOrderId } = req.params;

    if (!internalOrderId) {
      return res.status(400).json({
        error: "Internal Order ID is required",
      });
    }

    // Find the order by internal order ID
    const order = await Order.findOne({
      $or: [{ _id: internalOrderId }, { orderId: internalOrderId }],
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    if (!order.order_track_info?.borzo_order_id) {
      return res.status(404).json({
        error: "No Borzo order ID found for this order",
      });
    }

    // Call Borzo API to get labels using the Borzo order ID
    const response = await axios.get(
      `https://robotapitest-in.borzodelivery.com/api/business/1.6/labels?type=pdf&order_id[]=${order.order_track_info.borzo_order_id}`,
      {
        headers: {
          "X-DV-Auth-Token":
            process.env.BORZO_AUTH_TOKEN ||
            "29C64BE0ED20FC6C654F947F7E3D8E33496F51F6",
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (
      !response.data.is_successful ||
      !response.data.labels ||
      response.data.labels.length === 0
    ) {
      return res.status(404).json({
        error: "No labels found for this order",
      });
    }

    // Convert base64 to PDF and send
    const label = response.data.labels[0];
    const pdfBuffer = Buffer.from(label.content_base64, "base64");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="borzo-label-${order.order_track_info.borzo_order_id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error fetching Borzo labels:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.borzoWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-dv-signature"];
    const webhookData = req.body;

    console.log("Borzo Webhook Received:", {
      signature: signature,
      data: webhookData,
    });

    // Verify webhook signature
    if (!signature) {
      console.error("Missing X-DV-Signature header");
      return res.status(400).json({ error: "Missing signature" });
    }

    // Get the callback secret key from environment variables
    const callbackSecretKey = "D5DD560F8E8DB1A98342992342C5B6DCFCCE269D";
    if (!callbackSecretKey) {
      console.error("BORZO_CALLBACK_SECRET_KEY not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    // Verify signature using HMAC SHA256
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", callbackSecretKey)
      .update(JSON.stringify(webhookData))
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Extract webhook data
    const {
      event_datetime,
      event_type,
      order: borzoOrder,
      delivery: borzoDelivery,
    } = webhookData;

    // Handle both order and delivery webhook structures
    let borzoOrderId;
    let borzoData;
    let clientOrderId;

    if (borzoOrder && borzoOrder.order_id) {
      // Standard order webhook
      borzoOrderId = borzoOrder.order_id.toString();
      borzoData = borzoOrder;
      clientOrderId = borzoOrder.client_order_id;
    } else if (borzoDelivery && borzoDelivery.order_id) {
      // Delivery webhook
      borzoOrderId = borzoDelivery.order_id.toString();
      borzoData = borzoDelivery;
      clientOrderId = borzoDelivery.client_order_id;
    } else {
      console.error("Invalid webhook data - missing order information");
      console.error(
        "Webhook data structure:",
        JSON.stringify(webhookData, null, 2)
      );
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    // Find the order in our database by client_order_id (which should match our orderId)
    console.log(
      `Looking for order with client_order_id: ${clientOrderId} and Borzo order ID: ${borzoOrderId}`
    );

    let order = await Order.findOne({
      orderId: clientOrderId,
    });

    // If not found by client_order_id, try by Borzo order ID as fallback
    if (!order) {
      console.log(
        `Order not found by client_order_id: ${clientOrderId}, trying Borzo order ID: ${borzoOrderId}`
      );
      order = await Order.findOne({
        "order_track_info.borzo_order_id": borzoOrderId,
      });
    }

    if (!order) {
      console.error(
        `Order not found for client_order_id: ${clientOrderId} or Borzo order ID: ${borzoOrderId}`
      );
      // Let's also search by other fields to help debug
      const allOrders = await Order.find({}).limit(5);
      console.log(
        "Recent orders in database:",
        allOrders.map((o) => ({
          orderId: o.orderId,
          borzo_order_id: o.order_track_info?.borzo_order_id,
          status: o.status,
        }))
      );
      return res.status(404).json({ error: "Order not found" });
    } else {
      console.log(`Found order: ${order.orderId} with status: ${order.status}`);
    }

    // Update order-level tracking information
    const updateData = {
      "order_track_info.borzo_event_datetime": new Date(event_datetime),
      "order_track_info.borzo_event_type": event_type,
      "order_track_info.borzo_last_updated": new Date(),
    };

    // Update specific fields based on what's available in the webhook
    if (borzoData.status) {
      updateData["order_track_info.borzo_order_status"] = borzoData.status;
    }

    if (borzoData.tracking_url) {
      updateData["order_track_info.borzo_tracking_url"] =
        borzoData.tracking_url;
    }

    if (borzoData.tracking_number) {
      updateData["order_track_info.borzo_tracking_number"] =
        borzoData.tracking_number;
    }

    // Update order status based on Borzo status
    let orderStatusUpdate = {};
    if (borzoData.status) {
      switch (borzoData.status.toLowerCase()) {
        case "created":
        case "planned":
          orderStatusUpdate.status = "Confirmed";
          break;
        case "assigned":
        case "courier_assigned":
          orderStatusUpdate.status = "Assigned";
          break;
        case "picked_up":
          orderStatusUpdate.status = "Shipped";
          orderStatusUpdate["timestamps.shippedAt"] = new Date();
          break;
        case "finished":
          // Special handling for "finished" status - check if all SKUs are finished
          console.log(`Borzo status is "finished" for order ${order.orderId}`);
          break;
        case "delivered":
          orderStatusUpdate.status = "Delivered";
          break;
        case "cancelled":
          orderStatusUpdate.status = "Cancelled";
          break;
        case "returned":
          orderStatusUpdate.status = "Returned";
          break;
        default:
          // Keep current status if unknown
          break;
      }
    }

    // Update SKU-level tracking information
    const skuUpdates = [];
    if (order.skus && order.skus.length > 0) {
      order.skus.forEach((sku, index) => {
        // Update each SKU's tracking info
        const skuTrackingUpdate = {
          [`skus.${index}.tracking_info.borzo_event_datetime`]: new Date(
            event_datetime
          ),
          [`skus.${index}.tracking_info.borzo_event_type`]: event_type,
          [`skus.${index}.tracking_info.borzo_last_updated`]: new Date(),
        };

        if (borzoData.status) {
          skuTrackingUpdate[`skus.${index}.tracking_info.borzo_order_status`] =
            borzoData.status;
        }

        if (borzoData.tracking_url) {
          skuTrackingUpdate[`skus.${index}.tracking_info.borzo_tracking_url`] =
            borzoData.tracking_url;
        }

        if (borzoData.tracking_number) {
          skuTrackingUpdate[
            `skus.${index}.tracking_info.borzo_tracking_number`
          ] = borzoData.tracking_number;
        }

        // Update SKU status based on Borzo status
        let skuStatus = "Pending";
        let skuTimestamp = null;

        switch (borzoData.status.toLowerCase()) {
          case "created":
          case "planned":
            skuStatus = "Confirmed";
            skuTimestamp = "confirmedAt";
            break;
          case "assigned":
          case "courier_assigned":
            skuStatus = "Assigned";
            skuTimestamp = "assignedAt";
            break;
          case "picked_up":
            skuStatus = "Shipped";
            skuTimestamp = "shippedAt";
            break;
          case "finished":
            skuStatus = "Delivered";
            skuTimestamp = "deliveredAt";
            break;
          case "delivered":
            skuStatus = "Delivered";
            skuTimestamp = "deliveredAt";
            break;
          case "cancelled":
            skuStatus = "Cancelled";
            break;
          case "returned":
            skuStatus = "Returned";
            break;
          default:
            skuStatus = "Pending";
            break;
        }

        skuTrackingUpdate[`skus.${index}.tracking_info.status`] = skuStatus;

        if (skuTimestamp) {
          skuTrackingUpdate[
            `skus.${index}.tracking_info.timestamps.${skuTimestamp}`
          ] = new Date();
        }

        skuUpdates.push(skuTrackingUpdate);
      });
    }

    // Update the order with all changes
    const finalUpdateData = { ...updateData, ...orderStatusUpdate };

    // Apply order-level updates
    let updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { $set: finalUpdateData },
      { new: true }
    );

    // Apply SKU-level updates
    if (skuUpdates.length > 0) {
      for (const skuUpdate of skuUpdates) {
        updatedOrder = await Order.findByIdAndUpdate(
          order._id,
          { $set: skuUpdate },
          { new: true }
        );
      }
    }

    // Special handling for "finished" status - check if all SKUs are finished
    if (borzoData.status && borzoData.status.toLowerCase() === "finished") {
      console.log(
        `Checking if all SKUs are finished for order ${order.orderId}`
      );

      // Use the utility function to check and mark order as delivered if all SKUs are finished
      const {
        markOrderAsDeliveredIfAllFinished,
      } = require("../utils/orderStatusCalculator");

      const result = await markOrderAsDeliveredIfAllFinished(order._id);

      if (result.updated) {
        updatedOrder = result.order;
        orderStatusUpdate.status = "Delivered";
        console.log(
          `✅ Order ${order.orderId} marked as Delivered: ${result.reason}`
        );
      } else {
        console.log(
          `⏳ Order ${order.orderId} not yet delivered: ${result.reason}`
        );
      }
    }

    console.log(`Order ${order.orderId} updated with Borzo webhook data:`, {
      client_order_id: clientOrderId,
      borzo_order_id: borzoOrderId,
      event_type: event_type,
      borzo_status: borzoData.status,
      order_status: orderStatusUpdate.status,
      tracking_url: borzoData.tracking_url,
    });

    // Add audit log entry
    await Order.findByIdAndUpdate(order._id, {
      $push: {
        auditLogs: {
          action: `Borzo Webhook: ${event_type}`,
          actorId: null, // System action
          role: "System",
          timestamp: new Date(),
          reason: `Borzo order status updated to: ${borzoData?.status || "Unknown"
            }`,
        },
      },
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      order_id: order.orderId,
      client_order_id: clientOrderId,
      borzo_order_id: borzoOrderId,
      event_type: event_type,
      borzo_status: borzoData.status,
      updated_status: orderStatusUpdate.status || order.status,
    });
  } catch (error) {
    console.error("Error processing Borzo webhook:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.getOrderTrackingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: "Order ID is required",
        message: "Please provide a valid order ID",
      });
    }

    // Find the order by internal order ID or Borzo order ID
    const order = await Order.findOne({
      $or: [
        { _id: orderId },
        { orderId: orderId },
        { "order_track_info.borzo_order_id": orderId },
      ],
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
        message: "No order found with the provided ID",
      });
    }

    // Prepare tracking information
    const trackingInfo = {
      order_id: order.orderId,
      internal_order_id: order._id,
      status: order.status,
      customer_details: order.customerDetails,
      timestamps: order.timestamps,
      borzo_tracking: order.order_track_info || {},
      audit_logs: order.auditLogs || [],
      // SKU-level tracking information
      sku_tracking: order.skus
        ? order.skus.map((sku) => ({
          sku: sku.sku,
          productId: sku.productId,
          productName: sku.productName,
          quantity: sku.quantity,
          tracking_info: sku.tracking_info || {},
          dealer_mapping: sku.dealerMapped || [],
        }))
        : [],
    };

    return res.status(200).json({
      success: true,
      message: "Order tracking information retrieved successfully",
      data: trackingInfo,
    });
  } catch (error) {
    console.error("Error getting order tracking info:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.debugBorzoOrderId = async (req, res) => {
  try {
    const { orderId, borzoOrderId } = req.body;

    if (!orderId || !borzoOrderId) {
      return res.status(400).json({
        error: "Both orderId and borzoOrderId are required",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    console.log(`Current order tracking info:`, order.order_track_info);

    // Update the Borzo order ID
    order.order_track_info = {
      ...order.order_track_info,
      borzo_order_id: borzoOrderId.toString(),
    };

    await order.save();

    console.log(
      `Updated order ${order.orderId} with Borzo order ID: ${borzoOrderId}`
    );

    return res.status(200).json({
      success: true,
      message: "Borzo order ID updated successfully",
      orderId: order.orderId,
      borzoOrderId: borzoOrderId,
      order_track_info: order.order_track_info,
    });
  } catch (error) {
    console.error("Error updating Borzo order ID:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.getSkuTrackingInfo = async (req, res) => {
  try {
    const { orderId, sku } = req.params;

    if (!orderId || !sku) {
      return res.status(400).json({
        error: "Order ID and SKU are required",
      });
    }

    // Find the order
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Find the specific SKU
    const skuData = order.skus.find((s) => s.sku === sku);

    if (!skuData) {
      return res.status(404).json({
        error: "SKU not found in this order",
      });
    }

    // Prepare SKU tracking information
    const skuTrackingInfo = {
      order_id: order.orderId,
      sku: skuData.sku,
      productId: skuData.productId,
      productName: skuData.productName,
      quantity: skuData.quantity,
      status: skuData.tracking_info?.status || "Pending",
      tracking_info: skuData.tracking_info || {},
      dealer_mapping: skuData.dealerMapped || [],
      order_status: order.status,
      customer_details: order.customerDetails,
    };

    return res.status(200).json({
      success: true,
      message: "SKU tracking information retrieved successfully",
      data: skuTrackingInfo,
    });
  } catch (error) {
    console.error("Error getting SKU tracking info:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

exports.updateSkuTrackingStatus = async (req, res) => {
  try {
    const { orderId, sku } = req.params;
    const { status, borzo_order_id, tracking_url, tracking_number } = req.body;

    if (!orderId || !sku) {
      return res.status(400).json({
        error: "Order ID and SKU are required",
      });
    }

    // Find the order
    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Find the SKU index
    const skuIndex = order.skus.findIndex((s) => s.sku === sku);

    if (skuIndex === -1) {
      return res.status(404).json({
        error: "SKU not found in this order",
      });
    }

    // Update SKU tracking information
    const updateData = {};

    if (status) {
      updateData[`skus.${skuIndex}.tracking_info.status`] = status;

      // Update timestamp based on status
      let timestampField = null;
      switch (status.toLowerCase()) {
        case "confirmed":
          timestampField = "confirmedAt";
          break;
        case "assigned":
          timestampField = "assignedAt";
          break;
        case "packed":
          timestampField = "packedAt";
          break;
        case "shipped":
          timestampField = "shippedAt";
          break;
        case "delivered":
          timestampField = "deliveredAt";
          break;
      }

      if (timestampField) {
        updateData[
          `skus.${skuIndex}.tracking_info.timestamps.${timestampField}`
        ] = new Date();
      }
    }

    if (borzo_order_id) {
      updateData[`skus.${skuIndex}.tracking_info.borzo_order_id`] =
        borzo_order_id;
    }

    if (tracking_url) {
      updateData[`skus.${skuIndex}.tracking_info.borzo_tracking_url`] =
        tracking_url;
    }

    if (tracking_number) {
      updateData[`skus.${skuIndex}.tracking_info.borzo_tracking_number`] =
        tracking_number;
    }

    updateData[`skus.${skuIndex}.tracking_info.borzo_last_updated`] =
      new Date();

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { $set: updateData },
      { new: true }
    );

    // Log SKU tracking update audit
    await logOrderAction({
      orderId: order._id,
      action: "SKU_TRACKING_UPDATE",
      performedBy: req.user?.userId || "system",
      performedByRole: req.user?.role || "admin",
      details: {
        orderId: order.orderId,
        sku: sku,
        previousStatus: order.skus[skuIndex].tracking_info?.status || "Pending",
        newStatus: status,
        borzoOrderId: borzo_order_id,
        trackingUrl: tracking_url,
        trackingNumber: tracking_number,
        updateType: "sku_tracking",
      },
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "SKU tracking information updated successfully",
      data: {
        order_id: updatedOrder.orderId,
        sku: sku,
        updated_tracking_info: updatedOrder.skus[skuIndex].tracking_info,
      },
    });
  } catch (error) {
    console.error("Error updating SKU tracking info:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

/**
 * Mark a specific SKU as packed
 */
exports.markSkuAsPacked = async (req, res) => {
  try {
    const { orderId, sku } = req.params;
    const { packedBy, notes } = req.body;

    // Update SKU status to packed
    const updatedOrder = await updateSkuStatus(orderId, sku, "Packed", {
      timestamps: {
        packedAt: new Date(),
      },
    });

    // Log the packing action
    logger.info(
      `SKU ${sku} in order ${orderId} marked as packed by ${packedBy || "system"
      }`
    );

    // Log SKU packing audit
    await logOrderAction({
      orderId: updatedOrder._id,
      action: "SKU_PACKED",
      performedBy: req.user?.userId || packedBy || "system",
      performedByRole: req.user?.role || "dealer",
      details: {
        orderId: updatedOrder.orderId,
        sku: sku,
        packedBy: packedBy,
        notes: notes,
        slaViolation: null, // Will be updated below if violation detected
      },
      timestamp: new Date(),
    });

    // Check for SLA violation (existing logic)
    const slaCheck = await checkSLAViolationOnPacking(updatedOrder, new Date());

    let responseData = {
      order: updatedOrder,
      skuStatus: "Packed",
      message: `SKU ${sku} marked as packed successfully`,
    };

    // If SLA violation detected, record it
    if (slaCheck.hasViolation && slaCheck.violation) {
      try {
        const violationRecord = await recordSLAViolation(slaCheck.violation);
        await updateOrderWithSLAViolation(orderId, slaCheck.violation);

        responseData.slaViolation = violationRecord;
        responseData.message += `. SLA violation detected: ${slaCheck.violation.violation_minutes} minutes late.`;

        // Update the audit log with SLA violation info
        await logOrderAction({
          orderId: updatedOrder._id,
          action: "SLA_VIOLATION_DETECTED",
          performedBy: req.user?.userId || packedBy || "system",
          performedByRole: req.user?.role || "dealer",
          details: {
            orderId: updatedOrder.orderId,
            sku: sku,
            violationMinutes: slaCheck.violation.violation_minutes,
            violationType: "packing_delay",
            message: `SLA violation detected: ${slaCheck.violation.violation_minutes} minutes late`,
          },
          timestamp: new Date(),
        });
      } catch (violationError) {
        logger.error("Failed to record SLA violation:", violationError);
        responseData.warning =
          "SKU packed successfully but failed to record SLA violation";
      }
    }

    return sendSuccess(res, responseData, responseData.message);
  } catch (error) {
    logger.error("Mark SKU as packed failed:", error);
    return sendError(res, "Failed to mark SKU as packed");
  }
};

/**
 * Mark a specific SKU as shipped
 */
exports.markSkuAsShipped = async (req, res) => {
  try {
    const { orderId, sku } = req.params;
    const { shippedBy, trackingNumber, courierName } = req.body;

    const updatedOrder = await updateSkuStatus(orderId, sku, "Shipped", {
      timestamps: {
        shippedAt: new Date(),
      },
      borzoData: {
        borzo_tracking_number: trackingNumber,
        borzo_tracking_status: "Shipped",
      },
    });

    // Also mark the corresponding dealer as Packed if all their SKUs are at least Packed
    try {
      const ord = await Order.findById(orderId);
      if (ord && Array.isArray(ord.dealerMapping) && Array.isArray(ord.skus)) {
        const mappingForSku = ord.dealerMapping.find((m) => m?.sku === sku);
        const dealerForSku = mappingForSku?.dealerId?.toString();
        if (dealerForSku) {
          const dealerSkus = ord.dealerMapping
            .filter((m) => m?.dealerId?.toString() === dealerForSku)
            .map((m) => m.sku);
          const acceptable = new Set(["Packed", "Shipped", "Delivered"]);
          const allDealerSkusPacked = dealerSkus.every((dealerSku) => {
            const skuEntry = ord.skus.find((s) => s.sku === dealerSku);
            return skuEntry && acceptable.has(skuEntry.status);
          });
          if (allDealerSkusPacked) {
            ord.dealerMapping = ord.dealerMapping.map((m) =>
              m?.dealerId?.toString() === dealerForSku ? { ...m.toObject?.() ?? m, status: "Packed" } : m
            );
            await ord.save();
            console.log(
              `[BORZO] Dealer ${dealerForSku} marked as Packed for order ${ord.orderId} (all dealer SKUs >= Packed)`
            );
          }
        }
      }
    } catch (e) {
      logger.warn(`Failed dealer Packed sync on SKU ship for order ${orderId}: ${e.message}`);
    }

    // Create a Borzo order if not already created, so shipping is tracked
    try {
      const order = await Order.findById(orderId);
      if (order && (!order.order_track_info || !order.order_track_info.borzo_order_id) && order.delivery_type) {
        console.log(
          `[BORZO] SKU shipped trigger: attempting Borzo order creation for ${order.orderId}, delivery_type=${order.delivery_type}`
        );
        const total_weight_kg = order.skus?.reduce((sum, s) => sum + (Number(s.weight_kg || 0) || 0), 0) || 3;
        // Build pickup (dealer) and drop (customer) points with geocoding
        const authHeader = req.headers.authorization;
        let pickupDealerId = null;
        try {
          const ordLean = await Order.findById(orderId).lean();
          if (ordLean?.dealerMapping && Array.isArray(ordLean.dealerMapping)) {
            const mappingForSku = ordLean.dealerMapping.find((m) => m?.sku === sku);
            pickupDealerId = mappingForSku?.dealerId?.toString() || null;
          }
        } catch (_) { }
        const dealerInfo = pickupDealerId ? await fetchDealerInfo(pickupDealerId, authHeader) : null;
        const dealerAddressString =
          dealerInfo?.address?.full ||
          buildAddressString({
            building_no: dealerInfo?.address?.building_no,
            street: dealerInfo?.address?.street,
            area: dealerInfo?.address?.area,
            city: dealerInfo?.address?.city,
            state: dealerInfo?.address?.state,
            pincode: dealerInfo?.address?.pincode,
            country: dealerInfo?.address?.country || "India",
          }) ||
          dealerInfo?.business_address ||
          dealerInfo?.registered_address ||
          "Pickup Address";
        const dealerGeo = await geocodeAddress(dealerAddressString);

        const customerAddressString =
          order.customerDetails?.address ||
          buildAddressString({
            building_no: order.customerDetails?.building_no,
            street: order.customerDetails?.street,
            area: order.customerDetails?.area,
            city: order.customerDetails?.city,
            state: order.customerDetails?.state,
            pincode: order.customerDetails?.pincode,
            country: order.customerDetails?.country || "India",
          }) ||
          "Delivery Address";
        const customerGeo = await geocodeAddress(customerAddressString);

        const pickupPoint = {
          address: dealerAddressString,
          contact_person: {
            name: dealerInfo?.business_name || dealerInfo?.legal_name || "Dealer",
            phone:
              dealerInfo?.mobile_number ||
              dealerInfo?.contact_number ||
              dealerInfo?.phone ||
              "0000000000",
          },
          latitude: dealerGeo?.latitude || 28.57908,
          longitude: dealerGeo?.longitude || 77.31912,
          client_order_id: order.orderId,
        };

        const dropPoint = {
          address: customerAddressString,
          contact_person: {
            name: order.customerDetails?.name || "Customer",
            phone: order.customerDetails?.phone || "0000000000",
          },
          latitude: customerGeo?.latitude || 28.583905,
          longitude: customerGeo?.longitude || 77.322733,
          client_order_id: order.orderId,
        };

        const orderData = {
          matter: "Food",
          total_weight_kg: String(total_weight_kg),
          insurance_amount: "500.00",
          is_client_notification_enabled: true,
          is_contact_person_notification_enabled: true,
          points: [pickupPoint, dropPoint],
        };

        if ((order.delivery_type || "").toLowerCase() === "standard") {
          console.log(`[BORZO] Creating instant Borzo order (from SKU ship) for ${order.orderId}`);
          const instantReq = { body: { ...orderData, type: "standard" } };
          const instantRes = {
            status: (code) => ({
              json: async (data) => {
                if (code === 200 && data?.order_id) {
                  order.order_track_info = {
                    ...order.order_track_info,
                    borzo_order_id: data.order_id.toString(),
                    borzo_tracking_url: data.tracking_url || order.order_track_info?.borzo_tracking_url,
                    borzo_tracking_number: data.tracking_number || order.order_track_info?.borzo_tracking_number,
                  };
                  if (order.skus && order.skus.length > 0) {
                    order.skus.forEach((s) => {
                      s.tracking_info = s.tracking_info || {};
                      s.tracking_info.borzo_order_id = data.order_id.toString();
                      if (data.tracking_url) s.tracking_info.borzo_tracking_url = data.tracking_url;
                      if (data.tracking_number) s.tracking_info.borzo_tracking_number = data.tracking_number;
                    });
                  }
                  await order.save();
                  // Audit log success
                  try {
                    await logOrderAction({
                      orderId: order._id,
                      action: "BORZO_ORDER_CREATED_SUCCESS",
                      performedBy: req.user?.userId || "system",
                      performedByRole: req.user?.role || "system",
                      details: { type: "instant", borzo_order_id: data.order_id, response: data },
                      timestamp: new Date(),
                    });
                  } catch (_) { }
                }
              },
            }),
          };
          await exports.createOrderBorzoInstant(instantReq, instantRes);
        } else if ((order.delivery_type || "").toLowerCase() === "endofday") {
          console.log(`[BORZO] Creating end-of-day Borzo order (from SKU ship) for ${order.orderId}`);
          const endofdayReq = { body: { ...orderData, type: "endofday", vehicle_type_id: "8" } };
          const endofdayRes = {
            status: (code) => ({
              json: async (data) => {
                if (code === 200 && data?.order_id) {
                  order.order_track_info = {
                    ...order.order_track_info,
                    borzo_order_id: data.order_id.toString(),
                    borzo_tracking_url: data.tracking_url || order.order_track_info?.borzo_tracking_url,
                    borzo_tracking_number: data.tracking_number || order.order_track_info?.borzo_tracking_number,
                  };
                  if (order.skus && order.skus.length > 0) {
                    order.skus.forEach((s) => {
                      s.tracking_info = s.tracking_info || {};
                      s.tracking_info.borzo_order_id = data.order_id.toString();
                      if (data.tracking_url) s.tracking_info.borzo_tracking_url = data.tracking_url;
                      if (data.tracking_number) s.tracking_info.borzo_tracking_number = data.tracking_number;
                    });
                  }
                  await order.save();
                  // Audit log success
                  try {
                    await logOrderAction({
                      orderId: order._id,
                      action: "BORZO_ORDER_CREATED_SUCCESS",
                      performedBy: req.user?.userId || "system",
                      performedByRole: req.user?.role || "system",
                      details: { type: "endofday", borzo_order_id: data.order_id, response: data },
                      timestamp: new Date(),
                    });
                  } catch (_) { }
                }
              },
            }),
          };
          await exports.createOrderBorzoEndofDay(endofdayReq, endofdayRes);
        }
      }
    } catch (borzoCreateErr) {
      logger.error("Borzo order creation on SKU shipped failed:", borzoCreateErr);
    }

    logger.info(
      `SKU ${sku} in order ${orderId} marked as shipped by ${shippedBy || "system"
      }`
    );

    return sendSuccess(
      res,
      {
        order: updatedOrder,
        skuStatus: "Shipped",
        message: `SKU ${sku} marked as shipped successfully`,
      },
      `SKU ${sku} marked as shipped successfully`
    );
  } catch (error) {
    logger.error("Mark SKU as shipped failed:", error);
    return sendError(res, "Failed to mark SKU as shipped");
  }
};

/**
 * Mark a specific SKU as delivered
 */
exports.markSkuAsDelivered = async (req, res) => {
  try {
    const { orderId, sku } = req.params;
    const { deliveredBy, deliveryProof, signature } = req.body;

    // Update SKU status to delivered
    const updatedOrder = await updateSkuStatus(orderId, sku, "Delivered", {
      timestamps: {
        deliveredAt: new Date(),
      },
      borzoData: {
        borzo_tracking_status: "Delivered",
        borzo_event_type: "delivered",
      },
    });

    logger.info(
      `SKU ${sku} in order ${orderId} marked as delivered by ${deliveredBy || "system"
      }`
    );

    return sendSuccess(
      res,
      {
        order: updatedOrder,
        skuStatus: "Delivered",
        message: `SKU ${sku} marked as delivered successfully`,
      },
      `SKU ${sku} marked as delivered successfully`
    );
  } catch (error) {
    logger.error("Mark SKU as delivered failed:", error);
    return sendError(res, "Failed to mark SKU as delivered");
  }
};

/**
 * Get order status breakdown by SKU
 */
exports.getOrderStatusBreakdown = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    const statusCalculation = calculateOrderStatus(order.skus);

    const skuBreakdown = order.skus.map((sku) => ({
      sku: sku.sku,
      quantity: sku.quantity,
      status: sku.tracking_info?.status || "Pending",
      timestamps: sku.tracking_info?.timestamps || {},
      dealerMapped: sku.dealerMapped || [],
    }));

    return sendSuccess(
      res,
      {
        orderId: order.orderId,
        currentOrderStatus: order.status,
        calculatedStatus: statusCalculation.status,
        statusReason: statusCalculation.reason,
        skuBreakdown,
        statusCounts: statusCalculation.skuStatuses,
      },
      "Order status breakdown retrieved successfully"
    );
  } catch (error) {
    logger.error("Get order status breakdown failed:", error);
    return sendError(res, "Failed to get order status breakdown");
  }
};

/**
 * Check if all SKUs are finished and mark order as delivered if so
 * This endpoint can be used to manually trigger the check or for testing
 */
exports.checkAndMarkOrderAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    const {
      checkAllSkusFinished,
      markOrderAsDeliveredIfAllFinished,
    } = require("../utils/orderStatusCalculator");

    // First, check the current status
    const finishedCheck = checkAllSkusFinished(order);

    // Then try to mark as delivered if all are finished
    const result = await markOrderAsDeliveredIfAllFinished(orderId);

    return sendSuccess(
      res,
      {
        orderId: order.orderId,
        currentStatus: order.status,
        finishedCheck: finishedCheck,
        result: result,
        message: result.updated
          ? `Order marked as Delivered: ${result.reason}`
          : `Order not yet delivered: ${result.reason}`,
      },
      result.updated
        ? "Order marked as delivered successfully"
        : "Order status checked"
    );
  } catch (error) {
    logger.error(
      `Error checking/marking order ${req.params.orderId} as delivered:`,
      error
    );
    return sendError(res, "Failed to check order delivery status", 500);
  }
};

exports.getOrderStatsCount = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const totalOrders = await Order.countDocuments(dateFilter);

    const totalConfirmed = await Order.countDocuments({
      status: "Confirmed",
      ...dateFilter,
    });
    const totalAssigned = await Order.countDocuments({
      status: "Assigned",
      ...dateFilter,
    });
    const totalShipped = await Order.countDocuments({
      status: "Shipped",
      ...dateFilter,
    });
    const totalDelivered = await Order.countDocuments({
      status: "Delivered",
      ...dateFilter,
    });
    const totalCancelled = await Order.countDocuments({
      status: "Cancelled",
      ...dateFilter,
    });
    const totalReturned = await Order.countDocuments({
      status: "Returned",
      ...dateFilter,
    });

    const statusCountsObj = {
      Confirmed: totalConfirmed,
      Assigned: totalAssigned,
      Shipped: totalShipped,
      Delivered: totalDelivered,
      Cancelled: totalCancelled,
      Returned: totalReturned,
    };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysOrders = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const todaysConfirmed = await Order.countDocuments({
      status: "Confirmed",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todaysAssigned = await Order.countDocuments({
      status: "Assigned",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todaysShipped = await Order.countDocuments({
      status: "Shipped",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todaysDelivered = await Order.countDocuments({
      status: "Delivered",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todaysCancelled = await Order.countDocuments({
      status: "Cancelled",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const todaysReturned = await Order.countDocuments({
      status: "Returned",
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const todaysStatusCountsObj = {
      Confirmed: todaysConfirmed,
      Assigned: todaysAssigned,
      Shipped: todaysShipped,
      Delivered: todaysDelivered,
      Cancelled: todaysCancelled,
      Returned: todaysReturned,
    };

    res.json({
      success: true,
      data: {
        totalOrders,
        statusCounts: statusCountsObj,
        todaysOrders,
        todaysStatusCounts: todaysStatusCountsObj,
        dateRange: {
          startDate: startDate || "all time",
          endDate: endDate || "all time",
        },
      },
    });
  } catch (error) {
    console.error("Order stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
    });
  }
};

exports.getOrderSummaryMonthlyorWeekly = async (req, res) => {
  try {
    const { period = "week" } = req.query; // week, month, year

    // Calculate date ranges for current period
    const now = new Date();
    const currentPeriodStart = getPeriodStartDate(period, now);
    const currentPeriodEnd = new Date(now);

    // Calculate date ranges for previous period
    const previousPeriodStart = new Date(currentPeriodStart);
    const previousPeriodEnd = new Date(currentPeriodStart);

    switch (period) {
      case "week":
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        break;
      case "month":
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
        previousPeriodEnd.setDate(0); // Last day of previous month
        break;
      case "year":
        previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
        previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
        previousPeriodEnd.setMonth(11, 31); // Last day of previous year
        break;
    }

    console.log(`Current Period: ${currentPeriodStart} to ${currentPeriodEnd}`);
    console.log(
      `Previous Period: ${previousPeriodStart} to ${previousPeriodEnd}`
    );

    // Get current period orders
    const currentOrders = await Order.find({
      status: "Delivered",
      createdAt: { $gte: currentPeriodStart, $lte: currentPeriodEnd },
    });

    // Get previous period orders
    const previousOrders = await Order.find({
      status: "Delivered",
      createdAt: {
        $gte: previousPeriodStart,
        $lte: previousPeriodEnd,
      },
    });

    // Calculate statistics
    const currentTotal = currentOrders.reduce(
      (sum, order) => sum + (order.order_Amount || 0),
      0
    );
    const previousTotal = previousOrders.reduce(
      (sum, order) => sum + (order.order_Amount || 0),
      0
    );

    const currentOrderCount = currentOrders.length;
    const previousOrderCount = previousOrders.length;

    // Calculate percentage change
    const amountPercentageChange =
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : currentTotal > 0
          ? 100
          : 0;

    const orderCountPercentageChange =
      previousOrderCount > 0
        ? ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
        : currentOrderCount > 0
          ? 100
          : 0;

    // Get complete time series data for both periods
    const currentTimeSeriesData = await getCompleteTimeSeriesData(
      period,
      currentPeriodStart,
      currentPeriodEnd
    );
    const previousTimeSeriesData = await getCompleteTimeSeriesData(
      period,
      previousPeriodStart,
      previousPeriodEnd
    );

    // Align the data for easy comparison (same number of data points)
    const alignedTimeSeriesData = alignTimeSeriesData(
      currentTimeSeriesData,
      previousTimeSeriesData,
      period
    );

    res.json({
      success: true,
      data: {
        summary: {
          currentTotalAmount: currentTotal,
          previousTotalAmount: previousTotal,
          currentTotalOrders: currentOrderCount,
          previousTotalOrders: previousOrderCount,
          amountPercentageChange: parseFloat(amountPercentageChange.toFixed(1)),
          orderCountPercentageChange: parseFloat(
            orderCountPercentageChange.toFixed(1)
          ),
          comparisonText: `${amountPercentageChange >= 0 ? "+" : ""
            }${amountPercentageChange.toFixed(1)}% than last ${period}`,
        },
        timeSeriesData: alignedTimeSeriesData,
        currentPeriodData: currentTimeSeriesData,
        previousPeriodData: previousTimeSeriesData,
        period: period,
        dateRanges: {
          current: {
            start: currentPeriodStart,
            end: currentPeriodEnd,
          },
          previous: {
            start: previousPeriodStart,
            end: previousPeriodEnd,
          },
        },
      },
    });
  } catch (error) {
    console.error("Order summary error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order summary",
      error: error.message,
    });
  }
};

function getPeriodStartDate(period, date) {
  const result = new Date(date);

  switch (period) {
    case "week":
      // Start of week (Monday)
      result.setDate(
        result.getDate() - result.getDay() + (result.getDay() === 0 ? -6 : 1)
      );
      break;
    case "month":
      result.setDate(1); // Start of month
      break;
    case "year":
      result.setMonth(0, 1); // Start of year
      break;
    default:
      result.setDate(result.getDate() - 7); // Default to week
  }

  result.setHours(0, 0, 0, 0);
  return result;
}

async function getCompleteTimeSeriesData(period, startDate, endDate) {
  let format;

  if (period === "year") {
    format = "%Y-%m"; // Group by year-month
  } else {
    format = "%Y-%m-%d"; // Group by date for daily/weekly/monthly
  }

  try {
    // Get aggregated data from database
    const aggregatedData = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: format,
                date: "$createdAt",
                timezone: "UTC",
              },
            },
          },
          order_Amount: { $sum: "$order_Amount" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.date": 1 },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          order_Amount: 1,
          orderCount: 1,
        },
      },
    ]);

    // Create a map for easy lookup
    const dataMap = new Map();
    aggregatedData.forEach((item) => {
      dataMap.set(item.date, {
        order_Amount: item.order_Amount,
        orderCount: item.orderCount,
      });
    });

    // Generate all dates in the period
    const allDates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      let dateKey;

      if (period === "year") {
        dateKey = currentDate.toISOString().slice(0, 7); // YYYY-MM
      } else {
        dateKey = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD
      }

      allDates.push(dateKey);

      // Move to next day/month
      if (period === "year") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Create complete dataset with 0 values for missing dates
    const completeData = allDates.map((date) => {
      const existingData = dataMap.get(date);

      return {
        date: date,
        order_Amount: existingData ? existingData.order_Amount : 0,
        orderCount: existingData ? existingData.orderCount : 0,
      };
    });

    return completeData;
  } catch (error) {
    console.error("Error in getCompleteTimeSeriesData:", error);
    throw error;
  }
}

function alignTimeSeriesData(currentData, previousData, period) {
  // For proper comparison, we want both arrays to have the same number of data points
  const maxLength = Math.max(currentData.length, previousData.length);
  const alignedData = [];

  for (let i = 0; i < maxLength; i++) {
    const currentItem = currentData[i] || {
      date: "",
      order_Amount: 0,
      orderCount: 0,
    };
    const previousItem = previousData[i] || {
      date: "",
      order_Amount: 0,
      orderCount: 0,
    };

    // Create labels based on period
    let label;
    if (period === "year") {
      label = `Month ${i + 1}`;
    } else if (period === "month") {
      label = `Day ${i + 1}`;
    } else {
      label = getDayName(i); // For week: Monday, Tuesday, etc.
    }

    alignedData.push({
      label: label,
      currentDate: currentItem.date,
      previousDate: previousItem.date,
      currentAmount: currentItem.order_Amount,
      previousAmount: previousItem.order_Amount,
      currentOrders: currentItem.orderCount,
      previousOrders: previousItem.orderCount,
    });
  }

  return alignedData;
}

function getDayName(dayIndex) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return days[dayIndex] || `Day ${dayIndex + 1}`;
}

// Alternative: Get both periods in a single optimized query
async function getBothPeriodsDataOptimized(
  period,
  currentStart,
  currentEnd,
  previousStart,
  previousEnd
) {
  let format;

  if (period === "year") {
    format = "%Y-%m";
  } else {
    format = "%Y-%m-%d";
  }

  try {
    const bothPeriodsData = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          $or: [
            { createdAt: { $gte: currentStart, $lte: currentEnd } },
            { createdAt: { $gte: previousStart, $lte: previousEnd } },
          ],
        },
      },
      {
        $addFields: {
          periodType: {
            $cond: [
              {
                $and: [
                  { $gte: ["$createdAt", currentStart] },
                  { $lte: ["$createdAt", currentEnd] },
                ],
              },
              "current",
              "previous",
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            period: "$periodType",
            date: {
              $dateToString: {
                format: format,
                date: "$createdAt",
                timezone: "UTC",
              },
            },
          },
          order_Amount: { $sum: "$order_Amount" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.period": 1, "_id.date": 1 },
      },
    ]);

    // Separate current and previous period data
    const currentDataMap = new Map();
    const previousDataMap = new Map();

    bothPeriodsData.forEach((item) => {
      if (item._id.period === "current") {
        currentDataMap.set(item._id.date, {
          order_Amount: item.order_Amount,
          orderCount: item.orderCount,
        });
      } else {
        previousDataMap.set(item._id.date, {
          order_Amount: item.order_Amount,
          orderCount: item.orderCount,
        });
      }
    });

    return { currentDataMap, previousDataMap };
  } catch (error) {
    console.error("Error in getBothPeriodsDataOptimized:", error);
    throw error;
  }
}

// Get comprehensive dealer statistics by dealer ID
exports.getDealerStats = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!dealerId) {
      return sendError(res, "Dealer ID is required", 400);
    }

    // Set date range (default to last 30 days if not provided)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    logger.info(
      `Fetching dealer stats for dealerId: ${dealerId} from ${start.toISOString()} to ${end.toISOString()}`
    );

    // Build base query for orders with dealer mapping
    const orderQuery = {
      "skus.dealerMapped.dealerId": dealerId,
      orderDate: { $gte: start, $lte: end },
    };

    // Build picklist query
    const picklistQuery = {
      dealerId: dealerId,
      createdAt: { $gte: start, $lte: end },
    };

    // Get today's date for "today" calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Parallel execution of all queries
    const [
      totalOrders,
      ordersToday,
      pendingOrders,
      deliveredOrders,
      totalPicklists,
      pendingPicklists,
      completedPicklists,
      picklistsToday,
      orderValueStats,
    ] = await Promise.all([
      // Total orders count
      Order.countDocuments(orderQuery),

      // Orders today
      Order.countDocuments({
        ...orderQuery,
        orderDate: { $gte: today, $lt: tomorrow },
      }),

      // Pending orders (orders with any SKU status as Pending)
      Order.countDocuments({
        ...orderQuery,
        "skus.tracking_info.status": "Pending",
      }),

      // Delivered orders (orders with all SKUs delivered)
      Order.aggregate([
        { $match: orderQuery },
        {
          $addFields: {
            allDelivered: {
              $allElementsTrue: {
                $map: {
                  input: "$skus",
                  as: "sku",
                  in: {
                    $eq: ["$$sku.tracking_info.status", "Delivered"],
                  },
                },
              },
            },
          },
        },
        { $match: { allDelivered: true } },
        { $count: "deliveredCount" },
      ]),

      // Total picklists
      PickList.countDocuments(picklistQuery),

      // Pending picklists (Not Started or In Progress)
      PickList.countDocuments({
        ...picklistQuery,
        scanStatus: { $in: ["Not Started", "In Progress"] },
      }),

      // Completed picklists
      PickList.countDocuments({
        ...picklistQuery,
        scanStatus: "Completed",
      }),

      // Picklists created today
      PickList.countDocuments({
        ...picklistQuery,
        createdAt: { $gte: today, $lt: tomorrow },
      }),

      // Order value statistics
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            totalOrderValue: { $sum: "$totalAmount" },
            averageOrderValue: { $avg: "$totalAmount" },
            minOrderValue: { $min: "$totalAmount" },
            maxOrderValue: { $max: "$totalAmount" },
            orderCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Process delivered orders count
    const deliveredCount =
      deliveredOrders.length > 0 ? deliveredOrders[0].deliveredCount : 0;

    // Process order value stats
    const valueStats =
      orderValueStats.length > 0
        ? orderValueStats[0]
        : {
          totalOrderValue: 0,
          averageOrderValue: 0,
          minOrderValue: 0,
          maxOrderValue: 0,
          orderCount: 0,
        };

    // Get additional metrics
    const [cancelledOrders, returnedOrders] = await Promise.all([
      // Cancelled orders
      Order.countDocuments({
        ...orderQuery,
        "skus.tracking_info.status": "Cancelled",
      }),

      // Returned orders
      Order.countDocuments({
        ...orderQuery,
        "skus.return_info.is_returned": true,
      }),
    ]);

    // Calculate completion rate
    const completionRate =
      totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(2) : 0;

    // Calculate picklist completion rate
    const picklistCompletionRate =
      totalPicklists > 0
        ? ((completedPicklists / totalPicklists) * 100).toFixed(2)
        : 0;

    // Prepare response
    const dealerStats = {
      dealerId,
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      orderStats: {
        totalOrders,
        ordersToday,
        pendingOrders,
        deliveredOrders: deliveredCount,
        cancelledOrders,
        returnedOrders,
        completionRate: parseFloat(completionRate),
      },
      picklistStats: {
        totalPicklists,
        pendingPicklists,
        completedPicklists,
        picklistsToday,
        completionRate: parseFloat(picklistCompletionRate),
      },
      financialStats: {
        totalOrderValue: valueStats.totalOrderValue || 0,
        averageOrderValue: valueStats.averageOrderValue || 0,
        minOrderValue: valueStats.minOrderValue || 0,
        maxOrderValue: valueStats.maxOrderValue || 0,
        orderCount: valueStats.orderCount || 0,
      },
      summary: {
        totalRevenue: valueStats.totalOrderValue || 0,
        averageOrderValue: valueStats.averageOrderValue || 0,
        orderCompletionRate: parseFloat(completionRate),
        picklistCompletionRate: parseFloat(picklistCompletionRate),
        activeOrders: pendingOrders,
        totalPicklistsGenerated: totalPicklists,
      },
    };

    logger.info(
      `✅ Dealer stats fetched successfully for dealerId: ${dealerId}`
    );
    sendSuccess(res, dealerStats, "Dealer statistics retrieved successfully");
  } catch (error) {
    logger.error(`❌ Error fetching dealer stats: ${error.message}`);
    sendError(res, "Failed to fetch dealer statistics", 500);
  }
};
