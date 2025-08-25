# Order Audit Log Endpoints - Complete Guide

This document provides a comprehensive list of all audit log endpoints available in the order service.

## 🔍 **Primary Audit Log Endpoints**

### 1. **Get All Audit Logs**
```bash
GET /api/analytics/audit-logs
```
- **Purpose**: Retrieve all audit logs with pagination and filtering
- **Authentication**: Required (Super-admin, System roles)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `actorId`: Filter by user who performed action
  - `targetType`: Filter by target type (Order, SKU, etc.)
  - `category`: Filter by category (ORDER_MANAGEMENT, etc.)
  - `startDate`: Filter from date
  - `endDate`: Filter to date
  - `severity`: Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)

### 2. **Get Audit Log Statistics**
```bash
GET /api/analytics/audit-stats
```
- **Purpose**: Get audit log statistics and summaries
- **Authentication**: Required (Super-admin, System roles)
- **Returns**: 
  - Total audit logs count
  - Actions breakdown
  - User activity summary
  - Category-wise statistics

## 📊 **Order-Specific Audit Endpoints**

### 3. **Get Order Audit Logs**
```bash
GET /api/orders/:orderId/audit-logs
```
- **Purpose**: Get audit logs for a specific order
- **Authentication**: Required
- **Parameters**: `orderId` - The order ID to get logs for
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `startDate`: Filter from date
  - `endDate`: Filter to date

### 4. **Get User Order Activity**
```bash
GET /api/orders/user/:userId/audit-logs
```
- **Purpose**: Get audit logs for all orders by a specific user
- **Authentication**: Required
- **Parameters**: `userId` - The user ID to get logs for
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `startDate`: Filter from date
  - `endDate`: Filter to date

### 5. **Get Dealer Order Activity**
```bash
GET /api/orders/dealer/:dealerId/audit-logs
```
- **Purpose**: Get audit logs for all orders handled by a specific dealer
- **Authentication**: Required
- **Parameters**: `dealerId` - The dealer ID to get logs for
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `action`: Filter by specific action
  - `startDate`: Filter from date
  - `endDate`: Filter to date

## 🎯 **Action-Specific Filtering Examples**

### Order Creation Logs
```bash
GET /api/analytics/audit-logs?action=ORDER_CREATED
```

### Order Status Change Logs
```bash
GET /api/analytics/audit-logs?action=ORDER_STATUS_CHANGED
```

### SKU Operation Logs
```bash
GET /api/analytics/audit-logs?action=SKU_PACKED,SKU_SHIPPED,SKU_DELIVERED
```

### SLA Violation Logs
```bash
GET /api/analytics/audit-logs?action=SLA_VIOLATION_RECORDED
```

### Dealer Assignment Logs
```bash
GET /api/analytics/audit-logs?action=DEALER_ASSIGNED,DEALER_REMAPPED
```

## 📈 **Analytics and Reporting Endpoints**

### 6. **Get Order Activity Summary**
```bash
GET /api/analytics/order-activity-summary
```
- **Purpose**: Get summary of order activities over time
- **Authentication**: Required
- **Query Parameters**:
  - `startDate`: Start date for summary
  - `endDate`: End date for summary
  - `groupBy`: Group by day, week, month

### 7. **Get User Activity Report**
```bash
GET /api/analytics/user-activity-report
```
- **Purpose**: Get detailed user activity report
- **Authentication**: Required (Super-admin)
- **Query Parameters**:
  - `userId`: Specific user ID (optional)
  - `startDate`: Start date
  - `endDate`: End date

### 8. **Get Dealer Performance Audit**
```bash
GET /api/analytics/dealer-performance-audit
```
- **Purpose**: Get dealer performance audit logs
- **Authentication**: Required
- **Query Parameters**:
  - `dealerId`: Specific dealer ID (optional)
  - `startDate`: Start date
  - `endDate`: End date

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

