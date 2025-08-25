# Order Audit Endpoint Test Commands

This file contains curl commands for testing all order audit logging endpoints manually.

## Prerequisites

1. **JWT Token**: Generate a JWT token for authentication
2. **Base URL**: Set your order service base URL
3. **Test Data**: Use the provided test data or modify as needed

## JWT Token Generation

```bash
# Generate JWT token (replace with your secret)
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

echo "JWT Token: $TOKEN"
```

## Base Configuration

```bash
# Set base URL
BASE_URL="http://localhost:5002"

# Set headers
HEADERS="-H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json'"
```

## 1. Order Creation and Retrieval

### Create Order
```bash
curl -X POST "$BASE_URL/api/orders/create" \
  $HEADERS \
  -d '{
    "customerId": "CUST-TEST-001",
    "customerName": "Test Customer",
    "customerEmail": "customer@test.com",
    "customerPhone": "+1234567890",
    "customerAddress": {
      "street": "123 Test Street",
      "city": "Test City",
      "state": "Test State",
      "pincode": "12345",
      "country": "Test Country"
    },
    "totalAmount": 1500.00,
    "delivery_type": "Express",
    "skus": [
      {
        "sku": "SKU-TEST-001",
        "quantity": 2,
        "productId": "PROD-001",
        "productName": "Test Product 1",
        "selling_price": 500.00,
        "mrp": 600.00,
        "mrp_gst_amount": 108.00,
        "gst_percentage": 18,
        "gst_amount": 90.00,
        "product_total": 590.00,
        "totalPrice": 1180.00
      }
    ]
  }'
```

### Get All Orders
```bash
curl -X GET "$BASE_URL/api/orders/all" \
  $HEADERS
```

### Get Order by ID
```bash
curl -X GET "$BASE_URL/api/orders/id/ORD-TEST-001" \
  $HEADERS
```

### Get Orders by User
```bash
curl -X GET "$BASE_URL/api/orders/user/CUST-TEST-001" \
  $HEADERS
```

## 2. Order Status Updates

### Pack Order
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/pack" \
  $HEADERS \
  -d '{
    "packedBy": "Fulfillment Staff",
    "packingLocation": "Warehouse A",
    "packingNotes": "Order packed successfully"
  }'
```

### Ship Order
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/ship" \
  $HEADERS \
  -d '{
    "shippedBy": "Shipping Staff",
    "trackingNumber": "TRK123456789",
    "shippingMethod": "Express Delivery"
  }'
```

### Deliver Order
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/deliver" \
  $HEADERS \
  -d '{
    "deliveredBy": "Delivery Staff",
    "deliveryMethod": "Door Delivery",
    "deliveryNotes": "Delivered to customer doorstep"
  }'
```

### Cancel Order
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/cancel" \
  $HEADERS \
  -d '{
    "cancellationReason": "Customer request",
    "cancelledBy": "Customer Support"
  }'
```

## 3. SKU Operations

### Pack SKU
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/sku/SKU-TEST-001/pack" \
  $HEADERS \
  -d '{
    "packedBy": "Fulfillment Staff",
    "packingLocation": "Warehouse A",
    "packingNotes": "SKU packed successfully"
  }'
```

### Ship SKU
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/sku/SKU-TEST-001/ship" \
  $HEADERS \
  -d '{
    "shippedBy": "Shipping Staff",
    "trackingNumber": "TRK123456789",
    "shippingMethod": "Express Delivery"
  }'
```

### Deliver SKU
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/sku/SKU-TEST-001/deliver" \
  $HEADERS \
  -d '{
    "deliveredBy": "Delivery Staff",
    "deliveryMethod": "Door Delivery",
    "deliveryNotes": "SKU delivered successfully"
  }'
```

## 4. Dealer Operations

### Assign Dealers
```bash
curl -X POST "$BASE_URL/api/orders/assign-dealers" \
  $HEADERS \
  -d '{
    "orders": ["ORD-TEST-001", "ORD-TEST-002"],
    "dealerId": "DEALER-TEST-001",
    "assignmentReason": "Automatic assignment based on location"
  }'
```

### Reassign Dealers
```bash
curl -X POST "$BASE_URL/api/orders/reassign-dealers" \
  $HEADERS \
  -d '{
    "orders": ["ORD-TEST-001"],
    "newDealerId": "DEALER-TEST-002",
    "reassignmentReason": "Original dealer unavailable"
  }'
```

### Get Orders by Dealer
```bash
curl -X GET "$BASE_URL/api/orders/get/order-by-dealer/DEALER-TEST-001" \
  $HEADERS
```

### Update Order Status by Dealer
```bash
curl -X PUT "$BASE_URL/api/orders/update/order-status-by-dealer" \
  $HEADERS \
  -d '{
    "orderId": "ORD-TEST-001",
    "newStatus": "Packed",
    "updateReason": "Order packed by dealer"
  }'
