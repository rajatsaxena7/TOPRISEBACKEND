const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  image: {
    web: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    tablet: {
      type: String,
      required: true,
      trim: true,
    },
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true,
  },
  vehicle_type: {
    type: String,
    required: true,
    enum: ["four_wheeler", "two_wheeler"],
  },
  is_active: {
    type: Boolean,
    default: false,
  },
},{ timestamps: true });

module.exports = mongoose.model("Banner", BannerSchema);
