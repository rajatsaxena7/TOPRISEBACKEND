# Product Service Audit Logging Fix

## Problem
The audit logs in the product service were not displaying any logs, showing the warning:
```
WARN: Product audit log skipped for AUDIT_LOGS_ACCESSED - no user information available (user: null)
```

## Root Cause
The product routes were using the old authentication middleware from `/packages/utils/authMiddleware` which only populated `req.user` with basic information (`{ id: decoded.id, role: decoded.role }`), while the audit logger expected a more complete user object with additional fields like `name`, `email`, etc.

## Solution

### 1. Updated Product Routes
Modified `services/product-service/src/route/product.js` to:
- Import the new authentication middleware: `optionalAuth` from `../middleware/authMiddleware`
- Import the audit logger: `ProductAuditLogger` from `../utils/auditLogger`
- Apply `optionalAuth` middleware before the audit logging middleware on key routes

### 2. Updated Category Routes
Modified `services/product-service/src/route/categoryRoutes.js` to:
- Import the new authentication middleware and audit logger
- Apply audit logging to category CRUD operations

### 3. Routes with Audit Logging Added

#### Product Routes:
- `POST /createProduct` - `PRODUCT_CREATED`
- `PUT /updateProduct/:id` - `PRODUCT_UPDATED`
- `PATCH /reject/:id` - `PRODUCT_REJECTED`
- `PATCH /approve/:id` - `PRODUCT_APPROVED`
- `POST /` (bulk upload) - `BULK_PRODUCTS_UPLOADED`
- `PATCH /bulk/approve` - `BULK_PRODUCTS_APPROVED`
- `PATCH /bulk/reject` - `BULK_PRODUCTS_REJECTED`
- `PUT /update-stockByDealer/:id` - `PRODUCT_STOCK_UPDATED`

#### Category Routes:
- `POST /` - `CATEGORY_CREATED`
- `PUT /:id` - `CATEGORY_UPDATED`
- `DELETE /:id` - `CATEGORY_DELETED`

### 4. Middleware Order
The correct middleware order is:
1. `optionalAuth` - Populates `req.user` from JWT token
2. `ProductAuditLogger.createMiddleware()` - Logs the action with user info
3. `authenticate` - Old middleware for role-based authorization
4. `authorizeRoles()` - Role checking
5. Controller function

## Key Changes

### Before:
```javascript
router.put(
  "/updateProduct/:id",
  authenticate,  // Old middleware - limited user info
  authorizeRoles("Super-admin", "Inventory-Admin", "Dealer"),
  productController.editProductSingle
);
```

### After:
```javascript
router.put(
  "/updateProduct/:id",
  optionalAuth,  // New middleware - complete user info
  ProductAuditLogger.createMiddleware("PRODUCT_UPDATED", "Product", "PRODUCT_MANAGEMENT"),
  authenticate,  // Old middleware - role authorization
  authorizeRoles("Super-admin", "Inventory-Admin", "Dealer"),
  productController.editProductSingle
);
```

## Authentication Middleware Comparison

### Old Middleware (`/packages/utils/authMiddleware`):
```javascript
req.user = { id: decoded.id, role: decoded.role };
```

### New Middleware (`../middleware/authMiddleware`):
```javascript
req.user = {
  id: decoded.id || decoded._id,
  _id: decoded.id || decoded._id,
  name: decoded.name,
  email: decoded.email,
  role: mappedRole,  // Role mapping applied
  ...decoded
};
```

## Testing

### Test Script
Created `test-product-audit-logging.js` to verify:
1. Audit logs endpoint accessibility
2. Authentication middleware functionality
3. Audit logging capture
4. User information processing

### Manual Testing
1. Make a request to any product route with a valid JWT token
2. Check the audit logs endpoint: `GET /api/audit/logs`
3. Verify that the action is logged with proper user information

## Expected Behavior

### With Authentication:
- Audit logs will be created with complete user information
- User ID, name, email, and role will be captured
- Actions will be properly categorized and logged

### Without Authentication:
- Audit logs will be skipped (warning logged)
- Endpoints will still work but without audit trail
- No errors will be thrown

## Files Modified

1. `services/product-service/src/route/product.js`
2. `services/product-service/src/route/categoryRoutes.js`
3. `test-product-audit-logging.js` (new test file)

## Verification

To verify the fix is working:

1. Start the product service
2. Run the test script: `node test-product-audit-logging.js`
3. Check the audit logs endpoint with authentication
4. Verify that user information is properly populated in the logs

The audit logs should now display properly with complete user information from the JWT token headers.
