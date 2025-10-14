# Purchase Order - Request Body Examples

## 1. Create Purchase Order

**Endpoint**: `POST /api/purchaseorders`  
**Content-Type**: `multipart/form-data`

### Minimal Request (Required Fields Only)
```bash
curl -X POST "http://localhost:5001/api/purchaseorders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Need spare parts for urgent repair" \
  -F "user_id=66f4a1b2c3d4e5f6a7b8c9d0" \
  -F "files=@invoice.pdf"
```

### Complete Request (All Fields)
```bash
curl -X POST "http://localhost:5001/api/purchaseorders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Bulk order of automotive spare parts for Q4 2025" \
  -F "user_id=66f4a1b2c3d4e5f6a7b8c9d0" \
  -F "priority=Urgent" \
  -F "estimated_value=250000" \
  -F "vendor_details[name]=ABC Auto Parts Pvt Ltd" \
  -F "vendor_details[contact]=+91-9876543210" \
  -F "vendor_details[email]=sales@abcauto.com" \
  -F "files=@quotation.pdf" \
  -F "files=@specifications.pdf" \
  -F "files=@product-catalog.pdf"
```

### JavaScript/FormData Example
```javascript
const formData = new FormData();
formData.append('description', 'Need spare parts urgently');
formData.append('user_id', userId);
formData.append('priority', 'High');
formData.append('estimated_value', 50000);
formData.append('vendor_details[name]', 'XYZ Suppliers');
formData.append('vendor_details[contact]', '+91-1234567890');
formData.append('vendor_details[email]', 'contact@xyz.com');

// Add files
files.forEach(file => {
  formData.append('files', file);
});

const response = await axios.post('/api/purchaseorders', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## 2. Update Purchase Order

**Endpoint**: `PUT /api/purchaseorders/:id`  
**Content-Type**: `multipart/form-data`

### Update Description Only
```bash
curl -X PUT "http://localhost:5001/api/purchaseorders/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Updated requirements - now need additional items"
```

### Add More Files
```bash
curl -X PUT "http://localhost:5001/api/purchaseorders/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@additional-document.pdf" \
  -F "files=@updated-specs.pdf"
```

### Update Description and Add Files
```bash
curl -X PUT "http://localhost:5001/api/purchaseorders/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Updated description with revised requirements" \
  -F "files=@revised-quotation.pdf"
```

---

## 3. Update Purchase Order Status

**Endpoint**: `PATCH /api/purchaseorders/:id/status`  
**Content-Type**: `application/json`

### Approve Purchase Order
```bash
curl -X PATCH "http://localhost:5001/api/purchaseorders/68ee267d99e65323879795fa/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Approved",
    "reviewed_by": "66f4a1b2c3d4e5f6a7b8c9d0",
    "admin_notes": "Approved for immediate processing. Vendor confirmed availability."
  }'
```

### Reject Purchase Order
```bash
curl -X PATCH "http://localhost:5001/api/purchaseorders/68ee267d99e65323879795fa/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Rejected",
    "reviewed_by": "66f4a1b2c3d4e5f6a7b8c9d0",
    "admin_notes": "Rejected due to insufficient documentation. Please provide detailed specifications."
  }'
```

### Move to In-Review
```bash
curl -X PATCH "http://localhost:5001/api/purchaseorders/68ee267d99e65323879795fa/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In-Review",
    "admin_notes": "Under review by procurement team"
  }'
```

### Cancel Purchase Order
```bash
curl -X PATCH "http://localhost:5001/api/purchaseorders/68ee267d99e65323879795fa/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Cancelled",
    "admin_notes": "Cancelled as per user request"
  }'
