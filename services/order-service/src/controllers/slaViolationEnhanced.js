const SLAViolation = require("../models/slaViolation");
const Order = require("../models/order");
const DealerSLA = require("../models/dealerSla");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const axios = require("axios");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "http://order-service:5003";

/* --- Helper Functions ---------------------------------------------------- */

/**
 * Fetch comprehensive dealer details from user service
 */
const fetchDealerDetails = async (dealerId, authHeader) => {
    try {
        if (!dealerId || !authHeader) {
            return null;
        }

        const dealerResponse = await axios.get(
            `${USER_SERVICE_URL}/api/users/dealer/${dealerId}`,
            {
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            }
        );

        if (dealerResponse.data && dealerResponse.data.success && dealerResponse.data.data) {
            const dealer = dealerResponse.data.data;
            return {
                _id: dealer._id,
                dealer_name: dealer.dealer_name,
                dealer_code: dealer.dealer_code,
                email: dealer.email,
                phone: dealer.phone,
                address: dealer.address,
                city: dealer.city,
                state: dealer.state,
                pincode: dealer.pincode,
                status: dealer.status,
                dealer_type: dealer.dealer_type,
                category: dealer.category,
                gst_number: dealer.gst_number,
                pan_number: dealer.pan_number,
                contact_person: dealer.contact_person,
                contact_phone: dealer.contact_phone,
                contact_email: dealer.contact_email,
                assigned_categories: dealer.assigned_categories,
                created_at: dealer.created_at,
                updated_at: dealer.updated_at,
                // Add other relevant dealer fields as needed
            };
        }
        return null;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                logger.warn(`Authorization failed for dealer ${dealerId} - token may be invalid or expired`);
            } else if (error.response.status === 404) {
                logger.warn(`Dealer ${dealerId} not found in user service`);
            } else {
                logger.warn(`Failed to fetch dealer details for ${dealerId}: ${error.response.status} - ${error.response.statusText}`);
            }
        } else {
            logger.warn(`Error fetching dealer details for ${dealerId}: ${error.message}`);
        }
        return null;
    }
};

/**
 * Fetch comprehensive order details from order service
 */
const fetchOrderDetails = async (orderId, authHeader) => {
    try {
        if (!orderId || !authHeader) {
            return null;
        }

        const orderResponse = await axios.get(
            `${ORDER_SERVICE_URL}/api/orders/${orderId}`,
            {
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            }
        );

        if (orderResponse.data && orderResponse.data.success && orderResponse.data.data) {
            const order = orderResponse.data.data;
            return {
                _id: order._id,
                order_number: order.order_number,
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                status: order.status,
                orderType: order.orderType,
                paymentType: order.paymentType,
                payment_status: order.payment_status,
                total_amount: order.total_amount,
                totalAmount: order.totalAmount,
                order_Amount: order.order_Amount,
                delivery_address: order.delivery_address,
                billing_address: order.billing_address,
                order_date: order.order_date,
                delivery_date: order.delivery_date,
                timestamps: {
                    createdAt: order.timestamps?.createdAt,
                    updatedAt: order.timestamps?.updatedAt,
                    placedAt: order.timestamps?.placedAt,
                    confirmedAt: order.timestamps?.confirmedAt,
                    packedAt: order.timestamps?.packedAt,
                    shippedAt: order.timestamps?.shippedAt,
                    deliveredAt: order.timestamps?.deliveredAt
                },
                customerDetails: {
                    userId: order.customerDetails?.userId,
                    name: order.customerDetails?.name || 'N/A',
                    email: order.customerDetails?.email || 'N/A',
                    phone: order.customerDetails?.phone || 'N/A',
                    address: order.customerDetails?.address || 'N/A'
                },
                items: order.items || [],
                dealerMapping: order.dealerMapping || [],
                slaInfo: order.slaInfo || {},
                // Add other relevant order fields as needed
            };
        }
        return null;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                logger.warn(`Authorization failed for order ${orderId} - token may be invalid or expired`);
            } else if (error.response.status === 404) {
                logger.warn(`Order ${orderId} not found in order service`);
            } else {
                logger.warn(`Failed to fetch order details for ${orderId}: ${error.response.status} - ${error.response.statusText}`);
            }
        } else {
            logger.warn(`Error fetching order details for ${orderId}: ${error.message}`);
        }
        return null;
    }
};

