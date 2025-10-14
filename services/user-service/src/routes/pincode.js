const express = require("express");
const router = express.Router();
const pincodeController = require("../controllers/pincode");
const multer = require("multer");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept CSV files only
        if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
            cb(null, true);
        } else {
            cb(new Error("Only CSV files are allowed"), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});

/**
 * @route POST /api/pincodes/bulk-upload
 * @desc Bulk upload pincodes from CSV file
 * @access Super-admin, Fulfillment-Admin
 */
router.post(
    "/bulk-upload",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    upload.single("file"),
    pincodeController.bulkUploadPincodes
);

/**
 * @route GET /api/pincodes/stats
 * @desc Get pincode statistics
 * @access Super-admin, Fulfillment-Admin
 */
router.get(
    "/stats",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
    pincodeController.getPincodeStats
);

/**
 * @route GET /api/pincodes/states
 * @desc Get all unique states
 * @access Public
 */
router.get(
    "/states",
    pincodeController.getAllStates
);

/**
 * @route GET /api/pincodes/cities/:state
 * @desc Get cities by state
 * @access Public
 */
router.get(
    "/cities/:state",
    pincodeController.getCitiesByState
);

/**
 * @route GET /api/pincodes/check/:pincode
 * @desc Check if pincode is serviceable
 * @access Public
 */
router.get(
    "/check/:pincode",
    pincodeController.checkPincodeServiceability
);

/**
 * @route GET /api/pincodes
 * @desc Get all pincodes with pagination and filters
 * @access Super-admin, Fulfillment-Admin, User
 */
router.get(
    "/",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "User"),
    pincodeController.getAllPincodes
);

/**
 * @route POST /api/pincodes
 * @desc Create single pincode
 * @access Super-admin, Fulfillment-Admin
 */
router.post(
    "/",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    pincodeController.createPincode
);

/**
 * @route PUT /api/pincodes/:id
 * @desc Update pincode
 * @access Super-admin, Fulfillment-Admin
 */
router.put(
    "/:id",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    pincodeController.updatePincode
);

/**
 * @route DELETE /api/pincodes/:id
 * @desc Delete pincode
 * @access Super-admin
 */
router.delete(
    "/:id",
    authenticate,
    authorizeRoles("Super-admin"),
    pincodeController.deletePincode
);

/**
 * @route PATCH /api/pincodes/bulk-update-serviceability
 * @desc Bulk update pincode serviceability
 * @access Super-admin, Fulfillment-Admin
 */
router.patch(
    "/bulk-update-serviceability",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    pincodeController.bulkUpdateServiceability
);

/**
 * @route GET /api/pincodes/:pincode
 * @desc Get pincode by pincode number
 * @access Public
 */
router.get(
    "/:pincode",
    pincodeController.getPincodeByNumber
);

module.exports = router;

