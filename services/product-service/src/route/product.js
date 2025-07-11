const express = require("express");
const router = express.Router();
const productController = require("../controller/product");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.fields([
    { name: "dataFile", maxCount: 1 },
    { name: "imageZip", maxCount: 1 },
  ]),
  productController.bulkUploadProducts
);

router.post(
  "/assign/dealers",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.fields([{ name: "dealersFile", maxCount: 1 }]),
  productController.assignDealers
);

router.put(
  "/bulk-edit",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  productController.bulkEdit
);

router.get("/", productController.getProductsByFilters);

module.exports = router;
