# SLA Violation Statistics - Quick Test Commands

This guide provides curl commands for manually testing the SLA violation statistics endpoints.

## Prerequisites

1. Set your JWT token:
```bash
export TOKEN="your-jwt-token-here"
```

2. Set the base URL:
```bash
export BASE_URL="http://localhost:5001"
```

## 1. Get SLA Violation Statistics

### Basic statistics
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Group by dealer
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats?groupBy=dealer" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Group by date
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats?groupBy=date" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Group by month
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats?groupBy=month" \
  -H "Authorization: Bearer ${TOKEN}"
```

### With date filtering
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer ${TOKEN}"
```

### For specific dealer
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats?dealerId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 2. Get Dealers with Multiple Violations

### Default (3+ violations)
```bash
curl -X GET "${BASE_URL}/api/sla-violations/dealers-with-violations" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Custom minimum violations
```bash
curl -X GET "${BASE_URL}/api/sla-violations/dealers-with-violations?minViolations=5" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Include disabled dealers
```bash
curl -X GET "${BASE_URL}/api/sla-violations/dealers-with-violations?includeDisabled=true" \
  -H "Authorization: Bearer ${TOKEN}"
```

### With date filtering
```bash
curl -X GET "${BASE_URL}/api/sla-violations/dealers-with-violations?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 3. Disable Dealer for Violations

```bash
curl -X PUT "${BASE_URL}/api/sla-violations/disable-dealer/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Multiple SLA violations",
    "adminNotes": "Dealer has consistently failed to meet SLA requirements"
  }'
```

## 4. Get SLA Violation Trends

### Last 30 days (default)
```bash
curl -X GET "${BASE_URL}/api/sla-violations/trends" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Last 7 days
```bash
curl -X GET "${BASE_URL}/api/sla-violations/trends?period=7d" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Last 90 days
```bash
curl -X GET "${BASE_URL}/api/sla-violations/trends?period=90d" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Last year
```bash
curl -X GET "${BASE_URL}/api/sla-violations/trends?period=1y" \
  -H "Authorization: Bearer ${TOKEN}"
```

### For specific dealer
```bash
curl -X GET "${BASE_URL}/api/sla-violations/trends?dealerId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 5. Get Top Violating Dealers

### Top 10 (default)
```bash
curl -X GET "${BASE_URL}/api/sla-violations/top-violators" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Top 5
```bash
curl -X GET "${BASE_URL}/api/sla-violations/top-violators?limit=5" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Sort by violations (default)
```bash
curl -X GET "${BASE_URL}/api/sla-violations/top-violators?sortBy=violations" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Sort by total minutes
```bash
curl -X GET "${BASE_URL}/api/sla-violations/top-violators?sortBy=minutes" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Sort by average minutes
```bash
curl -X GET "${BASE_URL}/api/sla-violations/top-violators?sortBy=avgMinutes" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Sort by most recent
```bash
curl -X GET "${BASE_URL}/api/sla-violations/top-violators?sortBy=recent" \
  -H "Authorization: Bearer ${TOKEN}"
```

### With date filtering
```bash
curl -X GET "${BASE_URL}/api/sla-violations/top-violators?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 6. Resolve SLA Violation

```bash
curl -X PUT "${BASE_URL}/api/sla-violations/resolve/507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionNotes": "Issue resolved with dealer"
  }'
```

## 7. Get SLA Violation Dashboard

```bash
curl -X GET "${BASE_URL}/api/sla-violations/dashboard" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 8. Get SLA Violation Alerts

```bash
curl -X GET "${BASE_URL}/api/sla-violations/alerts" \
  -H "Authorization: Bearer ${TOKEN}"
```

## 9. Bulk Disable Dealers (Super Admin Only)

```bash
curl -X POST "${BASE_URL}/api/sla-violations/bulk-disable" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "dealerIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
    "reason": "Bulk disable due to multiple violations",
    "adminNotes": "Automated bulk disable operation"
  }'
```

## 10. Test Error Handling

### Test without authentication
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats"
```

### Test with invalid token
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats" \
  -H "Authorization: Bearer invalid-token"
```

### Test with invalid dealer ID
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats?dealerId=invalid-id" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Test disable with insufficient violations
```bash
curl -X PUT "${BASE_URL}/api/sla-violations/disable-dealer/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test"
  }'
```

## 11. Health Check

```bash
curl -X GET "${BASE_URL}/health"
```

## 12. Batch Testing Script

Create a file called `test-sla-endpoints.sh`:

```bash
#!/bin/bash

# Set variables
TOKEN="your-jwt-token-here"
BASE_URL="http://localhost:5001"

echo "Testing SLA Violation Statistics Endpoints..."
echo "=============================================="

# Test 1: Get statistics
echo "1. Testing SLA violation statistics..."
curl -s -X GET "${BASE_URL}/api/sla-violations/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.success'

# Test 2: Get dealers with violations
echo "2. Testing dealers with violations..."
curl -s -X GET "${BASE_URL}/api/sla-violations/dealers-with-violations" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.success'

# Test 3: Get trends
echo "3. Testing SLA violation trends..."
curl -s -X GET "${BASE_URL}/api/sla-violations/trends" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.success'

# Test 4: Get top violators
echo "4. Testing top violating dealers..."
curl -s -X GET "${BASE_URL}/api/sla-violations/top-violators" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.success'

# Test 5: Get dashboard
echo "5. Testing SLA violation dashboard..."
curl -s -X GET "${BASE_URL}/api/sla-violations/dashboard" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.success'

# Test 6: Get alerts
echo "6. Testing SLA violation alerts..."
curl -s -X GET "${BASE_URL}/api/sla-violations/alerts" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.success'

echo "Testing completed!"
```

Make it executable and run:
```bash
chmod +x test-sla-endpoints.sh
./test-sla-endpoints.sh
```

## 13. Performance Testing

### Test with large date ranges
```bash
curl -X GET "${BASE_URL}/api/sla-violations/stats?startDate=2020-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer ${TOKEN}" \
  -w "Time: %{time_total}s\n"
```

### Test concurrent requests
```bash
for i in {1..10}; do
  curl -s -X GET "${BASE_URL}/api/sla-violations/stats" \
    -H "Authorization: Bearer ${TOKEN}" > /dev/null &
done
wait
echo "Concurrent requests completed"
```

## 14. Data Validation

### Check response structure
```bash
curl -s -X GET "${BASE_URL}/api/sla-violations/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq 'keys'
```

### Validate summary data
```bash
curl -s -X GET "${BASE_URL}/api/sla-violations/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.data.summary | keys'
```

### Check dealer information
```bash
curl -s -X GET "${BASE_URL}/api/sla-violations/dealers-with-violations" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.data.dealers[0] | keys'
```

## Notes

1. **Authentication**: All endpoints require a valid JWT token
2. **Role-based Access**: Different endpoints require different user roles
3. **Error Handling**: Check response status codes and error messages
4. **Data Validation**: Verify response structure and data types
5. **Performance**: Monitor response times for large datasets
6. **Audit Logging**: All actions are automatically logged

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check if token is valid and not expired
2. **403 Forbidden**: Verify user has required role permissions
3. **404 Not Found**: Check if dealer/violation IDs exist
4. **500 Internal Server Error**: Check server logs for details

### Debug Mode

Add verbose output to see full request/response:
```bash
curl -v -X GET "${BASE_URL}/api/sla-violations/stats" \
  -H "Authorization: Bearer ${TOKEN}"
```
