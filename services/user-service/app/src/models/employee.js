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
  Last_name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Employee", employeeSchema);
