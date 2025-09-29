const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const juice = require('juice');
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios");
const admin = require('firebase-admin');
const path = require('path');


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

exports.createUnicastOrMulticastNotificationUtilityFunction = async (userIds, notificationType, notificationTitle, NotificationBody, deepLink, webRoute, notification_type = null, references, token) => {
    try {
        const Data = await axios.post("http://notification-service:5001/api/notification/createUniCastOrMulticast",
            {
                userIds: userIds,
                notificationType: notificationType,
                notificationTitle: notificationTitle,
                NotificationBody: NotificationBody,
                deepLink: deepLink,
                webRoute: webRoute
                , notification_type: notification_type
                , references: references
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
        let emailCfg = await axios.get("http://user-service:5001/api/appSetting/", {
            headers: {
                Authorization: token
            }
        });

        emailCfg = emailCfg.data.data;
        console.log(emailCfg);
        const mailer = nodemailer.createTransport({
            host: emailCfg.smtp.host,
            port: emailCfg.smtp.port,
            // // secure: emailCfg.smtp.secure,    // true for 465
            auth: { user: emailCfg.smtp.auth.user, pass: emailCfg.smtp.auth.pass },
            // host: "smtp-mail.outlook.com",
            // port: 587,
            // // secure: true,
            // requireTLS: true,
            // auth: {
            //     user: "mailer@digi9.co.in",
            //     pass: "M@ilerdigi9",
            // },
            tls: {
                ciphers: 'SSLv3', // or 'TLSv1.2'
                rejectUnauthorized: false // Only for testing
            }
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
            from: `"${emailCfg.smtp.fromName}" <${emailCfg.smtp.fromEmail}>`,
            to: userEmail,
            subject: notificationTitle,
            html: htmlWithInlineStyles,
        });
        console.log("Message sent: %s", info);
        logger.info("✅ Notification sent successfully");
    } catch (error) {
        logger.error("❌ Create notification error:", error);
    }
};