const express = require("express");
const router = express.Router();
const reportsController = require("../controller/reports");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const ProductAuditLogger = require("../utils/auditLogger");

// ✅ PRODUCT ANALYTICS REPORT
router.get(
    "/analytics",
    optionalAuth,
    ProductAuditLogger.createMiddleware("PRODUCT_ANALYTICS_ACCESSED", "Product", "REPORTING"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    reportsController.getProductAnalytics
);

// ✅ PRODUCT PERFORMANCE REPORT
router.get(
    "/performance",
    optionalAuth,
    ProductAuditLogger.createMiddleware("PRODUCT_PERFORMANCE_ACCESSED", "Product", "REPORTING"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    reportsController.getProductPerformance
);

// ✅ PRODUCT INVENTORY REPORT
router.get(
    "/inventory",
    optionalAuth,
    ProductAuditLogger.createMiddleware("PRODUCT_INVENTORY_ACCESSED", "Product", "REPORTING"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    reportsController.getProductInventory
);

// ✅ PRODUCT CATEGORY REPORT
router.get(
    "/category",
    optionalAuth,
    ProductAuditLogger.createMiddleware("PRODUCT_CATEGORY_REPORT_ACCESSED", "Product", "REPORTING"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    reportsController.getProductCategoryReport
);

// ✅ PRODUCT BRAND REPORT
router.get(
    "/brand",
    optionalAuth,
    ProductAuditLogger.createMiddleware("PRODUCT_BRAND_REPORT_ACCESSED", "Product", "REPORTING"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    reportsController.getProductBrandReport
);

// ✅ PRODUCT EXPORT REPORT
router.get(
    "/export",
    optionalAuth,
    ProductAuditLogger.createMiddleware("PRODUCT_EXPORT_REPORT_ACCESSED", "Product", "REPORTING"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    reportsController.exportProductReport
);

module.exports = router;
