const Subcategory = require("../models/subCategory");
const redisClient = require("/packages/utils/redisClient");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const axios = require("axios");
const {
  createUnicastOrMulticastNotificationUtilityFunction,
} = require("../../../../packages/utils/notificationService");
const XLSX = require("xlsx");
const stream = require("stream");
const path = require("path");
const unzipper = require("unzipper");
const Category = require("../models/category");
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
        Authorization: req.headers.authorization,
      },
    });
    const created_byUser = userData.data.data.find(
      (user) => user._id === created_by
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
        "SubCategory Create ALERT",
        `New SubCategory has been created by ${created_byUser.username || ""
        } - ${subcategory_name}`,
        "",
        "",
        "SubCategory",
        {
          subcategory_id: newSubCategory._id,
        },
        req.headers.authorization
      );
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
        Authorization: req.headers.authorization,
      },
    });
    const created_byUser = userData.data.data.find(
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
        "SubCategory Update ALERT",
        `SubCategory has been updated by ${created_byUser.username || ""
        } - ${subcategory_name}`,
        "",
        "",
        "SubCategory",
        {
          subcategory_id: updateData._id,
        },
        req.headers.authorization
      );
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
        "SubCategory Delete ALERT",
        `SubCategory has been deletd  ${deleted.subcategory_name}`,
        "",
        "",
        "SubCategory",
        {
          subcategory_id: deleted._id,
        },
        req.headers.authorization
      );
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

async function streamToBuffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

exports.bulkUploadSubCategories = async (req, res) => {
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
    const imageMap = {}; // subcategory_code.toLowerCase() → S3 URL
    let totalZip = 0,
      imgOk = 0,
      imgSkip = 0,
      imgFail = 0;
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
      const mime = `image/${m[2].toLowerCase() === "jpg" ? "jpeg" : m[2].toLowerCase()
        }`;
      try {
        const buf = await streamToBuffer(entry);
        const { Location } = await uploadFile(
          buf,
          base,
          mime,
          "subcategory-images"
        );
        imageMap[key] = Location;
        imgOk++;
      } catch (e) {
        imgFail++;
        console.error(`Image upload failed for ${base}:`, e.message);
      }
    }

    // 3️⃣ Prepare category_name → _id map
    const uniqCategories = [
      ...new Set(
        rows.map((r) => String(r.category_name || "").trim()).filter(Boolean)
      ),
    ];
    const categoryDocs = await Category.find({
      category_name: { $in: uniqCategories },
    });
    const categoryMap = new Map(
      categoryDocs.map((c) => [c.category_name.trim().toLowerCase(), c._id])
    );

    // 4️⃣ Build docs
    const docs = [];
    const errors = [];
    for (const row of rows) {
      const categoryId = categoryMap.get(
        String(row.category_name || "")
          .trim()
          .toLowerCase()
      );
      if (!categoryId) {
        errors.push({
          subcategory_code: row.subcategory_code,
          error: `Unknown category: ${row.category_name}`,
        });
        continue;
      }
      const created_by = await axios.get(
        `http://user-service:5001/api/users/get/userBy/Email/${row.created_by}`,
        {
          headers: {
            Authorization: `${req.headers.authorization}`,
          },
        }
      );
      const updated_by = await axios.get(
        `http://user-service:5001/api/users/get/userBy/Email/${row.updated_by}`,
        {
          headers: {
            Authorization: `${req.headers.authorization}`,
          },
        }
      );

      docs.push({
        subcategory_name: row.subcategory_name,
        subcategory_code: row.subcategory_code,
        subcategory_status: row.subcategory_status || "Created",
        subcategory_image:
          imageMap[row.subcategory_code.toLowerCase()] ||
          row.subcategory_image ||
          "https://example.com/default-subcategory-image.png",
        subcategory_description: row.subcategory_description || "",
        created_by: created_by.data._id || "system",
        updated_by: updated_by.data._id || "system",
        category_ref: categoryId,
      });
    }

    if (!docs.length) {
      return sendError(res, "No valid subcategories to insert", 400);
    }

    // 5️⃣ Insert into DB
    const inserted = await Subcategory.insertMany(docs, { ordered: false });
    return sendSuccess(
      res,
      {
        totalRows: rows.length,
        inserted: inserted.length,
        imgSummary: {
          total: totalZip,
          ok: imgOk,
          skip: imgSkip,
          fail: imgFail,
        },
        errors,
      },
      "SubCategories bulk uploaded successfully"
    );
  } catch (err) {
    console.error("Bulk upload subcategories error:", err);
    return sendError(res, err.message, 500);
  }
};

// ✅ GET SUBCATEGORY COUNT
exports.getSubCategoryCount = async (req, res) => {
  try {
    const { subcategory_status, category_ref } = req.query;

    logger.info(`📊 Fetching subcategory count with filters - subcategory_status: ${subcategory_status}, category_ref: ${category_ref}`);

    // Build filter
    const filter = {};
    if (subcategory_status) {
      filter.subcategory_status = subcategory_status;
    }
    if (category_ref) {
      filter.category_ref = category_ref;
    }

    logger.info(`🔍 Subcategory filter applied:`, JSON.stringify(filter, null, 2));

    // Get total count
    const totalCount = await Subcategory.countDocuments(filter);

    // Get count by status
    const statusBreakdown = await Subcategory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$subcategory_status",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get count by category
    const categoryBreakdown = await Subcategory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category_ref",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const response = {
      summary: {
        totalSubCategories: totalCount
      },
      breakdown: {
        byStatus: statusBreakdown.map(item => ({
          status: item._id || 'Unknown',
          count: item.count,
          percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
        })),
        byCategory: categoryBreakdown.map(item => ({
          category: item._id,
          count: item.count,
          percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
        }))
      },
      filters: {
        subcategory_status: subcategory_status || null,
        category_ref: category_ref || null
      },
      generatedAt: new Date()
    };

    logger.info(`✅ Subcategory count fetched successfully - Total subcategories: ${totalCount}`);
    sendSuccess(res, response, "Subcategory count fetched successfully");

  } catch (error) {
    logger.error("❌ Get subcategory count failed:", error);
    sendError(res, "Failed to get subcategory count", 500);
  }
};