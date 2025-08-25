# Enhanced SLA Violation Statistics Endpoints

This document provides comprehensive information about the enhanced SLA violation statistics endpoints that provide detailed analytics and management capabilities for SLA violations in the order service, including order details, dealer information, and employee/designer details.

## Overview

The enhanced SLA violation statistics system provides:
- **Comprehensive Analytics**: Detailed statistics and trends for SLA violations
- **Order Details Integration**: Complete order information including customer details, SKUs, and status
- **Dealer Management**: Enhanced dealer information with assigned employees
- **Employee/Designer Details**: Information about assigned employees and their roles
- **Automated Actions**: Disable dealers after 3 violations with full context
- **Dashboard Views**: Consolidated views for monitoring and decision-making
- **Bulk Operations**: Efficient management of multiple dealers
- **Enhanced Audit Logging**: Comprehensive tracking of all actions with context

## Base URL

```
http://order-service:5001/api/sla-violations
```

## Authentication

All endpoints require authentication with a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Role-Based Access Control

| Endpoint | Super Admin | Fulfillment Admin | Inventory Admin | Dealer |
|----------|-------------|-------------------|-----------------|---------|
| `/stats` | ✅ | ✅ | ✅ | ❌ |
| `/summary` | ✅ | ✅ | ✅ | ❌ |
| `/dealers-with-violations` | ✅ | ✅ | ❌ | ❌ |
| `/disable-dealer/:dealerId` | ✅ | ✅ | ❌ | ❌ |
| `/trends` | ✅ | ✅ | ✅ | ❌ |
| `/top-violators` | ✅ | ✅ | ✅ | ❌ |
| `/violation/:violationId` | ✅ | ✅ | ✅ | ❌ |
| `/resolve/:violationId` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard` | ✅ | ✅ | ✅ | ❌ |
| `/alerts` | ✅ | ✅ | ❌ | ❌ |
| `/bulk-disable` | ✅ | ❌ | ❌ | ❌ |

---

## Enhanced Features

### Order Details Integration
- **Customer Information**: Name, phone, email, address
- **Order Summary**: Total amount, status, payment type, order type
- **SKU Details**: Product names, quantities, prices, status
- **Order Tracking**: Current status and timestamps

### Dealer Details Enhancement
- **Basic Information**: Trade name, legal name, contact details
- **Assigned Employees**: List of employees assigned to the dealer
- **Employee Count**: Number of active employees
- **SLA Configuration**: SLA type and dispatch hours
- **Performance Metrics**: Last fulfillment date and status

### Employee/Designer Information
- **Employee Details**: Name, email, phone, role
- **Assignment History**: When assigned and current status
- **Performance Tracking**: Last login and activity
- **Role Information**: Specific role and permissions

---

## Endpoints

### 1. Get Enhanced SLA Violation Statistics

**GET** `/api/sla-violations/stats`

Get comprehensive SLA violation statistics with enhanced details including order information and employee details.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startDate` | string | - | Start date for filtering (YYYY-MM-DD) |
| `endDate` | string | - | End date for filtering (YYYY-MM-DD) |
| `dealerId` | string | - | Filter by specific dealer ID |
| `groupBy` | string | "dealer" | Grouping option: "dealer", "date", "month" |
| `includeDetails` | boolean | false | Include enhanced order and employee details |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/stats?groupBy=dealer&includeDetails=true&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalViolations": 150,
      "totalViolationMinutes": 4500,
      "avgViolationMinutes": 30,
      "maxViolationMinutes": 120,
      "resolvedViolations": 100,
      "unresolvedViolations": 50,
      "uniqueDealerCount": 25,
      "uniqueOrderCount": 120,
      "resolutionRate": 67
    },
    "data": [
      {
        "dealerId": "507f1f77bcf86cd799439011",
        "dealerInfo": {
          "trade_name": "ABC Electronics",
          "legal_name": "ABC Electronics Pvt Ltd",
          "is_active": true,
          "assignedEmployees": [
            {
              "employeeId": "507f1f77bcf86cd799439013",
              "assignedAt": "2024-01-01T00:00:00Z",
              "status": "Active",
              "employeeDetails": {
                "First_name": "John Doe",
                "email": "john@example.com",
                "role": "Fulfillment-Staff"
              }
            }
          ],
          "employeeCount": 1
        },
        "orderDetails": [
          {
            "_id": "507f1f77bcf86cd799439014",
            "orderSummary": {
              "totalSKUs": 3,
              "totalAmount": 15000,
              "customerName": "Jane Smith",
              "customerPhone": "+1234567890",
              "orderStatus": "Delivered",
              "paymentType": "Prepaid",
              "orderType": "Online"
            },
            "skuDetails": [
              {
                "sku": "SKU001",
                "productName": "LED Headlight",
                "quantity": 2,
                "sellingPrice": 5000,
                "totalPrice": 10000,
                "status": "Delivered",
                "dealerMapped": 1
              }
            ]
          }
        ],
        "orderCount": 8,
        "totalViolations": 8,
        "totalViolationMinutes": 240,
        "avgViolationMinutes": 30,
        "maxViolationMinutes": 60,
        "resolvedViolations": 5,
        "unresolvedViolations": 3,
        "firstViolation": "2024-01-15T10:30:00Z",
        "lastViolation": "2024-12-20T14:45:00Z",
        "violationRate": 38
      }
    ]
  },
  "message": "SLA violation statistics fetched successfully"
}
```

---

### 2. Get SLA Violation Summary with Enhanced Analytics

**GET** `/api/sla-violations/summary`

Get comprehensive SLA violation summary with enhanced analytics and recent violations.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startDate` | string | - | Start date for filtering |
| `endDate` | string | - | End date for filtering |
| `dealerId` | string | - | Filter by specific dealer ID |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/summary?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalViolations": 150,
      "totalViolationMinutes": 4500,
      "avgViolationMinutes": 30,
      "maxViolationMinutes": 120,
      "minViolationMinutes": 5,
      "resolvedViolations": 100,
      "unresolvedViolations": 50,
      "uniqueDealerCount": 25,
      "uniqueOrderCount": 120,
      "resolutionRate": 67
    },
    "topViolators": [
      {
        "rank": 1,
        "dealerId": "507f1f77bcf86cd799439011",
        "totalViolations": 12,
        "totalViolationMinutes": 720,
        "avgViolationMinutes": 60
      }
    ],
    "recentViolations": [
      {
        "violationId": "507f1f77bcf86cd799439012",
        "orderId": "507f1f77bcf86cd799439014",
        "dealerId": "507f1f77bcf86cd799439011",
        "violationMinutes": 45,
        "resolved": false,
        "created_at": "2024-12-31T10:30:00Z",
        "orderSummary": {
          "customerName": "Jane Smith",
          "totalAmount": 15000,
          "orderStatus": "Delivered"
        },
        "dealerSummary": {
          "tradeName": "ABC Electronics",
          "legalName": "ABC Electronics Pvt Ltd",
          "isActive": true
        }
      }
    ],
    "analytics": {
      "avgViolationsPerDealer": 6.0,
      "avgViolationsPerOrder": 1.25,
      "severityDistribution": {
        "low": 20,
        "medium": 50,
        "high": 30
      }
    }
  },
  "message": "SLA violation summary fetched successfully"
}
```

---

### 3. Get Enhanced Dealers with Multiple Violations

**GET** `/api/sla-violations/dealers-with-violations`

Get dealers with 3 or more violations with enhanced details including order information and employee details.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minViolations` | number | 3 | Minimum number of violations required |
| `startDate` | string | - | Start date for filtering |
| `endDate` | string | - | End date for filtering |
| `includeDisabled` | boolean | false | Include already disabled dealers |
| `includeDetails` | boolean | false | Include enhanced order and employee details |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/dealers-with-violations?minViolations=3&includeDetails=true" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "totalDealers": 5,
    "highRiskDealers": 2,
    "mediumRiskDealers": 3,
    "lowRiskDealers": 0,
    "eligibleForDisable": 3,
    "dealers": [
      {
        "dealerId": "507f1f77bcf86cd799439011",
        "dealerInfo": {
          "trade_name": "XYZ Suppliers",
          "legal_name": "XYZ Suppliers Ltd",
          "is_active": true,
          "assignedEmployees": [
            {
              "employeeId": "507f1f77bcf86cd799439013",
              "assignedAt": "2024-01-01T00:00:00Z",
              "status": "Active",
              "employeeDetails": {
                "First_name": "John Doe",
                "email": "john@example.com",
                "role": "Fulfillment-Staff"
              }
            }
          ],
          "employeeCount": 1
        },
        "orderDetails": [
          {
            "_id": "507f1f77bcf86cd799439014",
            "orderSummary": {
              "totalSKUs": 3,
              "totalAmount": 15000,
              "customerName": "Jane Smith",
              "customerPhone": "+1234567890",
              "orderStatus": "Delivered",
              "paymentType": "Prepaid",
              "orderType": "Online"
            },
            "skuDetails": [
              {
                "sku": "SKU001",
                "productName": "LED Headlight",
                "quantity": 2,
                "sellingPrice": 5000,
                "totalPrice": 10000,
                "status": "Delivered",
                "dealerMapped": 1
              }
            ]
          }
        ],
        "orderCount": 7,
        "violationStats": {
          "totalViolations": 7,
          "totalViolationMinutes": 420,
          "avgViolationMinutes": 60,
          "maxViolationMinutes": 120,
          "unresolvedViolations": 4,
          "firstViolation": "2024-01-10T09:00:00Z",
          "lastViolation": "2024-12-25T16:30:00Z",
          "violationDates": ["2024-01-10T09:00:00Z", "2024-02-15T11:20:00Z"]
        },
        "riskLevel": "High",
        "eligibleForDisable": true
      }
    ]
  },
  "message": "Dealers with multiple violations fetched successfully"
}
```

---

### 4. Enhanced Disable Dealer for Violations

**PUT** `/api/sla-violations/disable-dealer/:dealerId`

Disable a dealer after 3 or more violations with enhanced details including affected orders and employee information.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `dealerId` | string | ID of the dealer to disable |

#### Request Body

```json
{
  "reason": "Multiple SLA violations",
  "adminNotes": "Dealer has consistently failed to meet SLA requirements"
}
```

#### Example Request

```bash
curl -X PUT "http://order-service:5001/api/sla-violations/disable-dealer/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Multiple SLA violations",
    "adminNotes": "Dealer has consistently failed to meet SLA requirements"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "dealerId": "507f1f77bcf86cd799439011",
    "dealerInfo": {
      "trade_name": "XYZ Suppliers",
      "legal_name": "XYZ Suppliers Ltd",
      "is_active": false,
      "assignedEmployees": [
        {
          "employeeId": "507f1f77bcf86cd799439013",
          "assignedAt": "2024-01-01T00:00:00Z",
          "status": "Active",
          "employeeDetails": {
            "First_name": "John Doe",
            "email": "john@example.com",
            "role": "Fulfillment-Staff"
          }
        }
      ],
      "employeeCount": 1
    },
    "violationsCount": 7,
    "orderDetails": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "orderSummary": {
          "totalSKUs": 3,
          "totalAmount": 15000,
          "customerName": "Jane Smith",
          "customerPhone": "+1234567890",
          "orderStatus": "Delivered",
          "paymentType": "Prepaid",
          "orderType": "Online"
        },
        "skuDetails": [
          {
            "sku": "SKU001",
            "productName": "LED Headlight",
            "quantity": 2,
            "sellingPrice": 5000,
            "totalPrice": 10000,
            "status": "Delivered",
            "dealerMapped": 1
          }
        ]
      }
    ],
    "affectedOrdersCount": 7,
    "assignedEmployeesCount": 1,
    "disableResult": {
      "message": "Dealer disabled successfully"
    },
    "message": "Dealer disabled successfully due to 7 SLA violations"
  },
  "message": "Dealer disabled successfully"
}
```

---

### 5. Get Enhanced SLA Violation Trends

**GET** `/api/sla-violations/trends`

Get SLA violation trends over time with enhanced details including sample violations with order and dealer information.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | "30d" | Time period: "7d", "30d", "90d", "1y" |
| `dealerId` | string | - | Filter by specific dealer ID |
| `includeDetails` | boolean | false | Include sample violations with details |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/trends?period=30d&includeDetails=true" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "period": "30d",
    "dateRange": {
      "startDate": "2024-12-01T00:00:00.000Z",
      "endDate": "2024-12-31T23:59:59.999Z"
    },
    "summary": {
      "totalViolations": 45,
      "totalMinutes": 1350,
      "avgMinutes": 30,
      "maxMinutes": 90,
      "uniqueDealers": 12,
      "uniqueOrders": 40,
      "avgViolationsPerDay": 1.5
    },
    "trends": {
      "daily": [
        {
          "date": "2024-12-01",
          "violations": 2,
          "totalMinutes": 60,
          "avgMinutes": 30.0,
          "uniqueDealers": 2,
          "orderCount": 2
        }
      ],
      "weekly": [
        {
          "week": "2024-W49",
          "violations": 8,
          "totalMinutes": 240,
          "avgMinutes": 30.0,
          "uniqueDealers": 5,
          "orderCount": 7
        }
      ]
    },
    "sampleViolations": [
      {
        "violationId": "507f1f77bcf86cd799439012",
        "orderId": "507f1f77bcf86cd799439014",
        "dealerId": "507f1f77bcf86cd799439011",
        "violationMinutes": 45,
        "resolved": false,
        "created_at": "2024-12-31T10:30:00Z",
        "orderDetails": {
          "_id": "507f1f77bcf86cd799439014",
          "orderSummary": {
            "totalSKUs": 3,
            "totalAmount": 15000,
            "customerName": "Jane Smith",
            "customerPhone": "+1234567890",
            "orderStatus": "Delivered",
            "paymentType": "Prepaid",
            "orderType": "Online"
          },
          "skuDetails": [
            {
              "sku": "SKU001",
              "productName": "LED Headlight",
              "quantity": 2,
              "sellingPrice": 5000,
              "totalPrice": 10000,
              "status": "Delivered",
              "dealerMapped": 1
            }
          ]
        },
        "dealerInfo": {
          "trade_name": "ABC Electronics",
          "legal_name": "ABC Electronics Pvt Ltd",
          "is_active": true
        }
      }
    ]
  },
  "message": "SLA violation trends fetched successfully"
}
```

