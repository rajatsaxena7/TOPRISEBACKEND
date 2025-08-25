const mongoose = require("mongoose");
const Order = require("../models/order");
const Return = require("../models/return");
const SLAViolation = require("../models/slaViolation");
const AuditLog = require("../models/auditLog");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const AuditLogger = require("../utils/auditLogger");
const axios = require("axios");

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:5001";
const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:5002";

class AnalyticsController {
  /**
   * Get role-based dashboard data
   */
  static async getDashboard(req, res) {
    try {
      const { startDate, endDate, dealerId, region, product, channel } =
        req.query;

      // Handle case where user is not authenticated
      if (!req.user) {
        // Return basic dashboard data without role-specific filtering
        const basicData = {
          role: "Guest",
          kpis: await AnalyticsController.getBasicKPIs({ startDate, endDate }),
          trends: [],
          topPerformers: [],
          filters: {
            dateRange: { startDate, endDate },
            scope: { dealerId, region, product, channel },
          },
          lastUpdated: new Date(),
        };

        return sendSuccess(
          res,
          basicData,
          "Basic dashboard data fetched successfully"
        );
      }

      const { role, userId } = req.user;

      // Build date filter
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Build scope filter based on role (only if role exists)
      const scopeFilter = role
        ? AnalyticsController.buildScopeFilter(
            role,
            dealerId,
            region,
            product,
            channel
          )
        : {};

      // Get KPIs based on role
      const kpis = await AnalyticsController.getRoleBasedKPIs(role, {
        ...dateFilter,
        ...scopeFilter,
      });

      // Get trend data
      const trends = await AnalyticsController.getTrendData(role, {
        ...dateFilter,
        ...scopeFilter,
      });

      // Get top performers
      const topPerformers = await AnalyticsController.getTopPerformers(role, {
        ...dateFilter,
        ...scopeFilter,
      });

      const dashboardData = {
        role,
        kpis,
        trends,
        topPerformers,
        filters: {
          dateRange: { startDate, endDate },
          scope: { dealerId, region, product, channel },
        },
        lastUpdated: new Date(),
      };

      return sendSuccess(
        res,
        dashboardData,
        "Dashboard data fetched successfully"
      );
    } catch (error) {
      logger.error("Failed to get dashboard data:", error);
      return sendError(res, "Failed to fetch dashboard data", 500);
    }
  }

  /**
   * Get comprehensive KPIs
   */
  static async getKPIs(req, res) {
    try {
      const { startDate, endDate, dealerId, region, product, channel } =
        req.query;

      // Handle case where user is not authenticated
      if (!req.user) {
        const basicKPIs = await AnalyticsController.getBasicKPIs({
          startDate,
          endDate,
        });
        return sendSuccess(res, basicKPIs, "Basic KPIs fetched successfully");
      }

      const { role, userId } = req.user;

      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const scopeFilter = role
        ? AnalyticsController.buildScopeFilter(
            role,
            dealerId,
            region,
            product,
            channel
          )
        : {};
      const combinedFilter = { ...dateFilter, ...scopeFilter };

      const [
        orderMetrics,
        fulfillmentMetrics,
        slaMetrics,
        returnMetrics,
        financialMetrics,
        dealerMetrics,
      ] = await Promise.all([
        AnalyticsController.getOrderMetrics(combinedFilter),
        AnalyticsController.getFulfillmentMetrics(combinedFilter),
        AnalyticsController.getSLAMetrics(combinedFilter),
        AnalyticsController.getReturnMetrics(combinedFilter),
        AnalyticsController.getFinancialMetrics(combinedFilter),
        AnalyticsController.getDealerMetrics(combinedFilter),
      ]);

      const kpis = {
        orders: orderMetrics,
        fulfillment: fulfillmentMetrics,
        sla: slaMetrics,
        returns: returnMetrics,
        financial: financialMetrics,
        dealers: dealerMetrics,
      };

      return sendSuccess(res, kpis, "KPIs fetched successfully");
    } catch (error) {
      logger.error("Failed to get KPIs:", error);
      return sendError(res, "Failed to fetch KPIs", 500);
    }
  }

  /**
   * Get trend comparison data
   */
  static async getTrendComparison(req, res) {
    try {
      const { metric, period, compareWith, startDate, endDate } = req.query;

      // Handle case where user is not authenticated
      if (!req.user) {
        return sendSuccess(
          res,
          {
            currentPeriod: [],
            previousPeriod: [],
            comparison: { change: 0, percentageChange: 0 },
          },
          "Basic trend data fetched successfully"
        );
      }

      const { role } = req.user;

      const scopeFilter = role
        ? AnalyticsController.buildScopeFilter(
            role,
            req.query.dealerId,
            req.query.region,
            req.query.product,
            req.query.channel
          )
        : {};

      const trendData = await AnalyticsController.calculateTrendComparison(
        metric,
        period,
        compareWith,
        startDate,
        endDate,
        scopeFilter
      );

      return sendSuccess(
        res,
        trendData,
        "Trend comparison data fetched successfully"
      );
    } catch (error) {
      logger.error("Failed to get trend comparison:", error);
      return sendError(res, "Failed to fetch trend comparison data", 500);
    }
  }

