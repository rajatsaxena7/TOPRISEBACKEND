const mongoose = require("mongoose");


const actionSchema = new mongoose.Schema({
    action_name: {
        type: String,
        required: true,
        unique: true,
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
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Action", actionSchema);