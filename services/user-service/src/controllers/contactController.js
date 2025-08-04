const Contact = require("../models/contactForm");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const mongoose = require("mongoose");

exports.createContactUsForm = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    sendSuccess(res, 201, "Contact form submitted successfully", contact);
  } catch (error) {
    logger.error("Error creating contact form", error);
    sendError(res, 500, "Internal Server Error");
  }
};
/**
 * @function getContactUsForm
 * @description Fetches all contact forms in the database
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 * @throws {Error} - If there is an error fetching contact forms
 */
exports.getContactUsForm = async (req, res) => {
  try {
    const contact = await Contact.find();
    sendSuccess(res, 200, "Contact form fetched successfully", contact);
  } catch (error) {
    logger.error("Error fetching contact form", error);
    sendError(res, 500, "Internal Server Error");
  }
};

exports.getContactUsFormById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    sendSuccess(res, 200, "Contact form fetched successfully", contact);
  } catch (error) {
    logger.error("Error fetching contact form", error);
    sendError(res, 500, "Internal Server Error");
  }
};

exports.updateContactUsForm = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    sendSuccess(res, 200, "Contact form updated successfully", contact);
  } catch (error) {
    logger.error("Error updating contact form", error);
    sendError(res, 500, "Internal Server Error");
  }
};

exports.deleteContactUsForm = async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    sendSuccess(res, 200, "Contact form deleted successfully");
  } catch (error) {
    logger.error("Error deleting contact form", error);
    sendError(res, 500, "Internal Server Error");
  }
};
