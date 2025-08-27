# Employee Region & Dealer Endpoints Documentation

## 🎯 **Overview**

This document provides comprehensive API documentation for employee management endpoints that support region and dealer assignments. These endpoints enable efficient filtering and retrieval of employees based on their assigned regions and dealers, with special focus on fulfillment staff management.

## 📋 **Base URL**
```
http://localhost:5001/api/users
```

## 🔐 **Authentication**
All endpoints require authentication with JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📊 **Available Endpoints**

### **1. Get Employees by Dealer**
**GET** `/api/users/employees/dealer/:dealerId`

Get all employees assigned to a specific dealer.

**Path Parameters:**
- `dealerId`: ID of the dealer

**Query Parameters:**
- `role` (optional): Filter by employee role (e.g., "Fulfillment-Staff", "Inventory-Staff")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```bash
curl -X GET "http://localhost:5001/api/users/employees/dealer/dealer123?role=Fulfillment-Staff&page=1&limit=15" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "_id": "employee_id_123",
        "user_id": {
          "_id": "user_id_123",
          "email": "john.doe@company.com",
          "username": "johndoe",
          "phone_Number": "+1234567890",
          "role": "Fulfillment-Staff"
        },
        "employee_id": "EMP001",
        "First_name": "John",
        "profile_image": "https://example.com/profile.jpg",
        "mobile_number": "+1234567890",
        "email": "john.doe@company.com",
        "role": "Fulfillment-Staff",
        "assigned_dealers": [
          {
            "_id": "dealer123",
            "dealerId": "DLR001",
            "legal_name": "ABC Motors Ltd",
            "trade_name": "ABC Motors"
          }
        ],
        "assigned_regions": ["North", "Central"],
        "last_login": "2024-01-15T10:30:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 25,
      "totalPages": 2,
      "currentPage": 1,
      "itemsPerPage": 15,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "dealerId": "dealer123",
      "role": "Fulfillment-Staff"
    }
  },
  "message": "Employees by dealer retrieved successfully"
}
```

---

### **2. Get Employees by Region**
**GET** `/api/users/employees/region/:region`

Get all employees assigned to a specific region (including those without dealer assignments).

**Path Parameters:**
- `region`: Name of the region

**Query Parameters:**
- `role` (optional): Filter by employee role
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `includeNoDealer` (optional): Include employees with no dealer assignments (default: true)

**Example Request:**
```bash
curl -X GET "http://localhost:5001/api/users/employees/region/North?role=Fulfillment-Staff&includeNoDealer=true&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "_id": "employee_id_123",
        "user_id": {
          "_id": "user_id_123",
          "email": "john.doe@company.com",
          "username": "johndoe",
          "phone_Number": "+1234567890",
          "role": "Fulfillment-Staff"
        },
        "employee_id": "EMP001",
        "First_name": "John",
        "profile_image": "https://example.com/profile.jpg",
        "mobile_number": "+1234567890",
        "email": "john.doe@company.com",
        "role": "Fulfillment-Staff",
        "assigned_dealers": [],
        "assigned_regions": ["North"],
        "last_login": "2024-01-15T10:30:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 30,
      "totalPages": 2,
      "currentPage": 1,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "region": "North",
      "role": "Fulfillment-Staff",
      "includeNoDealer": true
    }
  },
  "message": "Employees by region retrieved successfully"
}
```

---

### **3. Get Employees by Region and Dealer**
**GET** `/api/users/employees/region/:region/dealer/:dealerId`

Get all employees assigned to both a specific region and dealer.

**Path Parameters:**
- `region`: Name of the region
- `dealerId`: ID of the dealer

**Query Parameters:**
- `role` (optional): Filter by employee role
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```bash
curl -X GET "http://localhost:5001/api/users/employees/region/North/dealer/dealer123?role=Fulfillment-Staff&page=1&limit=15" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "_id": "employee_id_123",
        "user_id": {
          "_id": "user_id_123",
          "email": "john.doe@company.com",
          "username": "johndoe",
          "phone_Number": "+1234567890",
          "role": "Fulfillment-Staff"
        },
        "employee_id": "EMP001",
        "First_name": "John",
        "profile_image": "https://example.com/profile.jpg",
        "mobile_number": "+1234567890",
        "email": "john.doe@company.com",
        "role": "Fulfillment-Staff",
        "assigned_dealers": [
          {
            "_id": "dealer123",
            "dealerId": "DLR001",
            "legal_name": "ABC Motors Ltd",
            "trade_name": "ABC Motors"
          }
        ],
        "assigned_regions": ["North"],
        "last_login": "2024-01-15T10:30:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 10,
      "totalPages": 1,
      "currentPage": 1,
      "itemsPerPage": 15,
      "hasNextPage": false,
      "hasPreviousPage": false
    },
    "filters": {
      "region": "North",
      "dealerId": "dealer123",
      "role": "Fulfillment-Staff"
    }
  },
  "message": "Employees by region and dealer retrieved successfully"
}
```

