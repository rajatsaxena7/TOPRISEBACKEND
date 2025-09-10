# Products by Dealer Endpoint Documentation

## Overview
This endpoint provides comprehensive access to products assigned to a specific dealer, including detailed permission matrix, dealer-specific pricing, and advanced filtering capabilities.

## Endpoint Details

### **GET** `/api/products/dealer/:dealerId`

**Description**: Retrieve products assigned to a specific dealer with permission matrix and dealer-specific information.

**Authentication**: Required (Bearer Token)

**Authorization**: 
- Super-admin
- Inventory-Admin  
- Dealer
- Fulfillment-Admin

---

## Request Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dealerId` | String | Yes | The unique identifier of the dealer |

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | Number | 1 | Page number for pagination |
| `limit` | Number | 10 | Number of products per page |
| `status` | String | 'Active' | Filter by product status |
| `inStock` | Boolean | true | Filter by stock availability |
| `category` | String | - | Filter by category ID |
| `brand` | String | - | Filter by brand ID |
| `search` | String | - | Search in product name, SKU, or description |
| `sortBy` | String | 'created_at' | Field to sort by |
| `sortOrder` | String | 'desc' | Sort order ('asc' or 'desc') |
| `includePermissionMatrix` | Boolean | true | Include permission matrix in response |

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Products by dealer fetched successfully",
  "data": {
    "dealerId": "507f1f77bcf86cd799439011",
    "products": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "sku_code": "TOPBIK001",
        "product_name": "Mountain Bike",
        "description": "High-quality mountain bike for outdoor adventures",
        "pricing": {
          "mrp_with_gst": 25000,
          "base_selling_price": 20000,
          "dealer_selling_price": 22000,
          "dealer_margin": 10,
          "gst_percentage": 18
        },
        "brand": {
          "_id": "507f1f77bcf86cd799439013",
          "brand_name": "Trek"
        },
        "category": {
          "_id": "507f1f77bcf86cd799439014",
          "category_name": "Bicycles"
        },
        "sub_category": {
          "_id": "507f1f77bcf86cd799439015",
          "subcategory_name": "Mountain Bikes"
        },
        "model": {
          "_id": "507f1f77bcf86cd799439016",
          "model_name": "X-Caliber 8"
        },
        "variant": {
          "_id": "507f1f77bcf86cd799439017",
          "variant_name": "Medium"
        },
        "dealer_info": {
          "in_stock": true,
          "quantity_available": 15,
          "dealer_margin": 10,
          "dealer_priority": 5
        },
        "images": [
          "https://s3.amazonaws.com/bucket/image1.jpg",
          "https://s3.amazonaws.com/bucket/image2.jpg"
        ],
        "status": "Active",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-20T14:45:00.000Z",
        "permission_matrix": {
          "canEdit": {
            "product_name": false,
            "description": false,
            "mrp_with_gst": true,
            "selling_price": true,
            "gst_percentage": true,
            "dimensions": true,
            "weight": true,
            "certifications": true,
            "warranty": true,
            "images": true,
            "video_url": true,
            "brochure_available": true,
            "is_returnable": false,
            "return_policy": false,
            "seo_title": false,
            "seo_description": false,
            "seo_metaData": false,
            "search_tags": false
          },
          "canView": {
            "all_fields": true,
            "competitor_prices": false,
            "internal_notes": false,
            "admin_notes": false
          },
          "canManage": {
            "stock": true,
            "pricing": true,
            "availability": true,
            "dealer_margin": false,
            "dealer_priority": false
          }
        }
      }
    ],
    "summary": {
      "totalProducts": 150,
      "totalInStock": 120,
      "totalOutOfStock": 30,
      "averagePrice": 18500,
      "minPrice": 5000,
      "maxPrice": 50000
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalProducts": 150,
      "limit": 10,
      "hasNextPage": true,
      "hasPrevPage": false,
      "nextPage": 2,
      "prevPage": null
    },
    "filters": {
      "status": "Active",
      "inStock": true,
      "category": null,
      "brand": null,
      "search": null,
      "sortBy": "created_at",
      "sortOrder": "desc"
    }
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Dealer ID is required",
  "error": "Validation Error"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Unauthorized"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Dealer not found",
  "error": "Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch products for dealer",
  "error": "Internal Server Error"
}
```

---

## Permission Matrix

The permission matrix defines what actions a dealer can perform on each product:

### Can Edit Permissions
| Field | Dealer Can Edit | Description |
|-------|----------------|-------------|
| `product_name` | ❌ | Product name (admin only) |
| `description` | ❌ | Product description (admin only) |
| `mrp_with_gst` | ✅ | MRP with GST |
| `selling_price` | ✅ | Base selling price |
| `gst_percentage` | ✅ | GST percentage |
| `dimensions` | ✅ | Product dimensions |
| `weight` | ✅ | Product weight |
| `certifications` | ✅ | Product certifications |
| `warranty` | ✅ | Warranty information |
| `images` | ✅ | Product images |
| `video_url` | ✅ | Product video URL |
| `brochure_available` | ✅ | Brochure availability |
| `is_returnable` | ❌ | Return policy (admin only) |
| `return_policy` | ❌ | Return policy text (admin only) |
| `seo_title` | ❌ | SEO title (admin only) |
| `seo_description` | ❌ | SEO description (admin only) |
| `seo_metaData` | ❌ | SEO metadata (admin only) |
| `search_tags` | ❌ | Search tags (admin only) |

### Can View Permissions
| Field | Dealer Can View | Description |
|-------|----------------|-------------|
| `all_fields` | ✅ | All product fields |
| `competitor_prices` | ❌ | Competitor pricing data |
| `internal_notes` | ❌ | Internal admin notes |
| `admin_notes` | ❌ | Admin-only notes |

### Can Manage Permissions
| Field | Dealer Can Manage | Description |
|-------|------------------|-------------|
| `stock` | ✅ | Stock quantity |
| `pricing` | ✅ | Pricing information |
| `availability` | ✅ | Product availability |
| `dealer_margin` | ❌ | Dealer margin (admin only) |
| `dealer_priority` | ❌ | Dealer priority (admin only) |

---

## Usage Examples

### 1. Basic Product Fetch
```bash
curl -X GET "http://localhost:5002/api/products/dealer/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Filtered by Status and Stock
```bash
curl -X GET "http://localhost:5002/api/products/dealer/507f1f77bcf86cd799439011?status=Active&inStock=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Search with Pagination
```bash
curl -X GET "http://localhost:5002/api/products/dealer/507f1f77bcf86cd799439011?search=bike&page=2&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Sorted by Price
```bash
curl -X GET "http://localhost:5002/api/products/dealer/507f1f77bcf86cd799439011?sortBy=selling_price&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 5. Without Permission Matrix
```bash
curl -X GET "http://localhost:5002/api/products/dealer/507f1f77bcf86cd799439011?includePermissionMatrix=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## JavaScript/Node.js Examples

