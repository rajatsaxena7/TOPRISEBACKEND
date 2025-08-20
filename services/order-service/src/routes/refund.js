const express = require("express");
const router = express.Router();
const refundController = require("../controllers/refund");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
  "/createRefund-online",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  refundController.createPartialRefund
);
router.post(
  "/createRefund-cod",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  refundController.createPayout
);

router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  refundController.getAllRefunds
);

router.get(
  "/byId/:refundId",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  refundController.getRefundById
);

router.get(
  "/byOrderId/:orderId",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  refundController.getRefundByOrderId
);

module.exports = router;