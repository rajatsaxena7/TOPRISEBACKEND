const Order = require("../models/order");
const PickList = require("../models/pickList");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const axios = require("axios");

/**
 * Get fulfillment statistics
 */
exports.getFulfillmentStats = async (req, res) => {
  try {
    const { employeeId, dealerId, dateRange } = req.query;
    
    // Build filter based on query parameters
    const filter = {};
    
    if (employeeId) {
      filter["fulfilmentStaff"] = employeeId;
    }
    
    if (dealerId) {
      filter["dealerId"] = dealerId;
    }
    
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      filter["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get picklist statistics
    const totalPicklists = await PickList.countDocuments(filter);
    const notStartedPicklists = await PickList.countDocuments({ ...filter, scanStatus: 'Not Started' });
    const inProgressPicklists = await PickList.countDocuments({ ...filter, scanStatus: 'In Progress' });
    const completedPicklists = await PickList.countDocuments({ ...filter, scanStatus: 'Completed' });
    
    // Get order statistics
    const orderFilter = {};
    if (employeeId) {
      // If filtering by employee, get orders that have picklists assigned to this employee
      const picklistOrderIds = await PickList.distinct('linkedOrderId', { fulfilmentStaff: employeeId });
      orderFilter["_id"] = { $in: picklistOrderIds };
    }
    
    if (dealerId) {
      // If filtering by dealer, get orders that have picklists for this dealer
      const picklistOrderIds = await PickList.distinct('linkedOrderId', { dealerId: dealerId });
      orderFilter["_id"] = { $in: picklistOrderIds };
    }
    
    const totalOrders = await Order.countDocuments(orderFilter);
    const pendingOrders = await Order.countDocuments({ ...orderFilter, status: { $in: ['Confirmed', 'Assigned'] } });
    const scanningOrders = await Order.countDocuments({ ...orderFilter, status: 'Scanning' });
    const packedOrders = await Order.countDocuments({ ...orderFilter, status: 'Packed' });
    const shippedOrders = await Order.countDocuments({ ...orderFilter, status: 'Shipped' });
    const deliveredOrders = await Order.countDocuments({ ...orderFilter, status: 'Delivered' });

    // Calculate efficiency metrics
    const completionRate = totalPicklists > 0 ? ((completedPicklists / totalPicklists) * 100).toFixed(2) : 0;
    const averageProcessingTime = await calculateAverageProcessingTime(filter);

    const stats = {
      picklists: {
        total: totalPicklists,
        notStarted: notStartedPicklists,
        inProgress: inProgressPicklists,
        completed: completedPicklists,
        completionRate: parseFloat(completionRate)
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        scanning: scanningOrders,
        packed: packedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders
      },
      efficiency: {
        averageProcessingTime: averageProcessingTime,
        completionRate: parseFloat(completionRate)
      },
      filters: {
        employeeId,
        dealerId,
        dateRange
      }
    };

    return sendSuccess(res, stats, "Fulfillment statistics retrieved successfully");
  } catch (error) {
    logger.error("Error fetching fulfillment stats:", error.message);
    return sendError(res, error);
  }
};

/**
 * Get pending tasks for fulfillment
 */
exports.getPendingTasks = async (req, res) => {
  try {
    const { employeeId, dealerId, page = 1, limit = 10, priority = 'all' } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter for pending tasks
    const filter = {
      scanStatus: { $in: ['Not Started', 'In Progress'] }
    };

    if (employeeId) {
      filter["fulfilmentStaff"] = employeeId;
    }

    if (dealerId) {
      filter["dealerId"] = dealerId;
    }

    // Get pending picklists
    const pendingPicklists = await PickList.find(filter)
      .populate('linkedOrderId', 'orderId orderDate customerDetails totalAmount status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Get total count for pagination
    const total = await PickList.countDocuments(filter);

    // Enhance picklist data with order details
    const enhancedPicklists = await Promise.all(
      pendingPicklists.map(async (picklist) => {
        const order = picklist.linkedOrderId;
        
        // Calculate priority based on order age and SLA
        const orderAge = Date.now() - new Date(order?.orderDate || picklist.createdAt).getTime();
        const ageInHours = orderAge / (1000 * 60 * 60);
        
        let taskPriority = 'normal';
        if (ageInHours > 48) taskPriority = 'high';
        else if (ageInHours > 24) taskPriority = 'medium';
        else taskPriority = 'low';

        // Filter by priority if specified
        if (priority !== 'all' && taskPriority !== priority) {
          return null;
        }

        return {
          picklistId: picklist._id,
          orderId: order?.orderId || 'N/A',
          orderDate: order?.orderDate || picklist.createdAt,
          customerName: order?.customerDetails?.name || 'N/A',
          customerPhone: order?.customerDetails?.phone || 'N/A',
          totalAmount: order?.totalAmount || 0,
          orderStatus: order?.status || 'Unknown',
          dealerId: picklist.dealerId,
          fulfilmentStaff: picklist.fulfilmentStaff,
          scanStatus: picklist.scanStatus,
          skuCount: picklist.skuList?.length || 0,
          totalQuantity: picklist.skuList?.reduce((sum, sku) => sum + sku.quantity, 0) || 0,
          priority: taskPriority,
          ageInHours: Math.round(ageInHours * 100) / 100,
          createdAt: picklist.createdAt,
          updatedAt: picklist.updatedAt
        };
      })
    );

    // Remove null entries (filtered out by priority)
    const filteredPicklists = enhancedPicklists.filter(item => item !== null);

    // Re-sort by priority and age
    filteredPicklists.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.ageInHours - a.ageInHours;
    });

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(res, {
      tasks: filteredPicklists,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    }, "Pending tasks retrieved successfully");
  } catch (error) {
    logger.error("Error fetching pending tasks:", error.message);
    return sendError(res, error);
  }
};

/**
 * Get picklists by employee
 */
exports.getPicklistsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, page = 1, limit = 10, dateRange } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter
    const filter = { fulfilmentStaff: employeeId };

    if (status && status !== 'all') {
      filter.scanStatus = status;
    }

    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get picklists
    const picklists = await PickList.find(filter)
      .populate('linkedOrderId', 'orderId orderDate customerDetails totalAmount status skus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Get total count
    const total = await PickList.countDocuments(filter);

    // Enhance picklist data
    const enhancedPicklists = picklists.map(picklist => {
      const order = picklist.linkedOrderId;
      
      return {
        picklistId: picklist._id,
        orderId: order?.orderId || 'N/A',
        orderDate: order?.orderDate || picklist.createdAt,
        customerName: order?.customerDetails?.name || 'N/A',
        customerPhone: order?.customerDetails?.phone || 'N/A',
        customerEmail: order?.customerDetails?.email || 'N/A',
        totalAmount: order?.totalAmount || 0,
        orderStatus: order?.status || 'Unknown',
        dealerId: picklist.dealerId,
        scanStatus: picklist.scanStatus,
        skuList: picklist.skuList || [],
        skuCount: picklist.skuList?.length || 0,
        totalQuantity: picklist.skuList?.reduce((sum, sku) => sum + sku.quantity, 0) || 0,
        invoiceGenerated: picklist.invoiceGenerated,
        packingSlipUrl: picklist.packingSlipUrl,
        createdAt: picklist.createdAt,
        updatedAt: picklist.updatedAt
      };
    });

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(res, {
      picklists: enhancedPicklists,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    }, "Picklists retrieved successfully");
  } catch (error) {
    logger.error("Error fetching picklists by employee:", error.message);
    return sendError(res, error);
  }
};

/**
 * Get picklists by dealer
 */
