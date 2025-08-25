const User = require("../models/user");
const Dealer = require("../models/dealer");
const Employee = require("../models/employee");
const logger = require("/packages/utils/logger");

/**
 * Fetch a single user by ID from the user service
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object|null>} - User object or null if not found
 */
exports.fetchUser = async (userId) => {
  try {
    if (!userId) {
      logger.warn("fetchUser: No userId provided");
      return null;
    }

    // Try to find user in User model first
    let user = await User.findById(userId).lean();
    
    if (!user) {
      // Try to find in Dealer model
      user = await Dealer.findById(userId).lean();
    }
    
    if (!user) {
      // Try to find in Employee model
      user = await Employee.findById(userId).lean();
    }

    if (user) {
      logger.info(`Successfully fetched user: ${userId}`);
      return user;
    } else {
      logger.warn(`User not found: ${userId}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error fetching user ${userId}:`, error.message);
    return null;
  }
};

/**
 * Fetch multiple users by their IDs from the user service
 * @param {Array<string>} userIds - Array of user IDs to fetch
 * @returns {Promise<Array>} - Array of user objects
 */
exports.fetchUsers = async (userIds) => {
  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      logger.warn("fetchUsers: No userIds provided or empty array");
      return [];
    }

    // Remove duplicates and filter out invalid IDs
    const uniqueUserIds = [...new Set(userIds)].filter(id => id && typeof id === 'string');
    
    if (uniqueUserIds.length === 0) {
      logger.warn("fetchUsers: No valid userIds provided");
      return [];
    }

    // If only one user, use the single user endpoint
    if (uniqueUserIds.length === 1) {
      const user = await exports.fetchUser(uniqueUserIds[0]);
      return user ? [user] : [];
    }

    // Fetch users from all models
    const [users, dealers, employees] = await Promise.all([
      User.find({ _id: { $in: uniqueUserIds } }).lean(),
      Dealer.find({ _id: { $in: uniqueUserIds } }).lean(),
      Employee.find({ _id: { $in: uniqueUserIds } }).lean()
    ]);

    // Combine all results
    const allUsers = [...users, ...dealers, ...employees];
    
    logger.info(`Successfully fetched ${allUsers.length} users out of ${uniqueUserIds.length} requested`);
    return allUsers;
  } catch (error) {
    logger.error("Error in fetchUsers:", error.message);
    return [];
  }
};

/**
 * Validate if a user exists in the user service
 * @param {string} userId - The user ID to validate
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
exports.validateUser = async (userId) => {
  try {
    if (!userId) {
      return false;
    }

    const user = await exports.fetchUser(userId);
    return user !== null;
  } catch (error) {
    logger.error(`Error validating user ${userId}:`, error.message);
    return false;
  }
};

/**
 * Get user role from user service
 * @param {string} userId - The user ID
 * @returns {Promise<string|null>} - User role or null if not found
 */
exports.getUserRole = async (userId) => {
  try {
    if (!userId) {
      return null;
    }

    const user = await exports.fetchUser(userId);
    return user?.role || null;
  } catch (error) {
    logger.error(`Error getting user role for ${userId}:`, error.message);
    return null;
  }
};

/**
 * Health check for user service
 * @returns {Promise<boolean>} - True if user service is healthy
 */
exports.healthCheck = async () => {
  try {
    // Simple health check by trying to connect to the database
    await User.findOne().limit(1);
    return true;
  } catch (error) {
    logger.error("User service health check failed:", error.message);
    return false;
  }
};

/**
 * Get user service configuration
 * @returns {Object} - User service configuration
 */
exports.getConfig = () => {
  return {
    models: ["User", "Dealer", "Employee"],
    timeout: 5000
  };
};
