const mongoose = require("mongoose");


const notificationSettingSchema = new mongoose.Schema(
    {
        host: {
            type: String,
            required: true                // e.g. "smtp.gmail.com"
        },
        port: {
            type: Number,
            required: true                // SSL 465, TLS 587, etc.
        },
        username: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        fromEmail: {
            type: String,
            required: true,
            validate: {
                validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                message: props => `${props.value} is not a valid e-mail address`
            }
        },
        fromName: {
            type: String,
            default: ''                   // optional display name
        },

        /** Connection security */
        encryption: {
            type: String,
            enum: ['NONE', 'SSL', 'TLS'],
            default: 'TLS'
        },

        /** Worker-side retry policy */
        maxRetryAttempts: {
            type: Number,
            default: 3
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("NotificationSetting", notificationSettingSchema);