exports.getPicklistsByDealer = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { status, page = 1, limit = 10, dateRange } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter
    const filter = { dealerId };

    if (status && status !== 'all') {
      filter.scanStatus = status;
    }

    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get picklists
    const picklists = await PickList.find(filter)
      .populate('linkedOrderId', 'orderId orderDate customerDetails totalAmount status skus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Get total count
    const total = await PickList.countDocuments(filter);

    // Enhance picklist data
    const enhancedPicklists = picklists.map(picklist => {
      const order = picklist.linkedOrderId;
      
      return {
        picklistId: picklist._id,
        orderId: order?.orderId || 'N/A',
        orderDate: order?.orderDate || picklist.createdAt,
        customerName: order?.customerDetails?.name || 'N/A',
        customerPhone: order?.customerDetails?.phone || 'N/A',
        customerEmail: order?.customerDetails?.email || 'N/A',
        totalAmount: order?.totalAmount || 0,
        orderStatus: order?.status || 'Unknown',
        fulfilmentStaff: picklist.fulfilmentStaff,
        scanStatus: picklist.scanStatus,
        skuList: picklist.skuList || [],
        skuCount: picklist.skuList?.length || 0,
        totalQuantity: picklist.skuList?.reduce((sum, sku) => sum + sku.quantity, 0) || 0,
        invoiceGenerated: picklist.invoiceGenerated,
        packingSlipUrl: picklist.packingSlipUrl,
        createdAt: picklist.createdAt,
        updatedAt: picklist.updatedAt
      };
    });

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(res, {
      picklists: enhancedPicklists,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      }
    }, "Picklists retrieved successfully");
  } catch (error) {
    logger.error("Error fetching picklists by dealer:", error.message);
    return sendError(res, error);
  }
};

/**
 * Get assigned dealers for fulfillment
 */
