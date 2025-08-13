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
        dealerMapped: [],
      })),
      dealerMapping: [],
    };

    const newOrder = await Order.create(orderPayload);

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
    const { updates } = req.body;

    const results = await Promise.all(
      updates.map(async ({ orderId, status }) => {
        try {
          const updateData = { status };

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

exports.markDealerPackedAndUpdateOrderStatus = async (req, res) => {
  try {
    const { orderId, dealerId } = req.body;

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

    if (!dealerFound) {
      return res.status(404).json({ error: "Dealer not found in this order" });
    }

    const allPacked = order.dealerMapping.every(
      (mapping) => mapping.status === "Packed"
    );

    if (allPacked) {
      order.status = "Packed";
      order.timestamps.packedAt = new Date();
    }

    await order.save();

    // Create Borzo order if all dealers are packed and order has delivery_type
    let borzoOrderResponse = null;
    if (allPacked && order.delivery_type) {
      try {
        // Prepare common order data
        const orderData = {
          matter: "Food", // Default matter
          total_weight_kg: "3", // Default weight
          insurance_amount: "500.00", // Default insurance
          is_client_notification_enabled: true,
          is_contact_person_notification_enabled: true,
          points: [
            {
              address: order.customerDetails?.address || "Pickup Address",
              contact_person: {
                name: order.customerDetails?.name || "Customer",
                phone: order.customerDetails?.phone || "0000000000",
              },
              latitude: 28.57908, // Default coordinates - should be dynamic
              longitude: 77.31912,
              client_order_id: order.orderId,
            },
            {
              address: order.customerDetails?.address || "Delivery Address",
              contact_person: {
                name: order.customerDetails?.name || "Customer",
                phone: order.customerDetails?.phone || "0000000000",
              },
              latitude: 28.583905, // Default coordinates - should be dynamic
              longitude: 77.322733,
              client_order_id: order.orderId,
            },
          ],
        };

        // Call appropriate Borzo function based on delivery_type
        if (order.delivery_type.toLowerCase() === "standard") {
          // Create instant order
          const instantReq = { body: { ...orderData, type: "standard" } };
          const instantRes = {
            status: (code) => ({
              json: (data) => {
                if (code === 200) {
                  borzoOrderResponse = { type: "instant", data };
                } else {
                  console.error("Borzo Instant Order Error:", data);
                }
              },
            }),
          };

          await exports.createOrderBorzoInstant(instantReq, instantRes);
        } else if (order.delivery_type.toLowerCase() === "endofday") {
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
              json: (data) => {
                if (code === 200) {
                  borzoOrderResponse = { type: "endofday", data };
                } else {
                  console.error("Borzo End of Day Order Error:", data);
                }
              },
            }),
          };

          await exports.createOrderBorzoEndofDay(endofdayReq, endofdayRes);
        }
      } catch (borzoError) {
        console.error("Error creating Borzo order:", borzoError);
        // Don't fail the main request if Borzo order creation fails
      }
    }

    return res.json({
      message: "Dealer status updated successfully",
      orderStatus: order.status,
      order: order.toObject(),
      borzoOrder: borzoOrderResponse,
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

    // Calculate new grand total
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
          error: `Point ${
            i + 1
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
          error: `Point ${
            i + 1
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

const createShiprocketOrder = async (req, res) => {};
