# Update App Settings - Quick Examples

## Endpoint
```
PATCH /api/appSettings
Authorization: Bearer YOUR_TOKEN
```

---

## Common Update Scenarios

### 1️⃣ Update Delivery Charge
```json
{
  "deliveryCharge": 75
}
```

### 2️⃣ Update Minimum Order Value
```json
{
  "minimumOrderValue": 1000
}
```

### 3️⃣ Update Both Delivery Settings
```json
{
  "deliveryCharge": 100,
  "minimumOrderValue": 750
}
```

### 4️⃣ Update Support Contact
```json
{
  "supportEmail": "support@toprise.in",
  "supportPhone": "+91-9876543210"
}
```

### 5️⃣ Update App Versions
```json
{
  "versioning": {
    "web": "1.2.0",
    "android": "2.1.5",
    "ios": "2.1.3"
  }
}
```

### 6️⃣ Update SMTP Settings
```json
{
  "smtp": {
    "fromName": "Toprise Support",
    "fromEmail": "noreply@toprise.in",
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

### 7️⃣ Update Serviceable Areas
```json
{
  "servicableAreas": [
    { "lat": 28.7041, "long": 77.1025 },
    { "lat": 19.0760, "long": 72.8777 },
    { "lat": 13.0827, "long": 80.2707 }
  ]
}
```

### 8️⃣ Update Terms & Conditions
```json
{
  "tnc": "TERMS AND CONDITIONS\n\nBy using this application, you agree to..."
}
```

### 9️⃣ Update Privacy Policy
```json
{
  "privacyPolicy": "PRIVACY POLICY\n\nWe collect and process the following information..."
}
```

### 🔟 Update Everything
```json
{
  "deliveryCharge": 100,
  "minimumOrderValue": 750,
  "supportEmail": "support@toprise.in",
  "supportPhone": "+91-9876543210",
  "versioning": {
    "web": "1.2.0",
    "android": "2.1.5",
    "ios": "2.1.3"
  },
  "smtp": {
    "fromName": "Toprise",
    "fromEmail": "noreply@toprise.in",
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "email@gmail.com",
      "pass": "password"
    }
  },
  "servicableAreas": [
    { "lat": 28.7041, "long": 77.1025 }
  ],
  "tnc": "Terms...",
  "privacyPolicy": "Policy..."
}
```

---

## Quick JavaScript Examples

### Update Delivery Charge
```javascript
await axios.patch('/api/appSettings', 
  { deliveryCharge: 75 },
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Update Support Email
```javascript
await axios.patch('/api/appSettings', 
  { supportEmail: 'support@toprise.in' },
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

### Update App Version
```javascript
await axios.patch('/api/appSettings', 
  { 
    versioning: { 
      web: '1.2.0', 
      android: '2.1.5', 
      ios: '2.1.3' 
    } 
  },
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

---

## Field Reference

| Field | Type | Example Value |
|-------|------|---------------|
| `deliveryCharge` | Number | `50`, `75`, `100` |
| `minimumOrderValue` | Number | `500`, `750`, `1000` |
| `supportEmail` | String | `"support@toprise.in"` |
| `supportPhone` | String | `"+91-9876543210"` |
| `versioning.web` | String | `"1.2.0"` |
| `versioning.android` | String | `"2.1.5"` |
| `versioning.ios` | String | `"2.1.3"` |
| `smtp.fromName` | String | `"Toprise Support"` |
| `smtp.fromEmail` | String | `"noreply@toprise.in"` |
| `smtp.host` | String | `"smtp.gmail.com"` |
| `smtp.port` | Number | `587`, `465` |
| `smtp.secure` | Boolean | `true`, `false` |
| `smtp.auth.user` | String | `"email@gmail.com"` |
| `smtp.auth.pass` | String | `"app-password"` |
| `servicableAreas` | Array | `[{lat: 28.7041, long: 77.1025}]` |
| `tnc` | String | `"Terms text..."` |
| `privacyPolicy` | String | `"Policy text..."` |

---

## Response Codes

- **200** - Successfully updated
- **404** - Settings not found (create first)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **500** - Server error

---

## Tips

1. **Update only what you need** - All fields are optional
2. **For nested objects** - Provide complete object to avoid data loss
3. **Arrays are replaced** - Not merged, provide complete array
4. **Use proper data types** - Numbers for charges, Strings for text
5. **Test in development** - Verify changes before production

---

## Full Documentation
See `UPDATE_APP_SETTINGS_REQUEST_BODY.md` for complete details, frontend integration examples, and React components.
