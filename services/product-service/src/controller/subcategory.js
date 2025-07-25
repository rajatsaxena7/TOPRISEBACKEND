const Subcategory = require("../models/subCategory");
const redisClient = require("/packages/utils/redisClient");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const axios = require("axios");
const { createUnicastOrMulticastNotificationUtilityFunction } = require("../../../../packages/utils/notificationService");

// Create SubCategory
exports.createSubCategory = async (req, res) => {
  try {
    const {
      subcategory_name,
      subcategory_code,
      subcategory_description,
      subcategory_status,
      created_by,
      updated_by,
      category_ref,
    } = req.body;

    let subcategory_image = undefined;

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "subcategories"
      );
      subcategory_image = uploaded.Location; // ✅ Fix: Extract only the URL string
    }

    const newSubCategory = await Subcategory.create({
      subcategory_name,
      subcategory_code,
      subcategory_description,
      subcategory_status,
      created_by,
      updated_by,
      category_ref,
      subcategory_image,
    });

    // await redisClient.del("subcategories:all");

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization
      }
    })
    const created_byUser = userData.data.data.find(user => user._id === created_by);
    let filteredUsers = userData.data.data.filter(user => user.role === "Super-admin" || user.role === "Inventory-Admin" || user.role === "Inventory-Staff");
    let users = filteredUsers.map(user => user._id);
    const successData = await createUnicastOrMulticastNotificationUtilityFunction(
      users,
      ["INAPP", "PUSH"],
      "SubCategory Create ALERT",
      `New SubCategory has been created by ${created_byUser.username || ""} - ${subcategory_name}`,
      "",
      "",
      "SubCategory",
      {
        subcategory_id: newSubCategory._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }
    logger.info(`✅ SubCategory created: ${subcategory_code}`);
    sendSuccess(res, newSubCategory, "SubCategory created successfully");
  } catch (err) {
    logger.error(`❌ Create subcategory error: ${err.message}`);
    sendError(res, err);
  }
};

// Get All SubCategories
exports.getAllSubCategories = async (req, res) => {
  try {
    const cacheKey = "subcategories:all";
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info("🔁 Served subcategories from cache");
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const subcategories = await Subcategory.find().populate("category_ref");
    // await redisClient.setEx(cacheKey, 300, JSON.stringify(subcategories));
    logger.info("✅ Fetched all subcategories from DB");
    sendSuccess(res, subcategories);
  } catch (err) {
    logger.error(`❌ Get all subcategories error: ${err.message}`);
    sendError(res, err);
  }
};

exports.getSubCategorybyCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const subcategories = await Subcategory.find({ category_ref: id }).populate(
      "category_ref"
    );
    logger.info("✅ Fetched all subcategories from DB");
    sendSuccess(res, subcategories);
  } catch (err) {
    logger.error(`❌ Get all subcategories error: ${err.message}`);
    sendError(res, err);
  }
};
// Get SubCategory by ID
exports.getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `subcategory:${id}`;
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info(`🔁 Served subcategory ${id} from cache`);
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const subcategory = await Subcategory.findById(id).populate("category_ref");
    if (!subcategory) return sendError(res, "SubCategory not found", 404);

    // await redisClient.setEx(cacheKey, 300, JSON.stringify(subcategory));
    logger.info(`✅ Fetched subcategory ${id}`);
    sendSuccess(res, subcategory);
  } catch (err) {
    logger.error(`❌ Get subcategory error: ${err.message}`);
    sendError(res, err);
  }
};

// Update SubCategory
exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      subcategory_name,
      subcategory_code,
      subcategory_description,
      subcategory_status,
      updated_by,
      category_ref,
    } = req.body;

    const updateData = {
      subcategory_name,
      subcategory_code,
      subcategory_description,
      subcategory_status,
      updated_by,
      category_ref,
      updated_at: new Date(),
    };

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "subcategories"
      );
      updateData.subcategory_image = uploaded;
    }

    const updated = await Subcategory.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) return sendError(res, "SubCategory not found", 404);

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization
      }
    })
    const created_byUser = userData.data.data.find(user => user._id === updated_by);
    let filteredUsers = userData.data.data.filter(user => user.role === "Super-admin" || user.role === "Inventory-Admin" || user.role === "Inventory-Staff");
    let users = filteredUsers.map(user => user._id);
    const successData = await createUnicastOrMulticastNotificationUtilityFunction(
      users,
      ["INAPP", "PUSH"],
      "SubCategory Update ALERT",
      `SubCategory has been updated by ${created_byUser.username || ""} - ${subcategory_name}`,
      "",
      "",
      "SubCategory",
      {
        subcategory_id: updateData._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    // await redisClient.del("subcategories:all");
    // await redisClient.del(`subcategory:${id}`);
    logger.info(`✅ Updated subcategory: ${id}`);
    sendSuccess(res, updated, "SubCategory updated successfully");
  } catch (err) {
    logger.error(`❌ Update subcategory error: ${err.message}`);
    sendError(res, err);
  }
};

// Delete SubCategory
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subcategory.findByIdAndDelete(id);
    if (!deleted) return sendError(res, "SubCategory not found", 404);

    // await redisClient.del("subcategories:all");
    // await redisClient.del(`subcategory:${id}`);

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization
      }
    })
    let filteredUsers = userData.data.data.filter(user => user.role === "Super-admin" || user.role === "Inventory-Admin" || user.role === "Inventory-Staff");
    let users = filteredUsers.map(user => user._id);
    const successData = await createUnicastOrMulticastNotificationUtilityFunction(
      users,
      ["INAPP", "PUSH"],
      "SubCategory Delete ALERT",
      `SubCategory has been deletd  ${deleted.subcategory_name}`,
      "",
      "",
      "SubCategory",
      {
        subcategory_id: deleted._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }
    logger.info(`🗑️ Deleted subcategory: ${id}`);
    sendSuccess(res, null, "SubCategory deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete subcategory error: ${err.message}`);
    sendError(res, err);
  }
};

// Get Live (Active) SubCategories
exports.getLiveSubCategory = async (req, res) => {
  try {
    const subcategories = await Subcategory.find({
      subcategory_status: "Active",
    });
    if (!subcategories || subcategories.length === 0)
      return sendError(res, "No active subcategories found", 404);

    logger.info("✅ Fetched live subcategories");
    sendSuccess(res, subcategories);
  } catch (err) {
    logger.error(`❌ Get live subcategories error: ${err.message}`);
    sendError(res, err);
  }
};
