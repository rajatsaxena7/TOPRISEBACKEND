const mongoose = require("mongoose");

const productBulkSessionSchema = new mongoose.Schema({
  sessionTime: Date,
  sessionId: String,
  status: {
    type: String,
    enum: ["Pending", "Completed", "Failed"],
    default: "Pending",
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
  created_by_role: {
    type: String,
  },
  requires_approval: {
    type: Boolean,
    default: false,
  },
  no_of_products: {
    type: Number,
  },
  total_products_successful: {
    type: Number,
  },
  total_products_failed: {
    type: Number,
  },
  logs: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: false,
      },
      message: {
        type: String,
      },
    },
  ],
});

module.exports = mongoose.model("ProductBulkSession", productBulkSessionSchema);
