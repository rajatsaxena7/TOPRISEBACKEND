# Enhanced Product Filtering - Product Name, SKU Code, and Part Name Filters

## Overview

The `getProductsByFilters` endpoint has been enhanced to include three new filtering parameters for more precise product searches: `product_name`, `sku_code`, and `part_name`. These filters use regex-based partial matching with case-insensitive search.

## New Filter Parameters

### **1. Product Name Filter**
- **Parameter**: `product_name`
- **Type**: String
- **Behavior**: Partial match, case-insensitive
- **Database Field**: `product_name`
- **Example**: `?product_name=spark` will find products containing "spark" in their name

### **2. SKU Code Filter**
- **Parameter**: `sku_code`
- **Type**: String
- **Behavior**: Partial match, case-insensitive
- **Database Field**: `sku_code`
- **Example**: `?sku_code=TOP` will find products with SKU codes containing "TOP"

### **3. Manufacturer Part Name Filter**
- **Parameter**: `part_name`
- **Type**: String
- **Behavior**: Partial match, case-insensitive
- **Database Field**: `manufacturer_part_name`
- **Example**: `?part_name=M13` will find products with manufacturer part names containing "M13"

## API Endpoint

### **GET** `/products/v1/filters`

#### **New Parameters**
```
product_name: string (optional) - Filter by product name
sku_code: string (optional) - Filter by SKU code
part_name: string (optional) - Filter by manufacturer part name
```

#### **Existing Parameters** (unchanged)
```
brand: string (optional) - Filter by brand IDs (comma-separated)
category: string (optional) - Filter by category IDs (comma-separated)
sub_category: string (optional) - Filter by sub-category IDs (comma-separated)
product_type: string (optional) - Filter by product type (comma-separated)
model: string (optional) - Filter by model IDs (comma-separated)
variant: string (optional) - Filter by variant IDs (comma-separated)
make: string (optional) - Filter by make (comma-separated)
year_range: string (optional) - Filter by year range IDs (comma-separated)
is_universal: boolean (optional) - Filter by universal products
is_consumable: boolean (optional) - Filter by consumable products
query: string (optional) - Text search in search tags
sort_by: string (optional) - Sort options: "A-Z", "Z-A", "L-H", "H-L"
min_price: number (optional) - Minimum price filter
max_price: number (optional) - Maximum price filter
page: number (optional) - Page number (0-based, default: 0)
limit: number (optional) - Items per page (default: 10)
```

## Implementation Details

### **Filter Logic**
```javascript
// Text-based filters with regex for partial matching
if (product_name) {
  filter.product_name = { $regex: product_name, $options: 'i' };
}
if (sku_code) {
  filter.sku_code = { $regex: sku_code, $options: 'i' };
}
if (part_name) {
  filter.manufacturer_part_name = { $regex: part_name, $options: 'i' };
}
```

### **Key Features**
- **Case Insensitive**: Uses `$options: 'i'` for case-insensitive matching
- **Partial Matching**: Uses regex for substring matching
- **Combined Filtering**: Can be used together with existing filters
- **Performance**: Applied at database level for optimal performance

## Usage Examples

### **1. Filter by Product Name**
```bash
# Find products with "spark" in the name
curl "http://localhost:5002/products/v1/filters?product_name=spark"

# Find products with "oil filter" in the name
curl "http://localhost:5002/products/v1/filters?product_name=oil%20filter"
```

### **2. Filter by SKU Code**
```bash
# Find products with SKU containing "TOP"
curl "http://localhost:5002/products/v1/filters?sku_code=TOP"

# Find products with SKU containing "TEST"
curl "http://localhost:5002/products/v1/filters?sku_code=TEST"
```

### **3. Filter by Manufacturer Part Name**
```bash
# Find products with manufacturer part containing "M13"
curl "http://localhost:5002/products/v1/filters?part_name=M13"

# Find products with manufacturer part containing "NGK"
curl "http://localhost:5002/products/v1/filters?part_name=NGK"
```

