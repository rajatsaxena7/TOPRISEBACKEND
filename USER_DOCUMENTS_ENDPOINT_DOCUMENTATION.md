# User Documents Endpoint - Complete Documentation

## 🎯 Overview

Enhanced endpoint for retrieving documents for a particular user with comprehensive data population, advanced filtering, and detailed analytics.

---

## 🔌 API Endpoint

### Get Documents for a Particular User (Enhanced)

**Endpoint**: `GET /api/documents/user/:userId`  
**Access**: User, Dealer, Super-admin, Fulfillment-Admin, Customer-Support  
**Features**: Advanced filtering, pagination, comprehensive data population, analytics

---

## 📋 Query Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `page` | Number | Page number for pagination | 1 | `?page=2` |
| `limit` | Number | Items per page (1-100) | 20 | `?limit=50` |
| `status` | String | Filter by document status | - | `?status=Pending-Review` |
| `priority` | String | Filter by priority level | - | `?priority=High` |
| `startDate` | Date | Filter from date | - | `?startDate=2025-01-01` |
| `endDate` | Date | Filter to date | - | `?endDate=2025-01-31` |
| `sortBy` | String | Sort field | `createdAt` | `?sortBy=priority` |
| `sortOrder` | String | Sort order (asc/desc) | `desc` | `?sortOrder=asc` |

### Available Status Values
- `Pending-Review`
- `Under-Review`
- `Contacted`
- `Order-Created`
- `Rejected`
- `Cancelled`

### Available Priority Values
- `Low`
- `Medium`
- `High`
- `Urgent`

### Available Sort Fields
- `createdAt`
- `updatedAt`
- `priority`
- `status`
- `estimated_order_value`

---

## 📊 Example Requests

### Basic Request
```bash
GET /api/documents/user/user123
```

### Advanced Filtering
```bash
GET /api/documents/user/user123?status=Pending-Review&priority=High&page=1&limit=10
```

### Date Range Filtering
```bash
GET /api/documents/user/user123?startDate=2025-01-01&endDate=2025-01-31&sortBy=createdAt&sortOrder=desc
```

### Multiple Filters
```bash
GET /api/documents/user/user123?status=Order-Created&priority=Urgent&page=2&limit=25&sortBy=estimated_order_value&sortOrder=desc
```

---

