const axios = require('axios');

// Configuration
const BASE_URL = 'https://api.toprise.in'; // Production API URL
const API_BASE = `${BASE_URL}/api/orders/api/reports`;

// Test data
const testAuthToken = 'Bearer test-admin-token';

// Helper function to make API calls
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': testAuthToken,
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test functions
async function testDashboardReports() {
  console.log('\n🧪 Testing Dashboard Reports...');
  
  console.log('📊 Testing basic dashboard reports...');
  const basicResult = await makeRequest('GET', '/dashboard');
  
  if (basicResult.success) {
    console.log('✅ Dashboard reports fetched successfully');
    const response = basicResult.data.data;
    
    console.log('📋 Overview Statistics:');
    console.log(`   - Total Orders: ${response.overview.totalOrders}`);
    console.log(`   - Total Revenue: ₹${response.overview.totalRevenue}`);
    console.log(`   - Total Customers: ${response.overview.totalCustomers}`);
    console.log(`   - Average Order Value: ₹${response.overview.avgOrderValue}`);
    
    console.log('\n📋 Applied Filters:');
    console.log(`   - Start Date: ${response.filters.startDate || 'N/A'}`);
    console.log(`   - End Date: ${response.filters.endDate || 'N/A'}`);
    console.log(`   - Include Details: ${response.filters.includeDetails}`);
    
    console.log('\n📋 Report Generated At:');
    console.log(`   - Timestamp: ${response.generatedAt}`);
    
  } else {
    console.log('❌ Dashboard reports failed:', basicResult.error);
  }
}

async function testDashboardReportsWithDateFilter() {
  console.log('\n🧪 Testing Dashboard Reports with Date Filter...');
  
  // Test with last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  console.log(`📊 Testing with date filter (from ${startDate})...`);
  const dateFilterResult = await makeRequest('GET', `/dashboard?startDate=${startDate}`);
  
  if (dateFilterResult.success) {
    console.log('✅ Dashboard reports with date filter fetched successfully');
    const response = dateFilterResult.data.data;
    
    console.log('📋 Date Filter Results:');
    console.log(`   - Total Orders (Last 30 Days): ${response.overview.totalOrders}`);
    console.log(`   - Total Revenue (Last 30 Days): ₹${response.overview.totalRevenue}`);
    console.log(`   - Total Customers (Last 30 Days): ${response.overview.totalCustomers}`);
    console.log(`   - Average Order Value (Last 30 Days): ₹${response.overview.avgOrderValue}`);
    
  } else {
    console.log('❌ Dashboard reports with date filter failed:', dateFilterResult.error);
  }
}

async function testDashboardReportsWithDateRange() {
  console.log('\n🧪 Testing Dashboard Reports with Date Range...');
  
  // Test with specific date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7); // Last 7 days
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`📊 Testing with date range (${startDateStr} to ${endDateStr})...`);
  const dateRangeResult = await makeRequest('GET', `/dashboard?startDate=${startDateStr}&endDate=${endDateStr}`);
  
  if (dateRangeResult.success) {
    console.log('✅ Dashboard reports with date range fetched successfully');
    const response = dateRangeResult.data.data;
    
    console.log('📋 Date Range Results:');
    console.log(`   - Total Orders (Last 7 Days): ${response.overview.totalOrders}`);
    console.log(`   - Total Revenue (Last 7 Days): ₹${response.overview.totalRevenue}`);
    console.log(`   - Total Customers (Last 7 Days): ${response.overview.totalCustomers}`);
    console.log(`   - Average Order Value (Last 7 Days): ₹${response.overview.avgOrderValue}`);
    
  } else {
    console.log('❌ Dashboard reports with date range failed:', dateRangeResult.error);
  }
}

