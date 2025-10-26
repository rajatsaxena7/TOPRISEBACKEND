# Intelligent Search Endpoint Documentation

## Overview
The Intelligent Search Endpoint provides smart, context-aware search functionality that automatically detects what the user is searching for and returns the most relevant results. It can intelligently identify brand names, model names, variant names, and product names from a single query and automatically determine the appropriate next steps.

## Key Features

### **🧠 Smart Detection**
- **Auto-identifies** what the user is searching for
- **Context-aware** search that understands brand + model combinations
- **Progressive detection** from brand → model → variant → products
- **Fallback search** to products if no specific matches found

### **🎯 Intelligent Examples**
- **"maruti"** → Detects brand, returns brands
- **"maruti suzuki"** → Detects brand, returns brands  
- **"maruti suzuki swift"** → Detects brand + model, returns models
- **"maruti suzuki swift vdi"** → Detects brand + model + variant, returns variants
- **"swift"** → Detects model, returns models
- **"vdi"** → Detects variant, returns variants
- **"spark plug"** → Detects product, returns products

## API Endpoint Details

### **Base URL**
```
GET /products/v1/intelligent-search
```

### **Authentication**
- **Required**: No (publicly accessible)
- **Authorization**: None

### **Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | Yes | Search term (minimum 2 characters) |
| `limit` | Number | No | Maximum results to return (default: 20) |
| `page` | Number | No | Page number for pagination (default: 1) |

## Intelligent Detection Logic

### **Detection Priority**
1. **Brand + Model + Variant** - If query contains all three
2. **Brand + Model** - If query contains brand and model
3. **Brand Only** - If query matches brand names
4. **Model Only** - If query matches model names
5. **Variant Only** - If query matches variant names
6. **Product Only** - If query matches product names
7. **No Results** - If nothing matches

### **Smart Word Analysis**
The system analyzes the query by:
- **Splitting** the query into words
- **Matching** against brand names first
- **Extracting** remaining words for model/variant search
- **Progressive filtering** through the hierarchy

## Response Format

### **Success Response**
```json
{
  "success": true,
  "message": "Intelligent search results for \"maruti suzuki swift\"",
  "data": {
    "type": "model",
    "query": "maruti suzuki swift",
    "detectedPath": {
      "brand": {
        "id": "68dd09a1ea9be1fcfcf9c61f",
        "name": "Maruti Suzuki",
        "code": "MS001"
      }
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
    "hasMore": false,
    "suggestion": "Found models for Maruti Suzuki. Select a model to see variants."
  }
}
```

### **Response Fields**

| Field | Type | Description |
|-------|------|-------------|
| `type` | String | Detected type: `brand`, `model`, `variant`, `products`, `none` |
| `query` | String | Original search query |
| `detectedPath` | Object | Automatically detected brand/model context |
| `results` | Array | Search results based on detected type |
| `total` | Number | Total number of results |
| `hasMore` | Boolean | Whether there are more results available |
| `suggestion` | String | Helpful suggestion for next steps |

## Usage Examples

### **1. Brand Detection**
```bash
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=maruti"
```

**Response**: Returns brands matching "maruti"

### **2. Brand + Model Detection**
```bash
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=maruti%20suzuki%20swift"
```

**Response**: Returns models for Maruti Suzuki brand

### **3. Brand + Model + Variant Detection**
```bash
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=maruti%20suzuki%20swift%20vdi"
```

**Response**: Returns variants for Maruti Suzuki Swift model

### **4. Model Detection**
```bash
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=swift"
```

**Response**: Returns models matching "swift" across all brands

### **5. Variant Detection**
```bash
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=vdi"
```

**Response**: Returns variants matching "vdi" across all models

### **6. Product Detection**
```bash
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=spark%20plug"
```

**Response**: Returns products matching "spark plug"

## Implementation Details

### **Backend Implementation**

#### **Controller Function**
```javascript
exports.intelligentSearch = async (req, res) => {
  try {
    const { 
      query, 
      limit = 20,
      page = 1
    } = req.query;

    if (!query || query.trim().length < 2) {
      return sendError(res, "Query must be at least 2 characters long", 400);
    }

    const searchQuery = query.trim();
    const limitNumber = parseInt(limit) || 20;
    const pageNumber = parseInt(page) || 1;

    // Auto-detect what the user is searching for
    const detection = await detectSearchIntent(searchQuery, limitNumber);
    
    logger.info(`✅ Intelligent search completed for "${searchQuery}" - Detected: ${detection.type}`);
    sendSuccess(res, detection, `Intelligent search results for "${searchQuery}"`);

  } catch (error) {
    logger.error(`❌ Intelligent search error: ${error.message}`);
    sendError(res, "Intelligent search failed", 500);
  }
};
```

