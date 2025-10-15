# Banner Admin Controllers - Complete Documentation

## 🎯 Overview

Comprehensive banner management system for admin work with advanced filtering, statistics, bulk operations, and full CRUD functionality.

---

## 📁 Files Created

1. ✅ `services/product-service/src/controllers/bannerAdmin.js` - Admin controllers
2. ✅ `services/product-service/src/routes/bannerAdmin.js` - Admin routes
3. ✅ Updated `services/product-service/src/route/banner.js` - Added public active banners
4. ✅ Updated `services/product-service/src/index.js` - Registered admin routes

---

## 🔌 API Endpoints

### Admin Endpoints (Base: `/api/banners/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/stats` | Get banner statistics | Super-admin, Inventory-Admin |
| GET | `/all` | Get all banners with filters | Super-admin, Inventory-Admin |
| POST | `/create` | Create new banner | Super-admin |
| GET | `/:id` | Get banner by ID | Super-admin, Inventory-Admin |
| PUT | `/:id` | Update banner | Super-admin |
| DELETE | `/:id` | Delete banner | Super-admin |
| PATCH | `/:id/display-order` | Update display order | Super-admin |
| GET | `/by-brand/:brandId` | Get banners by brand | Super-admin, Inventory-Admin |
| GET | `/by-vehicle-type/:vehicleTypeId` | Get banners by vehicle type | Super-admin, Inventory-Admin |
| PATCH | `/bulk-status` | Bulk update status | Super-admin |

### Public Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/banner/active` | Get active banners | Public |

---

## 📊 1. Get Banner Statistics

**Endpoint**: `GET /api/banners/admin/stats`  
**Access**: Super-admin, Inventory-Admin

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | Date | From date (optional) |
| `endDate` | Date | To date (optional) |

### Example
```bash
GET /api/banners/admin/stats?startDate=2025-01-01&endDate=2025-12-31
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "total": 150,
    "active": 120,
    "inactive": 30,
    "activationRate": "80.00%",
    "byVehicleType": {
      "Car": { "total": 80, "active": 65 },
      "Bike": { "total": 45, "active": 35 },
      "Truck": { "total": 25, "active": 20 }
    },
    "byBrand": {
      "Honda": { "total": 45, "active": 40 },
      "Maruti": { "total": 35, "active": 30 },
      "Bajaj": { "total": 25, "active": 20 }
    },
    "recentActivity": {
      "last7Days": 15
    }
  },
  "message": "Banner statistics retrieved successfully"
}
```

---

## 📋 2. Get All Banners (Admin)

**Endpoint**: `GET /api/banners/admin/all`  
**Access**: Super-admin, Inventory-Admin

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 20) |
| `vehicle_type` | String | Filter by vehicle type ID |
| `brand_id` | String | Filter by brand ID |
| `is_active` | Boolean | Filter by active status |
| `search` | String | Search in title |
| `startDate` | Date | From date |
| `endDate` | Date | To date |
| `sortBy` | String | Sort field (default: createdAt) |
| `sortOrder` | String | Sort order: asc/desc (default: desc) |

### Example
```bash
GET /api/banners/admin/all?page=1&limit=10&is_active=true&search=honda&sortBy=createdAt&sortOrder=desc
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "banner_id",
        "title": "Honda Car Special Offer",
        "image": {
          "web": "https://s3.../web.jpg",
          "mobile": "https://s3.../mobile.jpg",
          "tablet": "https://s3.../tablet.jpg"
        },
        "brand_id": {
          "_id": "brand_id",
          "brand_name": "Honda",
          "brand_code": "HONDA"
        },
        "vehicle_type": {
          "_id": "type_id",
          "type_name": "Car",
          "type_code": "CAR"
        },
        "is_active": true,
        "description": "Special offer on Honda cars",
        "link_url": "https://example.com/honda-offer",
        "display_order": 1,
        "created_by": "admin_id",
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
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
      "brands": [
        { "_id": "brand_id", "brand_name": "Honda", "brand_code": "HONDA" }
      ],
      "vehicleTypes": [
        { "_id": "type_id", "type_name": "Car", "type_code": "CAR" }
      ],
      "appliedFilters": {
        "is_active": true,
        "search": "honda"
      }
    }
  }
}
```

