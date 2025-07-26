const mongoose = require("mongoose");

const servicableAreaSchema = new mongoose.Schema({
    lat: { type: Number, required: true },
    long: { type: Number, required: true },
});

const versioningSchema = new mongoose.Schema({
    web: { type: String, default: "1.0.0" },
    android: { type: String, default: "1.0.0" },
    ios: { type: String, default: "1.0.0" },
});

const appSettingSchema = new mongoose.Schema(
    {
        deliveryCharge: { type: Number, default: 0 },
        minimumOrderValue: { type: Number, default: 0 },
        smtp: {
            fromName: { type: String, default: "" },
            fromEmail: { type: String, default: "" },
            host: { type: String, default: "" },
            port: { type: Number, default: 587 },
            secure: { type: Boolean, default: false },
            auth: {
                user: { type: String, default: "" },
                pass: { type: String, default: "" },
            },
        },
        versioning: { type: versioningSchema, default: {} },
        servicableAreas: { type: [servicableAreaSchema], default: [] },
        supportEmail: { type: String, default: "" },
        supportPhone: { type: String, default: "" },
        tnc: { type: String, default: "" },
        privacyPolicy: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("AppSetting", appSettingSchema);