# Enhanced Intelligent Search - Search Type Detection

## Overview

The intelligent search has been enhanced to detect and return the type of search performed. The system now analyzes the query and determines whether it's searching for product names, SKU codes, manufacturer part names, brand names, category names, model names, or variant names, and returns this information in the response.

## New Response Fields

### **1. Search Type Field**
- **Field**: `searchType`
- **Type**: String
- **Description**: The detected type of search performed
- **Possible Values**: `product_name`, `sku_code`, `manufacturer_part_name`, `brand`, `category`, `model`, `variant`, `general`

### **2. Search Type Details Field**
- **Field**: `searchTypeDetails`
- **Type**: Object
- **Description**: Detailed information about the search type detection
- **Structure**:
  ```json
  {
    "field": "product_name",
    "matchType": "partial",
    "description": "Product name search",
    "matchCount": 15
  }
  ```

## Search Type Detection Logic

### **1. Exact Match Detection**
The system first checks for exact matches in priority order:

1. **SKU Code Exact Match**: `sku_code: query`
2. **Manufacturer Part Exact Match**: `manufacturer_part_name: query`

### **2. Partial Match Detection**
If no exact matches are found, the system counts partial matches:

1. **Product Name Matches**: `product_name: { $regex: query, $options: 'i' }`
2. **SKU Code Matches**: `sku_code: { $regex: query, $options: 'i' }`
3. **Manufacturer Part Matches**: `manufacturer_part_name: { $regex: query, $options: 'i' }`

### **3. Search Type Determination**
The system determines the primary search type based on:
- **Exact matches** take priority over partial matches
- **Match counts** determine the primary search type for partial matches
- **Highest match count** wins when multiple fields have matches

## API Response Format

### **Enhanced Response Structure**
```json
{
  "success": true,
  "message": "Intelligent search results for \"spark plug\"",
  "data": {
    "type": "brand",
    "query": "spark plug",
    "searchType": "product_name",
    "searchTypeDetails": {
      "field": "product_name",
      "matchType": "partial",
      "description": "Product name search",
      "matchCount": 15
    },
    "detectedPath": {
      "products": {
        "count": 15,
        "sample": [
          {
            "name": "Spark Plug NGK",
            "sku": "TOPF1000002",
            "manufacturer": "NGK001"
          }
        ]
      }
    },
    "results": [
      {
        "id": "brand_id",
        "name": "NGK",
        "code": "NGK001",
        "logo": "brand_logo_url",
        "productCount": 8,
        "nextStep": "model"
      }
    ],
    "total": 1,
    "hasMore": false,
    "suggestion": "Found 15 products matching \"spark plug\" (Product name search). Here are the brands that make these products. Select a brand to see models."
  }
}
```

## Search Type Examples

### **1. Product Name Search**
```bash
curl "http://localhost:5002/products/v1/intelligent-search?query=spark%20plug"
```

**Response**:
```json
{
  "searchType": "product_name",
  "searchTypeDetails": {
    "field": "product_name",
    "matchType": "partial",
    "description": "Product name search",
    "matchCount": 15
  },
  "suggestion": "Found 15 products matching \"spark plug\" (Product name search). Here are the brands that make these products."
}
```

### **2. SKU Code Search**
```bash
curl "http://localhost:5002/products/v1/intelligent-search?query=TOPF1000002"
```

**Response**:
```json
{
  "searchType": "sku_code",
  "searchTypeDetails": {
    "field": "sku_code",
    "matchType": "exact",
    "description": "Exact SKU code match"
  },
  "suggestion": "Found 1 products matching \"TOPF1000002\" (Exact SKU code match). Here are the brands that make these products."
}
```

### **3. Manufacturer Part Name Search**
```bash
curl "http://localhost:5002/products/v1/intelligent-search?query=M1310020"
```

**Response**:
```json
{
  "searchType": "manufacturer_part_name",
  "searchTypeDetails": {
    "field": "manufacturer_part_name",
    "matchType": "exact",
    "description": "Exact manufacturer part name match"
  },
  "suggestion": "Found 1 products matching \"M1310020\" (Exact manufacturer part name match). Here are the brands that make these products."
}
```

### **4. Brand Name Search**
```bash
curl "http://localhost:5002/products/v1/intelligent-search?query=honda"
```

**Response**:
```json
{
  "searchType": "brand",
  "searchTypeDetails": {
    "field": "brand_name",
    "matchType": "partial",
    "description": "Brand name search",
    "matchCount": 1
  },
  "suggestion": "Found 25 models for Honda (Brand name search). Select a model to see variants."
}
```

### **5. Category Name Search**
```bash
curl "http://localhost:5002/products/v1/intelligent-search?query=air%20filter"
```

**Response**:
```json
{
  "searchType": "category",
  "searchTypeDetails": {
    "field": "category_name",
    "matchType": "partial",
    "description": "Category name search",
    "matchCount": 3
  },
  "suggestion": "Found categories matching \"air filter\" (Category name search). Select a category to see brands."
}
```

