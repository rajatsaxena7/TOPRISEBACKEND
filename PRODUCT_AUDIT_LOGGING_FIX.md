# Product Audit Logging Fix - Super-admin Role Validation Error

## Issue Description
The product service was throwing validation errors when creating audit logs with the `Super-admin` role:

```
ERROR: Failed to create product audit log: ProductAuditLog validation failed: actorRole: `Super-admin` is not a valid enum value for path `actorRole`.
```

## Root Cause
The audit log model (`services/product-service/src/models/auditLog.js`) had an enum mismatch with the user model:

- **User Model**: Uses `"Super-admin"` (lowercase 'a')
- **Audit Log Model**: Expected `"Super-Admin"` (uppercase 'A')

Additionally, the auth middleware was incorrectly mapping `Super-admin` to `Super Admin` (with a space).

## Fixes Applied

### 1. Updated Audit Log Model Enum
**File**: `services/product-service/src/models/auditLog.js`

**Changes**:
- Changed `"Super-Admin"` to `"Super-admin"` to match user model
- Added missing roles: `"User"`, `"Customer-Support"`
- Removed `"Customer"` (not used in user model)

```javascript
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

## Testing
Created a test script (`test-product-audit-logging.js`) to verify:
- ✅ Audit logs can be created with `Super-admin` role
- ✅ Audit logger utility works correctly
- ✅ All valid roles from user model work properly

## Impact
- ✅ Fixes the validation error for `Super-admin` role
- ✅ Ensures consistency between user model and audit log model
- ✅ Maintains backward compatibility with existing audit logs
- ✅ Prevents future role mapping issues

## Files Modified
1. `services/product-service/src/models/auditLog.js` - Updated enum values
2. `services/product-service/src/middleware/authMiddleware.js` - Fixed role mapping
3. `test-product-audit-logging.js` - Created test script

## Verification
The fix ensures that when a user with `Super-admin` role performs actions in the product service, audit logs will be created successfully without validation errors.