---

## ➕ 3. Create Banner (Admin)

**Endpoint**: `POST /api/banners/admin/create`  
**Access**: Super-admin  
**Content-Type**: `multipart/form-data`

### Request (FormData)
```bash
curl -X POST "http://localhost:5002/api/banners/admin/create" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "title=Honda Car Special Offer" \
  -F "brand_id=brand_id_here" \
  -F "vehicle_type=vehicle_type_id_here" \
  -F "is_active=true" \
  -F "description=Special offer on Honda cars this month" \
  -F "link_url=https://example.com/honda-offer" \
  -F "display_order=1" \
  -F "web=@web-banner.jpg" \
  -F "mobile=@mobile-banner.jpg" \
  -F "tablet=@tablet-banner.jpg"
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | ✅ Yes | Banner title |
| `brand_id` | String | ✅ Yes | Brand ObjectId |
| `vehicle_type` | String | ✅ Yes | Vehicle type ObjectId |
| `web` | File | ✅ Yes | Web image (JPEG/PNG/WebP) |
| `mobile` | File | ✅ Yes | Mobile image (JPEG/PNG/WebP) |
| `tablet` | File | ✅ Yes | Tablet image (JPEG/PNG/WebP) |
| `is_active` | Boolean | No | Active status (default: false) |
| `description` | String | No | Banner description |
| `link_url` | String | No | Click URL |
| `display_order` | Number | No | Display order (default: 0) |

### Response (201)
```json
{
  "success": true,
  "data": {
    "_id": "banner_id",
    "title": "Honda Car Special Offer",
    "image": {
      "web": "https://s3.amazonaws.com/bucket/banners/web-banner-123456.jpg",
      "mobile": "https://s3.amazonaws.com/bucket/banners/mobile-banner-123456.jpg",
      "tablet": "https://s3.amazonaws.com/bucket/banners/tablet-banner-123456.jpg"
    },
    "brand_id": {
      "_id": "brand_id",
      "brand_name": "Honda",
      "brand_code": "HONDA"
    },
    "vehicle_type": {
      "_id": "type_id",
      "type_name": "Car",
      "type_code": "CAR"
    },
    "is_active": true,
    "description": "Special offer on Honda cars this month",
    "link_url": "https://example.com/honda-offer",
    "display_order": 1,
    "created_by": "admin_id",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  },
  "message": "Banner created successfully"
}
```

---

## ✏️ 4. Update Banner (Admin)

**Endpoint**: `PUT /api/banners/admin/:id`  
**Access**: Super-admin  
**Content-Type**: `multipart/form-data`

### Request (FormData)
```bash
curl -X PUT "http://localhost:5002/api/banners/admin/banner_id" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "title=Updated Honda Offer" \
  -F "is_active=false" \
  -F "description=Updated description" \
  -F "web=@new-web-banner.jpg"
```

**Note**: Only include fields you want to update. Images are optional and will only update if provided.

---

## 🗑️ 5. Delete Banner (Admin)

**Endpoint**: `DELETE /api/banners/admin/:id`  
**Access**: Super-admin

### Example
```bash
curl -X DELETE "http://localhost:5002/api/banners/admin/banner_id" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Response (200)
```json
{
  "success": true,
  "data": null,
  "message": "Banner deleted successfully"
}
```

**Note**: Cannot delete active banners. Deactivate first.

---

## 📊 6. Bulk Update Status

**Endpoint**: `PATCH /api/banners/admin/bulk-status`  
**Access**: Super-admin

### Request Body
```json
{
  "banner_ids": ["banner_id_1", "banner_id_2", "banner_id_3"],
  "is_active": true
}
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "modifiedCount": 3,
    "matchedCount": 3
  },
  "message": "3 banners updated successfully"
}
```

---

