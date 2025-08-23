# Audit Logging Controller Integration Guide

## How the System Gets Actions and Logs

The audit logging system works through **two main mechanisms**:

### 1. **Automatic Middleware Logging** (Most Common)
The `AuditLogger.createMiddleware()` (and service-specific versions) automatically captures:

- **Request data**: URL, method, query params, body
- **Response data**: Status code, response body  
- **User context**: From `req.user` (populated by `authMiddleware`)
- **Timestamps**: When the action occurred

**How it works:**
```javascript
// In your routes (already implemented)
router.get('/products', optionalAuth, ProductAuditLogger.createMiddleware(), productController.getProducts);
```

The middleware intercepts `res.send()` and `res.json()` calls, then automatically logs the action.

### 2. **Manual Controller Logging** (For Specific Actions)
You can manually log specific actions within your controller methods when you need more detailed information.

## How to Update Controllers for Desired Logs

### **Step 1: Import the Audit Logger**

Add this import to your controller files:

```javascript
// For Product Service
const { ProductAuditLogger } = require('../utils/auditLogger');

// For User Service  
const { UserAuditLogger } = require('../utils/auditLogger');

// For Order Service
const { AuditLogger } = require('../utils/auditLogger');
```

### **Step 2: Add Manual Logging to Key Actions**

Here are examples of how to add manual logging to your existing controllers:

#### **Product Service Examples:**

**1. Product Creation:**
```javascript
exports.createProductSingle = async (req, res) => {
  try {
    const data = req.body;
    const imageUrls = [];
    
    // ... existing image upload logic ...
    
    const newProduct = await Product.create(productPayload);
    
    // 🔥 ADD THIS: Manual audit logging
    if (req.user) {
      await ProductAuditLogger.log({
        action: 'PRODUCT_CREATED',
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: req.user.name || req.user.username,
        targetId: newProduct._id,
        targetType: 'Product',
        targetIdentifier: newProduct.sku_code,
        details: {
          productName: newProduct.product_name,
          skuCode: newProduct.sku_code,
          category: newProduct.category,
          brand: newProduct.brand
        },
        oldValues: null,
        newValues: productPayload,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    // ... rest of existing code ...
    
    return sendSuccess(res, newProduct, "Product created successfully");
  } catch (err) {
    logger.error(`❌ Create product error: ${err.message}`);
    return sendError(res, err);
  }
};
```

**2. Product Update:**
```javascript
exports.editProductSingle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const user = req.user?.id || updateData.updated_by || "system";

    const existingProduct = await Product.findById(id);
    if (!existingProduct) return sendError(res, "Product not found", 404);

    // 🔥 ADD THIS: Capture old values for audit
    const oldValues = {
      product_name: existingProduct.product_name,
      selling_price: existingProduct.selling_price,
      mrp_with_gst: existingProduct.mrp_with_gst,
      live_status: existingProduct.live_status,
      Qc_status: existingProduct.Qc_status
    };

    // ... existing update logic ...

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    // 🔥 ADD THIS: Manual audit logging
    if (req.user) {
      await ProductAuditLogger.log({
        action: 'PRODUCT_UPDATED',
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: req.user.name || req.user.username,
        targetId: updatedProduct._id,
        targetType: 'Product',
        targetIdentifier: updatedProduct.sku_code,
        details: {
          updatedFields: Object.keys(updateData),
          productName: updatedProduct.product_name,
          skuCode: updatedProduct.sku_code
        },
        oldValues: oldValues,
        newValues: updateData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // ... rest of existing code ...
    
    return sendSuccess(res, updatedProduct, "Product updated successfully");
  } catch (err) {
    logger.error(`❌ Edit product error: ${err.message}`);
    return sendError(res, err);
  }
};
```

