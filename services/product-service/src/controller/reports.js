const Product = require("../models/productModel");
const Brand = require("../models/brand");
const Category = require("../models/category");
const SubCategory = require("../models/subCategory");
const Model = require("../models/model");
const Variant = require("../models/variantModel");
const Pincode = require("../models/pincode");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

// ✅ PRODUCT ANALYTICS REPORT
exports.getProductAnalytics = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            brand,
            category,
            subCategory,
            model,
            variant,
            status,
            qcStatus,
            liveStatus,
            productType,
            isUniversal,
            isConsumable,
            minPrice,
            maxPrice,
            createdBy,
            createdByRole,
            groupBy = 'brand',
            sortBy = 'count',
            sortOrder = 'desc',
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Product filters
        if (brand) filter.brand = brand;
        if (category) filter.category = category;
        if (subCategory) filter.sub_category = subCategory;
        if (model) filter.model = model;
        if (variant) filter.variant = variant;
        if (status) filter.status = status;
        if (qcStatus) filter.qc_status = qcStatus;
        if (liveStatus) filter.live_status = liveStatus;
        if (productType) filter.product_type = productType;
        if (isUniversal !== undefined) filter.is_universal = isUniversal === 'true';
        if (isConsumable !== undefined) filter.is_consumable = isConsumable === 'true';
        if (createdBy) filter.created_by = createdBy;
        if (createdByRole) filter.created_by_role = createdByRole;

        // Price range filter
        if (minPrice || maxPrice) {
            filter.mrp = {};
            if (minPrice) filter.mrp.$gte = parseFloat(minPrice);
            if (maxPrice) filter.mrp.$lte = parseFloat(maxPrice);
        }

        logger.info(`🔍 Product Analytics Report - Filter:`, JSON.stringify(filter, null, 2));

        // Build aggregation pipeline
        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'subCategoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'models',
                    localField: 'model',
                    foreignField: '_id',
                    as: 'modelInfo'
                }
            }
        ];

        // Group by specified field
        const groupField = groupBy === 'brand' ? '$brandInfo.brand_name' :
            groupBy === 'category' ? '$categoryInfo.category_name' :
                groupBy === 'subCategory' ? '$subCategoryInfo.subcategory_name' :
                    groupBy === 'model' ? '$modelInfo.model_name' :
                        groupBy === 'status' ? '$status' :
                            groupBy === 'productType' ? '$product_type' :
                                groupBy === 'createdByRole' ? '$created_by_role' :
                                    '$brandInfo.brand_name';

        pipeline.push({
            $group: {
                _id: groupField,
                count: { $sum: 1 },
                totalMrp: { $sum: '$mrp' },
                avgMrp: { $avg: '$mrp' },
                minMrp: { $min: '$mrp' },
                maxMrp: { $max: '$mrp' },
                totalSellingPrice: { $sum: '$selling_price' },
                avgSellingPrice: { $avg: '$selling_price' },
                statusBreakdown: {
                    $push: {
                        status: '$status',
                        qcStatus: '$qc_status',
                        liveStatus: '$live_status'
                    }
                },
                products: {
                    $push: {
                        productId: '$_id',
                        sku: '$sku_code',
                        productName: '$product_name',
                        mrp: '$mrp',
                        sellingPrice: '$selling_price',
                        status: '$status',
                        qcStatus: '$qc_status',
                        liveStatus: '$live_status',
                        createdAt: '$createdAt'
                    }
                }
            }
        });

        // Sort
        const sortField = sortBy === 'count' ? 'count' :
            sortBy === 'totalMrp' ? 'totalMrp' :
                sortBy === 'avgMrp' ? 'avgMrp' :
                    sortBy === 'name' ? '_id' :
                        'count';

        pipeline.push({
            $sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        });

        // Limit
        pipeline.push({ $limit: parseInt(limit) });

        const analytics = await Product.aggregate(pipeline);

        // Get summary statistics
        const summary = await Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    avgMrp: { $avg: '$mrp' },
                    minMrp: { $min: '$mrp' },
                    maxMrp: { $max: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    }
                }
            }
        ]);

        // Process status breakdown
        const statusBreakdown = {};
        if (summary[0] && summary[0].statusCounts) {
            summary[0].statusCounts.forEach(item => {
                if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
                statusBreakdown[item.status]++;
            });
        }

        const response = {
            summary: {
                totalProducts: summary[0]?.totalProducts || 0,
                totalMrp: summary[0]?.totalMrp || 0,
                avgMrp: Math.round(summary[0]?.avgMrp || 0),
                minMrp: summary[0]?.minMrp || 0,
                maxMrp: summary[0]?.maxMrp || 0,
                totalSellingPrice: summary[0]?.totalSellingPrice || 0,
                avgSellingPrice: Math.round(summary[0]?.avgSellingPrice || 0),
                statusBreakdown
            },
            analytics,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                brand: brand || null,
                category: category || null,
                subCategory: subCategory || null,
                model: model || null,
                variant: variant || null,
                status: status || null,
                qcStatus: qcStatus || null,
                liveStatus: liveStatus || null,
                productType: productType || null,
                isUniversal: isUniversal || null,
                isConsumable: isConsumable || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                createdBy: createdBy || null,
                createdByRole: createdByRole || null,
                groupBy,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ Product Analytics Report generated successfully`);
        sendSuccess(res, response, "Product analytics report generated successfully");

    } catch (error) {
        logger.error("❌ Product Analytics Report error:", error);
        sendError(res, "Failed to generate product analytics report", 500);
    }
};

// ✅ PRODUCT PERFORMANCE REPORT
exports.getProductPerformance = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            brand,
            category,
            subCategory,
            model,
            variant,
            status,
            productType,
            minPrice,
            maxPrice,
            sortBy = 'totalValue',
            sortOrder = 'desc',
            limit = 50
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (brand) filter.brand = brand;
        if (category) filter.category = category;
        if (subCategory) filter.sub_category = subCategory;
        if (model) filter.model = model;
        if (variant) filter.variant = variant;
        if (status) filter.status = status;
        if (productType) filter.product_type = productType;

        if (minPrice || maxPrice) {
            filter.mrp = {};
            if (minPrice) filter.mrp.$gte = parseFloat(minPrice);
            if (maxPrice) filter.mrp.$lte = parseFloat(maxPrice);
        }

        logger.info(`🔍 Product Performance Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'subCategoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'models',
                    localField: 'model',
                    foreignField: '_id',
                    as: 'modelInfo'
                }
            },
            {
                $project: {
                    productId: '$_id',
                    sku: '$sku_code',
                    productName: '$product_name',
                    manufacturerPartName: '$manufacturer_part_name',
                    brand: { $arrayElemAt: ['$brandInfo.brand_name', 0] },
                    category: { $arrayElemAt: ['$categoryInfo.category_name', 0] },
                    subCategory: { $arrayElemAt: ['$subCategoryInfo.subcategory_name', 0] },
                    model: { $arrayElemAt: ['$modelInfo.model_name', 0] },
                    mrp: '$mrp',
                    sellingPrice: '$selling_price',
                    status: '$status',
                    qcStatus: '$qc_status',
                    liveStatus: '$live_status',
                    productType: '$product_type',
                    isUniversal: '$is_universal',
                    isConsumable: '$is_consumable',
                    images: { $size: { $ifNull: ['$images', []] } },
                    createdAt: '$createdAt',
                    updatedAt: '$updatedAt',
                    createdBy: '$created_by',
                    createdByRole: '$created_by_role',
                    // Performance metrics
                    priceDifference: { $subtract: ['$mrp', '$selling_price'] },
                    discountPercentage: {
                        $multiply: [
                            { $divide: [{ $subtract: ['$mrp', '$selling_price'] }, '$mrp'] },
                            100
                        ]
                    },
                    valueScore: {
                        $multiply: [
                            { $divide: ['$selling_price', '$mrp'] },
                            { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0.5] }
                        ]
                    }
                }
            },
            {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const performance = await Product.aggregate(pipeline);

        // Get summary statistics
        const summary = await Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgMrp: { $avg: '$mrp' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    avgDiscount: {
                        $avg: {
                            $multiply: [
                                { $divide: [{ $subtract: ['$mrp', '$selling_price'] }, '$mrp'] },
                                100
                            ]
                        }
                    },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    }
                }
            }
        ]);

        const response = {
            summary: {
                totalProducts: summary[0]?.totalProducts || 0,
                totalMrp: summary[0]?.totalMrp || 0,
                totalSellingPrice: summary[0]?.totalSellingPrice || 0,
                avgMrp: Math.round(summary[0]?.avgMrp || 0),
                avgSellingPrice: Math.round(summary[0]?.avgSellingPrice || 0),
                avgDiscount: Math.round(summary[0]?.avgDiscount || 0)
            },
            performance,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                brand: brand || null,
                category: category || null,
                subCategory: subCategory || null,
                model: model || null,
                variant: variant || null,
                status: status || null,
                productType: productType || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ Product Performance Report generated successfully`);
        sendSuccess(res, response, "Product performance report generated successfully");

    } catch (error) {
        logger.error("❌ Product Performance Report error:", error);
        sendError(res, "Failed to generate product performance report", 500);
    }
};

// ✅ PRODUCT INVENTORY REPORT
exports.getProductInventory = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            brand,
            category,
            subCategory,
            model,
            variant,
            status,
            qcStatus,
            liveStatus,
            productType,
            isUniversal,
            isConsumable,
            minPrice,
            maxPrice,
            createdBy,
            createdByRole,
            groupBy = 'status',
            sortBy = 'count',
            sortOrder = 'desc',
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (brand) filter.brand = brand;
        if (category) filter.category = category;
        if (subCategory) filter.sub_category = subCategory;
        if (model) filter.model = model;
        if (variant) filter.variant = variant;
        if (status) filter.status = status;
        if (qcStatus) filter.qc_status = qcStatus;
        if (liveStatus) filter.live_status = liveStatus;
        if (productType) filter.product_type = productType;
        if (isUniversal !== undefined) filter.is_universal = isUniversal === 'true';
        if (isConsumable !== undefined) filter.is_consumable = isConsumable === 'true';
        if (createdBy) filter.created_by = createdBy;
        if (createdByRole) filter.created_by_role = createdByRole;

        if (minPrice || maxPrice) {
            filter.mrp = {};
            if (minPrice) filter.mrp.$gte = parseFloat(minPrice);
            if (maxPrice) filter.mrp.$lte = parseFloat(maxPrice);
        }

        logger.info(`🔍 Product Inventory Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'subCategoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'models',
                    localField: 'model',
                    foreignField: '_id',
                    as: 'modelInfo'
                }
            }
        ];

        // Group by specified field
        const groupField = groupBy === 'brand' ? '$brandInfo.brand_name' :
            groupBy === 'category' ? '$categoryInfo.category_name' :
                groupBy === 'subCategory' ? '$subCategoryInfo.subcategory_name' :
                    groupBy === 'model' ? '$modelInfo.model_name' :
                        groupBy === 'status' ? '$status' :
                            groupBy === 'qcStatus' ? '$qc_status' :
                                groupBy === 'liveStatus' ? '$live_status' :
                                    groupBy === 'productType' ? '$product_type' :
                                        groupBy === 'createdByRole' ? '$created_by_role' :
                                            '$status';

        pipeline.push({
            $group: {
                _id: groupField,
                count: { $sum: 1 },
                totalMrp: { $sum: '$mrp' },
                avgMrp: { $avg: '$mrp' },
                minMrp: { $min: '$mrp' },
                maxMrp: { $max: '$mrp' },
                totalSellingPrice: { $sum: '$selling_price' },
                avgSellingPrice: { $avg: '$selling_price' },
                statusBreakdown: {
                    $push: {
                        status: '$status',
                        qcStatus: '$qc_status',
                        liveStatus: '$live_status'
                    }
                },
                products: {
                    $push: {
                        productId: '$_id',
                        sku: '$sku_code',
                        productName: '$product_name',
                        mrp: '$mrp',
                        sellingPrice: '$selling_price',
                        status: '$status',
                        qcStatus: '$qc_status',
                        liveStatus: '$live_status',
                        createdAt: '$createdAt'
                    }
                }
            }
        });

        // Sort
        const sortField = sortBy === 'count' ? 'count' :
            sortBy === 'totalMrp' ? 'totalMrp' :
                sortBy === 'avgMrp' ? 'avgMrp' :
                    sortBy === 'name' ? '_id' :
                        'count';

        pipeline.push({
            $sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        });

        // Limit
        pipeline.push({ $limit: parseInt(limit) });

        const inventory = await Product.aggregate(pipeline);

        // Get summary statistics
        const summary = await Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    avgMrp: { $avg: '$mrp' },
                    minMrp: { $min: '$mrp' },
                    maxMrp: { $max: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    }
                }
            }
        ]);

        // Process status breakdown
        const statusBreakdown = {};
        if (summary[0] && summary[0].statusCounts) {
            summary[0].statusCounts.forEach(item => {
                if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
                statusBreakdown[item.status]++;
            });
        }

        const response = {
            summary: {
                totalProducts: summary[0]?.totalProducts || 0,
                totalMrp: summary[0]?.totalMrp || 0,
                avgMrp: Math.round(summary[0]?.avgMrp || 0),
                minMrp: summary[0]?.minMrp || 0,
                maxMrp: summary[0]?.maxMrp || 0,
                totalSellingPrice: summary[0]?.totalSellingPrice || 0,
                avgSellingPrice: Math.round(summary[0]?.avgSellingPrice || 0),
                statusBreakdown
            },
            inventory,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                brand: brand || null,
                category: category || null,
                subCategory: subCategory || null,
                model: model || null,
                variant: variant || null,
                status: status || null,
                qcStatus: qcStatus || null,
                liveStatus: liveStatus || null,
                productType: productType || null,
                isUniversal: isUniversal || null,
                isConsumable: isConsumable || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                createdBy: createdBy || null,
                createdByRole: createdByRole || null,
                groupBy,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ Product Inventory Report generated successfully`);
        sendSuccess(res, response, "Product inventory report generated successfully");

    } catch (error) {
        logger.error("❌ Product Inventory Report error:", error);
        sendError(res, "Failed to generate product inventory report", 500);
    }
};

// ✅ PRODUCT CATEGORY REPORT
exports.getProductCategoryReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            category,
            subCategory,
            brand,
            model,
            variant,
            status,
            productType,
            minPrice,
            maxPrice,
            sortBy = 'count',
            sortOrder = 'desc',
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (category) filter.category = category;
        if (subCategory) filter.sub_category = subCategory;
        if (brand) filter.brand = brand;
        if (model) filter.model = model;
        if (variant) filter.variant = variant;
        if (status) filter.status = status;
        if (productType) filter.product_type = productType;

        if (minPrice || maxPrice) {
            filter.mrp = {};
            if (minPrice) filter.mrp.$gte = parseFloat(minPrice);
            if (maxPrice) filter.mrp.$lte = parseFloat(maxPrice);
        }

        logger.info(`🔍 Product Category Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'subCategoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $lookup: {
                    from: 'models',
                    localField: 'model',
                    foreignField: '_id',
                    as: 'modelInfo'
                }
            },
            {
                $group: {
                    _id: {
                        category: { $arrayElemAt: ['$categoryInfo.category_name', 0] },
                        subCategory: { $arrayElemAt: ['$subCategoryInfo.subcategory_name', 0] }
                    },
                    count: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    avgMrp: { $avg: '$mrp' },
                    minMrp: { $min: '$mrp' },
                    maxMrp: { $max: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    brands: { $addToSet: { $arrayElemAt: ['$brandInfo.brand_name', 0] } },
                    models: { $addToSet: { $arrayElemAt: ['$modelInfo.model_name', 0] } },
                    statusBreakdown: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    },
                    products: {
                        $push: {
                            productId: '$_id',
                            sku: '$sku_code',
                            productName: '$product_name',
                            brand: { $arrayElemAt: ['$brandInfo.brand_name', 0] },
                            model: { $arrayElemAt: ['$modelInfo.model_name', 0] },
                            mrp: '$mrp',
                            sellingPrice: '$selling_price',
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status',
                            createdAt: '$createdAt'
                        }
                    }
                }
            },
            {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const categoryReport = await Product.aggregate(pipeline);

        // Get summary statistics
        const summary = await Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    avgMrp: { $avg: '$mrp' },
                    minMrp: { $min: '$mrp' },
                    maxMrp: { $max: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    }
                }
            }
        ]);

        // Process status breakdown
        const statusBreakdown = {};
        if (summary[0] && summary[0].statusCounts) {
            summary[0].statusCounts.forEach(item => {
                if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
                statusBreakdown[item.status]++;
            });
        }

        const response = {
            summary: {
                totalProducts: summary[0]?.totalProducts || 0,
                totalMrp: summary[0]?.totalMrp || 0,
                avgMrp: Math.round(summary[0]?.avgMrp || 0),
                minMrp: summary[0]?.minMrp || 0,
                maxMrp: summary[0]?.maxMrp || 0,
                totalSellingPrice: summary[0]?.totalSellingPrice || 0,
                avgSellingPrice: Math.round(summary[0]?.avgSellingPrice || 0),
                statusBreakdown
            },
            categoryReport,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                category: category || null,
                subCategory: subCategory || null,
                brand: brand || null,
                model: model || null,
                variant: variant || null,
                status: status || null,
                productType: productType || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ Product Category Report generated successfully`);
        sendSuccess(res, response, "Product category report generated successfully");

    } catch (error) {
        logger.error("❌ Product Category Report error:", error);
        sendError(res, "Failed to generate product category report", 500);
    }
};

// ✅ PRODUCT BRAND REPORT
exports.getProductBrandReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            brand,
            category,
            subCategory,
            model,
            variant,
            status,
            productType,
            minPrice,
            maxPrice,
            sortBy = 'count',
            sortOrder = 'desc',
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (brand) filter.brand = brand;
        if (category) filter.category = category;
        if (subCategory) filter.sub_category = subCategory;
        if (model) filter.model = model;
        if (variant) filter.variant = variant;
        if (status) filter.status = status;
        if (productType) filter.product_type = productType;

        if (minPrice || maxPrice) {
            filter.mrp = {};
            if (minPrice) filter.mrp.$gte = parseFloat(minPrice);
            if (maxPrice) filter.mrp.$lte = parseFloat(maxPrice);
        }

        logger.info(`🔍 Product Brand Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'subCategoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'models',
                    localField: 'model',
                    foreignField: '_id',
                    as: 'modelInfo'
                }
            },
            {
                $group: {
                    _id: { $arrayElemAt: ['$brandInfo.brand_name', 0] },
                    count: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    avgMrp: { $avg: '$mrp' },
                    minMrp: { $min: '$mrp' },
                    maxMrp: { $max: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    categories: { $addToSet: { $arrayElemAt: ['$categoryInfo.category_name', 0] } },
                    subCategories: { $addToSet: { $arrayElemAt: ['$subCategoryInfo.subcategory_name', 0] } },
                    models: { $addToSet: { $arrayElemAt: ['$modelInfo.model_name', 0] } },
                    statusBreakdown: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    },
                    products: {
                        $push: {
                            productId: '$_id',
                            sku: '$sku_code',
                            productName: '$product_name',
                            category: { $arrayElemAt: ['$categoryInfo.category_name', 0] },
                            subCategory: { $arrayElemAt: ['$subCategoryInfo.subcategory_name', 0] },
                            model: { $arrayElemAt: ['$modelInfo.model_name', 0] },
                            mrp: '$mrp',
                            sellingPrice: '$selling_price',
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status',
                            createdAt: '$createdAt'
                        }
                    }
                }
            },
            {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const brandReport = await Product.aggregate(pipeline);

        // Get summary statistics
        const summary = await Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    avgMrp: { $avg: '$mrp' },
                    minMrp: { $min: '$mrp' },
                    maxMrp: { $max: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    }
                }
            }
        ]);

        // Process status breakdown
        const statusBreakdown = {};
        if (summary[0] && summary[0].statusCounts) {
            summary[0].statusCounts.forEach(item => {
                if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
                statusBreakdown[item.status]++;
            });
        }

        const response = {
            summary: {
                totalProducts: summary[0]?.totalProducts || 0,
                totalMrp: summary[0]?.totalMrp || 0,
                avgMrp: Math.round(summary[0]?.avgMrp || 0),
                minMrp: summary[0]?.minMrp || 0,
                maxMrp: summary[0]?.maxMrp || 0,
                totalSellingPrice: summary[0]?.totalSellingPrice || 0,
                avgSellingPrice: Math.round(summary[0]?.avgSellingPrice || 0),
                statusBreakdown
            },
            brandReport,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                brand: brand || null,
                category: category || null,
                subCategory: subCategory || null,
                model: model || null,
                variant: variant || null,
                status: status || null,
                productType: productType || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ Product Brand Report generated successfully`);
        sendSuccess(res, response, "Product brand report generated successfully");

    } catch (error) {
        logger.error("❌ Product Brand Report error:", error);
        sendError(res, "Failed to generate product brand report", 500);
    }
};

// ✅ PRODUCT EXPORT REPORT
exports.exportProductReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            brand,
            category,
            subCategory,
            model,
            variant,
            status,
            qcStatus,
            liveStatus,
            productType,
            isUniversal,
            isConsumable,
            minPrice,
            maxPrice,
            createdBy,
            createdByRole,
            format = 'json',
            fields = 'all'
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (brand) filter.brand = brand;
        if (category) filter.category = category;
        if (subCategory) filter.sub_category = subCategory;
        if (model) filter.model = model;
        if (variant) filter.variant = variant;
        if (status) filter.status = status;
        if (qcStatus) filter.qc_status = qcStatus;
        if (liveStatus) filter.live_status = liveStatus;
        if (productType) filter.product_type = productType;
        if (isUniversal !== undefined) filter.is_universal = isUniversal === 'true';
        if (isConsumable !== undefined) filter.is_consumable = isConsumable === 'true';
        if (createdBy) filter.created_by = createdBy;
        if (createdByRole) filter.created_by_role = createdByRole;

        if (minPrice || maxPrice) {
            filter.mrp = {};
            if (minPrice) filter.mrp.$gte = parseFloat(minPrice);
            if (maxPrice) filter.mrp.$lte = parseFloat(maxPrice);
        }

        logger.info(`🔍 Product Export Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brand',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'subCategoryInfo'
                }
            },
            {
                $lookup: {
                    from: 'models',
                    localField: 'model',
                    foreignField: '_id',
                    as: 'modelInfo'
                }
            },
            {
                $lookup: {
                    from: 'variants',
                    localField: 'variant',
                    foreignField: '_id',
                    as: 'variantInfo'
                }
            },
            {
                $project: {
                    productId: '$_id',
                    sku: '$sku_code',
                    productName: '$product_name',
                    manufacturerPartName: '$manufacturer_part_name',
                    brand: { $arrayElemAt: ['$brandInfo.brand_name', 0] },
                    category: { $arrayElemAt: ['$categoryInfo.category_name', 0] },
                    subCategory: { $arrayElemAt: ['$subCategoryInfo.subcategory_name', 0] },
                    model: { $arrayElemAt: ['$modelInfo.model_name', 0] },
                    variants: '$variantInfo.variant_name',
                    mrp: '$mrp',
                    sellingPrice: '$selling_price',
                    status: '$status',
                    qcStatus: '$qc_status',
                    liveStatus: '$live_status',
                    productType: '$product_type',
                    isUniversal: '$is_universal',
                    isConsumable: '$is_consumable',
                    images: { $size: { $ifNull: ['$images', []] } },
                    createdAt: '$createdAt',
                    updatedAt: '$updatedAt',
                    createdBy: '$created_by',
                    createdByRole: '$created_by_role',
                    description: '$description',
                    specifications: '$specifications',
                    features: '$features',
                    warranty: '$warranty',
                    weight: '$weight',
                    dimensions: '$dimensions',
                    color: '$color',
                    material: '$material',
                    countryOfOrigin: '$country_of_origin',
                    manufacturer: '$manufacturer',
                    barcode: '$barcode',
                    hsnCode: '$hsn_code',
                    gstRate: '$gst_rate',
                    discount: '$discount',
                    stock: '$stock',
                    minOrderQuantity: '$min_order_quantity',
                    maxOrderQuantity: '$max_order_quantity',
                    availableDealers: { $size: { $ifNull: ['$available_dealers', []] } },
                    tags: '$tags',
                    seoTitle: '$seo_title',
                    seoDescription: '$seo_description',
                    seoKeywords: '$seo_keywords',
                    metaData: '$meta_data',
                    customFields: '$custom_fields',
                    isActive: '$is_active',
                    isFeatured: '$is_featured',
                    isNew: '$is_new',
                    isOnSale: '$is_on_sale',
                    saleStartDate: '$sale_start_date',
                    saleEndDate: '$sale_end_date',
                    viewCount: '$view_count',
                    likeCount: '$like_count',
                    shareCount: '$share_count',
                    rating: '$rating',
                    reviewCount: '$review_count',
                    lastViewed: '$last_viewed',
                    lastPurchased: '$last_purchased',
                    lastUpdated: '$last_updated',
                    version: '$version',
                    changeLog: '$change_log',
                    auditLog: '$audit_log'
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ];

        const products = await Product.aggregate(pipeline);

        // Get summary statistics
        const summary = await Product.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalMrp: { $sum: '$mrp' },
                    avgMrp: { $avg: '$mrp' },
                    minMrp: { $min: '$mrp' },
                    maxMrp: { $max: '$mrp' },
                    totalSellingPrice: { $sum: '$selling_price' },
                    avgSellingPrice: { $avg: '$selling_price' },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            qcStatus: '$qc_status',
                            liveStatus: '$live_status'
                        }
                    }
                }
            }
        ]);

        // Process status breakdown
        const statusBreakdown = {};
        if (summary[0] && summary[0].statusCounts) {
            summary[0].statusCounts.forEach(item => {
                if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
                statusBreakdown[item.status]++;
            });
        }

        const response = {
            summary: {
                totalProducts: summary[0]?.totalProducts || 0,
                totalMrp: summary[0]?.totalMrp || 0,
                avgMrp: Math.round(summary[0]?.avgMrp || 0),
                minMrp: summary[0]?.minMrp || 0,
                maxMrp: summary[0]?.maxMrp || 0,
                totalSellingPrice: summary[0]?.totalSellingPrice || 0,
                avgSellingPrice: Math.round(summary[0]?.avgSellingPrice || 0),
                statusBreakdown
            },
            products,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                brand: brand || null,
                category: category || null,
                subCategory: subCategory || null,
                model: model || null,
                variant: variant || null,
                status: status || null,
                qcStatus: qcStatus || null,
                liveStatus: liveStatus || null,
                productType: productType || null,
                isUniversal: isUniversal || null,
                isConsumable: isConsumable || null,
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                createdBy: createdBy || null,
                createdByRole: createdByRole || null,
                format,
                fields
            }
        };

        logger.info(`✅ Product Export Report generated successfully`);
        sendSuccess(res, response, "Product export report generated successfully");

    } catch (error) {
        logger.error("❌ Product Export Report error:", error);
        sendError(res, "Failed to generate product export report", 500);
    }
};
