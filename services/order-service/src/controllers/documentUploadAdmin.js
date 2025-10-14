const DocumentUpload = require("../models/documentUpload");
const Order = require("../models/order");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const axios = require("axios");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-service:5002";

/**
 * Get all document uploads (Admin side with filters)
 * @route GET /api/documents/admin/all
 * @access Super-admin, Fulfillment-Admin, Customer-Support
 */
exports.getAllDocumentUploads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const {
            status,
            priority,
            assigned_to,
            startDate,
            endDate,
            search,
        } = req.query;

        // Build filter
        const filter = {};

        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (assigned_to) filter.assigned_to = assigned_to;

        if (search) {
            filter.$or = [
                { document_number: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
                { "customer_details.name": new RegExp(search, "i") },
                { "customer_details.email": new RegExp(search, "i") },
                { "customer_details.phone": new RegExp(search, "i") },
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const totalDocuments = await DocumentUpload.countDocuments(filter);

        const documents = await DocumentUpload.find(filter)
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("order_id", "orderId status order_Amount")
            .lean();

        const totalPages = Math.ceil(totalDocuments / limit);

        logger.info(`Admin fetched ${documents.length} document uploads`);
        return sendSuccess(res, {
            data: documents,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalDocuments,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
            filters: { status, priority, assigned_to, search, startDate, endDate },
        });
    } catch (error) {
        logger.error("Error fetching documents (admin):", error);
        return sendError(res, "Error fetching documents", 500);
    }
};

/**
 * Assign document to admin/support staff
 * @route PATCH /api/documents/admin/:id/assign
 * @access Super-admin, Fulfillment-Admin
 */
exports.assignDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_to, assigned_by } = req.body;

        if (!assigned_to) {
            return sendError(res, "assigned_to is required", 400);
        }

        const document = await DocumentUpload.findById(id);

        if (!document) {
            return sendError(res, "Document not found", 404);
        }

        document.assigned_to = assigned_to;
        document.assigned_at = new Date();
        document.status = "Under-Review";

        document.admin_notes.push({
            note: `Document assigned to ${assigned_to}`,
            added_by: assigned_by || "System",
            added_at: new Date(),
        });

        await document.save();

        logger.info(`Document ${document.document_number} assigned to ${assigned_to}`);
        return sendSuccess(res, document, "Document assigned successfully");
    } catch (error) {
        logger.error("Error assigning document:", error);
        return sendError(res, "Error assigning document", 500);
    }
};

/**
 * Add contact history
 * @route POST /api/documents/admin/:id/contact
 * @access Super-admin, Fulfillment-Admin, Customer-Support
 */
exports.addContactHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { contacted_by, contact_method, notes, outcome } = req.body;

        if (!contacted_by || !contact_method) {
            return sendError(res, "contacted_by and contact_method are required", 400);
        }

        const document = await DocumentUpload.findById(id);

        if (!document) {
            return sendError(res, "Document not found", 404);
        }

        document.contact_history.push({
            contacted_by,
            contacted_at: new Date(),
            contact_method,
            notes: notes || "",
            outcome: outcome || "",
        });

        // Update status to Contacted if it's the first contact
        if (document.status === "Pending-Review" || document.status === "Under-Review") {
            document.status = "Contacted";
        }

        await document.save();

        logger.info(`Contact history added to document ${document.document_number}`);
        return sendSuccess(res, document, "Contact history added successfully");
    } catch (error) {
        logger.error("Error adding contact history:", error);
        return sendError(res, "Error adding contact history", 500);
    }
};

/**
 * Add admin notes
 * @route POST /api/documents/admin/:id/notes
 * @access Super-admin, Fulfillment-Admin, Customer-Support
 */
