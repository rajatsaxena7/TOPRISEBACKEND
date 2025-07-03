const Variant = require("../model/variant");
const redisClient = require("/packages/utils/redis");
const logger = require("/packages/utils/logger");
const {
  sendSuccess,
  sendError,
} = require("./packages/utils/responseHandler");
const { uploadFile } = require("/packages/utils/s3Helper");

exports.createVariant = async (req, res) => {
  try {
    const {
      variant_name,
      variant_code,
      variant_Description,
      variant_status,
      created_by,
      updated_by,
    } = req.body;

    let variant_image = undefined;
    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "variants"
      );
      variant_image = uploaded.Location;
    }

    const newVariant = await Variant.create({
      variant_name,
      variant_code,
      variant_Description,
      variant_status,
      created_by,
      updated_by,
      variant_image,
    });

    logger.info("✅ Variant created successfully");
    return sendSuccess(res, newVariant, "Variant created successfully");
  } catch {
    logger.error(`❌ Create variant error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getAllVariants = async (req, res) => {
  try {
    const cacheKey = "variants:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served variants from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    const variants = await Variant.find().sort({ created_at: -1 });
    await redisClient.set(cacheKey, JSON.stringify(variants), "EX", 3600);
    logger.info("✅ Fetched all variants from database");
    return sendSuccess(res, variants, "Variants fetched successfully");
  } catch (err) {
    logger.error(`❌ Get all variants error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getVariantById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `variant:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`🔁 Served variant ${id} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const variant = await Variant.findById(id);
    if (!variant) return sendError(res, "Variant not found", 404);

    await redisClient.setEx(cacheKey, 300, JSON.stringify(variant));
    logger.info(`✅ Fetched variant ${id}`);
    sendSuccess(res, variant);
  } catch (err) {
    logger.error(`❌ Get variant error: ${err.message}`);
    sendError(res, err);
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      variant_name,
      variant_code,
      variant_Description,
      variant_status,
      updated_by,
    } = req.body;

    const updatedVariant = await Variant.findByIdAndUpdate(
      id,
      {
        variant_name,
        variant_code,
        variant_Description,
        variant_status,
        updated_by,
      },
      { new: true }
    );
    if (!updatedVariant) {
      logger.error(`❌ Variant not found with ID: ${id}`);
      return sendError(res, "Variant not found", 404);
    }
    logger.info(`✅ Variant ${id} updated successfully`);
    return sendSuccess(res, updatedVariant, "Variant updated successfully");
  } catch (err) {
    logger.error(`❌ Update variant error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedVariant = await Variant.findByIdAndDelete(id);
    if (!deletedVariant) {
      logger.error(`❌ Variant not found with ID: ${id}`);
      return sendError(res, "Variant not found", 404);
    }
    logger.info(`✅ Variant ${id} deleted successfully`);
    return sendSuccess(res, null, "Variant deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete variant error: ${err.message}`);
    return sendError(res, err);
  }
};


