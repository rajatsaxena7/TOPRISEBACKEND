const mongoose = require("mongoose");

const manufacturerSchema = new mongoose.Schema({
  manufacturer_name: {
    type: String,
    required: true,
    unique: true,
  },
  manufacturer_code: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "pending", "created", "rejected"],
    default: "active",
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
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updated_by: [
    {
      userRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      updated_at: {
        type: Date,
        default: Date.now,
      },
      changes: {
        type: String,
      },
    },
  ],
});

module.exports = mongoose.model("Manufacturer", manufacturerSchema);
