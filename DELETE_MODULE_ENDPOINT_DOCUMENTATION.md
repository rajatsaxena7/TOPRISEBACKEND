# Delete Module Endpoint Documentation

## Overview
The delete module endpoint allows Super-admins to permanently remove permission modules from the system. This endpoint provides comprehensive deletion with detailed response information and proper error handling.

## API Endpoint

### **Delete Module**
- **URL**: `DELETE /api/modules`
- **Method**: `DELETE`
- **Authentication**: Required
- **Authorization**: Super-admin role required
- **Description**: Permanently delete a permission module and all its associated permissions

## Request Format

### **Request Body**
```json
{
  "module": "UserManagement",
  "updatedBy": "admin-user-id"
}
```

### **Request Headers**
```http
Authorization: Bearer your-auth-token
Content-Type: application/json
```

### **Required Fields**
- `module` (string): Name of the module to delete
- `updatedBy` (string): ID of the user performing the deletion

## Response Formats

### **Success Response (200)**
```json
{
  "message": "Module deleted successfully",
  "data": {
    "deletedModule": {
      "module": "UserManagement",
      "roles": ["Admin", "User", "Manager"],
      "totalPermissions": 15,
      "createdAt": "2024-01-10T08:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "deletedAt": "2024-01-15T12:00:00.000Z",
    "deletedBy": "admin-user-id"
  }
}
```

### **Error Responses**

#### **Module Not Found (404)**
```json
{
  "message": "Module not found"
}
```

#### **Missing Module Name (400)**
```json
{
  "message": "Module name is required"
}
```

#### **Authentication Error (401)**
```json
{
  "message": "Unauthorized access"
}
```

#### **Authorization Error (403)**
```json
{
  "message": "Insufficient permissions"
}
```

#### **Server Error (500)**
```json
{
  "message": "Server error",
  "error": "Detailed error message"
}
```

## Usage Examples

### **JavaScript/Node.js Example**
```javascript
async function deleteModule(moduleName, adminUserId) {
  try {
    const response = await fetch('/api/modules', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        module: moduleName,
        updatedBy: adminUserId
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Module deleted successfully:', result.data.deletedModule);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Failed to delete module:', error);
    throw error;
  }
}

// Usage
deleteModule('UserManagement', 'admin-123')
  .then(result => {
    console.log(`Module "${result.data.deletedModule.module}" deleted successfully`);
    console.log(`Total permissions removed: ${result.data.deletedModule.totalPermissions}`);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### **React Component Example**
```jsx
import React, { useState } from 'react';