## 📱 7. Get Active Banners (Public)

**Endpoint**: `GET /api/banner/active`  
**Access**: Public

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `vehicle_type` | String | Filter by vehicle type ID |
| `brand_id` | String | Filter by brand ID |
| `limit` | Number | Limit results (default: 10) |

### Example
```bash
GET /api/banner/active?vehicle_type=car_type_id&brand_id=honda_brand_id&limit=5
```

### Response (200)
```json
{
  "success": true,
  "data": [
    {
      "_id": "banner_id",
      "title": "Honda Car Special Offer",
      "image": {
        "web": "https://s3.../web.jpg",
        "mobile": "https://s3.../mobile.jpg",
        "tablet": "https://s3.../tablet.jpg"
      },
      "brand_id": {
        "_id": "brand_id",
        "brand_name": "Honda",
        "brand_code": "HONDA"
      },
      "vehicle_type": {
        "_id": "type_id",
        "type_name": "Car",
        "type_code": "CAR"
      },
      "link_url": "https://example.com/honda-offer",
      "display_order": 1
    }
  ],
  "message": "Active banners fetched successfully"
}
```

---

## 🎯 8. Get Banners by Brand

**Endpoint**: `GET /api/banners/admin/by-brand/:brandId`  
**Access**: Super-admin, Inventory-Admin

### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `is_active` | Boolean | Filter by active status |

### Example
```bash
GET /api/banners/admin/by-brand/honda_brand_id?is_active=true
```

---

## 🚗 9. Get Banners by Vehicle Type

**Endpoint**: `GET /api/banners/admin/by-vehicle-type/:vehicleTypeId`  
**Access**: Super-admin, Inventory-Admin

### Example
```bash
GET /api/banners/admin/by-vehicle-type/car_type_id?is_active=true
```

---

## 🔢 10. Update Display Order

**Endpoint**: `PATCH /api/banners/admin/:id/display-order`  
**Access**: Super-admin

### Request Body
```json
{
  "display_order": 5
}
```

### Response (200)
```json
{
  "success": true,
  "data": {
    "_id": "banner_id",
    "title": "Honda Car Special Offer",
    "display_order": 5,
    // ... other banner fields
  },
  "message": "Display order updated successfully"
}
```

---

## 🔐 Access Control

| Endpoint | Super-admin | Inventory-Admin | Public |
|----------|-------------|-----------------|--------|
| `/stats` | ✅ | ✅ | ❌ |
| `/all` | ✅ | ✅ | ❌ |
| `/create` | ✅ | ❌ | ❌ |
| `/:id` (GET) | ✅ | ✅ | ❌ |
| `/:id` (PUT/DELETE) | ✅ | ❌ | ❌ |
| `/bulk-status` | ✅ | ❌ | ❌ |
| `/active` | ❌ | ❌ | ✅ |

---

## 💻 Frontend Integration Examples

### React Admin Dashboard

