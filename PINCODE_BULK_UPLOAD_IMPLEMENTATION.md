# Pincode Bulk Upload Implementation

## Overview
A comprehensive pincode management system with bulk CSV upload functionality has been implemented. This allows administrators to upload multiple pincodes at once and manage serviceability across different regions.

## Purpose
- Bulk upload pincodes from CSV files
- Manage serviceable areas
- Check pincode serviceability for orders
- Track delivery zones and estimated delivery times
- Provide pincode statistics for business intelligence

## Files Created

### 1. Model
- **`services/user-service/src/models/pincode.js`** - Pincode schema with all required fields

### 2. Controller  
- **`services/user-service/src/controllers/pincode.js`** - 8 controller functions

### 3. Routes
- **`services/user-service/src/routes/pincode.js`** - 10 API endpoints

### 4. Registration
- **`services/user-service/src/index.js`** - Routes registered at `/api/pincodes`

### 5. Test & Templates
- **`pincode-upload-template.csv`** - Sample CSV template with 10 pincodes
- **`test-pincode-bulk-upload.js`** - Comprehensive test script

### 6. Documentation
- **`PINCODE_BULK_UPLOAD_IMPLEMENTATION.md`** - This file

---

## Database Schema

```javascript
{
  pincode: String (required, unique, 6 digits),
  city: String (required),
  state: String (required),
  district: String (optional),
  region: String (optional),
  country: String (default: "India"),
  is_serviceable: Boolean (default: true),
  delivery_zone: Enum ["Zone-A", "Zone-B", "Zone-C", "Zone-D"],
  estimated_delivery_days: Number (default: 7),
  additional_charges: Number (default: 0),
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  created_by: String,
  updated_by: String,
  remarks: String,
  timestamps: true (createdAt, updatedAt)
}
```

### Indexes
- `pincode` - Unique index
- `city` - Non-unique index
- `state` - Non-unique index
- `city + state` - Compound index
- Text index on `pincode`, `city`, `state` for search

---

## API Endpoints

### 1. Bulk Upload Pincodes (CSV)

**Endpoint**: `POST /api/pincodes/bulk-upload`  
**Access**: Super-admin, Fulfillment-Admin  
**Content-Type**: `multipart/form-data`

**Request**:
```bash
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@pincodes.csv" \
  -F "created_by=user_id"
```

**Form Data**:
- `file` (File, required) - CSV file
- `created_by` (String, required) - User ID

**CSV Format**:
```csv
pincode,city,state,district,region,country,is_serviceable,delivery_zone,estimated_delivery_days,additional_charges,latitude,longitude,remarks
110001,New Delhi,Delhi,Central Delhi,North,India,true,Zone-A,3,0,28.6139,77.2090,Capital city
400001,Mumbai,Maharashtra,Mumbai City,West,India,true,Zone-A,4,0,18.9388,72.8354,Financial capital
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_rows": 100,
      "successful": 95,
      "duplicates": 3,
      "errors": 2,
      "success_rate": "95.00%"
    },
    "successful_uploads": [
      {
        "row": 2,
        "pincode": "110001",
        "city": "New Delhi",
        "state": "Delhi",
        "_id": "pincode_id"
      }
    ],
    "duplicates": [
      {
        "row": 5,
        "pincode": "400001",
        "message": "Pincode already exists in database",
        "existingData": {
          "city": "Mumbai",
          "state": "Maharashtra"
        }
      }
    ],
    "errors": [
      {
        "row": 10,
        "pincode": "12345",
        "error": "Invalid pincode format. Must be 6 digits."
      }
    ]
  },
  "message": "Bulk pincode upload completed"
}
```

---

### 2. Get All Pincodes (Paginated)

**Endpoint**: `GET /api/pincodes`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin, User

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 50)
- `search` (optional) - Search by pincode, city, state, district
- `state` (optional) - Filter by state
- `city` (optional) - Filter by city
- `is_serviceable` (optional) - Filter by serviceability (true/false)
- `delivery_zone` (optional) - Filter by delivery zone

**Example**:
```bash
GET /api/pincodes?page=1&limit=20&search=Delhi&is_serviceable=true
```

