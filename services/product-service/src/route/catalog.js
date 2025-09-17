const express = require("express");
const router = express.Router();
const catalogController = require("../controller/catalog");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");

// Create catalog with automatic product assignment
router.post(
    "/",
    optionalAuth,
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "Catalog-Admin"),
    catalogController.createCatalog
);

router.get(
    "/",
    optionalAuth,
    catalogController.getAllCatalogs
);

router.get(
    "/:id",
    optionalAuth,
    catalogController.getCatalogById
);

router.put(
    "/:id",
    optionalAuth,
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "Catalog-Admin"),
    catalogController.updateCatalog
);

// Delete catalog
router.delete(
    "/:id",
    optionalAuth,
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    catalogController.deleteCatalog
);

// Manually assign products to catalog
router.post(
    "/:id/assign-products",
    optionalAuth,
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "Catalog-Admin"),
    catalogController.assignProductsToCatalog
);

// Remove products from catalog
router.delete(
    "/:id/remove-products",
    optionalAuth,
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "Catalog-Admin"),
    catalogController.removeProductsFromCatalog
);

// Get products by catalog criteria (for preview before creating catalog)
router.get(
    "/preview/products",
    optionalAuth,
    catalogController.getProductsByCatalogCriteria
);

// Re-assign products to existing catalog (useful when products are added/updated)
router.post(
    "/:id/reassign-products",
    optionalAuth,
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "Catalog-Admin"),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Get the catalog
            const catalog = await require("../models/catalogModel").findById(id);
            if (!catalog) {
                return require("/packages/utils/responseHandler").sendError(res, "Catalog not found", 404);
            }

            // Re-assign products based on current criteria
            const assignedProducts = await catalogController.autoAssignProductsToCatalog(id, {
                brands: catalog.catalog_brands,
                models: catalog.catalog_models,
                variants: catalog.catalog_variants,
                categories: catalog.catalog_categories,
                subcategories: catalog.catalog_subcategories,
            });

            // Update catalog with new product assignments
            catalog.catalog_products = assignedProducts.map(product => product._id);
            await catalog.save();

            return require("/packages/utils/responseHandler").sendSuccess(res, {
                catalog,
                assignedProductsCount: assignedProducts.length,
                message: `Catalog products re-assigned successfully. ${assignedProducts.length} products now assigned.`
            });

        } catch (error) {
            require("/packages/utils/logger").error("Error re-assigning products to catalog:", error);
            return require("/packages/utils/responseHandler").sendError(res, "Failed to re-assign products", 500);
        }
    }
);

// Get catalog statistics
router.get(
    "/:id/statistics",
    optionalAuth,
    async (req, res) => {
        try {
            const { id } = req.params;

            const catalog = await require("../models/catalogModel").findById(id)
                .populate('catalog_products')
                .populate('catalog_brands', 'brand_name')
                .populate('catalog_models', 'model_name')
                .populate('catalog_variants', 'variant_name');

            if (!catalog) {
                return require("/packages/utils/responseHandler").sendError(res, "Catalog not found", 404);
            }

            // Calculate statistics
            const stats = {
                totalProducts: catalog.catalog_products.length,
                totalBrands: catalog.catalog_brands.length,
                totalModels: catalog.catalog_models.length,
                totalVariants: catalog.catalog_variants.length,
                catalogStatus: catalog.catalog_status,
                createdDate: catalog.catalog_created_at,
                lastUpdated: catalog.catalog_updated_at,
                createdBy: catalog.catalog_created_by,
                updatedBy: catalog.catalog_updated_by
            };

            // Get product type distribution
            const productTypes = {};
            catalog.catalog_products.forEach(product => {
                if (product.product_type) {
                    productTypes[product.product_type] = (productTypes[product.product_type] || 0) + 1;
                }
            });

            stats.productTypeDistribution = productTypes;

            return require("/packages/utils/responseHandler").sendSuccess(res, {
                catalogId: id,
                catalogName: catalog.catalog_name,
                statistics: stats
            });

        } catch (error) {
            require("/packages/utils/logger").error("Error fetching catalog statistics:", error);
            return require("/packages/utils/responseHandler").sendError(res, "Failed to fetch catalog statistics", 500);
        }
    }
);

module.exports = router;
