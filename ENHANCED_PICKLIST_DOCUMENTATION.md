# Enhanced Picklist API Documentation

## 🎯 Overview

The picklist endpoints have been significantly enhanced to populate comprehensive data from multiple microservices, providing a complete view of picklist operations with detailed information from user service, product service, and order service.

---

## 🔄 Enhanced Endpoints

### 1. Get All Picklists (Enhanced)

**Endpoint**: `GET /api/orders/picklists`  
**Access**: Authenticated users  
**Enhanced Features**: Multi-service data population, pagination, filtering, summary statistics

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | Number | Page number for pagination | 1 |
| `limit` | Number | Items per page | 20 |
| `status` | String | Filter by scan status (Not Started, In Progress, Completed) | - |
| `dealerId` | String | Filter by dealer ID | - |
| `fulfilmentStaff` | String | Filter by fulfilment staff ID | - |

#### Example Request
```bash
GET /api/orders/picklists?page=1&limit=10&status=In Progress&dealerId=dealer123
```

#### Enhanced Response (200)
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "picklist_id",
        "linkedOrderId": "order_id",
        "dealerId": "dealer123",
        "fulfilmentStaff": "staff456",
        "skuList": [
          {
            "sku": "SKU001",
            "quantity": 5,
            "barcode": "123456789"
          },
          {
            "sku": "SKU002", 
            "quantity": 3,
            "barcode": "987654321"
          }
        ],
        "scanStatus": "In Progress",
        "invoiceGenerated": false,
        "packingSlipUrl": null,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T12:00:00.000Z",
        
        // 🔥 ENHANCED DATA FROM MULTIPLE SERVICES
        
        // Dealer Information (from User Service)
        "dealerInfo": {
          "_id": "dealer123",
          "name": "ABC Motors",
          "email": "dealer@abcmotors.com",
          "phone": "+91-9876543210",
          "address": {
            "street": "123 Main Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
          },
          "businessType": "Authorized Dealer",
          "isActive": true
        },
        
        // Staff Information (from User Service)
        "staffInfo": {
          "_id": "staff456",
          "name": "John Smith",
          "email": "john@company.com",
          "phone": "+91-9876543211",
          "role": "Fulfilment Staff",
          "department": "Warehouse",
          "isActive": true
        },
        
        // Order Information (from Order Service)
        "orderInfo": {
          "_id": "order_id",
          "orderId": "ORD-20250115-001",
          "status": "Confirmed",
          "totalAmount": 25000,
          "paymentType": "COD",
          "deliveryType": "Express",
          "customerDetails": {
            "userId": "customer789",
            "name": "Rajesh Kumar",
            "phone": "+91-9876543212",
            "email": "rajesh@email.com",
            "address": {
              "street": "456 Park Avenue",
              "city": "Delhi",
              "state": "Delhi",
              "pincode": "110001"
            },
            // Customer Information (from User Service)
            "customerInfo": {
              "_id": "customer789",
              "name": "Rajesh Kumar",
              "email": "rajesh@email.com",
              "phone": "+91-9876543212",
              "preferredLanguage": "Hindi",
              "customerSince": "2024-01-01T00:00:00.000Z"
            }
          },
          "createdAt": "2025-01-15T09:00:00.000Z",
          "updatedAt": "2025-01-15T10:00:00.000Z"
        },
        
        // Product Details (from Product Service)
        "skuDetails": [
          {
            "sku": "SKU001",
            "quantity": 5,
            "barcode": "123456789",
            "productDetails": {
              "_id": "product_id_1",
              "productName": "Honda City Brake Pad",
              "brand": "Honda",
              "category": "Brake Parts",
              "price": 2500,
              "mrp": 3000,
              "description": "High quality brake pad for Honda City",
              "images": ["image1.jpg", "image2.jpg"],
              "specifications": {
                "material": "Ceramic",
                "compatibility": "Honda City 2017-2023",
                "warranty": "2 years"
              }
            }
          },
          {
            "sku": "SKU002",
            "quantity": 3,
            "barcode": "987654321",
            "productDetails": {
              "_id": "product_id_2",
              "productName": "Maruti Swift Air Filter",
              "brand": "Maruti",
              "category": "Air Filters",
              "price": 800,
              "mrp": 1000,
              "description": "Original air filter for Maruti Swift",
              "images": ["filter1.jpg"],
              "specifications": {
                "material": "Paper",
                "compatibility": "Maruti Swift 2018-2024",
                "warranty": "1 year"
              }
            }
          }
        ],
        
        // 🔥 COMPUTED FIELDS
        
        // Summary Statistics
        "totalItems": 8, // Total quantity across all SKUs
        "uniqueSKUs": 2, // Number of unique SKUs
        
        // Status Indicators
        "isOverdue": false, // Calculated based on creation time and status
        "estimatedCompletionTime": 70 // Estimated minutes to complete (30 base + 5 per item)
      }
    ],
    
    // 📊 PAGINATION
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    
    // 📈 SUMMARY STATISTICS
    "summary": {
      "totalPicklists": 50,
      "completedPicklists": 25,
      "inProgressPicklists": 15,
      "notStartedPicklists": 10,
      "overduePicklists": 3
    }
  },
  "message": "Enhanced picklists fetched successfully"
}
```

---

### 2. Get Picklists by Dealer (Enhanced)

**Endpoint**: `GET /api/orders/picklists/dealer/:dealerId`  
**Access**: Authenticated users  
**Enhanced Features**: Same multi-service data population as above, but filtered for specific dealer

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | Number | Page number for pagination | 1 |
| `limit` | Number | Items per page | 20 |
| `status` | String | Filter by scan status | - |

#### Example Request
```bash
GET /api/orders/picklists/dealer/dealer123?page=1&limit=5&status=Completed
```

#### Enhanced Response (200)
```json
{
  "success": true,
  "data": {
    "data": [
      // Same enhanced picklist structure as above
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 15,
      "itemsPerPage": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    // Dealer information (fetched once for efficiency)
    "dealerInfo": {
      "_id": "dealer123",
      "name": "ABC Motors",
      "email": "dealer@abcmotors.com",
      "phone": "+91-9876543210",
      "address": {
        "street": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
      },
      "businessType": "Authorized Dealer",
      "isActive": true,
      "performance": {
        "totalOrders": 150,
        "completedOrders": 145,
        "averageRating": 4.5,
        "onTimeDelivery": 95
      }
    },
    "summary": {
      "totalPicklists": 15,
      "completedPicklists": 12,
      "inProgressPicklists": 2,
      "notStartedPicklists": 1,
      "overduePicklists": 0
    }
  },
  "message": "Enhanced dealer picklists fetched successfully"
}
```

---

## 🔧 Service Integration Details

### User Service Integration

**Endpoints Used:**
- `GET /api/users/dealer/{dealerId}` - Fetch dealer details
- `GET /api/users/user/{userId}` - Fetch user/staff details

**Data Populated:**
- ✅ Dealer information (name, contact, address, business details)
- ✅ Staff information (name, role, department, contact)
- ✅ Customer information (preferences, customer since date)

### Product Service Integration

**Endpoints Used:**
- `GET /products/v1/get-ProductBySKU/{sku}` - Fetch product details by SKU

**Data Populated:**
- ✅ Product details (name, brand, category, price, MRP)
- ✅ Product specifications and compatibility
- ✅ Product images and descriptions
- ✅ Warranty information

### Order Service Integration

**Data Populated:**
- ✅ Linked order details (order ID, status, amounts)
- ✅ Customer details from linked order
- ✅ Payment and delivery information
- ✅ Order timestamps

---

## 🚀 Performance Optimizations

### 1. Parallel Service Calls
```javascript
// All service calls are made in parallel using Promise.allSettled
const [dealerInfo, staffInfo, orderInfo, productDetails] = await Promise.allSettled([
  fetchDealer(picklist.dealerId),
  fetchUser(picklist.fulfilmentStaff),
  fetchOrderDetails(picklist.linkedOrderId),
  fetchProductDetailsForSKUs(picklist.skuList)
]);
```

### 2. Error Resilience
- ✅ Uses `Promise.allSettled` to prevent one service failure from breaking the entire request
- ✅ Graceful fallbacks when services are unavailable
- ✅ Detailed error logging for debugging

### 3. Efficient Data Fetching
- ✅ Fetches dealer info once per request for dealer-specific endpoints
- ✅ Caches service responses where appropriate
- ✅ Timeout handling for external service calls (5 seconds)

---

## 📊 Computed Fields

### 1. Summary Statistics
```javascript
totalItems: picklist.skuList.reduce((sum, item) => sum + item.quantity, 0),
uniqueSKUs: picklist.skuList.length
```

### 2. Status Indicators
```javascript
isOverdue: isPicklistOverdue(picklist), // Based on creation time and status
estimatedCompletionTime: calculateEstimatedCompletionTime(picklist) // 30 min base + 5 min per item
```

### 3. Overdue Logic
- **Not Started**: Overdue if > 24 hours since creation
- **In Progress**: Overdue if > 48 hours since creation
- **Completed**: Never overdue

---

## 🔍 Advanced Filtering

### Filter Options
```javascript
// Status filtering
?status=In Progress
?status=Completed
?status=Not Started

// Dealer filtering
?dealerId=dealer123

// Staff filtering
?fulfilmentStaff=staff456

// Pagination
?page=2&limit=20
```

### Response Filtering
The API supports filtering at the database level for optimal performance:

```javascript
const filter = {};
if (status) filter.scanStatus = status;
if (dealerId) filter.dealerId = dealerId;
if (fulfilmentStaff) filter.fulfilmentStaff = fulfilmentStaff;
```

---

## 📱 Frontend Integration Examples

### React Component Example
```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PicklistDashboard = () => {
  const [picklists, setPicklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    dealerId: ''
  });
  const [pagination, setPagination] = useState({});
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchPicklists();
  }, [filters]);

  const fetchPicklists = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(
        Object.entries(filters).filter(([_, value]) => value !== '')
      ).toString();
      
      const response = await axios.get(
        `/api/orders/picklists?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPicklists(response.data.data.data);
        setPagination(response.data.data.pagination);
        setSummary(response.data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch picklists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status) => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
  };

  if (loading) return <div>Loading picklists...</div>;

  return (
    <div className="picklist-dashboard">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total Picklists</h3>
          <p>{summary.totalPicklists}</p>
        </div>
        <div className="card">
          <h3>Completed</h3>
          <p>{summary.completedPicklists}</p>
        </div>
        <div className="card">
          <h3>In Progress</h3>
          <p>{summary.inProgressPicklists}</p>
        </div>
        <div className="card">
          <h3>Overdue</h3>
          <p className="text-red">{summary.overduePicklists}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => handleStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {/* Picklist Table */}
      <div className="picklist-table">
        <table>
          <thead>
            <tr>
              <th>Picklist ID</th>
              <th>Dealer</th>
              <th>Staff</th>
              <th>Order</th>
              <th>Items</th>
              <th>Status</th>
              <th>Overdue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {picklists.map(picklist => (
              <tr key={picklist._id} className={picklist.isOverdue ? 'overdue' : ''}>
                <td>{picklist._id}</td>
                <td>
                  {picklist.dealerInfo ? (
                    <div>
                      <strong>{picklist.dealerInfo.name}</strong>
                      <br />
                      <small>{picklist.dealerInfo.email}</small>
                    </div>
                  ) : (
                    <span className="text-muted">Loading...</span>
                  )}
                </td>
                <td>
                  {picklist.staffInfo ? (
                    <div>
                      <strong>{picklist.staffInfo.name}</strong>
                      <br />
                      <small>{picklist.staffInfo.role}</small>
                    </div>
                  ) : (
                    <span className="text-muted">Not assigned</span>
                  )}
                </td>
                <td>
                  {picklist.orderInfo ? (
                    <div>
                      <strong>{picklist.orderInfo.orderId}</strong>
                      <br />
                      <small>₹{picklist.orderInfo.totalAmount}</small>
                    </div>
                  ) : (
                    <span className="text-muted">Loading...</span>
                  )}
                </td>
                <td>
                  <div>
                    <strong>{picklist.totalItems} items</strong>
                    <br />
                    <small>{picklist.uniqueSKUs} SKUs</small>
                  </div>
                </td>
                <td>
                  <span className={`status ${picklist.scanStatus.toLowerCase().replace(' ', '-')}`}>
                    {picklist.scanStatus}
                  </span>
                </td>
                <td>
                  {picklist.isOverdue && (
                    <span className="overdue-badge">Overdue</span>
                  )}
                </td>
                <td>
                  <button onClick={() => viewPicklistDetails(picklist._id)}>
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

export default PicklistDashboard;
```

### Picklist Details Modal
```jsx
const PicklistDetailsModal = ({ picklist, onClose }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Picklist Details - {picklist._id}</h2>
        
        {/* Dealer Information */}
        <div className="section">
          <h3>Dealer Information</h3>
          {picklist.dealerInfo ? (
            <div className="info-card">
              <p><strong>Name:</strong> {picklist.dealerInfo.name}</p>
              <p><strong>Email:</strong> {picklist.dealerInfo.email}</p>
              <p><strong>Phone:</strong> {picklist.dealerInfo.phone}</p>
              <p><strong>Address:</strong> {picklist.dealerInfo.address.street}, {picklist.dealerInfo.address.city}</p>
            </div>
          ) : (
            <p>Loading dealer information...</p>
          )}
        </div>

        {/* Order Information */}
        <div className="section">
          <h3>Order Information</h3>
          {picklist.orderInfo ? (
            <div className="info-card">
              <p><strong>Order ID:</strong> {picklist.orderInfo.orderId}</p>
              <p><strong>Status:</strong> {picklist.orderInfo.status}</p>
              <p><strong>Total Amount:</strong> ₹{picklist.orderInfo.totalAmount}</p>
              <p><strong>Payment Type:</strong> {picklist.orderInfo.paymentType}</p>
              <p><strong>Customer:</strong> {picklist.orderInfo.customerDetails.customerInfo?.name}</p>
            </div>
          ) : (
            <p>Loading order information...</p>
          )}
        </div>

        {/* SKU Details */}
        <div className="section">
          <h3>Items to Pick</h3>
          <div className="sku-list">
            {picklist.skuDetails.map((sku, index) => (
              <div key={index} className="sku-item">
                <div className="sku-info">
                  <p><strong>SKU:</strong> {sku.sku}</p>
                  <p><strong>Quantity:</strong> {sku.quantity}</p>
                  <p><strong>Barcode:</strong> {sku.barcode}</p>
                </div>
                {sku.productDetails ? (
                  <div className="product-info">
                    <p><strong>Product:</strong> {sku.productDetails.productName}</p>
                    <p><strong>Brand:</strong> {sku.productDetails.brand}</p>
                    <p><strong>Price:</strong> ₹{sku.productDetails.price}</p>
                    <p><strong>MRP:</strong> ₹{sku.productDetails.mrp}</p>
                  </div>
                ) : (
                  <p>Loading product details...</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="section">
          <h3>Summary</h3>
          <div className="summary-info">
            <p><strong>Total Items:</strong> {picklist.totalItems}</p>
            <p><strong>Unique SKUs:</strong> {picklist.uniqueSKUs}</p>
            <p><strong>Estimated Completion:</strong> {picklist.estimatedCompletionTime} minutes</p>
            <p><strong>Overdue:</strong> {picklist.isOverdue ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
```

---

## 🛡️ Error Handling

### Service Unavailability
```javascript
// If any service is down, the API still returns data with null values
{
  "dealerInfo": null, // Service unavailable
  "staffInfo": null,  // Service unavailable
  "orderInfo": null,  // Service unavailable
  "skuDetails": [],   // Service unavailable
  "error": "Failed to fetch additional details"
}
```

### Partial Data
```javascript
// Some services may work while others fail
{
  "dealerInfo": { /* dealer data */ },
  "staffInfo": null, // This service failed
  "orderInfo": { /* order data */ },
  "skuDetails": [ /* some product data */ ]
}
```

### Timeout Handling
- ✅ 5-second timeout for external service calls
- ✅ Graceful degradation when services are slow
- ✅ Detailed logging for performance monitoring

---

## 📈 Benefits of Enhanced API

### 1. **Single API Call**
- ✅ Get all related data in one request
- ✅ Reduces frontend complexity
- ✅ Improves user experience

### 2. **Comprehensive Data**
- ✅ Complete dealer information
- ✅ Full product details with specifications
- ✅ Linked order information
- ✅ Customer details

### 3. **Performance Optimized**
- ✅ Parallel service calls
- ✅ Efficient pagination
- ✅ Smart caching strategies

### 4. **Resilient Design**
- ✅ Graceful service failure handling
- ✅ Partial data when some services fail
- ✅ Detailed error logging

### 5. **Rich Analytics**
- ✅ Summary statistics
- ✅ Status tracking
- ✅ Overdue identification
- ✅ Performance metrics

---

## 🚀 Summary

The enhanced picklist API provides:

- ✅ **Multi-service data population** from User, Product, and Order services
- ✅ **Advanced filtering and pagination** for better performance
- ✅ **Computed fields** for business insights
- ✅ **Error resilience** with graceful degradation
- ✅ **Rich response structure** with summary statistics
- ✅ **Production-ready** with comprehensive error handling

**The picklist endpoints now provide a complete, production-ready solution for picklist management with comprehensive data from all related services!** 🎉
