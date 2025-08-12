const mongoose = require("mongoose");
const type = require("./type");

const BannerSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", BannerSchema);
