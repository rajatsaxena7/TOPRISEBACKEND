const express = require("express");
const router = express.Router();
const manufactureController = require("../controller/manufacture");
const {
  authenticate,
  authorizeRoles,
} = require("../../../../packages/utils/authMiddleware");

router.post(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  manufactureController.createManufacturer
);

router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  manufactureController.getAllManufacturers
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  manufactureController.getManufacturerById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  manufactureController.updateManufacturer
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  manufactureController.deleteManufacturer
);

module.exports = router;
