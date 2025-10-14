# Document Upload System - Quick Reference

## 🎯 Purpose
Users upload documents (PDF/images) → Admins review → Contact customer → Create order → Order follows standard cycle

---

## 📤 User Endpoints

### Upload Document
```bash
POST /api/documents/upload
Content-Type: multipart/form-data

Required:
- description (text)
- user_id (string)
- files (PDF/images, max 10)
- email OR phone (at least one)

Optional:
- name, address, pincode
- priority (Low/Medium/High/Urgent)
- estimated_order_value
```

**Example**:
```bash
curl -X POST "http://localhost:5003/api/documents/upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "description=Need 50 brake pads urgently" \
  -F "user_id=user_id" \
  -F "email=john@example.com" \
  -F "phone=+91-9876543210" \
  -F "priority=High" \
  -F "files=@quotation.pdf"
```

---

### Get My Uploads
```bash
GET /api/documents/my-uploads?user_id=USER_ID&status=Pending-Review&page=1&limit=10
```

---

### Get Document by ID
```bash
GET /api/documents/:id
```

---

### Cancel Upload
```bash
PATCH /api/documents/:id/cancel

Body:
{
  "user_id": "user_id",
  "reason": "No longer needed"
}
```

---

## 👨‍💼 Admin Endpoints

### Get All Documents
```bash
GET /api/documents/admin/all?page=1&limit=20&status=Pending-Review&priority=High&search=brake
```

**Filters**: status, priority, assigned_to, search, startDate, endDate

---

### Assign to Staff
```bash
PATCH /api/documents/admin/:id/assign

Body:
{
  "assigned_to": "admin_user_id",
  "assigned_by": "super_admin_id"
}
```

---

### Add Contact History
```bash
POST /api/documents/admin/:id/contact

Body:
{
  "contacted_by": "admin_id",
  "contact_method": "Phone",
  "notes": "Confirmed requirements",
  "outcome": "Customer agreed"
}
```

**Contact Methods**: Phone, Email, WhatsApp, In-Person

---

### Add Admin Notes
```bash
POST /api/documents/admin/:id/notes

Body:
{
  "note": "Customer needs expedited delivery",
  "added_by": "admin_id"
}
```

---

### Add Items (Parsed from Document)
```bash
POST /api/documents/admin/:id/items

Body:
{
  "items": [
    {
      "product_name": "Brake Pads",
      "quantity": 50,
      "sku": "BRK-001",
      "notes": "Urgent"
    }
  ]
}
```

---

### ⭐ Create Order from Document
```bash
POST /api/documents/admin/:id/create-order

Body:
{
  "created_by": "admin_id",
  "order_data": {
    "items": [
      {
        "sku": "BRK-001",
        "product_name": "Brake Pads",
        "price": 800,
        "quantity": 50,
        "variant_id": "variant_id"
      }
    ],
    "order_Amount": 40000,
    "paymentType": "COD",
    "type_of_delivery": "Express",
    "deliveryCharges": 500
  }
}
```

**Result**: Creates order that enters standard order cycle (Confirmed → Assigned → Shipped → Delivered)

---

### Reject Document
```bash
PATCH /api/documents/admin/:id/reject

Body:
{
  "rejected_by": "admin_id",
  "rejection_reason": "Insufficient information"
}
```

---

### Update Status
```bash
PATCH /api/documents/admin/:id/status

Body:
{
  "status": "Under-Review",
  "updated_by": "admin_id"
}
```

**Statuses**: Pending-Review, Under-Review, Contacted, Order-Created, Rejected, Cancelled

---

### Get Statistics
```bash
GET /api/documents/admin/stats?startDate=2025-10-01&endDate=2025-10-14
```

**Returns**:
- Total documents
- Status breakdown
- Priority distribution
- Conversion rate
- Recent activity

---

## 🔄 Status Flow

```
Pending-Review (uploaded)
    ↓
Under-Review (assigned)
    ↓
Contacted (customer contacted)
    ↓
Order-Created (order created) ✅
```

**Alternative paths**:
- Rejected (by admin)
- Cancelled (by user)

---

## 📊 Priority Levels

| Priority | When to Use |
|----------|-------------|
| `Urgent` | Immediate attention needed |
| `High` | High priority, process soon |
| `Medium` | Normal priority (default) |
| `Low` | Low priority, process when available |

---

## 🔑 Access Control

| Endpoint | User/Dealer | Customer-Support | Fulfillment-Admin | Super-admin |
|----------|-------------|------------------|-------------------|-------------|
| Upload | ✅ | ❌ | ❌ | ❌ |
| View Own | ✅ | ❌ | ❌ | ❌ |
| Cancel | ✅ | ❌ | ❌ | ❌ |
| View All | ❌ | ✅ | ✅ | ✅ |
| Assign | ❌ | ❌ | ✅ | ✅ |
| Contact | ❌ | ✅ | ✅ | ✅ |
| Notes | ❌ | ✅ | ✅ | ✅ |
| Create Order | ❌ | ❌ | ✅ | ✅ |
| Reject | ❌ | ❌ | ✅ | ✅ |

---

## 🎨 Frontend Examples

### User Upload
```javascript
const formData = new FormData();
formData.append('description', 'Need parts urgently');
formData.append('user_id', userId);
formData.append('email', 'user@example.com');
formData.append('phone', '+91-1234567890');
formData.append('priority', 'High');
formData.append('files', file1);
formData.append('files', file2);

await axios.post('/api/documents/upload', formData, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### Admin Create Order
```javascript
await axios.post(`/api/documents/admin/${docId}/create-order`, {
  created_by: adminUserId,
  order_data: {
    items: [
      {
        sku: "BRK-001",
        product_name: "Brake Pads",
        price: 800,
        quantity: 50,
        variant_id: "variant_id"
      }
    ],
    order_Amount: 40000,
    paymentType: "COD"
  }
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## ✅ Key Features

✅ Multi-file upload (PDF/images)  
✅ S3 storage  
✅ Status tracking  
✅ Contact history  
✅ Admin collaboration (notes)  
✅ Order creation from documents  
✅ Orders enter standard cycle  
✅ Pagination & filtering  
✅ Statistics dashboard  
✅ Audit logging  

---

## 🚀 Typical Workflow

**User Side**:
1. Upload document with requirements
2. Wait for admin contact
3. Confirm order details
4. Receive order updates

**Admin Side**:
1. View pending documents
2. Assign to team member
3. Contact customer (phone/email)
4. Parse requirements → add items
5. Create order from document
6. Order processed normally

---

## 📝 Document Auto-Numbering

Format: `DOC-YYYYMM-XXXXX`

Example: `DOC-202510-00001`
- Year-Month: 202510
- Sequential: 00001

---

For complete documentation, see: `DOCUMENT_UPLOAD_SYSTEM_DOCUMENTATION.md`
