const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderId: String,
    orderDate: Date,
    orderType: { type: String, enum: ["Online", "Offline"] },
    orderSource: { type: String, enum: ["Web", "Mobile", "POS"] },
    skus: [
      {
        sku: String,
        quantity: Number,
        productId: String,
        productName: String,
      },
    ],
    customerDetails: {
      userId: String,
      name: String,
      phone: String,
      address: String,
      pincode: String,
      email: String,
    },
    paymentType: { type: String, enum: ["COD", "Prepaid"] },
    dealerMapping: [
      {
        sku: String,
        dealerId: mongoose.Schema.Types.ObjectId,
      },
    ],
    status: {
      type: String,
      enum: [
        "Confirmed",
        "Assigned",
        "Scanning",
        "Packed",
        "Shipped",
        "Cancelled",
      ],
      default: "Confirmed",
    },
    invoiceNumber: String,
    timestamps: {
      createdAt: Date,
      assignedAt: Date,
      scannedAt: Date,
      packedAt: Date,
      shippedAt: Date,
    },
    trackingInfo: {
      awb: String,
      courierName: String,
      trackingUrl: String,
    },
    auditLogs: [
      {
        action: String,
        actorId: mongoose.Schema.Types.ObjectId,
        role: String,
        timestamp: Date,
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
