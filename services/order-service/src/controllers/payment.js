const Payment = require("../models/paymentModel");
const Order = require("../models/order");
const razorpayInstance = require("../utils/razorPayService");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const dealerAssignmentQueue = require("../queues/assignmentQueue");
const Cart = require("../models/cart");
const axios = require("axios");
const redisClient = require("/packages/utils/redisClient");
const {
    createUnicastOrMulticastNotificationUtilityFunction,
} = require("../../../../packages/utils/notificationService");

exports.createPayment = async (req, res) => {
    try {
        const { userId, amount, orderSource, orderType, customerDetails } = req.body;
        if (!userId || !amount) {
            logger.error("User ID and amount are required");
            return sendError(res, "User ID and amount are required", 400);
        }
        // Validate input
        let razorpayOrder;
        const orderOptions = {
            amount: Math.ceil(amount) * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
            notes: {
                user_id: userId,
                description: "payment using Online",
                orderSource: orderSource,
                orderType: orderType,
                customerDetails: JSON.stringify(customerDetails)
                //   cart_id:cart_id
            },
        };
        razorpayOrder = await razorpayInstance.orders.create(orderOptions);

        // Create a new payment record
        const payment = new Payment({
            order_id: null,
            payment_method: "Razorpay",
            razorpay_order_id: razorpayOrder.id,
            amount,
            created_at: new Date(),
            payment_status: "Created",
        });

        const savedPayment = await payment.save();

        logger.info("Payment created successfully", savedPayment);
        return sendSuccess(res, { payment: savedPayment, razorpayOrder, razorpayOrderId: razorpayOrder.id }, "Payment created successfully");


    } catch (error) {
        logger.error("Error creating payment:", error.message);
        return sendError(res, error);
    }
}


exports.checkPaymentStatus = async (req, res) => {
    const { razorpay_order_id } = req.body;

    try {
        // Check if payment exists
        const payment = await Payment.findOne({ razorpay_order_id: razorpay_order_id });
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }

        let orderDetails;
        // Check payment status
        const paymentStatus = await razorpayInstance.orders.fetch(razorpay_order_id);
        if (paymentStatus.status === 'paid') {
            // Fetch order details if payment is successful
            orderDetails = await Order.findOne({ payment_id: payment._id });
            if (!orderDetails) {
                return res.status(404).json({ error: "Order not found for the given payment" });
            }
        }
        // Update payment status
        payment.payment_status = paymentStatus.status;
        await payment.save();

        res.status(200).json({
            success: true,
            message: "Payment status checked",
            paymentStatus: paymentStatus.status,
            paymentDetails: paymentStatus,
            orderDetails: paymentStatus.status === 'paid' ? orderDetails : null
        });
    } catch (error) {
        console.error("Error checking payment status:", error);
        res.status(500).json({ error: "Unable to check payment status" });
    }
};

