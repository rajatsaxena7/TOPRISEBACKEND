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
    const totalPrice = items.reduce((acc, item) => acc + item.totalPrice * item.quantity, 0);
    const handlingCharge = 0;
    const deliveryCharge = 40;
    const gst_amount = items.reduce((acc, item) => acc + item.gst_amount, 0);
    const itemTotal = items.reduce((acc, item) => acc + item.product_total, 0);
    const total_mrp = items.reduce((acc, item) => acc + item.mrp, 0);
    const total_mrp_gst_amount = items.reduce((acc, item) => acc + item.mrp_gst_amount, 0);
    const total_mrp_with_gst = items.reduce((acc, item) => acc + item.total_mrp, 0);
    const grandTotal = totalPrice + handlingCharge + deliveryCharge;

    return { totalPrice, handlingCharge, deliveryCharge, gst_amount, itemTotal, total_mrp, total_mrp_gst_amount, total_mrp_with_gst, grandTotal };
};

const updateCartItemsPrice = async (items, token) => {
    let returnData= await Promise.all(items.map(async (item) => {
        const product = await axios.get(`http://product-service:5001/products/v1/get-ProductById/${item.productId}`, {
            headers: {
                Authorization: token
            }
        });
        if (!product) {
            logger.error(`❌ Product not found for product: ${item.productId}`);
            return null;
        }
        const productData = product.data.data;
        item.selling_price = productData.selling_price;
        item.mrp = productData.mrp_with_gst * item.quantity;
        item.mrp_gst_amount = ((productData.mrp_with_gst / 100) * productData.gst_percentage) * item.quantity;
        item.total_mrp = (productData.mrp_with_gst + ((productData.mrp_with_gst / 100) * productData.gst_percentage)) * item.quantity;
        item.sku = productData.sku_code;
        item.gst_amount = ((productData.selling_price / 100) * productData.gst_percentage) * item.quantity;
        item.product_total = productData.selling_price * item.quantity;
        item.totalPrice = (productData.selling_price + ((productData.selling_price / 100) * productData.gst_percentage)) * item.quantity;
        return item;
    }));
    returnData = returnData.filter((item) => item !== null);
    return returnData;
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
        const product = await axios.get(`http://product-service:5001/products/v1/get-ProductById/${productId}`, {
            headers: {
                Authorization: req.headers.authorization
            }
        });
        if (!product) {
            logger.error(`❌ Product not found for product: ${productId}`);
            sendError(res, "Product not found", 404);
        }
        const productData = product.data.data;



        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId, items: [{
                    productId,
                    product_image: productData.images,
                    product_name: productData.product_name,
                    quantity,
                    gst_percentage: productData.gst_percentage.toString(),
                    selling_price: productData.selling_price,
                    mrp: productData.mrp_with_gst,
                    mrp_gst_amount: ((productData.mrp_with_gst / 100) * productData.gst_percentage),
                    total_mrp: productData.mrp_with_gst + ((productData.mrp_with_gst / 100) * productData.gst_percentage),
                    sku: productData.sku_code,
                    gst_amount: ((productData.selling_price / 100) * productData.gst_percentage) * quantity,
                    product_total: productData.selling_price * quantity,
                    totalPrice: (productData.selling_price + ((productData.selling_price / 100) * productData.gst_percentage)) * quantity,
                }]
            });

            const updatedUser = await axios.put(`http://user-service:5001/api/users/update-cartId/${userId}`, {
                cartId: cart._id
            }, {
                headers: {
                    Authorization: req.headers.authorization
                }
            })
            // cart = new Cart({ userId, items: [{ productId, quantity, selling_price: 100, mrp_with_gst: 200, sku: 'ABCDE' }] });


        } else {
            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += quantity;
            } else {
                cart.items.push({
                    productId,
                    product_image: productData.images,
                    product_name: productData.product_name,
                    quantity,
                    gst_percentage: productData.gst_percentage.toString(),
                    selling_price: productData.selling_price,
                    mrp: productData.mrp_with_gst,
                    mrp_gst_amount: ((productData.mrp_with_gst / 100) * productData.gst_percentage),
                    total_mrp: productData.mrp_with_gst + ((productData.mrp_with_gst / 100) * productData.gst_percentage),
                    sku: productData.sku_code,
                    gst_amount: ((productData.selling_price / 100) * productData.gst_percentage) * quantity,
                    product_total: productData.selling_price * quantity,
                    totalPrice: (productData.selling_price + ((productData.selling_price / 100) * productData.gst_percentage)) * quantity,
                });
            }
        }

        await cart.save();
        cart.items = await updateCartItemsPrice(cart.items, req.headers.authorization);
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
        cart.items = await updateCartItemsPrice(cart.items, req.headers.authorization);
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
        cart.items = await updateCartItemsPrice(cart.items, req.headers.authorization);
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
        // const cart = await getOrSetCache(`cart:${userId}`, async () => {
        //     const cart = await Cart.findOne({ userId });
        //     if (!cart) {
        //         logger.error(`❌ Cart not found for user: ${userId}`);
        //         return res.status(404).json({ message: "Cart not found" });
        //     }
        //     return cart
        // })

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            logger.error(`❌ Cart not found for user: ${userId}`);
            return res.status(404).json({ message: "Cart not found" });
        }
        cart.items = await updateCartItemsPrice(cart.items, req.headers.authorization);
        const totals = calculateCartTotals(cart.items);
        Object.assign(cart, totals);
        const savedCart = await cart.save();
        logger.info(`✅ Cart fetched for user: ${userId}`);
        sendSuccess(res, savedCart, "Cart fetched successfully");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

exports.getCartById = async (req, res) => {
    try {
        const { id } = req.params;
        const cart = await Cart.findById(id);
        if (!cart) {
            logger.error(`❌ cart not found for id: ${id}`);
            return res.status(404).json({ message: "Cart not found" });
        }
        cart.items = await updateCartItemsPrice(cart.items, req.headers.authorization);
        const totals = calculateCartTotals(cart.items);
        Object.assign(cart, totals);
        const savedCart = await cart.save();
        logger.info(`✅ Cart fetched for id: ${id}`);
        sendSuccess(res, savedCart, "Cart fetched successfully");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}