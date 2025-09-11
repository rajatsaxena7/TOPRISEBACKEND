const mongoose = require("mongoose");

const SLATypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Standard", "Express", "Premium"
  description: String,
  expected_hours: { type: Number, required: true }, // Expected fulfillment time in hours
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.SLAType || mongoose.model("SLAType", SLATypeSchema);
