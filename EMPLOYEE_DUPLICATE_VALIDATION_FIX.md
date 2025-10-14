# Employee Creation Duplicate Validation Fix

## Issue Identified
When creating an employee with an existing phone number or email, the system was not showing any error message. The function only checked for duplicate email and username, but ignored:
- Phone number (`phone_Number`)
- Employee ID (`employee_id`)
- Mobile number (`mobile_number`)

## Root Cause

### Before Fix ❌
```javascript
const duplicate = await User.findOne({ $or: [{ email }, { username }] });
if (duplicate) {
  return res
    .status(409)
    .json({ message: "Email or username already exists." });
}
```

**Problems**:
1. ❌ Only checked `email` and `username`
2. ❌ Didn't check `phone_Number` in User model
3. ❌ Didn't check `employee_id` in Employee model
4. ❌ Didn't check `mobile_number` in Employee model
5. ❌ Generic error message didn't specify which field was duplicate
6. ❌ No logging of duplicate attempts

---

## Solution Applied

### After Fix ✅

**File**: `services/user-service/src/controllers/user.js` - `createEmployee` function

#### 1. Enhanced User Duplicate Check
```javascript
// Check for duplicate user credentials
const duplicateUser = await User.findOne({ 
  $or: [
    { email: email }, 
    { username: username },
    ...(phone_Number ? [{ phone_Number: phone_Number }] : [])  // ✅ Added phone check
  ] 
});

if (duplicateUser) {
  // ✅ Specific error messages for each field
  if (duplicateUser.email === email) {
    logger.warn(`Duplicate email attempted: ${email}`);
    return res.status(409).json({ 
      success: false,
      message: `Email "${email}" is already registered.` 
    });
  }
  if (duplicateUser.username === username) {
    logger.warn(`Duplicate username attempted: ${username}`);
    return res.status(409).json({ 
      success: false,
      message: `Username "${username}" is already taken.` 
    });
  }
  if (phone_Number && duplicateUser.phone_Number === phone_Number) {
    logger.warn(`Duplicate phone number attempted: ${phone_Number}`);
    return res.status(409).json({ 
      success: false,
      message: `Phone number "${phone_Number}" is already registered.` 
    });
  }
}
```

#### 2. Added Employee Duplicate Check
```javascript
// Check for duplicate employee ID or mobile number
const duplicateEmployee = await Employee.findOne({
  $or: [
    { employee_id: employee_id },
    ...(mobile_number ? [{ mobile_number: mobile_number }] : [])
  ]
});

if (duplicateEmployee) {
  if (duplicateEmployee.employee_id === employee_id) {
    logger.warn(`Duplicate employee ID attempted: ${employee_id}`);
    return res.status(409).json({ 
      success: false,
      message: `Employee ID "${employee_id}" is already in use.` 
    });
  }
  if (mobile_number && duplicateEmployee.mobile_number === mobile_number) {
    logger.warn(`Duplicate mobile number attempted: ${mobile_number}`);
    return res.status(409).json({ 
      success: false,
      message: `Mobile number "${mobile_number}" is already registered.` 
    });
  }
}
```

---

## What's Now Validated

### User Model Duplicates
1. ✅ **Email** - Must be unique
2. ✅ **Username** - Must be unique
3. ✅ **Phone Number** - Must be unique (if provided)

### Employee Model Duplicates
1. ✅ **Employee ID** - Must be unique
2. ✅ **Mobile Number** - Must be unique (if provided)

---

## Error Responses

### Duplicate Email (409)
```json
{
  "success": false,
  "message": "Email \"john@example.com\" is already registered."
}
```

### Duplicate Username (409)
```json
{
  "success": false,
  "message": "Username \"johndoe\" is already taken."
}
```

### Duplicate Phone Number (409)
```json
{
  "success": false,
  "message": "Phone number \"+91-1234567890\" is already registered."
}
```