---

### 6. Get Enhanced Top Violating Dealers

**GET** `/api/sla-violations/top-violators`

Get top violating dealers with enhanced details including order information and employee details.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of dealers to return |
| `startDate` | string | - | Start date for filtering |
| `endDate` | string | - | End date for filtering |
| `sortBy` | string | "violations" | Sort by: "violations", "minutes", "avgMinutes", "recent" |
| `includeDetails` | boolean | false | Include enhanced order and employee details |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/top-violators?limit=5&sortBy=violations&includeDetails=true" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "dealerId": "507f1f77bcf86cd799439011",
      "dealerInfo": {
        "trade_name": "Top Violator Co",
        "legal_name": "Top Violator Company Ltd",
        "is_active": true,
        "assignedEmployees": [
          {
            "employeeId": "507f1f77bcf86cd799439013",
            "assignedAt": "2024-01-01T00:00:00Z",
            "status": "Active",
            "employeeDetails": {
              "First_name": "John Doe",
              "email": "john@example.com",
              "role": "Fulfillment-Staff"
            }
          }
        ],
        "employeeCount": 1
      },
      "orderDetails": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "orderSummary": {
            "totalSKUs": 3,
            "totalAmount": 15000,
            "customerName": "Jane Smith",
            "customerPhone": "+1234567890",
            "orderStatus": "Delivered",
            "paymentType": "Prepaid",
            "orderType": "Online"
          },
          "skuDetails": [
            {
              "sku": "SKU001",
              "productName": "LED Headlight",
              "quantity": 2,
              "sellingPrice": 5000,
              "totalPrice": 10000,
              "status": "Delivered",
              "dealerMapped": 1
            }
          ]
        }
      ],
      "orderCount": 12,
      "stats": {
        "totalViolations": 12,
        "totalViolationMinutes": 720,
        "avgViolationMinutes": 60,
        "maxViolationMinutes": 120,
        "unresolvedViolations": 8,
        "firstViolation": "2024-01-01T00:00:00Z",
        "lastViolation": "2024-12-31T23:59:59Z"
      },
      "riskLevel": "High"
    }
  ],
  "message": "Top violating dealers fetched successfully"
}
```

---

### 7. Get Detailed Violation Information

**GET** `/api/sla-violations/violation/:violationId`

Get detailed SLA violation information with all enhanced details including order details, dealer information, and employee details.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `violationId` | string | ID of the violation to get details for |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/violation/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "violation": {
      "_id": "507f1f77bcf86cd799439012",
      "dealer_id": "507f1f77bcf86cd799439011",
      "order_id": "507f1f77bcf86cd799439014",
      "expected_fulfillment_time": "2024-12-31T10:00:00Z",
      "actual_fulfillment_time": "2024-12-31T10:45:00Z",
      "violation_minutes": 45,
      "resolved": false,
      "resolved_at": null,
      "resolution_notes": null,
      "notes": "SLA violation due to delayed processing",
      "created_at": "2024-12-31T10:30:00Z"
    },
    "orderDetails": {
      "_id": "507f1f77bcf86cd799439014",
      "orderSummary": {
        "totalSKUs": 3,
        "totalAmount": 15000,
        "customerName": "Jane Smith",
        "customerPhone": "+1234567890",
        "orderStatus": "Delivered",
        "paymentType": "Prepaid",
        "orderType": "Online"
      },
      "skuDetails": [
        {
          "sku": "SKU001",
          "productName": "LED Headlight",
          "quantity": 2,
          "sellingPrice": 5000,
          "totalPrice": 10000,
          "status": "Delivered",
          "dealerMapped": 1
        }
      ]
    },
    "dealerInfo": {
      "trade_name": "ABC Electronics",
      "legal_name": "ABC Electronics Pvt Ltd",
      "is_active": true,
      "assignedEmployees": [
        {
          "employeeId": "507f1f77bcf86cd799439013",
          "assignedAt": "2024-01-01T00:00:00Z",
          "status": "Active",
          "employeeDetails": {
            "First_name": "John Doe",
            "email": "john@example.com",
            "role": "Fulfillment-Staff"
          }
        }
      ],
      "employeeCount": 1
    },
    "summary": {
      "violationDuration": 45,
      "isResolved": false,
      "customerName": "Jane Smith",
      "dealerName": "ABC Electronics",
      "orderAmount": 15000,
      "assignedEmployees": 1,
      "orderStatus": "Delivered"
    }
  },
  "message": "Detailed violation information fetched successfully"
}
```

