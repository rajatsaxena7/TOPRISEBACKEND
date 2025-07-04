const mongoose = require("mongoose");

const typeSchema = new mongoose.Schema({
  type_name: {
    type: String,
    required: true,
    unique: true,
  },
  type_code: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
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
  },
});

module.exports = mongoose.model("Type", typeSchema);
