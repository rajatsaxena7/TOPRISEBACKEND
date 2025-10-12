const Variant = require("../models/variantModel");
const redisClient = require("/packages/utils/redisClient");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const { uploadFile } = require("/packages/utils/s3Helper");
const { cacheGet, cacheSet } = require("/packages/utils/cache"); // ⬅️ NEW
const axios = require("axios");
const { createUnicastOrMulticastNotificationUtilityFunction } = require("../../../../packages/utils/notificationService");
const XLSX = require("xlsx");
const stream = require("stream");
const path = require("path");
const unzipper = require("unzipper");
const Year = require("../models/year");
const Model = require("../models/model");
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

    // Check for duplicate variant_name or variant_code
    const existingVariant = await Variant.findOne({
      $or: [
        { variant_name: variant_name },
        { variant_code: variant_code }
      ]
    });

    if (existingVariant) {
      if (existingVariant.variant_name === variant_name) {
        logger.warn(`Duplicate variant name attempted: ${variant_name}`);
        return sendError(res, `Variant with name "${variant_name}" already exists`, 409);
      }
      if (existingVariant.variant_code === variant_code) {
        logger.warn(`Duplicate variant code attempted: ${variant_code}`);
        return sendError(res, `Variant with code "${variant_code}" already exists`, 409);
      }
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
      "Varaint Create ALERT",
      `New Variant has been created by ${created_by} - ${variant_name}`,
      "",
      "",
      "Variant",
      {
        variant_id: newVariant._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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
    const cacheKey = `variants:${model || "all"}:${status || "all"}:${search || "all"
      }`;

    // Try cache first
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info("🔁 Served variants from cache");
    //   return sendSuccess(res, JSON.parse(cached));
    // }

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
    // await redisClient.setEx(cacheKey, 3600, JSON.stringify(variants));

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

    /* 1️⃣  Try cache (uses read-only Redis client) */
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info(`🔁 variants:model:${modelId}  – served from cache`);
      return sendSuccess(res, cached);
    }

    /* 2️⃣  Hit MongoDB */
    const variants = await Variant.find({ model: modelId })
      .populate("model", "model_name model_code")
      // .populate("year_range", "year_name year_code") // adjust field → schema
      .sort({ variant_name: 1 })
      .lean(); // lean ⇒ smaller doc

    /* 3️⃣  Nothing?  Return empty list, still 200 OK */
    if (!variants.length) {
      logger.info(`ℹ️ No variants for model ${modelId}`);
      return sendSuccess(res, [], "No variants found for this model");
    }

    /* 4️⃣  Cache the fresh list (writer client) – 1 h TTL */
    await cacheSet(cacheKey, variants, 60 * 60);

    logger.info(`✅ variants:model:${modelId}  – fetched from Mongo`);
    return sendSuccess(res, variants, "Variants fetched successfully");
  } catch (err) {
    logger.error(`❌ getVariantsByModel: ${err.message}`);
    return sendError(res, err); // sendError already sets 500
  }
};

// Get single variant by ID
exports.getVariantById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `variant:${id}`;

    // Try cache first
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info(`🔁 Served variant ${id} from cache`);
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const variant = await Variant.findById(id)
      .populate("model", "model_name model_code")
      .populate("Year", "year_name year_code");

    if (!variant) {
      logger.error(`❌ Variant not found with ID: ${id}`);
      return sendError(res, "Variant not found", 404);
    }

    // Cache result
    // await redisClient.setEx(cacheKey, 1800, JSON.stringify(variant));

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
      "Varaint Update ALERT",
      `Variat has been updaed by ${updated_by} - ${updatedVariant.variant_name}`,
      "",
      "",
      "Variant",
      {
        variant_id: updatedVariant._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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
      "Varaint Delete ALERT",
      `Variat has been Deleted`,
      "",
      "",
      "Variant",
      {
        variant_id: variant._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`✅ Variant ${id} deleted successfully`);
    return sendSuccess(res, null, "Variant deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete variant error: ${err.message}`);
    return sendError(res, "Failed to delete variant", 500);
  }
};

async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

