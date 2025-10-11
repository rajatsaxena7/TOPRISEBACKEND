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
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:5003";

/* --- User Service Helper Functions -------------------------------------- */
const fetchUserDetails = async (userId, authHeader) => {
  try {
    if (!userId || !authHeader) {
      return null;
    }

    const userResponse = await axios.get(
      `${USER_SERVICE_URL}/api/users/${userId}`,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    if (userResponse.data && userResponse.data.success && userResponse.data.data) {
      return {
        _id: userResponse.data.data._id,
        username: userResponse.data.data.username,
        email: userResponse.data.data.email,
        role: userResponse.data.data.role,
        first_name: userResponse.data.data.first_name,
        last_name: userResponse.data.data.last_name,
        phone: userResponse.data.data.phone,
        status: userResponse.data.data.status,
        // Add other relevant user fields as needed
      };
    }
    return null;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        logger.warn(`Authorization failed for user ${userId} - token may be invalid or expired`);
      } else if (error.response.status === 404) {
        logger.warn(`User ${userId} not found in user service`);
      } else {
        logger.warn(`Failed to fetch user details for ${userId}: ${error.response.status} - ${error.response.statusText}`);
      }
    } else {
      logger.warn(`Error fetching user details for ${userId}: ${error.message}`);
    }
    return null;
  }
};

/* --- Order Service Helper Functions ------------------------------------- */
const fetchOrderDetails = async (orderId, authHeader) => {
  try {
    if (!orderId || !authHeader) {
      return null;
    }

    const orderResponse = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    if (orderResponse.data && orderResponse.data.success && orderResponse.data.data) {
      return {
        _id: orderResponse.data.data._id,
        order_number: orderResponse.data.data.order_number,
        status: orderResponse.data.data.status,
        total_amount: orderResponse.data.data.total_amount,
        order_date: orderResponse.data.data.order_date,
        delivery_address: orderResponse.data.data.delivery_address,
        payment_status: orderResponse.data.data.payment_status,
        items: orderResponse.data.data.items,
        // Add other relevant order fields as needed
      };
    }
    return null;
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        logger.warn(`Authorization failed for order ${orderId} - token may be invalid or expired`);
      } else if (error.response.status === 404) {
        logger.warn(`Order ${orderId} not found in order service`);
      } else {
        logger.warn(`Failed to fetch order details for ${orderId}: ${error.response.status} - ${error.response.statusText}`);
      }
    } else {
      logger.warn(`Error fetching order details for ${orderId}: ${error.message}`);
    }
    return null;
  }
};

