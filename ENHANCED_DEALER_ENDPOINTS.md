# Enhanced Dealer Endpoints Documentation

## Overview

The dealer endpoints in the user service have been enhanced to include comprehensive information about assigned TopRise employees. This provides complete visibility into dealer-employee relationships and employee details.

## Enhanced Endpoints

### 1. Get Dealer By ID

**Endpoint:** `GET /api/users/dealer/:id`

**Description:** Retrieves a specific dealer with complete assigned TopRise employee information.

**Authentication:** Required (Bearer token)

**Authorization:** Super-admin, Fulfillment-Admin

**Enhanced Response:**
```json
{
  "success": true,
  "data": {
    "_id": "dealer-mongodb-id",
    "dealerId": "dealer-uuid-123",
    "legal_name": "ABC Trading Company Pvt Ltd",
    "trade_name": "ABC Traders",
    "GSTIN": "29ABCDE1234F1Z5",
    "Pan": "ABCDE1234F",
    "Address": {
      "street": "123 Business Street",
      "city": "Mumbai",
      "pincode": "400001",
      "state": "Maharashtra"
    },
    "contact_person": {
      "name": "John Doe",
      "email": "john@abctraders.com",
      "phone_number": "9876543210"
    },
    "user_id": {
      "_id": "user-mongodb-id",
      "email": "dealer@abctraders.com",
      "phone_Number": "9876543210",
      "role": "dealer"
    },
    "assigned_Toprise_employee": [
      {
        "assigned_user": "employee-mongodb-id",
        "assigned_at": "2024-01-15T10:30:00.000Z",
        "status": "Active",
        "employee_details": {
          "_id": "employee-mongodb-id",
          "employee_id": "EMP-001",
          "First_name": "Jane Smith",
          "profile_image": "https://example.com/profile.jpg",
          "mobile_number": "9876543211",
          "email": "jane.smith@toprise.com",
          "role": "Sales Executive",
          "user_details": {
            "_id": "employee-user-id",
            "email": "jane.smith@toprise.com",
            "username": "jane.smith",
            "phone_Number": "9876543211",
            "role": "employee"
          }
        }
      }
    ],
    "categories_allowed": ["Electronics", "Home Appliances"],
    "upload_access_enabled": true,
    "default_margin": 15,
    "SLA_type": "1",
    "onboarding_date": "2024-01-01T00:00:00.000Z",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Dealer fetched successfully"
}
```

### 2. Get All Dealers

**Endpoint:** `GET /api/users/dealers`

**Description:** Retrieves all dealers with complete assigned TopRise employee information.

**Authentication:** Required (Bearer token)

**Authorization:** Super-admin, Fulfillment-Admin

**Enhanced Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "dealer-mongodb-id-1",
      "dealerId": "dealer-uuid-123",
      "legal_name": "ABC Trading Company Pvt Ltd",
      "trade_name": "ABC Traders",
      // ... other dealer fields
      "assigned_Toprise_employee": [
        {
          "assigned_user": "employee-mongodb-id",
          "assigned_at": "2024-01-15T10:30:00.000Z",
          "status": "Active",
          "employee_details": {
            "_id": "employee-mongodb-id",
            "employee_id": "EMP-001",
            "First_name": "Jane Smith",
            "profile_image": "https://example.com/profile.jpg",
            "mobile_number": "9876543211",
            "email": "jane.smith@toprise.com",
            "role": "Sales Executive",
            "user_details": {
              "_id": "employee-user-id",
              "email": "jane.smith@toprise.com",
              "username": "jane.smith",
              "phone_Number": "9876543211",
              "role": "employee"
            }
          }
        }
      ]
    }
    // ... more dealers
  ],
  "message": "Dealers fetched successfully"
}
```

## Data Structure Enhancements

### Assigned TopRise Employee Structure

The `assigned_Toprise_employee` field now includes comprehensive employee information:

```json
{
  "assigned_Toprise_employee": [
    {
      "assigned_user": "employee-mongodb-id",
      "assigned_at": "2024-01-15T10:30:00.000Z",
      "status": "Active",
      "employee_details": {
        "_id": "employee-mongodb-id",
        "employee_id": "EMP-001",
        "First_name": "Employee Name",
        "profile_image": "profile-image-url",
        "mobile_number": "employee-mobile",
        "email": "employee@toprise.com",
        "role": "Employee Role",
        "user_details": {
          "_id": "employee-user-id",
          "email": "employee@toprise.com",
          "username": "employee-username",
          "phone_Number": "employee-phone",
          "role": "employee"
        }
      }
    }
  ]
}
```

### Employee Details Fields

- **`_id`**: MongoDB ObjectId of the employee record
- **`employee_id`**: Unique employee identifier
- **`First_name`**: Employee's first name
- **`profile_image`**: URL to employee's profile image
- **`mobile_number`**: Employee's mobile number
- **`email`**: Employee's email address
- **`role`**: Employee's role/position
- **`user_details`**: Complete user account information

### Assignment Metadata

- **`assigned_user`**: Reference to the employee record
- **`assigned_at`**: Timestamp when employee was assigned
- **`status`**: Assignment status (Active, Removed, Updated)

## Database Relationships

### Dealer Model
```javascript
assigned_Toprise_employee: [
  {
    assigned_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
    },
    assigned_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["Active", "Removed", "Updated"],
      default: "Active"
    }
  }
]
```

### Employee Model
```javascript
{
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  employee_id: {
    type: String,
    unique: true,
    required: true
  },
  First_name: {
    type: String,
    required: true
  },
  // ... other employee fields
}
```

### User Model
```javascript
{
  email: String,
  username: String,
  phone_Number: String,
  role: String
  // ... other user fields
}
```

## Implementation Details

### Population Strategy

The enhanced endpoints use MongoDB's `populate()` method with nested population:

```javascript
const dealer = await Dealer.findById(id)
  .populate("user_id", "email phone_Number role")
  .populate({
    path: "assigned_Toprise_employee.assigned_user",
    model: "Employee",
    populate: {
      path: "user_id",
      model: "User",
      select: "email username phone_Number role"
    }
  });