/**
 * Populate SLA violation with comprehensive data
 */
const populateSLAViolationData = async (violation, authHeader) => {
    try {
        const violationObj = violation.toObject ? violation.toObject() : violation;

        // Fetch dealer details
        const dealerDetails = await fetchDealerDetails(violation.dealer_id, authHeader);

        // Fetch order details
        const orderDetails = await fetchOrderDetails(violation.order_id, authHeader);

        // Add comprehensive data to violation
        violationObj.dealerDetails = dealerDetails;
        violationObj.orderDetails = orderDetails;

        // Add calculated fields
        violationObj.violation_hours = Math.round(violation.violation_minutes / 60 * 100) / 100;
        violationObj.violation_days = Math.round(violation.violation_minutes / (60 * 24) * 100) / 100;

        // Add status information
        violationObj.status = violation.resolved ? 'Resolved' : 'Active';
        violationObj.priority = violation.violation_minutes > 1440 ? 'High' :
            violation.violation_minutes > 480 ? 'Medium' : 'Low';

        // Add contact information
        violationObj.lastContacted = violation.contact_history && violation.contact_history.length > 0
            ? violation.contact_history[violation.contact_history.length - 1].contacted_at
            : null;
        violationObj.contactCount = violation.contact_history ? violation.contact_history.length : 0;

        // Add resolution information
        violationObj.resolutionTime = violation.resolved_at && violation.created_at
            ? Math.round((new Date(violation.resolved_at) - new Date(violation.created_at)) / (1000 * 60 * 60) * 100) / 100
            : null;

        return violationObj;
    } catch (error) {
        logger.error(`Error populating SLA violation data: ${error.message}`);
        return violation.toObject ? violation.toObject() : violation;
    }
};

/* --- SLA Violation Enhanced Functions ----------------------------------- */

/**
 * Get SLA violations with comprehensive populated data
 */
exports.getSLAViolationsWithPopulatedData = async (req, res) => {
    try {
        const {
            dealerId,
            startDate,
            endDate,
            resolved,
            priority,
            status,
            limit = 50,
            page = 1,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const authHeader = req.headers.authorization;

        // Build filter
        const filter = {};
        if (dealerId) filter.dealer_id = dealerId;
        if (startDate || endDate) {
            filter.created_at = {};
            if (startDate) filter.created_at.$gte = new Date(startDate);
            if (endDate) filter.created_at.$lte = new Date(endDate);
        }
        if (resolved !== undefined) filter.resolved = resolved === "true";

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const totalCount = await SLAViolation.countDocuments(filter);

        // Get violations with pagination
        let violations = await SLAViolation.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Populate with comprehensive data
        violations = await Promise.all(
            violations.map(violation => populateSLAViolationData(violation, authHeader))
        );

        // Apply additional filters after population
        if (priority) {
            violations = violations.filter(v => v.priority === priority);
        }
        if (status) {
            violations = violations.filter(v => v.status === status);
        }

        const response = {
            violations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit),
                hasNextPage: skip + parseInt(limit) < totalCount,
                hasPrevPage: parseInt(page) > 1
            },
            filters: {
                dealerId,
                startDate,
                endDate,
                resolved,
                priority,
                status
            }
        };

        logger.info(`✅ Retrieved ${violations.length} SLA violations with populated data`);
        sendSuccess(res, response, "SLA violations with populated data fetched successfully");
    } catch (error) {
        logger.error(`❌ Get SLA violations with populated data error: ${error.message}`);
        sendError(res, error.message || "Failed to get SLA violations with populated data", 500);
    }
};

/**
 * Get single SLA violation with comprehensive populated data
 */
exports.getSLAViolationByIdWithPopulatedData = async (req, res) => {
    try {
        const { violationId } = req.params;
        const authHeader = req.headers.authorization;

        const violation = await SLAViolation.findById(violationId);
        if (!violation) {
            return sendError(res, "SLA violation not found", 404);
        }

        // Populate with comprehensive data
        const populatedViolation = await populateSLAViolationData(violation, authHeader);

        logger.info(`✅ Retrieved SLA violation ${violationId} with populated data`);
        sendSuccess(res, populatedViolation, "SLA violation with populated data fetched successfully");
    } catch (error) {
        logger.error(`❌ Get SLA violation by ID error: ${error.message}`);
        sendError(res, error.message || "Failed to get SLA violation by ID", 500);
    }
};

