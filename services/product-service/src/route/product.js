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

router.get("/reports", productController.generateProductReports);

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
router.patch(
  "/products/:id/availableDealers/:dealerId",
  productController.decrementDealerStock
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
  upload.fields([{ name: "editsFile", maxCount: 1 }]),
  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.bulkEdit
);

router.patch(
  "/deactivate/:id",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.deactivateProductsSingle
);

router.patch(
  "/deactivateProduct/bulk",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  productController.deactivateProductsBulk
);

router.post(
  "/createProduct",
  upload.array("images"),
  productController.createProductSingle
);

router.post("/disable-by-dealer", productController.disableProductsByDealer);
router.post("/enable-by-dealer", productController.enableproductsByDealer);
router.put(
  "/updateProduct/:id",
  authenticate,
  upload.array("images"),

  authorizeRoles("Super-admin", "Inventory-Admin", "Dealer"),
  productController.editProductSingle
);

router.patch("/reject/:id", productController.rejectProduct);

router.patch("/approve/:id", productController.approveProduct);

router.get("/", productController.getProductsByFilters);
router.get("/getVehicleDetails", productController.getVehicleDetails);
router.get(
  "/products/:id/availableDealers",
  productController.getAssignedDealers
);
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
  authorizeRoles("Super-admin", "Inventory-Admin", "User", "Dealer"),
  productController.getProductById
);

router.get("/get-all-productLogs", productController.getAllProductBulkSessions);

router.get("/get-products-Logs", productController.getProductBulkSessionLogs);

router.get(
  "/get-products-by-dealer/:dealerId",
  productController.getProductByDealerId
);
router.patch(
  "/bulk/approve",
  authenticate,
  authorizeRoles("Super-admin"),
  productController.bulkapproveProduct
);
router.patch(
  "/bulk/reject",
  authenticate,
  authorizeRoles("Super-admin"),
  productController.bulkrejectProduct
);
router.put(
  "/update-stockByDealer/:id",
  authenticate,
  authorizeRoles("Dealer"),
  productController.updateProductDealerStock
);

router.get(
  "/get-all-products/pagination",
  productController.getProductsByFiltersWithPagination
);


router.post(
  "/createProductByDealer",
  upload.array("images"),
  authenticate,
  authorizeRoles("Dealer"),
  productController.createProductSingleByDealer
);

router.get(
  "/getProducts/byDealer",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User","Dealer"),
  productController.getAllProductsAddedByDealerWithPagination
);



module.exports = router;
