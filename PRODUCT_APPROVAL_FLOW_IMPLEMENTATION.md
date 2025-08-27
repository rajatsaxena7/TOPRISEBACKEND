# Product Approval Flow Implementation

## 🎯 **Overview**

Implemented a comprehensive product approval system that requires products uploaded by non-Super-admin users to be approved by Inventory Admin or Super Admin before they become live. This ensures quality control and maintains data integrity across the platform.

## ✅ **Key Features**

### **Role-Based Approval Logic**
- **Super-admin**: Products are automatically approved upon creation
- **All other roles** (Inventory-Admin, Inventory-Staff, Dealer, etc.): Products require manual approval
- **Approvers**: Only Super-admin and Inventory-Admin can approve/reject products

### **Approval Workflow**
1. **Product Creation**: Products created by non-Super-admin users are set to "Pending" status
2. **Notification**: Inventory Admin and Super Admin are notified of pending products
3. **Review Process**: Approvers can review and approve/reject products individually or in bulk
4. **Status Update**: Approved products become live, rejected products are marked with reasons
5. **User Notification**: Product creators are notified of approval/rejection decisions

## 🔧 **Technical Implementation**

### **Modified Files**

#### **1. Product Controller (`services/product-service/src/controller/product.js`)**

**Enhanced `bulkUploadProducts` function:**
- Added role-based approval logic
- Enhanced notification system for pending products
- Added approval tracking in bulk sessions
- Improved response messages for approval status

**New Approval Endpoints:**
- `getPendingProducts`: Get all products requiring approval
- `approveSingleProduct`: Approve a single product
- `rejectSingleProduct`: Reject a single product with reason
- `bulkApproveProducts`: Approve multiple products at once
- `bulkRejectProducts`: Reject multiple products with reason
- `getApprovalStats`: Get approval statistics

#### **2. Product Routes (`services/product-service/src/route/product.js`)**

**New Routes Added:**
```javascript
// Get pending products for approval
GET /api/products/pending

// Approve single product
PATCH /api/products/approve/:productId

// Reject single product
PATCH /api/products/reject/:productId

// Bulk approve products
PATCH /api/products/bulk/approve

// Bulk reject products
PATCH /api/products/bulk/reject

// Get approval statistics
GET /api/products/approval/stats
```

#### **3. Product Model (`services/product-service/src/models/productModel.js`)**

**Added Fields:**
- `created_by_role`: Tracks the role of the user who created the product

#### **4. Product Bulk Session Model (`services/product-service/src/models/productBulkSessionModel.js`)**

**Added Fields:**
- `created_by_role`: Tracks the role of the user who created the bulk session
- `requires_approval`: Boolean flag indicating if approval is required

## 📋 **API Endpoints Documentation**

### **1. Get Pending Products**
```http
GET /api/products/pending?page=1&limit=10&created_by_role=Inventory-Staff
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `created_by_role`: Filter by creator role (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "product_name": "Test Product",
        "sku_code": "TOP001",
        "live_status": "Pending",
        "Qc_status": "Pending",
        "created_by_role": "Inventory-Staff",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 25,
      "totalPages": 3,
      "currentPage": 1,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Pending products fetched successfully"
}
```

### **2. Approve Single Product**
```http
PATCH /api/products/approve/:productId
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Product meets quality standards"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "product_name": "Test Product",
    "live_status": "Approved",
    "Qc_status": "Approved",
    "change_logs": [...]
  },
  "message": "Product approved successfully"
}
```

### **3. Reject Single Product**
```http
PATCH /api/products/reject/:productId
Content-Type: application/json
Authorization: Bearer <token>

{
  "reason": "Product does not meet quality standards"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "product_name": "Test Product",
    "live_status": "Rejected",
    "Qc_status": "Rejected",
    "rejection_state": [
      {
        "rejected_by": "admin_user_id",
        "rejected_at": "2024-01-15T10:30:00.000Z",
        "reason": "Product does not meet quality standards"
      }
    ]
  },
  "message": "Product rejected successfully"
}
```

### **4. Bulk Approve Products**
```http
PATCH /api/products/bulk/approve
Content-Type: application/json
Authorization: Bearer <token>

{
  "productIds": ["product_id_1", "product_id_2", "product_id_3"],
  "reason": "Bulk approval - all products meet standards"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "productId": "product_id_1",
        "productName": "Product 1",
        "skuCode": "TOP001"
      }
    ],
    "failed": [
      {
        "productId": "product_id_2",
        "error": "Product is not in pending status"
      }
    ],
    "totalProcessed": 3
  },
  "message": "Bulk approval completed"
}
```

