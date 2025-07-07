const express = require("express");
const router = express.Router();
const yearController = require("../controller/year");
const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
  "/",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  yearController.createYear
);
router.get("/", yearController.getAllYears);
router.get("/:yearId", yearController.getYearById);
router.put(
  "/:yearId",
  authenticate,
  authorizeRoles("Super-admin", "Fulfillment-Admin"),
  yearController.updateYear
);
router.delete("/:yearId", yearController.deleteYear);

module.exports = router;
