/* ------------------------------------------------------------------ */
/*  BULK PRODUCT UPLOAD (Excel + ZIP)                                 */
/* ------------------------------------------------------------------ */
const Product = require("../models/productModel");
const XLSX = require("xlsx");
const unzipper = require("unzipper");
const axios = require("axios");
const stream = require("stream");
const jwt = require("jsonwebtoken");
const path = require("path");
const { Readable } = require("stream");
const csv = require("csv-parser");
const fastcsv = require("fast-csv");
const Brand = require("../models/brand");
const Model = require("../models/model");
const Variant = require("../models/variantModel");
const mongoose = require("mongoose");
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const { Parser } = require("json2csv");

const ProductBulkSession = require("../models/productBulkSessionModel"); // adjust as needed
const {
  createUnicastOrMulticastNotificationUtilityFunction,
} = require("../../../../packages/utils/notificationService");
const {
  cacheGet,
  cacheSet,
  cacheDel, // ⬅️ writer-side "del" helper
} = require("/packages/utils/cache");

const fs = require("fs");

const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
/* ───────────────────────────────── JWT KEYS ─────────────────────── */
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.trim(); // ← put PEM here

/* --- SKU helper --------------------------------------------------- */
// Global counters for different vehicle types
let twoWheelerCounter = 1000000;
let fourWheelerCounter = 1000000;

const genSKU = async (categoryId) => {
  try {
    // Get the category to determine vehicle type
    const category = await Category.findById(categoryId).populate('type');
    if (!category) {
      throw new Error("Category not found");
    }

    // Determine vehicle type based on category's type
    const vehicleType = category.type.type_name.toLowerCase();
    let vehicleCode = 'T'; // Default to two-wheeler
    let counter = twoWheelerCounter;

    if (vehicleType.includes('four') || vehicleType.includes('4') || vehicleType.includes('car') || vehicleType.includes('auto')) {
      vehicleCode = 'F'; // Four-wheeler
      counter = fourWheelerCounter;
    }

    // Get the highest existing SKU number for this vehicle type
    const existingSkus = await Product.find({
      sku_code: { $regex: `^TOP${vehicleCode}\\d+$` }
    }).select('sku_code').sort({ sku_code: -1 });

    let nextNumber = counter;
    if (existingSkus.length > 0) {
      // Extract the number from the highest SKU and increment
      const highestSku = existingSkus[0].sku_code;
      const currentNumber = parseInt(highestSku.substring(4)); // Remove 'TOPX' prefix
      nextNumber = currentNumber + 1;
    }

    // Update the appropriate counter
    if (vehicleCode === 'T') {
      twoWheelerCounter = nextNumber + 1;
    } else {
      fourWheelerCounter = nextNumber + 1;
    }

    return `TOP${vehicleCode}${nextNumber}`;
  } catch (error) {
    logger.error(`SKU generation error: ${error.message}`);
    throw error;
  }
};

function buildChangeLog({ product, changedFields, oldVals, newVals, userId }) {
  product.iteration_number = (product.iteration_number || 0) + 1;

  product.change_logs.push({
    iteration_number: product.iteration_number,
    changes: changedFields.join(", "),
    old_value: JSON.stringify(oldVals),
    new_value: JSON.stringify(newVals),
    modified_by: userId,
    modified_At: new Date(),
  });
}

// Helper function to fetch dealer details from user service
async function fetchDealerDetails(dealerId, authorizationHeader) {
  try {
    const cacheKey = `dealer_details_${dealerId}`;
    const cachedDealer = await cacheGet(cacheKey);
    if (cachedDealer) {
      return cachedDealer;
    }
    const headers = {
      "Content-Type": "application/json",
    };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }
    const response = await axios.get(
      `http://user-service:5001/api/users/dealer/${dealerId}`,
      {
        timeout: 5000,
        headers,
      }
    );
    const dealer = response.data.data;
    await cacheSet(cacheKey, dealer, 300);
    return dealer;
  } catch (error) {
    console.error(`Error fetching dealer details for ${dealerId}:`, error.message);
    return null;
  }
}

async function fetchDealersByUserId(userId, authorizationHeader) {
  try {
    const cacheKey = `dealers_by_user_${userId}`;
    const cachedDealers = await cacheGet(cacheKey);
    if (cachedDealers) {
      return cachedDealers;
    }
    const headers = {
      "Content-Type": "application/json",
    };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }
    const response = await axios.get(
      `http://user-service:5001/api/users/internal/dealers/user/${userId}`,
      {
        timeout: 5000,
        headers,
      }
    );
    const dealers = response.data.data;
    await cacheSet(cacheKey, dealers, 300);
    return dealers;
  } catch (error) {
    console.error(`Error fetching dealers by userId ${userId}:`, error.message);
    return [];
  }
}

// Helper function to fetch dealer by legal_name
async function fetchDealerByLegalName(legalName, authorizationHeader) {
  try {
    const cacheKey = `dealer_legal_name_${legalName}`;

    // Try to get from cache first
    const cachedDealer = await cacheGet(cacheKey);
    if (cachedDealer) {
      return cachedDealer;
    }

    // Prepare headers with authorization if provided
    const headers = {
      "Content-Type": "application/json",
    };

    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }

    // Get all dealers and find by legal_name
    const response = await axios.get(
      `http://user-service:5001/api/users/dealers`,
      {
        timeout: 5000,
        headers,
      }
    );

    if (response.data && response.data.success) {
      const dealers = response.data.data;
      const dealer = dealers.find(d =>
        d.legal_name && d.legal_name.toLowerCase().trim() === legalName.toLowerCase().trim()
      );

      if (dealer) {
        // Cache the dealer data for 5 minutes
        await cacheSet(cacheKey, dealer, 300);
        return dealer;
      }
    }

    return null;
  } catch (error) {
    logger.error(
      `Error fetching dealer by legal_name ${legalName}: ${error.message}`
    );
    return null;
  }
}

/* eslint-disable consistent-return */

exports.bulkUploadProducts = async (req, res) => {
  /* ─────────────────────────  Helpers  ───────────────────────── */
  const safeTrim = (v) => (v == null ? "" : String(v).trim());

  const normalizeName = (name) => safeTrim(name).replace(/\s+/g, " "); // Normalize multiple spaces to single space

  const REQUIRED = [
    "product_name",
    "manufacturer_part_name",
    "category",
    "sub_category",
    "brand",
    "product_type",
  ];

  /* ───────────────────  0  Metadata & Auth  ─────────────────── */
  const t0 = Date.now();
  logger.info(`📦 [BulkUpload] started ${new Date().toISOString()}`);

  let userId = null;
  let userRole = null;
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
        algorithms: ["ES256"],
      });
      userId = decoded?.id || decoded?._id || null;
      userRole = decoded?.role || null;
      logger.info(`👤  Verified user ${userId} with role ${userRole}`);
    } catch (e) {
      logger.warn(`🔒  verify() failed (${e.message}) – fallback to decode`);
      const decoded = jwt.decode(token);
      userId = decoded?.id || decoded?._id || null;
      userRole = decoded?.role || null;
      logger.info(`👤  Decoded user ${userId || "UNKNOWN"} with role ${userRole || "UNKNOWN"}`);
    }
  } else {
    logger.warn("🔒  No Bearer token – created_by will be null");
  }

  // Determine if approval is required based on user role
  const requiresApproval = userRole !== "Super-admin";
  const initialStatus = requiresApproval ? "Pending" : "Approved";
  const initialQcStatus = requiresApproval ? "Pending" : "Approved";

  logger.info(`🔐 Approval required: ${requiresApproval} (User role: ${userRole})`);

  /* ─────────────────────  1  Input Files  ───────────────────── */
  const excelBuf = req.files?.dataFile?.[0]?.buffer;
  const zipBuf = req.files?.imageZip?.[0]?.buffer;
  if (!excelBuf || !zipBuf)
    return sendError(res, "Both dataFile & imageZip are required", 400);

  /* ───────────────────  2  Create Bulk Session  ─────────────── */
  const session = await ProductBulkSession.create({
    sessionTime: new Date(),
    sessionId: new mongoose.Types.ObjectId().toString(),
    status: "Pending",
    created_by: userId,
    created_by_role: userRole,
    requires_approval: requiresApproval,
    no_of_products: 0,
    total_products_successful: 0,
    total_products_failed: 0,
    logs: [],
  });

  try {
    /* ──────────────  3  Parse Excel  ────────────── */
    const wb = XLSX.read(excelBuf, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    logger.info(`📄 Parsed ${rows.length} rows`);
    session.no_of_products = rows.length;

    /* ──────────────  4  Upload Images (parallel)  ────────────── */
    const imageMap = {}; // partName(lowercase) → S3 URL
    let totalZip = 0,
      imgOk = 0,
      imgSkip = 0,
      imgFail = 0;
    const uploadPromises = [];

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

      uploadPromises.push(
        (async () => {
          const buf = Buffer.concat(await streamToChunks(entry));
          try {
            const { Location } = await uploadFile(buf, base, mime, "products");
            imageMap[key] = Location;
            imgOk++;
            logger.debug(`🖼️ Uploaded ${base}`);
          } catch (e) {
            imgFail++;
            logger.error(`❌ Upload ${base} failed: ${e.message}`);
          }
        })()
      );
    }
    await Promise.allSettled(uploadPromises);
    logger.info(
      `🗂️ ZIP done  total:${totalZip} ok:${imgOk} skip:${imgSkip} fail:${imgFail}`
    );

    /* ──────────────  5  Build Category/Subcategory maps  ────────────── */
    const uniqBrands = [
      ...new Set(rows.map((r) => normalizeName(r.brand)).filter(Boolean)),
    ];

    const brandDocs = await Brand.find({ brand_name: { $in: uniqBrands } });

    const brandMap = new Map(
      brandDocs.map((b) => [normalizeName(b.brand_name), b._id])
    );
    const uniqCats = [
      ...new Set(rows.map((r) => normalizeName(r.category)).filter(Boolean)),
    ];
    const uniqSubs = [
      ...new Set(
        rows.map((r) => normalizeName(r.sub_category)).filter(Boolean)
      ),
    ];
    const uniqModels = [
      ...new Set(rows.map((r) => normalizeName(r.model)).filter(Boolean)),
    ];
    const uniqVariants = [
      ...new Set(
        rows
          .flatMap((r) => (r.variant || "").split(","))
          .map((v) => normalizeName(v))
          .filter(Boolean)
      ),
    ];

    const modelDocs = await Model.find({ model_name: { $in: uniqModels } });
    const variantDocs = await Variant.find({
      variant_name: { $in: uniqVariants },
    });

    const modelMap = new Map(
      modelDocs.map((d) => [normalizeName(d.model_name), d._id])
    );
    const variantMap = new Map(
      variantDocs.map((d) => [normalizeName(d.variant_name), d._id])
    );

    const catDocs = await Category.find({
      $or: [{ name: { $in: uniqCats } }, { category_name: { $in: uniqCats } }],
    });

    const subDocs = await SubCategory.find({
      $or: [
        { name: { $in: uniqSubs } },
        { subcategory_name: { $in: uniqSubs } },
      ],
    });

    // Create case-sensitive maps preserving original spacing
    const categoryMap = new Map();
    catDocs.forEach((c) => {
      const key = c.name || c.category_name;
      categoryMap.set(normalizeName(key), c._id);
    });

    const subcategoryMap = new Map();
    subDocs.forEach((s) => {
      const key = s.name || s.subcategory_name;
      subcategoryMap.set(normalizeName(key), s._id);
    });

    /* ──────────────  6  Transform Rows → Docs  ────────────── */
    const docs = [];
    const errors = [];
    const seen = new Set(); // to detect duplicate SKU
    const sessionLogs = [];
    let failed = 0; // rows skipped or Mongo-failed

    // Process rows sequentially to handle async SKU generation
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      /* 6.1  Skip if any REQUIRED field empty */
      const missing = REQUIRED.filter((k) => !safeTrim(row[k]));
      if (missing.length) {
        errors.push({
          row: i + 2,
          error: `Missing fields: ${missing.join(", ")}`,
          rowData: row,
        });
        sessionLogs.push({
          message: `Skipped (missing ${missing.join(", ")})`,
          productId: null,
        });
        failed++;
        continue;
      }

      /* 6.2  Extract & normalise fields */
      const name = safeTrim(row.product_name);
      const part = safeTrim(row.manufacturer_part_name);

      /* 6.3  Category / Subcategory mapping – skip if unknown */
      const categoryKey = normalizeName(row.category);
      const subcategoryKey = normalizeName(row.sub_category);

      const categoryId = categoryMap.get(categoryKey);
      const subcategoryId = subcategoryMap.get(subcategoryKey);
      if (!categoryId || !subcategoryId) {
        const msg = !categoryId
          ? `Unknown category '${row.category}'`
          : `Unknown sub_category '${row.sub_category}'`;
        errors.push({ row: i + 2, error: msg, rowData: row });
        failed++;
        continue;
      }

      /* 6.2  Generate SKU based on category */
      let sku;
      try {
        sku = await genSKU(categoryId);
        if (seen.has(sku)) {
          errors.push({ row: i + 2, sku, error: "Duplicate SKU", rowData: row });
          sessionLogs.push({ message: "Duplicate SKU", productId: null });
          failed++;
          continue;
        }
        seen.add(sku);
      } catch (skuError) {
        errors.push({
          row: i + 2,
          error: `SKU generation failed: ${skuError.message}`,
          rowData: row
        });
        sessionLogs.push({ message: "SKU generation failed", productId: null });
        failed++;
        continue;
      }

      /* 6.3½  Brand mapping – skip row if unknown */
      const brandId = brandMap.get(normalizeName(row.brand));
      if (!brandId) {
        errors.push({
          row: i + 2,
          error: `Unknown brand «${row.brand}»`,
          rowData: row,
        });
        failed++;
        continue;
      }

      /* 6.3¾  Model & Variant mapping  */
      const modelId = modelMap.get(normalizeName(row.model));
      if (!modelId) {
        errors.push({
          row: i + 2,
          error: `Unknown model «${row.model}»`,
          rowData: row,
        });
        failed++;
        continue;
      }

      const variantIds = (row.variant || "")
        .split(",")
        .map((v) => normalizeName(v))
        .map((v) => variantMap.get(v))
        .filter(Boolean); // drop unknowns

      if (!variantIds.length) {
        errors.push({ row: i + 2, error: "No valid variants", rowData: row });
        failed++;
        continue;
      }

      /* 6.4  Variants */
      const variants = row.variants
        ? row.variants.split(",").map((v) => ({ name: safeTrim(v) }))
        : [];

      /* 6.5  Build doc */
      docs.push({
        ...row, // 1️⃣ keep raw cells *first*
        sku_code: sku,
        product_name: name,
        manufacturer_part_name: part,
        category: categoryId, // 2️⃣ then patch with ObjectIds / numbers
        sub_category: subcategoryId,
        brand: brandId, //    (see brand lookup below)
        product_type: row.product_type,
        variant: variantIds,
        created_by: userId,
        created_by_role: userRole,
        model: modelId,
        qc_status: initialQcStatus,
        live_status: initialStatus,
        images: imageMap[part.toLowerCase()]
          ? [imageMap[part.toLowerCase()]]
          : [],
        __rowIndex: i,
      });
      sessionLogs.push({ message: requiresApproval ? "Pending Approval" : "Created", productId: null });
    }
    /* ──────────────  7  Bulk Insert  ────────────── */
    let inserted = 0;
    if (docs.length) {
      try {
        docs.forEach((d) => (d._tempIndex = d.__rowIndex)); // local meta
        const mongoRes = await Product.insertMany(docs, {
          ordered: true,
          rawResult: true,
        });
        inserted = mongoRes.insertedCount;

        for (const [arrIdx, id] of Object.entries(mongoRes.insertedIds)) {
          const rowIdx = docs[arrIdx].__rowIndex;
          const productData = docs[arrIdx];
          sessionLogs[rowIdx] = {
            productId: id,
            message: requiresApproval ? "Pending Approval" : "Created",
            productDetails: {
              sku: productData.sku_code,
              productName: productData.product_name,
              manufacturerPartName: productData.manufacturer_part_name,
              brand: productData.brand,
              category: productData.category,
              subCategory: productData.sub_category,
              model: productData.model,
              variants: productData.variant,
              productType: productData.product_type,
              status: requiresApproval ? "Pending" : "Approved",
              qcStatus: requiresApproval ? "Pending" : "Approved",
              images: productData.images?.length || 0,
              createdBy: userId,
              createdByRole: userRole,
              createdAt: new Date()
            }
          };
        }
      } catch (err) {
        // ValidationError (thrown BEFORE Mongo is hit)
        if (err instanceof mongoose.Error.ValidationError) {
          logger.error(
            "🚫 Mongoose validation error on prototype row:\n" +
            JSON.stringify(err.errors, null, 2)
          );
          errors.push({
            row: docs[0].__rowIndex + 2,
            error: Object.values(err.errors)[0].message,
            rowData: rows[docs[0].__rowIndex],
          });
          return sendError(res, "Schema validation failed", 422);
        }

        // BulkWriteError (thrown BY Mongo)
        if (err?.writeErrors?.length) {
          const first = err.writeErrors[0];
          logger.error(
            `🚫 Bulk write error on row ${first.index + 2}:\n` +
            JSON.stringify(first.err ?? first, null, 2)
          );
          // …populate errors[] exactly as before…
          return sendError(res, "Bulk-insert failed", 422);
        }

        // Anything else
        logger.error("❌ Unexpected error during insertMany:", err);
        return sendError(res, "Unexpected error during insert", 500);
      }
    }

    /* ──────────────  8  Finalize Session  ────────────── */
    session.status = "Completed";
    session.updated_at = new Date();
    session.total_products_successful = inserted;
    session.total_products_failed = failed;
    session.logs = sessionLogs;
    await session.save();

    /* ──────────────  9  Send Notifications & Response  ────────────── */
    const secs = ((Date.now() - t0) / 1000).toFixed(1);

    // Enhanced notification logic based on approval requirement
    try {
      const userData = await axios.get("http://user-service:5001/api/users/", {
        headers: { Authorization: req.headers.authorization },
      });

      let notificationIds = [];
      let notificationTitle = "";
      let notificationMessage = "";

      if (requiresApproval) {
        // Notify Inventory Admin and Super Admin for approval
        notificationIds = userData.data.data
          .filter((u) => ["Super-admin", "Inventory-Admin"].includes(u.role))
          .map((u) => u._id);

        notificationTitle = "Product Approval Required";
        notificationMessage = `Bulk upload requires approval: ${inserted}/${rows.length} products uploaded by ${userRole} in ${secs}s`;
      } else {
        // Notify all inventory users about successful upload
        notificationIds = userData.data.data
          .filter((u) =>
            ["Super-admin", "Inventory-Admin", "Inventory-Staff"].includes(u.role)
          )
          .map((u) => u._id);

        notificationTitle = "Product Bulk Upload ALERT";
        notificationMessage = `Bulk upload completed: ${inserted}/${rows.length} docs in ${secs}s`;
      }

      if (notificationIds.length > 0) {
        const notify = await createUnicastOrMulticastNotificationUtilityFunction(
          notificationIds,
          ["INAPP", "PUSH"],
          notificationTitle,
          notificationMessage,
          "",
          "",
          "Product",
          {
            sessionId: session._id,
            requiresApproval: requiresApproval,
            uploadedBy: userRole
          },
          req.headers.authorization
        );
        if (!notify.success)
          logger.error("❌ Create notification error:", notify.message);
        else logger.info("✅ Notification created successfully");
      }
    } catch (e) {
      logger.error("⚠️  Notification step failed:", e.message);
    }

    // Extract successful product details for response
    const successfulProducts = sessionLogs
      .filter(log => log.productId && log.productDetails)
      .map(log => ({
        productId: log.productId,
        sku: log.productDetails.sku,
        productName: log.productDetails.productName,
        manufacturerPartName: log.productDetails.manufacturerPartName,
        status: log.productDetails.status,
        qcStatus: log.productDetails.qcStatus,
        images: log.productDetails.images,
        message: log.message
      }));

    // Extract failed product details for response
    const failedProducts = sessionLogs
      .filter(log => !log.productId && log.productDetails)
      .map(log => ({
        productName: log.productDetails.productName,
        manufacturerPartName: log.productDetails.manufacturerPartName,
        error: log.productDetails.error || log.message,
        message: log.message
      }));

    logger.info(
      `🏁 BulkUpload completed: ${inserted}/${rows.length} docs in ${secs}s (Approval required: ${requiresApproval})`
    );

    // Log successful products
    if (successfulProducts.length > 0) {
      logger.info(`✅ Successfully uploaded ${successfulProducts.length} products:`);
      successfulProducts.forEach((product, index) => {
        logger.info(`   ${index + 1}. SKU: ${product.sku} | Name: ${product.productName} | Status: ${product.status}`);
      });
    }

    // Log failed products
    if (failedProducts.length > 0) {
      logger.warn(`❌ Failed to upload ${failedProducts.length} products:`);
      failedProducts.forEach((product, index) => {
        logger.warn(`   ${index + 1}. Name: ${product.productName} | Error: ${product.error}`);
      });
    }

    return sendSuccess(res, {
      totalRows: rows.length,
      inserted,
      imgSummary: { total: totalZip, ok: imgOk, skip: imgSkip, fail: imgFail },
      errors,
      sessionId: session._id,
      durationSec: secs,
      requiresApproval: requiresApproval,
      status: requiresApproval ? "Pending Approval" : "Approved",
      message: requiresApproval
        ? "Products uploaded successfully and pending approval from Inventory Admin or Super Admin"
        : "Products uploaded and approved successfully",
      successLogs: {
        totalSuccessful: successfulProducts.length,
        products: successfulProducts
      },
      failureLogs: {
        totalFailed: failedProducts.length,
        products: failedProducts
      }
    });
  } catch (err) {
    /* ──────────────  Fatal Error  ────────────── */
    session.status = "Failed";
    session.updated_at = new Date();
    session.logs.push({
      productId: null,
      message: `Unexpected error: ${err.message}`,
    });
    await session.save();
    logger.error(`Bulk upload failed: ${err.stack || err}`);
    return sendError(res, `Bulk upload failed: ${err.message}`, 500);
  }
};

