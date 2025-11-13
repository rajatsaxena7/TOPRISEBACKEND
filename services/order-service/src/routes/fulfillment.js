const express = require("express");
const router = express.Router();
const fulfillmentController = require("../controllers/fulfillmentController");
const { authenticate, authorizeRoles } = require("/packages/utils/authMiddleware");
const { requireAuth } = require("../middleware/authMiddleware");

// ==================== FULFILLMENT STATISTICS ====================

// Get fulfillment statistics
router.get(
  "/stats",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.getFulfillmentStats
);

// ==================== PENDING TASKS ====================

// Get pending tasks for fulfillment
router.get(
  "/pending-tasks",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.getPendingTasks
);

// ==================== PICKLIST MANAGEMENT ====================

// Get picklists by employee
router.get(
  "/picklists/employee/:employeeId",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.getPicklistsByEmployee
);

// Get picklists by dealer
router.get(
  "/picklists/dealer/:dealerId",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.getPicklistsByDealer
);

// Update picklist status
router.patch(
  "/picklists/:picklistId/status",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.updatePicklistStatus
);

// Assign picklist to employee
router.patch(
  "/picklists/:picklistId/assign",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.assignPicklistToEmployee
);

// Bulk assign picklists to employee
router.patch(
  "/picklists/bulk-assign",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.bulkAssignPicklists
);

// ==================== DEALER MANAGEMENT ====================

// Get assigned dealers for fulfillment
router.get(
  "/assigned-dealers",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.getAssignedDealers
);

// ==================== ORDER MANAGEMENT ====================

// Get recent orders for fulfillment
router.get(
  "/recent-orders",
  requireAuth,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.getRecentOrders
);

// Get orders by assigned employee
router.get(
  "/orders/employee/:employeeId",
  // requireAuth,
  // authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Fulfillment-Staff", "Inventory-Staff"),
  fulfillmentController.getOrdersByEmployee
);

module.exports = router;
