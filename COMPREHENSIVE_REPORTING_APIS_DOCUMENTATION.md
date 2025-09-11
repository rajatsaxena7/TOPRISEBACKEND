# Comprehensive Reporting APIs Documentation

## Overview

This documentation covers the comprehensive reporting endpoints implemented across all three microservices: **Product Service**, **User Service**, and **Order Service**. Each service provides detailed analytics, performance metrics, and export capabilities with extensive filtering options.

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Product Service │    │   User Service   │    │  Order Service  │
│   Port: 5002    │    │   Port: 5001    │    │   Port: 5003    │
│                 │    │                 │    │                 │
│ /api/reports/   │    │ /api/reports/   │    │ /api/reports/   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Authentication & Authorization

All reporting endpoints require:
- **Authentication**: Bearer token in Authorization header
- **Authorization**: One of the following roles:
  - `Super-admin`
  - `Fulfillment-Admin`
  - `Inventory-Admin`
  - `Analytics-Admin`

## Product Service Reports

Base URL: `http://localhost:5002/api/reports`

### 1. Product Analytics Report
**Endpoint**: `GET /analytics`

Comprehensive analytics for products with grouping and filtering capabilities.

#### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `startDate` | String | Start date filter (ISO format) | `2024-01-01` |
| `endDate` | String | End date filter (ISO format) | `2024-12-31` |
| `brand` | String | Filter by brand ID | `68a041de1e140480128866e6` |
| `category` | String | Filter by category ID | `68a041de1e140480128866e7` |
| `subCategory` | String | Filter by subcategory ID | `68a041de1e140480128866e8` |
| `model` | String | Filter by model ID | `68a041de1e140480128866e9` |
| `variant` | String | Filter by variant ID | `68a041de1e140480128866ea` |
| `status` | String | Filter by product status | `Approved`, `Pending`, `Rejected` |
| `qcStatus` | String | Filter by QC status | `Approved`, `Pending`, `Rejected` |
| `liveStatus` | String | Filter by live status | `Active`, `Inactive` |
| `productType` | String | Filter by product type | `Spare Parts`, `Accessories` |
| `isUniversal` | Boolean | Filter by universal products | `true`, `false` |
| `isConsumable` | Boolean | Filter by consumable products | `true`, `false` |
| `minPrice` | Number | Minimum price filter | `100` |
| `maxPrice` | Number | Maximum price filter | `10000` |
| `createdBy` | String | Filter by creator ID | `68a041de1e140480128866eb` |
| `createdByRole` | String | Filter by creator role | `Super-admin` |
| `groupBy` | String | Group results by field | `brand`, `category`, `status` |
| `sortBy` | String | Sort by field | `count`, `totalMrp`, `avgMrp` |
| `sortOrder` | String | Sort order | `asc`, `desc` |
| `limit` | Number | Maximum results | `100` |

#### Response Example
```json
{
  "success": true,
  "message": "Product analytics report generated successfully",
  "data": {
    "summary": {
      "totalProducts": 150,
      "totalMrp": 1500000,
      "avgMrp": 10000,
      "minMrp": 100,
      "maxMrp": 50000,
      "totalSellingPrice": 1350000,
      "avgSellingPrice": 9000,
      "statusBreakdown": {
        "Approved": 120,
        "Pending": 25,
        "Rejected": 5
      }
    },
    "analytics": [
      {
        "_id": "Test Brand",
        "count": 45,
        "totalMrp": 450000,
        "avgMrp": 10000,
        "minMrp": 500,
        "maxMrp": 25000,
        "totalSellingPrice": 405000,
        "avgSellingPrice": 9000,
        "statusBreakdown": [...],
        "products": [...]
      }
    ],
    "filters": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31",
      "brand": "68a041de1e140480128866e6",
      "groupBy": "brand",
      "sortBy": "count",
      "sortOrder": "desc",
      "limit": 100
    }
  }
}
```

### 2. Product Performance Report
**Endpoint**: `GET /performance`

Detailed performance metrics for products with efficiency scoring.

#### Key Features
- Performance scoring based on price and status
- Efficiency metrics
- Value analysis
- Discount calculations

### 3. Product Inventory Report
**Endpoint**: `GET /inventory`

Comprehensive inventory analysis with status breakdowns.

### 4. Product Category Report
**Endpoint**: `GET /category`

Category-wise product analysis with subcategory breakdowns.

### 5. Product Brand Report
**Endpoint**: `GET /brand`

Brand-wise product analysis with performance metrics.

### 6. Product Export Report
**Endpoint**: `GET /export`

Complete product data export with all fields for external analysis.

## User Service Reports

Base URL: `http://localhost:5001/api/reports`

### 1. User Analytics Report
**Endpoint**: `GET /analytics`

User analytics with role-based grouping and activity metrics.

#### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `startDate` | String | Start date filter | `2024-01-01` |
| `endDate` | String | End date filter | `2024-12-31` |
| `role` | String | Filter by user role | `Super-admin`, `Dealer` |
| `status` | String | Filter by user status | `Active`, `Inactive` |
| `isActive` | Boolean | Filter by active status | `true`, `false` |
| `city` | String | Filter by city | `New Delhi` |
| `state` | String | Filter by state | `Delhi` |
| `pincode` | String | Filter by pincode | `110001` |
| `createdBy` | String | Filter by creator | `68a041de1e140480128866eb` |
| `groupBy` | String | Group by field | `role`, `status`, `city` |
| `sortBy` | String | Sort by field | `count`, `name` |
| `sortOrder` | String | Sort order | `asc`, `desc` |
| `limit` | Number | Maximum results | `100` |

