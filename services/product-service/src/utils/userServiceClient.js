const axios = require("axios");
const logger = require("/packages/utils/logger");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

/**
 * Fetch user information from user service
 */
exports.fetchUser = async (userId) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user ${userId}:`, error.message);
    return null;
  }
};

/**
 * Fetch multiple users information from user service
 */
exports.fetchUsers = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) return [];
    
    const response = await axios.post(`${USER_SERVICE_URL}/api/users/bulk`, {
      userIds: userIds
    });
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch users:`, error.message);
    return [];
  }
};

/**
 * Fetch dealer information from user service
 */
exports.fetchDealer = async (dealerId) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/dealer/${dealerId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch dealer ${dealerId}:`, error.message);
    return null;
  }
};

/**
 * Fetch user by email from user service
 */
exports.fetchUserByEmail = async (email) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/email/${email}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user by email ${email}:`, error.message);
    return null;
  }
};
