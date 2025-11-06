# Product Service API Documentation

## Overview

The Product Service manages the product catalog, categories, brands, variants, inventory, and product-related operations. It operates on port **5002**.

**Base URL**: `http://localhost:5002/api` (Development)  
**Production URL**: `https://api.toprise.in/api`

---

## Table of Contents

1. [Product Management](#product-management)
2. [Category Management](#category-management)
3. [Brand Management](#brand-management)
4. [Variant Management](#variant-management)
5. [Model Management](#model-management)
6. [Type Management](#type-management)
7. [Year Management](#year-management)
8. [Subcategory Management](#subcategory-management)
9. [Search & Discovery](#search--discovery)
10. [Banner Management](#banner-management)
11. [Purchase Orders](#purchase-orders)
12. [Catalog Management](#catalog-management)
13. [Products by Category](#products-by-category)
14. [Vehicle Information](#vehicle-information)
15. [Popular Vehicles](#popular-vehicles)
16. [Reports & Analytics](#reports--analytics)
17. [Audit Logs](#audit-logs)
18. [Pincode Management](#pincode-management)

---

## Product Management

### 1. Get Products with Filters

**Endpoint**: `GET /api/product`  
**Access**: Public (with optional authentication)

**Query Parameters**:
- `category`: Category ID
- `brand`: Brand ID
- `model`: Model ID
- `variant`: Variant ID
- `min_price`, `max_price`: Price range
- `status`: Product status (Pending, Approved, Rejected)
- `live_status`: Live status filter
- `Qc_status`: QC status filter
- `dealerId`: Filter by dealer
- `page`, `limit`: Pagination
- `sort_by`: Sort field (A-Z, Z-A, L-H, H-L)

**Response**:
```json
{
  "success": true,
  "data": {
    "products": [ /* array of products */ ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100
    }
  }
}
```

---

### 2. Get Products with Pagination

**Endpoint**: `GET /api/product/get-all-products/pagination`  
**Access**: Public

**Query Parameters**: Same as above

---

### 3. Get Product by ID

**Endpoint**: `GET /api/product/get-ProductById/:id`  
**Access**: Public

**Response**: Full product details with populated category, brand, model, variant

---

### 4. Create Single Product

**Endpoint**: `POST /api/product/createProduct`  
**Access**: Super-admin, Inventory-Admin  
**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
- `product_name`: Product name
- `category`: Category ID
- `brand`: Brand ID
- `model`: Model ID
- `variant`: Variant ID
- `selling_price`: Selling price
- `mrp`: MRP
- `description`: Product description
- `images`: Array of image files
- `search_tags`: Comma-separated tags
- `sku`: SKU (optional, auto-generated if not provided)

**Response**:
```json
{
  "success": true,
  "data": {
    "product": { /* product object */ },
    "sku": "AUTO_GENERATED_SKU"
  }
}
```

---

### 5. Update Product

**Endpoint**: `PUT /api/product/updateProduct/:id`  
**Access**: Super-admin, Inventory-Admin, Dealer  
**Content-Type**: `multipart/form-data`

**Request**: Same fields as create (all optional)

---

### 6. Bulk Upload Products

**Endpoint**: `POST /api/product`  
**Access**: Super-admin, Inventory-Admin  
**Content-Type**: `multipart/form-data`

**Request**:
- `dataFile`: CSV file with product data
- `imageZip`: ZIP file with product images

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "bulk_upload_session_id",
    "totalProducts": 100,
    "processed": 95,
    "failed": 5,
    "errors": [ /* error details */ ]
  }
}
```

---

### 7. Bulk Edit Products

**Endpoint**: `PUT /api/product/bulk-edit`  
**Access**: Super-admin, Inventory-Admin  
**Content-Type**: `multipart/form-data`

**Request**: CSV file with product updates

---

### 8. Approve Product

**Endpoint**: `PATCH /api/product/approve/:id`  
**Access**: Super-admin

**Request Body**:
```json
{
  "approvedBy": "admin_user_id",
  "notes": "Approval notes"
}
```

**Response**: Product with `live_status: "Approved"` and `Qc_status: "Approved"`

---

### 9. Reject Product

**Endpoint**: `PATCH /api/product/reject/:id`  
**Access**: Super-admin

**Request Body**:
```json
{
  "rejectedBy": "admin_user_id",
  "rejectionReason": "Reason for rejection"
}
```

---

### 10. Bulk Approve Products

**Endpoint**: `PATCH /api/product/bulk/approve`  
**Access**: Super-admin

**Request Body**:
```json
{
  "productIds": ["product_id1", "product_id2"],
  "approvedBy": "admin_user_id"
}
```

---

### 11. Bulk Reject Products

**Endpoint**: `PATCH /api/product/bulk/reject`  
**Access**: Super-admin

**Request Body**:
```json
{
  "productIds": ["product_id1", "product_id2"],
  "rejectedBy": "admin_user_id",
  "rejectionReason": "Bulk rejection reason"
}
```

---

### 12. Deactivate Single Product

**Endpoint**: `PATCH /api/product/deactivate/:id`  
**Access**: Super-admin, Inventory-Admin

---

### 13. Bulk Deactivate Products

**Endpoint**: `PATCH /api/product/deactivateProduct/bulk`  
**Access**: Super-admin, Inventory-Admin

**Request Body**:
```json
{
  "productIds": ["product_id1", "product_id2"]
}
```

---

### 14. Get Products by Dealer

**Endpoint**: `GET /api/product/get-products-by-dealer/:dealerId`  
**Access**: Public

**Query Parameters**: `page`, `limit`, `status`

---

### 15. Get Products by Dealer (Query Param)

**Endpoint**: `GET /api/product/get-products-by-dealer`  
**Query Parameters**: `dealerId`, `page`, `limit`

---

### 16. Get Assigned Dealers for Product

**Endpoint**: `GET /api/product/products/:id/availableDealers`  
**Access**: Public

**Response**: List of dealers assigned to the product with inventory

---

### 17. Decrement Dealer Stock

**Endpoint**: `PATCH /api/product/products/:id/availableDealers/:dealerId`  
**Access**: Internal/System

**Description**: Decrements stock when order is placed

---

### 18. Update Product Stock by Dealer

**Endpoint**: `PUT /api/product/update-stockByDealer/:id`  
**Access**: Dealer

**Request Body**:
```json
{
  "dealerId": "dealer_id",
  "stock": 100
}
```

---

### 19. Assign Dealers to Products

**Endpoint**: `POST /api/product/assign/dealers`  
**Access**: Super-admin, Inventory-Admin  
**Content-Type**: `multipart/form-data`

**Request**: CSV file with product-dealer assignments

---

### 20. Disable Products by Dealer

**Endpoint**: `POST /api/product/disable-by-dealer`  
**Access**: Internal

**Request Body**:
```json
{
  "dealerId": "dealer_id",
  "productIds": ["product_id1", "product_id2"]
}
```

---

### 21. Enable Products by Dealer

**Endpoint**: `POST /api/product/enable-by-dealer`  
**Access**: Internal

---

### 22. Get Product Bulk Upload Sessions

**Endpoint**: `GET /api/product/get-all-productLogs`  
**Access**: Super-admin, Inventory-Admin

**Response**: List of bulk upload sessions with status

---

### 23. Get Product Bulk Session Logs

**Endpoint**: `GET /api/product/get-products-Logs`  
**Query Parameters**: `sessionId`

**Access**: Super-admin, Inventory-Admin

**Response**: Detailed logs for a specific bulk upload session

---

### 24. Export Dealer Products

**Endpoint**: `GET /api/product/export`  
**Access**: Super-admin, Inventory-Admin

**Query Parameters**: `dealerId`

**Response**: CSV/Excel file download

---

### 25. Get Vehicle Details

**Endpoint**: `GET /api/product/getVehicleDetails`  
**Query Parameters**: `brand`, `model`, `variant`, `year`

**Access**: Public

---

### 26. Get Pending Products

**Endpoint**: `GET /api/product/pending`  
**Access**: Super-admin, Inventory-Admin

**Query Parameters**: `page`, `limit`

**Description**: Returns products where `live_status` OR `Qc_status` is "Pending"

---

### 27. Get Product Statistics

**Endpoint**: `GET /api/product/stats`  
**Access**: Super-admin, Inventory-Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "totalProducts": 1000,
    "pendingApproval": 50,
    "approved": 900,
    "rejected": 50,
    "byStatus": { /* breakdown by status */ },
    "byCategory": { /* breakdown by category */ }
  }
}
```

---

### 28. Get Approval Statistics

**Endpoint**: `GET /api/product/approval-stats`  
**Access**: Super-admin, Inventory-Admin

---

## Category Management

### 1. Get All Categories

**Endpoint**: `GET /api/category`  
**Access**: Public

**Query Parameters**:
- `status`: Filter by status (Active/Inactive)
- `main_category`: Filter by main category flag

**Response**: Array of categories with hierarchy

---

### 2. Get Category by ID

**Endpoint**: `GET /api/category/:id`  
**Access**: Public

---

### 3. Get Categories by Type

**Endpoint**: `GET /api/category/type/:type`  
**Access**: Public

**Description**: Get categories filtered by type ID

---

### 4. Get Live Categories

**Endpoint**: `GET /api/category/application`  
**Access**: Public

**Description**: Get only active categories

---

### 5. Get Category Count

**Endpoint**: `GET /api/category/count`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

---

### 6. Create Category

**Endpoint**: `POST /api/category`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
- `category_name`: Category name
- `category_code`: Category code
- `type`: Type ID
- `category_description`: Description
- `main_category`: Boolean
- `file`: Category image

---

### 7. Update Category

**Endpoint**: `PUT /api/category/:id`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

---

### 8. Delete Category

**Endpoint**: `DELETE /api/category/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 9. Bulk Upload Categories

**Endpoint**: `POST /api/category/bulk-upload/categories`  
**Access**: Super-admin, Inventory-Admin  
**Content-Type**: `multipart/form-data`

**Request**:
- `dataFile`: CSV file
- `imageZip`: ZIP file with images

---

### 10. Get Categories by IDs (Bulk)

**Endpoint**: `POST /api/category/bulk-by-ids`  
**Access**: Public

**Request Body**:
```json
{
  "ids": ["category_id1", "category_id2"],
  "user_id": "user_id" // optional
}
```

**Response**: Array of category objects

---

### 11. Map Categories to Dealer

**Endpoint**: `POST /api/category/map-categories`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "dealerId": "dealer_id",
  "categoryIds": ["category_id1", "category_id2"]
}
```

---

## Brand Management

### 1. Get All Brands

**Endpoint**: `GET /api/brand`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

**Query Parameters**: `type`, `status`

---

### 2. Get Brand by ID

**Endpoint**: `GET /api/brand/:id`  
**Access**: Super-admin, Fulfillment-Admin, User

---

### 3. Get Brands by Type

**Endpoint**: `GET /api/brand/brandByType/:type`  
**Access**: Public

---

### 4. Get Brand Count

**Endpoint**: `GET /api/brand/count`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

---

### 5. Create Brand

**Endpoint**: `POST /api/brand`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
- `brand_name`: Brand name
- `type`: Type ID
- `file`: Brand logo image

---

### 6. Update Brand

**Endpoint**: `PUT /api/brand/:id`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

---

### 7. Delete Brand

**Endpoint**: `DELETE /api/brand/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

## Variant Management

### 1. Get All Variants

**Endpoint**: `GET /api/variant`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

---

### 2. Get Variant by ID

**Endpoint**: `GET /api/variant/:id`  
**Access**: Super-admin, Fulfillment-Admin, User

---

### 3. Get Variants by Model

**Endpoint**: `GET /api/variant/model/:modelId`  
**Access**: Public

---

### 4. Get Variant Count

**Endpoint**: `GET /api/variant/count`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

---

### 5. Create Variant

**Endpoint**: `POST /api/variant`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
- `variant_name`: Variant name
- `model`: Model ID
- `file`: Variant image

---

### 6. Update Variant

**Endpoint**: `PUT /api/variant/:id`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

---

### 7. Delete Variant

**Endpoint**: `DELETE /api/variant/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

## Model Management

### 1. Get All Models

**Endpoint**: `GET /api/model`  
**Access**: Public

**Query Parameters**: `brand_ref`

---

### 2. Get Model by ID

**Endpoint**: `GET /api/model/:id`  
**Access**: Public

---

### 3. Create Model

**Endpoint**: `POST /api/model`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "model_name": "City",
  "brand_ref": "brand_id"
}
```

---

### 4. Update Model

**Endpoint**: `PUT /api/model/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 5. Delete Model

**Endpoint**: `DELETE /api/model/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

## Type Management

### 1. Get All Types

**Endpoint**: `GET /api/type`  
**Access**: Public

---

### 2. Get Type by ID

**Endpoint**: `GET /api/type/:id`  
**Access**: Public

---

### 3. Create Type

**Endpoint**: `POST /api/type`  
**Access**: Super-admin, Fulfillment-Admin

---

### 4. Update Type

**Endpoint**: `PUT /api/type/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 5. Delete Type

**Endpoint**: `DELETE /api/type/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

## Year Management

### 1. Get All Years

**Endpoint**: `GET /api/year`  
**Access**: Public

---

### 2. Create Year

**Endpoint**: `POST /api/year`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "year": 2024
}
```

---

## Subcategory Management

### 1. Get All Subcategories

**Endpoint**: `GET /api/subcategory`  
**Access**: Public

**Query Parameters**: `category`

---

### 2. Get Subcategory by ID

**Endpoint**: `GET /api/subcategory/:id`  
**Access**: Public

---

### 3. Create Subcategory

**Endpoint**: `POST /api/subcategory`  
**Access**: Super-admin, Fulfillment-Admin

---

### 4. Update Subcategory

**Endpoint**: `PUT /api/subcategory/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 5. Delete Subcategory

**Endpoint**: `DELETE /api/subcategory/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

## Search & Discovery

### 1. Smart Search

**Endpoint**: `GET /api/search/smart-search`  
**Access**: Public

**Query Parameters**:
- `query`: Search query (required)
- `type`: Type ID
- `category`: Category ID or name
- `sort_by`: Sort option (A-Z, Z-A, L-H, H-L)
- `min_price`, `max_price`: Price range
- `page`, `limit`: Pagination

**Description**: Intelligent search that detects brand, model, variant, and product matches

**Response**:
```json
{
  "success": true,
  "searchQuery": "honda city brake pad",
  "is_brand": false,
  "is_model": false,
  "is_variant": false,
  "is_product": true,
  "results": {
    "brand": { /* brand object */ },
    "model": { /* model object */ },
    "variant": { /* variant object */ },
    "category": { /* category object */ },
    "products": [ /* array of products */ ]
  },
  "pagination": { /* pagination info */ }
}
```

---

### 2. Hierarchical Search

**Endpoint**: `GET /api/search/hierarchical`  
**Access**: Public

**Description**: Search with category hierarchy support

---

### 3. Intelligent Search

**Endpoint**: `GET /api/search/intelligent`  
**Access**: Public

**Description**: Advanced search with brand detection and filtering

---

## Banner Management

### 1. Get All Banners

**Endpoint**: `GET /api/banner`  
**Access**: Public

**Query Parameters**: `is_active`, `brand_id`

---

### 2. Get Banner by ID

**Endpoint**: `GET /api/banner/:id`  
**Access**: Public

---

### 3. Create Banner

**Endpoint**: `POST /api/banner`  
**Access**: Super-admin  
**Content-Type**: `multipart/form-data`

---

### 4. Update Banner

**Endpoint**: `PUT /api/banner/:id`  
**Access**: Super-admin  
**Content-Type**: `multipart/form-data`

---

### 5. Update Banner Status

**Endpoint**: `PUT /api/banner/updateStatus/:id`  
**Access**: Super-admin

**Request Body**:
```json
{
  "is_active": true
}
```

---

### 6. Bulk Update Banner Status

**Endpoint**: `PUT /api/banner/admin/bulk-update-status`  
**Access**: Super-admin

**Request Body**:
```json
{
  "bannerIds": ["banner_id1", "banner_id2"],
  "is_active": true
}
```

---

## Purchase Orders

### 1. Create Purchase Order

**Endpoint**: `POST /api/purchaseorders`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer  
**Content-Type**: `multipart/form-data`

**Request Body** (FormData):
- `user_id`: User ID
- `items`: JSON array of items
- `files`: Array of attachment files

---

### 2. Get Purchase Order Statistics

**Endpoint**: `GET /api/purchaseorders/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 3. Get Filtered Purchase Orders

**Endpoint**: `GET /api/purchaseorders/filter`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

**Query Parameters**: `status`, `startDate`, `endDate`, `page`, `limit`

---

### 4. Get Purchase Orders by User

**Endpoint**: `GET /api/purchaseorders/user/:user_id`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

---

### 5. Get Purchase Order by ID

**Endpoint**: `GET /api/purchaseorders/:id`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

---

### 6. Update Purchase Order

**Endpoint**: `PUT /api/purchaseorders/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 7. Delete Purchase Order

**Endpoint**: `DELETE /api/purchaseorders/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

## Catalog Management

### 1. Get Catalog

**Endpoint**: `GET /api/catalog`  
**Access**: Public

**Query Parameters**: `category`, `brand`, `dealerId`

---

### 2. Generate Catalog

**Endpoint**: `POST /api/catalog/generate`  
**Access**: Super-admin, Inventory-Admin

---

## Products by Category

### 1. Get Products by Category

**Endpoint**: `GET /api/products-by-category`  
**Access**: Public

**Query Parameters**: `categoryId`, `page`, `limit`, `sort_by`

---

## Vehicle Information

### 1. Get Vehicle Info

**Endpoint**: `GET /api/vehicleInfo`  
**Access**: Public

**Query Parameters**: `brand`, `model`, `variant`, `year`

---

## Popular Vehicles

### 1. Get Popular Vehicles

**Endpoint**: `GET /api/popularVehicle`  
**Access**: Public

---

### 2. Create Popular Vehicle

**Endpoint**: `POST /api/popularVehicle`  
**Access**: Super-admin, Fulfillment-Admin

---

### 3. Update Popular Vehicle

**Endpoint**: `PUT /api/popularVehicle/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 4. Delete Popular Vehicle

**Endpoint**: `DELETE /api/popularVehicle/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

## Reports & Analytics

### 1. Generate Product Reports

**Endpoint**: `GET /api/product/reports`  
**Access**: Super-admin, Inventory-Admin

**Query Parameters**: `startDate`, `endDate`, `category`, `brand`, `format`

**Response**: CSV/Excel file or JSON data

---

### 2. Get Product Analytics

**Endpoint**: `GET /api/reports/analytics`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

**Query Parameters**: `startDate`, `endDate`, `groupBy`, `category`, `brand`

---

### 3. Export Product Report

**Endpoint**: `GET /api/reports/export`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, Analytics-Admin

---

## Audit Logs

### 1. Get Audit Logs

**Endpoint**: `GET /api/audit/logs`  
**Access**: Authenticated users

**Query Parameters**: `page`, `limit`, `action`, `targetType`, `targetId`, `startDate`, `endDate`

---

### 2. Get Audit Statistics

**Endpoint**: `GET /api/audit/stats`  
**Access**: Authenticated users

---

### 3. Get Audit Dashboard

**Endpoint**: `GET /api/audit/dashboard`  
**Access**: Authenticated users

---

## Pincode Management

### 1. Bulk Upload Pincodes

**Endpoint**: `POST /api/pincode/bulk-upload`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

---

### 2. Get Pincode Statistics

**Endpoint**: `GET /api/pincode/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

---

### 3. Get All States

**Endpoint**: `GET /api/pincode/states`  
**Access**: Public

---

### 4. Get Cities by State

**Endpoint**: `GET /api/pincode/cities/:state`  
**Access**: Public

---

### 5. Check Pincode Serviceability

**Endpoint**: `GET /api/pincode/check/:pincode`  
**Access**: Public

---

### 6. Get All Pincodes

**Endpoint**: `GET /api/pincode`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, User

---

### 7. Create Pincode

**Endpoint**: `POST /api/pincode`  
**Access**: Super-admin, Fulfillment-Admin

---

### 8. Update Pincode

**Endpoint**: `PUT /api/pincode/:id`  
**Access**: Super-admin, Fulfillment-Admin

---

### 9. Delete Pincode

**Endpoint**: `DELETE /api/pincode/:id`  
**Access**: Super-admin

---

## Common Request Headers

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json (or multipart/form-data for file uploads)
```

## Error Responses

Standard error response format:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

**Last Updated**: 2025-01-27  
**Service Version**: 1.0.0

