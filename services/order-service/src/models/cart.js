const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
        default: 1,
    },
    selling_price: {
        type: Number,
        required: true,
    },
    mrp_with_gst: {
        type: Number,
        required: true,
    }
});

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        items: [cartItemSchema],

        totalPrice: {
            type: Number,
            default: 0,
        },
        handlingCharge: {
            type: Number,
            default: 0,
        },
        deliveryCharge: {
            type: Number,
            default: 0,
        },
        grandTotal: {
            type: Number,
            default: 0,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);