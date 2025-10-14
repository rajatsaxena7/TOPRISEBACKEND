const PurchaseOrder = require("../models/purchaseOrder");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const mongoose = require("mongoose");
const axios = require("axios");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

// Helper function to fetch user details
async function fetchUserDetails(userId, authHeader) {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`, {
      headers: {
        Authorization: authHeader,
      },
      timeout: 5000,
    });
    return response.data?.data || null;
  } catch (error) {
    logger.warn(`Failed to fetch user details for ${userId}:`, error.message);
    return null;
  }
}

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { description, user_id } = req.body;

    if (!description || !user_id || !req.files?.length) {
      logger.error("Description, user_id and files are required");
      return sendError(res, "Description, user_id and files are required", 400);
    }

    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        const result = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "purchase-orders"
        );
        return result.Location;
      })
    );

    const purchaseOrder = new PurchaseOrder({
      req_files: uploadedFiles,
      description,
      user_id,
      status: "Pending",
    });

    await purchaseOrder.save();
    logger.info("Purchase order created successfully");
    return sendSuccess(
      res,
      purchaseOrder,
      "Purchase order created successfully"
    );
  } catch (error) {
    logger.error("Error creating purchase order:", error);
    return sendError(res, "Error creating purchase order", 500);
  }
};

exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(id);
    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }

    const updateData = {
      description: description || purchaseOrder.description,
    };

    if (req.files?.length) {
      const uploadedFiles = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
            "purchase-orders"
          );
          return result.Location;
        })
      );

      updateData.req_files = [...purchaseOrder.req_files, ...uploadedFiles];
    }

    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    logger.info("Purchase order updated successfully");
    return sendSuccess(
      res,
      updatedOrder,
      "Purchase order updated successfully"
    );
  } catch (error) {
    logger.error("Error updating purchase order:", error);
    return sendError(res, "Error updating purchase order", 500);
  }
};

exports.deletePurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findByIdAndDelete(id);
    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }


    logger.info("Purchase order deleted successfully");
    return sendSuccess(
      res,
      purchaseOrder,
      "Purchase order deleted successfully"
    );
  } catch (error) {
    logger.error("Error deleting purchase order:", error);
    return sendError(res, "Error deleting purchase order", 500);
  }
};

exports.getAllPurchaseOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const {
      status,
      priority,
      startDate,
      endDate,
      user_id,
      search
    } = req.query;

    // Build filter
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (user_id) filter.user_id = user_id;

    if (search) {
      filter.$or = [
        { purchase_order_number: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { user_id: new RegExp(search, 'i') }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const totalOrders = await PurchaseOrder.countDocuments(filter);

    const purchaseOrders = await PurchaseOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalOrders / limit);

    logger.info(`Fetched ${purchaseOrders.length} purchase orders`);
    return sendSuccess(res, {
      data: purchaseOrders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalOrders,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        status,
        priority,
        startDate,
        endDate,
        user_id,
        search
      }
    }, "Purchase orders fetched successfully");
  } catch (error) {
    logger.error("Error fetching all purchase orders:", error);
    return sendError(res, "Error fetching all purchase orders", 500);
  }
};

exports.getFilteredPurchaseOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate, user_id } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (user_id) filter.user_id = user_id;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const purchaseOrders = await PurchaseOrder.find(filter).sort({
      createdAt: -1,
    });

    logger.info("Filtered purchase orders fetched successfully");
    return sendSuccess(
      res,
      purchaseOrders,
      "Filtered purchase orders fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching filtered purchase orders:", error);
    return sendError(res, "Error fetching filtered purchase orders", 500);
  }
};

exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findById(id).lean();

    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }

    // Fetch user details
    const userDetails = await fetchUserDetails(purchaseOrder.user_id, req.headers.authorization);

    // Fetch reviewer details if available
    let reviewerDetails = null;
    if (purchaseOrder.reviewed_by) {
      reviewerDetails = await fetchUserDetails(purchaseOrder.reviewed_by, req.headers.authorization);
    }

    const enrichedPurchaseOrder = {
      ...purchaseOrder,
      user_details: userDetails ? {
        _id: userDetails._id,
        email: userDetails.email,
        username: userDetails.username,
        phone_Number: userDetails.phone_Number,
        role: userDetails.role
      } : null,
      reviewer_details: reviewerDetails ? {
        _id: reviewerDetails._id,
        email: reviewerDetails.email,
        username: reviewerDetails.username,
        role: reviewerDetails.role
      } : null
    };

    logger.info("Purchase order fetched successfully with user details");
    return sendSuccess(
      res,
      enrichedPurchaseOrder,
      "Purchase order fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching purchase order:", error);
    return sendError(res, "Error fetching purchase order", 500);
  }
};

exports.getPurchaseOrdersByUserId = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const { status } = req.query;
    let filter = {
      user_id: user_id,
    };

    if (status) {
      filter.status = status;
    }

    const purchaseOrders = await PurchaseOrder.find(filter).sort({
      createdAt: -1,
    });

    logger.info("Purchase orders fetched successfully");
    return sendSuccess(
      res,
      purchaseOrders,
      "Purchase orders fetched successfully"
    );
  } catch (error) {
    logger.error("Error fetching purchase orders by user ID:", error);
    return sendError(res, "Error fetching purchase orders by user ID", 500);
  }
};

exports.updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewed_by, admin_notes } = req.body;

    if (!["Pending", "Approved", "Rejected", "In-Review", "Cancelled"].includes(status)) {
      logger.error("Invalid status");
      return sendError(res, "Invalid status. Must be: Pending, Approved, Rejected, In-Review, or Cancelled", 400);
    }

    const updateData = {
      status,
      updated_at: new Date()
    };

    // Add review information if status is Approved or Rejected
    if ((status === "Approved" || status === "Rejected") && reviewed_by) {
      updateData.reviewed_by = reviewed_by;
      updateData.reviewed_at = new Date();
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!purchaseOrder) {
      logger.error("Purchase order not found");
      return sendError(res, "Purchase order not found", 404);
    }

    logger.info(`Purchase order status updated to ${status}: ${id}`);
    return sendSuccess(
      res,
      purchaseOrder,
      "Purchase order status updated successfully"
    );
  } catch (error) {
    logger.error("Error updating purchase order status:", error);
    return sendError(res, "Error updating purchase order status", 500);
  }
};

/**
 * Get purchase order statistics
 * @route GET /api/purchaseorders/stats
 * @access Super-admin, Fulfillment-Admin
 */
exports.getPurchaseOrderStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get total counts
    const totalOrders = await PurchaseOrder.countDocuments(dateFilter);
    const pendingOrders = await PurchaseOrder.countDocuments({ ...dateFilter, status: "Pending" });
    const approvedOrders = await PurchaseOrder.countDocuments({ ...dateFilter, status: "Approved" });
    const rejectedOrders = await PurchaseOrder.countDocuments({ ...dateFilter, status: "Rejected" });
    const inReviewOrders = await PurchaseOrder.countDocuments({ ...dateFilter, status: "In-Review" });
    const cancelledOrders = await PurchaseOrder.countDocuments({ ...dateFilter, status: "Cancelled" });

    // Get priority breakdown
    const priorityBreakdown = await PurchaseOrder.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get estimated value sum
    const valueStats = await PurchaseOrder.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalEstimatedValue: { $sum: "$estimated_value" },
          avgEstimatedValue: { $avg: "$estimated_value" }
        }
      }
    ]);

    // Get recent orders (last 7 days trend)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentOrders = await PurchaseOrder.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const stats = {
      total: totalOrders,
      byStatus: {
        pending: pendingOrders,
        approved: approvedOrders,
        rejected: rejectedOrders,
        inReview: inReviewOrders,
        cancelled: cancelledOrders
      },
      byPriority: priorityBreakdown.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      estimatedValue: {
        total: valueStats[0]?.totalEstimatedValue || 0,
        average: valueStats[0]?.avgEstimatedValue || 0
      },
      recentActivity: {
        last7Days: recentOrders
      },
      approvalRate: totalOrders > 0 ? ((approvedOrders / totalOrders) * 100).toFixed(2) + '%' : '0%'
    };

    logger.info("Purchase order statistics retrieved successfully");
    return sendSuccess(res, stats, "Purchase order statistics retrieved successfully");
  } catch (error) {
    logger.error("Error fetching purchase order statistics:", error);
    return sendError(res, "Error fetching purchase order statistics", 500);
  }
};
