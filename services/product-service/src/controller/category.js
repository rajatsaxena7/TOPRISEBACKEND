const Category = require("../models/category");
const redisClient = require("/packages/utils/redisClient");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Create Category
exports.createCategory = async (req, res) => {
  try {
    const {
      category_name,
      category_code,
      category_description,
      created_by,
      updated_by,
      type,
    } = req.body;

    let category_image = undefined;

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "categories"
      );
      category_image = uploaded.Location;
    }

    const newCategory = await Category.create({
      category_name,
      category_code,
      category_description,
      created_by,
      updated_by,
      type,
      category_image,
    });

    await redisClient.del("categories:all");
    logger.info(`✅ Category created: ${category_code}`);
    sendSuccess(res, newCategory, "Category created successfully");
  } catch (err) {
    logger.error(`❌ Create category error: ${err.message}`);
    sendError(res, err);
  }
};

// Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const cacheKey = "categories:all";
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info("🔁 Served categories from cache");
      return sendSuccess(res, JSON.parse(cached));
    }

    const categories = await Category.find();
    await redisClient.setEx(cacheKey, 300, JSON.stringify(categories));
    logger.info("✅ Fetched all categories from DB");
    sendSuccess(res, categories);
  } catch (err) {
    logger.error(`❌ Get all categories error: ${err.message}`);
    sendError(res, err);
  }
};

// Get Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `category:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.info(`🔁 Served category ${id} from cache`);
      return sendSuccess(res, JSON.parse(cached));
    }

    const category = await Category.findById(id);
    if (!category) return sendError(res, "Category not found", 404);

    await redisClient.setEx(cacheKey, 300, JSON.stringify(category));
    logger.info(`✅ Fetched category ${id}`);
    sendSuccess(res, category);
  } catch (err) {
    logger.error(`❌ Get category error: ${err.message}`);
    sendError(res, err);
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_name,
      category_code,
      category_description,
      category_Status,
      updated_by,
      type,
    } = req.body;

    const updateData = {
      category_name,
      category_code,
      category_description,
      category_Status,
      updated_by,
      type,
    };

    if (req.file) {
      const uploaded = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        "categories"
      );
      updateData.category_image = uploaded.Location;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCategory) return sendError(res, "Category not found", 404);

    await redisClient.del("categories:all");
    await redisClient.del(`category:${id}`);
    logger.info(`✅ Updated category: ${id}`);
    sendSuccess(res, updatedCategory, "Category updated successfully");
  } catch (err) {
    logger.error(`❌ Update category error: ${err.message}`);
    sendError(res, err);
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) return sendError(res, "Category not found", 404);

    await redisClient.del("categories:all");
    await redisClient.del(`category:${id}`);
    logger.info(`🗑️ Deleted category: ${id}`);
    sendSuccess(res, null, "Category deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete category error: ${err.message}`);
    sendError(res, err);
  }
};

exports.getLiveCategory = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = { category_Status: "Active" };
    if (type) {
      filter.type = type; // expecting type as an ObjectId string
    }

    const categories = await Category.find(filter).populate("type");

    if (!categories || categories.length === 0) {
      return sendError(res, "No live categories found", 404);
    }

    logger.info(
      `✅ Fetched ${categories.length} active categories${
        type ? ` for type ${type}` : ""
      }`
    );
    sendSuccess(res, categories, "Live categories fetched successfully");
  } catch (err) {
    logger.error(`❌ Get live categories error: ${err.message}`);
    sendError(res, err);
  }
};
exports.getCategoryByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { main_category } = req.query;

    // Build query filter
    const filter = {
      type,
      category_Status: "Active", // Assuming we only want active categories
    };

    // Add main_category filter if provided
    if (main_category !== undefined) {
      filter.main_category = main_category === "true";
    }

    // Perform query
    const categories = await Category.find(filter)
      .populate("type")
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(8);

    // Handle no results
    if (!categories || categories.length === 0) {
      const message =
        main_category !== undefined
          ? `No ${
              main_category === "true" ? "main" : "non-main"
            } categories found for type ${type}`
          : `No categories found for type ${type}`;

      return sendError(res, message, 404);
    }

    logger.info(
      `✅ Fetched ${categories.length} categories for type=${type}` +
        (main_category !== undefined
          ? ` with main_category=${main_category}`
          : "")
    );

    sendSuccess(res, categories, "Categories fetched successfully");
  } catch (err) {
    logger.error(`❌ Error fetching categories by type: ${err.message}`);
    sendError(res, err);
  }
};

exports.mapCategoriesToDealer = async (req, res) => {
  try {
    const { dealer_id, category_ids } = req.body;

    if (!Array.isArray(category_ids) || category_ids.length === 0)
      return sendError(res, "category_ids must be a non-empty array", 400);

    // ✅ Step 1: Check with user-service if dealer exists
    const dealerResponse = await fetch(
      `http://user-service:5001/api/users/dealer/${dealer_id}`
    );
    if (!dealerResponse.ok) {
      const errorText = await dealerResponse.text();
      return sendError(res, `Dealer check failed: ${errorText}`, 404);
    }

    // ✅ Step 2: Update categories in product service
    const updatedCategories = await Promise.all(
      category_ids.map(async (catId) => {
        const category = await Category.findById(catId);
        if (category) {
          category.dealer_ref = dealer_id;
          return await category.save();
        }
        return null;
      })
    );

    // ✅ Step 3: Optionally notify user-service (e.g., save assigned_categories array)
    await fetch(`http://user-service:5001/api/users/map-categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealer_id, category_ids }),
    });

    logger.info(
      `✅ Mapped ${category_ids.length} categories to dealer ${dealer_id}`
    );
    sendSuccess(
      res,
      updatedCategories.filter(Boolean),
      "Categories mapped to dealer successfully"
    );
  } catch (err) {
    logger.error(`❌ Map categories to dealer error: ${err.message}`);
    sendError(res, err);
  }
};
