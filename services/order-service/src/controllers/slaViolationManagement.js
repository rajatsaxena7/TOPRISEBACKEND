const SLAViolation = require("../models/slaViolation");
const Order = require("../models/order");
const DealerSLA = require("../models/dealerSla");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const { fetchDealer } = require("../utils/userserviceClient1");
const axios = require("axios");
const {
    createUnicastOrMulticastNotificationUtilityFunction,
} = require("../../../../packages/utils/notificationService");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

/* --- Helper Functions ---------------------------------------------------- */

/**
 * Fetch dealer details from user service
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
            return {
                _id: dealerResponse.data.data._id,
                dealer_name: dealerResponse.data.data.dealer_name,
                email: dealerResponse.data.data.email,
                phone: dealerResponse.data.data.phone,
                address: dealerResponse.data.data.address,
                status: dealerResponse.data.data.status,
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
 * Send notification to dealer about SLA violation
 */
const sendDealerNotification = async (dealerId, violation, authHeader) => {
    try {
        const successData = await createUnicastOrMulticastNotificationUtilityFunction(
            [dealerId],
            ["INAPP", "PUSH", "EMAIL"],
            "SLA Violation Alert",
            `SLA violation detected for order ${violation.order_id}. Violation time: ${violation.violation_minutes} minutes.`,
            "",
            "",
            "SLAViolation",
            {
                violation_id: violation._id,
                order_id: violation.order_id,
                violation_minutes: violation.violation_minutes,
                expected_time: violation.expected_fulfillment_time,
                actual_time: violation.actual_fulfillment_time,
            },
            authHeader
        );

        if (!successData.success) {
            logger.error("❌ SLA violation notification error:", successData.message);
            return false;
        } else {
            logger.info("✅ SLA violation notification sent successfully");
            return true;
        }
    } catch (error) {
        logger.error(`❌ Error sending SLA violation notification: ${error.message}`);
        return false;
    }
};

/* --- SLA Violation Management Functions --------------------------------- */

/**
 * Create a manual SLA violation for a dealer
 */
exports.createManualSLAViolation = async (req, res) => {
    try {
        const {
            dealer_id,
            order_id,
            expected_fulfillment_time,
            actual_fulfillment_time,
            violation_minutes,
            notes,
            created_by,
            contact_dealer = false
        } = req.body;

        // Validate required fields
        if (!dealer_id || !order_id || !expected_fulfillment_time || !actual_fulfillment_time) {
            return sendError(res, "dealer_id, order_id, expected_fulfillment_time, and actual_fulfillment_time are required", 400);
        }

        // Validate dates
        const expectedTime = new Date(expected_fulfillment_time);
        const actualTime = new Date(actual_fulfillment_time);

        if (isNaN(expectedTime.getTime()) || isNaN(actualTime.getTime())) {
            return sendError(res, "Invalid date format for expected_fulfillment_time or actual_fulfillment_time", 400);
        }

        // Calculate violation minutes if not provided
        let calculatedViolationMinutes = violation_minutes;
        if (!calculatedViolationMinutes) {
            calculatedViolationMinutes = Math.round((actualTime - expectedTime) / (1000 * 60));
        }

        // Verify dealer exists
        const dealerDetails = await fetchDealerDetails(dealer_id, req.headers.authorization);
        if (!dealerDetails) {
            return sendError(res, "Dealer not found", 404);
        }

        // Verify order exists
        const order = await Order.findById(order_id);
        if (!order) {
            return sendError(res, "Order not found", 404);
        }

        // Create SLA violation record
        const violation = new SLAViolation({
            dealer_id,
            order_id,
            expected_fulfillment_time: expectedTime,
            actual_fulfillment_time: actualTime,
            violation_minutes: calculatedViolationMinutes,
            notes: notes || `Manual SLA violation created by ${created_by || 'system'}`,
            resolved: false,
        });

        await violation.save();

        // Update order with violation status
        await Order.findByIdAndUpdate(order_id, {
            "slaInfo.isSLAMet": false,
            "slaInfo.violationMinutes": calculatedViolationMinutes,
            "slaInfo.actualFulfillmentTime": actualTime,
            status: "SLA_Violated",
        });

        // Contact dealer if requested
        let dealerContacted = false;
        if (contact_dealer) {
            dealerContacted = await sendDealerNotification(dealer_id, violation, req.headers.authorization);
        }

        // Populate violation with dealer and order details
        const populatedViolation = {
            ...violation.toObject(),
            dealerDetails,
            orderDetails: {
                _id: order._id,
                order_number: order.order_number,
                total_amount: order.total_amount,
                status: order.status,
            },
            dealerContacted,
        };

        logger.info(`✅ Manual SLA violation created: ${violation._id} for dealer: ${dealer_id}`);
        sendSuccess(res, populatedViolation, "Manual SLA violation created successfully");
    } catch (error) {
        logger.error(`❌ Create manual SLA violation error: ${error.message}`);
        sendError(res, error.message || "Failed to create manual SLA violation", 500);
    }
};

