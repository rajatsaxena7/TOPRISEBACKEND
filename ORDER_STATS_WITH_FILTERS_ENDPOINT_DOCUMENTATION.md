# Order Statistics with Filters Endpoint Documentation

## Overview

The Order Statistics with Filters endpoint provides focused order statistics with specific filters for today's orders and status-based filtering. This endpoint is designed to give quick insights into order metrics with the ability to include SKU-level tracking information.

## Endpoint Details

- **URL**: `GET /api/orders/stats/filters`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin
- **Audit Logging**: Enabled (ORDER_STATS_FILTERS_ACCESSED)

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `today` | boolean | `false` | Filter orders for today only |
| `status` | string | `null` | Filter orders by specific status |
| `startDate` | string | `null` | Start date for date range filter (ISO 8601) |
| `endDate` | string | `null` | End date for date range filter (ISO 8601) |
| `includeSkuLevelTracking` | boolean | `false` | Include SKU-level tracking information |

### Status Values

The `status` parameter accepts the following values:
- `Confirmed`
- `Assigned`
- `Scanning`
- `Packed`
- `Shipped`
- `Delivered`
- `Cancelled`
- `Returned`

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Order statistics with filters fetched successfully",
  "data": {
    "summary": {
      "totalOrders": 150,
      "totalRevenue": 250000,
      "avgOrderValue": 1667
    },
    "todayStats": {
      "ordersToday": 25,
      "revenueToday": 45000,
      "avgOrderValueToday": 1800
    },
    "statusBreakdown": [
      {
        "status": "Assigned",
        "count": 45,
        "totalAmount": 75000,
        "avgOrderValue": 1667,
        "percentage": 30
      },
      {
        "status": "Delivered",
        "count": 80,
        "totalAmount": 140000,
        "avgOrderValue": 1750,
        "percentage": 53
      },
      {
        "status": "Packed",
        "count": 25,
        "totalAmount": 35000,
        "avgOrderValue": 1400,
        "percentage": 17
      }
    ],
    "recentOrders": [
      {
        "_id": "68a997f8615774c209f0d1b2",
        "orderId": "ORD12345",
        "status": "Assigned",
        "totalAmount": 2500,
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "orderDate": "2025-08-23T10:29:12.585Z",
        "paymentType": "COD",
        "orderType": "Online",
        "skuCount": 2,
        "skuTracking": [
          {
            "sku": "TOPBRA023",
            "productName": "Brake Pad",
            "quantity": 2,
            "tracking_info": {
              "status": "Pending",
              "timestamps": {
                "confirmedAt": "2025-08-23T10:29:12.585Z",
                "assignedAt": "2025-08-23T10:29:23.746Z"
              }
            },
            "return_info": {
              "is_returned": false,
              "return_id": null
            },
            "dealerMapped": []
          },
          {
            "sku": "TOPBRA024",
            "productName": "Clutch Plate",
            "quantity": 1,
            "tracking_info": {
              "status": "Pending",
              "timestamps": {
                "confirmedAt": "2025-08-23T10:29:12.585Z",
                "assignedAt": "2025-08-23T10:29:23.746Z"
              }
            },
            "return_info": {
              "is_returned": false,
              "return_id": null
            },
            "dealerMapped": [
              {
                "dealerId": "6877611b3fb93eecfd9f57bb"
              }
            ]
          }
        ]
      }
    ],
    "filters": {
      "today": false,
      "status": null,
      "startDate": null,
      "endDate": null,
      "includeSkuLevelTracking": true
    },
    "generatedAt": "2025-01-10T15:30:00.000Z"
  }
}
```

### Error Response (400/401/403/500)

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Usage Examples

### 1. Get All Order Statistics

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Get Today's Orders

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters?today=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Get Orders by Status

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters?status=Assigned" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Get Today's Orders with Specific Status

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters?today=true&status=Delivered" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 5. Get Orders with Date Range

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 6. Get Orders with SKU Level Tracking

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters?includeSkuLevelTracking=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 7. Get Today's Orders with SKU Tracking

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters?today=true&includeSkuLevelTracking=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 8. Get Orders by Status with SKU Tracking

```bash
curl -X GET "http://localhost:5003/api/orders/stats/filters?status=Assigned&includeSkuLevelTracking=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Response Fields Description

### Summary
- `totalOrders`: Total number of orders matching the filters
- `totalRevenue`: Total revenue from orders matching the filters
- `avgOrderValue`: Average order value for orders matching the filters

### Today Stats (when not filtering by today)
- `ordersToday`: Number of orders created today
- `revenueToday`: Revenue from orders created today
- `avgOrderValueToday`: Average order value for today's orders

### Status Breakdown
- `status`: Order status name
- `count`: Number of orders with this status
- `totalAmount`: Total amount for orders with this status
- `avgOrderValue`: Average order value for this status
- `percentage`: Percentage of total orders with this status

### Recent Orders
- `_id`: Order ID
- `orderId`: Order identifier
- `status`: Current order status
- `totalAmount`: Order total amount
- `customerName`: Customer name
- `customerEmail`: Customer email
- `orderDate`: Order creation date
- `paymentType`: Payment method used
- `orderType`: Type of order (Online/Offline/System)
- `skuCount`: Number of SKUs in the order
- `skuTracking`: SKU-level tracking information (when requested)

### SKU Tracking (when includeSkuLevelTracking=true)
- `sku`: SKU code
- `productName`: Product name
- `quantity`: Quantity ordered
- `tracking_info`: Individual SKU tracking information
  - `status`: SKU status (Pending, Confirmed, Assigned, Packed, Shipped, Delivered, Cancelled, Returned)
  - `timestamps`: SKU-level timestamps
- `return_info`: Return information for the SKU
- `dealerMapped`: Dealers mapped to this SKU

## Filtering Logic

### Date Filtering
- When `today=true`: Filters orders created from start of today to now
- When `startDate`/`endDate` provided: Filters orders within the specified date range
- When both `today=true` and date range provided: `today` takes precedence

### Status Filtering
- When `status` provided: Filters orders with the specified status
- Status values are case-sensitive and must match exactly

### Combined Filtering
- All filters can be combined
- Filters are applied using AND logic (all conditions must be met)

## Performance Considerations

- The endpoint uses MongoDB aggregation pipelines for efficient data processing
- Indexes on `timestamps.createdAt` and `status` fields are recommended for optimal performance
- SKU-level tracking adds processing overhead - use only when needed
- Recent orders are limited to 10 records to maintain response time

## Error Handling

- **400 Bad Request**: Invalid query parameters
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **500 Internal Server Error**: Server-side error

## Testing

Use the provided test script `test-order-stats-with-filters.js` to test various scenarios:

```bash
# Run all tests
node test-order-stats-with-filters.js

# Run specific test
node test-order-stats-with-filters.js "Get today's order statistics"
```

## Related Endpoints

- `GET /api/orders/stats` - Comprehensive order statistics
- `GET /api/orders/stats/dashboard` - Dashboard with additional metrics
- `GET /api/orders/stats/dealer/:dealerId` - Dealer-specific statistics
- `GET /api/orders/dealer/:dealerId/stats` - Comprehensive dealer statistics

## Changelog

- **v1.0.0** (2025-01-10): Initial implementation with basic filtering and SKU tracking support