---

### 8. Enhanced Resolve SLA Violation

**PUT** `/api/sla-violations/resolve/:violationId`

Resolve an SLA violation with enhanced details including order and dealer information.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `violationId` | string | ID of the violation to resolve |

#### Request Body

```json
{
  "resolutionNotes": "Issue resolved with dealer"
}
```

#### Example Request

```bash
curl -X PUT "http://order-service:5001/api/sla-violations/resolve/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionNotes": "Issue resolved with dealer"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "dealer_id": "507f1f77bcf86cd799439011",
    "order_id": "507f1f77bcf86cd799439014",
    "expected_fulfillment_time": "2024-12-31T10:00:00Z",
    "actual_fulfillment_time": "2024-12-31T10:45:00Z",
    "violation_minutes": 45,
    "resolved": true,
    "resolved_at": "2024-12-31T11:00:00Z",
    "resolution_notes": "Issue resolved with dealer",
    "notes": "SLA violation due to delayed processing",
    "created_at": "2024-12-31T10:30:00Z",
    "orderDetails": {
      "_id": "507f1f77bcf86cd799439014",
      "orderSummary": {
        "totalSKUs": 3,
        "totalAmount": 15000,
        "customerName": "Jane Smith",
        "customerPhone": "+1234567890",
        "orderStatus": "Delivered",
        "paymentType": "Prepaid",
        "orderType": "Online"
      },
      "skuDetails": [
        {
          "sku": "SKU001",
          "productName": "LED Headlight",
          "quantity": 2,
          "sellingPrice": 5000,
          "totalPrice": 10000,
          "status": "Delivered",
          "dealerMapped": 1
        }
      ]
    },
    "dealerInfo": {
      "trade_name": "ABC Electronics",
      "legal_name": "ABC Electronics Pvt Ltd",
      "is_active": true,
      "assignedEmployees": [
        {
          "employeeId": "507f1f77bcf86cd799439013",
          "assignedAt": "2024-01-01T00:00:00Z",
          "status": "Active",
          "employeeDetails": {
            "First_name": "John Doe",
            "email": "john@example.com",
            "role": "Fulfillment-Staff"
          }
        }
      ],
      "employeeCount": 1
    }
  },
  "message": "SLA violation resolved successfully"
}
```

