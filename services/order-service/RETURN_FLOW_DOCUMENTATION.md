# Return Flow Documentation

## Overview
This document describes the complete return flow implementation for the TopRise backend system. The return process follows a structured workflow from customer request to refund completion.

## Return Flow Steps

### 1. Customer Return Request
**Endpoint:** `POST /api/returns/create`

**Description:** Customers can request a return from the app/website if the item is:
- Within the return window (7 days from delivery)
- Marked as Returnable in the catalogue

**Request Body:**
```json
{
  "orderId": "order_id_here",
  "sku": "SKU123",
  "quantity": 1,
  "returnReason": "Defective Product",
  "returnDescription": "Product arrived damaged",
  "returnImages": ["image_url_1", "image_url_2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "returnId": "return_id_here",
    "returnStatus": "Validated",
    "isEligible": true,
    "eligibilityReason": "Return request is eligible"
  }
}
```

### 2. Return Validation
**Endpoint:** `PUT /api/returns/:returnId/validate`

**Description:** System validates eligibility automatically when return is created, but can be manually triggered for review.

**Validation Checks:**
- Return window validation (7 days from delivery)
- Product returnable status check
- Order ownership verification
- SKU existence in order

### 3. Pickup Scheduling
**Endpoint:** `PUT /api/returns/:returnId/schedule-pickup`

**Description:** Once return is validated, a pickup request is created and sent to the logistics partner.

**Request Body:**
```json
{
  "scheduledDate": "2024-01-15T10:00:00Z",
  "pickupAddress": {
    "address": "123 Customer Street",
    "city": "Mumbai",
    "pincode": "400001",
    "state": "Maharashtra"
  }
}
```

### 4. Pickup Completion
**Endpoint:** `PUT /api/returns/:returnId/complete-pickup`

**Description:** Logistics partner marks pickup as completed and delivers item to dealer location.

**Request Body:**
```json
{
  "trackingNumber": "TRK123456789"
}
```

### 5. Inspection Start
**Endpoint:** `PUT /api/returns/:returnId/start-inspection`

**Description:** Fulfillment Staff starts inspection of returned item.

**Request Body:**
```json
{
  "staffId": "staff_user_id"
}
```

### 6. Inspection Completion
**Endpoint:** `PUT /api/returns/:returnId/complete-inspection`

**Description:** Fulfillment Staff inspects the item and determines approval/rejection.

**Inspection Checks:**
- SKU match verification
- Product condition assessment
- Documentation with photos

**Request Body:**
```json
{
  "skuMatch": true,
  "condition": "Good",
  "conditionNotes": "Product in good condition",
  "inspectionImages": ["inspection_image_1"],
  "isApproved": true,
  "rejectionReason": null
}
```

**Possible Outcomes:**
- **Approved:** Item forwarded to Fulfillment Admin for refund
- **Rejected:** Reason logged, customer notified

### 7. Refund Processing
**Endpoint:** `PUT /api/returns/:returnId/process-refund`

**Description:** Fulfillment Admin processes the refund and closes the case.

**Request Body:**
```json
{
  "adminId": "admin_user_id",
  "refundMethod": "Original_Payment_Method",
  "refundNotes": "Refund processed successfully"
}
```

### 8. Return Completion
**Endpoint:** `PUT /api/returns/:returnId/complete`

**Description:** Mark return process as completed.

## Return Status Flow

```
Requested → Validated → Pickup_Scheduled → Pickup_Completed → Under_Inspection → Approved/Rejected → Refund_Processed → Completed
```

## Data Model

