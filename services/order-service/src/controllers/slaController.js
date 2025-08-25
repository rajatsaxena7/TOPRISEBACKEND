const SLAType = require("../models/slaType");
const DealerSLA = require("../models/dealerSla");
const SLAViolation = require("../models/slaViolation");
const Order = require("../models/order");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const { fetchDealer } = require("../utils/userserviceClient1");
const slaViolationScheduler = require("../jobs/slaViolationScheduler");
const slaViolationMiddleware = require("../middleware/slaViolationMiddleware");

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

// Get SLA violations for a specific order
exports.getViolationsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return sendError(res, "Order ID is required", 400);
    }

    const violations = await SLAViolation.find({ order_id: orderId })
      .populate("order_id", "orderId totalAmount customerDetails")
      .sort({ created_at: -1 })
      .lean();

    if (violations.length === 0) {
      return sendSuccess(res, [], "No SLA violations found for this order");
    }

    // Enhance with dealer info
    const enhancedViolations = await Promise.all(
      violations.map(async (violation) => {
        const dealerInfo = await fetchDealer(violation.dealer_id);
        return {
          ...violation,
          dealerInfo,
        };
      })
    );

    sendSuccess(
      res,
      enhancedViolations,
      "SLA violations for order fetched successfully"
    );
  } catch (error) {
    logger.error("Get SLA violations by order failed:", error);
    sendError(res, "Failed to get SLA violations for order");
  }
};

// Get SLA violations summary for a dealer
exports.getViolationsSummary = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { startDate, endDate } = req.query;

    if (!dealerId) {
      return sendError(res, "Dealer ID is required", 400);
    }

    const filter = { dealer_id: dealerId };
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }

    const violations = await SLAViolation.find(filter).lean();

    const summary = {
      totalViolations: violations.length,
      totalViolationMinutes: violations.reduce(
        (sum, v) => sum + v.violation_minutes,
        0
      ),
      averageViolationMinutes:
        violations.length > 0
          ? Math.round(
              violations.reduce((sum, v) => sum + v.violation_minutes, 0) /
                violations.length
            )
          : 0,
      resolvedViolations: violations.filter((v) => v.resolved).length,
      unresolvedViolations: violations.filter((v) => !v.resolved).length,
      violationsByDate: violations.reduce((acc, violation) => {
        const date = violation.created_at.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
    };

    sendSuccess(res, summary, "SLA violations summary fetched successfully");
  } catch (error) {
    logger.error("Get SLA violations summary failed:", error);
    sendError(res, "Failed to get SLA violations summary");
  }
};

// Get orders approaching SLA violation
exports.getApproachingViolations = async (req, res) => {
  try {
    const { warningMinutes = 30 } = req.query;

    const approachingViolations =
      await slaViolationMiddleware.getOrdersApproachingSLAViolation(
        parseInt(warningMinutes)
      );

    sendSuccess(
      res,
      approachingViolations,
      "Orders approaching SLA violation fetched successfully"
    );
  } catch (error) {
    logger.error("Get approaching violations failed:", error);
    sendError(res, "Failed to get orders approaching SLA violation");
  }
};

// SLA Scheduler Management
exports.startScheduler = async (req, res) => {
  try {
    slaViolationScheduler.start();
    sendSuccess(
      res,
      slaViolationScheduler.getStatus(),
      "SLA violation scheduler started successfully"
    );
  } catch (error) {
    logger.error("Failed to start SLA scheduler:", error);
    sendError(res, "Failed to start SLA violation scheduler");
  }
};

exports.stopScheduler = async (req, res) => {
  try {
    slaViolationScheduler.stop();
    sendSuccess(
      res,
      slaViolationScheduler.getStatus(),
      "SLA violation scheduler stopped successfully"
    );
  } catch (error) {
    logger.error("Failed to stop SLA scheduler:", error);
    sendError(res, "Failed to stop SLA violation scheduler");
  }
};

exports.getSchedulerStatus = async (req, res) => {
  try {
    const status = slaViolationScheduler.getStatus();
    sendSuccess(
      res,
      status,
      "SLA violation scheduler status fetched successfully"
    );
  } catch (error) {
    logger.error("Failed to get SLA scheduler status:", error);
    sendError(res, "Failed to get SLA violation scheduler status");
  }
};

exports.triggerManualCheck = async (req, res) => {
  try {
    const result = await slaViolationScheduler.triggerManualCheck();
    sendSuccess(
      res,
      result,
      "Manual SLA violation check completed successfully"
    );
  } catch (error) {
    logger.error("Failed to trigger manual SLA check:", error);
    sendError(res, "Failed to trigger manual SLA violation check");
  }
};
