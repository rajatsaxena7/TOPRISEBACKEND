# Revoke Role Endpoint Fix

## Problem
The `revoke-role` endpoint was returning `{"success": false, "message": "User not found"}` even when the user and employee existed. The issue was that the endpoint was designed to accept either a user ID or an employee ID, but the actual usage pattern was that the `id` parameter is **always** an employee ID.

## Root Cause
The original implementation in `services/user-service/src/controllers/user.js` was trying to handle both user IDs and employee IDs as the `id` parameter, but the user clarified that the `id` parameter passed to this endpoint is **always** an employee ID, and the user ID is nested within the employee object.

## Solution
Modified the `revokeRole` function to correctly handle the employee ID parameter:

1. **Employee-First Logic**: The function now treats the `id` parameter as an employee ID and directly searches for the employee.

2. **User Lookup**: Once the employee is found, it uses the employee's `user_id` to find the associated user.

3. **Consistent Updates**: Both the user's and employee's roles are updated to "User".

4. **Better Error Handling**: More specific error messages for different scenarios.

## Updated Code
```javascript
exports.revokeRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // The id parameter is always an employee ID
    const employee = await Employee.findById(id);
    
    if (!employee) {
      return sendError(res, "Employee not found", 404);
    }
    
    // Get the user using the employee's user_id
    const user = await User.findById(employee.user_id);
    
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    
    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { role: "User" },
      { new: true }
    );
    
    // Update employee role
    const updatedEmployee = await Employee.findByIdAndUpdate(
      employee._id,
      { role: "User" },
      { new: true }
    );
    
    logger.info(`Revoked role for employee: ${employee._id}, user: ${user._id} (${user.email || user.phone_Number})`);
    sendSuccess(res, { user: updatedUser, employee: updatedEmployee }, "Role revoked to User");
  } catch (err) {
    logger.error(`Revoke role error: ${err.message}`);
    sendError(res, err);
  }
};
```

## API Endpoint
- **URL**: `PUT /api/users/revoke-role/:id`
- **Authentication**: Required (Bearer token)
- **Authorization**: Super-admin only
- **Parameters**: 
  - `id` (path parameter): **Always** an employee ID (not a user ID)

## Usage Examples

### Using Employee ID (Correct Usage)
```bash
curl -X PUT "http://localhost:3001/api/users/revoke-role/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Note**: The `id` parameter must be an employee ID. The function will automatically find the associated user using the employee's `user_id` field.

## Response Format
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "User",
      // ... other user fields
    },
    "employee": {
      "_id": "507f1f77bcf86cd799439012",
      "user_id": "507f1f77bcf86cd799439011",
      "role": "User",
      // ... other employee fields
    }
  },
  "message": "Role revoked to User"
}
```

## Error Responses

### Employee Not Found (404)
```json
{
  "success": false,
  "message": "Employee not found"
}
```

### User Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

## Testing
A comprehensive test script is available at `test-revoke-role-fix.js` that tests:
1. Revoking role using valid Employee ID
2. Revoking role using invalid Employee ID

To run the tests:
```bash
cd services/user-service
node test-revoke-role-fix.js
```

## Benefits
1. **Clear Parameter Usage**: The `id` parameter is always an employee ID, eliminating confusion
2. **Consistent Behavior**: The function always follows the same logic flow
3. **Better Error Messages**: Specific error messages for employee not found vs user not found
4. **Comprehensive Updates**: Both user and employee roles are updated
5. **Better Logging**: More detailed logging for debugging purposes
6. **Simplified Logic**: No need to handle multiple ID types, making the code cleaner and more maintainable