exports.verifyPayment = async (req, res) => {
    const signature = req.headers['x-razorpay-signature']; // Signature sent by Razorpay
    const secrete = process.env.RAZORPAY_WEBHOOK_KEY_DEV || "TOPRISEpaasdhahsjxa2bjshb12";
    const generated_signature = crypto.createHmac('sha256', secrete);
    generated_signature.update(JSON.stringify(req.body));
    const digested_signature = generated_signature.digest('hex');
    console.log("digested_signature", digested_signature);
    console.dir("req.body", req.body, { depth: null });
    if (digested_signature === signature) {
        console.log("req.body.event", req.body.event);
        if (req.body.event == "payment.captured") {
            console.log("Valid signature inside payment.captured", req.body);
            console.dir(req.body, { depth: null });
            console.log("Valid signature inside payment.captured", req.body.payload.payment.entity.notes.user_id);
            // Payment is valid
            const payment = await Payment.findOne({ razorpay_order_id: req.body.payload.payment.entity.order_id });
            if (!payment) {
                return res.status(200).json({ error: 'Payment not found' });
            }


            // Update payment details
            payment.payment_id = req.body.payload.payment.entity.id;
            payment.payment_status = 'paid';
            payment.payment_method = req.body.payload.payment.entity.method;
            payment.acquirer_data = req.body.payload.payment.entity.acquirer_data;
            await payment.save();
            const cart = await Cart.findOne({
                userId: req.body.payload.payment.entity.notes.user_id,
            });
            const SKU = cart.items.map((item) => ({
                sku: item.sku,
                quantity: item.quantity,
                productId: item.productId,
                productName: item.product_name,
                selling_price: item.selling_price,
            }));
            const orderId = `ORD-${Date.now()}-${uuidv4().slice(0, 8)}`;
            const orderPayload = {
                orderId,
                orderSource: req.body.payload.payment.entity.notes.orderSource,
                orderType: req.body.payload.payment.entity.notes.orderType,
                order_Amount: req.body.payload.payment.entity.amount / 100,
                paymentType: "Prepaid",
                orderDate: new Date(),
                status: "Confirmed",
                timestamps: { createdAt: new Date() },
                // ensure skus have uppercase SKU and empty dealerMapping slots
                skus: SKU.map((s) => ({
                    sku: String(s.sku).toUpperCase().trim(),
                    quantity: s.quantity,
                    productId: s.productId,
                    productName: s.productName,
                    selling_price: s.selling_price,
                    dealerMapped: [], // will be populated by the worker
                })),
                dealerMapping: [], // populated by the worker
                customerDetails: JSON.parse(req.body.payload.payment.entity.notes.customerDetails),
                payment_id: payment._id, // link payment to order
            };
            const newOrder = await Order.create(orderPayload);
            payment.order_id = newOrder._id; // link payment to order
            await payment.save();
            await dealerAssignmentQueue.add(
                { orderId: newOrder._id.toString() },
                {
                    attempts: 5,
                    backoff: { type: "exponential", delay: 1000 },
                    removeOnComplete: true,
                    removeOnFail: false,
                }
            );
            logger.info(`✅ Order created with ID: ${newOrder._id}`);
            //  push Notification


            if (!cart) {
                logger.error(
                    `❌ Cart not found for user: ${req.body.payload.payment.entity.notes.user_id}`
                );
            } else {
                cart.items = [];
                cart.totalPrice = 0;
                cart.itemTotal = 0;
                cart.handlingCharge = 0;
                cart.deliveryCharge = 0;
                cart.gst_amount = 0;
                cart.total_mrp = 0;
                cart.total_mrp_gst_amount = 0;
                cart.total_mrp_with_gst = 0;
                cart.grandTotal = 0;
                await cart.save();
                logger.info(
                    `✅ Cart cleared for user: ${req.body.payload.payment.entity.notes.user_id}`
                );
            }
            let tokenDummy;
            // const successData =
            //     await createUnicastOrMulticastNotificationUtilityFunction(
            //         [req.body.payload.payment.entity.notes.user_id],
            //         ["INAPP", "PUSH"],
            //         "Order Placed",
            //         `Order Placed Successfully with order id ${orderId}`,
            //         "",
            //         "",
            //         "Order",
            //         {
            //             order_id: newOrder._id
            //         },
            //         tokenDummy
            //     );
            // if (!successData.success) {
            //     console.log(successData);
            //     logger.error("❌ Create notification error:", successData.message);
            // } else {
            //     logger.info(
            //         "✅ Notification created successfully",
            //         successData.message
            //     );
            // }
        } else if (req.body.event == "payment.failed") {
            console.log("Valid signature inside payment.failed", req.body);
            console.dir(req.body, { depth: null });
            const payment = await Payment.findOne({ razorpay_order_id: req.body.payload.payment.entity.order_id });
            if (!payment) {
                return res.status(200).json({ error: 'Payment not found' });
            }
            // Update payment details
            payment.status = 'failed';
            await payment.save();
        }

    } else {
        console.log("Invalid signature");
    }

    res.json({ status: "ok" });
}

exports.getPaymentDetails = async (req, res) => {
    try {


        const paymentDetails = await Payment.find().populate('order_id').sort({ created_at: -1 });

        if (!paymentDetails) {
            logger.error("No payment details found");
            return sendError(res, "No payment details found", 404);
        }

        return sendSuccess(res, paymentDetails, "Payment details retrieved successfully");
    } catch (error) {
        logger.error("Error fetching payment details:", error.message);
        return sendError(res, error);
    }
}

exports.getPaymentById = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await Payment.findById(paymentId).populate('order_id');

        if (!payment) {
            logger.error("Payment not found");
            return sendError(res, "Payment not found", 404);
        }

        return sendSuccess(res, payment, "Payment details retrieved successfully");
    } catch (error) {
        logger.error("Error fetching payment details:", error.message);
        return sendError(res, error);
    }
}

exports.getPaymentByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;

        const payment = await Payment.find({ order_id: orderId }).populate('order_id');

        if (!payment) {
            logger.error("Payment not found for the given order ID");
            return sendError(res, "Payment not found for the given order ID", 404);
        }

        return sendSuccess(res, payment, "Payment details retrieved successfully");
    } catch (error) {
        logger.error("Error fetching payment details:", error.message);
        return sendError(res, error);
    }
}






