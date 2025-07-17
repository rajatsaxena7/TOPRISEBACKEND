const Cart = require("../models/cart");

const {
    cacheGet,
    cacheSet,
    cacheDel, // ⬅️ writer-side “del” helper
} = require("/packages/utils/cache");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const Redis = require("redis");
const axios = require("axios");
const redisClient = require("/packages/utils/redisClient");




const calculateCartTotals = (items) => {
    const totalPrice = items.reduce((acc, item) => acc + item.selling_price * item.quantity, 0);
    const handlingCharge = totalPrice > 1000 ? 0 : 50;
    const deliveryCharge = totalPrice > 500 ? 0 : 40;

    const grandTotal = totalPrice + handlingCharge + deliveryCharge;

    return { totalPrice, handlingCharge, deliveryCharge, grandTotal };
};

const updateCartItemsPrice = (items) => {
    return items.map(item => {
        const product = axios.get(`http://product-service:5001/api/v1/products/${item.productId}`);
        if (!product) {
            sendError(res, "Product not found", 404);
            return
        }
        const productData = product.data;
        item.selling_price = productData.selling_price;
        item.mrp_with_gst = productData.mrp_with_gst;
        item.sku = productData.sku;
        return item;
    });
}

async function getOrSetCache(key, callback, ttl) {
    try {
        const cachedData = await cacheGet(key);

        if (cachedData !== null) {
            return cachedData;
        }

        const freshData = await callback();

        await cacheSet(key, freshData, ttl);
        return freshData;
    } catch (err) {
        console.warn(`getOrSetCache failed for key ${key}: ${err.message}`);
        return callback();
    }
}


exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity = 1 } = req.body;
        console.log("api called");
        const product = await axios.get(`http://product-service:5001/products/v1/get-ProductById/${productId}`);
        console.log("product", product);
        if (!product) {
            logger.error(`❌ Product not found for product: ${productId}`);
            sendError(res, "Product not found", 404);
            return
        }
        const productData = product.data.data;
        // const  userData = await axios.get(`http://user-service:5001/api/v1/users/${userId}`);
        // if (!userData) {
        //     logger.error(`❌ User not found for user: ${userId}`);
        //     sendError(res, "User not found", 404);
        //     return
        // }
        // const userDataData = userData.data;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [{ productId, quantity, selling_price: productData.selling_price, mrp_with_gst: productData.mrp_with_gst, sku: productData.sku }] });
            // cart = new Cart({ userId, items: [{ productId, quantity, selling_price: 100, mrp_with_gst: 200, sku: 'ABCDE' }] });
           

        } else {
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({ productId, quantity, selling_price: productData.selling_price, mrp_with_gst: productData.mrp_with_gst, sku: productData.sku });
            }
        }

        const totals = calculateCartTotals(cart.items);
        Object.assign(cart, totals);

        const savedCart = await cart.save();
        logger.info(`✅ Product added to cart for user: ${userId}`);
        cacheDel(`cart:${userId}`);
        return sendSuccess(res, savedCart, "Product added to cart successfully");
    } catch (err) {
        logger.error(`❌ Add to cart error: ${err}`);
        return sendError(res, err);
    }
};

exports.removeProduct = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        const totals = calculateCartTotals(cart.items);
        Object.assign(cart, totals);
        await cart.save();

        logger.info(`✅ Product removed from cart for user: ${userId}`);
        cacheDel(`cart:${userId}`);
        return sendSuccess(res, cart, "Product removed from cart successfully");
    } catch (err) {
        logger.error(`❌ Remove from cart error: ${err}`);
        return sendError(res, err);
    }
};

exports.updateQuantity = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const { action } = req.query;

        if (!["increase", "decrease"].includes(action)) {
            return res.status(400).json({ message: "Invalid action. Use 'increase' or 'decrease'" });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        if (action === "increase") {
            cart.items[itemIndex].quantity += 1;
        } else if (action === "decrease") {
            if (cart.items[itemIndex].quantity > 1) {
                cart.items[itemIndex].quantity -= 1;
            } else {
                // Optionally remove if quantity is 1 and decreasing
                cart.items.splice(itemIndex, 1);
            }
        }

        const totals = calculateCartTotals(cart.items);
        Object.assign(cart, totals);

        await cart.save();
        if (action === "decrease") {
            logger.info(`✅ Product quantity decreased for user: ${userId}`);
        } else {
            logger.info(`✅ Product quantity increased for user: ${userId}`);
        }
        cacheDel(`cart:${userId}`);
        sendSuccess(res, cart, "Product quantity updated successfully");

    } catch (err) {
        logger.error(`❌ Update quantity error: ${err}`);
        sendError(res, err);
    }
};

exports.getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const cart = await getOrSetCache(`cart:${userId}`, async () => {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                logger.error(`❌ Cart not found for user: ${userId}`);
                return res.status(404).json({ message: "Cart not found" });
            }
            return cart
        })
        logger.info(`✅ Cart fetched for user: ${userId}`);
        sendSuccess(res, cart, "Cart fetched successfully");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}