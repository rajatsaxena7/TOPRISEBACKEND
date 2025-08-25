# User Service Audit Log Endpoints - Complete Guide

This document provides a comprehensive list of all audit log endpoints available in the user service.

## 🔍 **Primary Audit Log Endpoints**

### 1. **Get All Audit Logs**
```bash
GET /api/audit/logs
```
- **Purpose**: Retrieve all audit logs with pagination and filtering
- **Authentication**: Required (Super-admin, System roles)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `actorId`: Filter by user who performed action
  - `targetType`: Filter by target type (User, Dealer, Employee, etc.)
  - `category`: Filter by category (USER_MANAGEMENT, etc.)
  - `startDate`: Filter from date
  - `endDate`: Filter to date
  - `severity`: Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)

### 2. **Get Audit Log Statistics**
```bash
GET /api/audit/stats
```
- **Purpose**: Get audit log statistics and summaries
- **Authentication**: Required (Super-admin, System roles)
- **Returns**: 
  - Total audit logs count
  - Actions breakdown
  - User activity summary
  - Category-wise statistics

### 3. **Get Audit Dashboard**
```bash
GET /api/audit/dashboard
```
- **Purpose**: Get audit dashboard data and visualizations
- **Authentication**: Required (Super-admin, System roles)

### 4. **Get Audit Logs by Action**
```bash
GET /api/audit/logs/action/:action
```
- **Purpose**: Get audit logs for a specific action type
- **Authentication**: Required (Super-admin, System roles)
- **Parameters**: `action` - The action type to filter by

### 5. **Get Audit Logs by User**
```bash
GET /api/audit/logs/user/:userId
```
- **Purpose**: Get audit logs for a specific user
- **Authentication**: Required (Super-admin, System roles)
- **Parameters**: `userId` - The user ID to get logs for

### 6. **Get Audit Logs by Target**
```bash
GET /api/audit/logs/target/:targetType/:targetId
```
- **Purpose**: Get audit logs for a specific target
- **Authentication**: Required (Super-admin, System roles)
- **Parameters**: 
  - `targetType` - Type of target (User, Dealer, Employee, etc.)
  - `targetId` - ID of the target

### 7. **Get Audit Logs by Category**
```bash
GET /api/audit/logs/category/:category
```
- **Purpose**: Get audit logs for a specific category
- **Authentication**: Required (Super-admin, System roles)
- **Parameters**: `category` - The category to filter by

### 8. **Get Bulk Operation Logs**
```bash
GET /api/audit/logs/bulk/:bulkOperationId
```
- **Purpose**: Get audit logs for a specific bulk operation
- **Authentication**: Required (Super-admin, System roles)
- **Parameters**: `bulkOperationId` - The bulk operation ID

### 9. **Get Login Attempt Logs**
```bash
GET /api/audit/logs/login-attempts
```
- **Purpose**: Get login attempt audit logs
- **Authentication**: Required (Super-admin, System roles)

### 10. **Get Security Event Logs**
```bash
GET /api/audit/logs/security-events
```
- **Purpose**: Get security event audit logs
- **Authentication**: Required (Super-admin, System roles)

### 11. **Export Audit Logs**
```bash
GET /api/audit/export
```
- **Purpose**: Export audit logs to CSV format
- **Authentication**: Required (Super-admin, System roles)

## 📊 **User-Specific Audit Endpoints**

### 12. **Get User Audit Logs**
```bash
GET /api/users/:userId/audit-logs
```
- **Purpose**: Get audit logs for a specific user
- **Authentication**: Required (Super-admin, Fulfillment-Admin, Inventory-Admin)
- **Parameters**: `userId` - The user ID to get logs for
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `startDate`: Filter from date
  - `endDate`: Filter to date

### 13. **Get Dealer Audit Logs**
```bash
GET /api/users/dealer/:dealerId/audit-logs
```
- **Purpose**: Get audit logs for a specific dealer
- **Authentication**: Required (Super-admin, Fulfillment-Admin)
- **Parameters**: `dealerId` - The dealer ID to get logs for
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `startDate`: Filter from date
  - `endDate`: Filter to date

### 14. **Get Employee Audit Logs**
```bash
GET /api/users/employee/:employeeId/audit-logs
```
- **Purpose**: Get audit logs for a specific employee
- **Authentication**: Required (Super-admin, Fulfillment-Admin)
- **Parameters**: `employeeId` - The employee ID to get logs for
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `startDate`: Filter from date
  - `endDate`: Filter to date

## 🎯 **Action-Specific Filtering Examples**

### User Management Logs
```bash
GET /api/audit/logs?action=USER_CREATED
GET /api/audit/logs?action=USER_UPDATED,USER_DELETED
```