exports.getAssignedDealers = async (req, res) => {
  try {
    const { employeeId, status = 'all' } = req.query;

    // Build filter
    const filter = {};
    
    if (employeeId) {
      filter.fulfilmentStaff = employeeId;
    }

    if (status && status !== 'all') {
      filter.scanStatus = status;
    }

    // Get unique dealers with their picklist counts
    const dealerStats = await PickList.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$dealerId",
          totalPicklists: { $sum: 1 },
          notStarted: {
            $sum: { $cond: [{ $eq: ["$scanStatus", "Not Started"] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$scanStatus", "In Progress"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$scanStatus", "Completed"] }, 1, 0] }
          },
          lastActivity: { $max: "$updatedAt" }
        }
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "dealerMapping.dealerId",
          as: "orders"
        }
      },
      {
        $addFields: {
          totalOrders: { $size: "$orders" },
          completionRate: {
            $cond: [
              { $eq: ["$totalPicklists", 0] },
              0,
              { $multiply: [{ $divide: ["$completed", "$totalPicklists"] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalPicklists: -1 } }
    ]);

    // Get dealer details from user service
    const enhancedDealerStats = await Promise.all(
      dealerStats.map(async (dealer) => {
        try {
          const dealerResponse = await axios.get(
            `http://user-service:5001/api/users/internal/dealer/${dealer._id}`,
            {
              timeout: 5000,
              headers: { "Content-Type": "application/json" }
            }
          );

          const dealerDetails = dealerResponse.data?.success ? dealerResponse.data.data : null;

          return {
            dealerId: dealer._id,
            dealerName: dealerDetails?.trade_name || dealerDetails?.legal_name || 'Unknown Dealer',
            dealerEmail: dealerDetails?.email || 'N/A',
            dealerPhone: dealerDetails?.phone_Number || 'N/A',
            dealerAddress: dealerDetails?.address || 'N/A',
            totalPicklists: dealer.totalPicklists,
            notStarted: dealer.notStarted,
            inProgress: dealer.inProgress,
            completed: dealer.completed,
            totalOrders: dealer.totalOrders,
            completionRate: Math.round(dealer.completionRate * 100) / 100,
            lastActivity: dealer.lastActivity
          };
        } catch (error) {
          logger.warn(`Failed to fetch dealer details for ${dealer._id}:`, error.message);
          return {
            dealerId: dealer._id,
            dealerName: 'Unknown Dealer',
            dealerEmail: 'N/A',
            dealerPhone: 'N/A',
            dealerAddress: 'N/A',
            totalPicklists: dealer.totalPicklists,
            notStarted: dealer.notStarted,
            inProgress: dealer.inProgress,
            completed: dealer.completed,
            totalOrders: dealer.totalOrders,
            completionRate: Math.round(dealer.completionRate * 100) / 100,
            lastActivity: dealer.lastActivity
          };
        }
      })
    );

    return sendSuccess(res, enhancedDealerStats, "Assigned dealers retrieved successfully");
  } catch (error) {
    logger.error("Error fetching assigned dealers:", error.message);
    return sendError(res, error);
  }
};

/**
 * Get recent orders for fulfillment
 */
exports.getRecentOrders = async (req, res) => {
  try {
    const { employeeId, dealerId, status, page = 1, limit = 10, days = 7 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Build filter
    const filter = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (status && status !== 'all') {
      filter.status = status;
    }

    // If filtering by employee or dealer, get orders that have picklists
    if (employeeId || dealerId) {
      const picklistFilter = {};
      if (employeeId) picklistFilter.fulfilmentStaff = employeeId;
      if (dealerId) picklistFilter.dealerId = dealerId;
      
      const picklistOrderIds = await PickList.distinct('linkedOrderId', picklistFilter);
      filter._id = { $in: picklistOrderIds };
    }

    // Get orders
    const orders = await Order.find(filter)
      .populate('payment_id', 'amount payment_method payment_status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Get total count
    const total = await Order.countDocuments(filter);

    // Enhance order data with picklist information
    const enhancedOrders = await Promise.all(
      orders.map(async (order) => {
        // Get picklists for this order
        const picklists = await PickList.find({ linkedOrderId: order._id });
        
        const orderSummary = {
          orderId: order.orderId,
          orderDate: order.orderDate,
          customerName: order.customerDetails?.name || 'N/A',
          customerPhone: order.customerDetails?.phone || 'N/A',
          customerEmail: order.customerDetails?.email || 'N/A',
          totalAmount: order.totalAmount,
          orderStatus: order.status,
          paymentType: order.paymentType,
          paymentStatus: order.payment_id?.payment_status || 'N/A',
          skuCount: order.skus?.length || 0,
          totalQuantity: order.skus?.reduce((sum, sku) => sum + sku.quantity, 0) || 0,
          picklists: picklists.map(picklist => ({
            picklistId: picklist._id,
            dealerId: picklist.dealerId,
            fulfilmentStaff: picklist.fulfilmentStaff,
            scanStatus: picklist.scanStatus,
            skuCount: picklist.skuList?.length || 0,
            totalQuantity: picklist.skuList?.reduce((sum, sku) => sum + sku.quantity, 0) || 0,
            invoiceGenerated: picklist.invoiceGenerated,
            createdAt: picklist.createdAt,
            updatedAt: picklist.updatedAt
          })),
          totalPicklists: picklists.length,
          completedPicklists: picklists.filter(p => p.scanStatus === 'Completed').length,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };

        return orderSummary;
      })
    );

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(res, {
      orders: enhancedOrders,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      },
      filters: {
        employeeId,
        dealerId,
        status,
        days
      }
    }, "Recent orders retrieved successfully");
  } catch (error) {
    logger.error("Error fetching recent orders:", error.message);
    return sendError(res, error);
  }
};

/**
 * Get orders by assigned employee
 */
exports.getOrdersByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { status, page = 1, limit = 10, dateRange, sortBy = 'createdAt', sortOrder = 'desc' ,linkedOrderId} = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter for picklists assigned to this employee
    let picklistFilter = { fulfilmentStaff: employeeId };
    if(linkedOrderId){
      picklistFilter.linkedOrderId=linkedOrderId;
    }

    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      picklistFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get order IDs that have picklists assigned to this employee
    const picklistOrderIds = await PickList.distinct('linkedOrderId', picklistFilter);

    if (picklistOrderIds.length === 0) {
      return sendSuccess(res, {
        orders: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: pageNumber,
          itemsPerPage: limitNumber,
          hasNextPage: false,
          hasPreviousPage: false
        },
        employeeId,
        filters: { status, dateRange }
      }, "No orders found for this employee");
    }

    // Build order filter
    const orderFilter = { _id: { $in: picklistOrderIds } };

    if (status && status !== 'all') {
      orderFilter.status = status;
    }

    // Determine sort field and order
    const sortField = sortBy === 'orderDate' ? 'orderDate' : 
                     sortBy === 'totalAmount' ? 'totalAmount' : 
                     sortBy === 'status' ? 'status' : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Get orders
    const orders = await Order.find(orderFilter)
      .populate('payment_id', 'amount payment_method payment_status')
      .sort({ [sortField]: sortDirection })
      .skip(skip)
      .limit(limitNumber);

    // Get total count
    const total = await Order.countDocuments(orderFilter);

    // Enhance order data with detailed picklist information
    const enhancedOrders = await Promise.all(
      orders.map(async (order) => {
        // Get picklists for this order assigned to this employee
        const picklists = await PickList.find({ 
          linkedOrderId: order._id, 
          fulfilmentStaff: employeeId 
        });

        // Calculate order metrics
        const totalPicklists = picklists.length;
        const completedPicklists = picklists.filter(p => p.scanStatus === 'Completed').length;
        const inProgressPicklists = picklists.filter(p => p.scanStatus === 'In Progress').length;
        const notStartedPicklists = picklists.filter(p => p.scanStatus === 'Not Started').length;
        
        const completionRate = totalPicklists > 0 ? ((completedPicklists / totalPicklists) * 100).toFixed(2) : 0;

        // Calculate average processing time for completed picklists
        let averageProcessingTime = 0;
        const completedPicklistsWithTime = picklists.filter(p => 
          p.scanStatus === 'Completed' && p.createdAt && p.updatedAt
        );
        
        if (completedPicklistsWithTime.length > 0) {
          const totalProcessingTime = completedPicklistsWithTime.reduce((sum, picklist) => {
            return sum + (picklist.updatedAt - picklist.createdAt);
          }, 0);
          averageProcessingTime = totalProcessingTime / (completedPicklistsWithTime.length * (1000 * 60 * 60)); // in hours
        }

        const orderSummary = {
          orderId: order.orderId,
          orderDate: order.orderDate,
          customerName: order.customerDetails?.name || 'N/A',
          customerPhone: order.customerDetails?.phone || 'N/A',
          customerEmail: order.customerDetails?.email || 'N/A',
          customerAddress: order.customerDetails?.address || 'N/A',
          totalAmount: order.totalAmount,
          orderStatus: order.status,
          paymentType: order.paymentType,
          paymentStatus: order.payment_id?.payment_status || 'N/A',
          skuCount: order.skus?.length || 0,
          totalQuantity: order.skus?.reduce((sum, sku) => sum + sku.quantity, 0) || 0,
          assignedEmployee: employeeId,
          picklists: picklists.map(picklist => ({
            picklistId: picklist._id,
            dealerId: picklist.dealerId,
            scanStatus: picklist.scanStatus,
            skuList: picklist.skuList || [],
            skuCount: picklist.skuList?.length || 0,
            totalQuantity: picklist.skuList?.reduce((sum, sku) => sum + sku.quantity, 0) || 0,
            invoiceGenerated: picklist.invoiceGenerated,
            packingSlipUrl: picklist.packingSlipUrl,
            createdAt: picklist.createdAt,
            updatedAt: picklist.updatedAt,
            processingTime: picklist.scanStatus === 'Completed' && picklist.createdAt && picklist.updatedAt 
              ? ((picklist.updatedAt - picklist.createdAt) / (1000 * 60 * 60)).toFixed(2) + ' hours'
              : null
          })),
          fulfillmentMetrics: {
            totalPicklists,
            completedPicklists,
            inProgressPicklists,
            notStartedPicklists,
            completionRate: parseFloat(completionRate),
            averageProcessingTime: Math.round(averageProcessingTime * 100) / 100
          },
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };

        return orderSummary;
      })
    );

    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(res, {
      orders: enhancedOrders,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1
      },
      employeeId,
      filters: { 
        status, 
        dateRange,
        sortBy,
        sortOrder
      }
    }, "Orders by employee retrieved successfully");
  } catch (error) {
    logger.error("Error fetching orders by employee:", error.message);
    return sendError(res, error);
  }
};

