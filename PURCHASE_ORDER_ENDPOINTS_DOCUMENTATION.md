# Purchase Order Management - API Documentation

## Overview
Comprehensive purchase order management system with file upload, status tracking, user details population, pagination, filtering, and statistics.

## Base URL
```
/api/purchaseorders
```

---

## API Endpoints Summary

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/` | Create purchase order | User, Dealer, Admin |
| GET | `/` | Get all purchase orders (paginated) | User, Dealer, Admin |
| GET | `/stats` | Get statistics | Admin only |
| GET | `/filter` | Get filtered purchase orders | User, Dealer, Admin |
| GET | `/user/:user_id` | Get by user ID | User, Dealer, Admin |
| GET | `/:id` | Get by ID with user details | User, Dealer, Admin |
| PUT | `/:id` | Update purchase order | User, Dealer, Admin |
| PATCH | `/:id/status` | Update status only | Admin only |
| DELETE | `/:id` | Delete purchase order | Admin only |

---

## 1. Create Purchase Order

**Endpoint**: `POST /api/purchaseorders`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer  
**Content-Type**: `multipart/form-data`

### Request (FormData)
```bash
curl -X POST "http://localhost:5001/api/purchaseorders" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Need urgent delivery of spare parts for Project X" \
  -F "user_id=66f4a1b2c3d4e5f6a7b8c9d0" \
  -F "priority=High" \
  -F "estimated_value=50000" \
  -F "vendor_details[name]=ABC Suppliers" \
  -F "vendor_details[contact]=+91-9876543210" \
  -F "vendor_details[email]=supplier@abc.com" \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf" \
  -F "files=@image.jpg"
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | String | ✅ Yes | Purchase order description/requirements |
| `user_id` | String | ✅ Yes | User ID creating the order |
| `files` | File[] | ✅ Yes | Attachment files (max 10) |
| `priority` | Enum | No | Low, Medium, High, Urgent (default: Medium) |
| `estimated_value` | Number | No | Estimated order value |
| `vendor_details[name]` | String | No | Vendor name |
| `vendor_details[contact]` | String | No | Vendor contact |
| `vendor_details[email]` | String | No | Vendor email |

### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "68ee267d99e65323879795fa",
    "purchase_order_number": null,
    "req_files": [
      "https://s3.amazonaws.com/bucket/purchase-orders/document1.pdf",
      "https://s3.amazonaws.com/bucket/purchase-orders/document2.pdf"
    ],
    "description": "Need urgent delivery of spare parts",
    "status": "Pending",
    "user_id": "66f4a1b2c3d4e5f6a7b8c9d0",
    "priority": "High",
    "estimated_value": 50000,
    "vendor_details": {
      "name": "ABC Suppliers",
      "contact": "+91-9876543210",
      "email": "supplier@abc.com"
    },
    "createdAt": "2025-10-14T12:00:00.000Z",
    "updatedAt": "2025-10-14T12:00:00.000Z"
  },
  "message": "Purchase order created successfully"
}
```

---

## 2. Get All Purchase Orders (Paginated)

**Endpoint**: `GET /api/purchaseorders`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 20) |
| `status` | String | Filter by status |
| `priority` | String | Filter by priority |
| `user_id` | String | Filter by user |
| `search` | String | Search in description, PO number |
| `startDate` | Date | Filter from date |
| `endDate` | Date | Filter to date |

### Example
```bash
GET /api/purchaseorders?page=1&limit=10&status=Pending&priority=High&search=urgent
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "po_id",
        "purchase_order_number": "PO-2025-001",
        "description": "Urgent spare parts needed",
        "status": "Pending",
        "priority": "High",
        "user_id": "user_id",
        "estimated_value": 50000,
        "req_files": [...],
        "createdAt": "2025-10-14T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "filters": {
      "status": "Pending",
      "priority": "High",
      "search": "urgent"
    }
  }
}
```

---

## 3. Get Purchase Order by ID

**Endpoint**: `GET /api/purchaseorders/:id`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

### Example
```bash
GET /api/purchaseorders/68ee267d99e65323879795fa
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "68ee267d99e65323879795fa",
    "purchase_order_number": "PO-2025-001",
    "description": "Need urgent delivery",
    "status": "Approved",
    "priority": "High",
    "user_id": "user_id",
    "reviewed_by": "admin_id",
    "reviewed_at": "2025-10-14T13:00:00.000Z",
    "admin_notes": "Approved for immediate processing",
    "req_files": [
      "https://s3.../document1.pdf",
      "https://s3.../document2.pdf"
    ],
    "estimated_value": 50000,
    "vendor_details": {
      "name": "ABC Suppliers",
      "contact": "+91-9876543210",
      "email": "supplier@abc.com"
    },
    "user_details": {
      "_id": "user_id",
      "email": "user@example.com",
      "username": "johndoe",
      "phone_Number": "+91-1234567890",
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
  },
  "message": "Purchase order fetched successfully"
}
```

---

## 4. Get Purchase Orders by User ID

**Endpoint**: `GET /api/purchaseorders/user/:user_id`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | String | Filter by status |

### Example
```bash
GET /api/purchaseorders/user/66f4a1b2c3d4e5f6a7b8c9d0?status=Pending
```

### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "po_id",
      "description": "Purchase order description",
      "status": "Pending",
      "user_id": "66f4a1b2c3d4e5f6a7b8c9d0",
      "req_files": [...],
      "createdAt": "2025-10-14T12:00:00.000Z"
    }
  ],
  "message": "Purchase orders fetched successfully"
}
```

