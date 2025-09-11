# Model Count Endpoints Documentation

## Overview

This documentation covers the count endpoints for all product-related models: Brand, Category, SubCategory, and Variant. These endpoints provide comprehensive statistics and breakdowns for each model type with filtering capabilities.

## Endpoints Summary

| Model | Endpoint | Description |
|-------|----------|-------------|
| Brand | `GET /api/brands/count` | Get brand counts with breakdowns |
| Category | `GET /api/categories/count` | Get category counts with breakdowns |
| SubCategory | `GET /api/subcategories/count` | Get subcategory counts with breakdowns |
| Variant | `GET /api/variants/count` | Get variant counts with breakdowns |

---

## 1. Brand Count Endpoint

### Endpoint Details
- **URL**: `GET /api/brands/count`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

### Query Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|---------|
| `status` | string | Filter by brand status | `active`, `inactive`, `pending`, `created`, `rejected` |
| `type` | string | Filter by brand type | ObjectId of Type model |
| `featured_brand` | boolean | Filter by featured status | `true`, `false` |

### Response Format

```json
{
  "success": true,
  "message": "Brand count fetched successfully",
  "data": {
    "summary": {
      "totalBrands": 150
    },
    "breakdown": {
      "byStatus": [
        {
          "status": "active",
          "count": 120,
          "percentage": 80
        },
        {
          "status": "inactive",
          "count": 30,
          "percentage": 20
        }
      ],
      "byType": [
        {
          "type": "TYPE_ID_1",
          "count": 75,
          "percentage": 50
        },
        {
          "type": "TYPE_ID_2",
          "count": 75,
          "percentage": 50
        }
      ],
      "byFeatured": [
        {
          "featured": "Featured",
          "count": 25,
          "percentage": 17
        },
        {
          "featured": "Non-Featured",
          "count": 125,
          "percentage": 83
        }
      ]
    },
    "filters": {
      "status": null,
      "type": null,
      "featured_brand": null
    },
    "generatedAt": "2025-01-10T15:30:00.000Z"
  }
}
```

### Usage Examples

```bash
# Get all brand counts
curl -X GET "http://localhost:5002/api/brands/count" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get active brands count
curl -X GET "http://localhost:5002/api/brands/count?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get featured brands count
curl -X GET "http://localhost:5002/api/brands/count?featured_brand=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 2. Category Count Endpoint

### Endpoint Details
- **URL**: `GET /api/categories/count`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

### Query Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|---------|
| `category_Status` | string | Filter by category status | `Active`, `Inactive`, `Pending`, `Created`, `Rejected` |
| `type` | string | Filter by category type | ObjectId of Type model |
| `main_category` | boolean | Filter by main category status | `true`, `false` |

### Response Format

```json
{
  "success": true,
  "message": "Category count fetched successfully",
  "data": {
    "summary": {
      "totalCategories": 200
    },
    "breakdown": {
      "byStatus": [
        {
          "status": "Active",
          "count": 180,
          "percentage": 90
        },
        {
          "status": "Inactive",
          "count": 20,
          "percentage": 10
        }
      ],
      "byType": [
        {
          "type": "TYPE_ID_1",
          "count": 100,
          "percentage": 50
        },
        {
          "type": "TYPE_ID_2",
          "count": 100,
          "percentage": 50
        }
      ],
      "byMainCategory": [
        {
          "categoryType": "Main Category",
          "count": 50,
          "percentage": 25
        },
        {
          "categoryType": "Sub Category",
          "count": 150,
          "percentage": 75
        }
      ]
    },
    "filters": {
      "category_Status": null,
      "type": null,
      "main_category": null
    },
    "generatedAt": "2025-01-10T15:30:00.000Z"
  }
}
```

### Usage Examples

```bash
# Get all category counts
curl -X GET "http://localhost:5002/api/categories/count" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get active categories count
curl -X GET "http://localhost:5002/api/categories/count?category_Status=Active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get main categories count
curl -X GET "http://localhost:5002/api/categories/count?main_category=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 3. SubCategory Count Endpoint

### Endpoint Details
- **URL**: `GET /api/subcategories/count`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

### Query Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|---------|
| `subcategory_status` | string | Filter by subcategory status | `Active`, `Inactive`, `Pending`, `Created`, `Rejected` |
| `category_ref` | string | Filter by parent category | ObjectId of Category model |

### Response Format

