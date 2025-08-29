const Order = require("../models/order");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const mongoose = require("mongoose");

// Get dealer order KPIs
exports.getDealerOrderKPIs = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { period = "week" } = req.query;

    // Fetch orders for this dealer
    const orders = await Order.find({
      "dealerMapping.dealerId": new mongoose.Types.ObjectId(dealerId)
    }).lean();

    if (!orders || orders.length === 0) {
      return sendSuccess(res, {
        orderKPIs: [],
        message: "No orders found for this dealer"
      }, "No orders found");
    }

    // Calculate time periods
    const now = new Date();
    const periods = {
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      quarter: 90 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000
    };

    const periodMs = periods[period] || periods.week;
    
    // Calculate periods for comparison
    const currentPeriodStart = new Date(now.getTime() - periodMs);
    const previousPeriodStart = new Date(now.getTime() - (2 * periodMs));
    
    // Filter orders by periods
    const currentPeriodOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate || order.timestamps?.createdAt || order.createdAt);
      return orderDate >= currentPeriodStart && orderDate <= now;
    });

    const previousPeriodOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate || order.timestamps?.createdAt || order.createdAt);
      return orderDate >= previousPeriodStart && orderDate < currentPeriodStart;
    });

    // Calculate KPIs for current period
    const currentKPIs = calculatePeriodKPIs(currentPeriodOrders, `This ${period}`);
    
    // Calculate KPIs for previous period
    const previousKPIs = calculatePeriodKPIs(previousPeriodOrders, `Last ${period}`);

    // Calculate growth percentages
    if (previousKPIs && previousKPIs.revenue.total > 0) {
      currentKPIs.revenue.growth = ((currentKPIs.revenue.total - previousKPIs.revenue.total) / previousKPIs.revenue.total) * 100;
    } else {
      currentKPIs.revenue.growth = 0;
    }

    if (previousKPIs && previousKPIs.orders.total > 0) {
      currentKPIs.orders.growth = ((currentKPIs.orders.total - previousKPIs.orders.total) / previousKPIs.orders.total) * 100;
    } else {
      currentKPIs.orders.growth = 0;
    }

    const orderKPIs = [currentKPIs];
    if (previousKPIs.orders.total > 0) {
      orderKPIs.push(previousKPIs);
    }

    return sendSuccess(res, { orderKPIs }, "Dealer order KPIs fetched successfully");
  } catch (err) {
    logger.error(`getDealerOrderKPIs error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};

// Get dealer orders
exports.getDealerOrders = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {
      "dealerMapping.dealerId": new mongoose.Types.ObjectId(dealerId)
    };

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch orders with pagination
    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalOrders = await Order.countDocuments(filter);

    return sendSuccess(res, {
      orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    }, "Dealer orders fetched successfully");
  } catch (err) {
    logger.error(`getDealerOrders error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};

// Helper function to calculate KPIs for a specific period
function calculatePeriodKPIs(orders, period) {
  const orderStats = {
    total: orders.length,
    new: orders.filter(o => o.status === "Pending").length,
    processing: orders.filter(o => o.status === "Processing" || o.status === "Assigned").length,
    shipped: orders.filter(o => o.status === "Shipped").length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    cancelled: orders.filter(o => o.status === "Cancelled").length,
    growth: 0
  };

  const revenueStats = {
    total: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    average: orders.length > 0 ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length : 0,
    growth: 0
  };

  // Calculate performance metrics
  const deliveredOrders = orders.filter(o => o.status === "Delivered");
  const onTimeDeliveries = deliveredOrders.filter(order => {
    if (!order.timestamps?.deliveredAt || !order.slaInfo?.expectedFulfillmentTime) {
      return true; // Assume on time if no SLA info
    }
    const deliveredAt = new Date(order.timestamps.deliveredAt);
    const expectedAt = new Date(order.slaInfo.expectedFulfillmentTime);
    return deliveredAt <= expectedAt;
  });

  const performanceStats = {
    slaCompliance: deliveredOrders.length > 0 ? (onTimeDeliveries.length / deliveredOrders.length) * 100 : 100,
    avgFulfillmentTime: calculateAverageFulfillmentTime(deliveredOrders),
    customerSatisfaction: 4.7 // Mock data - should be calculated from actual ratings
  };

  return {
    period,
    orders: orderStats,
    revenue: revenueStats,
    performance: performanceStats
  };
}

// Helper function to calculate average fulfillment time
function calculateAverageFulfillmentTime(deliveredOrders) {
  if (deliveredOrders.length === 0) return 0;

  const totalTime = deliveredOrders.reduce((sum, order) => {
    if (!order.timestamps?.createdAt || !order.timestamps?.deliveredAt) {
      return sum;
    }
    const createdAt = new Date(order.timestamps.createdAt);
    const deliveredAt = new Date(order.timestamps.deliveredAt);
    return sum + (deliveredAt - createdAt);
  }, 0);

  // Return average time in hours
  return totalTime / deliveredOrders.length / (1000 * 60 * 60);
}
