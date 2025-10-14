# Update App Settings - Request Body Guide

## Endpoint
```
PATCH /api/appSettings
```

## Authentication
**Required**: Yes  
**Roles**: Super-admin, Fulfillment-Admin, User

**Header**:
```
Authorization: Bearer YOUR_TOKEN
```

---

## Request Body Format

### Complete Request Body (All Fields Optional)

```json
{
  "deliveryCharge": 50,
  "minimumOrderValue": 500,
  "smtp": {
    "fromName": "Toprise Support",
    "fromEmail": "support@toprise.in",
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  },
  "versioning": {
    "web": "1.2.0",
    "android": "2.1.5",
    "ios": "2.1.3"
  },
  "servicableAreas": [
    {
      "lat": 28.7041,
      "long": 77.1025
    },
    {
      "lat": 19.0760,
      "long": 72.8777
    }
  ],
  "supportEmail": "support@toprise.in",
  "supportPhone": "+91-1234567890",
  "tnc": "Terms and conditions text here...",
  "privacyPolicy": "Privacy policy text here..."
}
```

---

## Field Descriptions

### deliveryCharge
- **Type**: Number
- **Default**: 0
- **Description**: Flat delivery charge amount
- **Example**: `50`, `100`, `0`

### minimumOrderValue
- **Type**: Number
- **Default**: 0
- **Description**: Minimum order value required
- **Example**: `500`, `1000`, `0`

### smtp
- **Type**: Object
- **Description**: Email server configuration for sending emails
- **Fields**:
  - `fromName` (String): Sender name displayed in emails
  - `fromEmail` (String): Sender email address
  - `host` (String): SMTP server host (e.g., "smtp.gmail.com")
  - `port` (Number): SMTP server port (usually 587 or 465)
  - `secure` (Boolean): Use SSL/TLS connection
  - `auth.user` (String): SMTP authentication username
  - `auth.pass` (String): SMTP authentication password/app password

### versioning
- **Type**: Object
- **Description**: App version information for different platforms
- **Fields**:
  - `web` (String): Web app version (e.g., "1.2.0")
  - `android` (String): Android app version (e.g., "2.1.5")
  - `ios` (String): iOS app version (e.g., "2.1.3")

### servicableAreas
- **Type**: Array of Objects
- **Description**: Geographic coordinates of serviceable areas
- **Format**: `[{ lat: Number, long: Number }]`
- **Example**: 
  ```json
  [
    { "lat": 28.7041, "long": 77.1025 },
    { "lat": 19.0760, "long": 72.8777 }
  ]
  ```

### supportEmail
- **Type**: String
- **Default**: ""
- **Description**: Customer support email address
- **Example**: `"support@toprise.in"`

### supportPhone
- **Type**: String
- **Default**: ""
- **Description**: Customer support phone number
- **Example**: `"+91-1234567890"`

### tnc
- **Type**: String
- **Default**: ""
- **Description**: Terms and conditions text
- **Example**: `"By using this app, you agree to..."`

### privacyPolicy
- **Type**: String
- **Default**: ""
- **Description**: Privacy policy text
- **Example**: `"We collect the following information..."`

---

## Request Examples

### Example 1: Update Delivery Settings

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryCharge": 75,
    "minimumOrderValue": 1000
  }'
```

### Example 2: Update SMTP Configuration

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp": {
      "fromName": "Toprise Support Team",
      "fromEmail": "noreply@toprise.in",
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "your-email@gmail.com",
        "pass": "your-app-password"
      }
    }
  }'
```

### Example 3: Update App Versions

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "versioning": {
      "web": "1.3.0",
      "android": "2.2.0",
      "ios": "2.2.0"
    }
  }'
```

### Example 4: Update Support Contact Info

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "supportEmail": "support@toprise.in",
    "supportPhone": "+91-9876543210"
  }'
```

### Example 5: Update Serviceable Areas

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "servicableAreas": [
      {
        "lat": 28.7041,
        "long": 77.1025
      },
      {
        "lat": 19.0760,
        "long": 72.8777
      },
      {
        "lat": 13.0827,
        "long": 80.2707
      }
    ]
  }'
```

### Example 6: Update Terms and Privacy Policy

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tnc": "Updated Terms and Conditions: By using this application, you agree to abide by our policies and guidelines...",
    "privacyPolicy": "Updated Privacy Policy: We collect and process the following personal information..."
  }'
```

