const mongoose = require("mongoose");


const notificationSettingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NotificationTemplate",
        default: null,
        required: false
    },
    actionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Action",
        default: null,
        required: false
    },
    deepLink: {
        type: String,
        default: null,
        required: false
    },
    notification_title: {
        type: String,
        default: null,
        required: false
    },
    notification_body: {
        type: String,
        default: null,
        required: false
    },
    webRoute: {
        type: String,
        default: null,
        required: false
    },
    markAsRead: {
        type: Boolean,
        default: false
    },
    isUserDeleted: {
        type: Boolean,
        default: false
    },
    userDeletedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    markAsReadAt: {
        type: Date,
        default: null
    },



}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSettingSchema);