# Inactive Employee Login Prevention

## Overview

The dashboard login functionality has been enhanced to prevent inactive employees from logging into the system. When an employee's `active` field is set to `false`, they will be blocked from accessing the dashboard with an appropriate error message.

## Implementation Details

### **Enhanced Login Function**

The `loginUserForDashboard` function in `services/user-service/src/controllers/user.js` has been updated to include employee status validation:

```javascript
exports.loginUserForDashboard = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return sendError(res, "Invalid credentials", 401);

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendError(res, "Invalid credentials", 401);

    // Check if user is an employee and if their account is active
    const employee = await Employee.findOne({ user_id: user._id });
    if (employee && employee.active === false) {
      logger.warn(`❌ Login attempt by inactive employee: ${email} (Employee ID: ${employee.employee_id})`);
      return sendError(res, "Your account has been deactivated. Please contact your administrator.", 403);
    }

    // ✅ Update last_login timestamp
    user.last_login = new Date();
    await user.save();

    // ✅ Generate the token
    const token = generateJWT(user);

    // ... rest of the login logic
  } catch (err) {
    logger.error(`❌ Login error: ${err.message}`);
    sendError(res, err);
  }
};
```

### **Key Features**

#### **1. Employee Status Check**
- **Purpose**: Determines if the user is an employee
- **Implementation**: Queries the Employee collection using `user_id`
- **Logic**: `const employee = await Employee.findOne({ user_id: user._id });`

#### **2. Active Status Validation**
- **Purpose**: Checks if the employee account is active
- **Implementation**: Validates the `active` field in the Employee document
- **Logic**: `if (employee && employee.active === false)`

#### **3. Appropriate Error Response**
- **HTTP Status**: `403 Forbidden`
- **Message**: "Your account has been deactivated. Please contact your administrator."
- **Purpose**: Clear communication to the user about their account status

#### **4. Security Logging**
- **Purpose**: Tracks login attempts by inactive employees
- **Implementation**: Logs warning with employee details
- **Format**: `❌ Login attempt by inactive employee: {email} (Employee ID: {employee_id})`

## API Response Examples

### **1. Active Employee Login (Success)**
```bash
curl -X POST "http://localhost:5001/users/login-dashboard" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "active.employee@example.com",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "active.employee@example.com",
      "role": "Employee",
      "last_login": "2025-01-26T10:30:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### **2. Inactive Employee Login (Blocked)**
```bash
curl -X POST "http://localhost:5001/users/login-dashboard" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "inactive.employee@example.com",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "success": false,
  "message": "Your account has been deactivated. Please contact your administrator.",
  "error": "Forbidden"
}
```

**HTTP Status**: `403 Forbidden`

### **3. Regular User Login (Success)**
```bash
curl -X POST "http://localhost:5001/users/login-dashboard" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "regular.user@example.com",
    "password": "password123"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "regular.user@example.com",
      "role": "User",
      "last_login": "2025-01-26T10:30:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### **4. Invalid Credentials (Blocked)**
```bash
curl -X POST "http://localhost:5001/users/login-dashboard" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "wrongpassword"
  }'
```

**Response**:
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**HTTP Status**: `401 Unauthorized`

## Database Schema

### **Employee Model**
```javascript
const employeeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  employee_id: {
    type: String,
    unique: true,
    required: true,
  },
  First_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  role: {
    type: String,
  },
  active: {
    type: Boolean,
    default: true,  // This field controls login access
  },
  // ... other fields
});
```

### **User Model**
```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["User", "Employee", "Admin", "Super-admin"],
    default: "User",
  },
  last_login: {
    type: Date,
  },
  // ... other fields
});
```

## Security Considerations

### **1. Access Control**
- **Employee Deactivation**: Prevents access to dashboard for inactive employees
- **Role Preservation**: Employee role is preserved when deactivated (not changed to "User")
- **Clear Communication**: Users receive clear feedback about their account status

### **2. Logging and Monitoring**
- **Security Logs**: All login attempts by inactive employees are logged
- **Audit Trail**: Maintains record of deactivated employee access attempts
- **Monitoring**: Enables tracking of potential security issues

### **3. Error Handling**
- **Appropriate Status Codes**: Uses HTTP 403 for forbidden access
- **Clear Messages**: Provides user-friendly error messages
- **No Information Leakage**: Doesn't reveal sensitive system information

## Testing Scenarios

### **Test Cases**

#### **1. Active Employee Login**
- **Input**: Valid credentials for active employee
- **Expected**: Login successful (HTTP 200)
- **Validation**: Token generated, last_login updated

#### **2. Inactive Employee Login**
- **Input**: Valid credentials for inactive employee
- **Expected**: Login blocked (HTTP 403)
- **Validation**: Appropriate error message, security log entry

#### **3. Regular User Login**
- **Input**: Valid credentials for non-employee user
- **Expected**: Login successful (HTTP 200)
- **Validation**: No employee check performed

#### **4. Invalid Credentials**
- **Input**: Invalid email or password
- **Expected**: Login blocked (HTTP 401)
- **Validation**: Standard authentication error

### **Test Script Usage**
```bash
# Run the comprehensive test script
node test-inactive-employee-login-prevention.js
```

## Benefits

### **1. Security Enhancement**
- **Access Control**: Prevents unauthorized access by deactivated employees
- **Account Management**: Enables proper employee account lifecycle management
- **Compliance**: Supports organizational security policies

### **2. User Experience**
- **Clear Feedback**: Users understand why they can't access the system
- **Administrative Contact**: Provides guidance for resolving access issues
- **Non-Disruptive**: Regular users and active employees unaffected

### **3. Administrative Benefits**
- **Employee Management**: Easy deactivation/reactivation of employee accounts
- **Audit Trail**: Complete logging of access attempts
- **Monitoring**: Track potential security issues

## Integration Points

### **1. Employee Management**
- **Deactivation**: When employee is deactivated, login is immediately blocked
- **Reactivation**: When employee is reactivated, login access is restored
- **Role Management**: Employee role is preserved during deactivation

### **2. User Management**
- **User Creation**: Regular users can still be created and login normally
- **Role Assignment**: Employee role assignment works as before
- **Account Status**: User account status independent of employee status

### **3. Authentication Flow**
- **JWT Generation**: Only occurs for successful logins
- **Session Management**: Inactive employees cannot establish sessions
- **Token Validation**: Existing tokens remain valid until expiration

## Error Codes and Messages

### **HTTP Status Codes**
- **200 OK**: Successful login
- **400 Bad Request**: Missing email or password
- **401 Unauthorized**: Invalid credentials
- **403 Forbidden**: Inactive employee account
- **500 Internal Server Error**: Server error

### **Error Messages**
- **Missing Fields**: "Email and password are required"
- **Invalid Credentials**: "Invalid credentials"
- **Inactive Employee**: "Your account has been deactivated. Please contact your administrator."
- **Server Error**: "Internal server error"

## Migration Notes

### **Backward Compatibility**
- ✅ **Existing Users**: All existing users continue to work normally
- ✅ **Active Employees**: No change in behavior for active employees
- ✅ **API Structure**: No changes to API request/response structure
- ✅ **Database Schema**: No changes to existing schema

### **No Breaking Changes**
- Existing API clients will continue to work without modification
- Only inactive employees are affected by the new validation
- Regular users and active employees experience no changes

## Conclusion

The inactive employee login prevention feature provides essential security controls for managing employee access to the dashboard. The implementation is robust, secure, and maintains full backward compatibility while significantly enhancing the system's access control capabilities.

The feature ensures that deactivated employees cannot access the system while providing clear feedback and maintaining proper audit trails for security monitoring.
