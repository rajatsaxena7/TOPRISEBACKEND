const mongoose = require("mongoose");

const contactFormSchema = new mongoose.Schema({
  enquiry_name: {
    type: String,
    required: true,
  },
  enquiry_email: {
    type: String,
  },
  enquiry_phone: {
    type: String,
  },
  enquiry_message: {
    type: String,
  },
  enquiry_date: {
    type: Date,
    default: Date.now,
  },
  enquiry_status: {
    type: String,
    default: "Pending",
  },
});

module.exports = mongoose.model("ContactForm", contactFormSchema);
