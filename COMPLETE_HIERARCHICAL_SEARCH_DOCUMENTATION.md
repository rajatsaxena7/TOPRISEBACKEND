# Complete Hierarchical Search with Products Documentation

## Overview
The Complete Hierarchical Search Endpoint provides a comprehensive 4-step search experience for products: Brand → Model → Variant → Products. This endpoint allows users to progressively narrow down their search and finally view actual products based on their selected filters.

## API Endpoint Details

### **Base URL**
```
GET /products/v1/hierarchical-search
```

### **Authentication**
- **Required**: No (authentication removed as per user request)
- **Authorization**: None

### **Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | Yes* | Search term (minimum 2 characters, optional for products) |
| `type` | String | Yes | Search type: `brand`, `model`, `variant`, or `products` |
| `brandId` | String | Yes* | Brand ID (required for model, variant, and product search) |
| `modelId` | String | No | Model ID (optional for variant and product search) |
| `variantId` | String | No | Variant ID (optional for product search) |
| `limit` | Number | No | Maximum results to return (default: 20) |
| `page` | Number | No | Page number for pagination (default: 1) |

*Required based on search type

## Complete Search Flow

### **Step 1: Brand Search**
Search for brands by name to get available brands.

**Request:**
```http
GET /products/v1/hierarchical-search?query=maruti&type=brand&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Brand search results",
  "data": {
    "type": "brand",
    "query": "maruti",
    "results": [
      {
        "id": "68dd09a1ea9be1fcfcf9c61f",
        "name": "Maruti Suzuki",
        "code": "MS001",
        "logo": "https://example.com/logo.jpg",
        "featured": true,
        "nextStep": "model"
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

### **Step 2: Model Search**
Search for models within a selected brand.

**Request:**
```http
GET /products/v1/hierarchical-search?query=swift&type=model&brandId=68dd09a1ea9be1fcfcf9c61f&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Model search results",
  "data": {
    "type": "model",
    "query": "swift",
    "brand": {
      "id": "68dd09a1ea9be1fcfcf9c61f",
      "name": "Maruti Suzuki",
      "code": "MS001"
    },
    "results": [
      {
        "id": "68dd198dea9be1fcfcf9ce19",
        "name": "Swift",
        "code": "SW001",
        "image": "https://example.com/swift.jpg",
        "status": "Active",
        "nextStep": "variant"
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

### **Step 3: Variant Search**
Search for variants within a selected model.

**Request:**
```http
GET /products/v1/hierarchical-search?query=vdi&type=variant&modelId=68dd198dea9be1fcfcf9ce19&limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Variant search results",
  "data": {
    "type": "variant",
    "query": "vdi",
    "brand": {
      "id": "68dd09a1ea9be1fcfcf9c61f",
      "name": "Maruti Suzuki",
      "code": "MS001"
    },
    "model": {
      "id": "68dd198dea9be1fcfcf9ce19",
      "name": "Swift",
      "code": "SW001"
    },
    "results": [
      {
        "id": "68dd1a8dea9be1fcfcf9cfce",
        "name": "Swift VDI",
        "code": "SWVDI001",
        "image": "https://example.com/swift-vdi.jpg",
        "status": "active",
        "description": "Diesel variant of Swift",
        "nextStep": "products"
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

### **Step 4: Product Search**
Search for actual products based on selected filters.

**Request:**
```http
GET /products/v1/hierarchical-search?type=products&brandId=68dd09a1ea9be1fcfcf9c61f&modelId=68dd198dea9be1fcfcf9ce19&variantId=68dd1a8dea9be1fcfcf9cfce&limit=10&page=1
```

**Response:**
```json
{
  "success": true,
  "message": "Products search results",
  "data": {
    "type": "products",
    "query": "all",
    "filters": {
      "brand": {
        "id": "68dd09a1ea9be1fcfcf9c61f",
        "name": "Maruti Suzuki",
        "code": "MS001"
      },
      "model": {
        "id": "68dd198dea9be1fcfcf9ce19",
        "name": "Swift",
        "code": "SW001"
      },
      "variant": {
        "id": "68dd1a8dea9be1fcfcf9cfce",
        "name": "Swift VDI",
        "code": "SWVDI001"
      }
    },
    "results": [
      {
        "id": "68e76957d84cf44daefd4887",
        "sku_code": "TOPF1000002",
        "product_name": "Spark Plug for Swift VDI",
        "manufacturer_part_name": "M1310020",
        "brand": {
          "id": "68dd09a1ea9be1fcfcf9c61f",
          "name": "Maruti Suzuki",
          "code": "MS001",
          "logo": "https://example.com/logo.jpg"
        },
        "category": {
          "id": "6867b9da1245e10b7e854227",
          "name": "Spark Plug",
          "code": "15"
        },
        "sub_category": {
          "id": "68dd1e60ea9be1fcfcf9d1ff",
          "name": "Achyutha Subcategory",
          "code": "SUB_02"
        },
        "model": {
          "id": "68dd198dea9be1fcfcf9ce19",
          "name": "Swift",
          "code": "SW001"
        },
        "variants": [
          {
            "id": "68dd1a8dea9be1fcfcf9cfce",
            "name": "Swift VDI",
            "code": "SWVDI001"
          }
        ],
        "year_ranges": [
          {
            "id": "6867d3732a65a860e6895fed",
            "name": "2015"
          }
        ],
        "pricing": {
          "mrp_with_gst": 150,
          "selling_price": 100,
          "gst_percentage": 18
        },
        "stock": {
          "no_of_stock": 4,
          "out_of_stock": false
        },
        "status": {
          "live_status": "Active",
          "qc_status": "Approved"
        },
        "product_type": "OE",
        "is_universal": false,
        "is_consumable": false,
        "images": [],
        "created_at": "2025-10-09T07:50:47.375Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPreviousPage": false
    },
    "total": 1,
    "hasMore": false
  }
}
```

## Product Search Features

### **Filtering Options**

#### **1. Brand Filter (Required)**
- **Parameter**: `brandId`
- **Description**: Filter products by specific brand
- **Example**: `brandId=68dd09a1ea9be1fcfcf9c61f`

#### **2. Model Filter (Optional)**
- **Parameter**: `modelId`
- **Description**: Filter products by specific model within the brand
- **Example**: `modelId=68dd198dea9be1fcfcf9ce19`

#### **3. Variant Filter (Optional)**
- **Parameter**: `variantId`
- **Description**: Filter products by specific variant within the model
- **Example**: `variantId=68dd1a8dea9be1fcfcf9cfce`

#### **4. Text Search (Optional)**
- **Parameter**: `query`
- **Description**: Search within product names, SKU codes, and manufacturer part names
- **Example**: `query=spark`

### **Pagination**
- **Page Parameter**: `page` (default: 1)
- **Limit Parameter**: `limit` (default: 20)
- **Response**: Includes pagination metadata

### **Product Information**
Each product result includes:
- **Basic Info**: ID, SKU, name, manufacturer part name
- **Brand Info**: Brand details with logo
- **Category Info**: Category and sub-category details
- **Model Info**: Model details
- **Variant Info**: Array of variant details
- **Year Ranges**: Array of year range details
- **Pricing**: MRP, selling price, GST percentage
- **Stock**: Stock quantity and availability status
- **Status**: Live status and QC status
- **Product Type**: OE, OEM, or AFTERMARKET
- **Flags**: Universal and consumable flags
- **Images**: Array of product images
- **Timestamps**: Creation date

## Usage Examples

### **Complete Search Flow**

#### **1. Search for "Maruti" brands**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=maruti&type=brand"
```

#### **2. Search for "Swift" models in Maruti Suzuki**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=swift&type=model&brandId=BRAND_ID_FROM_STEP_1"
```

#### **3. Search for "VDI" variants in Swift model**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=vdi&type=variant&modelId=MODEL_ID_FROM_STEP_2"
```

#### **4. Search for products with all filters**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?type=products&brandId=BRAND_ID&modelId=MODEL_ID&variantId=VARIANT_ID"
```

### **Product Search Variations**

#### **Search products by brand only**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?type=products&brandId=BRAND_ID"
```

#### **Search products by brand and model**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?type=products&brandId=BRAND_ID&modelId=MODEL_ID"
```

#### **Search products with text query**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=spark&type=products&brandId=BRAND_ID"
```

#### **Search products with pagination**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?type=products&brandId=BRAND_ID&limit=5&page=2"
```

## JavaScript Integration

### **Complete Search Flow**
```javascript
// Step 1: Search brands
async function searchBrands(query) {
  const response = await fetch(
    `${API_BASE_URL}/products/v1/hierarchical-search?query=${encodeURIComponent(query)}&type=brand`
  );
  return await response.json();
}

// Step 2: Search models
async function searchModels(query, brandId) {
  const response = await fetch(
    `${API_BASE_URL}/products/v1/hierarchical-search?query=${encodeURIComponent(query)}&type=model&brandId=${brandId}`
  );
  return await response.json();
}

// Step 3: Search variants
async function searchVariants(query, modelId) {
  const response = await fetch(
    `${API_BASE_URL}/products/v1/hierarchical-search?query=${encodeURIComponent(query)}&type=variant&modelId=${modelId}`
  );
  return await response.json();
}

// Step 4: Search products
async function searchProducts(brandId, modelId = null, variantId = null, query = '', page = 1, limit = 20) {
  let url = `${API_BASE_URL}/products/v1/hierarchical-search?type=products&brandId=${brandId}&page=${page}&limit=${limit}`;
  
  if (modelId) url += `&modelId=${modelId}`;
  if (variantId) url += `&variantId=${variantId}`;
  if (query) url += `&query=${encodeURIComponent(query)}`;
  
  const response = await fetch(url);
  return await response.json();
}
```

### **Progressive Search Implementation**
```javascript
class HierarchicalSearch {
  constructor() {
    this.selectedBrand = null;
    this.selectedModel = null;
    this.selectedVariant = null;
  }

  async searchBrands(query) {
    const result = await searchBrands(query);
    return result.data.results;
  }

  async searchModels(query, brandId) {
    const result = await searchModels(query, brandId);
    return result.data.results;
  }

  async searchVariants(query, modelId) {
    const result = await searchVariants(query, modelId);
    return result.data.results;
  }

  async searchProducts(query = '', page = 1) {
    if (!this.selectedBrand) throw new Error('Brand must be selected first');
    
    const result = await searchProducts(
      this.selectedBrand.id,
      this.selectedModel?.id,
      this.selectedVariant?.id,
      query,
      page
    );
    return result.data;
  }

  selectBrand(brand) {
    this.selectedBrand = brand;
    this.selectedModel = null;
    this.selectedVariant = null;
  }

  selectModel(model) {
    this.selectedModel = model;
    this.selectedVariant = null;
  }

  selectVariant(variant) {
    this.selectedVariant = variant;
  }
}
```

## Frontend Integration

### **Progressive Search Interface**
The complete hierarchical search is designed to work with a 4-step progressive interface:

1. **Step 1**: User searches for brands
2. **Step 2**: User selects a brand and searches for models
3. **Step 3**: User selects a model and searches for variants
4. **Step 4**: User selects a variant and views filtered products

### **Search Flow Example**
```
User Input: "maruti" → Brand Search
├── Results: ["Maruti Suzuki", "Maruti Udyog"]
└── User selects: "Maruti Suzuki"

User Input: "swift" → Model Search (with brandId)
├── Results: ["Swift", "Swift Dzire", "Swift Sport"]
└── User selects: "Swift"

User Input: "vdi" → Variant Search (with modelId)
├── Results: ["Swift VDI", "Swift VDI AMT"]
└── User selects: "Swift VDI"

User Action: "Search Products" → Product Search (with all filters)
├── Results: [Product 1, Product 2, Product 3...]
└── User views: Filtered products with pagination
```

## Error Handling

### **Common Error Scenarios**

#### **1. Missing Required Parameters**
```json
{
  "success": false,
  "message": "brandId is required for product search"
}
```

#### **2. Invalid Search Type**
```json
{
  "success": false,
  "message": "Invalid search type. Use: brand, model, variant, or products"
}
```

#### **3. Short Query**
```json
{
  "success": false,
  "message": "Query must be at least 2 characters long"
}
```

#### **4. Brand/Model Not Found**
```json
{
  "success": false,
  "message": "Brand not found"
}
```

## Performance Considerations

### **Database Optimization**
- **Indexes**: Ensure proper indexes on search fields
- **Pagination**: Use limit and page parameters
- **Selective Fields**: Only fetch required product fields
- **Population**: Efficient population of related documents

### **Search Optimization**
- **Case-insensitive**: All searches use regex with 'i' option
- **Partial matching**: Supports partial string matching
- **Filtering**: Progressive filtering reduces result sets
- **Caching**: Structure supports caching implementation

## Testing

### **Test Script**
Use the provided test script: `node test-complete-hierarchical-search.js`

### **Manual Testing Commands**
```bash
# Test complete flow
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=maruti&type=brand"
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=swift&type=model&brandId=BRAND_ID"
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=vdi&type=variant&modelId=MODEL_ID"
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?type=products&brandId=BRAND_ID&modelId=MODEL_ID&variantId=VARIANT_ID"
```

## Security Considerations

### **Input Validation**
- **Query Length**: Minimum 2 characters for text searches
- **Parameter Validation**: Required parameters checked
- **Type Validation**: Search type validation
- **ID Validation**: ObjectId format validation

### **Data Protection**
- **No Authentication**: Endpoint is publicly accessible
- **Input Sanitization**: Query parameters sanitized
- **Error Handling**: Secure error messages

## Best Practices

### **1. Progressive Search**
- Always start with brand search
- Use returned IDs for next steps
- Maintain search context throughout flow
- Provide clear navigation between steps

### **2. Product Display**
- Show relevant product information
- Implement pagination for large result sets
- Provide filtering options
- Display stock and pricing information

### **3. User Experience**
- Show loading states during search
- Implement debouncing for real-time search
- Provide clear error messages
- Maintain search history

### **4. Performance**
- Use appropriate limit values
- Implement pagination for products
- Consider caching for frequent searches
- Optimize database queries

## Summary

The Complete Hierarchical Search with Products provides:

✅ **4-Step Search Flow**: Brand → Model → Variant → Products
✅ **Progressive Filtering**: Each step builds on previous selection
✅ **Flexible Product Search**: Multiple filter combinations
✅ **Text Search**: Search within product names and SKUs
✅ **Pagination**: Handle large product result sets
✅ **Rich Product Data**: Comprehensive product information
✅ **Error Handling**: Proper validation and error messages
✅ **No Authentication**: Publicly accessible endpoint
✅ **Performance**: Optimized database queries
✅ **Frontend Ready**: Complete integration examples

This endpoint enables a complete product discovery experience that guides users from broad brand selection to specific product details in a natural, step-by-step process.
