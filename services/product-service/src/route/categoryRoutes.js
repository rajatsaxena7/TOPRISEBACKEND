const express = require("express");
const multer = require("multer");
const router = express.Router();
const categoryController = require("../controller/category");
const {
  authenticate,
  authorizeRoles,
} = require("../../../../packages/utils/authMiddleware");

// Configure multer to store file in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// CREATE Category (with image upload)
router.post(
  "/",
  upload.single("file"), // Image file should be sent with key: 'file'
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  categoryController.createCategory
);

router.post(
  "/map-categories/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  categoryController.mapCategoriesToDealer
);

// GET All Categories
router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  categoryController.getAllCategories
);

router.get("/application", categoryController.getLiveCategory);

// GET Category by ID
router.get(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  categoryController.getCategoryById
);

// UPDATE Category (with optional image upload)
router.put(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.single("file"), // Optional updated image
  categoryController.updateCategory
);

// DELETE Category
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  categoryController.deleteCategory
);

module.exports = router;
