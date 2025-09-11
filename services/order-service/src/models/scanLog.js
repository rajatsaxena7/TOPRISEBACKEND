const mongoose = require("mongoose");

const ScanLogSchema = new mongoose.Schema({
  scan_log_id: String,
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  dealer_id: String,
  staff_id: String,
  sku: String,
  result: String,
  timeStamp: Date,
  device_info: String,
});

module.exports = mongoose.models.ScanLog || mongoose.model("ScanLog", ScanLogSchema);
