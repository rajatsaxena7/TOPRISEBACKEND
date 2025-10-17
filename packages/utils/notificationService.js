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

// New function to send order confirmation emails with HTML templates
exports.sendOrderConfirmationEmail = async (userEmail, orderData, token) => {
    try {
        const { orderConfirmationEmail } = require('./email_templates/email_templates');

        // Prepare order items for the email template
        const orderItems = orderData.skus.map(sku => ({
            productName: sku.productName,
            productImage: 'https://via.placeholder.com/80x80?text=Product', // Default placeholder
            manufacture: 'Toprise', // Default manufacturer
            amount: `₹${sku.selling_price}`,
            mrp_withgst: `₹${sku.mrp}`,
            date: orderData.orderDate
        }));

        // Generate HTML email template
        const htmlTemplate = orderConfirmationEmail(
            orderData.customerDetails.name,
            orderData.orderId,
            orderItems,
            '123 Main Street', // Return address
            'Delhi',
            'Delhi',
            '110001',
            '+91-9876543210', // Support phone
            'support@toprise.in', // Support email
            'Toprise Ventures',
            'Customer Support Team',
            'Customer Service Representative',
            'Toprise Ventures',
            'support@toprise.in | +91-9876543210'
        );

        // Send email using existing function
        await exports.sendEmailNotifiation(
            userEmail,
            `Order Confirmation - ${orderData.orderId}`,
            htmlTemplate,
            token
        );

        logger.info(`✅ Order confirmation email sent to ${userEmail}`);
        return { success: true, message: 'Order confirmation email sent successfully' };
    } catch (error) {
        logger.error("❌ Failed to send order confirmation email:", error);
        return { success: false, message: error.message };
    }
};