### Duplicate Employee ID (409)
```json
{
  "success": false,
  "message": "Employee ID \"EMP001\" is already in use."
}
```

### Duplicate Mobile Number (409)
```json
{
  "success": false,
  "message": "Mobile number \"+91-9876543210\" is already registered."
}
```

### Missing Required Fields (400)
```json
{
  "message": "Missing required fields."
}
```

---

## HTTP Status Codes

- **409 Conflict** - Duplicate data
- **400 Bad Request** - Missing required fields
- **201 Created** - Employee created successfully
- **500 Internal Server Error** - Server error

---

## Logging

All duplicate attempts are now logged:

```javascript
logger.warn(`Duplicate email attempted: ${email}`);
logger.warn(`Duplicate username attempted: ${username}`);
logger.warn(`Duplicate phone number attempted: ${phone_Number}`);
logger.warn(`Duplicate employee ID attempted: ${employee_id}`);
logger.warn(`Duplicate mobile number attempted: ${mobile_number}`);
```

**Log Level**: `WARN` - Indicates potentially problematic behavior

---

## Testing

### Test Case 1: Duplicate Email

```bash
# Create first employee
curl -X POST "http://localhost:5000/api/users/employee" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "password123",
    "phone_Number": "+91-1234567890",
    "employee_id": "EMP001",
    "First_name": "John Doe",
    "mobile_number": "+91-9876543210",
    "role": "User",
    "employeeRole": "Fulfillment-Staff"
  }'

# Try to create another with same email
curl -X POST "http://localhost:5000/api/users/employee" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe2",
    "password": "password123",
    "phone_Number": "+91-1111111111",
    "employee_id": "EMP002",
    "First_name": "Jane Doe",
    "role": "User",
    "employeeRole": "Fulfillment-Staff"
  }'

# Expected Response:
# Status: 409
# {
#   "success": false,
#   "message": "Email \"john@example.com\" is already registered."
# }
```

### Test Case 2: Duplicate Phone Number

```bash
curl -X POST "http://localhost:5000/api/users/employee" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "username": "janedoe",
    "password": "password123",
    "phone_Number": "+91-1234567890",
    "employee_id": "EMP003",
    "First_name": "Jane Doe",
    "role": "User",
    "employeeRole": "Fulfillment-Staff"
  }'

# Expected Response:
# Status: 409
# {
#   "success": false,
#   "message": "Phone number \"+91-1234567890\" is already registered."
# }
```

### Test Case 3: Duplicate Employee ID

```bash
curl -X POST "http://localhost:5000/api/users/employee" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "username": "janedoe",
    "password": "password123",
    "phone_Number": "+91-2222222222",
    "employee_id": "EMP001",
    "First_name": "Jane Doe",
    "role": "User",
    "employeeRole": "Fulfillment-Staff"
  }'

# Expected Response:
# Status: 409
# {
#   "success": false,
#   "message": "Employee ID \"EMP001\" is already in use."
# }
```

### Test Case 4: Duplicate Mobile Number

```bash
curl -X POST "http://localhost:5000/api/users/employee" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "username": "janedoe",
    "password": "password123",
    "employee_id": "EMP003",
    "First_name": "Jane Doe",
    "mobile_number": "+91-9876543210",
    "role": "User",
    "employeeRole": "Fulfillment-Staff"
  }'

# Expected Response:
# Status: 409
# {
#   "success": false,
#   "message": "Mobile number \"+91-9876543210\" is already registered."
# }
```

---

## Frontend Integration

### Handling Duplicate Errors