### Example 7: Update Multiple Settings at Once

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deliveryCharge": 100,
    "minimumOrderValue": 750,
    "supportEmail": "support@toprise.in",
    "supportPhone": "+91-9876543210",
    "versioning": {
      "web": "1.4.0",
      "android": "2.3.0",
      "ios": "2.3.0"
    }
  }'
```

---

## JavaScript/Frontend Examples

### Using Fetch API

```javascript
const updateAppSettings = async (settings) => {
  const response = await fetch('http://localhost:5000/api/appSettings', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });
  
  return await response.json();
};

// Usage - Update delivery charges
await updateAppSettings({
  deliveryCharge: 75,
  minimumOrderValue: 1000
});

// Usage - Update SMTP settings
await updateAppSettings({
  smtp: {
    fromName: 'Toprise',
    fromEmail: 'noreply@toprise.in',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'app-password'
    }
  }
});
```

### Using Axios

```javascript
import axios from 'axios';

const updateAppSettings = async (settings) => {
  try {
    const response = await axios.patch(
      'http://localhost:5000/api/appSettings',
      settings,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Settings not found. Please create settings first.');
    }
    throw error;
  }
};

// Usage examples
await updateAppSettings({
  deliveryCharge: 50,
  minimumOrderValue: 500
});

await updateAppSettings({
  versioning: {
    web: '1.2.0',
    android: '2.1.5',
    ios: '2.1.3'
  }
});

await updateAppSettings({
  supportEmail: 'support@toprise.in',
  supportPhone: '+91-9876543210'
});
```

---

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AppSettingsForm = () => {
  const [settings, setSettings] = useState({
    deliveryCharge: 0,
    minimumOrderValue: 0,
    supportEmail: '',
    supportPhone: '',
    versioning: {
      web: '1.0.0',
      android: '1.0.0',
      ios: '1.0.0'
    },
    smtp: {
      fromName: '',
      fromEmail: '',
      host: '',
      port: 587,
      secure: false,
      auth: {
        user: '',
        pass: ''
      }
    },
    servicableAreas: [],
    tnc: '',
    privacyPolicy: ''
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('/api/appSettings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.patch('/api/appSettings', settings, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Settings not found');
      } else {
        toast.error('Failed to update settings');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Delivery Settings</h2>
      <input
        type="number"
        value={settings.deliveryCharge}
        onChange={(e) => setSettings({...settings, deliveryCharge: Number(e.target.value)})}
        placeholder="Delivery Charge"
      />
      
      <input
        type="number"
        value={settings.minimumOrderValue}
        onChange={(e) => setSettings({...settings, minimumOrderValue: Number(e.target.value)})}
        placeholder="Minimum Order Value"
      />

      <h2>Support Contact</h2>
      <input
        type="email"
        value={settings.supportEmail}
        onChange={(e) => setSettings({...settings, supportEmail: e.target.value})}
        placeholder="Support Email"
      />
      
      <input
        type="tel"
        value={settings.supportPhone}
        onChange={(e) => setSettings({...settings, supportPhone: e.target.value})}
        placeholder="Support Phone"
      />

      <h2>App Versions</h2>
      <input
        type="text"
        value={settings.versioning.web}
        onChange={(e) => setSettings({
          ...settings,
          versioning: {...settings.versioning, web: e.target.value}
        })}
        placeholder="Web Version"
      />
      
      <input
        type="text"
        value={settings.versioning.android}
        onChange={(e) => setSettings({
          ...settings,
          versioning: {...settings.versioning, android: e.target.value}
        })}
        placeholder="Android Version"
      />
      
      <input
        type="text"
        value={settings.versioning.ios}
        onChange={(e) => setSettings({
          ...settings,
          versioning: {...settings.versioning, ios: e.target.value}
        })}
        placeholder="iOS Version"
      />

      <button type="submit">Update Settings</button>
    </form>
  );
};
```

---

## Partial Update Examples

### Update Only Delivery Charge
```json
{
  "deliveryCharge": 75
}
```

### Update Only Support Email
```json
{
  "supportEmail": "newsupport@toprise.in"
}
```

### Update Only Web Version
```json
{
  "versioning": {
    "web": "1.5.0"
  }
}
```

