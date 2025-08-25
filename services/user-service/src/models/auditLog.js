const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        // User related actions
        "USER_CREATED",
        "USER_UPDATED",
        "USER_DELETED",
        "USER_ACTIVATED",
        "USER_DEACTIVATED",
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_PASSWORD_CHANGED",
        "USER_PASSWORD_RESET",
        "USER_EMAIL_VERIFIED",
        "USER_PHONE_VERIFIED",
        "USER_PROFILE_UPDATED",
        "USER_AVATAR_UPDATED",
        "USER_PREFERENCES_UPDATED",
        
        // Role and permission related actions
        "ROLE_ASSIGNED",
        "ROLE_REVOKED",
        "ROLE_CHANGED",
        "PERMISSION_GRANTED",
        "PERMISSION_REVOKED",
        "PERMISSION_MATRIX_UPDATED",
        "ACCESS_LEVEL_CHANGED",
        
        // Dealer related actions
        "DEALER_CREATED",
        "DEALER_UPDATED",
        "DEALER_DELETED",
        "DEALER_ACTIVATED",
        "DEALER_DEACTIVATED",
        "DEALER_APPROVED",
        "DEALER_REJECTED",
        "DEALER_BANK_DETAILS_UPDATED",
        "DEALER_KYC_UPDATED",
        "DEALER_DOCUMENTS_UPLOADED",
        "DEALER_DOCUMENTS_VERIFIED",
        "DEALER_DOCUMENTS_REJECTED",
        "DEALER_ADDRESS_UPDATED",
        "DEALER_CONTACT_UPDATED",
        "DEALER_STATS_ACCESSED",
        
        // Employee related actions
        "EMPLOYEE_CREATED",
        "EMPLOYEE_UPDATED",
        "EMPLOYEE_DELETED",
        "EMPLOYEE_ACTIVATED",
        "EMPLOYEE_DEACTIVATED",
        "EMPLOYEE_ROLE_CHANGED",
        "EMPLOYEE_PERMISSIONS_UPDATED",
        
        // Contact form related actions
        "CONTACT_FORM_SUBMITTED",
        "CONTACT_FORM_PROCESSED",
        "CONTACT_FORM_REPLIED",
        "CONTACT_FORM_CLOSED",
        
        // App settings related actions
        "APP_SETTING_CREATED",
        "APP_SETTING_UPDATED",
        "APP_SETTING_DELETED",
        "APP_CONFIGURATION_CHANGED",
        
        // SLA configuration related actions
        "SLA_CONFIG_CREATED",
        "SLA_CONFIG_UPDATED",
        "SLA_CONFIG_DELETED",
        "SLA_RULES_CHANGED",
        
        // Authentication and security actions
        "LOGIN_ATTEMPT_SUCCESS",
        "LOGIN_ATTEMPT_FAILED",
        "ACCOUNT_LOCKED",
        "ACCOUNT_UNLOCKED",
        "SESSION_CREATED",
        "SESSION_DESTROYED",
        "TOKEN_GENERATED",
        "TOKEN_REVOKED",
        "TOKEN_REFRESHED",
        "PASSWORD_POLICY_UPDATED",
        "SECURITY_SETTINGS_CHANGED",
        
        // System actions
        "USER_SYNC_STARTED",
        "USER_SYNC_COMPLETED",
        "USER_SYNC_FAILED",
        "BULK_USER_IMPORT",
        "BULK_USER_EXPORT",
        "USER_DATA_BACKUP",
        "USER_DATA_RESTORE",
        "REPORT_GENERATED",
        "REPORT_EXPORTED",
        "DASHBOARD_ACCESSED",
        "SYSTEM_MAINTENANCE",
        "DATA_CLEANUP_EXECUTED",
        
        // Audit log access actions
        "AUDIT_LOGS_ACCESSED",
        "AUDIT_STATS_ACCESSED",
        "AUDIT_DASHBOARD_ACCESSED",
        "AUDIT_LOGS_BY_ACTION_ACCESSED",
        "AUDIT_LOGS_BY_USER_ACCESSED",
        "AUDIT_LOGS_BY_TARGET_ACCESSED",
        "AUDIT_LOGS_BY_CATEGORY_ACCESSED",
        "BULK_OPERATION_LOGS_ACCESSED",
        "LOGIN_ATTEMPT_LOGS_ACCESSED",
        "SECURITY_EVENT_LOGS_ACCESSED",
        "AUDIT_LOGS_EXPORTED",
        
        // User access actions
        "USER_LIST_ACCESSED",
        "USER_DETAILS_ACCESSED",
        "USER_PROFILE_ACCESSED",
        "USER_STATS_ACCESSED",
        "USER_INSIGHTS_ACCESSED",
        
        // Dealer access actions
        "DEALER_LIST_ACCESSED",
        "DEALER_DETAILS_ACCESSED",
        "DEALER_STATS_ACCESSED",
        "DEALER_BY_CATEGORY_ACCESSED",
        "DEALER_FOR_ASSIGNMENT_ACCESSED",
        
        // Employee access actions
        "EMPLOYEE_LIST_ACCESSED",
        "EMPLOYEE_DETAILS_ACCESSED",
        "EMPLOYEE_STATS_ACCESSED",
        "EMPLOYEE_ASSIGNMENTS_ACCESSED",
        
        // Bank details actions
        "BANK_DETAILS_ACCESSED",
        "BANK_DETAILS_BY_ACCOUNT_ACCESSED",
        "IFSC_VALIDATION_ACCESSED",
        
        // Vehicle actions
        "VEHICLE_ADDED",
        "VEHICLE_UPDATED",
        "VEHICLE_DELETED",
        "VEHICLES_ACCESSED",
        
        // Address actions
        "ADDRESS_UPDATED",
        "ADDRESS_EDITED",
        "ADDRESS_DELETED",
        "ADDRESSES_ACCESSED",
        
        // Category mapping actions
        "CATEGORIES_MAPPED_TO_USER",
        "ALLOWED_CATEGORIES_ADDED",
        "ALLOWED_CATEGORIES_REMOVED",
        
        // Support assignment actions
        "SUPPORT_ASSIGNED",
        "SUPPORT_REMOVED",
        
        // FCM and wishlist actions
        "FCM_TOKEN_UPDATED",
        "WISHLIST_ID_UPDATED",
        
        // Bulk operations
        "BULK_DEALERS_CREATED",
        "BULK_EMPLOYEES_ASSIGNED",
        
        // Additional user management actions
        "USER_ACCOUNT_CHECKED",
        "USER_CART_ID_UPDATED",
        "USER_BY_EMAIL_ACCESSED",
        "BANK_DETAILS_ADDED",
        "BANK_DETAILS_UPDATED",
        "BANK_DETAILS_DELETED",
        "EMPLOYEES_ASSIGNED_TO_DEALER",
        "EMPLOYEES_REMOVED_FROM_DEALER",
        "DEALER_ASSIGNED_EMPLOYEES_ACCESSED",
        "EMPLOYEE_ASSIGNMENT_STATUS_UPDATED",
        
        // User-specific audit log access actions
        "USER_AUDIT_LOGS_ACCESSED",
        "DEALER_AUDIT_LOGS_ACCESSED",
        "EMPLOYEE_AUDIT_LOGS_ACCESSED"
      ]
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
      required: true
    },
    
    targetType: {
      type: String,
      enum: ["User", "Dealer", "Employee", "ContactForm", "AppSetting", "SLAConfig", "PermissionMatrix", "System"]
    },
    
    targetId: {
      type: mongoose.Schema.Types.ObjectId
    },
    
    targetIdentifier: {
      type: String // For human-readable identifiers like email, phone, dealer code, etc.
    },
    
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    ipAddress: {
      type: String
    },
    
    userAgent: {
      type: String
    },
    
    sessionId: {
      type: String
    },
    
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW"
    },
    
    category: {
      type: String,
      enum: [
        "USER_MANAGEMENT",
        "DEALER_MANAGEMENT",
        "EMPLOYEE_MANAGEMENT",
        "ROLE_MANAGEMENT",
        "PERMISSION_MANAGEMENT",
        "AUTHENTICATION",
        "SECURITY",
        "CONTACT_MANAGEMENT",
        "APP_CONFIGURATION",
        "SLA_MANAGEMENT",
        "SYSTEM_ADMIN",
        "REPORTING"
      ],
      required: true
    },
    
    // For performance tracking
    executionTime: {
      type: Number // in milliseconds
    },
    
    // For error tracking
    errorDetails: {
      type: mongoose.Schema.Types.Mixed
    },
    
    // For data changes
    oldValues: {
      type: mongoose.Schema.Types.Mixed
    },
    
    newValues: {
      type: mongoose.Schema.Types.Mixed
    },
    
    // For bulk operations
    bulkOperationId: {
      type: String
    },
    
    // For authentication events
    loginMethod: {
      type: String,
      enum: ["email", "phone", "social", "sso"]
    },
    
    // For security events
    securityEventType: {
      type: String,
      enum: ["suspicious_activity", "multiple_failed_attempts", "unusual_location", "password_compromise"]
    },
    
    // For location tracking
    location: {
      country: String,
      city: String,
      ip: String
    }
  },
  {
    timestamps: true,
    collection: "user_audit_logs"
  }
);

// Indexes for efficient querying
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ category: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ actorRole: 1, timestamp: -1 });
AuditLogSchema.index({ bulkOperationId: 1 });
AuditLogSchema.index({ targetIdentifier: 1 });
AuditLogSchema.index({ loginMethod: 1 });
AuditLogSchema.index({ securityEventType: 1 });

// TTL index to automatically delete old logs (optional - adjust retention period as needed)
// AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // 1 year

module.exports = mongoose.model("UserAuditLog", AuditLogSchema);
