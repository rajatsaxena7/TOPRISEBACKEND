const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const purchaseOrderController = require("../controller/purchaseOrder");

/**
 * @route POST /api/purchaseorders
 * @desc Create a new purchase order
 * @access Super-admin, Fulfillment-Admin, User, Dealer
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  upload.array("files", 10),
  purchaseOrderController.createPurchaseOrder
);

/**
 * @route GET /api/purchaseorders/stats
 * @desc Get purchase order statistics
 * @access Super-admin, Fulfillment-Admin
 */
router.get(
  "/stats",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
  purchaseOrderController.getPurchaseOrderStats
);

/**
 * @route GET /api/purchaseorders/filter
 * @desc Get filtered purchase orders
 * @access Super-admin, Fulfillment-Admin, User, Dealer
 */
router.get(
  "/filter",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getFilteredPurchaseOrders
);

/**
 * @route GET /api/purchaseorders/user/:user_id
 * @desc Get purchase orders by user ID
 * @access Super-admin, Fulfillment-Admin, User, Dealer
 */
router.get(
  "/user/:user_id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getPurchaseOrdersByUserId
);

/**
 * @route GET /api/purchaseorders
 * @desc Get all purchase orders with pagination
 * @access Super-admin, Fulfillment-Admin, User, Dealer
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getAllPurchaseOrders
);

/**
 * @route GET /api/purchaseorders/:id
 * @desc Get purchase order by ID with user details
 * @access Super-admin, Fulfillment-Admin, User, Dealer
 */
router.get(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getPurchaseOrderById
);

/**
 * @route PUT /api/purchaseorders/:id
 * @desc Update purchase order
 * @access Super-admin, Fulfillment-Admin, User, Dealer
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  upload.array("files", 10),
  purchaseOrderController.updatePurchaseOrder
);

/**
 * @route PATCH /api/purchaseorders/:id/status
 * @desc Update purchase order status
 * @access Super-admin, Fulfillment-Admin
 */
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  purchaseOrderController.updatePurchaseOrderStatus
);

/**
 * @route DELETE /api/purchaseorders/:id
 * @desc Delete purchase order
 * @access Super-admin, Fulfillment-Admin
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  purchaseOrderController.deletePurchaseOrder
);

module.exports = router;
