const Pincode = require("../models/pincode");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

// ✅ CREATE PINCODE
exports.createPincode = async (req, res) => {
    try {
        const {
            pincode,
            city,
            state,
            district,
            area,
            delivery_available = true,
            delivery_charges = 0,
            estimated_delivery_days = 3,
            cod_available = true,
            status = "active",
            created_by,
            updated_by
        } = req.body;

        // Validate required fields
        if (!pincode || !city || !state || !district || !created_by || !updated_by) {
            return sendError(res, "Missing required fields: pincode, city, state, district, created_by, updated_by", 400);
        }

        // Check if pincode already exists
        const existingPincode = await Pincode.findOne({ pincode });
        if (existingPincode) {
            return sendError(res, "Pincode already exists", 409);
        }

        const newPincode = await Pincode.create({
            pincode,
            city,
            state,
            district,
            area,
            delivery_available,
            delivery_charges,
            estimated_delivery_days,
            cod_available,
            status,
            created_by,
            updated_by
        });

        logger.info(`✅ Pincode created successfully: ${pincode}`);
        sendSuccess(res, newPincode, "Pincode created successfully");

    } catch (error) {
        logger.error("❌ Create pincode error:", error);
        sendError(res, "Failed to create pincode", 500);
    }
};

// ✅ GET ALL PINCODES
exports.getAllPincodes = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            city,
            state,
            district,
            delivery_available,
            status,
            sortBy = 'created_at',
            sortOrder = 'desc'
        } = req.query;

        // Calculate pagination
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        // Build filter
        const filter = {};

        if (search) {
            filter.$or = [
                { pincode: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { state: { $regex: search, $options: 'i' } },
                { district: { $regex: search, $options: 'i' } },
                { area: { $regex: search, $options: 'i' } }
            ];
        }

        if (city) filter.city = { $regex: city, $options: 'i' };
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (district) filter.district = { $regex: district, $options: 'i' };
        if (delivery_available !== undefined) filter.delivery_available = delivery_available === 'true';
        if (status) filter.status = status;

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        logger.info(`🔍 Fetching pincodes with filter:`, JSON.stringify(filter, null, 2));

        // Get pincodes with pagination
        const pincodes = await Pincode.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNumber)
            .lean();

        // Get total count for pagination
        const totalPincodes = await Pincode.countDocuments(filter);

        // Calculate pagination info
        const totalPages = Math.ceil(totalPincodes / limitNumber);
        const hasNextPage = pageNumber < totalPages;
        const hasPrevPage = pageNumber > 1;

        const response = {
            pincodes,
            pagination: {
                currentPage: pageNumber,
                totalPages,
                totalPincodes,
                limit: limitNumber,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? pageNumber + 1 : null,
                prevPage: hasPrevPage ? pageNumber - 1 : null
            },
            filters: {
                search: search || null,
                city: city || null,
                state: state || null,
                district: district || null,
                delivery_available: delivery_available || null,
                status: status || null,
                sortBy,
                sortOrder
            }
        };

        logger.info(`✅ Fetched ${pincodes.length} pincodes successfully`);
        sendSuccess(res, response, "Pincodes fetched successfully");

    } catch (error) {
        logger.error("❌ Get all pincodes error:", error);
        sendError(res, "Failed to fetch pincodes", 500);
    }
};

// ✅ GET PINCODE BY ID
exports.getPincodeById = async (req, res) => {
    try {
        const { id } = req.params;

        const pincode = await Pincode.findById(id);
        if (!pincode) {
            return sendError(res, "Pincode not found", 404);
        }

        logger.info(`✅ Pincode fetched successfully: ${pincode.pincode}`);
        sendSuccess(res, pincode, "Pincode fetched successfully");

    } catch (error) {
        logger.error("❌ Get pincode by ID error:", error);
        sendError(res, "Failed to fetch pincode", 500);
    }
};

// ✅ UPDATE PINCODE
exports.updatePincode = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.created_at;
        delete updateData.created_by;

        // Add updated_by if not provided
        if (!updateData.updated_by) {
            updateData.updated_by = req.user?.id || 'system';
        }

        const pincode = await Pincode.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!pincode) {
            return sendError(res, "Pincode not found", 404);
        }

        logger.info(`✅ Pincode updated successfully: ${pincode.pincode}`);
        sendSuccess(res, pincode, "Pincode updated successfully");

    } catch (error) {
        logger.error("❌ Update pincode error:", error);
        sendError(res, "Failed to update pincode", 500);
    }
};

// ✅ DELETE PINCODE
exports.deletePincode = async (req, res) => {
    try {
        const { id } = req.params;

        const pincode = await Pincode.findByIdAndDelete(id);
        if (!pincode) {
            return sendError(res, "Pincode not found", 404);
        }

        logger.info(`✅ Pincode deleted successfully: ${pincode.pincode}`);
        sendSuccess(res, { deletedPincode: pincode.pincode }, "Pincode deleted successfully");

    } catch (error) {
        logger.error("❌ Delete pincode error:", error);
        sendError(res, "Failed to delete pincode", 500);
    }
};