// Helper to chunk a readable stream to buffer array
async function streamToChunks(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}

/**
 * Calculate the Levenshtein distance between two strings.
 * This is a measure of the minimum number of single-character edits (insertions, deletions or substitutions) required to change one word into the other.
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {number} The Levenshtein distance between the two strings.
 */ function stringSimilarity(str1, str2) {
  const len = Math.max(str1.length, str2.length);
  if (len === 0) return 0;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / len;
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}
exports.getProductsByFilters = async (req, res) => {
  try {
    const {
      brand,
      category,
      sub_category,
      product_type,
      model,
      variant,
      make,
      year_range,
      is_universal,
      is_consumable,
      query,
      sort_by,
      min_price,
      max_price,
    } = req.query;

    let { page = "0", limit = "10" } = req.query; // default page = 0

    // Convert page and limit to numbers with safe defaults
    let pageNumber = parseInt(page, 10);
    let limitNumber = parseInt(limit, 10);

    if (isNaN(pageNumber) || pageNumber < 0) pageNumber = 0; // accept 0-based index
    if (isNaN(limitNumber) || limitNumber < 1) limitNumber = 10;

    const skip = pageNumber * limitNumber; // no -1 adjustment now

    // Prepare filters
    const filter = {};
    const csvToIn = (val) => val.split(",").map((v) => v.trim());

    // Only fetch approved & live products
    filter.live_status = "Approved";
    filter.Qc_status = "Approved";

    if (brand) filter.brand = { $in: csvToIn(brand) };
    if (category) filter.category = { $in: csvToIn(category) };
    if (sub_category) filter.sub_category = { $in: csvToIn(sub_category) };
    if (product_type) filter.product_type = { $in: csvToIn(product_type) };
    if (model) filter.model = { $in: csvToIn(model) };
    if (variant) filter.variant = { $in: csvToIn(variant) };
    if (make) filter.make = { $in: csvToIn(make) };
    if (year_range) filter.year_range = { $in: csvToIn(year_range) };

    if (is_universal !== undefined) filter.is_universal = is_universal === "true";
    if (is_consumable !== undefined) filter.is_consumable = is_consumable === "true";

    if (min_price || max_price) {
      filter.selling_price = {};
      if (min_price) filter.selling_price.$gte = Number(min_price);
      if (max_price) filter.selling_price.$lte = Number(max_price);
    }

    // Sorting
    let sortOption = { created_at: -1, _id: 1 }; // stable default
    if (sort_by) {
      sortOption = {};
      switch (sort_by.trim()) {
        case "A-Z":
          sortOption.product_name = 1;
          break;
        case "Z-A":
          sortOption.product_name = -1;
          break;
        case "L-H":
          sortOption.selling_price = 1;
          break;
        case "H-L":
          sortOption.selling_price = -1;
          break;
        default:
          sortOption.created_at = -1;
          sortOption._id = 1;
      }
    }

    logger.debug(`🔎 Product sort → ${JSON.stringify(sortOption)}`);
    logger.debug(`🔎 Product filter → ${JSON.stringify(filter)}`);

    // First get all IDs if query filtering is needed
    let baseQuery = Product.find(filter).populate(
      "brand category sub_category model variant year_range"
    );

    let allProducts = await baseQuery.sort(sortOption).lean();

    // In-memory search filtering (query)
    if (query && query.trim() !== "") {
      let queryParts = query.trim().toLowerCase().split(/\s+/);

      try {
        if (brand) {
          const brandDoc = await Brand.findById(brand);
          if (brandDoc?.brand_name) {
            const brandParts = brandDoc.brand_name.toLowerCase().split(/\s+/);
            queryParts = queryParts.filter(
              (q) => !brandParts.some((b) => stringSimilarity(q, b) > 0.7)
            );
          }
        }

        if (model) {
          const modelDoc = await Model.findById(model);
          if (modelDoc?.model_name) {
            const modelParts = modelDoc.model_name.toLowerCase().split(/\s+/);
            queryParts = queryParts.filter(
              (q) => !modelParts.some((m) => stringSimilarity(q, m) > 0.7)
            );
          }
        }

        if (variant) {
          const variantDoc = await Variant.findById(variant);
          if (variantDoc?.variant_name) {
            const variantParts = variantDoc.variant_name.toLowerCase().split(/\s+/);
            queryParts = queryParts.filter(
              (q) => !variantParts.some((v) => stringSimilarity(q, v) > 0.7)
            );
          }
        }
      } catch (e) {
        logger.error(
          `❌ Error in extracting brand/model/variant from query: ${e.message}`
        );
        return sendError(res, e.message);
      }

      if (queryParts.length > 0) {
        allProducts = allProducts.filter((product) => {
          const tags = (product.search_tags || []).map((t) => t.toLowerCase());
          return queryParts.some((part) =>
            tags.some((tag) => stringSimilarity(tag, part) >= 0.6)
          );
        });
      }
    }

    // Total count after all filters
    const totalCount = allProducts.length;

    // Apply pagination now
    const products = allProducts.slice(skip, skip + limitNumber);

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages - 1;
    const hasPrevPage = pageNumber > 0;

    return sendSuccess(
      res,
      {
        products,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitNumber,
          nextPage: hasNextPage ? pageNumber + 1 : null,
          prevPage: hasPrevPage ? pageNumber - 1 : null,
        },
      },
      "Products fetched successfully"
    );
  } catch (err) {
    logger.error(`❌ getProductsByFilters error: ${err.stack}`);
    return sendError(res, err.message || "Internal server error");
  }
};



exports.approveProducts = async (req, res) => {
  try {
  } catch { }
};

