const Brand = require("../models/brand");
const redisClient = require("/packages/utils/redisClient");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");

// ✅ CREATE BRAND
exports.createBrand = async (req, res) => {
  try {
    const {
      brand_name,
      brand_code,
      type,
      created_by,
      updated_by,
      status,
      preview_video,
    } = req.body;

    let brand_logo = undefined;

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "brands"
      );
      brand_logo = uploaded.Location;
    }

    const newBrand = await Brand.create({
      brand_name,
      brand_code,
      type,
      created_by,
      updated_by,
      brand_logo,
      preview_video,
      status,
    });

    await redisClient.del("brands:all");
    logger.info("✅ Brand created successfully");
    sendSuccess(res, newBrand, "Brand created successfully");
  } catch (err) {
    logger.error(`❌ Create brand error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ GET ALL BRANDS
exports.getAllBrands = async (req, res) => {
  try {
    const cacheKey = "brands:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served brands from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    const brands = await Brand.find().populate("type").sort({ created_at: -1 });
    await redisClient.set(cacheKey, JSON.stringify(brands), "EX", 3600);
    logger.info("✅ Fetched all brands");
    sendSuccess(res, brands);
  } catch (err) {
    logger.error(`❌ Get all brands error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ GET BRAND BY ID
exports.getBrandById = async (req, res) => {
  try {
    const { brandId } = req.params;
    const cacheKey = `brand:${brandId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`🔁 Served brand ${brandId} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const brand = await Brand.findById(brandId).populate(
      "type created_by updated_by"
    );
    if (!brand) return sendError(res, "Brand not found", 404);

    await redisClient.set(cacheKey, JSON.stringify(brand), "EX", 3600);
    logger.info(`✅ Fetched brand with ID: ${brandId}`);
    sendSuccess(res, brand);
  } catch (err) {
    logger.error(`❌ Get brand error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ UPDATE BRAND
exports.updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const {
      brand_name,
      brand_code,
      brand_description,
      status,
      updated_by,
      preview_video,
    } = req.body;

    const updateData = {
      brand_name,
      brand_code,
      brand_description,
      status,
      updated_by,
      preview_video,
      updated_at: new Date(),
    };

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "brands"
      );
      updateData.brand_logo = uploaded.Location;
    }

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updateData, {
      new: true,
    });

    if (!updatedBrand) return sendError(res, "Brand not found", 404);

    await redisClient.del("brands:all");
    await redisClient.del(`brand:${brandId}`);
    logger.info(`✅ Brand updated: ${brandId}`);
    sendSuccess(res, updatedBrand, "Brand updated successfully");
  } catch (err) {
    logger.error(`❌ Update brand error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ DELETE BRAND
exports.deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const deleted = await Brand.findByIdAndDelete(brandId);

    if (!deleted) return sendError(res, "Brand not found", 404);

    await redisClient.del("brands:all");
    await redisClient.del(`brand:${brandId}`);
    logger.info(`🗑️ Deleted brand: ${brandId}`);
    sendSuccess(res, null, "Brand deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete brand error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ GET BRANDS BY TYPE
exports.getBrandsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const cacheKey = `brands:type:${type}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served brands by type from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    const brands = await Brand.find({ type }).populate("type");
    if (!brands || brands.length === 0) {
      logger.error(`❌ No brands found for type: ${type}`);
      return sendError(res, "No brands found for this type", 404);
    }

    await redisClient.set(cacheKey, JSON.stringify(brands), "EX", 3600);
    logger.info(`✅ Fetched brands by type: ${type}`);
    sendSuccess(res, brands);
  } catch (err) {
    logger.error(`❌ Get brands by type error: ${err.message}`);
    return sendError(res, err);
  }
};
