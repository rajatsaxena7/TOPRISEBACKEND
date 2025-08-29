# Bulk Dealer Assignment with CSV Implementation

## Overview

The bulk dealer assignment endpoint has been enhanced to accept CSV files with dealer legal names instead of dealer IDs, making it more user-friendly for administrators. Additionally, the dealer assignment endpoints now support both ObjectId and SKU code for product identification.

## Changes Made

### 1. New Helper Function
Added `fetchDealerByLegalName()` function in `services/product-service/src/controller/product.js`:
- Fetches dealer details by legal_name from the user service
- Includes caching for performance optimization
- Handles case-insensitive matching

### 2. Modified Controller
Updated `bulkAssignDealers()` function to:
- Accept CSV file uploads instead of JSON payload
- Parse CSV with fields: `sku_code`, `legal_name`, `qty`, `margin`, `priority`
- Resolve legal names to dealer IDs before processing
- Use bulk MongoDB operations for efficiency

### 3. Updated Route
Modified the route in `services/product-service/src/route/product.js`:
- Added file upload middleware for CSV processing
- Maintains existing authentication and authorization

### 4. Fixed ObjectId Casting Error
Updated dealer assignment functions to support both ObjectId and SKU code:
- `assignDealersForProduct()` - Now accepts SKU codes in URL parameters
- `manuallyAssignDealer()` - Now accepts SKU codes in request body
- Automatic detection of ObjectId vs SKU code format
- Fallback to SKU code lookup if ObjectId is invalid

## CSV Format

The CSV file should contain the following columns:

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| `sku_code` | Product SKU code | Yes | `SKU001` |
| `legal_name` | Dealer's legal name | Yes | `ABC Motors Ltd` |
| `qty` | Quantity to assign | Yes | `10` |
| `margin` | Dealer margin percentage | No | `15.5` |
| `priority` | Priority override | No | `1` |

### Example CSV Content:
```csv
sku_code,legal_name,qty,margin,priority
SKU001,ABC Motors Ltd,10,15.5,1
SKU002,XYZ Auto Parts,5,12.0,2
SKU003,ABC Motors Ltd,8,18.0,1
SKU004,Best Dealers Inc,12,10.5,3
```

## API Usage

### 1. Bulk Dealer Assignment (CSV)
**Endpoint:**
```
POST /api/products/v1/assign/dealer/bulk
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
- `dealersFile`: CSV file containing dealer assignments

### 2. Manual Dealer Assignment
**Endpoint:**
```
POST /api/products/v1/assign/dealer/manual
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productId": "SKU001",        // Can be ObjectId or SKU code
  "dealerId": "DLR-12345678",
  "quantity": 10,
  "margin": 15.5,
  "priority": 1,
  "inStock": true
}
```

### 3. Assign Dealers for Product
**Endpoint:**
```
POST /api/products/v1/assign/dealerforProduct/:productId
```

**URL Parameter:**
- `productId`: Can be ObjectId or SKU code (e.g., `/SKU001`)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "dealerData": [
    {
      "dealers_Ref": "DLR-12345678",
      "quantity_per_dealer": 15,
      "dealer_margin": 12.0,
      "dealer_priority_override": 2,
      "inStock": true
    }
  ]
}
```

### Required Roles
- Super-admin
- Inventory-Admin
- Fulfillment-Admin

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Dealer assignments processed successfully",
  "data": {
    "skuProcessed": 4,
    "dealerLinks": 4,
    "matched": 4,
    "modified": 4
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Some dealers could not be resolved",
  "dealerErrors": [
    {
      "sku": "SKU001",
      "legal_name": "Invalid Dealer Name",
      "error": "Dealer not found with this legal_name"
    }
  ]
}
```

## Key Features

1. **Legal Name Resolution**: Automatically converts dealer legal names to dealer IDs
2. **SKU Code Support**: All endpoints now support both ObjectId and SKU code for product identification
3. **Bulk Processing**: Efficiently processes multiple assignments in a single request
4. **Error Handling**: Comprehensive error reporting for invalid data
5. **Caching**: Performance optimization through dealer data caching
6. **Validation**: Validates CSV format and required fields
7. **Upsert Logic**: Updates existing assignments or creates new ones
8. **Backward Compatibility**: Maintains support for existing ObjectId usage

## Testing

Use the provided test files to test the implementation:

```javascript
// Test CSV-based bulk assignment
node test-bulk-assign-dealers-csv.js

// Test SKU code support
node test-dealer-assignment-with-sku.js
```

## Migration Notes

- The old JSON-based endpoint functionality has been replaced
- Existing dealer assignments remain unchanged
- New assignments will use the dealer ID internally while accepting legal names in CSV
- All endpoints now support both ObjectId and SKU code for product identification
- Backward compatibility is maintained for the database schema

## Error Scenarios

1. **Invalid CSV Format**: Returns validation errors with row numbers
2. **Missing Dealers**: Returns specific errors for unresolved legal names
3. **Invalid SKU Codes**: Returns errors for non-existent products
4. **File Upload Issues**: Returns appropriate error messages for file problems
5. **ObjectId Casting Errors**: Fixed by supporting SKU code fallback

## Performance Considerations

- Uses bulk MongoDB operations for efficiency
- Implements caching for dealer lookups
- Processes CSV in streaming fashion to handle large files
- Limits file size through multer configuration
- Optimized product lookup with ObjectId/SKU code detection

## Bug Fixes

### ObjectId Casting Error
**Problem:** The error `CastError: Cast to ObjectId failed for value ":" (type string) at path "_id"` was occurring when invalid ObjectIds were passed.

**Solution:** 
- Added automatic detection of ObjectId vs SKU code format
- Implemented fallback to SKU code lookup if ObjectId is invalid
- Updated error messages to provide better context
- Fixed the `assignDealersForProduct` and `manuallyAssignDealer` functions

**Impact:** All dealer assignment endpoints now work seamlessly with both ObjectId and SKU code formats.
