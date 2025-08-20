# Granular Order Status System

## Overview

The new granular order status system allows tracking individual SKU statuses within an order and automatically calculates the overall order status based on the status of all SKUs. This provides more accurate and detailed order tracking.

## Key Features

### 1. SKU-Level Status Tracking
- Each SKU in an order has its own status tracking
- Individual timestamps for each status change
- Independent tracking of packing, shipping, and delivery

### 2. Automatic Order Status Calculation
- Order status is automatically calculated based on SKU statuses
- Real-time status updates when SKU statuses change
- Clear reasoning for status changes

### 3. Partial Status Support
- Orders can be partially packed, shipped, or delivered
- Accurate representation of order progress
- Better customer communication

## Order Status Logic

### Status Hierarchy (from lowest to highest)
1. **Confirmed** - Order is confirmed
2. **Assigned** - SKUs are assigned to dealers
3. **Packed** - Some or all SKUs are packed
4. **Shipped** - All SKUs are packed OR some SKUs are delivered
5. **Delivered** - All SKUs are delivered
6. **Cancelled** - All SKUs are cancelled
7. **Returned** - All SKUs are returned

### Status Calculation Rules

#### Order becomes "Shipped" when:
- **All SKUs are packed** → Order becomes "Shipped"
- **Any SKU is delivered** (partial delivery) → Order becomes "Shipped"

#### Order becomes "Delivered" when:
- **All SKUs are delivered** → Order becomes "Delivered"

#### Order becomes "Packed" when:
- **Some SKUs are packed** (but not all) → Order remains "Packed"

#### Order becomes "Assigned" when:
- **All SKUs are assigned** → Order becomes "Assigned"
- **Some SKUs are assigned** (but not all) → Order remains "Assigned"

## API Endpoints

### SKU-Level Status Updates

#### 1. Mark SKU as Packed
```http
POST /api/orders/:orderId/sku/:sku/pack
```

**Request Body:**
```json
{
  "packedBy": "user_id",
  "notes": "Optional packing notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "orderId": "ORD-123",
      "status": "Shipped",
      "skus": [...]
    },
    "skuStatus": "Packed",
    "message": "SKU ABC123 marked as packed successfully"
  }
}
```

#### 2. Mark SKU as Shipped
```http
POST /api/orders/:orderId/sku/:sku/ship
```

**Request Body:**
```json
{
  "shippedBy": "user_id",
  "trackingNumber": "TRK123456",
  "courierName": "Borzo"
}
```

#### 3. Mark SKU as Delivered
```http
POST /api/orders/:orderId/sku/:sku/deliver
```

**Request Body:**
```json
{
  "deliveredBy": "user_id",
  "deliveryProof": "image_url",
  "signature": "customer_signature"
}
```

### Order-Level Status Updates (Enhanced)

#### 1. Mark Order as Packed (All SKUs)
```http
POST /api/orders/:orderId/pack
```

**Request Body (Optional):**
```json
{
  "skus": ["SKU1", "SKU2"] // Specific SKUs to mark as packed
}
```

#### 2. Mark Order as Delivered (All SKUs)
```http
POST /api/orders/:orderId/deliver
```

**Request Body (Optional):**
```json
{
  "skus": ["SKU1", "SKU2"], // Specific SKUs to mark as delivered
  "deliveryProof": "image_url"
}
```

### Status Information

#### 3. Get Order Status Breakdown
```http
GET /api/orders/:orderId/status-breakdown
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-123",
    "currentOrderStatus": "Shipped",
    "calculatedStatus": "Shipped",
    "statusReason": "Partial delivery: 2/3 SKUs delivered",
    "skuBreakdown": [
      {
        "sku": "SKU1",
        "quantity": 1,
        "status": "Delivered",
        "timestamps": {
          "deliveredAt": "2024-01-15T10:00:00Z"
        }
      },
      {
        "sku": "SKU2",
        "quantity": 2,
        "status": "Delivered",
        "timestamps": {
          "deliveredAt": "2024-01-15T11:00:00Z"
        }
      },
      {
        "sku": "SKU3",
        "quantity": 1,
        "status": "Shipped",
        "timestamps": {
          "shippedAt": "2024-01-15T09:00:00Z"
        }
      }
    ],
    "statusCounts": {
      "Delivered": 2,
      "Shipped": 1
    }
  }
}
```

## Database Schema Updates

