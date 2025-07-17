const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

// Authentication Routes
router.post("/signup", userController.signupUser);
router.post("/createUser", userController.createUser);
router.post("/login", userController.loginUserForMobile);
router.post("/loginWeb", userController.loginUserForDashboard);

router.post("/check-user", userController.checkUserAccountCreated);

router.get(
  "/dealers",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getAllDealers
);

// User CRUD Routes
router.get(
  "/dealer/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getDealerById
);
router.get(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getAllUsers
);
router.get("/:id", authenticate, userController.getUserById);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin"),
  userController.deleteUser
);

router.put(
  "/revoke-role/:id",
  authenticate,
  authorizeRoles("Super-admin"),
  userController.revokeRole
);

// Dealer Routes
router.post(
  "/dealer",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.createDealer
);

router.post("/map-categories/", userController.mapCategoriesToUser);

router.put(
  "/updateAddress/:id",
  authenticate,
  authorizeRoles("User"),
  userController.updateUserAddress
);

router.put(
  "/dealer/:id",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.updateDealer
);

router.put(
  "/address/:userId",
  authenticate,
  authorizeRoles("User"),
  userController.editUserAddress
);
router.delete(
  "/address/:userId",
  authenticate,
  authorizeRoles("User"),
  userController.deleteUserAddress
);
router.put(
  "/profile/:userId",
  authenticate,
  authorizeRoles("User"),
  userController.updateEmailOrName
);

router.put(
  "/update-cartId/:userId",
  authenticate,
  authorizeRoles("User"),
  userController.updateUserCartId
);

module.exports = router;
