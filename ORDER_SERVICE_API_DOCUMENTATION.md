# Order Service API Documentation

## Overview

The Order Service manages orders, carts, payments, fulfillment, picklists, returns, refunds, tickets, and SLA violations. It operates on port **5003**.

**Base URL**: `http://localhost:5003/api` (Development)  
**Production URL**: `https://api.toprise.in/api`

---

## Table of Contents

1. [Order Management](#order-management)
2. [Cart Management](#cart-management)
3. [Wishlist Management](#wishlist-management)
4. [Payment Processing](#payment-processing)
5. [Picklist Management](#picklist-management)
6. [Fulfillment](#fulfillment)
7. [SLA Management](#sla-management)
8. [Returns & Refunds](#returns--refunds)
9. [Tickets](#tickets)
10. [Document Upload System](#document-upload-system)
11. [Analytics & Reporting](#analytics--reporting)
12. [Dealer Order KPIs](#dealer-order-kpis)
13. [Order Statistics](#order-statistics)
14. [Payment Statistics](#payment-statistics)
15. [Audit Logs](#audit-logs)

---

## Order Management

### 1. Create Order

**Endpoint**: `POST /api/orders/create`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "user_id": "user_id",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": {
      "building_no": "123",
      "street": "Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001"
    }
  },
  "items": [
    {
      "product_id": "product_id",
      "quantity": 2,
      "price": 1000
    }
  ],
  "payment_method": "online",
  "delivery_type": "standard"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "order": { /* order object */ },
    "orderId": "ORD-20250127-00001"
  }
}
```

---

### 2. Get All Orders

**Endpoint**: `GET /api/orders/all`  
**Access**: Authenticated users

**Query Parameters**:
- `page`, `limit`: Pagination
- `status`: Filter by status
- `userId`: Filter by user
- `dealerId`: Filter by dealer
- `startDate`, `endDate`: Date range
- `orderId`: Search by order ID

---

### 3. Get Order by ID

**Endpoint**: `GET /api/orders/id/:id`  
**Access**: Authenticated users

**Response**: Complete order details with populated data

---

### 4. Get Orders by User ID

**Endpoint**: `GET /api/orders/user/:userId`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `status`

---

### 5. Assign Dealers to Order

**Endpoint**: `POST /api/orders/assign-dealers`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "orderId": "order_id",
  "assignments": [
    {
      "dealerId": "dealer_id",
      "skus": ["sku1", "sku2"]
    }
  ]
}
```

---

### 6. Reassign Dealers to Order

**Endpoint**: `POST /api/orders/reassign-dealers`  
**Access**: Authenticated users

**Description**: Reassign dealers for order items

---

### 7. Update Order Status by Dealer

**Endpoint**: `PUT /api/orders/update/order-status-by-dealer`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "orderId": "order_id",
  "dealerId": "dealer_id",
  "status": "Packed"
}
```

**Description**: Marks dealer as packed and creates Borzo order if applicable

---

### 8. Mark Order as Packed

**Endpoint**: `POST /api/orders/:orderId/pack`  
**Access**: Authenticated users

---

### 9. Mark Order as Shipped

**Endpoint**: `POST /api/orders/ship`  
**Access**: Authenticated users

---

### 10. Mark Order as Delivered

**Endpoint**: `POST /api/orders/:orderId/deliver`  
**Access**: Authenticated users

---

### 11. Cancel Order

**Endpoint**: `POST /api/orders/:orderId/cancel`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "cancellationReason": "Customer request"
}
```

---

### 12. Mark SKU as Packed

**Endpoint**: `POST /api/orders/:orderId/sku/:sku/pack`  
**Access**: Authenticated users

---

### 13. Mark SKU as Shipped

**Endpoint**: `POST /api/orders/:orderId/sku/:sku/ship`  
**Access**: Authenticated users

**Description**: Marks SKU as shipped and creates Borzo order if not exists

---

### 14. Mark SKU as Delivered

**Endpoint**: `POST /api/orders/:orderId/sku/:sku/deliver`  
**Access**: Authenticated users

---

### 15. Get Order Status Breakdown

**Endpoint**: `GET /api/orders/:orderId/status-breakdown`  
**Access**: Authenticated users

**Response**: Detailed status breakdown by SKU and dealer

---

### 16. Check and Mark Order as Delivered

**Endpoint**: `POST /api/orders/:orderId/check-delivery`  
**Access**: Authenticated users

**Description**: Automatically checks if all SKUs are delivered and updates order status

---

### 17. Batch Assign Orders

**Endpoint**: `POST /api/orders/batch/assign`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "orderIds": ["order_id1", "order_id2"]
}
```

---

### 18. Batch Update Order Status

**Endpoint**: `POST /api/orders/batch/status-update`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "orderIds": ["order_id1", "order_id2"],
  "status": "Shipped"
}
```

---

### 19. Generate Order Reports

**Endpoint**: `GET /api/orders/reports`  
**Access**: Authenticated users

**Query Parameters**: `startDate`, `endDate`, `format`, `status`, `dealerId`

**Response**: CSV/Excel file or JSON data

---

### 20. Get Orders for Fulfillment Staff

**Endpoint**: `GET /api/orders/staff/:staffId/orders`  
**Access**: Authenticated users

**Query Parameters**: `dealerId`, `sku`, `status`, `page`, `limit`

**Description**: Get orders filtered by fulfillment staff assignment

---

## Cart Management

### 1. Add Product to Cart

**Endpoint**: `POST /api/carts/addProduct`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "userId": "user_id",
  "productId": "product_id",
  "quantity": 2,
  "dealerId": "dealer_id" // optional
}
```

---

### 2. Update Cart Quantity

**Endpoint**: `PUT /api/carts/update`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "cartId": "cart_id",
  "itemId": "item_id",
  "quantity": 3
}
```

---

### 3. Remove Product from Cart

**Endpoint**: `POST /api/carts/removeProduct`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "cartId": "cart_id",
  "itemId": "item_id"
}
```

---

### 4. Get Cart by User ID

**Endpoint**: `GET /api/carts/getCart/:userId`  
**Access**: Super-admin, Inventory-Admin, User

---

### 5. Get Cart by ID

**Endpoint**: `GET /api/carts/getCartById/:id`  
**Access**: Super-admin, Inventory-Admin, User

---

## Wishlist Management

### 1. Add Item to Wishlist

**Endpoint**: `POST /api/wishlist`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "userId": "user_id",
  "productId": "product_id"
}
```

---

### 2. Remove Item from Wishlist

**Endpoint**: `POST /api/wishlist/remove`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "wishlistId": "wishlist_id",
  "productId": "product_id"
}
```

---

### 3. Get Wishlist by ID

**Endpoint**: `GET /api/wishlist/byId/:wishlistId`  
**Access**: Super-admin, Inventory-Admin, User

---

### 4. Get Wishlist by User ID

**Endpoint**: `GET /api/wishlist/byUser/:userId`  
**Access**: Super-admin, Inventory-Admin, User

---

### 5. Move Item to Cart

**Endpoint**: `PUT /api/wishlist`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "wishlistId": "wishlist_id",
  "productId": "product_id",
  "quantity": 1
}
```

---

## Payment Processing

### 1. Create Payment

**Endpoint**: `POST /api/payment`  
**Access**: Super-admin, Fulfillment-Admin, User

**Request Body**:
```json
{
  "orderId": "order_id",
  "amount": 1000,
  "payment_method": "online",
  "currency": "INR"
}
```

**Response**: Razorpay order details

---

### 2. Verify Payment (Webhook)

**Endpoint**: `POST /api/payment/webhook`  
**Access**: Razorpay (webhook)

**Description**: Handles Razorpay payment webhook

---

### 3. Check Payment Status

**Endpoint**: `POST /api/payment/checkStatus`  
**Access**: Super-admin, Fulfillment-Admin, User

**Request Body**:
```json
{
  "paymentId": "payment_id"
}
```

---

### 4. Get All Payments

**Endpoint**: `GET /api/payment/all`  
**Access**: Super-admin, Fulfillment-Admin, User

**Query Parameters**: `page`, `limit`, `status`, `orderId`, `userId`

---

### 5. Get Payment by ID

**Endpoint**: `GET /api/payment/by-id/:paymentId`  
**Access**: Super-admin, Fulfillment-Admin, User

---

### 6. Get Payment by Order ID

**Endpoint**: `GET /api/payment/by-order-id/:orderId`  
**Access**: Super-admin, Fulfillment-Admin, User

---

### 7. Search Payments with Order Details

**Endpoint**: `GET /api/payment/search`  
**Access**: Super-admin, Fulfillment-Admin, User

**Query Parameters**: `query`, `page`, `limit`

---

## Picklist Management

### 1. Get All Picklists

**Endpoint**: `GET /api/orders/picklists`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `status`, `dealerId`, `staffId`

---

### 2. Get Picklist by ID

**Endpoint**: `GET /api/orders/picklists/:id`  
**Access**: Authenticated users

**Response**: Complete picklist with populated order, dealer, and staff data

---

### 3. Get Picklist by Dealer

**Endpoint**: `GET /api/orders/picklists/dealer/:dealerId`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `status`

---

### 4. Get Picklist by Employee

**Endpoint**: `GET /api/orders/picklists/employee/:employeeId`  
**Access**: Authenticated users

**Query Parameters**: `dealerId`, `sku`, `status`, `page`, `limit`

---

### 5. Get Picklist Statistics

**Endpoint**: `GET /api/orders/picklists/stats`  
**Access**: Authenticated users

**Query Parameters**: `startDate`, `endDate`, `dealerId`, `status`

**Response**: Statistics with dealer and staff details

---

### 6. Get Fulfillment Staff Picklist Statistics

**Endpoint**: `GET /api/orders/picklists/stats/staff`  
**Access**: Authenticated users

**Query Parameters**: `startDate`, `endDate`, `dealerId`, `status`, `staffId`, `page`, `limit`

**Response**: Per-staff picklist statistics

---

### 7. Create Pickup

**Endpoint**: `POST /api/orders/create-pickup`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "orderId": "order_id",
  "dealerId": "dealer_id",
  "pickupDate": "2025-01-27"
}
```

---

### 8. Assign Picklist to Staff

**Endpoint**: `POST /api/orders/assign-picklist`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "picklistId": "picklist_id",
  "staffId": "employee_id"
}
```

---

### 9. Scan SKU

**Endpoint**: `POST /api/orders/scan`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "picklistId": "picklist_id",
  "sku": "SKU123",
  "quantity": 1
}
```

**Description**: Scans SKU and updates picklist status

---

### 10. Get Scan Logs

**Endpoint**: `GET /api/orders/scanlogs`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `picklistId`, `dealerId`

---

### 11. Get Scan Logs by Dealer

**Endpoint**: `GET /api/orders/scanlogs/dealer/:dealerId`  
**Access**: Authenticated users

---

## Fulfillment

### 1. Get Fulfillment Statistics

**Endpoint**: `GET /api/fulfillment/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Fulfillment-Staff, Inventory-Staff

---

### 2. Get Pending Tasks

**Endpoint**: `GET /api/fulfillment/pending-tasks`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Fulfillment-Staff, Inventory-Staff

---

### 3. Get Picklists by Employee

**Endpoint**: `GET /api/fulfillment/picklists/employee/:employeeId`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Fulfillment-Staff, Inventory-Staff

---

### 4. Get Picklists by Dealer

**Endpoint**: `GET /api/fulfillment/picklists/dealer/:dealerId`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Fulfillment-Staff, Inventory-Staff

---

### 5. Update Picklist Status

**Endpoint**: `PATCH /api/fulfillment/picklists/:picklistId/status`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Fulfillment-Staff, Inventory-Staff

**Request Body**:
```json
{
  "status": "Completed"
}
```

---

## SLA Management

### 1. Create SLA Type

**Endpoint**: `POST /api/orders/sla/types`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "name": "Packing SLA",
  "description": "Time to pack order",
  "duration_hours": 24,
  "sla_type": "packing"
}
```

---

### 2. Get SLA Types

**Endpoint**: `GET /api/orders/sla/types`  
**Access**: Authenticated users

---

### 3. Get SLA by Name

**Endpoint**: `GET /api/orders/get-by-name`  
**Query Parameters**: `name`

**Access**: Authenticated users

---

### 4. Set Dealer SLA

**Endpoint**: `POST /api/orders/dealers/:dealerId/sla`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "slaTypeId": "sla_type_id",
  "duration_hours": 24
}
```

---

### 5. Log SLA Violation

**Endpoint**: `POST /api/orders/sla/violations`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "orderId": "order_id",
  "dealerId": "dealer_id",
  "slaTypeId": "sla_type_id",
  "expectedTime": "2025-01-27T10:00:00Z",
  "actualTime": "2025-01-28T10:00:00Z",
  "violationDuration": 24
}
```

---

### 6. Get SLA Violations

**Endpoint**: `GET /api/orders/sla/violations`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `dealerId`, `orderId`, `status`

---

### 7. Get SLA Violations by Order

**Endpoint**: `GET /api/orders/sla/violations/order/:orderId`  
**Access**: Authenticated users

---

### 8. Get SLA Violations by Dealer

**Endpoint**: `GET /api/orders/sla/violations/dealer/:dealerId`  
**Access**: Authenticated users

---

### 9. Get SLA Violations Summary

**Endpoint**: `GET /api/orders/sla/violations/summary/:dealerId`  
**Access**: Authenticated users

---

### 10. Get Approaching SLA Violations

**Endpoint**: `GET /api/orders/sla/violations/approaching`  
**Access**: Authenticated users

**Description**: Returns orders approaching SLA violation threshold

---

### 11. Create Manual SLA Violation

**Endpoint**: `POST /api/orders/sla/violations/manual`  
**Access**: Authenticated users

---

### 12. Contact Dealer About Violation

**Endpoint**: `POST /api/orders/sla/violations/:violationId/contact-dealer`  
**Access**: Authenticated users

---

### 13. Bulk Contact Dealers

**Endpoint**: `POST /api/orders/sla/violations/bulk-contact`  
**Access**: Authenticated users

---

### 14. Get SLA Violations with Contact Info

**Endpoint**: `GET /api/orders/sla/violations/with-contact-info`  
**Access**: Authenticated users

---

### 15. Resolve SLA Violation

**Endpoint**: `PUT /api/orders/sla/violations/:violationId/resolve`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "resolutionNotes": "Issue resolved",
  "resolvedBy": "admin_user_id"
}
```

---

### 16. Get Enhanced SLA Violations

**Endpoint**: `GET /api/orders/sla/violations/enhanced`  
**Access**: Authenticated users

**Description**: Returns violations with populated order, dealer, and SLA type data

---

### 17. Get Enhanced SLA Violation by ID

**Endpoint**: `GET /api/orders/sla/violations/enhanced/:violationId`  
**Access**: Authenticated users

---

### 18. Get Enhanced SLA Violations by Dealer

**Endpoint**: `GET /api/orders/sla/violations/enhanced/dealer/:dealerId`  
**Access**: Authenticated users

---

### 19. Get Enhanced SLA Violations by Order

**Endpoint**: `GET /api/orders/sla/violations/enhanced/order/:orderId`  
**Access**: Authenticated users

---

### 20. Get SLA Violation Analytics

**Endpoint**: `GET /api/orders/sla/violations/enhanced/analytics`  
**Access**: Authenticated users

---

### 21. Search SLA Violations

**Endpoint**: `GET /api/orders/sla/violations/enhanced/search`  
**Access**: Authenticated users

**Query Parameters**: `query`, `dealerId`, `orderId`, `status`, `page`, `limit`

---

### 22. Start SLA Scheduler

**Endpoint**: `POST /api/orders/sla/scheduler/start`  
**Access**: Authenticated users

---

### 23. Stop SLA Scheduler

**Endpoint**: `POST /api/orders/sla/scheduler/stop`  
**Access**: Authenticated users

---

### 24. Get SLA Scheduler Status

**Endpoint**: `GET /api/orders/sla/scheduler/status`  
**Access**: Authenticated users

---

### 25. Trigger Manual SLA Check

**Endpoint**: `POST /api/orders/sla/scheduler/trigger-check`  
**Access**: Authenticated users

---

## Returns & Refunds

### 1. Create Return Request

**Endpoint**: `POST /api/returns/create`  
**Access**: Public (with optional authentication)

**Request Body**:
```json
{
  "orderId": "order_id",
  "userId": "user_id",
  "items": [
    {
      "sku": "SKU123",
      "quantity": 1,
      "reason": "Defective product"
    }
  ],
  "returnReason": "Product defect"
}
```

---

### 2. Get Return Request

**Endpoint**: `GET /api/returns/:returnId`  
**Access**: Super-admin, Fulfillment-Admin, Fulfillment-Staff, Inventory-Admin, Inventory-Staff, User

---

### 3. Get All Return Requests

**Endpoint**: `GET /api/returns`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `status`, `userId`, `orderId`

---

### 4. Get Return Request Statistics

**Endpoint**: `GET /api/returns/stats/overview`  
**Access**: Authenticated users

---

### 5. Get User Return Requests

**Endpoint**: `GET /api/returns/user/:userId`  
**Access**: Authenticated users

---

### 6. Validate Return Request

**Endpoint**: `PUT /api/returns/:returnId/validate`  
**Access**: Authenticated users

---

### 7. Schedule Pickup

**Endpoint**: `PUT /api/returns/:returnId/schedule-pickup`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "pickupDate": "2025-01-27",
  "pickupTime": "10:00 AM"
}
```

---

### 8. Complete Pickup

**Endpoint**: `PUT /api/returns/:returnId/complete-pickup`  
**Access**: Authenticated users

---

### 9. Start Inspection

**Endpoint**: `PUT /api/returns/:returnId/start-inspection`  
**Access**: Authenticated users

---

### 10. Complete Inspection

**Endpoint**: `PUT /api/returns/:returnId/complete-inspection`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "inspectionResult": "Approved",
  "inspectionNotes": "Product is defective"
}
```

---

### 11. Process Refund

**Endpoint**: `PUT /api/returns/:returnId/process-refund`  
**Access**: Authenticated users

---

### 12. Complete Return

**Endpoint**: `PUT /api/returns/:returnId/complete`  
**Access**: Authenticated users

---

### 13. Add Note to Return

**Endpoint**: `POST /api/returns/:returnId/notes`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "note": "Customer contacted",
  "addedBy": "admin_user_id"
}
```

---

### 14. Create Partial Refund (Online)

**Endpoint**: `POST /api/refund/createRefund-online`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "orderId": "order_id",
  "amount": 500,
  "reason": "Partial refund"
}
```

