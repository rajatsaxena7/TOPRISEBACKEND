const express = require("express");
const router = express.Router();
const notificationSettingController = require("../controller/notificationSetting");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
    "/",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationSettingController.createNotificationSetting
);

router.get(
    "/",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationSettingController.getNotificationSetting
);  

router.put(
    "/",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationSettingController.updateNotificationSetting
);


router.delete(
    "/",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationSettingController.deleteNotificationSetting
);

module.exports = router;