const mongoose = require("mongoose");
const Notification = require("../model/notification");
const Action = require("../model/action");
const NotificationTemplate = require("../model/notification_template");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios");
const admin = require('firebase-admin');
const notificationSetting = require("../model/notificationSetting");
const nodemailer = require('nodemailer');


exports.createBroadCastNotification = async (req, res) => {
    try {
        const { actionId } = req.body;

        const action = await Action.findById(actionId);
        if (!action) {
            logger.error("❌ Invalid actionId provided");
            sendError(res, "Invalid actionId provided", 400);
            return;
        }
        const notificationTemplate = await NotificationTemplate.find({ actionId: actionId });
        if (notificationTemplate.length == 0) {
            logger.info("There is no notification template for this action");
            sendSuccess
            return;
        }
        const userData = await axios.get(`http://user-service:5001/api/users/allUsers/internal`, {
            headers: {
                Authorization: req.headers.authorization
            }
        })

        const userList = userData.data.data;
        let emailCfg = await axios.get("http://user-service:5001/api/appSetting/", {
            headers: {
                Authorization: req.headers.authorization
            }
        });

        emailCfg = emailCfg.data.data;
        const mailer = nodemailer.createTransport({
            host: emailCfg.smtp.host,
            port: emailCfg.smtp.port,
            secure: emailCfg.smtp.secure,    // true for 465
            auth: { user: emailCfg.smtp.auth.user, pass: emailCfg.smtp.auth.pass }
            // host: "smtp-relay.brevo.com",
            // port: 587,
            // // secure: true,
            // auth: {
            //     user: "mankavit.clatcoaching11@gmail.com",
            //     pass: "ADOJ6z04yjbaL9TY",
            // },
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
                if (template.type.includes("PUSH")) {
                    const tokens = audience.flatMap(u => u.fcmToken || []);
                    if (tokens.length) {
                        await admin.messaging().sendMulticast({
                            tokens,
                            notification: {
                                title: template.template_name,
                                body: template.template_body
                            },
                            data: {
                                deepLink: action.deepLink || '',
                                webRoute: action.webRoute || ''
                            }
                        });
                    }
                }
                if (template.type.includes("EMAIL")) {
                    await Promise.all(audience.map(async user => {
                        if (!user.email) return;
                        await mailer.sendMail({
                            from: `"${emailCfg.smtp.fromName}" <${emailCfg.smtp.fromEmail}>`,
                            to: user.email,
                            subject: template.template_name,
                            text: template.template_body
                        });
                    }));
                }



            })
        )
        if (bulkInserts.length > 0) await Notification.bulkWrite(bulkInserts, { ordered: false });
        logger.info("✅ Notification created successfully");
        return sendSuccess(res, { inserted: bulkInserts.length }, 'Notifications queued');
    } catch (error) {
        logger.error("❌ Create notification error:", error);
        sendError(res, error);
    }
};

exports.createUnicastOrMulticastNotification = async (req, res) => {
    try {
        const { userIds, notificationType, notificationTitle, NotificationBody, deepLink, webRoute, notification_type = null, references } = req.body;



        const userData = await axios.get(`http://user-service:5001/api/users/allUsers/internal`, {
            headers: {
                Authorization: req.headers.authorization
            }
        })
        const userList = userData.data.data;
        let emailCfg = await axios.get("http://user-service:5001/api/appSetting/", {
            headers: {
                Authorization: req.headers.authorization
            }
        });

        emailCfg = emailCfg.data.data;
        const mailer = nodemailer.createTransport({
            host: emailCfg.smtp.host,
            port: emailCfg.smtp.port,
            secure: emailCfg.smtp.secure,    // true for 465
            auth: { user: emailCfg.smtp.auth.user, pass: emailCfg.smtp.auth.pass }
            // host: "smtp-relay.brevo.com",
            // port: 587,
            // // secure: true,
            // auth: {
            //     user: "mankavit.clatcoaching11@gmail.com",
            //     pass: "ADOJ6z04yjbaL9TY",
            // },
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
        if (notificationType.includes("EMAIL")) {
            await Promise.all(audience.map(async user => {
                if (!user.email) return;
                await mailer.sendMail({
                    from: `"${emailCfg.smtp.fromName}" <${emailCfg.smtp.fromEmail}>`,
                    to: user.email,
                    subject: notificationTitle,
                    text: NotificationBody
                });
            }));
        }
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
                            createdAt: new Date(),
                            notification_type,
                            references
                        }
                    }
                })
            );

        }
        if (bulkInserts.length) await Notification.bulkWrite(bulkInserts, { ordered: false });
        logger.info("✅ Notification created successfully");
        return sendSuccess(res, { inserted: bulkInserts.length }, 'Notifications queued');
    } catch (error) {
        logger.error("❌ Create notification error:", error);
        sendError(res, error);
    }
};

