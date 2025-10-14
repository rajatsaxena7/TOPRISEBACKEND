# Document Upload System - Request & Response Examples

## Complete cURL Examples

### 1. User Uploads Document

```bash
curl -X POST "http://localhost:5003/api/documents/upload" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "description=I urgently need the following items for my workshop: 50 units of premium brake pads (compatible with Honda City), 20 units of oil filters (standard grade), and 10 units of air filters. Please prioritize this order as we have pending customer orders." \
  -F "user_id=66f4a1b2c3d4e5f6a7b8c9d0" \
  -F "name=Rajesh Kumar" \
  -F "email=rajesh.workshop@example.com" \
  -F "phone=+91-9876543210" \
  -F "address=Shop No. 45, MG Road, Bangalore" \
  -F "pincode=560001" \
  -F "priority=Urgent" \
  -F "estimated_order_value=75000" \
  -F "files=@quotation-oct2025.pdf" \
  -F "files=@product-requirements.jpg" \
  -F "files=@previous-invoice.pdf"
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "document_number": "DOC-202510-00042",
    "document_files": [
      {
        "url": "https://toprise-bucket.s3.amazonaws.com/document-uploads/quotation-oct2025-1729001234567.pdf",
        "file_type": "pdf",
        "file_name": "quotation-oct2025.pdf",
        "uploaded_at": "2025-10-14T12:30:45.000Z",
        "_id": "671234567890abcdef123457"
      },
      {
        "url": "https://toprise-bucket.s3.amazonaws.com/document-uploads/product-requirements-1729001234568.jpg",
        "file_type": "image",
        "file_name": "product-requirements.jpg",
        "uploaded_at": "2025-10-14T12:30:46.000Z",
        "_id": "671234567890abcdef123458"
      },
      {
        "url": "https://toprise-bucket.s3.amazonaws.com/document-uploads/previous-invoice-1729001234569.pdf",
        "file_type": "pdf",
        "file_name": "previous-invoice.pdf",
        "uploaded_at": "2025-10-14T12:30:47.000Z",
        "_id": "671234567890abcdef123459"
      }
    ],
    "description": "I urgently need the following items for my workshop...",
    "customer_details": {
      "user_id": "66f4a1b2c3d4e5f6a7b8c9d0",
      "name": "Rajesh Kumar",
      "email": "rajesh.workshop@example.com",
      "phone": "+91-9876543210",
      "address": "Shop No. 45, MG Road, Bangalore",
      "pincode": "560001"
    },
    "status": "Pending-Review",
    "priority": "Urgent",
    "estimated_order_value": 75000,
    "admin_notes": [],
    "contact_history": [],
    "items_requested": [],
    "createdAt": "2025-10-14T12:30:45.000Z",
    "updatedAt": "2025-10-14T12:30:45.000Z",
    "__v": 0
  },
  "message": "Document uploaded successfully. Our team will review and contact you soon."
}
```

---

### 2. User Gets Their Uploads

```bash
curl -X GET "http://localhost:5003/api/documents/my-uploads?user_id=66f4a1b2c3d4e5f6a7b8c9d0&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "671234567890abcdef123456",
        "document_number": "DOC-202510-00042",
        "description": "I urgently need...",
        "status": "Contacted",
        "priority": "Urgent",
        "customer_details": {
          "user_id": "66f4a1b2c3d4e5f6a7b8c9d0",
          "name": "Rajesh Kumar",
          "email": "rajesh.workshop@example.com"
        },
        "order_id": {
          "orderId": "TOP-ORD-1729001500",
          "status": "Confirmed",
          "order_Amount": 72500
        },
        "createdAt": "2025-10-14T12:30:45.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 3. Admin Views All Documents

```bash
curl -X GET "http://localhost:5003/api/documents/admin/all?page=1&limit=20&status=Pending-Review&priority=Urgent&search=brake" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### 4. Admin Assigns Document

