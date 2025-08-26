# Complete API Reference - Frontend Integration Guide

## Table of Contents
1. [Authentication](#authentication)
2. [Order Service APIs](#order-service-apis)
3. [User Service APIs](#user-service-apis)
4. [Product Service APIs](#product-service-apis)
5. [Common Headers](#common-headers)
6. [Error Handling](#error-handling)

## Authentication

### Login (User Service)
```bash
# Mobile Login
curl -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Web Dashboard Login
curl -X POST http://localhost:5001/api/users/loginWeb \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Signup (User Service)
```bash
curl -X POST http://localhost:5001/api/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone_Number": "+1234567890"
  }'
```

## Common Headers

For all authenticated requests, include:
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
-H "Content-Type: application/json"
```

---

## Order Service APIs

### Base URL: `http://localhost:5002`

#### 1. Order Management

**Get All Orders**
```bash
curl -X GET "http://localhost:5002/api/orders?page=1&limit=10&status=Processing" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Order by ID**
```bash
curl -X GET "http://localhost:5002/api/orders/ORDER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create New Order**
```bash
curl -X POST "http://localhost:5002/api/orders" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerDetails": {
      "name": "John Doe",
      "phone": "+1234567890",
      "email": "john@example.com"
    },
    "skus": [
      {
        "sku": "SKU001",
        "productName": "Product Name",
        "quantity": 2,
        "selling_price": 100
      }
    ],
    "totalAmount": 200,
    "paymentType": "COD",
    "orderType": "Regular"
  }'
```

**Update Order Status**
```bash
curl -X PUT "http://localhost:5002/api/orders/ORDER_ID/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Processing",
    "notes": "Order is being processed"
  }'
```

**Delete Order**
```bash
curl -X DELETE "http://localhost:5002/api/orders/ORDER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Order Analytics

**Get Order Analytics**
```bash
curl -X GET "http://localhost:5002/api/analytics/orders?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer Analytics**
```bash
curl -X GET "http://localhost:5002/api/analytics/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Order Audit Logs**
```bash
curl -X GET "http://localhost:5002/api/orders/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer Order Audit Logs**
```bash
curl -X GET "http://localhost:5002/api/orders/dealer/DEALER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. SLA Violation Management

**Get SLA Violation Statistics**
```bash
# Basic stats
curl -X GET "http://localhost:5002/api/sla-violations?groupBy=dealer&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With enhanced details
curl -X GET "http://localhost:5002/api/sla-violations?includeDetails=true&groupBy=dealer&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealers with Multiple Violations**
```bash
curl -X GET "http://localhost:5002/api/sla-violations/multiple-violations?minViolations=3&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get SLA Violation Trends**
```bash
curl -X GET "http://localhost:5002/api/sla-violations/trends?period=30d&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Top Violating Dealers**
```bash
curl -X GET "http://localhost:5002/api/sla-violations/top-violators?limit=10&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get SLA Violation Summary**
```bash
curl -X GET "http://localhost:5002/api/sla-violations/summary?includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Detailed Violation Info**
```bash
curl -X GET "http://localhost:5002/api/sla-violations/violation/VIOLATION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resolve SLA Violation**
```bash
curl -X PUT "http://localhost:5002/api/sla-violations/VIOLATION_ID/resolve" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionNotes": "Issue resolved by contacting dealer"
  }'
```

**Disable Dealer for Violations**
```bash
curl -X PUT "http://localhost:5002/api/sla-violations/disable-dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Multiple SLA violations",
    "adminNotes": "Dealer has violated SLA 3 times"
  }'
```

#### 4. Order Performance & KPIs

**Get Dealer Performance**
```bash
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer SLA Performance**
```bash
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance/sla" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer Fulfillment Performance**
```bash
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance/fulfillment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Export Dealer Performance**
```bash
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Picklists and Scan Logs

**Get Dealer Picklists**
```bash
curl -X GET "http://localhost:5002/api/orders/picklists/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer Scan Logs**
```bash
curl -X GET "http://localhost:5002/api/orders/scanlogs/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## User Service APIs

### Base URL: `http://localhost:5001`

#### 1. User Management

**Get All Users**
```bash
curl -X GET "http://localhost:5001/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get User by ID**
```bash
curl -X GET "http://localhost:5001/api/users/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create User (Admin Only)**
```bash
curl -X POST "http://localhost:5001/api/users/createUser" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "password123",
    "role": "User",
    "phone_Number": "+1234567890"
  }'
```

**Update User Profile**
```bash
curl -X PUT "http://localhost:5001/api/users/profile/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com"
  }'
```

**Delete User**
```bash
curl -X DELETE "http://localhost:5001/api/users/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Employee Management

**Get All Employees**
```bash
curl -X GET "http://localhost:5001/api/users/getemployees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Employee by ID**
```bash
curl -X GET "http://localhost:5001/api/users/employee/get-by-id?employeeId=EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Employee Details**
```bash
curl -X GET "http://localhost:5001/api/users/employee/EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Employee**
```bash
curl -X POST "http://localhost:5001/api/users/create-Employee" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Employee Name",
    "email": "employee@example.com",
    "password": "password123",
    "role": "Fulfillment-Staff",
    "phone_Number": "+1234567890"
  }'
```

**Get Employee Stats**
```bash
curl -X GET "http://localhost:5001/api/users/employee/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Dealer Management

**Get All Dealers**
```bash
curl -X GET "http://localhost:5001/api/users/dealers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer by ID**
```bash
curl -X GET "http://localhost:5001/api/users/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Dealer**
```bash
curl -X POST "http://localhost:5001/api/users/dealer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trade_name": "Dealer Name",
    "legal_name": "Legal Business Name",
    "email": "dealer@example.com",
    "phone_Number": "+1234567890",
    "address": "Dealer Address"
  }'
```

**Update Dealer**
```bash
curl -X PUT "http://localhost:5001/api/users/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trade_name": "Updated Dealer Name",
    "email": "updated@example.com"
  }'
```

**Disable Dealer**
```bash
curl -X PATCH "http://localhost:5001/api/users/disable-dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Performance issues"
  }'
