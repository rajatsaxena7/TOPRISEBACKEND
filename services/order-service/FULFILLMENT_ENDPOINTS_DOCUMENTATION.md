# Fulfillment Endpoints Documentation

## 🎯 **Overview**

This document provides comprehensive API documentation for all fulfillment-related endpoints in the order service. These endpoints enable efficient management of picklists, order fulfillment, employee assignments, and dealer coordination.

## 📋 **Base URL**
```
http://localhost:5002/api/fulfillment
```

## 🔐 **Authentication**
All endpoints require authentication with JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 **Available Endpoints**

### **1. Fulfillment Statistics**
**GET** `/api/fulfillment/stats`

Get comprehensive fulfillment statistics with filtering options.

**Query Parameters:**
- `employeeId` (optional): Filter by specific employee
- `dealerId` (optional): Filter by specific dealer
- `dateRange` (optional): Filter by date range (format: "startDate,endDate")

**Example Request:**
```bash
curl -X GET "http://localhost:5002/api/fulfillment/stats?employeeId=emp123&dateRange=2024-01-01,2024-01-31" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "picklists": {
      "total": 150,
      "notStarted": 45,
      "inProgress": 30,
      "completed": 75,
      "completionRate": 50.0
    },
    "orders": {
      "total": 120,
      "pending": 25,
      "scanning": 15,
      "packed": 40,
      "shipped": 30,
      "delivered": 10
    },
    "efficiency": {
      "averageProcessingTime": 2.5,
      "completionRate": 50.0
    },
    "filters": {
      "employeeId": "emp123",
      "dealerId": null,
      "dateRange": "2024-01-01,2024-01-31"
    }
  },
  "message": "Fulfillment statistics retrieved successfully"
}
```

---

### **2. Pending Tasks**
**GET** `/api/fulfillment/pending-tasks`

Get all pending tasks that require fulfillment attention.

**Query Parameters:**
- `employeeId` (optional): Filter by specific employee
- `dealerId` (optional): Filter by specific dealer
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `priority` (optional): Filter by priority (all, high, medium, low)

**Example Request:**
```bash
curl -X GET "http://localhost:5002/api/fulfillment/pending-tasks?priority=high&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "picklistId": "picklist_id_123",
        "orderId": "ORD-2024-001",
        "orderDate": "2024-01-15T10:30:00.000Z",
        "customerName": "John Doe",
        "customerPhone": "+1234567890",
        "totalAmount": 1500.00,
        "orderStatus": "Confirmed",
        "dealerId": "dealer_123",
        "fulfilmentStaff": "emp_456",
        "scanStatus": "Not Started",
        "skuCount": 5,
        "totalQuantity": 12,
        "priority": "high",
        "ageInHours": 48.5,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 45,
      "totalPages": 3,
      "currentPage": 1,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Pending tasks retrieved successfully"
}
```

---

### **3. Picklists by Employee**
**GET** `/api/fulfillment/picklists/employee/:employeeId`

Get all picklists assigned to a specific employee.

**Path Parameters:**
- `employeeId`: ID of the employee

**Query Parameters:**
- `status` (optional): Filter by status (all, Not Started, In Progress, Completed)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `dateRange` (optional): Filter by date range (format: "startDate,endDate")

**Example Request:**
```bash
curl -X GET "http://localhost:5002/api/fulfillment/picklists/employee/emp123?status=In%20Progress&page=1&limit=15" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "picklists": [
      {
        "picklistId": "picklist_id_123",
        "orderId": "ORD-2024-001",
        "orderDate": "2024-01-15T10:30:00.000Z",
        "customerName": "John Doe",
        "customerPhone": "+1234567890",
        "customerEmail": "john@example.com",
        "totalAmount": 1500.00,
        "orderStatus": "Confirmed",
        "dealerId": "dealer_123",
        "scanStatus": "In Progress",
        "skuList": [
          {
            "sku": "SKU001",
            "quantity": 2,
            "barcode": "123456789"
          }
        ],
        "skuCount": 5,
        "totalQuantity": 12,
        "invoiceGenerated": false,
        "packingSlipUrl": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T14:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 25,
      "totalPages": 2,
      "currentPage": 1,
      "itemsPerPage": 15,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Picklists retrieved successfully"
}
```

