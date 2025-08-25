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
        "ORDER_LIST_ACCESSED",
        "ORDER_DETAILS_ACCESSED",
        "ORDER_SHIPPED",
        "ORDER_DELIVERY_CHECKED",
        "ORDER_STATUS_BREAKDOWN_ACCESSED",
        "ORDER_REPORTS_GENERATED",

        // SKU related actions
        "SKU_PACKED",
        "SKU_SHIPPED",
        "SKU_DELIVERED",
        "SKU_SCANNED",

        // Picklist and Pickup actions
        "PICKLIST_ACCESSED",
        "DEALER_PICKLIST_ACCESSED",
        "PICKLIST_ASSIGNED",
        "PICKUP_CREATED",

        // Scan logs
        "SCAN_LOGS_ACCESSED",
        "DEALER_SCAN_LOGS_ACCESSED",

        // User orders
        "USER_ORDERS_ACCESSED",

        // Batch operations
        "BATCH_ORDER_ASSIGNMENT",
        "BATCH_ORDER_STATUS_UPDATE",

        // Dealer operations
        "DEALER_ORDERS_ACCESSED",
        "DEALER_ORDER_STATUS_UPDATED",

        // SLA related actions
        "SLA_VIOLATION_RECORDED",
        "SLA_WARNING_SENT",
        "SLA_REPORT_GENERATED",
        "SLA_TYPE_CREATED",
        "SLA_TYPES_ACCESSED",
        "SLA_BY_NAME_ACCESSED",
        "SLA_VIOLATIONS_ACCESSED",
        "ORDER_SLA_VIOLATIONS_ACCESSED",
        "DEALER_SLA_VIOLATIONS_SUMMARY_ACCESSED",
        "APPROACHING_SLA_VIOLATIONS_ACCESSED",
        "SLA_SCHEDULER_STARTED",
        "SLA_SCHEDULER_STOPPED",
        "SLA_SCHEDULER_STATUS_ACCESSED",
        "SLA_MANUAL_CHECK_TRIGGERED",

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

        // Analytics actions
        "FULFILLMENT_ANALYTICS_ACCESSED",
        "SLA_COMPLIANCE_REPORT_ACCESSED",
        "DEALER_PERFORMANCE_ANALYTICS_ACCESSED",
        "ORDER_STATS_ACCESSED",
        
        // Audit log access actions
        "ORDER_AUDIT_LOGS_ACCESSED",
        "USER_ORDER_AUDIT_LOGS_ACCESSED",
        "DEALER_ORDER_AUDIT_LOGS_ACCESSED",
      ],
    },

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    actorRole: {
      type: String,
      required: true,
      enum: [
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Dealer",
        "User",
        "Customer-Support",
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
