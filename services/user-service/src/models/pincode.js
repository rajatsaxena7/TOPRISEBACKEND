const mongoose = require("mongoose");

const pincodeSchema = new mongoose.Schema(
    {
        pincode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        district: {
            type: String,
            trim: true,
        },
        region: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            default: "India",
            trim: true,
        },
        is_serviceable: {
            type: Boolean,
            default: true,
        },
        delivery_zone: {
            type: String,
            enum: ["Zone-A", "Zone-B", "Zone-C", "Zone-D"],
            default: "Zone-A",
        },
        estimated_delivery_days: {
            type: Number,
            default: 7,
            min: 1,
        },
        additional_charges: {
            type: Number,
            default: 0,
            min: 0,
        },
        coordinates: {
            latitude: {
                type: Number,
            },
            longitude: {
                type: Number,
            },
        },
        created_by: {
            type: String,
        },
        updated_by: {
            type: String,
        },
        remarks: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for city and state
pincodeSchema.index({ city: 1, state: 1 });

// Text index for search functionality
pincodeSchema.index({ pincode: "text", city: "text", state: "text" });

module.exports = mongoose.model("Pincode", pincodeSchema);

