const logger = require("/packages/utils/logger");

/**
 * Calculate order status based on individual SKU statuses
 * @param {Array} skus - Array of SKUs with tracking_info.status
 * @returns {Object} - { status: string, reason: string, skuStatuses: object }
 */
function calculateOrderStatus(skus) {
  if (!skus || skus.length === 0) {
    return {
      status: "Confirmed",
      reason: "No SKUs found",
      skuStatuses: {}
    };
  }

  // Count SKUs by status
  const statusCounts = {};
  const skuStatuses = {};
  
  skus.forEach((sku, index) => {
    const skuStatus = sku.tracking_info?.status || "Pending";
    statusCounts[skuStatus] = (statusCounts[skuStatus] || 0) + 1;
    skuStatuses[sku.sku] = skuStatus;
  });

  const totalSkus = skus.length;
  
  // Check for cancelled/returned orders
  if (statusCounts["Cancelled"] === totalSkus) {
    return {
      status: "Cancelled",
      reason: "All SKUs are cancelled",
      skuStatuses
    };
  }
  
  if (statusCounts["Returned"] === totalSkus) {
    return {
      status: "Returned",
      reason: "All SKUs are returned",
      skuStatuses
    };
  }

  // Check if all SKUs are delivered
  if (statusCounts["Delivered"] === totalSkus) {
    return {
      status: "Delivered",
      reason: "All SKUs are delivered",
      skuStatuses
    };
  }

  // Check if any SKU is delivered (partial delivery)
  if (statusCounts["Delivered"] > 0) {
    return {
      status: "Shipped",
      reason: `Partial delivery: ${statusCounts["Delivered"]}/${totalSkus} SKUs delivered`,
      skuStatuses
    };
  }

  // Check if all SKUs are packed
  if (statusCounts["Packed"] === totalSkus) {
    return {
      status: "Shipped",
      reason: "All SKUs are packed and ready for shipping",
      skuStatuses
    };
  }

  // Check if any SKU is packed (partial packing)
  if (statusCounts["Packed"] > 0) {
    return {
      status: "Packed",
      reason: `Partial packing: ${statusCounts["Packed"]}/${totalSkus} SKUs packed`,
      skuStatuses
    };
  }

  // Check if all SKUs are assigned
  if (statusCounts["Assigned"] === totalSkus) {
    return {
      status: "Assigned",
      reason: "All SKUs are assigned to dealers",
      skuStatuses
    };
  }

  // Check if any SKU is assigned (partial assignment)
  if (statusCounts["Assigned"] > 0) {
    return {
      status: "Assigned",
      reason: `Partial assignment: ${statusCounts["Assigned"]}/${totalSkus} SKUs assigned`,
      skuStatuses
    };
  }

  // Check if all SKUs are confirmed
  if (statusCounts["Confirmed"] === totalSkus) {
    return {
      status: "Confirmed",
      reason: "All SKUs are confirmed",
      skuStatuses
    };
  }

  // Default to confirmed if any SKU is confirmed
  if (statusCounts["Confirmed"] > 0) {
    return {
      status: "Confirmed",
      reason: `Partial confirmation: ${statusCounts["Confirmed"]}/${totalSkus} SKUs confirmed`,
      skuStatuses
    };
  }

  // Default to pending
  return {
    status: "Confirmed",
    reason: "All SKUs are pending",
    skuStatuses
  };
}

/**
 * Update order status based on SKU statuses
 * @param {Object} order - Order object
 * @returns {Object} - Updated order with new status
 */
async function updateOrderStatusFromSkus(order) {
  try {
    const statusCalculation = calculateOrderStatus(order.skus);
    const newStatus = statusCalculation.status;
    
    // Only update if status has changed
    if (order.status !== newStatus) {
      logger.info(`Order ${order.orderId} status changing from ${order.status} to ${newStatus}: ${statusCalculation.reason}`);
      
      // Update order status and add timestamp if needed
      const updateData = {
        status: newStatus
      };
      
      // Add appropriate timestamp based on new status
      if (newStatus === "Shipped" && order.status !== "Shipped") {
        updateData["timestamps.shippedAt"] = new Date();
      } else if (newStatus === "Delivered" && order.status !== "Delivered") {
        updateData["timestamps.deliveredAt"] = new Date();
        updateData["slaInfo.actualFulfillmentTime"] = new Date();
      }
      
      // Update the order
      const updatedOrder = await order.constructor.findByIdAndUpdate(
        order._id,
        updateData,
        { new: true }
      );
      
      return updatedOrder;
    }
    
    return order;
  } catch (error) {
    logger.error(`Error updating order status for order ${order.orderId}:`, error);
    throw error;
  }
}