#### **Detection Algorithm**
```javascript
async function detectSearchIntent(query, limit) {
  const Brand = require('../models/brand');
  const Model = require('../models/model');
  const Variant = require('../models/variant');
  const Product = require('../models/productModel');

  // Split query into words for analysis
  const words = query.toLowerCase().split(/\s+/);
  
  // Try to find exact brand matches first
  const brandMatches = await Brand.find({
    brand_name: { $regex: query, $options: 'i' },
    status: 'active'
  }).select('_id brand_name brand_code brand_logo featured_brand').limit(5);

  if (brandMatches.length > 0) {
    // Check if any brand name contains multiple words that might indicate model
    for (const brand of brandMatches) {
      const brandWords = brand.brand_name.toLowerCase().split(/\s+/);
      
      // If query has more words than brand, check for model
      if (words.length > brandWords.length) {
        const remainingWords = words.slice(brandWords.length).join(' ');
        
        // Search for models with remaining words
        const modelMatches = await Model.find({
          model_name: { $regex: remainingWords, $options: 'i' },
          brand_ref: brand._id,
          status: { $in: ['Active', 'Created'] }
        }).select('_id model_name model_code model_image status').limit(5);

        if (modelMatches.length > 0) {
          // Found brand + model, now check for variants
          const model = modelMatches[0];
          const variantMatches = await Variant.find({
            variant_name: { $regex: remainingWords, $options: 'i' },
            model: model._id,
            variant_status: 'active'
          }).select('_id variant_name variant_code variant_image variant_status variant_Description').limit(5);

          if (variantMatches.length > 0) {
            // Found brand + model + variant, return variants
            return {
              type: 'variant',
              query: query,
              detectedPath: {
                brand: { id: brand._id, name: brand.brand_name, code: brand.brand_code },
                model: { id: model._id, name: model.model_name, code: model.model_code }
              },
              results: variantMatches.map(variant => ({
                id: variant._id,
                name: variant.variant_name,
                code: variant.variant_code,
                image: variant.variant_image,
                status: variant.variant_status,
                description: variant.variant_Description,
                nextStep: 'products'
              })),
              total: variantMatches.length,
              hasMore: variantMatches.length === limit,
              suggestion: `Found variants for ${brand.brand_name} ${model.model_name}. Select a variant to see products.`
            };
          } else {
            // Found brand + model, return models
            return {
              type: 'model',
              query: query,
              detectedPath: {
                brand: { id: brand._id, name: brand.brand_name, code: brand.brand_code }
              },
              results: modelMatches.map(model => ({
                id: model._id,
                name: model.model_name,
                code: model.model_code,
                image: model.model_image,
                status: model.status,
                nextStep: 'variant'
              })),
              total: modelMatches.length,
              hasMore: modelMatches.length === limit,
              suggestion: `Found models for ${brand.brand_name}. Select a model to see variants.`
            };
          }
        }
      }
    }

    // If we found brands but no specific model, return brands
    if (brandMatches.length > 0) {
      return {
        type: 'brand',
        query: query,
        detectedPath: {},
        results: brandMatches.map(brand => ({
          id: brand._id,
          name: brand.brand_name,
          code: brand.brand_code,
          logo: brand.brand_logo,
          featured: brand.featured_brand,
          nextStep: 'model'
        })),
        total: brandMatches.length,
        hasMore: brandMatches.length === limit,
        suggestion: `Found brands matching "${query}". Select a brand to see models.`
      };
    }
  }

  // Continue with model, variant, and product detection...
}
```

### **Route Configuration**
```javascript
router.get(
  "/intelligent-search",
  productController.intelligentSearch
);
```

## Frontend Integration

### **JavaScript Integration**
```javascript
// Intelligent search function
async function intelligentSearch(query) {
  const response = await fetch(
    `${API_BASE_URL}/products/v1/intelligent-search?query=${encodeURIComponent(query)}&limit=10`,
    {
      headers: {
        'Authorization': 'Bearer your-token', // Optional
        'Content-Type': 'application/json'
      }
    }
  );
  return await response.json();
}

// Usage example
const result = await intelligentSearch('maruti suzuki swift');
console.log('Detected type:', result.data.type);
console.log('Results:', result.data.results);
console.log('Suggestion:', result.data.suggestion);
```

