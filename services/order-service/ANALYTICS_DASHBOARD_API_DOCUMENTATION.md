# Analytics Dashboard, Audit Logs, and Reports API Documentation

## Overview

This document describes the comprehensive Analytics Dashboard, Audit Logs, and Reports API implementation for the Order Service. The system provides role-based access control, real-time analytics, comprehensive audit trails, and flexible report generation capabilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Role-Based Access Control](#role-based-access-control)
3. [Analytics Dashboard API](#analytics-dashboard-api)
4. [Audit Logs API](#audit-logs-api)
5. [Reports API](#reports-api)
6. [Data Models](#data-models)
7. [Authentication & Authorization](#authentication--authorization)
8. [Error Handling](#error-handling)
9. [Usage Examples](#usage-examples)
10. [Deployment & Configuration](#deployment--configuration)

## Architecture Overview

The analytics system consists of three main components:

1. **Analytics Dashboard**: Real-time KPIs, trends, and role-based dashboards
2. **Audit Logs**: Comprehensive activity tracking and security monitoring
3. **Reports**: Flexible report generation with scheduling and export capabilities

### Key Features

- **Role-Based Access Control**: Different dashboards and reports based on user roles
- **Real-Time Analytics**: Live KPIs and trend data
- **Comprehensive Audit Trails**: Track all system activities and user actions
- **Flexible Report Generation**: Multiple formats (CSV, Excel, PDF, PNG, JSON)
- **Scheduled Reports**: Automated report generation and delivery
- **Export Capabilities**: Download dashboard views and raw data
- **Performance Monitoring**: Track execution times and system health

## Role-Based Access Control

### User Roles

1. **Super Admin**
   - Full access to all dashboards, audit logs, reports, and scheduling
   - Can view user-level logs and margin-sensitive data
   - Can generate all report types

2. **Fulfilment Admin**
   - Views fulfillment-related dashboards (staff performance, delay rates, pickup status)
   - Access to order analytics, dealer performance, SLA compliance, and return analysis
   - Cannot view system-wide audit logs

3. **Inventory Admin**
   - Views catalogue-related analytics (top SKUs, stockouts, return rates)
   - Generates stock-related reports
   - Access to inventory reports and return analysis

4. **Dealer**
   - Views only their own order analytics and performance metrics
   - Limited to personal order reports
   - Cannot view other dealers' data

5. **Customer**
   - Basic order analytics access
   - Limited to their own order data

## Analytics Dashboard API

### Base URL
```
/api/analytics
```

### Endpoints

#### 1. Get Role-Based Dashboard
```http
GET /api/analytics/dashboard
```

**Query Parameters:**
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `dealerId` (optional): Filter by specific dealer
- `region` (optional): Filter by region
- `product` (optional): Filter by product
- `channel` (optional): Filter by channel

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "Super Admin",
    "kpis": {
      "orders": {
        "totalOrders": 1250,
        "confirmedOrders": 1200,
        "packedOrders": 1150,
        "shippedOrders": 1100,
        "deliveredOrders": 1050,
        "cancelledOrders": 50,
        "totalRevenue": 125000.00,
        "avgOrderValue": 100.00,
        "fulfillmentRate": 84
      },
      "fulfillment": {
        "avgProcessingTime": 24.5,
        "minProcessingTime": 2.1,
        "maxProcessingTime": 72.0,
        "totalProcessed": 1100
      },
      "sla": {
        "totalOrders": 1200,
        "compliantOrders": 1140,
        "complianceRate": 95,
        "avgViolationMinutes": 45
      }
    },
    "trends": [
      {
        "date": "2024-01-15",
        "orderCount": 45,
        "revenue": 4500.00,
        "deliveredCount": 42
      }
    ],
    "topPerformers": [
      {
        "dealerId": "dealer123",
        "orderCount": 150,
        "fulfillmentRate": 98
      }
    ]
  },
  "message": "Dashboard data fetched successfully"
}
```

#### 2. Get Comprehensive KPIs
```http
GET /api/analytics/kpis
```

**Query Parameters:** Same as dashboard endpoint

**Response:** Detailed KPIs for all metrics categories

#### 3. Get Trend Comparison
```http
GET /api/analytics/trends
```

**Query Parameters:**
- `metric`: Metric to compare (orders, fulfillment, sla, returns, financial)
- `period`: Time period (daily, weekly, monthly)
- `compareWith`: Comparison type (previous_period, same_period_last_year)
- `startDate`, `endDate`: Date range

#### 4. Export Dashboard Data
```http
POST /api/analytics/export
```

**Request Body:**
```json
{
  "format": "CSV",
  "dashboardType": "orders",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "dealerId": "dealer123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "/api/reports/export_123/file",
    "fileName": "orders_2024-01-31.csv"
  },
  "message": "Dashboard exported successfully"
}
```

### Role-Specific Analytics

#### Fulfillment Analytics
```http
GET /api/analytics/fulfillment
```
**Access:** Fulfilment Admin, Super Admin

#### Inventory Analytics
```http
GET /api/analytics/inventory
```
**Access:** Inventory Admin, Super Admin

#### Dealer Analytics
```http
GET /api/analytics/dealer/:dealerId
```
**Access:** Dealer (own data), Super Admin, Fulfilment Admin

### Real-Time Analytics

#### Real-Time Orders
```http
GET /api/analytics/realtime/orders
```

#### Real-Time Alerts
```http
GET /api/analytics/realtime/alerts
```
**Access:** Super Admin, Fulfilment Admin, Inventory Admin

## Audit Logs API

### Base URL
```
/api/analytics/audit-logs
```

### Endpoints

#### 1. Get Audit Logs
```http
GET /api/analytics/audit-logs
```

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 50): Items per page
- `action`: Filter by action type
- `actorId`: Filter by actor ID
- `targetType`: Filter by target type
- `category`: Filter by category
- `severity`: Filter by severity level
- `startDate`, `endDate`: Date range

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "action": "ORDER_STATUS_CHANGED",
        "actorId": "user123",
        "actorRole": "Fulfilment Admin",
        "actorName": "John Doe",
        "targetType": "Order",
        "targetId": "order456",
        "targetIdentifier": "ORD-2024-001",
        "details": {
          "method": "PUT",
          "url": "/api/orders/order456",
          "statusCode": 200,
          "oldValues": { "status": "Confirmed" },
          "newValues": { "status": "Packed" }
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "severity": "LOW",
        "category": "ORDER_MANAGEMENT",
        "executionTime": 150,
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "pages": 25
    }
  },
  "message": "Audit logs fetched successfully"
}
```

#### 2. Get Audit Statistics
```http
GET /api/analytics/audit-stats
```

**Query Parameters:**
- `startDate`, `endDate`: Date range

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 1250,
    "uniqueUsers": 45,
    "uniqueActions": 25,
    "avgExecutionTime": 125.5,
    "errorCount": 12
  },
  "message": "Audit statistics fetched successfully"
}
```

## Reports API

### Base URL
```
/api/reports
```

### Endpoints

#### 1. Generate Report
```http
POST /api/reports/generate
```

**Request Body:**
```json
{
  "name": "Monthly Order Analytics",
  "type": "ORDER_ANALYTICS",
  "parameters": {
    "includeRevenue": true,
    "includeSLA": true
  },
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "scope": {
    "dealers": ["dealer123", "dealer456"],
    "regions": ["Mumbai", "Delhi"],
    "products": ["SKU001", "SKU002"]
  },
  "format": "CSV",
  "isRecurring": true,
  "frequency": "MONTHLY"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reportId": "uuid-12345",
    "status": "PENDING",
    "message": "Report generation started"
  },
  "message": "Report generation initiated successfully"
}
```

#### 2. Get Report Templates
```http
GET /api/reports/templates
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "ORDER_ANALYTICS",
      "name": "Order Analytics Report",
      "description": "Comprehensive order analysis and trends"
    },
    {
      "type": "DEALER_PERFORMANCE",
      "name": "Dealer Performance Report",
      "description": "Dealer performance metrics and rankings"
    }
  ],
  "message": "Report templates fetched successfully"
}
```

#### 3. Get Reports List
```http
GET /api/reports
```

**Query Parameters:**
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `type`: Filter by report type
- `status`: Filter by status
- `startDate`, `endDate`: Date range

#### 4. Get Report Details
```http
GET /api/reports/:reportId
```

#### 5. Download Report
```http
GET /api/reports/:reportId/download
```

#### 6. Serve Report File
```http
GET /api/reports/:reportId/file
```

#### 7. Update Report Access
```http
PUT /api/reports/:reportId/access
```

**Request Body:**
```json
{
  "roles": ["Fulfilment Admin", "Inventory Admin"],
  "users": ["user123", "user456"],
  "isPublic": false
}
```

#### 8. Delete Report
```http
DELETE /api/reports/:reportId
```

### Scheduled Reports

#### Get Scheduled Reports
```http
GET /api/reports/scheduled
```

#### Update Report Schedule
```http
POST /api/reports/:reportId/schedule
```

**Request Body:**
```json
{
  "isRecurring": true,
  "frequency": "WEEKLY"
}
```

### Bulk Operations

#### Bulk Generate Reports
```http
POST /api/reports/bulk-generate
```

**Request Body:**
```json
{
  "reports": [
    {
      "name": "Daily Orders Report",
      "type": "ORDER_ANALYTICS",
      "format": "CSV"
    },
    {
      "name": "Weekly SLA Report",
      "type": "SLA_COMPLIANCE",
      "format": "PDF"
    }
  ]
}
```

#### Bulk Delete Reports
```http
POST /api/reports/bulk-delete
```

**Request Body:**
```json
{
  "reportIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

### Report Analytics

#### Get Report Usage Analytics
```http
GET /api/reports/analytics/usage
```

**Access:** Super Admin only

## Data Models

### AuditLog Schema

```javascript
{
  action: String, // Action performed
  actorId: ObjectId, // User performing action
  actorRole: String, // User role
  actorName: String, // User name
  targetType: String, // Type of target
  targetId: ObjectId, // Target ID
  targetIdentifier: String, // Human-readable identifier
  details: Object, // Additional details
  ipAddress: String, // IP address
  userAgent: String, // User agent
  sessionId: String, // Session ID
  timestamp: Date, // Timestamp
  severity: String, // LOW, MEDIUM, HIGH, CRITICAL
  category: String, // Category of action
  executionTime: Number, // Execution time in ms
  errorDetails: Object, // Error details if any
  oldValues: Object, // Previous values (for updates)
  newValues: Object // New values (for updates)
}
```

### Report Schema

```javascript
{
  reportId: String, // Unique report ID
  name: String, // Report name
  type: String, // Report type
  category: String, // Report category
  generatedBy: ObjectId, // User who generated
  generatedByRole: String, // User role
  generatedByName: String, // User name
  parameters: Object, // Report parameters
  dateRange: Object, // Date range
  scope: Object, // Scope filters
  format: String, // CSV, EXCEL, PDF, PNG, JSON
  fileDetails: Object, // File information
  status: String, // PENDING, GENERATING, COMPLETED, FAILED
  generationDetails: Object, // Generation information
  accessControl: Object, // Access control
  schedule: Object, // Scheduling information
  downloadHistory: Array, // Download history
  metadata: Object, // Report metadata
  isDeleted: Boolean, // Soft delete flag
  deletedAt: Date, // Deletion timestamp
  deletedBy: ObjectId // User who deleted
}
```

## Authentication & Authorization

### Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Authorization
Role-based access control is implemented at the middleware level:

```javascript
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
};
```

### User Context
The `req.user` object contains:
- `id`: User ID
- `role`: User role
- `name`: User name
- `email`: User email

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### Error Categories
1. **Authentication Errors**: Invalid or missing tokens
2. **Authorization Errors**: Insufficient permissions
3. **Validation Errors**: Invalid request parameters
4. **Resource Errors**: Resources not found
5. **System Errors**: Internal server errors

## Usage Examples

### 1. Get Dashboard for Fulfilment Admin

```javascript
const response = await fetch('/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

const dashboard = await response.json();
console.log('Fulfillment KPIs:', dashboard.data.kpis.fulfillment);
```

### 2. Generate Monthly Report

```javascript
const reportRequest = {
  name: "January 2024 Order Analytics",
  type: "ORDER_ANALYTICS",
  dateRange: {
    startDate: "2024-01-01",
    endDate: "2024-01-31"
  },
  format: "PDF",
  isRecurring: true,
  frequency: "MONTHLY"
};

const response = await fetch('/api/reports/generate', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reportRequest)
});

const result = await response.json();
console.log('Report ID:', result.data.reportId);
```

### 3. Get Audit Logs for Security Monitoring

```javascript
const response = await fetch('/api/analytics/audit-logs?severity=HIGH&startDate=2024-01-01', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const auditLogs = await response.json();
console.log('High severity events:', auditLogs.data.logs);
```

### 4. Export Dashboard Data

```javascript
const exportRequest = {
  format: "CSV",
  dashboardType: "orders",
  filters: {
    startDate: "2024-01-01",
    endDate: "2024-01-31"
  }
};

const response = await fetch('/api/analytics/export', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(exportRequest)
});

const result = await response.json();
console.log('Download URL:', result.data.downloadUrl);
```

## Deployment & Configuration

### Environment Variables

```bash
# Service URLs
USER_SERVICE_URL=http://user-service:5001
PRODUCT_SERVICE_URL=http://product-service:5002

# Database
MONGO_URI=mongodb://localhost:27017/order-service

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# File Storage
EXPORT_DIR=./exports

# Security
JWT_SECRET=your-jwt-secret
```

### File Storage

Reports are stored in the `exports` directory with the following structure:
```
exports/
├── report_uuid_1_timestamp.csv
├── report_uuid_2_timestamp.pdf
└── report_uuid_3_timestamp.xlsx
```

### Database Indexes

The system creates optimized indexes for performance:

```javascript
// AuditLog indexes
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ category: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });

// Report indexes
ReportSchema.index({ reportId: 1 });
ReportSchema.index({ type: 1, createdAt: -1 });
ReportSchema.index({ generatedBy: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
```

### Performance Considerations

1. **Caching**: Implement Redis caching for frequently accessed analytics
2. **Pagination**: All list endpoints support pagination
3. **Async Processing**: Report generation runs asynchronously
4. **Database Optimization**: Use appropriate indexes and aggregation pipelines
5. **File Cleanup**: Implement TTL for old report files

### Monitoring

Monitor the following metrics:
- API response times
- Report generation success rates
- Database query performance
- File storage usage
- Error rates by endpoint

### Security Considerations

1. **Input Validation**: Validate all input parameters
2. **SQL Injection**: Use parameterized queries
3. **File Upload**: Validate file types and sizes
4. **Access Control**: Implement proper role-based access
5. **Audit Logging**: Log all sensitive operations
6. **Rate Limiting**: Implement rate limiting for API endpoints

## Conclusion

This Analytics Dashboard, Audit Logs, and Reports API provides a comprehensive solution for business intelligence, security monitoring, and data analysis. The system is designed to be scalable, secure, and user-friendly while maintaining high performance and reliability.

For additional support or questions, please refer to the API documentation or contact the development team.
