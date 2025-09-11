const mongoose = require("mongoose");

const SLAViolationSchema = new mongoose.Schema({
  dealer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dealer",
    required: true,
    index: true,
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },
  expected_fulfillment_time: { type: Date, required: true },
  actual_fulfillment_time: { type: Date, required: true },
  violation_minutes: { type: Number, required: true },
  resolved: { type: Boolean, default: false },
  notes: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.SLAViolation || mongoose.model("SLAViolation", SLAViolationSchema);
