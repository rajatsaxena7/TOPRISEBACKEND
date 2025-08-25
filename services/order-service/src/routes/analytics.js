

const express = require("express");
const router = express.Router();
const AnalyticsController = require("../controllers/analyticsController");
const AuditLogger = require("../utils/auditLogger");
const { optionalAuth, requireAuth } = require("../middleware/authMiddleware");

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

// Analytics Dashboard Routes

/**
 * @route GET /api/analytics/dashboard
 * @desc Get role-based dashboard data
 * @access All authenticated users
 */
router.get("/dashboard", 
  optionalAuth,
  auditMiddleware("DASHBOARD_ACCESSED", "System", "REPORTING"),
  AnalyticsController.getDashboard
);

/**
 * @route GET /api/analytics/kpis
 * @desc Get comprehensive KPIs
 * @access All authenticated users
 */
router.get("/kpis", 
  optionalAuth,
  auditMiddleware("KPIS_ACCESSED", "System", "REPORTING"),
  AnalyticsController.getKPIs
);

/**
 * @route GET /api/analytics/trends
 * @desc Get trend comparison data
 * @access All authenticated users
 */
router.get("/trends", 
  optionalAuth,
  auditMiddleware("TRENDS_ACCESSED", "System", "REPORTING"),
  AnalyticsController.getTrendComparison
);

/**
 * @route POST /api/analytics/export
 * @desc Export dashboard data
 * @access All authenticated users
 */
router.post("/export", 
  optionalAuth,
  auditMiddleware("DASHBOARD_EXPORTED", "System", "REPORTING"),
  AnalyticsController.exportDashboard
);

// Audit Logs Routes (Super Admin and System only)

/**
 * @route GET /api/analytics/audit-logs
 * @desc Get audit logs with filtering and pagination
 * @access Super Admin, System
 */
router.get("/audit-logs", 
  requireAuth,
  requireRole(["Super-admin", "System"]),
  auditMiddleware("AUDIT_LOGS_ACCESSED", "System", "AUDIT"),
  AnalyticsController.getAuditLogs
);

/**
 * @route GET /api/analytics/audit-stats
 * @desc Get audit statistics
 * @access Super Admin, System
 */
router.get("/audit-stats", 
  requireAuth,
  requireRole(["Super-admin", "System"]),
  auditMiddleware("AUDIT_STATS_ACCESSED", "System", "AUDIT"),
  AnalyticsController.getAuditStats
);

// Role-specific Analytics Routes

/**
 * @route GET /api/analytics/fulfillment
 * @desc Get fulfillment-specific analytics (Fulfilment Admin)
 * @access Fulfilment Admin, Super Admin
 */
router.get("/fulfillment", 
  requireAuth,
  requireRole(["Fulfillment-Admin", "Super-admin"]),
  auditMiddleware("FULFILLMENT_ANALYTICS_ACCESSED", "System", "REPORTING"),
  async (req, res) => {
    try {
      // Implementation for fulfillment-specific analytics
      const { role } = req.user;
      const { startDate, endDate, dealerId } = req.query;
      
      // Build filter for fulfillment data
      const filter = {};
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      if (dealerId) filter["dealerMapping.dealerId"] = dealerId;
      
      // Get fulfillment-specific metrics
      const fulfillmentData = {
        orderProcessing: await AnalyticsController.getOrderMetrics(filter),
        slaCompliance: await AnalyticsController.getSLAMetrics(filter),
        staffPerformance: await AnalyticsController.getStaffPerformanceMetrics(filter),
        deliveryMetrics: await AnalyticsController.getFulfillmentMetrics(filter)
      };
      
      return res.json({
        success: true,
        data: fulfillmentData,
        message: "Fulfillment analytics fetched successfully"
      });
    } catch (error) {
      console.error("Fulfillment analytics error:", error);
      return res.status(500).json({ error: "Failed to fetch fulfillment analytics" });
    }
  }
);

/**
 * @route GET /api/analytics/inventory
 * @desc Get inventory-specific analytics (Inventory Admin)
 * @access Inventory Admin, Super Admin
 */
