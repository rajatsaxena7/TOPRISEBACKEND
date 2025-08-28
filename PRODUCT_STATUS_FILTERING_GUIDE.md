# Product Status Filtering Guide

## Overview
The `getProductsByFiltersWithPagination` endpoint now supports flexible status filtering, allowing you to retrieve products based on their `live_status` and `Qc_status` values.

## Available Statuses
- **Created**: Products that have been created but not yet submitted for approval
- **Pending**: Products submitted for approval but not yet reviewed
- **Approved**: Products that have been approved and are ready for use
- **Rejected**: Products that were rejected during the approval process
- **Live**: Products that are actively available to customers

## API Endpoint
```
GET /api/category/products/filter
```

## Query Parameters

### Status Filtering
| Parameter | Value | Description |
|-----------|-------|-------------|
| `status` | `all` | Returns products with any status |
| `status` | `Pending` | Returns only pending products |
| `status` | `Approved` | Returns only approved products |
| `status` | `Rejected` | Returns only rejected products |
| `status` | `Created` | Returns only created products |
| `status` | `Live` | Returns only live products |
| `status` | `Pending,Approved` | Returns products with either pending or approved status |

### Other Filters
| Parameter | Type | Description |
|-----------|------|-------------|
| `brand` | string | Filter by brand (comma-separated for multiple) |
| `category` | string | Filter by category (comma-separated for multiple) |
| `sub_category` | string | Filter by sub-category (comma-separated for multiple) |
| `product_type` | string | Filter by product type (comma-separated for multiple) |
| `model` | string | Filter by model (comma-separated for multiple) |
| `variant` | string | Filter by variant (comma-separated for multiple) |
| `make` | string | Filter by make (comma-separated for multiple) |
| `year_range` | string | Filter by year range (comma-separated for multiple) |
| `is_universal` | boolean | Filter universal products |
| `is_consumable` | boolean | Filter consumable products |
| `query` | string | Text search in product tags |
| `page` | number | Page number for pagination (default: 1) |
| `limit` | number | Items per page (default: 10) |

## Usage Examples

### 1. Get All Products (Any Status)
```bash
curl -X GET "http://localhost:3000/api/category/products/filter?status=all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Get Only Pending Products
```bash
curl -X GET "http://localhost:3000/api/category/products/filter?status=Pending" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Products with Multiple Statuses
```bash
curl -X GET "http://localhost:3000/api/category/products/filter?status=Pending,Approved" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Rejected Products with Pagination
```bash
curl -X GET "http://localhost:3000/api/category/products/filter?status=Rejected&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Live Products with Category Filter
```bash
curl -X GET "http://localhost:3000/api/category/products/filter?status=Live&category=Engine%20Parts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Default Behavior (No Status Parameter)
```bash
curl -X GET "http://localhost:3000/api/category/products/filter" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Note**: Returns only products with `live_status: "Approved"` or `live_status: "Live"` and `Qc_status: "Approved"`

## Response Format

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "product_name": "Product Name",
        "live_status": "Approved",
        "Qc_status": "Approved",
        "brand": { "_id": "brand_id", "brand_name": "Brand Name" },
        "category": { "_id": "category_id", "category_name": "Category Name" },
        "sub_category": { "_id": "subcategory_id", "subcategory_name": "Subcategory Name" },
        // ... other product fields
      }
    ],
    "pagination": {
      "totalItems": 150,
      "totalPages": 15,
      "currentPage": 1,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Products fetched successfully with pagination"
}
```

## Common Use Cases

### 1. Admin Dashboard - Pending Approvals
```javascript
// Get products that need approval
const pendingProducts = await axios.get('/api/category/products/filter?status=Pending');
```

### 2. Customer Catalog - Live Products Only
```javascript
// Get products available to customers
const liveProducts = await axios.get('/api/category/products/filter?status=Live');
```

### 3. Quality Control - Review Rejected Products
```javascript
// Get products that were rejected
const rejectedProducts = await axios.get('/api/category/products/filter?status=Rejected');
```

### 4. Inventory Management - All Products
```javascript
// Get all products regardless of status
const allProducts = await axios.get('/api/category/products/filter?status=all');
```

### 5. Approval Workflow - Multiple Statuses
```javascript
// Get products in approval workflow
const workflowProducts = await axios.get('/api/category/products/filter?status=Created,Pending');
```

## Error Handling

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid status parameter"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Testing

Use the provided test script to verify the functionality:

```bash
# Update the JWT token in the test file
node test-product-status-filtering.js
```

## Migration Notes

### Before (Old Behavior)
- Only returned products with `live_status: "Approved"` and `Qc_status: "Approved"`
- No way to filter by other statuses
- Limited flexibility for different user roles

### After (New Behavior)
- Default behavior remains the same (approved products only)
- Added `status` parameter for flexible filtering
- Support for multiple statuses via comma-separated values
- `status=all` returns products with any status
- Better support for different user roles and workflows

## Security Considerations

- **Authentication Required**: All requests must include a valid JWT token
- **Role-Based Access**: Consider implementing role-based access control for different statuses
- **Audit Logging**: All status-based queries are logged for audit purposes

## Performance Notes

- **Indexing**: Ensure proper indexes on `live_status` and `Qc_status` fields
- **Pagination**: Always use pagination for large datasets
- **Caching**: Consider caching frequently accessed status combinations

## Troubleshooting

### Issue: No products returned
- Check if products exist with the specified status
- Verify the status value is correct (case-sensitive)
- Ensure proper authentication

### Issue: Unexpected statuses in results
- Check if using `status=all` parameter
- Verify the filter logic in the query
- Review the product data in the database

### Issue: Performance problems
- Add database indexes on status fields
- Use pagination to limit result size
- Consider caching for frequently accessed data
