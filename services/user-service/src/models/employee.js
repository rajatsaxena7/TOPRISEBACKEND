const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  employee_id: {
    type: String,
    unique: true,
    required: true,
  },
  First_name: {
    type: String,
    required: true,
  },
  profile_image: {
    type: String,
  },
  mobile_number: {
    type: String,
  },
  email: {
    type: String,
  },
  role: {
    type: String,
  },
  assigned_dealers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealer",
    },
  ],
  assigned_regions: [
    {
      type: String,
    },
  ],
  last_login: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Employee", employeeSchema);
