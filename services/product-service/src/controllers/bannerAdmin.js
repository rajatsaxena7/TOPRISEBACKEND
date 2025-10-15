const Banner = require("../models/banner");
const Brand = require("../models/brand");
const Type = require("../models/type");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const mongoose = require("mongoose");

/**
 * Get all banners with advanced filtering and pagination (Admin)
 * @route GET /api/banners/admin/all
 * @access Super-admin, Inventory-Admin
 */
exports.getAllBannersAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const {
            vehicle_type,
            brand_id,
            is_active,
            search,
            startDate,
            endDate,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        // Build filter
        const filter = {};

        if (vehicle_type) {
            filter.vehicle_type = vehicle_type;
        }

        if (brand_id) {
            filter.brand_id = brand_id;
        }

        if (is_active !== undefined) {
            filter.is_active = is_active === "true";
        }

        if (search) {
            filter.$or = [
                { title: new RegExp(search, "i") },
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        const totalBanners = await Banner.countDocuments(filter);

        const banners = await Banner.find(filter)
            .populate("brand_id", "brand_name brand_code")
            .populate("vehicle_type", "type_name type_code")
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean();

        const totalPages = Math.ceil(totalBanners / limit);

        // Get brand and type options for filters
        const brands = await Brand.find({}, "brand_name brand_code").sort({ brand_name: 1 });
        const vehicleTypes = await Type.find({}, "type_name type_code").sort({ type_name: 1 });

        logger.info(`Admin fetched ${banners.length} banners`);
        return sendSuccess(res, {
            data: banners,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalBanners,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
            filters: {
                brands,
                vehicleTypes,
                appliedFilters: { vehicle_type, brand_id, is_active, search, startDate, endDate },
            },
        });
    } catch (error) {
        logger.error("Error fetching banners (admin):", error);
        return sendError(res, "Error fetching banners", 500);
    }
};

/**
 * Get banner statistics for admin dashboard
 * @route GET /api/banners/admin/stats
 * @access Super-admin, Inventory-Admin
 */
exports.getBannerStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build date filter
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        // Get total counts
        const totalBanners = await Banner.countDocuments(dateFilter);
        const activeBanners = await Banner.countDocuments({ ...dateFilter, is_active: true });
        const inactiveBanners = await Banner.countDocuments({ ...dateFilter, is_active: false });

        // Get banners by vehicle type
        const byVehicleType = await Banner.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: "types",
                    localField: "vehicle_type",
                    foreignField: "_id",
                    as: "vehicleTypeInfo",
                },
            },
            { $unwind: "$vehicleTypeInfo" },
            {
                $group: {
                    _id: "$vehicleTypeInfo.type_name",
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ["$is_active", true] }, 1, 0] },
                    },
                },
            },
        ]);

        // Get banners by brand
        const byBrand = await Banner.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id",
                    foreignField: "_id",
                    as: "brandInfo",
                },
            },
            { $unwind: "$brandInfo" },
            {
                $group: {
                    _id: "$brandInfo.brand_name",
                    count: { $sum: 1 },
                    active: {
                        $sum: { $cond: [{ $eq: ["$is_active", true] }, 1, 0] },
                    },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 }, // Top 10 brands
        ]);

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentBanners = await Banner.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
        });

        const stats = {
            total: totalBanners,
            active: activeBanners,
            inactive: inactiveBanners,
            activationRate: totalBanners > 0 ? ((activeBanners / totalBanners) * 100).toFixed(2) + "%" : "0%",
            byVehicleType: byVehicleType.reduce((acc, item) => {
                acc[item._id] = { total: item.count, active: item.active };
                return acc;
            }, {}),
            byBrand: byBrand.reduce((acc, item) => {
                acc[item._id] = { total: item.count, active: item.active };
                return acc;
            }, {}),
            recentActivity: {
                last7Days: recentBanners,
            },
        };

        logger.info("Banner statistics retrieved");
        return sendSuccess(res, stats, "Banner statistics retrieved successfully");
    } catch (error) {
        logger.error("Error fetching banner statistics:", error);
        return sendError(res, "Error fetching banner statistics", 500);
    }
};