---

## Enhanced Features Summary

### Order Details Integration
- **Complete Order Information**: Customer details, order summary, SKU details
- **Order Tracking**: Current status, payment information, order type
- **SKU Information**: Product details, quantities, prices, dealer mapping
- **Performance Metrics**: Order amounts, fulfillment status

### Dealer Details Enhancement
- **Basic Information**: Trade name, legal name, contact details
- **Assigned Employees**: Complete list with assignment history
- **Employee Count**: Active employee tracking
- **SLA Configuration**: SLA type, dispatch hours, performance metrics
- **Status Information**: Active/inactive status, last activity

### Employee/Designer Information
- **Employee Details**: Name, email, phone, role
- **Assignment History**: When assigned, current status
- **Performance Tracking**: Last login, activity metrics
- **Role Information**: Specific role and permissions

### Enhanced Analytics
- **Order Count Tracking**: Number of orders per dealer
- **Employee Impact Analysis**: Employee count and assignment details
- **Performance Metrics**: Enhanced statistics with context
- **Risk Assessment**: Improved risk calculation with employee information

### Performance Optimization
- **Selective Detail Loading**: Only load enhanced details when requested
- **Sample Data Limiting**: Limit order details to prevent performance issues
- **Caching Considerations**: Optimized for caching strategies
- **Response Size Management**: Efficient data structure

