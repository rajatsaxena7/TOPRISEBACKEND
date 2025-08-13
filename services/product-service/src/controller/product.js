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
  cacheDel, // ⬅️ writer-side “del” helper
} = require("/packages/utils/cache");

const fs = require("fs");

const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
/* ───────────────────────────────── JWT KEYS ─────────────────────── */
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY?.trim(); // ← put PEM here

/* --- SKU helper --------------------------------------------------- */
let skuCounter = 1;
const genSKU = (name = "") =>
  `TOP${name.slice(0, 3).toUpperCase()}${String(skuCounter++).padStart(
    3,
    "0"
  )}`;

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
// /* ------------------------------------------------------------------ */
// exports.bulkUploadProducts = async (req, res) => {
//   const t0 = Date.now();
//   logger.info(`📦  [BulkUpload] started ${new Date().toISOString()}`);

//   /* ───────────── Parse / verify Bearer token ───────────── */
//   let userId = null;
//   const rawAuth = req.headers.authorization || "";
//   const token = rawAuth.replace(/^Bearer /, "");

//   if (token) {
//     try {
//       // Try full verification first (needs correct public key for ES256)
//       const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
//         algorithms: ["ES256"],
//       });
//       userId = decoded?.id || decoded?._id || null;
//       logger.info(`👤  Verified user ${userId}`);
//     } catch (err) {
//       logger.warn(`🔒  verify() failed (${err.message}) – fallback to decode`);
//       const decoded = jwt.decode(token); // no signature check
//       userId = decoded?.id || decoded?._id || null;
//       logger.info(`👤  Decoded user ${userId || "UNKNOWN"}`);
//     }
//   } else {
//     logger.warn("🔒  No Bearer token – created_by will be null");
//   }

//   /* ─────────── Validate multipart files ─────────── */
//   const excelBuf = req.files?.dataFile?.[0]?.buffer;
//   const zipBuf = req.files?.imageZip?.[0]?.buffer;
//   if (!excelBuf || !zipBuf) {
//     return sendError(res, "Both dataFile & imageZip are required", 400);
//   }

//   /* ─────────── Parse spreadsheet ─────────── */
//   const wb = XLSX.read(excelBuf, { type: "buffer" });
//   const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
//   logger.info(`📄  Parsed ${rows.length} rows`);

//   /* ─────────── Extract & upload images ─────────── */
//   const imageMap = {}; // partName(lower-case) → S3 URL
//   let totalZip = 0,
//     imgOk = 0,
//     imgSkip = 0,
//     imgFail = 0;

//   const zipStream = stream.Readable.from(zipBuf).pipe(
//     unzipper.Parse({ forceStream: true })
//   );

//   for await (const entry of zipStream) {
//     totalZip++;

//     /* 1️⃣  Skip folders outright  */
//     if (entry.type === "Directory") {
//       // unzipper entry has .type
//       imgSkip++;
//       entry.autodrain();
//       continue;
//     }

//     /* 2️⃣  Work with only the file-name portion  */
//     const base = path.basename(entry.path); // eg. `ABC123.jpeg`
//     const m = base.match(/^(.+?)\.(jpe?g|png|webp)$/i);

//     if (!m) {
//       // unsupported extension
//       imgSkip++;
//       entry.autodrain();
//       continue;
//     }

//     const key = m[1].toLowerCase(); // manufacturer_part_name
//     const mime = `image/${
//       m[2].toLowerCase() === "jpg" ? "jpeg" : m[2].toLowerCase()
//     }`;

//     /* 3️⃣  Convert stream → Buffer ( works on unzipper v5 & v6 ) */
//     const chunks = [];
//     for await (const chunk of entry) chunks.push(chunk);
//     const buf = Buffer.concat(chunks);

//     /* 4️⃣  Upload to S3  */
//     try {
//       const { Location } = await uploadFile(buf, base, mime, "products");
//       imageMap[key] = Location;
//       imgOk++;
//       logger.debug(`🖼️  Uploaded ${base} → ${Location}`);
//     } catch (e) {
//       imgFail++;
//       logger.error(`❌  Upload ${base} failed: ${e.message}`);
//     }
//   }
//   logger.info(
//     `🗂️  ZIP done  total:${totalZip}  ok:${imgOk}  skip:${imgSkip}  fail:${imgFail}`
//   );

//   /* ─────────── Build docs & basic validation ─────────── */
//   const docs = [];
//   const errors = [];
//   const seen = new Set();

//   rows.forEach((row, i) => {
//     const name = row.product_name?.trim();
//     const part = row.manufacturer_part_name?.trim();
//     if (!name || !part) {
//       errors.push({
//         row: i + 2,
//         error: "Missing product_name or manufacturer_part_name",
//       });
//       return;
//     }

//     const sku = genSKU(name);
//     if (seen.has(sku)) {
//       errors.push({ row: i + 2, sku, error: "Duplicate SKU" });
//       return;
//     }
//     seen.add(sku);

//     // remove any created_by from sheet
//     const { created_by: _drop, ...rest } = row;

