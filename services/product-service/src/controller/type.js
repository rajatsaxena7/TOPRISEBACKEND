const Type = require("../models/type");
const redisClient = require("/packages/utils/redisClient");
const { uploadFile } = require("/packages/utils/s3Helper");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

// 🔹 CREATE Type
exports.createType = async (req, res) => {
  try {
    const { type_name, type_code, created_by, updated_by } = req.body;

    let image = undefined;
    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "types"
      );
      image = uploaded.Location;
    }

    const newType = await Type.create({
      type_name,
      type_code,
      image,
      created_by,
      updated_by,
    });

    await redisClient.del("types:all");
    logger.info(`✅ Type created: ${type_code}`);
    sendSuccess(res, newType, "Type created successfully");
  } catch (err) {
    logger.error(`❌ Create Type error: ${err.message}`);
    sendError(res, err);
  }
};

// 🔹 GET ALL Types (with Redis)
exports.getAllTypes = async (req, res) => {
  try {
    const cacheKey = "types:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served types from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    const types = await Type.find();
    await redisClient.setEx(cacheKey, 300, JSON.stringify(types));
    logger.info("✅ Fetched all types");
    sendSuccess(res, types);
  } catch (err) {
    logger.error(`❌ Get all types error: ${err.message}`);
    sendError(res, err);
  }
};

// 🔹 GET Type by ID
exports.getTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `type:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`🔁 Served type ${id} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const type = await Type.findById(id);
    if (!type) return sendError(res, "Type not found", 404);

    await redisClient.setEx(cacheKey, 300, JSON.stringify(type));
    logger.info(`✅ Fetched type: ${id}`);
    sendSuccess(res, type);
  } catch (err) {
    logger.error(`❌ Get type by ID error: ${err.message}`);
    sendError(res, err);
  }
};

// 🔹 UPDATE Type
exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name, type_code, updated_by } = req.body;

    const updateData = {
      type_name,
      type_code,
      updated_by,
      updated_at: new Date(),
    };

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "types"
      );
      updateData.image = uploaded.Location;
    }

    const updatedType = await Type.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedType) return sendError(res, "Type not found", 404);

    await redisClient.del("types:all");
    await redisClient.del(`type:${id}`);
    logger.info(`✅ Updated type: ${id}`);
    sendSuccess(res, updatedType, "Type updated successfully");
  } catch (err) {
    logger.error(`❌ Update type error: ${err.message}`);
    sendError(res, err);
  }
};

// 🔹 DELETE Type
exports.deleteType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Type.findByIdAndDelete(id);

    if (!deleted) return sendError(res, "Type not found", 404);

    await redisClient.del("types:all");
    await redisClient.del(`type:${id}`);
    logger.info(`🗑️ Deleted type: ${id}`);
    sendSuccess(res, null, "Type deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete type error: ${err.message}`);
    sendError(res, err);
  }
};