### Return Schema
```javascript
{
  orderId: ObjectId,           // Reference to order
  customerId: String,          // Customer who initiated return
  sku: String,                 // Product SKU
  quantity: Number,            // Quantity to return
  returnReason: String,        // Reason for return
  returnDescription: String,   // Detailed description
  returnImages: [String],      // Images uploaded by customer
  
  // Eligibility validation
  isEligible: Boolean,
  eligibilityReason: String,
  returnWindowDays: Number,
  isWithinReturnWindow: Boolean,
  isProductReturnable: Boolean,
  
  // Status tracking
  returnStatus: String,        // Current status in flow
  
  // Pickup details
  pickupRequest: {
    pickupId: String,
    scheduledDate: Date,
    completedDate: Date,
    logisticsPartner: String,
    trackingNumber: String,
    pickupAddress: Object,
    deliveryAddress: Object
  },
  
  // Inspection details
  inspection: {
    inspectedBy: String,
    inspectedAt: Date,
    skuMatch: Boolean,
    condition: String,
    conditionNotes: String,
    inspectionImages: [String],
    isApproved: Boolean,
    rejectionReason: String
  },
  
  // Refund details
  refund: {
    processedBy: String,
    processedAt: Date,
    refundAmount: Number,
    refundMethod: String,
    refundStatus: String,
    transactionId: String,
    refundNotes: String
  },
  
  // Timestamps for each stage
  timestamps: {
    requestedAt: Date,
    validatedAt: Date,
    pickupScheduledAt: Date,
    pickupCompletedAt: Date,
    inspectionStartedAt: Date,
    inspectionCompletedAt: Date,
    refundProcessedAt: Date,
    completedAt: Date
  }
}
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/returns/create` | Create return request |
| GET | `/api/returns/:returnId` | Get return details |
| GET | `/api/returns` | List returns with filters |
| GET | `/api/returns/stats/overview` | Get return statistics |
| PUT | `/api/returns/:returnId/validate` | Validate return eligibility |
| PUT | `/api/returns/:returnId/schedule-pickup` | Schedule pickup |
| PUT | `/api/returns/:returnId/complete-pickup` | Complete pickup |
| PUT | `/api/returns/:returnId/start-inspection` | Start inspection |
| PUT | `/api/returns/:returnId/complete-inspection` | Complete inspection |
| PUT | `/api/returns/:returnId/process-refund` | Process refund |
| PUT | `/api/returns/:returnId/complete` | Complete return |
| POST | `/api/returns/:returnId/notes` | Add note to return |

## Notifications

The system sends notifications at key points in the return flow:

1. **Return Request Created:** Customer notified of request submission
2. **Return Validated:** Customer notified of eligibility status
3. **Pickup Scheduled:** Customer notified of pickup schedule
4. **Item Received:** Dealer notified for inspection
5. **Inspection Complete:** Customer notified of approval/rejection
6. **Refund Ready:** Fulfillment Admin notified for refund processing
7. **Refund Processed:** Customer notified of refund completion
8. **Return Completed:** Final completion notification

## Integration Points

### Product Service
- Fetches product returnable status via `is_returnable` field
- Validates product exists and is returnable

### User Service
- Validates customer ownership of order
- Fetches user details for notifications
- Identifies fulfillment staff and admin users

### Notification Service
- Sends push notifications and in-app notifications
- Handles email notifications for key events

### Logistics Partner (Borzo)
- Creates pickup requests
- Tracks pickup status
- Provides tracking information

### Payment Gateway
- Processes refunds to original payment method
- Handles wallet credits and store credits
- Provides transaction IDs for refund tracking

## Error Handling

The system handles various error scenarios:

- **Invalid Order:** Returns 404 if order not found
- **Unauthorized Access:** Returns 403 if customer doesn't own order
- **Duplicate Return:** Prevents multiple returns for same order/SKU
- **Invalid Status Transitions:** Ensures proper flow progression
- **Eligibility Failures:** Clear messaging for ineligible returns
- **Payment Failures:** Handles refund processing errors

## Monitoring and Analytics

### Return Statistics
- Total returns by status
- Return rates by product/SKU
- Average processing time
- Refund amounts and methods
- Customer satisfaction metrics

### Key Metrics
- Return approval rate
- Average inspection time
- Pickup success rate
- Refund processing time
- Customer return frequency

## Security Considerations

1. **Authentication:** All endpoints require valid authentication
2. **Authorization:** Customers can only access their own returns
3. **Data Validation:** Input validation for all request parameters
4. **Audit Trail:** Complete timestamp tracking for all actions
5. **Secure Notifications:** Encrypted communication for sensitive data

## Future Enhancements

1. **Automated Eligibility:** AI-powered eligibility assessment
2. **Photo Analysis:** Automated condition assessment from photos
3. **Predictive Analytics:** Return prediction models
4. **Multi-language Support:** Internationalization for notifications
5. **Advanced Reporting:** Detailed analytics dashboard
6. **Integration APIs:** Third-party logistics and payment providers
