// utils/userServiceClient.js
const axios = require("axios");
const logger = require("/packages/utils/logger");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

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

    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 && response.data.success) {
      logger.info(`Successfully fetched user: ${userId}`);
      return response.data.data;
    } else {
      logger.warn(`Failed to fetch user ${userId}: ${response.status}`);
      return null;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logger.warn(`User not found: ${userId}`);
      return null;
    }
    
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

    // For multiple users, use the bulk endpoint if available, otherwise fetch individually
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/api/users/bulk`, {
        userIds: uniqueUserIds
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data.success) {
        logger.info(`Successfully fetched ${response.data.data.length} users`);
        return response.data.data;
      } else {
        logger.warn(`Bulk fetch failed, falling back to individual fetches`);
        return await fetchUsersIndividually(uniqueUserIds);
      }
    } catch (bulkError) {
      logger.warn(`Bulk fetch not available, using individual fetches: ${bulkError.message}`);
      return await fetchUsersIndividually(uniqueUserIds);
    }
  } catch (error) {
    logger.error("Error in fetchUsers:", error.message);
    return [];
  }
};

/**
 * Fetch users individually (fallback method)
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Array>} - Array of user objects
 */
async function fetchUsersIndividually(userIds) {
  try {
    const userPromises = userIds.map(userId => exports.fetchUser(userId));
    const users = await Promise.allSettled(userPromises);
    
    const validUsers = users
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    logger.info(`Fetched ${validUsers.length} users individually out of ${userIds.length} requested`);
    return validUsers;
  } catch (error) {
    logger.error("Error in fetchUsersIndividually:", error.message);
    return [];
  }
}

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
    const response = await axios.get(`${USER_SERVICE_URL}/health`, {
      timeout: 3000
    });
    return response.status === 200;
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
    url: USER_SERVICE_URL,
    timeout: 5000
  };
};