### Update Only SMTP Host and Port
```json
{
  "smtp": {
    "host": "smtp.sendgrid.net",
    "port": 465
  }
}
```

**Note**: Partial updates will merge with existing settings. For nested objects like `smtp` and `versioning`, provide the entire object to avoid data loss.

---

## Complete Update Examples

### Example 1: Basic Settings Update

```json
{
  "deliveryCharge": 100,
  "minimumOrderValue": 750,
  "supportEmail": "support@toprise.in",
  "supportPhone": "+91-9876543210"
}
```

### Example 2: SMTP Configuration Update

```json
{
  "smtp": {
    "fromName": "Toprise Auto Parts",
    "fromEmail": "noreply@toprise.in",
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "toprise.notifications@gmail.com",
      "pass": "your-16-char-app-password"
    }
  }
}
```

### Example 3: Version Update (All Platforms)

```json
{
  "versioning": {
    "web": "2.0.0",
    "android": "3.0.0",
    "ios": "3.0.0"
  }
}
```

### Example 4: Add Serviceable Areas

```json
{
  "servicableAreas": [
    {
      "lat": 28.7041,
      "long": 77.1025,
      "name": "Delhi"
    },
    {
      "lat": 19.0760,
      "long": 72.8777,
      "name": "Mumbai"
    },
    {
      "lat": 13.0827,
      "long": 80.2707,
      "name": "Chennai"
    },
    {
      "lat": 12.9716,
      "long": 77.5946,
      "name": "Bangalore"
    }
  ]
}
```

### Example 5: Update Legal Documents

```json
{
  "tnc": "TERMS AND CONDITIONS\n\n1. Acceptance of Terms\nBy accessing and using this application...\n\n2. User Obligations\nUsers must provide accurate information...",
  "privacyPolicy": "PRIVACY POLICY\n\n1. Information Collection\nWe collect the following information...\n\n2. Use of Information\nYour information is used for..."
}
```

### Example 6: Complete Configuration

```json
{
  "deliveryCharge": 100,
  "minimumOrderValue": 1000,
  "smtp": {
    "fromName": "Toprise Auto Parts",
    "fromEmail": "noreply@toprise.in",
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "notifications@toprise.in",
      "pass": "app-password-here"
    }
  },
  "versioning": {
    "web": "1.2.0",
    "android": "2.1.5",
    "ios": "2.1.3"
  },
  "servicableAreas": [
    { "lat": 28.7041, "long": 77.1025 },
    { "lat": 19.0760, "long": 72.8777 }
  ],
  "supportEmail": "support@toprise.in",
  "supportPhone": "+91-1234567890",
  "tnc": "Terms and Conditions text...",
  "privacyPolicy": "Privacy Policy text..."
}
```

---

## Response Examples

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "_id": "settings_id",
    "deliveryCharge": 100,
    "minimumOrderValue": 1000,
    "smtp": {
      "fromName": "Toprise Auto Parts",
      "fromEmail": "noreply@toprise.in",
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "notifications@toprise.in",
        "pass": "app-password-here"
      }
    },
    "versioning": {
      "web": "1.2.0",
      "android": "2.1.5",
      "ios": "2.1.3"
    },
    "servicableAreas": [
      {
        "lat": 28.7041,
        "long": 77.1025
      },
      {
        "lat": 19.0760,
        "long": 72.8777
      }
    ],
    "supportEmail": "support@toprise.in",
    "supportPhone": "+91-1234567890",
    "tnc": "Terms and Conditions text...",
    "privacyPolicy": "Privacy Policy text...",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-14T11:30:00.000Z"
  },
  "message": "Settings updated successfully"
}
```

### Error Response - Not Found (404)

```json
{
  "success": false,
  "message": "No settings found"
}
```

**Note**: If settings don't exist, you need to create them first using the create endpoint.

---

## Important Notes

### 1. Singleton Pattern
App settings uses a **singleton pattern** - only one settings document exists in the database.

### 2. Partial Updates Supported
You can update only the fields you want to change. Other fields remain unchanged.

### 3. Nested Object Updates
When updating nested objects like `smtp` or `versioning`, provide the complete object to avoid losing existing data:

```javascript
// ❌ BAD - Will lose other SMTP fields
{
  "smtp": {
    "port": 465
  }
}

