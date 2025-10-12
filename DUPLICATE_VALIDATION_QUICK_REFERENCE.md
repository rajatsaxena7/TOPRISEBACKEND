# Duplicate Validation - Quick Reference

## Summary
All brands, models, variants, categories, and subcategories now have duplicate validation that returns proper error messages.

## Unique Constraints

| Entity | Unique Fields | Status Code | Example Error |
|--------|---------------|-------------|---------------|
| **Brand** | `brand_name`, `brand_code` | 409 | `Brand with name "Toyota" already exists` |
| **Model** | `model_name`, `model_code` | 409 | `Model with code "CAM001" already exists` |
| **Variant** | `variant_name`, `variant_code` | 409 | `Variant with name "2.5L" already exists` |
| **Category** | `category_code` only | 409 | `Category with code "ELEC001" already exists` |
| **SubCategory** | `subcategory_code` only | 409 | `SubCategory with code "LAP001" already exists` |

## Error Response Format

```json
{
  "success": false,
  "message": "Brand with name \"Toyota\" already exists"
}
```

**HTTP Status**: `409 Conflict`

## Files Modified

1. `services/product-service/src/controller/brand.js`
2. `services/product-service/src/controller/model.js`
3. `services/product-service/src/controller/variant.js`
4. `services/product-service/src/controller/category.js`
5. `services/product-service/src/controller/subcategory.js`

## How It Works

### Before Creating
Each controller now checks for duplicates **before** attempting to create:

```javascript
// Example: Brand
const existingBrand = await Brand.findOne({
  $or: [
    { brand_name: brand_name },
    { brand_code: brand_code }
  ]
});

if (existingBrand) {
  // Return 409 error with specific message
  return sendError(res, `Brand with name "${brand_name}" already exists`, 409);
}

// If no duplicate, proceed with creation
const newBrand = await Brand.create({ ... });
```

## Frontend Handling

```javascript
try {
  const response = await createBrand(data);
} catch (error) {
  if (error.status === 409) {
    // Duplicate error
    alert(error.message); // User-friendly message
  }
}
```

## Testing

```bash
# Try creating duplicate
curl -X POST "http://localhost:5001/api/brands" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Toyota",
    "brand_code": "TYT001",
    "type": "type_id",
    "created_by": "user_id",
    "updated_by": "user_id"
  }'

# Second attempt with same name/code will return:
# Status: 409
# Message: "Brand with name \"Toyota\" already exists"
```

## Benefits

✅ **Data Integrity** - Prevents duplicate entries  
✅ **Clear Errors** - User-friendly error messages  
✅ **Proper Status Codes** - 409 Conflict for duplicates  
✅ **Logging** - All duplicate attempts are logged  
✅ **Database Protection** - Both app and DB level validation  

## Important Notes

- **Category** and **SubCategory**: Only codes must be unique (names can duplicate)
- **Brand**, **Model**, **Variant**: Both name and code must be unique
- All checks happen **before** database insert
- Duplicate attempts are logged at **WARN** level
- Status code **409** indicates conflict with existing resource
