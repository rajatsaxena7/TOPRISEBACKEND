/* ------------------------------------------------------------------ */
/*  BULK PRODUCT UPLOAD (Excel + ZIP)                                 */
/* ------------------------------------------------------------------ */
const Product = require("../models/productModel");
const XLSX = require("xlsx");
const unzipper = require("unzipper");
const stream = require("stream");
const jwt = require("jsonwebtoken");

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

/* ------------------------------------------------------------------ */
exports.bulkUploadProducts = async (req, res) => {
  const t0 = Date.now();
  logger.info(`📦  [BulkUpload] started ${new Date().toISOString()}`);

  /* ───────────── Parse / verify Bearer token ───────────── */
  let userId = null;
  const rawAuth = req.headers.authorization || "";
  const token = rawAuth.replace(/^Bearer /, "");

  if (token) {
    try {
      // Try full verification first (needs correct public key for ES256)
      const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
        algorithms: ["ES256"],
      });
      userId = decoded?.id || decoded?._id || null;
      logger.info(`👤  Verified user ${userId}`);
    } catch (err) {
      logger.warn(`🔒  verify() failed (${err.message}) – fallback to decode`);
      const decoded = jwt.decode(token); // no signature check
      userId = decoded?.id || decoded?._id || null;
      logger.info(`👤  Decoded user ${userId || "UNKNOWN"}`);
    }
  } else {
    logger.warn("🔒  No Bearer token – created_by will be null");
  }

  /* ─────────── Validate multipart files ─────────── */
  const excelBuf = req.files?.dataFile?.[0]?.buffer;
  const zipBuf = req.files?.imageZip?.[0]?.buffer;
  if (!excelBuf || !zipBuf) {
    return sendError(res, "Both dataFile & imageZip are required", 400);
  }

  /* ─────────── Parse spreadsheet ─────────── */
  const wb = XLSX.read(excelBuf, { type: "buffer" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  logger.info(`📄  Parsed ${rows.length} rows`);

  /* ─────────── Extract & upload images ─────────── */
  const imageMap = {}; // partName → S3 URL
  let totalZip = 0,
    imgOk = 0,
    imgSkip = 0,
    imgFail = 0;

  const zipStream = stream.Readable.from(zipBuf).pipe(
    unzipper.Parse({ forceStream: true })
  );

  for await (const entry of zipStream) {
    totalZip++;
    const match = entry.path.match(/(.+?)\.(jpe?g|png|webp)$/i);
    if (!match) {
      imgSkip++;
      entry.autodrain();
      continue;
    }

    const key = match[1].toLowerCase();
    const buf = await entry.buffer(); // unzipper ≥6 supports .buffer()

    try {
      const { Location } = await uploadFile(
        buf,
        entry.path,
        "image/jpeg",
        "products"
      );
      imageMap[key] = Location;
      imgOk++;
    } catch (e) {
      imgFail++;
      logger.error(`Upload ${entry.path}: ${e.message}`);
    }
  }
  logger.info(
    `🗂️  ZIP summary  total:${totalZip} ok:${imgOk} skip:${imgSkip} fail:${imgFail}`
  );

  /* ─────────── Build docs & basic validation ─────────── */
  const docs = [];
  const errors = [];
  const seen = new Set();

  rows.forEach((row, i) => {
    const name = row.product_name?.trim();
    const part = row.manufacturer_part_name?.trim();
    if (!name || !part) {
      errors.push({
        row: i + 2,
        error: "Missing product_name or manufacturer_part_name",
      });
      return;
    }

    const sku = genSKU(name);
    if (seen.has(sku)) {
      errors.push({ row: i + 2, sku, error: "Duplicate SKU" });
      return;
    }
    seen.add(sku);

    // remove any created_by from sheet
    const { created_by: _drop, ...rest } = row;

    docs.push({
      sku_code: sku,
      product_name: name,
      manufacturer_part_name: part,
      category: row.category,
      sub_category: row.sub_category,
      brand: row.brand,
      product_type: row.product_type,
      created_by: userId, // << only the user id
      images: imageMap[part.toLowerCase()]
        ? [imageMap[part.toLowerCase()]]
        : [],
      ...rest,
    });
  });

  logger.info(
    `✅  Docs ready: ${docs.length}, validation errors: ${errors.length}`
  );

  /* ─────────── Bulk insert ─────────── */
  let inserted = 0;
  if (docs.length) {
    try {
      inserted = (await Product.insertMany(docs, { ordered: false })).length;
    } catch (bulkErr) {
      (bulkErr.writeErrors || []).forEach((e) =>
        logger.error(`Mongo write error idx=${e.index}: ${e.errmsg}`)
      );
      inserted = bulkErr.result?.insertedCount || inserted;
    }
  }

  /* ─────────── Respond ─────────── */
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  logger.info(
    `🏁  BulkUpload completed: ${inserted}/${rows.length} docs in ${secs}s`
  );

  return sendSuccess(res, {
    totalRows: rows.length,
    inserted,
    imgSummary: { total: totalZip, ok: imgOk, skip: imgSkip, fail: imgFail },
    errors,
    durationSec: secs,
  });
};

exports.getProductsByFilters = async (req, res) => {
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