exports.assignDealers = async (req, res) => {
  const part = req.files?.dealersFile?.[0];

  /* ─────────────────────────── 0. Validate upload ───────────────────── */
  if (!part) return sendError(res, "dealersFile (.csv) is required", 400);

  /* ─────────────────────────── 1. Read file ────────────────────────── */
  let csvText;
  try {
    csvText = part.path // disk-storage?
      ? fs.readFileSync(part.path, "utf8")
      : part.buffer.toString("utf8"); // memory-storage
  } catch (e) {
    return sendError(res, `Cannot read upload: ${e.message}`, 400);
  }

  csvText = csvText.replace(/^\uFEFF/, "").trim();
  if (!csvText) return sendError(res, "CSV file is empty", 400);

  /* ─────────────────────────── 2. Parse CSV ────────────────────────── */
  const mapBySku = new Map(); // sku → Map(dealer → payload)
  const errors = [];
  let rowNo = 1; // header = row 1

  await new Promise((resolve) => {
    fastcsv
      .parseString(csvText, { headers: true, trim: true, ignoreEmpty: true })
      .on("data", (row) => {
        rowNo += 1;
        try {
          const sku = String(row.sku_code || "").trim();
          const dlr = String(row.dealer_id || "").trim();
          const qty = Number(row.qty);
          const marg = row.margin ? Number(row.margin) : undefined;
          const prio = row.priority ? Number(row.priority) : undefined;

          if (!sku || !dlr || Number.isNaN(qty)) {
            errors.push({
              row: rowNo,
              err: "sku_code / dealer_id / qty invalid",
            });
            return;
          }

          if (!mapBySku.has(sku)) mapBySku.set(sku, new Map());
          mapBySku.get(sku).set(dlr, {
            dealers_Ref: dlr,
            quantity_per_dealer: qty,
            dealer_margin: marg,
            dealer_priority_override: prio,
            last_stock_update: new Date(),
          });
        } catch (e) {
          errors.push({ row: rowNo, err: e.message });
        }
      })
      .on("end", resolve);
  });

  /* ─────────────────────────── 3. Build bulk ops ───────────────────── */
  const ops = [];
  for (const [sku, dealerMap] of mapBySku) {
    const incomingArr = [...dealerMap.values()];
    const incomingIds = incomingArr.map((d) => d.dealers_Ref);

    /* MongoDB update-pipeline so we can use aggregation operators  */
    ops.push({
      updateOne: {
        filter: { sku_code: sku },
        update: [
          {
            $set: {
              /* always coerce to array first */
              available_dealers: {
                $let: {
                  vars: {
                    current: {
                      $cond: [
                        { $isArray: "$available_dealers" },
                        "$available_dealers",
                        [], // null / object / missing
                      ],
                    },
                  },
                  in: {
                    /* 1️⃣ keep existing entries NOT in incomingIds
                       2️⃣ add / overwrite with the fresh ones          */
                    $concatArrays: [
                      {
                        $filter: {
                          input: "$$current",
                          as: "d",
                          cond: {
                            $not: { $in: ["$$d.dealers_Ref", incomingIds] },
                          },
                        },
                      },
                      { $literal: incomingArr }, // new / replacement objs
                    ],
                  },
                },
              },
              updated_at: new Date(),
            },
          },
        ],
      },
    });
  }

  /* ─────────────────────────── 4. Bulk write ───────────────────────── */
  let bulkRes = { matchedCount: 0, modifiedCount: 0 };
  try {
    if (ops.length) {
      bulkRes = await Product.bulkWrite(ops, { ordered: false });
    }
  } catch (e) {
    errors.push({ err: `BulkWrite error: ${e.message}` });
  }

  /* ─────────────────────────── 5. Job log  ─────────────────────────── */

  /* ─────────────────────────── 6. Response  ───────────────────────── */
  return sendSuccess(
    res,
    {
      skuProcessed: mapBySku.size,
      dealerLinks: ops.length,
      matched: bulkRes.matchedCount,
      modified: bulkRes.modifiedCount,
      ...(errors.length ? { validationErrors: errors } : {}),
    },
    errors.length
      ? "Dealer assignments processed with some errors"
      : "Dealer assignments processed successfully"
  );
};
exports.bulkEdit = async (req, res) => {
  try {
    /* 1. File Validation & Reading */
    const file = req.files?.editsFile?.[0];
    if (!file) {
      return sendError(res, "CSV file (editsFile) is required", 400);
    }
    const csvData = file.path
      ? fs.readFileSync(file.path, "utf8")
      : file.buffer.toString("utf8");
    if (!csvData.trim()) {
      return sendError(res, "CSV file is empty", 400);
    }

    /* 2. DB Connection Check */
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not connected");
      return sendError(res, "Database connection issue", 500);
    }

    /* 3. Parse CSV into Rows */
    const rows = [];
    await new Promise((resolve, reject) => {
      fastcsv
        .parseString(csvData, { headers: true, trim: true, ignoreEmpty: true })
        .on("error", reject)
        .on("data", (r) => rows.push(r))
        .on("end", resolve);
    });

    /* 4. Build & Execute Sequential Updates */
    const schemaPaths = Product.schema.paths;
    const errors = [];
    let matchedCount = 0;
    let modifiedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 2; // account for header
      const row = rows[i];
      const rawSku = String(row.sku_code || "").trim();
      const sku = rawSku.toUpperCase();

      if (!sku) {
        errors.push({ row: rowNo, error: "Missing sku_code" });
        continue;
      }

      // 4.1: Fetch the existing product
      const product = await Product.findOne({ sku_code: sku }).lean();
      if (!product) {
        errors.push({ row: rowNo, sku, error: "Product not found" });
        continue;
      }

      // 4.2: Prepare the updates object
      const updates = {};
      Object.entries(row).forEach(([field, value]) => {
        if (field === "sku_code") return;
        if (!(field in schemaPaths)) return;
        const str = String(value || "").trim();
        if (!str) return;

        try {
          const type = schemaPaths[field].instance;
          if (type === "Number") {
            updates[field] = Number(str);
          } else if (type === "Boolean") {
            updates[field] = str.toLowerCase() === "true";
          } else if (type === "Date") {
            updates[field] = new Date(str);
          } else {
            updates[field] = str;
          }
        } catch (e) {
          errors.push({
            row: rowNo,
            sku,
            field,
            error: `Invalid ${schemaPaths[field].instance}: ${e.message}`,
          });
        }
      });

      if (Object.keys(updates).length === 0) {
        errors.push({ row: rowNo, sku, error: "No valid updates provided" });
        continue;
      }

      // 4.3: Build change-log entry, serializing `changes` to string
      const nextIter = (product.iteration_number || 0) + 1;
      const changesArray = Object.entries(updates).map(([k, v]) => ({
        field: k,
        oldValue: product[k],
        newValue: v,
      }));

      const changeLogEntry = {
        iteration_number: nextIter,
        modified_At: new Date(),
        modified_by: req.user?._id || "system",
        // Must be a STRING per your schema:
        changes: JSON.stringify(changesArray),
      };

      // 4.4: Perform the update
      const result = await Product.updateOne(
        { sku_code: sku },
        {
          $set: updates,
          $currentDate: { updated_at: true },
          $inc: { iteration_number: 1 },
          $push: { change_logs: changeLogEntry },
        }
      );

      // 4.5: Tally results
      if (result.matchedCount || result.n) matchedCount++;
      if (result.modifiedCount || result.nModified) modifiedCount++;
      if ((result.matchedCount || result.n) === 0) {
        errors.push({ row: rowNo, sku, error: "No document matched" });
      } else if ((result.modifiedCount || result.nModified) === 0) {
        errors.push({ row: rowNo, sku, error: "Document not modified" });
      }
    }

    /* 5. Return Summary */
    return sendSuccess(res, {
      totalRows: rows.length,
      operationsAttempted: rows.length,
      matchedCount,
      modifiedCount,
      errors,
    });
  } catch (err) {
    console.error("bulkEdit error:", err);
    return sendError(res, `Internal server error: ${err.message}`, 500);
  }
};
exports.SearchAlgorithm = async (req, res) => { };