---

### 15. Create Payout (COD)

**Endpoint**: `POST /api/refund/createRefund-cod`  
**Access**: Super-admin, Inventory-Admin, User

**Request Body**:
```json
{
  "orderId": "order_id",
  "amount": 500,
  "bankDetails": {
    "account_number": "1234567890",
    "ifsc": "BANK0001234"
  }
}
```

---

### 16. Get All Refunds

**Endpoint**: `GET /api/refund`  
**Access**: Super-admin, Inventory-Admin, User

**Query Parameters**: `page`, `limit`, `orderId`, `status`

---

### 17. Get Refund by ID

**Endpoint**: `GET /api/refund/byId/:refundId`  
**Access**: Super-admin, Inventory-Admin, User

---

## Tickets

### 1. Create Ticket

**Endpoint**: `POST /api/tickets`  
**Access**: Super-admin, Inventory-Admin, User  
**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
- `userRef`: User ID
- `subject`: Ticket subject
- `description`: Ticket description
- `priority`: Priority level (Low, Medium, High, Urgent)
- `category`: Ticket category
- `files`: Array of attachment files

---

### 2. Get Ticket by ID

**Endpoint**: `GET /api/tickets/byId/:ticketId`  
**Access**: Multiple roles

---

### 3. Get Tickets by User

