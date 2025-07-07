const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

const modelController = require("../controller/model");

const upload = multer(); // You can use multer S3 config here

router.post(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.single("model_image"),
  modelController.createModel
);
router.get("/", modelController.getAllModel);
router.get("/brand/:brandId", modelController.getModelByBrands);
router.put(
  "/:modelId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  upload.single("model_image"),
  modelController.updateModel
);
router.delete(
  "/:modelId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  modelController.deleteModel
);

module.exports = router;