/**
 * Update picklist status
 */
exports.updatePicklistStatus = async (req, res) => {
  try {
    const { picklistId } = req.params;
    const { scanStatus, fulfilmentStaff, skuList } = req.body;

    const picklist = await PickList.findById(picklistId);
    if (!picklist) {
      return sendError(res, "Picklist not found", 404);
    }

    // Update fields
    if (scanStatus) picklist.scanStatus = scanStatus;
    if (fulfilmentStaff) picklist.fulfilmentStaff = fulfilmentStaff;
    if (skuList) picklist.skuList = skuList;
    
    picklist.updatedAt = new Date();

    await picklist.save();

    return sendSuccess(res, picklist, "Picklist status updated successfully");
  } catch (error) {
    logger.error("Error updating picklist status:", error.message);
    return sendError(res, error);
  }
};

/**
 * Assign picklist to employee
 */
exports.assignPicklistToEmployee = async (req, res) => {
  try {
    const { picklistId } = req.params;
    const { employeeId } = req.body;

    if (!employeeId) {
      return sendError(res, "Employee ID is required", 400);
    }

    const picklist = await PickList.findById(picklistId);
    if (!picklist) {
      return sendError(res, "Picklist not found", 404);
    }

    picklist.fulfilmentStaff = employeeId;
    picklist.updatedAt = new Date();

    await picklist.save();

    return sendSuccess(res, picklist, "Picklist assigned to employee successfully");
  } catch (error) {
    logger.error("Error assigning picklist to employee:", error.message);
    return sendError(res, error);
  }
};

