# Enhanced Dealer Endpoints with SLA Information Documentation

## Overview

The dealer endpoints in the user service have been enhanced to include comprehensive SLA (Service Level Agreement) information along with assigned TopRise employee details. This provides complete visibility into dealer performance, SLA compliance, and employee assignments.

## Enhanced Endpoints

### 1. Get Dealer By ID with SLA Information

**Endpoint:** `GET /api/users/dealer/:id`

**Description:** Retrieves a specific dealer with complete assigned TopRise employee information and SLA details.

**Authentication:** Required (Bearer token)

**Authorization:** Super-admin, Fulfillment-Admin

**Query Parameters:**
- `includeSLAInfo` (optional): Include SLA information (true/false, default: false)

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
        "is_active": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      },
      "recent_violations_count": 2
    },
    "sla_type_details": {
      "_id": "sla-type-id",
      "name": "Standard",
      "description": "Standard SLA for regular orders",
      "expected_hours": 24,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "sla_configuration": {
      "dealer_id": "dealer-uuid-123",
      "sla_type": "sla-type-id",
      "dispatch_hours": {
        "start": 9,
        "end": 18
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
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
      },
      {
        "dealer_id": "dealer-mongodb-id",
        "order_id": "ORD-123457",
        "expected_fulfillment_time": "2024-01-14T14:00:00.000Z",
        "actual_fulfillment_time": "2024-01-14T16:45:00.000Z",
        "violation_minutes": 165,
        "resolved": true,
        "notes": "Resolved with customer compensation",
        "created_at": "2024-01-14T16:45:00.000Z"
      }
    ],
    "categories_allowed": ["Electronics", "Home Appliances"],
    "upload_access_enabled": true,
    "default_margin": 15,
    "onboarding_date": "2024-01-01T00:00:00.000Z",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Dealer fetched successfully"
}
```

### 2. Get All Dealers with SLA Information

**Endpoint:** `GET /api/users/dealers`

**Description:** Retrieves all dealers with complete assigned TopRise employee information and SLA details.

**Authentication:** Required (Bearer token)

**Authorization:** Super-admin, Fulfillment-Admin

**Query Parameters:**
- `includeSLAInfo` (optional): Include SLA information (true/false, default: false)

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
      "SLA_type": "1",
      "dispatch_hours": {
        "start": 9,
        "end": 18
      },
      "SLA_max_dispatch_time": 24,
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
            "email": "jane.smith@toprise.com",
            "role": "Sales Executive",
            "user_details": {
              "_id": "employee-user-id",
              "email": "jane.smith@toprise.com",
              "username": "jane.smith",
              "role": "employee"
            }
          }
        }
      ],
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
          "created_at": "2024-01-15T12:30:00.000Z"
        }
      ]
    }
    // ... more dealers
  ],
  "message": "Dealers fetched successfully"
}
```

## SLA Data Structure

### SLA Summary
The `sla_summary` field provides a consolidated view of all SLA-related information:

```json
{
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
  }
}
```

### SLA Type Details
Complete information about the SLA type assigned to the dealer:

