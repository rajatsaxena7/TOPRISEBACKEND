const User = require("../models/user");
const Dealer = require("../models/dealer");
const Employee = require("../models/employee");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

// ✅ USER ANALYTICS REPORT
exports.getUserAnalytics = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            role,
            status,
            isActive,
            city,
            state,
            pincode,
            createdBy,
            groupBy = 'role',
            sortBy = 'count',
            sortOrder = 'desc',
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // User filters
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (pincode) filter.pincode = pincode;
        if (createdBy) filter.created_by = createdBy;

        logger.info(`🔍 User Analytics Report - Filter:`, JSON.stringify(filter, null, 2));

        // Build aggregation pipeline
        const pipeline = [
            { $match: filter },
            {
                $group: {
                    _id: groupBy === 'role' ? '$role' :
                        groupBy === 'status' ? '$status' :
                            groupBy === 'city' ? '$city' :
                                groupBy === 'state' ? '$state' :
                                    groupBy === 'pincode' ? '$pincode' :
                                        groupBy === 'createdBy' ? '$created_by' :
                                            '$role',
                    count: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    users: {
                        $push: {
                            userId: '$_id',
                            name: '$name',
                            email: '$email',
                            phone: '$phone',
                            role: '$role',
                            status: '$status',
                            isActive: '$isActive',
                            city: '$city',
                            state: '$state',
                            pincode: '$pincode',
                            createdAt: '$createdAt',
                            lastLogin: '$lastLogin'
                        }
                    }
                }
            },
            {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const analytics = await User.aggregate(pipeline);

        // Get summary statistics
        const summary = await User.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    roleCounts: {
                        $push: {
                            role: '$role',
                            status: '$status',
                            isActive: '$isActive'
                        }
                    }
                }
            }
        ]);

        // Process role breakdown
        const roleBreakdown = {};
        if (summary[0] && summary[0].roleCounts) {
            summary[0].roleCounts.forEach(item => {
                if (!roleBreakdown[item.role]) roleBreakdown[item.role] = 0;
                roleBreakdown[item.role]++;
            });
        }

        const response = {
            summary: {
                totalUsers: summary[0]?.totalUsers || 0,
                activeUsers: summary[0]?.activeUsers || 0,
                inactiveUsers: summary[0]?.inactiveUsers || 0,
                roleBreakdown
            },
            analytics,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                role: role || null,
                status: status || null,
                isActive: isActive || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                createdBy: createdBy || null,
                groupBy,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ User Analytics Report generated successfully`);
        sendSuccess(res, response, "User analytics report generated successfully");

    } catch (error) {
        logger.error("❌ User Analytics Report error:", error);
        sendError(res, "Failed to generate user analytics report", 500);
    }
};

// ✅ DEALER ANALYTICS REPORT
exports.getDealerAnalytics = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            status,
            isActive,
            city,
            state,
            pincode,
            categoriesAllowed,
            createdBy,
            groupBy = 'status',
            sortBy = 'count',
            sortOrder = 'desc',
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (status) filter.status = status;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (pincode) filter.pincode = pincode;
        if (categoriesAllowed) filter.categories_allowed = { $in: categoriesAllowed.split(',') };
        if (createdBy) filter.created_by = createdBy;

        logger.info(`🔍 Dealer Analytics Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $group: {
                    _id: groupBy === 'status' ? '$status' :
                        groupBy === 'city' ? '$city' :
                            groupBy === 'state' ? '$state' :
                                groupBy === 'pincode' ? '$pincode' :
                                    groupBy === 'createdBy' ? '$created_by' :
                                        '$status',
                    count: { $sum: 1 },
                    activeDealers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveDealers: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    totalCategories: {
                        $sum: { $size: { $ifNull: ['$categories_allowed', []] } }
                    },
                    avgCategories: {
                        $avg: { $size: { $ifNull: ['$categories_allowed', []] } }
                    },
                    dealers: {
                        $push: {
                            dealerId: '$_id',
                            legalName: '$legal_name',
                            businessName: '$business_name',
                            gstNumber: '$gst_number',
                            panNumber: '$pan_number',
                            status: '$status',
                            isActive: '$isActive',
                            city: '$city',
                            state: '$state',
                            pincode: '$pincode',
                            categoriesAllowed: '$categories_allowed',
                            userInfo: { $arrayElemAt: ['$userInfo', 0] },
                            createdAt: '$createdAt',
                            updatedAt: '$updatedAt'
                        }
                    }
                }
            },
            {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const analytics = await Dealer.aggregate(pipeline);

        // Get summary statistics
        const summary = await Dealer.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalDealers: { $sum: 1 },
                    activeDealers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveDealers: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    totalCategories: {
                        $sum: { $size: { $ifNull: ['$categories_allowed', []] } }
                    },
                    avgCategories: {
                        $avg: { $size: { $ifNull: ['$categories_allowed', []] } }
                    },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            isActive: '$isActive'
                        }
                    }
                }
            }
        ]);

        // Process status breakdown
        const statusBreakdown = {};
        if (summary[0] && summary[0].statusCounts) {
            summary[0].statusCounts.forEach(item => {
                if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
                statusBreakdown[item.status]++;
            });
        }

        const response = {
            summary: {
                totalDealers: summary[0]?.totalDealers || 0,
                activeDealers: summary[0]?.activeDealers || 0,
                inactiveDealers: summary[0]?.inactiveDealers || 0,
                totalCategories: summary[0]?.totalCategories || 0,
                avgCategories: Math.round(summary[0]?.avgCategories || 0),
                statusBreakdown
            },
            analytics,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                status: status || null,
                isActive: isActive || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                categoriesAllowed: categoriesAllowed || null,
                createdBy: createdBy || null,
                groupBy,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ Dealer Analytics Report generated successfully`);
        sendSuccess(res, response, "Dealer analytics report generated successfully");

    } catch (error) {
        logger.error("❌ Dealer Analytics Report error:", error);
        sendError(res, "Failed to generate dealer analytics report", 500);
    }
};

// ✅ EMPLOYEE ANALYTICS REPORT
exports.getEmployeeAnalytics = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            status,
            isActive,
            city,
            state,
            pincode,
            assignedDealers,
            createdBy,
            groupBy = 'status',
            sortBy = 'count',
            sortOrder = 'desc',
            limit = 100
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (status) filter.status = status;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (pincode) filter.pincode = pincode;
        if (assignedDealers) filter.assigned_dealers = { $in: assignedDealers.split(',') };
        if (createdBy) filter.created_by = createdBy;

        logger.info(`🔍 Employee Analytics Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            {
                $lookup: {
                    from: 'dealers',
                    localField: 'assigned_dealers',
                    foreignField: '_id',
                    as: 'dealerInfo'
                }
            },
            {
                $group: {
                    _id: groupBy === 'status' ? '$status' :
                        groupBy === 'city' ? '$city' :
                            groupBy === 'state' ? '$state' :
                                groupBy === 'pincode' ? '$pincode' :
                                    groupBy === 'createdBy' ? '$created_by' :
                                        '$status',
                    count: { $sum: 1 },
                    activeEmployees: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveEmployees: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    totalAssignedDealers: {
                        $sum: { $size: { $ifNull: ['$assigned_dealers', []] } }
                    },
                    avgAssignedDealers: {
                        $avg: { $size: { $ifNull: ['$assigned_dealers', []] } }
                    },
                    employees: {
                        $push: {
                            employeeId: '$_id',
                            employeeId: '$employee_id',
                            status: '$status',
                            isActive: '$isActive',
                            city: '$city',
                            state: '$state',
                            pincode: '$pincode',
                            assignedDealers: '$assigned_dealers',
                            userInfo: { $arrayElemAt: ['$userInfo', 0] },
                            dealerInfo: '$dealerInfo',
                            createdAt: '$createdAt',
                            updatedAt: '$updatedAt'
                        }
                    }
                }
            },
            {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const analytics = await Employee.aggregate(pipeline);

        // Get summary statistics
        const summary = await Employee.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    activeEmployees: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveEmployees: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    totalAssignedDealers: {
                        $sum: { $size: { $ifNull: ['$assigned_dealers', []] } }
                    },
                    avgAssignedDealers: {
                        $avg: { $size: { $ifNull: ['$assigned_dealers', []] } }
                    },
                    statusCounts: {
                        $push: {
                            status: '$status',
                            isActive: '$isActive'
                        }
                    }
                }
            }
        ]);

        // Process status breakdown
        const statusBreakdown = {};
        if (summary[0] && summary[0].statusCounts) {
            summary[0].statusCounts.forEach(item => {
                if (!statusBreakdown[item.status]) statusBreakdown[item.status] = 0;
                statusBreakdown[item.status]++;
            });
        }

        const response = {
            summary: {
                totalEmployees: summary[0]?.totalEmployees || 0,
                activeEmployees: summary[0]?.activeEmployees || 0,
                inactiveEmployees: summary[0]?.inactiveEmployees || 0,
                totalAssignedDealers: summary[0]?.totalAssignedDealers || 0,
                avgAssignedDealers: Math.round(summary[0]?.avgAssignedDealers || 0),
                statusBreakdown
            },
            analytics,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                status: status || null,
                isActive: isActive || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                assignedDealers: assignedDealers || null,
                createdBy: createdBy || null,
                groupBy,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ Employee Analytics Report generated successfully`);
        sendSuccess(res, response, "Employee analytics report generated successfully");

    } catch (error) {
        logger.error("❌ Employee Analytics Report error:", error);
        sendError(res, "Failed to generate employee analytics report", 500);
    }
};

// ✅ USER PERFORMANCE REPORT
exports.getUserPerformance = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            role,
            status,
            isActive,
            city,
            state,
            pincode,
            createdBy,
            sortBy = 'lastLogin',
            sortOrder = 'desc',
            limit = 50
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (role) filter.role = role;
        if (status) filter.status = status;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (pincode) filter.pincode = pincode;
        if (createdBy) filter.created_by = createdBy;

        logger.info(`🔍 User Performance Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $project: {
                    userId: '$_id',
                    name: '$name',
                    email: '$email',
                    phone: '$phone',
                    role: '$role',
                    status: '$status',
                    isActive: '$isActive',
                    city: '$city',
                    state: '$state',
                    pincode: '$pincode',
                    createdAt: '$createdAt',
                    updatedAt: '$updatedAt',
                    lastLogin: '$lastLogin',
                    loginCount: '$loginCount',
                    createdBy: '$created_by',
                    // Performance metrics
                    daysSinceCreation: {
                        $divide: [
                            { $subtract: [new Date(), '$createdAt'] },
                            1000 * 60 * 60 * 24
                        ]
                    },
                    daysSinceLastLogin: {
                        $cond: [
                            { $ne: ['$lastLogin', null] },
                            {
                                $divide: [
                                    { $subtract: [new Date(), '$lastLogin'] },
                                    1000 * 60 * 60 * 24
                                ]
                            },
                            null
                        ]
                    },
                    activityScore: {
                        $cond: [
                            { $ne: ['$lastLogin', null] },
                            {
                                $multiply: [
                                    { $divide: ['$loginCount', { $add: [1, { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60 * 24] }] }] },
                                    { $cond: [{ $eq: ['$isActive', true] }, 1, 0.5] }
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            {
                $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
            },
            {
                $limit: parseInt(limit)
            }
        ];

        const performance = await User.aggregate(pipeline);

        // Get summary statistics
        const summary = await User.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    avgLoginCount: { $avg: '$loginCount' },
                    maxLoginCount: { $max: '$loginCount' },
                    minLoginCount: { $min: '$loginCount' },
                    totalLoginCount: { $sum: '$loginCount' },
                    roleCounts: {
                        $push: {
                            role: '$role',
                            status: '$status',
                            isActive: '$isActive',
                            loginCount: '$loginCount'
                        }
                    }
                }
            }
        ]);

        // Process role breakdown
        const roleBreakdown = {};
        if (summary[0] && summary[0].roleCounts) {
            summary[0].roleCounts.forEach(item => {
                if (!roleBreakdown[item.role]) {
                    roleBreakdown[item.role] = {
                        count: 0,
                        totalLogins: 0,
                        avgLogins: 0
                    };
                }
                roleBreakdown[item.role].count++;
                roleBreakdown[item.role].totalLogins += item.loginCount || 0;
            });

            // Calculate averages
            Object.keys(roleBreakdown).forEach(role => {
                roleBreakdown[role].avgLogins = Math.round(roleBreakdown[role].totalLogins / roleBreakdown[role].count);
            });
        }

        const response = {
            summary: {
                totalUsers: summary[0]?.totalUsers || 0,
                activeUsers: summary[0]?.activeUsers || 0,
                inactiveUsers: summary[0]?.inactiveUsers || 0,
                avgLoginCount: Math.round(summary[0]?.avgLoginCount || 0),
                maxLoginCount: summary[0]?.maxLoginCount || 0,
                minLoginCount: summary[0]?.minLoginCount || 0,
                totalLoginCount: summary[0]?.totalLoginCount || 0,
                roleBreakdown
            },
            performance,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                role: role || null,
                status: status || null,
                isActive: isActive || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                createdBy: createdBy || null,
                sortBy,
                sortOrder,
                limit: parseInt(limit)
            }
        };

        logger.info(`✅ User Performance Report generated successfully`);
        sendSuccess(res, response, "User performance report generated successfully");

    } catch (error) {
        logger.error("❌ User Performance Report error:", error);
        sendError(res, "Failed to generate user performance report", 500);
    }
};