exports.exportDealerProducts = async (req, res) => {
  /* ───── 1. Build Mongo filter from query-string ────────────────── */
  const { dealer_id, brand, category, sub_category, product_type } = req.query;

  const filter = {};

  // If dealer_id is provided, filter by dealer, otherwise export all products
  if (dealer_id) {
    filter["available_dealers.dealers_Ref"] = dealer_id;
  }

  if (brand) filter.brand = brand;
  if (category) filter.category = category;
  if (sub_category) filter.sub_category = sub_category;
  if (product_type) filter.product_type = product_type;

  try {
    /* --- 2. Try cache first (optional) ---------------------------- */
    const cacheKey = `export:${JSON.stringify(filter)}`;
    let products = await cacheGet(cacheKey);

    if (!products) {
      products = await Product.find(filter)
        .select(
          "sku_code product_name mrp_with_gst selling_price brand category sub_category available_dealers product_type status created_at updated_at"
        )
        .populate("brand", "brand_name")
        .populate("category", "category_name")
        .populate("sub_category", "subcategory_name")
        .lean();
    }

    if (!products.length)
      return sendError(res, "No products match the given filter", 404);

    /* --- 3. Prepare rows based on whether dealer_id is provided --- */
    const rows = [];

    if (dealer_id) {
      // Export dealer-specific products (one row per dealer-product combination)
      products.forEach((p) => {
        const base = {
          sku_code: p.sku_code,
          product_name: p.product_name,
          mrp_with_gst: p.mrp_with_gst,
          selling_price: p.selling_price,
          brand: p.brand?.brand_name || "",
          category: p.category?.category_name || "",
          sub_category: p.sub_category?.subcategory_name || "",
          product_type: p.product_type || "",
          status: p.status || "",
        };

        (p.available_dealers || []).forEach((d) => {
          if (dealer_id === d.dealers_Ref) {
            rows.push({
              ...base,
              dealer_id: d.dealers_Ref,
              qty: d.quantity_per_dealer,
              margin: d.dealer_margin,
              priority: d.dealer_priority_override,
              last_stock_update: d.last_stock_update,
            });
          }
        });
      });
    } else {
      // Export all products (one row per product)
      products.forEach((p) => {
        const totalQuantity = (p.available_dealers || []).reduce(
          (sum, d) => sum + (d.quantity_per_dealer || 0),
          0
        );
        const dealerCount = p.available_dealers
          ? p.available_dealers.length
          : 0;

        rows.push({
          sku_code: p.sku_code,
          product_name: p.product_name,
          mrp_with_gst: p.mrp_with_gst,
          selling_price: p.selling_price,
          brand: p.brand?.brand_name || "",
          category: p.category?.category_name || "",
          sub_category: p.sub_category?.subcategory_name || "",
          product_type: p.product_type || "",
          status: p.status || "",
          total_quantity: totalQuantity,
          dealer_count: dealerCount,
          created_at: p.created_at,
          updated_at: p.updated_at,
        });
      });
    }

    /* --- 4. Prepare CSV streaming -------------------------------- */
    const fileName = dealer_id
      ? `dealer_${dealer_id}_products_${Date.now()}.csv`
      : `all_products_dashboard_${Date.now()}.csv`;

    const csvHeaders = dealer_id
      ? [
        "sku_code",
        "product_name",
        "dealer_id",
        "qty",
        "margin",
        "priority",
        "last_stock_update",
        "mrp_with_gst",
        "selling_price",
        "brand",
        "category",
        "sub_category",
        "product_type",
        "status",
      ]
      : [
        "sku_code",
        "product_name",
        "mrp_with_gst",
        "selling_price",
        "brand",
        "category",
        "sub_category",
        "product_type",
        "status",
        "total_quantity",
        "dealer_count",
        "created_at",
        "updated_at",
      ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const csvStream = fastcsv.format({ headers: csvHeaders });
    csvStream.pipe(res);

    rows.forEach((r) => csvStream.write(r));
    csvStream.end();

    /* --- 5. Log the export operation ----------------------- */
    logger.info(
      `📊 Exported ${rows.length} products ${dealer_id ? `for dealer ${dealer_id}` : "for dashboard"
      } to CSV`
    );
  } catch (err) {
    logger.error(`exportDealerProducts error: ${err.message}`);
    return sendError(res, err);
  }
};
exports.deactivateProductsSingle = async (req, res) => {
  try {
    const { id } = req.params; // can be _id or sku_code
    const filter = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id }
      : { sku_code: id };

    const product = await Product.findOneAndUpdate(
      filter,
      {
        live_status: "Pending",
        out_of_stock: true,
        updated_at: new Date(),
        $push: {
          change_logs: {
            iteration_number: 1,
            modified_by: req.userId || "system",
            changes: "De-activated",
          },
        },
      },
      { new: true }
    );

    if (!product) return sendError(res, "Product not found", 404);

    /* audit log */

    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const user = userData.data.data.find((user) => user._id === req.userId);

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
        "Product De-activated ALERT",
        `Product has been de-activated by ${req.userId ? user.username : "system"
        }  ${product.product_name}`,
        "",
        "",
        "Product",
        {
          product_id: product._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    return sendSuccess(res, product, "Product de-activated");
  } catch (err) {
    logger.error(`deactivateProductsSingle: ${err.message}`);
    return sendError(res, err);
  }
};
exports.deactivateProductsBulk = async (req, res) => {
  /* 1️⃣  Gather identifiers ------------------------------------------ */
  const skuCodes = Array.isArray(req.body.sku_codes) ? req.body.sku_codes : [];
  const mongoIds = Array.isArray(req.body.productIds)
    ? req.body.productIds
    : [];

  if (!skuCodes.length && !mongoIds.length) {
    return sendError(
      res,
      'Provide at least one "sku_codes" or "ids" entry in JSON body',
      400
    );
  }

  /* 2️⃣  Build Mongo filter ------------------------------------------ */
  const filter = {
    $or: [
      ...(skuCodes.length ? [{ sku_code: { $in: skuCodes } }] : []),
      ...(mongoIds.length
        ? mongoIds
          .map((id) => (id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : null))
          .filter(Boolean)
        : []),
    ],
  };

  try {
    /* 3️⃣  Update products in-place ---------------------------------- */
    const { matchedCount, modifiedCount } = await Product.updateMany(filter, {
      live_status: "Pending",
      out_of_stock: true,
      updated_at: new Date(),
      $push: {
        change_logs: {
          iteration_number: 1,
          modified_by: req.userId || "system",
          changes: "Bulk de-activate via API",
        },
      },
    });

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
        "Product Bulk De-activated ALERT",
        `Product has been bulk de-activated  `,
        "",
        "",
        "Product",
        {},
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    /* 4️⃣  Write job log -------------------------------------------- */

    /* 5️⃣  Respond --------------------------------------------------- */
    return sendSuccess(
      res,
      {
        skuProvided: skuCodes.length,
        idsProvided: mongoIds.length,
        matched: matchedCount,
        modified: modifiedCount,
      },
      "Bulk de-activation processed"
    );
  } catch (err) {
    logger.error(`deactivateProductsBulk: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getVehicleDetails = async (req, res) => {
  try {
    const { brandId, modelId, variantId } = req.query;

    if (!brandId && !modelId && !variantId) {
      return sendError(
        res,
        "At least one of brandId, modelId, or variantId must be provided",
        400
      );
    }

    const response = {};

    if (brandId) {
      const brandDoc = await Brand.findById(brandId);
      if (!brandDoc) {
        return sendError(res, `Brand not found for ID: ${brandId}`, 404);
      }
      response.brand = {
        _id: brandDoc._id,
        brand_name: brandDoc.brand_name,
        ...(brandDoc._doc || {}),
      };
    }

    if (modelId) {
      const modelDoc = await Model.findById(modelId);
      if (!modelDoc) {
        return sendError(res, `Model not found for ID: ${modelId}`, 404);
      }
      response.model = {
        _id: modelDoc._id,
        model_name: modelDoc.model_name,
        ...(modelDoc._doc || {}),
      };
    }

    if (variantId) {
      const variantDoc = await Variant.findById(variantId);
      if (!variantDoc) {
        return sendError(res, `Variant not found for ID: ${variantId}`, 404);
      }
      response.variant = {
        _id: variantDoc._id,
        variant_name: variantDoc.variant_name,
        ...(variantDoc._doc || {}),
      };
    }

    return sendSuccess(res, response, "Vehicle metadata fetched successfully");
  } catch (err) {
    logger.error(`getVehicleDetails error: ${err.message}`);
    return sendError(res, err.message || "Internal server error");
  }
};

exports.createProductSingle = async (req, res) => {
  try {
    const data = req.body;
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "products"
        );
        imageUrls.push(uploaded.Location);
      }
    }

    // Generate SKU automatically
    let generatedSku;
    try {
      // Get the category to determine vehicle type
      const category = await Category.findById(data.category).populate('type');
      if (!category) {
        return sendError(res, "Category not found", 404);
      }

      // Determine vehicle type based on category's type
      const vehicleType = category.type.type_name.toLowerCase();
      let vehicleCode = 'T'; // Default to two-wheeler

      if (vehicleType.includes('four') || vehicleType.includes('4') || vehicleType.includes('car') || vehicleType.includes('auto')) {
        vehicleCode = 'F'; // Four-wheeler
      }

      // Get the highest existing SKU number for this vehicle type
      const existingSkus = await Product.find({
        sku_code: { $regex: `^TOP${vehicleCode}\\d+$` }
      }).select('sku_code').sort({ sku_code: -1 });

      let nextNumber = 1000000; // Starting number
      if (existingSkus.length > 0) {
        // Extract the number from the highest SKU and increment
        const highestSku = existingSkus[0].sku_code;
        const currentNumber = parseInt(highestSku.substring(4)); // Remove 'TOPX' prefix
        nextNumber = currentNumber + 1;
      }

      generatedSku = `TOP${vehicleCode}${nextNumber}`;
    } catch (skuError) {
      logger.error(`SKU generation error: ${skuError.message}`);
      return sendError(res, "Failed to generate SKU", 500);
    }

    // Remove SKU from request data if provided (since we're generating it automatically)
    const { sku_code, ...productDataWithoutSku } = data;

    const productPayload = {
      ...productDataWithoutSku,
      sku_code: generatedSku,
      images: imageUrls,
    };
    console.log(productPayload);

    const newProduct = await Product.create(productPayload);

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
        "Product Create ALERT",
        `New Product has been created  - ${newProduct.product_name}`,
        "",
        "",
        "Product",
        {
          model_id: newProduct._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`✅ Created new product: ${newProduct.sku_code}`);
    return sendSuccess(res, newProduct, "Product created successfully");
  } catch (err) {
    logger.error(`❌ Create product error: ${err.message}`);
    return sendError(res, err);
  }
};

// 🔹 EDIT Single
exports.editProductSingle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user?.id || updateData.updated_by || "system";

    const existingProduct = await Product.findById(id);
    if (!existingProduct) return sendError(res, "Product not found", 404);

    const updatedFields = [];
    const changedValues = [];

    // Upload new images if present
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const uploaded = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "products"
        );
        newImages.push(uploaded.Location);
      }
      updateData.images = newImages;
    }

    // Detect changes
    for (const key in updateData) {
      const newValue = updateData[key];
      const oldValue = existingProduct[key];

      // For objects/arrays, compare stringified versions
      const hasChanged =
        typeof newValue === "object"
          ? JSON.stringify(oldValue) !== JSON.stringify(newValue)
          : oldValue != newValue;

      if (hasChanged) {
        updatedFields.push(key);
        changedValues.push({
          field: key,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    }

    if (!updatedFields.length) {
      return sendSuccess(res, existingProduct, "No changes detected");
    }

    // Perform update
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // Create changelog entries per changed field
    const currentIteration = (updatedProduct.iteration_number || 0) + 1;

    for (const change of changedValues) {
      updatedProduct.change_logs.push({
        iteration_number: currentIteration,
        old_value: String(change.old_value ?? ""),
        new_value: String(change.new_value ?? ""),
        changes: change.field,
        modified_by: user,
      });
    }

    updatedProduct.iteration_number = currentIteration;
    await updatedProduct.save();

    // Save log to ProductLogs
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
        "Product Update ALERT",
        ` Product has been updated  - ${updatedProduct.product_name}`,
        "",
        "",
        "Product",
        {
          model_id: updatedProduct._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }
    logger.info(`✅ Edited product: ${updatedProduct.sku_code}`);
    return sendSuccess(res, updatedProduct, "Product updated successfully");
  } catch (err) {
    logger.error(`❌ Edit product error: ${err.message}`);
    return sendError(res, err);
  }
};
// src/controller/product.js
// ---------------------------------------------------------------
// 🔹 EDIT – single product (with change-logs)
// ---------------------------------------------------------------
exports.editProductSingle = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body; // fields we want to change
    const userId = req.user?.id || patch.updated_by || "system";

    /* ─────── 1. Fetch current document ─────── */
    const product = await Product.findById(id);
    if (!product) return sendError(res, "Product not found", 404);

    /* ─────── 2. Handle image uploads (optional) ─────── */
    if (req.files?.length) {
      const uploads = [];
      for (const file of req.files) {
        const { Location } = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "products"
        );
        uploads.push(Location);
      }

      patch.images = uploads;
    }

    /* ─────── 3. Detect changes ─────── */
    const changedFields = [];
    const changeLogs = []; // array of { field, old_value, new_value }

    Object.keys(patch).forEach((key) => {
      const newVal = patch[key];
      const oldVal = product[key];

      const hasChanged =
        typeof newVal === "object"
          ? JSON.stringify(oldVal) !== JSON.stringify(newVal)
          : oldVal != newVal; // loose compare on purpose (null/"" etc.)

      if (hasChanged) {
        changedFields.push(key);

        changeLogs.push({
          field: key,
          old_value: JSON.stringify(oldVal ?? ""),
          new_value: JSON.stringify(newVal ?? ""),
        });

        // apply change onto the in-memory product instance
        product[key] = newVal;
      }
    });

    if (!changedFields.length)
      return sendSuccess(res, product, "No changes detected");

    /* ─────── 4. Build & push change-log(s) ─────── */
    const nextIter = (product.iteration_number || 0) + 1;

    changeLogs.forEach((c) =>
      product.change_logs.push({
        iteration_number: nextIter,
        old_value: c.old_value,
        new_value: c.new_value,
        changes: c.field,
        modified_by: userId,
      })
    );

    product.iteration_number = nextIter;
    product.updated_at = new Date();

    /* ─────── 5. Persist & respond ─────── */
    await product.save();
    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const user = userData.data.data.find((user) => user._id === userId);
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
        "Product Update ALERT",
        ` Product has been updated by ${user ? user.user_name || user.username : "system"} - ${product.product_name
        }`,
        "",
        "",
        "Product",
        {
          model_id: product._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`✅ Product edited (sku: ${product.sku_code}) by ${userId}`);
    return sendSuccess(res, product, "Product updated successfully");
  } catch (err) {
    logger.error(`❌ editProductSingle: ${err.message}`);
    return sendError(res, err);
  }
};

exports.searchProductsForDashboard = async (req, res) => { };

exports.getProductsForDashboard = async (req, res) => {
  try {
    /* ------------------------------------------------------------
     * 1. Pull the possible filters off the query-string
     *    (add / remove keys here as your model evolves)
     * ---------------------------------------------------------- */
    const {
      brand,
      category,
      sub_category,
      product_type,
      model,
      variant, // supports multi-select: ?variant=id1,id2
      make, // ?make=Honda,Suzuki
      year_range, // ?year_range=640e8e6...,640e8e7...
      is_universal,
      is_consumable,
    } = req.query;

    /* ------------------------------------------------------------
     * 2. Build a MongoDB filter object only with supplied params
     * ---------------------------------------------------------- */
    const filter = {};

    // Helpers – split comma-separated lists into [$in] arrays
    const csvToIn = (val) => val.split(",").map((v) => v.trim());

    if (brand) filter.brand = { $in: csvToIn(brand) };
    if (category) filter.category = { $in: csvToIn(category) };
    if (sub_category) filter.sub_category = { $in: csvToIn(sub_category) };
    if (product_type) filter.product_type = { $in: csvToIn(product_type) };
    if (model) filter.model = { $in: csvToIn(model) };
    if (variant) filter.variant = { $in: csvToIn(variant) };
    if (make) filter.make = { $in: csvToIn(make) };
    if (year_range) filter.year_range = { $in: csvToIn(year_range) };

    // Booleans arrive as strings – normalise: "true" → true
    if (is_universal !== undefined)
      filter.is_universal = is_universal === "true";
    if (is_consumable !== undefined)
      filter.is_consumable = is_consumable === "true";

    logger.debug(`🔎 Product filter → ${JSON.stringify(filter)}`);

    /* ------------------------------------------------------------
     * 3. Execute query – populate common refs for convenience
     * ---------------------------------------------------------- */
    const products = await Product.find(filter).populate(
      "brand category sub_category model variant year_range"
    );

    return sendSuccess(res, products, "Products fetched successfully");
  } catch (err) {
    logger.error(`❌ getProductsByFilters error: ${err.message}`);
    return sendError(res, err);
  }
};
//Qc Cycle
exports.rejectProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "Not specified", rejectedBy } = req.body;

    const dataUser = await axios.get(
      `http://user-service:5001/api/users/${rejectedBy}`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );
    console.log(dataUser.data.data);
    const userId = dataUser.data.data?.username || "system";

    const product = await Product.findById(id);
    if (!product) return sendError(res, "Product not found", 404);

    // capture old values for the log
    const oldVals = {
      live_status: product.live_status,
      Qc_status: product.Qc_status,
    };

    // update fields
    product.live_status = "Rejected";
    product.Qc_status = "Rejected";
    product.rejection_state.push({
      rejected_by: userId,
      reason,
    });

    buildChangeLog({
      product,
      changedFields: ["live_status", "Qc_status", "rejection_state"],
      oldVals,
      newVals: {
        live_status: product.live_status,
        Qc_status: product.Qc_status,
      },
      userId,
    });

    await product.save();

    /* optional elastic / external log */
    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const user = userData.data.data.find((user) => user._id === userId);
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
        "Product Rejected ALERT",
        ` Product has been rejected by ${user ? user.user_name || user.username : "system"
        } - ${product.product_name}`,
        "",
        "",
        "Product",
        {
          model_id: product._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`🛑 Rejected product ${product.sku_code} by ${userId}`);
    return sendSuccess(res, product, "Product rejected");
  } catch (err) {
    logger.error(`rejectProduct error: ${err.message}`);
    return sendError(res, err);
  }
};
exports.approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "system";

    const product = await Product.findById(id);
    if (!product) return sendError(res, "Product not found", 404);

    const oldVals = {
      live_status: product.live_status,
      Qc_status: product.Qc_status,
    };

    product.live_status = "Approved"; // or "Live" if that's your rule
    product.Qc_status = "Approved";

    buildChangeLog({
      product,
      changedFields: ["live_status", "Qc_status"],
      oldVals,
      newVals: {
        live_status: product.live_status,
        Qc_status: product.Qc_status,
      },
      userId,
    });

    await product.save();

    // await writeProductLog?.({
    //   job_type: "Update",
    //   product_ref: product._id,
    //   user: userId,
    //   changed_fields: ["live_status", "Qc_status"],
    // });
    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const user = userData.data.data.find((user) => user._id === userId);
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
        "Product Approved ALERT",
        ` Product has been approved by ${user ? user.user_name || user.username : "system"
        } - ${product.product_name}`,
        "",
        "",
        "Product",
        {
          model_id: product._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`✅ Approved product ${product.sku_code} by ${userId}`);
    return sendSuccess(res, product, "Product approved");
  } catch (err) {
    logger.error(`approveProduct error: ${err.message}`);
    return sendError(res, err);
  }
};
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate(
      "brand category sub_category model variant year_range"
    );
    if (!product) return sendError(res, "Product not found", 404);

    // Populate dealer details from user service
    if (product.available_dealers && product.available_dealers.length > 0) {
      const authorizationHeader = req.headers.authorization;
      const dealerPromises = product.available_dealers.map(async (dealer) => {
        const dealerDetails = await fetchDealerDetails(dealer.dealers_Ref, authorizationHeader);
        return {
          ...dealer.toObject(),
          dealer_details: dealerDetails,
        };
      });

      // Wait for all dealer details to be fetched
      const populatedDealers = await Promise.all(dealerPromises);
      product.available_dealers = populatedDealers;
    }

    return sendSuccess(res, product, "Product fetched successfully");
  } catch (err) {
    logger.error(`getProductById error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getProductBulkSessionLogs = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ProductBulkSession.findById(sessionId).populate({
      path: "logs.productId",
      populate: [
        { path: "brand" },
        { path: "category" },
        { path: "sub_category" },
        { path: "model" },
        { path: "variant" },
        { path: "year_range" },
      ],
    });

    if (!session) return sendError(res, "Session not found", 404);

    // Optionally flatten logs for response
    const logs = session.logs.map((log) => ({
      productId: log.productId, // full populated product doc or null
      message: log.message,
    }));

    return sendSuccess(res, logs, "Bulk session logs fetched successfully");
  } catch (err) {
    logger.error(`getProductBulkSessionLogs error: ${err.message}`);
    return sendError(res, err.message || err);
  }
};

exports.getAllProductBulkSessions = async (req, res) => {
  try {
    const sessions = await ProductBulkSession.find({}).sort({ created_at: -1 }); // Sort by newest first

    return sendSuccess(
      res,
      sessions,
      "Bulk upload sessions fetched successfully"
    );
  } catch (err) {
    logger?.error(`getAllProductBulkSessions error: ${err.message}`);
    return sendError(res, err.message || err);
  }
};

exports.getAssignedDealers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    // 1) Load product, projecting only the available_dealers field
    const product = await Product.findById(id)
      .select("available_dealers")
      .lean();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // 2) Sort dealers by priority_override, then by quantity
    const sorted = (product.available_dealers || []).slice().sort((a, b) => {
      if (
        (b.dealer_priority_override || 0) !== (a.dealer_priority_override || 0)
      ) {
        return (
          (b.dealer_priority_override || 0) - (a.dealer_priority_override || 0)
        );
      }
      return (b.quantity_per_dealer || 0) - (a.quantity_per_dealer || 0);
    });

    // 3) Populate dealer details and return them
    const authorizationHeader = req.headers.authorization;
    const dealersWithDetails = await Promise.all(
      sorted.map(async (d) => {
        const dealerDetails = await fetchDealerDetails(d.dealers_Ref, authorizationHeader);
        return {
          dealerId: d.dealers_Ref,
          quantityAvailable: d.quantity_per_dealer,
          dealerMargin: d.dealer_margin,
          priorityOverride: d.dealer_priority_override,
          inStock: d.inStock,
          dealer_details: dealerDetails,
        };
      })
    );

    return res.json({
      success: true,
      message: "Available dealers fetched",
      data: dealersWithDetails,
    });
  } catch (err) {
    console.error("getAssignedDealers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.decrementDealerStock = async (req, res) => {
  try {
    const { id, dealerId } = req.params;
    const { decrementBy } = req.body || {};

    /* ───── 1. Validate inputs ───── */
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(dealerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productId or dealerId",
      });
    }

    const qty = Number(decrementBy);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "decrementBy must be a positive number",
      });
    }

    /* ───── 2. Atomically decrement dealer stock ───── */
    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        "available_dealers.dealers_Ref": dealerId,
        "available_dealers.quantity_per_dealer": { $gte: qty },
      },
      { $inc: { "available_dealers.$.quantity_per_dealer": -qty } },
      { new: true } // return the full updated product
    ).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product or dealer not found, or dealer stock is insufficient",
      });
    }

    /* ───── 3. Find the updated dealer entry ───── */
    const updatedDealer = product.available_dealers.find(
      (d) => d.dealers_Ref.toString() === dealerId
    );

    // Fallback safety check
    if (!updatedDealer) {
      return res.status(500).json({
        success: false,
        message: "Dealer entry missing after update",
      });
    }

    /* ───── 4. Respond with updated data ───── */
    return res.json({
      success: true,
      message: "Dealer stock decremented",
      data: {
        dealerId: updatedDealer.dealers_Ref,
        quantityAvailable: updatedDealer.quantity_per_dealer,
        dealerMargin: updatedDealer.dealer_margin,
        priorityOverride: updatedDealer.dealer_priority_override,
      },
    });
  } catch (err) {
    console.error("decrementDealerStock error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.disableProductsByDealer = async (req, res) => {
  try {
    const { dealerId } = req.body;

    if (!dealerId) {
      return res.status(400).json({ message: "dealerId is required" });
    }

    const result = await Product.updateMany(
      { "available_dealers.dealers_Ref": dealerId },
      {
        $set: {
          "available_dealers.$[dealer].inStock": false,
          updated_at: new Date(),
        },
      },
      {
        arrayFilters: [{ "dealer.dealers_Ref": dealerId }],
      }
    );

    res.status(200).json({
      message: `Products updated for dealer ${dealerId}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error disabling dealer products:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

//Reports Generation

exports.generateProductReports = async (req, res) => {
  try {
    const {
      brand,
      category,
      sub_category,
      is_returnable,
      out_of_stock,
      live_status,
      Qc_status,
      startDate,
      endDate,
      exportType = "json", // or 'csv'
    } = req.query;

    const filter = {};

    if (brand) filter.brand = brand;
    if (category) filter.category = category;
    if (sub_category) filter.sub_category = sub_category;
    if (is_returnable !== undefined)
      filter.is_returnable = is_returnable === "true";
    if (out_of_stock !== undefined)
      filter.out_of_stock = out_of_stock === "true";
    if (live_status) filter.live_status = live_status;
    if (Qc_status) filter.Qc_status = Qc_status;

    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }

    const products = await Product.find(filter).sort({ created_at: -1 }).lean();

    // === KPI Summaries ===
    const totalProducts = products.length;
    const outOfStock = products.filter((p) => p.out_of_stock).length;
    const returnable = products.filter((p) => p.is_returnable).length;

    const qcStatusBreakdown = products.reduce((acc, p) => {
      acc[p.Qc_status] = (acc[p.Qc_status] || 0) + 1;
      return acc;
    }, {});

    const liveStatusBreakdown = products.reduce((acc, p) => {
      acc[p.live_status] = (acc[p.live_status] || 0) + 1;
      return acc;
    }, {});

    const avgStock =
      products.reduce((sum, p) => sum + (p.no_of_stock || 0), 0) /
      (products.length || 1);

    // === Export logic ===
    if (exportType === "csv") {
      const fields = [
        "sku_code",
        "product_name",
        "manufacturer_part_name",
        "brand",
        "category",
        "sub_category",
        "product_type",
        "out_of_stock",
        "is_returnable",
        "live_status",
        "Qc_status",
        "no_of_stock",
        "created_by",
        "created_at",
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(products);

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=product-report.csv"
      );
      res.setHeader("Content-Type", "text/csv");
      return res.status(200).send(csv);
    }

    res.status(200).json({
      success: true,
      summary: {
        totalProducts,
        outOfStock,
        returnable,
        avgStock: Math.round(avgStock * 100) / 100,
        qcStatusBreakdown,
        liveStatusBreakdown,
      },
      data: products,
    });
  } catch (err) {
    console.error("Product report generation error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate product report" });
  }
};
exports.getProductByDealerId = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { userId } = req.query;

    if (!dealerId && !userId) {
      return res.status(400).json({ message: "Either dealerId or userId is required" });
    }

    let dealerIds = [];

    if (dealerId) {
      // If dealerId is provided, use it directly
      dealerIds = [dealerId];
    } else if (userId) {
      // If userId is provided, fetch dealer IDs from user service
      const authorizationHeader = req.headers.authorization;
      const dealers = await fetchDealersByUserId(userId, authorizationHeader);

      if (!dealers || dealers.length === 0) {
        return res.status(404).json({ message: "No dealers found for this user" });
      }

      // Extract dealer IDs from the dealers array
      dealerIds = dealers.map(dealer => dealer.dealerId || dealer._id);
    }

    // Find products that have any of the dealer IDs in their available_dealers
    const products = await Product.find({
      "available_dealers.dealers_Ref": { $in: dealerIds },
    })
      .populate("brand category sub_category model variant year_range")
      .lean();

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for the specified dealer(s)" });
    }

    return sendSuccess(res, products, "Products fetched successfully");
  } catch (err) {
    console.error("getProductByDealerId error:", err);
    return sendError(res, err.message || "Internal server error");
  }
};

