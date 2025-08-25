const AuditLog = require("../models/auditLog");
const logger = require("/packages/utils/logger");
const userServiceClient = require("./userServiceClient");

class AuditLogger {
  /**
   * Log an audit event
   * @param {Object} params - Audit log parameters
   * @param {String} params.action - The action performed
   * @param {String} params.actorId - ID of the user performing the action
   * @param {String} params.actorRole - Role of the user
   * @param {String} params.actorName - Name of the user
   * @param {String} params.targetType - Type of target (Order, User, Product, etc.)
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
   */
  static async log(params) {
    try {
      const auditLog = new AuditLog({
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
        timestamp: new Date()
      });

      await auditLog.save();
      
      // Log to console for debugging in development
      if (process.env.NODE_ENV === "development") {
        logger.info(`Audit Log: ${params.action} by ${params.actorName} (${params.actorRole})`);
      }
      
      return auditLog;
    } catch (error) {
      logger.error("Failed to create audit log:", error);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
  }

  /**
   * Log order-related actions
   */
  static async logOrderAction(params) {
    return this.log({
      ...params,
      targetType: "Order",
      category: "ORDER_MANAGEMENT"
    });
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
   * Log product-related actions
   */
  static async logProductAction(params) {
    return this.log({
      ...params,
      targetType: "Product",
      category: "PRODUCT_MANAGEMENT"
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
   * Log SLA-related actions
   */
  static async logSLAAction(params) {
    return this.log({
      ...params,
      targetType: "SLA",
      category: "SLA_MANAGEMENT"
    });
  }

  /**
   * Log payment-related actions
   */
  static async logPaymentAction(params) {
    return this.log({
      ...params,
      targetType: "Payment",
      category: "PAYMENT_MANAGEMENT"
    });
  }

  /**
   * Log report-related actions
   */
  static async logReportAction(params) {
    return this.log({
      ...params,
      targetType: "Report",
      category: "REPORTING"
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
   * Log security-related actions
   */
  static async logSecurityAction(params) {
    return this.log({
      ...params,
      category: "SECURITY"
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
              await AuditLogger.log({
                action: action,
                actorId: req.user.id || req.user._id,
                actorRole: req.user.role,
                actorName: req.user.name || req.user.email || "System User",
                targetType: targetType,
                targetId: req.params.id || req.params.orderId || req.params.userId,
                targetIdentifier: req.params.orderId || req.params.userId,
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
              logger.warn(`Audit log skipped for ${action} - no user information available (user: ${JSON.stringify(req.user)})`);
            }
          } catch (error) {
            logger.error("Middleware audit logging failed:", error);
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
              await AuditLogger.log({
                action: action,
                actorId: req.user.id || req.user._id,
                actorRole: req.user.role,
                actorName: req.user.name || req.user.email || "System User",
                targetType: targetType,
                targetId: req.params.id || req.params.orderId || req.params.userId,
                targetIdentifier: req.params.orderId || req.params.userId,
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
              logger.warn(`Audit log skipped for ${action} - no user information available (user: ${JSON.stringify(req.user)})`);
            }
          } catch (error) {
            logger.error("Middleware audit logging failed:", error);
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
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }
      
      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      // Fetch user information for all unique actorIds
      const uniqueActorIds = [...new Set(logs.map(log => log.actorId?.toString()))].filter(Boolean);
      const usersMap = new Map();
      
      if (uniqueActorIds.length > 0) {
        try {
          const usersData = await userServiceClient.fetchUsers(uniqueActorIds);
          if (usersData && usersData.data) {
            usersData.data.forEach(user => {
              usersMap.set(user._id || user.id, user);
            });
          }
        } catch (error) {
          logger.error("Failed to fetch users for audit logs:", error);
        }
      }

      // Attach user information to logs
      const logsWithUsers = logs.map(log => ({
        ...log,
        actorInfo: usersMap.get(log.actorId?.toString()) || null
      }));
      
      return {
        logs: logsWithUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error("Failed to get audit logs:", error);
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
      
      const stats = await AuditLog.aggregate([
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
      logger.error("Failed to get audit stats:", error);
      throw error;
    }
  }
}

module.exports = AuditLogger;
