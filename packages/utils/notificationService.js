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

exports.createUnicastOrMulticastNotificationUtilityFunction = async (userIds, notificationType, notificationTitle, NotificationBody, deepLink, webRoute,notification_type=null,references, token) => {
    try {
        const Data = await axios.post("http://notification-service:5001/api/notification/createUniCastOrMulticast",
            {
                userIds: userIds,
                notificationType: notificationType,
                notificationTitle: notificationTitle,
                NotificationBody: NotificationBody,
                deepLink: deepLink,
                webRoute: webRoute
                ,notification_type:notification_type
                ,references:references
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
        return { success: false, message: error };
    }
};

exports.sendEmailNotifiation = async (userEmail, notificationTitle, htmlTemplate, token) => {
    try {
        if (typeof htmlTemplate !== 'string') {
            logger.error("❌ Create notification error: htmlTemplate is not a string");
        }
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
            // host: "smtp-relay.brevo.com",
            // port: 587,
            // // secure: true,
            // auth: {
            //     user: "mankavit.clatcoaching11@gmail.com",
            //     pass: "ADOJ6z04yjbaL9TY",
            // },
        });
        const htmlWithInlineStyles = juice(htmlTemplate);
        const info = await mailer.sendMail({
            from: `"${emailCfg.fromName}" <${emailCfg.fromEmail}>`,
            to: userEmail,
            subject: notificationTitle,
            html: htmlWithInlineStyles
        });
        console.log("Message sent: %s", info);
        logger.info("✅ Notification sent successfully");
    } catch (error) {
        logger.error("❌ Create notification error:", error);
    }
};