const axios = require('axios');

// Configuration
const CONFIG = {
  orderService: {
    baseURL: 'http://localhost:5003',
    endpoints: {
      dashboard: '/api/analytics/dashboard',
      logs: '/api/analytics/audit-logs',
      stats: '/api/analytics/audit-stats',
      export: '/api/analytics/export'
    }
  },
  productService: {
    baseURL: 'http://localhost:5002',
    endpoints: {
      dashboard: '/api/audit/dashboard',
      logs: '/api/audit/logs',
      stats: '/api/audit/stats',
      export: '/api/audit/export',
      actionLogs: '/api/audit/logs/action',
      userLogs: '/api/audit/logs/user',
      categoryLogs: '/api/audit/logs/category',
      bulkLogs: '/api/audit/logs/bulk'
    }
  },
  userService: {
    baseURL: 'http://localhost:5001',
    endpoints: {
      dashboard: '/api/audit/dashboard',
      logs: '/api/audit/logs',
      stats: '/api/audit/stats',
      export: '/api/audit/export',
      actionLogs: '/api/audit/logs/action',
      userLogs: '/api/audit/logs/user',
      categoryLogs: '/api/audit/logs/category',
      bulkLogs: '/api/audit/logs/bulk',
      loginAttempts: '/api/audit/logs/login-attempts',
      securityEvents: '/api/audit/logs/security-events'
    }
  }
};

// Test JWT token (replace with actual token)
const TEST_JWT_TOKEN = 'YOUR_TEST_JWT_TOKEN';

// Helper function to make authenticated requests
async function makeRequest(service, endpoint, params = {}) {
  try {
    const config = CONFIG[service];
    const url = `${config.baseURL}${config.endpoints[endpoint]}`;
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${TEST_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: params
    });
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message
    };
  }
}

// Test functions
async function testOrderServiceAudit() {
  console.log('\n=== Testing Order Service Audit Endpoints ===');
  
  // Test dashboard
  console.log('\n1. Testing audit dashboard...');
  const dashboard = await makeRequest('orderService', 'dashboard');
  console.log('Dashboard:', dashboard.success ? '✅ Success' : '❌ Failed');
  
  // Test audit logs
  console.log('\n2. Testing audit logs...');
  const logs = await makeRequest('orderService', 'logs', { page: 1, limit: 10 });
  console.log('Audit Logs:', logs.success ? '✅ Success' : '❌ Failed');
  
  // Test audit stats
  console.log('\n3. Testing audit stats...');
  const stats = await makeRequest('orderService', 'stats');
  console.log('Audit Stats:', stats.success ? '✅ Success' : '❌ Failed');
  
  // Test export
  console.log('\n4. Testing audit export...');
  const exportData = await makeRequest('orderService', 'export', { 
    startDate: '2024-01-01', 
    endDate: '2024-12-31' 
  });
  console.log('Audit Export:', exportData.success ? '✅ Success' : '❌ Failed');
}

async function testProductServiceAudit() {
  console.log('\n=== Testing Product Service Audit Endpoints ===');
  
  // Test dashboard
  console.log('\n1. Testing audit dashboard...');
  const dashboard = await makeRequest('productService', 'dashboard');
  console.log('Dashboard:', dashboard.success ? '✅ Success' : '❌ Failed');
  
  // Test audit logs
  console.log('\n2. Testing audit logs...');
  const logs = await makeRequest('productService', 'logs', { page: 1, limit: 10 });
  console.log('Audit Logs:', logs.success ? '✅ Success' : '❌ Failed');
  
  // Test audit stats
  console.log('\n3. Testing audit stats...');
  const stats = await makeRequest('productService', 'stats');
  console.log('Audit Stats:', stats.success ? '✅ Success' : '❌ Failed');
  
  // Test logs by action
  console.log('\n4. Testing logs by action...');
  const actionLogs = await makeRequest('productService', 'actionLogs', { 
    action: 'PRODUCT_CREATED' 
  });
  console.log('Action Logs:', actionLogs.success ? '✅ Success' : '❌ Failed');
  
  // Test logs by category
  console.log('\n5. Testing logs by category...');
  const categoryLogs = await makeRequest('productService', 'categoryLogs', { 
    category: 'PRODUCT_MANAGEMENT' 
  });
  console.log('Category Logs:', categoryLogs.success ? '✅ Success' : '❌ Failed');
  
  // Test export
  console.log('\n6. Testing audit export...');
  const exportData = await makeRequest('productService', 'export', { 
    startDate: '2024-01-01', 
    endDate: '2024-12-31' 
  });
  console.log('Audit Export:', exportData.success ? '✅ Success' : '❌ Failed');
}

