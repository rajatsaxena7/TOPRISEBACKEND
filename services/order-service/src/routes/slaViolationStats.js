const express = require("express");
const router = express.Router();
const SLAViolationStatsController = require("../controllers/slaViolationStatsController");
const AuditLogger = require("../utils/auditLogger");
const { requireAuth } = require("../middleware/authMiddleware");

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

// Middleware for audit logging
const auditMiddleware = (action, targetType = null, category = null) => {
  return (req, res, next) => {
    if (req.user && req.user.id && req.user.role) {
      return AuditLogger.createMiddleware(action, targetType, category)(req, res, next);
    } else {
      return next();
    }
  };
};

/**
 * @route GET /api/sla-violations/stats
 * @desc Get comprehensive SLA violation statistics with enhanced details
 * @access Super Admin, Fulfillment Admin, Inventory Admin
 */
router.get("/stats",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin"]),
  auditMiddleware("SLA_VIOLATION_STATS_ACCESSED", "System", "SLA_MANAGEMENT"),
  SLAViolationStatsController.getSLAViolationStats
);

/**
 * @route GET /api/sla-violations/summary
 * @desc Get SLA violation summary with enhanced analytics
 * @access Super Admin, Fulfillment Admin, Inventory Admin
 */
router.get("/summary",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin"]),
  auditMiddleware("SLA_VIOLATION_SUMMARY_ACCESSED", "System", "SLA_MANAGEMENT"),
  SLAViolationStatsController.getSLAViolationSummary
);

/**
 * @route GET /api/sla-violations/dealers-with-violations
 * @desc Get dealers with 3 or more violations (candidates for disable) with enhanced details
 * @access Super Admin, Fulfillment Admin
 */
router.get("/dealers-with-violations",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin"]),
  auditMiddleware("DEALERS_WITH_VIOLATIONS_ACCESSED", "System", "SLA_MANAGEMENT"),
  SLAViolationStatsController.getDealersWithMultipleViolations
);

/**
 * @route PUT /api/sla-violations/disable-dealer/:dealerId
 * @desc Disable dealer after 3 violations with enhanced details
 * @access Super Admin, Fulfillment Admin
 */
router.put("/disable-dealer/:dealerId",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin"]),
  auditMiddleware("DEALER_DISABLE_ATTEMPTED", "Dealer", "SLA_MANAGEMENT"),
  SLAViolationStatsController.disableDealerForViolations
);

/**
 * @route GET /api/sla-violations/trends
 * @desc Get SLA violation trends over time with enhanced details
 * @access Super Admin, Fulfillment Admin, Inventory Admin
 */
router.get("/trends",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin"]),
  // auditMiddleware("SLA_VIOLATION_TRENDS_ACCESSED", "System", "SLA_MANAGEMENT"),
  SLAViolationStatsController.getSLAViolationTrends
);

/**
 * @route GET /api/sla-violations/top-violators
 * @desc Get top violating dealers with enhanced details
 * @access Super Admin, Fulfillment Admin, Inventory Admin
 */
router.get("/top-violators",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin"]),
  auditMiddleware("TOP_VIOLATING_DEALERS_ACCESSED", "System", "SLA_MANAGEMENT"),
  SLAViolationStatsController.getTopViolatingDealers
);

/**
 * @route GET /api/sla-violations/violation/:violationId
 * @desc Get detailed SLA violation information with all enhanced details
 * @access Super Admin, Fulfillment Admin, Inventory Admin
 */
