# Dealer Dashboard APIs

## Overview

This document describes the comprehensive dealer dashboard APIs that provide dealers with detailed insights into their business performance, including product statistics, order analytics, revenue tracking, and performance metrics.

## API Endpoints

### 1. Dealer Dashboard Statistics

**Endpoint:** `GET /api/users/dealer/:dealerId/dashboard-stats`

**Description:** Get comprehensive statistics for a dealer including products, orders, categories, and performance metrics.

**Authentication:** Required (Bearer Token)

**Authorization:** Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "products": {
        "total": 156,
        "approved": 89,
        "pending": 34,
        "rejected": 12,
        "created": 21
      },
      "orders": {
        "total": 234,
        "pending": 45,
        "processing": 67,
        "shipped": 89,
        "delivered": 123,
        "cancelled": 10,
        "totalRevenue": 1250000,
        "avgOrderValue": 5341
      },
      "categories": {
        "assigned": 8,
        "active": 7,
        "totalProducts": 156
      },
      "performance": {
        "slaCompliance": 94.5,
        "avgResponseTime": 2.3,
        "customerRating": 4.7,
        "fulfillmentRate": 96.2
      }
    }
  },
  "message": "Dealer dashboard stats fetched successfully"
}
```

### 2. Dealer Assigned Categories

**Endpoint:** `GET /api/users/dealer/:dealerId/assigned-categories`

**Description:** Get all categories assigned to a dealer with product counts and details.

**Authentication:** Required (Bearer Token)

**Authorization:** Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "assignedCategories": [
      {
        "_id": "category_id",
        "category_name": "Engine Parts",
        "category_code": "ENG001",
        "category_image": "https://example.com/image.jpg",
        "category_Status": "Active",
        "product_count": 45,
        "assigned_date": "2024-01-15T00:00:00.000Z",
        "is_active": true
      }
    ]
  },
  "message": "Dealer assigned categories fetched successfully"
}
```

### 3. Complete Dealer Dashboard

**Endpoint:** `GET /api/users/dealer/:dealerId/dashboard`

**Description:** Get complete dashboard data including stats, order KPIs, and assigned categories in a single request.

**Authentication:** Required (Bearer Token)

**Authorization:** Dealer, Super-admin, Fulfillment-Admin, Inventory-Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "products": { /* product statistics */ },
      "orders": { /* order statistics */ },
      "categories": { /* category statistics */ },
      "performance": { /* performance metrics */ }
    },
    "orderKPIs": [
      {
        "period": "This Week",
        "orders": {
          "total": 45,
          "new": 12,
          "processing": 18,
          "shipped": 10,
          "delivered": 5,
          "cancelled": 0,
          "growth": 12.5
        },
        "revenue": {
          "total": 240000,
          "average": 5333,
          "growth": 12.5
        },
        "performance": {
          "slaCompliance": 96.8,
          "avgFulfillmentTime": 1.8,
          "customerSatisfaction": 4.8
        }
      }
    ],
    "assignedCategories": [ /* assigned categories array */ ]
  },
  "message": "Dealer dashboard data fetched successfully"
}
```

### 4. Dealer Order KPIs

**Endpoint:** `GET /api/orders/dealer/:dealerId/kpis`

**Description:** Get order KPIs for a dealer with period-based analysis.

**Authentication:** Required (Bearer Token)

**Authorization:** All authenticated users

**Query Parameters:**
- `period` (optional): Time period for analysis (week, month, quarter, year). Default: week

**Response:**
```json
{
  "success": true,
  "data": {
    "orderKPIs": [
      {
        "period": "This Week",
        "orders": {
          "total": 45,
          "new": 12,
          "processing": 18,
          "shipped": 10,
          "delivered": 5,
          "cancelled": 0,
          "growth": 12.5
        },
        "revenue": {
          "total": 240000,
          "average": 5333,
          "growth": 12.5
        },
        "performance": {
          "slaCompliance": 96.8,
          "avgFulfillmentTime": 1.8,
          "customerSatisfaction": 4.7
        }
      }
    ]
  },
  "message": "Dealer order KPIs fetched successfully"
}
```

### 5. Dealer Orders

**Endpoint:** `GET /api/orders/dealer/:dealerId/orders`

**Description:** Get paginated list of orders for a dealer with filtering options.

**Authentication:** Required (Bearer Token)

**Authorization:** All authenticated users

**Query Parameters:**
- `status` (optional): Filter by order status
- `startDate` (optional): Filter orders from this date
- `endDate` (optional): Filter orders until this date
- `page` (optional): Page number for pagination. Default: 1
- `limit` (optional): Number of orders per page. Default: 10

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "order_id",
        "orderId": "ORD123",
        "status": "Delivered",
        "totalAmount": 15000,
        "orderDate": "2024-01-15T10:30:00.000Z",
        "customerDetails": { /* customer info */ },
        "dealerMapping": [ /* dealer assignments */ ]
      }
    ],
    "pagination": {
      "total": 234,
      "page": 1,
      "limit": 10,
      "pages": 24
    }
  },
  "message": "Dealer orders fetched successfully"
}
```

## Data Models