---

### **4. Picklists by Dealer**
**GET** `/api/fulfillment/picklists/dealer/:dealerId`

Get all picklists for a specific dealer.

**Path Parameters:**
- `dealerId`: ID of the dealer

**Query Parameters:**
- `status` (optional): Filter by status (all, Not Started, In Progress, Completed)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `dateRange` (optional): Filter by date range (format: "startDate,endDate")

**Example Request:**
```bash
curl -X GET "http://localhost:5002/api/fulfillment/picklists/dealer/dealer123?status=Completed&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "picklists": [
      {
        "picklistId": "picklist_id_123",
        "orderId": "ORD-2024-001",
        "orderDate": "2024-01-15T10:30:00.000Z",
        "customerName": "John Doe",
        "customerPhone": "+1234567890",
        "customerEmail": "john@example.com",
        "totalAmount": 1500.00,
        "orderStatus": "Confirmed",
        "fulfilmentStaff": "emp_456",
        "scanStatus": "Completed",
        "skuList": [
          {
            "sku": "SKU001",
            "quantity": 2,
            "barcode": "123456789"
          }
        ],
        "skuCount": 5,
        "totalQuantity": 12,
        "invoiceGenerated": true,
        "packingSlipUrl": "https://example.com/packing-slip.pdf",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T16:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 50,
      "totalPages": 3,
      "currentPage": 1,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Picklists retrieved successfully"
}
```

---

### **5. Orders by Employee** ⭐ **NEW**
**GET** `/api/fulfillment/orders/employee/:employeeId`

Get all orders assigned to a specific employee with detailed fulfillment metrics.

**Path Parameters:**
- `employeeId`: ID of the employee

**Query Parameters:**
- `status` (optional): Filter by order status (all, Confirmed, Assigned, Scanning, Packed, Shipped, Delivered)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `dateRange` (optional): Filter by date range (format: "startDate,endDate")
- `sortBy` (optional): Sort field (createdAt, orderDate, totalAmount, status) (default: createdAt)
- `sortOrder` (optional): Sort order (asc, desc) (default: desc)

**Example Request:**
```bash
curl -X GET "http://localhost:5002/api/fulfillment/orders/employee/emp123?status=Confirmed&sortBy=orderDate&sortOrder=desc&page=1&limit=15" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "ORD-2024-001",
        "orderDate": "2024-01-15T10:30:00.000Z",
        "customerName": "John Doe",
        "customerPhone": "+1234567890",
        "customerEmail": "john@example.com",
        "customerAddress": "123 Main St, City, State 12345",
        "totalAmount": 1500.00,
        "orderStatus": "Confirmed",
        "paymentType": "Prepaid",
        "paymentStatus": "Paid",
        "skuCount": 5,
        "totalQuantity": 12,
        "assignedEmployee": "emp123",
        "picklists": [
          {
            "picklistId": "picklist_id_123",
            "dealerId": "dealer_123",
            "scanStatus": "In Progress",
            "skuList": [
              {
                "sku": "SKU001",
                "quantity": 2,
                "barcode": "123456789"
              }
            ],
            "skuCount": 3,
            "totalQuantity": 8,
            "invoiceGenerated": false,
            "packingSlipUrl": null,
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-01-15T14:30:00.000Z",
            "processingTime": null
          }
        ],
        "fulfillmentMetrics": {
          "totalPicklists": 2,
          "completedPicklists": 0,
          "inProgressPicklists": 1,
          "notStartedPicklists": 1,
          "completionRate": 0.0,
          "averageProcessingTime": 0
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 30,
      "totalPages": 2,
      "currentPage": 1,
      "itemsPerPage": 15,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "employeeId": "emp123",
    "filters": {
      "status": "Confirmed",
      "dateRange": null,
      "sortBy": "orderDate",
      "sortOrder": "desc"
    }
  },
  "message": "Orders by employee retrieved successfully"
}
```

