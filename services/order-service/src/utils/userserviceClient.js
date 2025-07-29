// utils/userServiceClient.js
const axios = require("axios");
const logger = require("/packages/utils/logger");

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:5001";

exports.fetchDealer = async (dealerId) => {
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/api/users/dealer/${dealerId}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch dealer ${dealerId}:`, error.message);
    return null;
  }
};
