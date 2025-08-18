const SLAViolation = require("../models/slaViolation");
const DealerSLA = require("../models/dealerSla");
const SLAType = require("../models/slaType");
const logger = require("/packages/utils/logger");

/**
 * Calculate expected fulfillment time based on dealer SLA configuration
 * @param {Date} orderDate - When the order was created
 * @param {Object} dealerSLA - Dealer SLA configuration
 * @returns {Date} Expected fulfillment time
 */
function calculateExpectedFulfillmentTime(orderDate, dealerSLA) {
  if (!dealerSLA || !dealerSLA.sla_type) {
    return null;
  }

  const expectedTime = new Date(orderDate);
  
  // Add expected hours from SLA type
  if (dealerSLA.sla_type.expected_hours) {
    expectedTime.setHours(expectedTime.getHours() + dealerSLA.sla_type.expected_hours);
  }

  // Adjust for dispatch hours if configured
  if (dealerSLA.dispatch_hours) {
    const fulfillmentHour = expectedTime.getHours();
    if (fulfillmentHour < dealerSLA.dispatch_hours.start) {
      expectedTime.setHours(dealerSLA.dispatch_hours.start, 0, 0, 0);
    } else if (fulfillmentHour > dealerSLA.dispatch_hours.end) {
      expectedTime.setDate(expectedTime.getDate() + 1);
      expectedTime.setHours(dealerSLA.dispatch_hours.start, 0, 0, 0);
    }
  }

  return expectedTime;
}

/**
 * Check if order packing violates SLA
 * @param {Object} order - Order object
 * @param {Date} packedAt - When the order was packed
 * @returns {Object} SLA violation details
 */
async function checkSLAViolationOnPacking(order, packedAt) {
  try {
    if (!order || !order.dealerMapping || order.dealerMapping.length === 0) {
      return { hasViolation: false, violation: null };
    }

    // Get the first dealer (assuming single dealer per order for now)
    const dealerId = order.dealerMapping[0]?.dealerId;
    if (!dealerId) {
      return { hasViolation: false, violation: null };
    }

    // Get dealer SLA configuration
    const dealerSLA = await DealerSLA.findOne({ dealer_id: dealerId }).populate('sla_type');
    if (!dealerSLA || !dealerSLA.is_active) {
      return { hasViolation: false, violation: null };
    }

    // Calculate expected fulfillment time
    const orderDate = order.orderDate || order.createdAt || new Date();
    const expectedFulfillmentTime = calculateExpectedFulfillmentTime(orderDate, dealerSLA);
    
    if (!expectedFulfillmentTime) {
      return { hasViolation: false, violation: null };
    }

    // Check if packing time exceeds expected fulfillment time
    const packedAtDate = new Date(packedAt);
    const violationMinutes = Math.round((packedAtDate - expectedFulfillmentTime) / (1000 * 60));
    
    const hasViolation = violationMinutes > 0;

    if (hasViolation) {
      return {
        hasViolation: true,
        violation: {
          dealer_id: dealerId,
          order_id: order._id,
          expected_fulfillment_time: expectedFulfillmentTime,
          actual_fulfillment_time: packedAtDate,
          violation_minutes: violationMinutes,
          notes: `SLA violation detected when order was packed. Expected: ${expectedFulfillmentTime.toISOString()}, Actual: ${packedAtDate.toISOString()}`
        }
      };
    }

    return { hasViolation: false, violation: null };
  } catch (error) {
    logger.error("Error checking SLA violation on packing:", error);
    return { hasViolation: false, violation: null, error: error.message };
  }
}

/**
 * Record SLA violation in database
 * @param {Object} violationData - Violation details
 * @returns {Object} Created violation record
 */
async function recordSLAViolation(violationData) {
  try {
    const violation = new SLAViolation({
      dealer_id: violationData.dealer_id,
      order_id: violationData.order_id,
      expected_fulfillment_time: violationData.expected_fulfillment_time,
      actual_fulfillment_time: violationData.actual_fulfillment_time,
      violation_minutes: violationData.violation_minutes,
      notes: violationData.notes,
      resolved: false
    });

    await violation.save();
    logger.info(`SLA violation recorded for order ${violationData.order_id}: ${violationData.violation_minutes} minutes`);
    
    return violation;
  } catch (error) {
    logger.error("Error recording SLA violation:", error);
    throw error;
  }
}

/**
 * Update order with SLA violation information
 * @param {String} orderId - Order ID
 * @param {Object} violationData - Violation details
 * @returns {Object} Updated order
 */
async function updateOrderWithSLAViolation(orderId, violationData) {
  try {
    const Order = require("../models/order");
    
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        "slaInfo.actualFulfillmentTime": violationData.actual_fulfillment_time,
        "slaInfo.isSLAMet": false,
        "slaInfo.violationMinutes": violationData.violation_minutes,
        "slaInfo.expectedFulfillmentTime": violationData.expected_fulfillment_time
      },
      { new: true }
    );

    logger.info(`Order ${orderId} updated with SLA violation information`);
    return updatedOrder;
  } catch (error) {
    logger.error("Error updating order with SLA violation:", error);
    throw error;
  }
}

module.exports = {
  checkSLAViolationOnPacking,
  recordSLAViolation,
  updateOrderWithSLAViolation,
  calculateExpectedFulfillmentTime
};
