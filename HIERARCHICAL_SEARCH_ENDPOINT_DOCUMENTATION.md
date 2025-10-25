# Hierarchical Search Endpoint Documentation

## Overview
The Hierarchical Search Endpoint provides a step-by-step search experience for products, allowing users to search by Brand → Model → Variant in a structured flow. This endpoint supports progressive search where each step builds upon the previous selection.

## API Endpoint Details

### **Base URL**
```
GET /products/v1/hierarchical-search
```

### **Authentication**
- **Required**: Yes (Bearer token)
- **Authorization**: Super-admin, Inventory-Admin, Inventory-Staff, User

### **Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | Yes | Search term (minimum 2 characters) |
| `type` | String | No | Search type: `brand`, `model`, or `variant` (default: `brand`) |
| `brandId` | String | Yes* | Brand ID (required for model search) |
| `modelId` | String | Yes* | Model ID (required for variant search) |
| `limit` | Number | No | Maximum results to return (default: 20) |

*Required based on search type

## Search Flow

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

## Implementation Details

### **Backend Implementation**

#### **Controller Function**
```javascript
exports.hierarchicalSearch = async (req, res) => {
  try {
    const { 
      query, 
      type = 'brand', 
      brandId, 
      modelId, 
      limit = 20 
    } = req.query;

    if (!query || query.trim().length < 2) {
      return sendError(res, "Query must be at least 2 characters long", 400);
    }

    const searchQuery = query.trim();
    const limitNumber = parseInt(limit) || 20;

    let result = {};

    switch (type.toLowerCase()) {
      case 'brand':
        result = await searchBrands(searchQuery, limitNumber);
        break;
      
      case 'model':
        if (!brandId) {
          return sendError(res, "brandId is required for model search", 400);
        }
        result = await searchModels(searchQuery, brandId, limitNumber);
        break;
      
      case 'variant':
        if (!modelId) {
          return sendError(res, "modelId is required for variant search", 400);
        }
        result = await searchVariants(searchQuery, modelId, limitNumber);
        break;
      
      default:
        return sendError(res, "Invalid search type. Use: brand, model, or variant", 400);
    }

    logger.info(`✅ Hierarchical search completed: ${type} search for "${searchQuery}"`);
    sendSuccess(res, result, `${type.charAt(0).toUpperCase() + type.slice(1)} search results`);

  } catch (error) {
    logger.error(`❌ Hierarchical search error: ${error.message}`);
    sendError(res, "Search failed", 500);
  }
};
```

#### **Brand Search Function**
```javascript
async function searchBrands(query, limit) {
  const Brand = require('../models/brand');
  
  const brands = await Brand.find({
    brand_name: { $regex: query, $options: 'i' },
    status: 'active'
  })
  .select('_id brand_name brand_code brand_logo featured_brand')
  .sort({ featured_brand: -1, brand_name: 1 })
  .limit(limit);

  return {
    type: 'brand',
    query: query,
    results: brands.map(brand => ({
      id: brand._id,
      name: brand.brand_name,
      code: brand.brand_code,
      logo: brand.brand_logo,
      featured: brand.featured_brand,
      nextStep: 'model'
    })),
    total: brands.length,
    hasMore: brands.length === limit
  };
}
```

#### **Model Search Function**
```javascript
async function searchModels(query, brandId, limit) {
  const Model = require('../models/model');
  const Brand = require('../models/brand');
  
  // First verify the brand exists
  const brand = await Brand.findById(brandId);
  if (!brand) {
    throw new Error('Brand not found');
  }

  const models = await Model.find({
    model_name: { $regex: query, $options: 'i' },
    brand_ref: brandId,
    status: { $in: ['Active', 'Created'] }
  })
  .select('_id model_name model_code model_image status')
  .sort({ model_name: 1 })
  .limit(limit);

  return {
    type: 'model',
    query: query,
    brand: {
      id: brand._id,
      name: brand.brand_name,
      code: brand.brand_code
    },
    results: models.map(model => ({
      id: model._id,
      name: model.model_name,
      code: model.model_code,
      image: model.model_image,
      status: model.status,
      nextStep: 'variant'
    })),
    total: models.length,
    hasMore: models.length === limit
  };
}
```

#### **Variant Search Function**
```javascript
async function searchVariants(query, modelId, limit) {
  const Variant = require('../models/variant');
  const Model = require('../models/model');
  
  // First verify the model exists
  const model = await Model.findById(modelId).populate('brand_ref', 'brand_name brand_code');
  if (!model) {
    throw new Error('Model not found');
  }

  const variants = await Variant.find({
    variant_name: { $regex: query, $options: 'i' },
    model: modelId,
    variant_status: 'active'
  })
  .select('_id variant_name variant_code variant_image variant_status variant_Description')
  .sort({ variant_name: 1 })
  .limit(limit);

  return {
    type: 'variant',
    query: query,
    brand: {
      id: model.brand_ref._id,
      name: model.brand_ref.brand_name,
      code: model.brand_ref.brand_code
    },
    model: {
      id: model._id,
      name: model.model_name,
      code: model.model_code
    },
    results: variants.map(variant => ({
      id: variant._id,
      name: variant.variant_name,
      code: variant.variant_code,
      image: variant.variant_image,
      status: variant.variant_status,
      description: variant.variant_Description,
      nextStep: 'products'
    })),
    total: variants.length,
    hasMore: variants.length === limit
  };
}
```