### Using Axios
```javascript
const axios = require('axios');

async function getDealerProducts(dealerId, options = {}) {
  try {
    const response = await axios.get(`http://localhost:5002/api/products/dealer/${dealerId}`, {
      params: {
        page: options.page || 1,
        limit: options.limit || 10,
        status: options.status || 'Active',
        inStock: options.inStock !== undefined ? options.inStock : true,
        category: options.category,
        brand: options.brand,
        search: options.search,
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc',
        includePermissionMatrix: options.includePermissionMatrix !== undefined ? options.includePermissionMatrix : true
      },
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching dealer products:', error.response?.data || error.message);
    throw error;
  }
}

// Usage examples
const products = await getDealerProducts('507f1f77bcf86cd799439011', {
  page: 1,
  limit: 20,
  search: 'bike',
  inStock: true
});
```

### Using Fetch
```javascript
async function getDealerProducts(dealerId, options = {}) {
  const params = new URLSearchParams({
    page: options.page || 1,
    limit: options.limit || 10,
    status: options.status || 'Active',
    inStock: options.inStock !== undefined ? options.inStock : true,
    ...options
  });

  try {
    const response = await fetch(`http://localhost:5002/api/products/dealer/${dealerId}?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dealer products:', error);
    throw error;
  }
}
```

---

## Performance Considerations

### Caching
- Product data is cached for 5 minutes to improve response times
- Cache keys include dealer ID and filter parameters
- Cache is automatically invalidated when products are updated

### Pagination
- Default page size is 10 products
- Maximum page size is 100 products
- Use pagination for large product catalogs

### Database Optimization
- Indexes are optimized for dealer-based queries
- Aggregation pipelines are used for summary statistics
- Lean queries are used to reduce memory usage

---

## Security Features

### Authentication
- JWT token required for all requests
- Token validation on every request
- Automatic token expiration handling

### Authorization
- Role-based access control
- Dealer can only access their assigned products
- Admin roles have full access

### Audit Logging
- All access attempts are logged
- Includes user ID, timestamp, and action details
- Logs are stored for compliance and monitoring

---

## Error Handling

### Common Error Scenarios
1. **Invalid Dealer ID**: Returns 400 with validation message
2. **Dealer Not Found**: Returns 404 with appropriate message
3. **Authentication Failure**: Returns 401 with auth error
4. **Insufficient Permissions**: Returns 403 with permission error
5. **Database Connection Issues**: Returns 500 with server error

### Error Response Format
All errors follow a consistent format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Error type or code",
  "details": "Additional error details (optional)"
}
```

---

## Monitoring and Logging

### Log Levels
- **INFO**: Successful requests and operations
- **WARN**: Non-critical issues (e.g., missing optional data)
- **ERROR**: Critical errors and failures

### Metrics Tracked
- Request count per dealer
- Response times
- Error rates
- Cache hit/miss ratios
- Database query performance

---

## Testing

### Test Script
Use the provided test script `test-products-by-dealer.js` to verify functionality:

```bash
node test-products-by-dealer.js
```

### Test Coverage
- ✅ Basic product fetching
- ✅ Filtering by various parameters
- ✅ Pagination functionality
- ✅ Search functionality
- ✅ Sorting options
- ✅ Permission matrix inclusion/exclusion
- ✅ Error handling
- ✅ Performance testing

---

## Changelog

### Version 1.0.0 (Current)
- Initial implementation
- Basic product fetching by dealer
- Permission matrix integration
- Comprehensive filtering and pagination
- Audit logging
- Performance optimization

---

## Support

For technical support or questions about this endpoint:
- Check the logs for detailed error information
- Verify authentication and authorization
- Ensure dealer ID is valid and exists
- Contact the development team for assistance

---

## Related Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/categories` - Get product categories
- `GET /api/brands` - Get product brands
- `GET /api/users/dealer/:id` - Get dealer information