---

## 5. Get Filtered Purchase Orders

**Endpoint**: `GET /api/purchaseorders/filter`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | String | Filter by status |
| `user_id` | String | Filter by user |
| `startDate` | Date | From date |
| `endDate` | Date | To date |

### Example
```bash
GET /api/purchaseorders/filter?status=Approved&startDate=2025-10-01&endDate=2025-10-14
```

---

## 6. Get Purchase Order Statistics

**Endpoint**: `GET /api/purchaseorders/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | Date | From date (optional) |
| `endDate` | Date | To date (optional) |

### Example
```bash
GET /api/purchaseorders/stats?startDate=2025-10-01&endDate=2025-10-14
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "pending": 45,
      "approved": 80,
      "rejected": 15,
      "inReview": 8,
      "cancelled": 2
    },
    "byPriority": {
      "Low": 20,
      "Medium": 75,
      "High": 45,
      "Urgent": 10
    },
    "estimatedValue": {
      "total": 5000000,
      "average": 33333.33
    },
    "recentActivity": {
      "last7Days": 25
    },
    "approvalRate": "53.33%"
  },
  "message": "Purchase order statistics retrieved successfully"
}
```

---

## 7. Update Purchase Order

**Endpoint**: `PUT /api/purchaseorders/:id`  
**Access**: Super-admin, Fulfillment-Admin, User, Dealer  
**Content-Type**: `multipart/form-data`

### Request (FormData)
```bash
curl -X PUT "http://localhost:5001/api/purchaseorders/:id" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Updated description with more details" \
  -F "files=@new-document.pdf"
```

### Request Fields (All Optional)
- `description` - Updated description
- `files` - Additional files to append

**Note**: New files are appended to existing files, not replaced.

### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "po_id",
    "description": "Updated description",
    "req_files": [
      "https://s3.../old-file.pdf",
      "https://s3.../new-document.pdf"
    ],
    "updatedAt": "2025-10-14T13:00:00.000Z"
  },
  "message": "Purchase order updated successfully"
}
```

---

## 8. Update Purchase Order Status

**Endpoint**: `PATCH /api/purchaseorders/:id/status`  
**Access**: Super-admin, Fulfillment-Admin