async function testUserServiceAudit() {
  console.log('\n=== Testing User Service Audit Endpoints ===');
  
  // Test dashboard
  console.log('\n1. Testing audit dashboard...');
  const dashboard = await makeRequest('userService', 'dashboard');
  console.log('Dashboard:', dashboard.success ? '✅ Success' : '❌ Failed');
  
  // Test audit logs
  console.log('\n2. Testing audit logs...');
  const logs = await makeRequest('userService', 'logs', { page: 1, limit: 10 });
  console.log('Audit Logs:', logs.success ? '✅ Success' : '❌ Failed');
  
  // Test audit stats
  console.log('\n3. Testing audit stats...');
  const stats = await makeRequest('userService', 'stats');
  console.log('Audit Stats:', stats.success ? '✅ Success' : '❌ Failed');
  
  // Test logs by action
  console.log('\n4. Testing logs by action...');
  const actionLogs = await makeRequest('userService', 'actionLogs', { 
    action: 'USER_CREATED' 
  });
  console.log('Action Logs:', actionLogs.success ? '✅ Success' : '❌ Failed');
  
  // Test logs by category
  console.log('\n5. Testing logs by category...');
  const categoryLogs = await makeRequest('userService', 'categoryLogs', { 
    category: 'USER_MANAGEMENT' 
  });
  console.log('Category Logs:', categoryLogs.success ? '✅ Success' : '❌ Failed');
  
  // Test login attempts
  console.log('\n6. Testing login attempts...');
  const loginAttempts = await makeRequest('userService', 'loginAttempts', { 
    success: true 
  });
  console.log('Login Attempts:', loginAttempts.success ? '✅ Success' : '❌ Failed');
  
  // Test security events
  console.log('\n7. Testing security events...');
  const securityEvents = await makeRequest('userService', 'securityEvents');
  console.log('Security Events:', securityEvents.success ? '✅ Success' : '❌ Failed');
  
  // Test export
  console.log('\n8. Testing audit export...');
  const exportData = await makeRequest('userService', 'export', { 
    startDate: '2024-01-01', 
    endDate: '2024-12-31' 
  });
  console.log('Audit Export:', exportData.success ? '✅ Success' : '❌ Failed');
}

async function testAdvancedFiltering() {
  console.log('\n=== Testing Advanced Filtering ===');
  
  // Test date range filtering
  console.log('\n1. Testing date range filtering...');
  const dateFiltered = await makeRequest('productService', 'logs', {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    category: 'PRODUCT_MANAGEMENT',
    severity: 'HIGH'
  });
  console.log('Date Range Filter:', dateFiltered.success ? '✅ Success' : '❌ Failed');
  
  // Test multiple filters
  console.log('\n2. Testing multiple filters...');
  const multiFiltered = await makeRequest('userService', 'logs', {
    category: 'AUTHENTICATION',
    severity: 'MEDIUM',
    page: 1,
    limit: 20
  });
  console.log('Multiple Filters:', multiFiltered.success ? '✅ Success' : '❌ Failed');
  
  // Test pagination
  console.log('\n3. Testing pagination...');
  const paginated = await makeRequest('orderService', 'logs', {
    page: 2,
    limit: 5
  });
  console.log('Pagination:', paginated.success ? '✅ Success' : '❌ Failed');
}

async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  // Test invalid action
  console.log('\n1. Testing invalid action...');
  const invalidAction = await makeRequest('productService', 'actionLogs', { 
    action: 'INVALID_ACTION' 
  });
  console.log('Invalid Action:', invalidAction.success ? '✅ Success' : '❌ Expected Failure');
  
  // Test invalid category
  console.log('\n2. Testing invalid category...');
  const invalidCategory = await makeRequest('userService', 'categoryLogs', { 
    category: 'INVALID_CATEGORY' 
  });
  console.log('Invalid Category:', invalidCategory.success ? '✅ Success' : '❌ Expected Failure');
  
  // Test invalid date format
  console.log('\n3. Testing invalid date format...');
  const invalidDate = await makeRequest('orderService', 'logs', {
    startDate: 'invalid-date',
    endDate: 'invalid-date'
  });
  console.log('Invalid Date:', invalidDate.success ? '✅ Success' : '❌ Expected Failure');
}

async function testPerformance() {
  console.log('\n=== Testing Performance ===');
  
  const startTime = Date.now();
  
  // Test concurrent requests
  console.log('\n1. Testing concurrent requests...');
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('productService', 'logs', { page: 1, limit: 10 }));
  }
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.success).length;
  console.log(`Concurrent Requests: ${successCount}/5 successful`);
  
  const endTime = Date.now();
  console.log(`Performance Test Duration: ${endTime - startTime}ms`);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Audit Logging System Tests');
  console.log('==================================================');
  
  try {
    // Test all services
    await testOrderServiceAudit();
    await testProductServiceAudit();
    await testUserServiceAudit();
    
    // Test advanced features
    await testAdvancedFiltering();
    await testErrorHandling();
    await testPerformance();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n📋 Test Summary:');
    console.log('- Order Service Audit: ✅ Tested');
    console.log('- Product Service Audit: ✅ Tested');
    console.log('- User Service Audit: ✅ Tested');
    console.log('- Advanced Filtering: ✅ Tested');
    console.log('- Error Handling: ✅ Tested');
    console.log('- Performance: ✅ Tested');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testOrderServiceAudit,
  testProductServiceAudit,
  testUserServiceAudit,
  testAdvancedFiltering,
  testErrorHandling,
  testPerformance,
  runAllTests
};
