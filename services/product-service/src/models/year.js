const mongoose = require("mongoose");

const yearSchema = new mongoose.Schema({
  year_name: {
    type: String,
    required: true,
    unique: true,
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

module.exports = mongoose.model("Year", yearSchema);
