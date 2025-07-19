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
  authorizeRoles("Super-admin", "Inventory-Admin"),
  upload.fields([
    { name: "dataFile", maxCount: 1 },
    { name: "imageZip", maxCount: 1 },
  ]),
  productController.bulkUploadProducts
);

router.post(
  "/assign/dealers",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  upload.fields([{ name: "dealersFile", maxCount: 1 }]),
  productController.assignDealers
);

router.put(
  "/bulk-edit",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.bulkEdit
);

router.patch(
  "/deactivate/:id",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.deactivateProductsSingle
);

router.post(
  "/deactivate/bulk",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.deactivateProductsBulk
);

router.post(
  "/createProduct",
  upload.array("images"),
  productController.createProductSingle
);

router.put(
  "/updateProduct/:id",
  authenticate,
  upload.array("images"),

  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.editProductSingle
);

router.patch("/reject/:id", productController.rejectProduct);
router.patch("/approve/:id", productController.approveProduct);

router.get("/", productController.getProductsByFilters);
// router.get(
//   "/get-Dashboard",
//   authenticate,
//   authorizeRoles("Super-admin", "Inventory-Admin"),
//   productController.getProductsForDashboard
// );

router.get(
  "/export",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.exportDealerProducts
);

router.get(
  "/get-ProductById/:id",
  authenticate,
  // authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.getProductById
);

router.get("/get-products-Logs", productController.getProductBulkSessionLogs);
module.exports = router;
