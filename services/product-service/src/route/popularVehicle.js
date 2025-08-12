const express = require("express");
const router = express.Router();
const popularVehicleController = require("../controller/popularVehicle");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
router.post(
  "/",
  upload.single("vehicle_image"),
  authenticate,
  authorizeRoles("Super-admin"),
  popularVehicleController.createPopularVehicle
);

router.get("/", popularVehicleController.getAllPopularVehicles);

router.get("/:id", popularVehicleController.getPopularVehicleById);

router.put(
  "/:id",
  upload.single("vehicle_image"),
  authenticate,
  authorizeRoles("Super-admin"),
  popularVehicleController.updatePopularVehicle
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin"),
  popularVehicleController.deletePopularVehicle
);

module.exports = router;
