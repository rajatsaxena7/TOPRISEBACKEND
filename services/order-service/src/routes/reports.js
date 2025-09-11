const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
// const auditMiddleware = require("../middleware/auditMiddleware");

// ✅ ORDER ANALYTICS REPORT
router.get(
  "/analytics",
  optionalAuth,
  // auditMiddleware("ORDER_ANALYTICS_ACCESSED", "Order", "REPORTING"),
  authenticate,
  authorizeRoles(
    "Super-admin",
    "Fulfillment-Admin",
    "Inventory-Admin",
    "Analytics-Admin"
  ),
  reportsController.getOrderAnalytics
);

// ✅ SALES ANALYTICS REPORT
router.get(
  "/sales",
  optionalAuth,
  // auditMiddleware("SALES_ANALYTICS_ACCESSED", "Order", "REPORTING"),
  authenticate,
  authorizeRoles(
    "Super-admin",
    "Fulfillment-Admin",
    "Inventory-Admin",
    "Analytics-Admin"
  ),
  reportsController.getSalesAnalytics
);

// ✅ ORDER PERFORMANCE REPORT
router.get(
  "/performance",
  optionalAuth,
  // auditMiddleware("ORDER_PERFORMANCE_ACCESSED", "Order", "REPORTING"),
  authenticate,
  authorizeRoles(
    "Super-admin",
    "Fulfillment-Admin",
    "Inventory-Admin",
    "Analytics-Admin"
  ),
  reportsController.getOrderPerformance
);

// ✅ PICKLIST ANALYTICS REPORT
router.get(
  "/picklists",
  optionalAuth,
  // auditMiddleware("PICKLIST_ANALYTICS_ACCESSED", "Picklist", "REPORTING"),
  authenticate,
  authorizeRoles(
    "Super-admin",
    "Fulfillment-Admin",
    "Inventory-Admin",
    "Analytics-Admin"
  ),
  reportsController.getPicklistAnalytics
);

// ✅ ORDER EXPORT REPORT
router.get(
  "/export",
  optionalAuth,
  // auditMiddleware("ORDER_EXPORT_REPORT_ACCESSED", "Order", "REPORTING"),
  authenticate,
  authorizeRoles(
    "Super-admin",
    "Fulfillment-Admin",
    "Inventory-Admin",
    "Analytics-Admin"
  ),
  reportsController.exportOrderReport
);

module.exports = router;