```bash
curl -X PATCH "http://localhost:5003/api/documents/admin/671234567890abcdef123456/assign" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_to": "66f4a1b2c3d4e5f6a7b8c9d1",
    "assigned_by": "66f4a1b2c3d4e5f6a7b8c9d2"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "document_number": "DOC-202510-00042",
    "status": "Under-Review",
    "assigned_to": "66f4a1b2c3d4e5f6a7b8c9d1",
    "assigned_at": "2025-10-14T13:00:00.000Z",
    "admin_notes": [
      {
        "note": "Document assigned to 66f4a1b2c3d4e5f6a7b8c9d1",
        "added_by": "66f4a1b2c3d4e5f6a7b8c9d2",
        "added_at": "2025-10-14T13:00:00.000Z",
        "_id": "671234567890abcdef12345a"
      }
    ]
  },
  "message": "Document assigned successfully"
}
```

---

### 5. Admin Contacts Customer

```bash
curl -X POST "http://localhost:5003/api/documents/admin/671234567890abcdef123456/contact" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contacted_by": "66f4a1b2c3d4e5f6a7b8c9d1",
    "contact_method": "Phone",
    "notes": "Spoke with Rajesh. Confirmed he needs: 50x Brake Pads (Honda City compatible - SKU: BRK-HC-001), 20x Oil Filters (Standard - SKU: OIL-STD-002), 10x Air Filters (SKU: AIR-FLT-003). Customer confirmed delivery address. Requested express delivery.",
    "outcome": "Customer confirmed all details. Ready to proceed with order creation. Customer will pay via COD."
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "671234567890abcdef123456",
    "status": "Contacted",
    "contact_history": [
      {
        "contacted_by": "66f4a1b2c3d4e5f6a7b8c9d1",
        "contacted_at": "2025-10-14T14:00:00.000Z",
        "contact_method": "Phone",
        "notes": "Spoke with Rajesh. Confirmed he needs...",
        "outcome": "Customer confirmed all details...",
        "_id": "671234567890abcdef12345b"
      }
    ]
  },
  "message": "Contact history added successfully"
}
```

---

### 6. Admin Adds Items (Parsed from Document)

```bash
curl -X POST "http://localhost:5003/api/documents/admin/671234567890abcdef123456/items" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_name": "Brake Pads - Honda City Compatible",
        "quantity": 50,
        "sku": "BRK-HC-001",
        "notes": "Premium quality, customer verified compatibility"
      },
      {
        "product_name": "Oil Filter - Standard Grade",
        "quantity": 20,
        "sku": "OIL-STD-002",
        "notes": ""
      },
      {
        "product_name": "Air Filter",
        "quantity": 10,
        "sku": "AIR-FLT-003",
        "notes": ""
      }
    ]
  }'
```

---

### 7. ⭐ Admin Creates Order from Document

```bash
curl -X POST "http://localhost:5003/api/documents/admin/671234567890abcdef123456/create-order" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "created_by": "66f4a1b2c3d4e5f6a7b8c9d1",
    "order_data": {
      "items": [
        {
          "sku": "BRK-HC-001",
          "product_name": "Brake Pads - Honda City Compatible",
          "price": 950,
          "quantity": 50,
          "images": ["https://s3.../brake-pads.jpg"],
          "variant_id": "66f4a1b2c3d4e5f6a7b8c9e1"
        },
        {
          "sku": "OIL-STD-002",
          "product_name": "Oil Filter - Standard Grade",
          "price": 450,
          "quantity": 20,
          "images": ["https://s3.../oil-filter.jpg"],
          "variant_id": "66f4a1b2c3d4e5f6a7b8c9e2"
        },
        {
          "sku": "AIR-FLT-003",
          "product_name": "Air Filter",
          "price": 600,
          "quantity": 10,
          "images": ["https://s3.../air-filter.jpg"],
          "variant_id": "66f4a1b2c3d4e5f6a7b8c9e3"
        }
      ],
      "order_Amount": 72500,
      "paymentType": "COD",
      "type_of_delivery": "Express",
      "delivery_type": "standard",
      "deliveryCharges": 500,
      "customerDetails": {
        "name": "Rajesh Kumar",
        "phone": "+91-9876543210",
        "email": "rajesh.workshop@example.com",
        "address": "Shop No. 45, MG Road, Bangalore",
        "pincode": "560001"
      }
    }
  }'
```

