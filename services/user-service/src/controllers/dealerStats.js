const Dealer = require("../models/dealer");

exports.getDealerStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to all time if no dates provided
    let dateFilter = {};
    
    if (startDate && endDate) {
      const queryStartDate = new Date(startDate);
      const queryEndDate = new Date(endDate);
      
      // Validate dates
      if (isNaN(queryStartDate.getTime()) || isNaN(queryEndDate.getTime())) {
        return res.status(400).json({
          error: "Invalid date format. Please use ISO date format (YYYY-MM-DD)",
          message: "Invalid date format"
        });
      }
      
      queryEndDate.setHours(23, 59, 59, 999);
      
      dateFilter = {
        created_at: {
          $gte: queryStartDate,
          $lte: queryEndDate,
          $exists: true,
          $ne: null
        }
      };
    } else {
      // Even for all time, ensure created_at exists and is not null
      dateFilter = {
        created_at: {
          $exists: true,
          $ne: null
        }
      };
    }

    // Get total dealers
    let totalDealers = 0;
    try {
      totalDealers = await Dealer.countDocuments(dateFilter);
    } catch (error) {
      console.error("Error counting total dealers:", error);
    }

    // Get active dealers
    let activeDealers = 0;
    try {
      activeDealers = await Dealer.countDocuments({
        ...dateFilter,
        is_active: true
      });
    } catch (error) {
      console.error("Error counting active dealers:", error);
    }

    // Get deactivated dealers
    let deactivatedDealers = 0;
    try {
      deactivatedDealers = await Dealer.countDocuments({
        ...dateFilter,
        is_active: false
      });
    } catch (error) {
      console.error("Error counting deactivated dealers:", error);
    }

    // Get dealers by category count
    let dealersByCategoryCount = [];
    try {
      dealersByCategoryCount = await Dealer.aggregate([
        { $match: dateFilter },
        {
          $addFields: {
            categoryCount: { $size: { $ifNull: ["$categories_allowed", []] } }
          }
        },
        {
          $group: {
            _id: "$categoryCount",
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } catch (error) {
      console.error("Error in dealersByCategoryCount aggregation:", error);
    }

    // Get dealers with upload access enabled
    let dealersWithUploadAccess = 0;
    try {
      dealersWithUploadAccess = await Dealer.countDocuments({
        ...dateFilter,
        upload_access_enabled: true
      });
    } catch (error) {
      console.error("Error counting dealers with upload access:", error);
    }

    // Get dealers created in different time periods
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    let newDealers7Days = 0, newDealers30Days = 0, newDealers90Days = 0;
    try {
      [newDealers7Days, newDealers30Days, newDealers90Days] = await Promise.all([
        Dealer.countDocuments({ 
          created_at: { $gte: last7Days, $exists: true, $ne: null } 
        }),
        Dealer.countDocuments({ 
          created_at: { $gte: last30Days, $exists: true, $ne: null } 
        }),
        Dealer.countDocuments({ 
          created_at: { $gte: last90Days, $exists: true, $ne: null } 
        })
      ]);
    } catch (error) {
      console.error("Error counting new dealers by period:", error);
    }

    // Get recent dealers (last 10)
    let recentDealers = [];
    try {
      recentDealers = await Dealer.find({
        ...dateFilter,
        created_at: { $exists: true, $ne: null }
      })
        .sort({ created_at: -1 })
        .limit(10)
        .select('dealerId legal_name trade_name is_active upload_access_enabled created_at last_fulfillment_date')
        .populate('user_id', 'email phone_Number');
    } catch (error) {
      console.error("Error fetching recent dealers:", error);
    }

    // Get dealers by creation month (for chart)
    let dealersByMonth = [];
    try {
      dealersByMonth = await Dealer.aggregate([
        { $match: dateFilter },
        {
          $addFields: {
            isValidDate: {
              $and: [
                { $ne: ["$created_at", null] },
                { $ne: ["$created_at", ""] },
                { $eq: [{ $type: "$created_at" }, "date"] }
              ]
            }
          }
        },
        {
          $match: {
            isValidDate: true
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$created_at" },
              month: { $month: "$created_at" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);
    } catch (aggregationError) {
      console.error("Error in dealersByMonth aggregation:", aggregationError);
      dealersByMonth = [];
    }

    // Get dealers by state/city
    let dealersByLocation = [];
    try {
      dealersByLocation = await Dealer.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              state: { $ifNull: ["$Address.state", "Unknown"] },
              city: { $ifNull: ["$Address.city", "Unknown"] }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
    } catch (error) {
      console.error("Error in dealersByLocation aggregation:", error);
    }

    // Get dealers with assigned employees
    let dealersWithAssignedEmployees = 0;
    try {
      dealersWithAssignedEmployees = await Dealer.countDocuments({
        ...dateFilter,
        "assigned_Toprise_employee": { $exists: true, $ne: [], $size: { $gt: 0 } }
      });
    } catch (error) {
      console.error("Error counting dealers with assigned employees:", error);
    }

    // Get dealers by SLA type
    let dealersBySLAType = [];
    try {
      dealersBySLAType = await Dealer.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $ifNull: ["$SLA_type", "No SLA"] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
    } catch (error) {
      console.error("Error in dealersBySLAType aggregation:", error);
    }

    // Calculate average categories per dealer
    let avgCategoriesPerDealer = 0;
    try {
      const avgCategoriesResult = await Dealer.aggregate([
        { $match: dateFilter },
        {
          $addFields: {
            categoryCount: { $size: { $ifNull: ["$categories_allowed", []] } }
          }
        },
        {
          $group: {
            _id: null,
            avgCategories: { $avg: "$categoryCount" }
          }
        }
      ]);
      avgCategoriesPerDealer = avgCategoriesResult.length > 0 ? 
        parseFloat((avgCategoriesResult[0].avgCategories || 0).toFixed(2)) : 0;
    } catch (error) {
      console.error("Error calculating average categories per dealer:", error);
    }

    const stats = {
      period: {
        startDate: dateFilter.created_at?.$gte || null,
        endDate: dateFilter.created_at?.$lte || null,
        isAllTime: !startDate && !endDate
      },
      summary: {
        totalDealers: totalDealers || 0,
        activeDealers: activeDealers || 0,
        deactivatedDealers: deactivatedDealers || 0,
        dealersWithUploadAccess: dealersWithUploadAccess || 0,
        dealersWithAssignedEmployees: dealersWithAssignedEmployees || 0,
        avgCategoriesPerDealer: avgCategoriesPerDealer
      },
      statusBreakdown: {
        active: activeDealers || 0,
        deactivated: deactivatedDealers || 0
      },
      newDealers: {
        last7Days: newDealers7Days || 0,
        last30Days: newDealers30Days || 0,
        last90Days: newDealers90Days || 0
      },
      dealersByCategoryCount: (dealersByCategoryCount || []).map(item => ({
        categoryCount: item._id || 0,
        dealerCount: item.count || 0
      })),
      dealersByLocation: (dealersByLocation || []).map(item => ({
        state: item._id?.state || 'Unknown',
        city: item._id?.city || 'Unknown',
        count: item.count || 0
      })),
      dealersBySLAType: (dealersBySLAType || []).map(item => ({
        slaType: item._id || 'No SLA',
        count: item.count || 0
      })),
      dealersByMonth: (dealersByMonth || []).map(item => ({
        year: item._id?.year || 0,
        month: item._id?.month || 0,
        count: item.count || 0
      })),
      recentDealers: (recentDealers || []).map(dealer => ({
        dealerId: dealer.dealerId || '',
        legalName: dealer.legal_name || '',
        tradeName: dealer.trade_name || '',
        isActive: dealer.is_active || false,
        uploadAccessEnabled: dealer.upload_access_enabled || false,
        createdAt: dealer.created_at || new Date(),
        lastFulfillmentDate: dealer.last_fulfillment_date || null,
        email: dealer.user_id?.email || '',
        phone: dealer.user_id?.phone_Number || ''
      }))
    };

    return res.status(200).json({
      success: true,
      message: "Dealer statistics retrieved successfully",
      data: stats
    });

  } catch (error) {
    console.error("Error getting dealer stats:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
};
