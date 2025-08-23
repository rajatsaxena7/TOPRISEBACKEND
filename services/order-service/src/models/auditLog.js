const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        // Order related actions
        "ORDER_CREATED",
        "ORDER_UPDATED",
        "ORDER_STATUS_CHANGED",
        "ORDER_CANCELLED",
        "ORDER_DELIVERED",
        "ORDER_RETURNED",

        // SKU related actions
        "SKU_PACKED",
        "SKU_SHIPPED",
        "SKU_DELIVERED",

        // SLA related actions
        "SLA_VIOLATION_RECORDED",
        "SLA_WARNING_SENT",
        "SLA_REPORT_GENERATED",

        // Dealer related actions
        "DEALER_ASSIGNED",
        "DEALER_REMAPPED",
        "DEALER_SLA_UPDATED",

        // User related actions
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_CREATED",
        "USER_UPDATED",
        "USER_DELETED",
        "ROLE_CHANGED",
        "PERMISSION_UPDATED",

        // Product related actions
        "PRODUCT_CREATED",
        "PRODUCT_UPDATED",
        "PRODUCT_DELETED",
        "STOCK_UPDATED",
        "PRICE_CHANGED",

        // Payment related actions
        "PAYMENT_PROCESSED",
        "PAYMENT_FAILED",
        "REFUND_PROCESSED",
        "REFUND_FAILED",

        // System actions
        "REPORT_GENERATED",
        "REPORT_EXPORTED",
        "DASHBOARD_ACCESSED",
        "CONFIGURATION_CHANGED",
        "BACKUP_CREATED",
        "SYSTEM_MAINTENANCE",
      ],
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    actorRole: {
      type: String,
      required: true,
      enum: [
        "Super-Admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Dealer",
        "Customer",
        "System",
      ],
    },

    actorName: {
      type: String,
      required: true,
    },

    targetType: {
      type: String,
      enum: [
        "Order",
        "User",
        "Product",
        "Dealer",
        "SLA",
        "Payment",
        "Report",
        "System",
        "SKU",
      ],
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    targetIdentifier: {
      type: String, // For human-readable identifiers like orderId, sku, etc.
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    sessionId: {
      type: String,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
    },

    category: {
      type: String,
      enum: [
        "ORDER_MANAGEMENT",
        "USER_MANAGEMENT",
        "PRODUCT_MANAGEMENT",
        "DEALER_MANAGEMENT",
        "SLA_MANAGEMENT",
        "PAYMENT_MANAGEMENT",
        "REPORTING",
        "SYSTEM_ADMIN",
        "SECURITY",
      ],
      required: true,
    },

    // For performance tracking
    executionTime: {
      type: Number, // in milliseconds
    },

    // For error tracking
    errorDetails: {
      type: mongoose.Schema.Types.Mixed,
    },

    // For data changes
    oldValues: {
      type: mongoose.Schema.Types.Mixed,
    },

    newValues: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "audit_logs",
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ category: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ actorRole: 1, timestamp: -1 });

// TTL index to automatically delete old logs (optional - adjust retention period as needed)
// AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

module.exports = mongoose.model("AuditLog", AuditLogSchema);