### 2. Dealer Analytics Report
**Endpoint**: `GET /dealers`

Dealer-specific analytics with category assignments and performance metrics.

#### Key Features
- Dealer performance tracking
- Category assignment analysis
- Geographic distribution
- Business metrics

### 3. Employee Analytics Report
**Endpoint**: `GET /employees`

Employee analytics with dealer assignments and performance tracking.

### 4. User Performance Report
**Endpoint**: `GET /performance`

User performance metrics with activity scoring and login analysis.

### 5. User Export Report
**Endpoint**: `GET /export`

Complete user data export with all profile information.

## Order Service Reports

Base URL: `http://localhost:5003/api/reports`

### 1. Order Analytics Report
**Endpoint**: `GET /analytics`

Comprehensive order analytics with revenue and performance metrics.

#### Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `startDate` | String | Start date filter | `2024-01-01` |
| `endDate` | String | End date filter | `2024-12-31` |
| `status` | String | Filter by order status | `Delivered`, `Pending`, `Cancelled` |
| `orderType` | String | Filter by order type | `Online`, `Offline` |
| `paymentType` | String | Filter by payment type | `COD`, `Online`, `Card` |
| `orderSource` | String | Filter by order source | `Web`, `Mobile`, `API` |
| `deliveryType` | String | Filter by delivery type | `standard`, `express` |
| `typeOfDelivery` | String | Filter by delivery method | `Express`, `Standard` |
| `minAmount` | Number | Minimum order amount | `100` |
| `maxAmount` | Number | Maximum order amount | `10000` |
| `city` | String | Filter by customer city | `New Delhi` |
| `state` | String | Filter by customer state | `Delhi` |
| `pincode` | String | Filter by customer pincode | `110001` |
| `groupBy` | String | Group by field | `status`, `date`, `paymentType` |
| `sortBy` | String | Sort by field | `count`, `totalAmount` |
| `sortOrder` | String | Sort order | `asc`, `desc` |
| `limit` | Number | Maximum results | `100` |

### 2. Sales Analytics Report
**Endpoint**: `GET /sales`

Sales performance analytics with revenue tracking and trend analysis.

#### Key Features
- Revenue analysis
- Sales trends
- Payment method analysis
- Geographic sales distribution
- Time-based grouping (daily, monthly, yearly)

### 3. Order Performance Report
**Endpoint**: `GET /performance`

Order processing performance with efficiency metrics and SLA tracking.

#### Key Features
- Processing time analysis
- Delivery time tracking
- Efficiency scoring
- SLA compliance metrics
- Performance ranking

### 4. Picklist Analytics Report
**Endpoint**: `GET /picklists`

Picklist generation and fulfillment analytics.

### 5. Order Export Report
**Endpoint**: `GET /export`

Complete order data export with all transaction details.

## Common Response Structure

All reporting endpoints follow a consistent response structure:

```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "summary": {
      // High-level statistics and metrics
    },
    "analytics": [
      // Detailed grouped data
    ],
    "filters": {
      // Applied filters and parameters
    }
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function getProductAnalytics() {
  try {
    const response = await axios.get('http://localhost:5002/api/reports/analytics', {
      headers: {
        'Authorization': 'Bearer your-token-here',
        'Content-Type': 'application/json'
      },
      params: {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        groupBy: 'brand',
        sortBy: 'count',
        sortOrder: 'desc',
        limit: 50
      }
    });
    
    console.log('Analytics:', response.data.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### cURL
```bash
curl -X GET "http://localhost:5002/api/reports/analytics" \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -G \
  -d "startDate=2024-01-01" \
  -d "endDate=2024-12-31" \
  -d "groupBy=brand" \
  -d "sortBy=count" \
  -d "sortOrder=desc" \
  -d "limit=50"
```

## Testing

Use the provided test script to verify all reporting endpoints:

```bash
# Run all tests
node test-comprehensive-reporting-endpoints.js

# Run specific service tests
node test-comprehensive-reporting-endpoints.js --service product
node test-comprehensive-reporting-endpoints.js --service user
node test-comprehensive-reporting-endpoints.js --service order

# Run specific test
node test-comprehensive-reporting-endpoints.js --test product "Product Analytics Report"
```

## Performance Considerations

- All endpoints use MongoDB aggregation pipelines for optimal performance
- Results are limited by default to prevent large response sizes
- Date range filters are indexed for fast queries
- Complex aggregations are optimized for large datasets

## Security Features

- All endpoints require authentication
- Role-based access control
- Audit logging for all report access
- Input validation and sanitization
- Rate limiting protection

## Monitoring and Logging

- Comprehensive audit trails for all report access
- Performance metrics logging
- Error tracking and alerting
- Usage analytics for report optimization

## Future Enhancements

- Real-time dashboard integration
- Scheduled report generation
- Email report delivery
- Custom report builder
- Advanced visualization support
- Export to multiple formats (CSV, Excel, PDF)
