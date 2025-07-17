const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart");

const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");


router.post(
  "/addProduct",
  // authenticate,
  cartController.addToCart
);

router.put(
  "/update",
  // authenticate,
  cartController.updateQuantity
);

router.post(
  "/removeProduct",
  // authenticate,
  cartController.removeProduct
);

router.get(
  "/getCart/:userId",
  // authenticate,
  cartController.getCart
);


module.exports = router;

