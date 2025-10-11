const Employee = require("../models/employee");
const User = require("../models/user");
const Dealer = require("../models/dealer");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const logger = require("/packages/utils/logger");

/**
 * Get all fulfillment staff with pagination and filters
 * @route GET /api/users/fulfillment-staff
 * @access Super-admin, Fulfillment-Admin
 */
exports.getAllFulfillmentStaff = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search, is_active, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

        // Build user filter for Fulfillment-Staff role
        const userFilter = {
            role: { $in: ['Fulfillment-Staff', 'Fulfillment-Admin'] }
        };

        // Add search filter if provided
        if (search) {
            userFilter.$or = [
                { email: new RegExp(search, 'i') },
                { username: new RegExp(search, 'i') },
                { phone_Number: new RegExp(search, 'i') }
            ];
        }

        // Get all users with Fulfillment-Staff or Fulfillment-Admin role
        const fulfillmentUsers = await User.find(userFilter).select('_id email username phone_Number role last_login');
        const userIds = fulfillmentUsers.map(u => u._id);

        if (userIds.length === 0) {
            return sendSuccess(res, {
                data: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: 0,
                    itemsPerPage: limit,
                    hasNextPage: false,
                    hasPreviousPage: false,
                }
            }, "No fulfillment staff found");
        }

        // Build employee filter
        const employeeFilter = {
            user_id: { $in: userIds }
        };

        // Add search filter for employee fields
        if (search) {
            const employeeSearchFilter = {
                $or: [
                    { First_name: new RegExp(search, 'i') },
                    { email: new RegExp(search, 'i') },
                    { mobile_number: new RegExp(search, 'i') },
                    { employee_id: new RegExp(search, 'i') }
                ]
            };

            // Combine with user_id filter
            employeeFilter.$and = [
                { user_id: { $in: userIds } },
                employeeSearchFilter
            ];
            delete employeeFilter.user_id;
        }

        // Get total count for pagination
        const totalEmployees = await Employee.countDocuments(employeeFilter);

        // Define sort options
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Fetch employees with pagination
        const employees = await Employee.find(employeeFilter)
            .populate('user_id', 'email username phone_Number role last_login')
            .populate({
                path: 'assigned_dealers',
                select: 'trade_name legal_name dealer_code Address contact_person is_active categories_allowed'
            })
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Enrich employee data
        const enrichedEmployees = employees.map(emp => {
            const empObj = emp.toObject();

            return {
                _id: empObj._id,
                employee_id: empObj.employee_id,
                First_name: empObj.First_name,
                profile_image: empObj.profile_image,
                mobile_number: empObj.mobile_number,
                email: empObj.email,
                role: empObj.role,
                last_login: empObj.last_login,
                created_at: empObj.created_at,
                updated_at: empObj.updated_at,
                user_details: empObj.user_id ? {
                    _id: empObj.user_id._id,
                    email: empObj.user_id.email,
                    username: empObj.user_id.username,
                    phone_Number: empObj.user_id.phone_Number,
                    role: empObj.user_id.role,
                    last_login: empObj.user_id.last_login
                } : null,
                assigned_dealers: empObj.assigned_dealers || [],
                assigned_dealers_count: empObj.assigned_dealers?.length || 0,
                assigned_regions: empObj.assigned_regions || [],
                assigned_regions_count: empObj.assigned_regions?.length || 0
            };
        });

        const totalPages = Math.ceil(totalEmployees / limit);

        logger.info(`Fetched ${enrichedEmployees.length} fulfillment staff members`);
        return sendSuccess(res, {
            data: enrichedEmployees,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: totalEmployees,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
            filters: {
                search,
                is_active,
                sortBy,
                sortOrder
            }
        }, "Fulfillment staff retrieved successfully");
    } catch (error) {
        logger.error(`Error fetching fulfillment staff: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get fulfillment staff by ID with full details
 * @route GET /api/users/fulfillment-staff/:id
 * @access Super-admin, Fulfillment-Admin, Fulfillment-Staff
 */
exports.getFulfillmentStaffById = async (req, res) => {
    try {
        const { id } = req.params;

        // Find employee by ID
        const employee = await Employee.findById(id)
            .populate('user_id', 'email username phone_Number role last_login address')
            .populate({
                path: 'assigned_dealers',
                select: 'trade_name legal_name dealer_code Address contact_person is_active categories_allowed SLA_type last_fulfillment_date',
                populate: {
                    path: 'user_id',
                    select: 'email phone_Number'
                }
            });

        if (!employee) {
            logger.error(`Fulfillment staff not found with ID: ${id}`);
            return sendError(res, "Fulfillment staff not found", 404);
        }

        // Check if user has Fulfillment-Staff or Fulfillment-Admin role
        if (!employee.user_id || !['Fulfillment-Staff', 'Fulfillment-Admin'].includes(employee.user_id.role)) {
            logger.error(`User with ID: ${id} is not a fulfillment staff member`);
            return sendError(res, "Not a fulfillment staff member", 400);
        }

        // Enrich the response
        const empObj = employee.toObject();
        const enrichedEmployee = {
            _id: empObj._id,
            employee_id: empObj.employee_id,
            First_name: empObj.First_name,
            profile_image: empObj.profile_image,
            mobile_number: empObj.mobile_number,
            email: empObj.email,
            role: empObj.role,
            last_login: empObj.last_login,
            created_at: empObj.created_at,
            updated_at: empObj.updated_at,
            user_details: empObj.user_id ? {
                _id: empObj.user_id._id,
                email: empObj.user_id.email,
                username: empObj.user_id.username,
                phone_Number: empObj.user_id.phone_Number,
                role: empObj.user_id.role,
                last_login: empObj.user_id.last_login,
                address: empObj.user_id.address
            } : null,
            assigned_dealers: empObj.assigned_dealers || [],
            assigned_dealers_count: empObj.assigned_dealers?.length || 0,
            assigned_regions: empObj.assigned_regions || [],
            assigned_regions_count: empObj.assigned_regions?.length || 0
        };

        logger.info(`Fetched fulfillment staff by ID: ${id}`);
        return sendSuccess(res, enrichedEmployee, "Fulfillment staff details retrieved successfully");
    } catch (error) {
        logger.error(`Error fetching fulfillment staff by ID: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get fulfillment staff by user ID
 * @route GET /api/users/fulfillment-staff/by-user/:userId
 * @access Super-admin, Fulfillment-Admin, Fulfillment-Staff
 */
exports.getFulfillmentStaffByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user first
        const user = await User.findById(userId);
        if (!user) {
            logger.error(`User not found with ID: ${userId}`);
            return sendError(res, "User not found", 404);
        }

        // Check if user has Fulfillment-Staff or Fulfillment-Admin role
        if (!['Fulfillment-Staff', 'Fulfillment-Admin'].includes(user.role)) {
            logger.error(`User with ID: ${userId} is not a fulfillment staff member`);
            return sendError(res, "Not a fulfillment staff member", 400);
        }

        // Find employee by user_id
        const employee = await Employee.findOne({ user_id: userId })
            .populate('user_id', 'email username phone_Number role last_login address')
            .populate({
                path: 'assigned_dealers',
                select: 'trade_name legal_name dealer_code Address contact_person is_active categories_allowed SLA_type last_fulfillment_date',
                populate: {
                    path: 'user_id',
                    select: 'email phone_Number'
                }
            });

        if (!employee) {
            logger.error(`Employee record not found for user ID: ${userId}`);
            return sendError(res, "Employee record not found", 404);
        }

        // Enrich the response
        const empObj = employee.toObject();
        const enrichedEmployee = {
            _id: empObj._id,
            employee_id: empObj.employee_id,
            First_name: empObj.First_name,
            profile_image: empObj.profile_image,
            mobile_number: empObj.mobile_number,
            email: empObj.email,
            role: empObj.role,
            last_login: empObj.last_login,
            created_at: empObj.created_at,
            updated_at: empObj.updated_at,
            user_details: empObj.user_id ? {
                _id: empObj.user_id._id,
                email: empObj.user_id.email,
                username: empObj.user_id.username,
                phone_Number: empObj.user_id.phone_Number,
                role: empObj.user_id.role,
                last_login: empObj.user_id.last_login,
                address: empObj.user_id.address
            } : null,
            assigned_dealers: empObj.assigned_dealers || [],
            assigned_dealers_count: empObj.assigned_dealers?.length || 0,
            assigned_regions: empObj.assigned_regions || [],
            assigned_regions_count: empObj.assigned_regions?.length || 0
        };

        logger.info(`Fetched fulfillment staff by user ID: ${userId}`);
        return sendSuccess(res, enrichedEmployee, "Fulfillment staff details retrieved successfully");
    } catch (error) {
        logger.error(`Error fetching fulfillment staff by user ID: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get fulfillment staff statistics
 * @route GET /api/users/fulfillment-staff/stats
 * @access Super-admin, Fulfillment-Admin
 */
exports.getFulfillmentStaffStats = async (req, res) => {
    try {
        // Get all users with Fulfillment-Staff or Fulfillment-Admin role
        const fulfillmentUsers = await User.find({
            role: { $in: ['Fulfillment-Staff', 'Fulfillment-Admin'] }
        }).select('_id role last_login');

        const userIds = fulfillmentUsers.map(u => u._id);

        // Get all employees for these users
        const employees = await Employee.find({
            user_id: { $in: userIds }
        }).populate('assigned_dealers');

        // Calculate statistics
        const totalFulfillmentStaff = employees.filter(e =>
            e.role === 'Fulfillment-Staff'
        ).length;

        const totalFulfillmentAdmin = employees.filter(e =>
            e.role === 'Fulfillment-Admin'
        ).length;

        const totalAssignedDealers = employees.reduce((sum, emp) =>
            sum + (emp.assigned_dealers?.length || 0), 0
        );

        const staffWithDealers = employees.filter(emp =>
            emp.assigned_dealers && emp.assigned_dealers.length > 0
        ).length;

        const staffWithoutDealers = employees.length - staffWithDealers;

        // Get active vs inactive (based on last login in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeStaff = fulfillmentUsers.filter(u =>
            u.last_login && new Date(u.last_login) > thirtyDaysAgo
        ).length;

        const inactiveStaff = fulfillmentUsers.length - activeStaff;

        // Get dealers per staff statistics
        const dealerCounts = employees.map(emp => emp.assigned_dealers?.length || 0);
        const avgDealersPerStaff = dealerCounts.length > 0
            ? (dealerCounts.reduce((sum, count) => sum + count, 0) / dealerCounts.length).toFixed(2)
            : 0;

        const maxDealersAssigned = Math.max(...dealerCounts, 0);
        const minDealersAssigned = dealerCounts.length > 0 ? Math.min(...dealerCounts) : 0;

        // Get recent additions (last 30 days)
        const recentAdditions = employees.filter(emp =>
            emp.created_at && new Date(emp.created_at) > thirtyDaysAgo
        ).length;

        const stats = {
            total: {
                all: employees.length,
                fulfillmentStaff: totalFulfillmentStaff,
                fulfillmentAdmin: totalFulfillmentAdmin
            },
            activity: {
                active: activeStaff,
                inactive: inactiveStaff
            },
            dealerAssignment: {
                totalAssignedDealers: totalAssignedDealers,
                staffWithDealers: staffWithDealers,
                staffWithoutDealers: staffWithoutDealers,
                avgDealersPerStaff: parseFloat(avgDealersPerStaff),
                maxDealersAssigned: maxDealersAssigned,
                minDealersAssigned: minDealersAssigned
            },
            recent: {
                addedLast30Days: recentAdditions
            }
        };

        logger.info('Fulfillment staff statistics retrieved successfully');
        return sendSuccess(res, stats, "Fulfillment staff statistics retrieved successfully");
    } catch (error) {
        logger.error(`Error fetching fulfillment staff statistics: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get fulfillment staff by region
 * @route GET /api/users/fulfillment-staff/by-region
 * @access Super-admin, Fulfillment-Admin
 */
exports.getFulfillmentStaffByRegion = async (req, res) => {
    try {
        const { region } = req.query;

        if (!region) {
            return sendError(res, "Region parameter is required", 400);
        }

        // Get all users with Fulfillment-Staff or Fulfillment-Admin role
        const fulfillmentUsers = await User.find({
            role: { $in: ['Fulfillment-Staff', 'Fulfillment-Admin'] }
        }).select('_id');

        const userIds = fulfillmentUsers.map(u => u._id);

        // Find employees with the specified region
        const employees = await Employee.find({
            user_id: { $in: userIds },
            assigned_regions: region
        })
            .populate('user_id', 'email username phone_Number role last_login')
            .populate({
                path: 'assigned_dealers',
                select: 'trade_name legal_name dealer_code Address contact_person is_active'
            })
            .sort({ created_at: -1 });

        // Enrich employee data
        const enrichedEmployees = employees.map(emp => {
            const empObj = emp.toObject();

            return {
                _id: empObj._id,
                employee_id: empObj.employee_id,
                First_name: empObj.First_name,
                profile_image: empObj.profile_image,
                mobile_number: empObj.mobile_number,
                email: empObj.email,
                role: empObj.role,
                last_login: empObj.last_login,
                created_at: empObj.created_at,
                updated_at: empObj.updated_at,
                user_details: empObj.user_id ? {
                    _id: empObj.user_id._id,
                    email: empObj.user_id.email,
                    username: empObj.user_id.username,
                    phone_Number: empObj.user_id.phone_Number,
                    role: empObj.user_id.role,
                    last_login: empObj.user_id.last_login
                } : null,
                assigned_dealers: empObj.assigned_dealers || [],
                assigned_dealers_count: empObj.assigned_dealers?.length || 0,
                assigned_regions: empObj.assigned_regions || [],
                assigned_regions_count: empObj.assigned_regions?.length || 0
            };
        });

        logger.info(`Fetched ${enrichedEmployees.length} fulfillment staff for region: ${region}`);
        return sendSuccess(res, {
            data: enrichedEmployees,
            region: region,
            count: enrichedEmployees.length
        }, `Fulfillment staff for region ${region} retrieved successfully`);
    } catch (error) {
        logger.error(`Error fetching fulfillment staff by region: ${error.message}`);
        return sendError(res, error);
    }
};

/**
 * Get available regions
 * @route GET /api/users/fulfillment-staff/regions
 * @access Super-admin, Fulfillment-Admin
 */
exports.getAvailableRegions = async (req, res) => {
    try {
        // Get all users with Fulfillment-Staff or Fulfillment-Admin role
        const fulfillmentUsers = await User.find({
            role: { $in: ['Fulfillment-Staff', 'Fulfillment-Admin'] }
        }).select('_id');

        const userIds = fulfillmentUsers.map(u => u._id);

        // Get all unique regions
        const employees = await Employee.find({
            user_id: { $in: userIds }
        }).select('assigned_regions');

        // Collect all unique regions
        const regionsSet = new Set();
        employees.forEach(emp => {
            if (emp.assigned_regions && emp.assigned_regions.length > 0) {
                emp.assigned_regions.forEach(region => regionsSet.add(region));
            }
        });

        const regions = Array.from(regionsSet).sort();

        // Get count of staff per region
        const regionStats = {};
        regions.forEach(region => {
            const staffCount = employees.filter(emp =>
                emp.assigned_regions && emp.assigned_regions.includes(region)
            ).length;
            regionStats[region] = staffCount;
        });

        logger.info(`Retrieved ${regions.length} unique regions`);
        return sendSuccess(res, {
            regions: regions,
            regionStats: regionStats,
            totalRegions: regions.length
        }, "Available regions retrieved successfully");
    } catch (error) {
        logger.error(`Error fetching available regions: ${error.message}`);
        return sendError(res, error);
    }
};

