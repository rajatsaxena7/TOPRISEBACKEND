const Order = require("../models/order");
const PickList = require("../models/pickList");
const dealerAssignmentQueue = require("../queues/assignmentQueue");
const { v4: uuidv4 } = require("uuid"); // npm install uuid
const Cart = require("../models/cart");
const { Parser } = require("json2csv");

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
const {
  createUnicastOrMulticastNotificationUtilityFunction,
} = require("../../../../packages/utils/notificationService");
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
        // await cart.save();
        logger.info(
          `✅ Cart cleared for user: ${req.body.customerDetails.userId}`
        );
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
              order_id: orderId,
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

    // Update dealerMapping with new assignments
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

exports.markAsPacked = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "Packed",
        "timestamps.packedAt": new Date(),
      },
      { new: true }
    );

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    return sendSuccess(res, order, "Order marked as packed");
  } catch (error) {
    logger.error("Mark as packed failed:", error);
    return sendError(res, "Failed to mark order as packed");
  }
};

exports.markAsDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryProof } = req.body; // Optional delivery proof (image URL, signature, etc.)

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "Delivered",
        "timestamps.deliveredAt": new Date(),
        "slaInfo.actualFulfillmentTime": new Date(),
        deliveryProof,
      },
      { new: true }
    );

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    // Calculate SLA compliance
    if (order.slaInfo?.expectedFulfillmentTime) {
      const violationMinutes = Math.round(
        (new Date() - order.slaInfo.expectedFulfillmentTime) / (1000 * 60)
      );

      order.slaInfo.isSLAMet = violationMinutes <= 0;
      order.slaInfo.violationMinutes = Math.max(0, violationMinutes);
      await order.save();
    }

    return sendSuccess(res, order, "Order marked as delivered");
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
    const { updates } = req.body; // Array of { orderId, status }

    const results = await Promise.all(
      updates.map(async ({ orderId, status }) => {
        try {
          const updateData = { status };

          // Set appropriate timestamp based on status
          if (status === "Packed")
            updateData["timestamps.packedAt"] = new Date();
          if (status === "Shipped")
            updateData["timestamps.shippedAt"] = new Date();
          if (status === "Delivered") {
            updateData["timestamps.deliveredAt"] = new Date();
            updateData["slaInfo.actualFulfillmentTime"] = new Date();
          }

          const order = await Order.findByIdAndUpdate(orderId, updateData, {
            new: true,
          });
          return { orderId, success: true, order };
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
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const metrics = await Order.aggregate([
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
        },
      },
    ]);

    return sendSuccess(res, metrics[0] || {}, "Fulfillment metrics fetched");
  } catch (error) {
    logger.error("Get fulfillment metrics failed:", error);
    return sendError(res, "Failed to get fulfillment metrics");
  }
};

exports.getSLAComplianceReport = async (req, res) => {
  try {
    const { dealerId, startDate, endDate } = req.query;

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

    const report = await Order.aggregate([
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
        },
      },
    ]);

    return sendSuccess(res, report, "SLA compliance report fetched");
  } catch (error) {
    logger.error("Get SLA compliance report failed:", error);
    return sendError(res, "Failed to get SLA compliance report");
  }
};

exports.getDealerPerformance = async (req, res) => {
  try {
    const { dealerId, startDate, endDate } = req.query;

    const matchStage = { "dealerMapping.dealerId": dealerId };
    if (startDate || endDate) {
      matchStage["timestamps.createdAt"] = {};
      if (startDate)
        matchStage["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) matchStage["timestamps.createdAt"].$lte = new Date(endDate);
    }

    const performance = await Order.aggregate([
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
          totalOrders: 1,
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
        },
      },
    ]);

    return sendSuccess(res, performance[0] || {}, "Dealer performance fetched");
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
    const now = new Date();

    const [
      totalOrders,
      totalRevenue,
      revenueByDay,
      revenueByWeek,
      revenueByMonth,
      topOrderDay,
      averageOrderValue,
      mostFrequentSource,
      mostFrequentType,
      mostFrequentPayment,
      cancelledOrdersTrend,
      dealerKpis,
      slaBreachTrend,
    ] = await Promise.all([
      Order.countDocuments(),

      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$order_Amount" },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setDate(now.getDate() - 30)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            total: { $sum: "$order_Amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setDate(now.getDate() - 84)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              week: { $isoWeek: "$createdAt" },
            },
            total: { $sum: "$order_Amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(new Date().setMonth(now.getMonth() - 12)),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: "$order_Amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$order_Amount" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            aov: {
              $cond: [
                { $eq: ["$count", 0] },
                0,
                { $divide: ["$total", "$count"] },
              ],
            },
          },
        },
      ]),

      Order.aggregate([
        { $group: { _id: "$orderSource", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      Order.aggregate([
        { $group: { _id: "$orderType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      Order.aggregate([
        { $group: { _id: "$paymentType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),

      Order.aggregate([
        {
          $match: { status: "Cancelled" },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Order.aggregate([
        { $unwind: "$dealerMapping" },
        {
          $group: {
            _id: "$dealerMapping.dealerId",
            totalOrders: { $sum: 1 },
            revenue: { $sum: "$order_Amount" },
          },
        },
        {
          $project: {
            dealerId: "$_id",
            totalOrders: 1,
            revenue: 1,
          },
        },
        { $sort: { totalOrders: -1 } },
      ]),

      Order.aggregate([
        {
          $match: {
            "slaInfo.isSLAMet": false,
            "slaInfo.violationMinutes": { $gt: 0 },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            breaches: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return sendSuccess(res, {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue: averageOrderValue[0]?.aov || 0,
      revenueByDay,
      revenueByWeek,
      revenueByMonth,
      topOrderDay: topOrderDay[0]?._id || null,
      topOrderCount: topOrderDay[0]?.count || 0,
      mostFrequentSource: mostFrequentSource[0]?._id || null,
      mostFrequentType: mostFrequentType[0]?._id || null,
      mostFrequentPayment: mostFrequentPayment[0]?._id || null,
      cancelledOrdersTrend,
      dealerKpis,
      slaBreachTrend,
    });
  } catch (error) {
    logger.error("Failed to fetch extended order stats:", error);
    return sendError(res, "Failed to fetch extended order stats");
  }
};

exports.createReturnRequest = async (req, res) => {};

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

    // Date range
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
