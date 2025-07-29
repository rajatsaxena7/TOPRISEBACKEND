const DealerSLA = require("../models/dealerSla");
const Order = require("../models/order");

/**
 * Middleware to automatically set SLA expectations when order is created
 */
exports.setOrderSLAExpectations = async (req, res, next) => {
  try {
    if (req.method === "POST" && req.body.dealerMapping) {
      const dealerId = req.body.dealerMapping[0]?.dealerId;
      if (dealerId) {
        const dealerSLA = await DealerSLA.findOne({ dealer_id: dealerId });
        if (dealerSLA) {
          req.body.slaInfo = {
            slaType: dealerSLA.sla_type,
            expectedFulfillmentTime: calculateExpectedTime(
              new Date(),
              dealerSLA
            ),
            isSLAMet: null,
          };
        }
      }
    }
    next();
  } catch (error) {
    console.error("SLA Expectations Error:", error);
    next();
  }
};

/**
 * Middleware to check for SLA violations when order status changes
 */
exports.checkSLACompliance = async (req, res, next) => {
  try {
    if (
      (req.method === "PATCH" || req.method === "PUT") &&
      req.body.status === "Delivered"
    ) {
      const order = await Order.findById(req.params.orderId);
      if (order && order.slaInfo?.expectedFulfillmentTime) {
        const now = new Date();
        const expectedTime = order.slaInfo.expectedFulfillmentTime;

        if (now > expectedTime) {
          const violationMinutes = Math.round(
            (now - expectedTime) / (1000 * 60)
          );

          // Update order with violation
          req.body.slaInfo = {
            ...order.slaInfo,
            isSLAMet: false,
            violationMinutes,
            actualFulfillmentTime: now,
          };

          // Trigger violation logging
          req.slaViolation = {
            dealer_id: order.dealerMapping[0]?.dealerId,
            order_id: order._id,
            expected_fulfillment_time: expectedTime,
            actual_fulfillment_time: now,
            violation_minutes: violationMinutes,
          };
        }
      }
    }
    next();
  } catch (error) {
    console.error("SLA Compliance Error:", error);
    next();
  }
};

function calculateExpectedTime(orderDate, dealerSLA) {
  const expectedTime = new Date(orderDate);
  expectedTime.setHours(
    expectedTime.getHours() + dealerSLA.sla_type.expected_hours
  );

  // Adjust for dispatch hours
  const fulfillmentHour = expectedTime.getHours();
  if (fulfillmentHour < dealerSLA.dispatch_hours.start) {
    expectedTime.setHours(dealerSLA.dispatch_hours.start, 0, 0, 0);
  } else if (fulfillmentHour > dealerSLA.dispatch_hours.end) {
    expectedTime.setDate(expectedTime.getDate() + 1);
    expectedTime.setHours(dealerSLA.dispatch_hours.start, 0, 0, 0);
  }

  return expectedTime;
}
