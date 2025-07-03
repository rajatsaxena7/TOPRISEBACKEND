const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema({
  brand_name: {
    type: String,
    required: true,
    unique: true,
  },
  brand_code: {
    type: String,
    required: true,
    unique: true,
  }, //internal use
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true,
  },
  brand_logo: {
    type: String,
    required: true,
  },
  preview_video: {
    type: String,
    // required: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "pending", "created", "rejected"],
    default: "active",
  },
});

module.exports = mongoose.model("Brand", brandSchema);