### Authentication Logs
```bash
GET /api/audit/logs?action=LOGIN_ATTEMPT_SUCCESS,LOGIN_ATTEMPT_FAILED
GET /api/audit/logs?action=USER_LOGIN,USER_LOGOUT
```

### Dealer Management Logs
```bash
GET /api/audit/logs?action=DEALER_CREATED,DEALER_UPDATED,DEALER_ACTIVATED
```

### Employee Management Logs
```bash
GET /api/audit/logs?action=EMPLOYEE_CREATED,EMPLOYEE_UPDATED,EMPLOYEE_ASSIGNED_TO_DEALER
```

### Security Event Logs
```bash
GET /api/audit/logs?action=ACCOUNT_LOCKED,ACCOUNT_UNLOCKED,SECURITY_SETTINGS_CHANGED
```

## 🔧 **Testing These Endpoints**

### Generate JWT Token
```bash
JWT_SECRET="your-secret-key"
TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  id: '507f1f77bcf86cd799439011',
  role: 'Super-admin',
  name: 'Test Admin',
  email: 'admin@test.com'
}, '$JWT_SECRET', { expiresIn: '1h' });
console.log(token);
")

BASE_URL="http://localhost:5001"
HEADERS="-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'"
```

### Test Commands

#### Get All Audit Logs
```bash
curl -X GET "$BASE_URL/api/audit/logs" $HEADERS
```

#### Get Audit Logs with Filters
```bash
curl -X GET "$BASE_URL/api/audit/logs?action=USER_CREATED&limit=20" $HEADERS
```

#### Get Audit Statistics
```bash
curl -X GET "$BASE_URL/api/audit/stats" $HEADERS
```

#### Get User-Specific Audit Logs
```bash
curl -X GET "$BASE_URL/api/users/USER-TEST-001/audit-logs" $HEADERS
```

#### Get Dealer-Specific Audit Logs
```bash
curl -X GET "$BASE_URL/api/users/dealer/DEALER-TEST-001/audit-logs" $HEADERS
```

#### Get Employee-Specific Audit Logs
```bash
curl -X GET "$BASE_URL/api/users/employee/EMPLOYEE-TEST-001/audit-logs" $HEADERS
```

