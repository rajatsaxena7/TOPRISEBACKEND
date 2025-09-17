const Catalog = require("../models/catalogModel");
const Product = require("../models/productModel");
const Brand = require("../models/brand");
const Model = require("../models/model");
const Variant = require("../models/variantModel");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

/**
 * Create a new catalog and automatically assign products based on brand, model, and variants
 */
const createCatalog = async (req, res) => {
    try {
        const {
            catalog_name,
            catalog_description,
            catalog_image,
            catalog_created_by,
            catalog_updated_by,
            catalog_brands,
            catalog_models,
            catalog_variants,
            catalog_categories,
            catalog_subcategories,
            catalog_manufacturers,
            catalog_types,
            catalog_years,
        } = req.body;

        // Validate required fields


        // Create the catalog
        const catalog = new Catalog({
            catalog_name,
            catalog_description,
            catalog_image,
            catalog_created_by,
            catalog_updated_by: catalog_updated_by || catalog_created_by,
            catalog_brands: catalog_brands || [],
            catalog_models: catalog_models || [],
            catalog_variants: catalog_variants || [],
            catalog_categories: catalog_categories || [],
            catalog_subcategories: catalog_subcategories || [],
            catalog_manufacturers: catalog_manufacturers || [],
            catalog_types: catalog_types || [],
            catalog_years: catalog_years || [],
            catalog_products: [], // Will be populated by auto-assignment
        });

        const savedCatalog = await catalog.save();

        // Auto-assign products to the catalog based on brand, model, and variants
        const assignedProducts = await autoAssignProductsToCatalog(savedCatalog._id, {
            brands: catalog_brands,
            models: catalog_models,
            variants: catalog_variants,
            categories: catalog_categories,
            subcategories: catalog_subcategories,
        });

        // Update catalog with assigned products
        savedCatalog.catalog_products = assignedProducts.map(product => product._id);
        await savedCatalog.save();

        logger.info(`Catalog created successfully: ${savedCatalog._id} with ${assignedProducts.length} products assigned`);

        return sendSuccess(res, {
            catalog: savedCatalog,
            assignedProductsCount: assignedProducts.length,
            message: `Catalog created successfully with ${assignedProducts.length} products automatically assigned`
        }, 201);

    } catch (error) {
        logger.error("Error creating catalog:", error);
        return sendError(res, "Failed to create catalog", 500);
    }
};

/**
 * Auto-assign products to catalog based on brand, model, and variants
 */
const autoAssignProductsToCatalog = async (catalogId, criteria) => {
    try {
        const { brands, models, variants, categories, subcategories } = criteria;

        // Build query conditions
        const queryConditions = {};

        // Add brand filter if specified
        if (brands && brands.length > 0) {
            queryConditions.brand = { $in: brands };
        }

        // Add model filter if specified
        if (models && models.length > 0) {
            queryConditions.model = { $in: models };
        }

        // Add variant filter if specified
        if (variants && variants.length > 0) {
            queryConditions.variant = { $in: variants };
        }

        // Add category filter if specified
        if (categories && categories.length > 0) {
            queryConditions.category = { $in: categories };
        }

        // Add subcategory filter if specified
        if (subcategories && subcategories.length > 0) {
            queryConditions.sub_category = { $in: subcategories };
        }

        // Find products matching the criteria
        const products = await Product.find(queryConditions)
            .populate('brand', 'brand_name brand_code')
            .populate('model', 'model_name model_code')
            .populate('variant', 'variant_name variant_code')
            .populate('category', 'category_name')
            .populate('sub_category', 'subcategory_name');

        logger.info(`Found ${products.length} products matching catalog criteria for catalog: ${catalogId}`);

        return products;

    } catch (error) {
        logger.error("Error auto-assigning products to catalog:", error);
        throw error;
    }
};

/**
 * Get all catalogs with their assigned products
 */
const getAllCatalogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) {
            query.catalog_status = status;
        }

        const catalogs = await Catalog.find(query)
            .populate('catalog_products', 'product_name sku_code brand model variant')
            .populate('catalog_brands', 'brand_name brand_code')
            .populate('catalog_models', 'model_name model_code')
            .populate('catalog_variants', 'variant_name variant_code')
            .sort({ catalog_created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Catalog.countDocuments(query);

        return sendSuccess(res, {
            catalogs,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        logger.error("Error fetching catalogs:", error);
        return sendError(res, "Failed to fetch catalogs", 500);
    }
};

/**
 * Get catalog by ID with detailed product information
 */
const getCatalogById = async (req, res) => {
    try {
        const { id } = req.params;

        const catalog = await Catalog.findById(id)
            .populate({
                path: 'catalog_products',
                populate: [
                    { path: 'brand', select: 'brand_name brand_code' },
                    { path: 'model', select: 'model_name model_code' },
                    { path: 'variant', select: 'variant_name variant_code' },
                    { path: 'category', select: 'category_name' },
                    { path: 'sub_category', select: 'subcategory_name' }
                ]
            })
            .populate('catalog_brands', 'brand_name brand_code')
            .populate('catalog_models', 'model_name model_code')
            .populate('catalog_variants', 'variant_name variant_code')
            .populate('catalog_categories', 'category_name')
            .populate('catalog_subcategories', 'subcategory_name')
            .populate('catalog_manufacturers', 'manufacturer_name')
            .populate('catalog_types', 'type_name')
            .populate('catalog_years', 'year');

        if (!catalog) {
            return sendError(res, "Catalog not found", 404);
        }

        return sendSuccess(res, { catalog });

    } catch (error) {
        logger.error("Error fetching catalog by ID:", error);
        return sendError(res, "Failed to fetch catalog", 500);
    }
};

/**
 * Update catalog and re-assign products based on new criteria
 */
const updateCatalog = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Find existing catalog
        const existingCatalog = await Catalog.findById(id);
        if (!existingCatalog) {
            return sendError(res, "Catalog not found", 404);
        }

        // Update catalog fields
        const updatedCatalog = await Catalog.findByIdAndUpdate(
            id,
            {
                ...updateData,
                catalog_updated_at: new Date(),
            },
            { new: true }
        );

        // Re-assign products based on updated criteria
        const assignedProducts = await autoAssignProductsToCatalog(id, {
            brands: updateData.catalog_brands || existingCatalog.catalog_brands,
            models: updateData.catalog_models || existingCatalog.catalog_models,
            variants: updateData.catalog_variants || existingCatalog.catalog_variants,
            categories: updateData.catalog_categories || existingCatalog.catalog_categories,
            subcategories: updateData.catalog_subcategories || existingCatalog.catalog_subcategories,
        });

        // Update catalog with new product assignments
        updatedCatalog.catalog_products = assignedProducts.map(product => product._id);
        await updatedCatalog.save();

        logger.info(`Catalog updated successfully: ${id} with ${assignedProducts.length} products assigned`);

        return sendSuccess(res, {
            catalog: updatedCatalog,
            assignedProductsCount: assignedProducts.length,
            message: `Catalog updated successfully with ${assignedProducts.length} products assigned`
        });

    } catch (error) {
        logger.error("Error updating catalog:", error);
        return sendError(res, "Failed to update catalog", 500);
    }
};