**Endpoint**: `GET /api/tickets/byUser/:userRef`  
**Access**: Multiple roles

---

### 4. Get Tickets by Assigned User

**Endpoint**: `GET /api/tickets/byAssignedUser/:assignRef`  
**Access**: Multiple roles

---

### 5. Update Ticket Status

**Endpoint**: `PUT /api/tickets/:ticketId/status`  
**Access**: Multiple roles

**Request Body**:
```json
{
  "status": "Resolved",
  "remarks": "Issue resolved"
}
```

---

### 6. Assign Ticket

**Endpoint**: `PUT /api/tickets/:ticketId/assign`  
**Access**: Super-admin, Customer-Support

**Request Body**:
```json
{
  "assignTo": "support_user_id"
}
```

---

### 7. Add Remarks to Ticket

**Endpoint**: `POST /api/tickets/:ticketId/remarks`  
**Access**: Multiple roles

**Request Body**:
```json
{
  "remarks": "Customer contacted",
  "addedBy": "user_id"
}
```

---

## Document Upload System

### User Endpoints

### 1. Upload Document

**Endpoint**: `POST /api/documents/upload`  
**Access**: User, Dealer, Super-admin  
**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
- `user_id`: User ID
- `description`: Requirements description
- `name`, `email`, `phone`: Customer details
- `address`, `pincode`: Address details
- `priority`: Priority level (Low, Medium, High, Urgent)
- `estimated_order_value`: Estimated value
- `files`: Array of PDF/image files (max 10)