### **Route Configuration**
```javascript
router.get(
  "/hierarchical-search",
  optionalAuth,
  ProductAuditLogger.createMiddleware(
    "HIERARCHICAL_SEARCH_ACCESSED",
    "Product",
    "SEARCH"
  ),
  authenticate,
  authorizeRoles("Super-admin", "Inventory-Admin", "Inventory-Staff", "User"),
  productController.hierarchicalSearch
);
```

## Error Handling

### **Common Error Scenarios**

#### **1. Invalid Search Type**
```json
{
  "success": false,
  "message": "Invalid search type. Use: brand, model, or variant"
}
```

#### **2. Missing Required Parameters**
```json
{
  "success": false,
  "message": "brandId is required for model search"
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

#### **5. Authentication Error**
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

## Usage Examples

### **Complete Search Flow**

#### **1. Search for "Maruti" brands**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=maruti&type=brand" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"
```

#### **2. Search for "Swift" models in Maruti Suzuki**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=swift&type=model&brandId=68dd09a1ea9be1fcfcf9c61f" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"
```

#### **3. Search for "VDI" variants in Swift model**
```bash
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=vdi&type=variant&modelId=68dd198dea9be1fcfcf9ce19" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"
```

### **JavaScript Integration**
```javascript
// Search brands
async function searchBrands(query) {
  const response = await fetch(
    `${API_BASE_URL}/products/v1/hierarchical-search?query=${encodeURIComponent(query)}&type=brand`,
    {
      headers: {
        'Authorization': 'Bearer your-token',
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
}

// Search models
async function searchModels(query, brandId) {
  const response = await fetch(
    `${API_BASE_URL}/products/v1/hierarchical-search?query=${encodeURIComponent(query)}&type=model&brandId=${brandId}`,
    {
      headers: {
        'Authorization': 'Bearer your-token',
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
}

// Search variants
async function searchVariants(query, modelId) {
  const response = await fetch(
    `${API_BASE_URL}/products/v1/hierarchical-search?query=${encodeURIComponent(query)}&type=variant&modelId=${modelId}`,
    {
      headers: {
        'Authorization': 'Bearer your-token',
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
}
```

## Frontend Integration

### **Progressive Search Interface**
The hierarchical search is designed to work with a progressive search interface where:

1. **Step 1**: User searches for brands
2. **Step 2**: User selects a brand and searches for models
3. **Step 3**: User selects a model and searches for variants

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
```

## Performance Considerations

### **Database Optimization**
- **Indexes**: Ensure proper indexes on search fields
- **Pagination**: Use limit parameter to control result size
- **Caching**: Consider caching frequently searched terms

### **Search Optimization**
- **Case-insensitive**: All searches use regex with 'i' option
- **Partial matching**: Supports partial string matching
- **Sorting**: Results sorted by relevance (featured brands first)

## Testing

### **Test Script**
Use the provided test script: `node test-hierarchical-search-endpoint.js`

### **Manual Testing Commands**
```bash
# Test brand search
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=maruti&type=brand" \
  -H "Authorization: Bearer your-token"

# Test model search
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=swift&type=model&brandId=brand-id" \
  -H "Authorization: Bearer your-token"

# Test variant search
curl -X GET "http://localhost:5002/products/v1/hierarchical-search?query=vdi&type=variant&modelId=model-id" \
  -H "Authorization: Bearer your-token"
```

## Security Considerations

### **Authentication & Authorization**
- **JWT Token Required**: All requests must include valid authentication
- **Role-Based Access**: Different roles can access the search
- **Audit Logging**: All search activities are logged

### **Input Validation**
- **Query Length**: Minimum 2 characters required
- **Parameter Validation**: Required parameters checked
- **SQL Injection Protection**: Uses parameterized queries

## Best Practices

### **1. Progressive Search**
- Always start with brand search
- Use returned IDs for next steps
- Maintain search context throughout flow

### **2. Error Handling**
- Handle network errors gracefully
- Provide meaningful error messages
- Implement retry logic for failed requests

### **3. User Experience**
- Show loading states during search
- Implement debouncing for real-time search
- Provide clear navigation between steps

### **4. Performance**
- Use appropriate limit values
- Implement caching for frequent searches
- Consider pagination for large result sets

## Summary

The Hierarchical Search Endpoint provides:

✅ **Step-by-step Search**: Brand → Model → Variant flow
✅ **Progressive Filtering**: Each step builds on previous selection
✅ **Flexible Querying**: Support for partial string matching
✅ **Comprehensive Results**: Rich data with next step guidance
✅ **Error Handling**: Proper validation and error messages
✅ **Authentication**: Secure access with role-based authorization
✅ **Audit Logging**: Complete activity tracking
✅ **Performance**: Optimized database queries with pagination

This endpoint enables a smooth, intuitive search experience that guides users through the product discovery process step by step.
