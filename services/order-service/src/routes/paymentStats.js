const express = require('express');
const router = express.Router();
const paymentStatsController = require('../controllers/paymentStats');
const { authenticate, authorizeRoles } = require('/packages/utils/authMiddleware');

// Get comprehensive payment statistics
router.get('/',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'Inventory-Admin', 'Customer-Support'),
    paymentStatsController.getPaymentStats
);

// Get payment statistics for specific time periods
router.get('/period',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'Inventory-Admin', 'Customer-Support'),
    paymentStatsController.getPaymentStatsByPeriod
);

// Get payment statistics summary for dashboard cards
router.get('/summary',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'Inventory-Admin', 'Customer-Support'),
    paymentStatsController.getPaymentStatsSummary
);

module.exports = router;
