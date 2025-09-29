const Payment = require("../models/paymentModel");
const Order = require("../models/order");
const Dealer = require("../models/dealer");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const mongoose = require("mongoose");

// Get comprehensive payment statistics for dashboard cards
exports.getPaymentStats = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            dealerId,
            orderType,
            orderSource,
            groupBy = 'day' // day, week, month, year
        } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.created_at = {};
            if (startDate) dateFilter.created_at.$gte = new Date(startDate);
            if (endDate) dateFilter.created_at.$lte = new Date(endDate);
        }

        // Build order filter for aggregation
        const orderFilter = {};
        if (orderType) orderFilter['order_id.orderType'] = orderType;
        if (orderSource) orderFilter['order_id.orderSource'] = orderSource;
        if (dealerId) orderFilter['order_id.skus.dealerMapped.dealerId'] = new mongoose.Types.ObjectId(dealerId);

        // Base aggregation pipeline
        const basePipeline = [
            { $match: dateFilter },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order_id',
                    foreignField: '_id',
                    as: 'order_id'
                }
            },
            { $unwind: { path: '$order_id', preserveNullAndEmptyArrays: true } }
        ];

        // Add order filters if specified
        if (Object.keys(orderFilter).length > 0) {
            basePipeline.push({ $match: orderFilter });
        }

        // Execute multiple aggregations in parallel
        const [
            totalStats,
            statusStats,
            methodStats,
            dailyStats,
            monthlyStats,
            topDealers,
            recentPayments,
            refundStats
        ] = await Promise.all([
            getTotalPaymentStats(basePipeline),
            getPaymentStatusStats(basePipeline),
            getPaymentMethodStats(basePipeline),
            getDailyPaymentStats(basePipeline, groupBy),
            getMonthlyPaymentStats(basePipeline),
            getTopDealersByPayment(basePipeline),
            getRecentPayments(basePipeline),
            getRefundStats(basePipeline)
        ]);

        // Calculate additional metrics
        const additionalMetrics = calculateAdditionalMetrics(totalStats, statusStats);

        const paymentStats = {
            overview: {
                totalPayments: totalStats.totalPayments,
                totalAmount: totalStats.totalAmount,
                averageAmount: totalStats.averageAmount,
                successRate: additionalMetrics.successRate,
                refundRate: additionalMetrics.refundRate,
                growthRate: additionalMetrics.growthRate
            },
            statusBreakdown: statusStats,
            methodBreakdown: methodStats,
            dailyTrends: dailyStats,
            monthlyTrends: monthlyStats,
            topDealers: topDealers,
            recentPayments: recentPayments,
            refunds: refundStats,
            filters: {
                startDate,
                endDate,
                dealerId,
                orderType,
                orderSource,
                groupBy
            }
        };

        logger.info(`✅ Payment stats retrieved successfully`);
        return sendSuccess(res, paymentStats, "Payment statistics retrieved successfully");

    } catch (error) {
        logger.error(`❌ Error fetching payment stats: ${error.message}`);
        return sendError(res, error);
    }
};

// Get total payment statistics
async function getTotalPaymentStats(basePipeline) {
    const pipeline = [
        ...basePipeline,
        {
            $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' },
                minAmount: { $min: '$amount' },
                maxAmount: { $max: '$amount' }
            }
        }
    ];

    const result = await Payment.aggregate(pipeline);
    return result[0] || {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        minAmount: 0,
        maxAmount: 0
    };
}

// Get payment status breakdown
async function getPaymentStatusStats(basePipeline) {
    const pipeline = [
        ...basePipeline,
        {
            $group: {
                _id: '$payment_status',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' }
            }
        },
        { $sort: { count: -1 } }
    ];

    const result = await Payment.aggregate(pipeline);
    return result.map(item => ({
        status: item._id || 'Unknown',
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.averageAmount,
        percentage: 0 // Will be calculated later
    }));
}

// Get payment method breakdown
async function getPaymentMethodStats(basePipeline) {
    const pipeline = [
        ...basePipeline,
        {
            $group: {
                _id: '$payment_method',
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' }
            }
        },
        { $sort: { count: -1 } }
    ];

    const result = await Payment.aggregate(pipeline);
    return result.map(item => ({
        method: item._id || 'Unknown',
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.averageAmount,
        percentage: 0 // Will be calculated later
    }));
}