exports.addAdminNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { note, added_by } = req.body;

        if (!note || !added_by) {
            return sendError(res, "note and added_by are required", 400);
        }

        const document = await DocumentUpload.findById(id);

        if (!document) {
            return sendError(res, "Document not found", 404);
        }

        document.admin_notes.push({
            note,
            added_by,
            added_at: new Date(),
        });

        await document.save();

        logger.info(`Admin note added to document ${document.document_number}`);
        return sendSuccess(res, document, "Note added successfully");
    } catch (error) {
        logger.error("Error adding admin note:", error);
        return sendError(res, "Error adding note", 500);
    }
};

/**
 * Add items requested (parsed from document)
 * @route POST /api/documents/admin/:id/items
 * @access Super-admin, Fulfillment-Admin
 */
exports.addItemsRequested = async (req, res) => {
    try {
        const { id } = req.params;
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return sendError(res, "items array is required", 400);
        }

        const document = await DocumentUpload.findById(id);

        if (!document) {
            return sendError(res, "Document not found", 404);
        }

        document.items_requested = items;
        await document.save();

        logger.info(`Items added to document ${document.document_number}`);
        return sendSuccess(res, document, "Items added successfully");
    } catch (error) {
        logger.error("Error adding items:", error);
        return sendError(res, "Error adding items", 500);
    }
};

/**
 * Create order from document upload
 * @route POST /api/documents/admin/:id/create-order
 * @access Super-admin, Fulfillment-Admin
 */
exports.createOrderFromDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { created_by, order_data } = req.body;

        if (!created_by || !order_data) {
            return sendError(res, "created_by and order_data are required", 400);
        }

        const document = await DocumentUpload.findById(id);

        if (!document) {
            return sendError(res, "Document not found", 404);
        }

        if (document.status === "Order-Created") {
            return sendError(res, "Order has already been created from this document", 400);
        }

        // Validate order data
        if (!order_data.items || !Array.isArray(order_data.items) || order_data.items.length === 0) {
            return sendError(res, "Order must contain at least one item", 400);
        }

        // Create order using existing order structure
        const orderPayload = {
            customerDetails: {
                userId: document.customer_details.user_id,
                name: document.customer_details.name || order_data.customerDetails?.name,
                phone: document.customer_details.phone || order_data.customerDetails?.phone,
                email: document.customer_details.email || order_data.customerDetails?.email,
                address: document.customer_details.address || order_data.customerDetails?.address,
                pincode: document.customer_details.pincode || order_data.customerDetails?.pincode,
            },
            items: order_data.items,
            order_Amount: order_data.order_Amount || 0,
            paymentType: order_data.paymentType || "COD",
            type_of_delivery: order_data.type_of_delivery || "Standard",
            delivery_type: order_data.delivery_type || "standard",
            deliveryCharges: order_data.deliveryCharges || 0,
            created_from_document: true,
            document_upload_id: document._id,
        };

        // Create the order
        const newOrder = new Order(orderPayload);
        await newOrder.save();

        // Update document status
        document.status = "Order-Created";
        document.order_id = newOrder._id;
        document.order_created_at = new Date();
        document.order_created_by = created_by;
        document.reviewed_by = created_by;
        document.reviewed_at = new Date();

        document.admin_notes.push({
            note: `Order ${newOrder.orderId || newOrder._id} created from this document`,
            added_by: created_by,
            added_at: new Date(),
        });

        await document.save();

        logger.info(
            `Order created from document ${document.document_number}: ${newOrder.orderId || newOrder._id}`
        );
        return sendSuccess(
            res,
            {
                document,
                order: newOrder,
            },
            "Order created successfully from document"
        );
    } catch (error) {
        logger.error("Error creating order from document:", error);
        return sendError(res, "Error creating order from document", 500);
    }
};

/**
 * Reject document upload
 * @route PATCH /api/documents/admin/:id/reject
 * @access Super-admin, Fulfillment-Admin
 */