/**
 * Create banner (Admin)
 * @route POST /api/banners/admin/create
 * @access Super-admin
 */
exports.createBannerAdmin = async (req, res) => {
    try {
        const { title, brand_id, vehicle_type, is_active = false, description, link_url, display_order } = req.body;

        // Validation
        if (!title || !brand_id || !vehicle_type) {
            return sendError(res, "Title, brand_id, and vehicle_type are required", 400);
        }

        // Check if files are uploaded
        if (!req.files || !req.files["web"] || !req.files["mobile"] || !req.files["tablet"]) {
            return sendError(res, "Web, mobile, and tablet images are required", 400);
        }

        // Validate brand exists
        const brand = await Brand.findById(brand_id);
        if (!brand) {
            return sendError(res, "Brand not found", 404);
        }

        // Validate vehicle type exists
        const vehicleType = await Type.findById(vehicle_type);
        if (!vehicleType) {
            return sendError(res, "Vehicle type not found", 404);
        }

        // Upload images to S3
        const webImage = req.files["web"][0];
        const mobileImage = req.files["mobile"][0];
        const tabletImage = req.files["tablet"][0];

        const [webUpload, mobileUpload, tabletUpload] = await Promise.all([
            uploadFile(webImage.buffer, webImage.originalname, webImage.mimetype, "banners"),
            uploadFile(mobileImage.buffer, mobileImage.originalname, mobileImage.mimetype, "banners"),
            uploadFile(tabletImage.buffer, tabletImage.originalname, tabletImage.mimetype, "banners"),
        ]);

        // Create banner
        const banner = new Banner({
            title,
            image: {
                web: webUpload.Location,
                mobile: mobileUpload.Location,
                tablet: tabletUpload.Location,
            },
            brand_id,
            vehicle_type,
            is_active,
            description: description || "",
            link_url: link_url || "",
            display_order: display_order || 0,
            created_by: req.user?.userId || "admin",
        });

        await banner.save();

        // Populate and return
        const populatedBanner = await Banner.findById(banner._id)
            .populate("brand_id", "brand_name brand_code")
            .populate("vehicle_type", "type_name type_code");

        logger.info(`Banner created: ${banner.title} (ID: ${banner._id})`);
        return sendSuccess(res, populatedBanner, "Banner created successfully", 201);
    } catch (error) {
        logger.error("Error creating banner:", error);
        return sendError(res, "Error creating banner", 500);
    }
};

/**
 * Update banner (Admin)
 * @route PUT /api/banners/admin/:id
 * @access Super-admin
 */
