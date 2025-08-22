const mongoose = require("mongoose");
const Report = require("../models/report");
const Order = require("../models/order");
const Return = require("../models/return");
const SLAViolation = require("../models/slaViolation");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const AuditLogger = require("../utils/auditLogger");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:5002";

class ReportsController {
  /**
   * Generate a new report
   */
  static async generateReport(req, res) {
    try {
      const { 
        name, 
        type, 
        parameters, 
        dateRange, 
        scope, 
        format = "CSV",
        isRecurring = false,
        frequency = null
      } = req.body;
      
      const { role, userId } = req.user;

      // Validate report type based on user role
      if (!this.validateReportAccess(role, type)) {
        return sendError(res, "Insufficient permissions to generate this report type", 403);
      }

      // Create report record
      const reportId = uuidv4();
      const report = new Report({
        reportId,
        name,
        type,
        category: this.getReportCategory(type),
        generatedBy: userId,
        generatedByRole: role,
        generatedByName: req.user.name || req.user.email,
        parameters,
        dateRange,
        scope,
        format,
        status: "PENDING",
        schedule: {
          isRecurring,
          frequency,
          nextGeneration: isRecurring ? this.calculateNextGeneration(frequency) : null
        },
        accessControl: {
          roles: [role],
          users: [userId],
          isPublic: false
        }
      });

      await report.save();

      // Log report generation
      await AuditLogger.logReportAction({
        action: "REPORT_GENERATED",
        actorId: userId,
        actorRole: role,
        actorName: req.user.name || req.user.email,
        targetId: report._id,
        targetIdentifier: reportId,
        details: { type, format, parameters },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      // Generate report asynchronously
      setImmediate(async () => {
        try {
          await this.processReportGeneration(report._id);
        } catch (error) {
          logger.error(`Failed to generate report ${reportId}:`, error);
          await Report.findByIdAndUpdate(report._id, {
            status: "FAILED",
            "generationDetails.errorMessage": error.message
          });
        }
      });

      return sendSuccess(res, {
        reportId,
        status: "PENDING",
        message: "Report generation started"
      }, "Report generation initiated successfully");
    } catch (error) {
      logger.error("Failed to generate report:", error);
      return sendError(res, "Failed to generate report", 500);
    }
  }

  /**
   * Get all reports for user
   */
  static async getReports(req, res) {
    try {
      const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;
      const { role, userId } = req.user;

      const query = {
        isDeleted: false,
        $or: [
          { "accessControl.roles": role },
          { "accessControl.users": userId },
          { "accessControl.isPublic": true },
          { generatedBy: userId }
        ]
      };

      if (type) query.type = type;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [reports, total] = await Promise.all([
        Report.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate("generatedBy", "name email")
          .lean(),
        Report.countDocuments(query)
      ]);

      return sendSuccess(res, {
        reports,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }, "Reports fetched successfully");
    } catch (error) {
      logger.error("Failed to get reports:", error);
      return sendError(res, "Failed to fetch reports", 500);
    }
  }

  /**
   * Get specific report details
   */
  static async getReport(req, res) {
    try {
      const { reportId } = req.params;
      const { role, userId } = req.user;

      const report = await Report.findOne({
        reportId,
        isDeleted: false,
        $or: [
          { "accessControl.roles": role },
          { "accessControl.users": userId },
          { "accessControl.isPublic": true },
          { generatedBy: userId }
        ]
      }).populate("generatedBy", "name email");

      if (!report) {
        return sendError(res, "Report not found or access denied", 404);
      }

      return sendSuccess(res, report, "Report details fetched successfully");
    } catch (error) {
      logger.error("Failed to get report details:", error);
      return sendError(res, "Failed to fetch report details", 500);
    }
  }

  /**
   * Download report file
   */
  static async downloadReport(req, res) {
    try {
      const { reportId } = req.params;
      const { role, userId } = req.user;

      const report = await Report.findOne({
        reportId,
        isDeleted: false,
        status: "COMPLETED",
        $or: [
          { "accessControl.roles": role },
          { "accessControl.users": userId },
          { "accessControl.isPublic": true },
          { generatedBy: userId }
        ]
      });

      if (!report) {
        return sendError(res, "Report not found or not ready for download", 404);
      }

      if (!report.fileDetails.filePath) {
        return sendError(res, "Report file not available", 404);
      }

      // Log download
      await AuditLogger.logReportAction({
        action: "REPORT_DOWNLOADED",
        actorId: userId,
        actorRole: role,
        actorName: req.user.name || req.user.email,
        targetId: report._id,
        targetIdentifier: reportId,
        details: { fileName: report.fileDetails.fileName },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      // Update download history
      await Report.findByIdAndUpdate(report._id, {
        $push: {
          downloadHistory: {
            downloadedBy: userId,
            downloadedByName: req.user.name || req.user.email,
            downloadedByRole: role,
            downloadedAt: new Date(),
            ipAddress: req.ip,
            userAgent: req.get("User-Agent")
          }
        }
      });

      // Return file download info
      return sendSuccess(res, {
        downloadUrl: report.fileDetails.downloadUrl || `/api/reports/${reportId}/file`,
        fileName: report.fileDetails.fileName,
        fileSize: report.fileDetails.fileSize,
        expiresAt: report.fileDetails.expiresAt
      }, "Report download info fetched successfully");
    } catch (error) {
      logger.error("Failed to get report download info:", error);
      return sendError(res, "Failed to get download info", 500);
    }
  }

  /**
   * Serve report file
   */
  static async serveReportFile(req, res) {
    try {
      const { reportId } = req.params;
      const { role, userId } = req.user;

      const report = await Report.findOne({
        reportId,
        isDeleted: false,
        status: "COMPLETED",
        $or: [
          { "accessControl.roles": role },
          { "accessControl.users": userId },
          { "accessControl.isPublic": true },
          { generatedBy: userId }
        ]
      });

      if (!report || !report.fileDetails.filePath) {
        return sendError(res, "Report file not found", 404);
      }

      const filePath = path.join(process.cwd(), report.fileDetails.filePath);
      
      try {
        await fs.access(filePath);
      } catch (error) {
        return sendError(res, "Report file not found on server", 404);
      }

      res.download(filePath, report.fileDetails.fileName);
    } catch (error) {
      logger.error("Failed to serve report file:", error);
      return sendError(res, "Failed to serve report file", 500);
    }
  }

  /**
   * Update report access control
   */
  static async updateReportAccess(req, res) {
    try {
      const { reportId } = req.params;
      const { roles, users, isPublic } = req.body;
      const { role, userId } = req.user;

      const report = await Report.findOne({
        reportId,
        generatedBy: userId,
        isDeleted: false
      });

      if (!report) {
        return sendError(res, "Report not found or access denied", 404);
      }

      const updates = {};
      if (roles !== undefined) updates["accessControl.roles"] = roles;
      if (users !== undefined) updates["accessControl.users"] = users;
      if (isPublic !== undefined) updates["accessControl.isPublic"] = isPublic;

      await Report.findByIdAndUpdate(report._id, updates);

      // Log access update
      await AuditLogger.logReportAction({
        action: "REPORT_ACCESS_UPDATED",
        actorId: userId,
        actorRole: role,
        actorName: req.user.name || req.user.email,
        targetId: report._id,
        targetIdentifier: reportId,
        details: { roles, users, isPublic },
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      return sendSuccess(res, {}, "Report access updated successfully");
    } catch (error) {
      logger.error("Failed to update report access:", error);
      return sendError(res, "Failed to update report access", 500);
    }
  }

  /**
   * Delete report (soft delete)
   */
  static async deleteReport(req, res) {
    try {
      const { reportId } = req.params;
      const { role, userId } = req.user;

      const report = await Report.findOne({
        reportId,
        generatedBy: userId,
        isDeleted: false
      });

      if (!report) {
        return sendError(res, "Report not found or access denied", 404);
      }

      await Report.findByIdAndUpdate(report._id, {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId
      });

      // Log deletion
      await AuditLogger.logReportAction({
        action: "REPORT_DELETED",
        actorId: userId,
        actorRole: role,
        actorName: req.user.name || req.user.email,
        targetId: report._id,
        targetIdentifier: reportId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });

      return sendSuccess(res, {}, "Report deleted successfully");
    } catch (error) {
      logger.error("Failed to delete report:", error);
      return sendError(res, "Failed to delete report", 500);
    }
  }

  /**
   * Get report templates
   */
  static async getReportTemplates(req, res) {
    try {
      const { role } = req.user;

      const templates = this.getAvailableTemplates(role);

      return sendSuccess(res, templates, "Report templates fetched successfully");
    } catch (error) {
      logger.error("Failed to get report templates:", error);
      return sendError(res, "Failed to fetch report templates", 500);
    }
  }

  // Helper methods

  /**
   * Validate report access based on user role
   */
  static validateReportAccess(role, reportType) {
    const rolePermissions = {
      "Super Admin": ["ORDER_ANALYTICS", "DEALER_PERFORMANCE", "SLA_COMPLIANCE", "FINANCIAL_REPORT", "INVENTORY_REPORT", "RETURN_ANALYSIS", "AUDIT_LOG", "CUSTOM_REPORT"],
      "Fulfilment Admin": ["ORDER_ANALYTICS", "DEALER_PERFORMANCE", "SLA_COMPLIANCE", "RETURN_ANALYSIS"],
      "Inventory Admin": ["INVENTORY_REPORT", "RETURN_ANALYSIS"],
      "Dealer": ["ORDER_ANALYTICS", "CUSTOM_REPORT"],
      "Customer": ["ORDER_ANALYTICS"]
    };

    return rolePermissions[role]?.includes(reportType) || false;
  }

  /**
   * Get report category
   */
  static getReportCategory(type) {
    const categoryMap = {
      "ORDER_ANALYTICS": "ANALYTICS",
      "DEALER_PERFORMANCE": "PERFORMANCE",
      "SLA_COMPLIANCE": "COMPLIANCE",
      "FINANCIAL_REPORT": "FINANCIAL",
      "INVENTORY_REPORT": "INVENTORY",
      "RETURN_ANALYSIS": "ANALYTICS",
      "AUDIT_LOG": "AUDIT",
      "CUSTOM_REPORT": "CUSTOM"
    };

    return categoryMap[type] || "CUSTOM";
  }

  /**
   * Calculate next generation date for recurring reports
   */
  static calculateNextGeneration(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case "DAILY":
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case "WEEKLY":
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case "MONTHLY":
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      case "QUARTERLY":
        return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
      case "YEARLY":
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      default:
        return null;
    }
  }

  /**
   * Process report generation
   */
  static async processReportGeneration(reportId) {
    const report = await Report.findById(reportId);
    if (!report) return;

    try {
      // Update status to generating
      await Report.findByIdAndUpdate(reportId, {
        status: "GENERATING",
        "generationDetails.startedAt": new Date()
      });

      const startTime = Date.now();

      // Generate report data based on type
      const reportData = await this.generateReportData(report.type, report.parameters, report.dateRange, report.scope);

      // Create export directory if it doesn't exist
      const exportDir = path.join(process.cwd(), "exports");
      try {
        await fs.access(exportDir);
      } catch {
        await fs.mkdir(exportDir, { recursive: true });
      }

      // Generate file
      const fileName = `${report.reportId}_${Date.now()}.${report.format.toLowerCase()}`;
      const filePath = path.join(exportDir, fileName);
      
      await this.createReportFile(reportData, filePath, report.format);

      // Get file stats
      const fileStats = await fs.stat(filePath);

      // Update report with file details
      await Report.findByIdAndUpdate(reportId, {
        status: "COMPLETED",
        "generationDetails.completedAt": new Date(),
        "generationDetails.executionTime": Date.now() - startTime,
        "generationDetails.recordCount": reportData.length || 0,
        "fileDetails.fileName": fileName,
        "fileDetails.filePath": filePath,
        "fileDetails.fileSize": fileStats.size,
        "fileDetails.downloadUrl": `/api/reports/${report.reportId}/download`,
        "fileDetails.expiresAt": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

      logger.info(`Report ${report.reportId} generated successfully`);
    } catch (error) {
      logger.error(`Failed to generate report ${report.reportId}:`, error);
      await Report.findByIdAndUpdate(reportId, {
        status: "FAILED",
        "generationDetails.errorMessage": error.message
      });
    }
  }

  /**
   * Generate report data based on type
   */
  static async generateReportData(type, parameters, dateRange, scope) {
    const filter = {};

    // Apply date range
    if (dateRange?.startDate || dateRange?.endDate) {
      filter.createdAt = {};
      if (dateRange.startDate) filter.createdAt.$gte = new Date(dateRange.startDate);
      if (dateRange.endDate) filter.createdAt.$lte = new Date(dateRange.endDate);
    }

    // Apply scope filters
    if (scope?.dealers?.length) filter["dealerMapping.dealerId"] = { $in: scope.dealers };
    if (scope?.regions?.length) filter["customerDetails.pincode"] = { $regex: scope.regions.join("|"), $options: "i" };
    if (scope?.products?.length) filter["skus.sku"] = { $in: scope.products };

    switch (type) {
      case "ORDER_ANALYTICS":
        return await this.generateOrderAnalyticsReport(filter, parameters);
      case "DEALER_PERFORMANCE":
        return await this.generateDealerPerformanceReport(filter, parameters);
      case "SLA_COMPLIANCE":
        return await this.generateSLAComplianceReport(filter, parameters);
      case "FINANCIAL_REPORT":
        return await this.generateFinancialReport(filter, parameters);
      case "INVENTORY_REPORT":
        return await this.generateInventoryReport(filter, parameters);
      case "RETURN_ANALYSIS":
        return await this.generateReturnAnalysisReport(filter, parameters);
      case "AUDIT_LOG":
        return await this.generateAuditLogReport(filter, parameters);
      default:
        return [];
    }
  }

  /**
   * Create report file
   */
  static async createReportFile(data, filePath, format) {
    switch (format) {
      case "CSV":
        return await this.createCSVFile(data, filePath);
      case "JSON":
        return await this.createJSONFile(data, filePath);
      case "EXCEL":
        return await this.createExcelFile(data, filePath);
      case "PDF":
        return await this.createPDFFile(data, filePath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Report generation methods (implementations would be added based on specific requirements)
  static async generateOrderAnalyticsReport(filter, parameters) {
    // Implementation for order analytics report
    return [];
  }

  static async generateDealerPerformanceReport(filter, parameters) {
    // Implementation for dealer performance report
    return [];
  }

  static async generateSLAComplianceReport(filter, parameters) {
    // Implementation for SLA compliance report
    return [];
  }

  static async generateFinancialReport(filter, parameters) {
    // Implementation for financial report
    return [];
  }

  static async generateInventoryReport(filter, parameters) {
    // Implementation for inventory report
    return [];
  }

  static async generateReturnAnalysisReport(filter, parameters) {
    // Implementation for return analysis report
    return [];
  }

  static async generateAuditLogReport(filter, parameters) {
    // Implementation for audit log report
    return [];
  }

  // File creation methods
  static async createCSVFile(data, filePath) {
    // Implementation for CSV file creation
    await fs.writeFile(filePath, "CSV data");
  }

  static async createJSONFile(data, filePath) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  static async createExcelFile(data, filePath) {
    // Implementation for Excel file creation
    await fs.writeFile(filePath, "Excel data");
  }

  static async createPDFFile(data, filePath) {
    // Implementation for PDF file creation
    await fs.writeFile(filePath, "PDF data");
  }

  /**
   * Get available templates based on role
   */
  static getAvailableTemplates(role) {
    const templates = {
      "Super Admin": [
        { type: "ORDER_ANALYTICS", name: "Order Analytics Report", description: "Comprehensive order analysis and trends" },
        { type: "DEALER_PERFORMANCE", name: "Dealer Performance Report", description: "Dealer performance metrics and rankings" },
        { type: "SLA_COMPLIANCE", name: "SLA Compliance Report", description: "Service level agreement compliance analysis" },
        { type: "FINANCIAL_REPORT", name: "Financial Report", description: "Revenue and financial performance analysis" },
        { type: "INVENTORY_REPORT", name: "Inventory Report", description: "Stock levels and inventory analysis" },
        { type: "RETURN_ANALYSIS", name: "Return Analysis Report", description: "Return patterns and analysis" },
        { type: "AUDIT_LOG", name: "Audit Log Report", description: "System audit trail and activity logs" }
      ],
      "Fulfilment Admin": [
        { type: "ORDER_ANALYTICS", name: "Order Analytics Report", description: "Order processing and fulfillment analysis" },
        { type: "DEALER_PERFORMANCE", name: "Dealer Performance Report", description: "Dealer fulfillment performance" },
        { type: "SLA_COMPLIANCE", name: "SLA Compliance Report", description: "Fulfillment SLA compliance" },
        { type: "RETURN_ANALYSIS", name: "Return Analysis Report", description: "Return processing analysis" }
      ],
      "Inventory Admin": [
        { type: "INVENTORY_REPORT", name: "Inventory Report", description: "Stock levels and inventory analysis" },
        { type: "RETURN_ANALYSIS", name: "Return Analysis Report", description: "Return patterns and inventory impact" }
      ],
      "Dealer": [
        { type: "ORDER_ANALYTICS", name: "My Orders Report", description: "Personal order analytics" }
      ]
    };

    return templates[role] || [];
  }
}

module.exports = ReportsController;