exports.bulkapproveProduct = async (req, res) => {
  try {
    const { productIds } = req.body;
    const userId = req.user?.id || "system";
    let result = [];

    for (const id of productIds) {
      try {
        const product = await Product.findById(id);
        if (!product) {
          result.push({
            productId: id,
            status: "failed",
            message: "Product not found",
          });
          continue;
        }

        const oldVals = {
          live_status: product.live_status,
          Qc_status: product.Qc_status,
        };

        product.live_status = "Approved"; // or "Live" if that's your rule
        product.Qc_status = "Approved";

        buildChangeLog({
          product,
          changedFields: ["live_status", "Qc_status"],
          oldVals,
          newVals: {
            live_status: product.live_status,
            Qc_status: product.Qc_status,
          },
          userId,
        });

        const updatedProduct = await product.save();
        result.push({
          productId: id,
          status: "success",
          message: "Product approved successfully",
          product: updatedProduct,
        });
      } catch (err) {
        logger.error(`Error approving product ${id}: ${err.message}`);
        result.push({
          productId: id,
          status: "failed",
          message: err.message || "Unknown error",
        });
        continue; // Skip this product and continue with the next
      }
    }

    // await writeProductLog?.({
    //   job_type: "Update",
    //   product_ref: product._id,
    //   user: userId,
    //   changed_fields: ["live_status", "Qc_status"],
    // });
    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const user = userData.data.data.find((user) => user._id === userId);
    let filteredUsers = userData.data.data.filter(
      (user) =>
        user.role === "Super-admin" ||
        user.role === "Inventory-Admin" ||
        user.role === "Inventory-Staff"
    );
    let users = filteredUsers.map((user) => user._id);
    console.log("Users to notify:", user);
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        users,
        ["INAPP", "PUSH"],
        "Product Approved ALERT",
        ` ${result.reduce((acc, item) => {
          if (item.status === "success") {
            return acc + 1;
          } else {
            return acc;
          }
        }, 0)} Products have been approved by ${user ? user.user_name || user.username : "system"
        } - `,
        "",
        "",
        "Product",
        {},
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(
      `✅ ${result.reduce((acc, item) => {
        if (item.status === "success") {
          return acc + 1;
        } else {
          return acc;
        }
      })} Approved product by ${userId}`
    );
    return sendSuccess(res, result, "Product approved");
  } catch (err) {
    logger.error(`approveProduct error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.bulkrejectProduct = async (req, res) => {
  try {
    const { productIds, reason = "Not specified", rejectedBy } = req.body;

    const dataUser = await axios.get(
      `http://user-service:5001/api/users/${rejectedBy}`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      }
    );
    console.log(dataUser.data.data);
    const userId = dataUser.data.data?.username || "system";
    let result = [];
    for (const id of productIds) {
      try {
        const product = await Product.findById(id);
        if (!product) {
          result.push({
            productId: id,
            status: "failed",
            message: "Product not found",
          });
          continue;
        }

        // capture old values for the log
        const oldVals = {
          live_status: product.live_status,
          Qc_status: product.Qc_status,
        };

        // update fields
        product.live_status = "Rejected";
        product.Qc_status = "Rejected";
        product.rejection_state.push({
          rejected_by: userId,
          reason,
        });

        buildChangeLog({
          product,
          changedFields: ["live_status", "Qc_status", "rejection_state"],
          oldVals,
          newVals: {
            live_status: product.live_status,
            Qc_status: product.Qc_status,
          },
          userId,
        });

        await product.save();

        result.push({
          productId: id,
          status: "success",
          message: "Product rejected successfully",
          product,
        });
      } catch (err) {
        logger.error(`Error rejecting product ${id}: ${err.message}`);
        result.push({
          productId: id,
          status: "failed",
          message: err.message || "Unknown error",
        });
        continue;
      }
    }

    /* optional elastic / external log */
    const userData = await axios.get(`http://user-service:5001/api/users/`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const user = userData.data.data.find((user) => user._id === userId);
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
        "Product Rejected ALERT",
        `  ${result.reduce((acc, item) => {
          if (item.status === "success") {
            return acc + 1;
          } else {
            return acc;
          }
        }, 0)} Product has been rejected by ${user ? user.user_name || user.username : "system"
        } `,
        "",
        "",
        "Product",
        {},
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(
      `🛑  ${result.reduce((acc, item) => {
        if (item.status === "success") {
          return acc + 1;
        } else {
          return acc;
        }
      }, 0)}Rejected product   by ${userId}`
    );
    return sendSuccess(res, result, "Product rejected");
  } catch (err) {
    logger.error(`rejectProduct error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.updateProductDealerStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { dealerId, quantity } = req.body;

    if (!dealerId || !quantity) {
      return res
        .status(400)
        .json({ message: "dealerId and quantity are required" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.available_dealers = product.available_dealers.map((dealer) => {
      if (dealer.dealers_Ref.toString() === dealerId) {
        return {
          ...dealer,
          quantity_per_dealer: quantity,
          inStock: quantity > 0,
        };
      }
      return dealer;
    });
    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      product: updatedProduct,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: error });
  }
};

exports.getProductsByFiltersWithPagination = async (req, res) => {
  try {
    const {
      brand,
      category,
      sub_category,
      product_type,
      model,
      variant,
      make,
      year_range,
      is_universal,
      is_consumable,
      query,
      page = 1,
      limit = 10,
      status,
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};
    const statusConditions = [];
    const searchConditions = [];

    const csvToIn = (val) => val.split(",").map((v) => v.trim());

    // Handle status filtering
    if (status) {
      if (status === "all") {
        // No status filter - show all products
      } else if (status.includes(",")) {
        const statusArray = csvToIn(status);
        statusConditions.push(
          { live_status: { $in: statusArray } },
          { Qc_status: { $in: statusArray } }
        );
      } else {
        statusConditions.push(
          { live_status: status },
          { Qc_status: status }
        );
      }
    } else {
      // Default behavior: show approved and live products only
      statusConditions.push(
        { live_status: "Approved", Qc_status: "Approved" },
        { live_status: "Live", Qc_status: "Approved" }
      );
    }

    // Add text search filter if query parameter exists
    if (query && query.trim() !== "") {
      const searchTerm = query.trim();
      searchConditions.push(
        { product_name: { $regex: searchTerm, $options: "i" } },
        { manufacturer_part_name: { $regex: searchTerm, $options: "i" } },
        { sku_code: { $regex: searchTerm, $options: "i" } }
      );
    }

    // Combine status and search conditions
    if (statusConditions.length > 0 && searchConditions.length > 0) {
      // Both status and search filters - need to combine them with $and
      filter.$and = [
        { $or: statusConditions },
        { $or: searchConditions }
      ];
    } else if (statusConditions.length > 0) {
      // Only status filter
      filter.$or = statusConditions;
    } else if (searchConditions.length > 0) {
      // Only search filter
      filter.$or = searchConditions;
    }

    if (brand) filter.brand = { $in: csvToIn(brand) };
    if (category) filter.category = { $in: csvToIn(category) };
    if (sub_category) filter.sub_category = { $in: csvToIn(sub_category) };
    if (product_type) filter.product_type = { $in: csvToIn(product_type) };
    if (model) filter.model = { $in: csvToIn(model) };
    if (variant) filter.variant = { $in: csvToIn(variant) };
    if (make) filter.make = { $in: csvToIn(make) };
    if (year_range) filter.year_range = { $in: csvToIn(year_range) };
    if (is_universal !== undefined)
      filter.is_universal = is_universal === "true";
    if (is_consumable !== undefined)
      filter.is_consumable = is_consumable === "true";

    logger.debug(`🔎 Product filter → ${JSON.stringify(filter)}`);

    // Get total count of documents (for pagination metadata)
    const total = await Product.countDocuments(filter);

    // Base query
    let productsQuery = Product.find(filter)
      .populate("brand category sub_category model variant year_range")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Execute the query
    let products = await productsQuery.exec();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    return sendSuccess(
      res,
      {
        products,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: pageNumber,
          itemsPerPage: limitNumber,
          hasNextPage,
          hasPreviousPage,
        },
      },
      "Products fetched successfully with pagination"
    );
  } catch (err) {
    logger.error(`❌ getProductsByFiltersWithPagination error: ${err.stack}`);
    return sendError(res, err.message || "Internal server error");
  }
};

exports.createProductSingleByDealer = async (req, res) => {
  try {
    const data = req.body;
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "products"
        );
        imageUrls.push(uploaded.Location);
      }
    }

    // Generate SKU automatically
    let generatedSku;
    try {
      // Get the category to determine vehicle type
      const category = await Category.findById(data.category).populate('type');
      if (!category) {
        return sendError(res, "Category not found", 404);
      }

      // Determine vehicle type based on category's type
      const vehicleType = category.type.type_name.toLowerCase();
      let vehicleCode = 'T'; // Default to two-wheeler

      if (vehicleType.includes('four') || vehicleType.includes('4') || vehicleType.includes('car') || vehicleType.includes('auto')) {
        vehicleCode = 'F'; // Four-wheeler
      }

      // Get the highest existing SKU number for this vehicle type
      const existingSkus = await Product.find({
        sku_code: { $regex: `^TOP${vehicleCode}\\d+$` }
      }).select('sku_code').sort({ sku_code: -1 });

      let nextNumber = 1000000; // Starting number
      if (existingSkus.length > 0) {
        // Extract the number from the highest SKU and increment
        const highestSku = existingSkus[0].sku_code;
        const currentNumber = parseInt(highestSku.substring(4)); // Remove 'TOPX' prefix
        nextNumber = currentNumber + 1;
      }

      generatedSku = `TOP${vehicleCode}${nextNumber}`;
    } catch (skuError) {
      logger.error(`SKU generation error: ${skuError.message}`);
      return sendError(res, "Failed to generate SKU", 500);
    }

    // Remove SKU from request data if provided (since we're generating it automatically)
    const { sku_code, ...productDataWithoutSku } = data;

    const productPayload = {
      ...productDataWithoutSku,
      sku_code: generatedSku,
      available_dealers: [
        {
          dealers_Ref: req.body.addedByDealerId,
          quantity_per_dealer: 0,
          inStock: false,
          dealer_margin: 0,
          dealer_priority_override: 0,
        },
      ],
      addedByDealerId: req.body.addedByDealerId,
      addedByDealer: true,
      images: imageUrls,
    };
    console.log(productPayload);

    const newProduct = await Product.create(productPayload);

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
        "Product Create ALERT",
        `New Product has been created  - ${newProduct.product_name}`,
        "",
        "",
        "Product",
        {
          model_id: newProduct._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully");
    }

    logger.info(`✅ Created new product: ${newProduct.sku_code}`);
    return sendSuccess(res, newProduct, "Product created successfully");
  } catch (err) {
    logger.error(`❌ Create product error: ${err.message}`);
    return sendError(res, err);
  }
};

exports.getAllProductsAddedByDealerWithPagination = async (req, res) => {
  try {
    const { pageNumber, limitNumber, status, product_name, dealerId } =
      req.query;
    let filter = {};
    filter.addedByDealer = true;

    if (product_name) {
      filter.product_name = { $regex: product_name, $options: "i" };
    }
    if (dealerId) {
      filter.addedByDealerId = dealerId;
    }
    if (status) {
      filter.live_status = status;
    }
    if (!pageNumber || isNaN(pageNumber) || pageNumber < 1)
      return sendError(res, "Invalid page number", 400);
    if (!limitNumber || isNaN(limitNumber) || limitNumber < 1)
      return sendError(res, "Invalid limit number", 400);
    const products = await Product.find(filter)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;
    return sendSuccess(
      res,
      {
        products,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: pageNumber,
          itemsPerPage: limitNumber,
          hasNextPage,
          hasPreviousPage,
        },
      },
      "Products fetched successfully with pagination"
    );
  } catch (err) {
    logger.error(`❌ getProductsByFiltersWithPagination error: ${err.stack}`);
    return sendError(res, err.message || "Internal server error");
  }
};

exports.enableproductsByDealer = async (req, res) => {
  try {
    const { dealerId } = req.body;

    if (!dealerId) {
      return res.status(400).json({ message: "dealerId is required" });
    }

    const result = await Product.updateMany(
      { "available_dealers.dealers_Ref": dealerId },
      {
        $set: {
          "available_dealers.$[dealer].inStock": true,
          updated_at: new Date(),
        },
      },
      {
        arrayFilters: [{ "dealer.dealers_Ref": dealerId }],
      }
    );

    res.status(200).json({
      message: `Products updated for dealer ${dealerId}`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error disabling dealer products:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      count = 10,
      brand,
      category,
      sub_category,
      variant,
      model,
    } = req.query;

    const filter = {
      _id: { $ne: new mongoose.Types.ObjectId(productId) }, // Exclude current product
    };

    if (brand) filter.brand = new mongoose.Types.ObjectId(brand);
    if (category) filter.category = new mongoose.Types.ObjectId(category);
    if (sub_category)
      filter.sub_category = new mongoose.Types.ObjectId(sub_category);
    if (model) filter.model = new mongoose.Types.ObjectId(model);
    if (variant) {
      filter.variant = Array.isArray(variant)
        ? { $in: variant.map((v) => new mongoose.Types.ObjectId(v)) }
        : new mongoose.Types.ObjectId(variant);
    }

    const similarProducts = await Product.aggregate([
      { $match: filter },
      { $sample: { size: parseInt(count) } },
      // Populate brand
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: "$brand" },
      // Populate category
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      // Populate subcategory
      {
        $lookup: {
          from: "subcategories",
          localField: "sub_category",
          foreignField: "_id",
          as: "sub_category",
        },
      },
      { $unwind: "$sub_category" },
      // Populate model (optional)
      {
        $lookup: {
          from: "models",
          localField: "model",
          foreignField: "_id",
          as: "model",
        },
      },
      { $unwind: { path: "$model", preserveNullAndEmptyArrays: true } },
      // Populate variant (optional)
      {
        $lookup: {
          from: "variants",
          localField: "variant",
          foreignField: "_id",
          as: "variant",
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Similar products fetched successfully",
      data: similarProducts,
    });
  } catch (error) {
    console.error("Error getting similar products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching similar products",
      error: error.message,
    });
  }
};

exports.assignDealersForProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { dealerData } = req.body;

    // First try to find by ObjectId, if that fails, try to find by SKU code
    let product;

    if (mongoose.isValidObjectId(productId)) {
      product = await Product.findById(productId);
    } else {
      // If not a valid ObjectId, treat it as SKU code
      product = await Product.findOne({ sku_code: productId });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID/SKU: ${productId}`
      });
    }

    dealerData.forEach((dealer) => {
      const existingDealer = product.available_dealers.find(
        (d) => d.dealers_Ref.toString() === dealer.dealers_Ref.toString()
      );
      if (existingDealer) {
        existingDealer.inStock = dealer.inStock;
        existingDealer.quantity_per_dealer = dealer.quantity_per_dealer;
        existingDealer.dealer_margin = dealer.dealer_margin;
        existingDealer.dealer_priority_override = dealer.dealer_priority_override;
      } else {
        product.available_dealers.push({
          dealers_Ref: dealer.dealers_Ref,
          inStock: dealer.quantity_per_dealer > 0 ? true : false,
          quantity_per_dealer: dealer.quantity_per_dealer,
          dealer_margin: dealer.dealer_margin,
          dealer_priority_override: dealer.dealer_priority_override,
        });
      }
    });

    const savedProduct = await product.save();
    res.status(200).json({
      success: true,
      data: savedProduct,
      message: "Dealers assigned to product successfully",
    });
  } catch (error) {
    console.error("Error assigning dealers to product:", error);
    res
      .status(500)
      .json({ success: false, message: "Error assigning dealers to product" });
  }
};