/**
 * Bulk assign picklists to employee
 */
exports.bulkAssignPicklists = async (req, res) => {
  try {
    const { picklistIds, employeeId } = req.body;

    if (!employeeId || !picklistIds || !Array.isArray(picklistIds)) {
      return sendError(res, "Employee ID and picklist IDs array are required", 400);
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: picklistIds.length
    };

    for (const picklistId of picklistIds) {
      try {
        const picklist = await PickList.findById(picklistId);
        if (!picklist) {
          results.failed.push({
            picklistId,
            error: "Picklist not found"
          });
          continue;
        }

        picklist.fulfilmentStaff = employeeId;
        picklist.updatedAt = new Date();
        await picklist.save();

        results.successful.push({
          picklistId,
          orderId: picklist.linkedOrderId,
          dealerId: picklist.dealerId
        });
      } catch (error) {
        results.failed.push({
          picklistId,
          error: error.message
        });
      }
    }

    return sendSuccess(res, results, "Bulk assignment completed");
  } catch (error) {
    logger.error("Error in bulk assignment:", error.message);
    return sendError(res, error);
  }
};

// Helper function to calculate average processing time
async function calculateAverageProcessingTime(filter) {
  try {
    const completedPicklists = await PickList.find({
      ...filter,
      scanStatus: 'Completed',
      createdAt: { $exists: true },
      updatedAt: { $exists: true }
    });

    if (completedPicklists.length === 0) {
      return 0;
    }

    const totalProcessingTime = completedPicklists.reduce((sum, picklist) => {
      const processingTime = picklist.updatedAt - picklist.createdAt;
      return sum + processingTime;
    }, 0);

    const averageTimeInHours = totalProcessingTime / (completedPicklists.length * (1000 * 60 * 60));
    return Math.round(averageTimeInHours * 100) / 100;
  } catch (error) {
    logger.error("Error calculating average processing time:", error.message);
    return 0;
  }
}
