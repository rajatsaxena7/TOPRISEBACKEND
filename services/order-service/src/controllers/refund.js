const axios = require("axios");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const razorpayInstance = require("../utils/razorPayService");
const Refund = require("../models/refund");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const Order = require("../models/order");
const Payment = require("../models/paymentModel");
const ReturnModel = require("../models/return");

exports.createPayout = async (req, res) => {
  try {
    const { returnId, reason = "refund approved", mode } = req.body;

    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_je9PPHh0HQqIFX";
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || "tdB9zkAvQLdYVRKgtOWNfIhZ";

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const returnData = await ReturnModel.findById(returnId);
    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }
    const orderId = returnData.orderId;
    const amount = returnData.refund.refundAmount;
    const order = await Order.findById(orderId).populate("payment_id");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    const payment = await Payment.findById(order.payment_id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const userData = await axios.get(
      `http://user-service:5001/api/users/${returnData.customerId}`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );

    // ==============================
    // STEP 1: Create Contact
    // ==============================
    const contactResp = await axios.post(
      "https://api.razorpay.com/v1/contacts",
      {
        name: userData.data.bank_details.bank_account_holder_name,
        email: userData.data.email,
        contact: userData.data.phone_Number,
        type: "customer", // vendor | employee | customer | self
        reference_id: `ref_${Date.now()}`,
        notes: { purpose: "Payout Contact" },
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    const contactId = contactResp.data.id;

    // ==============================
    // STEP 2: Create Fund Account (Bank Account)
    // ==============================
    const fundResp = await axios.post(
      "https://api.razorpay.com/v1/fund_accounts",
      {
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
          name: userData.data.bank_details.bank_account_holder_name,
          ifsc: userData.data.bank_details.ifsc_code,
          account_number: userData.data.bank_details.bank_account_number,
        },
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    const fundAccountId = fundResp.data.id;

    // ==============================
    // STEP 3: Make the Payout
    // ==============================

    const notes = {
      order_id: orderId,
      return_id: returnId,
    };

    const payoutResp = await axios.post(
      "https://api.razorpay.com/v1/payouts",
      {
        account_number: RAZORPAYX_ACCOUNT_NUMBER || "rzp_test_je9PPHh0HQqIFX", // your RazorpayX identifier
        fund_account_id: fundAccountId,
        amount: amount * 100, // in paise
        currency: "INR",
        mode: mode, // NEFT | RTGS | IMPS | UPI
        purpose: "payout",
        queue_if_low_balance: true,
        narration: narration || "Payout Transfer",
        reference_id: `payout_${Date.now()}`,
        notes: notes,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "X-Payout-Idempotency": `payout_${Date.now()}`,
        },
      }
    );

    const refundRecord = new Refund({
      order_id: orderId,
      razorpay_payout_id: payoutResp.data.id,
      amount: amount,
      currency: payoutResp.data.currency,
      status: payoutResp.data.status,
      entity: payoutResp.data.entity,
      refund_type: "Refund-COD",
      currency: payoutResp.data.currency,
      receipt: payoutResp.data.reference_id,
      reason: reason,
      mode: mode,
    });

    const savedRefund = await refundRecord.save();
    returnData.refund.refund_id = savedRefund._id;
    await returnData.save();

    return res.status(200).json({
      success: true,
      message: "Payout created successfully",
      data: payoutResp.data,
    });
  } catch (error) {
    console.error("Payout Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Error while creating payout",
      error: error.response?.data || error.message,
    });
  }
};

exports.createPartialRefund = async (req, res) => {
  try {
    const { returnId, reason = "refund approved" } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_je9PPHh0HQqIFX";
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || "tdB9zkAvQLdYVRKgtOWNfIhZ";

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const returnData = await ReturnModel.findById(returnId);
    if (!returnData) {
      return res.status(404).json({
        success: false,
        message: "Return not found",
      });
    }
    const orderId = returnData.orderId;
    const amount = returnData.refund.refundAmount;
    const order = await Order.findById(orderId).populate("payment_id");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const payment = await Payment.findById(order.payment_id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }
    const paymentId = payment.payment_id;
    const notes = {
      order_id: orderId,
      return_id: returnId,
    };
    const paymentDetailsResponse = await axios.get(
      `https://api.razorpay.com/v1/payments/${paymentId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth.trim()}`,
        },
      }
    );

    const paymentDetails = paymentDetailsResponse.data;
    const capturedAmount = paymentDetails.amount; 
    const alreadyRefunded = paymentDetails.amount_refunded || 0; 
    const requestedRefundAmount = amount ;
    const refundableBalance = capturedAmount - alreadyRefunded;

    if (requestedRefundAmount > refundableBalance) {
      return res.status(400).json({
        success: false,
        message: "Refund amount exceeds available balance",
        available_balance: refundableBalance / 100, 
        attempted_refund: requestedRefundAmount / 100,
      });
    }

    const requestData = {
      amount: amount * 100,
      speed: "optimum",
      notes: notes,
    };

    requestData.receipt = `receipt_${Date.now()}`;
    const response = await axios.post(
      `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
      requestData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth.trim()}`,
        },
      }
    );

    if (response.data.status === "failed") {
      return res.status(400).json({
        success: false,
        message: "Partial refund failed",
        error: response.data.error,
      });
    }

    const refundRecord = new Refund({
      order_id: orderId,
      razorpay_refund_id: response.data.id,
      amount: amount,
      currency: response.data.currency,
      status: response.data.status,
      entity: response.data.entity,
      refund_type: "Refund-Online",
      currency: response.data.currency,
      receipt: response.data.receipt,
      reason: reason,
    });

    const savedRefund = await refundRecord.save();
    order.refund_id = savedRefund._id;
    await order.save();
    returnData.refund.refund_id = savedRefund._id;
    await returnData.save();
    res.json({
      success: true,
      message: "Partial refund initiated successfully",
      refund: response.data,
      record: refundRecord,
    });
  } catch (error) {
    console.error("Partial refund error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find();
    res.json({
      success: true,
      message: "All refunds fetched successfully",
      refunds,
    });
  } catch (error) {
    console.error("Error fetching refunds:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getRefundById = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.refundId);
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }
    res.json({
      success: true,
      message: "Refund fetched successfully",
      refund,
    });
  } catch (error) {
    console.error("Error fetching refund:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
