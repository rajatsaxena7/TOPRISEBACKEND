const express = require("express");
const router = express.Router();
const variantController = require("../controller/variant");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.single("file"),
  variantController.createVariant
);

router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  variantController.getAllVariants
);

router.get(
  "/model/:modelId",
  // authenticate,
  // authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  variantController.getVariantsByModel
);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  variantController.getVariantById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.single("file"),
  variantController.updateVariant
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  variantController.deleteVariant
);

router.post(
  "/bulk-upload/varients",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  upload.fields([
    { name: "dataFile", maxCount: 1 },
    { name: "imageZip", maxCount: 1 },
  ]),
  variantController.bulkUploadVariants
);

module.exports = router;
