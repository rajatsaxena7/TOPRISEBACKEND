const express = require("express");
const router = express.Router();
const ReportsController = require("../controllers/reportsController");
const AuditLogger = require("../utils/auditLogger");
const { optionalAuth } = require("../middleware/authMiddleware");

// Middleware for role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
};

// Middleware for audit logging - only applies when user is authenticated
const auditMiddleware = (action, targetType = null, category = null) => {
  return (req, res, next) => {
    // Only apply audit logging if user is authenticated
    if (req.user && req.user.id && req.user.role) {
      return AuditLogger.createMiddleware(action, targetType, category)(req, res, next);
    } else {
      // Skip audit logging and continue to next middleware
      return next();
    }
  };
};

// Report Generation Routes

/**
 * @route GET /api/reports/dashboard
 * @desc Get comprehensive dashboard reports with all key metrics
 * @access Super Admin, Fulfillment Admin, Inventory Admin, Analytics Admin
 */
router.get("/dashboard", 
  optionalAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"]),
  auditMiddleware("DASHBOARD_REPORTS_ACCESSED", "System", "REPORTING"),
  ReportsController.getDashboardReports
);

/**
 * @route POST /api/reports/generate
 * @desc Generate a new report
 * @access All authenticated users (role-based report types)
 */
router.post("/generate", 
  optionalAuth,
  auditMiddleware("REPORT_GENERATION_REQUESTED", "Report", "REPORTING"),
  ReportsController.generateReport
);

/**
 * @route GET /api/reports/templates
 * @desc Get available report templates based on user role
 * @access All authenticated users
 */
router.get("/templates", 
  optionalAuth,
  auditMiddleware("REPORT_TEMPLATES_ACCESSED", "Report", "REPORTING"),
  ReportsController.getReportTemplates
);

// Report Management Routes

/**
 * @route GET /api/reports
 * @desc Get all reports for user with filtering and pagination
 * @access All authenticated users (role-based access)
 */
router.get("/", 
  optionalAuth,
  auditMiddleware("REPORTS_LIST_ACCESSED", "Report", "REPORTING"),
  ReportsController.getReports
);

/**
 * @route GET /api/reports/:reportId
 * @desc Get specific report details
 * @access Report owner, users with access, public reports
 */
router.get("/:reportId", 
  auditMiddleware("REPORT_DETAILS_ACCESSED", "Report", "REPORTING"),
  ReportsController.getReport
);

/**
 * @route PUT /api/reports/:reportId/access
 * @desc Update report access control
 * @access Report owner only
 */
router.put("/:reportId/access", 
  auditMiddleware("REPORT_ACCESS_UPDATED", "Report", "REPORTING"),
  ReportsController.updateReportAccess
);

/**
 * @route DELETE /api/reports/:reportId
 * @desc Delete report (soft delete)
 * @access Report owner only
 */
router.delete("/:reportId", 
  auditMiddleware("REPORT_DELETED", "Report", "REPORTING"),
  ReportsController.deleteReport
);

// Report Download Routes

/**
 * @route GET /api/reports/:reportId/download
 * @desc Get report download information
 * @access Report owner, users with access, public reports
 */
router.get("/:reportId/download", 
  auditMiddleware("REPORT_DOWNLOAD_REQUESTED", "Report", "REPORTING"),
  ReportsController.downloadReport
);

/**
 * @route GET /api/reports/:reportId/file
 * @desc Serve report file for download
 * @access Report owner, users with access, public reports
 */
router.get("/:reportId/file", 
  auditMiddleware("REPORT_FILE_DOWNLOADED", "Report", "REPORTING"),
  ReportsController.serveReportFile
);

// Scheduled Reports Routes

/**
 * @route GET /api/reports/scheduled
 * @desc Get scheduled reports for user
 * @access All authenticated users
 */
router.get("/scheduled", 
  requireRole(["Super Admin", "Fulfilment Admin", "Inventory Admin"]),
  auditMiddleware("SCHEDULED_REPORTS_ACCESSED", "Report", "REPORTING"),
  async (req, res) => {
    try {
      const { role, userId } = req.user;
      
      const query = {
        isDeleted: false,
        "schedule.isRecurring": true,
        $or: [
          { "accessControl.roles": role },
          { "accessControl.users": userId },
          { generatedBy: userId }
        ]
      };
      
      const scheduledReports = await ReportsController.Report.find(query)
        .sort({ "schedule.nextGeneration": 1 })
        .populate("generatedBy", "name email")
        .lean();
      
      return res.json({
        success: true,
        data: scheduledReports,
        message: "Scheduled reports fetched successfully"
      });
    } catch (error) {
      console.error("Scheduled reports error:", error);
      return res.status(500).json({ error: "Failed to fetch scheduled reports" });
    }
  }
);