## 📋 **Sample Response Structure**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "audit_log_id",
        "action": "USER_CREATED",
        "actorId": "user_id",
        "actorRole": "Super-admin",
        "actorName": "John Doe",
        "targetId": "user_id",
        "targetIdentifier": "user@example.com",
        "details": {
          "method": "POST",
          "url": "/api/users/createUser",
          "statusCode": 201,
          "requestBody": {
            "name": "Test User",
            "email": "user@example.com",
            "role": "User"
          },
          "queryParams": {}
        },
        "oldValues": null,
        "newValues": {
          "name": "Test User",
          "email": "user@example.com",
          "role": "User"
        },
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "sessionId": "session_123",
        "severity": "LOW",
        "category": "USER_MANAGEMENT",
        "timestamp": "2024-01-01T10:00:00Z",
        "actor": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "admin@example.com",
          "role": "Super-admin"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  },
  "message": "Audit logs fetched successfully"
}
```

## 🎯 **Available Audit Log Actions**

### User Management Actions
- `USER_CREATED` - User creation
- `USER_UPDATED` - User updates
- `USER_DELETED` - User deletion
- `USER_ACTIVATED` - User activation
- `USER_DEACTIVATED` - User deactivation
- `USER_LOGIN` - User login
- `USER_LOGOUT` - User logout
- `USER_PASSWORD_CHANGED` - Password changes
- `USER_PASSWORD_RESET` - Password resets
- `USER_EMAIL_VERIFIED` - Email verification
- `USER_PHONE_VERIFIED` - Phone verification
- `USER_PROFILE_UPDATED` - Profile updates
- `USER_AVATAR_UPDATED` - Avatar updates
- `USER_PREFERENCES_UPDATED` - Preference updates
- `USER_ACCOUNT_CHECKED` - Account verification
- `USER_CART_ID_UPDATED` - Cart ID updates
- `USER_BY_EMAIL_ACCESSED` - Email-based user access

### Role and Permission Actions
- `ROLE_ASSIGNED` - Role assignment
- `ROLE_REVOKED` - Role revocation
- `ROLE_CHANGED` - Role changes
- `PERMISSION_GRANTED` - Permission granting
- `PERMISSION_REVOKED` - Permission revocation
- `PERMISSION_MATRIX_UPDATED` - Permission matrix updates
- `ACCESS_LEVEL_CHANGED` - Access level changes

### Dealer Management Actions
- `DEALER_CREATED` - Dealer creation
- `DEALER_UPDATED` - Dealer updates
- `DEALER_DELETED` - Dealer deletion
- `DEALER_ACTIVATED` - Dealer activation
- `DEALER_DEACTIVATED` - Dealer deactivation
- `DEALER_APPROVED` - Dealer approval
- `DEALER_REJECTED` - Dealer rejection
- `DEALER_BANK_DETAILS_UPDATED` - Bank details updates
- `DEALER_KYC_UPDATED` - KYC updates
- `DEALER_DOCUMENTS_UPLOADED` - Document uploads
- `DEALER_DOCUMENTS_VERIFIED` - Document verification
- `DEALER_DOCUMENTS_REJECTED` - Document rejection
- `DEALER_ADDRESS_UPDATED` - Address updates
- `DEALER_CONTACT_UPDATED` - Contact updates
- `DEALER_STATS_ACCESSED` - Stats access
- `ALLOWED_CATEGORIES_ADDED` - Category additions
- `ALLOWED_CATEGORIES_REMOVED` - Category removals

### Employee Management Actions
- `EMPLOYEE_CREATED` - Employee creation
- `EMPLOYEE_UPDATED` - Employee updates
- `EMPLOYEE_DELETED` - Employee deletion
- `EMPLOYEE_ACTIVATED` - Employee activation
- `EMPLOYEE_DEACTIVATED` - Employee deactivation
- `EMPLOYEE_ROLE_CHANGED` - Role changes
- `EMPLOYEE_PERMISSIONS_UPDATED` - Permission updates
- `EMPLOYEES_ASSIGNED_TO_DEALER` - Dealer assignments
- `EMPLOYEES_REMOVED_FROM_DEALER` - Dealer removals
- `EMPLOYEE_ASSIGNMENT_STATUS_UPDATED` - Assignment status updates

### Authentication and Security Actions
- `LOGIN_ATTEMPT_SUCCESS` - Successful login attempts
- `LOGIN_ATTEMPT_FAILED` - Failed login attempts
- `ACCOUNT_LOCKED` - Account locking
- `ACCOUNT_UNLOCKED` - Account unlocking
- `SESSION_CREATED` - Session creation
- `SESSION_DESTROYED` - Session destruction
- `TOKEN_GENERATED` - Token generation
- `TOKEN_REVOKED` - Token revocation
- `TOKEN_REFRESHED` - Token refresh
- `PASSWORD_POLICY_UPDATED` - Password policy updates
- `SECURITY_SETTINGS_CHANGED` - Security setting changes

### Contact and Support Actions
- `CONTACT_FORM_SUBMITTED` - Contact form submissions
- `CONTACT_FORM_PROCESSED` - Contact form processing
- `CONTACT_FORM_REPLIED` - Contact form replies
- `CONTACT_FORM_CLOSED` - Contact form closure
- `SUPPORT_ASSIGNED` - Support assignment
- `SUPPORT_REMOVED` - Support removal

### App Configuration Actions
- `APP_SETTING_CREATED` - App setting creation
- `APP_SETTING_UPDATED` - App setting updates
- `APP_SETTING_DELETED` - App setting deletion
- `APP_CONFIGURATION_CHANGED` - Configuration changes

### SLA Configuration Actions
- `SLA_CONFIG_CREATED` - SLA config creation
- `SLA_CONFIG_UPDATED` - SLA config updates
- `SLA_CONFIG_DELETED` - SLA config deletion
- `SLA_RULES_CHANGED` - SLA rule changes

### System Actions
- `USER_SYNC_STARTED` - User sync start
- `USER_SYNC_COMPLETED` - User sync completion
- `USER_SYNC_FAILED` - User sync failure
- `BULK_USER_IMPORT` - Bulk user import
- `BULK_USER_EXPORT` - Bulk user export
- `USER_DATA_BACKUP` - User data backup
- `USER_DATA_RESTORE` - User data restore
- `REPORT_GENERATED` - Report generation
- `REPORT_EXPORTED` - Report export
- `DASHBOARD_ACCESSED` - Dashboard access
- `SYSTEM_MAINTENANCE` - System maintenance
- `DATA_CLEANUP_EXECUTED` - Data cleanup

### Vehicle and Address Actions
- `VEHICLE_ADDED` - Vehicle addition
- `VEHICLE_UPDATED` - Vehicle updates
- `VEHICLE_DELETED` - Vehicle deletion
- `VEHICLES_ACCESSED` - Vehicle access
- `ADDRESS_UPDATED` - Address updates
- `ADDRESS_EDITED` - Address editing
- `ADDRESS_DELETED` - Address deletion
- `ADDRESSES_ACCESSED` - Address access

### Bank Details Actions
- `BANK_DETAILS_ADDED` - Bank details addition
- `BANK_DETAILS_UPDATED` - Bank details updates
- `BANK_DETAILS_DELETED` - Bank details deletion
- `BANK_DETAILS_ACCESSED` - Bank details access
- `BANK_DETAILS_BY_ACCOUNT_ACCESSED` - Account-based access
- `IFSC_VALIDATION_ACCESSED` - IFSC validation

### FCM and Wishlist Actions
- `FCM_TOKEN_UPDATED` - FCM token updates
- `WISHLIST_ID_UPDATED` - Wishlist ID updates

### Bulk Operations
- `BULK_DEALERS_CREATED` - Bulk dealer creation
- `BULK_EMPLOYEES_ASSIGNED` - Bulk employee assignment

### Audit Log Access Actions
- `AUDIT_LOGS_ACCESSED` - Audit logs access
- `AUDIT_STATS_ACCESSED` - Audit stats access
- `AUDIT_DASHBOARD_ACCESSED` - Audit dashboard access
- `AUDIT_LOGS_BY_ACTION_ACCESSED` - Action-based audit access
- `AUDIT_LOGS_BY_USER_ACCESSED` - User-based audit access
- `AUDIT_LOGS_BY_TARGET_ACCESSED` - Target-based audit access
- `AUDIT_LOGS_BY_CATEGORY_ACCESSED` - Category-based audit access
- `BULK_OPERATION_LOGS_ACCESSED` - Bulk operation logs access
- `LOGIN_ATTEMPT_LOGS_ACCESSED` - Login attempt logs access
- `SECURITY_EVENT_LOGS_ACCESSED` - Security event logs access
- `AUDIT_LOGS_EXPORTED` - Audit logs export
- `USER_AUDIT_LOGS_ACCESSED` - User-specific audit logs access
- `DEALER_AUDIT_LOGS_ACCESSED` - Dealer-specific audit logs access
- `EMPLOYEE_AUDIT_LOGS_ACCESSED` - Employee-specific audit logs access

### Access Actions
- `USER_LIST_ACCESSED` - User list access
- `USER_DETAILS_ACCESSED` - User details access
- `USER_PROFILE_ACCESSED` - User profile access
- `USER_STATS_ACCESSED` - User stats access
- `USER_INSIGHTS_ACCESSED` - User insights access
- `DEALER_LIST_ACCESSED` - Dealer list access
- `DEALER_DETAILS_ACCESSED` - Dealer details access
- `DEALER_STATS_ACCESSED` - Dealer stats access
- `DEALER_BY_CATEGORY_ACCESSED` - Category-based dealer access
- `DEALER_FOR_ASSIGNMENT_ACCESSED` - Assignment-based dealer access
- `EMPLOYEE_LIST_ACCESSED` - Employee list access
- `EMPLOYEE_DETAILS_ACCESSED` - Employee details access
- `EMPLOYEE_STATS_ACCESSED` - Employee stats access
- `EMPLOYEE_ASSIGNMENTS_ACCESSED` - Employee assignments access

## 🛡️ **Security and Access Control**

### Role-Based Access
- **Super-admin**: Access to all audit log endpoints
- **System**: Access to all audit log endpoints
- **Fulfillment-Admin**: Access to fulfillment-related audit logs
- **Inventory-Admin**: Access to inventory-related audit logs
- **Dealer**: Access to dealer-specific audit logs
- **User**: Access to own audit logs

### Authentication Requirements
- All endpoints require valid JWT token
- Token must include user ID, role, and name
- Token expiration is checked on each request

## 📊 **Performance Considerations**

### Pagination
- All endpoints support pagination
- Default page size is 10 items
- Maximum page size is 100 items

### Filtering
- Multiple filters can be combined
- Date range filtering is optimized
- Action-based filtering is indexed

### Caching
- Audit log statistics are cached for 5 minutes
- User information is cached for 10 minutes
- Dealer information is cached for 15 minutes

## 🔧 **Troubleshooting**

### Common Issues

1. **Authentication Error (401)**
   - Check JWT token validity
   - Verify JWT secret matches
   - Ensure token hasn't expired

2. **Authorization Error (403)**
   - Verify user role has required permissions
   - Check role-based access control

3. **No Data Returned**
   - Check if audit logs exist for the specified criteria
   - Verify date range is correct
   - Ensure action names are valid

4. **Performance Issues**
   - Use pagination for large datasets
   - Apply specific filters to reduce data volume
   - Check if indexes are properly configured

### Debug Commands

```bash
# Test service health
curl -X GET "$BASE_URL/health"

# Test authentication
curl -X GET "$BASE_URL/api/audit/logs" \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Check response headers
curl -X GET "$BASE_URL/api/audit/logs" \
  -H "Authorization: Bearer $TOKEN" \
  -I
```

## 📈 **Monitoring and Alerts**

### Key Metrics to Monitor
- Audit log creation rate
- API response times
- Error rates by endpoint
- User activity patterns
- Security event trends

### Recommended Alerts
- High error rates on audit log endpoints
- Unusual audit log activity patterns
- Failed authentication attempts
- Performance degradation

This comprehensive audit logging system provides complete visibility into all user-related activities and ensures compliance with regulatory requirements.
