const PopularVehicle = require("../models/popularVehicle");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const mongoose = require("mongoose");

exports.createPopularVehicle = async (req, res, next) => {
  try {
    const { vehicle_name, brand_id, variant_id, model_id, vehicle_type } =
      req.body;

    if (
      !vehicle_name ||
      !brand_id ||
      !variant_id ||
      !model_id ||
      !vehicle_type
    ) {
      logger.error("Missing required fields");
      sendError(res, "Missing required fields", 400);
      return;
    }
    // if ((await PopularVehicle.countDocuments()) > 0) {
      const existingVehicle = await PopularVehicle.findOne({ vehicle_name });
      if (existingVehicle) {
        logger.error("Vehicle with this name already exists");
        sendError(res, "Vehicle with this name already exists", 400);
        return;
      }
    // }

    let vehicle_image = null;
    if (req.file) {
      const result = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "popular-vehicles"
      );
      vehicle_image = result.Location;
    }

    const popularVehicle = new PopularVehicle({
      vehicle_name,
      vehicle_image,
      brand_id,
      variant_id,
      model_id,
      vehicle_type,
    });

    await popularVehicle.save();

    logger.info("Popular vehicle created successfully");
    sendSuccess(res, popularVehicle, "Popular vehicle created successfully");
  } catch (error) {
    logger.error(`Create popular vehicle error: ${error.message}`);
    sendError(res, error);
  }
};

exports.getAllPopularVehicles = async (req, res, next) => {
  try {
    const { brand_id, variant_id, model_id, vehicle_type, search } = req.query;
    const filter = {};

    if (brand_id) filter.brand_id = brand_id;
    if (variant_id) filter.variant_id = variant_id;
    if (model_id) filter.model_id = model_id;
    if (vehicle_type) filter.vehicle_type = vehicle_type;

    if (search) {
      filter.$or = [{ vehicle_name: { $regex: search, $options: "i" } }];
    }

    const popularVehicles = await PopularVehicle.find(filter)
      .populate("brand_id")
      .populate("variant_id")
      .populate("model_id")
      .populate("vehicle_type");

    logger.info("Popular vehicles fetched successfully");
    sendSuccess(res, popularVehicles, "Popular vehicles fetched successfully");
  } catch (error) {
    logger.error(`Get all popular vehicles error: ${error.message}`);
    sendError(res, error);
  }
};

exports.getPopularVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const popularVehicle = await PopularVehicle.findById(id)
      .populate("brand_id")
      .populate("variant_id")
      .populate("model_id")
      .populate("vehicle_type");

    if (!popularVehicle) {
      logger.error("Popular vehicle not found");
      return sendError(res, "Popular vehicle not found", 404);
    }

    logger.info("Popular vehicle fetched successfully");
    sendSuccess(res, popularVehicle, "Popular vehicle fetched successfully");
  } catch (error) {
    logger.error(`Get popular vehicle by ID error: ${error.message}`);
    sendError(res, error);
  }
};

exports.updatePopularVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vehicle_name, brand_id, variant_id, model_id, vehicle_type } =
      req.body;

    const popularVehicle = await PopularVehicle.findById(id);
    if (!popularVehicle) {
      logger.error("Popular vehicle not found");
      return sendError(res, "Popular vehicle not found", 404);
    }

    if (vehicle_name && vehicle_name !== popularVehicle.vehicle_name) {
      const existingVehicle = await PopularVehicle.findOne({ vehicle_name });
      if (existingVehicle) {
        logger.error("Vehicle with this name already exists");
        return sendError(res, "Vehicle with this name already exists", 400);
      }
    }

    let vehicle_image = popularVehicle.vehicle_image;
    if (req.file) {
      const result = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "popular-vehicles"
      );
      vehicle_image = result.Location;
    }

    const updatedVehicle = await PopularVehicle.findByIdAndUpdate(
      id,
      {
        vehicle_name: vehicle_name || popularVehicle.vehicle_name,
        vehicle_image,
        brand_id: brand_id || popularVehicle.brand_id,
        variant_id: variant_id || popularVehicle.variant_id,
        model_id: model_id || popularVehicle.model_id,
        vehicle_type: vehicle_type || popularVehicle.vehicle_type,
      },
      { new: true, runValidators: true }
    )
      .populate("brand_id")
      .populate("variant_id")
      .populate("model_id")
      .populate("vehicle_type");

    logger.info("Popular vehicle updated successfully");
    sendSuccess(res, updatedVehicle, "Popular vehicle updated successfully");
  } catch (error) {
    logger.error(`Update popular vehicle error: ${error.message}`);
    sendError(res, error);
  }
};

exports.deletePopularVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const popularVehicle = await PopularVehicle.findByIdAndDelete(id);

    if (!popularVehicle) {
      logger.error("Popular vehicle not found");
      return sendError(res, "Popular vehicle not found", 404);
    }


    logger.info("Popular vehicle deleted successfully");
    sendSuccess(res, popularVehicle, "Popular vehicle deleted successfully");
  } catch (error) {
    logger.error(`Delete popular vehicle error: ${error.message}`);
    sendError(res, error);
  }
};