router.get("/violation/:violationId",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin"]),
  auditMiddleware("DETAILED_VIOLATION_INFO_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
  SLAViolationStatsController.getDetailedViolationInfo
);

/**
 * @route PUT /api/sla-violations/resolve/:violationId
 * @desc Resolve SLA violation with enhanced details
 * @access Super Admin, Fulfillment Admin
 */
router.put("/resolve/:violationId",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin"]),
  auditMiddleware("SLA_VIOLATION_RESOLUTION_ATTEMPTED", "SLAViolation", "SLA_MANAGEMENT"),
  SLAViolationStatsController.resolveViolation
);

/**
 * @route GET /api/sla-violations/dashboard
 * @desc Get SLA violation dashboard data
 * @access Super Admin, Fulfillment Admin, Inventory Admin
 */
router.get("/dashboard",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin"]),
  auditMiddleware("SLA_VIOLATION_DASHBOARD_ACCESSED", "System", "SLA_MANAGEMENT"),
  async (req, res) => {
    try {
      const { user } = req;

      // Get quick stats
      const quickStats = await SLAViolationStatsController.getSLAViolationStats(req, res);

      // Get dealers with multiple violations
      const dealersWithViolations = await SLAViolationStatsController.getDealersWithMultipleViolations(req, res);

      // Get top violators
      const topViolators = await SLAViolationStatsController.getTopViolatingDealers(req, res);

      // Get trends for last 30 days
      const trends = await SLAViolationStatsController.getSLAViolationTrends(req, res);

      const dashboardData = {
        quickStats: quickStats.data?.summary || {},
        dealersWithViolations: dealersWithViolations.data || {},
        topViolators: topViolators.data || [],
        trends: trends.data || {},
        lastUpdated: new Date()
      };

      return res.json({
        success: true,
        data: dashboardData,
        message: "SLA violation dashboard data fetched successfully"
      });
    } catch (error) {
      console.error("SLA violation dashboard error:", error);
      return res.status(500).json({ error: "Failed to fetch SLA violation dashboard data" });
    }
  }
);

/**
 * @route GET /api/sla-violations/alerts
 * @desc Get SLA violation alerts and notifications
 * @access Super Admin, Fulfillment Admin
 */
router.get("/alerts",
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin"]),
  auditMiddleware("SLA_VIOLATION_ALERTS_ACCESSED", "System", "SLA_MANAGEMENT"),
  async (req, res) => {
    try {
      const { user } = req;

      // Get dealers with 3+ violations
      const dealersWithViolations = await SLAViolationStatsController.getDealersWithMultipleViolations(req, res);

      // Get unresolved violations count
      const unresolvedStats = await SLAViolationStatsController.getSLAViolationStats(req, res);

      const alerts = {
        dealersEligibleForDisable: dealersWithViolations.data?.eligibleForDisable || 0,
        highRiskDealers: dealersWithViolations.data?.highRiskDealers || 0,
        unresolvedViolations: unresolvedStats.data?.summary?.unresolvedViolations || 0,
        totalAlerts: (dealersWithViolations.data?.eligibleForDisable || 0) +
          (dealersWithViolations.data?.highRiskDealers || 0) +
          (unresolvedStats.data?.summary?.unresolvedViolations || 0),
        priorityAlerts: dealersWithViolations.data?.dealers?.filter(d => d.riskLevel === "High") || [],
        lastUpdated: new Date()
      };

      return res.json({
        success: true,
        data: alerts,
        message: "SLA violation alerts fetched successfully"
      });
    } catch (error) {
      console.error("SLA violation alerts error:", error);
      return res.status(500).json({ error: "Failed to fetch SLA violation alerts" });
    }
  }
);

/**
 * @route POST /api/sla-violations/bulk-disable
 * @desc Bulk disable multiple dealers with 3+ violations
 * @access Super Admin
 */
router.post("/bulk-disable",
  requireAuth,
  requireRole(["Super-admin"]),
  auditMiddleware("BULK_DEALER_DISABLE_ATTEMPTED", "System", "SLA_MANAGEMENT"),
  async (req, res) => {
    try {
      const { dealerIds, reason, adminNotes } = req.body;
      const { user } = req;

      if (!dealerIds || !Array.isArray(dealerIds) || dealerIds.length === 0) {
        return res.status(400).json({ error: "Dealer IDs array is required" });
      }

      const results = [];

      for (const dealerId of dealerIds) {
        try {
          // Create a mock request object for the disable function
          const mockReq = {
            params: { dealerId },
            body: { reason, adminNotes },
            user
          };

          // Call the disable function
          await SLAViolationStatsController.disableDealerForViolations(mockReq, {
            status: (code) => ({ statusCode: code }),
            json: (data) => data
          });

          results.push({
            dealerId,
            success: true,
            message: "Dealer disabled successfully"
          });
        } catch (error) {
          results.push({
            dealerId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return res.json({
        success: true,
        data: {
          totalProcessed: dealerIds.length,
          successCount,
          failureCount,
          results
        },
        message: `Bulk disable completed. ${successCount} successful, ${failureCount} failed.`
      });
    } catch (error) {
      console.error("Bulk disable error:", error);
      return res.status(500).json({ error: "Failed to perform bulk disable operation" });
    }
  }
);

module.exports = router;