exports.updateBannerAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, brand_id, vehicle_type, is_active, description, link_url, display_order } = req.body;

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendError(res, "Banner not found", 404);
        }

        // Validate brand if provided
        if (brand_id) {
            const brand = await Brand.findById(brand_id);
            if (!brand) {
                return sendError(res, "Brand not found", 404);
            }
        }

        // Validate vehicle type if provided
        if (vehicle_type) {
            const vehicleType = await Type.findById(vehicle_type);
            if (!vehicleType) {
                return sendError(res, "Vehicle type not found", 404);
            }
        }

        // Build update object
        const updates = {};
        if (title !== undefined) updates.title = title;
        if (brand_id !== undefined) updates.brand_id = brand_id;
        if (vehicle_type !== undefined) updates.vehicle_type = vehicle_type;
        if (is_active !== undefined) updates.is_active = is_active;
        if (description !== undefined) updates.description = description;
        if (link_url !== undefined) updates.link_url = link_url;
        if (display_order !== undefined) updates.display_order = display_order;
        updates.updated_by = req.user?.userId || "admin";

        // Handle image updates
        if (req.files) {
            const imageUpdates = { ...banner.image };

            if (req.files["web"] && req.files["web"][0]) {
                const webImage = req.files["web"][0];
                const webUpload = await uploadFile(webImage.buffer, webImage.originalname, webImage.mimetype, "banners");
                imageUpdates.web = webUpload.Location;
            }

            if (req.files["mobile"] && req.files["mobile"][0]) {
                const mobileImage = req.files["mobile"][0];
                const mobileUpload = await uploadFile(mobileImage.buffer, mobileImage.originalname, mobileImage.mimetype, "banners");
                imageUpdates.mobile = mobileUpload.Location;
            }

            if (req.files["tablet"] && req.files["tablet"][0]) {
                const tabletImage = req.files["tablet"][0];
                const tabletUpload = await uploadFile(tabletImage.buffer, tabletImage.originalname, tabletImage.mimetype, "banners");
                imageUpdates.tablet = tabletUpload.Location;
            }

            updates.image = imageUpdates;
        }

        const updatedBanner = await Banner.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        })
            .populate("brand_id", "brand_name brand_code")
            .populate("vehicle_type", "type_name type_code");

        logger.info(`Banner updated: ${updatedBanner.title} (ID: ${id})`);
        return sendSuccess(res, updatedBanner, "Banner updated successfully");
    } catch (error) {
        logger.error("Error updating banner:", error);
        return sendError(res, "Error updating banner", 500);
    }
};

/**
 * Delete banner (Admin)
 * @route DELETE /api/banners/admin/:id
 * @access Super-admin
 */
exports.deleteBannerAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findById(id);
        if (!banner) {
            return sendError(res, "Banner not found", 404);
        }

        // Check if banner is currently active
        if (banner.is_active) {
            return sendError(res, "Cannot delete active banner. Please deactivate it first.", 400);
        }

        await Banner.findByIdAndDelete(id);

        logger.info(`Banner deleted: ${banner.title} (ID: ${id})`);
        return sendSuccess(res, null, "Banner deleted successfully");
    } catch (error) {
        logger.error("Error deleting banner:", error);
        return sendError(res, "Error deleting banner", 500);
    }
};

/**
 * Bulk update banner status (Admin)
 * @route PATCH /api/banners/admin/bulk-status
 * @access Super-admin
 */
exports.bulkUpdateBannerStatus = async (req, res) => {
    try {
        const { banner_ids, is_active } = req.body;

        if (!banner_ids || !Array.isArray(banner_ids) || banner_ids.length === 0) {
            return sendError(res, "banner_ids array is required", 400);
        }

        if (typeof is_active !== "boolean") {
            return sendError(res, "is_active must be a boolean", 400);
        }

        const result = await Banner.updateMany(
            { _id: { $in: banner_ids } },
            {
                is_active,
                updated_by: req.user?.userId || "admin",
                updatedAt: new Date()
            }
        );

        logger.info(`Bulk updated ${result.modifiedCount} banners to ${is_active ? "active" : "inactive"}`);
        return sendSuccess(res, {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
        }, `${result.modifiedCount} banners updated successfully`);
    } catch (error) {
        logger.error("Error bulk updating banner status:", error);
        return sendError(res, "Error bulk updating banner status", 500);
    }
};

/**
 * Get banner by ID with full details (Admin)
 * @route GET /api/banners/admin/:id
 * @access Super-admin, Inventory-Admin
 */
exports.getBannerByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findById(id)
            .populate("brand_id", "brand_name brand_code brand_description")
            .populate("vehicle_type", "type_name type_code type_description");

        if (!banner) {
            return sendError(res, "Banner not found", 404);
        }

        logger.info(`Admin fetched banner: ${banner.title} (ID: ${id})`);
        return sendSuccess(res, banner, "Banner fetched successfully");
    } catch (error) {
        logger.error("Error fetching banner:", error);
        return sendError(res, "Error fetching banner", 500);
    }
};

