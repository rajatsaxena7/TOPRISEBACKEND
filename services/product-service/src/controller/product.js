const Product = require("../models/productModel");
const XLSX = require("xlsx");
const unzipper = require("unzipper");
const stream = require("stream");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");

/* ------------------------------------------------------------------ */
/*  SKU helper                                                        */
/* ------------------------------------------------------------------ */
let skuCounter = 1;
const genSKU = (name = "") => {
  const prefix = "TOP";
  const namePart = name.slice(0, 3).toUpperCase();
  const code = `${prefix}${namePart}${String(skuCounter).padStart(3, "0")}`;
  skuCounter++;
  return code;
};

/* ------------------------------------------------------------------ */
/*  BULK UPLOAD CONTROLLER                                            */
/* ------------------------------------------------------------------ */
exports.bulkUploadProducts = async (req, res) => {
  const startedAt = Date.now();
  logger.info(`📦 [BulkUpload] session started ${new Date().toISOString()}`);

  /* 1️⃣  FILE VALIDATION -------------------------------------------------- */
  if (!req.files) {
    logger.error("❌ No files uploaded");
    return sendError(res, "Please upload both dataFile and imageZip", 400);
  }

  const excelBuf = req.files?.dataFile?.[0]?.buffer;
  const zipBuf = req.files?.imageZip?.[0]?.buffer;

  if (!excelBuf || !zipBuf) {
    logger.error("❌ Missing form-data parts: dataFile or imageZip");
    return sendError(res, "Both dataFile & imageZip are required", 400);
  }

  /* 2️⃣  SPREADSHEET PARSING --------------------------------------------- */
  let rows = [];
  try {
    const wb = XLSX.read(excelBuf, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
    logger.info(`📄 Parsed ${rows.length} rows from spreadsheet`);
  } catch (e) {
    logger.error(`❌ Failed to parse spreadsheet: ${e.message}`);
    return sendError(res, "Invalid spreadsheet file", 400);
  }

  /* 3️⃣  ZIP PROCESSING -------------------------------------------------- */
  const imageMap = {}; // partName(lower-case) → S3 URL
  let imgOk = 0,
    imgSkip = 0,
    imgFail = 0;

  try {
    const zipStream = stream.Readable.from(zipBuf).pipe(
      unzipper.Parse({ forceStream: true })
    );

    for await (const entry of zipStream) {
      try {
        // Match filename without path and extension (case insensitive)
        const match = entry.path.match(/([^\\/]+?)\.(jpe?g|png|webp)$/i);
        if (!match) {
          imgSkip++;
          entry.autodrain();
          continue;
        }

        const partName = match[1].toLowerCase(); // Consistent lowercase
        logger.debug(`🖼️ Processing image: ${partName} (from ${entry.path})`);

        // Read image buffer
        const bufChunks = [];
        for await (const chunk of entry) bufChunks.push(chunk);
        const imgBuffer = Buffer.concat(bufChunks);

        // Upload to S3
        const { Location } = await uploadFile(
          imgBuffer,
          `products/${Date.now()}_${partName}.${match[2].toLowerCase()}`, // Unique filename
          `image/${
            match[2].toLowerCase() === "jpg" ? "jpeg" : match[2].toLowerCase()
          }`,
          "products"
        );

        if (Location) {
          imageMap[partName] = Location;
          imgOk++;
          logger.debug(`✅ Uploaded ${partName} → ${Location}`);
        } else {
          throw new Error("S3 returned empty Location");
        }
      } catch (e) {
        imgFail++;
        logger.error(`❌ Failed processing ${entry.path}: ${e.message}`);
        entry.autodrain();
      }
    }

    logger.info(
      `🗂️ ZIP summary • ok:${imgOk} • skipped:${imgSkip} • failed:${imgFail}`
    );
  } catch (e) {
    logger.error(`❌ ZIP processing failed: ${e.message}`);
    return sendError(res, "Failed to process image archive", 500);
  }

  /* 4️⃣  ROW VALIDATION + INSERT PREP ------------------------------------ */
  const goodDocs = [];
  const rowErrors = [];
  const seenSku = new Set();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for header, +1 zero-idx
    try {
      const prodName = row.product_name?.toString().trim();
      const partName = row.manufacturer_part_name?.toString().trim();

      if (!prodName || !partName) {
        throw new Error("Missing product_name or manufacturer_part_name");
      }

      const sku = genSKU(prodName);
      if (seenSku.has(sku)) {
        throw new Error("Duplicate SKU generated");
      }
      seenSku.add(sku);

      // Find matching image (case insensitive)
      const imgUrl = imageMap[partName.toLowerCase()];
      if (!imgUrl) {
        logger.warn(`⚠️ Row ${rowNum}: no image matched for "${partName}"`);
      }

      goodDocs.push({
        sku_code: sku,
        product_name: prodName,
        manufacturer_part_name: partName,
        category: row.category?.toString().trim(),
        sub_category: row.sub_category?.toString().trim(),
        brand: row.brand?.toString().trim(),
        product_type: row.product_type?.toString().trim(),
        created_by: row.created_by?.toString().trim(),
        images: imgUrl ? [imgUrl] : [],
        ...(row.metadata && typeof row.metadata === "object"
          ? { metadata: row.metadata }
          : {}),
        // Add other fields as needed
      });
    } catch (e) {
      rowErrors.push({
        row: rowNum,
        error: e.message,
        data: {
          product_name: row.product_name,
          manufacturer_part_name: row.manufacturer_part_name,
        },
      });
    }
  });

  logger.info(
    `✅ Rows ready for DB: ${goodDocs.length} • validation errors: ${rowErrors.length}`
  );

  /* 5️⃣  BATCH INSERT ----------------------------------------------------- */
  let inserted = 0;
  if (goodDocs.length > 0) {
    try {
      const insertedDocs = await Product.insertMany(goodDocs, {
        ordered: false,
        rawResult: true,
      });
      inserted = insertedDocs.insertedCount;
      logger.info(`📦 Inserted ${inserted} products successfully`);
    } catch (bulkErr) {
      inserted = bulkErr.result?.insertedCount || 0;
      logger.error(`🛑 MongoDB bulk insert errors: ${bulkErr.message}`);

      // Log detailed write errors
      if (bulkErr.writeErrors) {
        bulkErr.writeErrors.forEach((e, i) => {
          logger.error(`  Error ${i + 1}: ${e.errmsg}`);
          if (i < 5) {
            // Only log first 5 errors to avoid flooding
            const failedDoc = goodDocs[e.index];
            logger.error(
              `  Failed document: ${JSON.stringify({
                sku: failedDoc.sku_code,
                name: failedDoc.product_name,
              })}`
            );
          }
        });
      }
    }
  }

  /* 6️⃣  RESPOND ---------------------------------------------------------- */
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  logger.info(
    `🏁 BulkUpload finished • inserted:${inserted}/${rows.length} • time:${elapsed}s`
  );

  return sendSuccess(
    res,
    {
      stats: {
        totalRows: rows.length,
        inserted: inserted,
        withImages: goodDocs.filter((doc) => doc.images.length > 0).length,
        validationErrors: rowErrors.length,
        processingErrors: imgFail,
        durationSec: elapsed,
      },
      details: {
        imageSummary: {
          totalProcessed: imgOk + imgSkip + imgFail,
          uploaded: imgOk,
          skipped: imgSkip,
          failed: imgFail,
        },
        errors: rowErrors.slice(0, 100), // Limit error response size
      },
    },
    `Bulk upload completed in ${elapsed}s`
  );
};