/**
 * Delete catalog
 */
const deleteCatalog = async (req, res) => {
    try {
        const { id } = req.params;

        const catalog = await Catalog.findByIdAndDelete(id);
        if (!catalog) {
            return sendError(res, "Catalog not found", 404);
        }

        logger.info(`Catalog deleted successfully: ${id}`);

        return sendSuccess(res, { message: "Catalog deleted successfully" });

    } catch (error) {
        logger.error("Error deleting catalog:", error);
        return sendError(res, "Failed to delete catalog", 500);
    }
};

/**
 * Manually assign products to catalog
 */
const assignProductsToCatalog = async (req, res) => {
    try {
        const { id } = req.params;
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds)) {
            return sendError(res, "Product IDs array is required", 400);
        }

        const catalog = await Catalog.findById(id);
        if (!catalog) {
            return sendError(res, "Catalog not found", 404);
        }

        // Verify products exist
        const products = await Product.find({ _id: { $in: productIds } });
        if (products.length !== productIds.length) {
            return sendError(res, "Some products not found", 400);
        }

        // Add products to catalog (avoid duplicates)
        const existingProductIds = catalog.catalog_products.map(id => id.toString());
        const newProductIds = productIds.filter(id => !existingProductIds.includes(id.toString()));

        catalog.catalog_products = [...catalog.catalog_products, ...newProductIds];
        await catalog.save();

        logger.info(`Manually assigned ${newProductIds.length} products to catalog: ${id}`);

        return sendSuccess(res, {
            catalog,
            assignedProductsCount: newProductIds.length,
            message: `${newProductIds.length} products assigned to catalog successfully`
        });

    } catch (error) {
        logger.error("Error assigning products to catalog:", error);
        return sendError(res, "Failed to assign products to catalog", 500);
    }
};

/**
 * Remove products from catalog
 */
const removeProductsFromCatalog = async (req, res) => {
    try {
        const { id } = req.params;
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds)) {
            return sendError(res, "Product IDs array is required", 400);
        }

        const catalog = await Catalog.findById(id);
        if (!catalog) {
            return sendError(res, "Catalog not found", 404);
        }

        // Remove products from catalog
        catalog.catalog_products = catalog.catalog_products.filter(
            productId => !productIds.includes(productId.toString())
        );
        await catalog.save();

        logger.info(`Removed ${productIds.length} products from catalog: ${id}`);

        return sendSuccess(res, {
            catalog,
            removedProductsCount: productIds.length,
            message: `${productIds.length} products removed from catalog successfully`
        });

    } catch (error) {
        logger.error("Error removing products from catalog:", error);
        return sendError(res, "Failed to remove products from catalog", 500);
    }
};

/**
 * Get products by catalog criteria (brand, model, variants)
 */
const getProductsByCatalogCriteria = async (req, res) => {
    try {
        const { brands, models, variants, categories, subcategories } = req.query;

        const queryConditions = {};

        if (brands) {
            queryConditions.brand = { $in: brands.split(',') };
        }

        if (models) {
            queryConditions.model = { $in: models.split(',') };
        }

        if (variants) {
            queryConditions.variant = { $in: variants.split(',') };
        }

        if (categories) {
            queryConditions.category = { $in: categories.split(',') };
        }

        if (subcategories) {
            queryConditions.sub_category = { $in: subcategories.split(',') };
        }

        const products = await Product.find(queryConditions)
            .populate('brand', 'brand_name brand_code')
            .populate('model', 'model_name model_code')
            .populate('variant', 'variant_name variant_code')
            .populate('category', 'category_name')
            .populate('sub_category', 'subcategory_name')
            .limit(100); // Limit for performance

        return sendSuccess(res, {
            products,
            count: products.length,
            criteria: { brands, models, variants, categories, subcategories }
        });

    } catch (error) {
        logger.error("Error fetching products by catalog criteria:", error);
        return sendError(res, "Failed to fetch products", 500);
    }
};

module.exports = {
    createCatalog,
    getAllCatalogs,
    getCatalogById,
    updateCatalog,
    deleteCatalog,
    assignProductsToCatalog,
    removeProductsFromCatalog,
    getProductsByCatalogCriteria,
    autoAssignProductsToCatalog
};
