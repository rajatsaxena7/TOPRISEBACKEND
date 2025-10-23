# Employee Role Revocation Documentation

## Overview
The employee role revocation system allows administrators to revoke and reactivate employee roles by only modifying the `active` field while preserving all other employee data. This ensures data integrity and provides a safe way to manage employee access without losing historical information.

## Database Schema Changes

### **Employee Model Enhancement**
Added `active` field to the Employee model:

```javascript
// services/user-service/src/models/employee.js
const employeeSchema = new mongoose.Schema({
  // ... existing fields ...
  active: {
    type: Boolean,
    default: true,
  },
});
```

## API Endpoints

### **1. Revoke Employee Role**
- **URL**: `PUT /api/employee/revoke-role`
- **Method**: `PUT`
- **Authentication**: Required
- **Authorization**: Super-admin, Fulfillment-Admin
- **Description**: Revokes an employee's role by setting `active` to `false`

### **2. Reactivate Employee Role**
- **URL**: `PUT /api/employee/reactivate-role`
- **Method**: `PUT`
- **Authentication**: Required
- **Authorization**: Super-admin, Fulfillment-Admin
- **Description**: Reactivates an employee's role by setting `active` to `true`

## Request/Response Formats

### **Revoke Employee Role**

#### **Request Body**
```json
{
  "employeeId": "employee-object-id",
  "updatedBy": "admin-user-id"
}
```

#### **Success Response (200)**
```json
{
  "success": true,
  "data": {
    "message": "Employee role revoked successfully",
    "employee": {
      "_id": "employee-object-id",
      "employee_id": "EMP001",
      "First_name": "John Doe",
      "email": "john.doe@company.com",
      "role": "Fulfillment-Staff",
      "active": false,
      "revoked_at": "2024-01-15T10:30:00.000Z",
      "revoked_by": "admin-user-id",
      "original_data": {
        "employee_id": "EMP001",
        "First_name": "John Doe",
        "email": "john.doe@company.com",
        "role": "Fulfillment-Staff",
        "assigned_dealers": ["dealer1", "dealer2"],
        "assigned_regions": ["North", "South"],
        "last_login": "2024-01-14T15:30:00.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    }
  },
  "message": "Role revoked successfully"
}
```

### **Reactivate Employee Role**

#### **Request Body**
```json
{
  "employeeId": "employee-object-id",
  "updatedBy": "admin-user-id"
}
```

#### **Success Response (200)**
```json
{
  "success": true,
  "data": {
    "message": "Employee role reactivated successfully",
    "employee": {
      "_id": "employee-object-id",
      "employee_id": "EMP001",
      "First_name": "John Doe",
      "email": "john.doe@company.com",
      "role": "Fulfillment-Staff",
      "active": true,
      "reactivated_at": "2024-01-15T11:00:00.000Z",
      "reactivated_by": "admin-user-id"
    }
  },
  "message": "Role reactivated successfully"
}
```

## Error Handling

### **Common Error Scenarios**

#### **Employee Not Found (404)**
```json
{
  "success": false,
  "message": "Employee not found"
}
```

#### **Already Revoked (400)**
```json
{
  "success": false,
  "message": "Employee role is already revoked"
}
```

#### **Already Active (400)**
```json
{
  "success": false,
  "message": "Employee role is already active"
}
```

#### **Missing Employee ID (400)**
```json
{
  "success": false,
  "message": "Employee ID is required"
}
```

#### **Authentication Error (401)**
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

#### **Authorization Error (403)**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

## Usage Examples

### **JavaScript/Node.js Example**
```javascript
async function revokeEmployeeRole(employeeId, adminUserId) {
  try {
    const response = await fetch('/api/employee/revoke-role', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        employeeId: employeeId,
        updatedBy: adminUserId
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Role revoked successfully:', result.data.employee);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to revoke role:', error);
    throw error;
  }
}

async function reactivateEmployeeRole(employeeId, adminUserId) {
  try {
    const response = await fetch('/api/employee/reactivate-role', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        employeeId: employeeId,
        updatedBy: adminUserId
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Role reactivated successfully:', result.data.employee);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to reactivate role:', error);
    throw error;
  }
}

// Usage
revokeEmployeeRole('employee-123', 'admin-456')
  .then(result => {
    console.log(`Employee ${result.data.employee.employee_id} role revoked`);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### **React Component Example**
```jsx
import React, { useState } from 'react';