**Response**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "_id": "pincode_id",
        "pincode": "110001",
        "city": "New Delhi",
        "state": "Delhi",
        "district": "Central Delhi",
        "region": "North",
        "is_serviceable": true,
        "delivery_zone": "Zone-A",
        "estimated_delivery_days": 3,
        "additional_charges": 0
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 3. Check Pincode Serviceability

**Endpoint**: `GET /api/pincodes/check/:pincode`  
**Access**: Public (no authentication required)

**Example**:
```bash
GET /api/pincodes/check/110001
```

**Response**:
```json
{
  "success": true,
  "data": {
    "pincode": "110001",
    "city": "New Delhi",
    "state": "Delhi",
    "district": "Central Delhi",
    "is_serviceable": true,
    "delivery_zone": "Zone-A",
    "estimated_delivery_days": 3,
    "additional_charges": 0
  }
}
```

**If Not Found**:
```json
{
  "success": true,
  "data": {
    "pincode": "999999",
    "is_serviceable": false,
    "message": "Pincode not found in our service area"
  }
}
```

---

### 4. Get Pincode Statistics

**Endpoint**: `GET /api/pincodes/stats`  
**Access**: Super-admin, Fulfillment-Admin, Inventory-Admin

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "serviceable": 850,
    "non_serviceable": 150,
    "coverage_percentage": "85.00%",
    "avg_delivery_days": 5.2,
    "state_breakdown": [
      {
        "_id": "Maharashtra",
        "count": 250,
        "serviceable": 220
      },
      {
        "_id": "Delhi",
        "count": 180,
        "serviceable": 180
      }
    ],
    "zone_breakdown": [
      {
        "_id": "Zone-A",
        "count": 600
      },
      {
        "_id": "Zone-B",
        "count": 300
      }
    ]
  }
}
```

---

### 5. Create Single Pincode

**Endpoint**: `POST /api/pincodes`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "pincode": "110001",
  "city": "New Delhi",
  "state": "Delhi",
  "district": "Central Delhi",
  "region": "North",
  "country": "India",
  "is_serviceable": true,
  "delivery_zone": "Zone-A",
  "estimated_delivery_days": 3,
  "additional_charges": 0,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "created_by": "user_id",
  "remarks": "Capital city"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "pincode_id",
    "pincode": "110001",
    "city": "New Delhi",
    "state": "Delhi",
    "is_serviceable": true,
    "delivery_zone": "Zone-A",
    "estimated_delivery_days": 3
  },
  "message": "Pincode created successfully"
}
```

---

### 6. Update Pincode

**Endpoint**: `PUT /api/pincodes/:id`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body** (all optional):
```json
{
  "is_serviceable": false,
  "delivery_zone": "Zone-C",
  "estimated_delivery_days": 10,
  "additional_charges": 100,
  "updated_by": "user_id",
  "remarks": "Remote area"
}
```

---

### 7. Delete Pincode

**Endpoint**: `DELETE /api/pincodes/:id`  
**Access**: Super-admin only

---

### 8. Get All States

**Endpoint**: `GET /api/pincodes/states`  
**Access**: Public

**Response**:
```json
{
  "success": true,
  "data": {
    "states": ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", ...]
  }
}
```

---

### 9. Get Cities by State

**Endpoint**: `GET /api/pincodes/cities/:state`  
**Access**: Public

**Example**: `GET /api/pincodes/cities/Maharashtra`

**Response**:
```json
{
  "success": true,
  "data": {
    "state": "Maharashtra",
    "cities": ["Mumbai", "Pune", "Nagpur", "Nashik", ...]
  }
}
```

---

### 10. Get Pincode by Number

**Endpoint**: `GET /api/pincodes/:pincode`  
**Access**: Public

**Example**: `GET /api/pincodes/110001`

---

### 11. Bulk Update Serviceability

**Endpoint**: `PATCH /api/pincodes/bulk-update-serviceability`  
**Access**: Super-admin, Fulfillment-Admin

**Request Body**:
```json
{
  "pincodes": ["110001", "110002", "110003"],
  "is_serviceable": false,
  "updated_by": "user_id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "matched": 3,
    "modified": 3
  },
  "message": "Pincodes serviceability updated successfully"
}
```

