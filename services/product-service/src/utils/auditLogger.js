const ProductAuditLog = require("../models/auditLog");
const logger = require("/packages/utils/logger");
const userServiceClient = require("./userServiceClient");

class ProductAuditLogger {
  /**
   * Log an audit event
   * @param {Object} params - Audit log parameters
   * @param {String} params.action - The action performed
   * @param {String} params.actorId - ID of the user performing the action
   * @param {String} params.actorRole - Role of the user
   * @param {String} params.actorName - Name of the user
   * @param {String} params.targetType - Type of target (Product, Category, etc.)
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
   * @param {String} params.fileName - File name for file operations
   * @param {Number} params.fileSize - File size for file operations
   */
  static async log(params) {
    try {
      const auditLog = new ProductAuditLog({
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
        fileName: params.fileName,
        fileSize: params.fileSize,
        timestamp: new Date()
      });

      await auditLog.save();
      
      // Log to console for debugging in development
      if (process.env.NODE_ENV === "development") {
        logger.info(`Product Audit Log: ${params.action} by ${params.actorName} (${params.actorRole})`);
      }
      
      return auditLog;
    } catch (error) {
      logger.error("Failed to create product audit log:", error);
      // Don't throw error to avoid breaking the main flow
      return null;
    }
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
   * Log category-related actions
   */
  static async logCategoryAction(params) {
    return this.log({
      ...params,
      targetType: "Category",
      category: "CATEGORY_MANAGEMENT"
    });
  }

  /**
   * Log subcategory-related actions
   */
  static async logSubcategoryAction(params) {
    return this.log({
      ...params,
      targetType: "Subcategory",
      category: "CATEGORY_MANAGEMENT"
    });
  }

  /**
   * Log brand-related actions
   */
  static async logBrandAction(params) {
    return this.log({
      ...params,
      targetType: "Brand",
      category: "BRAND_MANAGEMENT"
    });
  }

  /**
   * Log model-related actions
   */
  static async logModelAction(params) {
    return this.log({
      ...params,
      targetType: "Model",
      category: "MODEL_MANAGEMENT"
    });
  }

  /**
   * Log variant-related actions
   */
  static async logVariantAction(params) {
    return this.log({
      ...params,
      targetType: "Variant",
      category: "VARIANT_MANAGEMENT"
    });
  }

  /**
   * Log manufacturer-related actions
   */
  static async logManufacturerAction(params) {
    return this.log({
      ...params,
      targetType: "Manufacturer",
      category: "MANUFACTURER_MANAGEMENT"
    });
  }

  /**
   * Log type-related actions
   */
  static async logTypeAction(params) {
    return this.log({
      ...params,
      targetType: "Type",
      category: "TYPE_MANAGEMENT"
    });
  }

  /**
   * Log year-related actions
   */
  static async logYearAction(params) {
    return this.log({
      ...params,
      targetType: "Year",
      category: "YEAR_MANAGEMENT"
    });
  }

  /**
   * Log banner-related actions
   */
  static async logBannerAction(params) {
    return this.log({
      ...params,
      targetType: "Banner",
      category: "BANNER_MANAGEMENT"
    });
  }

  /**
   * Log vehicle info-related actions
   */
  static async logVehicleInfoAction(params) {
    return this.log({
      ...params,
      targetType: "VehicleInfo",
      category: "VEHICLE_MANAGEMENT"
    });
  }

  /**
   * Log popular vehicle-related actions
   */
  static async logPopularVehicleAction(params) {
    return this.log({
      ...params,
      targetType: "PopularVehicle",
      category: "VEHICLE_MANAGEMENT"
    });
  }

  /**
   * Log purchase order-related actions
   */
  static async logPurchaseOrderAction(params) {
    return this.log({
      ...params,
      targetType: "PurchaseOrder",
      category: "PURCHASE_ORDER_MANAGEMENT"
    });
  }

  /**
   * Log stock-related actions
   */
  static async logStockAction(params) {
    return this.log({
      ...params,
      targetType: "Product",
      category: "STOCK_MANAGEMENT"
    });
  }

  /**
   * Log pricing-related actions
   */
  static async logPricingAction(params) {
    return this.log({
      ...params,
      targetType: "Product",
      category: "PRICING_MANAGEMENT"
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
              await ProductAuditLogger.log({
                action: action,
                actorId: req.user.id || req.user._id,
                actorRole: req.user.role,
                actorName: req.user.name || req.user.email || "System User",
                targetType: targetType,
                targetId: req.params.id || req.params.productId || req.params.categoryId,
                targetIdentifier: req.params.sku || req.params.productId || req.params.categoryId,
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
              logger.warn(`Product audit log skipped for ${action} - no user information available (user: ${JSON.stringify(req.user)})`);
            }
          } catch (error) {
            logger.error("Product middleware audit logging failed:", error);
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
              await ProductAuditLogger.log({
                action: action,
                actorId: req.user.id || req.user._id,
                actorRole: req.user.role,
                actorName: req.user.name || req.user.email || "System User",
                targetType: targetType,
                targetId: req.params.id || req.params.productId || req.params.categoryId,
                targetIdentifier: req.params.sku || req.params.productId || req.params.categoryId,
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
              logger.warn(`Product audit log skipped for ${action} - no user information available (user: ${JSON.stringify(req.user)})`);
            }
          } catch (error) {
            logger.error("Product middleware audit logging failed:", error);
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
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }
      
      const [logs, total] = await Promise.all([
        ProductAuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ProductAuditLog.countDocuments(query)
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
      logger.error("Failed to get product audit logs:", error);
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
      
      const stats = await ProductAuditLog.aggregate([
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
      logger.error("Failed to get product audit stats:", error);
      throw error;
    }
  }

  /**
   * Log bulk operation start
   */
  static async logBulkOperationStart(operationId, operationType, actorInfo, details = {}) {
    return this.log({
      action: "BULK_OPERATION_STARTED",
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
      action: "BULK_OPERATION_COMPLETED",
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
      action: "BULK_OPERATION_FAILED",
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

module.exports = ProductAuditLogger;
