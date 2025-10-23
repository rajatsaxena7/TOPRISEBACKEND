# Bulk Permission Operations Documentation

## Overview
The permission management endpoints have been enhanced to support bulk operations while maintaining backward compatibility. Both `updateUserPermission` and `removeUserPermission` endpoints now accept multiple `userIds` in addition to the existing single `userId` parameter.

## Enhanced Endpoints

### 1. **Update User Permissions**
- **URL**: `PUT /api/permissions/update`
- **Authentication**: Required
- **Role**: Super-admin
- **Description**: Update permissions for multiple users at once

### 2. **Remove User Permissions**
- **URL**: `DELETE /api/permissions/remove`
- **Authentication**: Required
- **Role**: Super-admin
- **Description**: Remove permissions for multiple users at once

## API Request/Response Formats

### **Update User Permissions**

#### **Request Body (Multiple Users)**
```json
{
  "module": "UserManagement",
  "role": "Admin",
  "userIds": ["user1", "user2", "user3"],
  "permissions": {
    "read": true,
    "write": false,
    "update": true,
    "delete": false,
    "allowedFields": ["name", "email", "phone"]
  },
  "updatedBy": "admin-user-id"
}
```

#### **Request Body (Single User - Backward Compatibility)**
```json
{
  "module": "UserManagement",
  "role": "Admin",
  "userId": "user1",
  "permissions": {
    "read": true,
    "write": false,
    "update": true,
    "delete": false,
    "allowedFields": ["name", "email", "phone"]
  },
  "updatedBy": "admin-user-id"
}
```

#### **Success Response (200)**
```json
{
  "message": "User permissions updated for 3 user(s)",
  "data": {
    "_id": "module-id",
    "module": "UserManagement",
    "AccessPermissions": [
      {
        "role": "Admin",
        "permissions": [
          {
            "userId": "user1",
            "read": true,
            "write": false,
            "update": true,
            "delete": false,
            "allowedFields": ["name", "email", "phone"]
          }
        ]
      }
    ],
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "updatedBy": "admin-user-id"
  },
  "results": [
    {
      "userId": "user1",
      "status": "updated",
      "permissions": {
        "read": true,
        "write": false,
        "update": true,
        "delete": false,
        "allowedFields": ["name", "email", "phone"]
      }
    },
    {
      "userId": "user2",
      "status": "updated",
      "permissions": {
        "read": true,
        "write": false,
        "update": true,
        "delete": false,
        "allowedFields": ["name", "email", "phone"]
      }
    }
  ],
  "errors": [],
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  }
}
```

