const Brand = require("../models/brand");
const redisClient = require("/packages/utils/redisClient");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const axios = require("axios");
const { createUnicastOrMulticastNotificationUtilityFunction } = require("../../../../packages/utils/notificationService");
const XLSX = require("xlsx");
const stream = require("stream");
const path = require("path");
const unzipper = require("unzipper");
const Type= require("../models/type");

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

    // await redisClient.del("brands:all");
    // await redisClient.del(`brands:type:${type}`);
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
      "Brand Create ALERT",
      `New brand has been created by ${created_by} - ${brand_name}`,
      "",
      "",
      "Brand",
      {
        barand_id: newBrand._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info("🔁 Served brands from cache");
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const brands = await Brand.find().populate("type").sort({ created_at: -1 });
    // await redisClient.set(cacheKey, JSON.stringify(brands), "EX", 3600);
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
    // const cacheKey = `brand:${brandId}`;
    // const cached = await redisClient.get(cacheKey);
    // if (cached) {
    //   logger.info(`🔁 Served brand ${brandId} from cache`);
    //   return sendSuccess(res, JSON.parse(cached));
    // }

    const brand = await Brand.findById(brandId).populate(
      "type created_by updated_by"
    );
    if (!brand) return sendError(res, "Brand not found", 404);

    // await redisClient.set(cacheKey, JSON.stringify(brand), "EX", 3600);
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
    const oldBrand = await Brand.findById(brandId);
    if (!oldBrand) return sendError(res, "Brand not found", 404);
    // await redisClient.del("brands:all");
    // await redisClient.del(`brands:type:${oldBrand.type}`);
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
      "Brand update ALERT",
      ` Brand has been Updated by ${updated_by} - ${brand_name}`,
      "",
      "",
      "Brand",
      {
        barand_id: brandId
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

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

    // await redisClient.del("brands:all");
    // await redisClient.del(`brand:${brandId}`);
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
      "Brand Delete ALERT",
      ` Brand has been Deleted `,
      "",
      "",
      "Brand",
      {
        barand_id: deleted._id
      },
      req.headers.authorization
    )
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`🗑️ Deleted brand: ${brandId}`);
    sendSuccess(res, null, "Brand deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete brand error: ${err.message}`);
    return sendError(res, err);
  }
};
exports.getBrandsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { featured } = req.query;

    // Build query filter
    const filter = {
      type,
      status: "active", // Only return active brands
    };

    // Add featured filter if provided
    if (featured !== undefined) {
      filter.featured_brand = featured === "true";
    }

    // Perform query
    const brands = await Brand.find(filter)
      .populate("type")
      .sort({ created_at: -1 }) // Sort by newest first
      .limit(10); // Limit to 10 items

    // Handle no results
    if (!brands || brands.length === 0) {
      const message =
        featured !== undefined
          ? `No ${featured === "true" ? "featured" : "non-featured"
          } brands found for type ${type}`
          : `No brands found for type ${type}`;

      return sendError(res, message, 404);
    }

    logger.info(
      `✅ Fetched ${brands.length} brands for type=${type}` +
      (featured !== undefined ? ` with featured=${featured}` : "")
    );

    sendSuccess(res, brands, "Brands fetched successfully");
  } catch (err) {
    logger.error(`❌ Error fetching brands by type: ${err.message}`);
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

exports.bulkUploadBrands = async (req, res) => {
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
    const imageMap = {}; // brand_code.toLowerCase() → S3 URL
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
        const { Location } = await uploadFile(buf, base, mime, "brand-logos");
        imageMap[key] = Location;
        imgOk++;
      } catch (e) {
        imgFail++;
        console.error(`Image upload failed for ${base}:`, e.message);
      }
    }

    // 3️⃣ Prepare type name → _id map
    const uniqTypes = [...new Set(rows.map(r => String(r.type_name || "").trim()).filter(Boolean))];
    const typeDocs = await Type.find({ type_name: { $in: uniqTypes } });
    const typeMap = new Map(typeDocs.map(t => [t.type_name.trim().toLowerCase(), t._id]));

    // 4️⃣ Build docs
    const docs = [];
    const errors = [];
    for (const row of rows) {
      const typeId = typeMap.get(String(row.type_name || "").trim().toLowerCase());
      if (!typeId) {
        errors.push({ brand_code: row.brand_code, error: `Unknown type: ${row.type_name}` });
        continue;
      }
      docs.push({
        brand_name: row.brand_name,
        featured_brand: String(row.featured_brand).toLowerCase() === "true",
        brand_code: row.brand_code,
        type: typeId,
        created_by: row.created_by || "system",
        updated_by: row.updated_by || "system",
        brand_logo: imageMap[row.brand_code.toLowerCase()] || "",
        preview_video: row.preview_video || "",
        status: row.status || "active",
      });
    }

    if (!docs.length) {
      return sendError(res, "No valid brands to insert", 400);
    }

    // 5️⃣ Insert
    const inserted = await Brand.insertMany(docs, { ordered: false });
    return sendSuccess(res, {
      totalRows: rows.length,
      inserted: inserted.length,
      imgSummary: { total: totalZip, ok: imgOk, skip: imgSkip, fail: imgFail },
      errors
    }, "Brands bulk uploaded successfully");
  } catch (err) {
    console.error("Bulk upload brands error:", err);
    return sendError(res, err.message, 500);
  }
};