**3. Product Approval/Rejection:**
```javascript
exports.approveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "system";

    const product = await Product.findById(id);
    if (!product) return sendError(res, "Product not found", 404);

    const oldVals = {
      live_status: product.live_status,
      Qc_status: product.Qc_status,
    };

    product.live_status = "Approved";
    product.Qc_status = "Approved";

    await product.save();

    // 🔥 ADD THIS: Manual audit logging
    if (req.user) {
      await ProductAuditLogger.log({
        action: 'PRODUCT_APPROVED',
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: req.user.name || req.user.username,
        targetId: product._id,
        targetType: 'Product',
        targetIdentifier: product.sku_code,
        details: {
          productName: product.product_name,
          skuCode: product.sku_code,
          approvalType: 'QC_Approval'
        },
        oldValues: oldVals,
        newValues: {
          live_status: "Approved",
          Qc_status: "Approved"
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // ... rest of existing code ...
    
    return sendSuccess(res, product, "Product approved");
  } catch (err) {
    logger.error(`approveProduct error: ${err.message}`);
    return sendError(res, err);
  }
};
```

#### **User Service Examples:**

**1. User Creation:**
```javascript
exports.createUser = async (req, res) => {
  try {
    const { email, password, username, phone_Number, role } = req.body;

    // ... existing validation logic ...

    const user = await User.create({
      email,
      password,
      username,
      phone_Number,
      role,
    });

    // 🔥 ADD THIS: Manual audit logging
    if (req.user) {
      await UserAuditLogger.log({
        action: 'USER_CREATED',
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: req.user.name || req.user.username,
        targetId: user._id,
        targetType: 'User',
        targetIdentifier: user.email,
        details: {
          username: user.username,
          role: user.role,
          phoneNumber: user.phone_Number
        },
        oldValues: null,
        newValues: {
          email: user.email,
          username: user.username,
          role: user.role,
          phone_Number: user.phone_Number
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // ... rest of existing code ...
    
    sendSuccess(res, { user, token }, "User created successfully");
  } catch (err) {
    logger.error(`❌ Signup error: ${err.message}`);
    sendError(res, err);
  }
};
```

**2. Role Assignment:**
```javascript
exports.revokeRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get current user data for audit
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return sendError(res, "User not found", 404);
    }

    const oldRole = currentUser.role;
    
    // Update user role
    const user = await User.findByIdAndUpdate(
      id,
      { role: "User" },
      { new: true }
    );
    
    // Update employee role if employee exists
    const employee = await Employee.findOneAndUpdate(
      { user_id: id },
      { role: "User" },
      { new: true }
    );

    // 🔥 ADD THIS: Manual audit logging
    if (req.user) {
      await UserAuditLogger.log({
        action: 'ROLE_REVOKED',
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: req.user.name || req.user.username,
        targetId: user._id,
        targetType: 'User',
        targetIdentifier: user.email,
        details: {
          username: user.username,
          previousRole: oldRole,
          newRole: "User",
          reason: "Role revoked by admin"
        },
        oldValues: { role: oldRole },
        newValues: { role: "User" },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    logger.info(`Revoked role for user: ${id}`);
    sendSuccess(res, { user, employee }, "Role revoked to User");
  } catch (err) {
    logger.error(`Revoke role error: ${err.message}`);
    sendError(res, err);
  }
};
```

**3. Dealer Creation:**
```javascript
exports.createDealer = async (req, res) => {
  try {
    const {
      email,
      password,
      phone_Number,
      legal_name,
      trade_name,
      GSTIN,
      // ... other fields
    } = req.body;

    // ... existing validation and creation logic ...

    const user = await User.create({
      email,
      password: hashedPassword,
      phone_Number,
      role: "Dealer",
    });

    const dealer = await Dealer.create({
      user_id: user._id,
      legal_name,
      trade_name,
      GSTIN,
      // ... other fields
    });

    // 🔥 ADD THIS: Manual audit logging
    if (req.user) {
      await UserAuditLogger.log({
        action: 'DEALER_CREATED',
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: req.user.name || req.user.username,
        targetId: dealer._id,
        targetType: 'Dealer',
        targetIdentifier: dealer.dealerId,
        details: {
          legalName: dealer.legal_name,
          tradeName: dealer.trade_name,
          gstin: dealer.GSTIN,
          userEmail: user.email
        },
        oldValues: null,
        newValues: {
          legal_name: dealer.legal_name,
          trade_name: dealer.trade_name,
          GSTIN: dealer.GSTIN,
          user_id: dealer.user_id
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // ... rest of existing code ...
    
    sendSuccess(res, { user, dealer }, "Dealer created successfully");
  } catch (err) {
    logger.error(`❌ Create dealer error: ${err.message}`);
    sendError(res, err);
  }
};
```

