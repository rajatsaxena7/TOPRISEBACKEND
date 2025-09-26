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
                ref: "Employee",
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
        default: "1",
    },
    dispatch_hours: {
        start: {
            type: Number,
            min: 0,
            max: 23,
        },
        end: {
            type: Number,
            min: 0,
            max: 23,
        },
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
    // Additional fields that might be needed for order service
    dealer_code: {
        type: String,
        unique: true,
    },
    email: {
        type: String,
    },
    phone_Number: {
        type: String,
    },
}, {
    timestamps: true
});

module.exports = mongoose.models.Dealer || mongoose.model("Dealer", dealerSchema);