router.get("/inventory", 
  requireAuth,
  requireRole(["Inventory-Admin", "Super-admin"]),
  auditMiddleware("INVENTORY_ANALYTICS_ACCESSED", "System", "REPORTING"),
  async (req, res) => {
    try {
      // Implementation for inventory-specific analytics
      const { startDate, endDate, product, region } = req.query;
      
      const filter = {};
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      if (product) filter["skus.sku"] = product;
      if (region) filter["customerDetails.pincode"] = { $regex: region, $options: "i" };
      
      const inventoryData = {
        stockLevels: await AnalyticsController.getInventoryMetrics(filter),
        topSKUs: await AnalyticsController.getTopSKUs(filter),
        stockouts: await AnalyticsController.getStockoutMetrics(filter),
        returnAnalysis: await AnalyticsController.getReturnMetrics(filter)
      };
      
      return res.json({
        success: true,
        data: inventoryData,
        message: "Inventory analytics fetched successfully"
      });
    } catch (error) {
      console.error("Inventory analytics error:", error);
      return res.status(500).json({ error: "Failed to fetch inventory analytics" });
    }
  }
);

/**
 * @route GET /api/analytics/dealer/:dealerId
 * @desc Get dealer-specific analytics
 * @access Dealer (own data), Super Admin, Fulfilment Admin
 */
