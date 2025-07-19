const express = require("express");
const router = express.Router();
const notificationTemplateController = require("../controller/notification_template");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
    "/",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationTemplateController.createTemplate
);

router.get(
    "/",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationTemplateController.getAllTemplates
);

router.get(
    "/:id",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationTemplateController.getSingleTemplate
);

router.put(
    "/:id",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationTemplateController.editTemplate
);

router.delete(
    "/:id",
    authenticate,
    // authorizeRoles("Super-admin"),
    notificationTemplateController.softDeleteTemplate
);

module.exports = router;