const express = require("express");
const router = express.Router();
const SLAViolationManagementController = require("../controllers/slaViolationManagement");
const { authenticate, authorizeRoles } = require("/packages/utils/auth");
const auditMiddleware = require("../middleware/auditLogger");

/**
 * @route POST /api/sla-violations/manual
 * @desc Create a manual SLA violation for a dealer
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.post(
    "/manual",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("MANUAL_SLA_VIOLATION_CREATED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationManagementController.createManualSLAViolation
);

/**
 * @route POST /api/sla-violations/:violationId/contact-dealer
 * @desc Contact dealer about a specific SLA violation
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.post(
    "/:violationId/contact-dealer",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("DEALER_CONTACTED_ABOUT_VIOLATION", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationManagementController.contactDealerAboutViolation
);

/**
 * @route POST /api/sla-violations/bulk-contact
 * @desc Bulk contact dealers about multiple SLA violations
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.post(
    "/bulk-contact",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("BULK_DEALER_CONTACT_ATTEMPTED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationManagementController.bulkContactDealers
);

/**
 * @route GET /api/sla-violations/with-contact-info
 * @desc Get SLA violations with dealer contact information
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/with-contact-info",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("SLA_VIOLATIONS_WITH_CONTACT_INFO_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationManagementController.getSLAViolationsWithContactInfo
);

/**
 * @route PUT /api/sla-violations/:violationId/resolve
 * @desc Resolve an SLA violation
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.put(
    "/:violationId/resolve",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("SLA_VIOLATION_RESOLUTION_ATTEMPTED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationManagementController.resolveSLAViolation
);

/**
 * @route GET /api/sla-violations/dealer/:dealerId/summary
 * @desc Get dealer SLA violation summary with statistics
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/dealer/:dealerId/summary",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("DEALER_VIOLATION_SUMMARY_ACCESSED", "SLAViolation", "SLA_MANAGEMENT"),
    SLAViolationManagementController.getDealerViolationSummary
);

/**
 * @route GET /api/sla-violations/dashboard
 * @desc Get SLA violation management dashboard data
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/dashboard",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("SLA_VIOLATION_DASHBOARD_ACCESSED", "System", "SLA_MANAGEMENT"),
    async (req, res) => {
        try {
            // Get various SLA violation statistics for dashboard
            const [
                totalViolations,
                unresolvedViolations,
                violationsWithContactInfo,
                dealerSummary
            ] = await Promise.all([
                SLAViolationManagementController.getSLAViolationsWithContactInfo(req, res),
                // Add more dashboard data as needed
            ]);

            const dashboardData = {
                totalViolations: totalViolations?.data?.length || 0,
                unresolvedViolations: unresolvedViolations?.data?.filter(v => !v.resolved)?.length || 0,
                contactedViolations: violationsWithContactInfo?.data?.filter(v => v.contactHistory?.length > 0)?.length || 0,
                notContactedViolations: violationsWithContactInfo?.data?.filter(v => !v.contactHistory || v.contactHistory.length === 0)?.length || 0,
                // Add more dashboard metrics as needed
            };

            res.json({
                success: true,
                data: dashboardData,
                message: "SLA violation dashboard data fetched successfully"
            });
        } catch (error) {
            console.error("SLA violation dashboard error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch SLA violation dashboard data"
            });
        }
    }
);

/**
 * @route GET /api/sla-violations/analytics
 * @desc Get SLA violation analytics and insights
 * @access Private (Admin, Super-admin, Customer-Support)
 */
router.get(
    "/analytics",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support"
    ),
    auditMiddleware("SLA_VIOLATION_ANALYTICS_ACCESSED", "System", "SLA_MANAGEMENT"),
    async (req, res) => {
        try {
            const { startDate, endDate, dealerId } = req.query;

            // Create a mock request object for the controller
            const mockReq = {
                ...req,
                query: { startDate, endDate, dealerId }
            };

            const violations = await SLAViolationManagementController.getSLAViolationsWithContactInfo(mockReq, res);

            if (!violations || !violations.data) {
                return res.status(500).json({
                    success: false,
                    error: "Failed to fetch violations for analytics"
                });
            }

            const analytics = {
                totalViolations: violations.data.length,
                resolvedViolations: violations.data.filter(v => v.resolved).length,
                unresolvedViolations: violations.data.filter(v => !v.resolved).length,
                contactedViolations: violations.data.filter(v => v.contactHistory?.length > 0).length,
                averageViolationMinutes: violations.data.length > 0
                    ? Math.round(violations.data.reduce((sum, v) => sum + v.violation_minutes, 0) / violations.data.length)
                    : 0,
                maxViolationMinutes: violations.data.length > 0
                    ? Math.max(...violations.data.map(v => v.violation_minutes))
                    : 0,
                resolutionRate: violations.data.length > 0
                    ? (violations.data.filter(v => v.resolved).length / violations.data.length * 100).toFixed(2)
                    : 0,
                contactRate: violations.data.length > 0
                    ? (violations.data.filter(v => v.contactHistory?.length > 0).length / violations.data.length * 100).toFixed(2)
                    : 0,
            };

            res.json({
                success: true,
                data: analytics,
                message: "SLA violation analytics fetched successfully"
            });
        } catch (error) {
            console.error("SLA violation analytics error:", error);
            res.status(500).json({
                success: false,
                error: "Failed to fetch SLA violation analytics"
            });
        }
    }
);

module.exports = router;
