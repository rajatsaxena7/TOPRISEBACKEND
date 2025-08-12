const mongoose = require("mongoose");

const popularVehicleSchema = new mongoose.Schema(
  {
    vehicle_name: {
      type: String,
      required: true,
      unique: true,
    },
    vehicle_image: {
      type: String,
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    model_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
    },
    vehicle_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PopularVehicle", popularVehicleSchema);