const Brand = require("../models/brand");
const redisClient = require("/packages/utils/redisClient");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");

exports.createBand = async (req, res) => {
  try {
    const {
      brand_name,
      brand_description,
      brand_status,
      created_by,
      updated_by,
    } = req.body;
    let brand_image = undefined;
    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "brands"
      );
      brand_image = uploaded.Location;
    }
    const newBrand = await Brand.create({
      brand_name,
      brand_description,
      brand_status,
      created_by,
      updated_by,
      brand_image,
    });
    logger.info("✅ Brand created successfully");
  } catch (err) {
    logger.error(`❌ Create brand error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getAllBrands = async (req, res) => {
  try {
    const cacheKey = "brands:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served brands from cache");
      return sendSuccess(res, JSON.parse(cached));
    }
    const brands = await Brand.find().sort({ created_at: -1 });
    await redisClient.set(cacheKey, JSON.stringify(brands), "EX", 3600);
    logger.info("✅ Fetched all brands from database");
    return sendSuccess(res, brands, "Brands fetched successfully");
  } catch {
    logger.error(`❌ Get all brands error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getBrandbyId = async (req, res) => {
  try {
    const { brandId } = req.params;
    const cacheKey = `brand:${brandId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served brand from cache");
      return sendSuccess(res, JSON.parse(cached));
    }
    const brand = await Brand.findById(brandId);
    if (!brand) {
      logger.error(`❌ Brand not found with ID: ${brandId}`);
      return sendError(res, "Brand not found", 404);
    }
    await redisClient.set(cacheKey, JSON.stringify(brand), "EX", 3600);
    logger.info(`✅ Fetched brand with ID: ${brandId}`);
    return sendSuccess(res, brand, "Brand fetched successfully");
  } catch {
    logger.error(`❌ Get brand error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.updateBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { brand_name, brand_description, brand_status, updated_by } =
      req.body;
    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      {
        brand_name,
        brand_description,
        brand_status,
        updated_by,
      },
      { new: true }
    );
    if (!updatedBrand) {
      logger.error(`❌ Brand not found with ID: ${brandId}`);
      return sendError(res, "Brand not found", 404);
    }
  } catch (err) {
    logger.error(`❌ Update brand error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const { brandId } = req.params;
    const deletedBrand = await Brand.findByIdAndDelete(brandId);
    if (!deletedBrand) {
      logger.error(`❌ Brand not found with ID: ${brandId}`);
      return sendError(res, "Brand not found", 404);
    }
  } catch (err) {
    logger.error(`❌ Delete brand error: ${err.message}`);
    return sendError(res, err);
  }
};
