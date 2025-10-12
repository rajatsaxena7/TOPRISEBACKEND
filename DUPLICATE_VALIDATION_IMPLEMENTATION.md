# Duplicate Validation Implementation for Product Service

## Overview
Implemented comprehensive duplicate validation for Brands, Models, Variants, Categories, and SubCategories to prevent duplicate entries and return proper error messages when duplicates are attempted.

## Purpose
- Ensure data integrity by preventing duplicate entries
- Provide clear, user-friendly error messages
- Return proper HTTP status codes (409 Conflict)
- Log duplicate attempts for monitoring

## Implementation Summary

### 1. Brand Duplicate Validation

**File**: `services/product-service/src/controller/brand.js`

**Unique Fields**:
- `brand_name` - Must be unique
- `brand_code` - Must be unique

**Validation Logic**:
```javascript
const existingBrand = await Brand.findOne({
  $or: [
    { brand_name: brand_name },
    { brand_code: brand_code }
  ]
});

if (existingBrand) {
  if (existingBrand.brand_name === brand_name) {
    return sendError(res, `Brand with name "${brand_name}" already exists`, 409);
  }
  if (existingBrand.brand_code === brand_code) {
    return sendError(res, `Brand with code "${brand_code}" already exists`, 409);
  }
}
```

**Error Responses**:
- `409 Conflict` - Brand with name "X" already exists
- `409 Conflict` - Brand with code "Y" already exists

---

### 2. Model Duplicate Validation

**File**: `services/product-service/src/controller/model.js`

**Unique Fields**:
- `model_name` - Must be unique
- `model_code` - Must be unique

**Validation Logic**:
```javascript
const existingModel = await Model.findOne({
  $or: [
    { model_name: model_name },
    { model_code: model_code }
  ]
});

if (existingModel) {
  if (existingModel.model_name === model_name) {
    return sendError(res, `Model with name "${model_name}" already exists`, 409);
  }
  if (existingModel.model_code === model_code) {
    return sendError(res, `Model with code "${model_code}" already exists`, 409);
  }
}
```

**Error Responses**:
- `409 Conflict` - Model with name "X" already exists
- `409 Conflict` - Model with code "Y" already exists

---

### 3. Variant Duplicate Validation

**File**: `services/product-service/src/controller/variant.js`

**Unique Fields**:
- `variant_name` - Must be unique
- `variant_code` - Must be unique

**Validation Logic**:
```javascript
const existingVariant = await Variant.findOne({
  $or: [
    { variant_name: variant_name },
    { variant_code: variant_code }
  ]
});

if (existingVariant) {
  if (existingVariant.variant_name === variant_name) {
    return sendError(res, `Variant with name "${variant_name}" already exists`, 409);
  }
  if (existingVariant.variant_code === variant_code) {
    return sendError(res, `Variant with code "${variant_code}" already exists`, 409);
  }
}
```

**Error Responses**:
- `409 Conflict` - Variant with name "X" already exists
- `409 Conflict` - Variant with code "Y" already exists

---

### 4. Category Duplicate Validation

**File**: `services/product-service/src/controller/category.js`

**Unique Fields**:
- `category_code` - Must be unique
- Note: `category_name` is allowed to be duplicate

**Validation Logic**:
```javascript
const existingCategory = await Category.findOne({ category_code: category_code });

if (existingCategory) {
  logger.warn(`Duplicate category code attempted: ${category_code}`);
  return sendError(res, `Category with code "${category_code}" already exists`, 409);
}
```

**Error Response**:
- `409 Conflict` - Category with code "X" already exists

---

### 5. SubCategory Duplicate Validation

**File**: `services/product-service/src/controller/subcategory.js`

**Unique Fields**:
- `subcategory_code` - Must be unique
- Note: `subcategory_name` is allowed to be duplicate

**Validation Logic**:
```javascript
const existingSubCategory = await Subcategory.findOne({ subcategory_code: subcategory_code });

if (existingSubCategory) {
  logger.warn(`Duplicate subcategory code attempted: ${subcategory_code}`);
  return sendError(res, `SubCategory with code "${subcategory_code}" already exists`, 409);
}
```

**Error Response**:
- `409 Conflict` - SubCategory with code "X" already exists

---

## Database Schema Unique Constraints

### Brand Model
```javascript
const brandSchema = new mongoose.Schema({
  brand_name: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  brand_code: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  // ... other fields
});
```

### Model Schema
```javascript
const modelSchema = new mongoose.Schema({
  model_name: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  model_code: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  // ... other fields
});
```

### Variant Model
```javascript
const variantSchema = new mongoose.Schema({
  variant_name: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  variant_code: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  // ... other fields
});
```

### Category Model
```javascript
const CategorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
    // No unique constraint - allows duplicates
  },
  category_code: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  // ... other fields
});
```