```javascript
const createEmployee = async (formData) => {
  try {
    const response = await fetch('/api/users/employee', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.status === 409) {
      // Duplicate error
      if (data.message.includes('Email')) {
        setFieldError('email', data.message);
      } else if (data.message.includes('Username')) {
        setFieldError('username', data.message);
      } else if (data.message.includes('Phone number')) {
        setFieldError('phone_Number', data.message);
      } else if (data.message.includes('Employee ID')) {
        setFieldError('employee_id', data.message);
      } else if (data.message.includes('Mobile number')) {
        setFieldError('mobile_number', data.message);
      }
      
      toast.error(data.message);
      return { success: false, error: 'duplicate' };
    } else if (response.status === 400) {
      toast.error(data.message || 'Missing required fields');
      return { success: false, error: 'validation' };
    } else if (!response.ok) {
      toast.error('Failed to create employee');
      return { success: false, error: 'server_error' };
    } else {
      toast.success('Employee created successfully');
      return { success: true, data: data };
    }
  } catch (error) {
    console.error('Network error:', error);
    toast.error('Network error');
    return { success: false, error: 'network_error' };
  }
};
```

### React Form Example

```jsx
const EmployeeCreateForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    phone_Number: '',
    employee_id: '',
    First_name: '',
    mobile_number: '',
    role: 'User',
    employeeRole: 'Fulfillment-Staff'
  });
  
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await createEmployee(formData);
    
    if (result.success) {
      onSuccess(result.data);
    } else if (result.error === 'duplicate') {
      // Error already shown via toast and field errors
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
      />
      {errors.email && <ErrorText>{errors.email}</ErrorText>}
      
      <input
        type="text"
        value={formData.phone_Number}
        onChange={(e) => setFormData({...formData, phone_Number: e.target.value})}
        placeholder="Phone Number"
      />
      {errors.phone_Number && <ErrorText>{errors.phone_Number}</ErrorText>}
      
      <input
        type="text"
        value={formData.employee_id}
        onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
        placeholder="Employee ID"
      />
      {errors.employee_id && <ErrorText>{errors.employee_id}</ErrorText>}
      
      {/* Other fields... */}
      
      <button type="submit">Create Employee</button>
    </form>
  );
};
```

---

## Database Schema

### User Model
Fields that must be unique:
```javascript
{
  email: { type: String, unique: true },      // ✅ Validated
  username: { type: String, unique: true },   // ✅ Validated
  phone_Number: { type: String }              // ✅ Now validated
}
```

### Employee Model
Fields that must be unique:
```javascript
{
  employee_id: { type: String, unique: true },  // ✅ Now validated
  mobile_number: { type: String },              // ✅ Now validated
  email: { type: String }                       // ✅ Validated via User model
}
```

---

## Validation Flow

```
Request to create employee
    ↓
Check User model for duplicates
├── Email exists? → Return 409: "Email already registered"
├── Username exists? → Return 409: "Username already taken"
└── Phone exists? → Return 409: "Phone number already registered"
    ↓
Check Employee model for duplicates
├── Employee ID exists? → Return 409: "Employee ID already in use"
└── Mobile number exists? → Return 409: "Mobile number already registered"
    ↓
Hash password
    ↓
Create User (with transaction)
    ↓
Create Employee (with transaction)
    ↓
Commit transaction
    ↓
Send welcome email
    ↓
Return 201: Success
```

---

## Conditional Validation

The validation is smart and only checks fields if they are provided:

```javascript
// Phone Number - only check if provided
...(phone_Number ? [{ phone_Number: phone_Number }] : [])

// Mobile Number - only check if provided
...(mobile_number ? [{ mobile_number: mobile_number }] : [])
```

This allows creating employees without phone/mobile if not required.

---

## Impact

### Before Fix
- ❌ Could create employees with duplicate phone numbers
- ❌ Could create employees with duplicate employee IDs
- ❌ Could create employees with duplicate mobile numbers
- ❌ No specific error messages
- ❌ No logging of duplicate attempts
- ❌ Users confused when creation silently failed or succeeded with duplicates

### After Fix
- ✅ Cannot create employee with duplicate phone number
- ✅ Cannot create employee with duplicate employee ID
- ✅ Cannot create employee with duplicate mobile number
- ✅ Specific error messages for each field
- ✅ All duplicate attempts logged
- ✅ Clear feedback to users about what went wrong

