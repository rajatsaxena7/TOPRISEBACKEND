const Category = require("../models/category");
const redisClient = require("/packages/utils/redisClient");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const axios = require("axios");
const {
  createUnicastOrMulticastNotificationUtilityFunction,
} = require("../../../../packages/utils/notificationService");
const fs = require("fs");
const csv = require("csv-parser");
const jwt = require("jsonwebtoken");
const Type = require("../models/type");
const mongoose = require("mongoose");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Create Category

function inferMime(ext) {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}
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

    // await redisClient.del("categories:all");

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const created_by_user = userData.data.data.find(
      (user) => user._id === created_by
    );
    const updated_by_user = userData.data.data.find(
      (user) => user._id === updated_by
    );
    let filteredUsers = userData.data.data.filter(
      (user) =>
        user.role === "Super-admin" ||
        user.role === "Inventory-Admin" ||
        user.role === "Inventory-Staff"
    );
    let users = filteredUsers.map((user) => user._id);
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        users,
        ["INAPP", "PUSH"],
        "Category Create ALERT",
        `New Category has been created by ${created_by_user.username} - ${category_name}`,
        "",
        "",
        "Category",
        {
          category_id: newCategory._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info("🔁 Served categories from cache");
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const categories = await Category.find();
    // await redisClient.setEx(cacheKey, 300, JSON.stringify(categories));
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
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info(`🔁 Served category ${id} from cache`);
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const category = await Category.findById(id);
    if (!category) return sendError(res, "Category not found", 404);

    // await redisClient.setEx(cacheKey, 300, JSON.stringify(category));
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

    // await redisClient.del("categories:all");
    // await redisClient.del(`category:${id}`);

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });

    const updated_by_user = userData.data.data.find(
      (user) => user._id === updated_by
    );
    let filteredUsers = userData.data.data.filter(
      (user) =>
        user.role === "Super-admin" ||
        user.role === "Inventory-Admin" ||
        user.role === "Inventory-Staff"
    );
    let users = filteredUsers.map((user) => user._id);
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        users,
        ["INAPP", "PUSH"],
        "Category Updated ALERT",
        `New category has been updated by ${updated_by_user.username} - ${category_name}`,
        "",
        "",
        "Category",
        {
          category_id: updatedCategory._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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

    // await redisClient.del("categories:all");
    // await redisClient.del(`category:${id}`);

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });

    let filteredUsers = userData.data.data.filter(
      (user) =>
        user.role === "Super-admin" ||
        user.role === "Inventory-Admin" ||
        user.role === "Inventory-Staff"
    );
    let users = filteredUsers.map((user) => user._id);
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        users,
        ["INAPP", "PUSH"],
        "Category Deleted ALERT",
        `New category has been deleted`,
        "",
        "",
        "Category",
        {
          category_id: deleted._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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

exports.createBulkCategories = async (req, res) => {
  try {
    // ────────────────────── Validate payload files ──────────────────────
    const csvFile = req.files?.file?.[0];
    if (!csvFile) {
      return res
        .status(400)
        .json({ message: 'CSV file is required (field "file")' });
    }

    const imagesZipFile = req.files?.images?.[0]; // may be undefined

    // ────────────────────── Decode JWT user ────────────────────────────
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Authorization token missing" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const userIdentifier = decoded.email || decoded.username || decoded.id;

    // ────────────────────── Pre‑process images ZIP (if any) ─────────────
    /**
     * Map key   → { buf: Buffer, ext: ".jpg" }
     * key is the lower‑cased, trimmed category_name so we can look up easily.
     */
    const imageMap = new Map();
    if (imagesZipFile) {
      const zip = new AdmZip(imagesZipFile.path);
      zip.getEntries().forEach((entry) => {
        if (entry.isDirectory) return;
        const ext = path.extname(entry.entryName).toLowerCase();
        if (![".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) return;
        const key = path.basename(entry.entryName, ext).trim().toLowerCase();
        imageMap.set(key, { buf: entry.getData(), ext });
      });
    }

    // ────────────────────── Parse CSV ───────────────────────────────────
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFile.path)
        .pipe(csv())
        .on("data", (row) => rows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    // ────────────────────── Insert in transaction ──────────────────────
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const docs = [];

      for (const row of rows) {
        const typeDoc = await Type.findOne({
          type_name: row.type_name,
        }).session(session);
        if (!typeDoc) throw new Error(`Type "${row.type_name}" not found`);

        // Image resolution priority: ZIP > CSV column > model default
        let categoryImageUrl = row.category_image || undefined;
        const lookupKey = row.category_name.trim().toLowerCase();

        if (imageMap.has(lookupKey)) {
          const { buf, ext } = imageMap.get(lookupKey);
          const uploaded = await uploadFile(
            buf,
            `${row.category_name}${ext}`,
            inferMime(ext),
            "categories"
          );
          categoryImageUrl = uploaded.Location;
        }

        docs.push({
          category_name: row.category_name,
          main_category: /true/i.test(row.main_category),
          type: typeDoc._id,
          category_code: row.category_code,
          category_image: categoryImageUrl,
          category_Status: row.category_Status || "Created",
          category_description: row.category_description || "",
          created_by: userIdentifier,
          updated_by: userIdentifier,
        });
      }

      await Category.insertMany(docs, { session, ordered: false });
      await session.commitTransaction();
      session.endSession();

      // cleanup temp files
      fs.unlinkSync(csvFile.path);
      if (imagesZipFile) fs.unlinkSync(imagesZipFile.path);

      return res
        .status(201)
        .json({ message: "Categories uploaded", count: docs.length });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      fs.unlinkSync(csvFile.path);
      if (imagesZipFile) fs.unlinkSync(imagesZipFile.path);
      return res.status(400).json({ message: err.message });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
