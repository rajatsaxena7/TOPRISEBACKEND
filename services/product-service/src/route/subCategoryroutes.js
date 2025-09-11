const express = require("express");
const subCategoryController = require("../controller/subcategory");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// CREATE Category (with image upload)
router.post(
  "/",
  upload.single("file"), // Image file should be sent with key: 'file'
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  subCategoryController.createSubCategory
);

// GET All Categories
router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
  subCategoryController.getAllSubCategories
);

router.get("/by-category/:id", subCategoryController.getSubCategorybyCategory);

router.get("/application", subCategoryController.getLiveSubCategory);

// GET SubCategory Count
router.get(
  "/count",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
  subCategoryController.getSubCategoryCount
);

// GET Category by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  subCategoryController.getSubCategoryById
);

// UPDATE Category (with optional image upload)
router.put(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.single("file"), // Optional updated image
  subCategoryController.updateSubCategory
);

// DELETE Category
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  subCategoryController.deleteSubCategory
);

router.post(
  "/bulk-upload/subcategories",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin"),
  upload.fields([
    { name: "dataFile", maxCount: 1 },
    { name: "imageZip", maxCount: 1 },
  ]),
  subCategoryController.bulkUploadSubCategories
);

module.exports = router;
