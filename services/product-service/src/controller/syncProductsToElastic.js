const mongoose = require("mongoose");
const axios = require("axios");
const Product = require("../models/productModel");
const Brand = require("../models/brand");
const Model = require("../models/Model");
const Variant = require("../models/variantModel");

// 1. Connect to MongoDB
mongoose.connect(
  "mongodb+srv://techdev:dLLlFqu0Wx103dzp@toprisedev.xoptvj9.mongodb.net/?retryWrites=true&w=majority&appName=toprisedev",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// 2. Sync function
async function syncAllProducts() {
  const products = await Product.find()
    .populate("brand")
    .populate("model")
    .populate("variant");

  const bulk = [];

  for (const product of products) {
    const brandName = product.brand?.name || "";
    const modelName = product.model?.name || "";
    const variantNames = Array.isArray(product.variant)
      ? product.variant.map((v) => v?.name || "").join(" ")
      : "";

    bulk.push(
      { index: { _index: "products", _id: product._id.toString() } },
      {
        sku_code: product.sku_code,
        product_name: product.product_name,
        manufacturer_part_name: product.manufacturer_part_name,
        search_tags: product.search_tags,
        brand: brandName,
        model: modelName,
        variant: variantNames,
      }
    );
  }

  const { data } = await axios.post(
    "http://localhost:9200/_bulk",
    bulk.map(JSON.stringify).join("\n") + "\n",
    {
      headers: { "Content-Type": "application/x-ndjson" },
    }
  );

  console.log("Sync complete:", data);
  process.exit(0);
}

syncAllProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});