/**
 * @route POST /api/reports/:reportId/schedule
 * @desc Update report schedule
 * @access Report owner only
 */
router.post("/:reportId/schedule", 
  requireRole(["Super Admin", "Fulfilment Admin", "Inventory Admin"]),
  auditMiddleware("REPORT_SCHEDULE_UPDATED", "Report", "REPORTING"),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { isRecurring, frequency } = req.body;
      const { role, userId } = req.user;
      
      const report = await ReportsController.Report.findOne({
        reportId,
        generatedBy: userId,
        isDeleted: false
      });
      
      if (!report) {
        return res.status(404).json({ error: "Report not found or access denied" });
      }
      
      const updates = {
        "schedule.isRecurring": isRecurring,
        "schedule.frequency": frequency,
        "schedule.nextGeneration": isRecurring ? 
          ReportsController.calculateNextGeneration(frequency) : null
      };
      
      await ReportsController.Report.findByIdAndUpdate(report._id, updates);
      
      return res.json({
        success: true,
        message: "Report schedule updated successfully"
      });
    } catch (error) {
      console.error("Report schedule update error:", error);
      return res.status(500).json({ error: "Failed to update report schedule" });
    }
  }
);

// Report History Routes

/**
 * @route GET /api/reports/:reportId/history
 * @desc Get report generation and download history
 * @access Report owner, Super Admin
 */
router.get("/:reportId/history", 
  requireRole(["Super Admin"]),
  auditMiddleware("REPORT_HISTORY_ACCESSED", "Report", "REPORTING"),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { role, userId } = req.user;
      
      const report = await ReportsController.Report.findOne({
        reportId,
        isDeleted: false,
        $or: [
          { generatedBy: userId },
          { "accessControl.roles": role }
        ]
      }).populate("generatedBy", "name email");
      
      if (!report) {
        return res.status(404).json({ error: "Report not found or access denied" });
      }
      
      const history = {
        report: {
          reportId: report.reportId,
          name: report.name,
          type: report.type,
          status: report.status,
          generatedBy: report.generatedBy,
          generatedAt: report.createdAt
        },
        generationDetails: report.generationDetails,
        downloadHistory: report.downloadHistory,
        schedule: report.schedule
      };
      
      return res.json({
        success: true,
        data: history,
        message: "Report history fetched successfully"
      });
    } catch (error) {
      console.error("Report history error:", error);
      return res.status(500).json({ error: "Failed to fetch report history" });
    }
  }
);

// Bulk Report Operations

/**
 * @route POST /api/reports/bulk-generate
 * @desc Generate multiple reports in bulk
 * @access Super Admin, Fulfilment Admin, Inventory Admin
 */
router.post("/bulk-generate", 
  requireRole(["Super Admin", "Fulfilment Admin", "Inventory Admin"]),
  auditMiddleware("BULK_REPORT_GENERATION_REQUESTED", "Report", "REPORTING"),
  async (req, res) => {
    try {
      const { reports } = req.body;
      const { role, userId } = req.user;
      
      if (!Array.isArray(reports) || reports.length === 0) {
        return res.status(400).json({ error: "Reports array is required" });
      }
      
      if (reports.length > 10) {
        return res.status(400).json({ error: "Maximum 10 reports can be generated at once" });
      }
      
      const generatedReports = [];
      const errors = [];
      
      for (const reportConfig of reports) {
        try {
          // Validate report type access
          if (!ReportsController.validateReportAccess(role, reportConfig.type)) {
            errors.push({
              name: reportConfig.name,
              error: "Insufficient permissions for this report type"
            });
            continue;
          }
          
          // Create report record
          const reportId = require("uuid").v4();
          const report = new ReportsController.Report({
            reportId,
            name: reportConfig.name,
            type: reportConfig.type,
            category: ReportsController.getReportCategory(reportConfig.type),
            generatedBy: userId,
            generatedByRole: role,
            generatedByName: req.user.name || req.user.email,
            parameters: reportConfig.parameters || {},
            dateRange: reportConfig.dateRange,
            scope: reportConfig.scope,
            format: reportConfig.format || "CSV",
            status: "PENDING",
            accessControl: {
              roles: [role],
              users: [userId],
              isPublic: false
            }
          });
          
          await report.save();
          generatedReports.push({ reportId, name: reportConfig.name });
          
          // Generate report asynchronously
          setImmediate(async () => {
            try {
              await ReportsController.processReportGeneration(report._id);
            } catch (error) {
              console.error(`Failed to generate bulk report ${reportId}:`, error);
              await ReportsController.Report.findByIdAndUpdate(report._id, {
                status: "FAILED",
                "generationDetails.errorMessage": error.message
              });
            }
          });
          
        } catch (error) {
          errors.push({
            name: reportConfig.name,
            error: error.message
          });
        }
      }
      
      return res.json({
        success: true,
        data: {
          generatedReports,
          errors,
          totalRequested: reports.length,
          successful: generatedReports.length,
          failed: errors.length
        },
        message: `Bulk report generation initiated. ${generatedReports.length} reports queued.`
      });
    } catch (error) {
      console.error("Bulk report generation error:", error);
      return res.status(500).json({ error: "Failed to initiate bulk report generation" });
    }
  }
);

