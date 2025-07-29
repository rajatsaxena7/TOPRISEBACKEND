const express = require("express");
const router = express.Router();
const {
    getAppSettings,
    createAppSettings,
    updateAppSettings,
} = require("../controllers/appSetting");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.get("/",
    getAppSettings);

router.post("/",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
    createAppSettings);


router.patch("/",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
    updateAppSettings);

module.exports = router;