---

### 2. Get My Uploads

**Endpoint**: `GET /api/documents/my-uploads`  
**Access**: User, Dealer

**Query Parameters**: `page`, `limit`, `status`

---

### 3. Get Documents for User

**Endpoint**: `GET /api/documents/user/:userId`  
**Access**: User, Dealer, Super-admin, Fulfillment-Admin, Customer-Support

---

### 4. Cancel Document Upload

**Endpoint**: `PATCH /api/documents/:id/cancel`  
**Access**: User, Dealer

---

### 5. Delete Document Upload

**Endpoint**: `DELETE /api/documents/:id/delete`  
**Access**: User, Dealer

---

### Admin Endpoints

### 6. Get All Documents (Admin)

**Endpoint**: `GET /api/documents/admin/all`  
**Access**: Super-admin, Fulfillment-Admin, Customer-Support

**Query Parameters**: `page`, `limit`, `status`, `priority`, `assignedTo`, `startDate`, `endDate`

---

### 7. Get Document Statistics

**Endpoint**: `GET /api/documents/admin/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 8. Assign Document to Staff

**Endpoint**: `PATCH /api/documents/admin/:id/assign`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "assignedTo": "staff_user_id"
}
```

---

### 9. Add Contact History

**Endpoint**: `POST /api/documents/admin/:id/contact`  
**Access**: Super-admin, Fulfillment-Admin, Customer-Support

