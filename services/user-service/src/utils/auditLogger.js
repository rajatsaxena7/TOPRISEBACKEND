const UserAuditLog = require("../models/auditLog");
const logger = require("/packages/utils/logger");

class UserAuditLogger {
  /**
   * Log an audit event
   * @param {Object} params - Audit log parameters
   * @param {String} params.action - The action performed
   * @param {String} params.actorId - ID of the user performing the action
   * @param {String} params.actorRole - Role of the user
   * @param {String} params.actorName - Name of the user
   * @param {String} params.targetType - Type of target (User, Dealer, etc.)
   * @param {String} params.targetId - ID of the target
   * @param {String} params.targetIdentifier - Human-readable identifier
   * @param {Object} params.details - Additional details
   * @param {String} params.ipAddress - IP address of the request
   * @param {String} params.userAgent - User agent string
   * @param {String} params.sessionId - Session ID
   * @param {String} params.severity - Severity level (LOW, MEDIUM, HIGH, CRITICAL)
   * @param {String} params.category - Category of the action
   * @param {Number} params.executionTime - Execution time in milliseconds
   * @param {Object} params.oldValues - Previous values (for updates)
   * @param {Object} params.newValues - New values (for updates)
   * @param {Object} params.errorDetails - Error details if any
   * @param {String} params.bulkOperationId - ID for bulk operations
   * @param {String} params.loginMethod - Login method used
   * @param {String} params.securityEventType - Type of security event
   * @param {Object} params.location - Location information
   */
  static async log(params) {
    try {
      const auditLog = new UserAuditLog({
        action: params.action,
        actorId: params.actorId,
        actorRole: params.actorRole,
        actorName: params.actorName,
        targetType: params.targetType,
        targetId: params.targetId,
        targetIdentifier: params.targetIdentifier,
        details: params.details || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        sessionId: params.sessionId,
        severity: params.severity || "LOW",
        category: params.category,
        executionTime: params.executionTime,
        oldValues: params.oldValues,
        newValues: params.newValues,
        errorDetails: params.errorDetails,
        bulkOperationId: params.bulkOperationId,
        loginMethod: params.loginMethod,
        securityEventType: params.securityEventType,
        location: params.location,
        timestamp: new Date()
      });

      await auditLog.save();
      
      // Log to console for debugging in development
      if (process.env.NODE_ENV === "development") {
        logger.info(`User Audit Log: ${params.action} by ${params.actorName} (${params.actorRole})`);
      }
      
      return auditLog;
    } catch (error) {
      logger.error("Failed to create user audit log:", error);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  }

  /**
   * Log user-related actions
   */
  static async logUserAction(params) {
    return this.log({
      ...params,
      targetType: "User",
      category: "USER_MANAGEMENT"
    });
  }

  /**
   * Log dealer-related actions
   */
  static async logDealerAction(params) {
    return this.log({
      ...params,
      targetType: "Dealer",
      category: "DEALER_MANAGEMENT"
    });
  }

  /**
   * Log employee-related actions
   */
  static async logEmployeeAction(params) {
    return this.log({
      ...params,
      targetType: "Employee",
      category: "EMPLOYEE_MANAGEMENT"
    });
  }

  /**
   * Log role-related actions
   */
  static async logRoleAction(params) {
    return this.log({
      ...params,
      targetType: "User",
      category: "ROLE_MANAGEMENT"
    });
  }

  /**
   * Log permission-related actions
   */
  static async logPermissionAction(params) {
    return this.log({
      ...params,
      targetType: "PermissionMatrix",
      category: "PERMISSION_MANAGEMENT"
    });
  }

  /**
   * Log authentication-related actions
   */
  static async logAuthenticationAction(params) {
    return this.log({
      ...params,
      targetType: "User",
      category: "AUTHENTICATION"
    });
  }

  /**
   * Log security-related actions
   */
  static async logSecurityAction(params) {
    return this.log({
      ...params,
      targetType: "User",
      category: "SECURITY"
    });
  }

  /**
   * Log contact form-related actions
   */
  static async logContactFormAction(params) {
    return this.log({
      ...params,
      targetType: "ContactForm",
      category: "CONTACT_MANAGEMENT"
    });
  }

  /**
   * Log app setting-related actions
   */
  static async logAppSettingAction(params) {
    return this.log({
      ...params,
      targetType: "AppSetting",
      category: "APP_CONFIGURATION"
    });
  }

  /**
   * Log SLA configuration-related actions
   */
  static async logSLAConfigAction(params) {
    return this.log({
      ...params,
      targetType: "SLAConfig",
      category: "SLA_MANAGEMENT"
    });
  }

  /**
   * Log system-related actions
   */
  static async logSystemAction(params) {
    return this.log({
      ...params,
      targetType: "System",
      category: "SYSTEM_ADMIN"
    });
  }

  /**
   * Log reporting-related actions
   */
  static async logReportingAction(params) {
    return this.log({
      ...params,
      targetType: "System",
      category: "REPORTING"
    });
  }

  /**
   * Create middleware for automatic audit logging
   */
  static createMiddleware(action, targetType = null, category = null) {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      // Store original send methods
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Override send method to capture response
      res.send = function(data) {
        const executionTime = Date.now() - startTime;
        
        // Log the action asynchronously (don't wait for it)
        setImmediate(async () => {
          try {
            // Only create audit log if we have valid user information
            if (req.user && req.user.id && req.user.role) {
              await UserAuditLogger.log({
                action: action,
                actorId: req.user.id || req.user._id,
                actorRole: req.user.role,
                actorName: req.user.name || req.user.email || "System User",
                targetType: targetType,
                targetId: req.params.id || req.params.userId || req.params.dealerId,
                targetIdentifier: req.params.email || req.params.phone || req.params.userId || req.params.dealerId,
                details: {
                  method: req.method,
                  url: req.originalUrl,
                  statusCode: res.statusCode,
                  requestBody: req.body,
                  queryParams: req.query
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get("User-Agent"),
                sessionId: req.session?.id,
                severity: res.statusCode >= 400 ? "HIGH" : "LOW",
                category: category,
                executionTime: executionTime,
                errorDetails: res.statusCode >= 400 ? { statusCode: res.statusCode, data } : null
              });
            } else {
              // Log to console for debugging when user info is missing
              logger.warn(`User audit log skipped for ${action} - no user information available (user: ${JSON.stringify(req.user)})`);
            }
          } catch (error) {
            logger.error("User middleware audit logging failed:", error);
          }
        });
        
        return originalSend.call(this, data);
      };
      
      // Override json method similarly
      res.json = function(data) {
        const executionTime = Date.now() - startTime;
        
        setImmediate(async () => {
          try {
            // Only create audit log if we have valid user information
            if (req.user && req.user.id && req.user.role) {
              await UserAuditLogger.log({
                action: action,
                actorId: req.user.id || req.user._id,
                actorRole: req.user.role,
                actorName: req.user.name || req.user.email || "System User",
                targetType: targetType,
                targetId: req.params.id || req.params.userId || req.params.dealerId,
                targetIdentifier: req.params.email || req.params.phone || req.params.userId || req.params.dealerId,
                details: {
                  method: req.method,
                  url: req.originalUrl,
                  statusCode: res.statusCode,
                  requestBody: req.body,
                  queryParams: req.query
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get("User-Agent"),
                sessionId: req.session?.id,
                severity: res.statusCode >= 400 ? "HIGH" : "LOW",
                category: category,
                executionTime: executionTime,
                errorDetails: res.statusCode >= 400 ? { statusCode: res.statusCode, data } : null
              });
            } else {
              // Log to console for debugging when user info is missing
              logger.warn(`User audit log skipped for ${action} - no user information available (user: ${JSON.stringify(req.user)})`);
            }
          } catch (error) {
            logger.error("User middleware audit logging failed:", error);
          }
        });
        
        return originalJson.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      const query = {};
      
      if (filters.action) query.action = filters.action;
      if (filters.actorId) query.actorId = filters.actorId;
      if (filters.actorRole) query.actorRole = filters.actorRole;
      if (filters.targetType) query.targetType = filters.targetType;
      if (filters.targetId) query.targetId = filters.targetId;
      if (filters.category) query.category = filters.category;
      if (filters.severity) query.severity = filters.severity;
      if (filters.bulkOperationId) query.bulkOperationId = filters.bulkOperationId;
      if (filters.loginMethod) query.loginMethod = filters.loginMethod;
      if (filters.securityEventType) query.securityEventType = filters.securityEventType;
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }
      
      const [logs, total] = await Promise.all([
        UserAuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate("actorId", "name email role")
          .lean(),
        UserAuditLog.countDocuments(query)
      ]);
      
      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error("Failed to get user audit logs:", error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(filters = {}) {
    try {
      const query = {};
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }
      
      const stats = await UserAuditLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalLogs: { $sum: 1 },
            uniqueUsers: { $addToSet: "$actorId" },
            uniqueActions: { $addToSet: "$action" },
            avgExecutionTime: { $avg: "$executionTime" },
            errorCount: {
              $sum: { $cond: [{ $ne: ["$errorDetails", null] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalLogs: 1,
            uniqueUsers: { $size: "$uniqueUsers" },
            uniqueActions: { $size: "$uniqueActions" },
            avgExecutionTime: { $round: ["$avgExecutionTime", 2] },
            errorCount: 1
          }
        }
      ]);
      
      return stats[0] || {
        totalLogs: 0,
        uniqueUsers: 0,
        uniqueActions: 0,
        avgExecutionTime: 0,
        errorCount: 0
      };
    } catch (error) {
      logger.error("Failed to get user audit stats:", error);
      throw error;
    }
  }

  /**
   * Log login attempt
   */
  static async logLoginAttempt(userId, userRole, userName, success, details = {}) {
    return this.log({
      action: success ? "LOGIN_ATTEMPT_SUCCESS" : "LOGIN_ATTEMPT_FAILED",
      actorId: userId,
      actorRole: userRole,
      actorName: userName,
      targetType: "User",
      category: "AUTHENTICATION",
      details: {
        success,
        ...details
      },
      severity: success ? "LOW" : "MEDIUM",
      loginMethod: details.loginMethod || "email"
    });
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(userId, userRole, userName, eventType, details = {}) {
    return this.log({
      action: "SECURITY_SETTINGS_CHANGED",
      actorId: userId,
      actorRole: userRole,
      actorName: userName,
      targetType: "User",
      category: "SECURITY",
      securityEventType: eventType,
      details,
      severity: "HIGH"
    });
  }

  /**
   * Log bulk operation start
   */
  static async logBulkOperationStart(operationId, operationType, actorInfo, details = {}) {
    return this.log({
      action: "BULK_USER_IMPORT",
      actorId: actorInfo.id,
      actorRole: actorInfo.role,
      actorName: actorInfo.name,
      targetType: "System",
      category: "SYSTEM_ADMIN",
      bulkOperationId: operationId,
      details: {
        operationType,
        ...details
      },
      severity: "MEDIUM"
    });
  }

  /**
   * Log bulk operation completion
   */
  static async logBulkOperationComplete(operationId, operationType, actorInfo, details = {}) {
    return this.log({
      action: "BULK_USER_EXPORT",
      actorId: actorInfo.id,
      actorRole: actorInfo.role,
      actorName: actorInfo.name,
      targetType: "System",
      category: "SYSTEM_ADMIN",
      bulkOperationId: operationId,
      details: {
        operationType,
        ...details
      },
      severity: "LOW"
    });
  }

  /**
   * Log bulk operation failure
   */
  static async logBulkOperationFailure(operationId, operationType, actorInfo, errorDetails, details = {}) {
    return this.log({
      action: "USER_SYNC_FAILED",
      actorId: actorInfo.id,
      actorRole: actorInfo.role,
      actorName: actorInfo.name,
      targetType: "System",
      category: "SYSTEM_ADMIN",
      bulkOperationId: operationId,
      details: {
        operationType,
        ...details
      },
      errorDetails,
      severity: "HIGH"
    });
  }
}

module.exports = UserAuditLogger;
