const Model = require("../models/model");
const Brand = require("../models/brand");
const { uploadFile } = require("/packages/utils/s3Helper");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

// ✅ Create Model
exports.createModel = async (req, res) => {
  try {
    const {
      model_name,
      model_code,
      brand_ref,
      created_by,
      updated_by,
      status,
    } = req.body;

    let model_image;
    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "models"
      );
      model_image = uploaded.Location;
    } else {
      return sendErrorResponse(res, "Model image is required", 400);
    }

    const newModel = await Model.create({
      model_name,
      model_code,
      brand_ref,
      model_image,
      created_by,
      updated_by,
      status,
    });

    logger.info("✅ Model created successfully");
    return sendSuccess(res, newModel, "Model created successfully");
  } catch (err) {
    logger.error(`❌ Create model error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Get All Models
exports.getAllModel = async (req, res) => {
  try {
    const models = await Model.find()
      .populate("brand_ref")
      .sort({ created_at: -1 });
    logger.info("✅ Fetched all models");
    return sendSuccess(res, models, "Models fetched successfully");
  } catch (err) {
    logger.error(`❌ Get all models error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Update Model
exports.updateModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const { model_name, model_code, brand_ref, updated_by, status } = req.body;

    const updateData = {
      model_name,
      model_code,
      brand_ref,
      updated_by,
      status,
      updated_at: new Date(),
    };

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "models"
      );
      updateData.model_image = uploaded.Location;
    }

    const updatedModel = await Model.findByIdAndUpdate(modelId, updateData, {
      new: true,
    });

    if (!updatedModel) return sendErrorResponse(res, "Model not found", 404);

    logger.info(`✅ Model updated: ${modelId}`);
    return sendSuccess(res, updatedModel, "Model updated successfully");
  } catch (err) {
    logger.error(`❌ Update model error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Delete Model
exports.deleteModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const deleted = await Model.findByIdAndDelete(modelId);

    if (!deleted) return sendErrorResponse(res, "Model not found", 404);

    logger.info(`🗑️ Deleted model: ${modelId}`);
    return sendSuccess(res, null, "Model deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete model error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Get Models By Brand
exports.getModelByBrands = async (req, res) => {
  try {
    const { brandId } = req.params;

    const models = await Model.find({ brand_ref: brandId }).populate(
      "brand_ref"
    );

    if (!models || models.length === 0) {
      logger.error(`❌ No models found for brand ID: ${brandId}`);
      return sendError(res, "No models found for this brand", 404);
    }

    logger.info(`✅ Fetched models by brand ID: ${brandId}`);
    return sendSuccess(res, models, "Models fetched successfully");
  } catch (err) {
    logger.error(`❌ Get models by brand error: ${err.message}`);
    return sendError(res, err);
  }
};
