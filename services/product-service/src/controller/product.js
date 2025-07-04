const Product = require("../models/product");
const XLSX = require("xlsx");
const unzipper = require("unzipper");
const { uploadFile } = require("/packages/utils/s3Helper");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const stream = require("stream");

let skuCounter = 1;

const generateSKU = (productName) => {
  const prefix = "TOP";
  const namePart = productName.slice(0, 3).toUpperCase();
  const code = `${prefix}${namePart}${String(skuCounter).padStart(3, "0")}`;
  skuCounter++;
  return code;
};

exports.bulkUploadProducts = async (req, res) => {
  try {
    const excelBuffer = req.files.dataFile?.[0]?.buffer;
    const zipBuffer = req.files.imageZip?.[0]?.buffer;

    if (!excelBuffer || !zipBuffer) {
      return sendError(res, "Missing required files", 400);
    }

    // 🔹 Parse Excel or CSV
    const workbook = XLSX.read(excelBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 🔹 Unzip images
    const imageMap = {};
    const zipStream = stream.Readable.from(zipBuffer).pipe(
      unzipper.Parse({ forceStream: true })
    );
    for await (const entry of zipStream) {
      const fileName = entry.path;
      const match = fileName.match(/(.+?)\.(jpg|jpeg|png|webp)$/i);
      if (match) {
        const manufacturerName = match[1].toLowerCase();
        const uploaded = await uploadFile(
          await entry.buffer(),
          fileName,
          "image/jpeg",
          "products"
        );
        imageMap[manufacturerName] = uploaded.Location;
      } else {
        entry.autodrain();
      }
    }

    const insertedProducts = [];
    for (const row of rows) {
      const {
        product_name,
        manufacturer_part_name,
        category,
        sub_category,
        brand,
        product_type,
        created_by,
        ...rest
      } = row;

      const sku_code = generateSKU(product_name);
      const imageKey = manufacturer_part_name.toLowerCase();
      const matchedImage = imageMap[imageKey];

      const newProduct = new Product({
        product_name,
        manufacturer_part_name,
        sku_code,
        category,
        sub_category,
        brand,
        product_type,
        created_by,
        images: matchedImage ? [matchedImage] : [],
        ...rest,
      });

      const saved = await newProduct.save();
      insertedProducts.push(saved);
    }

    logger.info(`✅ Uploaded ${insertedProducts.length} products`);
    return sendSuccess(res, insertedProducts, "Bulk product upload successful");
  } catch (err) {
    logger.error(`❌ Bulk product upload error: ${err.message}`);
    return sendError(res, err);
  }
};