### SubCategory Model
```javascript
const SubcategorySchema = new mongoose.Schema({
  subcategory_name: {
    type: String,
    required: true,
    // No unique constraint - allows duplicates
  },
  subcategory_code: {
    type: String,
    required: true,
    unique: true,  // ✅ Database level constraint
  },
  // ... other fields
});
```

---

## HTTP Status Codes Used

### 409 Conflict
Used for all duplicate errors to indicate that the request conflicts with the current state of the resource.

**Why 409?**
- Standard HTTP status code for conflicts
- Indicates the request couldn't be processed due to a conflict
- Different from 400 Bad Request (malformed request)
- Different from 422 Unprocessable Entity (validation failure)

---

## Error Response Format

All duplicate errors follow the standard error response format:

```json
{
  "success": false,
  "message": "Brand with name \"Toyota\" already exists"
}
```

**HTTP Status**: `409 Conflict`

---

## Logging

All duplicate attempts are logged for monitoring:

```javascript
logger.warn(`Duplicate brand name attempted: ${brand_name}`);
logger.warn(`Duplicate model code attempted: ${model_code}`);
logger.warn(`Duplicate variant name attempted: ${variant_name}`);
logger.warn(`Duplicate category code attempted: ${category_code}`);
logger.warn(`Duplicate subcategory code attempted: ${subcategory_code}`);
```

**Log Level**: `WARN` - Indicates potentially problematic behavior without being an error

---

## Testing

### Test Brand Duplicate

```bash
# Create a brand
curl -X POST "http://localhost:5001/api/brands" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Toyota",
    "brand_code": "TYT001",
    "type": "type_id",
    "created_by": "user_id",
    "updated_by": "user_id"
  }'

# Try to create duplicate (should fail with 409)
curl -X POST "http://localhost:5001/api/brands" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "Toyota",
    "brand_code": "TYT002",
    "type": "type_id",
    "created_by": "user_id",
    "updated_by": "user_id"
  }'

# Expected Response:
# {
#   "success": false,
#   "message": "Brand with name \"Toyota\" already exists"
# }
# Status: 409 Conflict
```

### Test Model Duplicate

```bash
# Try to create duplicate model
curl -X POST "http://localhost:5001/api/models" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "model_name=Camry" \
  -F "model_code=CAM001" \
  -F "brand_ref=brand_id" \
  -F "created_by=user_id" \
  -F "model_image=@image.jpg"

# Expected Response (if duplicate):
# {
#   "success": false,
#   "message": "Model with name \"Camry\" already exists"
# }
# Status: 409 Conflict
```

### Test Variant Duplicate

```bash
# Try to create duplicate variant
curl -X POST "http://localhost:5001/api/variants" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_name": "2.5L Premium",
    "variant_code": "VAR001",
    "variant_Description": "Premium variant",
    "model": "model_id",
    "created_by": "user_id"
  }'

# Expected Response (if duplicate):
# {
#   "success": false,
#   "message": "Variant with code \"VAR001\" already exists"
# }
# Status: 409 Conflict
```

### Test Category Duplicate

```bash
# Try to create duplicate category
curl -X POST "http://localhost:5001/api/category" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "category_name=Electronics" \
  -F "category_code=ELEC001" \
  -F "type=type_id" \
  -F "created_by=user_id" \
  -F "updated_by=user_id" \
  -F "category_image=@image.jpg"

# Expected Response (if duplicate code):
# {
#   "success": false,
#   "message": "Category with code \"ELEC001\" already exists"
# }
# Status: 409 Conflict
```

### Test SubCategory Duplicate

```bash
# Try to create duplicate subcategory
curl -X POST "http://localhost:5001/api/subcategory" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "subcategory_name=Laptops" \
  -F "subcategory_code=LAP001" \
  -F "category_ref=category_id" \
  -F "created_by=user_id" \
  -F "updated_by=user_id" \
  -F "subcategory_image=@image.jpg"

# Expected Response (if duplicate code):
# {
#   "success": false,
#   "message": "SubCategory with code \"LAP001\" already exists"
# }
# Status: 409 Conflict
```

---

## Frontend Integration

### Handling Duplicate Errors

