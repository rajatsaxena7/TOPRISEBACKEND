# Pincode Bulk Upload - Quick Reference

## Endpoint
```
POST /api/pincodes/bulk-upload
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data
```

**Access**: Super-admin, Fulfillment-Admin

---

## Upload Request

### Using curl
```bash
curl -X POST "http://localhost:5000/api/pincodes/bulk-upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@pincodes.csv" \
  -F "created_by=user_id"
```

### Using JavaScript
```javascript
const formData = new FormData();
formData.append('file', csvFile);
formData.append('created_by', userId);

await axios.post('/api/pincodes/bulk-upload', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## CSV Format

### Required Columns
```csv
pincode,city,state
110001,New Delhi,Delhi
400001,Mumbai,Maharashtra
560001,Bangalore,Karnataka
```

### All Columns (with optional fields)
```csv
pincode,city,state,district,region,country,is_serviceable,delivery_zone,estimated_delivery_days,additional_charges,latitude,longitude,remarks
110001,New Delhi,Delhi,Central Delhi,North,India,true,Zone-A,3,0,28.6139,77.2090,Capital city
400001,Mumbai,Maharashtra,Mumbai City,West,India,true,Zone-A,4,0,18.9388,72.8354,Financial capital
```

---

## Response Example

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
    "successful_uploads": [...],
    "duplicates": [...],
    "errors": [...]
  }
}
```

---

## Other Useful Endpoints

### Check Pincode (Public)
```bash
GET /api/pincodes/check/110001
```

### Get All Pincodes
```bash
GET /api/pincodes?page=1&limit=50&search=Delhi
```

### Get Statistics
```bash
GET /api/pincodes/stats
```

### Get All States
```bash
GET /api/pincodes/states
```

### Get Cities by State
```bash
GET /api/pincodes/cities/Maharashtra
```

---

## Field Reference

| Field | Required | Type | Example |
|-------|----------|------|---------|
| pincode | ✅ Yes | 6-digit string | `"110001"` |
| city | ✅ Yes | String | `"New Delhi"` |
| state | ✅ Yes | String | `"Delhi"` |
| district | No | String | `"Central Delhi"` |
| region | No | String | `"North"` |
| is_serviceable | No | Boolean | `true` / `false` |
| delivery_zone | No | Enum | `"Zone-A"` |
| estimated_delivery_days | No | Number | `3` |
| additional_charges | No | Number | `50` |
| latitude | No | Number | `28.6139` |
| longitude | No | Number | `77.2090` |

---

## Delivery Zones

- **Zone-A**: Metro cities (3-4 days, no extra charge)
- **Zone-B**: Tier-2 cities (5-7 days, ₹50)
- **Zone-C**: Tier-3 cities (7-10 days, ₹100)
- **Zone-D**: Remote areas (10-15 days, ₹150)

---

## Files

- **Model**: `services/user-service/src/models/pincode.js`
- **Controller**: `services/user-service/src/controllers/pincode.js`
- **Routes**: `services/user-service/src/routes/pincode.js`
- **Template**: `pincode-upload-template.csv`
- **Test**: `test-pincode-bulk-upload.js`

---

## Quick Start

1. **Download template**: Use `pincode-upload-template.csv`
2. **Fill in data**: Add your pincodes
3. **Upload**: Use bulk-upload endpoint
4. **Check results**: Review summary for errors/duplicates
5. **Test**: Use check endpoint to verify

---

## Common Errors

### Duplicate Pincode
```
"Pincode already exists in database"
```
**Fix**: Skip or update existing pincode

### Invalid Format
```
"Invalid pincode format. Must be 6 digits."
```
**Fix**: Ensure pincode is exactly 6 digits

### Missing Fields
```
"Missing required fields (pincode, city, or state)"
```
**Fix**: Fill in all required columns

---

## Benefits

✅ **Bulk Upload** - Add thousands of pincodes at once  
✅ **Detailed Reporting** - Know exactly which rows succeeded/failed  
✅ **Duplicate Prevention** - Auto-detects existing pincodes  
✅ **Validation** - Ensures data quality  
✅ **Public Check** - Users can verify delivery availability  
✅ **Statistics** - Track coverage and performance  

Complete documentation: `PINCODE_BULK_UPLOAD_IMPLEMENTATION.md`
