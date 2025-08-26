# Quick API Reference - Most Common Endpoints

## 🔐 Authentication

```bash
# Login
curl -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Get JWT token from response and use in all subsequent requests
```

## 📦 Order Service (Port 5002)

### Core Order Operations
```bash
# Get all orders
curl -X GET "http://localhost:5002/api/orders?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get order by ID
curl -X GET "http://localhost:5002/api/orders/ORDER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create order
curl -X POST "http://localhost:5002/api/orders" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customerDetails": {...}, "skus": [...], "totalAmount": 200}'

# Update order status
curl -X PUT "http://localhost:5002/api/orders/ORDER_ID/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Processing"}'
```

### SLA Violation Reports
```bash
# Get SLA violation statistics
curl -X GET "http://localhost:5002/api/sla-violations?includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get dealers with multiple violations
curl -X GET "http://localhost:5002/api/sla-violations/multiple-violations?includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get SLA violation summary
curl -X GET "http://localhost:5002/api/sla-violations/summary?includeDetails=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Analytics
```bash
# Get order analytics
curl -X GET "http://localhost:5002/api/analytics/orders?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get dealer performance
curl -X GET "http://localhost:5002/api/orders/dealers/DEALER_ID/performance" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 👥 User Service (Port 5001)

### User Management
```bash
# Get all users
curl -X GET "http://localhost:5001/api/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get user by ID
curl -X GET "http://localhost:5001/api/users/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create user (admin only)
curl -X POST "http://localhost:5001/api/users/createUser" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New User", "email": "user@example.com", "password": "password123"}'
```

### Employee Management
```bash
# Get all employees
curl -X GET "http://localhost:5001/api/users/getemployees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get employee details
curl -X GET "http://localhost:5001/api/users/employee/EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create employee
curl -X POST "http://localhost:5001/api/users/create-Employee" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Employee", "email": "employee@example.com", "role": "Fulfillment-Staff"}'
```

### Dealer Management
```bash
# Get all dealers
curl -X GET "http://localhost:5001/api/users/dealers" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get dealer by ID
curl -X GET "http://localhost:5001/api/users/dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create dealer
curl -X POST "http://localhost:5001/api/users/dealer" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"trade_name": "Dealer Name", "email": "dealer@example.com"}'

# Disable dealer
curl -X PATCH "http://localhost:5001/api/users/disable-dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Performance issues"}'
```

### Employee Assignment
```bash
# Assign employees to dealer
curl -X POST "http://localhost:5001/api/users/dealers/DEALER_ID/assign-employees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"employeeIds": ["EMPLOYEE_ID_1", "EMPLOYEE_ID_2"]}'

# Get dealer assigned employees
curl -X GET "http://localhost:5001/api/users/dealers/DEALER_ID/assigned-employees" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Statistics
```bash
# Get user stats
curl -X GET "http://localhost:5001/api/users/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get dealer stats
curl -X GET "http://localhost:5001/api/users/dealer/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get employee stats
curl -X GET "http://localhost:5001/api/users/employee/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🛍️ Product Service (Port 5003)

### Product Management
```bash
# Get all products
curl -X GET "http://localhost:5003/api/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get product by ID
curl -X GET "http://localhost:5003/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create product
curl -X POST "http://localhost:5003/api/products" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Product", "price": 100, "category": "Electronics"}'

# Update product
curl -X PUT "http://localhost:5003/api/products/PRODUCT_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Product", "price": 150}'
```

### Category Management
```bash
# Get all categories
curl -X GET "http://localhost:5003/api/categories" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create category
curl -X POST "http://localhost:5003/api/categories" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Electronics", "description": "Electronic products"}'
```

### Dealer-Product Assignment
```bash
# Get products by dealer
curl -X GET "http://localhost:5003/api/products/get-products-by-dealer/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Assign dealer to product
curl -X POST "http://localhost:5003/api/products/assign/dealer/PRODUCT_ID/DEALER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Audit Logs (All Services)

```bash
# Order audit logs
curl -X GET "http://localhost:5002/api/orders/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# User audit logs
curl -X GET "http://localhost:5001/api/users/USER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Dealer audit logs
curl -X GET "http://localhost:5001/api/users/dealer/DEALER_ID/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Product audit logs
curl -X GET "http://localhost:5003/api/products/audit-logs?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Common Headers

```bash
# For all authenticated requests
-H "Authorization: Bearer YOUR_JWT_TOKEN"
-H "Content-Type: application/json"
```

## 📝 Query Parameters

```bash
# Pagination
?page=1&limit=10

# Date filtering
?startDate=2024-01-01&endDate=2024-12-31

# Include enhanced details
?includeDetails=true

# Status filtering
?status=Processing

# Category filtering
?category=Electronics
```

## 🚨 Error Handling

```json
// Error Response
{
  "success": false,
  "error": "Error message"
}

// Success Response
{
  "success": true,
  "data": {},
  "message": "Success message"
}
```

## 📱 Frontend Integration Examples

### JavaScript/React
```javascript
// API client setup
const API_BASE_URLS = {
  order: 'http://localhost:5002',
  user: 'http://localhost:5001',
  product: 'http://localhost:5003'
};

const apiClient = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    return response.json();
  },

  // Order APIs
  getOrders: (params) => apiClient.request(`${API_BASE_URLS.order}/api/orders?${new URLSearchParams(params)}`),
  getSLAViolations: (params) => apiClient.request(`${API_BASE_URLS.order}/api/sla-violations?${new URLSearchParams(params)}`),
  
  // User APIs
  getUsers: (params) => apiClient.request(`${API_BASE_URLS.user}/api/users?${new URLSearchParams(params)}`),
  getDealers: () => apiClient.request(`${API_BASE_URLS.user}/api/users/dealers`),
  getEmployees: () => apiClient.request(`${API_BASE_URLS.user}/api/users/getemployees`),
  
  // Product APIs
  getProducts: (params) => apiClient.request(`${API_BASE_URLS.product}/api/products?${new URLSearchParams(params)}`)
};

// Usage in React components
const [orders, setOrders] = useState([]);
const [slaViolations, setSLAViolations] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    const ordersData = await apiClient.getOrders({ page: 1, limit: 10 });
    const slaData = await apiClient.getSLAViolations({ includeDetails: true });
    
    setOrders(ordersData.data);
    setSLAViolations(slaData.data);
  };
  
  fetchData();
}, []);
```

### Python/Django
```python
import requests

class APIClient:
    def __init__(self, token):
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_orders(self, params=None):
        response = requests.get(
            'http://localhost:5002/api/orders',
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def get_sla_violations(self, params=None):
        response = requests.get(
            'http://localhost:5002/api/sla-violations',
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def get_dealers(self):
        response = requests.get(
            'http://localhost:5001/api/users/dealers',
            headers=self.headers
        )
        return response.json()

# Usage
client = APIClient('your_jwt_token')
orders = client.get_orders({'page': 1, 'limit': 10})
sla_violations = client.get_sla_violations({'includeDetails': 'true'})
dealers = client.get_dealers()
```

---

## 🎯 Most Important Endpoints for Dashboard

1. **SLA Violation Summary** - `GET /api/sla-violations/summary`
2. **Dealers with Multiple Violations** - `GET /api/sla-violations/multiple-violations`
3. **Order Analytics** - `GET /api/analytics/orders`
4. **User Statistics** - `GET /api/users/stats`
5. **Dealer Statistics** - `GET /api/users/dealer/stats`
6. **Employee Statistics** - `GET /api/users/employee/stats`

---

*For complete API documentation, see `COMPLETE_API_REFERENCE.md`*
