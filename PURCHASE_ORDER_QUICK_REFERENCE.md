# Purchase Order API - Quick Reference

## Base URL
```
/api/purchaseorders
```

---

## Quick API Reference

### 1️⃣ Create Purchase Order
```bash
POST /api/purchaseorders
Content-Type: multipart/form-data
```

**FormData**:
- `description` (required)
- `user_id` (required)
- `files` (required, max 10)
- `priority` (optional: Low/Medium/High/Urgent)
- `estimated_value` (optional)
- `vendor_details[name]` (optional)

**Example**:
```bash
curl -X POST "http://localhost:5001/api/purchaseorders" \
  -H "Authorization: Bearer TOKEN" \
  -F "description=Need spare parts urgently" \
  -F "user_id=user_id" \
  -F "priority=High" \
  -F "files=@document.pdf"
```

---

### 2️⃣ Get All Purchase Orders (Paginated)
```bash
GET /api/purchaseorders?page=1&limit=10&status=Pending&priority=High&search=urgent
```

**Query Params**:
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status
- `priority` - Filter by priority
- `search` - Search term
- `startDate`, `endDate` - Date range

---

### 3️⃣ Get Purchase Order by ID
```bash
GET /api/purchaseorders/:id
```

Returns purchase order with populated user and reviewer details.

---

### 4️⃣ Get by User ID
```bash
GET /api/purchaseorders/user/:user_id?status=Pending
```

---

### 5️⃣ Get Statistics
```bash
GET /api/purchaseorders/stats?startDate=2025-10-01&endDate=2025-10-14
```

Returns:
- Total orders
- Status breakdown
- Priority breakdown  
- Estimated values
- Approval rate

---

### 6️⃣ Update Purchase Order
```bash
PUT /api/purchaseorders/:id
Content-Type: multipart/form-data
```

**FormData**:
- `description` (optional)
- `files` (optional, appends to existing)

---

### 7️⃣ Update Status
```bash
PATCH /api/purchaseorders/:id/status
Content-Type: application/json
```

**Body**:
```json
{
  "status": "Approved",
  "reviewed_by": "admin_id",
  "admin_notes": "Approved for processing"
}
```

**Status Values**: Pending, Approved, Rejected, In-Review, Cancelled

---

### 8️⃣ Delete Purchase Order
```bash
DELETE /api/purchaseorders/:id
```

---

## Status Values

| Status | Description |
|--------|-------------|
| `Pending` | Awaiting review |
| `In-Review` | Being reviewed |
| `Approved` | Accepted |
| `Rejected` | Declined |
| `Cancelled` | Cancelled |

---

## Priority Values

| Priority | Description |
|----------|-------------|
| `Urgent` | Immediate attention |
| `High` | High priority |
| `Medium` | Normal (default) |
| `Low` | Low priority |

---

## Response Structure

### Success (200/201)
```json
{
  "success": true,
  "data": { /* purchase order data */ },
  "message": "Success message"
}
```

### Error (400/404/500)
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Access Control

| Endpoint | User | Dealer | Admin |
|----------|------|--------|-------|
| Create | ✅ | ✅ | ✅ |
| Get All | ✅ | ✅ | ✅ |
| Get by ID | ✅ | ✅ | ✅ |
| Get by User | ✅ | ✅ | ✅ |
| Update | ✅ | ✅ | ✅ |
| Update Status | ❌ | ❌ | ✅ |
| Delete | ❌ | ❌ | ✅ |
| Statistics | ❌ | ❌ | ✅ |

---

## JavaScript Examples

### Create
```javascript
const formData = new FormData();
formData.append('description', 'Need parts');
formData.append('user_id', userId);
formData.append('priority', 'High');
formData.append('files', file1);
formData.append('files', file2);

await axios.post('/api/purchaseorders', formData, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Get All
```javascript
const response = await axios.get(
  '/api/purchaseorders?page=1&limit=10&status=Pending',
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Update Status
```javascript
await axios.patch(`/api/purchaseorders/${id}/status`, {
  status: 'Approved',
  reviewed_by: adminId,
  admin_notes: 'Approved'
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## Enhanced Features

✅ **Pagination** - Efficient data loading  
✅ **Search** - Find orders by keywords  
✅ **Filtering** - Status, priority, date range  
✅ **User Details** - Populated creator & reviewer info  
✅ **Statistics** - Dashboard metrics  
✅ **File Upload** - Multiple attachments  
✅ **Status Tracking** - Full workflow  
✅ **Priority Management** - Urgent to Low  
✅ **Audit Trail** - Review history  

---

## Common Use Cases

### User Submits PO
```
1. Fill form with description
2. Select priority level
3. Upload documents (invoices, quotes, etc.)
4. Submit
5. Status: Pending
```

### Admin Reviews PO
```
1. View pending POs
2. Open specific PO
3. Review documents
4. Approve or Reject with notes
5. User notified
```

### Dashboard View
```
1. View statistics
2. See pending count
3. Check approval rate
4. Monitor urgent items
```

---

For complete documentation, see: `PURCHASE_ORDER_ENDPOINTS_DOCUMENTATION.md`
