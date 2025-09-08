const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002'; // Order service URL
const API_BASE = `${BASE_URL}/api/orders`;

// Test data
const testAuthToken = 'Bearer test-admin-token';
const testDealerId = 'test-dealer-123';
const testUserId = 'test-user-456';

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
async function testFulfillmentMetrics() {
  console.log('\n🧪 Testing Enhanced Fulfillment Metrics...');
  
  // Test without dealer info
  console.log('📊 Testing basic fulfillment metrics...');
  const basicResult = await makeRequest('GET', '/analytics/fulfillment');
  
  if (basicResult.success) {
    console.log('✅ Basic fulfillment metrics fetched successfully');
    console.log('📋 Total Orders:', basicResult.data.data?.totalOrders || 0);
    console.log('📋 Avg Fulfillment Time:', basicResult.data.data?.avgFulfillmentTime || 0);
  } else {
    console.log('❌ Basic fulfillment metrics failed:', basicResult.error);
  }
  
  // Test with dealer info
  console.log('\n📊 Testing fulfillment metrics with dealer info...');
  const dealerResult = await makeRequest('GET', '/analytics/fulfillment?includeDealerInfo=true');
  
  if (dealerResult.success) {
    console.log('✅ Fulfillment metrics with dealer info fetched successfully');
    console.log('📋 Dealers Info Count:', dealerResult.data.data?.dealersInfo?.length || 0);
  } else {
    console.log('❌ Fulfillment metrics with dealer info failed:', dealerResult.error);
  }
  
  // Test with date range
  console.log('\n📊 Testing fulfillment metrics with date range...');
  const dateResult = await makeRequest('GET', '/analytics/fulfillment?startDate=2024-01-01&endDate=2024-12-31&includeDealerInfo=true');
  
  if (dateResult.success) {
    console.log('✅ Fulfillment metrics with date range fetched successfully');
  } else {
    console.log('❌ Fulfillment metrics with date range failed:', dateResult.error);
  }
}

async function testSLAComplianceReport() {
  console.log('\n🧪 Testing Enhanced SLA Compliance Report...');
  
  // Test basic SLA compliance
  console.log('📊 Testing basic SLA compliance report...');
  const basicResult = await makeRequest('GET', '/analytics/sla-compliance');
  
  if (basicResult.success) {
    console.log('✅ Basic SLA compliance report fetched successfully');
    console.log('📋 Report Items:', basicResult.data.data?.length || 0);
  } else {
    console.log('❌ Basic SLA compliance report failed:', basicResult.error);
  }
  
  // Test with dealer info
  console.log('\n📊 Testing SLA compliance with dealer info...');
  const dealerResult = await makeRequest('GET', '/analytics/sla-compliance?includeDealerInfo=true');
  
  if (dealerResult.success) {
    console.log('✅ SLA compliance with dealer info fetched successfully');
    const hasDealerInfo = basicResult.data.data?.some(item => item.dealerInfo);
    console.log('📋 Has Dealer Info:', hasDealerInfo);
  } else {
    console.log('❌ SLA compliance with dealer info failed:', dealerResult.error);
  }
  
  // Test with user info
  console.log('\n📊 Testing SLA compliance with user info...');
  const userResult = await makeRequest('GET', '/analytics/sla-compliance?includeUserInfo=true');
  
  if (userResult.success) {
    console.log('✅ SLA compliance with user info fetched successfully');
    const hasUserInfo = userResult.data.data?.some(item => item.customerInfos);
    console.log('📋 Has User Info:', hasUserInfo);
  } else {
    console.log('❌ SLA compliance with user info failed:', userResult.error);
  }
  
  // Test with specific dealer
  console.log('\n📊 Testing SLA compliance for specific dealer...');
  const dealerSpecificResult = await makeRequest('GET', `/analytics/sla-compliance?dealerId=${testDealerId}&includeDealerInfo=true&includeUserInfo=true`);
  
  if (dealerSpecificResult.success) {
    console.log('✅ SLA compliance for specific dealer fetched successfully');
  } else {
    console.log('❌ SLA compliance for specific dealer failed:', dealerSpecificResult.error);
  }
}

async function testDealerPerformance() {
  console.log('\n🧪 Testing Enhanced Dealer Performance...');
  
  // Test basic dealer performance
  console.log('📊 Testing basic dealer performance...');
  const basicResult = await makeRequest('GET', `/analytics/dealer-performance?dealerId=${testDealerId}`);
  
  if (basicResult.success) {
    console.log('✅ Basic dealer performance fetched successfully');
    console.log('📋 Dealer Name:', basicResult.data.data?.dealerName || 'N/A');
    console.log('📋 Total Orders:', basicResult.data.data?.totalOrders || 0);
    console.log('📋 Total Revenue:', basicResult.data.data?.totalRevenue || 0);
  } else {
    console.log('❌ Basic dealer performance failed:', basicResult.error);
  }
  
  // Test with user info
  console.log('\n📊 Testing dealer performance with user info...');
  const userResult = await makeRequest('GET', `/analytics/dealer-performance?dealerId=${testDealerId}&includeUserInfo=true`);
  
  if (userResult.success) {
    console.log('✅ Dealer performance with user info fetched successfully');
    console.log('📋 Customer Infos Count:', userResult.data.data?.customerInfos?.length || 0);
  } else {
    console.log('❌ Dealer performance with user info failed:', userResult.error);
  }
  
  // Test with date range
  console.log('\n📊 Testing dealer performance with date range...');
  const dateResult = await makeRequest('GET', `/analytics/dealer-performance?dealerId=${testDealerId}&startDate=2024-01-01&endDate=2024-12-31&includeUserInfo=true`);
  
  if (dateResult.success) {
    console.log('✅ Dealer performance with date range fetched successfully');
  } else {
    console.log('❌ Dealer performance with date range failed:', dateResult.error);
  }
}