---

### **6. Recent Orders**
**GET** `/api/fulfillment/recent-orders`

Get recent orders with fulfillment information.

**Query Parameters:**
- `employeeId` (optional): Filter by specific employee
- `dealerId` (optional): Filter by specific dealer
- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `days` (optional): Number of days to look back (default: 7)

**Example Request:**
```bash
curl -X GET "http://localhost:5002/api/fulfillment/recent-orders?days=14&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "ORD-2024-001",
        "orderDate": "2024-01-15T10:30:00.000Z",
        "customerName": "John Doe",
        "customerPhone": "+1234567890",
        "customerEmail": "john@example.com",
        "totalAmount": 1500.00,
        "orderStatus": "Confirmed",
        "paymentType": "Prepaid",
        "paymentStatus": "Paid",
        "skuCount": 5,
        "totalQuantity": 12,
        "picklists": [
          {
            "picklistId": "picklist_id_123",
            "dealerId": "dealer_123",
            "fulfilmentStaff": "emp_456",
            "scanStatus": "In Progress",
            "skuCount": 3,
            "totalQuantity": 8,
            "invoiceGenerated": false,
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-01-15T14:30:00.000Z"
          }
        ],
        "totalPicklists": 2,
        "completedPicklists": 0,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 45,
      "totalPages": 3,
      "currentPage": 1,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "employeeId": null,
      "dealerId": null,
      "status": null,
      "days": 14
    }
  },
  "message": "Recent orders retrieved successfully"
}
```

---

### **7. Assigned Dealers**
**GET** `/api/fulfillment/assigned-dealers`

Get all dealers with their fulfillment statistics.

**Query Parameters:**
- `employeeId` (optional): Filter by specific employee
- `status` (optional): Filter by picklist status (all, Not Started, In Progress, Completed)

**Example Request:**
```bash
curl -X GET "http://localhost:5002/api/fulfillment/assigned-dealers?employeeId=emp123" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "dealerId": "dealer_123",
      "dealerName": "ABC Motors",
      "dealerEmail": "contact@abcmotors.com",
      "dealerPhone": "+1234567890",
      "dealerAddress": "123 Auto Street, City, State 12345",
      "totalPicklists": 25,
      "notStarted": 5,
      "inProgress": 10,
      "completed": 10,
      "totalOrders": 30,
      "completionRate": 40.0,
      "lastActivity": "2024-01-15T16:30:00.000Z"
    }
  ],
  "message": "Assigned dealers retrieved successfully"
}
```

---

### **8. Update Picklist Status**
**PATCH** `/api/fulfillment/picklists/:picklistId/status`

Update the status of a specific picklist.

**Path Parameters:**
- `picklistId`: ID of the picklist

**Request Body:**
```json
{
  "scanStatus": "In Progress",
  "fulfilmentStaff": "emp123",
  "skuList": [
    {
      "sku": "SKU001",
      "quantity": 2,
      "barcode": "123456789"
    }
  ]
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:5002/api/fulfillment/picklists/picklist123/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "scanStatus": "In Progress",
    "fulfilmentStaff": "emp123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "picklist123",
    "linkedOrderId": "order123",
    "dealerId": "dealer123",
    "fulfilmentStaff": "emp123",
    "scanStatus": "In Progress",
    "skuList": [...],
    "invoiceGenerated": false,
    "packingSlipUrl": null,
    "updatedAt": "2024-01-15T16:30:00.000Z"
  },
  "message": "Picklist status updated successfully"
}
```

---

### **9. Assign Picklist to Employee**
**PATCH** `/api/fulfillment/picklists/:picklistId/assign`

Assign a picklist to a specific employee.

**Path Parameters:**
- `picklistId`: ID of the picklist