/**
 * Contact dealer about SLA violation
 */
exports.contactDealerAboutViolation = async (req, res) => {
    try {
        const { violationId } = req.params;
        const { contact_method = "notification", custom_message } = req.body;

        // Find the violation
        const violation = await SLAViolation.findById(violationId);
        if (!violation) {
            return sendError(res, "SLA violation not found", 404);
        }

        // Get dealer details
        const dealerDetails = await fetchDealerDetails(violation.dealer_id, req.headers.authorization);
        if (!dealerDetails) {
            return sendError(res, "Dealer not found", 404);
        }

        // Get order details
        const order = await Order.findById(violation.order_id);
        if (!order) {
            return sendError(res, "Order not found", 404);
        }

        let contactResult = {
            success: false,
            method: contact_method,
            message: "",
        };

        // Send notification
        if (contact_method === "notification" || contact_method === "all") {
            const notificationSent = await sendDealerNotification(
                violation.dealer_id,
                violation,
                req.headers.authorization
            );

            if (notificationSent) {
                contactResult.success = true;
                contactResult.message = "Notification sent successfully";
            } else {
                contactResult.message = "Failed to send notification";
            }
        }

        // Send email (if implemented)
        if (contact_method === "email" || contact_method === "all") {
            // TODO: Implement email sending functionality
            logger.info(`📧 Email contact requested for dealer ${violation.dealer_id} about violation ${violationId}`);
            contactResult.message += contactResult.message ? "; Email contact requested" : "Email contact requested";
        }

        // Send SMS (if implemented)
        if (contact_method === "sms" || contact_method === "all") {
            // TODO: Implement SMS sending functionality
            logger.info(`📱 SMS contact requested for dealer ${violation.dealer_id} about violation ${violationId}`);
            contactResult.message += contactResult.message ? "; SMS contact requested" : "SMS contact requested";
        }

        // Update violation with contact information
        await SLAViolation.findByIdAndUpdate(violationId, {
            $push: {
                contact_history: {
                    contacted_at: new Date(),
                    contact_method,
                    custom_message,
                    success: contactResult.success,
                }
            }
        });

        const response = {
            violation: {
                _id: violation._id,
                dealer_id: violation.dealer_id,
                order_id: violation.order_id,
                violation_minutes: violation.violation_minutes,
                resolved: violation.resolved,
            },
            dealer: dealerDetails,
            order: {
                _id: order._id,
                order_number: order.order_number,
                total_amount: order.total_amount,
            },
            contactResult,
        };

        logger.info(`📞 Dealer contacted about SLA violation: ${violationId}`);
        sendSuccess(res, response, "Dealer contacted successfully about SLA violation");
    } catch (error) {
        logger.error(`❌ Contact dealer error: ${error.message}`);
        sendError(res, error.message || "Failed to contact dealer", 500);
    }
};

