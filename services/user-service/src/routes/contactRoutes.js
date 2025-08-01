const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
  "/contact",
  //   authenticate,
  //   authorizeRoles("User", "Dealer", "Fulfillment-Admin", "Inventory-Admin"),
  contactController.createContactUsForm
);

router.get(
  "/contact",
  // authenticate,
  // authorizeRoles("User", "Dealer", "Fulfillment-Admin", "Inventory-Admin"),
  contactController.getContactUsForm
);

router.get(
  "/contact/:id",
  // authenticate,
  // authorizeRoles("User", "Dealer", "Fulfillment-Admin", "Inventory-Admin"),
  contactController.getContactUsFormById
);

router.put(
  "/contact/:id",
  // authenticate,
  // authorizeRoles("User", "Dealer", "Fulfillment-Admin", "Inventory-Admin"),
  contactController.updateContactUsForm
);

router.delete(
  "/contact/:id",
  // authenticate,
  // authorizeRoles("User", "Dealer", "Fulfillment-Admin", "Inventory-Admin"),
  contactController.deleteContactUsForm
);

module.exports = router;