**Request Body**:
```json
{
  "contactType": "Phone",
  "contactDate": "2025-01-27",
  "notes": "Customer confirmed requirements"
}
```

---

### 10. Add Admin Notes

**Endpoint**: `POST /api/documents/admin/:id/notes`  
**Access**: Super-admin, Fulfillment-Admin, Customer-Support

**Request Body**:
```json
{
  "note": "Admin note",
  "addedBy": "admin_user_id"
}
```

---

### 11. Add Items from Document

**Endpoint**: `POST /api/documents/admin/:id/items`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "items": [
    {
      "product_id": "product_id",
      "quantity": 10,
      "price": 1000
    }
  ]
}
```

---

### 12. Create Order from Document

**Endpoint**: `POST /api/documents/admin/:id/create-order`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "items": [ /* items array */ ],
  "customerDetails": { /* customer details */ },
  "payment_method": "online"
}
```

**Description**: Creates order from document and links it

---

### 13. Reject Document

**Endpoint**: `PATCH /api/documents/admin/:id/reject`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "rejectionReason": "Invalid requirements"
}
```

---

### 14. Update Document Status

**Endpoint**: `PATCH /api/documents/admin/:id/status`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "status": "Under-Review"
}
```

---

## Analytics & Reporting

### 1. Get Analytics Dashboard