---

## Error Responses

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

### Example Error Response

```json
{
  "success": false,
  "error": "Dealer has only 2 violations. Minimum 3 violations required for disable.",
  "message": "Failed to disable dealer"
}
```

---

## Audit Logging

All endpoints automatically log actions to the audit system with enhanced information:
- **Action**: The specific action performed
- **Actor**: User performing the action
- **Target**: The affected dealer, violation, or order
- **Enhanced Details**: Order information, employee details, dealer context
- **Timestamp**: When the action occurred

### Enhanced Audit Actions

- `SLA_VIOLATION_STATS_ACCESSED`
- `SLA_VIOLATION_SUMMARY_ACCESSED`
- `DEALERS_WITH_VIOLATIONS_ACCESSED`
- `DEALER_DISABLE_ATTEMPTED`
- `SLA_VIOLATION_TRENDS_ACCESSED`
- `TOP_VIOLATING_DEALERS_ACCESSED`
- `DETAILED_VIOLATION_INFO_ACCESSED`
- `SLA_VIOLATION_RESOLUTION_ATTEMPTED`
- `SLA_VIOLATION_DASHBOARD_ACCESSED`
- `SLA_VIOLATION_ALERTS_ACCESSED`
- `BULK_DEALER_DISABLE_ATTEMPTED`
- `DEALER_DISABLED_FOR_VIOLATIONS`
- `SLA_VIOLATION_RESOLVED`

