# Complete cURL Commands for Testing Analytics Dashboard, Audit Logs, and Reports APIs

## Setup Instructions

**Base URL:** `http://localhost:5001`

**Authentication:** Replace the following placeholders with actual values:
- `YOUR_JWT_TOKEN`: Valid JWT token for authenticated user (contains role information in the token)
- `YOUR_REPORT_ID`: Report ID obtained from generate report response
- `dealer123`, `SKU001`, etc.: Actual IDs from your test data

**Note:** The JWT token contains role information, so the same token will work for all endpoints based on the user's role.

---

## 1. Analytics Dashboard API (`/api/analytics`)

### 1.1. Get Role-Based Dashboard
```bash
curl -X GET "http://localhost:5001/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31&dealerId=dealer123&region=Mumbai" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.2. Get Comprehensive KPIs
```bash
curl -X GET "http://localhost:5001/api/analytics/kpis?startDate=2024-01-01&endDate=2024-01-31" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.3. Get Trend Comparison
```bash
curl -X GET "http://localhost:5001/api/analytics/trends?metric=orders&period=monthly&compareWith=previous_period&startDate=2024-01-01&endDate=2024-01-31" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.4. Export Dashboard Data
```bash
curl -X POST "http://localhost:5001/api/analytics/export" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "format": "CSV",
  "dashboardType": "orders",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "dealerId": "dealer123"
  }
}'
```

### 1.5. Get Fulfillment Analytics (Requires Fulfilment Admin or Super Admin role)
```bash
curl -X GET "http://localhost:5001/api/analytics/fulfillment?startDate=2024-01-01&endDate=2024-01-31" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.6. Get Inventory Analytics (Requires Inventory Admin or Super Admin role)
```bash
curl -X GET "http://localhost:5001/api/analytics/inventory?startDate=2024-01-01&endDate=2024-01-31&product=SKU001" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.7. Get Dealer Analytics (Requires Dealer, Fulfilment Admin, or Super Admin role)
```bash
curl -X GET "http://localhost:5001/api/analytics/dealer/dealer123?startDate=2024-01-01&endDate=2024-01-31" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.8. Get Real-Time Order Statistics
```bash
curl -X GET "http://localhost:5001/api/analytics/realtime/orders" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.9. Get Real-Time Alerts (Requires Fulfilment Admin, Inventory Admin, or Super Admin role)
```bash
curl -X GET "http://localhost:5001/api/analytics/realtime/alerts" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 1.10. Get Comparative Analytics
```bash
curl -X GET "http://localhost:5001/api/analytics/compare?metric=orders&period1=2024-01-01,2024-01-31&period2=2023-12-01,2023-12-31&comparisonType=percentage" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 2. Audit Logs API (`/api/analytics/audit-logs`)

### 2.1. Get Audit Logs (Requires Super Admin or System role)
```bash
curl -X GET "http://localhost:5001/api/analytics/audit-logs?page=1&limit=10&category=ORDER_MANAGEMENT&severity=HIGH&startDate=2024-01-01" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2.2. Get Audit Statistics (Requires Super Admin or System role)
```bash
curl -X GET "http://localhost:5001/api/analytics/audit-stats?startDate=2024-01-01&endDate=2024-01-31" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 3. Reports API (`/api/reports`)

### 3.1. Generate Report
```bash
curl -X POST "http://localhost:5001/api/reports/generate" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "name": "Monthly Order Analytics",
  "type": "ORDER_ANALYTICS",
  "parameters": {
    "includeRevenue": true,
    "includeSLA": true
  },
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "scope": {
    "dealers": ["dealer123"],
    "regions": ["Mumbai"],
    "products": ["SKU001"]
  },
  "format": "CSV",
  "isRecurring": false
}'
```

### 3.2. Get Report Templates
```bash
curl -X GET "http://localhost:5001/api/reports/templates" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.3. Get Reports List
```bash
curl -X GET "http://localhost:5001/api/reports?page=1&limit=5&status=COMPLETED&type=ORDER_ANALYTICS" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.4. Get Specific Report Details
```bash
curl -X GET "http://localhost:5001/api/reports/YOUR_REPORT_ID" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.5. Download Report Information
```bash
curl -X GET "http://localhost:5001/api/reports/YOUR_REPORT_ID/download" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.6. Serve Report File for Download
```bash
curl -X GET "http://localhost:5001/api/reports/YOUR_REPORT_ID/file" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" -o "downloaded_report.csv"
```

### 3.7. Update Report Access Control
```bash
curl -X PUT "http://localhost:5001/api/reports/YOUR_REPORT_ID/access" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "roles": ["Fulfilment Admin"],
  "users": ["user123", "user456"],
  "isPublic": false
}'
```

### 3.8. Delete Report (Soft Delete)
```bash
curl -X DELETE "http://localhost:5001/api/reports/YOUR_REPORT_ID" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.9. Get Scheduled Reports (Requires Super Admin, Fulfilment Admin, or Inventory Admin role)
```bash
curl -X GET "http://localhost:5001/api/reports/scheduled" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3.10. Update Report Schedule (Requires Super Admin, Fulfilment Admin, or Inventory Admin role)
```bash
curl -X POST "http://localhost:5001/api/reports/YOUR_REPORT_ID/schedule" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "isRecurring": true,
  "frequency": "WEEKLY"
}'
```

### 3.11. Bulk Generate Reports (Requires Super Admin, Fulfilment Admin, or Inventory Admin role)
```bash
curl -X POST "http://localhost:5001/api/reports/bulk-generate" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "reports": [
    {
      "name": "Daily Orders Report - Jan 24",
      "type": "ORDER_ANALYTICS",
      "format": "CSV",
      "dateRange": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
    },
    {
      "name": "Weekly SLA Report - Feb 24",
      "type": "SLA_COMPLIANCE",
      "format": "PDF",
      "dateRange": { "startDate": "2024-02-01", "endDate": "2024-02-29" }
    }
  ]
}'
```

### 3.12. Bulk Delete Reports
```bash
curl -X POST "http://localhost:5001/api/reports/bulk-delete" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "reportIds": ["report-id-1", "report-id-2"]
}'
```

### 3.13. Get Report Usage Analytics (Requires Super Admin role)
```bash
curl -X GET "http://localhost:5001/api/reports/analytics/usage?startDate=2024-01-01&endDate=2024-01-31" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 4. Additional Test Scenarios

