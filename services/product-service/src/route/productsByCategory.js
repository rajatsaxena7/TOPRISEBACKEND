const express = require("express");
const router = express.Router();
const productsByCategoryController = require("../controller/productsByCategory");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

// Get products by category ID
router.get(
    "/category/:categoryId",
    // authenticate,
    // authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
    productsByCategoryController.getProductsByCategory
);

// Get products by category name (case-insensitive)
router.get(
    "/category/name/:categoryName",
    // authenticate,
    // authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
    productsByCategoryController.getProductsByCategoryName
);

// Get products by category code
router.get(
    "/category/code/:categoryCode",
    // authenticate,
    // authorizeRoles("Super-admin", "Fulfillment-Admin", "User", "Dealer"),
    productsByCategoryController.getProductsByCategoryCode
);

// Get product count by category
router.get(
    "/category/:categoryId/count",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    productsByCategoryController.getProductCountByCategory
);

// Get all categories with their product counts
router.get(
    "/categories/with-counts",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    productsByCategoryController.getCategoriesWithProductCounts
);

module.exports = router;
