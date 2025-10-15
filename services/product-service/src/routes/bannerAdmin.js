const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

const bannerAdminController = require("../controllers/bannerAdmin");

// Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: (req, file, cb) => {
        // Validate file types
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
        }
    },
});

/**
 * @route GET /api/banners/admin/stats
 * @desc Get banner statistics for admin dashboard
 * @access Super-admin, Inventory-Admin
 */
router.get(
    "/stats",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    bannerAdminController.getBannerStats
);

/**
 * @route GET /api/banners/admin/all
 * @desc Get all banners with advanced filtering and pagination (Admin)
 * @access Super-admin, Inventory-Admin
 */
router.get(
    "/all",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    bannerAdminController.getAllBannersAdmin
);

/**
 * @route POST /api/banners/admin/create
 * @desc Create banner (Admin)
 * @access Super-admin
 */
router.post(
    "/create",
    authenticate,
    authorizeRoles("Super-admin"),
    upload.fields([
        { name: "web", maxCount: 1 },
        { name: "mobile", maxCount: 1 },
        { name: "tablet", maxCount: 1 },
    ]),
    bannerAdminController.createBannerAdmin
);

/**
 * @route GET /api/banners/admin/:id
 * @desc Get banner by ID with full details (Admin)
 * @access Super-admin, Inventory-Admin
 */
router.get(
    "/:id",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    bannerAdminController.getBannerByIdAdmin
);

/**
 * @route PUT /api/banners/admin/:id
 * @desc Update banner (Admin)
 * @access Super-admin
 */
router.put(
    "/:id",
    authenticate,
    authorizeRoles("Super-admin"),
    upload.fields([
        { name: "web", maxCount: 1 },
        { name: "mobile", maxCount: 1 },
        { name: "tablet", maxCount: 1 },
    ]),
    bannerAdminController.updateBannerAdmin
);

/**
 * @route DELETE /api/banners/admin/:id
 * @desc Delete banner (Admin)
 * @access Super-admin
 */
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("Super-admin"),
    bannerAdminController.deleteBannerAdmin
);

/**
 * @route PATCH /api/banners/admin/:id/display-order
 * @desc Update banner display order (Admin)
 * @access Super-admin
 */
router.patch(
    "/:id/display-order",
    authenticate,
    authorizeRoles("Super-admin"),
    bannerAdminController.updateBannerDisplayOrder
);

/**
 * @route GET /api/banners/admin/by-brand/:brandId
 * @desc Get banners by brand (Admin)
 * @access Super-admin, Inventory-Admin
 */
router.get(
    "/by-brand/:brandId",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    bannerAdminController.getBannersByBrand
);

/**
 * @route GET /api/banners/admin/by-vehicle-type/:vehicleTypeId
 * @desc Get banners by vehicle type (Admin)
 * @access Super-admin, Inventory-Admin
 */
router.get(
    "/by-vehicle-type/:vehicleTypeId",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    bannerAdminController.getBannersByVehicleType
);

/**
 * @route PATCH /api/banners/admin/bulk-status
 * @desc Bulk update banner status (Admin)
 * @access Super-admin
 */
router.patch(
    "/bulk-status",
    authenticate,
    authorizeRoles("Super-admin"),
    bannerAdminController.bulkUpdateBannerStatus
);

module.exports = router;
