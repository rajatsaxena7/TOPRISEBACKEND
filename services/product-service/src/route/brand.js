const express = require("express");
const multer = require("multer");
const router = express.Router();
const brandController = require("../controller/brand");

const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post(
  "/",
  upload.single("file"), // Image file should be sent with key: 'file'
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  brandController.createBrand
);

router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  brandController.getAllBrands
);
router.get("/brandByType/:type", brandController.getBrandsByType);

router.get(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  brandController.getBrandById
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.single("file"), // Optional updated image
  brandController.updateBrand
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  brandController.deleteBrand
);

router.post(
  "/bulk-upload/brands",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  upload.fields([
    { name: "dataFile", maxCount: 1 },
    { name: "imageZip", maxCount: 1 },
  ]),
  brandController.bulkUploadBrands
);
module.exports = router;
