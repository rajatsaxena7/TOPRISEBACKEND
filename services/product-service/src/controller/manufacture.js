const Manufacturer = require("../models/manufacturer");

const redisClient = require("../../../../packages/utils/redisClient");
const { sendSuccess, sendError } = require("../../../../packages/utils/responseHandler");
const logger = require("../../../../packages/utils/logger");
const { uploadFile } = require("../../../../packages/utils/s3Helper");

exports.createManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.create(req.body);
    sendSuccess(res, manufacturer);
    logger.info("✅ Manufacturer created successfully");
  } catch {
    logger.error(`❌ Create manufacturer error: ${err.message}`);
    sendError(res, err);
  }
};
exports.getAllManufacturers = async (req, res) => {
  try {
    const cacheKey = "manufacturers:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served manufacturers from cache");
      return sendSuccess(res, JSON.parse(cached));
    }
    const manufacturers = await Manufacturer.find().sort({ created_at: -1 });
    await redisClient.set(cacheKey, JSON.stringify(manufacturers), "EX", 3600);
    logger.info("✅ Fetched all manufacturers from database");
    return sendSuccess(
      res,
      manufacturers,
      "Manufacturers fetched successfully"
    );
  } catch (err) {
    logger.error(`❌ Get all manufacturers error: ${err.message}`);
    return sendError(res, err);
  }
};
exports.getManufacturerById = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.params.id);
    if (!manufacturer) {
      return sendError(res, "Manufacturer not found", 404);
    }
    return sendSuccess(res, manufacturer, "Manufacturer fetched successfully");
  } catch (err) {
    logger.error(`❌ Get manufacturer by ID error: ${err.message}`);
    return sendError(res, err);
  }
};
exports.updateManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!manufacturer) {
      return sendError(res, "Manufacturer not found", 404);
    }
    return sendSuccess(res, manufacturer, "Manufacturer updated successfully");
  } catch {
    logger.error(`❌ Update manufacturer error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.deleteManufacturer = async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByIdAndDelete(req.params.id);
    if (!manufacturer) {
      return sendError(res, "Manufacturer not found", 404);
    }
    return sendSuccess(res, null, "Manufacturer deleted successfully");
  } catch {
    logger.error(`❌ Delete manufacturer error: ${err.message}`);
    return sendError(res, err);
  }
};