### **4. Combined Filtering**
```bash
# Find TVS products with "oil" in the name
curl "http://localhost:5002/products/v1/filters?product_name=oil&brand=TVS"

# Find products with "spark" in name and SKU containing "TOP"
curl "http://localhost:5002/products/v1/filters?product_name=spark&sku_code=TOP"

# Find products with manufacturer part "M13" and price range
curl "http://localhost:5002/products/v1/filters?part_name=M13&min_price=100&max_price=500"
```

### **5. Pagination with Filters**
```bash
# Get first page of products with "filter" in name
curl "http://localhost:5002/products/v1/filters?product_name=filter&page=0&limit=5"

# Get second page of products with SKU containing "TOP"
curl "http://localhost:5002/products/v1/filters?sku_code=TOP&page=1&limit=10"
```

## Response Format

### **Success Response**
```json
{
  "success": true,
  "message": "Products fetched successfully",
  "data": {
    "products": [
      {
        "_id": "product_id",
        "product_name": "Spark Plug NGK",
        "sku_code": "TOPF1000002",
        "manufacturer_part_name": "M1310020",
        "selling_price": 150.00,
        "brand": {
          "_id": "brand_id",
          "brand_name": "NGK"
        },
        "category": {
          "_id": "category_id",
          "category_name": "Spark Plug"
        },
        "model": {
          "_id": "model_id",
          "model_name": "Swift"
        },
        "variant": {
          "_id": "variant_id",
          "variant_name": "VDI"
        }
      }
    ],
    "pagination": {
      "currentPage": 0,
      "totalPages": 5,
      "totalItems": 25,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10,
      "nextPage": 1,
      "prevPage": null
    }
  }
}
```

## Testing

### **Test Script Usage**
```bash
# Run the comprehensive test script
node test-enhanced-product-filtering.js
```

### **Test Coverage**
1. ✅ **Product Name Filtering**: Tests partial matching
2. ✅ **SKU Code Filtering**: Tests partial matching
3. ✅ **Manufacturer Part Name Filtering**: Tests partial matching
4. ✅ **Combined Filtering**: Tests multiple filters together
5. ✅ **Case Insensitive Filtering**: Tests uppercase/lowercase
6. ✅ **Pagination with Filters**: Tests pagination functionality

## Benefits

### **1. Enhanced Search Capabilities**
- **Precise Filtering**: Filter by specific product attributes
- **Partial Matching**: Find products with partial text matches
- **Case Insensitive**: Search works regardless of case

### **2. Improved User Experience**
- **Flexible Search**: Users can search by any product attribute
- **Combined Filters**: Multiple filters can be applied simultaneously
- **Fast Results**: Database-level filtering for optimal performance

### **3. Developer Friendly**
- **Consistent API**: Follows existing filter parameter patterns
- **Backward Compatible**: Existing filters continue to work
- **Well Documented**: Clear parameter descriptions and examples

## Performance Considerations

### **Database Optimization**
- **Index Usage**: Ensure proper indexes on filtered fields
- **Regex Performance**: Regex queries are optimized for partial matching
- **Combined Filters**: Multiple filters are applied efficiently

### **Recommended Indexes**
```javascript
// Recommended indexes for optimal performance
db.products.createIndex({ "product_name": "text" });
db.products.createIndex({ "sku_code": 1 });
db.products.createIndex({ "manufacturer_part_name": 1 });
db.products.createIndex({ "live_status": 1, "Qc_status": 1 });
```

## Error Handling

### **Common Error Scenarios**
- **Invalid Parameters**: Malformed filter values
- **Database Errors**: Connection or query issues
- **Empty Results**: No products match the filters

### **Error Response Format**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Migration Notes

### **Backward Compatibility**
- ✅ **Existing Filters**: All existing filter parameters continue to work
- ✅ **API Structure**: Response format remains unchanged
- ✅ **Authentication**: Same authentication requirements

### **No Breaking Changes**
- Existing API calls will continue to work without modification
- New parameters are optional and don't affect existing functionality
- Response structure remains the same

## Conclusion

The enhanced product filtering provides powerful new capabilities for searching products by name, SKU code, and manufacturer part name. The implementation is robust, performant, and maintains full backward compatibility while significantly improving the search experience for users and developers.