---

## Testing

Use the provided enhanced test script to verify all endpoints:

```bash
# Set environment variables
export ORDER_SERVICE_URL="http://localhost:5001"
export AUTH_TOKEN="your-jwt-token"

# Run enhanced tests
node test-sla-violation-stats-endpoints.js
```

---

## Integration with Services

The enhanced SLA violation statistics system integrates with multiple services:

### User Service Integration
- **Dealer Information**: Fetch dealer details and status
- **Employee Details**: Get assigned employee information
- **Dealer Management**: Disable dealers and update status

### Order Service Integration
- **Order Details**: Fetch complete order information
- **Customer Information**: Get customer details and contact info
- **SKU Information**: Retrieve product and quantity details
- **Order Tracking**: Get current order status and history

### Performance Considerations
- **Selective Loading**: Only load enhanced details when requested
- **Caching Strategy**: Implement caching for frequently accessed data
- **Batch Operations**: Optimize for bulk operations
- **Response Optimization**: Efficient data structure and size management

---

## Business Rules

### Enhanced Dealer Disable Rules

1. **Minimum Violations**: Dealers must have at least 3 violations to be eligible for disable
2. **Active Status**: Only active dealers can be disabled
3. **Employee Impact**: Consider assigned employees when disabling dealers
4. **Order Impact**: Track affected orders and customers
5. **Automatic Resolution**: All unresolved violations are automatically marked as resolved when a dealer is disabled
6. **Enhanced Audit Trail**: All disable actions are logged with full context including order and employee details

