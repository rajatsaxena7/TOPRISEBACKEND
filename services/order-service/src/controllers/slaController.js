const SLAType = require("../models/slaType");
const DealerSLA = require("../models/dealerSla");
const SLAViolation = require("../models/slaViolation");
const Order = require("../models/order");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const { fetchDealer } = require("../utils/userserviceClient");

// SLA Type Management
exports.createSLAType = async (req, res) => {
  try {
    const { name, description, expected_hours } = req.body;

    // Validate input
    if (!name || !expected_hours) {
      return res
        .status(400)
        .json({ error: "Name and expected hours are required" });
    }

    const slaType = new SLAType({
      name,
      description,
      expected_hours,
    });

    await slaType.save();
    res.status(201).json(slaType);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "SLA Type with this name already exists" });
    }
    res.status(400).json({ error: error.message });
  }
};

// Dealer SLA Configuration
exports.setDealerSLA = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { sla_type_id, dispatch_hours } = req.body;

    // Validate dealer exists in User Service

    // Rest of your existing validation
    if (!sla_type_id || !dispatch_hours) {
      return sendError(res, "SLA type and dispatch hours are required", 400);
    }

    if (dispatch_hours.start >= dispatch_hours.end) {
      return sendError(res, "End time must be after start time", 400);
    }

    const slaType = await SLAType.findById(sla_type_id);
    if (!slaType) {
      return sendError(res, "SLA type not found", 404);
    }

    // Upsert dealer SLA configuration
    const dealerSLA = await DealerSLA.findOneAndUpdate(
      { dealer_id: dealerId },
      {
        sla_type: sla_type_id,
        dispatch_hours,
        updated_at: Date.now(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    // Populate dealer info from User Service
    const dealerInfo = await fetchDealer(dealerId);
    const response = {
      ...dealerSLA.toObject(),
      dealerInfo,
    };

    sendSuccess(res, response, "Dealer SLA configured successfully");
  } catch (error) {
    logger.error("Set Dealer SLA failed:", error);
    sendError(res, "Failed to configure dealer SLA");
  }
};

// SLA Violation Tracking
exports.logViolation = async (req, res) => {
  try {
    const { dealer_id, order_id } = req.body;
    let { expected_fulfillment_time, actual_fulfillment_time } = req.body;

    // Validate input
    if (
      !dealer_id ||
      !order_id ||
      !expected_fulfillment_time ||
      !actual_fulfillment_time
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Convert to Date objects if they're strings
    expected_fulfillment_time = new Date(expected_fulfillment_time);
    actual_fulfillment_time = new Date(actual_fulfillment_time);

    // Calculate violation minutes
    const violation_minutes = Math.round(
      (actual_fulfillment_time - expected_fulfillment_time) / (1000 * 60)
    );

    // Create violation record
    const violation = new SLAViolation({
      dealer_id,
      order_id,
      expected_fulfillment_time,
      actual_fulfillment_time,
      violation_minutes,
    });

    await violation.save();

    // Update order with violation status
    await Order.findByIdAndUpdate(order_id, {
      "slaInfo.isSLAMet": false,
      "slaInfo.violationMinutes": violation_minutes,
      status: "SLA_Violated",
    });

    // Send notification
    // await sendSLAViolationNotification(violation);

    res.status(201).json(violation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getViolations = async (req, res) => {
  try {
    const { dealerId, startDate, endDate, resolved } = req.query;
    const filter = {};

    if (dealerId) filter.dealer_id = dealerId;
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }
    if (resolved !== undefined) filter.resolved = resolved === "true";

    let violations = await SLAViolation.find(filter)
      .populate("order_id", "orderId totalAmount")
      .sort({ created_at: -1 })
      .lean();

    // Enhance with dealer info from User Service
    violations = await Promise.all(
      violations.map(async (violation) => {
        const dealerInfo = await fetchDealer(violation.dealer_id);
        return {
          ...violation,
          dealerInfo,
        };
      })
    );

    sendSuccess(res, violations, "SLA violations fetched successfully");
  } catch (error) {
    logger.error("Get SLA violations failed:", error);
    sendError(res, "Failed to get SLA violations");
  }
};
exports.getSLATypes = async (req, res) => {
  try {
    const slaTypes = await SLAType.find().lean();
    return sendSuccess(res, slaTypes, "SLA Types fetched successfully");
  } catch (error) {
    logger.error("Get SLA Types failed:", error);
    return sendError(res, "Failed to get SLA Types");
  }
};

exports.getSlaByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "SLA name is required" });
    }

    const slaType = await SLAType.findOne({ name: name.trim() });

    if (!slaType) {
      return res.status(404).json({ message: `SLA type '${name}' not found` });
    }

    res.status(200).json(slaType);
  } catch (error) {
    console.error("Error fetching SLA type by name:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
