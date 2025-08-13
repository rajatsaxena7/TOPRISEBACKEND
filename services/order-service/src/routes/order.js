const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");
const slaController = require("../controllers/slaController");
const {
  setOrderSLAExpectations,
  checkSLACompliance,
} = require("../jobs/slaBreach");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

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

// Status updates
router.post("/:orderId/pack", orderController.markAsPacked);
router.post("/:orderId/deliver", orderController.markAsDelivered);
router.post("/:orderId/cancel", orderController.cancelOrder);

router.post("/sla/types", slaController.createSLAType);
router.get("/sla/types", slaController.getSLATypes);
router.get("/get-by-name", slaController.getSlaByName);
router.post("/dealers/:dealerId/sla", slaController.setDealerSLA);
// router.get("/dealers/:dealerId/sla", slaController.getDealerSLA);
router.post("/sla/violations", slaController.logViolation);
router.get("/sla/violations", slaController.getViolations);
// router.patch("/sla/violations/:violationId", slaController.updateViolationStatus);

// Analytics
router.get("/analytics/fulfillment", orderController.getFulfillmentMetrics);
router.get("/analytics/sla-compliance", orderController.getSLAComplianceReport);
router.get(
  "/analytics/dealer-performance",
  orderController.getDealerPerformance
);
router.get("/stats", orderController.getOrderStats);

// Batch processing
router.post("/batch/assign", orderController.batchAssignOrders);
router.post("/batch/status-update", orderController.batchUpdateStatus);

router.get("/get/order-by-dealer/:dealerId", orderController.getOrdersByDealerId);
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

module.exports = router;