  /**
   * Export dashboard data
   */
  static async exportDashboard(req, res) {
    try {
      const { format, dashboardType, filters } = req.body;

      // Handle case where user is not authenticated
      if (!req.user) {
        return sendError(
          res,
          "Authentication required for dashboard export",
          401
        );
      }

      const { role, userId } = req.user;

      const exportData = await AnalyticsController.generateExportData(
        dashboardType,
        filters,
        role
      );
      const fileName = await AnalyticsController.generateExportFile(
        exportData,
        format,
        dashboardType
      );

      return sendSuccess(
        res,
        {
          downloadUrl: fileName,
          fileName: `${dashboardType}_${
            new Date().toISOString().split("T")[0]
          }.${format.toLowerCase()}`,
        },
        "Dashboard exported successfully"
      );
    } catch (error) {
      logger.error("Failed to export dashboard:", error);
      return sendError(res, "Failed to export dashboard", 500);
    }
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        actorId,
        targetType,
        category,
        severity,
        startDate,
        endDate,
      } = req.query;

      // Handle case where user is not authenticated
      if (!req.user) {
        return sendError(
          res,
          "Authentication required to view audit logs",
          401
        );
      }

      const { role, userId } = req.user;

      // Check if user has permission to view audit logs
      if (
        ![
          "Super-admin",
          "Fulfillment-Admin",
          "Fulfillment-Staff",
          "System",
        ].includes(role)
      ) {
        return sendError(
          res,
          "Insufficient permissions to view audit logs",
          403
        );
      }

      const filters = {
        action,
        actorId,
        targetType,
        category,
        severity,
        startDate,
        endDate,
      };

