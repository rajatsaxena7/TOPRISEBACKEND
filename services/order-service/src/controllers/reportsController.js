const Order = require("../models/order");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const mongoose = require("mongoose");
const axios = require("axios");

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

/**
 * Get comprehensive dealer statistics by dealer ID
 */
exports.getDealerStats = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!dealerId) {
      return sendError(res, "Dealer ID is required", 400);
    }

    // Build base filter for date range
    const baseFilter = {};
    if (startDate || endDate) {
      baseFilter["timestamps.createdAt"] = {};
      if (startDate) baseFilter["timestamps.createdAt"].$gte = new Date(startDate);
      if (endDate) baseFilter["timestamps.createdAt"].$lte = new Date(endDate);
    }

    // Get order statistics for the dealer
    const orderStats = await Order.aggregate([
      {
        $match: {
          ...baseFilter,
          "skus.dealerMapped.dealerId": new mongoose.Types.ObjectId(dealerId)
        }
      },
      {
        $unwind: "$skus"
      },
      {
        $match: {
          "skus.dealerMapped.dealerId": new mongoose.Types.ObjectId(dealerId)
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$skus.totalPrice", 0] } },
          totalQuantity: { $sum: { $ifNull: ["$skus.quantity", 0] } },
          avgOrderValue: { $avg: { $ifNull: ["$skus.totalPrice", 0] } }
        }
      }
    ]);

    const orderData = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalQuantity: 0,
      avgOrderValue: 0
    };

    // Service URLs
    const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:5001";
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

    // Fetch product statistics from product service
    let productStats = {
      totalProducts: 0,
      approvedProducts: 0,
      pendingProducts: 0,
      rejectedProducts: 0,
      createdProducts: 0
    };

    try {
      const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/dealer/${dealerId}/stats`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (productResponse.data && productResponse.data.success) {
        productStats = productResponse.data.data;
      }
    } catch (error) {
      logger.warn(`Failed to fetch product stats for dealer ${dealerId}:`, error.message);
    }

    // Fetch dealer information and categories from user service
    let dealerInfo = {
      assignedCategories: [],
      categoryNames: []
    };

    try {
      const dealerResponse = await axios.get(`${USER_SERVICE_URL}/api/dealers/${dealerId}`, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (dealerResponse.data && dealerResponse.data.success) {
        const dealer = dealerResponse.data.data;
        dealerInfo.assignedCategories = dealer.categories_allowed || [];

        // Fetch category names for assigned categories
        if (dealerInfo.assignedCategories.length > 0) {
          try {
            const categoryResponse = await axios.post(`${PRODUCT_SERVICE_URL}/api/categories/bulk`, {
              categoryCodes: dealerInfo.assignedCategories
            }, {
              timeout: 5000,
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (categoryResponse.data && categoryResponse.data.success) {
              dealerInfo.categoryNames = categoryResponse.data.data.map(cat => ({
                code: cat.category_code,
                name: cat.category_name,
                status: cat.category_Status
              }));
            }
          } catch (error) {
            logger.warn(`Failed to fetch category names for dealer ${dealerId}:`, error.message);
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to fetch dealer info for dealer ${dealerId}:`, error.message);
    }

    const response = {
      dealerId: dealerId,
      overview: {
        totalOrders: orderData.totalOrders,
        totalRevenue: orderData.totalRevenue,
        totalQuantity: orderData.totalQuantity,
        avgOrderValue: Math.round(orderData.avgOrderValue || 0)
      },
      products: productStats,
      categories: dealerInfo,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      generatedAt: new Date()
    };

    logger.info(`Dealer statistics generated for dealer: ${dealerId}`);
    sendSuccess(res, response, "Dealer statistics fetched successfully");
  } catch (error) {
    logger.error("Get dealer stats failed:", error);
    sendError(res, "Failed to get dealer statistics");
  }
};