```json
{
  "success": true,
  "message": "Subcategory count fetched successfully",
  "data": {
    "summary": {
      "totalSubCategories": 300
    },
    "breakdown": {
      "byStatus": [
        {
          "status": "Active",
          "count": 270,
          "percentage": 90
        },
        {
          "status": "Inactive",
          "count": 30,
          "percentage": 10
        }
      ],
      "byCategory": [
        {
          "category": "CATEGORY_ID_1",
          "count": 150,
          "percentage": 50
        },
        {
          "category": "CATEGORY_ID_2",
          "count": 150,
          "percentage": 50
        }
      ]
    },
    "filters": {
      "subcategory_status": null,
      "category_ref": null
    },
    "generatedAt": "2025-01-10T15:30:00.000Z"
  }
}
```

### Usage Examples

```bash
# Get all subcategory counts
curl -X GET "http://localhost:5002/api/subcategories/count" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get active subcategories count
curl -X GET "http://localhost:5002/api/subcategories/count?subcategory_status=Active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get subcategories by parent category
curl -X GET "http://localhost:5002/api/subcategories/count?category_ref=CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 4. Variant Count Endpoint

### Endpoint Details
- **URL**: `GET /api/variants/count`
- **Authentication**: Required (Bearer Token)
- **Authorization**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

### Query Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|---------|
| `variant_status` | string | Filter by variant status | `active`, `inactive`, `pending`, `created`, `rejected` |
| `model` | string | Filter by model | ObjectId of Model model |

### Response Format

```json
{
  "success": true,
  "message": "Variant count fetched successfully",
  "data": {
    "summary": {
      "totalVariants": 500
    },
    "breakdown": {
      "byStatus": [
        {
          "status": "active",
          "count": 450,
          "percentage": 90
        },
        {
          "status": "inactive",
          "count": 50,
          "percentage": 10
        }
      ],
      "byModel": [
        {
          "model": "MODEL_ID_1",
          "count": 250,
          "percentage": 50
        },
        {
          "model": "MODEL_ID_2",
          "count": 250,
          "percentage": 50
        }
      ],
      "byYear": [
        {
          "year": "YEAR_ID_1",
          "count": 200,
          "percentage": 40
        },
        {
          "year": "YEAR_ID_2",
          "count": 300,
          "percentage": 60
        }
      ]
    },
    "filters": {
      "variant_status": null,
      "model": null
    },
    "generatedAt": "2025-01-10T15:30:00.000Z"
  }
}
```

### Usage Examples

```bash
# Get all variant counts
curl -X GET "http://localhost:5002/api/variants/count" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get active variants count
curl -X GET "http://localhost:5002/api/variants/count?variant_status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get variants by model
curl -X GET "http://localhost:5002/api/variants/count?model=MODEL_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Response Fields

### Summary
- Contains the total count for the filtered results

### Breakdown
- **byStatus**: Count and percentage breakdown by status
- **byType**: Count and percentage breakdown by type (Brand, Category)
- **byCategory**: Count and percentage breakdown by parent category (SubCategory)
- **byModel**: Count and percentage breakdown by model (Variant)
- **byYear**: Count and percentage breakdown by year (Variant)
- **byFeatured**: Count and percentage breakdown by featured status (Brand)
- **byMainCategory**: Count and percentage breakdown by main category status (Category)

### Filters
- Shows which filters were applied in the request

### GeneratedAt
- Timestamp when the response was generated

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid query parameters",
  "error": "Detailed error information"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Missing or invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "User role not authorized"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to get [model] count",
  "error": "Server error details"
}
```

## Performance Considerations

- All endpoints use MongoDB aggregation pipelines for efficient data processing
- Indexes on status, type, and reference fields are recommended for optimal performance
- Responses are cached when possible to improve response times
- Filtering reduces the dataset size and improves performance

## Testing

Use the provided test script to test all endpoints:

```bash
# Run all tests
node test-model-count-endpoints.js

# Run tests for specific model
node test-model-count-endpoints.js --model brand
node test-model-count-endpoints.js --model category
node test-model-count-endpoints.js --model subcategory
node test-model-count-endpoints.js --model variant

# Run specific test
node test-model-count-endpoints.js --test "Get all brand counts"

# Show help
node test-model-count-endpoints.js --help
```

## Related Endpoints

- `GET /api/brands` - Get all brands
- `GET /api/categories` - Get all categories
- `GET /api/subcategories` - Get all subcategories
- `GET /api/variants` - Get all variants

## Changelog

- **v1.0.0** (2025-01-10): Initial implementation of count endpoints for all models
