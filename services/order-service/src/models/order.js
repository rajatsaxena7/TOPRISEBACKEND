const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    orderId: String,
    orderDate: Date,
    deliveryCharges: Number,
    GST: Number,
    CGST: Number,
    SGST: Number,
    IGST: Number,
    totalAmount: Number,
    orderType: { type: String, enum: ["Online", "Offline", "System"] },
    orderSource: { type: String, enum: ["Web", "Mobile", "POS"] },
    slaInfo: {
      slaType: { type: String },
      expectedFulfillmentTime: Date,
      actualFulfillmentTime: Date,
      isSLAMet: Boolean,
      violationMinutes: Number,
    },
    skus: [
      {
        sku: String,
        quantity: Number,
        productId: String,
        productName: String,
        selling_price: Number,
        dealerMapped: [
          {
            dealerId: mongoose.Schema.Types.ObjectId,
          },
        ],
      },
    ],
    order_Amount: Number,
    customerDetails: {
      userId: String,
      name: String,
      phone: String,
      address: String,
      pincode: String,
      email: String,
    },
    paymentType: { type: String, enum: ["COD", "Prepaid", "System"] },
    dealerMapping: [
      {
        sku: String,
        dealerId: mongoose.Schema.Types.ObjectId,
        status: {
          type: String,
          enum: ["Pending", "Scanning", "Packed"],
          default: "Pending",
        },
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
        "Returned",
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
    type_of_delivery: {
      type: String,
      enum: ["Standard", "Express"],
    },
    delivery_type: {
      type: String,
      enum: ["standard", "endofday"],
    },
    trackingInfo: {
      awb: String,
      courierName: String,
      trackingUrl: String,
    },
    razorpay_order_id: String,
    razorpay_payment_id: String,
    payment_status: String,
    refund_status: String,
    auditLogs: [
      {
        action: String,
        actorId: mongoose.Schema.Types.ObjectId,
        role: String,
        timestamp: Date,
        reason: String,
      },
    ],
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