exports.bulkUploadProductsByDealer = async (req, res) => {
  /* ─────────────────────────  Helpers  ───────────────────────── */
  const safeTrim = (v) => (v == null ? "" : String(v).trim());

  const normalizeName = (name) => safeTrim(name).replace(/\s+/g, " "); // Normalize multiple spaces to single space
  console.log("📦 [BulkUpload] started", req.body.dealerId);
  const REQUIRED = [
    "product_name",
    "manufacturer_part_name",
    "category",
    "sub_category",
    "brand",
    "product_type",
  ];

  /* ───────────────────  0  Metadata & Auth  ─────────────────── */
  const t0 = Date.now();
  logger.info(`📦 [BulkUpload] started ${new Date().toISOString()}`);

  let userId = null;
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
        algorithms: ["ES256"],
      });
      userId = decoded?.id || decoded?._id || null;
      logger.info(`👤  Verified user ${userId}`);
    } catch (e) {
      logger.warn(`🔒  verify() failed (${e.message}) – fallback to decode`);
      const decoded = jwt.decode(token);
      userId = decoded?.id || decoded?._id || null;
      logger.info(`👤  Decoded user ${userId || "UNKNOWN"}`);
    }
  } else {
    logger.warn("🔒  No Bearer token – created_by will be null");
  }

  /* ─────────────────────  1  Input Files  ───────────────────── */
  const excelBuf = req.files?.dataFile?.[0]?.buffer;
  const zipBuf = req.files?.imageZip?.[0]?.buffer;
  if (!excelBuf || !zipBuf)
    return sendError(res, "Both dataFile & imageZip are required", 400);

  /* ───────────────────  2  Create Bulk Session  ─────────────── */
  const session = await ProductBulkSession.create({
    sessionTime: new Date(),
    sessionId: new mongoose.Types.ObjectId().toString(),
    status: "Pending",
    created_by: userId,
    created_by_role: userRole,
    requires_approval: requiresApproval,
    no_of_products: 0,
    total_products_successful: 0,
    total_products_failed: 0,
    logs: [],
  });

  try {
    /* ──────────────  3  Parse Excel  ────────────── */
    const wb = XLSX.read(excelBuf, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    logger.info(`📄 Parsed ${rows.length} rows`);
    session.no_of_products = rows.length;

    /* ──────────────  4  Upload Images (parallel)  ────────────── */
    const imageMap = {}; // partName(lowercase) → S3 URL
    let totalZip = 0,
      imgOk = 0,
      imgSkip = 0,
      imgFail = 0;
    const uploadPromises = [];

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

      uploadPromises.push(
        (async () => {
          const buf = Buffer.concat(await streamToChunks(entry));
          try {
            const { Location } = await uploadFile(buf, base, mime, "products");
            imageMap[key] = Location;
            imgOk++;
            logger.debug(`🖼️ Uploaded ${base}`);
          } catch (e) {
            imgFail++;
            logger.error(`❌ Upload ${base} failed: ${e.message}`);
          }
        })()
      );
    }
    await Promise.allSettled(uploadPromises);
    logger.info(
      `🗂️ ZIP done  total:${totalZip} ok:${imgOk} skip:${imgSkip} fail:${imgFail}`
    );

    /* ──────────────  5  Build Category/Subcategory maps  ────────────── */
    const uniqBrands = [
      ...new Set(rows.map((r) => normalizeName(r.brand)).filter(Boolean)),
    ];

    const brandDocs = await Brand.find({ brand_name: { $in: uniqBrands } });

    const brandMap = new Map(
      brandDocs.map((b) => [normalizeName(b.brand_name), b._id])
    );
    const uniqCats = [
      ...new Set(rows.map((r) => normalizeName(r.category)).filter(Boolean)),
    ];
    const uniqSubs = [
      ...new Set(
        rows.map((r) => normalizeName(r.sub_category)).filter(Boolean)
      ),
    ];
    const uniqModels = [
      ...new Set(rows.map((r) => normalizeName(r.model)).filter(Boolean)),
    ];
    const uniqVariants = [
      ...new Set(
        rows
          .flatMap((r) => (r.variant || "").split(","))
          .map((v) => normalizeName(v))
          .filter(Boolean)
      ),
    ];

    const modelDocs = await Model.find({ model_name: { $in: uniqModels } });
    const variantDocs = await Variant.find({
      variant_name: { $in: uniqVariants },
    });

    const modelMap = new Map(
      modelDocs.map((d) => [normalizeName(d.model_name), d._id])
    );
    const variantMap = new Map(
      variantDocs.map((d) => [normalizeName(d.variant_name), d._id])
    );

    const catDocs = await Category.find({
      $or: [{ name: { $in: uniqCats } }, { category_name: { $in: uniqCats } }],
    });

    const subDocs = await SubCategory.find({
      $or: [
        { name: { $in: uniqSubs } },
        { subcategory_name: { $in: uniqSubs } },
      ],
    });

    // Create case-sensitive maps preserving original spacing
    const categoryMap = new Map();
    catDocs.forEach((c) => {
      const key = c.name || c.category_name;
      categoryMap.set(normalizeName(key), c._id);
    });

    const subcategoryMap = new Map();
    subDocs.forEach((s) => {
      const key = s.name || s.subcategory_name;
      subcategoryMap.set(normalizeName(key), s._id);
    });

    /* ──────────────  6  Transform Rows → Docs  ────────────── */
    const docs = [];
    const errors = [];
    const seen = new Set(); // to detect duplicate SKU
    const sessionLogs = [];
    let failed = 0; // rows skipped or Mongo-failed

    // Process rows sequentially to handle async SKU generation
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      /* 6.1  Skip if any REQUIRED field empty */
      const missing = REQUIRED.filter((k) => !safeTrim(row[k]));
      if (missing.length) {
        errors.push({
          row: i + 2,
          error: `Missing fields: ${missing.join(", ")}`,
          rowData: row,
        });
        sessionLogs.push({
          message: `Skipped (missing ${missing.join(", ")})`,
          productId: null,
        });
        failed++;
        continue;
      }

      /* 6.2  Extract & normalise fields */
      const name = safeTrim(row.product_name);
      const part = safeTrim(row.manufacturer_part_name);

      /* 6.3  Category / Subcategory mapping – skip if unknown */
      const categoryKey = normalizeName(row.category);
      const subcategoryKey = normalizeName(row.sub_category);

      const categoryId = categoryMap.get(categoryKey);
      const subcategoryId = subcategoryMap.get(subcategoryKey);
      if (!categoryId || !subcategoryId) {
        const msg = !categoryId
          ? `Unknown category '${row.category}'`
          : `Unknown sub_category '${row.sub_category}'`;
        errors.push({ row: i + 2, error: msg, rowData: row });
        failed++;
        continue;
      }

      /* 6.2  Generate SKU based on category */
      let sku;
      try {
        sku = await genSKU(categoryId);
        if (seen.has(sku)) {
          errors.push({ row: i + 2, sku, error: "Duplicate SKU", rowData: row });
          sessionLogs.push({ message: "Duplicate SKU", productId: null });
          failed++;
          continue;
        }
        seen.add(sku);
      } catch (skuError) {
        errors.push({
          row: i + 2,
          error: `SKU generation failed: ${skuError.message}`,
          rowData: row
        });
        sessionLogs.push({ message: "SKU generation failed", productId: null });
        failed++;
        continue;
      }

      /* 6.3½  Brand mapping – skip row if unknown */
      const brandId = brandMap.get(normalizeName(row.brand));
      if (!brandId) {
        errors.push({
          row: i + 2,
          error: `Unknown brand «${row.brand}»`,
          rowData: row,
        });
        failed++;
        continue;
      }

      /* 6.3¾  Model & Variant mapping  */
      const modelId = modelMap.get(normalizeName(row.model));
      if (!modelId) {
        errors.push({
          row: i + 2,
          error: `Unknown model «${row.model}»`,
          rowData: row,
        });
        failed++;
        continue;
      }

      const variantIds = (row.variant || "")
        .split(",")
        .map((v) => normalizeName(v))
        .map((v) => variantMap.get(v))
        .filter(Boolean); // drop unknowns

      if (!variantIds.length) {
        errors.push({ row: i + 2, error: "No valid variants", rowData: row });
        failed++;
        continue;
      }

      /* 6.4  Variants */
      const variants = row.variants
        ? row.variants.split(",").map((v) => ({ name: safeTrim(v) }))
        : [];

      /* 6.5  Build doc */
      docs.push({
        ...row, // 1️⃣ keep raw cells *first*
        sku_code: sku,
        product_name: name,
        manufacturer_part_name: part,
        category: categoryId, // 2️⃣ then patch with ObjectIds / numbers
        sub_category: subcategoryId,
        brand: brandId, //    (see brand lookup below)
        product_type: row.product_type,
        variant: variantIds,
        created_by: userId,
        model: modelId,
        qc_status: "Pending",
        live_status: "Pending",
        addedByDealer: true,
        addedByDealerId: req.body.dealerId,
        available_dealers: [
          {
            dealers_Ref: req.body.dealerId,
            inStock: true,
            quantity_per_dealer: 0,
            dealer_margin: 0,
            dealer_priority_override: 0,
          },
        ],
        images: imageMap[part.toLowerCase()]
          ? [imageMap[part.toLowerCase()]]
          : [],
        __rowIndex: i,
      });
      sessionLogs.push({ message: "Pending", productId: null });
    }
    /* ──────────────  7  Bulk Insert  ────────────── */
    let inserted = 0;
    if (docs.length) {
      try {
        docs.forEach((d) => (d._tempIndex = d.__rowIndex)); // local meta
        const mongoRes = await Product.insertMany(docs, {
          ordered: true,
          rawResult: true,
        });
        inserted = mongoRes.insertedCount;

        for (const [arrIdx, id] of Object.entries(mongoRes.insertedIds)) {
          const rowIdx = docs[arrIdx].__rowIndex;
          const productData = docs[arrIdx];
          sessionLogs[rowIdx] = {
            productId: id,
            message: requiresApproval ? "Pending Approval" : "Created",
            productDetails: {
              sku: productData.sku_code,
              productName: productData.product_name,
              manufacturerPartName: productData.manufacturer_part_name,
              brand: productData.brand,
              category: productData.category,
              subCategory: productData.sub_category,
              model: productData.model,
              variants: productData.variant,
              productType: productData.product_type,
              status: requiresApproval ? "Pending" : "Approved",
              qcStatus: requiresApproval ? "Pending" : "Approved",
              images: productData.images?.length || 0,
              createdBy: userId,
              createdByRole: userRole,
              createdAt: new Date()
            }
          };
        }
      } catch (err) {
        // ValidationError (thrown BEFORE Mongo is hit)
        if (err instanceof mongoose.Error.ValidationError) {
          logger.error(
            "🚫 Mongoose validation error on prototype row:\n" +
            JSON.stringify(err.errors, null, 2)
          );
          errors.push({
            row: docs[0].__rowIndex + 2,
            error: Object.values(err.errors)[0].message,
            rowData: rows[docs[0].__rowIndex],
          });
          return sendError(res, "Schema validation failed", 422);
        }

        // BulkWriteError (thrown BY Mongo)
        if (err?.writeErrors?.length) {
          const first = err.writeErrors[0];
          logger.error(
            `🚫 Bulk write error on row ${first.index + 2}:\n` +
            JSON.stringify(first.err ?? first, null, 2)
          );
          // …populate errors[] exactly as before…
          return sendError(res, "Bulk-insert failed", 422);
        }

        // Anything else
        logger.error("❌ Unexpected error during insertMany:", err);
        return sendError(res, "Unexpected error during insert", 500);
      }
    }

    /* ──────────────  8  Finalize Session  ────────────── */
    session.status = "Completed";
    session.updated_at = new Date();
    session.total_products_successful = inserted;
    session.total_products_failed = failed;
    session.logs = sessionLogs;
    await session.save();

    /* ──────────────  9  Send Notifications & Response  ────────────── */
    const secs = ((Date.now() - t0) / 1000).toFixed(1);

    // Notify inventory admins (unchanged logic)
    try {
      const userData = await axios.get("http://user-service:5001/api/users/", {
        headers: { Authorization: req.headers.authorization },
      });
      const ids = userData.data.data
        .filter((u) =>
          ["Super-admin", "Inventory-Admin", "Inventory-Staff"].includes(u.role)
        )
        .map((u) => u._id);

      const notify = await createUnicastOrMulticastNotificationUtilityFunction(
        ids,
        ["INAPP", "PUSH"],
        "Product Bulk Upload ALERT",
        `Bulk upload completed: ${inserted}/${rows.length} docs in ${secs}s`,
        "",
        "",
        "Product",
        {},
        req.headers.authorization
      );
      if (!notify.success)
        logger.error("❌ Create notification error:", notify.message);
      else logger.info("✅ Notification created successfully");
    } catch (e) {
      logger.error("⚠️  Notification step failed:", e.message);
    }

    logger.info(
      `🏁 BulkUpload completed: ${inserted}/${rows.length} docs in ${secs}s`
    );
    return sendSuccess(res, {
      totalRows: rows.length,
      inserted,
      imgSummary: { total: totalZip, ok: imgOk, skip: imgSkip, fail: imgFail },
      errors,
      sessionId: session._id,
      durationSec: secs,
    });
  } catch (err) {
    /* ──────────────  Fatal Error  ────────────── */
    session.status = "Failed";
    session.updated_at = new Date();
    session.logs.push({
      productId: null,
      message: `Unexpected error: ${err.message}`,
    });
    await session.save();
    logger.error(`Bulk upload failed: ${err.stack || err}`);
    return sendError(res, `Bulk upload failed: ${err.message}`, 500);
  }
};

