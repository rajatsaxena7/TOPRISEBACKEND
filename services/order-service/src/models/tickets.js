const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
    userRef: {
        type: String,
        required: true,
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: function() { return this.ticketType === "Order"; } 
    },
    updated_by: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ["Open", "In Progress", "Resolved", "Closed"],
        default: "Open",
    },
    admin_notes: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: true,
    },
    attachments: [
        {
            type: String,
            required: false,
        },
    ],
    ticketType: {
        type: String,
        required: true,
        enum: ["Order", "General", ],
    },
    assigned: {
        type: Boolean,
        required: false,
        default: false,
    },
    assigned_to: {
        type: String,
        required: false,
        default: null,
    },
    involved_users: [
        {
            type: String,
            required: false,
        },
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model("Ticket", ticketSchema);