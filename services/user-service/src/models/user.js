const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    // required: true,
    // unique: true,
    trim: true,
  },
  username: {
    type: String,
    // required: true,
    // unique: true,
    trim: true,
  },
  bank_details:{
    account_number:{
      type: String,
    },
    ifsc_code:{
      type: String,
    },
    account_type:{
      type: String,
    },
    bank_account_holder_name:{
      type: String,
    },
    bank_name:{
      type: String,
    },
  },

  
  password: {
    type: String,
    // required: true,
    minLength: 6,
    select: false,
  },
  last_login: {
    type: Date,
    default: Date.now,
  },
  address: [
    {
      index: {
        type: Number,
        default: function () {
          // Auto-increment based on array length
          return this.parent().address.length;
        },
      },
      building_no: {
        String,
      },
      nick_name: {
        type: String,
      },
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      pincode: {
        type: String,
      },
      state: {
        type: String,
      },
    },
  ],
  phone_Number: {
    type: String,
  },
  role: {
    type: String,
    enum: [
      "Super-admin",
      "Fulfillment-Admin",
      "Fulfillment-Staff",
      "Inventory-Admin",
      "Inventory-Staff",
      "Dealer",
      "User",
      "Customer-Support",
    ],
    default: "User",
  },
  ticketsAssigned: [
    {
      type: String,
      required: false,
    },
  ],
  vehicle_details: [
    {
      brand: {
        type: String,
      },
      vehicle_type: {
        type: String,
        // required: true,
      },

      model: {
        type: String,
      },
      variant: {
        type: String,
      },
      year_Range: {
        type: String,
      },
      selected_vehicle: {
        type: Boolean,
        default: false,
      },
    },
  ],
  cartId: {
    type: String,
    default: null,
  },
  fcmToken: {
    type: String,
    default: null,
  },
  wishlistId: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model("User", userSchema);