### Enhanced Risk Levels

- **High Risk**: 5+ violations with significant order impact
- **Medium Risk**: 3-4 violations with moderate order impact
- **Low Risk**: 1-2 violations with minimal order impact

### Enhanced Resolution Process

1. Violations can be manually resolved by authorized users
2. Resolution includes notes explaining the resolution
3. Enhanced context includes order and dealer information
4. Resolved violations are tracked for historical analysis
5. Resolution rate is calculated for performance metrics
6. Employee impact is considered in resolution decisions

---

## Performance Considerations

- **Aggregation**: Uses MongoDB aggregation pipelines for efficient data processing
- **Selective Loading**: Enhanced details only loaded when requested
- **Caching**: Consider implementing Redis caching for frequently accessed statistics
- **Pagination**: Large datasets are paginated to prevent performance issues
- **Indexing**: Ensure proper database indexing on violation dates, dealer IDs, and order IDs
- **Response Optimization**: Efficient data structure and size management

---

## Monitoring and Alerts

The enhanced system provides real-time monitoring capabilities:
- **Dashboard**: Consolidated view of all SLA violation metrics with enhanced details
- **Alerts**: Automated notifications for high-risk situations with context
- **Trends**: Historical analysis to identify patterns with order and employee impact
- **Reports**: Detailed reports for management review with comprehensive context
- **Employee Tracking**: Monitor employee performance and assignment impact

---

## Future Enhancements

Potential future enhancements include:
- **Email Notifications**: Automated email alerts for violations with order details
- **SLA Configuration**: Dynamic SLA configuration per dealer with employee assignments
- **Performance Metrics**: Additional performance indicators with employee impact
- **Integration**: Integration with external monitoring systems
- **Machine Learning**: Predictive analytics for violation prevention
- **Employee Performance**: Enhanced employee performance tracking and analytics
- **Customer Impact Analysis**: Detailed analysis of customer impact from violations
- **Real-time Monitoring**: Live monitoring with real-time alerts and notifications