      const auditData = await AuditLogger.getAuditLogs(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      return sendSuccess(res, auditData, "Audit logs fetched successfully");
    } catch (error) {
      logger.error("Failed to get audit logs:", error);
      return sendError(res, "Failed to fetch audit logs", 500);
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Handle case where user is not authenticated
      if (!req.user) {
        return sendError(
          res,
          "Authentication required to view audit statistics",
          401
        );
      }

      const { role } = req.user;

      if (!["Super-admin", "System"].includes(role)) {
        return sendError(
          res,
          "Insufficient permissions to view audit statistics",
          403
        );
      }

      const filters = { startDate, endDate };
      const stats = await AuditLogger.getAuditStats(filters);

      return sendSuccess(res, stats, "Audit statistics fetched successfully");
    } catch (error) {
      logger.error("Failed to get audit stats:", error);
      return sendError(res, "Failed to fetch audit statistics", 500);
    }
  }

  // Helper methods

  /**
   * Build scope filter based on user role
   */
  static buildScopeFilter(role, dealerId, region, product, channel) {
    const filter = {};

    // Role-based filtering
    switch (role) {
      case "Fulfilment Admin":
        // Can see all fulfillment-related data
        break;
      case "Inventory Admin":
        // Can see inventory-related data
        break;
      case "Dealer":
        // Can only see their own data
        if (dealerId) {
          filter["dealerMapping.dealerId"] = dealerId;
        }
        break;
      case "Super Admin":
        // Can see everything
        break;
      default:
        // Limited access
        break;
    }

    // Apply additional filters
    if (dealerId) filter["dealerMapping.dealerId"] = dealerId;
    if (region)
      filter["customerDetails.pincode"] = { $regex: region, $options: "i" };
    if (product) filter["skus.sku"] = product;
    if (channel) filter.channel = channel;

    return filter;
  }

  /**
   * Get role-based KPIs
   */
  static async getRoleBasedKPIs(role, filter) {
    const kpis = {};

    switch (role) {
      case "Super Admin":
        kpis.orders = await AnalyticsController.getOrderMetrics(filter);
        kpis.fulfillment = await AnalyticsController.getFulfillmentMetrics(
          filter
        );
        kpis.sla = await AnalyticsController.getSLAMetrics(filter);
        kpis.returns = await AnalyticsController.getReturnMetrics(filter);
        kpis.financial = await AnalyticsController.getFinancialMetrics(filter);
        kpis.dealers = await AnalyticsController.getDealerMetrics(filter);
        break;

      case "Fulfilment Admin":
        kpis.orders = await AnalyticsController.getOrderMetrics(filter);
        kpis.fulfillment = await AnalyticsController.getFulfillmentMetrics(
          filter
        );
        kpis.sla = await AnalyticsController.getSLAMetrics(filter);
        kpis.staffPerformance =
          await AnalyticsController.getStaffPerformanceMetrics(filter);
        break;

      case "Inventory Admin":
        kpis.inventory = await AnalyticsController.getInventoryMetrics(filter);
        kpis.returns = await AnalyticsController.getReturnMetrics(filter);
        kpis.topSKUs = await AnalyticsController.getTopSKUs(filter);
        kpis.stockouts = await AnalyticsController.getStockoutMetrics(filter);
        break;

      case "Dealer":
        kpis.myOrders = await AnalyticsController.getOrderMetrics(filter);
        kpis.myPerformance =
          await AnalyticsController.getDealerPerformanceMetrics(filter);
        kpis.mySLA = await AnalyticsController.getSLAMetrics(filter);
        break;

      default:
        kpis.basic = await AnalyticsController.getBasicMetrics(filter);
    }

    return kpis;
  }

  /**
   * Get order metrics
   */
  static async getOrderMetrics(filter) {
    const result = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] },
          },
          packedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Packed"] }, 1, 0] },
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Shipped"] }, 1, 0] },
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
          },
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      totalOrders: data.totalOrders || 0,
      confirmedOrders: data.confirmedOrders || 0,
      packedOrders: data.packedOrders || 0,
      shippedOrders: data.shippedOrders || 0,
      deliveredOrders: data.deliveredOrders || 0,
      cancelledOrders: data.cancelledOrders || 0,
      totalRevenue: parseFloat((data.totalRevenue || 0).toFixed(2)),
      avgOrderValue: parseFloat((data.avgOrderValue || 0).toFixed(2)),
      fulfillmentRate: data.totalOrders
        ? Math.round((data.deliveredOrders / data.totalOrders) * 100)
        : 0,
    };
  }

  /**
   * Get fulfillment metrics
   */
  static async getFulfillmentMetrics(filter) {
    const result = await Order.aggregate([
      { $match: { ...filter, status: { $in: ["Shipped", "Delivered"] } } },
      {
        $project: {
          processingTime: {
            $divide: [
              {
                $subtract: ["$timestamps.shippedAt", "$timestamps.assignedAt"],
              },
              1000 * 60 * 60, // Convert to hours
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: "$processingTime" },
          minProcessingTime: { $min: "$processingTime" },
          maxProcessingTime: { $max: "$processingTime" },
          totalProcessed: { $sum: 1 },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      avgProcessingTime: parseFloat((data.avgProcessingTime || 0).toFixed(2)),
      minProcessingTime: parseFloat((data.minProcessingTime || 0).toFixed(2)),
      maxProcessingTime: parseFloat((data.maxProcessingTime || 0).toFixed(2)),
      totalProcessed: data.totalProcessed || 0,
    };
  }

  /**
   * Get SLA metrics
   */
  static async getSLAMetrics(filter) {
    const result = await Order.aggregate([
      {
        $match: {
          ...filter,
          "slaInfo.expectedFulfillmentTime": { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          compliantOrders: {
            $sum: { $cond: [{ $eq: ["$slaInfo.isSLAMet", true] }, 1, 0] },
          },
          avgViolationMinutes: { $avg: "$slaInfo.violationMinutes" },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      totalOrders: data.totalOrders || 0,
      compliantOrders: data.compliantOrders || 0,
      complianceRate: data.totalOrders
        ? Math.round((data.compliantOrders / data.totalOrders) * 100)
        : 0,
      avgViolationMinutes: Math.round(data.avgViolationMinutes || 0),
    };
  }

  /**
   * Get return metrics
   */
  static async getReturnMetrics(filter) {
    const result = await Return.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalReturns: { $sum: 1 },
          pendingReturns: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
          approvedReturns: {
            $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
          },
          processedReturns: {
            $sum: { $cond: [{ $eq: ["$status", "Processed"] }, 1, 0] },
          },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      totalReturns: data.totalReturns || 0,
      pendingReturns: data.pendingReturns || 0,
      approvedReturns: data.approvedReturns || 0,
      processedReturns: data.processedReturns || 0,
      returnRate:
        data.totalReturns > 0
          ? Math.round((data.totalReturns / data.totalReturns) * 100)
          : 0,
    };
  }

  /**
   * Get financial metrics
   */
  static async getFinancialMetrics(filter) {
    const result = await Order.aggregate([
      { $match: { ...filter, status: { $in: ["Shipped", "Delivered"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
          maxOrderValue: { $max: "$totalAmount" },
          minOrderValue: { $min: "$totalAmount" },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      totalRevenue: parseFloat((data.totalRevenue || 0).toFixed(2)),
      avgOrderValue: parseFloat((data.avgOrderValue || 0).toFixed(2)),
      maxOrderValue: parseFloat((data.maxOrderValue || 0).toFixed(2)),
      minOrderValue: parseFloat((data.minOrderValue || 0).toFixed(2)),
    };
  }

  /**
   * Get dealer metrics
   */
  static async getDealerMetrics(filter) {
    const result = await Order.aggregate([
      { $match: filter },
      { $unwind: "$dealerMapping" },
      {
        $group: {
          _id: "$dealerMapping.dealerId",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
    ]);

    return result.map((dealer) => ({
      dealerId: dealer._id,
      orderCount: dealer.orderCount,
      totalRevenue: parseFloat(dealer.totalRevenue.toFixed(2)),
    }));
  }

  /**
   * Get trend data
   */
  static async getTrendData(role, filter) {
    const result = await Order.aggregate([
      { $match: filter },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          status: 1,
          totalAmount: 1,
        },
      },
      {
        $group: {
          _id: "$date",
          orderCount: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((item) => ({
      date: item._id,
      orderCount: item.orderCount,
      revenue: parseFloat(item.revenue.toFixed(2)),
      deliveredCount: item.deliveredCount,
    }));
  }

  /**
   * Get top performers
   */
  static async getTopPerformers(role, filter) {
    if (!role || role === "Dealer" || role === "Customer") {
      return []; // No role, dealers, or customers don't see other performers
    }

    const result = await Order.aggregate([
      { $match: filter },
      { $unwind: "$dealerMapping" },
      {
        $group: {
          _id: "$dealerMapping.dealerId",
          orderCount: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $project: {
          dealerId: "$_id",
          orderCount: 1,
          deliveredCount: 1,
          totalRevenue: 1,
          fulfillmentRate: {
            $multiply: [{ $divide: ["$deliveredCount", "$orderCount"] }, 100],
          },
        },
      },
      { $sort: { fulfillmentRate: -1 } },
      { $limit: 5 },
    ]);

    return result;
  }

  /**
   * Calculate trend comparison
   */
  static async calculateTrendComparison(
    metric,
    period,
    compareWith,
    startDate,
    endDate,
    filter
  ) {
    // Implementation for trend comparison (Week-over-Week, Month-over-Month)
    // This would compare current period with previous period
    return {
      currentPeriod: [],
      previousPeriod: [],
      comparison: {
        change: 0,
        percentageChange: 0,
      },
    };
  }

  /**
   * Generate export data
   */
  static async generateExportData(dashboardType, filters, role) {
    // Implementation for generating export data based on dashboard type
    return {};
  }

  /**
   * Generate export file
   */
  static async generateExportFile(data, format, dashboardType) {
    // Implementation for generating export files (CSV, Excel, PDF, PNG)
    return `exports/${dashboardType}_${Date.now()}.${format.toLowerCase()}`;
  }

  // Additional helper methods for specific metrics
  static async getStaffPerformanceMetrics(filter) {
    // Implementation for staff performance metrics
    return {};
  }

  static async getInventoryMetrics(filter) {
    // Implementation for inventory metrics
    return {};
  }

  static async getTopSKUs(filter) {
    // Implementation for top SKUs
    return [];
  }

  static async getStockoutMetrics(filter) {
    // Implementation for stockout metrics
    return {};
  }

  static async getDealerPerformanceMetrics(filter) {
    // Implementation for dealer performance metrics
    return {};
  }

  static async getBasicMetrics(filter) {
    // Implementation for basic metrics
    return {};
  }

  /**
   * Get basic KPIs for unauthenticated users
   */
  static async getBasicKPIs(filters) {
    try {
      const dateFilter = {};
      if (filters.startDate || filters.endDate) {
        dateFilter.createdAt = {};
        if (filters.startDate)
          dateFilter.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate)
          dateFilter.createdAt.$lte = new Date(filters.endDate);
      }

      const [totalOrders, totalDelivered, totalRevenue] = await Promise.all([
        Order.countDocuments(dateFilter),
        Order.countDocuments({ ...dateFilter, status: "Delivered" }),
        Order.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

      return {
        totalOrders: totalOrders || 0,
        totalDelivered: totalDelivered || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
        fulfillmentRate:
          totalOrders > 0
            ? ((totalDelivered / totalOrders) * 100).toFixed(2)
            : 0,
      };
    } catch (error) {
      logger.error("Error getting basic KPIs:", error);
      return {
        totalOrders: 0,
        totalDelivered: 0,
        totalRevenue: 0,
        fulfillmentRate: 0,
      };
    }
  }
}

module.exports = AnalyticsController;
