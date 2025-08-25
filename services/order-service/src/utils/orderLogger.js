const AuditLogger = require("./auditLogger");
const logger = require("/packages/utils/logger");

class OrderLogger {
  /**
   * Log order creation with detailed information
   */
  static async logOrderCreation(order, user, req) {
    try {
      await AuditLogger.logOrderAction({
        action: "ORDER_CREATED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          customerId: order.customerId,
          totalAmount: order.totalAmount,
          skuCount: order.skus?.length || 0,
          deliveryType: order.delivery_type,
          orderDate: order.orderDate,
          status: order.status,
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent")
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "LOW",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Order created: ${order.orderId} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log order creation:", error);
    }
  }

  /**
   * Log order status change with before/after values
   */
  static async logOrderStatusChange(order, oldStatus, newStatus, user, req, additionalDetails = {}) {
    try {
      await AuditLogger.logOrderAction({
        action: "ORDER_STATUS_CHANGED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          oldStatus: oldStatus,
          newStatus: newStatus,
          changeReason: additionalDetails.reason || "Status update",
          changedBy: user?.name || user?.email || "System",
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...additionalDetails
        },
        oldValues: { status: oldStatus },
        newValues: { status: newStatus },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "MEDIUM",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Order status changed: ${order.orderId} from ${oldStatus} to ${newStatus} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log order status change:", error);
    }
  }

  /**
   * Log order update with detailed changes
   */
  static async logOrderUpdate(order, oldValues, newValues, user, req, additionalDetails = {}) {
    try {
      await AuditLogger.logOrderAction({
        action: "ORDER_UPDATED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          updateReason: additionalDetails.reason || "Order update",
          updatedBy: user?.name || user?.email || "System",
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...additionalDetails
        },
        oldValues: oldValues,
        newValues: newValues,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "MEDIUM",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Order updated: ${order.orderId} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log order update:", error);
    }
  }

  /**
   * Log order cancellation
   */
  static async logOrderCancellation(order, user, req, cancellationReason = "Order cancelled") {
    try {
      await AuditLogger.logOrderAction({
        action: "ORDER_CANCELLED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          cancellationReason: cancellationReason,
          cancelledBy: user?.name || user?.email || "System",
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent")
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "HIGH",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Order cancelled: ${order.orderId} by ${user?.name || user?.email || "System"} - Reason: ${cancellationReason}`);
    } catch (error) {
      logger.error("Failed to log order cancellation:", error);
    }
  }

  /**
   * Log order delivery
   */
  static async logOrderDelivery(order, user, req, deliveryDetails = {}) {
    try {
      await AuditLogger.logOrderAction({
        action: "ORDER_DELIVERED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          deliveryDate: new Date(),
          deliveredBy: user?.name || user?.email || "System",
          deliveryMethod: deliveryDetails.method || "Standard",
          deliveryNotes: deliveryDetails.notes || "",
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...deliveryDetails
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "LOW",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Order delivered: ${order.orderId} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log order delivery:", error);
    }
  }

  /**
   * Log SKU-level actions
   */
  static async logSkuAction(order, sku, action, user, req, additionalDetails = {}) {
    try {
      await AuditLogger.logOrderAction({
        action: action, // SKU_PACKED, SKU_SHIPPED, SKU_DELIVERED, SKU_SCANNED
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: `${order.orderId}-${sku.sku}`,
        details: {
          orderId: order.orderId,
          sku: sku.sku,
          skuQuantity: sku.quantity,
          skuProductName: sku.productName,
          action: action,
          performedBy: user?.name || user?.email || "System",
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...additionalDetails
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "LOW",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`SKU action: ${action} for ${sku.sku} in order ${order.orderId} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log SKU action:", error);
    }
  }

  /**
   * Log dealer assignment
   */
  static async logDealerAssignment(order, dealerId, user, req, assignmentDetails = {}) {
    try {
      await AuditLogger.logOrderAction({
        action: "DEALER_ASSIGNED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          dealerId: dealerId,
          assignedBy: user?.name || user?.email || "System",
          assignmentDate: new Date(),
          assignmentReason: assignmentDetails.reason || "Automatic assignment",
          skusAssigned: assignmentDetails.skus || [],
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...assignmentDetails
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "MEDIUM",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Dealer assigned: ${dealerId} to order ${order.orderId} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log dealer assignment:", error);
    }
  }

  /**
   * Log dealer reassignment
   */
  static async logDealerReassignment(order, oldDealerId, newDealerId, user, req, reassignmentDetails = {}) {
    try {
      await AuditLogger.logOrderAction({
        action: "DEALER_REMAPPED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          oldDealerId: oldDealerId,
          newDealerId: newDealerId,
          reassignedBy: user?.name || user?.email || "System",
          reassignmentDate: new Date(),
          reassignmentReason: reassignmentDetails.reason || "Dealer reassignment",
          skusReassigned: reassignmentDetails.skus || [],
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...reassignmentDetails
        },
        oldValues: { dealerId: oldDealerId },
        newValues: { dealerId: newDealerId },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "MEDIUM",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Dealer reassigned: ${oldDealerId} to ${newDealerId} for order ${order.orderId} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log dealer reassignment:", error);
    }
  }

  /**
   * Log SLA violation
   */
  static async logSLAViolation(order, violationDetails, user, req) {
    try {
      await AuditLogger.logOrderAction({
        action: "SLA_VIOLATION_RECORDED",
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order._id,
        targetIdentifier: order.orderId,
        details: {
          orderId: order.orderId,
          violationType: violationDetails.type,
          violationReason: violationDetails.reason,
          expectedTime: violationDetails.expectedTime,
          actualTime: violationDetails.actualTime,
          delayMinutes: violationDetails.delayMinutes,
          recordedBy: user?.name || user?.email || "System",
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...violationDetails
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "HIGH",
        category: "SLA_MANAGEMENT"
      });

      logger.warn(`SLA violation recorded: ${order.orderId} - ${violationDetails.type} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log SLA violation:", error);
    }
  }

  /**
   * Log batch operations
   */
  static async logBatchOperation(operationType, orders, user, req, operationDetails = {}) {
    try {
      await AuditLogger.logOrderAction({
        action: operationType, // BATCH_ORDER_ASSIGNMENT, BATCH_ORDER_STATUS_UPDATE
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: null, // Multiple orders
        targetIdentifier: `BATCH-${operationType}-${Date.now()}`,
        details: {
          operationType: operationType,
          ordersCount: orders.length,
          orderIds: orders.map(o => o.orderId || o._id),
          performedBy: user?.name || user?.email || "System",
          timestamp: new Date(),
          requestBody: req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent"),
          ...operationDetails
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "MEDIUM",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Batch operation: ${operationType} on ${orders.length} orders by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log batch operation:", error);
    }
  }

  /**
   * Log order access/view
   */
  static async logOrderAccess(order, accessType, user, req) {
    try {
      await AuditLogger.logOrderAction({
        action: accessType, // ORDER_LIST_ACCESSED, ORDER_DETAILS_ACCESSED, etc.
        actorId: user?.id || user?._id,
        actorRole: user?.role || "System",
        actorName: user?.name || user?.email || "System",
        targetId: order?._id,
        targetIdentifier: order?.orderId || "MULTIPLE",
        details: {
          orderId: order?.orderId,
          accessType: accessType,
          accessedBy: user?.name || user?.email || "System",
          timestamp: new Date(),
          queryParams: req.query,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get("User-Agent")
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        sessionId: req.session?.id,
        severity: "LOW",
        category: "ORDER_MANAGEMENT"
      });

      logger.info(`Order access: ${accessType} by ${user?.name || user?.email || "System"}`);
    } catch (error) {
      logger.error("Failed to log order access:", error);
    }
  }
}

module.exports = OrderLogger;
