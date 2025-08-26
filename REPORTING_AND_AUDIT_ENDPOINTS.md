# Reporting & Audit Logs API Endpoints

## 📊 **Complete Reporting & Audit Logs Reference**

This document contains **ALL** reporting and audit log endpoints from your three services for frontend integration.

---

## 🔐 **Authentication Required**

For all endpoints, include:
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
-H "Content-Type: application/json"
```

---

## 📦 **Order Service - Reporting & Audit (Port 5002)**

### **1. SLA Violation Reports**

#### **Get SLA Violation Statistics**
```bash
# Basic statistics
curl -X GET "http://localhost:5002/api/sla-violations?groupBy=dealer&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With enhanced details (includes dealer, order, employee info)
curl -X GET "http://localhost:5002/api/sla-violations?includeDetails=true&groupBy=dealer&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Group by date
curl -X GET "http://localhost:5002/api/sla-violations?groupBy=date&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Group by month
curl -X GET "http://localhost:5002/api/sla-violations?groupBy=month&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Dealers with Multiple Violations**
```bash
# Get dealers with 3+ violations
curl -X GET "http://localhost:5002/api/sla-violations/multiple-violations?minViolations=3&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Include disabled dealers
curl -X GET "http://localhost:5002/api/sla-violations/multiple-violations?minViolations=3&includeDisabled=true&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get SLA Violation Trends**
```bash
# Daily trends for last 30 days
curl -X GET "http://localhost:5002/api/sla-violations/trends?period=30d&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Weekly trends for last 90 days
curl -X GET "http://localhost:5002/api/sla-violations/trends?period=90d&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Available periods: 7d, 30d, 90d, 1y
```

#### **Get Top Violating Dealers**
```bash
# Top 10 dealers by violations
curl -X GET "http://localhost:5002/api/sla-violations/top-violators?limit=10&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sort by violation minutes
curl -X GET "http://localhost:5002/api/sla-violations/top-violators?sortBy=minutes&limit=10&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sort by average violation minutes
curl -X GET "http://localhost:5002/api/sla-violations/top-violators?sortBy=avgMinutes&limit=10&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get SLA Violation Summary**
```bash
# Complete summary with analytics
curl -X GET "http://localhost:5002/api/sla-violations/summary?includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date range
curl -X GET "http://localhost:5002/api/sla-violations/summary?startDate=2024-01-01&endDate=2024-12-31&includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Detailed Violation Information**
```bash
# Get comprehensive violation details
curl -X GET "http://localhost:5002/api/sla-violations/violation/VIOLATION_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Order Analytics & Performance Reports**

#### **Get Order Analytics**
```bash
# Complete order analytics
curl -X GET "http://localhost:5002/api/analytics/orders?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With specific filters
curl -X GET "http://localhost:5002/api/analytics/orders?startDate=2024-01-01&endDate=2024-12-31&status=Processing" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Dealer Analytics**
```bash
# Analytics for specific dealer
curl -X GET "http://localhost:5002/api/analytics/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Dealer Performance Reports**
```bash
# Overall dealer performance
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# SLA performance specifically
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance/sla" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Fulfillment performance
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance/fulfillment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Export performance data
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Order Audit Logs**

#### **Get All Order Audit Logs**
```bash
# Get all order audit logs
curl -X GET "http://localhost:5002/api/orders/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date filtering
curl -X GET "http://localhost:5002/api/orders/audit-logs?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by action
curl -X GET "http://localhost:5002/api/orders/audit-logs?page=1&limit=10&action=ORDER_CREATED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Dealer-Specific Order Audit Logs**
```bash
# Get audit logs for specific dealer
curl -X GET "http://localhost:5002/api/orders/dealer/DEALER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date range
curl -X GET "http://localhost:5002/api/orders/dealer/DEALER_ID/audit-logs?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Picklists and Scan Logs**

#### **Get Dealer Picklists**
```bash
# Get picklists for dealer
curl -X GET "http://localhost:5002/api/orders/picklists/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Dealer Scan Logs**
```bash
# Get scan logs for dealer
curl -X GET "http://localhost:5002/api/orders/scanlogs/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 👥 **User Service - Reporting & Audit (Port 5001)**

### **1. User Statistics & Insights**

#### **Get User Statistics**
```bash
# Complete user statistics
curl -X GET "http://localhost:5001/api/users/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get User Insights**
```bash
# User insights and analytics
curl -X GET "http://localhost:5001/api/users/insights" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get User Counts**
```bash
# Detailed user counts by role
curl -X GET "http://localhost:5001/api/users/user/stats/userCounts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Employee Statistics**

#### **Get Employee Statistics**
```bash
# Employee performance statistics
curl -X GET "http://localhost:5001/api/users/employee/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Dealer Statistics**

#### **Get Dealer Statistics**
```bash
# Dealer performance statistics
curl -X GET "http://localhost:5001/api/users/dealer/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. User Audit Logs**

