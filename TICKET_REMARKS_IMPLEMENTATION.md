# Ticket Remarks Implementation

## Overview
Added a remarks field to the tickets system to allow authorized users to update and track remarks for tickets. This provides a way to add additional notes, updates, or comments to tickets beyond the initial description.

## Features Added

### 1. Database Schema Updates
- **`remarks`**: String field to store ticket remarks (optional, defaults to empty string)
- **`remarks_updated_by`**: String field to track who last updated the remarks
- **`remarks_updated_at`**: Date field to track when remarks were last updated

### 2. API Endpoint
- **PATCH** `/api/tickets/updateRemarks/:ticketId` - Update ticket remarks

### 3. Authorization
- Only authorized roles can update remarks:
  - Super-admin
  - Fulfillment-Admin
  - Fulfillment-Staff
  - Inventory-Admin
  - Inventory-Staff
  - Customer-Support

### 4. Notifications
- Automatic notifications sent to ticket creator when remarks are updated
- Notification includes ticket ID, remarks content, and who updated it

## Implementation Details

### Database Schema
```javascript
// Added to tickets model
remarks: {
    type: String,
    required: false,
    default: "",
},
remarks_updated_by: {
    type: String,
    required: false,
},
remarks_updated_at: {
    type: Date,
    default: null,
},
```

### API Controller
```javascript
exports.updateTicketRemarks = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { remarks, updated_by } = req.body;

    // Validation
    if (!remarks && remarks !== "") {
      return sendError(res, "Remarks field is required", 400);
    }

    if (!updated_by) {
      return sendError(res, "Updated_by field is required", 400);
    }

    // Update ticket
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        remarks: remarks,
        remarks_updated_by: updated_by,
        remarks_updated_at: new Date(),
      },
      { new: true, runValidators: true }
    );

    // Send notification
    await createUnicastOrMulticastNotificationUtilityFunction(
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

    sendSuccess(res, updatedTicket, "Ticket remarks updated successfully");
  } catch (error) {
    sendError(res, error);
  }
};
```

### Route Configuration
```javascript
router.patch(
    "/updateRemarks/:ticketId",
    authenticate,
    authorizeRoles(
        "Super-admin",
        "Fulfillment-Admin",
        "Fulfillment-Staff",
        "Inventory-Admin",
        "Inventory-Staff",
        "Customer-Support",
    ),
    ticketController.updateTicketRemarks
);
```

## API Usage

### Update Ticket Remarks
```http
PATCH /api/tickets/updateRemarks/:ticketId
Authorization: Bearer <token>
Content-Type: application/json

{
  "remarks": "Issue has been identified and is being worked on. Expected resolution time: 2-3 business days.",
  "updated_by": "admin-user-123"
}
```

### Request Parameters
- **ticketId** (path parameter): The ID of the ticket to update
- **remarks** (body): The remarks text (can be empty string to clear remarks)
- **updated_by** (body): The user ID of who is updating the remarks

### Response Format
```json
{
  "success": true,
  "message": "Ticket remarks updated successfully",
  "data": {
    "_id": "ticket_id",
    "userRef": "user-123",
    "description": "Original ticket description",
    "status": "In Progress",
    "ticketType": "General",
    "remarks": "Issue has been identified and is being worked on. Expected resolution time: 2-3 business days.",
    "remarks_updated_by": "admin-user-123",
    "remarks_updated_at": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Use Cases

### 1. Progress Updates
```json
{
  "remarks": "Issue has been escalated to the technical team. Working on a fix.",
  "updated_by": "support-agent-456"
}
```

### 2. Resolution Notes
```json
{
  "remarks": "Issue resolved. Applied patch v2.1.3. Customer has been notified.",
  "updated_by": "tech-admin-789"
}
```

### 3. Additional Context
```json
{
  "remarks": "Customer provided additional information: The issue occurs only on mobile devices running iOS 15+.",
  "updated_by": "support-agent-456"
}
```

### 4. Clear Remarks
```json
{
  "remarks": "",
  "updated_by": "admin-user-123"
}
```

## Error Handling

### Validation Errors
```json
// Missing remarks field
{
  "success": false,
  "message": "Remarks field is required",
  "error": "VALIDATION_ERROR"
}