```javascript
// Example: Creating a brand
try {
  const response = await fetch('/api/brands', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      brand_name: 'Toyota',
      brand_code: 'TYT001',
      type: typeId,
      created_by: userId,
      updated_by: userId
    })
  });

  const data = await response.json();

  if (response.status === 409) {
    // Duplicate error
    alert(data.message); // "Brand with name \"Toyota\" already exists"
    // Show user-friendly message
    // Highlight the conflicting field
  } else if (!response.ok) {
    // Other errors
    alert('An error occurred');
  } else {
    // Success
    alert('Brand created successfully');
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### React Example

```jsx
const handleCreateBrand = async (formData) => {
  try {
    const response = await createBrand(formData);
    
    if (response.success) {
      toast.success('Brand created successfully');
      navigate('/brands');
    }
  } catch (error) {
    if (error.status === 409) {
      // Duplicate error
      toast.error(error.message);
      
      // Highlight the conflicting field
      if (error.message.includes('name')) {
        setFieldError('brand_name', error.message);
      } else if (error.message.includes('code')) {
        setFieldError('brand_code', error.message);
      }
    } else {
      toast.error('Failed to create brand');
    }
  }
};
```

---

## Best Practices

### 1. Check Before Creating
Always check for duplicates before attempting to create a resource:

```javascript
// Good: Check first
const existing = await Brand.findOne({ brand_code: code });
if (existing) {
  return sendError(res, 'Duplicate found', 409);
}
const newBrand = await Brand.create(data);
```

### 2. Use Specific Error Messages
Provide clear information about which field is duplicate:

```javascript
// Good
return sendError(res, `Brand with name "${brand_name}" already exists`, 409);

// Bad
return sendError(res, "Duplicate brand", 409);
```

### 3. Log Duplicate Attempts
Log all duplicate attempts for monitoring:

```javascript
logger.warn(`Duplicate brand name attempted: ${brand_name}`);
```

### 4. Return Proper Status Code
Always use 409 Conflict for duplicates:

```javascript
return sendError(res, message, 409);  // ✅ Correct
return sendError(res, message, 400);  // ❌ Wrong
```

---

## Performance Considerations

### 1. Database Indexes
All unique fields have database indexes:
- Enables fast duplicate checking
- Enforces uniqueness at database level
- Prevents race conditions

### 2. Query Optimization
Use `findOne` instead of `find`:

```javascript
// Optimized
const existing = await Brand.findOne({ brand_code: code });

// Less efficient
const existing = await Brand.find({ brand_code: code });
```

### 3. Compound Queries
Check multiple fields in one query when possible:

```javascript
// Efficient
const existing = await Brand.findOne({
  $or: [
    { brand_name: name },
    { brand_code: code }
  ]
});

// Less efficient
const byName = await Brand.findOne({ brand_name: name });
const byCode = await Brand.findOne({ brand_code: code });
```

---

## Migration Notes

### Existing Data
If you have existing data with duplicates, you need to clean it first:

```javascript
// Find duplicates
db.brands.aggregate([
  { $group: { _id: "$brand_code", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
]);

// Remove duplicates (keep the first one)
// Be careful with this operation!
```

### Adding Indexes
If indexes don't exist, create them:

```javascript
// In MongoDB
db.brands.createIndex({ brand_name: 1 }, { unique: true });
db.brands.createIndex({ brand_code: 1 }, { unique: true });
```

---

## Common Issues & Solutions

### Issue 1: Mongoose Error E11000
If you see `E11000 duplicate key error`:
- The database caught a duplicate before the application-level check
- This is actually good - it means the database constraint is working
- The application-level check prevents this error from reaching the database

### Issue 2: Case Sensitivity
Brand names "Toyota" and "toyota" are treated as different:
- Consider adding case-insensitive comparison if needed
- Use lowercase/uppercase before checking

```javascript
// Case-insensitive check
const existing = await Brand.findOne({
  brand_name: { $regex: new RegExp(`^${brand_name}$`, 'i') }
});
```

### Issue 3: Trimming Whitespace
"Toyota " and "Toyota" are different:
- Always trim input before checking

```javascript
const brand_name = req.body.brand_name.trim();
const existing = await Brand.findOne({ brand_name });
```

---

## Summary

### Files Modified
1. ✅ `services/product-service/src/controller/brand.js`
2. ✅ `services/product-service/src/controller/model.js`
3. ✅ `services/product-service/src/controller/variant.js`
4. ✅ `services/product-service/src/controller/category.js`
5. ✅ `services/product-service/src/controller/subcategory.js`

### Unique Constraints
| Entity | Unique Fields |
|--------|---------------|
| Brand | brand_name, brand_code |
| Model | model_name, model_code |
| Variant | variant_name, variant_code |
| Category | category_code only |
| SubCategory | subcategory_code only |

### Status Code
- **409 Conflict** - Used for all duplicate errors

### Error Messages
- User-friendly
- Specific about which field is duplicate
- Includes the duplicate value

### Logging
- All duplicate attempts logged at WARN level
- Includes the duplicate value for tracking

---

## Conclusion

The duplicate validation implementation ensures:
- ✅ Data integrity
- ✅ Clear error messages
- ✅ Proper HTTP status codes
- ✅ Comprehensive logging
- ✅ Database-level constraints
- ✅ Application-level validation
- ✅ User-friendly error responses

All brands, models, variants, categories, and subcategories are now protected from duplicate entries!
