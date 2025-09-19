# Products by Category Controller Documentation

## Overview

The Products by Category Controller provides a comprehensive set of endpoints to retrieve products filtered by category. This controller is designed to show products based on category only, with various filtering and pagination options.

## Features

- ✅ Get products by category ID
- ✅ Get products by category name (case-insensitive search)
- ✅ Get products by category code
- ✅ Get product count by category with detailed breakdowns
- ✅ Get all categories with their product counts
- ✅ Pagination support
- ✅ Sorting options
- ✅ Live status filtering
- ✅ Comprehensive error handling
- ✅ Detailed logging

## API Endpoints

### Base URL
```
/api/products-by-category
```

### 1. Get Products by Category ID

**Endpoint:** `GET /category/:categoryId`

**Description:** Retrieves products filtered by category ID with pagination and sorting options.

**Parameters:**
- `categoryId` (path, required): The category ID to filter products by

**Query Parameters:**
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of products per page
- `live_status` (optional, default: "Live"): Filter by product live status
- `sortBy` (optional, default: "created_at"): Field to sort by
- `sortOrder` (optional, default: "desc"): Sort order (asc/desc)

**Example Request:**
```bash
GET /api/products-by-category/category/64a1b2c3d4e5f6789012345?page=1&limit=10&live_status=Live&sortBy=created_at&sortOrder=desc
```

**Example Response:**
```json
{
  "success": true,
  "message": "Products fetched successfully by category",
  "data": {
    "products": [
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "product_name": "Engine Oil Filter",
        "sku_code": "ENG001",
        "selling_price": 1500,
        "live_status": "Live",
        "category": {
          "_id": "64a1b2c3d4e5f6789012345",
          "category_name": "Engine Parts",
          "category_code": "ENG001",
          "category_image": "https://example.com/image.jpg"
        },
        "brand": {
          "_id": "64a1b2c3d4e5f6789012347",
          "brand_name": "Bosch",
          "brand_logo": "https://example.com/logo.jpg"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 50,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    },
    "category": {
      "_id": "64a1b2c3d4e5f6789012345",
      "category_name": "Engine Parts",
      "category_code": "ENG001",
      "category_image": "https://example.com/image.jpg"
    }
  }
}
```

### 2. Get Products by Category Name

**Endpoint:** `GET /category/name/:categoryName`

**Description:** Retrieves products filtered by category name (case-insensitive search).

**Parameters:**
- `categoryName` (path, required): The category name to search for

**Query Parameters:** Same as above

**Example Request:**
```bash
GET /api/products-by-category/category/name/Engine%20Parts?page=1&limit=10
```

### 3. Get Products by Category Code

**Endpoint:** `GET /category/code/:categoryCode`

**Description:** Retrieves products filtered by category code.

**Parameters:**
- `categoryCode` (path, required): The category code to filter by

**Query Parameters:** Same as above

**Example Request:**
```bash
GET /api/products-by-category/category/code/ENG001?page=1&limit=10
```

### 4. Get Product Count by Category

**Endpoint:** `GET /category/:categoryId/count`

**Description:** Retrieves detailed product count statistics for a specific category.

**Authentication:** Required (Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin)

**Parameters:**
- `categoryId` (path, required): The category ID to get count for

**Query Parameters:**
- `live_status` (optional): Filter by product live status

**Example Request:**
```bash
GET /api/products-by-category/category/64a1b2c3d4e5f6789012345/count?live_status=Live
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product count fetched successfully by category",
  "data": {
    "category": {
      "_id": "64a1b2c3d4e5f6789012345",
      "category_name": "Engine Parts",
      "category_code": "ENG001"
    },
    "summary": {
      "totalProducts": 150
    },
    "breakdown": {
      "byStatus": [
        {
          "status": "Live",
          "count": 120,
          "percentage": 80
        },
        {
          "status": "Pending",
          "count": 30,
          "percentage": 20
        }
      ],
      "byProductType": [
        {
          "productType": "OE",
          "count": 80,
          "percentage": 53
        },
        {
          "productType": "OEM",
          "count": 70,
          "percentage": 47
        }
      ]
    },
    "filters": {
      "live_status": "Live"
    },
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Get Categories with Product Counts

**Endpoint:** `GET /categories/with-counts`

**Description:** Retrieves all categories with their respective product counts.

**Authentication:** Required (Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin)

**Query Parameters:**
- `live_status` (optional, default: "Live"): Filter products by live status
- `category_Status` (optional, default: "Active"): Filter categories by status

**Example Request:**
```bash
GET /api/products-by-category/categories/with-counts?live_status=Live&category_Status=Active
```

**Example Response:**
```json
{
  "success": true,
  "message": "Categories with product counts fetched successfully",
  "data": {
    "summary": {
      "totalCategories": 25,
      "totalProducts": 1250
    },
    "categories": [
      {
        "_id": "64a1b2c3d4e5f6789012345",
        "category_name": "Engine Parts",
        "category_code": "ENG001",
        "category_image": "https://example.com/image.jpg",
        "category_Status": "Active",
        "productCount": 150
      },
      {
        "_id": "64a1b2c3d4e5f6789012346",
        "category_name": "Brake Parts",
        "category_code": "BRK001",
        "category_image": "https://example.com/image2.jpg",
        "category_Status": "Active",
        "productCount": 120
      }
    ],
    "filters": {
      "live_status": "Live",
      "category_Status": "Active"
    },
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Category ID is required",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Category not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

## Authentication & Authorization

- **Public Endpoints:** Product listing endpoints (1-3) are currently set as public for easy access
- **Protected Endpoints:** Count and analytics endpoints (4-5) require authentication and specific roles

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get products by category ID
async function getProductsByCategory(categoryId) {
  try {
    const response = await axios.get(
      `http://localhost:5001/api/products-by-category/category/${categoryId}`,
      {
        params: {
          page: 1,
          limit: 10,
          live_status: 'Live',
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
  }
}
```

### cURL
```bash
# Get products by category ID
curl -X GET "http://localhost:5001/api/products-by-category/category/64a1b2c3d4e5f6789012345?page=1&limit=10" \
  -H "Content-Type: application/json"

# Get product count by category (with authentication)
curl -X GET "http://localhost:5001/api/products-by-category/category/64a1b2c3d4e5f6789012345/count" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

A comprehensive test file is provided: `test-products-by-category.js`

To run tests:
1. Update the test configuration variables in the test file
2. Run: `node test-products-by-category.js`

## Performance Considerations

- **Pagination:** All product listing endpoints support pagination to handle large datasets
- **Indexing:** Ensure proper database indexes on category fields for optimal performance
- **Caching:** Consider implementing Redis caching for frequently accessed category data
- **Population:** Product data includes populated references for related entities

## Database Schema Dependencies

The controller relies on the following models:
- **Product Model:** Main product data with category reference
- **Category Model:** Category information and metadata
- **Brand Model:** Brand information (populated)
- **SubCategory Model:** Sub-category information (populated)
- **Model Model:** Vehicle model information (populated)
- **Variant Model:** Vehicle variant information (populated)
- **Year Model:** Year information (populated)

## Future Enhancements

- [ ] Add Redis caching for improved performance
- [ ] Implement search functionality within category products
- [ ] Add product filtering by additional criteria (price range, brand, etc.)
- [ ] Add bulk operations for category-based product management
- [ ] Implement real-time updates using WebSocket connections
- [ ] Add export functionality for category product data

## Support

For issues or questions regarding this controller, please refer to the main project documentation or contact the development team.
