# Create Order from Document - Updated Request Body

## ✅ Updated Implementation

The `createOrderFromDocument` endpoint now uses the **exact same logic** as the standard `createOrder` endpoint from `order.js`.

---

## 🔌 Endpoint

```
POST /api/documents/admin/:id/create-order
```

**Access**: Super-admin, Fulfillment-Admin

---

## 📝 Request Body Structure

The request body should match the standard order creation format using **`skus`** instead of `items`.

### Complete Request Body

```json
{
  "created_by": "admin_user_id",
  "customerDetails": {
    "userId": "user_id",
    "name": "Rajesh Kumar",
    "phone": "+91-9876543210",
    "email": "rajesh@example.com",
    "address": "Shop No. 45, MG Road, Bangalore",
    "pincode": "560001"
  },
  "skus": [
    {
      "sku": "BRK-HC-001",
      "quantity": 50,
      "productId": "product_id_1",
      "productName": "Brake Pads - Honda City Compatible",
      "selling_price": 950,
      "mrp": 1200,
      "mrp_gst_amount": 216,
      "gst_percentage": 18,
      "gst_amount": 171,
      "product_total": 47500,
      "totalPrice": 47500
    },
    {
      "sku": "OIL-STD-002",
      "quantity": 20,
      "productId": "product_id_2",
      "productName": "Oil Filter - Standard Grade",
      "selling_price": 450,
      "mrp": 600,
      "mrp_gst_amount": 108,
      "gst_percentage": 18,
      "gst_amount": 81,
      "product_total": 9000,
      "totalPrice": 9000
    },
    {
      "sku": "AIR-FLT-003",
      "quantity": 10,
      "productId": "product_id_3",
      "productName": "Air Filter",
      "selling_price": 600,
      "mrp": 800,
      "mrp_gst_amount": 144,
      "gst_percentage": 18,
      "gst_amount": 108,
      "product_total": 6000,
      "totalPrice": 6000
    }
  ],
  "order_Amount": 62500,
  "deliveryCharges": 500,
  "paymentType": "COD",
  "type_of_delivery": "Express",
  "delivery_type": "standard"
}
```

---

## 📋 Field Descriptions

### Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `created_by` | String | ✅ Yes | Admin user ID who is creating the order |
| `skus` | Array | ✅ Yes | Array of SKU objects (must have at least 1) |
| `customerDetails` | Object | ✅ Yes | Customer information |

### Customer Details Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | String | ✅ Yes | User ID from document |
| `name` | String | ✅ Yes | Customer name |
| `phone` | String | ✅ Yes | Phone number |
| `email` | String | ✅ Yes | Email address |
| `address` | String | ✅ Yes | Delivery address |
| `pincode` | String | ✅ Yes | Pincode |

### SKU Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sku` | String | ✅ Yes | SKU code (will be auto-uppercased) |
| `quantity` | Number | ✅ Yes | Quantity ordered |
| `productId` | String | ✅ Yes | Product ID |
| `productName` | String | ✅ Yes | Product name |
| `selling_price` | Number | ✅ Yes | Selling price per unit |
| `mrp` | Number | ✅ Yes | MRP per unit |
| `mrp_gst_amount` | Number | No | GST on MRP |
| `gst_percentage` | Number | No | GST percentage (e.g., 18) |
| `gst_amount` | Number | No | Total GST amount |
| `product_total` | Number | No | Total for this product |
| `totalPrice` | Number | ✅ Yes | Total price for this SKU |

### Optional Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `order_Amount` | Number | No | 0 | Total order amount |
| `deliveryCharges` | Number | No | 0 | Delivery/shipping charges |
| `paymentType` | String | No | "COD" | Payment type (COD/Prepaid) |
| `type_of_delivery` | String | No | "Express" | Delivery type |
| `delivery_type` | String | No | "standard" | Delivery method |

---

## 🔄 What Happens When Order is Created

1. ✅ **Order ID Generated**: `ORD-{timestamp}-{uuid}`
2. 📄 **Invoice Generated**: PDF invoice created and uploaded to S3
3. 📋 **Invoice Number**: `INV-{timestamp}`
4. 🔄 **Status Set**: Order status = "Confirmed"
5. 📦 **Queue Added**: Order added to dealer assignment queue
6. 🛒 **Cart Cleared**: If COD, user's cart is cleared
7. 🔔 **Notifications Sent**: 
   - Customer notified about order
   - Super-admins notified about new order