#### **Get User-Specific Audit Logs**
```bash
# Get audit logs for specific user
curl -X GET "http://localhost:5001/api/users/USER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date filtering
curl -X GET "http://localhost:5001/api/users/USER_ID/audit-logs?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by action
curl -X GET "http://localhost:5001/api/users/USER_ID/audit-logs?page=1&limit=10&action=USER_CREATED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Dealer Audit Logs**
```bash
# Get audit logs for specific dealer
curl -X GET "http://localhost:5001/api/users/dealer/DEALER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date range
curl -X GET "http://localhost:5001/api/users/dealer/DEALER_ID/audit-logs?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by action
curl -X GET "http://localhost:5001/api/users/dealer/DEALER_ID/audit-logs?page=1&limit=10&action=DEALER_CREATED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Employee Audit Logs**
```bash
# Get audit logs for specific employee
curl -X GET "http://localhost:5001/api/users/employee/EMPLOYEE_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date filtering
curl -X GET "http://localhost:5001/api/users/employee/EMPLOYEE_ID/audit-logs?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by action
curl -X GET "http://localhost:5001/api/users/employee/EMPLOYEE_ID/audit-logs?page=1&limit=10&action=EMPLOYEE_CREATED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🛍️ **Product Service - Reporting & Audit (Port 5003)**

### **1. Product Analytics**

#### **Get Product Analytics**
```bash
# Complete product analytics
curl -X GET "http://localhost:5003/api/products/analytics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Category Analytics**

#### **Get Category Analytics**
```bash
# Category performance analytics
curl -X GET "http://localhost:5003/api/categories/analytics?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Product Audit Logs**

#### **Get Product Audit Logs**
```bash
# Get all product audit logs
curl -X GET "http://localhost:5003/api/products/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date filtering
curl -X GET "http://localhost:5003/api/products/audit-logs?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by action
curl -X GET "http://localhost:5003/api/products/audit-logs?page=1&limit=10&action=PRODUCT_CREATED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Category Audit Logs**

#### **Get Category Audit Logs**
```bash
# Get all category audit logs
curl -X GET "http://localhost:5003/api/categories/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With date filtering
curl -X GET "http://localhost:5003/api/categories/audit-logs?page=1&limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by action
curl -X GET "http://localhost:5003/api/categories/audit-logs?page=1&limit=10&action=CATEGORY_CREATED" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 **Query Parameters for All Endpoints**

### **Pagination**
```bash
?page=1&limit=10
```

### **Date Filtering**
```bash
?startDate=2024-01-01&endDate=2024-12-31
```

### **Enhanced Details**
```bash
?includeDetails=true
```

### **Action Filtering (Audit Logs)**
```bash
?action=ORDER_CREATED
?action=USER_CREATED
?action=DEALER_CREATED
?action=EMPLOYEE_CREATED
?action=PRODUCT_CREATED
?action=CATEGORY_CREATED
```

### **Status Filtering**
```bash
?status=Processing
?status=Completed
?status=Failed
```

---

## 📈 **Response Formats**

### **SLA Violation Statistics Response**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalViolations": 150,
      "totalViolationMinutes": 4500,
      "avgViolationMinutes": 30,
      "maxViolationMinutes": 120,
      "resolvedViolations": 100,
      "unresolvedViolations": 50,
      "uniqueDealerCount": 25,
      "uniqueOrderCount": 120,
      "resolutionRate": 67
    },
    "data": [
      {
        "dealerId": "dealer_id",
        "dealerInfo": {
          "_id": "dealer_id",
          "trade_name": "Dealer Name",
          "legal_name": "Legal Business Name",
          "email": "dealer@example.com",
          "assignedEmployees": [
            {
              "employeeId": "employee_id",
              "assignedAt": "2024-01-01T00:00:00.000Z",
              "status": "Active",
              "employeeDetails": {
                "_id": "employee_id",
                "name": "Employee Name",
                "email": "employee@example.com",
                "role": "Fulfillment-Staff"
              }
            }
          ],
          "employeeCount": 1
        },
        "orderDetails": [
          {
            "_id": "order_id",
            "orderSummary": {
              "totalSKUs": 5,
              "totalAmount": 1000,
              "customerName": "Customer Name",
              "orderStatus": "Processing"
            }
          }
        ],
        "totalViolations": 5,
        "totalViolationMinutes": 150,
        "avgViolationMinutes": 30,
        "maxViolationMinutes": 60,
        "resolvedViolations": 3,
        "unresolvedViolations": 2,
        "firstViolation": "2024-01-01T00:00:00.000Z",
        "lastViolation": "2024-01-15T00:00:00.000Z",
        "violationRate": 40
      }
    ]
  },
  "message": "SLA violation statistics fetched successfully"
}
```