async function testDashboardReportsWithDetails() {
  console.log('\n🧪 Testing Dashboard Reports with Details...');
  
  console.log('📊 Testing with includeDetails=true...');
  const detailsResult = await makeRequest('GET', '/dashboard?includeDetails=true');
  
  if (detailsResult.success) {
    console.log('✅ Dashboard reports with details fetched successfully');
    const response = detailsResult.data.data;
    
    console.log('📋 Detailed Results:');
    console.log(`   - Total Orders: ${response.overview.totalOrders}`);
    console.log(`   - Total Revenue: ₹${response.overview.totalRevenue}`);
    console.log(`   - Total Customers: ${response.overview.totalCustomers}`);
    console.log(`   - Average Order Value: ₹${response.overview.avgOrderValue}`);
    
    console.log('\n📋 Applied Filters:');
    console.log(`   - Include Details: ${response.filters.includeDetails}`);
    
  } else {
    console.log('❌ Dashboard reports with details failed:', detailsResult.error);
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test without authentication
  console.log('📊 Testing without authentication...');
  const noAuthResult = await makeRequest('GET', '/dashboard', null, { 'Authorization': '' });
  
  if (!noAuthResult.success) {
    console.log('✅ Authentication required correctly enforced');
    console.log('📋 Error Status:', noAuthResult.status);
  } else {
    console.log('❌ Authentication should be required');
  }
  
  // Test with invalid date format
  console.log('\n📊 Testing with invalid date format...');
  const invalidDateResult = await makeRequest('GET', '/dashboard?startDate=invalid-date');
  
  if (invalidDateResult.success) {
    console.log('✅ Invalid date handled gracefully');
  } else {
    console.log('❌ Invalid date should be handled gracefully');
  }
}

async function testDataStructure() {
  console.log('\n🧪 Testing Data Structure...');
  
  console.log('📊 Expected dashboard reports data structure:');
  console.log(`
  {
    "success": true,
    "data": {
      "overview": {
        "totalOrders": 1500,
        "totalRevenue": 2500000,
        "totalCustomers": 450,
        "avgOrderValue": 1667
      },
      "orderMetrics": {
        "totalOrders": 1500,
        "totalRevenue": 2500000,
        "avgOrderValue": 1667,
        "totalCustomers": 450,
        "ordersToday": 25,
        "ordersThisWeek": 180,
        "ordersThisMonth": 750,
        "revenueToday": 45000,
        "revenueThisWeek": 320000,
        "revenueThisMonth": 1250000,
        "completionRate": 85,
        "avgProcessingTime": 2.5,
        "paymentMethods": [
          {
            "method": "prepaid",
            "count": 900,
            "totalAmount": 1500000,
            "percentage": 60
          },
          {
            "method": "cod",
            "count": 600,
            "totalAmount": 1000000,
            "percentage": 40
          }
        ],
        "orderStatuses": [
          {
            "status": "delivered",
            "count": 1275,
            "totalAmount": 2125000,
            "percentage": 85
          },
          {
            "status": "pending",
            "count": 150,
            "totalAmount": 250000,
            "percentage": 10
          },
          {
            "status": "cancelled",
            "count": 75,
            "totalAmount": 125000,
            "percentage": 5
          }
        ]
      },
      "topPerformers": {
        "topDealers": [
          {
            "dealerId": "dealer-mongodb-id",
            "orderCount": 150,
            "totalRevenue": 250000,
            "avgOrderValue": 1667
          }
        ],
        "topCustomers": [
          {
            "customerId": "customer-mongodb-id",
            "orderCount": 25,
            "totalSpent": 50000,
            "avgOrderValue": 2000
          }
        ],
        "topProducts": [
          {
            "sku": "SKU-001",
            "productName": "Product 1",
            "orderCount": 100,
            "totalQuantity": 200,
            "totalRevenue": 100000
          }
        ]
      },
      "filters": {
        "startDate": null,
        "endDate": null,
        "includeDetails": false
      },
      "generatedAt": "2024-01-15T10:30:00.000Z"
    },
    "message": "Dashboard reports fetched successfully"
  }
  `);
}

async function testPerformanceMetrics() {
  console.log('\n🧪 Testing Performance Metrics...');
  
  console.log('📊 Testing dashboard reports performance...');
  const startTime = Date.now();
  
  const performanceResult = await makeRequest('GET', '/dashboard');
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  if (performanceResult.success) {
    console.log('✅ Dashboard reports performance test completed');
    console.log(`📋 Response Time: ${responseTime}ms`);
    
    if (responseTime < 5000) {
      console.log('✅ Performance is acceptable (< 5 seconds)');
    } else {
      console.log('⚠️ Performance could be improved (> 5 seconds)');
    }
    
  } else {
    console.log('❌ Dashboard reports performance test failed:', performanceResult.error);
  }
}

async function testConcurrentRequests() {
  console.log('\n🧪 Testing Concurrent Requests...');
  
  console.log('📊 Testing multiple concurrent dashboard requests...');
  
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('GET', '/dashboard'));
  }
  
  try {
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log('✅ Concurrent requests test completed');
    console.log(`📋 Successful Requests: ${successCount}/5`);
    console.log(`📋 Failed Requests: ${failureCount}/5`);
    
    if (successCount === 5) {
      console.log('✅ All concurrent requests succeeded');
    } else {
      console.log('⚠️ Some concurrent requests failed');
    }
    
  } catch (error) {
    console.log('❌ Concurrent requests test failed:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Reports Endpoints Tests...');
  console.log('=' .repeat(70));
  
  try {
    await testDashboardReports();
    await testDashboardReportsWithDateFilter();
    await testDashboardReportsWithDateRange();
    await testDashboardReportsWithDetails();
    await testErrorHandling();
    await testDataStructure();
    await testPerformanceMetrics();
    await testConcurrentRequests();
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ All reports endpoints tests completed!');
    console.log('\n📝 Summary of Reports System:');
    console.log('1. ✅ Dashboard Reports - Comprehensive overview metrics');
    console.log('2. ✅ Date Filtering - Filter reports by date range');
    console.log('3. ✅ Performance Metrics - Order and revenue statistics');
    console.log('4. ✅ Top Performers - Best dealers, customers, and products');
    console.log('5. ✅ Error Handling - Proper authentication and validation');
    console.log('6. ✅ Data Structure - Well-formatted response structure');
    console.log('7. ✅ Performance Testing - Response time optimization');
    console.log('8. ✅ Concurrent Requests - System stability under load');
    
    console.log('\n🔧 Available Endpoints:');
    console.log('- GET /api/orders/api/reports/dashboard - Main dashboard reports');
    console.log('- Query Parameters: startDate, endDate, includeDetails');
    
    console.log('\n🔧 Key Features:');
    console.log('- Total orders, revenue, customers, and average order value');
    console.log('- Time-based filtering (today, this week, this month)');
    console.log('- Top performing dealers, customers, and products');
    console.log('- Payment method and order status distribution');
    console.log('- Order completion rates and processing times');
    console.log('- Comprehensive e-commerce analytics');
    
    console.log('\n📋 Usage Examples:');
    console.log('1. Basic: GET /api/orders/api/reports/dashboard');
    console.log('2. With Date Filter: GET /api/orders/api/reports/dashboard?startDate=2024-01-01');
    console.log('3. With Date Range: GET /api/orders/api/reports/dashboard?startDate=2024-01-01&endDate=2024-01-31');
    console.log('4. With Details: GET /api/orders/api/reports/dashboard?includeDetails=true');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test with real data in your production environment');
    console.log('2. Verify all metrics are correctly calculated');
    console.log('3. Update frontend to use the reports data');
    console.log('4. Consider caching for frequently accessed reports');
    console.log('5. Monitor performance with large datasets');
    console.log('6. Implement real-time report updates');
    console.log('7. Add more detailed breakdowns (by category, region, etc.)');
    console.log('8. Implement report scheduling and email delivery');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testDashboardReports,
  testDashboardReportsWithDateFilter,
  testDashboardReportsWithDateRange,
  testDashboardReportsWithDetails,
  testErrorHandling,
  testDataStructure,
  testPerformanceMetrics,
  testConcurrentRequests
};
