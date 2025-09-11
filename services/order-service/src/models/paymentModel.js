const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  razorpay_order_id: String,
  payment_method: String,
  payment_status: String,
  amount: Number,
  payment_id: String,
  created_at: Date,
  acquirer_data: {
    type: Object,
    default: {},
  },
  is_refund: {
    type: Boolean,
    default: false,
  },
  refund_id: String,
  refund_status: String,

  refund_successful: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
