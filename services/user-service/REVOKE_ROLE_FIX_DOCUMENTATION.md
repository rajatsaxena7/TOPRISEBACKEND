# Revoke Role Fix Documentation

## Issue Description
The `revokeRole` endpoint was only updating the `User` table's `role` field to "User" but was not updating the corresponding `Employee` table's `role` field. This caused inconsistency where the user's role would be revoked in the user table but remain unchanged in the employee table.

## Root Cause
The original `revokeRole` function in `services/user-service/src/controllers/user.js` only performed:
```javascript
const user = await User.findByIdAndUpdate(id, { role: "User" }, { new: true });
```

It did not update the `Employee` table, which has its own `role` field that should be synchronized with the user's role.

## Solution
Modified the `revokeRole` function to update both the `User` and `Employee` tables:

```javascript
exports.revokeRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Update user role
    const user = await User.findByIdAndUpdate(
      id,
      { role: "User" },
      { new: true }
    );
    
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    
    // Update employee role if employee exists
    const employee = await Employee.findOneAndUpdate(
      { user_id: id },
      { role: "User" },
      { new: true }
    );
    
    logger.info(`Revoked role for user: ${id}`);
    sendSuccess(res, { user, employee }, "Role revoked to User");
  } catch (err) {
    logger.error(`Revoke role error: ${err.message}`);
    sendError(res, err);
  }
};
```

## Key Changes
1. **Added Employee table update**: The function now also updates the `Employee` table's `role` field to "User"
2. **Added user existence check**: Added a check to ensure the user exists before proceeding
3. **Enhanced response**: The response now includes both the updated user and employee objects
4. **Error handling**: Maintains the same error handling structure

## Testing

### Using curl
```bash
# Replace YOUR_JWT_TOKEN with actual token and USER_ID with actual user ID
curl -X PUT \
  http://localhost:3001/api/users/revoke-role/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using the test script
1. Update the `JWT_TOKEN` variable in `test-revoke-role-fix.js`
2. Run the test:
```bash
cd services/user-service
node test-revoke-role-fix.js
```

## Expected Behavior
- **For employees**: Both `User.role` and `Employee.role` should be set to "User"
- **For non-employees**: Only `User.role` should be set to "User" (no employee record exists)
- **Response**: Should return both updated user and employee objects (if employee exists)

## Files Modified
- `services/user-service/src/controllers/user.js` - Updated `revokeRole` function
- `services/user-service/test-revoke-role-fix.js` - Created test script
- `services/user-service/REVOKE_ROLE_FIX_DOCUMENTATION.md` - This documentation

## Dependencies
The `Employee` model was already imported in the user controller, so no additional imports were needed.
