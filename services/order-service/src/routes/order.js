const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const slaController = require("../controllers/slaController");
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

// Order retrieval
router.get("/all", orderController.getOrders);
router.get("/id/:id", orderController.getOrderById);
router.get("/picklists", orderController.getPickList);
router.get("/picklists/dealer/:dealerId", orderController.getPickListByDealer);
router.get("/scanlogs", orderController.getScanLogs);
router.get("/scanlogs/dealer/:dealerId", orderController.getScanLogsByDealer);
router.get("/user/:userId", orderController.getOrderByUserId);
router.get("/reports", orderController.generateOrderReports);

// Order creation and processing
router.post("/create", setOrderSLAExpectations, orderController.createOrder);
router.post("/assign-dealers", orderController.assignOrderItemsToDealers);
router.post("/reassign-dealers", orderController.reassignOrderItemsToDealers);

router.post("/create-pickup", orderController.createPickup);
router.post("/assign-picklist", orderController.assignPicklistToStaff);
router.post("/scan", orderController.scanSku);
router.put("/dealer-update", orderController.UpdateOrderForDealer);
router.post("/ship", checkSLACompliance, orderController.shipOrder);

// Status updates (with SLA violation middleware)
router.post("/:orderId/pack", slaViolationMiddleware.checkSLAOnOrderUpdate(), orderController.markAsPacked);
router.post("/:orderId/deliver", slaViolationMiddleware.checkSLAOnOrderUpdate(), orderController.markAsDelivered);
router.post("/:orderId/cancel", slaViolationMiddleware.checkSLAOnOrderUpdate(), orderController.cancelOrder);

router.post("/sla/types", slaController.createSLAType);
router.get("/sla/types", slaController.getSLATypes);
router.get("/get-by-name", slaController.getSlaByName);
router.post("/dealers/:dealerId/sla", slaController.setDealerSLA);
// router.get("/dealers/:dealerId/sla", slaController.getDealerSLA);
router.post("/sla/violations", slaController.logViolation);
router.get("/sla/violations", slaController.getViolations);
router.get("/sla/violations/order/:orderId", slaController.getViolationsByOrder);
router.get("/sla/violations/summary/:dealerId", slaController.getViolationsSummary);
router.get("/sla/violations/approaching", slaController.getApproachingViolations);
// router.patch("/sla/violations/:violationId", slaController.updateViolationStatus);

// SLA Scheduler Management
router.post("/sla/scheduler/start", slaController.startScheduler);
router.post("/sla/scheduler/stop", slaController.stopScheduler);
router.get("/sla/scheduler/status", slaController.getSchedulerStatus);
router.post("/sla/scheduler/trigger-check", slaController.triggerManualCheck);

// Analytics
router.get("/analytics/fulfillment", orderController.getFulfillmentMetrics);
router.get("/analytics/sla-compliance", orderController.getSLAComplianceReport);
router.get(
  "/analytics/dealer-performance",
  orderController.getDealerPerformance
);
router.get(
  "/stats",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "Fulfillment-Admin"),
  orderController.getOrderStats
);

// Batch processing
router.post("/batch/assign", orderController.batchAssignOrders);
router.post("/batch/status-update", orderController.batchUpdateStatus);

router.get(
  "/get/order-by-dealer/:dealerId",
  orderController.getOrdersByDealerId
);
router.put(
  "/update/order-status-by-dealer",
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

module.exports = router;
