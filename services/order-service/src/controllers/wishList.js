const Wishlist = require('../models/wishList');
const Cart = require('../models/cart');
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const axios = require("axios");

const calculateCartTotals = async (items) => {
    let setting = await axios.get("http://user-service:5001/api/appSetting/");
    const totalPrice = items.reduce((acc, item) => acc + item.totalPrice * item.quantity, 0);
    const handlingCharge = 0;

    const gst_amount = items.reduce((acc, item) => acc + item.gst_amount, 0);
    const itemTotal = items.reduce((acc, item) => acc + item.product_total, 0);
    const total_mrp = items.reduce((acc, item) => acc + item.mrp, 0);
    const total_mrp_gst_amount = items.reduce((acc, item) => acc + item.mrp_gst_amount, 0);
    const total_mrp_with_gst = items.reduce((acc, item) => acc + item.total_mrp, 0);
    const deliveryCharge = itemTotal < setting.data.data.minimumOrderValue ? setting.data.data.deliveryCharge : 0;
    const grandTotal = totalPrice + handlingCharge + deliveryCharge;

    return { totalPrice, handlingCharge, deliveryCharge, gst_amount, itemTotal, total_mrp, total_mrp_gst_amount, total_mrp_with_gst, grandTotal };
};

const updateCartItemsPrice = async (items, token) => {
    let returnData = await Promise.all(items.map(async (item) => {
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
        item.product_image = productData.images.length > 0 ? productData.images : ["https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.svg?alt=media&token=454fba64-184a-4612-a5df-e473f964daa1"];
        item.product_name = productData.product_name;
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
exports.addItemToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                items: [{ productId }]
            });
            const updatedUser = await axios.put(`http://user-service:5001/api/users/update-wishlistId/${userId}`, {
                wishlistId: wishlist._id
            }, {
                headers: {
                    Authorization: req.headers.authorization
                }
            })
        } else {
            const itemExists = wishlist.items.some(item =>
                item.productId.toString() === productId
            );

            if (itemExists) {
                logger.info(`Product ${productId} already exists in wishlist for user ${userId}`);
                sendSuccess(res, wishlist, "Product already exists in wishlist");
            }
            wishlist.items.push({ productId });
        }

        await wishlist.save();
        logger.info(`Product ${productId} added to wishlist for user ${userId}`);
        sendSuccess(res, wishlist, "Product added to wishlist successfully");
    } catch (error) {
        logger.error(`Error adding product ${productId} to wishlist for user ${userId}: ${error.message}`);
        sendError(res, error);
    }
};

exports.removeItemFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            logger.warn(`Wishlist not found for user ${userId}`);
            sendError(res, "Wishlist not found", 404);
            return;
        }

        wishlist.items = wishlist.items.filter(
            item => item.productId.toString() !== productId
        );

        await wishlist.save();
        logger.info(`Product ${productId} removed from wishlist for user ${userId}`);
        sendSuccess(res, wishlist, "Product removed from wishlist successfully");
    } catch (error) {
        logger.error(`Error removing product ${productId} from wishlist for user ${userId}: ${error.message}`);
        sendError(res, error);
    }
};

exports.getWishlistById = async (req, res) => {
    const { wishlistId } = req.params;
    try {

        const wishlist = await Wishlist.findById(wishlistId);

        if (!wishlist) {
            logger.warn(`Wishlist not found for ID ${wishlistId}`);
            sendError(res, "Wishlist not found", 404);
            return;
        }
        const itemsWithProducts = await Promise.all(
            wishlist.items.map(async (item) => {
                try {
                    const response = await axios.get(
                        `http://product-service:5001/products/v1/get-ProductById/${item.productId}`,
                        {
                            headers: {
                                Authorization: req.headers.authorization
                            }
                        }
                    );

                    return {
                        ...item.toObject(),
                        productDetails: response.data.data // Adjust based on your API response structure
                    };
                } catch (error) {
                    logger.error(`Failed to fetch product ${item.productId}: ${error.message}`);
                    return {
                        ...item.toObject(),
                        productDetails: null,
                        error: 'Failed to fetch product details'
                    };
                }
            })
        );

        const result = {
            ...wishlist.toObject(),
            items: itemsWithProducts
        };

        logger.info(`Wishlist retrieved for ID ${wishlistId}`);
        sendSuccess(res, result, "Wishlist retrieved successfully");
    } catch (error) {
        logger.error(`Error retrieving wishlist for ID ${wishlistId}: ${error.message}`);
        sendError(res, error);
    }
};