router.get("/dealer/:dealerId", 
  requireAuth,
  requireRole(["Dealer", "Super-admin", "Fulfillment-Admin"]),
  auditMiddleware("DEALER_ANALYTICS_ACCESSED", "Dealer", "REPORTING"),
  async (req, res) => {
    try {
      const { dealerId } = req.params;
      const { role, userId } = req.user;
      
      // Dealers can only see their own data
      if (role === "Dealer" && dealerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const { startDate, endDate } = req.query;
      
      const filter = { "dealerMapping.dealerId": dealerId };
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      const dealerData = {
        orderMetrics: await AnalyticsController.getOrderMetrics(filter),
        performanceMetrics: await AnalyticsController.getDealerPerformanceMetrics(filter),
        slaMetrics: await AnalyticsController.getSLAMetrics(filter),
        financialMetrics: await AnalyticsController.getFinancialMetrics(filter)
      };
      
      return res.json({
        success: true,
        data: dealerData,
        message: "Dealer analytics fetched successfully"
      });
    } catch (error) {
      console.error("Dealer analytics error:", error);
      return res.status(500).json({ error: "Failed to fetch dealer analytics" });
    }
  }
);

// Real-time Analytics Routes

/**
 * @route GET /api/analytics/realtime/orders
 * @desc Get real-time order statistics
 * @access All authenticated users
 */
router.get("/realtime/orders", 
  requireAuth,
  auditMiddleware("REALTIME_ORDERS_ACCESSED", "System", "REPORTING"),
  async (req, res) => {
    try {
      const { role } = req.user;
      
      // Get real-time order counts by status
      const orderStats = await AnalyticsController.getOrderMetrics({});
      
      // Get recent activity
      const recentOrders = await AnalyticsController.getTrendData(role, {});
      
      return res.json({
        success: true,
        data: {
          currentStats: orderStats,
          recentActivity: recentOrders.slice(-10), // Last 10 data points
          lastUpdated: new Date()
        },
        message: "Real-time order statistics fetched successfully"
      });
    } catch (error) {
      console.error("Real-time orders error:", error);
      return res.status(500).json({ error: "Failed to fetch real-time order statistics" });
    }
  }
);

/**
 * @route GET /api/analytics/realtime/alerts
 * @desc Get real-time alerts and notifications
 * @access Super Admin, Fulfilment Admin, Inventory Admin
 */
router.get("/realtime/alerts", 
  requireAuth,
  requireRole(["Super-admin", "Fulfillment-Admin", "Inventory-Admin"]),
  auditMiddleware("REALTIME_ALERTS_ACCESSED", "System", "REPORTING"),
  async (req, res) => {
    try {
      // Get SLA violations
      const slaViolations = await AnalyticsController.getSLAMetrics({});
      
      // Get pending returns
      const pendingReturns = await AnalyticsController.getReturnMetrics({ status: "Pending" });
      
      // Get low stock alerts (would need inventory service integration)
      const lowStockAlerts = [];
      
      const alerts = {
        slaViolations: slaViolations.totalOrders - slaViolations.compliantOrders,
        pendingReturns: pendingReturns.pendingReturns,
        lowStockAlerts: lowStockAlerts.length,
        totalAlerts: (slaViolations.totalOrders - slaViolations.compliantOrders) + 
                    pendingReturns.pendingReturns + 
                    lowStockAlerts.length
      };
      
      return res.json({
        success: true,
        data: alerts,
        message: "Real-time alerts fetched successfully"
      });
    } catch (error) {
      console.error("Real-time alerts error:", error);
      return res.status(500).json({ error: "Failed to fetch real-time alerts" });
    }
  }
);

// Comparative Analytics Routes

/**
 * @route GET /api/analytics/compare
 * @desc Compare metrics between different periods or entities
 * @access All authenticated users
 */
router.get("/compare", 
  requireAuth,
  auditMiddleware("COMPARATIVE_ANALYTICS_ACCESSED", "System", "REPORTING"),
  async (req, res) => {
    try {
      const { 
        metric, 
        period1, 
        period2, 
        entity1, 
        entity2, 
        comparisonType 
      } = req.query;
      
      const { role } = req.user;
      
      // Build filters for comparison
      const filter1 = this.buildComparisonFilter(period1, entity1, role);
      const filter2 = this.buildComparisonFilter(period2, entity2, role);
      
      // Get metrics for both periods/entities
      const metrics1 = await this.getMetricsForComparison(metric, filter1);
      const metrics2 = await this.getMetricsForComparison(metric, filter2);
      
      // Calculate comparison
      const comparison = this.calculateComparison(metrics1, metrics2, comparisonType);
      
      return res.json({
        success: true,
        data: {
          period1: { filter: filter1, metrics: metrics1 },
          period2: { filter: filter2, metrics: metrics2 },
          comparison: comparison
        },
        message: "Comparative analytics fetched successfully"
      });
    } catch (error) {
      console.error("Comparative analytics error:", error);
      return res.status(500).json({ error: "Failed to fetch comparative analytics" });
    }
  }
);

// Helper methods for comparative analytics
function buildComparisonFilter(period, entity, role) {
  const filter = {};
  
  if (period) {
    const [startDate, endDate] = period.split(',');
    if (startDate) filter.createdAt = { $gte: new Date(startDate) };
    if (endDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
  }
  
  if (entity) {
    if (role === "Dealer") {
      filter["dealerMapping.dealerId"] = entity;
    } else {
      // For other roles, entity could be dealer, region, product, etc.
      filter["dealerMapping.dealerId"] = entity;
    }
  }
  
  return filter;
}

async function getMetricsForComparison(metric, filter) {
  switch (metric) {
    case "orders":
      return await AnalyticsController.getOrderMetrics(filter);
    case "fulfillment":
      return await AnalyticsController.getFulfillmentMetrics(filter);
    case "sla":
      return await AnalyticsController.getSLAMetrics(filter);
    case "returns":
      return await AnalyticsController.getReturnMetrics(filter);
    case "financial":
      return await AnalyticsController.getFinancialMetrics(filter);
    default:
      return {};
  }
}

function calculateComparison(metrics1, metrics2, comparisonType) {
  const comparison = {};
  
  Object.keys(metrics1).forEach(key => {
    if (typeof metrics1[key] === 'number' && typeof metrics2[key] === 'number') {
      const value1 = metrics1[key];
      const value2 = metrics2[key];
      
      switch (comparisonType) {
        case "percentage":
          comparison[key] = value1 > 0 ? ((value2 - value1) / value1) * 100 : 0;
          break;
        case "absolute":
          comparison[key] = value2 - value1;
          break;
        case "ratio":
          comparison[key] = value1 > 0 ? value2 / value1 : 0;
          break;
        default:
          comparison[key] = value2 - value1;
      }
    }
  });
  
  return comparison;
}

module.exports = router;
