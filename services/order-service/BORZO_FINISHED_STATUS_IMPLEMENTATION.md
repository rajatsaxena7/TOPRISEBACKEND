# Borzo "Finished" Status Implementation

## Overview

This implementation adds automatic order delivery marking when all SKUs in an order have their `borzo_order_status` set to "finished". This integrates with the existing Borzo webhook system and the granular order status management system.

## Key Features

### 1. Automatic Order Delivery Detection
- **Trigger**: When Borzo webhook sends `borzo_order_status: "finished"`
- **Logic**: Checks if ALL SKUs in the order have `borzo_order_status: "finished"`
- **Action**: Automatically marks the order as "Delivered" when all SKUs are finished
- **Audit**: Creates audit logs for tracking the delivery event

### 2. Enhanced Webhook Processing
- **SKU-Level Updates**: Updates individual SKU `borzo_order_status` and `tracking_info.status`
- **Order-Level Updates**: Updates order `borzo_order_status` and overall order status
- **Timestamp Management**: Automatically sets `deliveredAt` timestamp when order is marked as delivered

### 3. Utility Functions
- **`checkAllSkusFinished(order)`**: Checks if all SKUs have "finished" status
- **`markOrderAsDeliveredIfAllFinished(orderId)`**: Marks order as delivered if all SKUs are finished

### 4. API Endpoints
- **`POST /api/orders/:orderId/check-delivery`**: Manual trigger to check and mark order as delivered
- **`GET /api/orders/:orderId/status-breakdown`**: View detailed order and SKU status breakdown

## Implementation Details

### 1. Webhook Enhancement (`borzoWebhook`)

The existing Borzo webhook has been enhanced to handle the "finished" status:

```javascript
// Special handling for "finished" status
if (borzoData.status && borzoData.status.toLowerCase() === "finished") {
  const { markOrderAsDeliveredIfAllFinished } = require("../utils/orderStatusCalculator");
  const result = await markOrderAsDeliveredIfAllFinished(order._id);
  
  if (result.updated) {
    updatedOrder = result.order;
    orderStatusUpdate.status = "Delivered";
  }
}
```

### 2. SKU Status Mapping

When Borzo sends "finished" status, SKUs are automatically updated:

```javascript
case "finished":
  skuStatus = "Delivered";
  skuTimestamp = "deliveredAt";
  break;
```

### 3. Order Status Logic

The system follows this logic for order status updates:

1. **Individual SKU Updates**: Each SKU gets updated with Borzo status
2. **Finished Status Check**: When "finished" status is received, check all SKUs
3. **All SKUs Finished**: If all SKUs have "finished" status, mark order as "Delivered"
4. **Partial Finished**: If only some SKUs are "finished", keep current order status

## API Endpoints

### 1. Check and Mark Order as Delivered

**Endpoint**: `POST /api/orders/:orderId/check-delivery`

**Purpose**: Manually trigger the check for all SKUs finished and mark order as delivered

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORDER123",
    "currentStatus": "Shipped",
    "finishedCheck": {
      "allFinished": true,
      "finishedCount": 2,
      "totalCount": 2,
      "details": [
        {
          "sku": "SKU001",
          "borzoStatus": "finished",
          "isFinished": true
        },
        {
          "sku": "SKU002", 
          "borzoStatus": "finished",
          "isFinished": true
        }
      ]
    },
    "result": {
      "updated": true,
      "order": { /* updated order object */ },
      "reason": "All 2 SKUs have Borzo status \"finished\""
    },
    "message": "Order marked as Delivered: All 2 SKUs have Borzo status \"finished\""
  },
  "message": "Order marked as delivered successfully"
}
```

### 2. Order Status Breakdown

**Endpoint**: `GET /api/orders/:orderId/status-breakdown`

**Purpose**: View detailed breakdown of order and SKU statuses

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORDER123",
    "currentOrderStatus": "Shipped",
    "calculatedStatus": "Shipped",
    "statusReason": "Partial delivery: 1/2 SKUs delivered",
    "skuBreakdown": [
      {
        "sku": "SKU001",
        "quantity": 2,
        "status": "Delivered",
        "timestamps": {
          "deliveredAt": "2024-01-15T10:30:00.000Z"
        },
        "dealerMapped": []
      },
      {
        "sku": "SKU002",
        "quantity": 1,
        "status": "Shipped",
        "timestamps": {
          "shippedAt": "2024-01-15T09:15:00.000Z"
        },
        "dealerMapped": []
      }
    ],
    "statusCounts": {
      "SKU001": "Delivered",
      "SKU002": "Shipped"
    }
  },
  "message": "Order status breakdown retrieved successfully"
}
```

## Utility Functions

### 1. `checkAllSkusFinished(order)`

Checks if all SKUs in an order have `borzo_order_status` as "finished".

**Parameters**:
- `order` (Object): Order object with skus array

**Returns**:
```javascript
{
  allFinished: boolean,      // Whether all SKUs are finished
  finishedCount: number,     // Number of finished SKUs
  totalCount: number,        // Total number of SKUs
  details: [                 // Detailed breakdown
    {
      sku: string,
      borzoStatus: string,
      isFinished: boolean
    }
  ]
}
```

### 2. `markOrderAsDeliveredIfAllFinished(orderId)`

Marks an order as delivered if all SKUs have "finished" status.

**Parameters**:
- `orderId` (String): Order ID to check and update