exports.getWishlistByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            logger.warn(`Wishlist not found for user ${userId}`);
            sendError(res, "Wishlist not found", 404);
            return;
        }
        const itemsWithProducts = await Promise.all(
            wishlist.items.map(async (item) => {
                try {
                    const response = await axios.get(
                        `http://product-service:5001/products/v1/get-ProductById/${item.productId}`,
                        {
                            headers: {
                                Authorization: req.headers.authorization
                            }
                        }
                    );

                    return {
                        ...item.toObject(),
                        productDetails: response.data.data // Adjust based on your API response structure
                    };
                } catch (error) {
                    logger.error(`Failed to fetch product ${item.productId}: ${error.message}`);
                    return {
                        ...item.toObject(),
                        productDetails: null,
                        error: 'Failed to fetch product details'
                    };
                }
            })
        );

        const result = {
            ...wishlist.toObject(),
            items: itemsWithProducts
        };

        logger.info(`Wishlist retrieved for user ${userId}`);
        sendSuccess(res, result, "Wishlist retrieved successfully");
    } catch (error) {
        logger.error(`Error retrieving wishlist for user ${userId}: ${error.message}`);
        sendError(res, error);
    }
};

exports.moveItemToCart = async (req, res) => {
    const { userId, productId } = req.body;
    try {



        const wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            logger.warn(`Wishlist not found for user ${userId}`);
            sendError(res, "Wishlist not found", 404);
            return;
        }

        const itemIndex = wishlist.items.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            logger.warn(`Product ${productId} not found in wishlist for user ${userId}`);
            sendError(res, "Product not found in wishlist", 404);
            return;
        }


        const [item] = wishlist.items.splice(itemIndex, 1);
        await wishlist.save();

        const product = await axios.get(`http://product-service:5001/products/v1/get-ProductById/${item.productId}`, {
            headers: {
                Authorization: req.headers.authorization
            }
        });
        if (!product) {
            logger.error(`❌ Product not found for product: ${productId}`);
            sendError(res, "Product not found", 404);
        }
        const productData = product.data.data;

        const quantity = 1;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId, items: [{
                    productId,
                    product_image: productData.images.length > 0 ? productData.images : ["https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.svg?alt=media&token=454fba64-184a-4612-a5df-e473f964daa1"],
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
                    product_image: productData.images.length > 0 ? productData.images : ["https://firebasestorage.googleapis.com/v0/b/lmseducationplaform.appspot.com/o/Media%201.svg?alt=media&token=454fba64-184a-4612-a5df-e473f964daa1"],
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
        const totals = await calculateCartTotals(cart.items);
        Object.assign(cart, totals);

        const savedCart = await cart.save();

        // Add the item to the cart
        // const CartResponse = await axios.post(`http://localhost:5003/api/cart/add`, {
        //     userId,
        //     productId: item.productId
        // });
        // const cart = CartResponse.data.data;
        logger.info(`Product ${productId} moved from wishlist to cart for user ${userId}`);
        sendSuccess(res, savedCart, "Product moved to cart successfully");
    } catch (error) {
        console.error(error);
        logger.error(`Error moving product ${productId} from wishlist to cart for user ${userId}: ${error.message}`);
        sendError(res, error);
    }
}