```

## 5. Picklist Operations

### Get Picklists
```bash
curl -X GET "$BASE_URL/api/orders/picklists" \
  $HEADERS
```

### Get Dealer Picklists
```bash
curl -X GET "$BASE_URL/api/orders/picklists/dealer/DEALER-TEST-001" \
  $HEADERS
```

### Create Pickup
```bash
curl -X POST "$BASE_URL/api/orders/create-pickup" \
  $HEADERS \
  -d '{
    "orderId": "ORD-TEST-001",
    "pickupDate": "2024-01-01T10:00:00Z",
    "pickupLocation": "Warehouse A",
    "pickupNotes": "Ready for pickup"
  }'
```

### Assign Picklist
```bash
curl -X POST "$BASE_URL/api/orders/assign-picklist" \
  $HEADERS \
  -d '{
    "picklistId": "PICKLIST-TEST-001",
    "staffId": "STAFF-TEST-001",
    "assignmentNotes": "Assigned to fulfillment staff"
  }'
```

## 6. Scan Operations

### Scan SKU
```bash
curl -X POST "$BASE_URL/api/orders/scan" \
  $HEADERS \
  -d '{
    "orderId": "ORD-TEST-001",
    "sku": "SKU-TEST-001",
    "scanLocation": "Warehouse A",
    "scannerId": "SCANNER-001",
    "scanNotes": "SKU scanned successfully"
  }'
```

### Get Scan Logs
```bash
curl -X GET "$BASE_URL/api/orders/scanlogs" \
  $HEADERS
```

### Get Dealer Scan Logs
```bash
curl -X GET "$BASE_URL/api/orders/scanlogs/dealer/DEALER-TEST-001" \
  $HEADERS
```

## 7. SLA Operations

### Create SLA Type
```bash
curl -X POST "$BASE_URL/api/orders/sla/types" \
  $HEADERS \
  -d '{
    "name": "Test SLA",
    "description": "Test SLA for testing",
    "packingTime": 24,
    "shippingTime": 48,
    "deliveryTime": 72
  }'
```

### Get SLA Types
```bash
curl -X GET "$BASE_URL/api/orders/sla/types" \
  $HEADERS
```

### Get SLA by Name
```bash
curl -X GET "$BASE_URL/api/orders/get-by-name?name=Test SLA" \
  $HEADERS
```

### Set Dealer SLA
```bash
curl -X POST "$BASE_URL/api/orders/dealers/DEALER-TEST-001/sla" \
  $HEADERS \
  -d '{
    "slaTypeId": "SLA-TEST-001",
    "effectiveDate": "2024-01-01T00:00:00Z"
  }'
```

### Log Violation
```bash
curl -X POST "$BASE_URL/api/orders/sla/violations" \
  $HEADERS \
  -d '{
    "orderId": "ORD-TEST-001",
    "violationType": "PACKING_SLA_VIOLATION",
    "violationReason": "Order not packed within SLA time",
    "expectedTime": "2024-01-01T10:00:00Z",
    "actualTime": "2024-01-01T12:00:00Z"
  }'
```

### Get Violations
```bash
curl -X GET "$BASE_URL/api/orders/sla/violations" \
  $HEADERS
```

### Get Violations by Order
```bash
curl -X GET "$BASE_URL/api/orders/sla/violations/order/ORD-TEST-001" \
  $HEADERS
```

### Get Violations Summary
```bash
curl -X GET "$BASE_URL/api/orders/sla/violations/summary/DEALER-TEST-001" \
  $HEADERS
```

### Get Approaching Violations
```bash
curl -X GET "$BASE_URL/api/orders/sla/violations/approaching" \
  $HEADERS
```

## 8. SLA Scheduler Operations

### Start Scheduler
```bash
curl -X POST "$BASE_URL/api/orders/sla/scheduler/start" \
  $HEADERS
```

### Get Scheduler Status
```bash
curl -X GET "$BASE_URL/api/orders/sla/scheduler/status" \
  $HEADERS
```

### Trigger Manual Check
```bash
curl -X POST "$BASE_URL/api/orders/sla/scheduler/trigger-check" \
  $HEADERS
```

### Stop Scheduler
```bash
curl -X POST "$BASE_URL/api/orders/sla/scheduler/stop" \
  $HEADERS
```

## 9. Analytics Operations

### Fulfillment Analytics
```bash
curl -X GET "$BASE_URL/api/orders/analytics/fulfillment" \
  $HEADERS
```

### SLA Compliance Report
```bash
curl -X GET "$BASE_URL/api/orders/analytics/sla-compliance" \
  $HEADERS
```

### Dealer Performance
```bash
curl -X GET "$BASE_URL/api/orders/analytics/dealer-performance" \
  $HEADERS
```

### Order Stats
```bash
curl -X GET "$BASE_URL/api/orders/stats" \
  $HEADERS