/* --- Ticket Population Helper Function ---------------------------------- */
const populateTicketDetails = async (ticket, authHeader) => {
  try {
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;

    // Collect unique user IDs from the ticket
    const userIds = new Set();
    if (ticket.userRef) userIds.add(ticket.userRef);
    if (ticket.assigned_to) userIds.add(ticket.assigned_to);
    if (ticket.updated_by) userIds.add(ticket.updated_by);
    if (ticket.remarks_updated_by) userIds.add(ticket.remarks_updated_by);

    // Add user IDs from involved_users
    if (ticket.involved_users && ticket.involved_users.length > 0) {
      ticket.involved_users.forEach(userId => {
        if (userId) userIds.add(userId);
      });
    }

    // Fetch user details for all unique user IDs
    const userDetails = {};
    if (userIds.size > 0 && authHeader) {
      logger.debug(`Fetching user details for ${userIds.size} users`);

      const userPromises = Array.from(userIds).map(async (userId) => {
        const userData = await fetchUserDetails(userId, authHeader);
        return { userId, userData };
      });

      const userResults = await Promise.all(userPromises);
      userResults.forEach(({ userId, userData }) => {
        if (userData) {
          userDetails[userId] = userData;
        }
      });

      logger.debug(`Successfully fetched user details for ${Object.keys(userDetails).length} out of ${userIds.size} users`);
    }

    // Fetch order details if order_id exists
    let orderDetails = null;
    if (ticket.order_id && authHeader) {
      logger.debug(`Fetching order details for order ${ticket.order_id}`);
      orderDetails = await fetchOrderDetails(ticket.order_id, authHeader);
      if (orderDetails) {
        logger.debug(`Successfully fetched order details for order ${ticket.order_id}`);
      }
    }

    // Add user details to the ticket object
    ticketObj.userDetails = userDetails;

    // Add specific user references for easy access
    if (ticket.userRef && userDetails[ticket.userRef]) {
      ticketObj.userRefDetails = userDetails[ticket.userRef];
    }

    if (ticket.assigned_to && userDetails[ticket.assigned_to]) {
      ticketObj.assignedToDetails = userDetails[ticket.assigned_to];
    }

    if (ticket.updated_by && userDetails[ticket.updated_by]) {
      ticketObj.updatedByDetails = userDetails[ticket.updated_by];
    }

    if (ticket.remarks_updated_by && userDetails[ticket.remarks_updated_by]) {
      ticketObj.remarksUpdatedByDetails = userDetails[ticket.remarks_updated_by];
    }

    // Add involved users details
    if (ticket.involved_users && ticket.involved_users.length > 0) {
      ticketObj.involvedUsersDetails = ticket.involved_users
        .map(userId => userDetails[userId])
        .filter(user => user !== undefined);
    }

    // Add order details
    if (orderDetails) {
      ticketObj.orderDetails = orderDetails;
    }

    return ticketObj;
  } catch (error) {
    logger.error(`Error populating ticket details: ${error.message}`);
    return ticket.toObject ? ticket.toObject() : ticket;
  }
};

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
    const authHeader = req.headers.authorization;

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      logger.error(`Ticket not found with ID: ${ticketId}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    // Populate ticket with user and order details
    const populatedTicket = await populateTicketDetails(ticket, authHeader);

    logger.info(`Ticket retrieved successfully: ${ticket._id}`);
    sendSuccess(res, populatedTicket, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket: ${error.message}`);
    sendError(res, error);
  }
};

exports.getTicketByUserRef = async (req, res) => {
  try {
    const { userRef } = req.params;
    const { order_id, ticketType, status } = req.query;
    const authHeader = req.headers.authorization;

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

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 });

    if (!tickets || tickets.length === 0) {
      logger.error(`Ticket not found with userRef: ${userRef}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    // Populate tickets with user and order details
    const populatedTickets = await Promise.all(
      tickets.map(ticket => populateTicketDetails(ticket, authHeader))
    );

    logger.info(`Ticket retrieved successfully for userRef: ${userRef}`);
    sendSuccess(res, populatedTickets, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket by userRef: ${error.message}`);
    sendError(res, error);
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const { status, ticketType } = req.query;
    const authHeader = req.headers.authorization;
    let query = {};

    if (status) {
      query.status = status;
    }
    if (ticketType) {
      query.ticketType = ticketType;
    }

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 });

    if (tickets.length === 0) {
      logger.info("No tickets found");
      sendSuccess(res, [], "No tickets found");
      return;
    }

    // Populate tickets with user and order details
    const populatedTickets = await Promise.all(
      tickets.map(ticket => populateTicketDetails(ticket, authHeader))
    );

    logger.info(`Retrieved ${tickets.length} tickets successfully`);
    sendSuccess(res, populatedTickets, "Tickets retrieved successfully");
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

    // Remove ticket assignment from user if status is Resolved or Closed
    if ((status === "Resolved" || status === "Closed") && updatedTicket.assigned_to) {
      try {
        const user = await axios.put(
          `${USER_SERVICE_URL}/api/users/remove-support/${updatedTicket._id}/${updatedTicket.assigned_to}`,
          {},
          {
            headers: {
              Authorization: req.headers.authorization,
            },
            timeout: 5000,
          }
        );
        logger.info(`✅ Removed support from user: ${user.data.message}`);
      } catch (userError) {
        // Log the error but don't fail the ticket update
        logger.warn(`⚠️ Could not remove support from user: ${userError.message}`);
        if (userError.response) {
          logger.warn(`   User service responded with: ${userError.response.status} - ${userError.response.statusText}`);
        }
      }
    }

    // Send notification to user about ticket status update
    try {
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
        logger.info("✅ Notification created successfully");
      }
    } catch (notificationError) {
      // Log the error but don't fail the ticket update
      logger.warn(`⚠️ Could not send notification: ${notificationError.message}`);
    }

    logger.info(`✅ Ticket updated successfully: ${updatedTicket._id} to status: ${status}`);
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
    const authHeader = req.headers.authorization;

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

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 });

    if (!tickets || tickets.length === 0) {
      logger.error(`Ticket not found with assignRef: ${assignRef}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    // Populate tickets with user and order details
    const populatedTickets = await Promise.all(
      tickets.map(ticket => populateTicketDetails(ticket, authHeader))
    );

    logger.info(`Ticket retrieved successfully for assignRef: ${assignRef}`);
    sendSuccess(res, populatedTickets, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket by assignRef: ${error.message}`);
    sendError(res, error);
  }
};

