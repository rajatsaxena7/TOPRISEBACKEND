const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notification");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
    "/createBroadcast",
    // authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.createBroadCastNotification
);

router.post(
    "/createUniCastOrMulticast",
    // authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.createUnicastOrMulticastNotification
);

router.get(
    "/",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.getAllNotifications
);

router.get(
    "/all_userNotifications/:userId",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.getUserAllNotifications
);

router.get(
    "/unread-count/:userId",
    authenticate,
    notificationController.getUnreadNotificationCount
);

router.get(
    "/stats/:userId",
    authenticate,
    notificationController.getNotificationStats
);

router.get(
    "/:id",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.getNotificationById
);


router.put(
    "/markAsRead/:id",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.markNotificationAsRead
);

router.put(
    "/markAsReadAll/:userId",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.markNotificationAsReadByUserId
);

router.put(
    "/markAsUserDelete/:id",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.userDeleteNotification
);


router.put(
    "/markAsUserDeleteAll/:userId",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationController.deleteAllNotificationsByUserId
);



module.exports = router;