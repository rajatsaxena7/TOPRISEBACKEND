const NotificationSetting = require("../model/notificationSetting");
const {
    cacheGet,
    cacheSet,
    cacheDel, // ⬅️ writer-side “del” helper
} = require("/packages/utils/cache");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const nodemailer = require("nodemailer");
const { validationResult } = require('express-validator');

const verifySMTP = async ({ host, port, username, password, encryption }) => {
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: encryption === 'SSL' || port === 465,
        requireTLS: encryption === 'TLS',
        auth: { user: username, pass: password },
        tls: { rejectUnauthorized: false }
    });
    try {
        await transporter.verify();
        logger.info("Verification successful");
        return { success: true };
    } catch (err) {
        logger.error("Verification failed", err);
        return { success: false, message: err.message };
    }
}
exports.createNotificationSetting = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error("❌ Validation error:", errors.array());
            sendError(res, "Validation error " + errors.array(), 400);
        };

        const { host, port, username, password, fromEmail, fromName, encryption = 'TLS' } = req.body;

        if (await NotificationSetting.countDocuments()) {
            logger.error("❌ Config already exists");
            sendError(res, "Config already exists—use PUT /update.", 400);
        }

        const verifyData = await verifySMTP({ host, port, username, password, encryption });
        if (!verifyData.success) {
            logger.error("❌ Config verification failed:", verifyData.message);
            sendError(res, verifyData.message, 400);
        }

        const cfg = await NotificationSetting.create({
            host, port, username,
            password,
            fromEmail,
            fromName,
            encryption
        });


        const { password: _, ...safe } = cfg.toObject();
        logger.info("✅ Config created:", safe);
        sendSuccess(res, safe, "Config created successfully");
    } catch (err) {
        logger.error("❌ Config creation error:", err);
        sendError(res, err);
    }
};
exports.getNotificationSetting = async (req, res) => {
    try {
        const setting = await NotificationSetting.findOne();

        if (!setting) {
            logger.error("❌ Notification setting not found");
            sendError(res, "Notification setting not found", 404);
        }
        const settingToReturn = setting.toObject();
        logger.info("✅ Notification setting fetched successfully");
        sendSuccess(res, settingToReturn, "Notification setting fetched successfully");

    } catch (error) {
        logger.error("❌ Fetch notification setting error:", error);
        sendError(res, error);

    }
};


exports.updateNotificationSetting = async (req, res) => {
    try {


        const setting = await NotificationSetting.findOne();
        if (!setting) {
            logger.error("❌ Notification setting not found");
            sendError(res, "Notification setting not found", 404);
            return
        }
        const verifyData = await verifySMTP({
            host: req.body.host||setting.host,
            port: req.body.port||setting.port,
            username: req.body.username||setting.username,
            password: req.body.password||setting.password,
            encryption: req.body.encryption||setting.encryption
        });
        if (!verifyData.success) {
            logger.error("❌ Config verification failed:", verifyData.message);
            sendError(res, verifyData.message, 400);
            return
        }


        if (req.body.host) setting.host = req.body.host;
        if (req.body.port) setting.port = req.body.port;
        if (req.body.username) setting.username = req.body.username;
        if (req.body.password) setting.password = req.body.password;
        if (req.body.fromEmail) setting.fromEmail = req.body.fromEmail;
        if (req.body.fromName) setting.fromName = req.body.fromName;
        if (req.body.encryption) setting.encryption = req.body.encryption;
        if (req.body.encryption ) setting.encryption = req.body.encryption;

        const updatedSetting = await setting.save();

        const settingToReturn = updatedSetting.toObject();
       logger.info("✅ Notification setting updated successfully");
       sendSuccess(res, settingToReturn, "Notification setting updated successfully");
       return
    } catch (error) {
        logger.error("❌ Update notification setting error:", error);
        sendError(res, error);
       
    }
};

exports.deleteNotificationSetting = async (req, res) => {
    try {
        const setting = await NotificationSetting.findOneAndDelete();

        if (!setting) {
            logger.error("❌ Notification setting not found");
            sendError(res, "Notification setting not found", 404);
        }

       logger.info("✅ Notification setting deleted successfully");
       sendSuccess(res, setting, "Notification setting deleted successfully");
    } catch (error) {
        logger.error("❌ Delete notification setting error:", error);
        sendError(res, error);
    }
};

