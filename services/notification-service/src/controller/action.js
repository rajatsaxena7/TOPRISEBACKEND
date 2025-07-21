const Action = require("../model/action");
const {
    cacheGet,
    cacheSet,
    cacheDel, // ⬅️ writer-side “del” helper
} = require("/packages/utils/cache");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const Redis = require("redis");
const axios = require("axios");


exports.createAction = async (req, res) => {
    try {
        const action = await Action.create(req.body);
        logger
        return sendSuccess(res, action, "Action created successfully");
    } catch (error) {
        logger.error("❌ Create action failed:", error);
        sendError(res, error);
    }
};

exports.getAllActions = async (req, res) => {
    try {
        const actions = await Action.find({isDeleted: false});
        logger.info("✅ Actions fetched successfully");
        return sendSuccess(res, actions, "Actions fetched successfully");
    } catch (error) {

        logger.error("❌ Fetch actions error:", error);
        sendError(res, error);
    }
};


exports.getActionById = async (req, res) => {
    try {
        const action = await Action.findById(req.params.id);
        if (!action) {
            logger.error("❌ Action not found");
            sendError(res, "Action not found", 404);
        }
        sendSuccess(res, action, "Action fetched successfully");
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteActionById = async (req, res) => {
    try {
        const action = await Action.findById(req.params.id);
        action.isDeleted = true;
        await action.save();
        if (!action) {
            logger.error("❌ Action not found");
            return sendError(res, "Action not found", 404);
        }
        logger.info("✅ Action deleted successfully");
        return sendSuccess(res, action, "Action deleted successfully");
    } catch (error) {
        logger.error("❌ Delete action error:", error);
        return sendError(res, error);
    }
}

exports.updateActionById = async (req, res) => {
    try {
        const action = await Action.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!action) {
            logger.error("❌ Action not found");
            return sendError(res, "Action not found", 404);
        }
        logger.info("✅ Action updated successfully");
        return sendSuccess(res, action, "Action updated successfully");
    } catch (error) {
        logger.error("❌ Update action error:", error);
        return sendError(res, error);
    }
}