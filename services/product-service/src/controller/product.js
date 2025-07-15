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

exports.SearchAlgorithm = async (req, res) => {};

exports.exportDealerProducts = async (req, res) => {
  /* ───── 1. Build Mongo filter from query-string ────────────────── */
  const { dealer_id, brand, category, sub_category, product_type } = req.query;

  const filter = {};

  if (dealer_id) filter["available_dealers.dealers_Ref"] = dealer_id;

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
          "sku_code product_name mrp_with_gst selling_price brand category sub_category available_dealers"
        )
        .populate("brand", "brand_name")
        .populate("category", "category_name")
        .populate("sub_category", "subcategory_name")
        .lean();
    }

    if (!products.length)
      return sendError(res, "No products match the given filter", 404);

    /* --- 3. Flatten dealer array → one row per (sku, dealer) ------ */
    const rows = [];
    products.forEach((p) => {
      const base = {
        sku_code: p.sku_code,
        product_name: p.product_name,
        mrp_with_gst: p.mrp_with_gst,
        selling_price: p.selling_price,
        brand: p.brand?.brand_name || "",
        category: p.category?.category_name || "",
        sub_category: p.sub_category?.subcategory_name || "",
      };

      (p.available_dealers || []).forEach((d) => {
        if (!dealer_id || dealer_id === d.dealers_Ref) {
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

    /* --- 4. Prepare CSV streaming -------------------------------- */
    const fileName = `dealer_products_${Date.now()}.csv`;
    const csvHeaders = [
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
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const csvStream = fastcsv.format({ headers: csvHeaders });
    csvStream.pipe(res);

    rows.forEach((r) => csvStream.write(r));
    csvStream.end();

    /* --- 5. Async job-log (fire-and-forget) ----------------------- */
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

    return sendSuccess(res, product, "Product de-activated");
  } catch (err) {
    logger.error(`deactivateProductsSingle: ${err.message}`);
    return sendError(res, err);
  }
};
exports.deactivateProductsBulk = async (req, res) => {
  /* 1️⃣  Gather identifiers ------------------------------------------ */
  const skuCodes = Array.isArray(req.body.sku_codes) ? req.body.sku_codes : [];
  const mongoIds = Array.isArray(req.body.ids) ? req.body.ids : [];

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
    const { reason = "Not specified" } = req.body;
    const userId = req.user?.id || "system";

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

    logger.info(`✅ Approved product ${product.sku_code} by ${userId}`);
    return sendSuccess(res, product, "Product approved");
  } catch (err) {
    logger.error(`approveProduct error: ${err.message}`);
    return sendError(res, err);
  }
};
