const Pincode = require("../models/pincode");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");
const XLSX = require("xlsx");
const csv = require("csv-parser");
const { Readable } = require("stream");

/**
 * Bulk upload pincodes from CSV file
 * @route POST /api/pincodes/bulk-upload
 * @access Super-admin, Fulfillment-Admin
 */
exports.bulkUploadPincodes = async (req, res) => {
    try {
        if (!req.file) {
            logger.error("No file uploaded");
            return sendError(res, "CSV file is required", 400);
        }

        const { created_by } = req.body;

        if (!created_by) {
            logger.error("created_by field is required");
            return sendError(res, "created_by field is required", 400);
        }

        logger.info(`Starting bulk pincode upload by user: ${created_by}`);

        // Parse CSV file
        const fileBuffer = req.file.buffer;
        const fileString = fileBuffer.toString("utf8");

        const results = [];
        const errors = [];
        const duplicates = [];
        const successfulUploads = [];

        // Parse CSV using a promise
        await new Promise((resolve, reject) => {
            const stream = Readable.from(fileString);

            stream
                .pipe(csv())
                .on("data", (row) => {
                    results.push(row);
                })
                .on("end", resolve)
                .on("error", reject);
        });

        logger.info(`Parsed ${results.length} rows from CSV`);

        // Validate and process each row
        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNumber = i + 2; // +2 because row 1 is header, and array is 0-indexed

            try {
                // Extract and validate required fields
                const pincode = row.pincode?.trim();
                const city = row.city?.trim();
                const state = row.state?.trim();

                if (!pincode || !city || !state) {
                    errors.push({
                        row: rowNumber,
                        pincode: pincode || "N/A",
                        error: "Missing required fields (pincode, city, or state)",
                        data: row,
                    });
                    continue;
                }

                // Validate pincode format (6 digits for India)
                if (!/^\d{6}$/.test(pincode)) {
                    errors.push({
                        row: rowNumber,
                        pincode: pincode,
                        error: "Invalid pincode format. Must be 6 digits.",
                        data: row,
                    });
                    continue;
                }

                // Check for duplicate in database
                const existingPincode = await Pincode.findOne({ pincode: pincode });
                if (existingPincode) {
                    duplicates.push({
                        row: rowNumber,
                        pincode: pincode,
                        city: city,
                        state: state,
                        message: "Pincode already exists in database",
                        existingData: {
                            city: existingPincode.city,
                            state: existingPincode.state,
                        },
                    });
                    continue;
                }

                // Prepare pincode data
                const pincodeData = {
                    pincode: pincode,
                    city: city,
                    state: state,
                    district: row.district?.trim() || "",
                    region: row.region?.trim() || "",
                    country: row.country?.trim() || "India",
                    is_serviceable: row.is_serviceable === "true" || row.is_serviceable === "1" || row.is_serviceable === true || true,
                    delivery_zone: row.delivery_zone?.trim() || "Zone-A",
                    estimated_delivery_days: parseInt(row.estimated_delivery_days) || 7,
                    additional_charges: parseFloat(row.additional_charges) || 0,
                    coordinates: {
                        latitude: parseFloat(row.latitude) || null,
                        longitude: parseFloat(row.longitude) || null,
                    },
                    created_by: created_by,
                    updated_by: created_by,
                    remarks: row.remarks?.trim() || "",
                };

                // Validate delivery_zone enum
                const validZones = ["Zone-A", "Zone-B", "Zone-C", "Zone-D"];
                if (!validZones.includes(pincodeData.delivery_zone)) {
                    pincodeData.delivery_zone = "Zone-A";
                }

                // Create pincode
                const newPincode = await Pincode.create(pincodeData);
                successfulUploads.push({
                    row: rowNumber,
                    pincode: newPincode.pincode,
                    city: newPincode.city,
                    state: newPincode.state,
                    _id: newPincode._id,
                });

                logger.debug(`Created pincode: ${pincode} - ${city}, ${state}`);
            } catch (error) {
                // Handle database errors (e.g., duplicate key)
                if (error.code === 11000) {
                    duplicates.push({
                        row: rowNumber,
                        pincode: row.pincode,
                        error: "Duplicate pincode in database",
                    });
                } else {
                    errors.push({
                        row: rowNumber,
                        pincode: row.pincode || "N/A",
                        error: error.message,
                        data: row,
                    });
                }
            }
        }

        // Prepare summary
        const summary = {
            total_rows: results.length,
            successful: successfulUploads.length,
            duplicates: duplicates.length,
            errors: errors.length,
            success_rate: ((successfulUploads.length / results.length) * 100).toFixed(2) + "%",
        };

        logger.info(
            `Bulk upload completed: ${successfulUploads.length} successful, ${duplicates.length} duplicates, ${errors.length} errors`
        );

        return sendSuccess(
            res,
            {
                summary: summary,
                successful_uploads: successfulUploads,
                duplicates: duplicates,
                errors: errors,
            },
            "Bulk pincode upload completed"
        );
    } catch (error) {
        logger.error(`Bulk pincode upload error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get all pincodes with pagination and filters
 * @route GET /api/pincodes
 * @access Super-admin, Fulfillment-Admin, User
 */
exports.getAllPincodes = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const {
            search,
            state,
            city,
            is_serviceable,
            delivery_zone,
        } = req.query;

        // Build filter
        const filter = {};

        if (search) {
            filter.$or = [
                { pincode: new RegExp(search, "i") },
                { city: new RegExp(search, "i") },
                { state: new RegExp(search, "i") },
                { district: new RegExp(search, "i") },
            ];
        }

        if (state) filter.state = new RegExp(state, "i");
        if (city) filter.city = new RegExp(city, "i");
        if (is_serviceable !== undefined) filter.is_serviceable = is_serviceable === "true";
        if (delivery_zone) filter.delivery_zone = delivery_zone;

        const totalPincodes = await Pincode.countDocuments(filter);

        const pincodes = await Pincode.find(filter)
            .sort({ pincode: 1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalPincodes / limit);

        logger.info(`Fetched ${pincodes.length} pincodes`);
        return sendSuccess(res, {
            data: pincodes,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalPincodes,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
            filters: {
                search,
                state,
                city,
                is_serviceable,
                delivery_zone,
            },
        });
    } catch (error) {
        logger.error(`Get pincodes error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get pincode by pincode number
 * @route GET /api/pincodes/:pincode
 * @access Public
 */
exports.getPincodeByNumber = async (req, res) => {
    try {
        const { pincode } = req.params;

        const pincodeData = await Pincode.findOne({ pincode: pincode });

        if (!pincodeData) {
            logger.warn(`Pincode not found: ${pincode}`);
            return sendError(res, "Pincode not found", 404);
        }

        logger.info(`Fetched pincode: ${pincode}`);
        return sendSuccess(res, pincodeData);
    } catch (error) {
        logger.error(`Get pincode error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Check if pincode is serviceable
 * @route GET /api/pincodes/check/:pincode
 * @access Public
 */
exports.checkPincodeServiceability = async (req, res) => {
    try {
        const { pincode } = req.params;

        const pincodeData = await Pincode.findOne({ pincode: pincode });

        if (!pincodeData) {
            logger.warn(`Pincode not found: ${pincode}`);
            return sendSuccess(
                res,
                {
                    pincode: pincode,
                    is_serviceable: false,
                    message: "Pincode not found in our service area",
                },
                "Pincode check completed"
            );
        }

        const serviceabilityInfo = {
            pincode: pincodeData.pincode,
            city: pincodeData.city,
            state: pincodeData.state,
            district: pincodeData.district,
            is_serviceable: pincodeData.is_serviceable,
            delivery_zone: pincodeData.delivery_zone,
            estimated_delivery_days: pincodeData.estimated_delivery_days,
            additional_charges: pincodeData.additional_charges,
        };

        logger.info(`Pincode serviceability checked: ${pincode}`);
        return sendSuccess(res, serviceabilityInfo);
    } catch (error) {
        logger.error(`Check pincode serviceability error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Create single pincode
 * @route POST /api/pincodes
 * @access Super-admin, Fulfillment-Admin
 */
exports.createPincode = async (req, res) => {
    try {
        const {
            pincode,
            city,
            state,
            district,
            region,
            country,
            is_serviceable,
            delivery_zone,
            estimated_delivery_days,
            additional_charges,
            latitude,
            longitude,
            created_by,
            remarks,
        } = req.body;

        // Validate required fields
        if (!pincode || !city || !state) {
            return sendError(res, "Pincode, city, and state are required", 400);
        }

        // Validate pincode format
        if (!/^\d{6}$/.test(pincode)) {
            return sendError(res, "Invalid pincode format. Must be 6 digits.", 400);
        }

        // Check for duplicate
        const existingPincode = await Pincode.findOne({ pincode: pincode });
        if (existingPincode) {
            logger.warn(`Duplicate pincode attempted: ${pincode}`);
            return sendError(res, `Pincode "${pincode}" already exists`, 409);
        }

        const newPincode = await Pincode.create({
            pincode,
            city,
            state,
            district,
            region,
            country: country || "India",
            is_serviceable: is_serviceable !== undefined ? is_serviceable : true,
            delivery_zone: delivery_zone || "Zone-A",
            estimated_delivery_days: estimated_delivery_days || 7,
            additional_charges: additional_charges || 0,
            coordinates: {
                latitude: latitude || null,
                longitude: longitude || null,
            },
            created_by,
            updated_by: created_by,
            remarks,
        });

        logger.info(`Pincode created: ${pincode} - ${city}, ${state}`);
        return sendSuccess(res, newPincode, "Pincode created successfully");
    } catch (error) {
        logger.error(`Create pincode error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Update pincode
 * @route PUT /api/pincodes/:id
 * @access Super-admin, Fulfillment-Admin
 */
exports.updatePincode = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body, updated_at: new Date() };

        const updatedPincode = await Pincode.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedPincode) {
            logger.warn(`Pincode not found: ${id}`);
            return sendError(res, "Pincode not found", 404);
        }

        logger.info(`Pincode updated: ${updatedPincode.pincode}`);
        return sendSuccess(res, updatedPincode, "Pincode updated successfully");
    } catch (error) {
        logger.error(`Update pincode error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Delete pincode
 * @route DELETE /api/pincodes/:id
 * @access Super-admin
 */
exports.deletePincode = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPincode = await Pincode.findByIdAndDelete(id);

        if (!deletedPincode) {
            logger.warn(`Pincode not found: ${id}`);
            return sendError(res, "Pincode not found", 404);
        }

        logger.info(`Pincode deleted: ${deletedPincode.pincode}`);
        return sendSuccess(res, null, "Pincode deleted successfully");
    } catch (error) {
        logger.error(`Delete pincode error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get pincode statistics
 * @route GET /api/pincodes/stats
 * @access Super-admin, Fulfillment-Admin
 */
exports.getPincodeStats = async (req, res) => {
    try {
        const totalPincodes = await Pincode.countDocuments();
        const serviceablePincodes = await Pincode.countDocuments({ is_serviceable: true });
        const nonServiceablePincodes = await Pincode.countDocuments({ is_serviceable: false });

        // Get state-wise breakdown
        const stateBreakdown = await Pincode.aggregate([
            {
                $group: {
                    _id: "$state",
                    count: { $sum: 1 },
                    serviceable: {
                        $sum: { $cond: ["$is_serviceable", 1, 0] },
                    },
                },
            },
            {
                $sort: { count: -1 },
            },
        ]);

        // Get zone-wise breakdown
        const zoneBreakdown = await Pincode.aggregate([
            {
                $group: {
                    _id: "$delivery_zone",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);

        // Get average delivery days
        const avgDeliveryDays = await Pincode.aggregate([
            {
                $group: {
                    _id: null,
                    avgDays: { $avg: "$estimated_delivery_days" },
                },
            },
        ]);

        const stats = {
            total: totalPincodes,
            serviceable: serviceablePincodes,
            non_serviceable: nonServiceablePincodes,
            coverage_percentage: ((serviceablePincodes / totalPincodes) * 100).toFixed(2) + "%",
            state_breakdown: stateBreakdown,
            zone_breakdown: zoneBreakdown,
            avg_delivery_days: avgDeliveryDays[0]?.avgDays?.toFixed(1) || 0,
        };

        logger.info("Pincode statistics retrieved");
        return sendSuccess(res, stats, "Pincode statistics retrieved successfully");
    } catch (error) {
        logger.error(`Get pincode stats error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get cities by state
 * @route GET /api/pincodes/cities/:state
 * @access Public
 */
exports.getCitiesByState = async (req, res) => {
    try {
        const { state } = req.params;

        const cities = await Pincode.distinct("city", { state: new RegExp(state, "i") });

        logger.info(`Fetched ${cities.length} cities for state: ${state}`);
        return sendSuccess(res, { state: state, cities: cities.sort() });
    } catch (error) {
        logger.error(`Get cities by state error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get all states
 * @route GET /api/pincodes/states
 * @access Public
 */
exports.getAllStates = async (req, res) => {
    try {
        const states = await Pincode.distinct("state");

        logger.info(`Fetched ${states.length} states`);
        return sendSuccess(res, { states: states.sort() });
    } catch (error) {
        logger.error(`Get states error: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Bulk update pincode serviceability
 * @route PATCH /api/pincodes/bulk-update-serviceability
 * @access Super-admin, Fulfillment-Admin
 */
exports.bulkUpdateServiceability = async (req, res) => {
    try {
        const { pincodes, is_serviceable, updated_by } = req.body;

        if (!Array.isArray(pincodes) || pincodes.length === 0) {
            return sendError(res, "Pincodes array is required", 400);
        }

        if (is_serviceable === undefined) {
            return sendError(res, "is_serviceable field is required", 400);
        }

        const result = await Pincode.updateMany(
            { pincode: { $in: pincodes } },
            {
                is_serviceable: is_serviceable,
                updated_by: updated_by,
                updated_at: new Date()
            }
        );

        logger.info(`Bulk updated ${result.modifiedCount} pincodes serviceability`);
        return sendSuccess(
            res,
            {
                matched: result.matchedCount,
                modified: result.modifiedCount,
            },
            "Pincodes serviceability updated successfully"
        );
    } catch (error) {
        logger.error(`Bulk update serviceability error: ${error.message}`);
        return sendError(res, error);
    }
};

