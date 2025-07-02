const { authenticate, authorizeRoles } = require("./authMiddleware");
const { formatDate } = require("./dateFormatter");
const errorHandler = require("./errorHandler");
const { saveFile, deleteFile } = require("./fileUtils");
const { formatEmail, formatText } = require("./formatter");
const logger = require("./logger");
const client = require("./redisClient");
const { sendSuccess, sendError } = require("./responseHandler");
const { generateUUID } = require("./uuidUtils");
const { isEmail, isPhoneNumber, isNonEmptyString } = require("./validator");

module.exports = {
  formatDate,
  errorHandler,
  saveFile,
  deleteFile,
  formatEmail,
  formatText,
  logger,
  sendSuccess,
  sendError,
  generateUUID,
  isEmail,
  isPhoneNumber,
  isNonEmptyString,
  authenticate,
  authorizeRoles,
  client,
};
