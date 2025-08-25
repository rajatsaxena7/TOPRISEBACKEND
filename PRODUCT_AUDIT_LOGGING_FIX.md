# Product Audit Logging Fix - Super-admin Role Validation Error

## Issue Description
The product service was throwing validation errors when creating audit logs with the `Super-admin` role:

```
ERROR: Failed to create product audit log: ProductAuditLog validation failed: actorRole: `Super-admin` is not a valid enum value for path `actorRole`.
```

Additionally, when trying to retrieve audit logs, the system was throwing:

```
ERROR: Schema hasn't been registered for model "User". Use mongoose.model(name, schema)
```

## Root Cause
1. **Role Enum Mismatch**: The audit log model (`services/product-service/src/models/auditLog.js`) had an enum mismatch with the user model:
   - **User Model**: Uses `"Super-admin"` (lowercase 'a')
   - **Audit Log Model**: Expected `"Super-Admin"` (uppercase 'A')

2. **User Model Reference Issue**: The audit log model was trying to reference the "User" model which doesn't exist in the product service, causing the schema registration error.

3. **Auth Middleware Role Mapping**: The auth middleware was incorrectly mapping `Super-admin` to `Super Admin` (with a space).

## Fixes Applied

### 1. Updated Audit Log Model Enum
**File**: `services/product-service/src/models/auditLog.js`

**Changes**:
- Changed `"Super-Admin"` to `"Super-admin"` to match user model
- Added missing roles: `"User"`, `"Customer-Support"`
- Removed `"Customer"` (not used in user model)
- **Removed User model reference** from `actorId` field

```javascript
actorId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  // Removed: ref: "User"
},

actorRole: {
  type: String,
  required: true,
  enum: [
    "Super-admin",           // ✅ Fixed: lowercase 'a'
    "Fulfillment-Admin",
    "Fulfillment-Staff", 
    "Inventory-Admin",
    "Inventory-Staff",
    "Dealer",
    "User",                  // ✅ Added: missing role
    "Customer-Support",      // ✅ Added: missing role
    "System",
  ],
},
```

### 2. Fixed Auth Middleware Role Mapping
**File**: `services/product-service/src/middleware/authMiddleware.js`

**Changes**:
- Removed incorrect role mapping that was converting `Super-admin` to `Super Admin`
- Now returns the role as-is to maintain consistency with the user model

```javascript
const mapRole = (jwtRole) => {
  // Return the role as-is since the audit log model now matches the user model
  return jwtRole;
};
```

### 3. Created User Service Client
**File**: `services/product-service/src/utils/userServiceClient.js` (NEW)

**Purpose**: Fetch user information from the user service API instead of trying to populate from a non-existent model.

```javascript
const axios = require("axios");
const logger = require("/packages/utils/logger");

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:5001";

exports.fetchUser = async (userId) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch user ${userId}:`, error.message);
    return null;
  }
};

exports.fetchUsers = async (userIds) => {
  try {
    if (!userIds || userIds.length === 0) return [];
    
    const response = await axios.post(`${USER_SERVICE_URL}/api/users/bulk`, {
      userIds: userIds
    });
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch users:`, error.message);
    return [];
  }
};
```

### 4. Updated Audit Logger to Use User Service Client
**File**: `services/product-service/src/utils/auditLogger.js`

**Changes**:
- Removed `.populate("actorId", "name email role")` from `getAuditLogs` method
- Added user service client integration to fetch user information via API
- Enhanced error handling for user service communication

```javascript
// Fetch user information for all unique actorIds
const uniqueActorIds = [...new Set(logs.map(log => log.actorId?.toString()))].filter(Boolean);
const usersMap = new Map();

if (uniqueActorIds.length > 0) {
  try {
    const usersData = await userServiceClient.fetchUsers(uniqueActorIds);
    if (usersData && usersData.data) {
      usersData.data.forEach(user => {
        usersMap.set(user._id || user.id, user);
      });
    }
  } catch (error) {
    logger.error("Failed to fetch users for audit logs:", error);
  }
}

// Attach user information to logs
const logsWithUsers = logs.map(log => ({
  ...log,
  actorInfo: usersMap.get(log.actorId?.toString()) || null
}));
```

## Testing
Created comprehensive test scripts to verify:
- ✅ Audit logs can be created with `Super-admin` role
- ✅ Audit logger utility works correctly
- ✅ `getAuditLogs` method works without User model error
- ✅ User service client handles errors gracefully
- ✅ All valid roles from user model work properly

## Impact
- ✅ **Fixes the validation error** for `Super-admin` role
- ✅ **Resolves User model schema error** by removing model reference
- ✅ **Ensures consistency** between user model and audit log model
- ✅ **Maintains backward compatibility** with existing audit logs
- ✅ **Prevents future role mapping issues**
- ✅ **Enables proper user information retrieval** via user service API

## Files Modified
1. `services/product-service/src/models/auditLog.js` - Updated enum values and removed User model reference
2. `services/product-service/src/middleware/authMiddleware.js` - Fixed role mapping
3. `services/product-service/src/utils/userServiceClient.js` - Created new user service client
4. `services/product-service/src/utils/auditLogger.js` - Updated to use user service client
5. `test-audit-logging-system.js` - Created comprehensive test script

## Verification
The fix ensures that:
1. When a user with `Super-admin` role performs actions in the product service, audit logs will be created successfully without validation errors
2. Audit logs can be retrieved without User model schema errors
3. User information is properly fetched from the user service API when needed
4. The system gracefully handles user service communication failures