/**
 * Get SLA violations with dealer contact information
 */
exports.getSLAViolationsWithContactInfo = async (req, res) => {
    try {
        const { dealerId, startDate, endDate, resolved, contactStatus } = req.query;
        const filter = {};

        if (dealerId) filter.dealer_id = dealerId;
        if (startDate || endDate) {
            filter.created_at = {};
            if (startDate) filter.created_at.$gte = new Date(startDate);
            if (endDate) filter.created_at.$lte = new Date(endDate);
        }
        if (resolved !== undefined) filter.resolved = resolved === "true";

        let violations = await SLAViolation.find(filter)
            .populate("order_id", "order_number total_amount status")
            .sort({ created_at: -1 })
            .lean();

        // Enhance with dealer info and contact history
        violations = await Promise.all(
            violations.map(async (violation) => {
                const dealerInfo = await fetchDealerDetails(violation.dealer_id, req.headers.authorization);

                return {
                    ...violation,
                    dealerInfo,
                    contactHistory: violation.contact_history || [],
                    lastContacted: violation.contact_history && violation.contact_history.length > 0
                        ? violation.contact_history[violation.contact_history.length - 1].contacted_at
                        : null,
                };
            })
        );

        // Filter by contact status if specified
        if (contactStatus) {
            if (contactStatus === "contacted") {
                violations = violations.filter(v => v.contactHistory && v.contactHistory.length > 0);
            } else if (contactStatus === "not_contacted") {
                violations = violations.filter(v => !v.contactHistory || v.contactHistory.length === 0);
            }
        }

        sendSuccess(res, violations, "SLA violations with contact info fetched successfully");
    } catch (error) {
        logger.error("Get SLA violations with contact info failed:", error);
        sendError(res, "Failed to get SLA violations with contact info");
    }
};

/**
 * Bulk contact dealers about multiple SLA violations
 */
