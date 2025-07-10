const { JsonWebTokenError } = require("jsonwebtoken");
const mongoose = require("mongoose");

const productLogSchema = new mongoose.Schema({
  job_type: {
    type: String,
    enum: [
      "Update",
      "Edit",
      "Added",
      "Bulk-Upload",
      "Single-Upload",
      "Bulk-Modified",
      "Stock-Sweep",
    ],

    required: true,
  },
  product_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: String,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  changed_fields: {
    type: Array,
    default: [],
  },
  changed_value: [
    {
      field: {
        type: String,
      },
      old_value: {
        type: String,
      },
      new_value: {
        type: String,
      },
    },
  ],
  meta: { type: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model("ProductLogs", productLogSchema);