```

**Enable Dealer**
```bash
curl -X PATCH "http://localhost:5001/api/users/enable-dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer Stats**
```bash
curl -X GET "http://localhost:5001/api/users/dealer/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Employee Assignment to Dealers

**Assign Employees to Dealer**
```bash
curl -X POST "http://localhost:5001/api/users/dealers/DEALER_ID/assign-employees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeIds": ["EMPLOYEE_ID_1", "EMPLOYEE_ID_2"]
  }'
```

**Remove Employees from Dealer**
```bash
curl -X DELETE "http://localhost:5001/api/users/dealers/DEALER_ID/remove-employees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeIds": ["EMPLOYEE_ID_1", "EMPLOYEE_ID_2"]
  }'
```

**Get Dealer Assigned Employees**
```bash
curl -X GET "http://localhost:5001/api/users/dealers/DEALER_ID/assigned-employees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update Employee Assignment Status**
```bash
curl -X PUT "http://localhost:5001/api/users/dealers/DEALER_ID/assignments/ASSIGNMENT_ID/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Inactive"
  }'
```

**Get Employee Dealer Assignments**
```bash
curl -X GET "http://localhost:5001/api/users/employees/EMPLOYEE_ID/dealer-assignments" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Bulk Assign Employees to Dealers**
```bash
curl -X POST "http://localhost:5001/api/users/dealers/bulk-assign-employees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignments": [
      {
        "dealerId": "DEALER_ID_1",
        "employeeIds": ["EMPLOYEE_ID_1", "EMPLOYEE_ID_2"]
      },
      {
        "dealerId": "DEALER_ID_2",
        "employeeIds": ["EMPLOYEE_ID_3"]
      }
    ]
  }'
```

#### 5. User Statistics and Insights

**Get User Stats**
```bash
curl -X GET "http://localhost:5001/api/users/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get User Insights**
```bash
curl -X GET "http://localhost:5001/api/users/insights" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get User Counts**
```bash
curl -X GET "http://localhost:5001/api/users/user/stats/userCounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. Address Management

**Update User Address**
```bash
curl -X PUT "http://localhost:5001/api/users/updateAddress/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": [
      {
        "type": "Home",
        "street": "123 Main St",
        "city": "City",
        "state": "State",
        "zipCode": "12345",
        "country": "Country"
      }
    ]
  }'
```

**Edit User Address**
```bash
curl -X PUT "http://localhost:5001/api/users/address/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID",
    "updates": {
      "street": "Updated Street",
      "city": "Updated City"
    }
  }'
```

**Delete User Address**
```bash
curl -X DELETE "http://localhost:5001/api/users/address/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "addressId": "ADDRESS_ID"
  }'
```

#### 7. Vehicle Management

**Add Vehicle Details**
```bash
curl -X POST "http://localhost:5001/api/users/USER_ID/vehicles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "ABC123",
    "vehicleType": "Car",
    "model": "Model Name",
    "year": 2020
  }'
```

**Edit Vehicle Details**
```bash
curl -X PUT "http://localhost:5001/api/users/USER_ID/vehicles/VEHICLE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "XYZ789",
    "model": "Updated Model"
  }'
```

**Delete Vehicle Details**
```bash
curl -X DELETE "http://localhost:5001/api/users/USER_ID/vehicles/VEHICLE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 8. Bank Details Management

**Add Bank Details**
```bash
curl -X POST "http://localhost:5001/api/users/USER_ID/bank-details" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1234567890",
    "ifscCode": "ABCD0001234",
    "bankName": "Bank Name",
    "accountHolderName": "Account Holder"
  }'
```

**Update Bank Details**
```bash
curl -X PUT "http://localhost:5001/api/users/USER_ID/bank-details" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "0987654321",
    "bankName": "Updated Bank"
  }'