exports.getUserAllNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { markAsRead } = req.query
        let query = { userId, isUserDeleted: false };
        if (markAsRead !== undefined) {
            query.markAsRead = markAsRead
        }

        const notifications = await Notification.find(query).sort({ createdAt: -1 });
        logger.info("✅ Notifications fetched successfully");
        return sendSuccess(res, notifications, "Notifications fetched successfully");
    } catch (error) {
        logger.error("❌ Fetch notifications error:", error);
        sendError(res, error);
    }
};
exports.getNotificationById = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) return sendError(res, "Notification not found", 404);
        logger.info("✅ Notification fetched successfully");
        return sendSuccess(res, notification, "Notification fetched successfully");
    } catch (error) {
        logger.error("❌ Fetch notification error:", error);
        sendError(res, error);
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) return sendError(res, "Notification not found", 404);
        notification.markAsRead = true;
        await notification.save();
        logger.info("✅ Notification marked as read successfully");
        return sendSuccess(res, notification, "Notification marked as read successfully");
    } catch (error) {
        logger.error("❌ Mark notification as read error:", error);
        sendError(res, error);
    }
};

exports.userDeleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findById(id);
        if (!notification) return sendError(res, "Notification not found", 404);
        notification.isUserDeleted = true;
        await notification.save();
        logger.info("✅ Notification deleted successfully");
        return sendSuccess(res, notification, "Notification deleted successfully");
    } catch (error) {
        logger.error("❌ Delete notification error:", error);
        sendError(res, error);
    }
};

exports.markNotificationAsReadByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        await Notification.updateMany({ userId }, { $set: { markAsRead: true } });
        logger.info("✅ Notifications marked as read successfully");
        return sendSuccess(res, null, "Notifications marked as read successfully");
    } catch (error) {
        logger.error("❌ Mark notifications as read error:", error);
        sendError(res, error);
    }
};

exports.deleteAllNotificationsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        await Notification.deleteMany({ userId }, { $set: { isUserDeleted: true } });
        logger.info("✅ Notifications deleted successfully");
        return sendSuccess(res, null, "Notifications deleted successfully");
    } catch (error) {
        logger.error("❌ Delete notifications error:", error);
        sendError(res, error);
    }
};

exports.getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find();
        logger.info("✅ Notifications count fetched successfully");
        return sendSuccess(res, notifications, "Notifications count fetched successfully");
    } catch (error) {
        logger.error("❌ Fetch notifications count error:", error);
        sendError(res, error);
    }
};

exports.getUnreadNotificationCount = async (req, res) => {
    try {
        const { userId } = req.params;

        // Count unread notifications for the user
        const unreadCount = await Notification.countDocuments({
            userId: userId,
            markAsRead: false,
            isUserDeleted: false
        });

        // Also get some basic stats
        const totalCount = await Notification.countDocuments({
            userId: userId,
            isUserDeleted: false
        });

        const readCount = totalCount - unreadCount;

        const result = {
            unreadCount,
            totalCount,
            readCount,
            userId
        };

        logger.info(`✅ Unread notification count fetched for user ${userId}: ${unreadCount}`);
        return sendSuccess(res, result, "Unread notification count fetched successfully");
    } catch (error) {
        logger.error("❌ Fetch unread notification count error:", error);
        sendError(res, error);
    }
};

exports.getNotificationStats = async (req, res) => {
    try {
        const { userId } = req.params;

        // Get comprehensive notification statistics
        const stats = await Notification.aggregate([
            {
                $match: {
                    userId: userId,
                    isUserDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: 1 },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $eq: ["$markAsRead", false] }, 1, 0]
                        }
                    },
                    readCount: {
                        $sum: {
                            $cond: [{ $eq: ["$markAsRead", true] }, 1, 0]
                        }
                    },
                    latestNotification: { $max: "$createdAt" },
                    oldestUnreadNotification: {
                        $min: {
                            $cond: [
                                { $eq: ["$markAsRead", false] },
                                "$createdAt",
                                null
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalCount: 1,
                    unreadCount: 1,
                    readCount: 1,
                    latestNotification: 1,
                    oldestUnreadNotification: 1,
                    userId: userId
                }
            }
        ]);

        const result = stats.length > 0 ? stats[0] : {
            totalCount: 0,
            unreadCount: 0,
            readCount: 0,
            latestNotification: null,
            oldestUnreadNotification: null,
            userId: userId
        };

        logger.info(`✅ Notification stats fetched for user ${userId}`);
        return sendSuccess(res, result, "Notification statistics fetched successfully");
    } catch (error) {
        logger.error("❌ Fetch notification stats error:", error);
        sendError(res, error);
    }
};