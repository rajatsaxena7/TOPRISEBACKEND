const Order = require("../models/order");
const Picklist = require("../models/picklist");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

// ✅ ORDER ANALYTICS REPORT
exports.getOrderAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      orderType,
      paymentType,
      orderSource,
      deliveryType,
      typeOfDelivery,
      minAmount,
      maxAmount,
      city,
      state,
      pincode,
      groupBy = 'status',
      sortBy = 'count',
      sortOrder = 'desc',
      limit = 100
    } = req.query;

    // Build filter
    const filter = {};
    
    // Date range filter
    if (startDate || endDate) {
      filter['timestamps.createdAt'] = {};
      if (startDate) filter['timestamps.createdAt'].$gte = new Date(startDate);
      if (endDate) filter['timestamps.createdAt'].$lte = new Date(endDate);
    }

    // Order filters
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (paymentType) filter.paymentType = paymentType;
    if (orderSource) filter.orderSource = orderSource;
    if (deliveryType) filter.delivery_type = deliveryType;
    if (typeOfDelivery) filter.type_of_delivery = typeOfDelivery;

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.order_Amount = {};
      if (minAmount) filter.order_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.order_Amount.$lte = parseFloat(maxAmount);
    }

    // Location filters
    if (city) filter['customerDetails.address'] = { $regex: city, $options: 'i' };
    if (state) filter['customerDetails.state'] = { $regex: state, $options: 'i' };
    if (pincode) filter['customerDetails.pincode'] = pincode;

    logger.info(`🔍 Order Analytics Report - Filter:`, JSON.stringify(filter, null, 2));

    // Build aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: groupBy === 'status' ? '$status' :
               groupBy === 'orderType' ? '$orderType' :
               groupBy === 'paymentType' ? '$paymentType' :
               groupBy === 'orderSource' ? '$orderSource' :
               groupBy === 'deliveryType' ? '$delivery_type' :
               groupBy === 'typeOfDelivery' ? '$type_of_delivery' :
               groupBy === 'city' ? '$customerDetails.address' :
               groupBy === 'state' ? '$customerDetails.state' :
               groupBy === 'pincode' ? '$customerDetails.pincode' :
               '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          orders: {
            $push: {
              orderId: '$orderId',
              orderAmount: '$order_Amount',
              totalAmount: '$totalAmount',
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource',
              deliveryType: '$delivery_type',
              typeOfDelivery: '$type_of_delivery',
              customerName: '$customerDetails.name',
              customerEmail: '$customerDetails.email',
              customerPhone: '$customerDetails.phone',
              city: '$customerDetails.address',
              state: '$customerDetails.state',
              pincode: '$customerDetails.pincode',
              createdAt: '$timestamps.createdAt',
              assignedAt: '$timestamps.assignedAt',
              deliveredAt: '$timestamps.deliveredAt'
            }
          }
        }
      },
      {
        $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const analytics = await Order.aggregate(pipeline);

    // Get summary statistics
    const summary = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          statusCounts: {
            $push: {
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource'
            }
          }
        }
      }
    ]);

    // Process status breakdown
    const statusBreakdown = {};
    if (summary[0] && summary[0].statusCounts) {
      summary[0].statusCounts.forEach(item => {
        if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
        statusBreakdown[item.status]++;
      });
    }

    const response = {
      summary: {
        totalOrders: summary[0]?.totalOrders || 0,
        totalAmount: summary[0]?.totalAmount || 0,
        avgAmount: Math.round(summary[0]?.avgAmount || 0),
        minAmount: summary[0]?.minAmount || 0,
        maxAmount: summary[0]?.maxAmount || 0,
        totalGST: summary[0]?.totalGST || 0,
        avgGST: Math.round(summary[0]?.avgGST || 0),
        totalDeliveryCharges: summary[0]?.totalDeliveryCharges || 0,
        avgDeliveryCharges: Math.round(summary[0]?.avgDeliveryCharges || 0),
        statusBreakdown
      },
      analytics,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || null,
        orderType: orderType || null,
        paymentType: paymentType || null,
        orderSource: orderSource || null,
        deliveryType: deliveryType || null,
        typeOfDelivery: typeOfDelivery || null,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        groupBy,
        sortBy,
        sortOrder,
        limit: parseInt(limit)
      }
    };

    logger.info(`✅ Order Analytics Report generated successfully`);
    sendSuccess(res, response, "Order analytics report generated successfully");

  } catch (error) {
    logger.error("❌ Order Analytics Report error:", error);
    sendError(res, "Failed to generate order analytics report", 500);
  }
};