---

## Error Message Examples

| Duplicate Field | Error Message |
|----------------|---------------|
| Email | `Email "john@example.com" is already registered.` |
| Username | `Username "johndoe" is already taken.` |
| Phone Number | `Phone number "+91-1234567890" is already registered.` |
| Employee ID | `Employee ID "EMP001" is already in use.` |
| Mobile Number | `Mobile number "+91-9876543210" is already registered.` |

---

## Files Modified

1. **`services/user-service/src/controllers/user.js`** - `createEmployee` function
   - Added comprehensive duplicate checking
   - Added specific error messages
   - Added logging

---

## Best Practices Implemented

### 1. Check Before Create
Validates all unique constraints before attempting database operations.

### 2. Specific Error Messages
Each duplicate field gets its own clear error message.

### 3. Proper Status Codes
- `409 Conflict` for duplicates
- `400 Bad Request` for missing fields
- `201 Created` for success

### 4. Transaction Safety
Duplicate checks happen **before** starting the transaction, preventing unnecessary database operations.

### 5. Comprehensive Logging
All duplicate attempts are logged for monitoring and debugging.

### 6. Conditional Checking
Only checks optional fields (phone, mobile) if they are provided.

---

## Database Indexes

To ensure optimal performance, add indexes on these fields:

```javascript
// User model
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ phone_Number: 1 }, { unique: true, sparse: true });

// Employee model
db.employees.createIndex({ employee_id: 1 }, { unique: true });
db.employees.createIndex({ mobile_number: 1 }, { unique: true, sparse: true });
```

**Note**: Use `sparse: true` for optional fields (phone_Number, mobile_number) to allow null/undefined values.

---

## Common Issues & Solutions

### Issue 1: Phone Number Formats
Different formats like "+91-1234567890" vs "+911234567890" are treated as different:

**Solution**: Normalize phone numbers before saving
```javascript
const normalizedPhone = phone_Number?.replace(/[-\s]/g, '');
```

### Issue 2: Email Case Sensitivity
"John@Example.com" vs "john@example.com" are treated as different:

**Solution**: Convert to lowercase before checking
```javascript
const email = req.body.email.toLowerCase();
```

### Issue 3: Whitespace
"john@example.com " vs "john@example.com" are different:

**Solution**: Trim all inputs
```javascript
const email = req.body.email.trim().toLowerCase();
```

---

## Recommendations

### 1. Add to User Model Schema
```javascript
email: {
  type: String,
  unique: true,
  lowercase: true,  // ✅ Auto-convert to lowercase
  trim: true,       // ✅ Auto-trim whitespace
},
phone_Number: {
  type: String,
  unique: true,
  sparse: true,     // ✅ Allow null/undefined
  trim: true,
}
```

### 2. Add to Employee Model Schema
```javascript
employee_id: {
  type: String,
  unique: true,
  required: true,
  trim: true,
},
mobile_number: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
}
```

### 3. Frontend Validation
Add client-side validation before submitting:
```javascript
// Check email format
if (!emailRegex.test(email)) {
  setError('email', 'Invalid email format');
}

// Check phone format
if (!phoneRegex.test(phone)) {
  setError('phone', 'Invalid phone number format');
}
```

---

## Summary

### Fixed Fields
- ✅ Email
- ✅ Username
- ✅ Phone Number (User model)
- ✅ Employee ID
- ✅ Mobile Number (Employee model)

### Error Handling
- ✅ Specific error messages
- ✅ Proper HTTP status codes
- ✅ Comprehensive logging
- ✅ Conditional checking for optional fields

### Benefits
- ✅ Better data integrity
- ✅ Clear user feedback
- ✅ Easier debugging
- ✅ Professional error handling

Employees can no longer be created with duplicate email, username, phone number, employee ID, or mobile number, and users will receive clear error messages explaining which field is duplicate!
