const UserAuditLogger = require("../utils/auditLogger");
const logger = require("/packages/utils/logger");

class AuditController {
  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        actorId,
        actorRole,
        targetType,
        targetId,
        category,
        severity,
        bulkOperationId,
        loginMethod,
        securityEventType,
        startDate,
        endDate
      } = req.query;

      const filters = {
        action,
        actorId,
        actorRole,
        targetType,
        targetId,
        category,
        severity,
        bulkOperationId,
        loginMethod,
        securityEventType,
        startDate,
        endDate
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: "Audit logs retrieved successfully",
        data: result
      });
    } catch (error) {
      logger.error("Failed to get audit logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit logs",
        error: error.message
      });
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const stats = await UserAuditLogger.getAuditStats(filters);

      return res.status(200).json({
        success: true,
        message: "Audit statistics retrieved successfully",
        data: stats
      });
    } catch (error) {
      logger.error("Failed to get audit stats:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit statistics",
        error: error.message
      });
    }
  }

  /**
   * Get audit logs by action type
   */
  static async getAuditLogsByAction(req, res) {
    try {
      const { action } = req.params;
      const { page = 1, limit = 50, startDate, endDate } = req.query;

      const filters = { action };
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Audit logs for action '${action}' retrieved successfully`,
        data: result
      });
    } catch (error) {
      logger.error("Failed to get audit logs by action:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit logs by action",
        error: error.message
      });
    }
  }

  /**
   * Get audit logs by user
   */
  static async getAuditLogsByUser(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50, startDate, endDate } = req.query;

      const filters = { actorId: userId };
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Audit logs for user '${userId}' retrieved successfully`,
        data: result
      });
    } catch (error) {
      logger.error("Failed to get audit logs by user:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit logs by user",
        error: error.message
      });
    }
  }

  /**
   * Get audit logs by target
   */
  static async getAuditLogsByTarget(req, res) {
    try {
      const { targetType, targetId } = req.params;
      const { page = 1, limit = 50, startDate, endDate } = req.query;

      const filters = { targetType, targetId };
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Audit logs for ${targetType} '${targetId}' retrieved successfully`,
        data: result
      });
    } catch (error) {
      logger.error("Failed to get audit logs by target:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit logs by target",
        error: error.message
      });
    }
  }

  /**
   * Get audit logs by category
   */
  static async getAuditLogsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 50, startDate, endDate } = req.query;

      const filters = { category };
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Audit logs for category '${category}' retrieved successfully`,
        data: result
      });
    } catch (error) {
      logger.error("Failed to get audit logs by category:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit logs by category",
        error: error.message
      });
    }
  }

  /**
   * Get bulk operation audit logs
   */
  static async getBulkOperationLogs(req, res) {
    try {
      const { bulkOperationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const filters = { bulkOperationId };

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: `Bulk operation audit logs for '${bulkOperationId}' retrieved successfully`,
        data: result
      });
    } catch (error) {
      logger.error("Failed to get bulk operation audit logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve bulk operation audit logs",
        error: error.message
      });
    }
  }

  /**
   * Get login attempt logs
   */
  static async getLoginAttemptLogs(req, res) {
    try {
      const { page = 1, limit = 50, success, loginMethod, startDate, endDate } = req.query;

      const filters = {
        action: { $in: ["LOGIN_ATTEMPT_SUCCESS", "LOGIN_ATTEMPT_FAILED"] }
      };
      
      if (success !== undefined) {
        filters.action = success === "true" ? "LOGIN_ATTEMPT_SUCCESS" : "LOGIN_ATTEMPT_FAILED";
      }
      
      if (loginMethod) filters.loginMethod = loginMethod;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: "Login attempt logs retrieved successfully",
        data: result
      });
    } catch (error) {
      logger.error("Failed to get login attempt logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve login attempt logs",
        error: error.message
      });
    }
  }

  /**
   * Get security event logs
   */
  static async getSecurityEventLogs(req, res) {
    try {
      const { page = 1, limit = 50, securityEventType, startDate, endDate } = req.query;

      const filters = {
        action: "SECURITY_SETTINGS_CHANGED"
      };
      
      if (securityEventType) filters.securityEventType = securityEventType;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const result = await UserAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

      return res.status(200).json({
        success: true,
        message: "Security event logs retrieved successfully",
        data: result
      });
    } catch (error) {
      logger.error("Failed to get security event logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve security event logs",
        error: error.message
      });
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportAuditLogs(req, res) {
    try {
      const {
        action,
        actorId,
        actorRole,
        targetType,
        targetId,
        category,
        severity,
        bulkOperationId,
        loginMethod,
        securityEventType,
        startDate,
        endDate
      } = req.query;

      const filters = {
        action,
        actorId,
        actorRole,
        targetType,
        targetId,
        category,
        severity,
        bulkOperationId,
        loginMethod,
        securityEventType,
        startDate,
        endDate
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      // Get all logs without pagination for export
      const result = await UserAuditLogger.getAuditLogs(filters, 1, 10000);

      // Convert to CSV format
      const csvData = result.logs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        actorName: log.actorName,
        actorRole: log.actorRole,
        targetType: log.targetType,
        targetIdentifier: log.targetIdentifier,
        category: log.category,
        severity: log.severity,
        executionTime: log.executionTime,
        ipAddress: log.ipAddress,
        loginMethod: log.loginMethod,
        securityEventType: log.securityEventType,
        details: JSON.stringify(log.details)
      }));

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="user_audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);

      // Convert to CSV string
      const csvHeaders = Object.keys(csvData[0] || {}).join(',');
      const csvRows = csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');

      return res.send(csvContent);
    } catch (error) {
      logger.error("Failed to export audit logs:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to export audit logs",
        error: error.message
      });
    }
  }

  /**
   * Get audit dashboard data
   */
  static async getAuditDashboard(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const filters = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      const stats = await UserAuditLogger.getAuditStats(filters);

      // Get recent audit logs for dashboard
      const recentLogs = await UserAuditLogger.getAuditLogs(filters, 1, 10);

      // Get action breakdown
      const actionBreakdown = await UserAuditLogger.getAuditLogs(filters, 1, 1000);
      const actionCounts = {};
      actionBreakdown.logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      // Get category breakdown
      const categoryCounts = {};
      actionBreakdown.logs.forEach(log => {
        categoryCounts[log.category] = (categoryCounts[log.category] || 0) + 1;
      });

      // Get severity breakdown
      const severityCounts = {};
      actionBreakdown.logs.forEach(log => {
        severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
      });

      // Get login method breakdown
      const loginMethodCounts = {};
      actionBreakdown.logs.forEach(log => {
        if (log.loginMethod) {
          loginMethodCounts[log.loginMethod] = (loginMethodCounts[log.loginMethod] || 0) + 1;
        }
      });

      // Get security event breakdown
      const securityEventCounts = {};
      actionBreakdown.logs.forEach(log => {
        if (log.securityEventType) {
          securityEventCounts[log.securityEventType] = (securityEventCounts[log.securityEventType] || 0) + 1;
        }
      });

      return res.status(200).json({
        success: true,
        message: "Audit dashboard data retrieved successfully",
        data: {
          stats,
          recentLogs: recentLogs.logs,
          actionBreakdown: actionCounts,
          categoryBreakdown: categoryCounts,
          severityBreakdown: severityCounts,
          loginMethodBreakdown: loginMethodCounts,
          securityEventBreakdown: securityEventCounts
        }
      });
    } catch (error) {
      logger.error("Failed to get audit dashboard:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve audit dashboard data",
        error: error.message
      });
    }
  }
}

module.exports = AuditController;