#### **Order Service Examples:**

**1. Order Status Update:**
```javascript
exports.markAsPacked = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { packedBy } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return sendError(res, "Order not found", 404);

    const oldStatus = order.status;
    const oldPackedAt = order.packed_at;

    // ... existing packing logic ...

    order.status = "Packed";
    order.packed_at = new Date();
    order.packed_by = packedBy;
    await order.save();

    // 🔥 ADD THIS: Manual audit logging
    if (req.user) {
      await AuditLogger.log({
        action: 'ORDER_STATUS_UPDATED',
        actorId: req.user.id,
        actorRole: req.user.role,
        actorName: req.user.name || req.user.username,
        targetId: order._id,
        targetType: 'Order',
        targetIdentifier: order.order_id,
        details: {
          orderId: order.order_id,
          previousStatus: oldStatus,
          newStatus: "Packed",
          packedBy: packedBy
        },
        oldValues: { 
          status: oldStatus, 
          packed_at: oldPackedAt 
        },
        newValues: { 
          status: "Packed", 
          packed_at: order.packed_at,
          packed_by: packedBy
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // ... rest of existing code ...
    
    return sendSuccess(res, order, "Order marked as packed");
  } catch (err) {
    logger.error(`markAsPacked error: ${err.message}`);
    return sendError(res, err);
  }
};
```

### **Step 3: Common Audit Actions by Service**

#### **Product Service Actions:**
- `PRODUCT_CREATED`
- `PRODUCT_UPDATED`
- `PRODUCT_DELETED`
- `PRODUCT_APPROVED`
- `PRODUCT_REJECTED`
- `STOCK_UPDATED`
- `PRICE_UPDATED`
- `CATEGORY_ASSIGNED`
- `BULK_OPERATION_STARTED`
- `BULK_OPERATION_COMPLETED`

#### **User Service Actions:**
- `USER_CREATED`
- `USER_UPDATED`
- `USER_DELETED`
- `ROLE_ASSIGNED`
- `ROLE_REVOKED`
- `DEALER_CREATED`
- `DEALER_UPDATED`
- `DEALER_DISABLED`
- `EMPLOYEE_CREATED`
- `LOGIN_ATTEMPT_SUCCESS`
- `LOGIN_ATTEMPT_FAILED`
- `PASSWORD_CHANGED`
- `BANK_DETAILS_UPDATED`

#### **Order Service Actions:**
- `ORDER_CREATED`
- `ORDER_STATUS_UPDATED`
- `ORDER_CANCELLED`
- `PAYMENT_PROCESSED`
- `RETURN_REQUESTED`
- `RETURN_APPROVED`
- `RETURN_REJECTED`
- `SLA_VIOLATION_RECORDED`
- `DEALER_ASSIGNED`

### **Step 4: Best Practices**

1. **Always check for `req.user`** before logging to avoid errors
2. **Capture old values** before making changes
3. **Use descriptive action names** that clearly indicate what happened
4. **Include relevant details** in the `details` field for better context
5. **Log both successful and failed operations** where appropriate
6. **Use consistent field names** across all services

### **Step 5: Testing Your Audit Logs**

After adding manual logging, test your endpoints and check the audit logs:

```bash
# Check audit logs for a specific action
curl -X GET "http://localhost:5001/api/audit/logs?action=PRODUCT_CREATED&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check audit logs for a specific user
curl -X GET "http://localhost:5001/api/audit/logs?actorId=USER_ID&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check audit logs for a specific product
curl -X GET "http://localhost:5001/api/audit/logs?targetId=PRODUCT_ID&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Summary**

The audit logging system provides:
- **Automatic logging** via middleware for all API calls
- **Manual logging** for specific, detailed actions
- **Comprehensive audit trails** across all services
- **Role-based access** to audit data
- **Export capabilities** for reports

By following this guide, you'll have complete visibility into all actions across your system, providing administrators with the history and audit trails they need.