exports.rejectDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejected_by, rejection_reason } = req.body;

        if (!rejected_by || !rejection_reason) {
            return sendError(res, "rejected_by and rejection_reason are required", 400);
        }

        const document = await DocumentUpload.findById(id);

        if (!document) {
            return sendError(res, "Document not found", 404);
        }

        if (document.status === "Order-Created") {
            return sendError(
                res,
                "Cannot reject - order has already been created from this document",
                400
            );
        }

        document.status = "Rejected";
        document.rejection_reason = rejection_reason;
        document.rejected_by = rejected_by;
        document.rejected_at = new Date();

        document.admin_notes.push({
            note: `Document rejected. Reason: ${rejection_reason}`,
            added_by: rejected_by,
            added_at: new Date(),
        });

        await document.save();

        logger.info(`Document rejected: ${document.document_number}`);
        return sendSuccess(res, document, "Document rejected");
    } catch (error) {
        logger.error("Error rejecting document:", error);
        return sendError(res, "Error rejecting document", 500);
    }
};

/**
 * Update document status
 * @route PATCH /api/documents/admin/:id/status
 * @access Super-admin, Fulfillment-Admin
 */
exports.updateDocumentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, updated_by } = req.body;

        const validStatuses = [
            "Pending-Review",
            "Under-Review",
            "Contacted",
            "Order-Created",
            "Rejected",
            "Cancelled",
        ];

        if (!status || !validStatuses.includes(status)) {
            return sendError(res, `Status must be one of: ${validStatuses.join(", ")}`, 400);
        }

        const document = await DocumentUpload.findById(id);

        if (!document) {
            return sendError(res, "Document not found", 404);
        }

        const oldStatus = document.status;
        document.status = status;

        document.admin_notes.push({
            note: `Status changed from ${oldStatus} to ${status}`,
            added_by: updated_by || "System",
            added_at: new Date(),
        });

        await document.save();

        logger.info(`Document status updated: ${document.document_number} to ${status}`);
        return sendSuccess(res, document, "Status updated successfully");
    } catch (error) {
        logger.error("Error updating status:", error);
        return sendError(res, "Error updating status", 500);
    }
};

/**
 * Get document statistics
 * @route GET /api/documents/admin/stats
 * @access Super-admin, Fulfillment-Admin
 */
exports.getDocumentStatistics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }

        const totalDocuments = await DocumentUpload.countDocuments(dateFilter);
        const pendingReview = await DocumentUpload.countDocuments({
            ...dateFilter,
            status: "Pending-Review",
        });
        const underReview = await DocumentUpload.countDocuments({
            ...dateFilter,
            status: "Under-Review",
        });
        const contacted = await DocumentUpload.countDocuments({
            ...dateFilter,
            status: "Contacted",
        });
        const orderCreated = await DocumentUpload.countDocuments({
            ...dateFilter,
            status: "Order-Created",
        });
        const rejected = await DocumentUpload.countDocuments({
            ...dateFilter,
            status: "Rejected",
        });
        const cancelled = await DocumentUpload.countDocuments({
            ...dateFilter,
            status: "Cancelled",
        });

        // Priority breakdown
        const priorityBreakdown = await DocumentUpload.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                },
            },
        ]);

        // Conversion rate
        const conversionRate =
            totalDocuments > 0 ? ((orderCreated / totalDocuments) * 100).toFixed(2) + "%" : "0%";

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUploads = await DocumentUpload.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
        });

        const stats = {
            total: totalDocuments,
            byStatus: {
                pendingReview,
                underReview,
                contacted,
                orderCreated,
                rejected,
                cancelled,
            },
            byPriority: priorityBreakdown.reduce((acc, item) => {
                acc[item._id || "Unknown"] = item.count;
                return acc;
            }, {}),
            conversionRate,
            recentActivity: {
                last7Days: recentUploads,
            },
        };

        logger.info("Document statistics retrieved");
        return sendSuccess(res, stats, "Statistics retrieved successfully");
    } catch (error) {
        logger.error("Error fetching statistics:", error);
        return sendError(res, "Error fetching statistics", 500);
    }
};

module.exports = exports;