### DealerDashboardStats
```typescript
interface DealerDashboardStats {
  products: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    created: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  categories: {
    assigned: number;
    active: number;
    totalProducts: number;
  };
  performance: {
    slaCompliance: number;
    avgResponseTime: number;
    customerRating: number;
    fulfillmentRate: number;
  };
}
```

### DealerOrderKPI
```typescript
interface DealerOrderKPI {
  period: string;
  orders: {
    total: number;
    new: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    growth: number;
  };
  revenue: {
    total: number;
    average: number;
    growth: number;
  };
  performance: {
    slaCompliance: number;
    avgFulfillmentTime: number;
    customerSatisfaction: number;
  };
}
```

### DealerAssignedCategory
```typescript
interface DealerAssignedCategory {
  _id: string;
  category_name: string;
  category_code: string;
  category_image?: string;
  category_Status: string;
  product_count: number;
  assigned_date: string;
  is_active: boolean;
}
```

### DealerInfo
```typescript
interface DealerInfo {
  dealerId: string;
  dealerIdString: string;
  legal_name: string;
  business_name: string;
}
```

### DealerList
```typescript
interface DealerList {
  dealerId: string;
  dealerIdString: string;
  legal_name: string;
  business_name: string;
  is_active: boolean;
}
```

## Features

### 1. Product Analytics
- **Total Products:** Count of all products assigned to the dealer
- **Approved Products:** Products that have been approved and are live
- **Pending Products:** Products awaiting approval
- **Rejected Products:** Products that were rejected
- **New Products:** Products created in the last 30 days

### 2. Order Analytics
- **Order Status Breakdown:** Count of orders by status (pending, processing, shipped, delivered, cancelled)
- **Revenue Tracking:** Total revenue and average order value
- **Order Growth:** Period-over-period growth analysis

### 3. Category Management
- **Assigned Categories:** Categories assigned to the dealer
- **Product Counts:** Number of products per category
- **Category Status:** Active/inactive status of categories

### 4. Performance Metrics
- **SLA Compliance:** Percentage of orders delivered within SLA
- **Response Time:** Average response time for order processing
- **Customer Rating:** Average customer satisfaction rating
- **Fulfillment Rate:** Percentage of orders successfully fulfilled

### 5. KPI Analysis
- **Period-based Analysis:** Weekly, monthly, quarterly, and yearly KPIs
- **Growth Tracking:** Revenue and order growth percentages
- **Performance Trends:** SLA compliance and fulfillment time trends

## Error Handling

### Common Error Responses

**Dealer Not Found:**
```json
{
  "success": false,
  "message": "Dealer not found",
  "status": 404
}
```

**Authentication Required:**
```json
{
  "success": false,
  "message": "Authentication required",
  "status": 401
}
```

**Insufficient Permissions:**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "status": 403
}
```

**Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "status": 500
}
```

## Usage Examples

### Frontend Integration

```typescript
// Get dealer dashboard stats
const getDealerDashboardStats = async (dealerId: string) => {
  const response = await apiClient.get(`/users/api/users/dealer/${dealerId}/dashboard-stats`);
  return response.data.data.stats;
};

// Get dealer order KPIs
const getDealerOrderKPIs = async (dealerId: string, period: string = 'week') => {
  const response = await apiClient.get(`/orders/api/orders/dealer/${dealerId}/kpis`, {
    params: { period }
  });
  return response.data.data.orderKPIs;
};

// Get dealer assigned categories
const getDealerAssignedCategories = async (dealerId: string) => {
  const response = await apiClient.get(`/users/api/users/dealer/${dealerId}/assigned-categories`);
  return response.data.data.assignedCategories;
};
```

### Testing

Use the provided test script `test-dealer-dashboard-apis.js` to verify API functionality:

```bash
node test-dealer-dashboard-apis.js
```

Make sure to:
1. Replace `YOUR_DEALER_JWT_TOKEN_HERE` with an actual dealer JWT token
2. Replace `YOUR_TEST_DEALER_ID` with an actual dealer ID
3. Ensure all services are running (user-service, order-service, product-service)

## Performance Considerations

1. **Caching:** API responses are cached for improved performance
2. **Pagination:** Order lists support pagination to handle large datasets
3. **Async Processing:** Heavy calculations are performed asynchronously
4. **Error Resilience:** APIs gracefully handle service failures with fallback data

## Security

1. **Authentication:** All endpoints require valid JWT tokens
2. **Authorization:** Role-based access control ensures data security
3. **Data Isolation:** Dealers can only access their own data
4. **Audit Logging:** All API access is logged for security monitoring

## Monitoring

1. **Performance Metrics:** API response times and error rates are monitored
2. **Usage Analytics:** API usage patterns are tracked
3. **Error Tracking:** Detailed error logs for debugging
4. **Health Checks:** Service health endpoints for monitoring

## Future Enhancements

1. **Real-time Updates:** WebSocket integration for live dashboard updates
2. **Advanced Analytics:** Machine learning-based performance predictions
3. **Custom Dashboards:** User-configurable dashboard layouts
4. **Export Functionality:** Data export in various formats (CSV, PDF, Excel)
5. **Mobile Optimization:** Mobile-specific API endpoints