### Request Body
```json
{
  "status": "Approved",
  "reviewed_by": "admin_user_id",
  "admin_notes": "Approved for immediate processing"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | Enum | ✅ Yes | Pending, Approved, Rejected, In-Review, Cancelled |
| `reviewed_by` | String | No | Admin user ID (auto-set for Approved/Rejected) |
| `admin_notes` | String | No | Admin comments |

### Example
```bash
curl -X PATCH "http://localhost:5001/api/purchaseorders/:id/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Approved",
    "reviewed_by": "admin_id",
    "admin_notes": "Approved for immediate processing"
  }'
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "po_id",
    "status": "Approved",
    "reviewed_by": "admin_id",
    "reviewed_at": "2025-10-14T13:00:00.000Z",
    "admin_notes": "Approved for immediate processing"
  },
  "message": "Purchase order status updated successfully"
}
```

---

## 9. Delete Purchase Order

**Endpoint**: `DELETE /api/purchaseorders/:id`  
**Access**: Super-admin, Fulfillment-Admin

### Example
```bash
DELETE /api/purchaseorders/68ee267d99e65323879795fa
```

### Response (200)
```json
{
  "success": true,
  "data": null,
  "message": "Purchase order deleted successfully"
}
```

---

## Enhanced Model Schema

```javascript
{
  purchase_order_number: String (unique, optional),
  req_files: [String] (required),
  description: String (required),
  status: Enum (Pending, Approved, Rejected, In-Review, Cancelled),
  user_id: String (required, indexed),
  reviewed_by: String (optional),
  reviewed_at: Date (optional),
  admin_notes: String (optional),
  priority: Enum (Low, Medium, High, Urgent),
  estimated_value: Number (default: 0),
  vendor_details: {
    name: String,
    contact: String,
    email: String
  },
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## Status Flow

```
Pending (Created)
   ↓
In-Review (Being reviewed by admin)
   ↓
Approved ✅ or Rejected ❌
   ↓
Cancelled (If needed)
```

### Status Values
- **Pending**: Newly created, awaiting review
- **In-Review**: Being reviewed by admin
- **Approved**: Accepted and ready for processing
- **Rejected**: Declined with admin notes
- **Cancelled**: Cancelled by user or admin

---

## Priority Levels

- **Urgent**: Immediate attention required
- **High**: High priority, process soon
- **Medium**: Normal priority (default)
- **Low**: Low priority, process when available

---

## Frontend Integration Examples

### Create Purchase Order (React)

```jsx
const CreatePurchaseOrderForm = () => {
  const [formData, setFormData] = useState({
    description: '',
    priority: 'Medium',
    estimated_value: 0,
    vendor_name: '',
    vendor_contact: '',
    vendor_email: ''
  });
  const [files, setFiles] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('description', formData.description);
    data.append('user_id', userId);
    data.append('priority', formData.priority);
    data.append('estimated_value', formData.estimated_value);
    data.append('vendor_details[name]', formData.vendor_name);
    data.append('vendor_details[contact]', formData.vendor_contact);
    data.append('vendor_details[email]', formData.vendor_email);

    files.forEach(file => {
      data.append('files', file);
    });

    try {
      const response = await axios.post('/api/purchaseorders', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Purchase order created successfully');
        // Redirect or refresh
      }
    } catch (error) {
      toast.error('Failed to create purchase order');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        placeholder="Describe your purchase requirements"
        required
      />

      <select
        value={formData.priority}
        onChange={(e) => setFormData({...formData, priority: e.target.value})}
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>

      <input
        type="number"
        value={formData.estimated_value}
        onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
        placeholder="Estimated Value"
      />

      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => setFiles(Array.from(e.target.files))}
        required
      />

      <button type="submit">Submit Purchase Order</button>
    </form>
  );
};
```

### List Purchase Orders

```jsx
const PurchaseOrdersList = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    priority: ''
  });

  useEffect(() => {
    fetchPurchaseOrders();
  }, [filters]);

  const fetchPurchaseOrders = async () => {
    const queryString = new URLSearchParams(filters).toString();
    
    const response = await axios.get(`/api/purchaseorders?${queryString}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.data.success) {
      setOrders(response.data.data.data);
      setPagination(response.data.data.pagination);
    }
  };

  return (
    <div>
      {/* Filters */}
      <select onChange={(e) => setFilters({...filters, status: e.target.value})}>
        <option value="">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
      </select>

      {/* Orders List */}
      {orders.map(order => (
        <div key={order._id}>
          <h3>{order.purchase_order_number || order._id}</h3>
          <p>{order.description}</p>
          <span className={`status ${order.status.toLowerCase()}`}>
            {order.status}
          </span>
          <span className={`priority ${order.priority.toLowerCase()}`}>
            {order.priority}
          </span>
        </div>
      ))}

      {/* Pagination */}
      <button 
        disabled={!pagination.hasPreviousPage}
        onClick={() => setFilters({...filters, page: filters.page - 1})}
      >
        Previous
      </button>
      <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
      <button 
        disabled={!pagination.hasNextPage}
        onClick={() => setFilters({...filters, page: filters.page + 1})}
      >
        Next
      </button>
    </div>
  );
};
```

### Update Status

```jsx
const updatePurchaseOrderStatus = async (id, status, adminNotes) => {
  try {
    const response = await axios.patch(
      `/api/purchaseorders/${id}/status`,
      {
        status: status,
        reviewed_by: adminUserId,
        admin_notes: adminNotes
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      toast.success(`Purchase order ${status.toLowerCase()}`);
      return true;
    }
  } catch (error) {
    toast.error('Failed to update status');
    return false;
  }
};

// Usage
await updatePurchaseOrderStatus('po_id', 'Approved', 'Approved for processing');
```

---

## Use Cases

### 1. User Creates Purchase Order
```
User uploads documents → System creates PO → Status: Pending → Notification sent to admins
```

### 2. Admin Reviews Purchase Order
```
Admin opens PO → Reviews documents → Updates status to Approved/Rejected → User notified
```

### 3. Dashboard Statistics
```
Admin views stats → Shows total, pending, approved, rejection rate → Helps track workload
```

### 4. Search and Filter
```
Admin searches "urgent" → Filters by "High" priority → Finds all urgent POs
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Description, user_id and files are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Purchase order not found"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

---

## Best Practices

### 1. File Uploads
- Support PDF, images, documents
- Max 10 files per upload
- Files stored in S3 bucket
- URLs returned in response

### 2. Status Updates
- Only admins can approve/reject
- Auto-record reviewer and timestamp
- Add admin notes for audit trail

### 3. Filtering
- Use pagination for large datasets
- Combine multiple filters
- Search across description and PO number

### 4. Security
- All endpoints require authentication
- Role-based access control
- Users can only view their own POs (or all if admin)

---

## Summary

### Files Modified/Created
1. ✅ `services/product-service/src/models/purchaseOrder.js` - Enhanced schema
2. ✅ `services/product-service/src/controller/purchaseOrder.js` - Enhanced controllers
3. ✅ `services/product-service/src/route/purchaseorder.js` - Updated routes

### Endpoints Available (9)
1. ✅ Create purchase order with files
2. ✅ Get all with pagination & filters
3. ✅ Get by ID with user details
4. ✅ Get by user ID
5. ✅ Get filtered
6. ✅ Get statistics
7. ✅ Update purchase order
8. ✅ Update status
9. ✅ Delete purchase order

### Features
- ✅ File upload (S3 storage)
- ✅ Pagination
- ✅ Advanced filtering
- ✅ Search functionality
- ✅ User details population
- ✅ Statistics dashboard
- ✅ Status tracking
- ✅ Priority management
- ✅ Review workflow
- ✅ Role-based access

The purchase order management system is now fully enhanced and ready for use!
