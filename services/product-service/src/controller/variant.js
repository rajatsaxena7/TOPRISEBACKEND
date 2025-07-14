const Variant = require("../models/variantModel");
const redisClient = require("/packages/utils/redisClient");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const { uploadFile } = require("/packages/utils/s3Helper");

// Helper function to clear relevant Redis cache
const clearVariantCache = async (keys = []) => {
  try {
    const cacheKeys = keys.length ? keys : await redisClient.keys("variant:*");
    if (cacheKeys.length) {
      await redisClient.del(cacheKeys);
    }
    await redisClient.del("variants:all");
  } catch (cacheError) {
    logger.error(`Cache clearance error: ${cacheError.message}`);
  }
};

// Create a new variant
exports.createVariant = async (req, res) => {
  try {
    const {
      variant_name,
      variant_code,
      variant_Description,
      model,
      Year,
      variant_status = "active",
      created_by,
    } = req.body;

    // Validate required fields
    if (!variant_name || !variant_code || !variant_Description || !model) {
      return sendError(res, "Missing required fields", 400);
    }

    // Handle image upload

    // Create new variant
    const newVariant = await Variant.create({
      variant_name,
      variant_code,
      variant_Description,
      variant_status,
      model,
      Year: Array.isArray(Year) ? Year : [Year],
      created_by,
      updated_by: [
        {
          updated_by: created_by,
          change_logs: "Initial creation",
        },
      ],
    });

    // Clear relevant cache
    await clearVariantCache();

    logger.info(`✅ Variant ${newVariant._id} created successfully`);
    return sendSuccess(res, newVariant, "Variant created successfully", 201);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      logger.error(`❌ Duplicate ${field}: ${err.keyValue[field]}`);
      return sendError(res, `${field} already exists`, 409);
    }
    logger.error(`❌ Create variant error: ${err.message}`);
    return sendError(res, "Failed to create variant", 500);
  }
};

// Get all variants with optional filtering
exports.getAllVariants = async (req, res) => {
  try {
    const { model, status, search } = req.query;
    const cacheKey = `variants:${model || "all"}:${status || "all"}:${
      search || "all"
    }`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served variants from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    // Build query
    const query = {};
    if (model) query.model = model;
    if (status) query.variant_status = status;
    if (search) {
      query.$or = [
        { variant_name: { $regex: search, $options: "i" } },
        { variant_code: { $regex: search, $options: "i" } },
        { variant_Description: { $regex: search, $options: "i" } },
      ];
    }

    const variants = await Variant.find(query)
      .populate("model", "model_name model_code")
      .populate("Year", "year_name year_code")
      .sort({ created_at: -1 });

    // Cache results
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(variants));

    logger.info("✅ Fetched all variants from database");
    return sendSuccess(res, variants, "Variants fetched successfully");
  } catch (err) {
    logger.error(`❌ Get all variants error: ${err.message}`);
    return sendError(res, "Failed to fetch variants", 500);
  }
};

// Get variants by model ID
exports.getVariantsByModel = async (req, res) => {
  try {
    const { modelId } = req.params;
    const cacheKey = `variants:model:${modelId}`;

    // Try cache first
    if (cached) {
      logger.info(`🔁 Served variants for model ${modelId} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const variants = await Variant.find({ model: modelId })
      .populate("model", "model_name model_code")
      .populate("Year", "year_name year_code")
      .sort({ variant_name: 1 });

    if (!variants.length) {
      logger.info(`No variants found for model ${modelId}`);
      return sendSuccess(res, [], "No variants found for this model");
    }

    // Cache results

    logger.info(`✅ Fetched variants for model ${modelId}`);
    return sendSuccess(res, variants, "Variants fetched successfully");
  } catch (err) {
    logger.error(`❌ Get variants by model error: ${err.message}`);
    return sendError(res, "Failed to fetch variants by model", 500);
  }
};

// Get single variant by ID
exports.getVariantById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `variant:${id}`;

    // Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`🔁 Served variant ${id} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const variant = await Variant.findById(id)
      .populate("model", "model_name model_code")
      .populate("Year", "year_name year_code");

    if (!variant) {
      logger.error(`❌ Variant not found with ID: ${id}`);
      return sendError(res, "Variant not found", 404);
    }

    // Cache result
    await redisClient.setEx(cacheKey, 1800, JSON.stringify(variant));

    logger.info(`✅ Fetched variant ${id}`);
    return sendSuccess(res, variant, "Variant fetched successfully");
  } catch (err) {
    logger.error(`❌ Get variant error: ${err.message}`);
    return sendError(res, "Failed to fetch variant", 500);
  }
};

// Update variant
exports.updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { updated_by, change_logs, ...updateData } = req.body;

    // Find existing variant first
    const existingVariant = await Variant.findById(id);
    if (!existingVariant) {
      logger.error(`❌ Variant not found with ID: ${id}`);
      return sendError(res, "Variant not found", 404);
    }

    // Handle image update if provided
    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        `variant-${Date.now()}-${req.file.originalname}`,
        req.file.mimetype,
        "variants"
      );
      updateData.variant_image = uploaded.Location;
    }

    // Prepare update object
    const update = {
      ...updateData,
      $push: {
        updated_by: {
          updated_by,
          change_logs: change_logs || "Fields updated",
        },
      },
    };

    const updatedVariant = await Variant.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .populate("model", "model_name model_code")
      .populate("Year", "year_name year_code");

    // Clear relevant cache
    await clearVariantCache([
      `variant:${id}`,
      `variants:model:${updatedVariant.model}`,
    ]);

    logger.info(`✅ Variant ${id} updated successfully`);
    return sendSuccess(res, updatedVariant, "Variant updated successfully");
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      logger.error(`❌ Duplicate ${field}: ${err.keyValue[field]}`);
      return sendError(res, `${field} already exists`, 409);
    }
    logger.error(`❌ Update variant error: ${err.message}`);
    return sendError(res, "Failed to update variant", 500);
  }
};

// Delete variant
exports.deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;

    const variant = await Variant.findByIdAndDelete(id);
    if (!variant) {
      logger.error(`❌ Variant not found with ID: ${id}`);
      return sendError(res, "Variant not found", 404);
    }

    // Clear relevant cache
    await clearVariantCache([
      `variant:${id}`,
      `variants:model:${variant.model}`,
    ]);

    logger.info(`✅ Variant ${id} deleted successfully`);
    return sendSuccess(res, null, "Variant deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete variant error: ${err.message}`);
    return sendError(res, "Failed to delete variant", 500);
  }
};