// ✅ SALES ANALYTICS REPORT
exports.getSalesAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      orderType,
      paymentType,
      orderSource,
      deliveryType,
      typeOfDelivery,
      minAmount,
      maxAmount,
      city,
      state,
      pincode,
      groupBy = 'date',
      sortBy = 'totalAmount',
      sortOrder = 'desc',
      limit = 100
    } = req.query;

    // Build filter
    const filter = {};
    
    if (startDate || endDate) {
      filter['timestamps.createdAt'] = {};
      if (startDate) filter['timestamps.createdAt'].$gte = new Date(startDate);
      if (endDate) filter['timestamps.createdAt'].$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (paymentType) filter.paymentType = paymentType;
    if (orderSource) filter.orderSource = orderSource;
    if (deliveryType) filter.delivery_type = deliveryType;
    if (typeOfDelivery) filter.type_of_delivery = typeOfDelivery;

    if (minAmount || maxAmount) {
      filter.order_Amount = {};
      if (minAmount) filter.order_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.order_Amount.$lte = parseFloat(maxAmount);
    }

    if (city) filter['customerDetails.address'] = { $regex: city, $options: 'i' };
    if (state) filter['customerDetails.state'] = { $regex: state, $options: 'i' };
    if (pincode) filter['customerDetails.pincode'] = pincode;

    logger.info(`🔍 Sales Analytics Report - Filter:`, JSON.stringify(filter, null, 2));

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: groupBy === 'date' ? {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamps.createdAt"
            }
          } :
          groupBy === 'month' ? {
            $dateToString: {
              format: "%Y-%m",
              date: "$timestamps.createdAt"
            }
          } :
          groupBy === 'year' ? {
            $dateToString: {
              format: "%Y",
              date: "$timestamps.createdAt"
            }
          } :
          groupBy === 'status' ? '$status' :
          groupBy === 'orderType' ? '$orderType' :
          groupBy === 'paymentType' ? '$paymentType' :
          groupBy === 'orderSource' ? '$orderSource' :
          groupBy === 'deliveryType' ? '$delivery_type' :
          groupBy === 'typeOfDelivery' ? '$type_of_delivery' :
          groupBy === 'city' ? '$customerDetails.address' :
          groupBy === 'state' ? '$customerDetails.state' :
          groupBy === 'pincode' ? '$customerDetails.pincode' :
          {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamps.createdAt"
            }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          totalRevenue: { $sum: '$totalAmount' },
          avgRevenue: { $avg: '$totalAmount' },
          orders: {
            $push: {
              orderId: '$orderId',
              orderAmount: '$order_Amount',
              totalAmount: '$totalAmount',
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource',
              deliveryType: '$delivery_type',
              typeOfDelivery: '$type_of_delivery',
              customerName: '$customerDetails.name',
              customerEmail: '$customerDetails.email',
              customerPhone: '$customerDetails.phone',
              city: '$customerDetails.address',
              state: '$customerDetails.state',
              pincode: '$customerDetails.pincode',
              createdAt: '$timestamps.createdAt',
              assignedAt: '$timestamps.assignedAt',
              deliveredAt: '$timestamps.deliveredAt'
            }
          }
        }
      },
      {
        $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const salesAnalytics = await Order.aggregate(pipeline);

    // Get summary statistics
    const summary = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          totalRevenue: { $sum: '$totalAmount' },
          avgRevenue: { $avg: '$totalAmount' },
          statusCounts: {
            $push: {
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource'
            }
          }
        }
      }
    ]);

    // Process status breakdown
    const statusBreakdown = {};
    if (summary[0] && summary[0].statusCounts) {
      summary[0].statusCounts.forEach(item => {
        if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
        statusBreakdown[item.status]++;
      });
    }

    const response = {
      summary: {
        totalOrders: summary[0]?.totalOrders || 0,
        totalAmount: summary[0]?.totalAmount || 0,
        avgAmount: Math.round(summary[0]?.avgAmount || 0),
        minAmount: summary[0]?.minAmount || 0,
        maxAmount: summary[0]?.maxAmount || 0,
        totalGST: summary[0]?.totalGST || 0,
        avgGST: Math.round(summary[0]?.avgGST || 0),
        totalDeliveryCharges: summary[0]?.totalDeliveryCharges || 0,
        avgDeliveryCharges: Math.round(summary[0]?.avgDeliveryCharges || 0),
        totalRevenue: summary[0]?.totalRevenue || 0,
        avgRevenue: Math.round(summary[0]?.avgRevenue || 0),
        statusBreakdown
      },
      salesAnalytics,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || null,
        orderType: orderType || null,
        paymentType: paymentType || null,
        orderSource: orderSource || null,
        deliveryType: deliveryType || null,
        typeOfDelivery: typeOfDelivery || null,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        groupBy,
        sortBy,
        sortOrder,
        limit: parseInt(limit)
      }
    };

    logger.info(`✅ Sales Analytics Report generated successfully`);
    sendSuccess(res, response, "Sales analytics report generated successfully");

  } catch (error) {
    logger.error("❌ Sales Analytics Report error:", error);
    sendError(res, "Failed to generate sales analytics report", 500);
  }
};