```

## 10. Batch Operations

### Batch Assign Orders
```bash
curl -X POST "$BASE_URL/api/orders/batch/assign" \
  $HEADERS \
  -d '{
    "orders": ["ORD-TEST-001", "ORD-TEST-002", "ORD-TEST-003"],
    "dealerId": "DEALER-TEST-001",
    "assignmentReason": "Batch assignment test"
  }'
```

### Batch Status Update
```bash
curl -X POST "$BASE_URL/api/orders/batch/status-update" \
  $HEADERS \
  -d '{
    "orders": ["ORD-TEST-001", "ORD-TEST-002"],
    "newStatus": "Packed",
    "updateReason": "Batch status update test"
  }'
```

## 11. Order Reports

### Generate Order Reports
```bash
curl -X GET "$BASE_URL/api/orders/reports" \
  $HEADERS
```

### Order Status Breakdown
```bash
curl -X GET "$BASE_URL/api/orders/ORD-TEST-001/status-breakdown" \
  $HEADERS
```

### Check Delivery
```bash
curl -X POST "$BASE_URL/api/orders/ORD-TEST-001/check-delivery" \
  $HEADERS
```

## 12. Role-Based Access Testing

### Test with Different Roles

#### Super-admin
```bash
# Generate Super-admin token
SUPER_ADMIN_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  id: '507f1f77bcf86cd799439011',
  role: 'Super-admin',
  name: 'Super Admin',
  email: 'superadmin@test.com'
}, '$JWT_SECRET', { expiresIn: '1h' });
console.log(token);
")

curl -X GET "$BASE_URL/api/orders/stats" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### Fulfillment-Admin
```bash
# Generate Fulfillment-Admin token
FULFILLMENT_ADMIN_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  id: '507f1f77bcf86cd799439012',
  role: 'Fulfillment-Admin',
  name: 'Fulfillment Admin',
  email: 'fulfillment@test.com'
}, '$JWT_SECRET', { expiresIn: '1h' });
console.log(token);
")

curl -X GET "$BASE_URL/api/orders/analytics/fulfillment" \
  -H "Authorization: Bearer $FULFILLMENT_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### Inventory-Admin
```bash
# Generate Inventory-Admin token
INVENTORY_ADMIN_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  id: '507f1f77bcf86cd799439013',
  role: 'Inventory-Admin',
  name: 'Inventory Admin',
  email: 'inventory@test.com'
}, '$JWT_SECRET', { expiresIn: '1h' });
console.log(token);
")

curl -X GET "$BASE_URL/api/orders/stats" \
  -H "Authorization: Bearer $INVENTORY_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

#### Dealer
```bash
# Generate Dealer token
DEALER_TOKEN=$(node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({
  id: '507f1f77bcf86cd799439014',
  role: 'Dealer',
  name: 'Dealer User',
  email: 'dealer@test.com'
}, '$JWT_SECRET', { expiresIn: '1h' });
console.log(token);
")

curl -X GET "$BASE_URL/api/orders/get/order-by-dealer/DEALER-TEST-001" \
  -H "Authorization: Bearer $DEALER_TOKEN" \
  -H "Content-Type: application/json"
```

## 13. Audit Log Verification

### Check Audit Logs (if audit log endpoint exists)
```bash
curl -X GET "$BASE_URL/api/analytics/audit-logs" \
  $HEADERS
```

### Check Audit Stats
```bash
curl -X GET "$BASE_URL/api/analytics/audit-stats" \
  $HEADERS
```

## Test Script

You can also run the automated test script:

```bash
# Install dependencies
npm install axios jsonwebtoken

# Run the test script
node test-order-audit-endpoints.js
```

## Expected Results

All endpoints should:
1. ✅ Return appropriate HTTP status codes
2. ✅ Include proper authentication validation
3. ✅ Log activities in the audit system
4. ✅ Return meaningful response data
5. ✅ Handle errors gracefully

## Troubleshooting

### Common Issues

1. **Authentication Error (401)**
   - Check JWT token validity
   - Verify JWT secret matches
   - Ensure token hasn't expired

2. **Authorization Error (403)**
   - Verify user role has required permissions
   - Check role-based access control

3. **Validation Error (400)**
   - Check request body format
   - Verify required fields are present
   - Ensure data types are correct

4. **Not Found Error (404)**
   - Verify endpoint URL is correct
   - Check if order/service exists
   - Ensure proper route configuration

### Debug Commands

```bash
# Test service health
curl -X GET "$BASE_URL/health"

# Test authentication
curl -X GET "$BASE_URL/api/orders/all" \
  -H "Authorization: Bearer $TOKEN" \
  -v

# Check response headers
curl -X GET "$BASE_URL/api/orders/all" \
  -H "Authorization: Bearer $TOKEN" \
  -I
```
