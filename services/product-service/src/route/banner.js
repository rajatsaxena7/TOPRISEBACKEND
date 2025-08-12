const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
  authenticate,
  authorizeRoles,
} = require("/packages/utils/authMiddleware");
const storage = multer.memoryStorage();
// const upload = multer({ storage });

const bannerController = require("../controller/banner");
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as buffers
  limits: { fileSize: 500 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ErrorHandler(400, "Only JPEG, PNG, and WebP images are allowed"),
        false
      );
    }
  },
});

router.post(
  "/",
  upload.fields([
    { name: "web", maxCount: 1 },
    { name: "mobile", maxCount: 1 },
    { name: "tablet", maxCount: 1 },
  ]),
  authenticate,
  authorizeRoles("Super-admin"),
  bannerController.createBanner
);
router.put(
  "/:id",
  upload.fields([
    { name: "web", maxCount: 1 },
    { name: "mobile", maxCount: 1 },
    { name: "tablet", maxCount: 1 },
  ]),
  authenticate,
  authorizeRoles("Super-admin"),
  bannerController.updateBanner
);
router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("Super-admin"),
  bannerController.deleteBanner
);
router.put(
  "/updateStatus/:id",
  authenticate,
  authorizeRoles("Super-admin"),
  bannerController.updateBannerStatus
);
router.get("/get/randomBanners", bannerController.getRandomBanners);

module.exports = router;