```jsx
const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    is_active: '',
    search: ''
  });

  // Fetch banner statistics
  useEffect(() => {
    const fetchStats = async () => {
      const response = await axios.get('/api/banners/admin/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      setStats(response.data.data);
    };
    fetchStats();
  }, []);

  // Fetch banners with filters
  useEffect(() => {
    const fetchBanners = async () => {
      const query = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/banners/admin/all?${query}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      setBanners(response.data.data.data);
    };
    fetchBanners();
  }, [filters]);

  const handleBulkStatusUpdate = async (bannerIds, isActive) => {
    await axios.patch('/api/banners/admin/bulk-status', {
      banner_ids: bannerIds,
      is_active: isActive
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    // Refresh data
    window.location.reload();
  };

  return (
    <div>
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Banners</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Active Banners</h3>
          <p>{stats.active}</p>
        </div>
        <div className="stat-card">
          <h3>Activation Rate</h3>
          <p>{stats.activationRate}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          placeholder="Search banners..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        <select
          value={filters.is_active}
          onChange={(e) => setFilters({...filters, is_active: e.target.value})}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Banner List */}
      <div className="banner-list">
        {banners.map(banner => (
          <div key={banner._id} className="banner-card">
            <img src={banner.image.web} alt={banner.title} />
            <h3>{banner.title}</h3>
            <p>Brand: {banner.brand_id.brand_name}</p>
            <p>Type: {banner.vehicle_type.type_name}</p>
            <span className={`status ${banner.is_active ? 'active' : 'inactive'}`}>
              {banner.is_active ? 'Active' : 'Inactive'}
            </span>
            <div className="actions">
              <button onClick={() => editBanner(banner._id)}>Edit</button>
              <button onClick={() => deleteBanner(banner._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Banner Upload Form

```jsx
const BannerUploadForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    brand_id: '',
    vehicle_type: '',
    description: '',
    link_url: '',
    display_order: 0,
    is_active: false
  });
  const [files, setFiles] = useState({
    web: null,
    mobile: null,
    tablet: null
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append('title', formData.title);
    data.append('brand_id', formData.brand_id);
    data.append('vehicle_type', formData.vehicle_type);
    data.append('description', formData.description);
    data.append('link_url', formData.link_url);
    data.append('display_order', formData.display_order);
    data.append('is_active', formData.is_active);

    if (files.web) data.append('web', files.web);
    if (files.mobile) data.append('mobile', files.mobile);
    if (files.tablet) data.append('tablet', files.tablet);

    try {
      const response = await axios.post('/api/banners/admin/create', data, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Banner created successfully!');
        // Reset form or redirect
      }
    } catch (error) {
      toast.error('Failed to create banner');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Banner Title"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        required
      />

      <select
        value={formData.brand_id}
        onChange={(e) => setFormData({...formData, brand_id: e.target.value})}
        required
      >
        <option value="">Select Brand</option>
        <option value="brand_id_1">Honda</option>
        <option value="brand_id_2">Maruti</option>
      </select>

      <select
        value={formData.vehicle_type}
        onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
        required
      >
        <option value="">Select Vehicle Type</option>
        <option value="type_id_1">Car</option>
        <option value="type_id_2">Bike</option>
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFiles({...files, web: e.target.files[0]})}
        required
      />
      <label>Web Image</label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFiles({...files, mobile: e.target.files[0]})}
        required
      />
      <label>Mobile Image</label>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFiles({...files, tablet: e.target.files[0]})}
        required
      />
      <label>Tablet Image</label>

      <button type="submit">Create Banner</button>
    </form>
  );
};
```

---

## 📊 Statistics Dashboard

The statistics endpoint provides comprehensive insights:

- **Total Banners**: All-time count
- **Active/Inactive**: Status breakdown
- **Activation Rate**: Percentage of active banners
- **By Vehicle Type**: Distribution across vehicle types
- **By Brand**: Top brands by banner count
- **Recent Activity**: Banners created in last 7 days

---

## 🔧 Key Features

### ✅ Advanced Filtering
- Filter by brand, vehicle type, active status
- Search by title
- Date range filtering
- Sort by any field

### ✅ Pagination
- Configurable page size
- Total count and page info
- Navigation helpers

### ✅ Bulk Operations
- Bulk status updates
- Multiple banner management

### ✅ Image Management
- Multi-device image support (web/mobile/tablet)
- S3 storage integration
- File type validation (JPEG/PNG/WebP)

### ✅ Display Order
- Control banner display sequence
- Frontend ordering support

### ✅ Public API
- Active banners for frontend
- No authentication required
- Optimized for performance

---

## 🚀 Summary

The banner admin controllers provide:

- ✅ **Complete CRUD** operations
- ✅ **Advanced filtering** and search
- ✅ **Statistics dashboard** with insights
- ✅ **Bulk operations** for efficiency
- ✅ **Multi-device image** support
- ✅ **Public API** for frontend
- ✅ **Role-based access** control
- ✅ **Comprehensive validation**
- ✅ **Error handling**
- ✅ **Audit logging** ready

**All endpoints are production-ready and fully documented!** 🎉
