const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");
const AuditLogger = require("../utils/auditLogger");

const documentUploadController = require("../controllers/documentUpload");
const documentUploadAdminController = require("../controllers/documentUploadAdmin");

// ==================== USER ROUTES ====================

/**
 * @route POST /api/documents/upload
 * @desc User uploads document (PDF/Image) for order creation
 * @access User, Dealer
 */
router.post(
    "/upload",
    authenticate,
    authorizeRoles("User", "Dealer", "Super-admin"),
    upload.array("files", 10),
    // AuditLogger.createMiddleware("DOCUMENT_UPLOADED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadController.createDocumentUpload
);

/**
 * @route GET /api/documents/my-uploads
 * @desc Get user's own document uploads
 * @access User, Dealer
 */
router.get(
    "/my-uploads",
    authenticate,
    authorizeRoles("User", "Dealer"),
    documentUploadController.getMyDocumentUploads
);

/**
 * @route GET /api/documents/user/:userId
 * @desc Get documents for a particular user (Enhanced with service data)
 * @access User, Dealer, Super-admin, Fulfillment-Admin, Customer-Support
 */
router.get(
    "/user/:userId",
    authenticate,
    authorizeRoles("User", "Dealer", "Super-admin", "Fulfillment-Admin", "Customer-Support"),
    AuditLogger.createMiddleware("USER_DOCUMENTS_ACCESSED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadController.getDocumentsForUser
);

/**
 * @route PATCH /api/documents/:id/cancel
 * @desc User cancels their document upload
 * @access User, Dealer
 */
router.patch(
    "/:id/cancel",
    authenticate,
    authorizeRoles("User", "Dealer"),
    AuditLogger.createMiddleware("DOCUMENT_CANCELLED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadController.cancelDocumentUpload
);

/**
 * @route DELETE /api/documents/:id/delete
 * @desc User deletes their document upload (only if not processed)
 * @access User, Dealer
 */
router.delete(
    "/:id/delete",
    authenticate,
    authorizeRoles("User", "Dealer"),
    AuditLogger.createMiddleware("DOCUMENT_DELETED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadController.deleteDocumentUpload
);

// ==================== ADMIN ROUTES ====================

/**
 * @route GET /api/documents/admin/stats
 * @desc Get document upload statistics
 * @access Super-admin, Fulfillment-Admin
 */
router.get(
    "/admin/stats",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
    AuditLogger.createMiddleware("DOCUMENT_STATS_ACCESSED", "DocumentUpload", "REPORTING"),
    documentUploadAdminController.getDocumentStatistics
);

/**
 * @route GET /api/documents/admin/all
 * @desc Get all document uploads (Admin side with filters)
 * @access Super-admin, Fulfillment-Admin, Customer-Support
 */
router.get(
    "/admin/all",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Customer-Support", "Inventory-Admin"),
    AuditLogger.createMiddleware("DOCUMENTS_LIST_ACCESSED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadAdminController.getAllDocumentUploads
);

/**
 * @route PATCH /api/documents/admin/:id/assign
 * @desc Assign document to admin/support staff
 * @access Super-admin, Fulfillment-Admin
 */
router.patch(
    "/admin/:id/assign",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    AuditLogger.createMiddleware("DOCUMENT_ASSIGNED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadAdminController.assignDocument
);

/**
 * @route POST /api/documents/admin/:id/contact
 * @desc Add contact history to document
 * @access Super-admin, Fulfillment-Admin, Customer-Support
 */
router.post(
    "/admin/:id/contact",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Customer-Support"),
    AuditLogger.createMiddleware("CUSTOMER_CONTACTED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadAdminController.addContactHistory
);

/**
 * @route POST /api/documents/admin/:id/notes
 * @desc Add admin notes to document
 * @access Super-admin, Fulfillment-Admin, Customer-Support
 */
router.post(
    "/admin/:id/notes",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Customer-Support"),
    AuditLogger.createMiddleware("ADMIN_NOTE_ADDED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadAdminController.addAdminNotes
);

/**
 * @route POST /api/documents/admin/:id/items
 * @desc Add items requested (parsed from document)
 * @access Super-admin, Fulfillment-Admin
 */
router.post(
    "/admin/:id/items",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    AuditLogger.createMiddleware("ITEMS_ADDED_TO_DOCUMENT", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadAdminController.addItemsRequested
);

/**
 * @route POST /api/documents/admin/:id/create-order
 * @desc Create order from document upload
 * @access Super-admin, Fulfillment-Admin
 */
router.post(
    "/admin/:id/create-order",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    // AuditLogger.createMiddleware("ORDER_CREATED_FROM_DOCUMENT", "DocumentUpload", "ORDER_MANAGEMENT"),
    documentUploadAdminController.createOrderFromDocument
);

/**
 * @route PATCH /api/documents/admin/:id/reject
 * @desc Reject document upload
 * @access Super-admin, Fulfillment-Admin
 */
router.patch(
    "/admin/:id/reject",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    AuditLogger.createMiddleware("DOCUMENT_REJECTED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadAdminController.rejectDocument
);

/**
 * @route PATCH /api/documents/admin/:id/status
 * @desc Update document status
 * @access Super-admin, Fulfillment-Admin
 */
router.patch(
    "/admin/:id/status",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin"),
    AuditLogger.createMiddleware("DOCUMENT_STATUS_UPDATED", "DocumentUpload", "DOCUMENT_MANAGEMENT"),
    documentUploadAdminController.updateDocumentStatus
);

/**
 * @route GET /api/documents/:id
 * @desc Get document upload by ID (Common for both user and admin)
 * @access User, Dealer, Admin
 */
router.get(
    "/:id",
    authenticate,
    authorizeRoles("Super-admin", "Fulfillment-Admin", "Customer-Support", "User", "Dealer"),
    documentUploadController.getDocumentUploadById
);

module.exports = router;