// ✅ GOOD - Preserves all SMTP fields
{
  "smtp": {
    "fromName": "Toprise",
    "fromEmail": "noreply@toprise.in",
    "host": "smtp.gmail.com",
    "port": 465,  // Changed
    "secure": true,
    "auth": {
      "user": "email@gmail.com",
      "pass": "password"
    }
  }
}
```

### 4. Array Fields
For arrays like `servicableAreas`, the entire array will be replaced:

```javascript
// This replaces the entire servicableAreas array
{
  "servicableAreas": [
    { "lat": 28.7041, "long": 77.1025 }
  ]
}
```

### 5. Validation
The controller validates that fields exist in the schema before updating:
```javascript
Object.keys(updates).forEach((key) => {
  if (key in settings) {  // Only updates if field exists in schema
    settings[key] = updates[key];
  }
});
```

---

## Quick Copy-Paste Templates

### Template 1: Delivery Settings
```json
{
  "deliveryCharge": 50,
  "minimumOrderValue": 500
}
```

### Template 2: Support Info
```json
{
  "supportEmail": "support@toprise.in",
  "supportPhone": "+91-1234567890"
}
```

### Template 3: App Versions
```json
{
  "versioning": {
    "web": "1.0.0",
    "android": "1.0.0",
    "ios": "1.0.0"
  }
}
```

### Template 4: SMTP Config
```json
{
  "smtp": {
    "fromName": "Your Company",
    "fromEmail": "noreply@yourcompany.com",
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  }
}
```

### Template 5: Serviceable Areas
```json
{
  "servicableAreas": [
    { "lat": 28.7041, "long": 77.1025 },
    { "lat": 19.0760, "long": 72.8777 }
  ]
}
```

---

## Testing

### Test 1: Update Delivery Charge

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryCharge": 75}'
```

**Expected**: Success response with deliveryCharge set to 75

### Test 2: Update Support Email

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"supportEmail": "support@toprise.in"}'
```

**Expected**: Success response with supportEmail updated

### Test 3: Update App Version

```bash
curl -X PATCH "http://localhost:5000/api/appSettings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "versioning": {
      "web": "1.5.0",
      "android": "2.5.0",
      "ios": "2.5.0"
    }
  }'
```

**Expected**: Success response with updated versions

---

## Common Use Cases

### Use Case 1: Admin Dashboard - Update Delivery Fees
```javascript
const updateDeliveryFees = async (charge, minValue) => {
  await updateAppSettings({
    deliveryCharge: charge,
    minimumOrderValue: minValue
  });
};

// Usage
updateDeliveryFees(100, 750);
```

### Use Case 2: Settings Page - Update Contact Info
```javascript
const updateContactInfo = async (email, phone) => {
  await updateAppSettings({
    supportEmail: email,
    supportPhone: phone
  });
};

// Usage
updateContactInfo('support@toprise.in', '+91-9876543210');
```

### Use Case 3: Version Management - Bump App Version
```javascript
const updateAppVersion = async (platform, version) => {
  const currentSettings = await getAppSettings();
  
  await updateAppSettings({
    versioning: {
      ...currentSettings.versioning,
      [platform]: version
    }
  });
};

// Usage
updateAppVersion('android', '2.2.0');
```

### Use Case 4: Email Configuration - Update SMTP
```javascript
const updateEmailConfig = async (smtpConfig) => {
  await updateAppSettings({
    smtp: smtpConfig
  });
};

// Usage
updateEmailConfig({
  fromName: 'Toprise',
  fromEmail: 'noreply@toprise.in',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'email@gmail.com',
    pass: 'app-password'
  }
});
```

---

## Summary

**Endpoint**: `PATCH /api/appSettings`  
**Method**: PATCH  
**Auth**: Required (Super-admin, Fulfillment-Admin, User)  
**Content-Type**: `application/json`  

**All Fields Optional**:
- `deliveryCharge` (Number)
- `minimumOrderValue` (Number)
- `smtp` (Object)
- `versioning` (Object)
- `servicableAreas` (Array)
- `supportEmail` (String)
- `supportPhone` (String)
- `tnc` (String)
- `privacyPolicy` (String)

**Supports**:
- ✅ Partial updates (only changed fields)
- ✅ Complete updates (all fields)
- ✅ Nested object updates
- ✅ Array updates

Use the examples above based on what settings you need to update!
