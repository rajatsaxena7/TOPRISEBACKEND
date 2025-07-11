/* ------------------------------------------------------------------ */
/*  BULK PRODUCT UPLOAD (Excel + ZIP)                                 */
/* ------------------------------------------------------------------ */
const Product = require("../models/productModel");
const XLSX = require("xlsx");
const unzipper = require("unzipper");
const stream = require("stream");
const jwt = require("jsonwebtoken");
const path = require("path");
const { Readable } = require("stream");
const csv = require("csv-parser");
const fastcsv = require("fast-csv");

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
  const imageMap = {}; // partName(lower-case) → S3 URL
  let totalZip = 0,
    imgOk = 0,
    imgSkip = 0,
    imgFail = 0;

  const zipStream = stream.Readable.from(zipBuf).pipe(
    unzipper.Parse({ forceStream: true })
  );

  for await (const entry of zipStream) {
    totalZip++;

    /* 1️⃣  Skip folders outright  */
    if (entry.type === "Directory") {
      // unzipper entry has .type
      imgSkip++;
      entry.autodrain();
      continue;
    }

    /* 2️⃣  Work with only the file-name portion  */
    const base = path.basename(entry.path); // eg. `ABC123.jpeg`
    const m = base.match(/^(.+?)\.(jpe?g|png|webp)$/i);

    if (!m) {
      // unsupported extension
      imgSkip++;
      entry.autodrain();
      continue;
    }

    const key = m[1].toLowerCase(); // manufacturer_part_name
    const mime = `image/${
      m[2].toLowerCase() === "jpg" ? "jpeg" : m[2].toLowerCase()
    }`;

    /* 3️⃣  Convert stream → Buffer ( works on unzipper v5 & v6 ) */
    const chunks = [];
    for await (const chunk of entry) chunks.push(chunk);
    const buf = Buffer.concat(chunks);

    /* 4️⃣  Upload to S3  */
    try {
      const { Location } = await uploadFile(buf, base, mime, "products");
      imageMap[key] = Location;
      imgOk++;
      logger.debug(`🖼️  Uploaded ${base} → ${Location}`);
    } catch (e) {
      imgFail++;
      logger.error(`❌  Upload ${base} failed: ${e.message}`);
    }
  }
  logger.info(
    `🗂️  ZIP done  total:${totalZip}  ok:${imgOk}  skip:${imgSkip}  fail:${imgFail}`
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

exports.approveProducts = async (req, res) => {
  try {
  } catch {}
};

exports.assignDealers = async (req, res) => {
  /* we need the <part> reference in finally{} -> declare here */
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
  /* ───── 1.  Get file (multer-style upload: field name = editsFile) ───── */
  const part = req.files?.editsFile?.[0];
  if (!part) return sendError(res, "editsFile (.csv) is required", 400);

  /* read into string (works for disk or memory uploads) */
  const csvData = part.path
    ? fs.readFileSync(part.path, "utf8")
    : part.buffer.toString("utf8");

  if (!csvData.trim()) return sendError(res, "CSV file is empty", 400);

  /* ───── 2.  Parse CSV → build per-row update objects ─────────────────── */
  const operations = []; // bulkWrite ops
  const parseErrs = []; // validation issues
  let rowNo = 1; // header = 1

  await new Promise((resolve) => {
    fastcsv
      .parseString(csvData, { headers: true, trim: true })
      .on("data", (row) => {
        rowNo += 1;
        const sku = (row.sku_code || "").trim();
        if (!sku) {
          parseErrs.push({ row: rowNo, err: "Missing sku_code" });
          return;
        }

        /* Build an update doc containing ONLY non-empty columns */
        const updates = {};
        Object.entries(row).forEach(([key, val]) => {
          if (key === "sku_code") return; // identifier
          if (val === undefined || String(val).trim() === "") return;
          /* convert numerics & booleans if needed */
          if (/^\d+(\.\d+)?$/.test(val)) updates[key] = Number(val);
          else if (/^(true|false)$/i.test(val)) updates[key] = val === "true";
          else updates[key] = val;
        });

        if (Object.keys(updates).length === 0) {
          parseErrs.push({ row: rowNo, sku, err: "No editable fields set" });
          return;
        }

        /* append change-log & bump iteration_number with $set & $push */
        operations.push({
          updateOne: {
            filter: { sku_code: sku },
            update: {
              $set: { ...updates, updated_at: new Date() },
              $inc: { iteration_number: 1 },
              $push: {
                change_logs: {
                  iteration_number: { $add: ["$iteration_number", 1] },
                  modified_At: new Date(),
                  modified_by: req.userId || "system",
                  changes: JSON.stringify(updates),
                },
              },
            },
          },
        });
      })
      .on("end", resolve)
      .on("error", (e) =>
        parseErrs.push({ row: rowNo, err: `CSV parse: ${e.message}` })
      );
  });

  /* ───── 3.  Bulk write to MongoDB ────────────────────────────────────── */
  let writeRes = { matchedCount: 0, modifiedCount: 0 };
  if (operations.length) {
    try {
      writeRes = await Product.bulkWrite(operations, { ordered: false });
    } catch (e) {
      // capture individual writeErrors but keep process going
      (e.writeErrors || []).forEach((we) =>
        parseErrs.push({ row: "?", err: we.errmsg })
      );
    }
  }

  /* ───── 4.  Emit a single job log document ───────────────────────────── */
  await writeProductLog({
    job_type: "Bulk-Modified",
    user: req.userId || "system",
    meta: {
      rowsRead: rowNo - 1,
      opsBuilt: operations.length,
      matched: writeRes.matchedCount,
      modified: writeRes.modifiedCount,
      errors: parseErrs,
    },
  });

  /* ───── 5.  HTTP response ────────────────────────────────────────────── */
  return sendSuccess(
    res,
    {
      rowsRead: rowNo - 1,
      matched: writeRes.matchedCount,
      modified: writeRes.modifiedCount,
      validationErrors: parseErrs,
    },
    parseErrs.length
      ? "Bulk edit completed with some validation errors"
      : "Bulk edit completed successfully"
  );
};
