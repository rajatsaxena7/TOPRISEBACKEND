const express = require("express");
const router = express.Router();
const pincodeController = require("../controller/pincode");
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");
const { optionalAuth } = require("../middleware/authMiddleware");
const ProductAuditLogger = require("../utils/auditLogger");

// ✅ CREATE PINCODE
router.post(
    "/",
    optionalAuth,
    // ProductAuditLogger.createMiddleware("PINCODE_CREATED", "Pincode", "PINCODE_MANAGEMENT"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
    pincodeController.createPincode
);

// ✅ GET ALL PINCODES
router.get(
    "/",
    optionalAuth,
    // ProductAuditLogger.createMiddleware("PINCODE_LIST_ACCESSED", "Pincode", "PINCODE_MANAGEMENT"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Dealer", "User"),
    pincodeController.getAllPincodes
);

// ✅ GET PINCODE BY ID
router.get(
    "/:id",
    optionalAuth,
    // ProductAuditLogger.createMiddleware("PINCODE_DETAILS_ACCESSED", "Pincode", "PINCODE_MANAGEMENT"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Dealer", "User"),
    pincodeController.getPincodeById
);

// ✅ UPDATE PINCODE
router.put(
    "/:id",
    optionalAuth,
    // ProductAuditLogger.createMiddleware("PINCODE_UPDATED", "Pincode", "PINCODE_MANAGEMENT"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
    pincodeController.updatePincode
);

// ✅ DELETE PINCODE
router.delete(
    "/:id",
    optionalAuth,
    // ProductAuditLogger.createMiddleware("PINCODE_DELETED", "Pincode", "PINCODE_MANAGEMENT"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
    pincodeController.deletePincode
);

// ✅ CHECK PINCODE AVAILABILITY (Public endpoint - no auth required)
router.get(
    "/check/:pincode",
    // ProductAuditLogger.createMiddleware("PINCODE_CHECKED", "Pincode", "PINCODE_MANAGEMENT"),
    pincodeController.checkPincode
);

// ✅ BULK CREATE PINCODES
router.post(
    "/bulk",
    optionalAuth,
    // ProductAuditLogger.createMiddleware("BULK_PINCODES_CREATED", "Pincode", "PINCODE_MANAGEMENT"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
    pincodeController.bulkCreatePincodes
);

// ✅ GET PINCODE STATISTICS
router.get(
    "/stats/overview",
    optionalAuth,
    // ProductAuditLogger.createMiddleware("PINCODE_STATS_ACCESSED", "Pincode", "REPORTING"),
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin", "Analytics-Admin"),
    pincodeController.getPincodeStats
);

module.exports = router;
