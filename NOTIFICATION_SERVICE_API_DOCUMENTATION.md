# Notification Service API Documentation

## Overview

The Notification Service handles all notification-related operations including push notifications, email notifications, SMS notifications, and notification templates. It operates on port **5004**.

**Base URL**: `http://localhost:5004/api/notification` (Development)  
**Production URL**: `https://api.toprise.in/api/notification`

---

## Table of Contents

1. [Notification Management](#notification-management)
2. [Notification Templates](#notification-templates)
3. [Notification Settings](#notification-settings)
4. [Actions](#actions)

---

## Notification Management

### 1. Create Broadcast Notification

**Endpoint**: `POST /api/notification/createBroadcast`  
**Access**: Public (typically Super-admin)

**Request Body**:
```json
{
  "title": "System Maintenance",
  "message": "System will be under maintenance from 2 AM to 4 AM",
  "type": "broadcast",
  "priority": "high"
}
```

**Description**: Sends notification to all users

**Response**:
```json
{
  "success": true,
  "data": {
    "notificationId": "notification_id",
    "sentTo": "all_users",
    "status": "sent"
  }
}
```

---

### 2. Create Unicast or Multicast Notification

**Endpoint**: `POST /api/notification/createUniCastOrMulticast`  
**Access**: Public (typically Super-admin)

**Request Body**:
```json
{
  "title": "Order Shipped",
  "message": "Your order has been shipped",
  "type": "unicast",
  "userIds": ["user_id1", "user_id2"],
  "data": {
    "orderId": "order_id",
    "trackingNumber": "TRACK123"
  },
  "priority": "normal"
}
```

**Description**: Sends notification to specific users

**Response**:
```json
{
  "success": true,
  "data": {
    "notificationId": "notification_id",
    "sentTo": ["user_id1", "user_id2"],
    "status": "sent"
  }
}
```

---

### 3. Get All Notifications

**Endpoint**: `GET /api/notification`  
**Access**: Authenticated users

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `type`: Filter by type (broadcast, unicast, multicast)
- `status`: Filter by status (sent, pending, failed)
- `startDate`, `endDate`: Date range

**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [ /* array of notifications */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100
    }
  }
}
```

---

### 4. Get User All Notifications

**Endpoint**: `GET /api/notification/all_userNotifications/:userId`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `read`, `type`

**Response**: All notifications for a specific user

---

### 5. Get Unread Notification Count

**Endpoint**: `GET /api/notification/unread-count/:userId`  
**Access**: Authenticated users

**Response**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

### 6. Get Notification Statistics

**Endpoint**: `GET /api/notification/stats/:userId`  
**Access**: Authenticated users

**Response**:
```json
{
  "success": true,
  "data": {
    "totalNotifications": 100,
    "unreadCount": 5,
    "readCount": 95,
    "byType": {
      "order": 50,
      "promotion": 30,
      "system": 20
    }
  }
}
```

---

### 7. Get Notification by ID

**Endpoint**: `GET /api/notification/:id`  
**Access**: Authenticated users

**Response**: Complete notification details

---

### 8. Mark Notification as Read

**Endpoint**: `PUT /api/notification/markAsRead/:id`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "userId": "user_id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "notification": { /* updated notification */ },
    "message": "Notification marked as read"
  }
}
```

---

### 9. Mark All Notifications as Read

**Endpoint**: `PUT /api/notification/markAsReadAll/:userId`  
**Access**: Authenticated users

**Response**:
```json
{
  "success": true,
  "data": {
    "updatedCount": 10,
    "message": "All notifications marked as read"
  }
}
```

---

### 10. User Delete Notification

**Endpoint**: `PUT /api/notification/markAsUserDelete/:id`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "userId": "user_id"
}
```

**Description**: Soft deletes notification for user (marks as deleted)

---

### 11. Delete All Notifications by User

**Endpoint**: `PUT /api/notification/markAsUserDeleteAll/:userId`  
**Access**: Authenticated users

**Description**: Soft deletes all notifications for a user

---

## Notification Templates

### 1. Get All Templates

**Endpoint**: `GET /api/notification/template`  
**Access**: Authenticated users (typically Super-admin)

**Query Parameters**: `type`, `status`

---

### 2. Get Template by ID

**Endpoint**: `GET /api/notification/template/:id`  
**Access**: Authenticated users

---

### 3. Create Template

**Endpoint**: `POST /api/notification/template`  
**Access**: Super-admin

**Request Body**:
```json
{
  "name": "Order Shipped Template",
  "type": "order",
  "title": "Order Shipped",
  "message": "Your order {{orderId}} has been shipped",
  "variables": ["orderId", "trackingNumber"],
  "status": "active"
}
```

---

### 4. Update Template

**Endpoint**: `PUT /api/notification/template/:id`  
**Access**: Super-admin

---

### 5. Delete Template

**Endpoint**: `DELETE /api/notification/template/:id`  
**Access**: Super-admin

---

## Notification Settings

### 1. Get Notification Settings

**Endpoint**: `GET /api/notification/setting`  
**Query Parameters**: `userId`

**Access**: Authenticated users

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "pushEnabled": true,
    "emailEnabled": true,
    "smsEnabled": false,
    "preferences": {
      "orderUpdates": true,
      "promotions": false,
      "systemAlerts": true
    }
  }
}
```

---

### 2. Update Notification Settings

**Endpoint**: `PUT /api/notification/setting`  
**Access**: Authenticated users

**Request Body**:
```json
{
  "userId": "user_id",
  "pushEnabled": true,
  "emailEnabled": true,
  "smsEnabled": false,
  "preferences": {
    "orderUpdates": true,
    "promotions": false,
    "systemAlerts": true
  }
}
```

---

## Actions

### 1. Get All Actions

**Endpoint**: `GET /api/notification/action`  
**Access**: Authenticated users

**Description**: Get all notification action types

---

### 2. Get Action by ID

**Endpoint**: `GET /api/notification/action/:id`  
**Access**: Authenticated users

---

### 3. Create Action

**Endpoint**: `POST /api/notification/action`  
**Access**: Super-admin

**Request Body**:
```json
{
  "name": "ORDER_SHIPPED",
  "description": "Triggered when order is shipped",
  "category": "order"
}
```

---

### 4. Update Action

**Endpoint**: `PUT /api/notification/action/:id`  
**Access**: Super-admin

---

### 5. Delete Action

**Endpoint**: `DELETE /api/notification/action/:id`  
**Access**: Super-admin

---

## Notification Types

The system supports the following notification types:

1. **Broadcast**: Sent to all users
2. **Unicast**: Sent to a single user
3. **Multicast**: Sent to multiple specific users

## Notification Categories

1. **Order**: Order-related notifications (created, shipped, delivered, etc.)
2. **Promotion**: Promotional notifications
3. **System**: System alerts and maintenance notifications
4. **Payment**: Payment-related notifications
5. **Return**: Return and refund notifications

## Notification Priority Levels

1. **Low**: Non-urgent notifications
2. **Normal**: Standard notifications
3. **High**: Important notifications
4. **Urgent**: Critical notifications

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

## Integration Notes

### Push Notifications
- Uses Firebase Cloud Messaging (FCM)
- Requires FCM token in user profile
- Supports both Android and iOS

### Email Notifications
- Uses SMTP server configuration
- Supports HTML email templates
- Includes email verification

### SMS Notifications
- Integrates with third-party SMS provider
- Supports transactional and promotional SMS
- Requires phone number verification

---

**Last Updated**: 2025-01-27  
**Service Version**: 1.0.0

