# Dealers By Category Name Endpoint Documentation

## Overview

The `getDealersByCategoryName` endpoint allows you to retrieve all dealers that are assigned to a specific category by using the category name instead of category ID. This endpoint provides comprehensive dealer information including employee assignments and SLA details.

## Endpoint Details

### Route
```
GET /api/users/get/dealerByCategoryName/:categoryName
```

### Description
Retrieves all active dealers that have the specified category name in their `categories_allowed` array.

### Authentication
- **Required**: Yes (Bearer token)
- **Authorization**: Multiple roles supported
  - Super-admin
  - Fulfillment-Admin
  - Inventory-Admin
  - Dealer
  - User
  - Customer-Support

### Parameters

#### Path Parameters
- `categoryName` (required): The name of the category to search for

#### Query Parameters
- `includeEmployeeInfo` (optional): Include assigned TopRise employee information (true/false, default: false)
- `includeSLAInfo` (optional): Include SLA information and violations (true/false, default: false)

## Usage Examples

### Basic Usage
```bash
# Get dealers for Electronics category
GET /api/users/get/dealerByCategoryName/Electronics
Authorization: Bearer <your-jwt-token>

# Get dealers for Home Appliances category
GET /api/users/get/dealerByCategoryName/Home%20Appliances
Authorization: Bearer <your-jwt-token>
```

### With Employee Information
```bash
# Get dealers with assigned employee details
GET /api/users/get/dealerByCategoryName/Electronics?includeEmployeeInfo=true
Authorization: Bearer <your-jwt-token>
```

### With SLA Information
```bash
# Get dealers with SLA details and violations
GET /api/users/get/dealerByCategoryName/Electronics?includeSLAInfo=true
Authorization: Bearer <your-jwt-token>
```

### Combined Information
```bash
# Get dealers with both employee and SLA information
GET /api/users/get/dealerByCategoryName/Electronics?includeEmployeeInfo=true&includeSLAInfo=true
Authorization: Bearer <your-jwt-token>
```

## Response Structure

### Basic Response
```json
{
  "success": true,
  "data": {
    "category_name": "Electronics",
    "total_dealers": 5,
    "dealers": [
      {
        "_id": "dealer-mongodb-id",
        "dealerId": "dealer-uuid-123",
        "legal_name": "ABC Trading Company Pvt Ltd",
        "trade_name": "ABC Traders",
        "GSTIN": "29ABCDE1234F1Z5",
        "Pan": "ABCDE1234F",
        "categories_allowed": ["Electronics", "Home Appliances"],
        "SLA_type": "1",
        "dispatch_hours": {
          "start": 9,
          "end": 18
        },
        "SLA_max_dispatch_time": 24,
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
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "filters": {
      "category_name": "Electronics",
      "include_employee_info": false,
      "include_sla_info": false
    }
  },
  "message": "Dealers for category 'Electronics' retrieved successfully"
}
```

### Response with Employee Information
When `includeEmployeeInfo=true` is used, the response includes:

```json
{
  "success": true,
  "data": {
    "category_name": "Electronics",
    "total_dealers": 5,
    "dealers": [
      {
        "_id": "dealer-mongodb-id",
        "dealerId": "dealer-uuid-123",
        "legal_name": "ABC Trading Company Pvt Ltd",
        "trade_name": "ABC Traders",
        "categories_allowed": ["Electronics", "Home Appliances"],
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
        ]
      }
    ],
    "filters": {
      "category_name": "Electronics",
      "include_employee_info": true,
      "include_sla_info": false
    }
  },
  "message": "Dealers for category 'Electronics' retrieved successfully"
}
```

### Response with SLA Information
When `includeSLAInfo=true` is used, the response includes:

