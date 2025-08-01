const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  payment_id: String,
  payment_method: String,
  payment_status: String,
  amount: Number,
  created_at: Date,
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