// Get daily payment trends
async function getDailyPaymentStats(basePipeline, groupBy) {
    let dateGroup;

    switch (groupBy) {
        case 'week':
            dateGroup = {
                year: { $year: '$created_at' },
                week: { $week: '$created_at' }
            };
            break;
        case 'month':
            dateGroup = {
                year: { $year: '$created_at' },
                month: { $month: '$created_at' }
            };
            break;
        case 'year':
            dateGroup = {
                year: { $year: '$created_at' }
            };
            break;
        default: // day
            dateGroup = {
                year: { $year: '$created_at' },
                month: { $month: '$created_at' },
                day: { $dayOfMonth: '$created_at' }
            };
    }

    const pipeline = [
        ...basePipeline,
        {
            $group: {
                _id: dateGroup,
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        { $limit: 30 } // Last 30 data points
    ];

    const result = await Payment.aggregate(pipeline);
    return result.map(item => ({
        date: formatDateGroup(item._id, groupBy),
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.averageAmount
    }));
}

// Get monthly payment trends
async function getMonthlyPaymentStats(basePipeline) {
    const pipeline = [
        ...basePipeline,
        {
            $group: {
                _id: {
                    year: { $year: '$created_at' },
                    month: { $month: '$created_at' }
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 } // Last 12 months
    ];

    const result = await Payment.aggregate(pipeline);
    return result.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.averageAmount
    }));
}

// Get top dealers by payment volume
async function getTopDealersByPayment(basePipeline) {
    const pipeline = [
        ...basePipeline,
        {
            $unwind: {
                path: '$order_id.skus',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: '$order_id.skus.dealerMapped',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: 'dealers',
                localField: 'order_id.skus.dealerMapped.dealerId',
                foreignField: '_id',
                as: 'dealer'
            }
        },
        { $unwind: { path: '$dealer', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: '$dealer._id',
                dealerName: { $first: '$dealer.trade_name' },
                dealerCode: { $first: '$dealer.dealer_code' },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' }
            }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
    ];

    const result = await Payment.aggregate(pipeline);
    return result.map(item => ({
        dealerId: item._id,
        dealerName: item.dealerName || 'Unknown Dealer',
        dealerCode: item.dealerCode || 'N/A',
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.averageAmount
    }));
}

// Get recent payments
async function getRecentPayments(basePipeline) {
    const pipeline = [
        ...basePipeline,
        {
            $project: {
                _id: 1,
                amount: 1,
                payment_status: 1,
                payment_method: 1,
                created_at: 1,
                razorpay_order_id: 1,
                'order_id.orderId': 1,
                'order_id.customerDetails.name': 1,
                'order_id.customerDetails.email': 1
            }
        },
        { $sort: { created_at: -1 } },
        { $limit: 10 }
    ];

    const result = await Payment.aggregate(pipeline);
    return result.map(item => ({
        paymentId: item._id,
        amount: item.amount,
        status: item.payment_status,
        method: item.payment_method,
        createdAt: item.created_at,
        razorpayOrderId: item.razorpay_order_id,
        orderId: item.order_id?.orderId,
        customerName: item.order_id?.customerDetails?.name,
        customerEmail: item.order_id?.customerDetails?.email
    }));
}

// Get refund statistics
async function getRefundStats(basePipeline) {
    const pipeline = [
        ...basePipeline,
        {
            $group: {
                _id: null,
                totalRefunds: { $sum: { $cond: ['$is_refund', 1, 0] } },
                totalRefundAmount: { $sum: { $cond: ['$is_refund', '$amount', 0] } },
                successfulRefunds: { $sum: { $cond: ['$refund_successful', 1, 0] } },
                pendingRefunds: { $sum: { $cond: [{ $and: ['$is_refund', { $ne: ['$refund_successful', true] }] }, 1, 0] } }
            }
        }
    ];

    const result = await Payment.aggregate(pipeline);
    return result[0] || {
        totalRefunds: 0,
        totalRefundAmount: 0,
        successfulRefunds: 0,
        pendingRefunds: 0
    };
}

// Calculate additional metrics
function calculateAdditionalMetrics(totalStats, statusStats) {
    const totalPayments = totalStats.totalPayments;
    const successfulPayments = statusStats.find(s => s.status === 'Captured')?.count || 0;
    const refundedPayments = statusStats.find(s => s.status === 'Refunded')?.count || 0;

    return {
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
        refundRate: totalPayments > 0 ? (refundedPayments / totalPayments) * 100 : 0,
        growthRate: 0 // Would need historical data to calculate
    };
}

// Format date group for display
function formatDateGroup(dateGroup, groupBy) {
    switch (groupBy) {
        case 'week':
            return `${dateGroup.year}-W${String(dateGroup.week).padStart(2, '0')}`;
        case 'month':
            return `${dateGroup.year}-${String(dateGroup.month).padStart(2, '0')}`;
        case 'year':
            return `${dateGroup.year}`;
        default: // day
            return `${dateGroup.year}-${String(dateGroup.month).padStart(2, '0')}-${String(dateGroup.day).padStart(2, '0')}`;
    }
}

// Get payment stats for specific time periods
exports.getPaymentStatsByPeriod = async (req, res) => {
    try {
        const { period = '7d' } = req.query; // 1d, 7d, 30d, 90d, 1y

        let startDate;
        const endDate = new Date();

        switch (period) {
            case '1d':
                startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get current period stats
        const currentStats = await getPeriodStats(startDate, endDate);

        // Get previous period stats for comparison
        const periodDuration = endDate.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - periodDuration);
        const previousEndDate = new Date(startDate.getTime());
        const previousStats = await getPeriodStats(previousStartDate, previousEndDate);

        // Calculate growth rates
        const growthRates = calculateGrowthRates(currentStats, previousStats);

        const periodStats = {
            period,
            current: currentStats,
            previous: previousStats,
            growth: growthRates,
            dateRange: {
                start: startDate,
                end: endDate
            }
        };

        logger.info(`✅ Payment stats for period ${period} retrieved successfully`);
        return sendSuccess(res, periodStats, `Payment statistics for ${period} retrieved successfully`);

    } catch (error) {
        logger.error(`❌ Error fetching payment stats by period: ${error.message}`);
        return sendError(res, error);
    }
};

// Get stats for a specific period
async function getPeriodStats(startDate, endDate) {
    const pipeline = [
        {
            $match: {
                created_at: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $lookup: {
                from: 'orders',
                localField: 'order_id',
                foreignField: '_id',
                as: 'order_id'
            }
        },
        { $unwind: { path: '$order_id', preserveNullAndEmptyArrays: true } },
        {
            $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' },
                successfulPayments: { $sum: { $cond: [{ $eq: ['$payment_status', 'Captured'] }, 1, 0] } },
                failedPayments: { $sum: { $cond: [{ $eq: ['$payment_status', 'Failed'] }, 1, 0] } },
                refundedPayments: { $sum: { $cond: ['$is_refund', 1, 0] } }
            }
        }
    ];

    const result = await Payment.aggregate(pipeline);
    return result[0] || {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedPayments: 0
    };
}

// Calculate growth rates
function calculateGrowthRates(current, previous) {
    const calculateRate = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return {
        totalPayments: calculateRate(current.totalPayments, previous.totalPayments),
        totalAmount: calculateRate(current.totalAmount, previous.totalAmount),
        averageAmount: calculateRate(current.averageAmount, previous.averageAmount),
        successfulPayments: calculateRate(current.successfulPayments, previous.successfulPayments),
        failedPayments: calculateRate(current.failedPayments, previous.failedPayments),
        refundedPayments: calculateRate(current.refundedPayments, previous.refundedPayments)
    };
}

// Get payment stats summary for dashboard cards
exports.getPaymentStatsSummary = async (req, res) => {
    try {
        const { period = '7d' } = req.query;

        let startDate;
        const endDate = new Date();

        switch (period) {
            case '1d':
                startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Get current and previous period stats
        const currentStats = await getPeriodStats(startDate, endDate);
        const periodDuration = endDate.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - periodDuration);
        const previousEndDate = new Date(startDate.getTime());
        const previousStats = await getPeriodStats(previousStartDate, previousEndDate);

        const growthRates = calculateGrowthRates(currentStats, previousStats);

        // Create summary cards data
        const summaryCards = [
            {
                title: 'Total Payments',
                value: currentStats.totalPayments,
                previousValue: previousStats.totalPayments,
                growth: growthRates.totalPayments,
                icon: 'payments',
                color: 'primary',
                format: 'number'
            },
            {
                title: 'Total Amount',
                value: currentStats.totalAmount,
                previousValue: previousStats.totalAmount,
                growth: growthRates.totalAmount,
                icon: 'currency',
                color: 'success',
                format: 'currency'
            },
            {
                title: 'Average Amount',
                value: currentStats.averageAmount,
                previousValue: previousStats.averageAmount,
                growth: growthRates.averageAmount,
                icon: 'trending',
                color: 'info',
                format: 'currency'
            },
            {
                title: 'Success Rate',
                value: currentStats.totalPayments > 0 ? (currentStats.successfulPayments / currentStats.totalPayments) * 100 : 0,
                previousValue: previousStats.totalPayments > 0 ? (previousStats.successfulPayments / previousStats.totalPayments) * 100 : 0,
                growth: growthRates.successfulPayments,
                icon: 'check-circle',
                color: 'success',
                format: 'percentage'
            },
            {
                title: 'Failed Payments',
                value: currentStats.failedPayments,
                previousValue: previousStats.failedPayments,
                growth: growthRates.failedPayments,
                icon: 'error',
                color: 'error',
                format: 'number'
            },
            {
                title: 'Refunded Payments',
                value: currentStats.refundedPayments,
                previousValue: previousStats.refundedPayments,
                growth: growthRates.refundedPayments,
                icon: 'undo',
                color: 'warning',
                format: 'number'
            }
        ];

        const summary = {
            period,
            cards: summaryCards,
            dateRange: {
                start: startDate,
                end: endDate
            },
            lastUpdated: new Date()
        };

        logger.info(`✅ Payment stats summary for ${period} retrieved successfully`);
        return sendSuccess(res, summary, `Payment statistics summary for ${period} retrieved successfully`);

    } catch (error) {
        logger.error(`❌ Error fetching payment stats summary: ${error.message}`);
        return sendError(res, error);
    }
};
