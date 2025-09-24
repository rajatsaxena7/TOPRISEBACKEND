# Product Search Implementation

## Overview
Implemented comprehensive search functionality for the `getProductsByFiltersWithPagination` endpoint that allows searching across product names, manufacturer part names, and SKU codes.

## Search Features

### 1. Text Search Capabilities
The search functionality now supports:
- **Product Name Search**: Search within product names
- **Manufacturer Part Name Search**: Search within manufacturer part names  
- **SKU Code Search**: Search within SKU codes
- **Case Insensitive**: All searches are case insensitive
- **Partial Matching**: Uses regex pattern matching for flexible search

### 2. Combined Filtering
The search works seamlessly with existing filters:
- Status filtering (Approved, Live, Pending, etc.)
- Brand filtering
- Category filtering
- Product type filtering
- Model and variant filtering
- And all other existing filters

## Implementation Details

### Search Query Parameter
Use the `query` parameter to search for products:

```http
GET /api/products/get-all-products/pagination?query=search_term&page=1&limit=10
```

### Search Logic
The search implementation uses MongoDB's `$regex` operator with case-insensitive matching:

```javascript
// Search across multiple fields
searchConditions.push(
  { product_name: { $regex: searchTerm, $options: "i" } },
  { manufacturer_part_name: { $regex: searchTerm, $options: "i" } },
  { sku_code: { $regex: searchTerm, $options: "i" } }
);
```

### Filter Combination Logic
The system intelligently combines search and status filters:

```javascript
// When both search and status filters are present
if (statusConditions.length > 0 && searchConditions.length > 0) {
  filter.$and = [
    { $or: statusConditions },      // Status filter
    { $or: searchConditions }       // Search filter
  ];
}
```

## API Usage Examples

### 1. Basic Search
```http
GET /api/products/get-all-products/pagination?query=motorcycle
```
Searches for "motorcycle" in product names, manufacturer part names, and SKU codes.

### 2. Search with Pagination
```http
GET /api/products/get-all-products/pagination?query=brake&page=2&limit=10
```
Searches for "brake" with pagination (page 2, 10 items per page).

### 3. Search with Status Filter
```http
GET /api/products/get-all-products/pagination?query=oil&status=Approved
```
Searches for "oil" only in approved products.

### 4. Search with Brand Filter
```http
GET /api/products/get-all-products/pagination?query=filter&brand=brand_id_here
```
Searches for "filter" within a specific brand.

### 5. Search by SKU
```http
GET /api/products/get-all-products/pagination?query=TOPT
```
Searches for products with SKU codes containing "TOPT".

### 6. Multiple Status Filter
```http
GET /api/products/get-all-products/pagination?query=part&status=Approved,Live
```
Searches for "part" in both approved and live products.

### 7. Show All Statuses
```http
GET /api/products/get-all-products/pagination?query=engine&status=all
```
Searches for "engine" across all product statuses.

## Response Format

### Successful Search Response
```json
{
  "success": true,
  "message": "Products fetched successfully with pagination",
  "data": {
    "products": [
      {
        "_id": "product_id",
        "product_name": "Motorcycle Brake Pad",
        "manufacturer_part_name": "MBP001",
        "sku_code": "TOPT1000001",
        "brand": { "_id": "brand_id", "brand_name": "Brand Name" },
        "category": { "_id": "category_id", "category_name": "Category Name" },
        // ... other product fields
      }
    ],
    "pagination": {
      "totalItems": 25,
      "totalPages": 3,
      "currentPage": 1,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Performance Considerations

### Database Optimization
- Uses MongoDB's native regex search for efficient text matching
- Leverages existing indexes on product fields
- Applies filters at the database level rather than in memory

### Query Structure
- Combines multiple filter conditions efficiently
- Uses `$and` and `$or` operators appropriately
- Maintains proper pagination with accurate total counts

## Testing

A comprehensive test script `test-product-search.js` has been created to verify:
1. Search by product name
2. Search by manufacturer part name  
3. Search by SKU code
4. Search with brand filters
5. Search with status filters
6. Case insensitive search
7. No results handling
8. Pagination with search

### Running Tests
```bash
# Update the script with your API URL and token
node test-product-search.js
```

## Error Handling

### Invalid Search Terms
- Empty or whitespace-only queries are ignored
- Special regex characters are treated as literal characters
- No results return empty array with proper pagination metadata

### Database Errors
- Proper error logging for debugging
- Graceful error responses to clients
- Maintains API consistency

## Backward Compatibility

### Existing Functionality
- All existing filter parameters continue to work
- Default status filtering behavior is preserved
- Pagination functionality remains unchanged
- Response format is consistent with existing API

### New Features
- Search functionality is additive - doesn't break existing queries
- Optional parameter - existing calls without `query` work as before
- Maintains all existing filter combinations

## Usage Recommendations

### Search Best Practices
1. **Use specific terms**: More specific search terms yield better results
2. **Combine with filters**: Use brand/category filters to narrow down results
3. **Use pagination**: Always specify page and limit for large result sets
4. **Status filtering**: Use status filters to show only relevant products

### Performance Tips
1. **Limit results**: Use appropriate limit values (10-50 items per page)
2. **Use filters**: Combine search with other filters to reduce result set
3. **Index optimization**: Ensure database indexes on searchable fields

## Future Enhancements

### Potential Improvements
1. **Fuzzy Search**: Implement fuzzy matching for typos
2. **Search Ranking**: Rank results by relevance
3. **Search Suggestions**: Auto-complete functionality
4. **Advanced Search**: Support for complex search queries
5. **Search Analytics**: Track popular search terms

### Performance Optimizations
1. **Full-text Search**: Consider MongoDB Atlas Search for better performance
2. **Caching**: Implement search result caching
3. **Search Indexes**: Create dedicated search indexes
4. **Query Optimization**: Fine-tune regex patterns for better performance