```json
{
  "success": true,
  "data": {
    "category_name": "Electronics",
    "total_dealers": 5,
    "dealers": [
      {
        "_id": "dealer-mongodb-id",
        "dealerId": "dealer-uuid-123",
        "legal_name": "ABC Trading Company Pvt Ltd",
        "trade_name": "ABC Traders",
        "categories_allowed": ["Electronics", "Home Appliances"],
        "SLA_type": "1",
        "dispatch_hours": {
          "start": 9,
          "end": 18
        },
        "SLA_max_dispatch_time": 24,
        "sla_summary": {
          "sla_type": "1",
          "sla_type_details": {
            "_id": "sla-type-id",
            "name": "Standard",
            "description": "Standard SLA for regular orders",
            "expected_hours": 24
          },
          "dispatch_hours": {
            "start": 9,
            "end": 18
          },
          "sla_max_dispatch_time": 24,
          "sla_configuration": {
            "dealer_id": "dealer-uuid-123",
            "sla_type": "sla-type-id",
            "dispatch_hours": {
              "start": 9,
              "end": 18
            },
            "is_active": true
          },
          "recent_violations_count": 2
        },
        "sla_type_details": {
          "_id": "sla-type-id",
          "name": "Standard",
          "description": "Standard SLA for regular orders",
          "expected_hours": 24
        },
        "sla_configuration": {
          "dealer_id": "dealer-uuid-123",
          "sla_type": "sla-type-id",
          "dispatch_hours": {
            "start": 9,
            "end": 18
          },
          "is_active": true
        },
        "recent_sla_violations": [
          {
            "dealer_id": "dealer-mongodb-id",
            "order_id": "ORD-123456",
            "expected_fulfillment_time": "2024-01-15T10:00:00.000Z",
            "actual_fulfillment_time": "2024-01-15T12:30:00.000Z",
            "violation_minutes": 150,
            "resolved": false,
            "notes": "Delayed due to inventory shortage",
            "created_at": "2024-01-15T12:30:00.000Z"
          }
        ]
      }
    ],
    "filters": {
      "category_name": "Electronics",
      "include_employee_info": false,
      "include_sla_info": true
    }
  },
  "message": "Dealers for category 'Electronics' retrieved successfully"
}
```

## Data Structure Details

### Response Fields

#### Top Level
- `category_name`: The category name that was searched for
- `total_dealers`: Total number of dealers found for the category
- `dealers`: Array of dealer objects
- `filters`: Object containing the applied filters

#### Dealer Object
- `_id`: MongoDB ObjectId of the dealer
- `dealerId`: Unique dealer identifier
- `legal_name`: Legal name of the dealer company
- `trade_name`: Trade name of the dealer company
- `GSTIN`: GST identification number
- `Pan`: PAN number
- `categories_allowed`: Array of category names the dealer is allowed to handle
- `SLA_type`: SLA type identifier
- `dispatch_hours`: Object containing start and end hours for dispatch
- `SLA_max_dispatch_time`: Maximum dispatch time in hours
- `Address`: Object containing dealer address information
- `contact_person`: Object containing contact person details
- `user_id`: Object containing user account information
- `is_active`: Boolean indicating if dealer is active
- `created_at`: Timestamp when dealer was created
- `updated_at`: Timestamp when dealer was last updated

#### Employee Details (when includeEmployeeInfo=true)
- `assigned_Toprise_employee`: Array of assigned employee objects
  - `assigned_user`: Employee MongoDB ObjectId
  - `assigned_at`: Timestamp when employee was assigned
  - `status`: Assignment status (Active, Removed, Updated)
  - `employee_details`: Complete employee information object
    - `_id`: Employee MongoDB ObjectId
    - `employee_id`: Unique employee identifier
    - `First_name`: Employee's first name
    - `profile_image`: URL to employee's profile image
    - `mobile_number`: Employee's mobile number
    - `email`: Employee's email address
    - `role`: Employee's role/position
    - `user_details`: Complete user account information

#### SLA Details (when includeSLAInfo=true)
- `sla_summary`: Consolidated SLA information
- `sla_type_details`: Complete SLA type information
- `sla_configuration`: Dealer-specific SLA configuration
- `recent_sla_violations`: Array of recent SLA violations

## Error Handling

### Common Error Scenarios

