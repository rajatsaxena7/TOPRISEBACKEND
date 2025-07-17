const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  dealerId: {
    type: String,
    // required: true,
    unique: true,
  },
  legal_name: {
    type: String,
    required: true,
  },
  trade_name: {
    type: String,
    required: true,
  },
  GSTIN: {
    type: String,
    required: true,
    unique: true,
    maxLength: 15,
  },
  Pan: {
    type: String,
    required: true,
    unique: true,
    maxLength: 15,
  },
  Address: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  contact_person: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
      required: true,
    },
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  categories_allowed: [
    {
      type: String,
    },
  ],
  upload_access_enabled: {
    type: Boolean,
    default: false,
  },
  default_margin: {
    type: Number,
    default: 0,
  },
  last_fulfillment_date: {
    type: Date,
  },
  assigned_Toprise_employee: [
    {
      assigned_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      assigned_at: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["Active", "Removed", "Updated"],
        default: "Active",
      },
    },
  ],
  SLA_type: {
    type: String,
    enum: ["Standard", "Priority", "Limited"],
    default: "1",
  },
  SLA_max_dispatch_time: {
    type: Number,
    default: 0,
  },
  onboarding_date: {
    type: Date,
    default: Date.now,
  },
  remarks: {
    type: String,
  },
});

module.exports = mongoose.model("Dealer", dealerSchema);