## 📄 Enhanced Response Structure

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "doc_upload_id",
        "document_number": "DOC-20250115-00001",
        "description": "Need brake pads for Honda City 2020 model",
        "status": "Under-Review",
        "priority": "High",
        "estimated_order_value": 15000,
        
        // 🔥 ENHANCED USER DETAILS (from User Service)
        "userDetails": {
          "_id": "user123",
          "username": "john_doe",
          "email": "john.doe@email.com",
          "phone": "+91-9876543210",
          "first_name": "John",
          "last_name": "Doe",
          "role": "User",
          "status": "Active",
          "createdAt": "2024-01-15T00:00:00.000Z",
          "profile": {
            "preferredLanguage": "English",
            "notificationPreferences": {
              "email": true,
              "sms": false,
              "push": true
            }
          }
        },
        
        // Customer Details (from document)
        "customer_details": {
          "user_id": "user123",
          "name": "John Doe",
          "email": "john.doe@email.com",
          "phone": "+91-9876543210",
          "address": "123 Main Street, Mumbai",
          "pincode": "400001"
        },
        
        // Document Files
        "document_files": [
          {
            "url": "https://s3.../brake_pads_photo.jpg",
            "file_type": "image",
            "file_name": "brake_pads_photo.jpg",
            "uploaded_at": "2025-01-15T10:00:00.000Z"
          },
          {
            "url": "https://s3.../vehicle_registration.pdf",
            "file_type": "pdf",
            "file_name": "vehicle_registration.pdf",
            "uploaded_at": "2025-01-15T10:00:00.000Z"
          }
        ],
        
        // Admin Notes
        "admin_notes": [
          {
            "note": "Customer contacted, confirmed requirements",
            "added_by": "admin_user_id",
            "added_at": "2025-01-15T11:00:00.000Z"
          }
        ],
        
        // Contact History
        "contact_history": [
          {
            "contact_type": "Phone",
            "notes": "Called customer, discussed brake pad requirements",
            "contacted_by": "support_user_id",
            "contacted_at": "2025-01-15T11:00:00.000Z"
          }
        ],
        
        // Items Requested (if any)
        "items_requested": [
          {
            "sku": "BRAKE_PAD_HONDA_001",
            "product_name": "Honda City Brake Pad",
            "quantity": 2,
            "unit_price": 2500,
            "notes": "Front brake pads"
          }
        ],
        
        // Order Details (if order created)
        "orderDetails": {
          "_id": "order_id",
          "orderId": "ORD-20250115-001",
          "status": "Confirmed",
          "totalAmount": 15000,
          "order_Amount": 15000,
          "paymentType": "COD",
          "deliveryType": "Express",
          "createdAt": "2025-01-15T12:00:00.000Z",
          "updatedAt": "2025-01-15T12:00:00.000Z"
        },
        
        // 🔥 COMPUTED FIELDS
        "computedFields": {
          "daysSinceCreated": 2,
          "isOverdue": false,
          "totalFiles": 2,
          "hasOrder": true,
          "estimatedProcessingTime": 48 // minutes
        },
        
        // Timestamps
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T11:30:00.000Z"
      }
    ],
    
    // 📊 PAGINATION
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    
    // 📈 SUMMARY STATISTICS
    "summary": {
      "totalDocuments": 25,
      "statusBreakdown": {
        "Pending-Review": 5,
        "Under-Review": 8,
        "Contacted": 6,
        "Order-Created": 4,
        "Rejected": 1,
        "Cancelled": 1
      },
      "priorityBreakdown": {
        "Low": 3,
        "Medium": 12,
        "High": 8,
        "Urgent": 2
      },
      "overdueCount": 2,
      "ordersCreated": 4
    },
    
    // 🔍 APPLIED FILTERS
    "filters": {
      "appliedFilters": {
        "status": "Under-Review",
        "priority": "High",
        "startDate": "2025-01-01",
        "endDate": "2025-01-31",
        "sortBy": "createdAt",
        "sortOrder": "desc"
      }
    }
  },
  "message": "Enhanced user documents fetched successfully"
}
```

---

## 🔧 Advanced Features

### 1. **Comprehensive Data Population**
- ✅ **User Details**: Complete user profile from User Service
- ✅ **Order Details**: Linked order information if available
- ✅ **Document Files**: All uploaded files with metadata
- ✅ **Admin Notes**: Staff notes and comments
- ✅ **Contact History**: Communication log with customer

### 2. **Smart Computed Fields**
```javascript
computedFields: {
  daysSinceCreated: 2,           // Days since document creation
  isOverdue: false,              // True if pending > 3 days
  totalFiles: 2,                 // Number of uploaded files
  hasOrder: true,                // Whether order was created
  estimatedProcessingTime: 48    // Estimated minutes to process
}
```

### 3. **Advanced Filtering**
- ✅ **Status Filtering**: Filter by document processing status
- ✅ **Priority Filtering**: Filter by urgency level
- ✅ **Date Range Filtering**: Filter by creation date range
- ✅ **Flexible Sorting**: Sort by any field, ascending/descending

### 4. **Comprehensive Analytics**
```javascript
summary: {
  totalDocuments: 25,
  statusBreakdown: { /* status counts */ },
  priorityBreakdown: { /* priority counts */ },
  overdueCount: 2,
  ordersCreated: 4
}
```

### 5. **Processing Time Estimation**
The system automatically calculates estimated processing time based on:
- **Base Time**: 60 minutes
- **File Time**: 10 minutes per file
- **Priority Multiplier**:
  - Low: 1.5x
  - Medium: 1.0x
  - High: 0.7x
  - Urgent: 0.5x

---

## 📱 Frontend Integration Examples

### React Component
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserDocumentsView = ({ userId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState({});
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchUserDocuments();
  }, [userId, filters]);

  const fetchUserDocuments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== '')
      ).toString();
      
      const response = await axios.get(
        `/api/documents/user/${userId}?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setDocuments(response.data.data.data);
        setPagination(response.data.data.pagination);
        setSummary(response.data.data.summary);
        setUserDetails(response.data.data.userDetails);
      }
    } catch (error) {
      console.error('Failed to fetch user documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  if (loading) return <div>Loading documents...</div>;

  return (
    <div className="user-documents-view">
      {/* User Info Header */}
      {userDetails && (
        <div className="user-header">
          <h2>Documents for {userDetails.first_name} {userDetails.last_name}</h2>
          <p>Email: {userDetails.email} | Phone: {userDetails.phone}</p>
          <p>Total Documents: {summary.totalDocuments}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Pending Review</h3>
          <p>{summary.statusBreakdown?.["Pending-Review"] || 0}</p>
        </div>
        <div className="card">
          <h3>Under Review</h3>
          <p>{summary.statusBreakdown?.["Under-Review"] || 0}</p>
        </div>
        <div className="card">
          <h3>Orders Created</h3>
          <p>{summary.ordersCreated || 0}</p>
        </div>
        <div className="card">
          <h3>Overdue</h3>
          <p className="text-red">{summary.overdueCount || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Pending-Review">Pending Review</option>
          <option value="Under-Review">Under Review</option>
          <option value="Contacted">Contacted</option>
          <option value="Order-Created">Order Created</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select 
          value={filters.priority} 
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          placeholder="End Date"
        />

        <select 
          value={filters.sortBy} 
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
        >
          <option value="createdAt">Created Date</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="estimated_order_value">Order Value</option>
        </select>

        <select 
          value={filters.sortOrder} 
          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="documents-table">
        <table>
          <thead>
            <tr>
              <th>Document #</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Files</th>
              <th>Order Value</th>
              <th>Created</th>
              <th>Overdue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(document => (
              <tr key={document._id} className={document.computedFields.isOverdue ? 'overdue' : ''}>
                <td>{document.document_number}</td>
                <td>
                  <div className="description">
                    <strong>{document.description}</strong>
                    {document.computedFields.hasOrder && (
                      <br /><small>Order: {document.orderDetails?.orderId}</small>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status ${document.status.toLowerCase().replace('-', '-')}`}>
                    {document.status}
                  </span>
                </td>
                <td>
                  <span className={`priority ${document.priority.toLowerCase()}`}>
                    {document.priority}
                  </span>
                </td>
                <td>
                  <div className="files-info">
                    <strong>{document.computedFields.totalFiles}</strong>
                    <br />
                    <small>Est: {document.computedFields.estimatedProcessingTime}min</small>
                  </div>
                </td>
                <td>₹{document.estimated_order_value?.toLocaleString() || 0}</td>
                <td>
                  <div className="date-info">
                    <strong>{new Date(document.createdAt).toLocaleDateString()}</strong>
                    <br />
                    <small>{document.computedFields.daysSinceCreated} days ago</small>
                  </div>
                </td>
                <td>
                  {document.computedFields.isOverdue && (
                    <span className="overdue-badge">OVERDUE</span>
                  )}
                </td>
                <td>
                  <button 
                    className="btn-primary"
                    onClick={() => viewDocumentDetails(document._id)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button 
          disabled={!pagination.hasPreviousPage}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button 
          disabled={!pagination.hasNextPage}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default UserDocumentsView;
```

### Document Details Modal
```jsx
const DocumentDetailsModal = ({ document, onClose }) => {
  return (
    <div className="modal document-details-modal">
      <div className="modal-content">
        <h2>Document Details - {document.document_number}</h2>
        
        {/* Document Info */}
        <div className="section">
          <h3>📄 Document Information</h3>
          <div className="info-grid">
            <div><strong>Description:</strong> {document.description}</div>
            <div><strong>Status:</strong> {document.status}</div>
            <div><strong>Priority:</strong> {document.priority}</div>
            <div><strong>Estimated Value:</strong> ₹{document.estimated_order_value}</div>
            <div><strong>Created:</strong> {new Date(document.createdAt).toLocaleString()}</div>
            <div><strong>Files:</strong> {document.computedFields.totalFiles}</div>
          </div>
        </div>

        {/* Files */}
        <div className="section">
          <h3>📎 Uploaded Files</h3>
          <div className="files-list">
            {document.document_files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <strong>{file.file_name}</strong>
                  <br />
                  <small>Type: {file.file_type} | Uploaded: {new Date(file.uploaded_at).toLocaleString()}</small>
                </div>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  View File
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Contact History */}
        {document.contact_history?.length > 0 && (
          <div className="section">
            <h3>📞 Contact History</h3>
            <div className="contact-history">
              {document.contact_history.map((contact, index) => (
                <div key={index} className="contact-item">
                  <div className="contact-header">
                    <strong>{contact.contact_type}</strong>
                    <small>{new Date(contact.contacted_at).toLocaleString()}</small>
                  </div>
                  <p>{contact.notes}</p>
                  <small>By: {contact.contacted_by}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {document.admin_notes?.length > 0 && (
          <div className="section">
            <h3>📝 Admin Notes</h3>
            <div className="admin-notes">
              {document.admin_notes.map((note, index) => (
                <div key={index} className="note-item">
                  <p>{note.note}</p>
                  <small>By: {note.added_by} | {new Date(note.added_at).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Details */}
        {document.orderDetails && (
          <div className="section">
            <h3>📦 Order Details</h3>
            <div className="order-info">
              <p><strong>Order ID:</strong> {document.orderDetails.orderId}</p>
              <p><strong>Status:</strong> {document.orderDetails.status}</p>
              <p><strong>Amount:</strong> ₹{document.orderDetails.totalAmount}</p>
              <p><strong>Payment:</strong> {document.orderDetails.paymentType}</p>
              <p><strong>Delivery:</strong> {document.orderDetails.deliveryType}</p>
            </div>
          </div>
        )}

        {/* Computed Fields */}
        <div className="section">
          <h3>📊 Processing Info</h3>
          <div className="computed-fields">
            <div><strong>Days Since Created:</strong> {document.computedFields.daysSinceCreated}</div>
            <div><strong>Is Overdue:</strong> {document.computedFields.isOverdue ? 'Yes' : 'No'}</div>
            <div><strong>Estimated Processing Time:</strong> {document.computedFields.estimatedProcessingTime} minutes</div>
            <div><strong>Has Order:</strong> {document.computedFields.hasOrder ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <button className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
```

---

## 🛡️ Error Handling

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "User ID is required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error fetching user documents"
}
```

### Service Unavailability
- ✅ **Graceful Degradation**: Returns partial data when services are unavailable
- ✅ **User Service Down**: Returns null for userDetails
- ✅ **Order Service Down**: Returns null for orderDetails
- ✅ **Detailed Logging**: Comprehensive error logging for debugging

---

## 🔐 Access Control

### Role-Based Access
| Role | Access Level |
|------|-------------|
| **User** | Can view own documents only |
| **Dealer** | Can view own documents only |
| **Super-admin** | Full access to all user documents |
| **Fulfillment-Admin** | Full access to all user documents |
| **Customer-Support** | Full access to all user documents |

### Security Features
- ✅ **Authentication Required**: All requests must be authenticated
- ✅ **Role Authorization**: Role-based access control
- ✅ **Audit Logging**: All access is logged for compliance
- ✅ **Input Validation**: All parameters are validated

---

## 📈 Performance Optimizations

### 1. **Efficient Data Fetching**
- ✅ **Database Indexing**: Optimized queries with proper indexes
- ✅ **Pagination**: Configurable page sizes to limit data transfer
- ✅ **Lean Queries**: Uses MongoDB lean() for better performance

### 2. **Smart Caching**
- ✅ **User Details Caching**: User info fetched once per request
- ✅ **Service Response Caching**: Caches external service responses
- ✅ **Query Result Caching**: Caches frequently accessed data

### 3. **Parallel Processing**
- ✅ **Async Operations**: All external service calls are async
- ✅ **Promise.allSettled**: Parallel processing with error resilience
- ✅ **Non-blocking**: Doesn't block on individual service failures

---

## 🚀 Summary

The enhanced user documents endpoint provides:

- ✅ **Complete Document Management** with comprehensive data population
- ✅ **Advanced Filtering** by status, priority, date range, and sorting
- ✅ **Rich Analytics** with summary statistics and breakdowns
- ✅ **Computed Fields** for business intelligence (overdue detection, processing time)
- ✅ **Service Integration** with User Service for enhanced user details
- ✅ **Order Integration** for linked order information
- ✅ **Production-Ready Performance** with pagination and optimization
- ✅ **Comprehensive Error Handling** with graceful degradation
- ✅ **Role-Based Security** with proper access controls
- ✅ **Frontend-Optimized** responses with all necessary data

**The endpoint provides a complete, production-ready solution for managing user documents with comprehensive filtering, analytics, and data integration!** 🎉

### Key Endpoint
```
GET /api/documents/user/:userId
```

This endpoint gives you everything needed for comprehensive user document management with advanced filtering, analytics, and complete data integration from multiple services!