### Order Model Changes
```javascript
// Added "Delivered" to status enum
status: {
  type: String,
  enum: [
    "Confirmed",
    "Assigned", 
    "Scanning",
    "Packed",
    "Shipped",
    "Delivered", // NEW
    "Cancelled",
    "Returned"
  ],
  default: "Confirmed"
}
```

### SKU Tracking Structure
```javascript
skus: [
  {
    // ... existing fields
    tracking_info: {
      // ... existing borzo fields
      status: {
        type: String,
        enum: ["Pending", "Confirmed", "Assigned", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"],
        default: "Pending"
      },
      timestamps: {
        confirmedAt: Date,
        assignedAt: Date,
        packedAt: Date,
        shippedAt: Date,
        deliveredAt: Date
      }
    }
  }
]
```

## Usage Examples

### Scenario 1: Partial Packing
```javascript
// Mark first SKU as packed
await fetch('/api/orders/ORD-123/sku/SKU1/pack', {
  method: 'POST',
  body: JSON.stringify({ packedBy: 'user123' })
});
// Order status: "Packed" (1/3 SKUs packed)

// Mark second SKU as packed
await fetch('/api/orders/ORD-123/sku/SKU2/pack', {
  method: 'POST',
  body: JSON.stringify({ packedBy: 'user123' })
});
// Order status: "Packed" (2/3 SKUs packed)

// Mark third SKU as packed
await fetch('/api/orders/ORD-123/sku/SKU3/pack', {
  method: 'POST',
  body: JSON.stringify({ packedBy: 'user123' })
});
// Order status: "Shipped" (all SKUs packed)
```

### Scenario 2: Partial Delivery
```javascript
// Mark first SKU as delivered
await fetch('/api/orders/ORD-123/sku/SKU1/deliver', {
  method: 'POST',
  body: JSON.stringify({ deliveredBy: 'courier123' })
});
// Order status: "Shipped" (1/3 SKUs delivered)

// Mark remaining SKUs as delivered
await fetch('/api/orders/ORD-123/sku/SKU2/deliver', {
  method: 'POST',
  body: JSON.stringify({ deliveredBy: 'courier123' })
});
await fetch('/api/orders/ORD-123/sku/SKU3/deliver', {
  method: 'POST',
  body: JSON.stringify({ deliveredBy: 'courier123' })
});
// Order status: "Delivered" (all SKUs delivered)
```

## Migration Guide

### For Existing Orders
1. **Automatic Migration**: Existing orders will automatically get SKU-level tracking
2. **Status Calculation**: Order status will be calculated based on existing data
3. **Backward Compatibility**: Existing API endpoints continue to work

### For New Orders
1. **Use SKU-level endpoints** for granular control
2. **Monitor status breakdown** for detailed tracking
3. **Leverage partial status** for better customer communication

## Benefits

### 1. Accurate Order Tracking
- Real-time status updates
- Partial progress tracking
- Better customer communication

### 2. Improved Operations
- Granular control over order processing
- Better inventory management
- Enhanced SLA tracking

### 3. Better Customer Experience
- Detailed order progress
- Accurate delivery estimates
- Transparent status updates

### 4. Enhanced Analytics
- SKU-level performance metrics
- Detailed fulfillment analytics
- Better operational insights

## Error Handling

### Common Error Scenarios
1. **SKU not found**: Returns 404 with clear error message
2. **Invalid status transition**: Validates status flow
3. **Order not found**: Returns 404 for invalid order IDs

### Error Response Format
```json
{
  "success": false,
  "error": "SKU ABC123 not found in order ORD-123",
  "code": 404
}
```

## Monitoring and Logging

### Status Change Logging
- All status changes are logged with timestamps
- User information is recorded for audit trails
- SLA violations are tracked and reported

### Performance Monitoring
- Status calculation performance is monitored
- Database query optimization for large orders
- Real-time status update performance

## Future Enhancements

### Planned Features
1. **Bulk SKU Updates**: Update multiple SKUs at once
2. **Status Notifications**: Real-time notifications for status changes
3. **Advanced Analytics**: Detailed SKU-level performance metrics
4. **Integration APIs**: Third-party integration for status updates

### API Extensions
1. **Status History**: Get complete status change history
2. **Status Projections**: Estimate delivery times based on current status
3. **Custom Statuses**: Support for custom status workflows
4. **Status Templates**: Predefined status update templates