**Returns**:
```javascript
{
  updated: boolean,          // Whether the order was updated
  order: Object,            // Updated order object
  reason: string            // Reason for update or why not updated
}
```

## Borzo Status Mapping

The system maps Borzo statuses to internal statuses:

| Borzo Status | SKU Status | Order Status | Notes |
|--------------|------------|--------------|-------|
| `created` | Confirmed | Confirmed | Order created |
| `planned` | Confirmed | Confirmed | Delivery planned |
| `assigned` | Assigned | Assigned | Courier assigned |
| `courier_assigned` | Assigned | Assigned | Courier assigned |
| `picked_up` | Shipped | Shipped | Parcel picked up |
| `finished` | **Delivered** | **Delivered** | **Delivery finished** |
| `delivered` | Delivered | Delivered | Delivery completed |
| `cancelled` | Cancelled | Cancelled | Order cancelled |
| `returned` | Returned | Returned | Order returned |

## Testing

### Test Script

Run the test script to verify the implementation:

```bash
cd services/order-service
node test-borzo-finished-status.js
```

### Test Scenarios

1. **Initial State**: Order with multiple SKUs, none finished
2. **Partial Finished**: One SKU finished, order should remain in current status
3. **All Finished**: All SKUs finished, order should be marked as "Delivered"
4. **Final Verification**: Check final order status and timestamps

### Manual Testing

1. **Create Test Order**: Use the test script to create an order with multiple SKUs
2. **Simulate Webhook**: Send webhook requests with different Borzo statuses
3. **Check Results**: Verify order and SKU status updates
4. **Manual Trigger**: Use the check-delivery endpoint to manually trigger delivery marking

## Webhook Payload Examples

### Standard Order Webhook

```json
{
  "event_datetime": "2024-01-15T10:30:00Z",
  "event_type": "delivery_finished",
  "order": {
    "order_id": "12345",
    "client_order_id": "ORDER123",
    "status": "finished",
    "tracking_url": "https://tracking.borzo.com/12345",
    "tracking_number": "BORZO123456"
  }
}
```

### Delivery Webhook

```json
{
  "event_datetime": "2024-01-15T10:30:00Z",
  "event_type": "delivery_finished",
  "delivery": {
    "order_id": "12345",
    "client_order_id": "ORDER123",
    "status": "finished",
    "tracking_url": "https://tracking.borzo.com/12345",
    "tracking_number": "BORZO123456"
  }
}
```

## Error Handling

### Webhook Errors

- **Invalid Signature**: Returns 401 if webhook signature is invalid
- **Missing Order**: Returns 404 if order is not found
- **Invalid Data**: Returns 400 if webhook data is malformed

### Processing Errors

- **Database Errors**: Logged and handled gracefully
- **External Service Errors**: Timeout handling for external calls
- **Validation Errors**: Proper error responses with details

## Monitoring and Logging

### Audit Logs

The system creates audit logs for important events:

```javascript
{
  action: "Order Delivered - All SKUs Finished",
  actorId: null, // System action
  role: "System",
  timestamp: new Date(),
  reason: "All SKUs have Borzo status \"finished\" - Order marked as Delivered"
}
```

### Console Logging

Key events are logged to console:

- Webhook received with "finished" status
- SKU status updates
- Order delivery marking
- Error conditions

## Integration Points

### 1. Existing Systems

- **Granular Order Status System**: Integrates with SKU-level status tracking
- **SLA Violation System**: Works with existing SLA monitoring
- **Audit System**: Creates audit logs for tracking

### 2. External Services

- **Borzo API**: Receives webhook updates
- **Product Service**: May be called for product details
- **User Service**: May be called for customer details

## Configuration

### Environment Variables

```bash
# Borzo Configuration
BORZO_AUTH_TOKEN=your_borzo_auth_token
BORZO_CALLBACK_SECRET_KEY=your_webhook_secret_key

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/toprise
```

### Webhook Configuration

The webhook endpoint is available at:
```
POST /api/orders/borzo/webhook
```

## Future Enhancements

### 1. Batch Processing

- Process multiple orders simultaneously
- Bulk status updates for efficiency

### 2. Real-time Notifications

- WebSocket notifications for status changes
- Email/SMS notifications for delivery completion

### 3. Advanced Analytics

- Delivery time tracking
- Performance metrics
- SLA compliance reporting

### 4. Retry Logic

- Automatic retry for failed webhook processing
- Dead letter queue for failed events

## Troubleshooting

### Common Issues

1. **Order Not Found**: Check if `client_order_id` matches order ID
2. **Status Not Updating**: Verify webhook signature and payload format
3. **Partial Updates**: Check if all SKUs are being updated correctly

### Debug Commands

```bash
# Check order status
curl -X GET "http://localhost:3000/api/orders/ORDER123/status-breakdown"

# Manually trigger delivery check
curl -X POST "http://localhost:3000/api/orders/ORDER123/check-delivery"

# Test webhook
curl -X POST "http://localhost:3000/api/orders/borzo/webhook" \
  -H "Content-Type: application/json" \
  -H "X-DV-Signature: your_signature" \
  -d '{"event_type":"delivery_finished","order":{"order_id":"123","client_order_id":"ORDER123","status":"finished"}}'
```

## Conclusion

This implementation provides a robust, automated system for handling Borzo "finished" status updates and marking orders as delivered when all SKUs are completed. The system integrates seamlessly with existing order management functionality while providing comprehensive monitoring and error handling.