**Request Body:**
```json
{
  "employeeId": "emp123"
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:5002/api/fulfillment/picklists/picklist123/assign" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "emp123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "picklist123",
    "linkedOrderId": "order123",
    "dealerId": "dealer123",
    "fulfilmentStaff": "emp123",
    "scanStatus": "Not Started",
    "skuList": [...],
    "invoiceGenerated": false,
    "packingSlipUrl": null,
    "updatedAt": "2024-01-15T16:30:00.000Z"
  },
  "message": "Picklist assigned to employee successfully"
}
```

---

### **10. Bulk Assign Picklists**
**PATCH** `/api/fulfillment/picklists/bulk-assign`

Assign multiple picklists to an employee at once.

**Request Body:**
```json
{
  "picklistIds": ["picklist1", "picklist2", "picklist3"],
  "employeeId": "emp123"
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:5002/api/fulfillment/picklists/bulk-assign" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "picklistIds": ["picklist1", "picklist2", "picklist3"],
    "employeeId": "emp123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "picklistId": "picklist1",
        "orderId": "order1",
        "dealerId": "dealer1"
      },
      {
        "picklistId": "picklist2",
        "orderId": "order2",
        "dealerId": "dealer2"
      }
    ],
    "failed": [
      {
        "picklistId": "picklist3",
        "error": "Picklist not found"
      }
    ],
    "totalProcessed": 3
  },
  "message": "Bulk assignment completed"
}
```

---

## 🔐 **Authorization**

All endpoints require the following roles:
- **Super-admin**: Full access to all endpoints
- **Fulfillment-Admin**: Full access to all endpoints
- **Inventory-Admin**: Full access to all endpoints
- **Fulfillment-Staff**: Full access to all endpoints
- **Inventory-Staff**: Full access to all endpoints

## 📊 **Error Responses**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Employee ID is required",
  "error": "Validation error"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "No token provided"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied",
  "error": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Picklist not found",
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## 🎯 **Frontend Integration Examples**

### **React/JavaScript Examples**

```javascript
// Get fulfillment statistics
const getFulfillmentStats = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/fulfillment/stats?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Get orders by employee
const getOrdersByEmployee = async (employeeId, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/fulfillment/orders/employee/${employeeId}?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Update picklist status
const updatePicklistStatus = async (picklistId, statusData) => {
  const response = await fetch(`/api/fulfillment/picklists/${picklistId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(statusData)
  });
  return response.json();
};

// Bulk assign picklists
const bulkAssignPicklists = async (picklistIds, employeeId) => {
  const response = await fetch('/api/fulfillment/picklists/bulk-assign', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ picklistIds, employeeId })
  });
  return response.json();
};
```

---

## 📋 **Testing**

### **Test with curl commands:**

```bash
# 1. Get fulfillment statistics
curl -X GET "http://localhost:5002/api/fulfillment/stats" \
  -H "Authorization: Bearer <your-token>"

# 2. Get pending tasks
curl -X GET "http://localhost:5002/api/fulfillment/pending-tasks?priority=high" \
  -H "Authorization: Bearer <your-token>"

# 3. Get orders by employee
curl -X GET "http://localhost:5002/api/fulfillment/orders/employee/emp123?status=Confirmed" \
  -H "Authorization: Bearer <your-token>"

# 4. Get picklists by employee
curl -X GET "http://localhost:5002/api/fulfillment/picklists/employee/emp123" \
  -H "Authorization: Bearer <your-token>"

# 5. Update picklist status
curl -X PATCH "http://localhost:5002/api/fulfillment/picklists/picklist123/status" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"scanStatus": "In Progress"}'

# 6. Assign picklist to employee
curl -X PATCH "http://localhost:5002/api/fulfillment/picklists/picklist123/assign" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "emp123"}'
```

---

## 🚀 **Deployment Notes**

1. **Environment Variables**: Ensure all required environment variables are set
2. **Database**: Ensure MongoDB connection is properly configured
3. **Authentication**: Verify JWT token validation is working
4. **CORS**: Configure CORS settings for your frontend domain
5. **Rate Limiting**: Consider implementing rate limiting for production

---

**Status:** ✅ **COMPLETED**
**Date:** January 2024
**Priority:** High
**Impact:** Fulfillment management and employee productivity tracking
