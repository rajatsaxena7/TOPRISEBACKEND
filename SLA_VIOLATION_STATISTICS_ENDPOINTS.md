# SLA Violation Statistics Endpoints

This document provides comprehensive information about the new SLA violation statistics endpoints that provide detailed analytics and management capabilities for SLA violations in the order service.

## Overview

The SLA violation statistics system provides:
- **Comprehensive Analytics**: Detailed statistics and trends for SLA violations
- **Dealer Management**: Identify and manage dealers with multiple violations
- **Automated Actions**: Disable dealers after 3 violations
- **Dashboard Views**: Consolidated views for monitoring and decision-making
- **Bulk Operations**: Efficient management of multiple dealers

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
| `/dealers-with-violations` | ✅ | ✅ | ❌ | ❌ |
| `/disable-dealer/:dealerId` | ✅ | ✅ | ❌ | ❌ |
| `/trends` | ✅ | ✅ | ✅ | ❌ |
| `/top-violators` | ✅ | ✅ | ✅ | ❌ |
| `/resolve/:violationId` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard` | ✅ | ✅ | ✅ | ❌ |
| `/alerts` | ✅ | ✅ | ❌ | ❌ |
| `/bulk-disable` | ✅ | ❌ | ❌ | ❌ |

---

## Endpoints

### 1. Get SLA Violation Statistics

**GET** `/api/sla-violations/stats`

Get comprehensive SLA violation statistics with various grouping options.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `startDate` | string | - | Start date for filtering (YYYY-MM-DD) |
| `endDate` | string | - | End date for filtering (YYYY-MM-DD) |
| `dealerId` | string | - | Filter by specific dealer ID |
| `groupBy` | string | "dealer" | Grouping option: "dealer", "date", "month" |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/stats?groupBy=dealer&startDate=2024-01-01&endDate=2024-12-31" \
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
      "resolutionRate": 67
    },
    "data": [
      {
        "dealerId": "507f1f77bcf86cd799439011",
        "dealerInfo": {
          "trade_name": "ABC Electronics",
          "legal_name": "ABC Electronics Pvt Ltd",
          "is_active": true
        },
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

### 2. Get Dealers with Multiple Violations

**GET** `/api/sla-violations/dealers-with-violations`

Get dealers with 3 or more violations (candidates for disable).

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minViolations` | number | 3 | Minimum number of violations required |
| `startDate` | string | - | Start date for filtering |
| `endDate` | string | - | End date for filtering |
| `includeDisabled` | boolean | false | Include already disabled dealers |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/dealers-with-violations?minViolations=3" \
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
          "is_active": true
        },
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

### 3. Disable Dealer for Violations

**PUT** `/api/sla-violations/disable-dealer/:dealerId`

Disable a dealer after 3 or more violations.

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
      "is_active": false
    },
    "violationsCount": 7,
    "disableResult": {
      "message": "Dealer disabled successfully"
    },
    "message": "Dealer disabled successfully due to 7 SLA violations"
  },
  "message": "Dealer disabled successfully"
}
```

---

### 4. Get SLA Violation Trends

**GET** `/api/sla-violations/trends`

Get SLA violation trends over time with daily and weekly breakdowns.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | "30d" | Time period: "7d", "30d", "90d", "1y" |
| `dealerId` | string | - | Filter by specific dealer ID |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/trends?period=30d" \
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
      "avgViolationsPerDay": 1.5
    },
    "trends": {
      "daily": [
        {
          "date": "2024-12-01",
          "violations": 2,
          "totalMinutes": 60,
          "avgMinutes": 30.0,
          "uniqueDealers": 2
        }
      ],
      "weekly": [
        {
          "week": "2024-W49",
          "violations": 8,
          "totalMinutes": 240,
          "avgMinutes": 30.0,
          "uniqueDealers": 5
        }
      ]
    }
  },
  "message": "SLA violation trends fetched successfully"
}
```

---

### 5. Get Top Violating Dealers

**GET** `/api/sla-violations/top-violators`

Get top violating dealers with various sorting options.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of dealers to return |
| `startDate` | string | - | Start date for filtering |
| `endDate` | string | - | End date for filtering |
| `sortBy` | string | "violations" | Sort by: "violations", "minutes", "avgMinutes", "recent" |

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/top-violators?limit=5&sortBy=violations" \
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
        "legal_name": "Top Violator Company Ltd"
      },
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

### 6. Resolve SLA Violation

**PUT** `/api/sla-violations/resolve/:violationId`

Mark an SLA violation as resolved.

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
    "order_id": "507f1f77bcf86cd799439013",
    "violation_minutes": 45,
    "resolved": true,
    "resolved_at": "2024-12-31T10:30:00.000Z",
    "resolution_notes": "Issue resolved with dealer"
  },
  "message": "SLA violation resolved successfully"
}
```

---

### 7. Get SLA Violation Dashboard

**GET** `/api/sla-violations/dashboard`

Get consolidated dashboard data for SLA violations.

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/dashboard" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "quickStats": {
      "totalViolations": 150,
      "totalViolationMinutes": 4500,
      "avgViolationMinutes": 30,
      "maxViolationMinutes": 120,
      "resolvedViolations": 100,
      "unresolvedViolations": 50,
      "uniqueDealerCount": 25,
      "resolutionRate": 67
    },
    "dealersWithViolations": {
      "totalDealers": 5,
      "highRiskDealers": 2,
      "mediumRiskDealers": 3,
      "eligibleForDisable": 3
    },
    "topViolators": [
      {
        "rank": 1,
        "dealerId": "507f1f77bcf86cd799439011",
        "dealerInfo": {
          "trade_name": "Top Violator Co"
        },
        "stats": {
          "totalViolations": 12,
          "avgViolationMinutes": 60
        },
        "riskLevel": "High"
      }
    ],
    "trends": {
      "period": "30d",
      "summary": {
        "totalViolations": 45,
        "avgViolationsPerDay": 1.5
      }
    },
    "lastUpdated": "2024-12-31T23:59:59.999Z"
  },
  "message": "SLA violation dashboard data fetched successfully"
}
```

