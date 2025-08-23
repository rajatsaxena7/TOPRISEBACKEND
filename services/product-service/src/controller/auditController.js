const ProductAuditLogger = require("../utils/auditLogger");
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
        startDate,
        endDate
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const result = await ProductAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

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

      const stats = await ProductAuditLogger.getAuditStats(filters);

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

      const result = await ProductAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

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

      const result = await ProductAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

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

      const result = await ProductAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

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

      const result = await ProductAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

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

      const result = await ProductAuditLogger.getAuditLogs(filters, parseInt(page), parseInt(limit));

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
      const result = await ProductAuditLogger.getAuditLogs(filters, 1, 10000);

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
        details: JSON.stringify(log.details)
      }));

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);

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

      const stats = await ProductAuditLogger.getAuditStats(filters);

      // Get recent audit logs for dashboard
      const recentLogs = await ProductAuditLogger.getAuditLogs(filters, 1, 10);

      // Get action breakdown
      const actionBreakdown = await ProductAuditLogger.getAuditLogs(filters, 1, 1000);
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

      return res.status(200).json({
        success: true,
        message: "Audit dashboard data retrieved successfully",
        data: {
          stats,
          recentLogs: recentLogs.logs,
          actionBreakdown: actionCounts,
          categoryBreakdown: categoryCounts,
          severityBreakdown: severityCounts
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
