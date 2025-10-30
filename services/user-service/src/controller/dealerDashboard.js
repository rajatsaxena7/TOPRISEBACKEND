const Dealer = require("../models/dealer");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios");
const mongoose = require("mongoose");

// Helper function to fetch products by dealer ID
async function fetchProductsByDealerId(dealerId, authorizationHeader) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }

    const response = await axios.get(
      `http://product-service:5002/products/v1/get-products-by-dealer/${dealerId}`,
      {
        timeout: 10000,
        headers,
      }
    );

    return response.data.data || [];
  } catch (error) {
    logger.error(`Error fetching products for dealer ${dealerId}:`, error.message);
    return [];
  }
}

// Helper function to fetch orders by dealer ID
async function fetchOrdersByDealerId(dealerId, authorizationHeader) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }

    const response = await axios.get(
      `http://order-service:5003/api/orders/dealer/${dealerId}`,
      {
        timeout: 10000,
        headers,
      }
    );

    return response.data.data || [];
  } catch (error) {
    logger.error(`Error fetching orders for dealer ${dealerId}:`, error.message);
    return [];
  }
}

// Get dealer dashboard statistics
exports.getDealerDashboardStats = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const authorizationHeader = req.headers.authorization;

    // Fetch dealer information
    const dealer = await Dealer.findById(dealerId).populate("user_id");
    if (!dealer) {
      return sendError(res, "Dealer not found", 404);
    }

    // Fetch products for this dealer
    const products = await fetchProductsByDealerId(dealerId, authorizationHeader);

    // Fetch orders for this dealer
    const orders = await fetchOrdersByDealerId(dealerId, authorizationHeader);

    // Calculate product statistics
    const productStats = {
      total: products.length,
      approved: products.filter(p => p.live_status === "Approved" || p.live_status === "Live").length,
      pending: products.filter(p => p.Qc_status === "Pending").length,
      rejected: products.filter(p => p.Qc_status === "Rejected").length,
      created: products.filter(p => p.created_at >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, // Last 30 days
    };

    // Calculate order statistics
    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "Pending").length,
      processing: orders.filter(o => o.status === "Processing" || o.status === "Assigned").length,
      shipped: orders.filter(o => o.status === "Shipped").length,
      delivered: orders.filter(o => o.status === "Delivered").length,
      cancelled: orders.filter(o => o.status === "Cancelled").length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      avgOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length : 0,
    };

    // Calculate category statistics
    const categoryStats = {
      assigned: dealer.categories_allowed ? dealer.categories_allowed.length : 0,
      active: dealer.categories_allowed ? dealer.categories_allowed.length : 0, // Assuming all assigned categories are active
      totalProducts: products.length,
    };

    // Calculate performance metrics (mock data for now)
    const performanceStats = {
      slaCompliance: 94.5, // This should be calculated from actual SLA data
      avgResponseTime: 2.3, // Average response time in hours
      customerRating: 4.7, // Average customer rating
      fulfillmentRate: 96.2, // Percentage of orders fulfilled on time
    };

    const stats = {
      products: productStats,
      orders: orderStats,
      categories: categoryStats,
      performance: performanceStats,
    };

    return sendSuccess(res, { stats }, "Dealer dashboard stats fetched successfully");
  } catch (err) {
    logger.error(`getDealerDashboardStats error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};

// Get dealer assigned categories
exports.getDealerAssignedCategories = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const authorizationHeader = req.headers.authorization;

    // Fetch dealer information
    const dealer = await Dealer.findById(dealerId).populate("user_id");
    if (!dealer) {
      return sendError(res, "Dealer not found", 404);
    }

    // Fetch products for this dealer to get category counts
    const products = await fetchProductsByDealerId(dealerId, authorizationHeader);

    // Group products by category to get product counts
    const categoryProductCounts = {};
    products.forEach(product => {
      if (product.category) {
        const categoryId = product.category._id || product.category;
        categoryProductCounts[categoryId] = (categoryProductCounts[categoryId] || 0) + 1;
      }
    });

    // Fetch category details from product service
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (authorizationHeader) {
        headers.Authorization = authorizationHeader;
      }

      // Detect ObjectId-like entries vs name/code entries
      const allowed = Array.isArray(dealer.categories_allowed) ? dealer.categories_allowed : [];
      const idCandidates = allowed.filter(v => mongoose.Types.ObjectId.isValid(v));
      const nameOrCodeCandidates = allowed.filter(v => !mongoose.Types.ObjectId.isValid(v));

      // Fetch categories by IDs (bulk) if we have any ObjectId-like entries
      let categoriesById = {};
      if (idCandidates.length > 0) {
        try {
          const bulkByIdsResp = await axios.post(
            `http://product-service:5002/api/category/bulk-by-ids`,
            { ids: idCandidates },
            { timeout: 10000, headers }
          );
          const byIds = bulkByIdsResp?.data?.data || [];
          categoriesById = byIds.reduce((acc, c) => {
            if (c && c._id) acc[String(c._id)] = c;
            return acc;
          }, {});
        } catch (e) {
          logger.warn(`bulk-by-ids category fetch failed: ${e.message}`);
        }
      }

      // Fetch all categories once to resolve name/code matches (and as fallback)
      let allCategories = [];
      try {
        const categoriesResponse = await axios.get(
          `http://product-service:5002/api/category`,
          {
            timeout: 10000,
            headers,
          }
        );
        allCategories = categoriesResponse?.data?.data || [];
      } catch (e) {
        logger.warn(`GET all categories failed: ${e.message}`);
      }

      const findByNameOrCode = (val) => allCategories.find(cat => cat?.category_name === val || cat?.category_code === val);

      // Map assigned categories with details, preserving id or name as provided
      const assignedCategories = allowed.map(entry => {
        const isId = mongoose.Types.ObjectId.isValid(entry);
        const fromId = isId ? categoriesById[String(entry)] : null;
        const fromName = !fromId ? findByNameOrCode(entry) : null;
        const category = fromId || fromName || null;

        const resolvedId = category?._id || (isId ? entry : entry);
        const resolvedName = category?.category_name || (!isId ? entry : String(entry));
        const resolvedCode = category?.category_code || (!isId ? entry : String(entry));

        const countKey = String(category?._id || (isId ? entry : entry));

        return {
          _id: resolvedId,
          category_name: resolvedName,
          category_code: resolvedCode,
          category_image: category?.category_image || null,
          category_Status: category?.category_Status || "Active",
          product_count: categoryProductCounts[countKey] || 0,
          assigned_date: dealer.onboarding_date || dealer.created_at,
          is_active: dealer.is_active && (category?.category_Status === "Active" || !category),
        };
      });

      return sendSuccess(res, { assignedCategories }, "Dealer assigned categories fetched successfully");
    } catch (categoryError) {
      logger.error(`Error fetching categories: ${categoryError.message}`);

      // Fallback: return basic category information
      const assignedCategories = dealer.categories_allowed.map(categoryName => ({
        _id: categoryName,
        category_name: categoryName,
        category_code: categoryName,
        category_image: null,
        category_Status: "Active",
        product_count: 0,
        assigned_date: dealer.onboarding_date || dealer.created_at,
        is_active: dealer.is_active,
      }));

      return sendSuccess(res, { assignedCategories }, "Dealer assigned categories fetched successfully");
    }
  } catch (err) {
    logger.error(`getDealerAssignedCategories error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};

// Get complete dealer dashboard data
exports.getDealerDashboard = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const authorizationHeader = req.headers.authorization;

    // Fetch dealer information
    const dealer = await Dealer.findById(dealerId).populate("user_id");
    if (!dealer) {
      return sendError(res, "Dealer not found", 404);
    }

    // Fetch products and orders
    const [products, orders] = await Promise.all([
      fetchProductsByDealerId(dealerId, authorizationHeader),
      fetchOrdersByDealerId(dealerId, authorizationHeader)
    ]);

    // Calculate statistics
    const productStats = {
      total: products.length,
      approved: products.filter(p => p.live_status === "Approved" || p.live_status === "Live").length,
      pending: products.filter(p => p.Qc_status === "Pending").length,
      rejected: products.filter(p => p.Qc_status === "Rejected").length,
      created: products.filter(p => p.created_at >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    };

    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.status === "Pending").length,
      processing: orders.filter(o => o.status === "Processing" || o.status === "Assigned").length,
      shipped: orders.filter(o => o.status === "Shipped").length,
      delivered: orders.filter(o => o.status === "Delivered").length,
      cancelled: orders.filter(o => o.status === "Cancelled").length,
      totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      avgOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length : 0,
    };

    const categoryStats = {
      assigned: dealer.categories_allowed ? dealer.categories_allowed.length : 0,
      active: dealer.categories_allowed ? dealer.categories_allowed.length : 0,
      totalProducts: products.length,
    };

    const performanceStats = {
      slaCompliance: 94.5,
      avgResponseTime: 2.3,
      customerRating: 4.7,
      fulfillmentRate: 96.2,
    };

    // Calculate order KPIs for different periods
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekOrders = orders.filter(o => new Date(o.orderDate || o.createdAt) >= oneWeekAgo);
    const lastWeekOrders = orders.filter(o => {
      const orderDate = new Date(o.orderDate || o.createdAt);
      return orderDate >= twoWeeksAgo && orderDate < oneWeekAgo;
    });

    const orderKPIs = [
      {
        period: "This Week",
        orders: {
          total: thisWeekOrders.length,
          new: thisWeekOrders.filter(o => o.status === "Pending").length,
          processing: thisWeekOrders.filter(o => o.status === "Processing" || o.status === "Assigned").length,
          shipped: thisWeekOrders.filter(o => o.status === "Shipped").length,
          delivered: thisWeekOrders.filter(o => o.status === "Delivered").length,
          cancelled: thisWeekOrders.filter(o => o.status === "Cancelled").length,
        },
        revenue: {
          total: thisWeekOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          average: thisWeekOrders.length > 0 ? thisWeekOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / thisWeekOrders.length : 0,
          growth: 12.5, // Mock growth percentage
        },
        performance: {
          slaCompliance: 96.8,
          avgFulfillmentTime: 1.8,
          customerSatisfaction: 4.8,
        },
      },
      {
        period: "Last Week",
        orders: {
          total: lastWeekOrders.length,
          new: lastWeekOrders.filter(o => o.status === "Pending").length,
          processing: lastWeekOrders.filter(o => o.status === "Processing" || o.status === "Assigned").length,
          shipped: lastWeekOrders.filter(o => o.status === "Shipped").length,
          delivered: lastWeekOrders.filter(o => o.status === "Delivered").length,
          cancelled: lastWeekOrders.filter(o => o.status === "Cancelled").length,
        },
        revenue: {
          total: lastWeekOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
          average: lastWeekOrders.length > 0 ? lastWeekOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / lastWeekOrders.length : 0,
          growth: 8.2,
        },
        performance: {
          slaCompliance: 94.2,
          avgFulfillmentTime: 2.1,
          customerSatisfaction: 4.6,
        },
      },
    ];

    // Get assigned categories
    const categoryProductCounts = {};
    products.forEach(product => {
      if (product.category) {
        const categoryId = product.category._id || product.category;
        categoryProductCounts[categoryId] = (categoryProductCounts[categoryId] || 0) + 1;
      }
    });

    const assignedCategories = dealer.categories_allowed.map(categoryName => ({
      _id: categoryName,
      category_name: categoryName,
      category_code: categoryName,
      category_image: null,
      category_Status: "Active",
      product_count: 0,
      assigned_date: dealer.onboarding_date || dealer.created_at,
      is_active: dealer.is_active,
    }));

    const dashboardData = {
      stats: {
        products: productStats,
        orders: orderStats,
        categories: categoryStats,
        performance: performanceStats,
      },
      orderKPIs,
      assignedCategories,
    };

    return sendSuccess(res, dashboardData, "Dealer dashboard data fetched successfully");
  } catch (err) {
    logger.error(`getDealerDashboard error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};

// Get dealer ID by userId
exports.getDealerIdByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, "Invalid userId format", 400);
    }

    // Find dealer by userId
    const dealer = await Dealer.findOne({
      user_id: new mongoose.Types.ObjectId(userId)
    }).select('_id dealerId legal_name business_name');

    if (!dealer) {
      return sendError(res, "No dealer found for this user ID", 404);
    }

    const dealerInfo = {
      dealerId: dealer._id,
      dealerIdString: dealer.dealerId || dealer._id.toString(),
      legal_name: dealer.legal_name,
      business_name: dealer.business_name
    };

    return sendSuccess(res, { dealerInfo }, "Dealer ID found successfully");
  } catch (err) {
    logger.error(`getDealerIdByUserId error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};

// Get all dealer IDs by userId (in case a user has multiple dealer accounts)
exports.getAllDealerIdsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, "Invalid userId format", 400);
    }

    // Find all dealers by userId
    const dealers = await Dealer.find({
      user_id: new mongoose.Types.ObjectId(userId)
    }).select('_id dealerId legal_name business_name is_active');

    if (!dealers || dealers.length === 0) {
      return sendError(res, "No dealers found for this user ID", 404);
    }

    const dealerList = dealers.map(dealer => ({
      dealerId: dealer._id,
      dealerIdString: dealer.dealerId || dealer._id.toString(),
      legal_name: dealer.legal_name,
      business_name: dealer.business_name,
      is_active: dealer.is_active
    }));

    return sendSuccess(res, {
      dealerList,
      totalDealers: dealerList.length
    }, "Dealer IDs found successfully");
  } catch (err) {
    logger.error(`getAllDealerIdsByUserId error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};