exports.manuallyAssignDealer = async (req, res) => {
  try {
    const {
      productId,
      dealerId,
      quantity,
      margin,
      priority,
      inStock = true,
    } = req.body;

    // Validate required fields
    if (
      !productId ||
      !dealerId ||
      quantity === undefined ||
      margin === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "productId, dealerId, quantity, and margin are required fields",
      });
    }

    // Validate data types
    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a non-negative number",
      });
    }

    if (typeof margin !== "number" || margin < 0) {
      return res.status(400).json({
        success: false,
        message: "Margin must be a non-negative number",
      });
    }

    if (
      priority !== undefined &&
      (typeof priority !== "number" || priority < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Priority must be a non-negative number",
      });
    }

    // Find the product - try by ObjectId first, then by SKU code
    let product;

    if (mongoose.isValidObjectId(productId)) {
      product = await Product.findById(productId);
    } else {
      // If not a valid ObjectId, treat it as SKU code
      product = await Product.findOne({ sku_code: productId });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with ID/SKU: ${productId}`,
      });
    }

    // Check if dealer already exists for this product
    const existingDealerIndex = product.available_dealers.findIndex(
      (dealer) => dealer.dealers_Ref === dealerId
    );

    if (existingDealerIndex !== -1) {
      // Update existing dealer
      product.available_dealers[existingDealerIndex] = {
        dealers_Ref: dealerId,
        inStock: inStock,
        quantity_per_dealer: quantity,
        dealer_margin: margin,
        dealer_priority_override: priority || 0,
      };

      console.log(
        `Updated existing dealer ${dealerId} for product ${productId}`
      );
    } else {
      // Add new dealer
      product.available_dealers.push({
        dealers_Ref: dealerId,
        inStock: inStock,
        quantity_per_dealer: quantity,
        dealer_margin: margin,
        dealer_priority_override: priority || 0,
      });

      console.log(`Added new dealer ${dealerId} for product ${productId}`);
    }

    // Update out_of_stock to false when dealer is assigned
    if (product.out_of_stock === true) {
      product.out_of_stock = false;
      console.log(`Updated out_of_stock to false for product ${productId} after dealer assignment`);
    }

    // Save the product
    const updatedProduct = await product.save();

    // Add change log entry
    buildChangeLog({
      product: updatedProduct,
      changedFields: ["available_dealers", "out_of_stock"],
      oldVals: {
        dealerId,
        action: existingDealerIndex !== -1 ? "updated" : "added",
        out_of_stock: product.out_of_stock,
      },
      newVals: { dealerId, quantity, margin, priority, inStock, out_of_stock: false },
      userId: req.user?.id || "system",
    });

    await updatedProduct.save();

    return res.status(200).json({
      success: true,
      message:
        existingDealerIndex !== -1
          ? "Dealer assignment updated successfully"
          : "Dealer assigned successfully",
      data: {
        productId: updatedProduct._id,
        productName: updatedProduct.product_name,
        skuCode: updatedProduct.sku_code,
        dealerId: dealerId,
        quantity: quantity,
        margin: margin,
        priority: priority || 0,
        inStock: inStock,
        totalDealers: updatedProduct.available_dealers.length,
      },
    });
  } catch (error) {
    console.error("Error in manuallyAssignDealer:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.removeDealerAssignment = async (req, res) => {
  try {
    const { productId, dealerId } = req.params;

    // Validate ObjectIds
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find and remove the dealer
    const initialDealerCount = product.available_dealers.length;
    product.available_dealers = product.available_dealers.filter(
      (dealer) => dealer.dealers_Ref !== dealerId
    );

    if (product.available_dealers.length === initialDealerCount) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found for this product",
      });
    }

    // Save the product
    const updatedProduct = await product.save();

    // Add change log entry
    buildChangeLog({
      product: updatedProduct,
      changedFields: ["available_dealers"],
      oldVals: { dealerId, action: "removed" },
      newVals: { dealerId, action: "removed" },
      userId: req.user?.id || "system",
    });

    await updatedProduct.save();

    return res.status(200).json({
      success: true,
      message: "Dealer assignment removed successfully",
      data: {
        productId: updatedProduct._id,
        productName: updatedProduct.product_name,
        skuCode: updatedProduct.sku_code,
        removedDealerId: dealerId,
        remainingDealers: updatedProduct.available_dealers.length,
      },
    });
  } catch (error) {
    console.error("Error in removeDealerAssignment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getProductDealerAssignments = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // Find the product with dealer assignments
    const product = await Product.findById(productId)
      .select("_id product_name sku_code available_dealers")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Format dealer assignments
    const dealerAssignments = (product.available_dealers || []).map(
      (dealer) => ({
        dealerId: dealer.dealers_Ref,
        quantity: dealer.quantity_per_dealer,
        margin: dealer.dealer_margin,
        priority: dealer.dealer_priority_override,
        inStock: dealer.inStock,
      })
    );

    return res.status(200).json({
      success: true,
      message: "Product dealer assignments retrieved successfully",
      data: {
        productId: product._id,
        productName: product.product_name,
        skuCode: product.sku_code,
        totalDealers: dealerAssignments.length,
        dealerAssignments: dealerAssignments,
      },
    });
  } catch (error) {
    console.error("Error in getProductDealerAssignments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.bulkAssignDealers = async (req, res) => {
  try {
    const part = req.files?.dealersFile?.[0];

    /* ─────────────────────────── 0. Validate upload ───────────────────── */
    if (!part) return sendError(res, "dealersFile (.csv) is required", 400);

    /* ─────────────────────────── 1. Read file ────────────────────────── */
    let csvText;
    try {
      csvText = part.path // disk-storage?
        ? fs.readFileSync(part.path, "utf8")
        : part.buffer.toString("utf8"); // memory-storage
    } catch (e) {
      return sendError(res, `Cannot read upload: ${e.message}`, 400);
    }

    csvText = csvText.replace(/^\uFEFF/, "").trim();
    if (!csvText) return sendError(res, "CSV file is empty", 400);

    /* ─────────────────────────── 2. Parse CSV ────────────────────────── */
    const mapBySku = new Map(); // sku → Map(dealer → payload)
    const errors = [];
    let rowNo = 1; // header = row 1

    await new Promise((resolve) => {
      fastcsv
        .parseString(csvText, { headers: true, trim: true, ignoreEmpty: true })
        .on("data", (row) => {
          rowNo += 1;
          try {
            const sku = String(row.sku_code || "").trim();
            const legalName = String(row.legal_name || "").trim();
            const qty = Number(row.qty);
            const marg = row.margin ? Number(row.margin) : undefined;
            const prio = row.priority ? Number(row.priority) : undefined;

            if (!sku || !legalName || Number.isNaN(qty)) {
              errors.push({
                row: rowNo,
                err: "sku_code / legal_name / qty invalid",
              });
              return;
            }

            if (!mapBySku.has(sku)) mapBySku.set(sku, new Map());
            mapBySku.get(sku).set(legalName, {
              legal_name: legalName,
              quantity_per_dealer: qty,
              dealer_margin: marg,
              dealer_priority_override: prio,
              last_stock_update: new Date(),
            });
          } catch (e) {
            errors.push({ row: rowNo, err: e.message });
          }
        })
        .on("end", resolve);
    });

    /* ─────────────────────────── 3. Resolve legal_names to dealer_ids ───────────────────── */
    const dealerMapping = new Map(); // legal_name → dealer_id
    const dealerErrors = [];

    // Get authorization header from the request
    const authorizationHeader = req.headers.authorization;

    for (const [sku, dealerMap] of mapBySku) {
      for (const [legalName, dealerData] of dealerMap) {
        if (!dealerMapping.has(legalName)) {
          const dealer = await fetchDealerByLegalName(legalName, authorizationHeader);
          if (dealer) {
            dealerMapping.set(legalName, dealer.dealerId);
          } else {
            dealerErrors.push({
              sku,
              legal_name: legalName,
              error: "Dealer not found with this legal_name",
            });
          }
        }
      }
    }

    // If there are dealer resolution errors, return them
    if (dealerErrors.length > 0) {
      return sendError(res, {
        message: "Some dealers could not be resolved",
        dealerErrors,
      }, 400);
    }

    /* ─────────────────────────── 4. Build bulk ops ───────────────────── */
    const ops = [];
    for (const [sku, dealerMap] of mapBySku) {
      const incomingArr = [];

      for (const [legalName, dealerData] of dealerMap) {
        const dealerId = dealerMapping.get(legalName);
        incomingArr.push({
          dealers_Ref: dealerId,
          quantity_per_dealer: dealerData.quantity_per_dealer,
          dealer_margin: dealerData.dealer_margin,
          dealer_priority_override: dealerData.dealer_priority_override,
          last_stock_update: dealerData.last_stock_update,
        });
      }

      const incomingIds = incomingArr.map((d) => d.dealers_Ref);

      /* MongoDB update-pipeline so we can use aggregation operators  */
      ops.push({
        updateOne: {
          filter: { sku_code: sku },
          update: [
            {
              $set: {
                /* always coerce to array first */
                available_dealers: {
                  $let: {
                    vars: {
                      current: {
                        $cond: [
                          { $isArray: "$available_dealers" },
                          "$available_dealers",
                          [], // null / object / missing
                        ],
                      },
                    },
                    in: {
                      /* 1️⃣ keep existing entries NOT in incomingIds
                         2️⃣ add / overwrite with the fresh ones          */
                      $concatArrays: [
                        {
                          $filter: {
                            input: "$$current",
                            as: "d",
                            cond: {
                              $not: { $in: ["$$d.dealers_Ref", incomingIds] },
                            },
                          },
                        },
                        { $literal: incomingArr }, // new / replacement objs
                      ],
                    },
                  },
                },
                updated_at: new Date(),
              },
            },
          ],
        },
      });
    }

    /* ─────────────────────────── 5. Bulk write ───────────────────────── */
    let bulkRes = { matchedCount: 0, modifiedCount: 0 };
    try {
      if (ops.length) {
        bulkRes = await Product.bulkWrite(ops, { ordered: false });
      }
    } catch (e) {
      errors.push({ err: `BulkWrite error: ${e.message}` });
    }

    /* ─────────────────────────── 6. Response  ───────────────────────── */
    return sendSuccess(
      res,
      {
        skuProcessed: mapBySku.size,
        dealerLinks: ops.length,
        matched: bulkRes.matchedCount,
        modified: bulkRes.modifiedCount,
        ...(errors.length ? { validationErrors: errors } : {}),
      },
      errors.length
        ? "Dealer assignments processed with some errors"
        : "Dealer assignments processed successfully"
    );
  } catch (error) {
    console.error("Error in bulkAssignDealers:", error);
    return sendError(res, error.message || "Failed to process bulk dealer assignments");
  }
};

exports.getProductDealerDetails = async (req, res) => {
  try {
    const { id, dealerId } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // Find the product
    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find the specific dealer in the product's available dealers
    const dealer = product.available_dealers?.find(
      (d) => d.dealers_Ref === dealerId
    );

    if (!dealer) {
      return res.status(404).json({
        success: false,
        message: "Dealer not found for this product",
      });
    }

    // Fetch dealer details from user service
    const authorizationHeader = req.headers.authorization;
    const dealerDetails = await fetchDealerDetails(dealerId, authorizationHeader);

    const response = {
      product_id: product._id,
      product_name: product.product_name,
      sku_code: product.sku_code,
      dealer: {
        dealerId: dealer.dealers_Ref,
        quantityAvailable: dealer.quantity_per_dealer,
        dealerMargin: dealer.dealer_margin,
        priorityOverride: dealer.dealer_priority_override,
        inStock: dealer.inStock,
        dealer_details: dealerDetails,
      },
    };

    return res.json({
      success: true,
      message: "Product dealer details fetched successfully",
      data: response,
    });
  } catch (err) {
    logger.error(`getProductDealerDetails error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const createdProducts = await Product.countDocuments({
      live_status: "Created",
    });
    const pendingProducts = await Product.countDocuments({
      live_status: "Pending",
    });
    const rejectedProducts = await Product.countDocuments({
      live_status: "Rejected",
    });
    const liveProducts = await Product.countDocuments({ live_status: "Live" });
    const approvedProducts = await Product.countDocuments({
      live_status: "Approved",
    });
    const totalProducts = await Product.countDocuments();

    const response = {
      total: totalProducts,
      created: createdProducts,
      pending: pendingProducts,
      rejected: rejectedProducts,
      live: liveProducts,
      approved: approvedProducts,
    };

    return res.json({
      success: true,
      message: "Product stats fetched successfully",
      data: response,
    });
  } catch (err) {
    logger.error(`productStats error: ${err.message}`);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==================== PRODUCT APPROVAL ENDPOINTS ====================

/**
 * Get all pending products that require approval
 */
exports.getPendingProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, created_by_role } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {
      live_status: "Pending",
      Qc_status: "Pending"
    };

    // Filter by creator role if specified
    if (created_by_role) {
      filter.created_by_role = created_by_role;
    }

    const pendingProducts = await Product.find(filter)
      .populate("brand category sub_category model variant year_range")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNumber);

    return sendSuccess(res, {
      products: pendingProducts,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      }
    }, "Pending products fetched successfully");
  } catch (err) {
    logger.error(`getPendingProducts error: ${err.message}`);
    return sendError(res, err);
  }
};

/**
 * Approve a single product
 */
exports.approveSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    let userId = null;
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
          algorithms: ["ES256"],
        });
        userId = decoded?.id || decoded?._id || null;
      } catch (e) {
        const decoded = jwt.decode(token);
        userId = decoded?.id || decoded?._id || null;
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    if (product.live_status !== "Pending" || product.Qc_status !== "Pending") {
      return sendError(res, "Product is not in pending status", 400);
    }

    // Update product status
    const oldVals = {
      live_status: product.live_status,
      Qc_status: product.Qc_status,
    };

    product.live_status = "Approved";
    product.Qc_status = "Approved";

    // Add approval log
    buildChangeLog({
      product,
      changedFields: ["live_status", "Qc_status"],
      oldVals,
      newVals: {
        live_status: product.live_status,
        Qc_status: product.Qc_status,
      },
      userId: userId || "system",
    });

    await product.save();

    // Send notification to product creator
    try {
      if (product.created_by) {
        const notify = await createUnicastOrMulticastNotificationUtilityFunction(
          [product.created_by],
          ["INAPP", "PUSH"],
          "Product Approved",
          `Your product "${product.product_name}" has been approved`,
          "",
          "",
          "Product",
          {
            productId: product._id,
            productName: product.product_name,
            skuCode: product.sku_code
          },
          req.headers.authorization
        );
        if (!notify.success) {
          logger.error("❌ Approval notification error:", notify.message);
        }
      }
    } catch (e) {
      logger.error("⚠️ Approval notification failed:", e.message);
    }

    logger.info(`✅ Product ${productId} approved by ${userId}`);
    return sendSuccess(res, product, "Product approved successfully");
  } catch (err) {
    logger.error(`approveSingleProduct error: ${err.message}`);
    return sendError(res, err);
  }
};

/**
 * Reject a single product
 */
