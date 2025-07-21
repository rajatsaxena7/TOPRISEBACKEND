const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const juice = require('juice');
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios");
const admin = require('firebase-admin');



exports.createBroadCastNotificationUtilityFunction = async (actionId, token) => {
    try {

        const Data = await axios.post(`http://notification-service:5001/api/notification/createBroadcast`, { actionId: actionId }, { headers: { Authorization: token } })
        if (Data.data.success) {
            return { success: true, message: Data.data.message };
        } else {
            return { success: false, message: Data.data.message };
        }
    } catch (error) {
        logger.error("❌ Create notification error:", error);
        return { success: false, message: error };
    }
};

exports.createUnicastOrMulticastNotificationUtilityFunction = async (userIds, notificationType, notificationTitle, NotificationBody, deepLink, webRoute, token) => {
    try {

        const Data = await axios.post("http://notification-service:5001/api/notification/createUniCastOrMulticast",
            {
                userIds: userIds,
                notificationType: notificationType,
                notificationTitle: notificationTitle,
                NotificationBody: NotificationBody,
                deepLink: deepLink,
                webRoute: webRoute
            },
            {
                headers: {
                    Authorization: token
                }
            }
        )
        if (Data.data.success) {
            return { success: true, message: Data.data.message };
        } else {
            return { success: false, message: Data.data.message };
        }

    } catch (error) {
        logger.error("❌ Create notification error:", error);
        sendError(res, error);
    }
};

exports.sendEmailNotifiation = async (userEmail, notificationTitle, htmlTemplate, token) => {
    try {

        let emailCfg = await axios.get("http://notification-service:5001/api/notificationSetting/", {
            headers: {
                Authorization: token
            }
        });

        emailCfg = emailCfg.data.data;
        const mailer = nodemailer.createTransport({
            host: emailCfg.host,
            port: emailCfg.port,
            secure: emailCfg.encryption === 'SSL',    // true for 465
            requireTLS: emailCfg.encryption === 'TLS',    // upgrade for 587
            auth: { user: emailCfg.username, pass: emailCfg.password }
        });
        const htmlWithInlineStyles = juice(htmlTemplate);
        const info = await mailer.sendMail({
            from: `"${emailCfg.fromName}" <${emailCfg.fromEmail}>`,
            to: userEmail,
            subject: notificationTitle,
            html: htmlWithInlineStyles
        });
        console.log("Message sent: %s", info);
    } catch (error) {
        logger.error("❌ Create notification error:", error);
    }
};