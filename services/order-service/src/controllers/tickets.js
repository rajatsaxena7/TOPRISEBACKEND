const Ticket = require("../models/tickets");
const logger = require("/packages/utils/logger");
const { sendSuccess, sendError } = require("/packages/utils/responseHandler");
const { uploadFile, deleteFile } = require("/packages/utils/s3Helper");
const multer = require("multer");
const axios = require("axios");
const {
  createUnicastOrMulticastNotificationUtilityFunction,
} = require("../../../../packages/utils/notificationService");
// Configure Multer
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG/PNG/PDF files allowed"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB per file
}).array("attachments", 15); // Max 5 files

exports.handleFileUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      // Handle Multer errors
      // Multer errors (e.g., file size exceeded)
      return res.status(413).json({
        error: "UPLOAD_ERROR",
        message: err.message,
      });
    } else if (err) {
      // Other errors (e.g., invalid file type)
      return res.status(400).json({
        error: "INVALID_FILE",
        message: err.message,
      });
    }
    next();
  });
};

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:5001";

exports.createTicket = async (req, res) => {
  try {
    const {
      userRef,
      order_id,
      updated_by = null,
      description,
      ticketType,
    } = req.body;
    const files = req.files || [];
    if (ticketType === "Order" && !order_id) {
      logger.error("Order ID is required for Order tickets");
      return sendError(res, "Order ID is required for Order tickets", 400);
    }
    if (ticketType !== "Order" && ticketType !== "General") {
      logger.error("Invalid ticket type");
      return sendError(res, "Invalid ticket type", 400);
    }
    if (ticketType === "Order") {
      const existingTicket = await Ticket.findOne({
        userRef,
        order_id,
        status: { $in: ["Open", "In Progress"] },
      });

      if (existingTicket) {
        logger.error(
          `Ticket creation failed: Ticket with userRef ${userRef} and order_id ${order_id} already exists`
        );
        sendError(res, "Ticket is already open for this order id", 400);
        return;
      }
    }

    // Upload files to S3
    const attachmentUrls = [];
    for (const file of files) {
      try {
        const result = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          "ticket-attachments"
        );
        attachmentUrls.push(result.Location);
      } catch (uploadError) {
        console.error("Failed to upload file:", uploadError);
        // Cleanup already uploaded files if one fails
        await Promise.all(
          attachmentUrls.map((url) =>
            deleteFile(url.split("/").pop()).catch(console.error)
          )
        );
        throw new Error("Failed to process attachments");
      }
    }

    const newTicket = await Ticket.create({
      userRef,
      order_id: ticketType === "Order" ? order_id : null,
      updated_by,
      description,
      ticketType,
      attachments: attachmentUrls,
    });
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [userRef],
        ["INAPP", "PUSH"],
        "Ticket Created",
        `Ticket created for with id ${newTicket._id}`,
        "",
        "",
        "Ticket",
        {
          ticket_id: newTicket._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully", successData.message);
    }

    logger.info(`Ticket created successfully: ${newTicket._id}`);
    sendSuccess(res, newTicket, "Ticket created successfully");
  } catch (error) {
    logger.error(`Ticket creation failed: ${error.message}`);
    sendError(res, error);
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId)
      .populate("assigned_to involved_users")
      .populate("order_id");

    if (!ticket) {
      logger.error(`Ticket not found with ID: ${ticketId}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    logger.info(`Ticket retrieved successfully: ${ticket._id}`);
    sendSuccess(res, ticket, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket: ${error.message}`);
    sendError(res, error);
  }
};

