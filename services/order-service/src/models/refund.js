const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    return_id: {
      type: String,
      required: false,
    },
    razorpay_refund_id: {
      type: String,
      required: false,
    },
    razorpay_payout_id: {
      type: String,
      required: false,
    },
    refund_type: {
      type: String,
      enum: ["Refund-Online", "Refund-COD"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reciept: {
      type: String,
      required: false,
    },
    entity: {
      type: String,
      required: false,
    },
    acquirer_data: {
      type: Object,
      default: {},
    },
    status: {
      type: String,
      required: false,
    },
    reason: {
      type: String,
      required: false,
    },

    currency: {
      type: String,
      required: false,
    },
    found_account_id: {
      type: String,
      required: false,
    },
    mode: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Refund", refundSchema);
