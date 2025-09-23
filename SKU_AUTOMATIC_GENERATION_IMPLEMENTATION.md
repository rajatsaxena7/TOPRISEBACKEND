# Automatic SKU Generation Implementation

## Overview
Implemented automatic SKU generation for product creation with the format: `TOPT1000000` for two-wheelers and `TOPF1000000` for four-wheelers.

## SKU Format
- **Format**: `TOPT1000000` / `TOPF1000000`
- **Explanation**: 
  - First 3 characters: `TOP` (constant)
  - 4th character: `T` for two-wheelers, `F` for four-wheelers
  - Last 7 digits: Starting from `1000000` and incrementing by 1 for each product

## Changes Made

### 1. Updated SKU Generation Function (`services/product-service/src/controller/product.js`)

**Before:**
```javascript
let skuCounter = 1;
const genSKU = (name = "") =>
  `TOP${name.slice(0, 3).toUpperCase()}${String(skuCounter++).padStart(3, "0")}`;
```

**After:**
```javascript
// Global counters for different vehicle types
let twoWheelerCounter = 1000000;
let fourWheelerCounter = 1000000;

const genSKU = async (categoryId) => {
  try {
    // Get the category to determine vehicle type
    const category = await Category.findById(categoryId).populate('type');
    if (!category) {
      throw new Error("Category not found");
    }

    // Determine vehicle type based on category's type
    const vehicleType = category.type.type_name.toLowerCase();
    let vehicleCode = 'T'; // Default to two-wheeler
    let counter = twoWheelerCounter;
    
    if (vehicleType.includes('four') || vehicleType.includes('4') || vehicleType.includes('car') || vehicleType.includes('auto')) {
      vehicleCode = 'F'; // Four-wheeler
      counter = fourWheelerCounter;
    }

    // Get the highest existing SKU number for this vehicle type
    const existingSkus = await Product.find({
      sku_code: { $regex: `^TOP${vehicleCode}\\d+$` }
    }).select('sku_code').sort({ sku_code: -1 });

    let nextNumber = counter;
    if (existingSkus.length > 0) {
      // Extract the number from the highest SKU and increment
      const highestSku = existingSkus[0].sku_code;
      const currentNumber = parseInt(highestSku.substring(4)); // Remove 'TOPX' prefix
      nextNumber = currentNumber + 1;
    }

    // Update the appropriate counter
    if (vehicleCode === 'T') {
      twoWheelerCounter = nextNumber + 1;
    } else {
      fourWheelerCounter = nextNumber + 1;
    }

    return `TOP${vehicleCode}${nextNumber}`;
  } catch (error) {
    logger.error(`SKU generation error: ${error.message}`);
    throw error;
  }
};
```

### 2. Updated Single Product Creation Functions

#### `createProductSingle` Function
- Added automatic SKU generation based on category
- Removes `sku_code` from request data if provided
- Generates SKU using the new format before creating the product

#### `createProductSingleByDealer` Function
- Same updates as above for dealer-created products

### 3. Updated Bulk Upload Functions

#### `bulkUploadProducts` Function
- Converted from `forEach` to `for` loop to handle async SKU generation
- Updated to use category-based SKU generation
- Added proper error handling for SKU generation failures

#### `bulkUploadProductsByDealer` Function
- Same updates as above for bulk dealer uploads

## Key Features

### 1. Vehicle Type Detection
The system determines vehicle type by checking the category's type name:
- **Two-wheeler**: Default (when no four-wheeler keywords found)
- **Four-wheeler**: When category type contains "four", "4", "car", or "auto"

### 2. Sequential SKU Generation
- Each vehicle type maintains its own counter
- SKUs are generated sequentially: `TOPT1000000`, `TOPT1000001`, etc.
- Database is checked for existing SKUs to ensure no duplicates

### 3. Automatic SKU Assignment
- SKU field is automatically generated and assigned
- Manual SKU provided in requests is ignored
- No need to provide SKU in product creation requests

### 4. Error Handling
- Proper error handling for category not found
- SKU generation failures are logged and reported
- Bulk upload continues processing other products if one fails

## API Changes

### Request Body Changes
**Before:**
```json
{
  "product_name": "Product Name",
  "sku_code": "MANUAL123",  // Required field
  "category": "category_id",
  // ... other fields
}
```

**After:**
```json
{
  "product_name": "Product Name",
  // sku_code field is no longer required or accepted
  "category": "category_id",
  // ... other fields
}
```

### Response Changes
**Before:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "product_name": "Product Name",
    "sku_code": "MANUAL123",
    // ... other fields
  }
}
```

**After:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "product_name": "Product Name",
    "sku_code": "TOPT1000000",  // Auto-generated
    // ... other fields
  }
}
```

## Testing

A test script `test-sku-generation.js` has been created to verify:
1. Automatic SKU generation without providing SKU
2. Sequential SKU incrementing
3. Ignoring manual SKU provided in requests
4. Proper vehicle type detection

## Database Considerations

### Existing Products
- Existing products with manual SKUs will remain unchanged
- New products will use the automatic generation system
- No migration needed for existing data

### SKU Uniqueness
- SKUs are guaranteed to be unique within each vehicle type
- Database constraint ensures overall uniqueness
- System handles concurrent creation attempts

## Deployment Notes

1. **No Database Migration Required**: The changes are backward compatible
2. **Environment Variables**: No new environment variables needed
3. **Dependencies**: No new dependencies added
4. **Backward Compatibility**: Existing API calls without SKU will work seamlessly

## Usage Examples

### Creating a Two-Wheeler Product
```javascript
const productData = {
  product_name: "Motorcycle Brake Pad",
  category: "two-wheeler-category-id",
  // ... other required fields
  // No need to provide sku_code
};

// Result: SKU will be generated as TOPT1000000, TOPT1000001, etc.
```

### Creating a Four-Wheeler Product
```javascript
const productData = {
  product_name: "Car Engine Oil Filter",
  category: "four-wheeler-category-id",
  // ... other required fields
  // No need to provide sku_code
};

// Result: SKU will be generated as TOPF1000000, TOPF1000001, etc.
```

## Benefits

1. **Consistency**: All SKUs follow the same format
2. **Uniqueness**: Guaranteed unique SKUs for each vehicle type
3. **Simplicity**: No need to manually specify SKUs
4. **Scalability**: System can handle large numbers of products
5. **Maintainability**: Centralized SKU generation logic