exports.getTicketByUserRef = async (req, res) => {
  try {
    const { userRef } = req.params;
    const { order_id, ticketType, status } = req.query;

    const query = { userRef };
    if (order_id) {
      query.order_id = order_id;
    }
    if (status) {
      query.status = status;
    }
    if (ticketType) {
      query.ticketType = ticketType;
    }
    if (ticketType == "General" && order_id) {
      query.order_id = null; // Default to Order if not specified
    }

    const ticket = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate("assigned_to involved_users")
      .populate("order_id");

    if (!ticket) {
      logger.error(`Ticket not found with userRef: ${userRef}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    logger.info(`Ticket retrieved successfully for userRef: ${userRef}`);
    sendSuccess(res, ticket, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket by userRef: ${error.message}`);
    sendError(res, error);
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const { status, ticketType } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (ticketType) {
      query.ticketType = ticketType;
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate("assigned_to involved_users")
      .populate("order_id");
    if (tickets.length === 0) {
      logger.info("No tickets found");
      sendSuccess(res, [], "No tickets found");
      return;
    }
    logger.info(`Retrieved ${tickets.length} tickets successfully`);
    sendSuccess(res, tickets, "Tickets retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving tickets: ${error.message}`);
    sendError(res, error);
  }
};
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, admin_notes, updated_by } = req.body;

    if (!status || !updated_by) {
      logger.error("Missing required fields");
      sendError(res, "Status and updated_by are required", 400);
      return;
    }

    const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
    if (!validStatuses.includes(status)) {
      logger.error(`Invalid status: ${status}`);
      sendError(res, "Invalid status", 400);
      return;
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status, updated_by, admin_notes },
      { new: true, runValidators: true }
    );

    if (!updatedTicket) {
      logger.error(`Ticket not found with ID: ${ticketId}`);
      sendError(res, "Ticket not found", 404);
      return;
    }
    if (status === "Resolved" || status === "Closed") {
      const user = await axios.put(
        `${USER_SERVICE_URL}/api/users/remove-support/${updatedTicket._id}/${updatedTicket.assigned_to}`
      );
      logger.info(`Removed support from user: ${user.data.message}`);
    }
    const successData =
      await createUnicastOrMulticastNotificationUtilityFunction(
        [updatedTicket.userRef],
        ["INAPP", "PUSH"],
        "Ticket Status Updated",
        `Ticket status updated to ${status}`,
        "",
        "",
        "Ticket",
        {
          ticket_id: updatedTicket._id,
        },
        req.headers.authorization
      );
    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully", successData.message);
    }

    logger.info(`Ticket updated successfully: ${updatedTicket._id}`);
    sendSuccess(res, updatedTicket, "Ticket status updated successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addInvolvedUser = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { userId } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $addToSet: { involved_users: userId } },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        error: "TICKET_NOT_FOUND",
        message: "Ticket not found",
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: error.message,
    });
  }
};

exports.removeInvolvedUser = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { userId } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $pull: { involved_users: userId } },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({
        error: "TICKET_NOT_FOUND",
        message: "Ticket not found",
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Error removing user:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: error.message,
    });
  }
};

exports.getTicketByAssignedUserRef = async (req, res) => {
  try {
    const { assignRef } = req.params;
    const { order_id, ticketType, status } = req.query;

    const query = { assigned_to: assignRef };
    if (order_id) {
      query.order_id = order_id;
    }
    if (status) {
      query.status = status;
    }
    if (ticketType) {
      query.ticketType = ticketType;
    }
    if (ticketType == "General" && order_id) {
      query.order_id = null; // Default to Order if not specified
    }

    const ticket = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate("assigned_to involved_users")
      .populate("order_id");

    if (!ticket) {
      logger.error(`Ticket not found with userRef: ${assignRef}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    logger.info(`Ticket retrieved successfully for userRef: ${assignRef}`);
    sendSuccess(res, ticket, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket by userRef: ${error.message}`);
    sendError(res, error);
  }
};

exports.getTicketByInvolvedUserRef = async (req, res) => {
  try {
    const { involved_userId } = req.params;
    const { order_id, ticketType, status } = req.query;

    const query = { involved_users: involved_userId };
    if (order_id) {
      query.order_id = order_id;
    }
    if (status) {
      query.status = status;
    }
    if (ticketType) {
      query.ticketType = ticketType;
    }
    if (ticketType == "General" && order_id) {
      query.order_id = null; // Default to Order if not specified
    }

    const ticket = await Ticket.find(query)
      .sort({ createdAt: -1 })
      .populate("assigned_to involved_users")
      .populate("order_id");

    if (!ticket) {
      logger.error(`Ticket not found with userRef: ${involved_userId}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    logger.info(
      `Ticket retrieved successfully for userRef: ${involved_userId}`
    );
    sendSuccess(res, ticket, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket by userRef: ${error.message}`);
    sendError(res, error);
  }
};
