# Catalog Controller Implementation

## Overview

The Catalog Controller provides comprehensive functionality for managing product catalogs with automatic product assignment based on brand, model, and variants. When a catalog is created, it automatically assigns products that match the specified criteria.

## Features

### ✅ Core Functionality
- **Automatic Product Assignment**: Products are automatically assigned to catalogs based on brand, model, variants, categories, and subcategories
- **Manual Product Management**: Ability to manually assign or remove products from catalogs
- **Catalog CRUD Operations**: Full Create, Read, Update, Delete operations for catalogs
- **Product Preview**: Preview products before creating a catalog
- **Statistics & Analytics**: Get detailed statistics about catalog contents
- **Re-assignment**: Re-assign products when catalog criteria are updated

### ✅ Advanced Features
- **Role-based Access Control**: Different permission levels for different user roles
- **Pagination & Filtering**: Efficient data retrieval with pagination support
- **Comprehensive Logging**: Detailed logging for all operations
- **Error Handling**: Robust error handling with meaningful error messages
- **Data Validation**: Input validation for all operations

## API Endpoints

### 1. Create Catalog
```http
POST /api/catalogs
```

**Description**: Creates a new catalog and automatically assigns products based on specified criteria.

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <jwt-token>
```

**Request Body**:
```json
{
  "catalog_name": "Honda Cars Parts Catalog",
  "catalog_description": "Comprehensive catalog for Honda car parts",
  "catalog_image": "https://example.com/honda-catalog.jpg",
  "catalog_created_by": "admin@toprise.in",
  "catalog_updated_by": "admin@toprise.in",
  "catalog_brands": ["BRAND_ID_1", "BRAND_ID_2"],
  "catalog_models": ["MODEL_ID_1", "MODEL_ID_2"],
  "catalog_variants": ["VARIANT_ID_1", "VARIANT_ID_2"],
  "catalog_categories": ["CATEGORY_ID_1"],
  "catalog_subcategories": ["SUBCATEGORY_ID_1"],
  "catalog_manufacturers": ["MANUFACTURER_ID_1"],
  "catalog_types": ["TYPE_ID_1"],
  "catalog_years": ["YEAR_ID_1"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "catalog": {
      "_id": "catalog_id",
      "catalog_name": "Honda Cars Parts Catalog",
      "catalog_products": ["product_id_1", "product_id_2"],
      // ... other catalog fields
    },
    "assignedProductsCount": 25,
    "message": "Catalog created successfully with 25 products automatically assigned"
  }
}
```

### 2. Get All Catalogs
```http
GET /api/catalogs?page=1&limit=10&status=active
```

**Description**: Retrieves all catalogs with pagination and filtering support.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by catalog status

**Response**:
```json
{
  "success": true,
  "data": {
    "catalogs": [
      {
        "_id": "catalog_id",
        "catalog_name": "Honda Cars Parts Catalog",
        "catalog_products": ["product_id_1", "product_id_2"],
        // ... other catalog fields
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 3. Get Catalog by ID
```http
GET /api/catalogs/:id
```

**Description**: Retrieves a specific catalog with detailed product information.

**Response**:
```json
{
  "success": true,
  "data": {
    "catalog": {
      "_id": "catalog_id",
      "catalog_name": "Honda Cars Parts Catalog",
      "catalog_products": [
        {
          "_id": "product_id",
          "product_name": "Honda Civic Brake Pad",
          "sku_code": "HON001",
          "brand": {
            "brand_name": "Honda",
            "brand_code": "HON"
          },
          "model": {
            "model_name": "Civic",
            "model_code": "CIV"
          }
          // ... other product fields
        }
      ],
      // ... other catalog fields
    }
  }
}
```

### 4. Update Catalog
```http
PUT /api/catalogs/:id
```

**Description**: Updates a catalog and re-assigns products based on new criteria.

**Request Body**: Same as create catalog (all fields optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "catalog": {
      // Updated catalog object
    },
    "assignedProductsCount": 30,
    "message": "Catalog updated successfully with 30 products assigned"
  }
}
```

### 5. Delete Catalog
```http
DELETE /api/catalogs/:id
```

**Description**: Deletes a catalog.

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Catalog deleted successfully"
  }
}
```

### 6. Manually Assign Products
```http
POST /api/catalogs/:id/assign-products
```

**Description**: Manually assigns specific products to a catalog.

**Request Body**:
```json
{
  "productIds": ["product_id_1", "product_id_2", "product_id_3"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "catalog": {
      // Updated catalog object
    },
    "assignedProductsCount": 3,
    "message": "3 products assigned to catalog successfully"
  }
}
```

### 7. Remove Products from Catalog
```http
DELETE /api/catalogs/:id/remove-products
```

**Description**: Removes specific products from a catalog.

**Request Body**:
```json
{
  "productIds": ["product_id_1", "product_id_2"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "catalog": {
      // Updated catalog object
    },
    "removedProductsCount": 2,
    "message": "2 products removed from catalog successfully"
  }
}
```

### 8. Preview Products by Criteria
```http
GET /api/catalogs/preview/products?brands=BRAND_ID_1,BRAND_ID_2&models=MODEL_ID_1
```

**Description**: Preview products that would be assigned to a catalog based on criteria.

**Query Parameters**:
- `brands`: Comma-separated brand IDs
- `models`: Comma-separated model IDs
- `variants`: Comma-separated variant IDs
- `categories`: Comma-separated category IDs
- `subcategories`: Comma-separated subcategory IDs

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "product_name": "Honda Civic Brake Pad",
        "sku_code": "HON001",
        // ... other product fields
      }
    ],
    "count": 25,
    "criteria": {
      "brands": "BRAND_ID_1,BRAND_ID_2",
      "models": "MODEL_ID_1"
    }
  }
}
```

### 9. Re-assign Products
```http
POST /api/catalogs/:id/reassign-products
```

**Description**: Re-assigns products to a catalog based on current criteria.

**Response**:
```json
{
  "success": true,
  "data": {
    "catalog": {
      // Updated catalog object
    },
    "assignedProductsCount": 28,
    "message": "Catalog products re-assigned successfully. 28 products now assigned."
  }
}
```

### 10. Get Catalog Statistics
```http
GET /api/catalogs/:id/statistics
```

**Description**: Retrieves detailed statistics about a catalog.

**Response**:
```json
{
  "success": true,
  "data": {
    "catalogId": "catalog_id",
    "catalogName": "Honda Cars Parts Catalog",
    "statistics": {
      "totalProducts": 25,
      "totalBrands": 2,
      "totalModels": 5,
      "totalVariants": 10,
      "catalogStatus": "active",
      "createdDate": "2024-01-15T10:30:00Z",
      "lastUpdated": "2024-01-15T15:45:00Z",
      "createdBy": "admin@toprise.in",
      "updatedBy": "admin@toprise.in",
      "productTypeDistribution": {
        "OE": 15,
        "OEM": 8,
        "AFTERMARKET": 2
      }
    }
  }
}
```

## Authentication & Authorization

### Required Roles
- **Super-admin**: Full access to all operations
- **Inventory-Admin**: Full access to all operations
- **Catalog-Admin**: Limited access (create, update, assign/remove products)

### Authentication
All endpoints (except GET operations) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Database Schema

### Catalog Model
```javascript
{
  catalog_name: String (required),
  catalog_description: String (required),
  catalog_image: String (required),
  catalog_status: String (enum: ["active", "inactive", "pending", "created", "rejected"]),
  catalog_created_at: Date,
  catalog_updated_at: Date,
  catalog_created_by: String (required),
  catalog_updated_by: String (required),
  catalog_categories: [ObjectId],
  catalog_brands: [ObjectId],
  catalog_manufacturers: [ObjectId],
  catalog_types: [ObjectId],
  catalog_years: [ObjectId],
  catalog_variants: [ObjectId],
  catalog_models: [ObjectId],
  catalog_subcategories: [ObjectId],
  catalog_products: [ObjectId] // Auto-populated
}
```

## Product Assignment Logic

The automatic product assignment works as follows:

1. **Brand Matching**: Products with matching brand IDs are included
2. **Model Matching**: Products with matching model IDs are included
3. **Variant Matching**: Products with matching variant IDs are included
4. **Category Matching**: Products with matching category IDs are included
5. **Subcategory Matching**: Products with matching subcategory IDs are included

**Note**: Products must match at least one of the specified criteria to be included in the catalog.

## Error Handling

The controller provides comprehensive error handling:

- **400 Bad Request**: Invalid input data or missing required fields
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions for the operation
- **404 Not Found**: Catalog or product not found
- **500 Internal Server Error**: Server-side errors

## Logging

All operations are logged with the following information:
- Operation type and timestamp
- User performing the operation
- Catalog ID and name
- Number of products affected
- Success/failure status

## Usage Examples

### Creating a Brand-Specific Catalog
```javascript
const catalogData = {
  catalog_name: "Toyota Parts Catalog",
  catalog_description: "All Toyota vehicle parts",
  catalog_image: "https://example.com/toyota-catalog.jpg",
  catalog_created_by: "admin@toprise.in",
  catalog_brands: ["toyota_brand_id"],
  catalog_categories: ["engine_parts_category_id", "brake_parts_category_id"]
};

