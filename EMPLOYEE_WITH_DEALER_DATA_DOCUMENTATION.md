# Employee Endpoint with Dealer Data Population

## Overview
The employee endpoint has been enhanced to populate comprehensive dealer data including category information, SLA details, and user information for all assigned dealers.

## Endpoint Details

### **GET** `/api/users/employee/get-by-id`

**Description**: Retrieve employee information with comprehensive dealer data and category details.

**Authentication**: Required (Bearer Token)

**Authorization**: 
- Super-admin
- Fulfillment-Admin
- Inventory-Admin

---

## Request Parameters

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `employee_id` | String | Yes | The unique employee ID |

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Employee fetched successfully",
  "data": {
    "_id": "68af0504c67857e01c33b3b3",
    "user_id": {
      "_id": "685e757a28f3782e4c05cadc",
      "email": "employee@example.com",
      "username": "john_doe",
      "phone_Number": "+1234567890",
      "role": "Employee"
    },
    "employee_id": "EMP001",
    "First_name": "John",
    "profile_image": "https://example.com/profile.jpg",
    "mobile_number": "+1234567890",
    "email": "john@example.com",
    "role": "Employee",
    "assigned_dealers": [
      {
        "_id": "685e43419c0131bc04cb7d4a",
        "dealerId": "DLR001",
        "legal_name": "ABC Motors Ltd",
        "trade_name": "ABC Motors",
        "GSTIN": "29ABCDE1234F1Z5",
        "Pan": "ABCDE1234F",
        "Address": {
          "street": "123 Main Street",
          "city": "Mumbai",
          "state": "Maharashtra",
          "pincode": "400001",
          "country": "India"
        },
        "categories_allowed": [
          "68622ecb7032551f8670f466",
          "686257ce77eacf91b4c616bd"
        ],
        "SLA_type": "Standard",
        "dispatch_hours": 24,
        "SLA_max_dispatch_time": 48,
        "user_details": {
          "_id": "685e757a28f3782e4c05cadc",
          "email": "dealer@example.com",
          "username": "dealer_user",
          "phone_Number": "+1234567890",
          "role": "Dealer"
        },
        "assigned_categories": [
          {
            "_id": "68622ecb7032551f8670f466",
            "category_name": "Automotive Parts",
            "category_code": "AUTO001",
            "category_Status": "Active",
            "main_category": true
          },
          {
            "_id": "686257ce77eacf91b4c616bd",
            "category_name": "Brake Components",
            "category_code": "BRAKE001",
            "category_Status": "Active",
            "main_category": false
          }
        ],
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-20T14:45:00.000Z"
      }
    ],
    "assigned_regions": ["Mumbai", "Pune"],
    "last_login": "2024-01-20T14:45:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "employee_id is required"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Employee with ID 'EMP001' not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

---

## Enhanced Features

### 1. Comprehensive Dealer Information
- **Basic Details**: Dealer ID, legal name, trade name
- **Business Information**: GSTIN, PAN number
- **Address**: Complete address details
- **SLA Configuration**: SLA type, dispatch hours, max dispatch time
- **User Details**: Associated user account information

### 2. Category Population
- **Categories Allowed**: Array of category IDs assigned to the dealer
- **Assigned Categories**: Detailed category information including:
  - Category name and code
  - Category status
  - Main category flag
  - Full category details fetched from product service

### 3. User Information
- **Employee User Details**: Associated user account for the employee
- **Dealer User Details**: Associated user account for each dealer

### 4. Error Handling
- **Graceful Fallbacks**: If category service is unavailable, returns category IDs with fallback messages
- **Comprehensive Logging**: Detailed logging for debugging and monitoring
- **Service Resilience**: Continues operation even if external services fail

---

## Usage Examples

### 1. Basic Employee Fetch
```bash
curl -X GET "http://localhost:5001/api/users/employee/get-by-id?employee_id=EMP001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. JavaScript/Node.js Example
```javascript
const axios = require('axios');

async function getEmployeeWithDealerData(employeeId, token) {
  try {
    const response = await axios.get(`http://localhost:5001/api/users/employee/get-by-id`, {
      params: {
        employee_id: employeeId
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const employee = response.data.data;
      
      console.log(`Employee: ${employee.First_name}`);
      console.log(`Assigned Dealers: ${employee.assigned_dealers.length}`);
      
      employee.assigned_dealers.forEach(dealer => {
        console.log(`Dealer: ${dealer.legal_name}`);
        console.log(`Categories: ${dealer.assigned_categories.length}`);
        dealer.assigned_categories.forEach(category => {
          console.log(`  - ${category.category_name} (${category.category_code})`);
        });
      });
      
      return employee;
    }
  } catch (error) {
    console.error('Error fetching employee:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const employee = await getEmployeeWithDealerData('EMP001', 'your-jwt-token');
```

### 3. React/Frontend Example
```javascript
import axios from 'axios';

const fetchEmployeeData = async (employeeId) => {
  try {
    const response = await axios.get('/api/users/employee/get-by-id', {
      params: { employee_id: employeeId },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.data.success) {
      const employee = response.data.data;
      
      // Display employee information
      setEmployeeInfo({
        name: employee.First_name,
        email: employee.email,
        role: employee.role,
        dealers: employee.assigned_dealers.map(dealer => ({
          id: dealer.dealerId,
          name: dealer.legal_name,
          tradeName: dealer.trade_name,
          categories: dealer.assigned_categories.map(cat => cat.category_name)
        }))
      });
    }
  } catch (error) {
    console.error('Failed to fetch employee data:', error);
  }
};
```

---

## Data Flow

### 1. Employee Data Retrieval
```
Employee Collection → Populate User Details → Populate Dealer Details
```

### 2. Dealer Data Enhancement
```
Dealer Collection → Populate User Details → Fetch Category Details
```

### 3. Category Data Population
```
Product Service → Bulk Category Fetch → Map Categories to Dealers
```

---

## Performance Considerations

### Caching
- Employee data can be cached for 5 minutes
- Category data is fetched in bulk to minimize API calls
- Dealer data is populated in a single query

### Optimization
- Uses MongoDB population for efficient data retrieval
- Bulk category fetching reduces external service calls
- Lean queries where possible to reduce memory usage

### Error Handling
- Graceful degradation if external services are unavailable
- Fallback data structures to maintain API consistency
- Comprehensive logging for debugging

---

## Security Features

### Authentication
- JWT token required for all requests
- Token validation on every request
- Automatic token expiration handling

### Authorization
- Role-based access control
- Only authorized roles can access employee data
- Audit logging for all access attempts

### Data Protection
- Sensitive information is properly handled
- User details are populated with limited fields
- Business information is appropriately exposed

---

## Monitoring and Logging

### Log Levels
- **INFO**: Successful operations and data flow
- **WARN**: Non-critical issues (e.g., category service unavailable)
- **ERROR**: Critical errors and failures

### Metrics Tracked
- Request count per employee
- Response times
- Error rates
- Category service availability
- Dealer data population success rate

---

## Testing

### Test Script
Use the provided test script `test-employee-with-dealer-data.js`:

```bash
node test-employee-with-dealer-data.js
```

### Test Coverage
- ✅ Basic employee fetching
- ✅ Dealer data population
- ✅ Category information retrieval
- ✅ User details population
- ✅ Error handling
- ✅ Performance testing
- ✅ Authentication testing

---

## Troubleshooting

### Common Issues

#### 1. Employee Not Found
- Verify the employee_id exists in the database
- Check if the employee_id format is correct
- Ensure the employee is not soft-deleted

#### 2. No Dealer Data
- Check if the employee has assigned dealers
- Verify dealer references in the database
- Check dealer collection for data integrity

#### 3. Category Data Missing
- Verify product service is running
- Check category service endpoint availability
- Review logs for category service errors

#### 4. Authentication Issues
- Verify JWT token is valid and not expired
- Check user permissions and roles
- Ensure proper authorization headers

### Debug Steps
1. Check application logs for detailed error information
2. Verify database connectivity and data integrity
3. Test external service endpoints (product service)
4. Validate JWT token and user permissions
5. Review network connectivity between services

---

## Changelog

### Version 2.0.0 (Current)
- Enhanced dealer data population
- Added category information retrieval
- Improved user details population
- Added comprehensive error handling
- Enhanced logging and monitoring
- Added performance optimizations

### Version 1.0.0 (Previous)
- Basic employee fetching
- Simple dealer population
- Basic error handling

---

## Related Endpoints

- `GET /api/users/dealer/:id` - Get dealer by ID with comprehensive data
- `GET /api/users/employee/stats` - Get employee statistics
- `GET /api/users/insights` - Get user insights and analytics
- `GET /api/categories/bulk-by-ids` - Bulk fetch category details

---

## Support

For technical support or questions about this endpoint:
- Check the application logs for detailed error information
- Verify authentication and authorization
- Ensure all required services are running
- Contact the development team for assistance
