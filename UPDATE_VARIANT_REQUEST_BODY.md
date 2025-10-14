# Update Variant - Request Body Guide

## Endpoint
```
PUT /api/variants/:id
```

## Authentication
**Required**: Yes  
**Roles**: Super-admin, Fulfillment-Admin

**Header**:
```
Authorization: Bearer YOUR_TOKEN
```

---

## Request Body Format

### All Available Fields (All Optional)

```json
{
  "variant_name": "2.5L Premium",
  "variant_code": "VAR_2.5L_PREM",
  "variant_Description": "Premium variant with advanced features",
  "variant_status": "active",
  "model": "model_object_id",
  "Year": ["year_object_id_1", "year_object_id_2"],
  "updated_by": "user_id",
  "change_logs": "Updated variant description and status"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `variant_name` | String | No | Name of the variant (must be unique) |
| `variant_code` | String | No | Code for the variant (must be unique) |
| `variant_Description` | String | No | Detailed description of the variant |
| `variant_status` | String | No | Status: "active", "inactive", "pending", "created", "rejected" |
| `model` | ObjectId | No | Reference to Model document |
| `Year` | Array[ObjectId] | No | Array of Year document references |
| `updated_by` | String | Yes | User ID who is updating |
| `change_logs` | String | No | Description of changes made (default: "Fields updated") |

---

## Request Examples

### 1. Update Only Variant Name

```bash
curl -X PUT "http://localhost:5001/api/variants/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_name": "3.0L Premium Plus",
    "updated_by": "user_id_here",
    "change_logs": "Updated variant name to reflect new specifications"
  }'
```

### 2. Update Description and Status

```bash
curl -X PUT "http://localhost:5001/api/variants/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_Description": "Updated description with more details about features",
    "variant_status": "active",
    "updated_by": "user_id_here",
    "change_logs": "Updated description and activated variant"
  }'
```

### 3. Update Multiple Fields

```bash
curl -X PUT "http://localhost:5001/api/variants/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_name": "2.5L Premium",
    "variant_code": "VAR_2.5L_PREM",
    "variant_Description": "Premium variant with leather seats and sunroof",
    "variant_status": "active",
    "model": "model_object_id_here",
    "Year": ["year_id_1", "year_id_2", "year_id_3"],
    "updated_by": "user_id_here",
    "change_logs": "Updated variant details and associated years"
  }'
```

### 4. Update with Image Upload (Multipart Form Data)

```bash
curl -X PUT "http://localhost:5001/api/variants/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "variant_name=2.5L Premium" \
  -F "variant_code=VAR_2.5L_PREM" \
  -F "variant_Description=Premium variant description" \
  -F "variant_status=active" \
  -F "model=model_object_id" \
  -F "Year[]=year_id_1" \
  -F "Year[]=year_id_2" \
  -F "updated_by=user_id" \
  -F "change_logs=Updated variant with new image" \
  -F "file=@/path/to/variant-image.jpg"
```

### 5. Minimal Update (Only Required Field)

```bash
curl -X PUT "http://localhost:5001/api/variants/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "updated_by": "user_id_here"
  }'
```

### 6. Change Status to Inactive

```bash
curl -X PUT "http://localhost:5001/api/variants/68ee267d99e65323879795fa" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variant_status": "inactive",
    "updated_by": "user_id_here",
    "change_logs": "Deactivated variant as it is discontinued"
  }'