const EmployeeRoleManager = ({ employee, onRoleChange }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRevokeRole = async () => {
    if (!confirm(`Are you sure you want to revoke ${employee.First_name}'s role?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/employee/revoke-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: employee._id,
          updatedBy: getCurrentUserId()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Role revoked successfully!');
        onRoleChange && onRoleChange({ ...employee, active: false });
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateRole = async () => {
    if (!confirm(`Are you sure you want to reactivate ${employee.First_name}'s role?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/employee/reactivate-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: employee._id,
          updatedBy: getCurrentUserId()
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('Role reactivated successfully!');
        onRoleChange && onRoleChange({ ...employee, active: true });
      } else {
        setMessage(`Error: ${result.message}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-role-manager">
      <h3>Employee Role Management</h3>
      
      <div className="employee-info">
        <p><strong>Name:</strong> {employee.First_name}</p>
        <p><strong>Employee ID:</strong> {employee.employee_id}</p>
        <p><strong>Email:</strong> {employee.email}</p>
        <p><strong>Role:</strong> {employee.role}</p>
        <p><strong>Status:</strong> 
          <span className={employee.active ? 'active' : 'inactive'}>
            {employee.active ? 'Active' : 'Inactive'}
          </span>
        </p>
      </div>

      <div className="actions">
        {employee.active ? (
          <button
            onClick={handleRevokeRole}
            disabled={loading}
            className="revoke-button"
          >
            {loading ? 'Revoking...' : 'Revoke Role'}
          </button>
        ) : (
          <button
            onClick={handleReactivateRole}
            disabled={loading}
            className="reactivate-button"
          >
            {loading ? 'Reactivating...' : 'Reactivate Role'}
          </button>
        )}
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default EmployeeRoleManager;
```

### **Axios Example**
```javascript
import axios from 'axios';

const employeeRoleService = {
  async revokeRole(employeeId, adminUserId) {
    try {
      const response = await axios.put('/api/employee/revoke-role', {
        employeeId,
        updatedBy: adminUserId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Network error occurred');
      }
    }
  },

  async reactivateRole(employeeId, adminUserId) {
    try {
      const response = await axios.put('/api/employee/reactivate-role', {
        employeeId,
        updatedBy: adminUserId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Network error occurred');
      }
    }
  }
};

// Usage
employeeRoleService.revokeRole('employee-123', 'admin-456')
  .then(result => {
    console.log('Role revoked:', result.data.employee);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

## Data Integrity Guarantees

### **What Changes During Revocation**
- **`active`**: Changes from `true` to `false`
- **`updated_at`**: Updated to current timestamp

### **What Remains Unchanged**
- **`employee_id`**: Preserved
- **`First_name`**: Preserved
- **`email`**: Preserved
- **`role`**: Preserved
- **`assigned_dealers`**: Preserved
- **`assigned_regions`**: Preserved
- **`last_login`**: Preserved
- **`created_at`**: Preserved
- **`profile_image`**: Preserved
- **`mobile_number`**: Preserved
- **`user_id`**: Preserved

### **Data Preservation Example**
```javascript
// Before revocation
{
  "_id": "employee-123",
  "employee_id": "EMP001",
  "First_name": "John Doe",
  "email": "john.doe@company.com",
  "role": "Fulfillment-Staff",
  "assigned_dealers": ["dealer1", "dealer2"],
  "assigned_regions": ["North", "South"],
  "active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-14T15:30:00.000Z"
}

// After revocation
{
  "_id": "employee-123",
  "employee_id": "EMP001",           // ✅ Preserved
  "First_name": "John Doe",          // ✅ Preserved
  "email": "john.doe@company.com",   // ✅ Preserved
  "role": "Fulfillment-Staff",       // ✅ Preserved
  "assigned_dealers": ["dealer1", "dealer2"], // ✅ Preserved
  "assigned_regions": ["North", "South"],     // ✅ Preserved
  "active": false,                   // 🔄 Changed
  "created_at": "2024-01-01T00:00:00.000Z",   // ✅ Preserved
  "updated_at": "2024-01-15T10:30:00.000Z"    // 🔄 Updated
}
```

## Security Features

### **Authentication & Authorization**
- **JWT Token Required**: Valid authentication token
- **Role-Based Access**: Only Super-admin and Fulfillment-Admin can revoke/reactivate roles
- **Audit Trail**: All operations logged with user information

### **Input Validation**
- **Employee ID**: Required, must be valid ObjectId
- **Updated By**: Required, must be valid admin user ID
- **Status Checks**: Prevents duplicate operations

### **Data Protection**
- **Minimal Changes**: Only `active` field is modified
- **Data Preservation**: All other employee data remains intact
- **Audit Information**: Complete tracking of who performed the action and when

## Monitoring and Logging

### **Success Logs**
```
✅ Employee role revoked for: EMP001 (John Doe)
✅ Employee role reactivated for: EMP001 (John Doe)
```

### **Error Logs**
```
❌ Revoke employee role error: Employee not found
❌ Reactivate employee role error: Employee role is already active
```

### **Audit Trail**
- **Revocation**: Logs who revoked the role and when
- **Reactivation**: Logs who reactivated the role and when
- **Original Data**: Preserves complete employee information for reference

## Testing

### **Test Scenarios**
1. **Successful Revocation**: Revoke active employee role
2. **Successful Reactivation**: Reactivate inactive employee role
3. **Already Revoked**: Attempt to revoke already revoked role
4. **Already Active**: Attempt to reactivate already active role
5. **Non-existent Employee**: Revoke/reactivate non-existent employee
6. **Missing Employee ID**: Revoke/reactivate without employee ID
7. **Authentication**: Revoke/reactivate without valid token
8. **Authorization**: Revoke/reactivate with insufficient permissions
9. **Data Integrity**: Verify only active field changes

### **Test Script**
Use the provided test script: `node test-employee-role-revocation.js`

### **Manual Testing Commands**
```bash
# Test role revocation
curl -X PUT http://localhost:5001/api/employee/revoke-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"employeeId": "employee-123", "updatedBy": "admin-456"}'

# Test role reactivation
curl -X PUT http://localhost:5001/api/employee/reactivate-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"employeeId": "employee-123", "updatedBy": "admin-456"}'
```

## Best Practices

### **Before Revocation**
1. **Verify Employee**: Confirm the employee exists and is active
2. **Check Dependencies**: Ensure no critical systems depend on the employee
3. **Notify Employee**: Inform the employee about the role revocation
4. **Backup Data**: Consider backing up employee data if needed

### **After Revocation**
1. **Verify Status**: Confirm the employee is marked as inactive
2. **Update Systems**: Update any systems that depend on employee status
3. **Monitor Access**: Ensure the employee cannot access restricted areas
4. **Document Reason**: Record the reason for revocation

### **For Reactivation**
1. **Verify Authorization**: Confirm the employee is authorized to return
2. **Check Systems**: Ensure all systems are ready for the employee's return
3. **Update Permissions**: Restore any necessary permissions
4. **Notify Employee**: Inform the employee about role reactivation

## Migration Considerations

### **Existing Data**
- **Default Value**: All existing employees will have `active: true` by default
- **No Data Loss**: No existing employee data will be lost
- **Backward Compatibility**: Existing queries will continue to work

### **New Queries**
```javascript
// Find active employees
const activeEmployees = await Employee.find({ active: true });

// Find inactive employees
const inactiveEmployees = await Employee.find({ active: false });

// Find all employees (active and inactive)
const allEmployees = await Employee.find({});

// Find employees by role and status
const activeFulfillmentStaff = await Employee.find({ 
  role: 'Fulfillment-Staff', 
  active: true 
});
```

## Summary

The employee role revocation system provides:

- ✅ **Safe Revocation**: Only `active` field is modified
- ✅ **Data Preservation**: All other employee data remains intact
- ✅ **Audit Trail**: Complete tracking of all operations
- ✅ **Security**: Proper authentication and authorization
- ✅ **Error Handling**: Comprehensive validation and error messages
- ✅ **Reversibility**: Roles can be reactivated when needed
- ✅ **Data Integrity**: No loss of historical information

This implementation ensures that employee role management is safe, reversible, and maintains complete data integrity while providing the necessary functionality to manage employee access.
