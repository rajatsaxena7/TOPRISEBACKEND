const Banner = require("../models/banner");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const { uploadFile } = require("/packages/utils/s3Helper");
const mongoose = require("mongoose");
exports.createBanner = async (req, res, next) => {
  try {
    const { title, brand_id, vehicle_type, is_active } = req.body;

    if (!title || !brand_id || !vehicle_type) {
      logger.error("Title, brand_id and vehicle_type are required");
      return sendError(
        res,
        "Title, brand_id and vehicle_type are required",
        400
      );
    }

    // Check if files are uploaded
    if (
      !req.files ||
      !req.files["web"] ||
      !req.files["mobile"] ||
      !req.files["tablet"]
    ) {
      logger.error("Web, mobile and tablet images are required");
      return sendError(res, "Web, mobile and tablet images are required", 400);
    }

    // Upload images to S3
    const webImage = req.files["web"][0];
    const mobileImage = req.files["mobile"][0];
    const tabletImage = req.files["tablet"][0];

    const [webUpload, mobileUpload, tabletUpload] = await Promise.all([
      uploadFile(
        webImage.buffer,
        webImage.originalname,
        webImage.mimetype,
        "banners"
      ),
      uploadFile(
        mobileImage.buffer,
        mobileImage.originalname,
        mobileImage.mimetype,
        "banners"
      ),
      uploadFile(
        tabletImage.buffer,
        tabletImage.originalname,
        tabletImage.mimetype,
        "banners"
      ),
    ]);

    // Create banner with image URLs
    const banner = new Banner({
      title,
      image: {
        web: webUpload.Location,
        mobile: mobileUpload.Location,
        tablet: tabletUpload.Location,
      },
      brand_id,
      vehicle_type,
      is_active: is_active || false,
    });

    await banner.save();
    logger.info("Banner created successfully");
    return sendSuccess(res, banner, "Banner created successfully");
  } catch (error) {
    logger.error("Error creating banner:", error);
    return sendError(res, error);
  }
};

// Get all banners
exports.getAllBanners = async (req, res, next) => {
  try {
    const { vehicle_type, is_active } = req.query;
    const filter = {};

    if (vehicle_type) {
      filter.vehicle_type = vehicle_type;
    }

    if (is_active !== undefined) {
      filter.is_active = is_active === "true";
    }

    const banners = await Banner.find(filter).populate("brand_id");

    logger.info("Banners fetched successfully");
    return sendSuccess(res, banners, "Banners fetched successfully");
  } catch (error) {
    logger.error("Error fetching banners:", error);
    return sendError(res, error);
  }
};

// Get banner by ID
exports.getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id).populate("brand_id");

    if (!banner) {
      logger.error("Banner not found");
      return sendError(res, "Banner not found", 404);
    }

    logger.info("Banner fetched successfully");
    return sendSuccess(res, banner, "Banner fetched successfully");
  } catch (error) {
    logger.error("Error fetching banner:", error);
    return sendError(res, error);
  }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, brand_id, vehicle_type, is_active } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      logger.error("Banner not found");
      return sendError(res, "Banner not found", 404);
    }

    const updates = {
      title: title || banner.title,
      brand_id: brand_id || banner.brand_id,
      vehicle_type: vehicle_type || banner.vehicle_type,
      is_active: is_active !== undefined ? is_active : banner.is_active,
    };

    if (req.files) {
      const imageUpdates = { ...banner.image };
      if (req.files["web"] && req.files["web"][0].buffer) {
        const webImage = req.files["web"][0];
        const webUpload = await uploadFile(
          webImage.buffer,
          webImage.originalname,
          webImage.mimetype,
          "banners"
        );
        imageUpdates.web = webUpload.Location;
      }

      if (req.files["mobile"] && req.files["mobile"][0].buffer) {
        const mobileImage = req.files["mobile"][0];
        const mobileUpload = await uploadFile(
          mobileImage.buffer,
          mobileImage.originalname,
          mobileImage.mimetype,
          "banners"
        );
        imageUpdates.mobile = mobileUpload.Location;
      }

      if (req.files["tablet"] && req.files["tablet"][0].buffer) {
        const tabletImage = req.files["tablet"][0];
        const tabletUpload = await uploadFile(
          tabletImage.buffer,
          tabletImage.originalname,
          tabletImage.mimetype,
          "banners"
        );
        imageUpdates.tablet = tabletUpload.Location;
      }

      updates.image = imageUpdates;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("brand_id");
    logger.info("Banner updated successfully");

    return sendSuccess(res, updatedBanner), "Banner updated successfully";
  } catch (error) {
    logger.error("Error updating banner:", error);
    return sendError(res, error);
  }
};

// Delete banner
exports.deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndDelete(id);

    if (!banner) {
      logger.error("Banner not found");
      return sendError(res, "Banner not found", 404);
    }

    logger.info("Banner deleted successfully");
    return sendSuccess(res, banner, "Banner deleted successfully");
  } catch (error) {
    logger.error("Error deleting banner:", error);
    return sendError(res, error);
  }
};

// Update is_active status
exports.updateBannerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      logger.error("is_active must be a boolean");
      return sendError(res, "is_active must be a boolean", 400);
    }

    const banner = await Banner.findByIdAndUpdate(
      id,
      { is_active },
      { new: true }
    ).populate("brand_id");

    if (!banner) {
      logger.error("Banner not found");
      return sendError(res, "Banner not found", 404);
    }

    logger.info("Banner status updated successfully");
    return sendSuccess(res, banner, "Banner status updated successfully");
  } catch (error) {
    logger.error("Error updating banner status:", error);
    return sendError(res, error);
  }
};

// Get random banners
exports.getRandomBanners = async (req, res, next) => {
  try {
    const { count, vehicle_type } = req.query;
    const limit = parseInt(count) || 3;
    let filter = {
      is_active: true,
    };
    if (limit <= 0) {
      logger.error("Count must be greater than 0");
      return sendError(res, "Count must be greater than 0", 400);
    }

    if (vehicle_type) {
      if (!mongoose.Types.ObjectId.isValid(vehicle_type)) {
        return sendError(res, "Invalid vehicle_type ObjectId", 400);
      }
      filter.vehicle_type = new mongoose.Types.ObjectId(vehicle_type);
    }

    const banners = await Banner.aggregate([
      { $match: filter },
      { $sample: { size: limit } },

      // populate brand
      {
        $lookup: {
          from: "brands",
          localField: "brand_id",
          foreignField: "_id",
          as: "brand_id",
        },
      },
      { $unwind: { path: "$brand_id", preserveNullAndEmptyArrays: true } },

      // populate vehicle_type (collection name is pluralized: "types")
      {
        $lookup: {
          from: "types",
          localField: "vehicle_type",
          foreignField: "_id",
          as: "vehicle_type",
        },
      },
      { $unwind: { path: "$vehicle_type", preserveNullAndEmptyArrays: true } },
    ]);

    logger.info("Random banners fetched successfully");
    return sendSuccess(res, banners, "Random banners fetched successfully");
  } catch (error) {
    logger.error("Error fetching random banners:", error);
    return sendError(res, error);
  }
};
