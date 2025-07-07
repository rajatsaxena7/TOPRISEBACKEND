const Year = require("../models/year");
const {
  sendSuccess,
  sendError,
} = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

// ✅ Create a Year
exports.createYear = async (req, res) => {
  try {
    const { year_name, created_by, updated_by } = req.body;

    const existingYear = await Year.findOne({ year_name });
    if (existingYear) return sendError(res, "Year already exists", 400);

    const year = await Year.create({
      year_name,
      created_by,
      updated_by,
    });

    logger.info(`✅ Year created: ${year_name}`);
    return sendSuccess(res, year, "Year created successfully");
  } catch (err) {
    logger.error(`❌ Create year error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Get All Years
exports.getAllYears = async (req, res) => {
  try {
    const years = await Year.find().sort({ created_at: -1 });
    logger.info("✅ Retrieved all years");
    return sendSuccess(res, years);
  } catch (err) {
    logger.error(`❌ Get all years error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Get Year by ID
exports.getYearById = async (req, res) => {
  try {
    const { yearId } = req.params;
    const year = await Year.findById(yearId);

    if (!year) return sendError(res, "Year not found", 404);

    logger.info(`✅ Retrieved year by ID: ${yearId}`);
    return sendSuccess(res, year);
  } catch (err) {
    logger.error(`❌ Get year by ID error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Update Year
exports.updateYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const { year_name, updated_by } = req.body;

    const updatedYear = await Year.findByIdAndUpdate(
      yearId,
      {
        year_name,
        updated_by,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedYear) return sendError(res, "Year not found", 404);

    logger.info(`✅ Updated year: ${yearId}`);
    return sendSuccess(res, updatedYear, "Year updated successfully");
  } catch (err) {
    logger.error(`❌ Update year error: ${err.message}`);
    return sendError(res, err);
  }
};

// ✅ Delete Year
exports.deleteYear = async (req, res) => {
  try {
    const { yearId } = req.params;

    const deleted = await Year.findByIdAndDelete(yearId);
    if (!deleted) return sendError(res, "Year not found", 404);

    logger.info(`🗑️ Deleted year: ${yearId}`);
    return sendSuccess(res, null, "Year deleted successfully");
  } catch (err) {
    logger.error(`❌ Delete year error: ${err.message}`);
    return sendError(res, err);
  }
};