// ✅ ORDER PERFORMANCE REPORT
exports.getOrderPerformance = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      orderType,
      paymentType,
      orderSource,
      deliveryType,
      typeOfDelivery,
      minAmount,
      maxAmount,
      city,
      state,
      pincode,
      sortBy = 'orderAmount',
      sortOrder = 'desc',
      limit = 50
    } = req.query;

    // Build filter
    const filter = {};
    
    if (startDate || endDate) {
      filter['timestamps.createdAt'] = {};
      if (startDate) filter['timestamps.createdAt'].$gte = new Date(startDate);
      if (endDate) filter['timestamps.createdAt'].$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (paymentType) filter.paymentType = paymentType;
    if (orderSource) filter.orderSource = orderSource;
    if (deliveryType) filter.delivery_type = deliveryType;
    if (typeOfDelivery) filter.type_of_delivery = typeOfDelivery;

    if (minAmount || maxAmount) {
      filter.order_Amount = {};
      if (minAmount) filter.order_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.order_Amount.$lte = parseFloat(maxAmount);
    }

    if (city) filter['customerDetails.address'] = { $regex: city, $options: 'i' };
    if (state) filter['customerDetails.state'] = { $regex: state, $options: 'i' };
    if (pincode) filter['customerDetails.pincode'] = pincode;

    logger.info(`🔍 Order Performance Report - Filter:`, JSON.stringify(filter, null, 2));

    const pipeline = [
      { $match: filter },
      {
        $project: {
          orderId: '$orderId',
          orderAmount: '$order_Amount',
          totalAmount: '$totalAmount',
          status: '$status',
          orderType: '$orderType',
          paymentType: '$paymentType',
          orderSource: '$orderSource',
          deliveryType: '$delivery_type',
          typeOfDelivery: '$type_of_delivery',
          customerName: '$customerDetails.name',
          customerEmail: '$customerDetails.email',
          customerPhone: '$customerDetails.phone',
          city: '$customerDetails.address',
          state: '$customerDetails.state',
          pincode: '$customerDetails.pincode',
          createdAt: '$timestamps.createdAt',
          assignedAt: '$timestamps.assignedAt',
          deliveredAt: '$timestamps.deliveredAt',
          GST: '$GST',
          deliveryCharges: '$deliveryCharges',
          skuCount: { $size: { $ifNull: ['$skus', []] } },
          // Performance metrics
          processingTime: {
            $cond: [
              { $ne: ['$timestamps.assignedAt', null] },
              {
                $divide: [
                  { $subtract: ['$timestamps.assignedAt', '$timestamps.createdAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              null
            ]
          },
          deliveryTime: {
            $cond: [
              { $ne: ['$timestamps.deliveredAt', null] },
              {
                $divide: [
                  { $subtract: ['$timestamps.deliveredAt', '$timestamps.createdAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              null
            ]
          },
          valueScore: {
            $multiply: [
              { $divide: ['$order_Amount', 1000] },
              { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0.5] }
            ]
          },
          efficiencyScore: {
            $cond: [
              { $ne: ['$timestamps.deliveredAt', null] },
              {
                $multiply: [
                  { $divide: ['$order_Amount', 1000] },
                  { $divide: [1, { $add: [1, { $divide: [{ $subtract: ['$timestamps.deliveredAt', '$timestamps.createdAt'] }, 1000 * 60 * 60 * 24] }] }] }
                ]
              },
              0
            ]
          }
        }
      },
      {
        $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const performance = await Order.aggregate(pipeline);

    // Get summary statistics
    const summary = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          totalRevenue: { $sum: '$totalAmount' },
          avgRevenue: { $avg: '$totalAmount' },
          statusCounts: {
            $push: {
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource'
            }
          }
        }
      }
    ]);

    // Process status breakdown
    const statusBreakdown = {};
    if (summary[0] && summary[0].statusCounts) {
      summary[0].statusCounts.forEach(item => {
        if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
        statusBreakdown[item.status]++;
      });
    }

    const response = {
      summary: {
        totalOrders: summary[0]?.totalOrders || 0,
        totalAmount: summary[0]?.totalAmount || 0,
        avgAmount: Math.round(summary[0]?.avgAmount || 0),
        minAmount: summary[0]?.minAmount || 0,
        maxAmount: summary[0]?.maxAmount || 0,
        totalGST: summary[0]?.totalGST || 0,
        avgGST: Math.round(summary[0]?.avgGST || 0),
        totalDeliveryCharges: summary[0]?.totalDeliveryCharges || 0,
        avgDeliveryCharges: Math.round(summary[0]?.avgDeliveryCharges || 0),
        totalRevenue: summary[0]?.totalRevenue || 0,
        avgRevenue: Math.round(summary[0]?.avgRevenue || 0),
        statusBreakdown
      },
      performance,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || null,
        orderType: orderType || null,
        paymentType: paymentType || null,
        orderSource: orderSource || null,
        deliveryType: deliveryType || null,
        typeOfDelivery: typeOfDelivery || null,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        sortBy,
        sortOrder,
        limit: parseInt(limit)
      }
    };

    logger.info(`✅ Order Performance Report generated successfully`);
    sendSuccess(res, response, "Order performance report generated successfully");

  } catch (error) {
    logger.error("❌ Order Performance Report error:", error);
    sendError(res, "Failed to generate order performance report", 500);
  }
};

// ✅ PICKLIST ANALYTICS REPORT
exports.getPicklistAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      orderType,
      paymentType,
      orderSource,
      deliveryType,
      typeOfDelivery,
      minAmount,
      maxAmount,
      city,
      state,
      pincode,
      groupBy = 'status',
      sortBy = 'count',
      sortOrder = 'desc',
      limit = 100
    } = req.query;

    // Build filter
    const filter = {};
    
    if (startDate || endDate) {
      filter['timestamps.createdAt'] = {};
      if (startDate) filter['timestamps.createdAt'].$gte = new Date(startDate);
      if (endDate) filter['timestamps.createdAt'].$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (paymentType) filter.paymentType = paymentType;
    if (orderSource) filter.orderSource = orderSource;
    if (deliveryType) filter.delivery_type = deliveryType;
    if (typeOfDelivery) filter.type_of_delivery = typeOfDelivery;

    if (minAmount || maxAmount) {
      filter.order_Amount = {};
      if (minAmount) filter.order_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.order_Amount.$lte = parseFloat(maxAmount);
    }

    if (city) filter['customerDetails.address'] = { $regex: city, $options: 'i' };
    if (state) filter['customerDetails.state'] = { $regex: state, $options: 'i' };
    if (pincode) filter['customerDetails.pincode'] = pincode;

    logger.info(`🔍 Picklist Analytics Report - Filter:`, JSON.stringify(filter, null, 2));

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: groupBy === 'status' ? '$status' :
               groupBy === 'orderType' ? '$orderType' :
               groupBy === 'paymentType' ? '$paymentType' :
               groupBy === 'orderSource' ? '$orderSource' :
               groupBy === 'deliveryType' ? '$delivery_type' :
               groupBy === 'typeOfDelivery' ? '$type_of_delivery' :
               groupBy === 'city' ? '$customerDetails.address' :
               groupBy === 'state' ? '$customerDetails.state' :
               groupBy === 'pincode' ? '$customerDetails.pincode' :
               '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          picklists: {
            $push: {
              picklistId: '$picklistId',
              orderId: '$orderId',
              orderAmount: '$order_Amount',
              totalAmount: '$totalAmount',
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource',
              deliveryType: '$delivery_type',
              typeOfDelivery: '$type_of_delivery',
              customerName: '$customerDetails.name',
              customerEmail: '$customerDetails.email',
              customerPhone: '$customerDetails.phone',
              city: '$customerDetails.address',
              state: '$customerDetails.state',
              pincode: '$customerDetails.pincode',
              createdAt: '$timestamps.createdAt',
              assignedAt: '$timestamps.assignedAt',
              deliveredAt: '$timestamps.deliveredAt'
            }
          }
        }
      },
      {
        $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
      },
      {
        $limit: parseInt(limit)
      }
    ];

    const analytics = await Picklist.aggregate(pipeline);

    // Get summary statistics
    const summary = await Picklist.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalPicklists: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          statusCounts: {
            $push: {
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource'
            }
          }
        }
      }
    ]);

    // Process status breakdown
    const statusBreakdown = {};
    if (summary[0] && summary[0].statusCounts) {
      summary[0].statusCounts.forEach(item => {
        if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
        statusBreakdown[item.status]++;
      });
    }

    const response = {
      summary: {
        totalPicklists: summary[0]?.totalPicklists || 0,
        totalAmount: summary[0]?.totalAmount || 0,
        avgAmount: Math.round(summary[0]?.avgAmount || 0),
        minAmount: summary[0]?.minAmount || 0,
        maxAmount: summary[0]?.maxAmount || 0,
        totalGST: summary[0]?.totalGST || 0,
        avgGST: Math.round(summary[0]?.avgGST || 0),
        totalDeliveryCharges: summary[0]?.totalDeliveryCharges || 0,
        avgDeliveryCharges: Math.round(summary[0]?.avgDeliveryCharges || 0),
        statusBreakdown
      },
      analytics,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || null,
        orderType: orderType || null,
        paymentType: paymentType || null,
        orderSource: orderSource || null,
        deliveryType: deliveryType || null,
        typeOfDelivery: typeOfDelivery || null,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        groupBy,
        sortBy,
        sortOrder,
        limit: parseInt(limit)
      }
    };

    logger.info(`✅ Picklist Analytics Report generated successfully`);
    sendSuccess(res, response, "Picklist analytics report generated successfully");

  } catch (error) {
    logger.error("❌ Picklist Analytics Report error:", error);
    sendError(res, "Failed to generate picklist analytics report", 500);
  }
};