/**
 * Update individual SKU status and recalculate order status
 * @param {String} orderId - Order ID
 * @param {String} sku - SKU to update
 * @param {String} newStatus - New status for the SKU
 * @param {Object} additionalData - Additional data to update (timestamps, etc.)
 * @returns {Object} - Updated order
 */
async function updateSkuStatus(orderId, sku, newStatus, additionalData = {}) {
  try {
    const Order = require("../models/order");
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error("Order not found");
    }
    
    // Find the SKU in the order
    const skuIndex = order.skus.findIndex(s => s.sku === sku);
    if (skuIndex === -1) {
      throw new Error(`SKU ${sku} not found in order ${orderId}`);
    }
    
    // Update SKU status
    order.skus[skuIndex].tracking_info.status = newStatus;
    
    // Update additional data if provided
    if (additionalData.timestamps) {
      Object.assign(order.skus[skuIndex].tracking_info.timestamps, additionalData.timestamps);
    }
    
    if (additionalData.borzoData) {
      Object.assign(order.skus[skuIndex].tracking_info, additionalData.borzoData);
    }
    
    // Save the order with updated SKU
    await order.save();
    
    // Recalculate and update order status
    const updatedOrder = await updateOrderStatusFromSkus(order);
    
    logger.info(`SKU ${sku} in order ${orderId} updated to ${newStatus}`);
    
    return updatedOrder;
  } catch (error) {
    logger.error(`Error updating SKU ${sku} status in order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Check if all SKUs in an order have Borzo status as "finished"
 * @param {Object} order - Order object with skus array
 * @returns {Object} - { allFinished: boolean, finishedCount: number, totalCount: number, details: array }
 */
function checkAllSkusFinished(order) {
  if (!order || !order.skus || order.skus.length === 0) {
    return {
      allFinished: false,
      finishedCount: 0,
      totalCount: 0,
      details: []
    };
  }

  const details = order.skus.map(sku => ({
    sku: sku.sku,
    borzoStatus: sku.tracking_info?.borzo_order_status || 'Not set',
    isFinished: sku.tracking_info?.borzo_order_status?.toLowerCase() === 'finished'
  }));

  const finishedCount = details.filter(d => d.isFinished).length;
  const totalCount = order.skus.length;
  const allFinished = finishedCount === totalCount;

  return {
    allFinished,
    finishedCount,
    totalCount,
    details
  };
}

/**
 * Mark order as delivered if all SKUs are finished
 * @param {String} orderId - Order ID
 * @returns {Object} - { updated: boolean, order: Object, reason: string }
 */
async function markOrderAsDeliveredIfAllFinished(orderId) {
  try {
    const Order = require("../models/order");
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error("Order not found");
    }

    const finishedCheck = checkAllSkusFinished(order);
    
    if (finishedCheck.allFinished) {
      logger.info(`All SKUs finished for order ${orderId} - marking as Delivered`);
      
      const updatedOrder = await Order.findByIdAndUpdate(
        order._id,
        { 
          $set: { 
            status: "Delivered",
            "timestamps.deliveredAt": new Date(),
            "slaInfo.actualFulfillmentTime": new Date()
          }
        },
        { new: true }
      );

      // Add audit log
      await Order.findByIdAndUpdate(order._id, {
        $push: {
          auditLogs: {
            action: "Order Delivered - All SKUs Finished",
            actorId: null, // System action
            role: "System",
            timestamp: new Date(),
            reason: `All SKUs have Borzo status "finished" - Order marked as Delivered`,
          },
        },
      });

      return {
        updated: true,
        order: updatedOrder,
        reason: `All ${finishedCheck.totalCount} SKUs have Borzo status "finished"`
      };
    } else {
      return {
        updated: false,
        order: order,
        reason: `Only ${finishedCheck.finishedCount}/${finishedCheck.totalCount} SKUs have Borzo status "finished"`
      };
    }
  } catch (error) {
    logger.error(`Error checking/marking order ${orderId} as delivered:`, error);
    throw error;
  }
}

module.exports = {
  calculateOrderStatus,
  updateOrderStatusFromSkus,
  updateSkuStatus,
  checkAllSkusFinished,
  markOrderAsDeliveredIfAllFinished
};