/**
 * Get SLA violations by dealer with comprehensive populated data
 */
exports.getSLAViolationsByDealerWithPopulatedData = async (req, res) => {
    try {
        const { dealerId } = req.params;
        const {
            startDate,
            endDate,
            resolved,
            limit = 50,
            page = 1,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        const authHeader = req.headers.authorization;

        // Build filter
        const filter = { dealer_id: dealerId };
        if (startDate || endDate) {
            filter.created_at = {};
            if (startDate) filter.created_at.$gte = new Date(startDate);
            if (endDate) filter.created_at.$lte = new Date(endDate);
        }
        if (resolved !== undefined) filter.resolved = resolved === "true";

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const totalCount = await SLAViolation.countDocuments(filter);

        // Get violations with pagination
        let violations = await SLAViolation.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Populate with comprehensive data
        violations = await Promise.all(
            violations.map(violation => populateSLAViolationData(violation, authHeader))
        );

        // Get dealer details
        const dealerDetails = await fetchDealerDetails(dealerId, authHeader);

        // Calculate dealer statistics
        const allDealerViolations = await SLAViolation.find({ dealer_id: dealerId }).lean();
        const statistics = {
            totalViolations: allDealerViolations.length,
            resolvedViolations: allDealerViolations.filter(v => v.resolved).length,
            unresolvedViolations: allDealerViolations.filter(v => !v.resolved).length,
            averageViolationMinutes: allDealerViolations.length > 0
                ? Math.round(allDealerViolations.reduce((sum, v) => sum + v.violation_minutes, 0) / allDealerViolations.length)
                : 0,
            maxViolationMinutes: allDealerViolations.length > 0
                ? Math.max(...allDealerViolations.map(v => v.violation_minutes))
                : 0,
            resolutionRate: allDealerViolations.length > 0
                ? (allDealerViolations.filter(v => v.resolved).length / allDealerViolations.length * 100).toFixed(2)
                : 0
        };

        const response = {
            dealerDetails,
            statistics,
            violations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit),
                hasNextPage: skip + parseInt(limit) < totalCount,
                hasPrevPage: parseInt(page) > 1
            }
        };

        logger.info(`✅ Retrieved ${violations.length} SLA violations for dealer ${dealerId} with populated data`);
        sendSuccess(res, response, "SLA violations by dealer with populated data fetched successfully");
    } catch (error) {
        logger.error(`❌ Get SLA violations by dealer error: ${error.message}`);
        sendError(res, error.message || "Failed to get SLA violations by dealer", 500);
    }
};

/**
 * Get SLA violations by order with comprehensive populated data
 */
exports.getSLAViolationsByOrderWithPopulatedData = async (req, res) => {
    try {
        const { orderId } = req.params;
        const authHeader = req.headers.authorization;

        const violations = await SLAViolation.find({ order_id: orderId }).lean();

        if (violations.length === 0) {
            return sendSuccess(res, [], "No SLA violations found for this order");
        }

        // Populate with comprehensive data
        const populatedViolations = await Promise.all(
            violations.map(violation => populateSLAViolationData(violation, authHeader))
        );

        // Get order details
        const orderDetails = await fetchOrderDetails(orderId, authHeader);

        const response = {
            orderDetails,
            violations: populatedViolations,
            totalViolations: violations.length,
            resolvedViolations: violations.filter(v => v.resolved).length,
            unresolvedViolations: violations.filter(v => !v.resolved).length
        };

        logger.info(`✅ Retrieved ${violations.length} SLA violations for order ${orderId} with populated data`);
        sendSuccess(res, response, "SLA violations by order with populated data fetched successfully");
    } catch (error) {
        logger.error(`❌ Get SLA violations by order error: ${error.message}`);
        sendError(res, error.message || "Failed to get SLA violations by order", 500);
    }
};

/**
 * Get SLA violation analytics with comprehensive data
 */
