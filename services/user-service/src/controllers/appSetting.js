const AppSetting = require("../models/appSetting");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
exports.getAppSettings = async (req, res) => {
    try {
        const settings = await AppSetting.findOne();
        if (!settings) {
            logger.error("No settings found");
            sendError(res, "No settings found", 404);
        }
        logger.info("Settings fetched successfully");
        sendSuccess(res, settings, "Settings fetched successfully");
    } catch (error) {
        logger.error("Error fetching settings:", error);
        sendError(res, error);
    }
};


exports.createAppSettings = async (req, res) => {
    try {
        // Check if settings already exist
        const existingSettings = await AppSetting.findOne();
        if (existingSettings) {
            logger.error("Settings already exist in the database");
            sendError(res, "Settings already exist", 400);
        }

        const newSettings = await AppSetting.create(req.body);
        logger.info("Settings created successfully");
        sendSuccess(res, newSettings, "Settings created successfully");
    } catch (error) {
        logger.error("Error creating settings:", error);
        sendError(res, error);
    }
};


exports.updateAppSettings = async (req, res) => {
    try {
        const updates = req.body;
        const settings = await AppSetting.findOne();

        if (!settings) {
            logger.error("No settings found");
            sendError(res, "No settings found", 404);
        }


        Object.keys(updates).forEach((key) => {
            if (key in settings) {
                settings[key] = updates[key];
            }
        });

        await settings.save();

        logger.info("Settings updated successfully");
        sendSuccess(res, settings, "Settings updated successfully");
    } catch (error) {
        logger.error("Error updating settings:", error);
        sendError(res, error);
    }
};