//     docs.push({
//       sku_code: sku,
//       product_name: name,
//       manufacturer_part_name: part,
//       category: row.category,
//       sub_category: row.sub_category,
//       brand: row.brand,
//       product_type: row.product_type,
//       created_by: userId, // << only the user id
//       images: imageMap[part.toLowerCase()]
//         ? [imageMap[part.toLowerCase()]]
//         : [],
//       ...rest,
//     });
//   });

//   logger.info(
//     `✅  Docs ready: ${docs.length}, validation errors: ${errors.length}`
//   );

//   /* ─────────── Bulk insert ─────────── */
//   let inserted = 0;
//   if (docs.length) {
//     try {
//       inserted = (await Product.insertMany(docs, { ordered: false })).length;
//     } catch (bulkErr) {
//       (bulkErr.writeErrors || []).forEach((e) =>
//         logger.error(`Mongo write error idx=${e.index}: ${e.errmsg}`)
//       );
//       inserted = bulkErr.result?.insertedCount || inserted;
//     }
//   }

//   /* ─────────── Respond ─────────── */
//   const secs = ((Date.now() - t0) / 1000).toFixed(1);
//   logger.info(
//     `🏁  BulkUpload completed: ${inserted}/${rows.length} docs in ${secs}s`
//   );

//   return sendSuccess(res, {
//     totalRows: rows.length,
//     inserted,
//     imgSummary: { total: totalZip, ok: imgOk, skip: imgSkip, fail: imgFail },
//     errors,
//     durationSec: secs,
//   });
// };
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
      const mime = `image/${
        m[2].toLowerCase() === "jpg" ? "jpeg" : m[2].toLowerCase()
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

    rows.forEach((row, i) => {
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
        return;
      }

      /* 6.2  Extract & normalise fields */
      const name = safeTrim(row.product_name);
      const part = safeTrim(row.manufacturer_part_name);

      const sku = genSKU(name);
      if (seen.has(sku)) {
        errors.push({ row: i + 2, sku, error: "Duplicate SKU", rowData: row });
        sessionLogs.push({ message: "Duplicate SKU", productId: null });
        failed++;
        return;
      }
      seen.add(sku);

      /* 6.3  Category / Subcategory mapping – skip if unknown */
      const categoryKey = normalizeName(row.category);
      const subcategoryKey = normalizeName(row.sub_category);

      const categoryId = categoryMap.get(categoryKey);
      const subcategoryId = subcategoryMap.get(subcategoryKey);
      if (!categoryId || !subcategoryId) {
        const msg = !categoryId
          ? `Unknown category '${row.category}'`
          : `Unknown sub_category '${row.sub_category}'`;
        errors.push({ row: i + 2, sku, error: msg, rowData: row });
        failed++;
        return;
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
        return;
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
        return;
      }

      const variantIds = (row.variant || "")
        .split(",")
        .map((v) => normalizeName(v))
        .map((v) => variantMap.get(v))
        .filter(Boolean); // drop unknowns

      if (!variantIds.length) {
        errors.push({ row: i + 2, error: "No valid variants", rowData: row });
        failed++;
        return;
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
        images: imageMap[part.toLowerCase()]
          ? [imageMap[part.toLowerCase()]]
          : [],
        __rowIndex: i,
      });
      sessionLogs.push({ message: "Pending", productId: null });
    });
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
          sessionLogs[rowIdx] = { productId: id, message: "Created" };
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
    } = req.query;

    const filter = {};
    const csvToIn = (val) => val.split(",").map((v) => v.trim());

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

    let products = await Product.find(filter)
      .populate("brand category sub_category model variant year_range")
      .sort({ created_at: -1 });

    if (query && query.trim() !== "") {
      let queryParts = query.trim().toLowerCase().split(/\s+/);

      try {
        if (brand) {
          const brandDoc = await Brand.findById(brand);
          console.log(brandDoc);
          if (!brandDoc) throw new Error(`Brand not found for ID: ${brand}`);
          if (!brandDoc.brand_name)
            throw new Error(`Brand name missing for ID: ${brand}`);
          const brandParts = brandDoc.brand_name.toLowerCase().split(/\s+/);
          queryParts = queryParts.filter(
            (q) => !brandParts.some((b) => stringSimilarity(q, b) > 0.7)
          );
          console.log(queryParts);
        }

        if (model) {
          const modelDoc = await Model.findById(model);
          if (!modelDoc) throw new Error(`Model not found for ID: ${model}`);
          if (!modelDoc.model_name)
            throw new Error(`Model name missing for ID: ${model}`);
          const modelParts = modelDoc.model_name.toLowerCase().split(/\s+/);
          queryParts = queryParts.filter(
            (q) => !modelParts.some((m) => stringSimilarity(q, m) > 0.7)
          );
        }

        if (variant) {
          const variantDoc = await Variant.findById(variant);
          if (!variantDoc)
            throw new Error(`Variant not found for ID: ${variant}`);
          if (!variantDoc.variant_name)
            throw new Error(`Variant name missing for ID: ${variant}`);
          const variantParts = variantDoc.variant_name
            .toLowerCase()
            .split(/\s+/);
          queryParts = queryParts.filter(
            (q) => !variantParts.some((v) => stringSimilarity(q, v) > 0.7)
          );
        }
      } catch (e) {
        logger.error(
          `❌ Error in extracting brand/model/variant from query: ${e.message}`
        );
        return sendError(res, e.message);
      }

      if (queryParts.length > 0) {
        products = products.filter((product) => {
          const tags = product.search_tags.map((t) => t.toLowerCase());
          return queryParts.some((part) =>
            tags.some((tag) => stringSimilarity(tag, part) >= 0.6)
          );
        });
      }
    }

    return sendSuccess(res, products, "Products fetched successfully");
  } catch (err) {
    logger.error(`❌ getProductsByFilters error: ${err.stack}`);
    return sendError(res, err.message || "Internal server error");
  }
};

exports.approveProducts = async (req, res) => {
  try {
  } catch {}
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
exports.SearchAlgorithm = async (req, res) => {};

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
      `📊 Exported ${rows.length} products ${
        dealer_id ? `for dealer ${dealer_id}` : "for dashboard"
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
        `Product has been de-activated by ${
          req.userId ? user.username : "system"
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

    const productPayload = {
      ...data,
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
        ` Product has been updated by ${userId ? user.user_name : "system"} - ${
          product.product_name
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

exports.searchProductsForDashboard = async (req, res) => {};

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
        ` Product has been rejected by ${
          userId ? user?.user_name : "system"
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

    product.live_status = "Approved"; // or "Live" if that’s your rule
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
        ` Product has been approved by ${
          userId ? user?.user_name : "system"
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

    // 3) Return them
    return res.json({
      success: true,
      message: "Available dealers fetched",
      data: sorted.map((d) => ({
        dealerId: d.dealers_Ref,
        quantityAvailable: d.quantity_per_dealer,
        dealerMargin: d.dealer_margin,
        priorityOverride: d.dealer_priority_override,
      })),
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
          "available_dealers.$[dealer].quantity_per_dealer": 0,
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

    if (!dealerId) {
      return res.status(400).json({ message: "dealerId is required" });
    }

    const products = await Product.find({
      "available_dealers.dealers_Ref": dealerId,
    })
      .populate("brand category sub_category model variant year_range")
      .lean();

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for this dealer" });
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

        product.live_status = "Approved"; // or "Live" if that’s your rule
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
        }, 0)} Products have been approved by ${
          userId ? user?.user_name : "system"
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
        }, 0)} Product has been rejected by ${
          userId ? user?.user_name : "system"
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
      page = 1, // Default to page 1
      limit = 10, // Default to 10 items per page
    } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = {};

    const csvToIn = (val) => val.split(",").map((v) => v.trim());

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

    // Execute the base query
    let products = await productsQuery.exec();

    // Handle text search if query parameter exists
    if (query && query.trim() !== "") {
      let queryParts = query.trim().toLowerCase().split(/\s+/);

      try {
        if (brand) {
          const brandDoc = await Brand.findById(brand);
          if (!brandDoc) throw new Error(`Brand not found for ID: ${brand}`);
          if (!brandDoc.brand_name)
            throw new Error(`Brand name missing for ID: ${brand}`);
          const brandParts = brandDoc.brand_name.toLowerCase().split(/\s+/);
          queryParts = queryParts.filter(
            (q) => !brandParts.some((b) => stringSimilarity(q, b) > 0.7)
          );
        }

        if (model) {
          const modelDoc = await Model.findById(model);
          if (!modelDoc) throw new Error(`Model not found for ID: ${model}`);
          if (!modelDoc.model_name)
            throw new Error(`Model name missing for ID: ${model}`);
          const modelParts = modelDoc.model_name.toLowerCase().split(/\s+/);
          queryParts = queryParts.filter(
            (q) => !modelParts.some((m) => stringSimilarity(q, m) > 0.7)
          );
        }

        if (variant) {
          const variantDoc = await Variant.findById(variant);
          if (!variantDoc)
            throw new Error(`Variant not found for ID: ${variant}`);
          if (!variantDoc.variant_name)
            throw new Error(`Variant name missing for ID: ${variant}`);
          const variantParts = variantDoc.variant_name
            .toLowerCase()
            .split(/\s+/);
          queryParts = queryParts.filter(
            (q) => !variantParts.some((v) => stringSimilarity(q, v) > 0.7)
          );
        }
      } catch (e) {
        logger.error(
          `❌ Error in extracting brand/model/variant from query: ${e.message}`
        );
        return sendError(res, e.message);
      }

      if (queryParts.length > 0) {
        products = products.filter((product) => {
          const tags = product.search_tags.map((t) => t.toLowerCase());
          return queryParts.some((part) =>
            tags.some((tag) => stringSimilarity(tag, part) >= 0.6)
          );
        });
      }
    }

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

    const productPayload = {
      ...data,
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