### **Audit Logs Response**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "audit_log_id",
        "action": "ORDER_CREATED",
        "actorId": "user_id",
        "actorRole": "Super-admin",
        "actorName": "Admin User",
        "targetId": "order_id",
        "targetIdentifier": "ORDER-12345",
        "details": {
          "customerName": "John Doe",
          "totalAmount": 200,
          "orderStatus": "Pending"
        },
        "category": "ORDER_MANAGEMENT",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  },
  "message": "Audit logs fetched successfully"
}
```

### **User Statistics Response**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "activeUsers": 850,
    "inactiveUsers": 150,
    "userGrowth": 15.5,
    "roleDistribution": {
      "Super-admin": 5,
      "Fulfillment-Admin": 20,
      "Fulfillment-Staff": 150,
      "Inventory-Admin": 15,
      "Inventory-Staff": 100,
      "Dealer": 200,
      "User": 500,
      "Customer-Support": 10
    },
    "recentActivity": {
      "newUsers": 25,
      "activeUsers": 180,
      "loginCount": 450
    }
  },
  "message": "User statistics fetched successfully"
}
```

---

## 🎯 **Most Important Reporting Endpoints**

### **Dashboard KPIs**
1. **SLA Violation Summary** - `GET /api/sla-violations/summary`
2. **Dealers with Multiple Violations** - `GET /api/sla-violations/multiple-violations`
3. **User Statistics** - `GET /api/users/stats`
4. **Dealer Statistics** - `GET /api/users/dealer/stats`
5. **Employee Statistics** - `GET /api/users/employee/stats`

### **Detailed Reports**
1. **SLA Violation Trends** - `GET /api/sla-violations/trends`
2. **Top Violating Dealers** - `GET /api/sla-violations/top-violators`
3. **Order Analytics** - `GET /api/analytics/orders`
4. **Dealer Performance** - `GET /api/orders/dealers/{id}/performance`

### **Audit Trails**
1. **Order Audit Logs** - `GET /api/orders/audit-logs`
2. **User Audit Logs** - `GET /api/users/{id}/audit-logs`
3. **Dealer Audit Logs** - `GET /api/users/dealer/{id}/audit-logs`
4. **Employee Audit Logs** - `GET /api/users/employee/{id}/audit-logs`

---

## 📱 **Frontend Integration Examples**

### **React/JavaScript Dashboard**
```javascript
// API client for reporting
const reportingAPI = {
  // SLA Reports
  getSLAViolationSummary: () => 
    fetch('http://localhost:5002/api/sla-violations/summary?includeDetails=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  getDealersWithViolations: () => 
    fetch('http://localhost:5002/api/sla-violations/multiple-violations?includeDetails=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  getSLAViolationTrends: (period = '30d') => 
    fetch(`http://localhost:5002/api/sla-violations/trends?period=${period}&includeDetails=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  // User Reports
  getUserStats: () => 
    fetch('http://localhost:5001/api/users/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  getDealerStats: () => 
    fetch('http://localhost:5001/api/users/dealer/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  // Audit Logs
  getOrderAuditLogs: (params = {}) => 
    fetch(`http://localhost:5002/api/orders/audit-logs?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),
  
  getUserAuditLogs: (userId, params = {}) => 
    fetch(`http://localhost:5001/api/users/${userId}/audit-logs?${new URLSearchParams(params)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json())
};

// Usage in React component
const Dashboard = () => {
  const [slaSummary, setSLASummary] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [slaData, userData, auditData] = await Promise.all([
        reportingAPI.getSLAViolationSummary(),
        reportingAPI.getUserStats(),
        reportingAPI.getOrderAuditLogs({ page: 1, limit: 10 })
      ]);
      
      setSLASummary(slaData.data);
      setUserStats(userData.data);
      setAuditLogs(auditData.data.logs);
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div>
      {/* Dashboard components */}
    </div>
  );
};
```

### **Python/Django Backend**
```python
import requests

class ReportingService:
    def __init__(self, token):
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_sla_violation_summary(self):
        response = requests.get(
            'http://localhost:5002/api/sla-violations/summary?includeDetails=true',
            headers=self.headers
        )
        return response.json()
    
    def get_dealers_with_violations(self):
        response = requests.get(
            'http://localhost:5002/api/sla-violations/multiple-violations?includeDetails=true',
            headers=self.headers
        )
        return response.json()
    
    def get_user_stats(self):
        response = requests.get(
            'http://localhost:5001/api/users/stats',
            headers=self.headers
        )
        return response.json()
    
    def get_audit_logs(self, service, entity_id=None, params=None):
        if service == 'orders':
            url = 'http://localhost:5002/api/orders/audit-logs'
        elif service == 'users':
            url = f'http://localhost:5001/api/users/{entity_id}/audit-logs'
        elif service == 'dealers':
            url = f'http://localhost:5001/api/users/dealer/{entity_id}/audit-logs'
        
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()

# Usage
reporting = ReportingService('your_jwt_token')
sla_summary = reporting.get_sla_violation_summary()
user_stats = reporting.get_user_stats()
audit_logs = reporting.get_audit_logs('orders', params={'page': 1, 'limit': 10})
```

---

## 🚨 **Error Handling**

### **Common Error Responses**
```json
{
  "success": false,
  "error": "Unauthorized access",
  "details": "Invalid or expired token"
}
```

### **Rate Limiting**
- **Analytics endpoints**: 20 requests per minute
- **Audit log endpoints**: 50 requests per minute
- **Statistics endpoints**: 30 requests per minute

---

*This document contains ALL reporting and audit log endpoints from your three services. Use these endpoints to build comprehensive dashboards and reporting systems.*