/**
 * Get banners by brand (Admin)
 * @route GET /api/banners/admin/by-brand/:brandId
 * @access Super-admin, Inventory-Admin
 */
exports.getBannersByBrand = async (req, res) => {
    try {
        const { brandId } = req.params;
        const { is_active } = req.query;

        const filter = { brand_id: brandId };
        if (is_active !== undefined) {
            filter.is_active = is_active === "true";
        }

        const banners = await Banner.find(filter)
            .populate("brand_id", "brand_name brand_code")
            .populate("vehicle_type", "type_name type_code")
            .sort({ createdAt: -1 });

        logger.info(`Fetched ${banners.length} banners for brand: ${brandId}`);
        return sendSuccess(res, banners, "Banners fetched successfully");
    } catch (error) {
        logger.error("Error fetching banners by brand:", error);
        return sendError(res, "Error fetching banners by brand", 500);
    }
};

/**
 * Get banners by vehicle type (Admin)
 * @route GET /api/banners/admin/by-vehicle-type/:vehicleTypeId
 * @access Super-admin, Inventory-Admin
 */
exports.getBannersByVehicleType = async (req, res) => {
    try {
        const { vehicleTypeId } = req.params;
        const { is_active } = req.query;

        const filter = { vehicle_type: vehicleTypeId };
        if (is_active !== undefined) {
            filter.is_active = is_active === "true";
        }

        const banners = await Banner.find(filter)
            .populate("brand_id", "brand_name brand_code")
            .populate("vehicle_type", "type_name type_code")
            .sort({ createdAt: -1 });

        logger.info(`Fetched ${banners.length} banners for vehicle type: ${vehicleTypeId}`);
        return sendSuccess(res, banners, "Banners fetched successfully");
    } catch (error) {
        logger.error("Error fetching banners by vehicle type:", error);
        return sendError(res, "Error fetching banners by vehicle type", 500);
    }
};

/**
 * Update banner display order (Admin)
 * @route PATCH /api/banners/admin/:id/display-order
 * @access Super-admin
 */
exports.updateBannerDisplayOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { display_order } = req.body;

        if (typeof display_order !== "number") {
            return sendError(res, "display_order must be a number", 400);
        }

        const banner = await Banner.findByIdAndUpdate(
            id,
            { display_order, updated_by: req.user?.userId || "admin" },
            { new: true, runValidators: true }
        ).populate("brand_id", "brand_name brand_code");

        if (!banner) {
            return sendError(res, "Banner not found", 404);
        }

        logger.info(`Banner display order updated: ${banner.title} (ID: ${id})`);
        return sendSuccess(res, banner, "Display order updated successfully");
    } catch (error) {
        logger.error("Error updating display order:", error);
        return sendError(res, "Error updating display order", 500);
    }
};

/**
 * Get active banners for frontend (Public)
 * @route GET /api/banners/active
 * @access Public
 */
exports.getActiveBanners = async (req, res) => {
    try {
        const { vehicle_type, brand_id, limit = 10 } = req.query;

        const filter = { is_active: true };

        if (vehicle_type) {
            filter.vehicle_type = vehicle_type;
        }

        if (brand_id) {
            filter.brand_id = brand_id;
        }

        const banners = await Banner.find(filter)
            .populate("brand_id", "brand_name brand_code")
            .populate("vehicle_type", "type_name type_code")
            .sort({ display_order: 1, createdAt: -1 })
            .limit(parseInt(limit))
            .select("title image brand_id vehicle_type link_url display_order");

        logger.info(`Fetched ${banners.length} active banners`);
        return sendSuccess(res, banners, "Active banners fetched successfully");
    } catch (error) {
        logger.error("Error fetching active banners:", error);
        return sendError(res, "Error fetching active banners", 500);
    }
};

module.exports = exports;