const response = await axios.post('/api/catalogs', catalogData, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Creating a Model-Specific Catalog
```javascript
const catalogData = {
  catalog_name: "Honda Civic Parts",
  catalog_description: "Parts specifically for Honda Civic",
  catalog_image: "https://example.com/civic-catalog.jpg",
  catalog_created_by: "admin@toprise.in",
  catalog_brands: ["honda_brand_id"],
  catalog_models: ["civic_model_id"],
  catalog_variants: ["civic_sedan_variant_id", "civic_hatchback_variant_id"]
};
```

### Updating Catalog Criteria
```javascript
const updateData = {
  catalog_name: "Updated Honda Parts Catalog",
  catalog_brands: ["honda_brand_id", "acura_brand_id"], // Added Acura
  catalog_models: ["civic_model_id", "accord_model_id"] // Added Accord
};

const response = await axios.put(`/api/catalogs/${catalogId}`, updateData, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Testing

Use the provided test script `test-catalog-controller.js` to test all functionality:

1. Update the configuration with valid IDs and tokens
2. Run: `node test-catalog-controller.js`
3. Check the console output for test results

## Performance Considerations

- **Pagination**: All list endpoints support pagination to handle large datasets
- **Indexing**: Ensure proper database indexes on frequently queried fields
- **Caching**: Consider implementing caching for frequently accessed catalogs
- **Batch Operations**: For large product assignments, consider implementing batch operations

## Future Enhancements

- **Bulk Catalog Creation**: Create multiple catalogs at once
- **Catalog Templates**: Pre-defined catalog templates for common use cases
- **Advanced Filtering**: More sophisticated filtering options
- **Export Functionality**: Export catalog data to various formats
- **Analytics Dashboard**: Visual analytics for catalog performance
- **Automated Scheduling**: Schedule catalog updates and re-assignments
