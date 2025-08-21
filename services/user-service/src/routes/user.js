const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const userController = require("../controllers/user");
const dealerStatsController = require("../controllers/dealerStats");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const { auth } = require("firebase-admin");
router.get(
  "/getemployees",
  // authenticate,
  // authorizeRoles("User", "Dealer", "Fulfillment-Admin", "Inventory-Admin"),
  userController.getAllEmployees
);

router.get("/stats", userController.getUserStats);
router.get("/insights", userController.getUserInsights);
router.get("/employee/get-by-id", userController.getEmployeeById);
router.get(
  "/employee/stats",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
  userController.getEmployeeStats
);

router.get(
  "/dealer/stats",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
  dealerStatsController.getDealerStats
);

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
  // authenticate,
  // authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getDealerById
);
router.get("/allUsers/internal", userController.getAllUsers);
router.get(
  "/",
  authenticate,
  authorizeRoles(
    "Super-admin",
    "Fulfillment-Admin",
    "Fulfillment-Staff",
    "Inventory-Admin",
    "Inventory-Staff",
    "Dealer",
    "User",
    "Customer-Support"
  ),
  userController.getAllUsers
);
router.get(
  "/:id",
  // authenticate,
  // authorizeRoles("Super-admin", "Fulfillment-Admin", "User"),
  userController.getUserById
);

router.get(
  "/employee/:employeeId",
  authenticate,
  authorizeRoles("Super-admin"),
  userController.getEmployeeDetails
);
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

router.patch(
  "/disable-dealer/:dealerId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.disableDealer
);

router.post(
  "/create-Employee",
  authenticate,
  authorizeRoles("Super-admin"),
  userController.createEmployee
);

router.post(
  "/dealers/bulk",
  upload.single("file"),
  userController.createDealersBulk
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
  // authenticate,
  // authorizeRoles("User"),
  userController.updateUserCartId
);

router.post("/:userId/vehicles", userController.addVehicleDetails); // /users/:userId/vehicles
router.put("/:userId/vehicles/:vehicleId", userController.editVehicleDetails); // /users/:userId/vehicles/:vehicleId
router.delete(
  "/:userId/vehicles/:vehicleId",
  userController.deleteVehicleDetails
); // /users/:userId/vehicles/:vehicleId
router.put("/update-fcmToken/:userId", userController.updateFCMToken);
router.put(
  "/assign-support/:ticketId/:supportId",
  userController.assignTicketToSupport
);
router.put(
  "/remove-support/:ticketId/:supportId",
  userController.removeTicketFromSupport
);

router.put(
  "/update-wishlistId/:userId",
  authenticate,
  authorizeRoles("User", "Super-admin"),
  userController.updateWhislistId
);

router.patch(
  "/enable-dealer/:dealerId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.enableDealer
);

router.get(
  "/get/dealer-for-assign/:productId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getDealersByAllowedCategory
);

router.get(
  "/get/userBy/Email/:email",
  authenticate,
  // authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getUserByEmail
);

router.patch(
  "/updateDealer/addAllowedCategores/:dealerId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.addAllowedCategories
);

router.patch(
  "/updateDealer/removeAllowedCategores/:dealerId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.removeAllowedCategories
);

// Bank Details Routes
router.post(
  "/:userId/bank-details",
  authenticate,
  authorizeRoles("User", "Super-admin"),
  userController.addBankDetails
);

router.put(
  "/:userId/bank-details",
  authenticate,
  authorizeRoles("User", "Super-admin"),
  userController.updateBankDetails
);

router.get(
  "/:userId/bank-details",
  authenticate,
  authorizeRoles("User", "Super-admin"),
  userController.getBankDetails
);

router.delete(
  "/:userId/bank-details",
  authenticate,
  authorizeRoles("User", "Super-admin"),
  userController.deleteBankDetails
);

router.get("/validate-ifsc", userController.validateIFSC);

router.get(
  "/bank-details/account/:account_number",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getBankDetailsByAccountNumber
);

// Employee Assignment Routes
router.post(
  "/dealers/:dealerId/assign-employees",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.assignEmployeesToDealer
);

router.delete(
  "/dealers/:dealerId/remove-employees",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.removeEmployeesFromDealer
);

router.get(
  "/dealers/:dealerId/assigned-employees",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Dealer"),
  userController.getDealerAssignedEmployees
);

router.put(
  "/dealers/:dealerId/assignments/:assignmentId/status",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.updateEmployeeAssignmentStatus
);

router.get(
  "/employees/:employeeId/dealer-assignments",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.getEmployeesAssignedToMultipleDealers
);

router.post(
  "/dealers/bulk-assign-employees",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  userController.bulkAssignEmployeesToDealers
);

router.get(
  "/all/users",
  authenticate,
  authorizeRoles(
    "Super-admin",
    "Fulfillment-Admin",
    "Fulfillment-Staff",
    "Inventory-Admin",
    "Inventory-Staff",
    "Dealer",
    "User",
    "Customer-Support"
  ),
  userController.getAllUsers
);

router.get(
  "/user/stats/userCounts",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin", "Inventory-Admin"),
  userController.getUserStats
)

module.exports = router;
