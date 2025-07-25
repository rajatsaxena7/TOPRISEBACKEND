const Order = require("../models/order");
const PickList = require("../models/pickList");
const dealerAssignmentQueue = require("../queues/assignmentQueue");
const { v4: uuidv4 } = require("uuid"); // npm install uuid
const Cart = require("../models/cart");

const {
  cacheGet,
  cacheSet,
  cacheDel, // ⬅️ writer-side “del” helper
} = require("/packages/utils/cache");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const Redis = require("redis");
const axios = require("axios");
const redisClient = require("/packages/utils/redisClient");

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL ||
  "http://user-service:5001/api/users/api/users";

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
exports.createOrder = async (req, res) => {
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

    // 3. Persist the order
    const newOrder = await Order.create(orderPayload);

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
      }
    }

    // 5. Return the created order
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

    return sendSuccess(res, order, "Items assigned to dealers successfully");
  } catch (error) {
    logger.error("Assignment failed:", error);
    return sendError(res, "Failed to assign items to dealers");
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
    const picklists = await PickList.find().lean();

    for (let pick of picklists) {
      pick.dealerInfo = await fetchDealer(pick.dealerId);
    }

    return sendSuccess(res, picklists, "Picklists fetched");
  } catch (err) {
    return sendError(res, "Failed to get picklists", 500);
  }
};

exports.getPickListByDealer = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const picklists = await PickList.find({ dealerId }).lean();

    const dealerInfo = await fetchDealer(dealerId);
    for (let pick of picklists) {
      pick.dealerInfo = dealerInfo;
    }

    return sendSuccess(res, picklists, "Dealer picklists fetched");
  } catch (err) {
    return sendError(res, "Failed to get picklists for dealer", 500);
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
    }).lean();
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

exports.getOrder;