// ✅ USER EXPORT REPORT
exports.exportUserReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            role,
            status,
            isActive,
            city,
            state,
            pincode,
            createdBy,
            format = 'json',
            fields = 'all'
        } = req.query;

        // Build filter
        const filter = {};

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (role) filter.role = role;
        if (status) filter.status = status;
        if (isActive !== undefined) filter.isActive = isActive === 'true';
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (state) filter.state = { $regex: state, $options: 'i' };
        if (pincode) filter.pincode = pincode;
        if (createdBy) filter.created_by = createdBy;

        logger.info(`🔍 User Export Report - Filter:`, JSON.stringify(filter, null, 2));

        const pipeline = [
            { $match: filter },
            {
                $project: {
                    userId: '$_id',
                    name: '$name',
                    email: '$email',
                    phone: '$phone',
                    role: '$role',
                    status: '$status',
                    isActive: '$isActive',
                    city: '$city',
                    state: '$state',
                    pincode: '$pincode',
                    address: '$address',
                    dateOfBirth: '$dateOfBirth',
                    gender: '$gender',
                    profilePicture: '$profilePicture',
                    createdAt: '$createdAt',
                    updatedAt: '$updatedAt',
                    lastLogin: '$lastLogin',
                    loginCount: '$loginCount',
                    createdBy: '$created_by',
                    updatedBy: '$updated_by',
                    preferences: '$preferences',
                    settings: '$settings',
                    permissions: '$permissions',
                    tags: '$tags',
                    notes: '$notes',
                    isEmailVerified: '$isEmailVerified',
                    isPhoneVerified: '$isPhoneVerified',
                    emailVerificationToken: '$emailVerificationToken',
                    phoneVerificationToken: '$phoneVerificationToken',
                    passwordResetToken: '$passwordResetToken',
                    passwordResetExpires: '$passwordResetExpires',
                    twoFactorEnabled: '$twoFactorEnabled',
                    twoFactorSecret: '$twoFactorSecret',
                    backupCodes: '$backupCodes',
                    sessionTokens: '$sessionTokens',
                    deviceTokens: '$deviceTokens',
                    notificationSettings: '$notificationSettings',
                    privacySettings: '$privacySettings',
                    securitySettings: '$securitySettings',
                    auditLog: '$auditLog',
                    changeLog: '$changeLog',
                    version: '$version',
                    metaData: '$metaData',
                    customFields: '$customFields'
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ];

        const users = await User.aggregate(pipeline);

        // Get summary statistics
        const summary = await User.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                    },
                    inactiveUsers: {
                        $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
                    },
                    avgLoginCount: { $avg: '$loginCount' },
                    totalLoginCount: { $sum: '$loginCount' },
                    roleCounts: {
                        $push: {
                            role: '$role',
                            status: '$status',
                            isActive: '$isActive'
                        }
                    }
                }
            }
        ]);

        // Process role breakdown
        const roleBreakdown = {};
        if (summary[0] && summary[0].roleCounts) {
            summary[0].roleCounts.forEach(item => {
                if (!roleBreakdown[item.role]) roleBreakdown[item.role] = 0;
                roleBreakdown[item.role]++;
            });
        }

        const response = {
            summary: {
                totalUsers: summary[0]?.totalUsers || 0,
                activeUsers: summary[0]?.activeUsers || 0,
                inactiveUsers: summary[0]?.inactiveUsers || 0,
                avgLoginCount: Math.round(summary[0]?.avgLoginCount || 0),
                totalLoginCount: summary[0]?.totalLoginCount || 0,
                roleBreakdown
            },
            users,
            filters: {
                startDate: startDate || null,
                endDate: endDate || null,
                role: role || null,
                status: status || null,
                isActive: isActive || null,
                city: city || null,
                state: state || null,
                pincode: pincode || null,
                createdBy: createdBy || null,
                format,
                fields
            }
        };

        logger.info(`✅ User Export Report generated successfully`);
        sendSuccess(res, response, "User export report generated successfully");

    } catch (error) {
        logger.error("❌ User Export Report error:", error);
        sendError(res, "Failed to generate user export report", 500);
    }
};