exports.bulkUploadVariants = async (req, res) => {
  try {
    const excelBuf = req.files?.dataFile?.[0]?.buffer;
    const zipBuf = req.files?.imageZip?.[0]?.buffer;
    if (!excelBuf || !zipBuf) {
      return sendError(res, "Both dataFile & imageZip are required", 400);
    }

    // 1️⃣ Parse CSV
    const wb = XLSX.read(excelBuf, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    if (!rows.length) {
      return sendError(res, "No data found in CSV", 400);
    }

    // 2️⃣ Upload images from ZIP to S3
    const imageMap = {}; // variant_code.toLowerCase() → S3 URL
    let totalZip = 0, imgOk = 0, imgSkip = 0, imgFail = 0;
    const zipStream = stream.Readable.from(zipBuf).pipe(
      unzipper.Parse({ forceStream: true })
    );

    for await (const entry of zipStream) {
      totalZip++;
      if (entry.type === "Directory") {
        imgSkip++;
        entry.autodrain();
        continue;
      }
      const base = path.basename(entry.path);
      const m = base.match(/^(.+?)\.(jpe?g|png|webp)$/i);
      if (!m) {
        imgSkip++;
        entry.autodrain();
        continue;
      }
      const key = m[1].toLowerCase();
      const mime = `image/${m[2].toLowerCase() === "jpg" ? "jpeg" : m[2].toLowerCase()}`;
      try {
        const buf = await streamToBuffer(entry);
        const { Location } = await uploadFile(buf, base, mime, "variant-images");
        imageMap[key] = Location;
        imgOk++;
      } catch (e) {
        imgFail++;
        console.error(`Image upload failed for ${base}:`, e.message);
      }
    }

    // 3️⃣ Prepare model name → _id map
    const uniqModels = [...new Set(rows.map(r => String(r.model_name || "").trim()).filter(Boolean))];
    const modelDocs = await Model.find({ model_name: { $in: uniqModels } });
    const modelMap = new Map(modelDocs.map(m => [m.model_name.trim().toLowerCase(), m._id]));

    // 4️⃣ Prepare year name → _id map
    const uniqYears = [
      ...new Set(
        rows
          .flatMap(r => String(r.Year || "").split(",").map(y => y.trim()))
          .filter(Boolean)
      )
    ];
    const yearDocs = await Year.find({ year_name: { $in: uniqYears } });
    const yearMap = new Map(yearDocs.map(y => [y.year_name.trim().toLowerCase(), y._id]));

    // 5️⃣ Build docs
    const docs = [];
    const errors = [];
    for (const row of rows) {
      const modelId = modelMap.get(String(row.model_name || "").trim().toLowerCase());
      if (!modelId) {
        errors.push({ variant_code: row.variant_code, error: `Unknown model: ${row.model_name}` });
        continue;
      }

      const yearIds = String(row.Year || "")
        .split(",")
        .map(y => y.trim().toLowerCase())
        .map(y => yearMap.get(y))
        .filter(Boolean);

      if (!yearIds.length && row.Year) {
        errors.push({ variant_code: row.variant_code, error: `No valid years found: ${row.Year}` });
        continue;
      }

      docs.push({
        variant_name: row.variant_name,
        variant_code: row.variant_code,
        Year: yearIds,
        model: modelId,
        created_by: row.created_by || "system",
        variant_image: imageMap[row.variant_code.toLowerCase()] || "",
        variant_status: row.variant_status || "active",
        variant_Description: row.variant_Description || "",
      });
    }

    if (!docs.length) {
      return sendError(res, "No valid variants to insert", 400);
    }

    // 6️⃣ Insert
    const inserted = await Variant.insertMany(docs, { ordered: false });
    return sendSuccess(res, {
      totalRows: rows.length,
      inserted: inserted.length,
      imgSummary: { total: totalZip, ok: imgOk, skip: imgSkip, fail: imgFail },
      errors
    }, "Variants bulk uploaded successfully");
  } catch (err) {
    console.error("Bulk upload variants error:", err);
    return sendError(res, err.message, 500);
  }
};

// ✅ GET VARIANT COUNT
exports.getVariantCount = async (req, res) => {
  try {
    const { variant_status, model } = req.query;

    logger.info(`📊 Fetching variant count with filters - variant_status: ${variant_status}, model: ${model}`);

    // Build filter
    const filter = {};
    if (variant_status) {
      filter.variant_status = variant_status;
    }
    if (model) {
      filter.model = model;
    }

    logger.info(`🔍 Variant filter applied:`, JSON.stringify(filter, null, 2));

    // Get total count
    const totalCount = await Variant.countDocuments(filter);

    // Get count by status
    const statusBreakdown = await Variant.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$variant_status",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get count by model
    const modelBreakdown = await Variant.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$model",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get count by year (from Year array)
    const yearBreakdown = await Variant.aggregate([
      { $match: filter },
      { $unwind: "$Year" },
      {
        $group: {
          _id: "$Year",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const response = {
      summary: {
        totalVariants: totalCount
      },
      breakdown: {
        byStatus: statusBreakdown.map(item => ({
          status: item._id || 'Unknown',
          count: item.count,
          percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
        })),
        byModel: modelBreakdown.map(item => ({
          model: item._id,
          count: item.count,
          percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
        })),
        byYear: yearBreakdown.map(item => ({
          year: item._id,
          count: item.count,
          percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
        }))
      },
      filters: {
        variant_status: variant_status || null,
        model: model || null
      },
      generatedAt: new Date()
    };

    logger.info(`✅ Variant count fetched successfully - Total variants: ${totalCount}`);
    sendSuccess(res, response, "Variant count fetched successfully");

  } catch (error) {
    logger.error("❌ Get variant count failed:", error);
    sendError(res, "Failed to get variant count", 500);
  }
};