### **5. Bulk Reject Products**
```http
PATCH /api/products/bulk/reject
Content-Type: application/json
Authorization: Bearer <token>

{
  "productIds": ["product_id_1", "product_id_2"],
  "reason": "Bulk rejection - products do not meet standards"
}
```

### **6. Get Approval Statistics**
```http
GET /api/products/approval/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": 15,
    "approved": 150,
    "rejected": 5,
    "total": 170,
    "approvalRate": "88.24",
    "rejectionRate": "2.94"
  },
  "message": "Approval statistics fetched successfully"
}
```

## 🔐 **Authorization & Security**

### **Role-Based Access Control**
- **Super-admin**: Full access to all approval functions
- **Inventory-Admin**: Full access to all approval functions
- **Other roles**: Can only create products (require approval)

### **Audit Logging**
All approval actions are logged with:
- User ID of the approver/rejector
- Timestamp of the action
- Reason for approval/rejection
- Product details
- Change history

### **Notifications**
- **Pending Products**: Inventory Admin and Super Admin are notified
- **Approved Products**: Product creator is notified
- **Rejected Products**: Product creator is notified with rejection reason

## 🧪 **Testing**

### **Test Script: `test-product-approval-flow.js`**

The test script covers:
1. **Product creation by non-Super-admin users**
2. **Verification of pending status**
3. **Approval process by Super Admin**
4. **Rejection process with reasons**
5. **Bulk approval operations**
6. **Statistics retrieval**
7. **Auto-approval for Super Admin uploads**

**Run tests:**
```bash
node test-product-approval-flow.js
```

## 📊 **Business Logic**

### **Approval Flow**
```
User Uploads Product
        ↓
Check User Role
        ↓
Super-admin? → Auto-approve
        ↓ No
Set to Pending
        ↓
Notify Approvers
        ↓
Review Process
        ↓
Approve/Reject
        ↓
Update Status
        ↓
Notify Creator
```

### **Status Transitions**
- **Created → Pending**: Non-Super-admin upload
- **Created → Approved**: Super-admin upload
- **Pending → Approved**: Manual approval
- **Pending → Rejected**: Manual rejection with reason

## 🎯 **Frontend Integration**

### **Pending Products Dashboard**
```javascript
// Get pending products
const getPendingProducts = async (page = 1, limit = 10) => {
  const response = await axios.get(`/api/products/pending?page=${page}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// Approve product
const approveProduct = async (productId, reason) => {
  const response = await axios.patch(`/api/products/approve/${productId}`, {
    reason: reason
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// Reject product
const rejectProduct = async (productId, reason) => {
  const response = await axios.patch(`/api/products/reject/${productId}`, {
    reason: reason
  }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};
```

### **Approval Statistics Widget**
```javascript
// Get approval statistics
const getApprovalStats = async () => {
  const response = await axios.get('/api/products/approval/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};
```

## 📝 **Configuration**

### **Environment Variables**
No additional environment variables required. The system uses existing JWT configuration.

### **Database Changes**
- Added `created_by_role` field to Product model
- Added `created_by_role` and `requires_approval` fields to ProductBulkSession model

## 🔄 **Migration Notes**

### **Existing Products**
- Existing products will continue to work normally
- No migration required for existing data
- New products will follow the approval flow

### **Backward Compatibility**
- All existing endpoints remain functional
- No breaking changes to existing API contracts
- Enhanced functionality is additive

## 🚀 **Deployment**

### **Steps**
1. Deploy updated product service
2. Restart the service
3. Test approval flow with different user roles
4. Monitor approval statistics
5. Configure notifications if needed

### **Monitoring**
- Monitor approval queue size
- Track approval/rejection rates
- Monitor notification delivery
- Check audit logs for compliance

## 📋 **Future Enhancements**

### **Potential Improvements**
1. **Time-based auto-approval**: Auto-approve products after a certain time
2. **Approval workflows**: Multi-level approval processes
3. **Quality scoring**: Automated quality assessment
4. **Approval templates**: Predefined approval/rejection reasons
5. **Bulk operations**: Enhanced bulk approval with filters
6. **Approval delegation**: Allow approvers to delegate approval rights

---

**Status:** ✅ **COMPLETED**
**Date:** January 2024
**Priority:** High
**Impact:** Quality control and data integrity
