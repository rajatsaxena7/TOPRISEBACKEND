const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const slaController = require("../controllers/slaController");
const dealerOrderKPIController = require("../controllers/dealerOrderKPI");
const {
  setOrderSLAExpectations,
  checkSLACompliance,
} = require("../jobs/slaBreach");
const slaViolationMiddleware = require("../middleware/slaViolationMiddleware");
const slaViolationScheduler = require("../jobs/slaViolationScheduler");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const AuditLogger = require("../utils/auditLogger");
const { requireAuth } = require("../middleware/authMiddleware");

// Middleware for role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
};

// Middleware for audit logging - only applies when user is authenticated
const auditMiddleware = (action, targetType = null, category = null) => {
  return (req, res, next) => {
    // Only apply audit logging if user is authenticated
    if (req.user && req.user.id && req.user.role) {
      return AuditLogger.createMiddleware(action, targetType, category)(req, res, next);
    } else {
      // Skip audit logging and continue to next middleware
      return next();
    }
  };
};

// Order retrieval
router.get("/all", 
  requireAuth,
  auditMiddleware("ORDER_LIST_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getOrders
);
router.get("/id/:id", 
  requireAuth,
  auditMiddleware("ORDER_DETAILS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getOrderById
);
router.get("/picklists", 
  requireAuth,
  auditMiddleware("PICKLIST_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getPickList
);
router.get("/picklists/dealer/:dealerId", 
  requireAuth,
  auditMiddleware("DEALER_PICKLIST_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getPickListByDealer
);
router.get("/scanlogs", 
  requireAuth,
  auditMiddleware("SCAN_LOGS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getScanLogs
);
router.get("/scanlogs/dealer/:dealerId", 
  requireAuth,
  auditMiddleware("DEALER_SCAN_LOGS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getScanLogsByDealer
);
router.get("/user/:userId", 
  requireAuth,
  auditMiddleware("USER_ORDERS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getOrderByUserId
);

// Dealer Order KPI Routes
router.get("/dealer/:dealerId/kpis", 
  requireAuth,
  auditMiddleware("DEALER_ORDER_KPIS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  dealerOrderKPIController.getDealerOrderKPIs
);

router.get("/dealer/:dealerId/orders", 
  requireAuth,
  auditMiddleware("DEALER_ORDERS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  dealerOrderKPIController.getDealerOrders
);

router.get("/reports", 
  requireAuth,
  auditMiddleware("ORDER_REPORTS_GENERATED", "Report", "REPORTING"),
  orderController.generateOrderReports
);

router.post("/create", 
  requireAuth,
  setOrderSLAExpectations, 
  auditMiddleware("ORDER_CREATED", "Order", "ORDER_MANAGEMENT"),
  orderController.createOrder
);
router.post("/assign-dealers", 
  requireAuth,
  auditMiddleware("DEALER_ASSIGNED", "Order", "ORDER_MANAGEMENT"),
  orderController.assignOrderItemsToDealers
);
router.post("/reassign-dealers", 
  requireAuth,
  auditMiddleware("DEALER_REMAPPED", "Order", "ORDER_MANAGEMENT"),
  orderController.reassignOrderItemsToDealers
);

router.post("/create-pickup", 
  requireAuth,
  auditMiddleware("PICKUP_CREATED", "Order", "ORDER_MANAGEMENT"),
  orderController.createPickup
);
router.post("/assign-picklist", 
  requireAuth,
  auditMiddleware("PICKLIST_ASSIGNED", "Order", "ORDER_MANAGEMENT"),
  orderController.assignPicklistToStaff
);
router.post("/scan", 
  requireAuth,
  auditMiddleware("SKU_SCANNED", "Order", "ORDER_MANAGEMENT"),
  orderController.scanSku
);
router.put("/dealer-update", 
  requireAuth,
  auditMiddleware("ORDER_UPDATED", "Order", "ORDER_MANAGEMENT"),
  orderController.UpdateOrderForDealer
);
router.post("/ship", 
  requireAuth,
  checkSLACompliance, 
  auditMiddleware("ORDER_SHIPPED", "Order", "ORDER_MANAGEMENT"),
  orderController.shipOrder
);

// Status updates (with SLA violation middleware)
router.post("/:orderId/pack", 
  requireAuth,
  slaViolationMiddleware.checkSLAOnOrderUpdate(), 
  auditMiddleware("ORDER_STATUS_CHANGED", "Order", "ORDER_MANAGEMENT"),
  orderController.markAsPacked
);
router.post("/:orderId/deliver", 
  requireAuth,
  slaViolationMiddleware.checkSLAOnOrderUpdate(), 
  auditMiddleware("ORDER_DELIVERED", "Order", "ORDER_MANAGEMENT"),
  orderController.markAsDelivered
);
router.post("/:orderId/cancel", 
  requireAuth,
  slaViolationMiddleware.checkSLAOnOrderUpdate(), 
  auditMiddleware("ORDER_CANCELLED", "Order", "ORDER_MANAGEMENT"),
  orderController.cancelOrder
);

// SKU-level status updates
router.post("/:orderId/sku/:sku/pack", 
  requireAuth,
  slaViolationMiddleware.checkSLAOnOrderUpdate(), 
  auditMiddleware("SKU_PACKED", "Order", "ORDER_MANAGEMENT"),
  orderController.markSkuAsPacked
);
router.post("/:orderId/sku/:sku/ship", 
  requireAuth,
  auditMiddleware("SKU_SHIPPED", "Order", "ORDER_MANAGEMENT"),
  orderController.markSkuAsShipped
);
router.post("/:orderId/sku/:sku/deliver", 
  requireAuth,
  auditMiddleware("SKU_DELIVERED", "Order", "ORDER_MANAGEMENT"),
  orderController.markSkuAsDelivered
);

// Order status breakdown
router.get("/:orderId/status-breakdown", 
  requireAuth,
  auditMiddleware("ORDER_STATUS_BREAKDOWN_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getOrderStatusBreakdown
);

// Check and mark order as delivered if all SKUs are finished
router.post("/:orderId/check-delivery", 
  requireAuth,
  auditMiddleware("ORDER_DELIVERY_CHECKED", "Order", "ORDER_MANAGEMENT"),
  orderController.checkAndMarkOrderAsDelivered
);

router.post("/sla/types", 
  requireAuth,
  auditMiddleware("SLA_TYPE_CREATED", "SLA", "SLA_MANAGEMENT"),
  slaController.createSLAType
);
router.get("/sla/types", 
  requireAuth,
  auditMiddleware("SLA_TYPES_ACCESSED", "SLA", "SLA_MANAGEMENT"),
  slaController.getSLATypes
);
router.get("/get-by-name", 
  requireAuth,
  auditMiddleware("SLA_BY_NAME_ACCESSED", "SLA", "SLA_MANAGEMENT"),
  slaController.getSlaByName
);
router.post("/dealers/:dealerId/sla", 
  requireAuth,
  auditMiddleware("DEALER_SLA_UPDATED", "SLA", "SLA_MANAGEMENT"),
  slaController.setDealerSLA
);
// router.get("/dealers/:dealerId/sla", slaController.getDealerSLA);
router.post("/sla/violations", 
  requireAuth,
  auditMiddleware("SLA_VIOLATION_RECORDED", "SLA", "SLA_MANAGEMENT"),
  slaController.logViolation
);
router.get("/sla/violations", 
  requireAuth,
  auditMiddleware("SLA_VIOLATIONS_ACCESSED", "SLA", "SLA_MANAGEMENT"),
  slaController.getViolations
);
router.get("/sla/violations/order/:orderId", 
  requireAuth,
  auditMiddleware("ORDER_SLA_VIOLATIONS_ACCESSED", "SLA", "SLA_MANAGEMENT"),
  slaController.getViolationsByOrder
);
router.get("/sla/violations/summary/:dealerId", 
  requireAuth,
  auditMiddleware("DEALER_SLA_VIOLATIONS_SUMMARY_ACCESSED", "SLA", "SLA_MANAGEMENT"),
  slaController.getViolationsSummary
);
router.get("/sla/violations/approaching", 
  requireAuth,
  auditMiddleware("APPROACHING_SLA_VIOLATIONS_ACCESSED", "SLA", "SLA_MANAGEMENT"),
  slaController.getApproachingViolations
);
// router.patch("/sla/violations/:violationId", slaController.updateViolationStatus);

// SLA Scheduler Management
router.post("/sla/scheduler/start", 
  requireAuth,
  auditMiddleware("SLA_SCHEDULER_STARTED", "SLA", "SLA_MANAGEMENT"),
  slaController.startScheduler
);
router.post("/sla/scheduler/stop", 
  requireAuth,
  auditMiddleware("SLA_SCHEDULER_STOPPED", "SLA", "SLA_MANAGEMENT"),
  slaController.stopScheduler
);
router.get("/sla/scheduler/status", 
  requireAuth,
  auditMiddleware("SLA_SCHEDULER_STATUS_ACCESSED", "SLA", "SLA_MANAGEMENT"),
  slaController.getSchedulerStatus
);
router.post("/sla/scheduler/trigger-check", 
  requireAuth,
  auditMiddleware("SLA_MANUAL_CHECK_TRIGGERED", "SLA", "SLA_MANAGEMENT"),
  slaController.triggerManualCheck
);

// Analytics
router.get("/analytics/fulfillment", 
  requireAuth,
  auditMiddleware("FULFILLMENT_ANALYTICS_ACCESSED", "Order", "REPORTING"),
  orderController.getFulfillmentMetrics
);
router.get("/analytics/sla-compliance", 
  requireAuth,
  auditMiddleware("SLA_COMPLIANCE_REPORT_ACCESSED", "Order", "REPORTING"),
  orderController.getSLAComplianceReport
);
router.get(
  "/analytics/dealer-performance",
  requireAuth,
  auditMiddleware("DEALER_PERFORMANCE_ANALYTICS_ACCESSED", "Order", "REPORTING"),
  orderController.getDealerPerformance
);
router.get(
  "/stats",
  requireAuth,
  requireRole(["Super-admin", "Inventory-Admin", "Fulfillment-Admin"]),
  auditMiddleware("ORDER_STATS_ACCESSED", "Order", "REPORTING"),
  orderController.getOrderStats
);

// Batch processing
router.post("/batch/assign", 
  requireAuth,
  auditMiddleware("BATCH_ORDER_ASSIGNMENT", "Order", "ORDER_MANAGEMENT"),
  orderController.batchAssignOrders
);
router.post("/batch/status-update", 
  requireAuth,
  auditMiddleware("BATCH_ORDER_STATUS_UPDATE", "Order", "ORDER_MANAGEMENT"),
  orderController.batchUpdateStatus
);

router.get(
  "/get/order-by-dealer/:dealerId",
  requireAuth,
  auditMiddleware("DEALER_ORDERS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  orderController.getOrdersByDealerId
);
router.put(
  "/update/order-status-by-dealer",
  requireAuth,
  auditMiddleware("DEALER_ORDER_STATUS_UPDATED", "Order", "ORDER_MANAGEMENT"),
  orderController.markDealerPackedAndUpdateOrderStatus
);
router.put(
  "/add/order-rating/by-userId",
  orderController.addReview
)
router.post("/createOrder/forPurchseOrder", orderController.createOrderBySuperAdmin);
router.get("/getOrder/forPurchseOrder/:purchaseOrderId", orderController.getOrderByPurchaseOrderId);

// Borzo delivery orders
router.post("/borzo/instant", orderController.createOrderBorzoInstant);
router.post("/borzo/endofday", orderController.createOrderBorzoEndofDay);

// Borzo label endpoints
router.get("/borzo/labels/:order_id", orderController.getBorzoOrderLabels);
router.get("/borzo/labels/:order_id/json", orderController.getBorzoOrderLabelsAsJSON);
router.get("/borzo/labels/internal/:internalOrderId", orderController.getBorzoOrderLabelsByInternalOrderId);

// Borzo webhook endpoint
router.post("/borzo/webhook", orderController.borzoWebhook);

// Order tracking endpoint
router.get("/tracking/:orderId", orderController.getOrderTrackingInfo);

// SKU tracking endpoints
router.get("/tracking/:orderId/sku/:sku", orderController.getSkuTrackingInfo);
router.put("/tracking/:orderId/sku/:sku", orderController.updateSkuTrackingStatus);

// Debug endpoint for Borzo order ID
router.post("/debug/borzo-order-id", orderController.debugBorzoOrderId);

router.get("/get/order/stats",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "Fulfillment-Admin"),
  orderController.getOrderStatsCount
)
router.get("/get/orderSummary", orderController.getOrderSummaryMonthlyorWeekly);

// Order-specific Audit Log Endpoints

/**
 * @route GET /api/orders/:orderId/audit-logs
 * @desc Get audit logs for a specific order
 * @access Authenticated users with order access
 */
router.get("/:orderId/audit-logs", 
  requireAuth,
  auditMiddleware("ORDER_AUDIT_LOGS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { page = 1, limit = 10, action, startDate, endDate } = req.query;
      
      const query = { targetId: orderId };
      if (action) query.action = action;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      const auditLogs = await AuditLogger.getAuditLogs({
        query,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      return res.json({
        success: true,
        data: auditLogs,
        message: "Order audit logs fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching order audit logs:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch order audit logs" 
      });
    }
  }
);

/**
 * @route GET /api/orders/user/:userId/audit-logs
 * @desc Get audit logs for all orders by a specific user
 * @access Authenticated users
 */
router.get("/user/:userId/audit-logs", 
  requireAuth,
  auditMiddleware("USER_ORDER_AUDIT_LOGS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, action, startDate, endDate } = req.query;
      
      const query = { actorId: userId };
      if (action) query.action = action;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      const auditLogs = await AuditLogger.getAuditLogs({
        query,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      return res.json({
        success: true,
        data: auditLogs,
        message: "User order audit logs fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching user order audit logs:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch user order audit logs" 
      });
    }
  }
);

/**
 * @route GET /api/orders/dealer/:dealerId/audit-logs
 * @desc Get audit logs for all orders handled by a specific dealer
 * @access Authenticated users
 */
router.get("/dealer/:dealerId/audit-logs", 
  requireAuth,
  auditMiddleware("DEALER_ORDER_AUDIT_LOGS_ACCESSED", "Order", "ORDER_MANAGEMENT"),
  async (req, res) => {
    try {
      const { dealerId } = req.params;
      const { page = 1, limit = 10, action, startDate, endDate } = req.query;
      
      const query = { 
        "details.dealerId": dealerId,
        targetType: "Order"
      };
      if (action) query.action = action;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      const auditLogs = await AuditLogger.getAuditLogs({
        query,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      return res.json({
        success: true,
        data: auditLogs,
        message: "Dealer order audit logs fetched successfully"
      });
    } catch (error) {
      console.error("Error fetching dealer order audit logs:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch dealer order audit logs" 
      });
    }
  }
);

module.exports = router;