---

### **4. Get Fulfillment Staff by Region** ⭐ **SPECIALIZED**
**GET** `/api/users/employees/fulfillment/region/:region`

Get fulfillment staff assigned to a specific region (specifically for Fulfillment-Staff and Fulfillment-Admin roles).

**Path Parameters:**
- `region`: Name of the region

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `includeNoDealer` (optional): Include employees with no dealer assignments (default: true)

**Example Request:**
```bash
curl -X GET "http://localhost:5001/api/users/employees/fulfillment/region/North?includeNoDealer=true&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "_id": "employee_id_123",
        "user_id": {
          "_id": "user_id_123",
          "email": "john.doe@company.com",
          "username": "johndoe",
          "phone_Number": "+1234567890",
          "role": "Fulfillment-Staff"
        },
        "employee_id": "EMP001",
        "First_name": "John",
        "profile_image": "https://example.com/profile.jpg",
        "mobile_number": "+1234567890",
        "email": "john.doe@company.com",
        "role": "Fulfillment-Staff",
        "assigned_dealers": [],
        "assigned_regions": ["North"],
        "last_login": "2024-01-15T10:30:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 15,
      "totalPages": 1,
      "currentPage": 1,
      "itemsPerPage": 20,
      "hasNextPage": false,
      "hasPreviousPage": false
    },
    "filters": {
      "region": "North",
      "includeNoDealer": true
    }
  },
  "message": "Fulfillment staff by region retrieved successfully"
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

## 📊 **Employee Creation with Region Support**

The existing employee creation endpoint already supports region assignment:

**POST** `/api/users/create-Employee`

**Request Body Example:**
```json
{
  "email": "john.doe@company.com",
  "username": "johndoe",
  "password": "securepassword123",
  "phone_Number": "+1234567890",
  "role": "User",
  "employee_id": "EMP001",
  "First_name": "John",
  "profile_image": "https://example.com/profile.jpg",
  "mobile_number": "+1234567890",
  "assigned_dealers": ["dealer123", "dealer456"],
  "assigned_regions": ["North", "Central"],
  "employeeRole": "Fulfillment-Staff"
}
```

## 📊 **Error Responses**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Region is required",
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
  "message": "No employees found for the specified criteria",
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
// Get employees by dealer
const getEmployeesByDealer = async (dealerId, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/users/employees/dealer/${dealerId}?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Get employees by region
const getEmployeesByRegion = async (region, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/users/employees/region/${region}?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Get fulfillment staff by region
const getFulfillmentStaffByRegion = async (region, filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/users/employees/fulfillment/region/${region}?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Create employee with region assignment
const createEmployeeWithRegion = async (employeeData) => {
  const response = await fetch('/api/users/create-Employee', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...employeeData,
      assigned_regions: ["North", "Central"],
      employeeRole: "Fulfillment-Staff"
    })
  });
  return response.json();
};
```

---

## 📋 **Testing**

### **Test with curl commands:**

```bash
# 1. Get employees by dealer
curl -X GET "http://localhost:5001/api/users/employees/dealer/dealer123?role=Fulfillment-Staff" \
  -H "Authorization: Bearer <your-token>"

# 2. Get employees by region
curl -X GET "http://localhost:5001/api/users/employees/region/North?includeNoDealer=true" \
  -H "Authorization: Bearer <your-token>"

# 3. Get employees by region and dealer
curl -X GET "http://localhost:5001/api/users/employees/region/North/dealer/dealer123" \
  -H "Authorization: Bearer <your-token>"

# 4. Get fulfillment staff by region
curl -X GET "http://localhost:5001/api/users/employees/fulfillment/region/North" \
  -H "Authorization: Bearer <your-token>"

# 5. Create employee with region assignment
curl -X POST "http://localhost:5001/api/users/create-Employee" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "username": "johndoe",
    "password": "securepassword123",
    "phone_Number": "+1234567890",
    "employee_id": "EMP001",
    "First_name": "John",
    "assigned_regions": ["North", "Central"],
    "employeeRole": "Fulfillment-Staff"
  }'
```

---

## 🚀 **Use Cases**

### **1. Fulfillment Staff Management**
- **Scenario**: A fulfillment manager needs to assign tasks to staff in a specific region
- **Solution**: Use `/api/users/employees/fulfillment/region/:region` to get all available fulfillment staff

### **2. Regional Operations**
- **Scenario**: Regional managers need to see all employees in their region
- **Solution**: Use `/api/users/employees/region/:region` to get comprehensive regional staff list

### **3. Dealer-Specific Operations**
- **Scenario**: Dealer managers need to see employees assigned to their dealership
- **Solution**: Use `/api/users/employees/dealer/:dealerId` to get dealer-specific staff

### **4. Cross-Regional Assignments**
- **Scenario**: Employees working across multiple regions and dealers
- **Solution**: Use `/api/users/employees/region/:region/dealer/:dealerId` for precise filtering

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
**Impact:** Employee management and regional operations