exports.bulkContactDealers = async (req, res) => {
    try {
        const { violationIds, contact_method = "notification", custom_message } = req.body;

        if (!violationIds || !Array.isArray(violationIds) || violationIds.length === 0) {
            return sendError(res, "violationIds array is required", 400);
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        for (const violationId of violationIds) {
            try {
                const violation = await SLAViolation.findById(violationId);
                if (!violation) {
                    results.push({
                        violationId,
                        success: false,
                        error: "Violation not found"
                    });
                    failureCount++;
                    continue;
                }

                // Get dealer details
                const dealerDetails = await fetchDealerDetails(violation.dealer_id, req.headers.authorization);
                if (!dealerDetails) {
                    results.push({
                        violationId,
                        success: false,
                        error: "Dealer not found"
                    });
                    failureCount++;
                    continue;
                }

                // Send notification
                const notificationSent = await sendDealerNotification(
                    violation.dealer_id,
                    violation,
                    req.headers.authorization
                );

                // Update violation with contact information
                await SLAViolation.findByIdAndUpdate(violationId, {
                    $push: {
                        contact_history: {
                            contacted_at: new Date(),
                            contact_method,
                            custom_message,
                            success: notificationSent,
                        }
                    }
                });

                results.push({
                    violationId,
                    success: notificationSent,
                    dealerId: violation.dealer_id,
                    dealerName: dealerDetails.dealer_name,
                    message: notificationSent ? "Contacted successfully" : "Failed to contact"
                });

                if (notificationSent) {
                    successCount++;
                } else {
                    failureCount++;
                }
            } catch (error) {
                results.push({
                    violationId,
                    success: false,
                    error: error.message
                });
                failureCount++;
            }
        }

        const response = {
            totalViolations: violationIds.length,
            successCount,
            failureCount,
            results,
        };

        logger.info(`📞 Bulk dealer contact completed: ${successCount} successful, ${failureCount} failed`);
        sendSuccess(res, response, "Bulk dealer contact completed");
    } catch (error) {
        logger.error(`❌ Bulk contact dealers error: ${error.message}`);
        sendError(res, error.message || "Failed to bulk contact dealers", 500);
    }
};

/**
 * Resolve SLA violation
 */
exports.resolveSLAViolation = async (req, res) => {
    try {
        const { violationId } = req.params;
        const { resolution_notes, resolved_by } = req.body;

        const violation = await SLAViolation.findById(violationId);
        if (!violation) {
            return sendError(res, "SLA violation not found", 404);
        }

        if (violation.resolved) {
            return sendError(res, "SLA violation is already resolved", 400);
        }

        // Update violation
        const updatedViolation = await SLAViolation.findByIdAndUpdate(
            violationId,
            {
                resolved: true,
                resolved_at: new Date(),
                resolution_notes: resolution_notes || `Resolved by ${resolved_by || 'system'}`,
                resolved_by: resolved_by,
            },
            { new: true }
        );

        // Update order status
        await Order.findByIdAndUpdate(violation.order_id, {
            "slaInfo.isSLAMet": true,
            "slaInfo.resolvedAt": new Date(),
            status: "Delivered", // or appropriate status
        });

        // Get enhanced violation details
        const dealerDetails = await fetchDealerDetails(violation.dealer_id, req.headers.authorization);
        const order = await Order.findById(violation.order_id);

        const response = {
            ...updatedViolation.toObject(),
            dealerDetails,
            orderDetails: {
                _id: order._id,
                order_number: order.order_number,
                total_amount: order.total_amount,
                status: order.status,
            },
        };

        logger.info(`✅ SLA violation resolved: ${violationId}`);
        sendSuccess(res, response, "SLA violation resolved successfully");
    } catch (error) {
        logger.error(`❌ Resolve SLA violation error: ${error.message}`);
        sendError(res, error.message || "Failed to resolve SLA violation", 500);
    }
};

/**
 * Get dealer SLA violation summary
 */
exports.getDealerViolationSummary = async (req, res) => {
    try {
        const { dealerId } = req.params;
        const { startDate, endDate } = req.query;

        const filter = { dealer_id: dealerId };
        if (startDate || endDate) {
            filter.created_at = {};
            if (startDate) filter.created_at.$gte = new Date(startDate);
            if (endDate) filter.created_at.$lte = new Date(endDate);
        }

        const violations = await SLAViolation.find(filter).lean();

        // Get dealer details
        const dealerDetails = await fetchDealerDetails(dealerId, req.headers.authorization);
        if (!dealerDetails) {
            return sendError(res, "Dealer not found", 404);
        }

        // Calculate summary statistics
        const totalViolations = violations.length;
        const resolvedViolations = violations.filter(v => v.resolved).length;
        const unresolvedViolations = totalViolations - resolvedViolations;
        const averageViolationMinutes = violations.length > 0
            ? Math.round(violations.reduce((sum, v) => sum + v.violation_minutes, 0) / violations.length)
            : 0;
        const maxViolationMinutes = violations.length > 0
            ? Math.max(...violations.map(v => v.violation_minutes))
            : 0;

        // Get recent violations
        const recentViolations = violations
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        const summary = {
            dealer: dealerDetails,
            statistics: {
                totalViolations,
                resolvedViolations,
                unresolvedViolations,
                averageViolationMinutes,
                maxViolationMinutes,
                resolutionRate: totalViolations > 0 ? (resolvedViolations / totalViolations * 100).toFixed(2) : 0,
            },
            recentViolations,
        };

        sendSuccess(res, summary, "Dealer SLA violation summary fetched successfully");
    } catch (error) {
        logger.error(`❌ Get dealer violation summary error: ${error.message}`);
        sendError(res, error.message || "Failed to get dealer violation summary", 500);
    }
};