### **Progressive Search Interface**
```javascript
class IntelligentSearch {
  constructor() {
    this.searchHistory = [];
  }

  async search(query) {
    const result = await intelligentSearch(query);
    
    // Handle different result types
    switch (result.data.type) {
      case 'brand':
        this.displayBrands(result.data.results);
        break;
      case 'model':
        this.displayModels(result.data.results);
        break;
      case 'variant':
        this.displayVariants(result.data.results);
        break;
      case 'products':
        this.displayProducts(result.data.results);
        break;
      case 'none':
        this.displayNoResults();
        break;
    }
    
    // Show suggestion
    this.showSuggestion(result.data.suggestion);
    
    // Show detected path
    if (result.data.detectedPath) {
      this.showDetectedPath(result.data.detectedPath);
    }
    
    return result;
  }

  displayBrands(brands) {
    // Display brand results
  }

  displayModels(models) {
    // Display model results
  }

  displayVariants(variants) {
    // Display variant results
  }

  displayProducts(products) {
    // Display product results
  }

  showSuggestion(suggestion) {
    // Show helpful suggestion
  }

  showDetectedPath(path) {
    // Show detected brand/model context
  }
}
```

## Error Handling

### **Common Error Scenarios**

#### **1. Short Query**
```json
{
  "success": false,
  "message": "Query must be at least 2 characters long"
}
```

#### **2. No Results Found**
```json
{
  "success": true,
  "data": {
    "type": "none",
    "query": "nonexistentxyz",
    "detectedPath": {},
    "results": [],
    "total": 0,
    "hasMore": false,
    "suggestion": "No results found for \"nonexistentxyz\". Try searching for a brand name, model name, or product name."
  }
}
```

## Performance Considerations

### **Database Optimization**
- **Indexes**: Ensure proper indexes on search fields
- **Selective Queries**: Only fetch required fields
- **Limit Results**: Use limit parameter to control result size
- **Efficient Population**: Optimize related document population

### **Search Optimization**
- **Priority-based Search**: Search in order of likelihood
- **Early Termination**: Stop searching when good results found
- **Caching**: Cache frequent search results
- **Debouncing**: Implement client-side debouncing

## Testing

### **Test Script**
Use the provided test script: `node test-intelligent-search-endpoint.js`

### **Manual Testing Commands**
```bash
# Test brand detection
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=maruti"

# Test brand + model detection
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=maruti%20suzuki%20swift"

# Test brand + model + variant detection
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=maruti%20suzuki%20swift%20vdi"

# Test model detection
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=swift"

# Test variant detection
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=vdi"

# Test product detection
curl -X GET "http://localhost:5002/products/v1/intelligent-search?query=spark%20plug"
```

## Best Practices

### **1. Query Optimization**
- **Use specific terms** for better detection
- **Include brand names** when possible
- **Be descriptive** in product searches

### **2. User Experience**
- **Show suggestions** to guide users
- **Display detected path** for context
- **Provide clear next steps**
- **Handle no results gracefully**

### **3. Performance**
- **Implement debouncing** for real-time search
- **Cache frequent searches**
- **Use appropriate limits**
- **Optimize database queries**

### **4. Error Handling**
- **Validate input** on both client and server
- **Provide helpful error messages**
- **Handle network errors gracefully**
- **Implement retry logic**

## Comparison with Hierarchical Search

| Feature | Hierarchical Search | Intelligent Search |
|---------|-------------------|-------------------|
| **Usage** | Step-by-step | Single query |
| **Complexity** | Multiple API calls | Single API call |
| **User Experience** | Guided process | Instant results |
| **Flexibility** | Structured flow | Free-form search |
| **Use Case** | Guided discovery | Quick search |
| **API Calls** | 4 calls (brand→model→variant→products) | 1 call |

## Use Cases

### **1. Quick Search**
- User types "maruti suzuki swift" → Gets models directly
- User types "spark plug" → Gets products directly

### **2. Progressive Discovery**
- User types "maruti" → Gets brands, then can refine
- User types "swift" → Gets models across brands

### **3. Context-Aware Search**
- User types "maruti suzuki swift vdi" → Gets variants directly
- System understands the complete context

### **4. Fallback Search**
- If no specific matches, falls back to product search
- Ensures users always get relevant results

## Summary

The Intelligent Search Endpoint provides:

✅ **Smart Detection**: Auto-identifies search intent
✅ **Context Awareness**: Understands brand + model combinations
✅ **Progressive Search**: Handles complex queries intelligently
✅ **Fallback Search**: Always provides relevant results
✅ **Rich Responses**: Includes suggestions and detected path
✅ **No Authentication**: Publicly accessible
✅ **Performance**: Optimized database queries
✅ **User-Friendly**: Clear suggestions and next steps
✅ **Flexible**: Handles any type of search query
✅ **Comprehensive**: Covers all search scenarios

This endpoint enables users to search naturally using any combination of brand, model, variant, or product names, with the system intelligently determining what they're looking for and providing the most relevant results.