---

## CSV File Format

### Required Columns
1. **pincode** - 6-digit Indian pincode (e.g., "110001")
2. **city** - City name (e.g., "New Delhi")
3. **state** - State name (e.g., "Delhi")

### Optional Columns
4. **district** - District name
5. **region** - Region (North, South, East, West)
6. **country** - Country name (default: "India")
7. **is_serviceable** - true/false (default: true)
8. **delivery_zone** - Zone-A/Zone-B/Zone-C/Zone-D (default: "Zone-A")
9. **estimated_delivery_days** - Number (default: 7)
10. **additional_charges** - Number (default: 0)
11. **latitude** - Latitude coordinate
12. **longitude** - Longitude coordinate
13. **remarks** - Any remarks

### Sample CSV Content
```csv
pincode,city,state,district,region,country,is_serviceable,delivery_zone,estimated_delivery_days,additional_charges,latitude,longitude,remarks
110001,New Delhi,Delhi,Central Delhi,North,India,true,Zone-A,3,0,28.6139,77.2090,Capital city
400001,Mumbai,Maharashtra,Mumbai City,West,India,true,Zone-A,4,0,18.9388,72.8354,Financial capital
560001,Bangalore,Karnataka,Bangalore Urban,South,India,true,Zone-A,5,0,12.9716,77.5946,IT hub
```

---

## Validation Rules

### Pincode Format
- Must be exactly 6 digits
- Only numeric characters allowed
- Examples: `110001`, `400001`, `560001`
- Invalid: `1234`, `12345A`, `1234567`

### Required Fields
- `pincode` - Cannot be empty
- `city` - Cannot be empty
- `state` - Cannot be empty

### Delivery Zone
- Must be one of: "Zone-A", "Zone-B", "Zone-C", "Zone-D"
- Defaults to "Zone-A" if invalid or missing

### Numeric Fields
- `estimated_delivery_days` - Minimum 1 day
- `additional_charges` - Minimum 0 (cannot be negative)

---

## Upload Process Flow

```
1. Upload CSV file
   ↓
2. Parse CSV rows
   ↓
3. For each row:
   ├── Validate required fields (pincode, city, state)
   ├── Validate pincode format (6 digits)
   ├── Check for duplicates in database
   ├── If duplicate → Add to duplicates list
   ├── If validation error → Add to errors list
   └── If valid → Create pincode → Add to successful list
   ↓
4. Return summary with:
   - Total rows processed
   - Successful uploads
   - Duplicates found
   - Errors encountered
   - Success rate percentage
```

---

## Error Handling

### Validation Errors
```json
{
  "row": 5,
  "pincode": "12345",
  "error": "Invalid pincode format. Must be 6 digits."
}
```

### Duplicate Errors
```json
{
  "row": 10,
  "pincode": "110001",
  "message": "Pincode already exists in database",
  "existingData": {
    "city": "New Delhi",
    "state": "Delhi"
  }
}
```

### Missing Fields
```json
{
  "row": 15,
  "pincode": "N/A",
  "error": "Missing required fields (pincode, city, or state)"
}
```

---

## Use Cases

### 1. Initial Setup - Load All Indian Pincodes
```bash
# Upload CSV with all Indian pincodes (19,000+ rows)
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@all-india-pincodes.csv" \
  -F "created_by=admin_user_id"
```

### 2. Add New Serviceable Areas
```bash
# Upload CSV with newly serviceable pincodes
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@new-areas.csv" \
  -F "created_by=admin_user_id"
```

### 3. Check Serviceability During Checkout
```bash
# Frontend checks if user's pincode is serviceable
GET /api/pincodes/check/110001

# Response tells if delivery is available
{
  "is_serviceable": true,
  "estimated_delivery_days": 3,
  "additional_charges": 0
}
```

### 4. Display Coverage Statistics
```bash
# Admin dashboard shows coverage
GET /api/pincodes/stats

# Shows total pincodes, coverage percentage, state breakdown
```