### **6. Model Name Search**
```bash
curl "http://localhost:5002/products/v1/intelligent-search?query=apache%20180"
```

**Response**:
```json
{
  "searchType": "model",
  "searchTypeDetails": {
    "field": "model_name",
    "matchType": "partial",
    "description": "Model name search",
    "matchCount": 1
  },
  "suggestion": "Found categories for TVS Apache 180 (Model name search). Select a category to see variants."
}
```

### **7. Variant Name Search**
```bash
curl "http://localhost:5002/products/v1/intelligent-search?query=vdi"
```

**Response**:
```json
{
  "searchType": "variant",
  "searchTypeDetails": {
    "field": "variant_name",
    "matchType": "partial",
    "description": "Variant name search",
    "matchCount": 5
  },
  "suggestion": "Found variants matching \"vdi\" (Variant name search). Select a variant to see products."
}
```

## Search Type Detection Algorithm

### **1. Priority Order**
1. **Exact SKU Match** - Highest priority
2. **Exact Manufacturer Part Match** - Second priority
3. **Partial Matches** - Based on match counts

### **2. Partial Match Logic**
```javascript
// Count matches for each field
const productNameMatches = await Product.countDocuments({
  product_name: { $regex: query, $options: 'i' },
  live_status: { $in: ['Live', 'Approved', 'Created', 'Pending'] }
});

const skuMatches = await Product.countDocuments({
  sku_code: { $regex: query, $options: 'i' },
  live_status: { $in: ['Live', 'Approved', 'Created', 'Pending'] }
});

const partMatches = await Product.countDocuments({
  manufacturer_part_name: { $regex: query, $options: 'i' },
  live_status: { $in: ['Live', 'Approved', 'Created', 'Pending'] }
});

// Determine primary search type
if (productNameMatches > 0 && productNameMatches >= skuMatches && productNameMatches >= partMatches) {
  searchType = 'product_name';
} else if (skuMatches > 0 && skuMatches >= partMatches) {
  searchType = 'sku_code';
} else if (partMatches > 0) {
  searchType = 'manufacturer_part_name';
}
```

### **3. Search Type Details Structure**
```javascript
searchTypeDetails = {
  field: 'product_name',           // Database field name
  matchType: 'partial',            // 'exact' or 'partial'
  description: 'Product name search', // Human-readable description
  matchCount: 15                   // Number of matches (for partial searches)
};
```

## Benefits

### **1. Enhanced User Experience**
- **Clear Feedback**: Users know what type of search was performed
- **Better Understanding**: Users understand why certain results were returned
- **Improved Suggestions**: More contextual suggestions based on search type

### **2. Developer Benefits**
- **Debugging**: Easier to debug search behavior
- **Analytics**: Track what types of searches are most common
- **Optimization**: Optimize search based on detected patterns

### **3. System Intelligence**
- **Smart Detection**: Automatically detects search intent
- **Context Awareness**: Provides context about the search performed
- **Better Suggestions**: More relevant suggestions based on search type

## Testing

### **Test Script Usage**
```bash
# Run the comprehensive test script
node test-search-type-detection.js
```

### **Test Coverage**
1. ✅ **Product Name Search**: Tests detection of product name searches
2. ✅ **SKU Code Search**: Tests detection of SKU code searches
3. ✅ **Manufacturer Part Search**: Tests detection of manufacturer part searches
4. ✅ **Brand Name Search**: Tests detection of brand name searches
5. ✅ **Category Name Search**: Tests detection of category name searches
6. ✅ **Model Name Search**: Tests detection of model name searches
7. ✅ **Variant Name Search**: Tests detection of variant name searches

## Performance Considerations

### **Database Queries**
- **Efficient Counting**: Uses `countDocuments()` for fast match counting
- **Index Usage**: Leverages existing indexes for optimal performance
- **Query Optimization**: Minimal additional queries for detection

### **Caching Opportunities**
- **Search Type Caching**: Could cache search type detection results
- **Match Count Caching**: Could cache match counts for common queries

## Error Handling

### **Fallback Behavior**
- **Default Search Type**: Falls back to 'general' if no specific type detected
- **Graceful Degradation**: System continues to work even if detection fails
- **Error Logging**: Logs detection issues for debugging

## Migration Notes

### **Backward Compatibility**
- ✅ **Existing Fields**: All existing response fields remain unchanged
- ✅ **New Fields**: New fields are additive and optional
- ✅ **API Structure**: Response structure remains compatible

### **No Breaking Changes**
- Existing API clients will continue to work without modification
- New fields provide additional information without affecting existing functionality
- Response format remains the same with additional fields

## Conclusion

The enhanced search type detection provides valuable insights into user search behavior and improves the overall search experience. The system now intelligently detects what type of search was performed and provides this information in the response, making it easier for users to understand the results and for developers to optimize the search functionality.

The implementation is robust, performant, and maintains full backward compatibility while significantly enhancing the search experience with intelligent type detection and contextual information.