8. 📝 **Document Updated**: 
   - Document status → "Order-Created"
   - Order ID linked to document
   - Admin note added

---

## 📤 cURL Example

```bash
curl -X POST "http://localhost:5003/api/documents/admin/671234567890abcdef123456/create-order" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "created_by": "66f4a1b2c3d4e5f6a7b8c9d1",
    "customerDetails": {
      "userId": "66f4a1b2c3d4e5f6a7b8c9d0",
      "name": "Rajesh Kumar",
      "phone": "+91-9876543210",
      "email": "rajesh@example.com",
      "address": "Shop No. 45, MG Road, Bangalore",
      "pincode": "560001"
    },
    "skus": [
      {
        "sku": "BRK-HC-001",
        "quantity": 50,
        "productId": "product_id_1",
        "productName": "Brake Pads - Honda City",
        "selling_price": 950,
        "mrp": 1200,
        "gst_percentage": 18,
        "gst_amount": 171,
        "totalPrice": 47500
      },
      {
        "sku": "OIL-STD-002",
        "quantity": 20,
        "productId": "product_id_2",
        "productName": "Oil Filter",
        "selling_price": 450,
        "mrp": 600,
        "gst_percentage": 18,
        "gst_amount": 81,
        "totalPrice": 9000
      }
    ],
    "order_Amount": 56500,
    "deliveryCharges": 500,
    "paymentType": "COD",
    "type_of_delivery": "Express"
  }'
```

---

## ✅ Response (200 OK)

```json
{
  "success": true,
  "data": {
    "document": {
      "_id": "671234567890abcdef123456",
      "document_number": "DOC-202510-00042",
      "status": "Order-Created",
      "order_id": "671234567890abcdef123460",
      "order_created_at": "2025-10-14T15:00:00.000Z",
      "order_created_by": "66f4a1b2c3d4e5f6a7b8c9d1",
      "reviewed_by": "66f4a1b2c3d4e5f6a7b8c9d1",
      "reviewed_at": "2025-10-14T15:00:00.000Z",
      "admin_notes": [
        {
          "note": "Order ORD-1729001500-a1b2c3d4 created from this document",
          "added_by": "66f4a1b2c3d4e5f6a7b8c9d1",
          "added_at": "2025-10-14T15:00:00.000Z"
        }
      ]
    },
    "order": {
      "_id": "671234567890abcdef123460",
      "orderId": "ORD-1729001500-a1b2c3d4",
      "orderDate": "2025-10-14T15:00:00.000Z",
      "status": "Confirmed",
      "invoiceNumber": "INV-1729001500",
      "invoiceUrl": "https://s3.../invoice.pdf",
      "skus": [
        {
          "sku": "BRK-HC-001",
          "quantity": 50,
          "productId": "product_id_1",
          "productName": "Brake Pads - Honda City",
          "selling_price": 950,
          "mrp": 1200,
          "gst_percentage": 18,
          "gst_amount": 171,
          "totalPrice": 47500,
          "dealerMapped": []
        },
        {
          "sku": "OIL-STD-002",
          "quantity": 20,
          "productId": "product_id_2",
          "productName": "Oil Filter",
          "selling_price": 450,
          "mrp": 600,
          "gst_percentage": 18,
          "gst_amount": 81,
          "totalPrice": 9000,
          "dealerMapped": []
        }
      ],
      "order_Amount": 56500,
      "deliveryCharges": 500,
      "customerDetails": {
        "userId": "66f4a1b2c3d4e5f6a7b8c9d0",
        "name": "Rajesh Kumar",
        "phone": "+91-9876543210",
        "email": "rajesh@example.com",
        "address": "Shop No. 45, MG Road, Bangalore",
        "pincode": "560001"
      },
      "paymentType": "COD",
      "type_of_delivery": "Express",
      "delivery_type": "Express",
      "created_from_document": true,
      "document_upload_id": "671234567890abcdef123456",
      "dealerMapping": [],
      "timestamps": {
        "createdAt": "2025-10-14T15:00:00.000Z"
      },
      "createdAt": "2025-10-14T15:00:00.000Z",
      "updatedAt": "2025-10-14T15:00:00.000Z"
    }
  },
  "message": "Order created successfully from document"
}
```