```

### JavaScript Example
```javascript
const updateStatus = async (id, status, notes) => {
  await axios.patch(`/api/purchaseorders/${id}/status`, {
    status: status,
    reviewed_by: adminUserId,
    admin_notes: notes
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Usage
await updateStatus('po_id', 'Approved', 'Approved for processing');
```

---

## Request Body Fields Reference

### Create Purchase Order

| Field | Type | Required | Default | Example |
|-------|------|----------|---------|---------|
| `description` | String | ✅ Yes | - | "Need parts urgently" |
| `user_id` | String | ✅ Yes | - | "user_id" |
| `files` | File[] | ✅ Yes | - | [file1.pdf, file2.jpg] |
| `priority` | Enum | No | Medium | "High" |
| `estimated_value` | Number | No | 0 | 50000 |
| `vendor_details[name]` | String | No | - | "ABC Suppliers" |
| `vendor_details[contact]` | String | No | - | "+91-9876543210" |
| `vendor_details[email]` | String | No | - | "sales@abc.com" |

### Update Purchase Order

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | String | No | Updated description |
| `files` | File[] | No | Additional files (appended) |

### Update Status

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | Enum | ✅ Yes | Pending, Approved, Rejected, In-Review, Cancelled |
| `reviewed_by` | String | No | Admin user ID (auto-recorded) |
| `admin_notes` | String | No | Admin comments/reason |

---

## Complete Examples

### Example 1: User Creates Urgent PO
```bash
curl -X POST "http://localhost:5001/api/purchaseorders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Emergency requirement for brake pads and oil filters. Need immediate delivery." \
  -F "user_id=user_id_here" \
  -F "priority=Urgent" \
  -F "estimated_value=75000" \
  -F "vendor_details[name]=Quick Parts Suppliers" \
  -F "vendor_details[contact]=+91-9999888877" \
  -F "vendor_details[email]=urgent@quickparts.com" \
  -F "files=@quotation.pdf" \
  -F "files=@requirements-list.xlsx" \
  -F "files=@technical-specs.pdf"
```

### Example 2: Admin Approves PO
```bash
curl -X PATCH "http://localhost:5001/api/purchaseorders/po_id/status" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Approved",
    "reviewed_by": "admin_user_id",
    "admin_notes": "Approved. Vendor confirmed delivery within 3 days. Proceed with payment."
  }'
```

### Example 3: Search High Priority Pending Orders
```bash
curl -X GET "http://localhost:5001/api/purchaseorders?page=1&limit=20&status=Pending&priority=High" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Get User's All POs
```bash
curl -X GET "http://localhost:5001/api/purchaseorders/user/user_id_here" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 5: View Dashboard Statistics
```bash
curl -X GET "http://localhost:5001/api/purchaseorders/stats" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Field Validation

### Priority Field
- **Valid Values**: `"Low"`, `"Medium"`, `"High"`, `"Urgent"`
- **Default**: `"Medium"`
- **Case Sensitive**: Use exact capitalization

### Status Field
- **Valid Values**: `"Pending"`, `"Approved"`, `"Rejected"`, `"In-Review"`, `"Cancelled"`
- **Default**: `"Pending"` (on creation)
- **Admin Only**: Status updates restricted to admins

### Files
- **Max Count**: 10 files per upload
- **Formats**: PDF, Images, Documents
- **Storage**: AWS S3
- **Field Name**: `files` (array)

### Estimated Value
- **Type**: Number
- **Min**: 0 (cannot be negative)
- **Currency**: INR (Indian Rupees)

---

## Response Data Structure

### Purchase Order Object
```json
{
  "_id": "68ee267d99e65323879795fa",
  "purchase_order_number": "PO-2025-001",
  "description": "Purchase order description",
  "status": "Pending",
  "priority": "High",
  "user_id": "user_id",
  "reviewed_by": "admin_id",
  "reviewed_at": "2025-10-14T13:00:00.000Z",
  "admin_notes": "Admin comments",
  "req_files": [
    "https://s3.amazonaws.com/bucket/file1.pdf",
    "https://s3.amazonaws.com/bucket/file2.pdf"
  ],
  "estimated_value": 50000,
  "vendor_details": {
    "name": "Vendor Name",
    "contact": "+91-1234567890",
    "email": "vendor@example.com"
  },
  "user_details": {
    "_id": "user_id",
    "email": "user@example.com",
    "username": "johndoe",
    "phone_Number": "+91-9876543210",
    "role": "User"
  },
  "reviewer_details": {
    "_id": "admin_id",
    "email": "admin@example.com",
    "username": "adminuser",
    "role": "Super-admin"
  },
  "createdAt": "2025-10-14T12:00:00.000Z",
  "updatedAt": "2025-10-14T13:00:00.000Z"
}
```

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | PO fetched/updated |
| 201 | Created | PO created successfully |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | PO doesn't exist |
| 500 | Server Error | Processing error |

---

## Tips

1. **File Uploads**: Always use `multipart/form-data`
2. **Status Updates**: Use JSON, not FormData
3. **Priority**: Set appropriately to help admins prioritize
4. **Vendor Details**: Include for faster processing
5. **Search**: Use for finding specific POs quickly
6. **Pagination**: Use for better performance with large datasets

---

## Complete Documentation

See `PURCHASE_ORDER_ENDPOINTS_DOCUMENTATION.md` for:
- Full API documentation
- Frontend integration examples
- React components
- Use cases
- Best practices
