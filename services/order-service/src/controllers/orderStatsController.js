const Order = require("../models/order");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const axios = require("axios");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

// Helper function to fetch dealer info from user service
async function fetchDealerInfo(dealerId, authorizationHeader) {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/internal/dealer/${dealerId}`, {
      headers: { Authorization: authorizationHeader }
    });
    return response.data.data || null;
  } catch (error) {
    logger.error(`Failed to fetch dealer ${dealerId}:`, error.message);
    return null;
  }
}

// Helper function to fetch user info from user service
async function fetchUserInfo(userId, authorizationHeader) {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/internal/user/${userId}`, {
      headers: { Authorization: authorizationHeader }
    });
    return response.data.data || null;
  } catch (error) {
    logger.error(`Failed to fetch user ${userId}:`, error.message);
    return null;
  }
}

// Helper function to get date ranges
function getDateRanges() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return {
    today: { start: startOfDay, end: now },
    thisWeek: { start: startOfWeek, end: now },
    thisMonth: { start: startOfMonth, end: now }
  };
}

/**
 * Get comprehensive order statistics
 */
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate, includeDealerInfo = false, includeUserInfo = false } = req.query;
    const authorizationHeader = req.headers.authorization;
    
    const dateRanges = getDateRanges();
    
    // Build base filter
    const baseFilter = {};
    if (startDate || endDate) {
      baseFilter["timestamps.createdAt"] = {};
      if (startDate) baseFilter["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) baseFilter["timestamps.createdAt"].$lte = new Date(endDate);
    }

    // Get total revenue and order count
    const totalStats = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          uniqueCustomers: { $addToSet: "$customerDetails.userId" },
          totalSKUs: { $sum: { $size: { $ifNull: ["$skus", []] } } }
        }
      }
    ]);

    // Get orders today
    const todayFilter = { ...baseFilter, "timestamps.createdAt": { $gte: dateRanges.today.start, $lte: dateRanges.today.end } };
    const todayStats = await Order.aggregate([
      { $match: todayFilter },
      {
        $group: {
          _id: null,
          ordersToday: { $sum: 1 },
          revenueToday: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          avgOrderValueToday: { $avg: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      }
    ]);

    // Get orders this week
    const weekFilter = { ...baseFilter, "timestamps.createdAt": { $gte: dateRanges.thisWeek.start, $lte: dateRanges.thisWeek.end } };
    const weekStats = await Order.aggregate([
      { $match: weekFilter },
      {
        $group: {
          _id: null,
          ordersThisWeek: { $sum: 1 },
          revenueThisWeek: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          avgOrderValueThisWeek: { $avg: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      }
    ]);

    // Get orders this month
    const monthFilter = { ...baseFilter, "timestamps.createdAt": { $gte: dateRanges.thisMonth.start, $lte: dateRanges.thisMonth.end } };
    const monthStats = await Order.aggregate([
      { $match: monthFilter },
      {
        $group: {
          _id: null,
          ordersThisMonth: { $sum: 1 },
          revenueThisMonth: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          avgOrderValueThisMonth: { $avg: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      }
    ]);

    // Get payment methods distribution
    const paymentMethods = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$paymentType",
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get order statuses distribution
    const orderStatuses = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get recent orders
    const recentOrders = await Order.find(baseFilter)
      .sort({ "timestamps.createdAt": -1 })
      .limit(10)
      .lean();

    // Enhance recent orders with dealer and user info if requested
    let enhancedRecentOrders = recentOrders;
    if (includeDealerInfo === 'true' || includeUserInfo === 'true') {
      enhancedRecentOrders = await Promise.all(
        recentOrders.map(async (order) => {
          const enhancedOrder = { ...order };
          
          if (includeDealerInfo === 'true' && order.dealerMapping && order.dealerMapping.length > 0) {
            const dealerIds = [...new Set(order.dealerMapping.map(d => d.dealerId))];
            const dealersInfo = await Promise.all(
              dealerIds.map(dealerId => fetchDealerInfo(dealerId, authorizationHeader))
            );
            enhancedOrder.dealersInfo = dealersInfo.filter(dealer => dealer !== null);
          }
          
          if (includeUserInfo === 'true' && order.customerDetails?.userId) {
            enhancedOrder.customerInfo = await fetchUserInfo(order.customerDetails.userId, authorizationHeader);
          }
          
          return enhancedOrder;
        })
      );
    }

    // Get top customers by order count
    const topCustomers = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$customerDetails.userId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          avgOrderValue: { $avg: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          lastOrderDate: { $max: "$timestamps.createdAt" }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);

    // Enhance top customers with user info if requested
    let enhancedTopCustomers = topCustomers;
    if (includeUserInfo === 'true') {
      enhancedTopCustomers = await Promise.all(
        topCustomers.map(async (customer) => {
          const userInfo = await fetchUserInfo(customer._id, authorizationHeader);
          return {
            ...customer,
            customerId: customer._id,
            userInfo
          };
        })
      );
    }

    // Get top products by order count
    const topProducts = await Order.aggregate([
      { $match: baseFilter },
      { $unwind: "$skus" },
      {
        $group: {
          _id: {
            sku: "$skus.sku",
            productName: "$skus.productName"
          },
          orderCount: { $sum: 1 },
          totalQuantity: { $sum: "$skus.quantity" },
          totalRevenue: { $sum: "$skus.totalPrice" },
          avgPrice: { $avg: "$skus.selling_price" }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);

    // Get daily revenue trend for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendFilter = { 
      ...baseFilter, 
      "timestamps.createdAt": { 
        $gte: thirtyDaysAgo, 
        $lte: new Date() 
      } 
    };
    
    const dailyTrend = await Order.aggregate([
      { $match: trendFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamps.createdAt" }
          },
          dailyRevenue: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          dailyOrders: { $sum: 1 },
          dailyCustomers: { $addToSet: "$customerDetails.userId" }
        }
      },
      {
        $project: {
          date: "$_id",
          dailyRevenue: 1,
          dailyOrders: 1,
          dailyCustomerCount: { $size: "$dailyCustomers" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Calculate growth rates
    const totalData = totalStats[0] || {};
    const todayData = todayStats[0] || {};
    const weekData = weekStats[0] || {};
    const monthData = monthStats[0] || {};

    const response = {
      summary: {
        totalRevenue: totalData.totalRevenue || 0,
        totalOrders: totalData.totalOrders || 0,
        totalCustomers: totalData.uniqueCustomers ? totalData.uniqueCustomers.length : 0,
        avgOrderValue: Math.round(totalData.avgOrderValue || 0),
        totalSKUs: totalData.totalSKUs || 0
      },
      timeBasedStats: {
        today: {
          orders: todayData.ordersToday || 0,
          revenue: todayData.revenueToday || 0,
          avgOrderValue: Math.round(todayData.avgOrderValueToday || 0)
        },
        thisWeek: {
          orders: weekData.ordersThisWeek || 0,
          revenue: weekData.revenueThisWeek || 0,
          avgOrderValue: Math.round(weekData.avgOrderValueThisWeek || 0)
        },
        thisMonth: {
          orders: monthData.ordersThisMonth || 0,
          revenue: monthData.revenueThisMonth || 0,
          avgOrderValue: Math.round(monthData.avgOrderValueThisMonth || 0)
        }
      },
      paymentMethods: paymentMethods.map(pm => ({
        method: pm._id || 'Unknown',
        orderCount: pm.count,
        totalAmount: pm.totalAmount,
        percentage: totalData.totalOrders > 0 ? Math.round((pm.count / totalData.totalOrders) * 100) : 0
      })),
      orderStatuses: orderStatuses.map(status => ({
        status: status._id || 'Unknown',
        count: status.count,
        totalAmount: status.totalAmount,
        percentage: totalData.totalOrders > 0 ? Math.round((status.count / totalData.totalOrders) * 100) : 0
      })),
      topCustomers: enhancedTopCustomers.map(customer => ({
        customerId: customer._id,
        orderCount: customer.orderCount,
        totalSpent: customer.totalSpent,
        avgOrderValue: Math.round(customer.avgOrderValue),
        lastOrderDate: customer.lastOrderDate,
        userInfo: customer.userInfo || null
      })),
      topProducts: topProducts.map(product => ({
        sku: product._id.sku,
        productName: product._id.productName,
        orderCount: product.orderCount,
        totalQuantity: product.totalQuantity,
        totalRevenue: product.totalRevenue,
        avgPrice: Math.round(product.avgPrice)
      })),
      recentOrders: enhancedRecentOrders.map(order => ({
        _id: order._id,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount || order.order_Amount,
        customerName: order.customerDetails?.name,
        customerEmail: order.customerDetails?.email,
        orderDate: order.timestamps?.createdAt,
        paymentType: order.paymentType,
        orderType: order.orderType,
        skuCount: order.skus?.length || 0,
        dealersInfo: order.dealersInfo || null,
        customerInfo: order.customerInfo || null
      })),
      trends: {
        dailyRevenue: dailyTrend
      },
      filters: {
        startDate,
        endDate,
        includeDealerInfo: includeDealerInfo === 'true',
        includeUserInfo: includeUserInfo === 'true'
      },
      generatedAt: new Date()
    };

    logger.info(`Order statistics fetched successfully. Total orders: ${totalData.totalOrders}, Total revenue: ${totalData.totalRevenue}`);
    sendSuccess(res, response, "Order statistics fetched successfully");
  } catch (error) {
    logger.error("Get order statistics failed:", error);
    sendError(res, "Failed to get order statistics");
  }
};

/**
 * Get order statistics for a specific dealer
 */
exports.getDealerOrderStats = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { startDate, endDate, includeUserInfo = false } = req.query;
    const authorizationHeader = req.headers.authorization;

    if (!dealerId) {
      return sendError(res, "Dealer ID is required", 400);
    }

    // Build filter for dealer-specific orders
    const baseFilter = {
      "dealerMapping.dealerId": dealerId
    };
    
    if (startDate || endDate) {
      baseFilter["timestamps.createdAt"] = {};
      if (startDate) baseFilter["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) baseFilter["timestamps.createdAt"].$lte = new Date(endDate);
    }

    const dateRanges = getDateRanges();

    // Get dealer info
    const dealerInfo = await fetchDealerInfo(dealerId, authorizationHeader);
    if (!dealerInfo) {
      return sendError(res, "Dealer not found", 404);
    }

    // Get total stats for dealer
    const totalStats = await Order.aggregate([
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

    // Get time-based stats
    const todayFilter = { ...baseFilter, "timestamps.createdAt": { $gte: dateRanges.today.start, $lte: dateRanges.today.end } };
    const todayStats = await Order.aggregate([
      { $match: todayFilter },
      {
        $group: {
          _id: null,
          ordersToday: { $sum: 1 },
          revenueToday: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      }
    ]);

    const weekFilter = { ...baseFilter, "timestamps.createdAt": { $gte: dateRanges.thisWeek.start, $lte: dateRanges.thisWeek.end } };
    const weekStats = await Order.aggregate([
      { $match: weekFilter },
      {
        $group: {
          _id: null,
          ordersThisWeek: { $sum: 1 },
          revenueThisWeek: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      }
    ]);

    const monthFilter = { ...baseFilter, "timestamps.createdAt": { $gte: dateRanges.thisMonth.start, $lte: dateRanges.thisMonth.end } };
    const monthStats = await Order.aggregate([
      { $match: monthFilter },
      {
        $group: {
          _id: null,
          ordersThisMonth: { $sum: 1 },
          revenueThisMonth: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      }
    ]);

    // Get recent orders for dealer
    const recentOrders = await Order.find(baseFilter)
      .sort({ "timestamps.createdAt": -1 })
      .limit(10)
      .lean();

    // Enhance recent orders with user info if requested
    let enhancedRecentOrders = recentOrders;
    if (includeUserInfo === 'true') {
      enhancedRecentOrders = await Promise.all(
        recentOrders.map(async (order) => {
          const customerInfo = order.customerDetails?.userId 
            ? await fetchUserInfo(order.customerDetails.userId, authorizationHeader)
            : null;
          return {
            ...order,
            customerInfo
          };
        })
      );
    }

    const totalData = totalStats[0] || {};
    const todayData = todayStats[0] || {};
    const weekData = weekStats[0] || {};
    const monthData = monthStats[0] || {};

    const response = {
      dealerInfo: {
        dealerId: dealerInfo._id,
        legalName: dealerInfo.legal_name,
        tradeName: dealerInfo.trade_name,
        isActive: dealerInfo.is_active
      },
      summary: {
        totalRevenue: totalData.totalRevenue || 0,
        totalOrders: totalData.totalOrders || 0,
        totalCustomers: totalData.uniqueCustomers ? totalData.uniqueCustomers.length : 0,
        avgOrderValue: Math.round(totalData.avgOrderValue || 0)
      },
      timeBasedStats: {
        today: {
          orders: todayData.ordersToday || 0,
          revenue: todayData.revenueToday || 0
        },
        thisWeek: {
          orders: weekData.ordersThisWeek || 0,
          revenue: weekData.revenueThisWeek || 0
        },
        thisMonth: {
          orders: monthData.ordersThisMonth || 0,
          revenue: monthData.revenueThisMonth || 0
        }
      },
      recentOrders: enhancedRecentOrders.map(order => ({
        _id: order._id,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount || order.order_Amount,
        customerName: order.customerDetails?.name,
        customerEmail: order.customerDetails?.email,
        orderDate: order.timestamps?.createdAt,
        paymentType: order.paymentType,
        customerInfo: order.customerInfo || null
      })),
      filters: {
        dealerId,
        startDate,
        endDate,
        includeUserInfo: includeUserInfo === 'true'
      },
      generatedAt: new Date()
    };

    logger.info(`Dealer order statistics fetched for dealer ${dealerId}. Orders: ${totalData.totalOrders}, Revenue: ${totalData.totalRevenue}`);
    sendSuccess(res, response, "Dealer order statistics fetched successfully");
  } catch (error) {
    logger.error("Get dealer order statistics failed:", error);
    sendError(res, "Failed to get dealer order statistics");
  }
};

/**
 * Get order statistics dashboard data
 */
exports.getOrderStatsDashboard = async (req, res) => {
  try {
    const { startDate, endDate, includeDealerInfo = false, includeUserInfo = false } = req.query;
    const authorizationHeader = req.headers.authorization;

    // Get basic stats
    const basicStats = await exports.getOrderStats(req, res);
    
    // Get additional dashboard metrics
    const baseFilter = {};
    if (startDate || endDate) {
      baseFilter["timestamps.createdAt"] = {};
      if (startDate) baseFilter["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) baseFilter["timestamps.createdAt"].$lte = new Date(endDate);
    }

    // Get order completion rate
    const completionStats = await Order.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalOrders = completionStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedOrders = completionStats.find(stat => stat._id === 'delivered')?.count || 0;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // Get average order processing time
    const processingTimeStats = await Order.aggregate([
      { 
        $match: { 
          ...baseFilter, 
          status: 'delivered',
          "timestamps.createdAt": { $exists: true },
          "timestamps.deliveredAt": { $exists: true }
        } 
      },
      {
        $project: {
          processingTime: {
            $divide: [
              { $subtract: ["$timestamps.deliveredAt", "$timestamps.createdAt"] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgProcessingTime: { $avg: "$processingTime" }
        }
      }
    ]);

    const avgProcessingTime = processingTimeStats[0]?.avgProcessingTime || 0;

    // Get top performing dealers
    const topDealers = await Order.aggregate([
      { $match: baseFilter },
      { $unwind: "$dealerMapping" },
      {
        $group: {
          _id: "$dealerMapping.dealerId",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$totalAmount", "$order_Amount", 0] } },
          avgOrderValue: { $avg: { $ifNull: ["$totalAmount", "$order_Amount", 0] } }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Enhance top dealers with dealer info if requested
    let enhancedTopDealers = topDealers;
    if (includeDealerInfo === 'true') {
      enhancedTopDealers = await Promise.all(
        topDealers.map(async (dealer) => {
          const dealerInfo = await fetchDealerInfo(dealer._id, authorizationHeader);
          return {
            ...dealer,
            dealerId: dealer._id,
            dealerInfo
          };
        })
      );
    }

    const dashboardData = {
      ...basicStats.data,
      additionalMetrics: {
        completionRate,
        avgProcessingTimeDays: Math.round(avgProcessingTime * 100) / 100,
        topPerformingDealers: enhancedTopDealers.map(dealer => ({
          dealerId: dealer._id,
          orderCount: dealer.orderCount,
          totalRevenue: dealer.totalRevenue,
          avgOrderValue: Math.round(dealer.avgOrderValue),
          dealerInfo: dealer.dealerInfo || null
        }))
      }
    };

    sendSuccess(res, dashboardData, "Order statistics dashboard fetched successfully");
  } catch (error) {
    logger.error("Get order statistics dashboard failed:", error);
    sendError(res, "Failed to get order statistics dashboard");
  }
};