// ✅ ORDER EXPORT REPORT
exports.exportOrderReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      status,
      orderType,
      paymentType,
      orderSource,
      deliveryType,
      typeOfDelivery,
      minAmount,
      maxAmount,
      city,
      state,
      pincode,
      format = 'json',
      fields = 'all'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (startDate || endDate) {
      filter['timestamps.createdAt'] = {};
      if (startDate) filter['timestamps.createdAt'].$gte = new Date(startDate);
      if (endDate) filter['timestamps.createdAt'].$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;
    if (paymentType) filter.paymentType = paymentType;
    if (orderSource) filter.orderSource = orderSource;
    if (deliveryType) filter.delivery_type = deliveryType;
    if (typeOfDelivery) filter.type_of_delivery = typeOfDelivery;

    if (minAmount || maxAmount) {
      filter.order_Amount = {};
      if (minAmount) filter.order_Amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.order_Amount.$lte = parseFloat(maxAmount);
    }

    if (city) filter['customerDetails.address'] = { $regex: city, $options: 'i' };
    if (state) filter['customerDetails.state'] = { $regex: state, $options: 'i' };
    if (pincode) filter['customerDetails.pincode'] = pincode;

    logger.info(`🔍 Order Export Report - Filter:`, JSON.stringify(filter, null, 2));

    const pipeline = [
      { $match: filter },
      {
        $project: {
          orderId: '$orderId',
          orderAmount: '$order_Amount',
          totalAmount: '$totalAmount',
          status: '$status',
          orderType: '$orderType',
          paymentType: '$paymentType',
          orderSource: '$orderSource',
          deliveryType: '$delivery_type',
          typeOfDelivery: '$type_of_delivery',
          customerName: '$customerDetails.name',
          customerEmail: '$customerDetails.email',
          customerPhone: '$customerDetails.phone',
          customerAddress: '$customerDetails.address',
          customerState: '$customerDetails.state',
          customerPincode: '$customerDetails.pincode',
          createdAt: '$timestamps.createdAt',
          assignedAt: '$timestamps.assignedAt',
          deliveredAt: '$timestamps.deliveredAt',
          GST: '$GST',
          deliveryCharges: '$deliveryCharges',
          skuCount: { $size: { $ifNull: ['$skus', []] } },
          skus: '$skus',
          dealerMapping: '$dealerMapping',
          purchaseOrderId: '$purchaseOrderId',
          ratting: '$ratting',
          auditLogs: '$auditLogs',
          slaInfo: '$slaInfo',
          metaData: '$metaData',
          customFields: '$customFields',
          version: '$version',
          changeLog: '$changeLog'
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const orders = await Order.aggregate(pipeline);

    // Get summary statistics
    const summary = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$order_Amount' },
          avgAmount: { $avg: '$order_Amount' },
          minAmount: { $min: '$order_Amount' },
          maxAmount: { $max: '$order_Amount' },
          totalGST: { $sum: '$GST' },
          avgGST: { $avg: '$GST' },
          totalDeliveryCharges: { $sum: '$deliveryCharges' },
          avgDeliveryCharges: { $avg: '$deliveryCharges' },
          totalRevenue: { $sum: '$totalAmount' },
          avgRevenue: { $avg: '$totalAmount' },
          statusCounts: {
            $push: {
              status: '$status',
              orderType: '$orderType',
              paymentType: '$paymentType',
              orderSource: '$orderSource'
            }
          }
        }
      }
    ]);

    // Process status breakdown
    const statusBreakdown = {};
    if (summary[0] && summary[0].statusCounts) {
      summary[0].statusCounts.forEach(item => {
        if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
        statusBreakdown[item.status]++;
      });
    }

    const response = {
      summary: {
        totalOrders: summary[0]?.totalOrders || 0,
        totalAmount: summary[0]?.totalAmount || 0,
        avgAmount: Math.round(summary[0]?.avgAmount || 0),
        minAmount: summary[0]?.minAmount || 0,
        maxAmount: summary[0]?.maxAmount || 0,
        totalGST: summary[0]?.totalGST || 0,
        avgGST: Math.round(summary[0]?.avgGST || 0),
        totalDeliveryCharges: summary[0]?.totalDeliveryCharges || 0,
        avgDeliveryCharges: Math.round(summary[0]?.avgDeliveryCharges || 0),
        totalRevenue: summary[0]?.totalRevenue || 0,
        avgRevenue: Math.round(summary[0]?.avgRevenue || 0),
        statusBreakdown
      },
      orders,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        status: status || null,
        orderType: orderType || null,
        paymentType: paymentType || null,
        orderSource: orderSource || null,
        deliveryType: deliveryType || null,
        typeOfDelivery: typeOfDelivery || null,
        minAmount: minAmount || null,
        maxAmount: maxAmount || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        format,
        fields
      }
    };

    logger.info(`✅ Order Export Report generated successfully`);
    sendSuccess(res, response, "Order export report generated successfully");

  } catch (error) {
    logger.error("❌ Order Export Report error:", error);
    sendError(res, "Failed to generate order export report", 500);
  }
};
