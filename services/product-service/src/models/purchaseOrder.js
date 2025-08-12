const mongoose = require("mongoose");

const PurchaseOrderSchema = new mongoose.Schema(
  {
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
      enum: ["Pending", "Approved", "Rejected"],
      default: "pending",
    },
    user_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseOrder", PurchaseOrderSchema);
