# Pagination Fix Documentation

## Issue Description

The `getProductsByFilters` endpoint was returning an empty array of products when `page=0` was passed, even though pagination metadata was correct. This was happening because:

1. The default value for `page` was set to `'0'`
2. When `page=0` was passed, `pageNumber` became `0`
3. The `skip` calculation `(pageNumber - 1) * limitNumber` resulted in a negative value
4. MongoDB's `.slice(skip, skip + limitNumber)` with a negative `skip` value returned an empty array

## Root Cause

```javascript
// Before (problematic code)
let { page = '0' } = req.query;
let pageNumber = page?parseInt(page, 10):0;
const skip = (pageNumber - 1) * limitNumber; // When pageNumber=0, skip becomes negative
```

## Solution

Modified the pagination logic to ensure `pageNumber` is always at least 1 before calculating `skip`:

```javascript
// After (fixed code)
let { page = '1' } = req.query;
let pageNumber = parseInt(page, 10) || 1;
// Ensure pageNumber is at least 1
pageNumber = Math.max(1, pageNumber);
const skip = (pageNumber - 1) * limitNumber; // Now skip is always >= 0
```

## Key Changes

1. **Default value**: Changed from `'0'` to `'1'` for better UX
2. **Page number parsing**: Used `parseInt(page, 10) || 1` to handle invalid values
3. **Minimum page validation**: Added `Math.max(1, pageNumber)` to ensure page number is never less than 1
4. **Removed unnecessary increment**: Removed `pageNumber = pageNumber + 1;` since pagination metadata calculation was already correct

## Test Cases

The fix handles the following scenarios:

- `page=0` → Returns first page (page 1)
- `page=1` → Returns first page
- `page=2` → Returns second page
- `page=''` → Defaults to page 1
- `page='invalid'` → Defaults to page 1
- `page='-1'` → Defaults to page 1

## Testing

Run the test script to verify the fix:

```bash
cd services/product-service
node test-pagination-fix.js
```

## Expected Behavior

- When `page=0` is passed, the endpoint should return the first page of products
- Pagination metadata should show `currentPage: 1`
- Products array should not be empty (assuming there are approved products in the database)
- The `skip` value should be `0` for the first page

## Files Modified

- `services/product-service/src/controller/product.js` - Fixed pagination logic in `getProductsByFilters`
- `services/product-service/test-pagination-fix.js` - Test script to verify the fix
- `services/product-service/PAGINATION_FIX_DOCUMENTATION.md` - This documentation
