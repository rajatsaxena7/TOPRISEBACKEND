const mongoose = require("mongoose");


const notificationTemplateSchema = new mongoose.Schema({
    template_name: {
        type: String,
        required: true,
        unique: true,
    },
    template_body: {
        type: String,
        required: true,
    },
    type: [{
        type: String,
        enum: ["INAPP", "EMAIL", "PUSH"],
        required: true
    }],
    roles: [{
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
        required: true
    }],
    scheduled: {
        type: Boolean,
        default: false,
    },
    schedule: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY"],
        default: null,
        required: false
    },
    deepLink: {
        type: String,
        default: null,
        required: false
    },
    webRoute: {
        type: String,
        default: null,
        required: false
    },
    priority: {
        type :String,
        enum: ["HIGH", "MEDIUM", "LOW"],
        default: "LOW",
        required: false
    },
    actionId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Action"
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

module.exports = mongoose.model("NotificationTemplate", notificationTemplateSchema);