async function testOrderStats() {
  console.log('\n🧪 Testing Enhanced Order Stats...');
  
  // Test basic order stats
  console.log('📊 Testing basic order stats...');
  const basicResult = await makeRequest('GET', '/stats');
  
  if (basicResult.success) {
    console.log('✅ Basic order stats fetched successfully');
    console.log('📋 Total Orders:', basicResult.data.data?.summary?.totalOrders || 0);
    console.log('📋 Total Revenue:', basicResult.data.data?.summary?.totalRevenue || 0);
    console.log('📋 Recent Orders Count:', basicResult.data.data?.recentOrders?.length || 0);
  } else {
    console.log('❌ Basic order stats failed:', basicResult.error);
  }
  
  // Test with dealer info
  console.log('\n📊 Testing order stats with dealer info...');
  const dealerResult = await makeRequest('GET', '/stats?includeDealerInfo=true');
  
  if (dealerResult.success) {
    console.log('✅ Order stats with dealer info fetched successfully');
    console.log('📋 Dealers Info Count:', dealerResult.data.data?.dealersInfo?.length || 0);
  } else {
    console.log('❌ Order stats with dealer info failed:', dealerResult.error);
  }
  
  // Test with user info
  console.log('\n📊 Testing order stats with user info...');
  const userResult = await makeRequest('GET', '/stats?includeUserInfo=true');
  
  if (userResult.success) {
    console.log('✅ Order stats with user info fetched successfully');
    console.log('📋 Customers Info Count:', userResult.data.data?.customersInfo?.length || 0);
  } else {
    console.log('❌ Order stats with user info failed:', userResult.error);
  }
  
  // Test with both dealer and user info
  console.log('\n📊 Testing order stats with both dealer and user info...');
  const bothResult = await makeRequest('GET', '/stats?includeDealerInfo=true&includeUserInfo=true');
  
  if (bothResult.success) {
    console.log('✅ Order stats with both dealer and user info fetched successfully');
    console.log('📋 Dealers Info Count:', bothResult.data.data?.dealersInfo?.length || 0);
    console.log('📋 Customers Info Count:', bothResult.data.data?.customersInfo?.length || 0);
  } else {
    console.log('❌ Order stats with both dealer and user info failed:', bothResult.error);
  }
  
  // Test with date range
  console.log('\n📊 Testing order stats with date range...');
  const dateResult = await makeRequest('GET', '/stats?startDate=2024-01-01&endDate=2024-12-31&includeDealerInfo=true&includeUserInfo=true');
  
  if (dateResult.success) {
    console.log('✅ Order stats with date range fetched successfully');
  } else {
    console.log('❌ Order stats with date range failed:', dateResult.error);
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test with invalid dealer ID
  console.log('📊 Testing with invalid dealer ID...');
  const invalidDealerResult = await makeRequest('GET', '/analytics/dealer-performance?dealerId=invalid-dealer-id');
  
  if (invalidDealerResult.success) {
    console.log('✅ Invalid dealer ID handled gracefully');
  } else {
    console.log('❌ Invalid dealer ID test failed:', invalidDealerResult.error);
  }
  
  // Test with invalid date range
  console.log('\n📊 Testing with invalid date range...');
  const invalidDateResult = await makeRequest('GET', '/stats?startDate=invalid-date&endDate=invalid-date');
  
  if (invalidDateResult.success) {
    console.log('✅ Invalid date range handled gracefully');
  } else {
    console.log('❌ Invalid date range test failed:', invalidDateResult.error);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Enhanced Analytics Endpoints Tests...');
  console.log('=' .repeat(60));
  
  try {
    await testFulfillmentMetrics();
    await testSLAComplianceReport();
    await testDealerPerformance();
    await testOrderStats();
    await testErrorHandling();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All enhanced analytics tests completed!');
    console.log('\n📝 Summary of Enhancements:');
    console.log('1. ✅ Fulfillment Metrics - Added dealer information support');
    console.log('2. ✅ SLA Compliance Report - Added dealer and user information support');
    console.log('3. ✅ Dealer Performance - Added user information and enhanced metrics');
    console.log('4. ✅ Order Stats - Added dealer and user information support');
    console.log('5. ✅ Helper Functions - Created functions to fetch data from user service');
    console.log('6. ✅ Error Handling - Graceful handling of missing data');
    
    console.log('\n🔧 New Query Parameters:');
    console.log('- includeDealerInfo=true - Include dealer information in response');
    console.log('- includeUserInfo=true - Include user/customer information in response');
    console.log('- startDate & endDate - Filter by date range');
    console.log('- dealerId - Filter by specific dealer');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test with real data in your environment');
    console.log('2. Verify user service endpoints are accessible');
    console.log('3. Monitor performance with large datasets');
    console.log('4. Consider caching for frequently accessed data');
    
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
  testFulfillmentMetrics,
  testSLAComplianceReport,
  testDealerPerformance,
  testOrderStats,
  testErrorHandling
};
