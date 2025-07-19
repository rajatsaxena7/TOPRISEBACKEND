const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Notification = require("../../services/notification-service/src/model/notification");
const Action = require("../../services/notification-service/src/model/action");
const NotificationTemplate = require("../../services/notification-service/src/model/notification_template");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios");
const admin = require('firebase-admin');
const notificationSetting = require("../../services/notification-service/src/model/notificationSetting");


exports.createBroadCastNotificationUtilityFunction = async (actionId,token) => {
    try {

        const action = await Action.findById(actionId);
        if (!action) {
            logger.error("❌ Invalid actionId provided");
            
            return { success: false , message: "Invalid actionId provided"};
        }
        const notificationTemplate = await NotificationTemplate.find({ actionId: actionId });
        if (notificationTemplate.length == 0) {
            logger.info("There is no notification template for this action");
            return { success: true };
        }
        const userData = await axios.get(`http://user-service:5001/api/users/all-users/internal`, {
            headers: {
                Authorization: token
            }
        })
        const userList = userData.data.data;
        const emailCfg = await notificationSetting.findOne();
        const mailer = nodemailer.createTransport({
            host: emailCfg.host,
            port: emailCfg.port,
            secure: emailCfg.encryption === 'SSL',    // true for 465
            requireTLS: emailCfg.encryption === 'TLS',    // upgrade for 587
            auth: { user: emailCfg.username, pass: emailCfg.password }
        });

        const bulkInserts = [];

        await Promise.all(
            notificationTemplate.map(async (template) => {
                const audience = userList.filter((user) => {
                    return template.roles.includes(user.role)
                })
                if (template.type.includes("PUSH")) {
                    audience.forEach(u =>
                        bulkInserts.push({
                            insertOne: {
                                document: {
                                    userId: u._id,
                                    templateId: template._id,
                                    actionId: actionId,
                                    deepLink: action.deepLink,
                                    webRoute: action.webRoute,
                                    notification_title: template.template_name,
                                    notification_body: template.template_body,
                                    createdAt: new Date()
                                }
                            }
                        })
                    );

                }
                // if (template.type.includes("PUSH")) {
                //     const tokens = audience.flatMap(u => u.fcmToken || []);
                //     if (tokens.length) {
                //         await admin.messaging().sendMulticast({
                //             tokens,
                //             notification: {
                //                 title: template.template_name,
                //                 body: template.template_body
                //             },
                //             data: {
                //                 deepLink: action.deepLink || '',
                //                 webRoute: action.webRoute || ''
                //             }
                //         });
                //     }
                // }
                // if (template.type.includes("EMAIL")) {
                //     await Promise.all(audience.map(async user => {
                //         if (!user.email) return;
                //         await mailer.sendMail({
                //             from: `"${emailCfg.fromName}" <${emailCfg.fromEmail}>`,
                //             to: user.email,
                //             subject: template.template_name,
                //             text: template.template_body
                //         });
                //     }));
                // }



            })
        )
        if (bulkInserts.length > 0) await Notification.bulkWrite(bulkInserts, { ordered: false });
        logger.info("✅ Notification created successfully");
        return { success: true , message: "Notifications queued", inserted: bulkInserts.length };
    } catch (error) {
        logger.error("❌ Create notification error:", error);
        return { success: false , message: error };
    }
};

exports.createUnicastOrMulticastNotificationUtilityFunction = async (userIds, notificationType, notificationTitle, NotificationBody, deepLink, webRoute,token ) => {
    try {
       



        const userData = await axios.get(`http://user-service:5001/api/users/all-users/internal`, {
            headers: {
                Authorization: token
            }
        })
        const userList = userData.data.data;
        const emailCfg = await notificationSetting.findOne();
        const mailer = nodemailer.createTransport({
            host: emailCfg.host,
            port: emailCfg.port,
            secure: emailCfg.encryption === 'SSL',    // true for 465
            requireTLS: emailCfg.encryption === 'TLS',    // upgrade for 587
            auth: { user: emailCfg.username, pass: emailCfg.password }
        });
        const audience = userList.filter((user) => {
            return userIds.includes(user._id)
        })
        const bulkInserts = [];



        // if (notificationType.includes("PUSH")) {
        //     const tokens = audience.flatMap(u => u.fcmToken || []);
        //     if (tokens.length) {
        //         await admin.messaging().sendMulticast({
        //             tokens,
        //             notification: {
        //                 title: notificationTitle,
        //                 body: NotificationBody
        //             },
        //             data: {
        //                 deepLink: deepLink || '',
        //                 webRoute: webRoute || ''
        //             }
        //         });
        //     }
        // }
        // if (notificationType.includes("EMAIL")) {
        //     await Promise.all(audience.map(async user => {
        //         if (!user.email) return;
        //         await mailer.sendMail({
        //             from: `"${emailCfg.fromName}" <${emailCfg.fromEmail}>`,
        //             to: user.email,
        //             subject: notificationTitle,
        //             text: NotificationBody
        //         });
        //     }));
        // }
        if (notificationType.includes("INAPP")) {
            audience.forEach(u =>
                bulkInserts.push({
                    insertOne: {
                        document: {
                            userId: u._id,
                            templateId: null,
                            actionId: null,
                            deepLink: deepLink,
                            webRoute: webRoute,
                            notification_title: notificationTitle,
                            notification_body: NotificationBody,
                            createdAt: new Date()
                        }
                    }
                })
            );

        }
        if (bulkInserts.length) await Notification.bulkWrite(bulkInserts, { ordered: false });
      return { success: true , message: "Notifications queued", inserted: bulkInserts.length };
    } catch (error) {
        logger.error("❌ Create notification error:", error);
        sendError(res, error);
    }
};