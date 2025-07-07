const mongoose = require("mongoose");

const modelSchema = new mongoose.Schema({
  model_name: {
    type: String,
    required: true,
    unique: true,
  },
  model_code: {
    type: String,
    required: true,
    unique: true,
  },
  brand_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
  },
  model_image: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: String,
  },
  updated_by: {
    type: String,
    // required: true,
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Pending", "Created", "Rejected"],
    default: "Created",
  },
});

module.exports = mongoose.model("Model", modelSchema);
