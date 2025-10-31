const express = require("express");
const router = express.Router();
const returnController = require("../controllers/return");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

// Return request management
router.post("/create", returnController.createReturnRequest);
router.get("/:returnId", authenticate, authorizeRoles("Super-admin", "Fulfillment-Admin", "Fulfillment-Staff", "Inventory-Admin", "Inventory-Staff", "User"), returnController.getReturnRequest);
router.get("/", returnController.getReturnRequests);
router.get("/stats/overview", returnController.getReturnRequestStats);
router.get("/user/:userId", returnController.getUserReturnRequests);
router.get("/user/:userId/test", returnController.testUserReturnRequests);
//return request byuser

// Return validation and processing
router.put("/:returnId/validate", returnController.validateReturnRequest);
router.put("/:returnId/schedule-pickup", returnController.schedulePickup);
router.put("/:returnId/complete-pickup", returnController.completePickup);

// Inspection process
router.put("/:returnId/start-inspection", returnController.startInspection);
router.put("/:returnId/complete-inspection", returnController.completeInspection);

// Refund processing

//TODO
router.put("/:returnId/process-refund", returnController.processRefund);
router.put("/:returnId/complete", returnController.completeReturn);

// Additional features
router.post("/:returnId/notes", returnController.addNote);

module.exports = router;