exports.rejectSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return sendError(res, "Rejection reason is required", 400);
    }

    let userId = null;
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
          algorithms: ["ES256"],
        });
        userId = decoded?.id || decoded?._id || null;
      } catch (e) {
        const decoded = jwt.decode(token);
        userId = decoded?.id || decoded?._id || null;
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, "Product not found", 404);
    }

    if (product.live_status !== "Pending" || product.Qc_status !== "Pending") {
      return sendError(res, "Product is not in pending status", 400);
    }

    // Update product status
    const oldVals = {
      live_status: product.live_status,
      Qc_status: product.Qc_status,
    };

    product.live_status = "Rejected";
    product.Qc_status = "Rejected";
    product.rejection_state.push({
      rejected_by: userId || "system",
      reason: reason,
    });

    // Add rejection log
    buildChangeLog({
      product,
      changedFields: ["live_status", "Qc_status", "rejection_state"],
      oldVals,
      newVals: {
        live_status: product.live_status,
        Qc_status: product.Qc_status,
      },
      userId: userId || "system",
    });

    await product.save();

    // Send notification to product creator
    try {
      if (product.created_by) {
        const notify = await createUnicastOrMulticastNotificationUtilityFunction(
          [product.created_by],
          ["INAPP", "PUSH"],
          "Product Rejected",
          `Your product "${product.product_name}" has been rejected. Reason: ${reason}`,
          "",
          "",
          "Product",
          {
            productId: product._id,
            productName: product.product_name,
            skuCode: product.sku_code,
            reason: reason
          },
          req.headers.authorization
        );
        if (!notify.success) {
          logger.error("❌ Rejection notification error:", notify.message);
        }
      }
    } catch (e) {
      logger.error("⚠️ Rejection notification failed:", e.message);
    }

    logger.info(`❌ Product ${productId} rejected by ${userId}. Reason: ${reason}`);
    return sendSuccess(res, product, "Product rejected successfully");
  } catch (err) {
    logger.error(`rejectSingleProduct error: ${err.message}`);
    return sendError(res, err);
  }
};

/**
 * Bulk approve products
 */
exports.bulkApproveProducts = async (req, res) => {
  try {
    const { productIds, reason } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return sendError(res, "Product IDs array is required", 400);
    }

    let userId = null;
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
          algorithms: ["ES256"],
        });
        userId = decoded?.id || decoded?._id || null;
      } catch (e) {
        const decoded = jwt.decode(token);
        userId = decoded?.id || decoded?._id || null;
      }
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: productIds.length,
    };

    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId);
        if (!product) {
          results.failed.push({
            productId,
            error: "Product not found",
          });
          continue;
        }

        if (product.live_status !== "Pending" || product.Qc_status !== "Pending") {
          results.failed.push({
            productId,
            error: "Product is not in pending status",
          });
          continue;
        }

        // Update product status
        const oldVals = {
          live_status: product.live_status,
          Qc_status: product.Qc_status,
        };

        product.live_status = "Approved";
        product.Qc_status = "Approved";

        // Add approval log
        buildChangeLog({
          product,
          changedFields: ["live_status", "Qc_status"],
          oldVals,
          newVals: {
            live_status: product.live_status,
            Qc_status: product.Qc_status,
          },
          userId: userId || "system",
        });

        await product.save();

        results.successful.push({
          productId,
          productName: product.product_name,
          skuCode: product.sku_code,
        });
      } catch (error) {
        results.failed.push({
          productId,
          error: error.message,
        });
      }
    }

    // Send notifications for successful approvals
    try {
      const approvedProducts = await Product.find({
        _id: { $in: results.successful.map(r => r.productId) }
      });

      for (const product of approvedProducts) {
        if (product.created_by) {
          const notify = await createUnicastOrMulticastNotificationUtilityFunction(
            [product.created_by],
            ["INAPP", "PUSH"],
            "Product Approved",
            `Your product "${product.product_name}" has been approved`,
            "",
            "",
            "Product",
            {
              productId: product._id,
              productName: product.product_name,
              skuCode: product.sku_code
            },
            req.headers.authorization
          );
          if (!notify.success) {
            logger.error("❌ Bulk approval notification error:", notify.message);
          }
        }
      }
    } catch (e) {
      logger.error("⚠️ Bulk approval notification failed:", e.message);
    }

    logger.info(`✅ Bulk approved ${results.successful.length} products by ${userId}`);
    return sendSuccess(res, results, "Bulk approval completed");
  } catch (err) {
    logger.error(`bulkApproveProducts error: ${err.message}`);
    return sendError(res, err);
  }
};

/**
 * Bulk reject products
 */
exports.bulkRejectProducts = async (req, res) => {
  try {
    const { productIds, reason } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return sendError(res, "Product IDs array is required", 400);
    }

    if (!reason) {
      return sendError(res, "Rejection reason is required", 400);
    }

    let userId = null;
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
          algorithms: ["ES256"],
        });
        userId = decoded?.id || decoded?._id || null;
      } catch (e) {
        const decoded = jwt.decode(token);
        userId = decoded?.id || decoded?._id || null;
      }
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: productIds.length,
    };

    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId);
        if (!product) {
          results.failed.push({
            productId,
            error: "Product not found",
          });
          continue;
        }

        if (product.live_status !== "Pending" || product.Qc_status !== "Pending") {
          results.failed.push({
            productId,
            error: "Product is not in pending status",
          });
          continue;
        }

        // Update product status
        const oldVals = {
          live_status: product.live_status,
          Qc_status: product.Qc_status,
        };

        product.live_status = "Rejected";
        product.Qc_status = "Rejected";
        product.rejection_state.push({
          rejected_by: userId || "system",
          reason: reason,
        });

        // Add rejection log
        buildChangeLog({
          product,
          changedFields: ["live_status", "Qc_status", "rejection_state"],
          oldVals,
          newVals: {
            live_status: product.live_status,
            Qc_status: product.Qc_status,
          },
          userId: userId || "system",
        });

        await product.save();

        results.successful.push({
          productId,
          productName: product.product_name,
          skuCode: product.sku_code,
        });
      } catch (error) {
        results.failed.push({
          productId,
          error: error.message,
        });
      }
    }

    // Send notifications for successful rejections
    try {
      const rejectedProducts = await Product.find({
        _id: { $in: results.successful.map(r => r.productId) }
      });

      for (const product of rejectedProducts) {
        if (product.created_by) {
          const notify = await createUnicastOrMulticastNotificationUtilityFunction(
            [product.created_by],
            ["INAPP", "PUSH"],
            "Product Rejected",
            `Your product "${product.product_name}" has been rejected. Reason: ${reason}`,
            "",
            "",
            "Product",
            {
              productId: product._id,
              productName: product.product_name,
              skuCode: product.sku_code,
              reason: reason
            },
            req.headers.authorization
          );
          if (!notify.success) {
            logger.error("❌ Bulk rejection notification error:", notify.message);
          }
        }
      }
    } catch (e) {
      logger.error("⚠️ Bulk rejection notification failed:", e.message);
    }

    logger.info(`❌ Bulk rejected ${results.successful.length} products by ${userId}. Reason: ${reason}`);
    return sendSuccess(res, results, "Bulk rejection completed");
  } catch (err) {
    logger.error(`bulkRejectProducts error: ${err.message}`);
    return sendError(res, err);
  }
};

/**
 * Get approval statistics
 */
exports.getApprovalStats = async (req, res) => {
  try {
    const pendingCount = await Product.countDocuments({
      live_status: "Pending",
      Qc_status: "Pending"
    });

    const approvedCount = await Product.countDocuments({
      live_status: "Approved",
      Qc_status: "Approved"
    });

    const rejectedCount = await Product.countDocuments({
      live_status: "Rejected",
      Qc_status: "Rejected"
    });

    const totalCount = await Product.countDocuments();

    const stats = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: totalCount,
      approvalRate: totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(2) : 0,
      rejectionRate: totalCount > 0 ? ((rejectedCount / totalCount) * 100).toFixed(2) : 0,
    };

    return sendSuccess(res, stats, "Approval statistics fetched successfully");
  } catch (err) {
    logger.error(`getApprovalStats error: ${err.message}`);
    return sendError(res, err);
  }
};

// Get products by dealer with permission matrix
exports.getProductsByDealer = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const {
      page = 1,
      limit = 10,
      status, // Remove default to get all products
      inStock,
      category,
      brand,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      includePermissionMatrix = true
    } = req.query;

    if (!dealerId) {
      return sendError(res, "Dealer ID is required", 400);
    }

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Build filter
    const filter = {
      "available_dealers.dealers_Ref": dealerId
    };

    // Add status filter - check both status and live_status fields
    if (status) {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { status: status },
        { live_status: status }
      );
    }

    // Add stock filter
    if (inStock !== undefined) {
      filter["available_dealers.inStock"] = inStock === 'true';
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add brand filter
    if (brand) {
      filter.brand = brand;
    }

    // Add search filter
    if (search) {
      const searchConditions = [
        { product_name: { $regex: search, $options: 'i' } },
        { sku_code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];

      if (filter.$or) {
        // If we already have $or conditions (from status filter), we need to combine them
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    logger.info(`🔍 Fetching products for dealerId: ${dealerId}`);
    logger.info(`📋 Filter applied:`, JSON.stringify(filter, null, 2));

    // First, let's check if there are any products with this dealer at all
    const totalProductsWithDealer = await Product.countDocuments({
      "available_dealers.dealers_Ref": dealerId
    });
    logger.info(`📊 Total products with dealer ${dealerId}: ${totalProductsWithDealer}`);

    // Let's also check what dealers exist in the system
    const sampleProducts = await Product.find({ "available_dealers": { $exists: true, $ne: [] } })
      .select("sku_code available_dealers")
      .limit(5)
      .lean();

    logger.info(`📦 Sample products with dealers:`, JSON.stringify(sampleProducts, null, 2));

    // Get products with pagination
    const products = await Product.find(filter)
      .populate("brand", "brand_name")
      .populate("category", "category_name")
      .populate("sub_category", "subcategory_name")
      .populate("model", "model_name")
      .populate("variant", "variant_name")
      .select("sku_code product_name description mrp_with_gst selling_price gst_percentage brand category sub_category model variant available_dealers status images created_at updated_at")
      .sort(sort)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    logger.info(`📦 Found ${products.length} products for dealer ${dealerId}`);

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Process products to include dealer-specific information and permission matrix
    const processedProducts = products.map(product => {
      // Find dealer-specific information
      const dealerInfo = product.available_dealers.find(
        dealer => dealer.dealers_Ref === dealerId
      );

      logger.info(`🔍 Processing product ${product.sku_code}, dealer info:`, dealerInfo);

      // Build permission matrix
      const permissionMatrix = includePermissionMatrix === 'true' ? {
        canEdit: {
          product_name: false,
          description: false,
          mrp_with_gst: true,
          selling_price: true,
          gst_percentage: true,
          dimensions: true,
          weight: true,
          certifications: true,
          warranty: true,
          images: true,
          video_url: true,
          brochure_available: true,
          is_returnable: false,
          return_policy: false,
          seo_title: false,
          seo_description: false,
          seo_metaData: false,
          search_tags: false
        },
        canView: {
          all_fields: true,
          competitor_prices: false,
          internal_notes: false,
          admin_notes: false
        },
        canManage: {
          stock: true,
          pricing: true,
          availability: true,
          dealer_margin: false,
          dealer_priority: false
        }
      } : null;

      // Calculate dealer-specific pricing
      const dealerMargin = dealerInfo?.dealer_margin || 0;
      const dealerSellingPrice = product.selling_price + (product.selling_price * dealerMargin / 100);

      return {
        _id: product._id,
        sku_code: product.sku_code,
        product_name: product.product_name,
        description: product.description,
        pricing: {
          mrp_with_gst: product.mrp_with_gst,
          base_selling_price: product.selling_price,
          dealer_selling_price: dealerSellingPrice,
          dealer_margin: dealerMargin,
          gst_percentage: product.gst_percentage
        },
        brand: product.brand,
        category: product.category,
        sub_category: product.sub_category,
        model: product.model,
        variant: product.variant,
        dealer_info: {
          in_stock: dealerInfo?.inStock || false,
          quantity_available: dealerInfo?.quantity_per_dealer || 0,
          dealer_margin: dealerInfo?.dealer_margin || 0,
          dealer_priority: dealerInfo?.dealer_priority_override || 0
        },
        images: product.images,
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at,
        permission_matrix: permissionMatrix
      };
    });

    // Get summary statistics
    const summary = await Product.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalInStock: {
            $sum: {
              $cond: [
                { $eq: ["$available_dealers.inStock", true] },
                1,
                0
              ]
            }
          },
          totalOutOfStock: {
            $sum: {
              $cond: [
                { $eq: ["$available_dealers.inStock", false] },
                1,
                0
              ]
            }
          },
          averagePrice: { $avg: "$selling_price" },
          minPrice: { $min: "$selling_price" },
          maxPrice: { $max: "$selling_price" }
        }
      }
    ]);

    const summaryStats = summary.length > 0 ? summary[0] : {
      totalProducts: 0,
      totalInStock: 0,
      totalOutOfStock: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0
    };

    const response = {
      dealerId,
      products: processedProducts,
      summary: {
        totalProducts: summaryStats.totalProducts,
        totalInStock: summaryStats.totalInStock,
        totalOutOfStock: summaryStats.totalOutOfStock,
        averagePrice: Math.round(summaryStats.averagePrice || 0),
        minPrice: summaryStats.minPrice || 0,
        maxPrice: summaryStats.maxPrice || 0
      },
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalProducts,
        limit: limitNumber,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        prevPage: hasPrevPage ? pageNumber - 1 : null
      },
      filters: {
        status,
        inStock,
        category: category || null,
        brand: brand || null,
        search: search || null,
        sortBy,
        sortOrder
      },
      debug: {
        totalProductsWithDealer,
        sampleProducts: sampleProducts.map(p => ({
          sku_code: p.sku_code,
          available_dealers: p.available_dealers
        }))
      }
    };

    logger.info(`✅ Products fetched successfully for dealerId: ${dealerId} (${products.length} products)`);
    sendSuccess(res, response, "Products by dealer fetched successfully");

  } catch (error) {
    logger.error(`❌ Error fetching products by dealer: ${error.message}`);
    logger.error(`❌ Error stack: ${error.stack}`);
    sendError(res, "Failed to fetch products for dealer", 500);
  }
};

// Debug endpoint to check available dealers in the system
exports.getAvailableDealers = async (req, res) => {
  try {
    logger.info('🔍 Fetching available dealers from products');

    // Get all unique dealer IDs from products
    const dealers = await Product.aggregate([
      { $unwind: "$available_dealers" },
      {
        $group: {
          _id: "$available_dealers.dealers_Ref",
          productCount: { $sum: 1 },
          sampleProducts: { $push: "$sku_code" },
          inStockCount: {
            $sum: {
              $cond: ["$available_dealers.inStock", 1, 0]
            }
          }
        }
      },
      {
        $project: {
          dealerId: "$_id",
          productCount: 1,
          inStockCount: 1,
          sampleProducts: { $slice: ["$sampleProducts", 5] }
        }
      },
      { $sort: { productCount: -1 } }
    ]);

    // Get sample products with dealer information
    const sampleProducts = await Product.find({
      "available_dealers": { $exists: true, $ne: [] }
    })
      .select("sku_code product_name available_dealers")
      .limit(10)
      .lean();

    const response = {
      totalDealers: dealers.length,
      dealers: dealers,
      sampleProducts: sampleProducts.map(p => ({
        sku_code: p.sku_code,
        product_name: p.product_name,
        available_dealers: p.available_dealers
      }))
    };

    logger.info(`✅ Found ${dealers.length} unique dealers in the system`);
    sendSuccess(res, response, "Available dealers fetched successfully");

  } catch (error) {
    logger.error(`❌ Error fetching available dealers: ${error.message}`);
    sendError(res, "Failed to fetch available dealers", 500);
  }
};