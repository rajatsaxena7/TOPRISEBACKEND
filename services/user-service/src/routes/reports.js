const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
// const auditMiddleware = require("../middleware/auditMiddleware");

// ✅ USER ANALYTICS REPORT
router.get(
  "/analytics",
  optionalAuth,
  // auditMiddleware("USER_ANALYTICS_ACCESSED", "User", "REPORTING"),
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
  reportsController.getUserAnalytics
);

// ✅ DEALER ANALYTICS REPORT
router.get(
  "/dealers",
  optionalAuth,
  // auditMiddleware("DEALER_ANALYTICS_ACCESSED", "Dealer", "REPORTING"),
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
  reportsController.getDealerAnalytics
);

// ✅ EMPLOYEE ANALYTICS REPORT
router.get(
  "/employees",
  optionalAuth,
  // auditMiddleware("EMPLOYEE_ANALYTICS_ACCESSED", "Employee", "REPORTING"),
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
  reportsController.getEmployeeAnalytics
);

// ✅ USER PERFORMANCE REPORT
router.get(
  "/performance",
  optionalAuth,
  // auditMiddleware("USER_PERFORMANCE_ACCESSED", "User", "REPORTING"),
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
  reportsController.getUserPerformance
);

// ✅ USER EXPORT REPORT
router.get(
  "/export",
  optionalAuth,
  // auditMiddleware("USER_EXPORT_REPORT_ACCESSED", "User", "REPORTING"),
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
  reportsController.exportUserReport
);

module.exports = router;
