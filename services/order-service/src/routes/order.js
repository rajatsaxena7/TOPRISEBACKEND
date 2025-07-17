const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order");

router.get("/all", orderController.getOrders);
router.get("/id/:id", orderController.getOrderById);
router.get("/picklists", orderController.getPickList);
router.get("/picklists/dealer/:dealerId", orderController.getPickListByDealer);
router.get("/scanlogs", orderController.getScanLogs);
router.get("/scanlogs/dealer/:dealerId", orderController.getScanLogsByDealer);
router.get("/user/:userId", orderController.getOrderByUserId);

// Order creation
router.post("/create", orderController.createOrder);

// Assign dealers to order items
router.post("/assign-dealers", orderController.assignOrderItemsToDealers);

// Create pickup for order
router.post("/create-pickup", orderController.createPickup);

// Assign picklist to a staff member
router.post("/assign-picklist", orderController.assignPicklistToStaff);

// Scan SKU for an order
router.post("/scan", orderController.scanSku);

// Update order info specific to a dealer
router.put("/dealer-update", orderController.UpdateOrderForDealer);

// Mark order as shipped
router.post("/ship", orderController.shipOrder);

module.exports = router;