```json
{
  "sla_type_details": {
    "_id": "sla-type-id",
    "name": "Standard",
    "description": "Standard SLA for regular orders",
    "expected_hours": 24,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### SLA Configuration
Dealer-specific SLA configuration from the order service:

```json
{
  "sla_configuration": {
    "dealer_id": "dealer-uuid-123",
    "sla_type": "sla-type-id",
    "dispatch_hours": {
      "start": 9,
      "end": 18
    },
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Recent SLA Violations
Array of recent SLA violations for the dealer:

```json
{
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
```

## Implementation Details

### Helper Functions

#### fetchSLATypeInfo(slaTypeId, authorizationHeader)
Fetches SLA type information from the order service.

#### fetchDealerSLAConfig(dealerId, authorizationHeader)
Fetches dealer-specific SLA configuration from the order service.

#### fetchDealerSLAViolations(dealerId, authorizationHeader, limit)
Fetches recent SLA violations for a dealer from the order service.

### Inter-Service Communication

The enhanced endpoints communicate with the order service to fetch SLA information:

```javascript
// Fetch SLA type information
const slaTypeInfo = await fetchSLATypeInfo(transformedDealer.SLA_type, authorizationHeader);

// Fetch dealer SLA configuration
const dealerSLAConfig = await fetchDealerSLAConfig(transformedDealer.dealerId, authorizationHeader);

// Fetch recent SLA violations
const slaViolations = await fetchDealerSLAViolations(transformedDealer.dealerId, authorizationHeader, 5);
```

### Error Handling

The implementation includes robust error handling:

1. **Graceful Degradation**: If SLA information cannot be fetched, the endpoint continues to work
2. **Service Unavailable**: Continues operation even if order service is temporarily unavailable
3. **Timeout Protection**: Includes timeout protection for external service calls
4. **Logging**: Proper error logging and warnings for debugging

### Performance Optimizations

1. **Conditional Loading**: SLA information is only fetched when requested
2. **Parallel Processing**: Multiple SLA requests are processed in parallel for getAllDealers
3. **Limited Data**: Recent violations are limited to prevent large responses
4. **Caching Ready**: Code includes commented caching logic for future implementation

## Usage Examples

### Basic Usage
```bash
# Get dealer without SLA information
GET /api/users/dealer/64f1a2b3c4d5e6f7g8h9i0j1
Authorization: Bearer <your-jwt-token>

# Get dealer with SLA information
GET /api/users/dealer/64f1a2b3c4d5e6f7g8h9i0j1?includeSLAInfo=true
Authorization: Bearer <your-jwt-token>

# Get all dealers with SLA information
GET /api/users/dealers?includeSLAInfo=true
Authorization: Bearer <your-jwt-token>
```

### Frontend Integration
```javascript
// Fetch dealer with SLA information
const fetchDealerWithSLA = async (dealerId) => {
  try {
    const response = await fetch(`/api/users/dealer/${dealerId}?includeSLAInfo=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const dealer = data.data;
      
      // Access SLA information
      if (dealer.sla_summary) {
        console.log(`SLA Type: ${dealer.sla_summary.sla_type_details?.name}`);
        console.log(`Expected Hours: ${dealer.sla_summary.sla_type_details?.expected_hours}`);
        console.log(`Recent Violations: ${dealer.sla_summary.recent_violations_count}`);
      }
      
      // Access employee information
      dealer.assigned_Toprise_employee.forEach(assignment => {
        if (assignment.employee_details) {
          console.log(`Employee: ${assignment.employee_details.First_name}`);
          console.log(`Role: ${assignment.employee_details.role}`);
        }
      });
      
      // Access SLA violations
      if (dealer.recent_sla_violations) {
        dealer.recent_sla_violations.forEach(violation => {
          console.log(`Order ${violation.order_id}: ${violation.violation_minutes} minutes late`);
        });
      }
    }
  } catch (error) {
    console.error('Error fetching dealer with SLA:', error);
  }
};
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

4. **SLA Service Unavailable**
   ```json
   {
     "success": true,
     "data": {
       "dealerId": "dealer-uuid-123",
       "legal_name": "ABC Trading Company",
       // ... dealer data without SLA information
       // SLA fields will be missing or null
     }
   }
   ```

## Testing

Use the provided test script to verify functionality:
```bash
node test-enhanced-dealer-endpoints-with-sla.js
```

## Dependencies

- **Order Service**: Must be accessible at `http://order-service:5002`
- **Authentication**: Requires valid JWT tokens
- **MongoDB**: For dealer, employee, and user data
- **Axios**: For inter-service communication

## Migration Notes

### Backward Compatibility

- Existing API consumers will continue to work
- New SLA fields are additive and optional
- Original dealer fields are preserved
- No breaking changes to existing functionality

### Frontend Updates

Update frontend code to use the new SLA structure:

```javascript
// Check if SLA information is available
if (dealer.sla_summary) {
  const slaType = dealer.sla_summary.sla_type_details?.name;
  const violations = dealer.sla_summary.recent_violations_count;
  const isActive = dealer.sla_summary.sla_configuration?.is_active;
}

// Access employee information
dealer.assigned_Toprise_employee.forEach(assignment => {
  const employee = assignment.employee_details;
  if (employee) {
    console.log(`${employee.First_name} (${employee.employee_id})`);
  }
});
```

## Future Enhancements

1. **Caching Implementation**: Enable Redis caching for SLA data
2. **Real-time Updates**: WebSocket support for live SLA violation updates
3. **SLA Analytics**: Advanced SLA performance analytics
4. **Violation Alerts**: Automated alerts for SLA violations
5. **Performance Metrics**: SLA compliance rate calculations
6. **Historical Data**: Extended SLA violation history
7. **Dashboard Integration**: Real-time SLA dashboard updates
