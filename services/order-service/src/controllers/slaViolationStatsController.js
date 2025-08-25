const SLAViolation = require("../models/slaViolation");
const Order = require("../models/order");
const DealerSLA = require("../models/dealerSla");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const axios = require("axios");
const AuditLogger = require("../utils/auditLogger");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

// Helper function to fetch dealer info from user service
async function fetchDealer(dealerId) {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/dealer/${dealerId}`);
    return response.data.data || null;
  } catch (error) {
    logger.error(`Failed to fetch dealer ${dealerId}:`, error.message);
    return null;
  }
}

// Helper function to disable dealer in user service
async function disableDealerInUserService(dealerId, reason) {
  try {
    const response = await axios.put(`${USER_SERVICE_URL}/api/users/disable-dealer/${dealerId}`, {
      reason: reason,
      disabledAt: new Date(),
      disabledBy: "SLA Violation System"
    });
    return response.data;
  } catch (error) {
    logger.error(`Failed to disable dealer ${dealerId}:`, error.message);
    throw error;
  }
}

/**
 * Get comprehensive SLA violation statistics
 */
exports.getSLAViolationStats = async (req, res) => {
  try {
    const { startDate, endDate, dealerId, groupBy = "dealer" } = req.query;
    
    // Build filter
    const filter = {};
    if (dealerId) filter.dealer_id = dealerId;
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }

    let stats;
    
    if (groupBy === "dealer") {
      // Group by dealer
      stats = await SLAViolation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$dealer_id",
            totalViolations: { $sum: 1 },
            totalViolationMinutes: { $sum: "$violation_minutes" },
            avgViolationMinutes: { $avg: "$violation_minutes" },
            maxViolationMinutes: { $max: "$violation_minutes" },
            resolvedViolations: { $sum: { $cond: ["$resolved", 1, 0] } },
            unresolvedViolations: { $sum: { $cond: ["$resolved", 0, 1] } },
            firstViolation: { $min: "$created_at" },
            lastViolation: { $max: "$created_at" }
          }
        },
        { $sort: { totalViolations: -1 } }
      ]);

      // Enhance with dealer info
      stats = await Promise.all(
        stats.map(async (stat) => {
          const dealerInfo = await fetchDealer(stat._id);
          return {
            ...stat,
            dealerId: stat._id,
            dealerInfo,
            violationRate: stat.totalViolations > 0 ? 
              Math.round((stat.unresolvedViolations / stat.totalViolations) * 100) : 0
          };
        })
      );
    } else if (groupBy === "date") {
      // Group by date
      stats = await SLAViolation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
            },
            totalViolations: { $sum: 1 },
            totalViolationMinutes: { $sum: "$violation_minutes" },
            avgViolationMinutes: { $avg: "$violation_minutes" },
            uniqueDealers: { $addToSet: "$dealer_id" }
          }
        },
        {
          $project: {
            date: "$_id",
            totalViolations: 1,
            totalViolationMinutes: 1,
            avgViolationMinutes: 1,
            uniqueDealerCount: { $size: "$uniqueDealers" }
          }
        },
        { $sort: { date: -1 } }
      ]);
    } else if (groupBy === "month") {
      // Group by month
      stats = await SLAViolation.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$created_at" }
            },
            totalViolations: { $sum: 1 },
            totalViolationMinutes: { $sum: "$violation_minutes" },
            avgViolationMinutes: { $avg: "$violation_minutes" },
            uniqueDealers: { $addToSet: "$dealer_id" }
          }
        },
        {
          $project: {
            month: "$_id",
            totalViolations: 1,
            totalViolationMinutes: 1,
            avgViolationMinutes: 1,
            uniqueDealerCount: { $size: "$uniqueDealers" }
          }
        },
        { $sort: { month: -1 } }
      ]);
    }

    // Calculate summary statistics
    const summary = await SLAViolation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalViolations: { $sum: 1 },
          totalViolationMinutes: { $sum: "$violation_minutes" },
          avgViolationMinutes: { $avg: "$violation_minutes" },
          maxViolationMinutes: { $max: "$violation_minutes" },
          resolvedViolations: { $sum: { $cond: ["$resolved", 1, 0] } },
          unresolvedViolations: { $sum: { $cond: ["$resolved", 0, 1] } },
          uniqueDealers: { $addToSet: "$dealer_id" }
        }
      }
    ]);

    const summaryData = summary[0] || {};
    const response = {
      summary: {
        totalViolations: summaryData.totalViolations || 0,
        totalViolationMinutes: summaryData.totalViolationMinutes || 0,
        avgViolationMinutes: Math.round(summaryData.avgViolationMinutes || 0),
        maxViolationMinutes: summaryData.maxViolationMinutes || 0,
        resolvedViolations: summaryData.resolvedViolations || 0,
        unresolvedViolations: summaryData.unresolvedViolations || 0,
        uniqueDealerCount: summaryData.uniqueDealers ? summaryData.uniqueDealers.length : 0,
        resolutionRate: summaryData.totalViolations > 0 ? 
          Math.round((summaryData.resolvedViolations / summaryData.totalViolations) * 100) : 0
      },
      data: stats || []
    };

    sendSuccess(res, response, "SLA violation statistics fetched successfully");
  } catch (error) {
    logger.error("Get SLA violation stats failed:", error);
    sendError(res, "Failed to get SLA violation statistics");
  }
};

/**
 * Get dealers with 3 or more violations (candidates for disable)
 */
exports.getDealersWithMultipleViolations = async (req, res) => {
  try {
    const { minViolations = 3, startDate, endDate, includeDisabled = false } = req.query;
    
    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }

    // Get dealers with multiple violations
    const dealersWithViolations = await SLAViolation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$dealer_id",
          totalViolations: { $sum: 1 },
          totalViolationMinutes: { $sum: "$violation_minutes" },
          avgViolationMinutes: { $avg: "$violation_minutes" },
          maxViolationMinutes: { $max: "$violation_minutes" },
          unresolvedViolations: { $sum: { $cond: ["$resolved", 0, 1] } },
          firstViolation: { $min: "$created_at" },
          lastViolation: { $max: "$created_at" },
          violationDates: { $push: "$created_at" }
        }
      },
      { $match: { totalViolations: { $gte: parseInt(minViolations) } } },
      { $sort: { totalViolations: -1, lastViolation: -1 } }
    ]);

    // Enhance with dealer info and check if already disabled
    const enhancedDealers = await Promise.all(
      dealersWithViolations.map(async (dealer) => {
        const dealerInfo = await fetchDealer(dealer._id);
        
        // Skip if dealer is disabled and we're not including disabled
        if (!includeDisabled && dealerInfo && !dealerInfo.is_active) {
          return null;
        }

        return {
          dealerId: dealer._id,
          dealerInfo,
          violationStats: {
            totalViolations: dealer.totalViolations,
            totalViolationMinutes: dealer.totalViolationMinutes,
            avgViolationMinutes: Math.round(dealer.avgViolationMinutes),
            maxViolationMinutes: dealer.maxViolationMinutes,
            unresolvedViolations: dealer.unresolvedViolations,
            firstViolation: dealer.firstViolation,
            lastViolation: dealer.lastViolation,
            violationDates: dealer.violationDates
          },
          riskLevel: dealer.totalViolations >= 5 ? "High" : 
                    dealer.totalViolations >= 3 ? "Medium" : "Low",
          eligibleForDisable: dealer.totalViolations >= 3 && 
                            dealerInfo && 
                            dealerInfo.is_active
        };
      })
    );

    // Filter out null entries (disabled dealers)
    const filteredDealers = enhancedDealers.filter(dealer => dealer !== null);

    const response = {
      totalDealers: filteredDealers.length,
      highRiskDealers: filteredDealers.filter(d => d.riskLevel === "High").length,
      mediumRiskDealers: filteredDealers.filter(d => d.riskLevel === "Medium").length,
      lowRiskDealers: filteredDealers.filter(d => d.riskLevel === "Low").length,
      eligibleForDisable: filteredDealers.filter(d => d.eligibleForDisable).length,
      dealers: filteredDealers
    };

    sendSuccess(res, response, "Dealers with multiple violations fetched successfully");
  } catch (error) {
    logger.error("Get dealers with multiple violations failed:", error);
    sendError(res, "Failed to get dealers with multiple violations");
  }
};

/**
 * Disable dealer after 3 violations
 */
exports.disableDealerForViolations = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { reason, adminNotes } = req.body;
    const { user } = req; // From auth middleware

    if (!dealerId) {
      return sendError(res, "Dealer ID is required", 400);
    }

    // Check if dealer exists and get violation count
    const violations = await SLAViolation.find({ dealer_id: dealerId });
    
    if (violations.length < 3) {
      return sendError(res, `Dealer has only ${violations.length} violations. Minimum 3 violations required for disable.`, 400);
    }

    // Get dealer info
    const dealerInfo = await fetchDealer(dealerId);
    if (!dealerInfo) {
      return sendError(res, "Dealer not found in user service", 404);
    }

    if (!dealerInfo.is_active) {
      return sendError(res, "Dealer is already disabled", 400);
    }

    // Disable dealer in user service
    const disableResult = await disableDealerInUserService(dealerId, {
      reason: reason || "SLA Violations",
      adminNotes: adminNotes || `Disabled due to ${violations.length} SLA violations`,
      violationsCount: violations.length,
      lastViolation: violations[violations.length - 1].created_at
    });

    // Mark all unresolved violations as resolved
    await SLAViolation.updateMany(
      { dealer_id: dealerId, resolved: false },
      { 
        resolved: true, 
        resolved_at: new Date(),
        resolution_notes: "Dealer disabled due to multiple violations"
      }
    );

    // Log the action
    await AuditLogger.logOrderAction({
      action: "DEALER_DISABLED_FOR_VIOLATIONS",
      actorId: user?.id || user?._id,
      actorRole: user?.role || "System",
      actorName: user?.name || user?.email || "System",
      targetId: dealerId,
      targetIdentifier: dealerInfo.trade_name || dealerInfo.legal_name,
      details: {
        violationsCount: violations.length,
        reason: reason || "SLA Violations",
        adminNotes: adminNotes,
        totalViolationMinutes: violations.reduce((sum, v) => sum + v.violation_minutes, 0),
        avgViolationMinutes: Math.round(violations.reduce((sum, v) => sum + v.violation_minutes, 0) / violations.length)
      },
      category: "SLA_MANAGEMENT"
    });

    const response = {
      dealerId,
      dealerInfo,
      violationsCount: violations.length,
      disableResult,
      message: `Dealer disabled successfully due to ${violations.length} SLA violations`
    };

    sendSuccess(res, response, "Dealer disabled successfully");
  } catch (error) {
    logger.error("Disable dealer for violations failed:", error);
    sendError(res, "Failed to disable dealer");
  }
};

/**
 * Get SLA violation trends over time
 */
exports.getSLAViolationTrends = async (req, res) => {
  try {
    const { period = "30d", dealerId } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case "7d":
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filter = {
      created_at: { $gte: startDate, $lte: endDate }
    };
    
    if (dealerId) filter.dealer_id = dealerId;

    // Get daily trends
    const dailyTrends = await SLAViolation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          violations: { $sum: 1 },
          totalMinutes: { $sum: "$violation_minutes" },
          avgMinutes: { $avg: "$violation_minutes" },
          uniqueDealers: { $addToSet: "$dealer_id" }
        }
      },
      {
        $project: {
          date: "$_id",
          violations: 1,
          totalMinutes: 1,
          avgMinutes: { $round: ["$avgMinutes", 2] },
          uniqueDealers: { $size: "$uniqueDealers" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get weekly trends
    const weeklyTrends = await SLAViolation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$created_at" },
            week: { $week: "$created_at" }
          },
          violations: { $sum: 1 },
          totalMinutes: { $sum: "$violation_minutes" },
          avgMinutes: { $avg: "$violation_minutes" },
          uniqueDealers: { $addToSet: "$dealer_id" }
        }
      },
      {
        $project: {
          week: { $concat: ["$_id.year", "-W", { $toString: "$_id.week" }] },
          violations: 1,
          totalMinutes: 1,
          avgMinutes: { $round: ["$avgMinutes", 2] },
          uniqueDealers: { $size: "$uniqueDealers" }
        }
      },
      { $sort: { week: 1 } }
    ]);

    // Calculate summary metrics
    const summary = await SLAViolation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalViolations: { $sum: 1 },
          totalMinutes: { $sum: "$violation_minutes" },
          avgMinutes: { $avg: "$violation_minutes" },
          maxMinutes: { $max: "$violation_minutes" },
          uniqueDealers: { $addToSet: "$dealer_id" }
        }
      }
    ]);

    const summaryData = summary[0] || {};
    
    const response = {
      period,
      dateRange: {
        startDate,
        endDate
      },
      summary: {
        totalViolations: summaryData.totalViolations || 0,
        totalMinutes: summaryData.totalMinutes || 0,
        avgMinutes: Math.round(summaryData.avgMinutes || 0),
        maxMinutes: summaryData.maxMinutes || 0,
        uniqueDealers: summaryData.uniqueDealers ? summaryData.uniqueDealers.length : 0,
        avgViolationsPerDay: summaryData.totalViolations ? 
          Math.round((summaryData.totalViolations / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))) * 100) / 100 : 0
      },
      trends: {
        daily: dailyTrends,
        weekly: weeklyTrends
      }
    };

    sendSuccess(res, response, "SLA violation trends fetched successfully");
  } catch (error) {
    logger.error("Get SLA violation trends failed:", error);
    sendError(res, "Failed to get SLA violation trends");
  }
};

/**
 * Get top violating dealers
 */
exports.getTopViolatingDealers = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate, sortBy = "violations" } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) filter.created_at.$gte = new Date(startDate);
      if (endDate) filter.created_at.$lte = new Date(endDate);
    }

    let sortStage = {};
    switch (sortBy) {
      case "minutes":
        sortStage = { totalViolationMinutes: -1 };
        break;
      case "avgMinutes":
        sortStage = { avgViolationMinutes: -1 };
        break;
      case "recent":
        sortStage = { lastViolation: -1 };
        break;
      default:
        sortStage = { totalViolations: -1 };
    }

    const topDealers = await SLAViolation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$dealer_id",
          totalViolations: { $sum: 1 },
          totalViolationMinutes: { $sum: "$violation_minutes" },
          avgViolationMinutes: { $avg: "$violation_minutes" },
          maxViolationMinutes: { $max: "$violation_minutes" },
          unresolvedViolations: { $sum: { $cond: ["$resolved", 0, 1] } },
          firstViolation: { $min: "$created_at" },
          lastViolation: { $max: "$created_at" }
        }
      },
      { $sort: sortStage },
      { $limit: parseInt(limit) }
    ]);

    // Enhance with dealer info
    const enhancedDealers = await Promise.all(
      topDealers.map(async (dealer, index) => {
        const dealerInfo = await fetchDealer(dealer._id);
        return {
          rank: index + 1,
          dealerId: dealer._id,
          dealerInfo,
          stats: {
            totalViolations: dealer.totalViolations,
            totalViolationMinutes: dealer.totalViolationMinutes,
            avgViolationMinutes: Math.round(dealer.avgViolationMinutes),
            maxViolationMinutes: dealer.maxViolationMinutes,
            unresolvedViolations: dealer.unresolvedViolations,
            firstViolation: dealer.firstViolation,
            lastViolation: dealer.lastViolation
          },
          riskLevel: dealer.totalViolations >= 5 ? "High" : 
                    dealer.totalViolations >= 3 ? "Medium" : "Low"
        };
      })
    );

    sendSuccess(res, enhancedDealers, "Top violating dealers fetched successfully");
  } catch (error) {
    logger.error("Get top violating dealers failed:", error);
    sendError(res, "Failed to get top violating dealers");
  }
};

/**
 * Resolve SLA violation
 */
exports.resolveViolation = async (req, res) => {
  try {
    const { violationId } = req.params;
    const { resolutionNotes } = req.body;
    const { user } = req;

    const violation = await SLAViolation.findById(violationId);
    if (!violation) {
      return sendError(res, "SLA violation not found", 404);
    }

    if (violation.resolved) {
      return sendError(res, "SLA violation is already resolved", 400);
    }

    violation.resolved = true;
    violation.resolved_at = new Date();
    violation.resolution_notes = resolutionNotes;
    await violation.save();

    // Log the action
    await AuditLogger.logOrderAction({
      action: "SLA_VIOLATION_RESOLVED",
      actorId: user?.id || user?._id,
      actorRole: user?.role || "System",
      actorName: user?.name || user?.email || "System",
      targetId: violationId,
      targetIdentifier: violation.order_id?.toString(),
      details: {
        dealerId: violation.dealer_id,
        violationMinutes: violation.violation_minutes,
        resolutionNotes: resolutionNotes
      },
      category: "SLA_MANAGEMENT"
    });

    sendSuccess(res, violation, "SLA violation resolved successfully");
  } catch (error) {
    logger.error("Resolve violation failed:", error);
    sendError(res, "Failed to resolve SLA violation");
  }
};