BASE_URL="http://localhost:5002"
HEADERS="-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'"
```

### Test Commands

#### Get All Audit Logs
```bash
curl -X GET "$BASE_URL/api/analytics/audit-logs" $HEADERS
```

#### Get Audit Logs with Filters
```bash
curl -X GET "$BASE_URL/api/analytics/audit-logs?action=ORDER_CREATED&limit=20" $HEADERS
```

#### Get Audit Statistics
```bash
curl -X GET "$BASE_URL/api/analytics/audit-stats" $HEADERS
```

#### Get Order-Specific Audit Logs
```bash
curl -X GET "$BASE_URL/api/orders/ORD-TEST-001/audit-logs" $HEADERS
```

#### Get User Activity Audit Logs
```bash
curl -X GET "$BASE_URL/api/orders/user/CUST-TEST-001/audit-logs" $HEADERS
```

#### Get Dealer Activity Audit Logs
```bash
curl -X GET "$BASE_URL/api/orders/dealer/DEALER-TEST-001/audit-logs" $HEADERS
```

## 📋 **Sample Response Structure**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "audit_log_id",
        "action": "ORDER_CREATED",
        "actorId": "user_id",
        "actorRole": "Super-admin",
        "actorName": "John Doe",
        "targetId": "order_id",
        "targetIdentifier": "ORD-001",
        "details": {
          "orderId": "ORD-001",
          "customerId": "CUST-001",
          "totalAmount": 1500.00,
          "skuCount": 3,
          "deliveryType": "Express",
          "orderDate": "2024-01-01T10:00:00Z",
          "status": "Confirmed"
        },
        "oldValues": null,
        "newValues": {
          "status": "Confirmed",
          "totalAmount": 1500.00
        },
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "sessionId": "session_123",
        "severity": "LOW",
        "category": "ORDER_MANAGEMENT",
        "timestamp": "2024-01-01T10:00:00Z"
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

### Order Management Actions
- `ORDER_CREATED` - Order creation
- `ORDER_UPDATED` - Order updates
- `ORDER_STATUS_CHANGED` - Status changes
- `ORDER_CANCELLED` - Order cancellation
- `ORDER_DELIVERED` - Order delivery
- `ORDER_RETURNED` - Order returns
- `ORDER_LIST_ACCESSED` - Order list access
- `ORDER_DETAILS_ACCESSED` - Order details access
- `ORDER_SHIPPED` - Order shipping
- `ORDER_DELIVERY_CHECKED` - Delivery verification
- `ORDER_STATUS_BREAKDOWN_ACCESSED` - Status breakdown access
- `ORDER_REPORTS_GENERATED` - Report generation

### SKU Operations
- `SKU_PACKED` - SKU packing
- `SKU_SHIPPED` - SKU shipping
- `SKU_DELIVERED` - SKU delivery
- `SKU_SCANNED` - SKU scanning

### Dealer Operations
- `DEALER_ASSIGNED` - Dealer assignment
- `DEALER_REMAPPED` - Dealer reassignment
- `DEALER_ORDERS_ACCESSED` - Dealer orders access
- `DEALER_ORDER_STATUS_UPDATED` - Dealer status updates

### Picklist Operations
- `PICKLIST_ACCESSED` - Picklist access
- `DEALER_PICKLIST_ACCESSED` - Dealer picklist access
- `PICKLIST_ASSIGNED` - Picklist assignment
- `PICKUP_CREATED` - Pickup creation

### Scan Operations
- `SCAN_LOGS_ACCESSED` - Scan logs access
- `DEALER_SCAN_LOGS_ACCESSED` - Dealer scan logs access

### SLA Operations
- `SLA_VIOLATION_RECORDED` - SLA violations
- `SLA_WARNING_SENT` - SLA warnings
- `SLA_REPORT_GENERATED` - SLA reports
- `SLA_TYPE_CREATED` - SLA type creation
- `SLA_TYPES_ACCESSED` - SLA types access
- `SLA_BY_NAME_ACCESSED` - SLA by name access
- `SLA_VIOLATIONS_ACCESSED` - SLA violations access
- `ORDER_SLA_VIOLATIONS_ACCESSED` - Order SLA violations access
- `DEALER_SLA_VIOLATIONS_SUMMARY_ACCESSED` - Dealer SLA violations summary
- `APPROACHING_SLA_VIOLATIONS_ACCESSED` - Approaching violations access
- `SLA_SCHEDULER_STARTED` - SLA scheduler start
- `SLA_SCHEDULER_STOPPED` - SLA scheduler stop
- `SLA_SCHEDULER_STATUS_ACCESSED` - SLA scheduler status access
- `SLA_MANUAL_CHECK_TRIGGERED` - Manual SLA check

### Analytics Actions
- `FULFILLMENT_ANALYTICS_ACCESSED` - Fulfillment analytics
- `SLA_COMPLIANCE_REPORT_ACCESSED` - SLA compliance reports
- `DEALER_PERFORMANCE_ANALYTICS_ACCESSED` - Dealer performance analytics
- `ORDER_STATS_ACCESSED` - Order statistics

### Audit Log Access Actions
- `ORDER_AUDIT_LOGS_ACCESSED` - Order audit logs access
- `USER_ORDER_AUDIT_LOGS_ACCESSED` - User order audit logs access
- `DEALER_ORDER_AUDIT_LOGS_ACCESSED` - Dealer order audit logs access

## 🛡️ **Security and Access Control**

### Role-Based Access
- **Super-admin**: Access to all audit log endpoints
- **System**: Access to all audit log endpoints
- **Fulfillment-Admin**: Access to fulfillment-related audit logs
- **Inventory-Admin**: Access to inventory-related audit logs
- **Dealer**: Access to dealer-specific audit logs

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
curl -X GET "$BASE_URL/api/analytics/audit-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Check response headers
curl -X GET "$BASE_URL/api/analytics/audit-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -I
```

## 📈 **Monitoring and Alerts**

### Key Metrics to Monitor
- Audit log creation rate
- API response times
- Error rates by endpoint
- User activity patterns
- SLA violation trends

### Recommended Alerts
- High error rates on audit log endpoints
- Unusual audit log activity patterns
- Failed authentication attempts
- Performance degradation

This comprehensive audit logging system provides complete visibility into all order-related activities and ensures compliance with regulatory requirements.