// Missing updated_by field
{
  "success": false,
  "message": "Updated_by field is required",
  "error": "VALIDATION_ERROR"
}
```

### Not Found Error
```json
// Invalid ticket ID
{
  "success": false,
  "message": "Ticket not found",
  "error": "NOT_FOUND"
}
```

### Authorization Error
```json
// Insufficient permissions
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "error": "AUTHORIZATION_ERROR"
}
```

## Notification System

### Notification Details
When remarks are updated, a notification is automatically sent to the ticket creator:

- **Type**: "Ticket Remarks Updated"
- **Message**: "Remarks have been updated for ticket {ticket_id}"
- **Channels**: In-app and push notifications
- **Metadata**: Includes ticket ID, remarks content, and who updated it

### Notification Payload
```json
{
  "ticket_id": "ticket_id",
  "remarks": "Updated remarks content",
  "updated_by": "user_id_who_updated"
}
```

## Database Migration

### For Existing Tickets
Existing tickets will have:
- `remarks`: Empty string (default)
- `remarks_updated_by`: null
- `remarks_updated_at`: null

### Adding Remarks to Existing Tickets
```javascript
// Example: Add remarks to existing ticket
const ticket = await Ticket.findById(ticketId);
if (ticket) {
  ticket.remarks = "Initial remark added during migration";
  ticket.remarks_updated_by = "system";
  ticket.remarks_updated_at = new Date();
  await ticket.save();
}
```

## Testing

### Test Script
A comprehensive test script `test-ticket-remarks.js` has been created to verify:
1. Creating a test ticket
2. Updating remarks
3. Multiple updates
4. Clearing remarks
5. Retrieving ticket details
6. Validation error handling
7. Not found error handling

### Manual Testing
```bash
# Test updating remarks
curl -X PATCH http://localhost:5003/api/tickets/updateRemarks/ticket_id \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Test remark",
    "updated_by": "user_id"
  }'

# Test getting ticket details
curl -H "Authorization: Bearer your_token" \
  http://localhost:5003/api/tickets/byId/ticket_id
```

## Security Considerations

### Authorization
- Only authorized roles can update remarks
- Authentication required for all operations
- Role-based access control enforced

### Data Validation
- Remarks field is validated (required but can be empty)
- Updated_by field is required
- Ticket existence is verified before update

### Audit Trail
- Tracks who updated the remarks (`remarks_updated_by`)
- Tracks when remarks were updated (`remarks_updated_at`)
- Maintains ticket creation and modification timestamps

## Performance Considerations

### Database Operations
- Single database update operation
- Efficient query using ticket ID
- No additional joins required

### Notifications
- Asynchronous notification sending
- Non-blocking operation
- Graceful error handling for notification failures

## Future Enhancements

### Potential Improvements
1. **Remarks History**: Track all remarks changes over time
2. **Rich Text Support**: Support for formatted text in remarks
3. **File Attachments**: Allow file attachments with remarks
4. **Remarks Templates**: Pre-defined remark templates for common scenarios
5. **Remarks Categories**: Categorize remarks (progress, resolution, note, etc.)
6. **Bulk Remarks Update**: Update remarks for multiple tickets
7. **Remarks Search**: Search tickets by remarks content

### API Extensions
```javascript
// Future: Get remarks history
GET /api/tickets/:ticketId/remarks-history

// Future: Add remarks with category
PATCH /api/tickets/updateRemarks/:ticketId
{
  "remarks": "Issue resolved",
  "category": "resolution",
  "updated_by": "user_id"
}
```

## Integration Points

### Existing Systems
- **Notification Service**: Sends notifications when remarks are updated
- **User Service**: Validates user permissions and gets user details
- **Order Service**: Integrates with existing ticket management

### Dependencies
- **Mongoose**: Database operations
- **Express**: API routing
- **Authentication Middleware**: User authentication and authorization
- **Notification Service**: Sending notifications

## Monitoring and Logging

### Logging
- Successful remarks updates are logged
- Failed operations are logged with error details
- Notification sending results are logged

### Metrics to Monitor
- Number of remarks updates per day
- Average time between ticket creation and first remark
- Most active users updating remarks
- Failed remarks update attempts

## Conclusion

The ticket remarks functionality provides a flexible way to add additional context and updates to tickets. It maintains proper authorization, includes comprehensive error handling, and integrates seamlessly with the existing notification system. The implementation is designed to be extensible for future enhancements while maintaining backward compatibility with existing tickets.