**Response (200)**:
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
          "note": "Document assigned to 66f4a1b2c3d4e5f6a7b8c9d1",
          "added_by": "66f4a1b2c3d4e5f6a7b8c9d2",
          "added_at": "2025-10-14T13:00:00.000Z"
        },
        {
          "note": "Order TOP-ORD-1729001500 created from this document",
          "added_by": "66f4a1b2c3d4e5f6a7b8c9d1",
          "added_at": "2025-10-14T15:00:00.000Z",
          "_id": "671234567890abcdef12345c"
        }
      ]
    },
    "order": {
      "_id": "671234567890abcdef123460",
      "orderId": "TOP-ORD-1729001500",
      "orderDate": "2025-10-14T15:00:00.000Z",
      "status": "Confirmed",
      "items": [
        {
          "sku": "BRK-HC-001",
          "product_name": "Brake Pads - Honda City Compatible",
          "price": 950,
          "quantity": 50,
          "images": ["https://s3.../brake-pads.jpg"],
          "variant_id": "66f4a1b2c3d4e5f6a7b8c9e1",
          "total": 47500
        },
        {
          "sku": "OIL-STD-002",
          "product_name": "Oil Filter - Standard Grade",
          "price": 450,
          "quantity": 20,
          "images": ["https://s3.../oil-filter.jpg"],
          "variant_id": "66f4a1b2c3d4e5f6a7b8c9e2",
          "total": 9000
        },
        {
          "sku": "AIR-FLT-003",
          "product_name": "Air Filter",
          "price": 600,
          "quantity": 10,
          "images": ["https://s3.../air-filter.jpg"],
          "variant_id": "66f4a1b2c3d4e5f6a7b8c9e3",
          "total": 6000
        }
      ],
      "order_Amount": 72500,
      "deliveryCharges": 500,
      "customerDetails": {
        "userId": "66f4a1b2c3d4e5f6a7b8c9d0",
        "name": "Rajesh Kumar",
        "phone": "+91-9876543210",
        "email": "rajesh.workshop@example.com",
        "address": "Shop No. 45, MG Road, Bangalore",
        "pincode": "560001"
      },
      "paymentType": "COD",
      "type_of_delivery": "Express",
      "delivery_type": "standard",
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

**💡 Important**: The created order now enters the standard order lifecycle:
1. ✅ **Confirmed** (current status)
2. 📦 **Assigned** (to dealer)
3. 🔍 **Scanning** (dealer scans items)
4. 📦 **Packed** (items packed)
5. 🚚 **Shipped** (order dispatched)
6. ✅ **Delivered** (order completed)

---

### 8. Admin Rejects Document

```bash
curl -X PATCH "http://localhost:5003/api/documents/admin/671234567890abcdef123456/reject" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejected_by": "66f4a1b2c3d4e5f6a7b8c9d1",
    "rejection_reason": "Insufficient information provided. Customer needs to upload clearer product specifications and quantities. Also, the uploaded quotation is from a third-party vendor which we do not work with."
  }'
```

---

### 9. Get Document Statistics

```bash
curl -X GET "http://localhost:5003/api/documents/admin/stats?startDate=2025-10-01&endDate=2025-10-14" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 156,
    "byStatus": {
      "pendingReview": 32,
      "underReview": 28,
      "contacted": 45,
      "orderCreated": 42,
      "rejected": 7,
      "cancelled": 2
    },
    "byPriority": {
      "Low": 25,
      "Medium": 78,
      "High": 43,
      "Urgent": 10
    },
    "conversionRate": "26.92%",
    "recentActivity": {
      "last7Days": 48
    }
  },
  "message": "Statistics retrieved successfully"
}
```

---

## Error Responses

### 400 Bad Request - Missing Required Fields
```json
{
  "success": false,
  "message": "Description, user_id, and at least one file are required"
}
```

### 400 Bad Request - Missing Contact Info
```json
{
  "success": false,
  "message": "Either email or phone number is required for contact"
}
```

### 403 Forbidden - Not Owner
```json
{
  "success": false,
  "message": "You can only cancel your own documents"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Document not found"
}
```

### 400 Bad Request - Already Processed
```json
{
  "success": false,
  "message": "Cannot cancel - order has already been created from this document"
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

## JavaScript/Axios Examples

### User Upload Document
```javascript
const uploadDocument = async () => {
  const formData = new FormData();
  formData.append('description', documentDescription);
  formData.append('user_id', currentUserId);
  formData.append('email', 'user@example.com');
  formData.append('phone', '+91-9876543210');
  formData.append('priority', 'High');
  
  selectedFiles.forEach(file => {
    formData.append('files', file);
  });

  try {
    const response = await axios.post(
      'http://localhost:5003/api/documents/upload',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    console.log('Document Number:', response.data.data.document_number);
    toast.success('Document uploaded successfully!');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Upload failed');
  }
};
```

### Admin Create Order
```javascript
const createOrderFromDocument = async (documentId) => {
  try {
    const response = await axios.post(
      `http://localhost:5003/api/documents/admin/${documentId}/create-order`,
      {
        created_by: adminUserId,
        order_data: {
          items: [
            {
              sku: "BRK-HC-001",
              product_name: "Brake Pads",
              price: 950,
              quantity: 50,
              variant_id: "variant_id"
            }
          ],
          order_Amount: 47500,
          paymentType: "COD",
          type_of_delivery: "Express"
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Order Created:', response.data.data.order.orderId);
    console.log('Order Status:', response.data.data.order.status);
    toast.success('Order created successfully!');
    
    // Redirect to order details
    router.push(`/orders/${response.data.data.order._id}`);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to create order');
  }
};
```

---

## Common Workflows

### Complete User → Order Workflow

**Step 1: User Uploads**
```bash
POST /api/documents/upload
→ Response: document_number = "DOC-202510-00042", status = "Pending-Review"
```

**Step 2: Admin Assigns**
```bash
PATCH /api/documents/admin/{id}/assign
→ Response: status = "Under-Review", assigned_to = admin_id
```

**Step 3: Admin Contacts**
```bash
POST /api/documents/admin/{id}/contact
→ Response: status = "Contacted", contact_history added
```

**Step 4: Admin Adds Items**
```bash
POST /api/documents/admin/{id}/items
→ Response: items_requested populated
```

**Step 5: Admin Creates Order**
```bash
POST /api/documents/admin/{id}/create-order
→ Response: status = "Order-Created", order_id = new_order_id
→ Order Status: "Confirmed" (enters standard order cycle)
```

**Step 6: Order Lifecycle Continues**
```
Order follows standard flow:
Confirmed → Assigned → Scanning → Packed → Shipped → Delivered
```

---

## Tips

1. **File Uploads**: Use `FormData` for file uploads
2. **Order Creation**: Verify all item details before creating order
3. **Contact Customer**: Always contact before creating order
4. **Error Handling**: Check for specific error messages
5. **Status Tracking**: Monitor document status changes
6. **Order Linking**: Created orders are linked back to documents

---

For complete documentation, see:
- `DOCUMENT_UPLOAD_SYSTEM_DOCUMENTATION.md` - Full system documentation
- `DOCUMENT_UPLOAD_QUICK_REFERENCE.md` - Quick reference guide