// ✅ CHECK PINCODE AVAILABILITY
exports.checkPincode = async (req, res) => {
    try {
        const { pincode } = req.params;

        if (!pincode) {
            return sendError(res, "Pincode is required", 400);
        }

        // Validate pincode format
        if (!/^[1-9][0-9]{5}$/.test(pincode)) {
            return sendError(res, "Invalid pincode format. Must be a 6-digit Indian pincode", 400);
        }

        const pincodeData = await Pincode.findOne({
            pincode,
            status: 'active'
        });

        if (!pincodeData) {
            return sendSuccess(res, {
                available: false,
                pincode,
                message: "Pincode not available for delivery"
            }, "Pincode check completed");
        }

        const response = {
            available: true,
            pincode: pincodeData.pincode,
            city: pincodeData.city,
            state: pincodeData.state,
            district: pincodeData.district,
            area: pincodeData.area,
            delivery_available: pincodeData.delivery_available,
            delivery_charges: pincodeData.delivery_charges,
            estimated_delivery_days: pincodeData.estimated_delivery_days,
            cod_available: pincodeData.cod_available,
            status: pincodeData.status,
            message: "Pincode is available for delivery"
        };

        logger.info(`✅ Pincode check completed: ${pincode} - ${response.available ? 'Available' : 'Not Available'}`);
        sendSuccess(res, response, "Pincode check completed");

    } catch (error) {
        logger.error("❌ Check pincode error:", error);
        sendError(res, "Failed to check pincode", 500);
    }
};

// ✅ BULK CREATE PINCODES
exports.bulkCreatePincodes = async (req, res) => {
    try {
        const { pincodes, created_by, updated_by } = req.body;

        if (!pincodes || !Array.isArray(pincodes) || pincodes.length === 0) {
            return sendError(res, "Pincodes array is required", 400);
        }

        if (!created_by || !updated_by) {
            return sendError(res, "created_by and updated_by are required", 400);
        }

        const validPincodes = [];
        const errors = [];

        // Validate each pincode
        for (let i = 0; i < pincodes.length; i++) {
            const pincodeData = pincodes[i];

            try {
                // Check if pincode already exists
                const existingPincode = await Pincode.findOne({ pincode: pincodeData.pincode });
                if (existingPincode) {
                    errors.push({
                        index: i,
                        pincode: pincodeData.pincode,
                        error: "Pincode already exists"
                    });
                    continue;
                }

                // Validate required fields
                if (!pincodeData.pincode || !pincodeData.city || !pincodeData.state || !pincodeData.district) {
                    errors.push({
                        index: i,
                        pincode: pincodeData.pincode || 'N/A',
                        error: "Missing required fields: pincode, city, state, district"
                    });
                    continue;
                }

                // Validate pincode format
                if (!/^[1-9][0-9]{5}$/.test(pincodeData.pincode)) {
                    errors.push({
                        index: i,
                        pincode: pincodeData.pincode,
                        error: "Invalid pincode format"
                    });
                    continue;
                }

                validPincodes.push({
                    ...pincodeData,
                    created_by,
                    updated_by
                });

            } catch (error) {
                errors.push({
                    index: i,
                    pincode: pincodeData.pincode || 'N/A',
                    error: error.message
                });
            }
        }

        // Insert valid pincodes
        let insertedCount = 0;
        if (validPincodes.length > 0) {
            const result = await Pincode.insertMany(validPincodes, { ordered: false });
            insertedCount = result.length;
        }

        const response = {
            totalSubmitted: pincodes.length,
            validPincodes: validPincodes.length,
            insertedCount,
            errorCount: errors.length,
            errors
        };

        logger.info(`✅ Bulk create pincodes completed: ${insertedCount} inserted, ${errors.length} errors`);
        sendSuccess(res, response, "Bulk create pincodes completed");

    } catch (error) {
        logger.error("❌ Bulk create pincodes error:", error);
        sendError(res, "Failed to bulk create pincodes", 500);
    }
};

// ✅ GET PINCODE STATISTICS
exports.getPincodeStats = async (req, res) => {
    try {
        const { state, city, delivery_available } = req.query;

        // Build filter
        const filter = {};
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (delivery_available !== undefined) filter.delivery_available = delivery_available === 'true';

        // Get statistics
        const stats = await Pincode.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalPincodes: { $sum: 1 },
                    activePincodes: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                    },
                    inactivePincodes: {
                        $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] }
                    },
                    deliveryAvailable: {
                        $sum: { $cond: ["$delivery_available", 1, 0] }
                    },
                    codAvailable: {
                        $sum: { $cond: ["$cod_available", 1, 0] }
                    },
                    avgDeliveryCharges: { $avg: "$delivery_charges" },
                    avgDeliveryDays: { $avg: "$estimated_delivery_days" }
                }
            }
        ]);

        // Get state-wise distribution
        const stateDistribution = await Pincode.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$state",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get city-wise distribution
        const cityDistribution = await Pincode.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$city",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const response = {
            summary: stats[0] || {
                totalPincodes: 0,
                activePincodes: 0,
                inactivePincodes: 0,
                deliveryAvailable: 0,
                codAvailable: 0,
                avgDeliveryCharges: 0,
                avgDeliveryDays: 0
            },
            distribution: {
                byState: stateDistribution,
                byCity: cityDistribution
            },
            filters: {
                state: state || null,
                city: city || null,
                delivery_available: delivery_available || null
            }
        };

        logger.info(`✅ Pincode statistics fetched successfully`);
        sendSuccess(res, response, "Pincode statistics fetched successfully");

    } catch (error) {
        logger.error("❌ Get pincode statistics error:", error);
        sendError(res, "Failed to fetch pincode statistics", 500);
    }
};
