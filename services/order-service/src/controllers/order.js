const Order = require("../models/order");
const PickList = require("../models/pickList");
const dealerAssignmentQueue = require("../queues/assignmentQueue");
const { v4: uuidv4 } = require("uuid"); // npm install uuid
const Cart = require("../models/cart");
const { Parser } = require("json2csv");

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
} = require("../../../../packages/utils/notificationService");
const {
  checkSLAViolationOnPacking,
  recordSLAViolation,
  updateOrderWithSLAViolation,
} = require("../utils/slaViolationUtils");
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL ||
  "http://user-service:5001/api/users/api/users";
const { updateSkuStatus, calculateOrderStatus } = require("../utils/orderStatusCalculator");

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
        const userData = await axios.get(
          "http://user-service:5001/api/users/allUsers/internal",
          {
            headers: { Authorization: req.headers.authorization },
          }
        );
        const ids = userData.data.data
          .filter((u) =>
            ["Super-admin"].includes(
              u.role
            )
          )
          .map((u) => u._id);

        const notify =
          await createUnicastOrMulticastNotificationUtilityFunction(
            ids,
            ["INAPP", "PUSH"],
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
            packedAt: packedAt
          }
        });
      }
    } else {
      // Mark all SKUs as packed (legacy behavior)
      for (const sku of currentOrder.skus) {
        updatedOrder = await updateSkuStatus(orderId, sku.sku, "Packed", {
          timestamps: {
            packedAt: packedAt
          }
        });
      }
    }

    // Check for SLA violation after marking as packed
    const slaCheck = await checkSLAViolationOnPacking(updatedOrder, packedAt);

    let responseData = {
      order: updatedOrder,
      message: "Order SKUs marked as packed successfully"
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
        responseData.warning = "Order packed successfully but failed to record SLA violation";
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
            deliveredAt: new Date()
          },
          borzoData: {
            borzo_tracking_status: "Delivered",
            borzo_event_type: "delivered"
          }
        });
      }
    } else {
      // Mark all SKUs as delivered (legacy behavior)
      for (const sku of currentOrder.skus) {
        updatedOrder = await updateSkuStatus(orderId, sku.sku, "Delivered", {
          timestamps: {
            deliveredAt: new Date()
          },
          borzoData: {
            borzo_tracking_status: "Delivered",
            borzo_event_type: "delivered"
          }
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
    if (updatedOrder.status === "Delivered" && updatedOrder.slaInfo?.expectedFulfillmentTime) {
      const violationMinutes = Math.round(
        (new Date() - updatedOrder.slaInfo.expectedFulfillmentTime) / (1000 * 60)
      );

      updatedOrder.slaInfo.isSLAMet = violationMinutes <= 0;
      updatedOrder.slaInfo.violationMinutes = Math.max(0, violationMinutes);
      await updatedOrder.save();
    }

    return sendSuccess(res, updatedOrder, "Order SKUs marked as delivered successfully");
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
    const { startDate, endDate } = req.query;

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

    // Calculate total revenue for the period
    const revenueData = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          averageOrderValue: { $avg: "$grandTotal" },
        },
      },
    ]);

    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue || 0 : 0;
    const averageOrderValue =
      revenueData.length > 0 ? revenueData[0].averageOrderValue || 0 : 0;

    // Get recent orders (last 10)
    const recentOrders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderId status grandTotal createdAt customerName");

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
        customerName: order.customerName || "",
      })),
    };

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

    if (!dealerFound) {
      return res.status(404).json({ error: "Dealer not found in this order" });
    }

    const allPacked = order.dealerMapping.every(
      (mapping) => mapping.status === "Packed"
    );

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

    // Create Borzo order if all dealers are packed and order has delivery_type
    let borzoOrderResponse = null;
    if (allPacked && order.delivery_type) {
      try {
        // Prepare common order data
        const orderData = {
          matter: "Food", // Default matter
          total_weight_kg: total_weight_kg || "3", // Dynamic weight from request body
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
              json: async (data) => {
                if (code === 200) {
                  borzoOrderResponse = { type: "instant", data };
                  // Store Borzo order ID in the order and SKUs
                  if (data.order_id) {
                    console.log(
                      `Storing Borzo order ID: ${data.order_id} for order: ${order.orderId}`
                    );

                    // Update order-level tracking
                    order.order_track_info = {
                      ...order.order_track_info,
                      borzo_order_id: data.order_id.toString(),
                    };

                    // Update SKU-level tracking
                    if (order.skus && order.skus.length > 0) {
                      order.skus.forEach((sku, index) => {
                        if (!sku.tracking_info) {
                          sku.tracking_info = {};
                        }
                        sku.tracking_info.borzo_order_id =
                          data.order_id.toString();
                        sku.tracking_info.status = "Confirmed";
                        if (!sku.tracking_info.timestamps) {
                          sku.tracking_info.timestamps = {};
                        }
                        sku.tracking_info.timestamps.confirmedAt = new Date();
                      });
                    }

                    await order.save();
                    console.log(
                      `Successfully saved Borzo order ID: ${data.order_id} for order: ${order.orderId} and ${order.skus.length} SKUs`
                    );
                  }
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
                    };

                    // Update SKU-level tracking
                    if (order.skus && order.skus.length > 0) {
                      order.skus.forEach((sku, index) => {
                        if (!sku.tracking_info) {
                          sku.tracking_info = {};
                        }
                        sku.tracking_info.borzo_order_id =
                          data.order_id.toString();
                        sku.tracking_info.status = "Confirmed";
                        if (!sku.tracking_info.timestamps) {
                          sku.tracking_info.timestamps = {};
                        }
                        sku.tracking_info.timestamps.confirmedAt = new Date();
                      });
                    }

                    await order.save();
                    console.log(
                      `Successfully saved Borzo order ID: ${data.order_id} for order: ${order.orderId} and ${order.skus.length} SKUs`
                    );
                  }
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
      console.log(`Checking if all SKUs are finished for order ${order.orderId}`);
      
      // Use the utility function to check and mark order as delivered if all SKUs are finished
      const { markOrderAsDeliveredIfAllFinished } = require("../utils/orderStatusCalculator");
      
      const result = await markOrderAsDeliveredIfAllFinished(order._id);
      
      if (result.updated) {
        updatedOrder = result.order;
        orderStatusUpdate.status = "Delivered";
        console.log(`✅ Order ${order.orderId} marked as Delivered: ${result.reason}`);
      } else {
        console.log(`⏳ Order ${order.orderId} not yet delivered: ${result.reason}`);
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
          reason: `Borzo order status updated to: ${
            borzoData?.status || "Unknown"
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
        packedAt: new Date()
      }
    });

    // Log the packing action
    logger.info(`SKU ${sku} in order ${orderId} marked as packed by ${packedBy || 'system'}`);

    // Check for SLA violation (existing logic)
    const slaCheck = await checkSLAViolationOnPacking(updatedOrder, new Date());

    let responseData = {
      order: updatedOrder,
      skuStatus: "Packed",
      message: `SKU ${sku} marked as packed successfully`
    };

    // If SLA violation detected, record it
    if (slaCheck.hasViolation && slaCheck.violation) {
      try {
        const violationRecord = await recordSLAViolation(slaCheck.violation);
        await updateOrderWithSLAViolation(orderId, slaCheck.violation);
        
        responseData.slaViolation = violationRecord;
        responseData.message += `. SLA violation detected: ${slaCheck.violation.violation_minutes} minutes late.`;
      } catch (violationError) {
        logger.error("Failed to record SLA violation:", violationError);
        responseData.warning = "SKU packed successfully but failed to record SLA violation";
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

    // Update SKU status to shipped
    const updatedOrder = await updateSkuStatus(orderId, sku, "Shipped", {
      timestamps: {
        shippedAt: new Date()
      },
      borzoData: {
        borzo_tracking_number: trackingNumber,
        borzo_tracking_status: "Shipped"
      }
    });

    logger.info(`SKU ${sku} in order ${orderId} marked as shipped by ${shippedBy || 'system'}`);

    return sendSuccess(res, {
      order: updatedOrder,
      skuStatus: "Shipped",
      message: `SKU ${sku} marked as shipped successfully`
    }, `SKU ${sku} marked as shipped successfully`);
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
        deliveredAt: new Date()
      },
      borzoData: {
        borzo_tracking_status: "Delivered",
        borzo_event_type: "delivered"
      }
    });

    logger.info(`SKU ${sku} in order ${orderId} marked as delivered by ${deliveredBy || 'system'}`);

    return sendSuccess(res, {
      order: updatedOrder,
      skuStatus: "Delivered",
      message: `SKU ${sku} marked as delivered successfully`
    }, `SKU ${sku} marked as delivered successfully`);
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
    
    const skuBreakdown = order.skus.map(sku => ({
      sku: sku.sku,
      quantity: sku.quantity,
      status: sku.tracking_info?.status || "Pending",
      timestamps: sku.tracking_info?.timestamps || {},
      dealerMapped: sku.dealerMapped || []
    }));

    return sendSuccess(res, {
      orderId: order.orderId,
      currentOrderStatus: order.status,
      calculatedStatus: statusCalculation.status,
      statusReason: statusCalculation.reason,
      skuBreakdown,
      statusCounts: statusCalculation.skuStatuses
    }, "Order status breakdown retrieved successfully");
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

    const { checkAllSkusFinished, markOrderAsDeliveredIfAllFinished } = require("../utils/orderStatusCalculator");
    
    // First, check the current status
    const finishedCheck = checkAllSkusFinished(order);
    
    // Then try to mark as delivered if all are finished
    const result = await markOrderAsDeliveredIfAllFinished(orderId);

    return sendSuccess(res, {
      orderId: order.orderId,
      currentStatus: order.status,
      finishedCheck: finishedCheck,
      result: result,
      message: result.updated ? 
        `Order marked as Delivered: ${result.reason}` : 
        `Order not yet delivered: ${result.reason}`
    }, result.updated ? "Order marked as delivered successfully" : "Order status checked");
  } catch (error) {
    logger.error(`Error checking/marking order ${req.params.orderId} as delivered:`, error);
    return sendError(res, "Failed to check order delivery status", 500);
  }
};
