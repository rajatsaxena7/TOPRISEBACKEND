# Smart Search with Category Filter Documentation

## Overview

The Smart Search endpoint has been enhanced to support category filtering, allowing users to search for products within specific categories. This provides more targeted and relevant search results by combining the existing smart search logic with category-based filtering.

## Enhanced Features

- ✅ **Category Filtering** - Filter results by category ID or name
- ✅ **Flexible Category Input** - Accept both category ID and category name
- ✅ **Case-Insensitive Category Search** - Category name matching is case-insensitive
- ✅ **Category Validation** - Validates category existence and active status
- ✅ **Enhanced Response** - Includes category information in search results
- ✅ **Backward Compatibility** - Maintains all existing functionality

## API Endpoint

### Base URL
```
GET /api/search/smart-search
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | Yes | Search query string |
| `category` | String | No | Category ID or category name |
| `type` | String | No | Product type filter |
| `sort_by` | String | No | Sort option (A-Z, Z-A, L-H, H-L) |
| `min_price` | Number | No | Minimum price filter |
| `max_price` | Number | No | Maximum price filter |
| `page` | Number | No | Page number (default: 1) |
| `limit` | Number | No | Results per page (default: 10) |

### Category Parameter Details

The `category` parameter accepts two formats:

1. **Category ID**: MongoDB ObjectId (24-character hex string)
   ```
   ?category=64a1b2c3d4e5f6789012345
   ```

2. **Category Name**: Case-insensitive category name
   ```
   ?category=Engine Parts
   ?category=engine parts
   ?category=ENGINE PARTS
   ```

## Request Examples

### 1. Basic Search with Category ID
```bash
GET /api/search/smart-search?query=Honda Civic&category=64a1b2c3d4e5f6789012345
```

### 2. Search with Category Name
```bash
GET /api/search/smart-search?query=Honda Civic&category=Engine Parts
```

### 3. Complete Search with All Filters
```bash
GET /api/search/smart-search?query=Honda Civic&category=Engine Parts&type=64a1b2c3d4e5f6789012346&min_price=1000&max_price=50000&sort_by=L-H&page=1&limit=10
```

### 4. Category-Only Search (No Brand Match)
```bash
GET /api/search/smart-search?query=xyz123&category=Engine Parts
```

## Response Format

### Success Response Structure
```json
{
  "success": true,
  "searchQuery": "Honda Civic",
  "is_brand": false,
  "is_model": false,
  "is_variant": false,
  "is_product": true,
  "results": {
    "brand": {
      "_id": "64a1b2c3d4e5f6789012347",
      "brand_name": "Honda",
      "brand_logo": "https://example.com/logo.jpg"
    },
    "model": {
      "_id": "64a1b2c3d4e5f6789012348",
      "model_name": "Civic",
      "brand_ref": "64a1b2c3d4e5f6789012347"
    },
    "variant": {
      "_id": "64a1b2c3d4e5f6789012349",
      "variant_name": "VX",
      "model": "64a1b2c3d4e5f6789012348"
    },
    "category": {
      "_id": "64a1b2c3d4e5f6789012345",
      "category_name": "Engine Parts",
      "category_code": "ENG001",
      "category_image": "https://example.com/category.jpg"
    },
    "products": [
      {
        "_id": "64a1b2c3d4e5f678901234a",
        "product_name": "Honda Civic Engine Oil Filter",
        "sku_code": "HCE001",
        "selling_price": 1500,
        "live_status": "Approved",
        "category": "64a1b2c3d4e5f6789012345"
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalitems": 50,
    "hasNextPage": true,
    "hasPrevPage": false,
    "limit": 10,
    "nextPage": 2,
    "prevPage": null
  }
}
```

### Category-Only Search Response (No Brand Match)
```json
{
  "success": true,
  "searchQuery": "xyz123",
  "is_brand": true,
  "is_model": false,
  "is_variant": false,
  "is_product": false,
  "results": {
    "category": {
      "_id": "64a1b2c3d4e5f6789012345",
      "category_name": "Engine Parts",
      "category_code": "ENG001"
    },
    "brands": [
      {
        "_id": "64a1b2c3d4e5f6789012347",
        "brand_name": "Honda",
        "status": "active"
      }
    ],
    "message": "No brand match found for the query, but category filter is applied"
  }
}
```

## Error Responses

### 400 Bad Request - Missing Query
```json
{
  "success": false,
  "error": "Search query is required",
  "is_brand": false,
  "is_model": false,
  "is_variant": false,
  "is_product": false
}
```

### 404 Not Found - Invalid Category
```json
{
  "success": false,
  "error": "Category not found",
  "is_brand": false,
  "is_model": false,
  "is_variant": false,
  "is_product": false
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "is_brand": false,
  "is_model": false,
  "is_variant": false,
  "is_product": false
}
```

## Search Logic Flow

1. **Query Processing**: Parse and split search query into words
2. **Category Validation**: If category parameter provided, validate category exists and is active
3. **Brand Matching**: Find matching brands using string similarity
4. **Model Matching**: Find matching models within selected brand
5. **Variant Matching**: Find matching variants within selected model
6. **Product Filtering**: Apply all filters including category filter
7. **Product Matching**: Match products using search tags and content
8. **Pagination**: Apply pagination to final results
9. **Response**: Return structured response with all matched data

## Category Filtering Logic

### Category ID Validation
```javascript
// MongoDB ObjectId pattern matching
if (category.match(/^[0-9a-fA-F]{24}$/)) {
  selectedCategory = await Category.findById(category);
}
```

### Category Name Validation
```javascript
// Case-insensitive regex search
selectedCategory = await Category.findOne({
  category_name: { $regex: new RegExp(category, 'i') },
  category_Status: "Active"
});
```

### Product Filter Application
```javascript
let productFilter = {
  brand: selectedBrand._id,
  model: selectedModel._id,
  variant: { $in: [selectedVariant._id] },
  live_status: "Approved"
};

// Add category filter if category is specified
if (selectedCategory) {
  productFilter.category = selectedCategory._id;
}
```

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function searchWithCategory(query, categoryId) {
  try {
    const response = await axios.get('/api/search/smart-search', {
      params: {
        query: query,
        category: categoryId,
        page: 1,
        limit: 10,
        sort_by: 'L-H'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Search error:', error.response?.data || error.message);
  }
}

// Usage
const results = await searchWithCategory('Honda Civic', '64a1b2c3d4e5f6789012345');
```

### cURL
```bash
# Search with category ID
curl -X GET "http://localhost:5001/api/search/smart-search?query=Honda%20Civic&category=64a1b2c3d4e5f6789012345" \
  -H "Content-Type: application/json"

# Search with category name
curl -X GET "http://localhost:5001/api/search/smart-search?query=Honda%20Civic&category=Engine%20Parts" \
  -H "Content-Type: application/json"
```

### React/Frontend
```javascript
const searchProducts = async (query, category) => {
  try {
    const params = new URLSearchParams({
      query: query,
      page: 1,
      limit: 20
    });
    
    if (category) {
      params.append('category', category);
    }
    
    const response = await fetch(`/api/search/smart-search?${params}`);
    const data = await response.json();
    
    if (data.success) {
      return data.results.products || [];
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
};
```

## Performance Considerations

- **Category Indexing**: Ensure proper database indexes on category fields
- **Query Optimization**: Category filtering is applied early in the search process
- **Caching**: Consider implementing Redis caching for frequently searched categories
- **Pagination**: Always use pagination for large result sets

## Testing

A comprehensive test suite is provided in `test-smart-search-with-category.js`:

```bash
# Run tests
node test-smart-search-with-category.js
```

The test suite covers:
- Basic search without category
- Search with category ID
- Search with category name
- Search with all filters
- Error handling for invalid categories
- Category-only searches
- Performance testing

## Migration Notes

### Backward Compatibility
- All existing functionality remains unchanged
- Category parameter is optional
- Existing API calls will continue to work without modification

### Database Requirements
- Category model must be available
- Categories must have `category_Status: "Active"` for filtering
- Proper indexes on category fields recommended

## Future Enhancements

- [ ] **Multiple Category Support** - Allow filtering by multiple categories
- [ ] **Category Hierarchy** - Support parent-child category relationships
- [ ] **Category Suggestions** - Auto-suggest categories based on search query
- [ ] **Category Analytics** - Track category search performance
- [ ] **Category Facets** - Return available categories for further filtering

## Support

For issues or questions regarding the enhanced smart search functionality, please refer to the main project documentation or contact the development team.