/**
 * @route POST /api/reports/bulk-delete
 * @desc Delete multiple reports in bulk
 * @access Report owners only
 */
router.post("/bulk-delete", 
  auditMiddleware("BULK_REPORT_DELETION_REQUESTED", "Report", "REPORTING"),
  async (req, res) => {
    try {
      const { reportIds } = req.body;
      const { role, userId } = req.user;
      
      if (!Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({ error: "Report IDs array is required" });
      }
      
      if (reportIds.length > 50) {
        return res.status(400).json({ error: "Maximum 50 reports can be deleted at once" });
      }
      
      const deletedReports = [];
      const errors = [];
      
      for (const reportId of reportIds) {
        try {
          const report = await ReportsController.Report.findOne({
            reportId,
            generatedBy: userId,
            isDeleted: false
          });
          
          if (!report) {
            errors.push({
              reportId,
              error: "Report not found or access denied"
            });
            continue;
          }
          
          await ReportsController.Report.findByIdAndUpdate(report._id, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
          });
          
          deletedReports.push(reportId);
          
        } catch (error) {
          errors.push({
            reportId,
            error: error.message
          });
        }
      }
      
      return res.json({
        success: true,
        data: {
          deletedReports,
          errors,
          totalRequested: reportIds.length,
          successful: deletedReports.length,
          failed: errors.length
        },
        message: `Bulk deletion completed. ${deletedReports.length} reports deleted.`
      });
    } catch (error) {
      console.error("Bulk report deletion error:", error);
      return res.status(500).json({ error: "Failed to perform bulk deletion" });
    }
  }
);

// Report Analytics Routes

/**
 * @route GET /api/reports/analytics/usage
 * @desc Get report usage analytics
 * @access Super Admin only
 */
router.get("/analytics/usage", 
  requireRole(["Super Admin"]),
  auditMiddleware("REPORT_USAGE_ANALYTICS_ACCESSED", "Report", "REPORTING"),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const filter = { isDeleted: false };
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      const usageStats = await ReportsController.Report.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalReports: { $sum: 1 },
            completedReports: { $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } },
            failedReports: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } },
            pendingReports: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
            totalDownloads: { $sum: { $size: "$downloadHistory" } },
            avgGenerationTime: { $avg: "$generationDetails.executionTime" }
          }
        }
      ]);
      
      const typeStats = await ReportsController.Report.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            downloads: { $sum: { $size: "$downloadHistory" } }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      const userStats = await ReportsController.Report.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$generatedBy",
            reportsGenerated: { $sum: 1 },
            totalDownloads: { $sum: { $size: "$downloadHistory" } }
          }
        },
        { $sort: { reportsGenerated: -1 } },
        { $limit: 10 }
      ]);
      
      return res.json({
        success: true,
        data: {
          overall: usageStats[0] || {
            totalReports: 0,
            completedReports: 0,
            failedReports: 0,
            pendingReports: 0,
            totalDownloads: 0,
            avgGenerationTime: 0
          },
          byType: typeStats,
          topUsers: userStats
        },
        message: "Report usage analytics fetched successfully"
      });
    } catch (error) {
      console.error("Report usage analytics error:", error);
      return res.status(500).json({ error: "Failed to fetch report usage analytics" });
    }
  }
);

module.exports = router;
