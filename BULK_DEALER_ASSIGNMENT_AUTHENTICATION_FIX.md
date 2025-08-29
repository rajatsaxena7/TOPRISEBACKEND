# Bulk Dealer Assignment Authentication Fix

## Issue Description

The bulk dealer assignment endpoint was failing with a 401 error when trying to fetch dealers by legal name. The error occurred specifically with legal names containing spaces (e.g., "rAJAT FIRM PVT. LTD.").

```
[2025-08-29T17:50:14.869Z] ERROR: Error fetching dealer by legal_name rAJAT FIRM PVT. LTD.: Request failed with status code 401
```

## Root Cause

The `fetchDealerByLegalName()` function in `services/product-service/src/controller/product.js` was making API calls to the user service without proper authentication headers. This caused the user service to reject the requests with a 401 status code.

## Solution

### 1. Updated `fetchDealerByLegalName()` Function

**File:** `services/product-service/src/controller/product.js`

**Changes:**
- Added `authorizationHeader` parameter to the function signature
- Modified the function to include the authorization header in the API request to the user service

```javascript
// Before
async function fetchDealerByLegalName(legalName) {
  // ...
  const response = await axios.get(
    `http://user-service:5001/api/users/dealers`,
    {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  // ...
}

// After
async function fetchDealerByLegalName(legalName, authorizationHeader) {
  // ...
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (authorizationHeader) {
    headers.Authorization = authorizationHeader;
  }

  const response = await axios.get(
    `http://user-service:5001/api/users/dealers`,
    {
      timeout: 5000,
      headers,
    }
  );
  // ...
}
```

### 2. Updated `fetchDealerDetails()` Function

**File:** `services/product-service/src/controller/product.js`

**Changes:**
- Added `authorizationHeader` parameter to the function signature
- Modified the function to include the authorization header in the API request

```javascript
// Before
async function fetchDealerDetails(dealerId) {
  // ...
  const response = await axios.get(
    `http://user-service:5001/api/users/dealer/${dealerId}`,
    {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  // ...
}

// After
async function fetchDealerDetails(dealerId, authorizationHeader) {
  // ...
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (authorizationHeader) {
    headers.Authorization = authorizationHeader;
  }

  const response = await axios.get(
    `http://user-service:5001/api/users/dealer/${dealerId}`,
    {
      timeout: 5000,
      headers,
    }
  );
  // ...
}
```

### 3. Updated All Function Calls

**File:** `services/product-service/src/controller/product.js`

**Changes:**
- Updated all calls to `fetchDealerByLegalName()` and `fetchDealerDetails()` to pass the authorization header
- Extracted the authorization header from the request: `const authorizationHeader = req.headers.authorization;`

**Locations Updated:**
1. `bulkAssignDealers()` function - line 3918
2. `getProductById()` function - line 2048
3. `getAssignedDealers()` function - line 2146
4. `getProductDealerDetails()` function - line 4073

## Legal Name Handling

The function already properly handles legal names with spaces through:

1. **CSV Parsing:** The `fastcsv` library is configured with `trim: true` to handle whitespace
2. **String Normalization:** Legal names are trimmed when extracted from CSV rows
3. **Case-Insensitive Comparison:** The dealer lookup uses `toLowerCase()` and `trim()` for comparison

```javascript
const dealer = dealers.find(d => 
  d.legal_name && d.legal_name.toLowerCase().trim() === legalName.toLowerCase().trim()
);
```

## Testing

A test script has been updated (`test-bulk-assign-dealers-csv.js`) to verify:
1. Dealer lookup with spaces in legal names
2. Bulk dealer assignment with CSV containing legal names with spaces

## Impact

This fix resolves the 401 authentication errors when:
- Bulk assigning dealers via CSV
- Fetching dealer details for products
- Looking up dealers by legal name

The fix ensures that all internal API calls to the user service include proper authentication headers.

## Files Modified

1. `services/product-service/src/controller/product.js`
2. `test-bulk-assign-dealers-csv.js` (updated for testing)

## Related Endpoints

- `POST /products/v1/assign/dealer/bulk` - Bulk dealer assignment
- `GET /products/v1/products/:id` - Get product with dealer details
- `GET /products/v1/products/:id/availableDealers` - Get available dealers for a product
- `GET /products/v1/products/:id/dealer/:dealerId` - Get specific dealer details for a product