1. **Category Name Required**
   ```json
   {
     "success": false,
     "error": "Category name is required",
     "status": 400
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

4. **No Dealers Found**
   ```json
   {
     "success": true,
     "data": {
       "category_name": "NonExistentCategory",
       "total_dealers": 0,
       "dealers": [],
       "filters": {
         "category_name": "NonExistentCategory",
         "include_employee_info": false,
         "include_sla_info": false
       }
     },
     "message": "No dealers found for the specified category"
   }
   ```

## Implementation Details

### Database Query
The endpoint uses MongoDB's `$in` operator to find dealers that have the specified category name in their `categories_allowed` array:

```javascript
const dealers = await Dealer.find({
  is_active: true,
  categories_allowed: { $in: [categoryName] }
})
```

### Population Strategy
The endpoint uses MongoDB's `populate()` method to include related data:

```javascript
.populate("user_id", "email phone_Number role")
.populate({
  path: "assigned_Toprise_employee.assigned_user",
  model: "Employee",
  populate: {
    path: "user_id",
    model: "User",
    select: "email username phone_Number role",
  },
})
```

### Inter-Service Communication
When SLA information is requested, the endpoint communicates with the order service to fetch:
- SLA type details
- Dealer SLA configuration
- Recent SLA violations

## Performance Considerations

### Optimization Strategies
1. **Conditional Loading**: Employee and SLA information is only fetched when requested
2. **Parallel Processing**: Multiple SLA requests are processed in parallel
3. **Limited Data**: Recent violations are limited to prevent large responses
4. **Efficient Queries**: Uses MongoDB indexes for fast category lookups

### Caching
The endpoint includes commented caching logic for future implementation:

```javascript
// const cacheKey = `dealers:category:${categoryName}`;
// const cached = await redisClient.get(cacheKey);
// if (cached) {
//   return sendSuccess(res, JSON.parse(cached));
// }
```

## Frontend Integration

### JavaScript Example
```javascript
// Fetch dealers by category name
const fetchDealersByCategory = async (categoryName, includeEmployeeInfo = false, includeSLAInfo = false) => {
  try {
    const params = new URLSearchParams();
    if (includeEmployeeInfo) params.append('includeEmployeeInfo', 'true');
    if (includeSLAInfo) params.append('includeSLAInfo', 'true');
    
    const queryString = params.toString();
    const url = `/api/users/get/dealerByCategoryName/${encodeURIComponent(categoryName)}${queryString ? '?' + queryString : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const { category_name, total_dealers, dealers, filters } = data.data;
      
      console.log(`Found ${total_dealers} dealers for category: ${category_name}`);
      
      dealers.forEach(dealer => {
        console.log(`Dealer: ${dealer.legal_name}`);
        
        // Access employee information
        if (dealer.assigned_Toprise_employee) {
          dealer.assigned_Toprise_employee.forEach(assignment => {
            if (assignment.employee_details) {
              console.log(`  Employee: ${assignment.employee_details.First_name}`);
            }
          });
        }
        
        // Access SLA information
        if (dealer.sla_summary) {
          console.log(`  SLA Type: ${dealer.sla_summary.sla_type_details?.name}`);
          console.log(`  Recent Violations: ${dealer.sla_summary.recent_violations_count}`);
        }
      });
      
      return data.data;
    }
  } catch (error) {
    console.error('Error fetching dealers by category:', error);
  }
};

// Usage examples
fetchDealersByCategory('Electronics');
fetchDealersByCategory('Electronics', true, false); // With employee info
fetchDealersByCategory('Electronics', false, true); // With SLA info
fetchDealersByCategory('Electronics', true, true);  // With both
```

## Testing

Use the provided test script to verify functionality:
```bash
node test-dealers-by-category-name.js
```

## Comparison with Existing Endpoint

### getDealersByCategoryId vs getDealersByCategoryName

| Feature | getDealersByCategoryId | getDealersByCategoryName |
|---------|----------------------|-------------------------|
| Parameter | categoryId (ID) | categoryName (String) |
| Query | Exact match | Array contains match |
| Employee Info | Not available | Optional |
| SLA Info | Not available | Optional |
| Response Structure | Basic | Enhanced with metadata |
| Use Case | System integration | User-friendly interface |

## Migration Notes

### Backward Compatibility
- This is a new endpoint and doesn't affect existing functionality
- The existing `getDealersByCategoryId` endpoint remains unchanged
- Both endpoints can be used simultaneously

### Frontend Updates
Update frontend code to use the new endpoint:

```javascript
// Old way (still works)
const dealers = await fetchDealersByCategoryId('category-id-123');

// New way (recommended for user-facing features)
const dealers = await fetchDealersByCategoryName('Electronics', true, true);
```

## Future Enhancements

1. **Pagination**: Add pagination support for large result sets
2. **Search**: Add search functionality within category results
3. **Sorting**: Add sorting options (by name, performance, etc.)
4. **Filtering**: Add additional filters (region, status, etc.)
5. **Caching**: Implement Redis caching for frequently accessed categories
6. **Analytics**: Add category performance analytics
7. **Bulk Operations**: Support for multiple category queries