#### **Partial Success Response (207)**
```json
{
  "message": "User permissions updated for 2 user(s)",
  "data": {
    "_id": "module-id",
    "module": "UserManagement",
    "AccessPermissions": [...]
  },
  "results": [
    {
      "userId": "user1",
      "status": "updated",
      "permissions": {...}
    },
    {
      "userId": "user2",
      "status": "updated",
      "permissions": {...}
    }
  ],
  "errors": [
    {
      "userId": "user3",
      "error": "User permission not found for this role in the module"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

### **Remove User Permissions**

#### **Request Body (Multiple Users)**
```json
{
  "module": "UserManagement",
  "role": "Admin",
  "userIds": ["user1", "user2", "user3"],
  "updatedBy": "admin-user-id"
}
```

#### **Request Body (Single User - Backward Compatibility)**
```json
{
  "module": "UserManagement",
  "role": "Admin",
  "userId": "user1",
  "updatedBy": "admin-user-id"
}
```

#### **Success Response (200)**
```json
{
  "message": "User permissions removed for 3 user(s)",
  "data": {
    "_id": "module-id",
    "module": "UserManagement",
    "AccessPermissions": [...],
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "updatedBy": "admin-user-id"
  },
  "results": [
    {
      "userId": "user1",
      "status": "removed",
      "removedPermission": {
        "userId": "user1",
        "read": true,
        "write": false,
        "update": true,
        "delete": false,
        "allowedFields": ["name", "email", "phone"]
      }
    }
  ],
  "errors": [],
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  }
}
```

## Backward Compatibility

### **Single User Operations**
The endpoints maintain full backward compatibility with existing single-user operations:

```javascript
// This still works exactly as before
const response = await fetch('/api/permissions/update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    module: 'UserManagement',
    role: 'Admin',
    userId: 'single-user-id',  // Single user
    permissions: {
      read: true,
      write: false
    },
    updatedBy: 'admin-user-id'
  })
});
```

### **Mixed Input Handling**
When both `userId` and `userIds` are provided, the system prioritizes `userIds`:

```javascript
// userIds takes precedence over userId
{
  "module": "UserManagement",
  "role": "Admin",
  "userId": "single-user",      // Ignored
  "userIds": ["user1", "user2"], // Used
  "permissions": {...}
}
```

## Error Handling

### **HTTP Status Codes**
- **200**: All operations successful
- **207**: Partial success (some users processed, some failed)
- **400**: Bad request (missing required fields, empty userIds array)
- **404**: Module or role not found
- **500**: Server error

### **Error Response Format**
```json
{
  "message": "Module, role and userId/userIds are required",
  "success": false
}
```

### **Validation Errors**
```json
{
  "message": "Module, role, userId/userIds and permissions are required",
  "success": false
}
```

## Frontend Integration Examples

### **JavaScript/React Example**

```javascript
// Bulk update permissions
async function updateBulkPermissions(userIds, permissions) {
  try {
    const response = await fetch('/api/permissions/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        module: 'UserManagement',
        role: 'Admin',
        userIds: userIds, // Array of user IDs
        permissions: permissions,
        updatedBy: getCurrentUserId()
      })
    });

    const result = await response.json();
    
    if (response.status === 200) {
      console.log('All permissions updated successfully');
      return result;
    } else if (response.status === 207) {
      console.log('Partial success:', result.summary);
      // Handle partial success
      result.errors.forEach(error => {
        console.error(`Failed for user ${error.userId}: ${error.error}`);
      });
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to update permissions:', error);
    throw error;
  }
}

// Usage
const userIds = ['user1', 'user2', 'user3'];
const permissions = {
  read: true,
  write: false,
  update: true,
  delete: false,
  allowedFields: ['name', 'email']
};

