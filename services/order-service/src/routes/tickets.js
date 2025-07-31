const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/tickets');
const {
    authenticate,
    authorizeRoles,
} = require("/packages/utils/authMiddleware");

router.post(
    "/",
    ticketController.handleFileUpload, // Multer middleware
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "User"),
    ticketController.createTicket
);

router.get(
    "/byId/:ticketId",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "User"),
    ticketController.getTicketById
);

router.get(
    "/byUser/:userRef",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "User"),
    ticketController.getTicketByUserRef
);
router.get(
    "/byAssignedUser/:assignRef",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "User"),
    ticketController.getTicketByAssignedUserRef
);
router.get(
    "/byInvolvedUser/:involved_userId",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "User"),
    ticketController.getTicketByInvolvedUserRef
);
router.get(
    "/",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "User"),
    ticketController.getAllTickets
);
router.patch(
    "/updateStatus/:ticketId",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin", "User"),
    ticketController.updateTicketStatus
);
router.put(
    "/InvolveUser/:ticketId",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    ticketController.addInvolvedUser
);
router.put(
    "/removeInvolvedUser/:ticketId",
    authenticate,
    authorizeRoles("Super-admin", "Inventory-Admin"),
    ticketController.removeInvolvedUser
);

module.exports = router;