```

### Data Transformation

The response is transformed to provide a clean, structured format:

```javascript
const transformedDealer = dealer.toObject();

if (transformedDealer.assigned_Toprise_employee && transformedDealer.assigned_Toprise_employee.length > 0) {
  transformedDealer.assigned_Toprise_employee = transformedDealer.assigned_Toprise_employee.map(assignment => {
    if (assignment.assigned_user) {
      return {
        ...assignment,
        employee_details: {
          _id: assignment.assigned_user._id,
          employee_id: assignment.assigned_user.employee_id,
          First_name: assignment.assigned_user.First_name,
          profile_image: assignment.assigned_user.profile_image,
          mobile_number: assignment.assigned_user.mobile_number,
          email: assignment.assigned_user.email,
          role: assignment.assigned_user.role,
          user_details: assignment.assigned_user.user_id
        }
      };
    }
    return assignment;
  });
}
```

## Error Handling

### Common Error Scenarios

1. **Dealer Not Found**
   ```json
   {
     "success": false,
     "error": "Dealer not found",
     "status": 404
   }
   ```

2. **Authentication Required**
   ```json
   {
     "success": false,
     "error": "Authentication required",
     "status": 401
   }
   ```

3. **Insufficient Permissions**
   ```json
   {
     "success": false,
     "error": "Insufficient permissions",
     "status": 403
   }
   ```

### Graceful Degradation

- If employee data cannot be fetched, the endpoint continues to work
- Missing employee information is handled gracefully
- Empty `assigned_Toprise_employee` arrays are handled correctly

## Performance Considerations

### Optimization Strategies

1. **Selective Field Population**: Only necessary fields are populated
2. **Nested Population**: Efficient handling of multi-level relationships
3. **Data Transformation**: Clean, structured response format
4. **Error Handling**: Graceful handling of missing data

### Caching (Commented Out)

The endpoints include commented caching logic for future implementation:

```javascript
// const cacheKey = `dealers:${id}`;
// const cached = await redisClient.get(cacheKey);
// if (cached) {
//   return sendSuccess(res, JSON.parse(cached));
// }
```

## Usage Examples

### Basic Usage
```bash
# Get specific dealer with employee information
GET /api/users/dealer/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <your-jwt-token>

# Get all dealers with employee information
GET /api/users/dealers
Authorization: Bearer <your-jwt-token>
```

### Frontend Integration
```javascript
// Fetch dealer with employee information
const fetchDealer = async (dealerId) => {
  try {
    const response = await fetch(`/api/users/dealer/${dealerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const dealer = data.data;
      
      // Access employee information
      dealer.assigned_Toprise_employee.forEach(assignment => {
        if (assignment.employee_details) {
          console.log(`Employee: ${assignment.employee_details.First_name}`);
          console.log(`Role: ${assignment.employee_details.role}`);
          console.log(`Email: ${assignment.employee_details.email}`);
        }
      });
    }
  } catch (error) {
    console.error('Error fetching dealer:', error);
  }
};
```

## Testing

Use the provided test script to verify functionality:
```bash
node test-enhanced-dealer-endpoints.js
```

## Migration Notes

### Backward Compatibility

- Existing API consumers will continue to work
- New `employee_details` field is additive
- Original `assigned_user` field is preserved
- No breaking changes to existing functionality

### Frontend Updates

Update frontend code to use the new structure:

```javascript
// Old way (still works)
const employeeId = assignment.assigned_user;

// New way (recommended)
const employeeDetails = assignment.employee_details;
const employeeName = employeeDetails?.First_name;
const employeeEmail = employeeDetails?.email;
```

## Future Enhancements

1. **Caching Implementation**: Enable Redis caching for better performance
2. **Pagination**: Add pagination for large dealer lists
3. **Filtering**: Add filters for dealers with/without assigned employees
4. **Search**: Add search functionality for employee names
5. **Audit Logging**: Track changes to employee assignments
6. **Real-time Updates**: WebSocket support for live assignment updates