updateBulkPermissions(userIds, permissions)
  .then(result => {
    console.log(`Updated ${result.summary.successful} users successfully`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### **React Component Example**

```jsx
import React, { useState } from 'react';

const BulkPermissionManager = () => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permissions, setPermissions] = useState({
    read: false,
    write: false,
    update: false,
    delete: false,
    allowedFields: []
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleBulkUpdate = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/permissions/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module: 'UserManagement',
          role: 'Admin',
          userIds: selectedUsers,
          permissions: permissions,
          updatedBy: getCurrentUserId()
        })
      });

      const data = await response.json();
      setResult(data);
      
      if (response.status === 200) {
        alert('All permissions updated successfully!');
      } else if (response.status === 207) {
        alert(`Partial success: ${data.summary.successful}/${data.summary.total} users updated`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    if (!confirm(`Are you sure you want to remove permissions for ${selectedUsers.length} users?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/permissions/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module: 'UserManagement',
          role: 'Admin',
          userIds: selectedUsers,
          updatedBy: getCurrentUserId()
        })
      });

      const data = await response.json();
      setResult(data);
      
      if (response.status === 200) {
        alert('All permissions removed successfully!');
      } else if (response.status === 207) {
        alert(`Partial success: ${data.summary.successful}/${data.summary.total} users processed`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to remove permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-permission-manager">
      <h2>Bulk Permission Management</h2>
      
      <div className="user-selection">
        <h3>Select Users:</h3>
        {/* User selection UI */}
        <div className="user-list">
          {availableUsers.map(user => (
            <label key={user.id}>
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers([...selectedUsers, user.id]);
                  } else {
                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                  }
                }}
              />
              {user.name} ({user.email})
            </label>
          ))}
        </div>
      </div>

      <div className="permissions-config">
        <h3>Permissions:</h3>
        <div className="permission-checkboxes">
          <label>
            <input
              type="checkbox"
              checked={permissions.read}
              onChange={(e) => setPermissions({...permissions, read: e.target.checked})}
            />
            Read
          </label>
          <label>
            <input
              type="checkbox"
              checked={permissions.write}
              onChange={(e) => setPermissions({...permissions, write: e.target.checked})}
            />
            Write
          </label>
          <label>
            <input
              type="checkbox"
              checked={permissions.update}
              onChange={(e) => setPermissions({...permissions, update: e.target.checked})}
            />
            Update
          </label>
          <label>
            <input
              type="checkbox"
              checked={permissions.delete}
              onChange={(e) => setPermissions({...permissions, delete: e.target.checked})}
            />
            Delete
          </label>
        </div>
      </div>

      <div className="actions">
        <button
          onClick={handleBulkUpdate}
          disabled={loading || selectedUsers.length === 0}
        >
          {loading ? 'Updating...' : 'Update Permissions'}
        </button>
        
        <button
          onClick={handleBulkRemove}
          disabled={loading || selectedUsers.length === 0}
          className="danger"
        >
          {loading ? 'Removing...' : 'Remove Permissions'}
        </button>
      </div>

      {result && (
        <div className="result-summary">
          <h3>Operation Result:</h3>
          <p>Total: {result.summary.total}</p>
          <p>Successful: {result.summary.successful}</p>
          <p>Failed: {result.summary.failed}</p>
          
          {result.errors.length > 0 && (
            <div className="errors">
              <h4>Errors:</h4>
              {result.errors.map((error, index) => (
                <p key={index}>User {error.userId}: {error.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkPermissionManager;
```

## Performance Considerations

### **Batch Size Recommendations**
- **Small batches (1-10 users)**: Optimal for real-time operations
- **Medium batches (10-50 users)**: Good for administrative tasks
- **Large batches (50+ users)**: Consider pagination or background processing

### **Database Impact**
- Single database transaction per operation
- Efficient bulk updates using MongoDB operations
- Minimal memory overhead for large user lists

### **Error Handling Strategy**
- Continue processing even if some users fail
- Return detailed error information for each failed user
- Use 207 status code for partial success scenarios

## Testing

### **Test Scenarios**
1. **Single User Operations** (backward compatibility)
2. **Multiple User Operations** (bulk functionality)
3. **Mixed Input Scenarios** (both userId and userIds provided)
4. **Error Scenarios** (invalid users, missing permissions)
5. **Partial Success Scenarios** (some users succeed, some fail)
6. **Empty Input Scenarios** (empty userIds array)

### **Test Script**
Use the provided test script: `node test-bulk-permission-operations.js`

## Migration Guide

### **For Existing Applications**
No changes required for existing single-user operations. The API maintains full backward compatibility.

### **For New Bulk Operations**
1. Replace single `userId` with `userIds` array
2. Handle 207 status codes for partial success
3. Process `results` and `errors` arrays in responses
4. Use `summary` object for operation statistics

## Security Considerations

### **Authorization**
- Only Super-admin role can perform bulk operations
- All operations are logged with `updatedBy` field
- Audit trail maintained for all permission changes

### **Input Validation**
- Validate all userIds before processing
- Sanitize permission data
- Check module and role existence

## Monitoring and Logging

### **Success Logs**
```
✅ User permissions updated for 3 user(s)
✅ User permissions removed for 2 user(s)
```

### **Error Logs**
```
❌ Error updating user permission: {error.message}
❌ Error removing user permission: {error.message}
```

### **Audit Trail**
- All operations logged with timestamp
- User who performed the operation tracked
- Detailed results and errors logged

## Summary

The bulk permission operations enhancement provides:

- ✅ **Bulk Operations**: Support for multiple users in single request
- ✅ **Backward Compatibility**: Existing single-user operations unchanged
- ✅ **Error Handling**: Comprehensive error reporting per user
- ✅ **Partial Success**: 207 status code for mixed results
- ✅ **Performance**: Efficient database operations
- ✅ **Security**: Proper authorization and validation
- ✅ **Monitoring**: Detailed logging and audit trails

This enhancement significantly improves the efficiency of permission management while maintaining full backward compatibility with existing implementations.
