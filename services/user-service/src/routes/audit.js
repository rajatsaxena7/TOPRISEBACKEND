const express = require("express");
const router = express.Router();
const AuditController = require("../controllers/auditController");
const { optionalAuth } = require("../middleware/authMiddleware");
const UserAuditLogger = require("../utils/auditLogger");

// Apply optional authentication to all audit routes
router.use(optionalAuth);

// Get audit logs with filtering and pagination
router.get("/logs", 
  UserAuditLogger.createMiddleware("AUDIT_LOGS_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogs
);

// Get audit statistics
router.get("/stats", 
  UserAuditLogger.createMiddleware("AUDIT_STATS_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditStats
);

// Get audit dashboard data
router.get("/dashboard", 
  UserAuditLogger.createMiddleware("AUDIT_DASHBOARD_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditDashboard
);

// Get audit logs by action type
router.get("/logs/action/:action", 
  UserAuditLogger.createMiddleware("AUDIT_LOGS_BY_ACTION_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByAction
);

// Get audit logs by user
router.get("/logs/user/:userId", 
  UserAuditLogger.createMiddleware("AUDIT_LOGS_BY_USER_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByUser
);

// Get audit logs by target
router.get("/logs/target/:targetType/:targetId", 
  UserAuditLogger.createMiddleware("AUDIT_LOGS_BY_TARGET_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByTarget
);

// Get audit logs by category
router.get("/logs/category/:category", 
  UserAuditLogger.createMiddleware("AUDIT_LOGS_BY_CATEGORY_ACCESSED", "System", "REPORTING"),
  AuditController.getAuditLogsByCategory
);

// Get bulk operation audit logs
router.get("/logs/bulk/:bulkOperationId", 
  UserAuditLogger.createMiddleware("BULK_OPERATION_LOGS_ACCESSED", "System", "REPORTING"),
  AuditController.getBulkOperationLogs
);

// Get login attempt logs
router.get("/logs/login-attempts", 
  UserAuditLogger.createMiddleware("LOGIN_ATTEMPT_LOGS_ACCESSED", "System", "REPORTING"),
  AuditController.getLoginAttemptLogs
);

// Get security event logs
router.get("/logs/security-events", 
  UserAuditLogger.createMiddleware("SECURITY_EVENT_LOGS_ACCESSED", "System", "REPORTING"),
  AuditController.getSecurityEventLogs
);

// Export audit logs to CSV
router.get("/export", 
  UserAuditLogger.createMiddleware("AUDIT_LOGS_EXPORTED", "System", "REPORTING"),
  AuditController.exportAuditLogs
);

module.exports = router;