const ModuleDeletionManager = () => {
  const [moduleName, setModuleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDeleteModule = async () => {
    if (!moduleName.trim()) {
      setError('Please enter a module name');
      return;
    }

    if (!confirm(`Are you sure you want to delete the module "${moduleName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/modules', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module: moduleName,
          updatedBy: getCurrentUserId()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setModuleName(''); // Clear the input
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="module-deletion-manager">
      <h2>Delete Permission Module</h2>
      
      <div className="form-group">
        <label htmlFor="moduleName">Module Name:</label>
        <input
          id="moduleName"
          type="text"
          value={moduleName}
          onChange={(e) => setModuleName(e.target.value)}
          placeholder="Enter module name to delete"
          disabled={loading}
        />
      </div>

      <div className="actions">
        <button
          onClick={handleDeleteModule}
          disabled={loading || !moduleName.trim()}
          className="danger-button"
        >
          {loading ? 'Deleting...' : 'Delete Module'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <h4>Error:</h4>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="success-message">
          <h4>Module Deleted Successfully!</h4>
          <div className="deletion-details">
            <p><strong>Module:</strong> {result.data.deletedModule.module}</p>
            <p><strong>Roles:</strong> {result.data.deletedModule.roles.join(', ')}</p>
            <p><strong>Total Permissions:</strong> {result.data.deletedModule.totalPermissions}</p>
            <p><strong>Deleted At:</strong> {new Date(result.data.deletedAt).toLocaleString()}</p>
            <p><strong>Deleted By:</strong> {result.data.deletedBy}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleDeletionManager;
```

### **Axios Example**
```javascript
import axios from 'axios';

const deleteModule = async (moduleName, adminUserId) => {
  try {
    const response = await axios.delete('/api/modules', {
      data: {
        module: moduleName,
        updatedBy: adminUserId
      },
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
};

// Usage with error handling
deleteModule('UserManagement', 'admin-123')
  .then(result => {
    console.log('Module deleted:', result.data.deletedModule);
  })
  .catch(error => {
    console.error('Deletion failed:', error.message);
  });
```

## Security Considerations

### **Authentication & Authorization**
- **Authentication Required**: Valid JWT token must be provided
- **Role-Based Access**: Only Super-admin role can delete modules
- **Audit Trail**: All deletions are logged with user information

### **Input Validation**
- **Module Name**: Required, non-empty string
- **Updated By**: Required, valid user ID
- **Module Existence**: Module must exist before deletion

### **Data Protection**
- **Permanent Deletion**: Module and all permissions are permanently removed
- **No Recovery**: Deleted modules cannot be restored
- **Cascade Deletion**: All associated permissions are automatically removed

## Error Handling

### **Common Error Scenarios**

#### **1. Module Not Found**
```javascript
// When trying to delete a non-existent module
{
  "message": "Module not found"
}
```

#### **2. Missing Required Fields**
```javascript
// When module name is not provided
{
  "message": "Module name is required"
}
```

#### **3. Authentication Issues**
```javascript
// When token is missing or invalid
{
  "message": "Unauthorized access"
}
```

#### **4. Authorization Issues**
```javascript
// When user doesn't have Super-admin role
{
  "message": "Insufficient permissions"
}
```

### **Error Handling Best Practices**
```javascript
async function safeDeleteModule(moduleName, adminUserId) {
  try {
    const result = await deleteModule(moduleName, adminUserId);
    return { success: true, data: result };
  } catch (error) {
    // Handle different error types
    if (error.message.includes('not found')) {
      return { success: false, error: 'Module does not exist' };
    } else if (error.message.includes('required')) {
      return { success: false, error: 'Missing required information' };
    } else if (error.message.includes('Unauthorized')) {
      return { success: false, error: 'Authentication required' };
    } else if (error.message.includes('permissions')) {
      return { success: false, error: 'Insufficient permissions' };
    } else {
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}
```

## Testing

### **Test Scenarios**
1. **Successful Deletion**: Delete existing module
2. **Module Not Found**: Delete non-existent module
3. **Missing Fields**: Delete without required fields
4. **Authentication**: Delete without valid token
5. **Authorization**: Delete with insufficient permissions
6. **Complete Workflow**: Create, verify, delete, verify deletion

### **Test Script**
Use the provided test script: `node test-delete-module-endpoint.js`

### **Manual Testing Commands**
```bash
# Test successful deletion
curl -X DELETE http://localhost:5001/api/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"module": "TestModule", "updatedBy": "admin-123"}'

# Test module not found
curl -X DELETE http://localhost:5001/api/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"module": "NonExistentModule", "updatedBy": "admin-123"}'

# Test missing module name
curl -X DELETE http://localhost:5001/api/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"updatedBy": "admin-123"}'
```

## Database Impact

### **What Gets Deleted**
- **Module Document**: Complete module record removed
- **All Permissions**: All user permissions for the module deleted
- **All Roles**: All role configurations for the module deleted
- **Metadata**: Creation and update timestamps lost

### **What Remains Unaffected**
- **Other Modules**: Other modules remain untouched
- **User Records**: User documents remain unchanged
- **System Logs**: Audit logs are preserved

### **Recovery Considerations**
- **No Automatic Recovery**: Deleted modules cannot be automatically restored
- **Manual Recreation**: Modules must be manually recreated if needed
- **Permission Rebuild**: All permissions must be manually reassigned

## Monitoring and Logging

### **Success Logs**
```
✅ Module deleted successfully: UserManagement
✅ Deletion completed by: admin-user-id
```

### **Error Logs**
```
❌ Error deleting module: Module not found
❌ Error deleting module: Missing module name
```

### **Audit Trail**
- **Deletion Timestamp**: When the module was deleted
- **Deleted By**: Which user performed the deletion
- **Module Details**: What was deleted (roles, permissions count)
- **System Logs**: All deletion attempts are logged

## Best Practices

### **Before Deletion**
1. **Verify Module**: Confirm the module exists and is correct
2. **Check Dependencies**: Ensure no critical systems depend on the module
3. **Backup Data**: Consider backing up module configuration
4. **Notify Users**: Inform relevant users about the deletion

### **After Deletion**
1. **Verify Deletion**: Confirm the module is completely removed
2. **Update Documentation**: Remove references to deleted module
3. **Clean Up Code**: Remove any code references to the deleted module
4. **Monitor Systems**: Check for any errors related to the deleted module

### **Prevention Measures**
1. **Confirmation Dialogs**: Always ask for confirmation before deletion
2. **Role Restrictions**: Limit deletion to Super-admin role only
3. **Audit Logging**: Log all deletion attempts
4. **Regular Backups**: Maintain system backups for recovery

## Integration Examples

### **Admin Dashboard Integration**
```jsx
const ModuleManagementDashboard = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  const handleDeleteModule = async (moduleName) => {
    if (confirm(`Delete module "${moduleName}"? This action cannot be undone.`)) {
      try {
        await deleteModule(moduleName, getCurrentUserId());
        // Refresh modules list
        fetchModules();
        alert('Module deleted successfully');
      } catch (error) {
        alert(`Failed to delete module: ${error.message}`);
      }
    }
  };

  return (
    <div className="module-dashboard">
      <h2>Module Management</h2>
      <div className="modules-list">
        {modules.map(module => (
          <div key={module._id} className="module-item">
            <h3>{module.module}</h3>
            <p>Roles: {module.AccessPermissions.length}</p>
            <button 
              onClick={() => handleDeleteModule(module.module)}
              className="delete-button"
            >
              Delete Module
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### **Bulk Operations Integration**
```javascript
const bulkDeleteModules = async (moduleNames, adminUserId) => {
  const results = [];
  
  for (const moduleName of moduleNames) {
    try {
      const result = await deleteModule(moduleName, adminUserId);
      results.push({ module: moduleName, success: true, data: result });
    } catch (error) {
      results.push({ module: moduleName, success: false, error: error.message });
    }
  }
  
  return results;
};
```

## Summary

The delete module endpoint provides:

- ✅ **Secure Deletion**: Authentication and authorization required
- ✅ **Complete Removal**: Module and all permissions deleted
- ✅ **Detailed Response**: Comprehensive deletion information
- ✅ **Error Handling**: Proper validation and error messages
- ✅ **Audit Trail**: Complete logging of deletion operations
- ✅ **Safety Measures**: Confirmation and validation before deletion

This endpoint enables Super-admins to safely and permanently remove permission modules from the system while maintaining proper security and audit controls.
