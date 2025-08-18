# SLA Violation Implementation

This document describes the implementation of SLA (Service Level Agreement) violation tracking for order processing in the order service.

## Overview

The SLA violation system automatically detects and records violations when orders are marked as "Packed" but exceed their expected fulfillment time based on dealer SLA configurations.

## Components

### 1. Models

#### `SLAViolation` Model
- Stores violation records with dealer, order, timing, and resolution information
- Fields: `dealer_id`, `order_id`, `expected_fulfillment_time`, `actual_fulfillment_time`, `violation_minutes`, `resolved`, `notes`, `created_at`

#### `DealerSLA` Model
- Configures SLA requirements for each dealer
- Fields: `dealer_id`, `sla_type`, `dispatch_hours`, `is_active`

#### `SLAType` Model
- Defines different SLA types (Express, Standard, etc.)
- Fields: `name`, `description`, `expected_hours`

### 2. Utility Functions (`slaViolationUtils.js`)

#### `checkSLAViolationOnPacking(order, packedAt)`
- Checks if packing an order violates SLA
- Calculates expected fulfillment time based on dealer SLA configuration
- Returns violation details if SLA is breached

#### `recordSLAViolation(violationData)`
- Records SLA violation in the database
- Creates entry in `SLAViolation` collection

#### `updateOrderWithSLAViolation(orderId, violationData)`
- Updates order with SLA violation information
- Sets `slaInfo.isSLAMet = false` and violation minutes

#### `calculateExpectedFulfillmentTime(orderDate, dealerSLA)`
- Calculates expected fulfillment time based on order date and dealer SLA
- Considers dispatch hours and SLA type requirements

### 3. Controller Updates

#### `markAsPacked` Function
- Enhanced to check for SLA violations when marking orders as packed
- Records violations automatically if detected
- Returns violation information in response

#### `batchUpdateStatus` Function
- Updated to handle SLA violations in batch operations
- Checks each order being marked as packed

#### `markDealerPackedAndUpdateOrderStatus` Function
- Enhanced to check SLA violations when all dealers complete packing
- Records violations for the entire order

### 4. API Endpoints

#### Existing Endpoints
- `POST /api/orders/:orderId/pack` - Mark order as packed (now includes SLA checking)
- `POST /api/orders/batch/status-update` - Batch status updates (now includes SLA checking)
- `PUT /api/orders/update/order-status-by-dealer` - Dealer packing updates (now includes SLA checking)

#### New SLA Endpoints
- `GET /api/orders/sla/violations/order/:orderId` - Get violations for specific order
- `GET /api/orders/sla/violations/summary/:dealerId` - Get violation summary for dealer

## How It Works

### 1. Order Creation
- When an order is created, it can include SLA information
- Dealer SLA configuration determines expected fulfillment time

### 2. Packing Process
When an order is marked as "Packed":

1. **SLA Check**: System checks if current time exceeds expected fulfillment time
2. **Violation Detection**: If packing time > expected time, violation is detected
3. **Violation Recording**: Violation is recorded in `SLAViolation` collection
4. **Order Update**: Order is updated with violation information
5. **Response**: API response includes violation details

### 3. Expected Fulfillment Time Calculation
```
Expected Time = Order Date + SLA Hours + Dispatch Hours Adjustment
```

- **SLA Hours**: From `SLAType.expected_hours`
- **Dispatch Hours**: Only count hours within dealer's dispatch window
- **Adjustment**: If calculated time falls outside dispatch hours, adjust to next available time

## Usage Examples

### Mark Order as Packed (with SLA checking)
```javascript
POST /api/orders/:orderId/pack

// Response (if violation detected)
{
  "success": true,
  "data": {
    "order": { /* order details */ },
    "slaViolation": {
      "dealer_id": "dealer123",
      "order_id": "order456",
      "violation_minutes": 45,
      "notes": "SLA violation detected when order was packed..."
    },
    "message": "Order marked as packed. SLA violation detected: 45 minutes late."
  }
}
```

### Get SLA Violations for Order
```javascript
GET /api/orders/sla/violations/order/:orderId

// Response
{
  "success": true,
  "data": [
    {
      "dealer_id": "dealer123",
      "order_id": "order456",
      "violation_minutes": 45,
      "expected_fulfillment_time": "2024-01-15T10:00:00Z",
      "actual_fulfillment_time": "2024-01-15T10:45:00Z",
      "resolved": false,
      "dealerInfo": { /* dealer details */ }
    }
  ]
}
```

### Get Violation Summary for Dealer
```javascript
GET /api/orders/sla/violations/summary/:dealerId?startDate=2024-01-01&endDate=2024-01-31

// Response
{
  "success": true,
  "data": {
    "totalViolations": 5,
    "totalViolationMinutes": 180,
    "averageViolationMinutes": 36,
    "resolvedViolations": 2,
    "unresolvedViolations": 3,
    "violationsByDate": {
      "2024-01-15": 2,
      "2024-01-16": 3
    }
  }
}
```

## Configuration

### Setting Up SLA Types
```javascript
// Create SLA Type
POST /api/orders/sla/types
{
  "name": "Express",
  "description": "Express delivery within 2 hours",
  "expected_hours": 2
}
```

### Configuring Dealer SLA
```javascript
// Set Dealer SLA
POST /api/orders/dealers/:dealerId/sla
{
  "sla_type": "slaTypeId",
  "dispatch_hours": {
    "start": 9,
    "end": 18
  },
  "is_active": true
}
```

## Testing

Run the test script to verify the implementation:
```bash
cd services/order-service
node test-sla-violation.js
```

The test script will:
1. Create test SLA types and dealer configurations
2. Create orders with past dates to simulate delays
3. Test SLA violation detection and recording
4. Verify all components work correctly
5. Clean up test data

## Monitoring and Alerts

### Logging
- All SLA violations are logged with detailed information
- Failed violation recordings are logged as errors
- Violation details include timing and dealer information

### Metrics
- Track violation rates by dealer
- Monitor average violation minutes
- Identify patterns in SLA breaches

### Potential Enhancements
- Email/SMS notifications for violations
- Dashboard for SLA compliance monitoring
- Automatic escalation for repeated violations
- Integration with performance metrics
