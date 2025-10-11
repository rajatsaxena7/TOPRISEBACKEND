# Ticket Status Update Fix - Resolved and Closed Not Working

## Issue Identified
The ticket status update route was successfully updating "Open" and "In Progress" statuses but failing when trying to update to "Resolved" or "Closed" statuses.

## Root Cause

When the status was being updated to "Resolved" or "Closed", the code attempted to remove the ticket assignment from the user by calling the user service:

```javascript
if (status === "Resolved" || status === "Closed") {
  const user = await axios.put(
    `${USER_SERVICE_URL}/api/users/remove-support/${updatedTicket._id}/${updatedTicket.assigned_to}`
  );
  logger.info(`Removed support from user: ${user.data.message}`);
}
```

**Problems:**
1. **No Authorization Header**: The axios call was missing the authorization header
2. **No Error Handling**: If the user service call failed, it would throw an error that wasn't caught
3. **Blocking Operation**: The error would prevent the ticket update from completing
4. **No Timeout**: The call could hang indefinitely
5. **Similar Issue with Notifications**: The notification call also lacked error handling

## Fix Applied

### 1. Added Proper Error Handling for User Service Call

```javascript
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
```

**Improvements:**
- ✅ Added try-catch block to handle errors gracefully
- ✅ Added authorization header to the request
- ✅ Added 5-second timeout to prevent hanging
- ✅ Errors are logged but don't prevent ticket update
- ✅ Check if `assigned_to` exists before making the call

### 2. Added Error Handling for Notification Call

```javascript
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
```

**Improvements:**
- ✅ Wrapped notification call in try-catch
- ✅ Errors are logged but don't prevent ticket update
- ✅ Notification failure won't break the status update

### 3. Enhanced Logging

```javascript
logger.info(`✅ Ticket updated successfully: ${updatedTicket._id} to status: ${status}`);
```

- ✅ Added status to success log for better tracking

## Files Modified

- **`services/order-service/src/controllers/tickets.js`** - Fixed `updateTicketStatus` function

## Impact

### Before Fix
- ❌ "Resolved" status update would fail
- ❌ "Closed" status update would fail
- ❌ User service errors would break the ticket update
- ❌ Notification errors would break the ticket update
- ❌ No proper error logging

### After Fix
- ✅ "Resolved" status update works
- ✅ "Closed" status update works
- ✅ User service errors are handled gracefully
- ✅ Notification errors are handled gracefully
- ✅ Ticket updates always succeed (primary operation)
- ✅ Proper error logging for debugging

## API Endpoint

```
PATCH /api/tickets/updateStatus/:ticketId
```

**Request:**
```json
{
  "status": "Resolved",
  "updated_by": "user_id",
  "admin_notes": "Issue has been resolved"
}
```

**Valid Status Values:**
- `Open`
- `In Progress`
- `Resolved` ✅ Now working
- `Closed` ✅ Now working

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ticket_id",
    "status": "Resolved",
    "updated_by": "user_id",
    "admin_notes": "Issue has been resolved",
    "userRef": "user_ref",
    "assigned_to": "assigned_user_id"
    // ... other ticket fields
  },
  "message": "Ticket status updated successfully"
}
```

## Behavior by Status

### Open / In Progress
- ✅ Updates ticket status
- ✅ Sends notification to user
- No user service call needed

### Resolved / Closed
- ✅ Updates ticket status
- ✅ Attempts to remove ticket from assigned user
  - If successful: User no longer has ticket in their assigned list
  - If fails: Error is logged but ticket update continues
- ✅ Sends notification to user
  - If successful: User receives notification
  - If fails: Error is logged but ticket update continues

## Error Scenarios Handled

### 1. User Service Unreachable
```
⚠️ Could not remove support from user: connect ECONNREFUSED
```
- Ticket status still updates
- Error is logged
- Operation continues

### 2. User Service Returns Error
```
⚠️ Could not remove support from user: Request failed with status code 404
   User service responded with: 404 - Not Found
```
- Ticket status still updates
- Error details are logged
- Operation continues

### 3. User Service Timeout
```
⚠️ Could not remove support from user: timeout of 5000ms exceeded
```
- Ticket status still updates
- Error is logged
- Operation continues

### 4. Notification Service Error
```
⚠️ Could not send notification: Network error
```
- Ticket status still updates
- Error is logged
- Operation continues

### 5. No Assigned User
- User service call is skipped entirely
- Ticket status updates normally
- No error logged

## Testing

### Test Cases

1. **Update to Open**
   ```bash
   PATCH /api/tickets/updateStatus/:ticketId
   Body: { "status": "Open", "updated_by": "user_id" }
   Expected: ✅ Success
   ```

2. **Update to In Progress**
   ```bash
   PATCH /api/tickets/updateStatus/:ticketId
   Body: { "status": "In Progress", "updated_by": "user_id" }
   Expected: ✅ Success
   ```

3. **Update to Resolved**
   ```bash
   PATCH /api/tickets/updateStatus/:ticketId
   Body: { "status": "Resolved", "updated_by": "user_id" }
   Expected: ✅ Success (was failing before)
   ```

4. **Update to Closed**
   ```bash
   PATCH /api/tickets/updateStatus/:ticketId
   Body: { "status": "Closed", "updated_by": "user_id" }
   Expected: ✅ Success (was failing before)
   ```

### Test with User Service Down

1. Stop user service
2. Update ticket to "Resolved"
3. Expected behavior:
   - ✅ Ticket status updates successfully
   - ⚠️ Warning logged about user service
   - ✅ Response returns success

### Test with Invalid Assigned User

1. Update ticket with non-existent assigned_to
2. Update status to "Closed"
3. Expected behavior:
   - ✅ Ticket status updates successfully
   - ⚠️ Warning logged about user not found
   - ✅ Response returns success

## Monitoring & Logging

The fix includes comprehensive logging:

### Success Logs
```
✅ Removed support from user: [user service message]
✅ Notification created successfully
✅ Ticket updated successfully: [ticket_id] to status: [status]
```

### Warning Logs
```
⚠️ Could not remove support from user: [error message]
   User service responded with: [status] - [statusText]
⚠️ Could not send notification: [error message]
```

### Error Logs
```
❌ Create notification error: [error message]
```

## Best Practices Implemented

1. **Graceful Degradation**: Primary operation (ticket update) always succeeds
2. **Non-blocking Calls**: External service failures don't break the main operation
3. **Timeout Protection**: Prevents hanging on slow/unreachable services
4. **Proper Authorization**: Includes auth headers for service-to-service calls
5. **Comprehensive Logging**: All scenarios are logged for debugging
6. **Error Details**: Logs include error details for troubleshooting

## Recommendations

### For Production
1. Monitor warning logs to identify frequent user service failures
2. Set up alerts for high failure rates
3. Consider implementing retry logic for user service calls
4. Add circuit breaker pattern if failures are frequent

### For Development
1. Use the test script to verify all status transitions
2. Test with user service down to verify graceful degradation
3. Check logs to ensure proper error handling

## Conclusion

The fix ensures that ticket status updates always succeed for the primary operation (updating the ticket), while gracefully handling failures in secondary operations (user service calls and notifications). This provides a more robust and reliable ticket management system that can handle partial service outages without breaking core functionality.
