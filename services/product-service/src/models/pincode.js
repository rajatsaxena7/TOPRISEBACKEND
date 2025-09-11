const mongoose = require("mongoose");

const pincodeSchema = new mongoose.Schema({
    pincode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                // Indian pincode validation (6 digits)
                return /^[1-9][0-9]{5}$/.test(v);
            },
            message: 'Pincode must be a valid 6-digit Indian pincode'
        }
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    district: {
        type: String,
        required: true,
        trim: true
    },
    area: {
        type: String,
        trim: true
    },
    delivery_available: {
        type: Boolean,
        default: true
    },
    delivery_charges: {
        type: Number,
        default: 0,
        min: 0
    },
    estimated_delivery_days: {
        type: Number,
        default: 3,
        min: 1
    },
    cod_available: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        default: "active"
    },
    created_by: {
        type: String,
        required: true
    },
    updated_by: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
pincodeSchema.index({ pincode: 1 });
pincodeSchema.index({ city: 1 });
pincodeSchema.index({ state: 1 });
pincodeSchema.index({ delivery_available: 1 });
pincodeSchema.index({ status: 1 });

// Update the updated_at field before saving
pincodeSchema.pre('save', function (next) {
    this.updated_at = new Date();
    next();
});

// Update the updated_at field before updating
pincodeSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
});

module.exports = mongoose.model("Pincode", pincodeSchema);