---

## 🎯 Key Features

### ✅ Invoice Generation
- PDF invoice automatically generated
- Uploaded to S3
- Invoice URL stored in order

### ✅ Dealer Assignment Queue
- Order automatically added to dealer assignment queue
- Queue handles dealer allocation asynchronously
- 5 retry attempts with exponential backoff

### ✅ Cart Management
- If payment type is COD, user's cart is automatically cleared
- Ensures no duplicate orders

### ✅ Notifications
- **Customer**: Notified about order placement
- **Admins**: Super-admins notified about new order
- Notifications sent via INAPP and PUSH channels

### ✅ Order Lifecycle
Once created, the order follows the standard lifecycle:
1. ✅ **Confirmed** (current)
2. 📦 **Assigned** (dealer assignment)
3. 🔍 **Scanning** (dealer scans items)
4. 📦 **Packed** (items packed)
5. 🚚 **Shipped** (order dispatched)
6. ✅ **Delivered** (order completed)

---

## ❌ Error Responses

### 400 Bad Request - Missing created_by
```json
{
  "success": false,
  "message": "created_by is required"
}
```

### 400 Bad Request - No SKUs
```json
{
  "success": false,
  "message": "Order must contain at least one SKU"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Document not found"
}
```

### 400 Bad Request - Order Already Created
```json
{
  "success": false,
  "message": "Order has already been created from this document"
}
```

---

## 💡 JavaScript Example

```javascript
const createOrderFromDocument = async (documentId) => {
  try {
    const response = await axios.post(
      `http://localhost:5003/api/documents/admin/${documentId}/create-order`,
      {
        created_by: adminUserId,
        customerDetails: {
          userId: "user_id",
          name: "Rajesh Kumar",
          phone: "+91-9876543210",
          email: "rajesh@example.com",
          address: "Shop No. 45, MG Road",
          pincode: "560001"
        },
        skus: [
          {
            sku: "BRK-HC-001",
            quantity: 50,
            productId: "prod_1",
            productName: "Brake Pads",
            selling_price: 950,
            mrp: 1200,
            gst_percentage: 18,
            gst_amount: 171,
            totalPrice: 47500
          }
        ],
        order_Amount: 47500,
        deliveryCharges: 500,
        paymentType: "COD",
        type_of_delivery: "Express"
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Order Created:', response.data.data.order.orderId);
    console.log('📄 Invoice:', response.data.data.order.invoiceUrl);
    console.log('📋 Status:', response.data.data.order.status);
    
    // Redirect to order details
    window.location.href = `/orders/${response.data.data.order._id}`;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message);
  }
};
```

---

## 🔍 Differences from Old Format

### Old Format (NOT WORKING)
```json
{
  "created_by": "admin_id",
  "order_data": {
    "items": [...]  // ❌ Wrong key
  }
}
```

### New Format (CORRECT) ✅
```json
{
  "created_by": "admin_id",
  "skus": [...],  // ✅ Correct key
  "customerDetails": {...},
  "order_Amount": 50000,
  "deliveryCharges": 500,
  "paymentType": "COD"
}
```

---

## 📝 Important Notes

1. **SKU Auto-Uppercase**: All SKU codes are automatically converted to uppercase
2. **Invoice Auto-Generated**: Invoice PDF is automatically created and uploaded
3. **Queue Processing**: Dealer assignment happens asynchronously via queue
4. **Notifications**: Customer and admins are automatically notified
5. **Document Linking**: Order is automatically linked back to the document
6. **Standard Lifecycle**: Order follows the exact same lifecycle as regular orders

---

## ✅ Summary

The `createOrderFromDocument` endpoint now uses the **exact same logic** as the standard order creation, ensuring:

- ✅ Consistent order structure
- ✅ Automatic invoice generation
- ✅ Proper dealer assignment
- ✅ Cart management
- ✅ Notification system
- ✅ Standard order lifecycle

This ensures that orders created from documents are **identical** to orders created through the normal flow!