```

**Get Bank Details**
```bash
curl -X GET "http://localhost:5001/api/users/USER_ID/bank-details" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Delete Bank Details**
```bash
curl -X DELETE "http://localhost:5001/api/users/USER_ID/bank-details" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Validate IFSC Code**
```bash
curl -X GET "http://localhost:5001/api/users/validate-ifsc?ifsc=ABCD0001234"
```

**Get Bank Details by Account Number**
```bash
curl -X GET "http://localhost:5001/api/users/bank-details/account/1234567890" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 9. Audit Logs

**Get User Audit Logs**
```bash
curl -X GET "http://localhost:5001/api/users/USER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Dealer Audit Logs**
```bash
curl -X GET "http://localhost:5001/api/users/dealer/DEALER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Employee Audit Logs**
```bash
curl -X GET "http://localhost:5001/api/users/employee/EMPLOYEE_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Product Service APIs

### Base URL: `http://localhost:5003`

#### 1. Product Management

**Get All Products**
```bash
curl -X GET "http://localhost:5003/api/products?page=1&limit=10&category=Electronics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Product by ID**
```bash
curl -X GET "http://localhost:5003/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Product**
```bash
curl -X POST "http://localhost:5003/api/products" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Name",
    "description": "Product Description",
    "price": 100,
    "category": "Electronics",
    "sku": "SKU001",
    "stock": 50
  }'
```

**Update Product**
```bash
curl -X PUT "http://localhost:5003/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "price": 150,
    "stock": 75
  }'
```

**Delete Product**
```bash
curl -X DELETE "http://localhost:5003/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Category Management

**Get All Categories**
```bash
curl -X GET "http://localhost:5003/api/categories" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Category by ID**
```bash
curl -X GET "http://localhost:5003/api/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Category**
```bash
curl -X POST "http://localhost:5003/api/categories" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic products"
  }'
```

**Update Category**
```bash
curl -X PUT "http://localhost:5003/api/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Electronics",
    "description": "Updated description"
  }'
```

**Delete Category**
```bash
curl -X DELETE "http://localhost:5003/api/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Dealer-Product Assignment

**Get Available Dealers for Product**
```bash
curl -X GET "http://localhost:5003/api/products/PRODUCT_ID/availableDealers/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Products by Dealer**
```bash
curl -X GET "http://localhost:5003/api/products/get-products-by-dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Assign Dealer to Product**
```bash
curl -X POST "http://localhost:5003/api/products/assign/dealer/PRODUCT_ID/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Remove Dealer from Product**
```bash
curl -X DELETE "http://localhost:5003/api/products/PRODUCT_ID/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Product Analytics

**Get Product Analytics**
```bash
curl -X GET "http://localhost:5003/api/products/analytics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Category Analytics**
```bash
curl -X GET "http://localhost:5003/api/categories/analytics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 5. Audit Logs

**Get Product Audit Logs**
```bash
curl -X GET "http://localhost:5003/api/products/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Category Audit Logs**
```bash
curl -X GET "http://localhost:5003/api/categories/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Handling

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

### Success Response Format
```json
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

---

## Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Filtering
- `startDate`: Start date for date range filters (YYYY-MM-DD)
- `endDate`: End date for date range filters (YYYY-MM-DD)
- `status`: Filter by status
- `category`: Filter by category
- `dealerId`: Filter by dealer ID
- `includeDetails`: Include enhanced details (true/false)

### Sorting
- `sortBy`: Field to sort by
- `sortOrder`: asc or desc

---

## Rate Limiting

All APIs have rate limiting:
- **Authentication endpoints**: 5 requests per minute
- **Data endpoints**: 100 requests per minute
- **Analytics endpoints**: 20 requests per minute

---

## WebSocket Endpoints (Real-time Updates)

### Order Service
```javascript
// Connect to order updates
const ws = new WebSocket('ws://localhost:5002/ws/orders');

// Listen for order status changes
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Order update:', data);
};
```

### User Service
```javascript
// Connect to user updates
const ws = new WebSocket('ws://localhost:5001/ws/users');

// Listen for user activity
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('User activity:', data);
};
```

---

## Testing with Postman

### Environment Variables
Set these in your Postman environment:
- `base_url_order`: `http://localhost:5002`
- `base_url_user`: `http://localhost:5001`
- `base_url_product`: `http://localhost:5003`
- `auth_token`: Your JWT token

### Collection Import
Import the provided Postman collection for all endpoints with pre-configured headers and authentication.

---

## SDKs and Libraries

### JavaScript/Node.js
```javascript
// Example usage with axios
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5002',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get orders
const orders = await api.get('/api/orders');
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# Get orders
response = requests.get('http://localhost:5002/api/orders', headers=headers)
orders = response.json()
```

---

## Support

For API support and questions:
- **Documentation**: Check this reference guide
- **Error Logs**: Check service logs for detailed error information
- **Rate Limiting**: Monitor response headers for rate limit information
- **Authentication**: Ensure valid JWT tokens are used

---

*Last Updated: January 2024*
*Version: 1.0*
