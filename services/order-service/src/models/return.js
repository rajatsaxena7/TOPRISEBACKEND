const mongoose = require("mongoose");

const ReturnSchema = new mongoose.Schema({
  OrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  returnReason: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  returnStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  returnAmount: {
    type: Number,
    required: true,
  },
  returnDateInitiated: {
    type: Date,
    default: Date.now,
  },
  ActionTaken: {
    type: String,
    enum: ["Refund", "Replacement", "Exchange", "Rejected"],
    default: "Refund",
  },
  returnDetails: {
    reason: String,
    description: String,
    images: [String], // Array of image URLs for the return request
  },
  timestamps: {
    createdAt: Date,
    updatedAt: Date,
  },
});

module.exports = mongoose.model("Return", ReturnSchema);
