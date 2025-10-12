# SLA Violation Management Routes Registration

## Issue Identified
The SLA Violation Management routes were created but **not registered** in the `services/order-service/src/index.js` file, making them inaccessible.

## Solution Applied

### Added Route Registration in `index.js`

**File**: `services/order-service/src/index.js`

#### 1. Import Statement Added (Line 91)
```javascript
const slaViolationManagementRoutes = require("./routes/slaViolationManagement");
```

#### 2. Route Registration Added (Lines 104-105)
```javascript
app.use("/api/sla-violations/stats", slaViolationStatsRoutes);
app.use("/api/sla-violations", slaViolationManagementRoutes);
```

**Important**: The order matters! The `/stats` route must come **before** the general `/api/sla-violations` route to avoid path conflicts.

## Route Structure

### SLA Violation Management Routes
**Base Path**: `/api/sla-violations`

Available endpoints from `slaViolationManagement.js`:

1. **Create Manual SLA Violation**
   ```
   POST /api/sla-violations/manual
   ```

2. **Contact Dealer About Violation**
   ```
   POST /api/sla-violations/:violationId/contact-dealer
   ```

3. **Bulk Contact Dealers**
   ```
   POST /api/sla-violations/bulk-contact
   ```

4. **Get SLA Violations with Details**
   ```
   GET /api/sla-violations/detailed
   ```

5. **Get Single Violation Details**
   ```
   GET /api/sla-violations/:violationId/detailed
   ```

6. **Resolve Violation**
   ```
   PATCH /api/sla-violations/:violationId/resolve
   ```

7. **Update Violation**
   ```
   PATCH /api/sla-violations/:violationId
   ```

8. **Delete Violation**
   ```
   DELETE /api/sla-violations/:violationId
   ```

### SLA Violation Stats Routes
**Base Path**: `/api/sla-violations/stats`

Available endpoints from `slaViolationStats.js`:
- Statistics and analytics endpoints

## Path Priority

The routes are registered in this order:

```javascript
app.use("/api/sla-violations/stats", slaViolationStatsRoutes);      // More specific path first
app.use("/api/sla-violations", slaViolationManagementRoutes);        // General path second
```

This ensures that:
- `/api/sla-violations/stats/*` routes are handled by `slaViolationStatsRoutes`
- All other `/api/sla-violations/*` routes are handled by `slaViolationManagementRoutes`

## Manual Notification Route

### Notification Service Routes
The manual notification creation routes are in the **Notification Service** (separate service):

**Service**: `services/notification-service`  
**Base Path**: `/api/notification`

#### Available Notification Routes:

1. **Create Broadcast Notification**
   ```
   POST /api/notification/createBroadcast
   ```
   - Sends notification to all users
   - Access: Super-admin

2. **Create Unicast or Multicast Notification** ⭐ (Manual Notification)
   ```
   POST /api/notification/createUniCastOrMulticast
   ```
   - Sends notification to specific user(s)
   - Access: Super-admin
   - This is the **manual notification creation endpoint**

3. **Get All Notifications**
   ```
   GET /api/notification/
   ```

4. **Get User's All Notifications**
   ```
   GET /api/notification/all_userNotifications/:userId
   ```

5. **Get Notification By ID**
   ```
   GET /api/notification/:id
   ```

6. **Mark as Read**
   ```
   PUT /api/notification/markAsRead/:id
   ```

7. **Mark All as Read**
   ```
   PUT /api/notification/markAsReadAll/:userId
   ```

8. **Delete Notification (User)**
   ```
   PUT /api/notification/markAsUserDelete/:id
   ```

9. **Delete All Notifications (User)**
   ```
   PUT /api/notification/markAsUserDeleteAll/:userId
   ```

### Notification Service Registration

**File**: `services/notification-service/src/index.js`

The notification routes are registered at **line 83**:
```javascript
app.use("/api/notification", notificationRoutes);
```

## Complete Order Service Route Structure

Now in `services/order-service/src/index.js`:

```javascript
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const ticketRoutes = require("./routes/tickets");
const wishlistRoutes = require("./routes/wishList");
const paymentRoutes = require("./routes/payment");
const returnRoutes = require("./routes/return");
const refundRoutes = require("./routes/refund");
const analyticsRoutes = require("./routes/analytics");
const reportsRoutes = require("./routes/reports");
const slaViolationStatsRoutes = require("./routes/slaViolationStats");
const slaViolationManagementRoutes = require("./routes/slaViolationManagement");  // ✅ Added
const fulfillmentRoutes = require("./routes/fulfillment");

// Route registrations
app.use("/api/carts", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orders/kpi", require("./routes/orderKpiFIle"));
app.use("/api/tickets", ticketRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/sla-violations/stats", slaViolationStatsRoutes);
app.use("/api/sla-violations", slaViolationManagementRoutes);          // ✅ Added
app.use("/api/fulfillment", fulfillmentRoutes);
```

## Testing the Routes

### Test SLA Violation Management Routes

```bash
# Create manual SLA violation
curl -X POST "http://localhost:5002/api/sla-violations/manual" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dealerId": "dealer_id_here",
    "orderId": "order_id_here",
    "reason": "Manual violation reason",
    "severity": "HIGH"
  }'

# Get detailed violations
curl -X GET "http://localhost:5002/api/sla-violations/detailed" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Contact dealer about violation
curl -X POST "http://localhost:5002/api/sla-violations/:violationId/contact-dealer" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactMethod": "email",
    "message": "Please address this SLA violation"
  }'
```

### Test Manual Notification Route (Notification Service)

```bash
# Create manual notification (Unicast/Multicast)
curl -X POST "http://localhost:5003/api/notification/createUniCastOrMulticast" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user_id_1", "user_id_2"],
    "actionId": "action_id",
    "title": "Custom Notification",
    "message": "This is a manual notification",
    "type": ["INAPP", "PUSH"],
    "data": {
      "custom_field": "custom_value"
    }
  }'
```

## Service Ports

Based on the codebase:
- **User Service**: Port 5000
- **Product Service**: Port 5001
- **Order Service**: Port 5002 (inferred from pattern)
- **Notification Service**: Port 5003 (or check environment config)

## Summary

### What Was Fixed
✅ Added `slaViolationManagementRoutes` import to `index.js`  
✅ Registered routes at `/api/sla-violations` with proper path priority  
✅ Ensured stats routes have priority over general routes  

### What Was Clarified
✅ Manual notification routes are in **Notification Service**  
✅ Route path is `/api/notification/createUniCastOrMulticast`  
✅ This is a separate microservice from Order Service  

### Endpoints Now Available
✅ All SLA violation management endpoints are now accessible  
✅ Manual SLA violation creation  
✅ Dealer contact functionality  
✅ Violation resolution and updates  
✅ Detailed violation retrieval with populated data  

## Next Steps

1. **Test the Routes**: Use the curl commands above to verify endpoints work
2. **Check Logs**: Monitor the order service logs when making requests
3. **Verify Auth**: Ensure you have proper authentication tokens
4. **Database**: Confirm MongoDB connection is working

## Notes

- The routes use `authenticate` and `authorizeRoles` middleware
- Proper roles required: Super-admin, Fulfillment-Admin, Fulfillment-Staff, etc.
- Some routes have audit logging enabled
- The notification service is separate and handles all notification-related operations