exports.getSLAViolationAnalytics = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            dealerId,
            groupBy = 'day' // day, week, month
        } = req.query;

        const authHeader = req.headers.authorization;

        // Build filter
        const filter = {};
        if (dealerId) filter.dealer_id = dealerId;
        if (startDate || endDate) {
            filter.created_at = {};
            if (startDate) filter.created_at.$gte = new Date(startDate);
            if (endDate) filter.created_at.$lte = new Date(endDate);
        }

        // Get all violations
        const violations = await SLAViolation.find(filter).lean();

        // Calculate analytics
        const analytics = {
            summary: {
                totalViolations: violations.length,
                resolvedViolations: violations.filter(v => v.resolved).length,
                unresolvedViolations: violations.filter(v => !v.resolved).length,
                averageViolationMinutes: violations.length > 0
                    ? Math.round(violations.reduce((sum, v) => sum + v.violation_minutes, 0) / violations.length)
                    : 0,
                maxViolationMinutes: violations.length > 0
                    ? Math.max(...violations.map(v => v.violation_minutes))
                    : 0,
                resolutionRate: violations.length > 0
                    ? (violations.filter(v => v.resolved).length / violations.length * 100).toFixed(2)
                    : 0
            },
            byPriority: {
                high: violations.filter(v => v.violation_minutes > 1440).length,
                medium: violations.filter(v => v.violation_minutes > 480 && v.violation_minutes <= 1440).length,
                low: violations.filter(v => v.violation_minutes <= 480).length
            },
            byStatus: {
                active: violations.filter(v => !v.resolved).length,
                resolved: violations.filter(v => v.resolved).length
            },
            topViolatingDealers: [],
            recentViolations: violations
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10)
        };

        // Get top violating dealers
        const dealerViolationCounts = {};
        violations.forEach(violation => {
            const dealerId = violation.dealer_id.toString();
            if (!dealerViolationCounts[dealerId]) {
                dealerViolationCounts[dealerId] = 0;
            }
            dealerViolationCounts[dealerId]++;
        });

        const topDealerIds = Object.entries(dealerViolationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([dealerId]) => dealerId);

        // Fetch dealer details for top violators
        analytics.topViolatingDealers = await Promise.all(
            topDealerIds.map(async (dealerId) => {
                const dealerDetails = await fetchDealerDetails(dealerId, authHeader);
                return {
                    dealerId,
                    dealerDetails,
                    violationCount: dealerViolationCounts[dealerId]
                };
            })
        );

        // Populate recent violations with comprehensive data
        analytics.recentViolations = await Promise.all(
            analytics.recentViolations.map(violation => populateSLAViolationData(violation, authHeader))
        );

        logger.info(`✅ Generated SLA violation analytics for ${violations.length} violations`);
        sendSuccess(res, analytics, "SLA violation analytics generated successfully");
    } catch (error) {
        logger.error(`❌ Get SLA violation analytics error: ${error.message}`);
        sendError(res, error.message || "Failed to get SLA violation analytics", 500);
    }
};

/**
 * Search SLA violations with comprehensive populated data
 */
exports.searchSLAViolations = async (req, res) => {
    try {
        const {
            query,
            dealerId,
            orderId,
            startDate,
            endDate,
            resolved,
            limit = 50,
            page = 1
        } = req.query;

        const authHeader = req.headers.authorization;

        // Build search filter
        const filter = {};
        if (dealerId) filter.dealer_id = dealerId;
        if (orderId) filter.order_id = orderId;
        if (startDate || endDate) {
            filter.created_at = {};
            if (startDate) filter.created_at.$gte = new Date(startDate);
            if (endDate) filter.created_at.$lte = new Date(endDate);
        }
        if (resolved !== undefined) filter.resolved = resolved === "true";

        // Add text search if query provided
        if (query) {
            filter.$or = [
                { notes: { $regex: query, $options: 'i' } },
                { resolution_notes: { $regex: query, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const totalCount = await SLAViolation.countDocuments(filter);

        // Get violations
        let violations = await SLAViolation.find(filter)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Populate with comprehensive data
        violations = await Promise.all(
            violations.map(violation => populateSLAViolationData(violation, authHeader))
        );

        const response = {
            violations,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalCount,
                limit: parseInt(limit),
                hasNextPage: skip + parseInt(limit) < totalCount,
                hasPrevPage: parseInt(page) > 1
            },
            searchQuery: query
        };

        logger.info(`✅ Searched SLA violations with query: ${query}, found ${violations.length} results`);
        sendSuccess(res, response, "SLA violations search completed successfully");
    } catch (error) {
        logger.error(`❌ Search SLA violations error: ${error.message}`);
        sendError(res, error.message || "Failed to search SLA violations", 500);
    }
};
