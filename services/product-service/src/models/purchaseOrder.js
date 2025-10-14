const mongoose = require("mongoose");

const PurchaseOrderSchema = new mongoose.Schema(
  {
    purchase_order_number: {
      type: String,
      unique: true,
      sparse: true,
    },
    req_files: [
      {
        type: String,
        required: true,
      },
    ],
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "In-Review", "Cancelled"],
      default: "Pending",
    },
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    reviewed_by: {
      type: String,
    },
    reviewed_at: {
      type: Date,
    },
    admin_notes: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    estimated_value: {
      type: Number,
      default: 0,
    },
    vendor_details: {
      name: String,
      contact: String,
      email: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
PurchaseOrderSchema.index({ status: 1, createdAt: -1 });
PurchaseOrderSchema.index({ user_id: 1, status: 1 });

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