exports.getTicketByInvolvedUserRef = async (req, res) => {
  try {
    const { involved_userId } = req.params;
    const { order_id, ticketType, status } = req.query;
    const authHeader = req.headers.authorization;

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

    const tickets = await Ticket.find(query)
      .sort({ createdAt: -1 });

    if (!tickets || tickets.length === 0) {
      logger.error(`Ticket not found with involved_userId: ${involved_userId}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    // Populate tickets with user and order details
    const populatedTickets = await Promise.all(
      tickets.map(ticket => populateTicketDetails(ticket, authHeader))
    );

    logger.info(
      `Ticket retrieved successfully for involved_userId: ${involved_userId}`
    );
    sendSuccess(res, populatedTickets, "Ticket retrieved successfully");
  } catch (error) {
    logger.error(`Error retrieving ticket by involved_userId: ${error.message}`);
    sendError(res, error);
  }
};

exports.updateTicketRemarks = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { remarks, updated_by } = req.body;

    // Validate required fields
    if (!remarks && remarks !== "") {
      logger.error("Remarks field is required");
      sendError(res, "Remarks field is required", 400);
      return;
    }

    if (!updated_by) {
      logger.error("Updated_by field is required");
      sendError(res, "Updated_by field is required", 400);
      return;
    }

    // Check if ticket exists
    const existingTicket = await Ticket.findById(ticketId);
    if (!existingTicket) {
      logger.error(`Ticket not found with ID: ${ticketId}`);
      sendError(res, "Ticket not found", 404);
      return;
    }

    // Update ticket remarks
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        remarks: remarks,
        remarks_updated_by: updated_by,
        remarks_updated_at: new Date(),
      },
      { new: true, runValidators: true }
    );

    // Send notification to ticket creator about remarks update
    const successData = await createUnicastOrMulticastNotificationUtilityFunction(
      [updatedTicket.userRef],
      ["INAPP", "PUSH"],
      "Ticket Remarks Updated",
      `Remarks have been updated for ticket ${updatedTicket._id}`,
      "",
      "",
      "Ticket",
      {
        ticket_id: updatedTicket._id,
        remarks: remarks,
        updated_by: updated_by,
      },
      req.headers.authorization
    );

    if (!successData.success) {
      logger.error("❌ Create notification error:", successData.message);
    } else {
      logger.info("✅ Notification created successfully", successData.message);
    }

    logger.info(`Ticket remarks updated successfully: ${updatedTicket._id}`);
    sendSuccess(res, updatedTicket, "Ticket remarks updated successfully");
  } catch (error) {
    logger.error(`Error updating ticket remarks: ${error.message}`);
    sendError(res, error);
  }
};