const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true
    },
    
    name: {
      type: String,
      required: true
    },
    
    type: {
      type: String,
      required: true,
      enum: [
        "ORDER_ANALYTICS",
        "DEALER_PERFORMANCE", 
        "SLA_COMPLIANCE",
        "FINANCIAL_REPORT",
        "INVENTORY_REPORT",
        "RETURN_ANALYSIS",
        "AUDIT_LOG",
        "CUSTOM_REPORT"
      ]
    },
    
    category: {
      type: String,
      required: true,
      enum: [
        "ANALYTICS",
        "PERFORMANCE", 
        "COMPLIANCE",
        "FINANCIAL",
        "INVENTORY",
        "AUDIT",
        "CUSTOM"
      ]
    },
    
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    
    generatedByRole: {
      type: String,
      required: true,
      enum: ["Super Admin", "Fulfilment Admin", "Inventory Admin", "Dealer", "Customer", "System"]
    },
    
    generatedByName: {
      type: String,
      required: true
    },
    
    // Report parameters and filters
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // Date range for the report
    dateRange: {
      startDate: Date,
      endDate: Date
    },
    
    // Scope filters
    scope: {
      dealers: [String],
      regions: [String],
      products: [String],
      channels: [String]
    },
    
    // Report format and configuration
    format: {
      type: String,
      enum: ["CSV", "EXCEL", "PDF", "PNG", "JSON"],
      default: "CSV"
    },
    
    // File storage details
    fileDetails: {
      fileName: String,
      fileSize: Number, // in bytes
      filePath: String,
      s3Key: String,
      downloadUrl: String,
      expiresAt: Date
    },
    
    // Report status
    status: {
      type: String,
      enum: ["PENDING", "GENERATING", "COMPLETED", "FAILED", "EXPIRED"],
      default: "PENDING"
    },
    
    // Generation details
    generationDetails: {
      startedAt: Date,
      completedAt: Date,
      executionTime: Number, // in milliseconds
      recordCount: Number,
      errorMessage: String
    },
    
    // Access control
    accessControl: {
      roles: [String],
      users: [mongoose.Schema.Types.ObjectId],
      isPublic: {
        type: Boolean,
        default: false
      }
    },
    
    // Scheduling for recurring reports
    schedule: {
      isRecurring: {
        type: Boolean,
        default: false
      },
      frequency: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]
      },
      nextGeneration: Date,
      lastGenerated: Date
    },
    
    // Download tracking
    downloadHistory: [
      {
        downloadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        downloadedByName: String,
        downloadedByRole: String,
        downloadedAt: Date,
        ipAddress: String,
        userAgent: String
      }
    ],
    
    // Report metadata
    metadata: {
      description: String,
      tags: [String],
      version: {
        type: String,
        default: "1.0"
      },
      lastModified: Date
    },
    
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false
    },
    
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    collection: "reports"
  }
);

// Indexes for efficient querying
ReportSchema.index({ reportId: 1 });
ReportSchema.index({ type: 1, createdAt: -1 });
ReportSchema.index({ generatedBy: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ "schedule.isRecurring": 1, "schedule.nextGeneration": 1 });
ReportSchema.index({ isDeleted: 1, createdAt: -1 });

// TTL index for expired reports (optional)
// ReportSchema.index({ "fileDetails.expiresAt": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Report", ReportSchema);
