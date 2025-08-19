# Bank Details Update Summary

## Problem
The `updateBankDetails` function was throwing an error when users tried to update their bank details, showing "No bank details found for this user. Use add endpoint first." even when they wanted to create new bank details or update existing ones.

## Solution
Updated both `addBankDetails` and `updateBankDetails` functions to handle both scenarios:
- **Creating new bank details** (when user doesn't have any)
- **Updating existing bank details** (when user already has bank details)

## Changes Made

### 1. Updated `addBankDetails` Function
**File:** `services/user-service/src/controllers/user.js`

**Before:**
- Only allowed adding new bank details
- Threw error if bank details already existed
- Required users to use update endpoint for modifications

**After:**
- Can add new bank details OR update existing ones
- Automatically detects if bank details exist
- Provides appropriate success message based on action

**Key Changes:**
```javascript
// Before
if (user.bank_details && user.bank_details.account_number) {
  return sendError(res, "Bank details already exist for this user. Use update endpoint to modify.", 400);
}

// After
const hasExistingBankDetails = user.bank_details && user.bank_details.account_number;
const action = hasExistingBankDetails ? "updated" : "added";
```

### 2. Updated `updateBankDetails` Function
**File:** `services/user-service/src/controllers/user.js`

**Before:**
- Only allowed updating existing bank details
- Threw error if no bank details existed
- Required users to use add endpoint first

**After:**
- Can update existing bank details OR create new ones
- Automatically detects if bank details exist
- Provides appropriate success message based on action

**Key Changes:**
```javascript
// Before
if (!user.bank_details || !user.bank_details.account_number) {
  return sendError(res, "No bank details found for this user. Use add endpoint first.", 404);
}

// After
const hasExistingBankDetails = user.bank_details && user.bank_details.account_number;
const action = hasExistingBankDetails ? "updated" : "created";
```

## API Endpoints

### POST `/:userId/bank-details` (Add/Update)
- **Purpose:** Add new bank details or update existing ones
- **Function:** `addBankDetails`
- **Behavior:** Creates new details if none exist, updates if they do exist

### PUT `/:userId/bank-details` (Update/Create)
- **Purpose:** Update existing bank details or create new ones
- **Function:** `updateBankDetails`
- **Behavior:** Updates existing details if they exist, creates new ones if they don't

### GET `/:userId/bank-details` (Retrieve)
- **Purpose:** Get user's bank details
- **Function:** `getBankDetails`
- **Behavior:** Returns existing bank details or error if none found

### DELETE `/:userId/bank-details` (Remove)
- **Purpose:** Remove user's bank details
- **Function:** `deleteBankDetails`
- **Behavior:** Clears all bank details fields

## Benefits

1. **User-Friendly:** Users can use either endpoint without worrying about which one to use
2. **Error-Free:** No more confusing error messages about using different endpoints
3. **Flexible:** Both endpoints handle both create and update scenarios
4. **Consistent:** Both functions provide appropriate success messages based on the action performed

## Testing

### Test Cases

1. **New User - No Bank Details**
   ```bash
   POST /api/users/:userId/bank-details
   # Should create new bank details
   # Response: "Bank details added successfully"
   ```

2. **Existing User - Has Bank Details**
   ```bash
   POST /api/users/:userId/bank-details
   # Should update existing bank details
   # Response: "Bank details updated successfully"
   ```

3. **New User - No Bank Details (PUT)**
   ```bash
   PUT /api/users/:userId/bank-details
   # Should create new bank details
   # Response: "Bank details created successfully"
   ```

4. **Existing User - Has Bank Details (PUT)**
   ```bash
   PUT /api/users/:userId/bank-details
   # Should update existing bank details
   # Response: "Bank details updated successfully"
   ```

## Validation

Both functions maintain the same validation rules:
- All fields are required
- Account number must be 9-18 digits
- IFSC code must follow proper format (4 letters + 0 + 6 alphanumeric)
- Account type must be one of: Savings, Current, Fixed Deposit, Recurring Deposit

## Backward Compatibility

- All existing functionality is preserved
- No breaking changes to API contracts
- Existing clients will continue to work
- Additional flexibility added without removing any features
