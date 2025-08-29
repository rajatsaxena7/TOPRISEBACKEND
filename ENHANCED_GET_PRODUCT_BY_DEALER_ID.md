# Enhanced getProductByDealerId Function

## Overview

The `getProductByDealerId` function in the product service has been enhanced to support fetching products by both `dealerId` and `userId`. This allows for more flexible product retrieval based on either the dealer's ID or the user ID associated with the dealer.

## Changes Made

### 1. User Service - New Internal Endpoint

**File:** `services/user-service/src/routes/user.js`

Added a new internal endpoint to fetch dealers by `userId`:

```javascript
/**
 * @route GET /api/users/internal/dealers/user/:userId
 * @desc Get dealers by userId for internal service communication (no auth required)
 * @access Internal services only
 */
router.get("/internal/dealers/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const dealers = await Dealer.find({ user_id: userId }).populate(
      "user_id",
      "email phone_Number role"
    );
    
    if (!dealers || dealers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "No dealers found for this user" 
      });
    }

    return res.json({
      success: true,
      data: dealers,
      message: "Dealers fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching dealers by userId:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch dealers by userId" 
    });
  }
});
```

### 2. Product Service - New Helper Function

**File:** `services/product-service/src/controller/product.js`

Added a new helper function to fetch dealers by `userId`:

```javascript
async function fetchDealersByUserId(userId, authorizationHeader) {
  try {
    const cacheKey = `dealers_by_user_${userId}`;
    const cachedDealers = await cacheGet(cacheKey);
    if (cachedDealers) {
      return cachedDealers;
    }
    const headers = {
      "Content-Type": "application/json",
    };
    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }
    const response = await axios.get(
      `http://user-service:5001/api/users/internal/dealers/user/${userId}`,
      {
        timeout: 5000,
        headers,
      }
    );
    const dealers = response.data.data;
    await cacheSet(cacheKey, dealers, 300);
    return dealers;
  } catch (error) {
    console.error(`Error fetching dealers by userId ${userId}:`, error.message);
    return [];
  }
}
```

### 3. Enhanced getProductByDealerId Function

**File:** `services/product-service/src/controller/product.js`

The main function has been enhanced to support both `dealerId` and `userId`:

```javascript
exports.getProductByDealerId = async (req, res) => {
  try {
    const { dealerId } = req.params;
    const { userId } = req.query;

    if (!dealerId && !userId) {
      return res.status(400).json({ message: "Either dealerId or userId is required" });
    }

    let dealerIds = [];

    if (dealerId) {
      // If dealerId is provided, use it directly
      dealerIds = [dealerId];
    } else if (userId) {
      // If userId is provided, fetch dealer IDs from user service
      const authorizationHeader = req.headers.authorization;
      const dealers = await fetchDealersByUserId(userId, authorizationHeader);
      
      if (!dealers || dealers.length === 0) {
        return res.status(404).json({ message: "No dealers found for this user" });
      }
      
      // Extract dealer IDs from the dealers array
      dealerIds = dealers.map(dealer => dealer.dealerId || dealer._id);
    }

    // Find products that have any of the dealer IDs in their available_dealers
    const products = await Product.find({
      "available_dealers.dealers_Ref": { $in: dealerIds },
    })
      .populate("brand category sub_category model variant year_range")
      .lean();

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found for the specified dealer(s)" });
    }

    return sendSuccess(res, products, "Products fetched successfully");
  } catch (err) {
    console.error("getProductByDealerId error:", err);
    return sendError(res, err.message || "Internal server error");
  }
};
```

### 4. Updated Routes

**File:** `services/product-service/src/route/product.js`

Added support for both parameterized and non-parameterized routes:

```javascript
// Route with dealerId parameter
router.get(
  "/get-products-by-dealer/:dealerId",
  productController.getProductByDealerId
);

// Route without parameters (for userId query parameter)
router.get(
  "/get-products-by-dealer",
  productController.getProductByDealerId
);
```

## API Usage

### Getting Products by Dealer ID

```http
GET /products/v1/get-products-by-dealer/:dealerId
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "sku_code": "SKU123",
      "product_name": "Product Name",
      "available_dealers": [...],
      "brand": {...},
      "category": {...}
    }
  ],
  "message": "Products fetched successfully"
}
```

### Getting Products by User ID

```http
GET /products/v1/get-products-by-dealer?userId=:userId
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "sku_code": "SKU123",
      "product_name": "Product Name",
      "available_dealers": [...],
      "brand": {...},
      "category": {...}
    }
  ],
  "message": "Products fetched successfully"
}
```

### Error Responses

**Missing Parameters:**
```json
{
  "success": false,
  "message": "Either dealerId or userId is required"
}
```

**No Dealers Found:**
```json
{
  "success": false,
  "message": "No dealers found for this user"
}
```

**No Products Found:**
```json
{
  "success": false,
  "message": "No products found for the specified dealer(s)"
}
```

## Features

1. **Backward Compatibility:** Existing functionality with `dealerId` parameter remains unchanged
2. **New User ID Support:** Can now fetch products using `userId` query parameter
3. **Caching:** Both dealer and user data are cached for 5 minutes to improve performance
4. **Error Handling:** Comprehensive error handling for various scenarios
5. **Authentication:** Proper authentication header propagation for inter-service calls
6. **Multiple Dealers:** Supports users with multiple dealer accounts

## Testing

Use the provided test script `test-get-product-by-user-id.js` to verify the functionality:

```bash
node test-get-product-by-user-id.js
```

Make sure to:
1. Replace `YOUR_SUPER_ADMIN_JWT_TOKEN_HERE` with an actual JWT token
2. Replace `YOUR_TEST_DEALER_ID` with an actual dealer ID
3. Replace `YOUR_TEST_USER_ID` with an actual user ID

## Benefits

1. **Flexibility:** Can now fetch products by either dealer ID or user ID
2. **User-Centric:** Better support for user-based queries
3. **Scalability:** Supports users with multiple dealer accounts
4. **Performance:** Efficient caching and error handling
5. **Maintainability:** Clean separation of concerns with helper functions