---

### 8. Get SLA Violation Alerts

**GET** `/api/sla-violations/alerts`

Get alerts and notifications for SLA violations.

#### Example Request

```bash
curl -X GET "http://order-service:5001/api/sla-violations/alerts" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "dealersEligibleForDisable": 3,
    "highRiskDealers": 2,
    "unresolvedViolations": 50,
    "totalAlerts": 55,
    "priorityAlerts": [
      {
        "dealerId": "507f1f77bcf86cd799439011",
        "dealerInfo": {
          "trade_name": "High Risk Dealer"
        },
        "violationStats": {
          "totalViolations": 8,
          "unresolvedViolations": 5
        },
        "riskLevel": "High",
        "eligibleForDisable": true
      }
    ],
    "lastUpdated": "2024-12-31T23:59:59.999Z"
  },
  "message": "SLA violation alerts fetched successfully"
}
```

---

### 9. Bulk Disable Dealers

**POST** `/api/sla-violations/bulk-disable`

Bulk disable multiple dealers with 3+ violations (Super Admin only).

#### Request Body

```json
{
  "dealerIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "reason": "Bulk disable due to multiple violations",
  "adminNotes": "Automated bulk disable operation"
}
```

#### Example Request

```bash
curl -X POST "http://order-service:5001/api/sla-violations/bulk-disable" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dealerIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "reason": "Bulk disable due to multiple violations",
    "adminNotes": "Automated bulk disable operation"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "totalProcessed": 2,
    "successCount": 2,
    "failureCount": 0,
    "results": [
      {
        "dealerId": "507f1f77bcf86cd799439011",
        "success": true,
        "message": "Dealer disabled successfully"
      },
      {
        "dealerId": "507f1f77bcf86cd799439012",
        "success": true,
        "message": "Dealer disabled successfully"
      }
    ]
  },
  "message": "Bulk disable completed. 2 successful, 0 failed."
}
```

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

All endpoints automatically log actions to the audit system with the following information:
- **Action**: The specific action performed
- **Actor**: User performing the action
- **Target**: The affected dealer or violation
- **Details**: Additional context about the action
- **Timestamp**: When the action occurred

### Audit Actions

- `SLA_VIOLATION_STATS_ACCESSED`
- `DEALERS_WITH_VIOLATIONS_ACCESSED`
- `DEALER_DISABLE_ATTEMPTED`
- `SLA_VIOLATION_TRENDS_ACCESSED`
- `TOP_VIOLATING_DEALERS_ACCESSED`
- `SLA_VIOLATION_RESOLUTION_ATTEMPTED`
- `SLA_VIOLATION_DASHBOARD_ACCESSED`
- `SLA_VIOLATION_ALERTS_ACCESSED`
- `BULK_DEALER_DISABLE_ATTEMPTED`
- `DEALER_DISABLED_FOR_VIOLATIONS`
- `SLA_VIOLATION_RESOLVED`

---

## Testing

Use the provided test script to verify all endpoints:

```bash
# Set environment variables
export ORDER_SERVICE_URL="http://localhost:5001"
export AUTH_TOKEN="your-jwt-token"

# Run tests
node test-sla-violation-stats-endpoints.js
```

---

## Integration with User Service

The SLA violation statistics system integrates with the user service to:
- Fetch dealer information
- Disable dealers when they reach 3+ violations
- Maintain dealer status consistency across services

### User Service Endpoints Used

- `GET /api/users/dealer/:dealerId` - Fetch dealer information
- `PUT /api/users/disable-dealer/:dealerId` - Disable dealer

---

## Business Rules

### Dealer Disable Rules

1. **Minimum Violations**: Dealers must have at least 3 violations to be eligible for disable
2. **Active Status**: Only active dealers can be disabled
3. **Automatic Resolution**: All unresolved violations are automatically marked as resolved when a dealer is disabled
4. **Audit Trail**: All disable actions are logged with full context

### Risk Levels

- **High Risk**: 5+ violations
- **Medium Risk**: 3-4 violations
- **Low Risk**: 1-2 violations

### Resolution Process

1. Violations can be manually resolved by authorized users
2. Resolution includes notes explaining the resolution
3. Resolved violations are tracked for historical analysis
4. Resolution rate is calculated for performance metrics

---

## Performance Considerations

- **Aggregation**: Uses MongoDB aggregation pipelines for efficient data processing
- **Caching**: Consider implementing Redis caching for frequently accessed statistics
- **Pagination**: Large datasets are paginated to prevent performance issues
- **Indexing**: Ensure proper database indexing on violation dates and dealer IDs

---

## Monitoring and Alerts

The system provides real-time monitoring capabilities:
- **Dashboard**: Consolidated view of all SLA violation metrics
- **Alerts**: Automated notifications for high-risk situations
- **Trends**: Historical analysis to identify patterns
- **Reports**: Detailed reports for management review

---

## Future Enhancements

Potential future enhancements include:
- **Email Notifications**: Automated email alerts for violations
- **SLA Configuration**: Dynamic SLA configuration per dealer
- **Performance Metrics**: Additional performance indicators
- **Integration**: Integration with external monitoring systems
- **Machine Learning**: Predictive analytics for violation prevention
