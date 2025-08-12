const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const purchaseOrderController = require("../controller/purchaseOrder");

router.post(
  "/",
  upload.array("files"),
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.createPurchaseOrder
);
router.put(
  "/:id",
  upload.array("files"),
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.updatePurchaseOrder
);

router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getAllPurchaseOrders
);
router.get(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getPurchaseOrderById
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  purchaseOrderController.deletePurchaseOrder
);

router.get(
  "/get/all-filter",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getFilteredPurchaseOrders
);
router.get(
  "/get/by-userId/:user_id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.getPurchaseOrdersByUserId
);
router.put(
  "/update-status/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  purchaseOrderController.updatePurchaseOrderStatus
)

module.exports = router;