```

---

## JavaScript/Frontend Examples

### Using Fetch API

```javascript
const updateVariant = async (variantId, data) => {
  const response = await fetch(`http://localhost:5001/api/variants/${variantId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      variant_name: data.name,
      variant_code: data.code,
      variant_Description: data.description,
      variant_status: data.status,
      model: data.modelId,
      Year: data.yearIds,
      updated_by: userId,
      change_logs: data.changeNotes || 'Updated variant details'
    })
  });
  
  return await response.json();
};

// Usage
const result = await updateVariant('68ee267d99e65323879795fa', {
  name: '2.5L Premium',
  code: 'VAR_2.5L_PREM',
  description: 'Premium variant',
  status: 'active',
  modelId: 'model_id_here',
  yearIds: ['year_id_1', 'year_id_2'],
  changeNotes: 'Updated variant information'
});
```

### Using Axios

```javascript
import axios from 'axios';

const updateVariant = async (variantId, formData) => {
  try {
    const response = await axios.put(
      `http://localhost:5001/api/variants/${variantId}`,
      {
        variant_name: formData.name,
        variant_code: formData.code,
        variant_Description: formData.description,
        variant_status: formData.status,
        model: formData.modelId,
        Year: formData.yearIds,
        updated_by: userId,
        change_logs: formData.changeNotes
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      // Duplicate variant name or code
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 404) {
      // Variant not found
      throw new Error('Variant not found');
    }
    throw error;
  }
};
```

### With Image Upload (FormData)

```javascript
const updateVariantWithImage = async (variantId, formData, imageFile) => {
  const data = new FormData();
  
  // Add all fields
  data.append('variant_name', formData.name);
  data.append('variant_code', formData.code);
  data.append('variant_Description', formData.description);
  data.append('variant_status', formData.status);
  data.append('model', formData.modelId);
  
  // Add years array
  formData.yearIds.forEach(yearId => {
    data.append('Year[]', yearId);
  });
  
  data.append('updated_by', userId);
  data.append('change_logs', formData.changeNotes);
  
  // Add image file
  if (imageFile) {
    data.append('file', imageFile);
  }
  
  const response = await axios.put(
    `http://localhost:5001/api/variants/${variantId}`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  
  return response.data;
};
```

---

## Response Examples

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "68ee267d99e65323879795fa",
    "variant_name": "2.5L Premium",
    "variant_code": "VAR_2.5L_PREM",
    "variant_Description": "Premium variant with advanced features",
    "variant_status": "active",
    "variant_image": "https://s3.amazonaws.com/bucket/variant-image.jpg",
    "model": {
      "_id": "model_id",
      "model_name": "Camry",
      "model_code": "CAM"
    },
    "Year": [
      {
        "_id": "year_id_1",
        "year_name": "2020",
        "year_code": "2020"
      },
      {
        "_id": "year_id_2",
        "year_name": "2021",
        "year_code": "2021"
      }
    ],
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-10-14T11:00:00.000Z",
    "created_by": "user_id",
    "updated_by": [
      {
        "updated_by": "user_id",
        "updated_at": "2025-10-14T11:00:00.000Z",
        "change_logs": "Updated variant description and status"
      }
    ]
  },
  "message": "Variant updated successfully"
}
```

### Error Response - Duplicate (409)

```json
{
  "success": false,
  "message": "Variant with name \"2.5L Premium\" already exists"
}
```

or

```json
{
  "success": false,
  "message": "Variant with code \"VAR_2.5L_PREM\" already exists"
}
```

### Error Response - Not Found (404)

```json
{
  "success": false,
  "message": "Variant not found"
}
```

---

## Field Details

### variant_name
- **Type**: String
- **Unique**: Yes
- **Example**: `"2.5L Premium"`, `"3.0L Sport"`, `"Hybrid LE"`

### variant_code
- **Type**: String
- **Unique**: Yes
- **Example**: `"VAR_2.5L_PREM"`, `"VAR_3.0_SPORT"`, `"VAR_HYB_LE"`

### variant_Description
- **Type**: String
- **Example**: `"Premium variant with leather seats, sunroof, and advanced safety features"`

### variant_status
- **Type**: Enum String
- **Values**: `"active"`, `"inactive"`, `"pending"`, `"created"`, `"rejected"`
- **Default**: `"active"`

### model
- **Type**: MongoDB ObjectId
- **Reference**: Model collection
- **Example**: `"507f1f77bcf86cd799439011"`

### Year
- **Type**: Array of MongoDB ObjectIds
- **Reference**: Year collection
- **Example**: `["year_id_1", "year_id_2", "year_id_3"]`

### updated_by
- **Type**: String (User ID)
- **Required**: Yes
- **Example**: `"user_id_here"`

### change_logs
- **Type**: String
- **Default**: `"Fields updated"`
- **Example**: `"Updated variant name and description to match new specifications"`

---

## React Form Example

```jsx
import React, { useState, useEffect } from 'react';

const UpdateVariantForm = ({ variantId, onSuccess }) => {
  const [formData, setFormData] = useState({
    variant_name: '',
    variant_code: '',
    variant_Description: '',
    variant_status: 'active',
    model: '',
    Year: [],
    change_logs: ''
  });
  
  const [imageFile, setImageFile] = useState(null);

  // Load existing variant data
  useEffect(() => {
    const fetchVariant = async () => {
      const response = await axios.get(`/api/variants/${variantId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const variant = response.data.data;
        setFormData({
          variant_name: variant.variant_name,
          variant_code: variant.variant_code,
          variant_Description: variant.variant_Description,
          variant_status: variant.variant_status,
          model: variant.model._id,
          Year: variant.Year.map(y => y._id),
          change_logs: ''
        });
      }
    };
    
    fetchVariant();
  }, [variantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (imageFile) {
        // Use FormData for file upload
        const data = new FormData();
        data.append('variant_name', formData.variant_name);
        data.append('variant_code', formData.variant_code);
        data.append('variant_Description', formData.variant_Description);
        data.append('variant_status', formData.variant_status);
        data.append('model', formData.model);
        formData.Year.forEach(yearId => data.append('Year[]', yearId));
        data.append('updated_by', userId);
        data.append('change_logs', formData.change_logs || 'Updated variant');
        data.append('file', imageFile);
        
        response = await axios.put(`/api/variants/${variantId}`, data, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Use JSON for text-only update
        response = await axios.put(`/api/variants/${variantId}`, {
          ...formData,
          updated_by: userId
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (response.data.success) {
        toast.success('Variant updated successfully');
        onSuccess(response.data.data);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 404) {
        toast.error('Variant not found');
      } else {
        toast.error('Failed to update variant');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.variant_name}
        onChange={(e) => setFormData({...formData, variant_name: e.target.value})}
        placeholder="Variant Name"
      />
      
      <input
        type="text"
        value={formData.variant_code}
        onChange={(e) => setFormData({...formData, variant_code: e.target.value})}
        placeholder="Variant Code"
      />
      
      <textarea
        value={formData.variant_Description}
        onChange={(e) => setFormData({...formData, variant_Description: e.target.value})}
        placeholder="Variant Description"
      />
      
      <select
        value={formData.variant_status}
        onChange={(e) => setFormData({...formData, variant_status: e.target.value})}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
        <option value="created">Created</option>
        <option value="rejected">Rejected</option>
      </select>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      
      <textarea
        value={formData.change_logs}
        onChange={(e) => setFormData({...formData, change_logs: e.target.value})}
        placeholder="Change notes (optional)"
      />
      
      <button type="submit">Update Variant</button>
    </form>
  );
};
```

---

## Complete Request Body Examples

### Example 1: Basic Update
```json
{
  "variant_name": "2.5L Premium Edition",
  "variant_status": "active",
  "updated_by": "66f4a1b2c3d4e5f6a7b8c9d0",
  "change_logs": "Renamed variant to match new branding"
}
```

### Example 2: Complete Update
```json
{
  "variant_name": "3.0L Sport Plus",
  "variant_code": "VAR_3.0_SPORT_PLUS",
  "variant_Description": "High-performance sport variant with turbo engine, sport suspension, and premium interior",
  "variant_status": "active",
  "model": "66f4a1b2c3d4e5f6a7b8c9d1",
  "Year": [
    "66f4a1b2c3d4e5f6a7b8c9d2",
    "66f4a1b2c3d4e5f6a7b8c9d3",
    "66f4a1b2c3d4e5f6a7b8c9d4"
  ],
  "updated_by": "66f4a1b2c3d4e5f6a7b8c9d0",
  "change_logs": "Updated all variant details and added years 2022-2024"
}
```

### Example 3: Status Change Only
```json
{
  "variant_status": "inactive",
  "updated_by": "66f4a1b2c3d4e5f6a7b8c9d0",
  "change_logs": "Variant discontinued due to model update"
}
```

### Example 4: Update Years Only
```json
{
  "Year": [
    "66f4a1b2c3d4e5f6a7b8c9d2",
    "66f4a1b2c3d4e5f6a7b8c9d3"
  ],
  "updated_by": "66f4a1b2c3d4e5f6a7b8c9d0",
  "change_logs": "Updated applicable years for this variant"
}
```

---

## Important Notes

### 1. Duplicate Validation
The controller checks for duplicates when updating `variant_name` or `variant_code`:
- ✅ Will return 409 if trying to use an existing name/code
- ✅ Excludes the current variant from duplicate check
- ✅ Only validates if the field is being changed

### 2. Change Tracking
Every update creates a new entry in the `updated_by` array:
```javascript
{
  updated_by: [
    {
      updated_by: "user_id",
      updated_at: "2025-10-14T11:00:00.000Z",
      change_logs: "Updated variant description"
    },
    // ... previous updates
  ]
}
```

### 3. Optional Fields
All fields except `updated_by` are optional. You can update just one field or all fields.

### 4. Image Upload
- Use `multipart/form-data` when uploading image
- Field name for image: `file`
- Supported formats: Check S3Helper configuration

### 5. Array Fields
`Year` is an array of ObjectIds. Send as:
- **JSON**: `["id1", "id2", "id3"]`
- **FormData**: Multiple `Year[]` fields

---

## Validation Rules

### variant_name
- ✅ Must be unique across all variants
- ✅ Cannot be empty if provided
- ✅ Checked against other variants (excluding current)

### variant_code
- ✅ Must be unique across all variants
- ✅ Cannot be empty if provided
- ✅ Checked against other variants (excluding current)

### variant_status
- ✅ Must be one of: "active", "inactive", "pending", "created", "rejected"
- ✅ Validated by schema

### model
- ✅ Must be a valid MongoDB ObjectId
- ✅ Must reference an existing Model document

### Year
- ✅ Must be an array of valid MongoDB ObjectIds
- ✅ Each ID should reference an existing Year document

---

## Common Errors

### 1. Missing updated_by
```json
{
  "message": "updated_by is required"
}
```

### 2. Duplicate variant_name
```json
{
  "success": false,
  "message": "Variant with name \"2.5L Premium\" already exists"
}
```

### 3. Duplicate variant_code
```json
{
  "success": false,
  "message": "Variant with code \"VAR_2.5L_PREM\" already exists"
}
```

### 4. Invalid variant_status
```json
{
  "success": false,
  "message": "Validation error: variant_status must be one of: active, inactive, pending, created, rejected"
}
```

### 5. Variant not found
```json
{
  "success": false,
  "message": "Variant not found"
}
```

---

## Tips

### 1. Only Send Changed Fields
For better performance, only send fields that actually changed:
```javascript
const updateData = {
  updated_by: userId,
  change_logs: 'Updated status'
};

if (newStatus !== oldStatus) {
  updateData.variant_status = newStatus;
}

// Send only necessary fields
await updateVariant(variantId, updateData);
```

### 2. Always Include Change Logs
Helps track why changes were made:
```javascript
{
  "variant_status": "inactive",
  "updated_by": "user_id",
  "change_logs": "Deactivated due to product discontinuation"  // ✅ Good
}
```

### 3. Validate on Frontend First
Check for duplicates, formats, etc. before sending request.

### 4. Handle All Status Codes
```javascript
if (response.status === 409) {
  // Duplicate
} else if (response.status === 404) {
  // Not found
} else if (response.status === 200) {
  // Success
}
```

---

## Quick Copy-Paste Templates

### Template 1: Update Name & Description
```json
{
  "variant_name": "Your Variant Name",
  "variant_Description": "Your variant description",
  "updated_by": "YOUR_USER_ID",
  "change_logs": "Updated name and description"
}
```

### Template 2: Change Status
```json
{
  "variant_status": "inactive",
  "updated_by": "YOUR_USER_ID",
  "change_logs": "Status changed to inactive"
}
```

### Template 3: Update All Fields
```json
{
  "variant_name": "Your Variant Name",
  "variant_code": "YOUR_CODE",
  "variant_Description": "Your description",
  "variant_status": "active",
  "model": "MODEL_OBJECT_ID",
  "Year": ["YEAR_ID_1", "YEAR_ID_2"],
  "updated_by": "YOUR_USER_ID",
  "change_logs": "Complete variant update"
}
```

---

## Summary

**Endpoint**: `PUT /api/variants/:id`  
**Method**: PUT  
**Auth**: Required (Super-admin, Fulfillment-Admin)  
**Content-Type**: `application/json` or `multipart/form-data` (with image)  

**Required Field**: `updated_by`  
**Optional Fields**: All others  

**Supports**:
- ✅ Partial updates (only changed fields)
- ✅ Complete updates (all fields)
- ✅ Image upload
- ✅ Duplicate validation
- ✅ Change tracking

Use the examples above based on your specific update needs!
