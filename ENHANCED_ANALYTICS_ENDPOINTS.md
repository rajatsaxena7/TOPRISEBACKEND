# Enhanced Analytics Endpoints Documentation

## Overview

The analytics endpoints in the order service have been enhanced to include dealer information and user data from the user service. This provides comprehensive insights into order performance, dealer metrics, and customer analytics.

## Enhanced Endpoints

### 1. Fulfillment Metrics

**Endpoint:** `GET /api/orders/analytics/fulfillment`

**Description:** Provides fulfillment metrics with optional dealer information.

**Query Parameters:**
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `includeDealerInfo` (optional): Include dealer information (true/false)

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "avgFulfillmentTime": 2.5,
    "statusDistribution": {
      "Delivered": 120,
      "Shipped": 20,
      "Packed": 10
    },
    "dealersInfo": [
      {
        "_id": "dealer-id-1",
        "name": "Dealer Name",
        "email": "dealer@example.com",
        "phone": "1234567890",
        "address": "Dealer Address"
      }
    ]
  },
  "message": "Fulfillment metrics fetched"
}
```

### 2. SLA Compliance Report

**Endpoint:** `GET /api/orders/analytics/sla-compliance`

**Description:** Provides SLA compliance metrics with dealer and user information.

**Query Parameters:**
- `dealerId` (optional): Filter by specific dealer ID
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `includeDealerInfo` (optional): Include dealer information (true/false)
- `includeUserInfo` (optional): Include user/customer information (true/false)

**Enhanced Response:**
```json
{
  "success": true,
  "data": [
    {
      "dealerId": "dealer-id-1",
      "totalOrders": 50,
      "slaComplianceRate": 0.85,
      "avgViolationMinutes": 15.5,
      "maxViolationMinutes": 45,
      "dealerInfo": {
        "_id": "dealer-id-1",
        "name": "Dealer Name",
        "email": "dealer@example.com"
      },
      "customerInfos": [
        {
          "_id": "user-id-1",
          "name": "Customer Name",
          "email": "customer@example.com"
        }
      ]
    }
  ],
  "message": "SLA compliance report fetched"
}
```

### 3. Dealer Performance

**Endpoint:** `GET /api/orders/analytics/dealer-performance`

**Description:** Provides comprehensive dealer performance metrics with user information.

**Query Parameters:**
- `dealerId` (required): Dealer ID to analyze
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `includeUserInfo` (optional): Include user/customer information (true/false)

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "dealerId": "dealer-id-1",
    "dealerName": "Dealer Name",
    "dealerEmail": "dealer@example.com",
    "dealerPhone": "1234567890",
    "dealerAddress": "Dealer Address",
    "totalOrders": 75,
    "totalRevenue": 15000.50,
    "avgOrderValue": 200.01,
    "avgProcessingTime": 1.5,
    "statusDistribution": {
      "Delivered": 60,
      "Shipped": 10,
      "Packed": 5
    },
    "customerInfos": [
      {
        "_id": "user-id-1",
        "name": "Customer Name",
        "email": "customer@example.com",
        "phone": "9876543210"
      }
    ]
  },
  "message": "Dealer performance fetched"
}
```

### 4. Order Statistics

**Endpoint:** `GET /api/orders/stats`

**Description:** Provides comprehensive order statistics with dealer and user information.

**Query Parameters:**
- `startDate` (optional): Start date for filtering (ISO format)
- `endDate` (optional): End date for filtering (ISO format)
- `includeDealerInfo` (optional): Include dealer information (true/false)
- `includeUserInfo` (optional): Include user/customer information (true/false)

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-01T23:59:59.999Z",
      "isToday": true
    },
    "summary": {
      "totalOrders": 200,
      "totalRevenue": 45000.75,
      "averageOrderValue": 225.00
    },
    "byStatus": {
      "pending": 10,
      "confirmed": 15,
      "assigned": 20,
      "packed": 25,
      "shipped": 30,
      "delivered": 80,
      "cancelled": 15,
      "returned": 5
    },
    "statusDistribution": [
      { "_id": "Delivered", "count": 80 },
      { "_id": "Shipped", "count": 30 }
    ],
    "recentOrders": [
      {
        "orderId": "ORD-123456",
        "status": "Delivered",
        "grandTotal": 250.00,
        "createdAt": "2024-01-01T10:30:00.000Z",
        "customerName": "Customer Name",
        "customerId": "user-id-1",
        "dealerIds": ["dealer-id-1"]
      }
    ],
    "dealersInfo": [
      {
        "_id": "dealer-id-1",
        "name": "Dealer Name",
        "email": "dealer@example.com"
      }
    ],
    "customersInfo": [
      {
        "_id": "user-id-1",
        "name": "Customer Name",
        "email": "customer@example.com"
      }
    ]
  },
  "message": "Order statistics retrieved successfully"
}
```

## Helper Functions

### fetchDealerInfo(dealerId, authorizationHeader)
Fetches dealer information from the user service.

### fetchUserInfo(userId, authorizationHeader)
Fetches user information from the user service.

### fetchMultipleDealersInfo(dealerIds, authorizationHeader)
Fetches multiple dealers' information in batch from the user service.

## Authentication

All endpoints require authentication via the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The enhanced endpoints include robust error handling:

1. **Missing Data**: Gracefully handles cases where dealer or user information cannot be fetched
2. **Invalid Parameters**: Returns appropriate error messages for invalid query parameters
3. **Service Unavailable**: Continues operation even if user service is temporarily unavailable
4. **Timeout Handling**: Includes timeout protection for external service calls

## Performance Considerations

1. **Batch Fetching**: Multiple dealer/user requests are batched for efficiency
2. **Conditional Loading**: Dealer and user information is only fetched when requested
3. **Caching**: Consider implementing caching for frequently accessed dealer/user data
4. **Pagination**: Large datasets are handled efficiently with MongoDB aggregation

## Usage Examples

### Basic Usage
```bash
# Get basic fulfillment metrics
GET /api/orders/analytics/fulfillment

# Get dealer performance without user info
GET /api/orders/analytics/dealer-performance?dealerId=dealer-123
```

### Enhanced Usage
```bash
# Get fulfillment metrics with dealer information
GET /api/orders/analytics/fulfillment?includeDealerInfo=true

# Get SLA compliance with both dealer and user info
GET /api/orders/analytics/sla-compliance?includeDealerInfo=true&includeUserInfo=true

# Get order stats for a specific date range with all information
GET /api/orders/stats?startDate=2024-01-01&endDate=2024-01-31&includeDealerInfo=true&includeUserInfo=true
```

## Testing

Use the provided test script to verify functionality:
```bash
node test-enhanced-analytics-endpoints.js
```

## Dependencies

- **User Service**: Must be accessible at `http://user-service:5001`
- **Authentication**: Requires valid JWT tokens
- **MongoDB**: For order data aggregation
- **Axios**: For inter-service communication

## Future Enhancements

1. **Caching Layer**: Implement Redis caching for dealer/user data
2. **Real-time Updates**: WebSocket support for live analytics
3. **Advanced Filtering**: More granular filtering options
4. **Export Functionality**: CSV/Excel export capabilities
5. **Dashboard Integration**: Real-time dashboard updates