### 5. Disable Serviceability for Remote Areas
```bash
# Bulk disable multiple pincodes
PATCH /api/pincodes/bulk-update-serviceability
{
  "pincodes": ["123456", "234567", "345678"],
  "is_serviceable": false,
  "updated_by": "admin_id"
}
```

---

## Frontend Integration

### React - Bulk Upload Component

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const PincodeBulkUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('created_by', userId);

      const response = await axios.post(
        '/api/pincodes/bulk-upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
        toast.success(`Upload completed! ${response.data.data.summary.successful} pincodes added`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Bulk Upload Pincodes</h2>
      
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
      
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload CSV'}
      </button>

      {result && (
        <div>
          <h3>Upload Summary</h3>
          <p>Total Rows: {result.summary.total_rows}</p>
          <p>Successful: {result.summary.successful}</p>
          <p>Duplicates: {result.summary.duplicates}</p>
          <p>Errors: {result.summary.errors}</p>
          <p>Success Rate: {result.summary.success_rate}</p>

          {result.errors.length > 0 && (
            <div>
              <h4>Errors:</h4>
              <ul>
                {result.errors.map((err, idx) => (
                  <li key={idx}>
                    Row {err.row}: {err.pincode} - {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.duplicates.length > 0 && (
            <div>
              <h4>Duplicates:</h4>
              <ul>
                {result.duplicates.map((dup, idx) => (
                  <li key={idx}>
                    Row {dup.row}: {dup.pincode} - {dup.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### React - Pincode Checker Component

```jsx
const PincodeChecker = ({ onPincodeValid }) => {
  const [pincode, setPincode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const checkPincode = async () => {
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setChecking(true);

    try {
      const response = await axios.get(`/api/pincodes/check/${pincode}`);

      if (response.data.success) {
        setResult(response.data.data);
        
        if (response.data.data.is_serviceable) {
          toast.success(`Delivery available in ${response.data.data.estimated_delivery_days} days`);
          onPincodeValid(response.data.data);
        } else {
          toast.error('Sorry, we don\'t deliver to this pincode yet');
        }
      }
    } catch (error) {
      toast.error('Error checking pincode');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={pincode}
        onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="Enter 6-digit pincode"
        maxLength="6"
      />
      
      <button onClick={checkPincode} disabled={checking}>
        {checking ? 'Checking...' : 'Check'}
      </button>

      {result && result.is_serviceable && (
        <div className="success">
          <p>✅ We deliver to {result.city}, {result.state}</p>
          <p>Estimated delivery: {result.estimated_delivery_days} days</p>
          {result.additional_charges > 0 && (
            <p>Additional charges: ₹{result.additional_charges}</p>
          )}
        </div>
      )}

      {result && !result.is_serviceable && (
        <div className="error">
          <p>❌ Sorry, delivery not available for this pincode</p>
        </div>
      )}
    </div>
  );
};
```

---

## Performance Considerations

### Bulk Upload Optimization
- Processes rows sequentially to provide detailed error reporting
- For very large files (50,000+ rows), consider background processing
- File size limit: 10MB

### Database Indexes
- Unique index on `pincode` for fast duplicate checking
- Compound index on `city + state` for location queries
- Text index for search functionality

### Recommendations
1. Use pagination when fetching pincodes
2. Cache frequently checked pincodes
3. Consider background job for very large uploads
4. Add rate limiting to public endpoints

---

## Business Logic

### Delivery Zones
- **Zone-A**: Metro cities (fastest delivery, no extra charge)
- **Zone-B**: Tier-2 cities (moderate delivery time, small charge)
- **Zone-C**: Tier-3 cities (longer delivery, moderate charge)
- **Zone-D**: Remote areas (longest delivery, higher charges)

### Serviceability Check
Used during:
- Order placement
- Cart checkout
- Address validation
- Delivery estimation

---

## Testing

### Run Test Script
```bash
node test-pincode-bulk-upload.js
```

### Manual Testing

**1. Upload CSV**:
```bash
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@pincode-upload-template.csv" \
  -F "created_by=user_id"
```

**2. Check Serviceability**:
```bash
curl http://localhost:5000/api/pincodes/check/110001
```

**3. Get Statistics**:
```bash
curl -X GET "http://localhost:5000/api/pincodes/stats" \
  -H "Authorization: Bearer TOKEN"
```

---

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Pincode found/updated |
| 201 | Created | Pincode created successfully |
| 400 | Bad Request | Missing file or required fields |
| 404 | Not Found | Pincode doesn't exist |
| 409 | Conflict | Duplicate pincode |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 500 | Server Error | Database or processing error |

---

## Best Practices

### CSV File Preparation
1. **Use the template** - Start with `pincode-upload-template.csv`
2. **Clean data** - Remove extra spaces, special characters
3. **Validate offline** - Check for duplicates before uploading
4. **Test with small file first** - Upload 10-20 rows to verify format

### Data Entry
1. **Consistent naming** - Use same spelling for cities/states
2. **Proper capitalization** - "Delhi" not "DELHI" or "delhi"
3. **Complete coordinates** - Include lat/long for better mapping
4. **Meaningful remarks** - Help identify special cases

### Production Deployment
1. **Start with major cities** - Upload tier-1 cities first
2. **Expand gradually** - Add tier-2, tier-3 cities progressively
3. **Monitor duplicates** - Review duplicate log to find data issues
4. **Regular updates** - Keep pincode data current

---

## Common Issues & Solutions

### Issue 1: Duplicate Pincodes in CSV
**Problem**: Same pincode appears multiple times in CSV  
**Solution**: Clean CSV file before uploading, system will skip duplicates

### Issue 2: Invalid Pincode Format
**Problem**: Pincodes with less/more than 6 digits  
**Solution**: Ensure all pincodes are exactly 6 digits

### Issue 3: Missing Required Fields
**Problem**: Some rows missing city or state  
**Solution**: Fill in all required fields before uploading

### Issue 4: Special Characters in Names
**Problem**: City names with special characters  
**Solution**: Use plain text, avoid special characters

### Issue 5: Large File Upload Timeout
**Problem**: File too large, request times out  
**Solution**: Split into smaller files (5,000 rows each)

---

## Future Enhancements

### Potential Features
1. **Background Processing** - Queue for very large files
2. **Excel Support** - Accept .xlsx files in addition to CSV
3. **Data Validation** - Verify city/state combinations against master data
4. **Geocoding** - Auto-fill lat/long from pincode
5. **Pincode Range Upload** - Upload ranges (e.g., 110001-110010)
6. **Update Mode** - Option to update existing pincodes from CSV
7. **Export Functionality** - Download current pincodes as CSV
8. **Delivery Time Calculation** - Auto-calculate delivery time based on distance

---

## Summary

### Files Created
1. ✅ `services/user-service/src/models/pincode.js` - Pincode model
2. ✅ `services/user-service/src/controllers/pincode.js` - Controller with 8 functions
3. ✅ `services/user-service/src/routes/pincode.js` - 10 API routes
4. ✅ `pincode-upload-template.csv` - Sample CSV template
5. ✅ `test-pincode-bulk-upload.js` - Test script

### Files Modified
1. ✅ `services/user-service/src/index.js` - Registered pincode routes

### Features Implemented
- ✅ Bulk CSV upload with detailed error reporting
- ✅ Duplicate detection and prevention
- ✅ Pagination and filtering
- ✅ Search functionality
- ✅ Serviceability checking (public endpoint)
- ✅ Statistics and analytics
- ✅ State and city lookups
- ✅ Bulk update serviceability
- ✅ CRUD operations
- ✅ Role-based access control

### API Endpoints (10)
1. `POST /api/pincodes/bulk-upload` - Bulk upload
2. `GET /api/pincodes` - List with pagination
3. `GET /api/pincodes/check/:pincode` - Check serviceability
4. `GET /api/pincodes/stats` - Get statistics
5. `GET /api/pincodes/states` - Get all states
6. `GET /api/pincodes/cities/:state` - Get cities by state
7. `GET /api/pincodes/:pincode` - Get by pincode number
8. `POST /api/pincodes` - Create single
9. `PUT /api/pincodes/:id` - Update
10. `DELETE /api/pincodes/:id` - Delete
11. `PATCH /api/pincodes/bulk-update-serviceability` - Bulk update

The pincode management system is now fully functional and ready for use!
