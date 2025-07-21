const NotificationTemplate = require("../model/notification_template");
const Action = require("../model/action");
const {
    cacheGet,
    cacheSet,
    cacheDel, // ⬅️ writer-side “del” helper
} = require("/packages/utils/cache");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");

exports.createTemplate = async (req, res) => {
    try {

        const { template_name, template_body, type, roles, actionId,priority } = req.body;

        const existingTemplate = await NotificationTemplate.findOne({ template_name });
        if (existingTemplate) {
            logger.error(" ❌ Template with this name already exists");
            sendError(res, "Template with this name already exists", 400);
            return;
        }

        const actionExists = await Action.findById(actionId);
        if (!actionExists) {
            logger.error(" ❌ Invalid actionId provided");
            sendError(res, "Invalid actionId provided", 400);
            return;
        }


        const newTemplate = new NotificationTemplate({
            template_name,
            template_body,
            type,
            roles,
            scheduled: req.body.scheduled || false,
            schedule: req.body.scheduled ? req.body.schedule : null,
            deepLink: actionExists.deepLink || null,
            webRoute: actionExists.webRoute || null,
            priority: req.body.priority || "LOW",
            actionId: actionId || null,
            isDeleted: false
        });

        const savedTemplate = await newTemplate.save();

        const populatedTemplate = await NotificationTemplate.findById(savedTemplate._id)
            .populate('actionId', '-__v')
            .exec();
        logger.info("✅ Template created successfully");
        sendSuccess(res, populatedTemplate, "Template created successfully");
    } catch (error) {
        console.error("Error creating template:", error);
        logger.error(" ❌ Server error while creating template");
        sendError(res, error);
    }
};


exports.editTemplate = async (req, res) => {
    try {

        const { id } = req.params;
        const updateData = req.body;

        const template = await NotificationTemplate.findById(id);
        if (!template) {
            logger.error("❌ Template not found");
            sendError(res, "Template not found", 404);
            return;
        }

        if (updateData.template_name && updateData.template_name !== template.template_name) {
            const existingTemplate = await NotificationTemplate.findOne({
                template_name: updateData.template_name
            });
            if (existingTemplate) {
                logger.error("❌ Template with this name already exists");
                sendError(res, "Template with this name already exists", 400);
                return;
            }
        }

        if (updateData.actionId) {
            const actionExists = await Action.findById(updateData.actionId);
            if (!actionExists) {
                logger.error("❌ Invalid actionId provided");
                sendError(res, "Invalid actionId provided", 400);
                return;
            }
        }

        const updatedTemplate = await NotificationTemplate.findByIdAndUpdate(
            id,
            {
                ...updateData,
                updated_at: Date.now()
            },
            { new: true }
        ).populate('actionId', '-__v');


        logger.info("✅ Template updated successfully");
        sendSuccess(res, updatedTemplate, "Template updated successfully");

    } catch (error) {
        console.error("Error updating template:", error);
        logger.error("❌ Server error while updating template");
        sendError(res, error);
    }
};

exports.getAllTemplates = async (req, res) => {
    try {
        const { includeDeleted } = req.query;

        let query = { isDeleted: false };
        if (includeDeleted === 'true') {
            query = {};
        }

        const templates = await NotificationTemplate.find(query)
            .populate('actionId', '-__v')
            .sort({ created_at: -1 });

        logger.info("✅ Templates fetched successfully");
        sendSuccess(res, templates, "Templates fetched successfully");
    } catch (error) {
        console.error("Error fetching templates:", error);
        logger.error("❌ Server error while fetching templates");
        sendError(res, error);
    }
};

exports.getSingleTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await NotificationTemplate.findById(id)
            .populate('actionId', '-__v');

        if (!template || template.isDeleted) {
            logger.error("❌ Template not found");
            sendError(res, "Template not found", 404);
        }

        logger.info("✅ Template fetched successfully");
        sendSuccess(res, template, "Template fetched successfully");
    } catch (error) {
        console.error("Error fetching template:", error);
        logger.error("❌ Server error while fetching template");
        sendError(res, error);
    }
};

exports.softDeleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await NotificationTemplate.findById(id);
        if (!template) {
            logger.error("❌ Template not found");
            sendError(res, "Template not found", 404);
        }

        if (template.isDeleted) {
            logger.error("❌ Template already soft deleted");
            sendError(res, "Template already soft deleted", 400);
        }

        template.isDeleted = true;
        template.updated_at = Date.now();
        await template.save();

        logger.info("✅ Template soft deleted successfully");
        sendSuccess(res, template, "Template soft deleted successfully");
    } catch (error) {
        console.error("Error soft deleting template:", error);
        logger.error("❌ Server error while soft deleting template");
        sendError(res, error);
    }
};