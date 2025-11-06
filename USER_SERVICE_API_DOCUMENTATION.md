# User Service API Documentation

## Overview

The User Service handles all user-related operations including authentication, user management, dealer management, employee management, and user analytics. It operates on port **5001**.

**Base URL**: `http://localhost:5001/api/users` (Development)  
**Production URL**: `https://api.toprise.in/api/users`

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Dealer Management](#dealer-management)
4. [Employee Management](#employee-management)
5. [Fulfillment Staff](#fulfillment-staff)
6. [Address Management](#address-management)
7. [Vehicle Management](#vehicle-management)
8. [Bank Details](#bank-details)
9. [Dealer Dashboard](#dealer-dashboard)
10. [Statistics & Analytics](#statistics--analytics)
11. [Reports](#reports)
12. [Audit Logs](#audit-logs)
13. [Pincode Management](#pincode-management)
14. [Internal Endpoints](#internal-endpoints)

---

## Authentication

### 1. User Signup

**Endpoint**: `POST /api/users/signup`  
**Access**: Public  
**Description**: Register a new user account

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone_Number": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "User"
    },
    "token": "jwt_token_here"
  },
  "message": "User created successfully"
}
```

---

### 2. User Login (Mobile)

**Endpoint**: `POST /api/users/login`  
**Access**: Public  
**Description**: Authenticate user for mobile application

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

---

### 3. User Login (Web Dashboard)

**Endpoint**: `POST /api/users/loginWeb`  
**Access**: Public  
**Description**: Authenticate user for web dashboard (includes employee status check)

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response**: Same as mobile login

---

### 4. Check User Account

**Endpoint**: `POST /api/users/check-user`  
**Access**: Public  
**Description**: Check if a user account exists

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

---

### 5. Password Reset

**Send Reset Email**: `POST /api/users/user/send-reset/paswordmail`  
**Verify Reset Link**: `GET /api/users/user/reset/password-verify/:token`  
**Reset Password**: `POST /api/users/user/reset/password/:token`

---

## User Management

### 1. Get All Users

**Endpoint**: `GET /api/users`  
**Access**: Authenticated (Multiple roles)  
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `role` (optional): Filter by role
- `search` (optional): Search by name/email

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [ /* array of users */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100
    }
  }
}
```

---

### 2. Get User by ID

**Endpoint**: `GET /api/users/:id`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, User

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "User",
    "phone_Number": "+1234567890"
  }
}
```

---

### 3. Create User (Admin)

**Endpoint**: `POST /api/users/createUser`  
**Access**: Super-admin  
**Description**: Admin creates a new user account

**Request Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone_Number": "+1234567890",
  "role": "User"
}
```

---

### 4. Delete User

**Endpoint**: `DELETE /api/users/:id`  
**Access**: Super-admin

---

### 5. Update User Profile

**Endpoint**: `PUT /api/users/profile/:userId`  
**Access**: User

**Request Body**:
```json
{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

---

### 6. Revoke User Role

**Endpoint**: `PUT /api/users/revoke-role/:id`  
**Access**: Super-admin  
**Description**: Revoke a user's role

---

## Dealer Management

### 1. Get All Dealers

**Endpoint**: `GET /api/users/dealers`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

**Query Parameters**:
- `page`, `limit`: Pagination
- `status`: Filter by status (active/inactive)
- `search`: Search by name/email

---

### 2. Get Dealer by ID

**Endpoint**: `GET /api/users/dealer/:id`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Dealer

**Response**: Includes dealer details with populated category names

---

### 3. Create Dealer

**Endpoint**: `POST /api/users/dealer`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "user_id": "user_id",
  "dealer_name": "ABC Motors",
  "categories_allowed": ["category_id1", "category_id2"],
  "address": {
    "building_no": "123",
    "street": "Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

---

### 4. Update Dealer

**Endpoint**: `PUT /api/users/dealer/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 5. Disable Dealer

**Endpoint**: `PATCH /api/users/disable-dealer/:dealerId`  
**Access**: Super-admin, Fulfillment-Admin

---

### 6. Enable Dealer

**Endpoint**: `PATCH /api/users/enable-dealer/:dealerId`  
**Access**: Super-admin, Fulfillment-Admin

---

### 7. Bulk Create Dealers

**Endpoint**: `POST /api/users/dealers/bulk`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

**Request**: CSV file with dealer data

---

### 8. Get Dealers by Category

**Endpoint**: `GET /api/users/get/dealerByCategory/:categoryId`  
**Access**: Multiple roles

---

### 9. Get Dealers by Category Name

**Endpoint**: `GET /api/users/get/dealerByCategoryName/:categoryName`  
**Access**: Multiple roles

---

### 10. Add Allowed Categories to Dealer

**Endpoint**: `PATCH /api/users/updateDealer/addAllowedCategores/:dealerId`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "categories": ["category_id1", "category_id2"]
}
```

---

### 11. Remove Allowed Categories from Dealer

**Endpoint**: `PATCH /api/users/updateDealer/removeAllowedCategores/:dealerId`  
**Access**: Super-admin, Fulfillment-Admin

---

### 12. Get Dealers for Product Assignment

**Endpoint**: `GET /api/users/get/dealer-for-assign/:productId`  
**Access**: Super-admin, Fulfillment-Admin  
**Description**: Get dealers eligible to be assigned a product based on categories

---

## Employee Management

### 1. Get All Employees

**Endpoint**: `GET /api/users/getemployees`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

**Query Parameters**:
- `page`, `limit`: Pagination
- `role`: Filter by role
- `active`: Filter by active status
- `region`: Filter by region

---

### 2. Get Employee by ID

**Endpoint**: `GET /api/users/employee/get-by-id`  
**Query Parameters**: `employeeId`

**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 3. Get Employee Details

**Endpoint**: `GET /api/users/employee/:employeeId`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 4. Create Employee

**Endpoint**: `POST /api/users/create-Employee`  
**Access**: Super-admin

**Request Body**:
```json
{
  "user_id": "user_id",
  "First_name": "John",
  "Last_name": "Doe",
  "email": "employee@example.com",
  "role": "Fulfillment-Staff",
  "region": "North",
  "phone": "+1234567890"
}
```

---

### 5. Revoke Employee Role

**Endpoint**: `PUT /api/users/employee/revoke-role`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "employeeId": "employee_id",
  "updatedBy": "admin_user_id"
}
```

**Note**: This deactivates the employee but preserves the user's role field.

---

### 6. Reactivate Employee Role

**Endpoint**: `PUT /api/users/employee/reactivate-role`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "employeeId": "employee_id",
  "updatedBy": "admin_user_id"
}
```

---

### 7. Get Employees by Dealer

**Endpoint**: `GET /api/users/employees/dealer/:dealerId`  
**Access**: Multiple roles

---

### 8. Get Employees by Region

**Endpoint**: `GET /api/users/employees/region/:region`  
**Access**: Multiple roles

---

### 9. Get Employees by Region and Dealer

**Endpoint**: `GET /api/users/employees/region/:region/dealer/:dealerId`  
**Access**: Multiple roles

---

### 10. Assign Employees to Dealer

**Endpoint**: `POST /api/users/dealers/:dealerId/assign-employees`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "employeeIds": ["employee_id1", "employee_id2"]
}
```

---

### 11. Remove Employees from Dealer

**Endpoint**: `DELETE /api/users/dealers/:dealerId/remove-employees`  
**Access**: Super-admin, Fulfillment-Admin

---

### 12. Get Dealer Assigned Employees

**Endpoint**: `GET /api/users/dealers/:dealerId/assigned-employees`  
**Access**: Super-admin, Fulfillment-Admin, Dealer

---

### 13. Bulk Assign Employees to Dealers

**Endpoint**: `POST /api/users/dealers/bulk-assign-employees`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "assignments": [
    {
      "dealerId": "dealer_id",
      "employeeIds": ["employee_id1", "employee_id2"]
    }
  ]
}
```

---

## Fulfillment Staff

### 1. Get All Fulfillment Staff

**Endpoint**: `GET /api/users/fulfillment-staff`  
**Access**: Super-admin, Fulfillment-Admin

**Query Parameters**:
- `page`, `limit`: Pagination
- `region`: Filter by region
- `active`: Filter by active status

---

### 2. Get Fulfillment Staff Statistics

**Endpoint**: `GET /api/users/fulfillment-staff/stats`  
**Access**: Super-admin, Fulfillment-Admin

---

### 3. Get Available Regions

**Endpoint**: `GET /api/users/fulfillment-staff/regions`  
**Access**: Super-admin, Fulfillment-Admin

---

### 4. Get Fulfillment Staff by Region

**Endpoint**: `GET /api/users/fulfillment-staff/by-region`  
**Query Parameters**: `region`

**Access**: Super-admin, Fulfillment-Admin

---

### 5. Get Fulfillment Staff by User ID

**Endpoint**: `GET /api/users/fulfillment-staff/by-user/:userId`  
**Access**: Super-admin, Fulfillment-Admin, Fulfillment-Staff

---

### 6. Get Fulfillment Staff by ID

**Endpoint**: `GET /api/users/fulfillment-staff/:id`  
**Access**: Super-admin, Fulfillment-Admin, Fulfillment-Staff

---

## Address Management

### 1. Update User Address

**Endpoint**: `PUT /api/users/updateAddress/:id`  
**Access**: User

**Request Body**:
```json
{
  "addresses": [
    {
      "building_no": "123",
      "street": "Main Street",
      "area": "Downtown",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "country": "India",
      "is_default": true
    }
  ]
}
```

---

### 2. Edit User Address

**Endpoint**: `PUT /api/users/address/:userId`  
**Access**: User

---

### 3. Delete User Address

**Endpoint**: `DELETE /api/users/address/:userId`  
**Query Parameters**: `addressId`

**Access**: User

---

## Vehicle Management

### 1. Add Vehicle Details

**Endpoint**: `POST /api/users/:userId/vehicles`  
**Access**: User, Super-admin

**Request Body**:
```json
{
  "brand": "Honda",
  "model": "City",
  "variant": "VX",
  "year": 2023,
  "registration_number": "MH01AB1234"
}
```

---

### 2. Update Vehicle Details

**Endpoint**: `PUT /api/users/:userId/vehicles/:vehicleId`  
**Access**: User, Super-admin

---

### 3. Delete Vehicle Details

**Endpoint**: `DELETE /api/users/:userId/vehicles/:vehicleId`  
**Access**: User, Super-admin

---

## Bank Details

### 1. Add Bank Details

**Endpoint**: `POST /api/users/:userId/bank-details`  
**Access**: User, Super-admin

**Request Body**:
```json
{
  "account_holder_name": "John Doe",
  "account_number": "1234567890",
  "ifsc_code": "BANK0001234",
  "bank_name": "State Bank of India",
  "branch_name": "Mumbai Main",
  "account_type": "Savings"
}
```

---

### 2. Update Bank Details

**Endpoint**: `PUT /api/users/:userId/bank-details`  
**Access**: User, Super-admin

---

### 3. Get Bank Details

**Endpoint**: `GET /api/users/:userId/bank-details`  
**Access**: User, Super-admin

---

### 4. Delete Bank Details

**Endpoint**: `DELETE /api/users/:userId/bank-details`  
**Access**: User, Super-admin

---

### 5. Validate IFSC Code

**Endpoint**: `GET /api/users/validate-ifsc`  
**Query Parameters**: `ifsc`

**Access**: Public

---

### 6. Get Bank Details by Account Number

**Endpoint**: `GET /api/users/bank-details/account/:account_number`  
**Access**: Super-admin, Fulfillment-Admin

---

## Dealer Dashboard

### 1. Get Dealer Dashboard Stats

**Endpoint**: `GET /api/users/dealer/:dealerId/dashboard-stats`  
**Access**: Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

**Response**: Includes order stats, product stats, revenue, etc.

---

### 2. Get Dealer Assigned Categories

**Endpoint**: `GET /api/users/dealer/:dealerId/assigned-categories`  
**Access**: Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

**Response**: Categories with names, codes, images, and product counts

---

### 3. Get Dealer Dashboard

**Endpoint**: `GET /api/users/dealer/:dealerId/dashboard`  
**Access**: Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 4. Get Dealer ID by User ID

**Endpoint**: `GET /api/users/user/:userId/dealer-id`  
**Access**: Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 5. Get All Dealer IDs by User ID

**Endpoint**: `GET /api/users/user/:userId/all-dealer-ids`  
**Access**: Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

---

## Statistics & Analytics

### 1. Get User Statistics

**Endpoint**: `GET /api/users/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

**Response**: Total users, customers, dealers, employees counts

---

### 2. Get User Insights

**Endpoint**: `GET /api/users/insights`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 3. Get Employee Statistics

**Endpoint**: `GET /api/users/employee/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 4. Get Dealer Statistics

**Endpoint**: `GET /api/users/dealer/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

## Reports

### 1. User Analytics Report

**Endpoint**: `GET /api/users/reports/analytics`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

**Query Parameters**:
- `startDate`, `endDate`: Date range
- `groupBy`: Group by field (day, week, month)
- `role`: Filter by role

---

### 2. Dealer Analytics Report

**Endpoint**: `GET /api/users/reports/dealers`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

---

### 3. Employee Analytics Report

**Endpoint**: `GET /api/users/reports/employees`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

---

### 4. User Performance Report

**Endpoint**: `GET /api/users/reports/performance`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

---

### 5. Export User Report

**Endpoint**: `GET /api/users/reports/export`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

**Query Parameters**: Same as analytics endpoint

**Response**: CSV/Excel file download

---

## Audit Logs

### 1. Get Audit Logs

**Endpoint**: `GET /api/users/audit/logs`  
**Access**: Authenticated users

**Query Parameters**:
- `page`, `limit`: Pagination
- `action`: Filter by action type
- `userId`: Filter by user
- `targetType`: Filter by target type
- `targetId`: Filter by target ID
- `category`: Filter by category
- `startDate`, `endDate`: Date range

---

### 2. Get Audit Statistics

**Endpoint**: `GET /api/users/audit/stats`  
**Access**: Authenticated users

---

### 3. Get Audit Dashboard

**Endpoint**: `GET /api/users/audit/dashboard`  
**Access**: Authenticated users

---

### 4. Get Audit Logs by Action

**Endpoint**: `GET /api/users/audit/logs/action/:action`  
**Access**: Authenticated users

---

### 5. Get Audit Logs by User

**Endpoint**: `GET /api/users/audit/logs/user/:userId`  
**Access**: Authenticated users

---

### 6. Get User-Specific Audit Logs

**Endpoint**: `GET /api/users/:userId/audit-logs`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 7. Get Dealer Audit Logs

**Endpoint**: `GET /api/users/dealer/:dealerId/audit-logs`  
**Access**: Super-admin, Fulfillment-Admin

---

### 8. Get Employee Audit Logs

**Endpoint**: `GET /api/users/employee/:employeeId/audit-logs`  
**Access**: Super-admin, Fulfillment-Admin

---

## Pincode Management

### 1. Bulk Upload Pincodes

**Endpoint**: `POST /api/pincodes/bulk-upload`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

**Request**: CSV file with pincode data

---

### 2. Get Pincode Statistics

**Endpoint**: `GET /api/pincodes/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 3. Get All States

**Endpoint**: `GET /api/pincodes/states`  
**Access**: Public

---

### 4. Get Cities by State

**Endpoint**: `GET /api/pincodes/cities/:state`  
**Access**: Public

---

### 5. Check Pincode Serviceability

**Endpoint**: `GET /api/pincodes/check/:pincode`  
**Access**: Public

**Response**:
```json
{
  "success": true,
  "data": {
    "pincode": "400001",
    "serviceable": true,
    "city": "Mumbai",
    "state": "Maharashtra"
  }
}
```

---

### 6. Get All Pincodes

**Endpoint**: `GET /api/pincodes`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, User

**Query Parameters**: `page`, `limit`, `state`, `city`, `serviceable`

---

### 7. Create Pincode

**Endpoint**: `POST /api/pincodes`  
**Access**: Super-admin, Fulfillment-Admin

---

### 8. Update Pincode

**Endpoint**: `PUT /api/pincodes/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 9. Delete Pincode

**Endpoint**: `DELETE /api/pincodes/:id`  
**Access**: Super-admin

---

### 10. Get Pincode by Number

**Endpoint**: `GET /api/pincodes/:pincode`  
**Access**: Public

---

## Internal Endpoints

These endpoints are for inter-service communication and do not require authentication.

### 1. Get Dealer Details (Internal)

**Endpoint**: `GET /api/users/internal/dealer/:dealerId`  
**Access**: Internal services only

---

### 2. Get Dealers by User ID (Internal)

**Endpoint**: `GET /api/users/internal/dealers/user/:userId`  
**Access**: Internal services only

---

### 3. Get Employee Details (Internal)

**Endpoint**: `GET /api/users/internal/employee/:employeeId`  
**Access**: Internal services only

---

### 4. Get Super Admins (Internal)

**Endpoint**: `GET /api/users/internal/super-admins`  
**Access**: Internal services only

---

### 5. Get Customer Support Users (Internal)

**Endpoint**: `GET /api/users/internal/customer-support`  
**Access**: Internal services only

---

## Common Request Headers

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Error Responses

Standard error response format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

**Last Updated**: 2025-01-27  
**Service Version**: 1.0.0

