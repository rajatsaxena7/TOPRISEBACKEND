const mongoose = require("mongoose");

const DealerSLASchema = new mongoose.Schema({
  dealer_id: {
    type: String,
    index: true,
  },
  sla_type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SLAType",
    required: true,
  },
  dispatch_hours: {
    start: { type: Number, min: 0, max: 23, required: true },
    end: { type: Number, min: 0, max: 23, required: true },
  },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.DealerSLA || mongoose.model("DealerSLA", DealerSLASchema);
