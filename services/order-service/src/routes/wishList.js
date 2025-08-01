const express = require("express");
const router = express.Router();
const whishListController = require("../controllers/wishList");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  whishListController.addItemToWishlist
);

router.delete(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  whishListController.removeItemFromWishlist
);

router.get(
  "/byId/:wishlistId",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  whishListController.getWishlistById
);
router.get(
  "/byUser/:userId",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  whishListController.getWishlistByUserId
);

router.put(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "User"),
  whishListController.moveItemToCart
);






module.exports = router;
