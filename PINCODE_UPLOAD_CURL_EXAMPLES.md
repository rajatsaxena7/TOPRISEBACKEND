# Pincode Bulk Upload - cURL Examples

## Main Bulk Upload Endpoint

### Basic Upload
```bash
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@pincode-upload-template.csv" \
  -F "created_by=YOUR_USER_ID_HERE"
```

### With Full Path
```bash
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@C:/Users/offic/OneDrive/Desktop/TOPRISEBACKEND/pincode-upload-template.csv" \
  -F "created_by=66f4a1b2c3d4e5f6a7b8c9d0"
```

---

## Request Body Components

### Form Data Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ Yes | CSV file with pincode data |
| `created_by` | String | ✅ Yes | User ID performing the upload |

---

## CSV File Structure

### Minimal CSV (Required Fields Only)
```csv
pincode,city,state
110001,New Delhi,Delhi
400001,Mumbai,Maharashtra
560001,Bangalore,Karnataka
```

### Complete CSV (All Fields)
```csv
pincode,city,state,district,region,country,is_serviceable,delivery_zone,estimated_delivery_days,additional_charges,latitude,longitude,remarks
110001,New Delhi,Delhi,Central Delhi,North,India,true,Zone-A,3,0,28.6139,77.2090,Capital
400001,Mumbai,Maharashtra,Mumbai City,West,India,true,Zone-A,4,0,18.9388,72.8354,Finance hub
560001,Bangalore,Karnataka,Bangalore Urban,South,India,true,Zone-A,5,0,12.9716,77.5946,IT city
```

---

## Response Examples

### Successful Upload Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_rows": 10,
      "successful": 10,
      "duplicates": 0,
      "errors": 0,
      "success_rate": "100.00%"
    },
    "successful_uploads": [
      {
        "row": 2,
        "pincode": "110001",
        "city": "New Delhi",
        "state": "Delhi",
        "_id": "68ee267d99e65323879795fa"
      },
      {
        "row": 3,
        "pincode": "400001",
        "city": "Mumbai",
        "state": "Maharashtra",
        "_id": "68ee267d99e65323879795fb"
      }
    ],
    "duplicates": [],
    "errors": []
  },
  "message": "Bulk pincode upload completed"
}
```

### Upload with Duplicates
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_rows": 10,
      "successful": 7,
      "duplicates": 3,
      "errors": 0,
      "success_rate": "70.00%"
    },
    "duplicates": [
      {
        "row": 2,
        "pincode": "110001",
        "city": "New Delhi",
        "state": "Delhi",
        "message": "Pincode already exists in database",
        "existingData": {
          "city": "New Delhi",
          "state": "Delhi"
        }
      }
    ]
  }
}
```

### Upload with Errors
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_rows": 10,
      "successful": 8,
      "duplicates": 0,
      "errors": 2,
      "success_rate": "80.00%"
    },
    "errors": [
      {
        "row": 5,
        "pincode": "12345",
        "error": "Invalid pincode format. Must be 6 digits.",
        "data": {
          "pincode": "12345",
          "city": "Test",
          "state": "Test"
        }
      },
      {
        "row": 8,
        "pincode": "N/A",
        "error": "Missing required fields (pincode, city, or state)",
        "data": {
          "pincode": "",
          "city": "Test",
          "state": ""
        }
      }
    ]
  }
}
```

---

## Other Endpoints

### Check Pincode Serviceability (No Auth Required)
```bash
curl http://localhost:5000/api/pincodes/check/110001
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

### Get All Pincodes (Paginated)
```bash
curl -X GET "http://localhost:5000/api/pincodes?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search Pincodes
```bash
curl -X GET "http://localhost:5000/api/pincodes?search=Delhi&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by State
```bash
curl -X GET "http://localhost:5000/api/pincodes?state=Maharashtra&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Statistics
```bash
curl -X GET "http://localhost:5000/api/pincodes/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get All States
```bash
curl http://localhost:5000/api/pincodes/states
```

### Get Cities by State
```bash
curl http://localhost:5000/api/pincodes/cities/Maharashtra
```

### Create Single Pincode
```bash
curl -X POST "http://localhost:5000/api/pincodes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pincode": "110001",
    "city": "New Delhi",
    "state": "Delhi",
    "is_serviceable": true,
    "delivery_zone": "Zone-A",
    "estimated_delivery_days": 3,
    "created_by": "user_id"
  }'
```

### Update Pincode
```bash
curl -X PUT "http://localhost:5000/api/pincodes/:id" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_serviceable": false,
    "delivery_zone": "Zone-D",
    "estimated_delivery_days": 15,
    "additional_charges": 200,
    "updated_by": "user_id"
  }'
```

### Bulk Update Serviceability
```bash
curl -X PATCH "http://localhost:5000/api/pincodes/bulk-update-serviceability" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pincodes": ["110001", "110002", "110003"],
    "is_serviceable": false,
    "updated_by": "user_id"
  }'
```

### Delete Pincode
```bash
curl -X DELETE "http://localhost:5000/api/pincodes/:id" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## CSV Template

Download: `pincode-upload-template.csv`

Contains 10 sample pincodes ready to upload.

---

## Quick Tips

1. **File must be CSV format** (.csv extension)
2. **First row is header** (will be skipped)
3. **Pincode must be 6 digits** (Indian format)
4. **Required fields**: pincode, city, state
5. **Max file size**: 10MB
6. **Duplicates are skipped** (not created again)
7. **Errors don't stop upload** (continues processing)

---

## Common Errors

| Error | Fix |
|-------|-----|
| "CSV file is required" | Add `-F "file=@filename.csv"` |
| "created_by field is required" | Add `-F "created_by=user_id"` |
| "Only CSV files are allowed" | Ensure file extension is .csv |
| "Invalid pincode format" | Ensure 6 digits only |
| "Pincode already exists" | Normal, will be in duplicates list |

---

## Testing

```bash
# 1. Upload template
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@pincode-upload-template.csv" \
  -F "created_by=user_id"

# 2. Check if uploaded
curl http://localhost:5000/api/pincodes/check/110001

# 3. View statistics
curl -X GET "http://localhost:5000/api/pincodes/stats" \
  -H "Authorization: Bearer TOKEN"
```

---

## Summary

**Main Endpoint**: `POST /api/pincodes/bulk-upload`  
**Form Fields**: `file` (CSV) + `created_by` (String)  
**CSV Columns**: pincode, city, state (+ 10 optional fields)  
**Returns**: Detailed summary with successful, duplicate, and error lists  
**Max Size**: 10MB  
**Access**: Super-admin, Fulfillment-Admin  

For complete documentation, see: `PINCODE_BULK_UPLOAD_IMPLEMENTATION.md`
