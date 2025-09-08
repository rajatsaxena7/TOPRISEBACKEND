const Order = require("../models/order");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");

/**
 * Get comprehensive dashboard reports with all key metrics
 */
exports.getDashboardReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build base filter
    const baseFilter = {};
    if (startDate || endDate) {
      baseFilter["timestamps.createdAt"] = {};
      if (startDate) baseFilter["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) baseFilter["timestamps.createdAt"].$lte = new Date(endDate);
    }

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          uniqueCustomers: { $addToSet: "$customerDetails.userId" }
        }
      }
    ]);

    const totalData = orderStats[0] || {};

    const response = {
      overview: {
        totalOrders: totalData.totalOrders || 0,
        totalRevenue: totalData.totalRevenue || 0,
        totalCustomers: totalData.uniqueCustomers ? totalData.uniqueCustomers.length : 0,
        avgOrderValue: Math.round(totalData.avgOrderValue || 0)
      },
      generatedAt: new Date()
    };

    logger.info("Dashboard reports generated successfully");
    sendSuccess(res, response, "Dashboard reports fetched successfully");
  } catch (error) {
    logger.error("Get dashboard reports failed:", error);
    sendError(res, "Failed to get dashboard reports");
  }
};