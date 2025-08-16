// routes/search.js
const express = require("express");
const router = express.Router();
const Brand = require("../models/brand");
const Model = require("../models/model");
const Variant = require("../models/variantModel");
const Product = require("../models/productModel");

function stringSimilarity(str1, str2) {
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

router.get("/smart-search", async (req, res) => {
  const { query, type,sort_by, min_price, max_price } =
    req.query;
  if (!query) {
    return res.status(400).json({
      success: false,
      error: "Search query is required",
      is_brand: false,
      is_model: false,
      is_variant: false,
      is_product: false,
    });
  }

  try {
    const queryWords = query.toLowerCase().trim().split(/\s+/);
    const brandFilter = { status: "active" };
    if (type) brandFilter.type = type;

    const allBrands = await Brand.find(brandFilter);
    let selectedBrand = null;
    let usedWords = [];

    for (const brand of allBrands) {
      const brandWords = brand.brand_name.toLowerCase().split(/\s+/);
      for (const qWord of queryWords) {
        for (const bWord of brandWords) {
          const sim = stringSimilarity(qWord, bWord);
          if (sim >= 0.8) {
            selectedBrand = brand;
            usedWords.push(qWord);
            break;
          }
        }
        if (selectedBrand) break;
      }
      if (selectedBrand) break;
    }

    if (!selectedBrand) {
      return res.json({
        success: true,
        searchQuery: query,
        is_brand: true,
        is_model: false,
        is_variant: false,
        is_product: false,
        results: allBrands,
      });
    }

    const remainingWordsForModel = queryWords.filter(
      (w) => !usedWords.includes(w)
    );
    const brandModels = await Model.find({
      brand_ref: selectedBrand._id,
    });

    let selectedModel = null;
    let usedModelWords = [];
    for (const model of brandModels) {
      const modelWords = model.model_name.toLowerCase().split(/\s+/);
      for (const qWord of remainingWordsForModel) {
        for (const mWord of modelWords) {
          const sim = stringSimilarity(qWord, mWord);
          if (sim >= 0.8) {
            selectedModel = model;
            usedModelWords.push(qWord);
            break;
          }
        }
        if (selectedModel) break;
      }
      if (selectedModel) break;
    }

    if (!selectedModel) {
      return res.json({
        success: true,
        searchQuery: query,
        is_brand: false,
        is_model: true,
        is_variant: false,
        is_product: false,
        results: {
          brand: selectedBrand,
          models: brandModels,
        },
      });
    }

    const remainingWordsForVariant = remainingWordsForModel.filter(
      (w) => !usedModelWords.includes(w)
    );
    const modelVariants = await Variant.find({
      model: selectedModel._id,
    });

    let selectedVariant = null;
    let usedVariantWords = [];
    for (const variant of modelVariants) {
      const variantWords = variant.variant_name.toLowerCase().split(/\s+/);
      for (const qWord of remainingWordsForVariant) {
        for (const vWord of variantWords) {
          const sim = stringSimilarity(qWord, vWord);
          if (sim >= 0.8) {
            selectedVariant = variant;
            usedVariantWords.push(qWord);
            break;
          }
        }
        if (selectedVariant) break;
      }
      if (selectedVariant) break;
    }

    if (!selectedVariant) {
      return res.json({
        success: true,
        searchQuery: query,
        is_brand: false,
        is_model: false,
        is_variant: true,
        is_product: false,
        results: {
          brand: selectedBrand,
          model: selectedModel,
          variants: modelVariants,
        },
      });
    }

    const remainingWordsForProduct = remainingWordsForVariant.filter(
      (w) => !usedVariantWords.includes(w)
    );

    let productFilter = {
      brand: selectedBrand._id,
      model: selectedModel._id,
      variant: { $in: [selectedVariant._id] },
    };
    if (min_price || max_price) {
      productFilter.selling_price = {};
      if (min_price) productFilter.selling_price.$gte = Number(min_price);
      if (max_price) productFilter.selling_price.$lte = Number(max_price);
    }

    let sortOption = { created_at: -1 }; // Default sort

    if (sort_by) {
      sortOption = {}; // Reset to empty object

      const field = sort_by;

      switch (field.trim()) {
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
      }
    }

    let products = await Product.find(productFilter).sort(sortOption);
    let matchedProducts = [];

    if (remainingWordsForProduct.length > 0 && products.length > 0) {
      for (const product of products) {
        const tags = product.search_tags.map((t) => t.toLowerCase());
        const tagMatches = remainingWordsForProduct.filter((q) =>
          tags.some((t) => stringSimilarity(q, t) > 0.7)
        );
        if (tagMatches.length > 0) matchedProducts.push(product);
      }
    }

    return res.json({
      success: true,
      searchQuery: query,
      is_brand: false,
      is_model: false,
      is_variant: false,
      is_product: true,
      results: {
        brand: selectedBrand,
        model: selectedModel,
        variant: selectedVariant,
        products: matchedProducts.length > 0 ? matchedProducts : products,
      },
    });
  } catch (err) {
    console.error("[ERROR] Smart search failed:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      is_brand: false,
      is_model: false,
      is_variant: false,
      is_product: false,
    });
  }
});

module.exports = router;