### 4.1. Test Different Report Types
```bash
# SLA Compliance Report
curl -X POST "http://localhost:5001/api/reports/generate" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "name": "SLA Compliance Report",
  "type": "SLA_COMPLIANCE",
  "format": "PDF",
  "dateRange": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
}'

# Return Analytics Report
curl -X POST "http://localhost:5001/api/reports/generate" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "name": "Return Analytics Report",
  "type": "RETURN_ANALYTICS",
  "format": "EXCEL",
  "dateRange": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
}'

# Dealer Performance Report
curl -X POST "http://localhost:5001/api/reports/generate" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "name": "Dealer Performance Report",
  "type": "DEALER_PERFORMANCE",
  "format": "CSV",
  "dateRange": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
}'
```

### 4.2. Test Different Export Formats
```bash
# Export as PNG (for charts)
curl -X POST "http://localhost:5001/api/analytics/export" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "format": "PNG",
  "dashboardType": "orders",
  "filters": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
}'

# Export as JSON
curl -X POST "http://localhost:5001/api/analytics/export" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "format": "JSON",
  "dashboardType": "orders",
  "filters": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
}'
```

### 4.3. Test Error Scenarios
```bash
# Test without authentication
curl -X GET "http://localhost:5001/api/analytics/dashboard"

# Test with invalid role
curl -X GET "http://localhost:5001/api/analytics/audit-logs" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with invalid date format
curl -X GET "http://localhost:5001/api/analytics/dashboard?startDate=invalid-date" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test with invalid report type
curl -X POST "http://localhost:5001/api/reports/generate" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "name": "Invalid Report",
  "type": "INVALID_TYPE",
  "format": "CSV"
}'
```

---

## 5. Testing Workflow

### Step 1: Generate a Report
```bash
curl -X POST "http://localhost:5001/api/reports/generate" \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "name": "Test Report",
  "type": "ORDER_ANALYTICS",
  "format": "CSV",
  "dateRange": { "startDate": "2024-01-01", "endDate": "2024-01-31" }
}'
```

### Step 2: Get Report ID from Response
Extract the `reportId` from the response and use it in subsequent calls.

### Step 3: Check Report Status
```bash
curl -X GET "http://localhost:5001/api/reports/REPORT_ID_FROM_STEP_2" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 4: Download Report
```bash
curl -X GET "http://localhost:5001/api/reports/REPORT_ID_FROM_STEP_2/file" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" -o "test_report.csv"
```

### Step 5: Clean Up
```bash
curl -X DELETE "http://localhost:5001/api/reports/REPORT_ID_FROM_STEP_2" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 6. Environment-Specific Commands

### For Development Environment
```bash
# Base URL for development
BASE_URL="http://localhost:5001"
```

### For Staging Environment
```bash
# Base URL for staging
BASE_URL="https://staging-api.toprise.com"
```

### For Production Environment
```bash
# Base URL for production
BASE_URL="https://api.toprise.com"
```

Replace `http://localhost:5001` in all commands above with the appropriate `BASE_URL` for your environment.

---

## 7. Common Response Codes

- `200`: Success
- `201`: Created (for report generation)
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (report not found)
- `500`: Internal Server Error

---

## 8. Notes

1. **Authentication**: All endpoints require a valid JWT token in the Authorization header
2. **Role-Based Access**: Different endpoints require specific user roles
3. **Report Generation**: Reports are generated asynchronously; check status before downloading
4. **File Downloads**: Use the `-o` flag to save downloaded files
5. **Date Formats**: Use ISO 8601 format (YYYY-MM-DD) for dates
6. **Rate Limiting**: Be mindful of API rate limits in production environments
