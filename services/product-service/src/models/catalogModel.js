const mongoose = require("mongoose");

const catalogSchema = new mongoose.Schema({
    catalog_name: {
        type: String,
        required: true,
    },
    catalog_description: {
        type: String,
        required: true,
    },
    catalog_image: {
        type: String,
        // required: true,
    },
    catalog_status: {
        type: String,
        required: true,
        enum: ["active", "inactive", "pending", "created", "rejected"],
        default: "created",
    },
    catalog_created_at: {
        type: Date,
        default: Date.now,
    },
    catalog_updated_at: {
        type: Date,
        default: Date.now,
    },
    catalog_created_by: {
        type: String,
        // required: true,
    },
    catalog_updated_by: {
        type: String,
        // required: true,
    },

    catalog_categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    }],
    catalog_brands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
    }],
    catalog_manufacturers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manufacturer",
    }],
    catalog_types: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    catalog_years: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Year",
    }],
    catalog_variants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Variant",
    }],
    catalog_models: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Model",
    }],
    catalog_subcategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
    }],
    catalog_categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    }],
    catalog_products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
    catalog_brands: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
    }],

});

module.exports = mongoose.model("Catalog", catalogSchema);