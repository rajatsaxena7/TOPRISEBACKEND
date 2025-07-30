const mongoose = require("mongoose");
const Order = require("../models/order");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios"); // Add this line

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:5001";
const DEALER_ENDPOINT = `${USER_SERVICE_URL}/api/users/api/users/dealer`; // Updated endpoint

const OrderKPI = {
  /**
   * Fetch dealer data from user-service
   */
  async _fetchDealer(dealerId) {
    try {
      const response = await axios.get(`${DEALER_ENDPOINT}/${dealerId}`);
      return response.data;
      logger.info(`Fetched dealer ${dealerId} successfully`);
    } catch (error) {
      logger.error(`Failed to fetch dealer ${dealerId}`, error.message);
      return null;
    }
  },

  /**
   * Get comprehensive dealer performance metrics
   */
  async getDealerPerformance(req, res) {
    try {
      const { dealerId } = req.params;
      const { startDate, endDate } = req.query;

      // Validate dealer ID format (as string)
      if (!dealerId || typeof dealerId !== "string") {
        return sendError(res, "Invalid dealer ID format", 400);
      }

      // Fetch dealer data from user-service
      const dealer = await this._fetchDealer(dealerId);
      if (!dealer) {
        return sendError(res, "Dealer not found in user-service", 404);
      }

      // Date filter if provided
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Get all metrics in parallel
      const [
        slaCompliance,
        dispatchTime,
        orderMetrics,
        skuMetrics,
        financialMetrics,
        timelineData,
      ] = await Promise.all([
        this._getSLACompliance(dealerId, dateFilter),
        this._getDispatchTimeMetrics(dealerId, dateFilter),
        this._getOrderVolumeMetrics(dealerId, dateFilter),
        this._getSKUMetrics(dealerId, dateFilter),
        this._getFinancialMetrics(dealerId, dateFilter),
        this._getTimelineMetrics(dealerId, dateFilter),
      ]);

      // Calculate composite score
      const performanceScore = this._calculateCompositeScore(
        slaCompliance,
        dispatchTime,
        orderMetrics,
        skuMetrics,
        financialMetrics
      );

      // Build response
      const response = {
        dealerInfo: {
          name: dealer.legal_name || dealer.trade_name,
          id: dealerId, // Keep as string
          slaType: dealer.SLA_type,
          dispatchHours: dealer.dispatch_hours,
          location: dealer.Address
            ? `${dealer.Address.city}, ${dealer.Address.state}`
            : "Unknown",
        },
        performanceScore,
        metrics: {
          slaCompliance,
          fulfillmentSpeed: dispatchTime,
          orderPerformance: orderMetrics,
          inventoryHealth: skuMetrics,
          financials: financialMetrics,
          trends: timelineData,
        },
        lastUpdated: new Date(),
      };

      return sendSuccess(res, response, "Dealer performance metrics fetched");
    } catch (error) {
      logger.error("Failed to get dealer performance:", error);
      return sendError(res, "Failed to calculate performance metrics");
    }
  },
  async getSLACompliance(req, res) {
    try {
      const { dealerId } = req.params;
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const complianceData = await this._getSLACompliance(dealerId, dateFilter);
      return sendSuccess(res, complianceData, "SLA compliance data fetched");
    } catch (error) {
      logger.error("Failed to get SLA compliance:", error);
      return sendError(res, "Failed to get SLA compliance data");
    }
  },
  async getFulfillmentMetrics(req, res) {
    try {
      const { dealerId } = req.params;
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      const metrics = await this._getDispatchTimeMetrics(dealerId, dateFilter);
      const orderMetrics = await this._getOrderVolumeMetrics(
        dealerId,
        dateFilter
      );

      return sendSuccess(
        res,
        {
          dispatchMetrics: metrics,
          orderMetrics: orderMetrics,
        },
        "Fulfillment metrics fetched successfully"
      );
    } catch (error) {
      logger.error("Get fulfillment metrics failed:", error);
      return sendError(res, "Failed to get fulfillment metrics");
    }
  },

  // Updated internal methods to handle string dealer IDs
  async _getSLACompliance(dealerId, dateFilter) {
    const matchStage = {
      "dealerMapping.dealerId": dealerId, // Direct string comparison
      "slaInfo.expectedFulfillmentTime": { $exists: true },
      ...dateFilter,
    };

    const result = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          compliantOrders: {
            $sum: { $cond: [{ $eq: ["$slaInfo.isSLAMet", true] }, 1, 0] },
          },
          avgViolationMinutes: { $avg: "$slaInfo.violationMinutes" },
          maxViolation: { $max: "$slaInfo.violationMinutes" },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      complianceRate: data.totalOrders
        ? Math.round((data.compliantOrders / data.totalOrders) * 100)
        : 0,
      avgViolationMinutes: Math.round(data.avgViolationMinutes || 0),
      maxViolationMinutes: Math.round(data.maxViolation || 0),
      benchmark: 95,
    };
  },

  async _getDispatchTimeMetrics(dealerId, dateFilter) {
    const result = await Order.aggregate([
      {
        $match: {
          "dealerMapping.dealerId": dealerId, // String comparison
          status: "Shipped",
          ...dateFilter,
        },
      },

      {
        $project: {
          processingHours: {
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
          avgDispatchTime: { $avg: "$processingHours" },
          minDispatchTime: { $min: "$processingHours" },
          maxDispatchTime: { $max: "$processingHours" },
          stdDevDispatch: { $stdDevPop: "$processingHours" },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      avgDispatchHours: data.avgDispatchTime
        ? parseFloat(data.avgDispatchTime.toFixed(2))
        : 0,
      minDispatchHours: data.minDispatchTime
        ? parseFloat(data.minDispatchTime.toFixed(2))
        : 0,
      maxDispatchHours: data.maxDispatchTime
        ? parseFloat(data.maxDispatchTime.toFixed(2))
        : 0,
      consistency: data.stdDevDispatch
        ? parseFloat(
            (1 - data.stdDevDispatch / (data.avgDispatchTime || 1)).toFixed(2)
          )
        : 1, // Perfect consistency if no variance
    };
  },

  async _getOrderVolumeMetrics(dealerId, dateFilter) {
    const result = await Order.aggregate([
      {
        $match: {
          "dealerMapping.dealerId": dealerId, // String comparison
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Shipped"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
          },
          avgItemsPerOrder: { $avg: { $size: "$skus" } },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      totalOrders: data.totalOrders || 0,
      fulfillmentRate: data.totalOrders
        ? Math.round((data.completedOrders / data.totalOrders) * 100)
        : 0,
      cancellationRate: data.totalOrders
        ? Math.round((data.cancelledOrders / data.totalOrders) * 100)
        : 0,
      avgItemsPerOrder: parseFloat((data.avgItemsPerOrder || 0).toFixed(1)),
    };
  },

  async _getSKUMetrics(dealerId, dateFilter) {
    const result = await Order.aggregate([
      { $unwind: "$skus" },
      {
        $match: {
          "dealerMapping.dealerId": dealerId, // String comparison
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$skus.sku",
          totalQuantity: { $sum: "$skus.quantity" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $group: {
          _id: null,
          activeSKUs: { $sum: 1 },
          topSKUs: { $push: { sku: "$_id", volume: "$totalQuantity" } },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      activeSKUs: data.activeSKUs || 0,
      topSKUs: data.topSKUs || [],
      benchmark: 10, // Target minimum active SKUs
    };
  },

  async _getFinancialMetrics(dealerId, dateFilter) {
    const result = await Order.aggregate([
      {
        $match: {
          "dealerMapping.dealerId": dealerId, // String comparison
          status: "Shipped",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
          maxOrderValue: { $max: "$totalAmount" },
        },
      },
    ]);

    const data = result[0] || {};
    return {
      totalRevenue: parseFloat((data.totalRevenue || 0).toFixed(2)),
      avgOrderValue: parseFloat((data.avgOrderValue || 0).toFixed(2)),
      maxOrderValue: parseFloat((data.maxOrderValue || 0).toFixed(2)),
    };
  },

  async _getTimelineMetrics(dealerId, dateFilter) {
    const result = await Order.aggregate([
      {
        $match: {
          "dealerMapping.dealerId": dealerId, // String comparison
          ...dateFilter,
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          status: 1,
          totalAmount: 1,
          slaInfo: 1,
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          orderCount: { $sum: 1 },
          fulfilledCount: {
            $sum: { $cond: [{ $eq: ["$status", "Shipped"] }, 1, 0] },
          },
          totalRevenue: { $sum: "$totalAmount" },
          slaCompliance: {
            $avg: { $cond: [{ $eq: ["$slaInfo.isSLAMet", true] }, 100, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return result.map((item) => ({
      period: `${item._id.month}/${item._id.year}`,
      orderCount: item.orderCount,
      fulfillmentRate: Math.round(
        (item.fulfilledCount / item.orderCount) * 100
      ),
      revenue: parseFloat(item.totalRevenue.toFixed(2)),
      slaCompliance: parseFloat(item.slaCompliance.toFixed(1)),
    }));
  },

  _calculateCompositeScore(sla, dispatch, orders, skus, financials) {
    // Weighted scoring (adjust weights as needed)
    const score =
      ((sla.complianceRate / 100) * 0.3 + // SLA compliance (30%)
        (1 - Math.min(dispatch.avgDispatchHours / 48, 1)) * 0.2 + // Dispatch speed (20%)
        (orders.fulfillmentRate / 100) * 0.2 + // Fulfillment rate (20%)
        Math.min(skus.activeSKUs / 20, 1) * 0.1 + // Inventory breadth (10%)
        Math.min(financials.totalRevenue / 50000, 1) * 0.2) * // Revenue (20%)
      100;

    return Math.round(score);
  },
};

module.exports = OrderKPI;
