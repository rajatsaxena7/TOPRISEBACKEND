const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');
const { authenticate, authorizeRoles } = require('/packages/utils/authMiddleware');

router.post('/',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'User'),
    paymentController.createPayment
);

router.post('/webhook',
    paymentController.verifyPayment
);

router.post("/checkStatus",
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'User'),
    paymentController.checkPaymentStatus
);

router.get('/all',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'User'),
    paymentController.getPaymentDetails
);

router.get('/by-id/:paymentId',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'User'),
    paymentController.getPaymentById
);
router.get('/by-order-id/:orderId',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'User'),
    paymentController.getPaymentByOrderId
);

router.get('/search',
    authenticate,
    authorizeRoles('Super-admin', 'Fulfillment-Admin', 'User'),
    paymentController.searchPaymentsWithOrderDetails
);

module.exports = router;