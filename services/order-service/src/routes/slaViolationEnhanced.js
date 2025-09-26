const express = require("express");
const router = express.Router();
const SLAViolationEnhancedController = require("../controllers/slaViolationEnhanced");
const { authenticate, authorizeRoles } = require("/packages/utils/auth");
const auditMiddleware = require("../middleware/auditLogger");

/**
 * @route GET /api/sla-violations/enhanced
 * @desc Get SLA violations with comprehensive populated data (dealer details, order details)
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_SLA_VIOLATIONS_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationEnhancedController.getSLAViolationsWithPopulatedData
);

/**
 * @route GET /api/sla-violations/enhanced/:violationId
 * @desc Get single SLA violation with comprehensive populated data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced/:violationId",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_SLA_VIOLATION_DETAILS_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationEnhancedController.getSLAViolationByIdWithPopulatedData
);

/**
 * @route GET /api/sla-violations/enhanced/dealer/:dealerId
 * @desc Get SLA violations by dealer with comprehensive populated data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced/dealer/:dealerId",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_DEALER_SLA_VIOLATIONS_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationEnhancedController.getSLAViolationsByDealerWithPopulatedData
);

/**
 * @route GET /api/sla-violations/enhanced/order/:orderId
 * @desc Get SLA violations by order with comprehensive populated data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced/order/:orderId",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_ORDER_SLA_VIOLATIONS_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationEnhancedController.getSLAViolationsByOrderWithPopulatedData
);

/**
 * @route GET /api/sla-violations/enhanced/analytics
 * @desc Get SLA violation analytics with comprehensive data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced/analytics",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_SLA_VIOLATION_ANALYTICS_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationEnhancedController.getSLAViolationAnalytics
);

/**
 * @route GET /api/sla-violations/enhanced/search
 * @desc Search SLA violations with comprehensive populated data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced/search",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_SLA_VIOLATION_SEARCH_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationEnhancedController.searchSLAViolations
);

/**
 * @route GET /api/sla-violations/enhanced/dashboard
 * @desc Get SLA violation dashboard with comprehensive data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced/dashboard",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_SLA_VIOLATION_DASHBOARD_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    async (req, res) => {
        try {
            const { startDate, endDate, dealerId } = req.query;

            // Create mock request objects for different analytics
            const mockReq = {
                ...req,
                query: { startDate, endDate, dealerId, limit: 10, page: 1 }
            };

            // Get various dashboard data
            const [
                recentViolations,
                analytics,
                topViolators
            ] = await Promise.all([
                SLAViolationEnhancedController.getSLAViolationsWithPopulatedData(mockReq, res),
                SLAViolationEnhancedController.getSLAViolationAnalytics(mockReq, res),
                // Get top violating dealers from analytics
            ]);

            const dashboardData = {
                summary: {
                    totalViolations: analytics?.data?.summary?.totalViolations || 0,
                    unresolvedViolations: analytics?.data?.summary?.unresolvedViolations || 0,
                    resolutionRate: analytics?.data?.summary?.resolutionRate || 0,
                    averageViolationMinutes: analytics?.data?.summary?.averageViolationMinutes || 0
                },
                recentViolations: recentViolations?.data?.violations || [],
                topViolatingDealers: analytics?.data?.topViolatingDealers || [],
                priorityBreakdown: analytics?.data?.byPriority || {},
                statusBreakdown: analytics?.data?.byStatus || {},
                trends: {
                    // Add trend data if needed
                }
            };

            res.json({
                success: true,
                data: dashboardData,
                message: "Enhanced SLA violation dashboard data fetched successfully"
            });
        } catch (error) {
            console.error("Enhanced SLA violation dashboard error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch enhanced SLA violation dashboard data"
            });
        }
    }
);

/**
 * @route GET /api/sla-violations/enhanced/export
 * @desc Export SLA violations with comprehensive data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/enhanced/export",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("ENHANCED_SLA_VIOLATIONS_EXPORTED", "SLAViolation", "SLA_MANAGEMENT"),
    async (req, res) => {
        try {
            const {
                startDate,
                endDate,
                dealerId,
                resolved,
                format = 'json' // json, csv
            } = req.query;

            // Create mock request for getting all violations
            const mockReq = {
                ...req,
                query: {
                    startDate,
                    endDate,
                    dealerId,
                    resolved,
                    limit: 10000, // Large limit for export
                    page: 1
                }
            };

            const violationsResponse = await SLAViolationEnhancedController.getSLAViolationsWithPopulatedData(mockReq, res);

            if (!violationsResponse || !violationsResponse.data) {
                return res.status(500).json({
                    success: false,
                    error: "Failed to fetch violations for export"
                });
            }

            const violations = violationsResponse.data.violations;

            if (format === 'csv') {
                // Convert to CSV format
                const csvHeaders = [
                    'Violation ID',
                    'Dealer Name',
                    'Dealer Code',
                    'Order Number',
                    'Order Status',
                    'Violation Minutes',
                    'Violation Hours',
                    'Priority',
                    'Status',
                    'Created At',
                    'Resolved At',
                    'Resolution Notes',
                    'Contact Count',
                    'Last Contacted'
                ];

                const csvRows = violations.map(violation => [
                    violation._id,
                    violation.dealerDetails?.dealer_name || 'N/A',
                    violation.dealerDetails?.dealer_code || 'N/A',
                    violation.orderDetails?.order_number || 'N/A',
                    violation.orderDetails?.status || 'N/A',
                    violation.violation_minutes,
                    violation.violation_hours,
                    violation.priority,
                    violation.status,
                    violation.created_at,
                    violation.resolved_at || 'N/A',
                    violation.resolution_notes || 'N/A',
                    violation.contactCount,
                    violation.lastContacted || 'N/A'
                ]);

                const csvContent = [csvHeaders, ...csvRows]
                    .map(row => row.map(field => `"${field}"`).join(','))
                    .join('\n');

                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename="sla_violations_export.csv"');
                res.send(csvContent);
            } else {
                // Return JSON format
                res.json({
                    success: true,
                    data: {
                        violations,
                        exportInfo: {
                            totalRecords: violations.length,
                            exportedAt: new Date().toISOString(),
                            filters: {
                                startDate,
                                endDate,
                                dealerId,
                                resolved
                            }
                        }
                    },
                    message: "SLA violations exported successfully"
                });
            }
        } catch (error) {
            console.error("Enhanced SLA violations export error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to export SLA violations"
            });
        }
    }
);

module.exports = router;
