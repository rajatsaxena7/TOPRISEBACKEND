const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    select: false,
  },
  address: [
    {
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
    ],
    default: "User",
  },
  vehicle_details: [
    {
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
});

module.exports = mongoose.model("User", userSchema);
