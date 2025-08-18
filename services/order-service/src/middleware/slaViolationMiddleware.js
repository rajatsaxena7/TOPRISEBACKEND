const SLAViolation = require("../models/slaViolation");
const DealerSLA = require("../models/dealerSla");
const Order = require("../models/order");
const logger = require("/packages/utils/logger");

/**
 * Middleware to automatically check and record SLA violations
 * Runs on order status updates and can be scheduled
 */
const slaViolationMiddleware = {
  /**
   * Check SLA violations for all active orders
   * This can be called periodically or on specific events
   */
  async checkAllActiveOrders() {
    try {
      logger.info("Starting SLA violation check for all active orders...");
      
      // Get all orders that are not delivered/cancelled and have dealer assignments
      const activeOrders = await Order.find({
        status: { $nin: ["Delivered", "Cancelled", "Returned"] },
        "dealerMapping.0": { $exists: true },
        "dealerMapping.dealerId": { $exists: true, $ne: null }
      }).populate("dealerMapping.dealerId");

      let violationCount = 0;
      let processedCount = 0;

      for (const order of activeOrders) {
        try {
          const hasViolation = await this.checkOrderSLAViolation(order);
          if (hasViolation) {
            violationCount++;
          }
          processedCount++;
        } catch (error) {
          logger.error(`Error checking SLA for order ${order.orderId}:`, error);
        }
      }

      logger.info(`SLA violation check completed. Processed: ${processedCount}, Violations found: ${violationCount}`);
      return { processedCount, violationCount };
    } catch (error) {
      logger.error("Error in checkAllActiveOrders:", error);
      throw error;
    }
  },

  /**
   * Check SLA violation for a specific order
   * @param {Object} order - Order object
   * @returns {Boolean} - True if violation was detected and recorded
   */
  async checkOrderSLAViolation(order) {
    try {
      if (!order || !order.dealerMapping || order.dealerMapping.length === 0) {
        return false;
      }

      const now = new Date();
      const orderDate = order.orderDate || order.createdAt || order.timestamps?.createdAt;
      
      if (!orderDate) {
        logger.warn(`Order ${order.orderId} has no order date, skipping SLA check`);
        return false;
      }

      // Check each dealer assignment for SLA violations
      for (const dealerMapping of order.dealerMapping) {
        const dealerId = dealerMapping.dealerId;
        if (!dealerId) continue;

        // Get dealer SLA configuration
        const dealerSLA = await DealerSLA.findOne({ 
          dealer_id: dealerId.toString(),
          is_active: true 
        }).populate('sla_type');

        if (!dealerSLA || !dealerSLA.sla_type) {
          logger.debug(`No SLA configuration found for dealer ${dealerId}`);
          continue;
        }

        // Calculate expected fulfillment time
        const expectedFulfillmentTime = this.calculateExpectedFulfillmentTime(orderDate, dealerSLA);
        if (!expectedFulfillmentTime) continue;

        // Check if current time exceeds expected fulfillment time
        if (now > expectedFulfillmentTime) {
          // Check if violation already exists for this order-dealer combination
          const existingViolation = await SLAViolation.findOne({
            order_id: order._id,
            dealer_id: dealerId,
            resolved: false
          });

          if (!existingViolation) {
            // Calculate violation minutes
            const violationMinutes = Math.round((now - expectedFulfillmentTime) / (1000 * 60));
            
            // Record the violation
            await this.recordSLAViolation({
              dealer_id: dealerId,
              order_id: order._id,
              expected_fulfillment_time: expectedFulfillmentTime,
              actual_fulfillment_time: now,
              violation_minutes: violationMinutes,
              notes: `Automatic SLA violation detection. Order not fulfilled within expected time. Expected: ${expectedFulfillmentTime.toISOString()}, Current: ${now.toISOString()}`
            });

            // Update order with violation information
            await this.updateOrderWithSLAViolation(order._id, {
              expected_fulfillment_time: expectedFulfillmentTime,
              actual_fulfillment_time: now,
              violation_minutes: violationMinutes
            });

            logger.info(`SLA violation recorded for order ${order.orderId}, dealer ${dealerId}: ${violationMinutes} minutes late`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error(`Error checking SLA violation for order ${order.orderId}:`, error);
      return false;
    }
  },

  /**
   * Calculate expected fulfillment time based on dealer SLA configuration
   * @param {Date} orderDate - When the order was created
   * @param {Object} dealerSLA - Dealer SLA configuration
   * @returns {Date} Expected fulfillment time
   */
  calculateExpectedFulfillmentTime(orderDate, dealerSLA) {
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
  },

  /**
   * Record SLA violation in database
   * @param {Object} violationData - Violation details
   * @returns {Object} Created violation record
   */
  async recordSLAViolation(violationData) {
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
  },

  /**
   * Update order with SLA violation information
   * @param {String} orderId - Order ID
   * @param {Object} violationData - Violation details
   * @returns {Object} Updated order
   */
  async updateOrderWithSLAViolation(orderId, violationData) {
    try {
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
  },

  /**
   * Express middleware to check SLA violations on specific routes
   * Can be used to check violations when orders are updated
   */
  checkSLAOnOrderUpdate() {
    return async (req, res, next) => {
      try {
        // Only check on order status updates
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const orderId = req.params.orderId || req.body.orderId;
          
          if (orderId) {
            const order = await Order.findById(orderId);
            if (order) {
              // Run SLA check in background (don't block the request)
              setImmediate(async () => {
                try {
                  await this.checkOrderSLAViolation(order);
                } catch (error) {
                  logger.error(`Background SLA check failed for order ${orderId}:`, error);
                }
              });
            }
          }
        }
        
        next();
      } catch (error) {
        logger.error("Error in SLA middleware:", error);
        next(); // Don't block the request if SLA check fails
      }
    };
  },

  /**
   * Get orders that are approaching SLA violation (within warning threshold)
   * @param {Number} warningMinutes - Minutes before SLA violation to warn
   * @returns {Array} Orders approaching SLA violation
   */
  async getOrdersApproachingSLAViolation(warningMinutes = 30) {
    try {
      const now = new Date();
      const warningTime = new Date(now.getTime() + (warningMinutes * 60 * 1000));
      
      const activeOrders = await Order.find({
        status: { $nin: ["Delivered", "Cancelled", "Returned"] },
        "dealerMapping.0": { $exists: true }
      });

      const approachingViolations = [];

      for (const order of activeOrders) {
        const orderDate = order.orderDate || order.createdAt || order.timestamps?.createdAt;
        if (!orderDate) continue;

        for (const dealerMapping of order.dealerMapping) {
          const dealerId = dealerMapping.dealerId;
          if (!dealerId) continue;

          const dealerSLA = await DealerSLA.findOne({ 
            dealer_id: dealerId.toString(),
            is_active: true 
          }).populate('sla_type');

          if (!dealerSLA || !dealerSLA.sla_type) continue;

          const expectedFulfillmentTime = this.calculateExpectedFulfillmentTime(orderDate, dealerSLA);
          if (!expectedFulfillmentTime) continue;

          // Check if order is approaching SLA violation
          if (expectedFulfillmentTime <= warningTime && expectedFulfillmentTime > now) {
            const minutesUntilViolation = Math.round((expectedFulfillmentTime - now) / (1000 * 60));
            
            approachingViolations.push({
              orderId: order.orderId,
              order_id: order._id,
              dealerId: dealerId,
              expectedFulfillmentTime,
              minutesUntilViolation,
              orderStatus: order.status
            });
          }
        }
      }

      return approachingViolations;
    } catch (error) {
      logger.error("Error getting orders approaching SLA violation:", error);
      throw error;
    }
  }
};

module.exports = slaViolationMiddleware;
