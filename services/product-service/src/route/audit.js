const express = require("express");
const router = express.Router();
const AuditController = require("../controller/auditController");
const { optionalAuth } = require("../middleware/authMiddleware");
const ProductAuditLogger = require("../utils/auditLogger");

// Apply optional authentication to all audit routes
router.use(optionalAuth);

// Get audit logs with filtering and pagination
router.get("/logs", 
  ProductAuditLogger.createMiddleware("AUDIT_LOGS_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogs
);

// Get audit statistics
router.get("/stats", 
  ProductAuditLogger.createMiddleware("AUDIT_STATS_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditStats
);

// Get audit dashboard data
router.get("/dashboard", 
  ProductAuditLogger.createMiddleware("AUDIT_DASHBOARD_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditDashboard
);

// Get audit logs by action type
router.get("/logs/action/:action", 
  ProductAuditLogger.createMiddleware("AUDIT_LOGS_BY_ACTION_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByAction
);

// Get audit logs by user
router.get("/logs/user/:userId", 
  ProductAuditLogger.createMiddleware("AUDIT_LOGS_BY_USER_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByUser
);

// Get audit logs by target
router.get("/logs/target/:targetType/:targetId", 
  ProductAuditLogger.createMiddleware("AUDIT_LOGS_BY_TARGET_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByTarget
);

// Get audit logs by category
router.get("/logs/category/:category", 
  ProductAuditLogger.createMiddleware("AUDIT_LOGS_BY_CATEGORY_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByCategory
);

// Get bulk operation audit logs
router.get("/logs/bulk/:bulkOperationId", 
  ProductAuditLogger.createMiddleware("BULK_OPERATION_LOGS_ACCESSED", "System", "REPORTING"),
  AuditController.getBulkOperationLogs
);

// Export audit logs to CSV
router.get("/export", 
  ProductAuditLogger.createMiddleware("AUDIT_LOGS_EXPORTED", "System", "REPORTING"),
  AuditController.exportAuditLogs
);

module.exports = router;
