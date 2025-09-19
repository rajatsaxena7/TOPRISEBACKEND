const Product = require("../models/productModel");
const Category = require("../models/category");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

/**
 * Get products by category ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const {
            page = 1,
            limit = 10,
            live_status = "Live",
            sortBy = "created_at",
            sortOrder = "desc"
        } = req.query;

        // Validate categoryId
        if (!categoryId) {
            return sendError(res, "Category ID is required", 400);
        }

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return sendError(res, "Category not found", 404);
        }

        // Build filter
        const filter = {
            category: categoryId
        };

        // Add live_status filter if provided
        if (live_status) {
            filter.live_status = live_status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        // Get products with pagination and population
        const products = await Product.find(filter)
            .populate("category", "category_name category_code category_image")
            .populate("sub_category", "subcategory_name subcategory_code")
            .populate("brand", "brand_name brand_logo")
            .populate("model", "model_name")
            .populate("variant", "variant_name")
            .populate("year_range", "year")
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        const response = {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
                limit: parseInt(limit)
            },
            category: {
                _id: category._id,
                category_name: category.category_name,
                category_code: category.category_code,
                category_image: category.category_image
            }
        };

        logger.info(`✅ Fetched ${products.length} products for category: ${category.category_name}`);
        sendSuccess(res, response, "Products fetched successfully by category");

    } catch (err) {
        logger.error(`❌ Get products by category error: ${err.message}`);
        sendError(res, err);
    }
};

/**
 * Get products by category name (case-insensitive search)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProductsByCategoryName = async (req, res) => {
    try {
        const { categoryName } = req.params;
        const {
            page = 1,
            limit = 10,
            live_status = "Live",
            sortBy = "created_at",
            sortOrder = "desc"
        } = req.query;

        // Validate categoryName
        if (!categoryName) {
            return sendError(res, "Category name is required", 400);
        }

        // Find category by name (case-insensitive)
        const category = await Category.findOne({
            category_name: { $regex: new RegExp(categoryName, 'i') }
        });

        if (!category) {
            return sendError(res, `Category with name "${categoryName}" not found`, 404);
        }

        // Build filter
        const filter = {
            category: category._id
        };

        // Add live_status filter if provided
        if (live_status) {
            filter.live_status = live_status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        // Get products with pagination and population
        const products = await Product.find(filter)
            .populate("category", "category_name category_code category_image")
            .populate("sub_category", "subcategory_name subcategory_code")
            .populate("brand", "brand_name brand_logo")
            .populate("model", "model_name")
            .populate("variant", "variant_name")
            .populate("year_range", "year")
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        const response = {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
                limit: parseInt(limit)
            },
            category: {
                _id: category._id,
                category_name: category.category_name,
                category_code: category.category_code,
                category_image: category.category_image
            }
        };

        logger.info(`✅ Fetched ${products.length} products for category: ${category.category_name}`);
        sendSuccess(res, response, "Products fetched successfully by category name");

    } catch (err) {
        logger.error(`❌ Get products by category name error: ${err.message}`);
        sendError(res, err);
    }
};

/**
 * Get products by category code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProductsByCategoryCode = async (req, res) => {
    try {
        const { categoryCode } = req.params;
        const {
            page = 1,
            limit = 10,
            live_status = "Live",
            sortBy = "created_at",
            sortOrder = "desc"
        } = req.query;

        // Validate categoryCode
        if (!categoryCode) {
            return sendError(res, "Category code is required", 400);
        }

        // Find category by code
        const category = await Category.findOne({
            category_code: categoryCode
        });

        if (!category) {
            return sendError(res, `Category with code "${categoryCode}" not found`, 404);
        }

        // Build filter
        const filter = {
            category: category._id
        };

        // Add live_status filter if provided
        if (live_status) {
            filter.live_status = live_status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        // Get products with pagination and population
        const products = await Product.find(filter)
            .populate("category", "category_name category_code category_image")
            .populate("sub_category", "subcategory_name subcategory_code")
            .populate("brand", "brand_name brand_logo")
            .populate("model", "model_name")
            .populate("variant", "variant_name")
            .populate("year_range", "year")
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / parseInt(limit));

        const response = {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1,
                limit: parseInt(limit)
            },
            category: {
                _id: category._id,
                category_name: category.category_name,
                category_code: category.category_code,
                category_image: category.category_image
            }
        };

        logger.info(`✅ Fetched ${products.length} products for category: ${category.category_name}`);
        sendSuccess(res, response, "Products fetched successfully by category code");

    } catch (err) {
        logger.error(`❌ Get products by category code error: ${err.message}`);
        sendError(res, err);
    }
};

/**
 * Get product count by category
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProductCountByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { live_status } = req.query;

        // Validate categoryId
        if (!categoryId) {
            return sendError(res, "Category ID is required", 400);
        }

        // Check if category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return sendError(res, "Category not found", 404);
        }

        // Build filter
        const filter = {
            category: categoryId
        };

        // Add live_status filter if provided
        if (live_status) {
            filter.live_status = live_status;
        }

        // Get total count
        const totalCount = await Product.countDocuments(filter);

        // Get count by live_status
        const statusBreakdown = await Product.aggregate([
            { $match: { category: category._id } },
            {
                $group: {
                    _id: "$live_status",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get count by product_type
        const productTypeBreakdown = await Product.aggregate([
            { $match: { category: category._id } },
            {
                $group: {
                    _id: "$product_type",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const response = {
            category: {
                _id: category._id,
                category_name: category.category_name,
                category_code: category.category_code
            },
            summary: {
                totalProducts: totalCount
            },
            breakdown: {
                byStatus: statusBreakdown.map(item => ({
                    status: item._id || 'Unknown',
                    count: item.count,
                    percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
                })),
                byProductType: productTypeBreakdown.map(item => ({
                    productType: item._id || 'Unknown',
                    count: item.count,
                    percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0
                }))
            },
            filters: {
                live_status: live_status || null
            },
            generatedAt: new Date()
        };

        logger.info(`✅ Product count fetched for category: ${category.category_name} - Total products: ${totalCount}`);
        sendSuccess(res, response, "Product count fetched successfully by category");

    } catch (err) {
        logger.error(`❌ Get product count by category error: ${err.message}`);
        sendError(res, err);
    }
};

/**
 * Get all categories with their product counts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCategoriesWithProductCounts = async (req, res) => {
    try {
        const { live_status = "Live", category_Status = "Active" } = req.query;

        // Build product filter
        const productFilter = {};
        if (live_status) {
            productFilter.live_status = live_status;
        }

        // Build category filter
        const categoryFilter = {};
        if (category_Status) {
            categoryFilter.category_Status = category_Status;
        }

        // Get categories with product counts using aggregation
        const categoriesWithCounts = await Category.aggregate([
            { $match: categoryFilter },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "category",
                    as: "products"
                }
            },
            {
                $addFields: {
                    productCount: {
                        $size: {
                            $filter: {
                                input: "$products",
                                cond: live_status ? { $eq: ["$$this.live_status", live_status] } : true
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    category_name: 1,
                    category_code: 1,
                    category_image: 1,
                    category_Status: 1,
                    productCount: 1
                }
            },
            { $sort: { productCount: -1, category_name: 1 } }
        ]);

        const totalCategories = categoriesWithCounts.length;
        const totalProducts = categoriesWithCounts.reduce((sum, cat) => sum + cat.productCount, 0);

        const response = {
            summary: {
                totalCategories,
                totalProducts
            },
            categories: categoriesWithCounts,
            filters: {
                live_status: live_status || null,
                category_Status: category_Status || null
            },
            generatedAt: new Date()
        };

        logger.info(`✅ Fetched ${totalCategories} categories with product counts - Total products: ${totalProducts}`);
        sendSuccess(res, response, "Categories with product counts fetched successfully");

    } catch (err) {
        logger.error(`❌ Get categories with product counts error: ${err.message}`);
        sendError(res, err);
    }
};