**Endpoint**: `GET /api/analytics/dashboard`  
**Access**: Authenticated users

**Query Parameters**: `startDate`, `endDate`, `role`

**Response**: Role-based dashboard data

---

### 2. Get KPIs

**Endpoint**: `GET /api/analytics/kpis`  
**Access**: Authenticated users

**Response**: Comprehensive KPIs

---

### 3. Get Trends

**Endpoint**: `GET /api/analytics/trends`  
**Access**: Authenticated users

**Query Parameters**: `startDate`, `endDate`, `metric`

---

### 4. Export Dashboard

**Endpoint**: `POST /api/analytics/export`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "format": "csv",
  "data": { /* dashboard data */ }
}
```

---

### 5. Get Audit Logs

**Endpoint**: `GET /api/analytics/audit-logs`  
**Access**: Super-admin, System, Fulfillment-Admin, Inventory-Admin, Fulfillment-Staff, Inventory-Staff

**Query Parameters**: `page`, `limit`, `action`, `targetType`, `targetId`, `startDate`, `endDate`

---

### 6. Get Audit Statistics

**Endpoint**: `GET /api/analytics/audit-stats`  
**Access**: Super-admin, System

---

### 7. Get Fulfillment Analytics

**Endpoint**: `GET /api/orders/analytics/fulfillment`  
**Access**: Authenticated users

---

### 8. Get SLA Compliance Report

**Endpoint**: `GET /api/orders/analytics/sla-compliance`  
**Access**: Authenticated users

---

### 9. Get Dealer Performance

**Endpoint**: `GET /api/orders/analytics/dealer-performance`  
**Access**: Authenticated users

---

## Dealer Order KPIs

### 1. Get Dealer Order KPIs

**Endpoint**: `GET /api/orders/dealer/:dealerId/kpis`  
**Access**: Authenticated users

**Response**: KPIs including order count, revenue, average order value, etc.

---

### 2. Get Dealer Orders

**Endpoint**: `GET /api/orders/dealer/:dealerId/orders`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `status`, `startDate`, `endDate`

---

## Order Statistics

### 1. Get Order Statistics

**Endpoint**: `GET /api/orders/stats`  
**Access**: Super-admin, Inventory-Admin, Fulfillment-Admin

**Query Parameters**: `startDate`, `endDate`, `status`, `dealerId`

---

## Payment Statistics

### 1. Get Payment Statistics

**Endpoint**: `GET /api/payment/stats`  
**Access**: Authenticated users

**Query Parameters**: `startDate`, `endDate`, `payment_method`, `status`

---

## Audit Logs

### 1. Get Audit Logs

**Endpoint**: `GET /api/analytics/audit-logs`  
**Access**: Super-admin, System, Fulfillment-Admin, Inventory-Admin, Fulfillment-Staff, Inventory-Staff

**Query Parameters**: `page`, `limit`, `action`, `targetType`, `targetId`, `startDate`, `endDate`

---

### 2. Get Audit Statistics

**Endpoint**: `GET /api/analytics/audit-stats`  
**Access**: Super-admin, System

---

### 3. Get Audit Dashboard

**Endpoint**: `GET /api/analytics/audit-dashboard`  
**Access**: Super-admin, System

---

## Common Request Headers

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json (or multipart/form-data for file uploads)
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

