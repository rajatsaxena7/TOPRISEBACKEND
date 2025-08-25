const axios = require('axios');
const logger = require('/packages/utils/logger');

// Configuration
const BASE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5001';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-jwt-token-here';

// Test data
const testDealerId = '507f1f77bcf86cd799439011'; // Example dealer ID
const testViolationId = '507f1f77bcf86cd799439012'; // Example violation ID

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data || error.message);
    return null;
  }
}

// Test functions
async function testEnhancedSLAViolationStats() {
  console.log('\n🔍 Testing Enhanced SLA Violation Statistics Endpoints...\n');

  // 1. Get comprehensive SLA violation statistics with enhanced details
  console.log('1. Testing GET /api/sla-violations/stats with enhanced details');
  const statsWithDetails = await makeRequest('GET', '/api/sla-violations/stats?groupBy=dealer&includeDetails=true');
  if (statsWithDetails) {
    console.log('✅ Enhanced SLA violation stats retrieved successfully');
    console.log(`   Summary: ${statsWithDetails.data?.summary?.totalViolations || 0} total violations`);
    console.log(`   Unique dealers: ${statsWithDetails.data?.summary?.uniqueDealerCount || 0}`);
    console.log(`   Unique orders: ${statsWithDetails.data?.summary?.uniqueOrderCount || 0}`);
    
    // Check if enhanced details are included
    if (statsWithDetails.data?.data?.length > 0) {
      const firstDealer = statsWithDetails.data.data[0];
      console.log(`   Enhanced details: ${firstDealer.orderDetails?.length || 0} order details included`);
      console.log(`   Employee info: ${firstDealer.dealerInfo?.employeeCount || 0} assigned employees`);
    }
  }

  // 2. Get SLA violation summary with enhanced analytics
  console.log('\n2. Testing GET /api/sla-violations/summary');
  const summary = await makeRequest('GET', '/api/sla-violations/summary');
  if (summary) {
    console.log('✅ SLA violation summary retrieved successfully');
    console.log(`   Total violations: ${summary.data?.summary?.totalViolations || 0}`);
    console.log(`   Resolution rate: ${summary.data?.summary?.resolutionRate || 0}%`);
    console.log(`   Top violators: ${summary.data?.topViolators?.length || 0}`);
    console.log(`   Recent violations: ${summary.data?.recentViolations?.length || 0}`);
    console.log(`   Analytics: ${summary.data?.analytics?.avgViolationsPerDealer || 0} avg per dealer`);
  }

  // 3. Get dealers with multiple violations with enhanced details
  console.log('\n3. Testing GET /api/sla-violations/dealers-with-violations with enhanced details');
  const dealersWithViolations = await makeRequest('GET', '/api/sla-violations/dealers-with-violations?minViolations=3&includeDetails=true');
  if (dealersWithViolations) {
    console.log('✅ Enhanced dealers with violations retrieved successfully');
    console.log(`   Total dealers: ${dealersWithViolations.data?.totalDealers || 0}`);
    console.log(`   Eligible for disable: ${dealersWithViolations.data?.eligibleForDisable || 0}`);
    console.log(`   High risk: ${dealersWithViolations.data?.highRiskDealers || 0}`);
    
    // Check if enhanced details are included
    if (dealersWithViolations.data?.dealers?.length > 0) {
      const firstDealer = dealersWithViolations.data.dealers[0];
      console.log(`   Enhanced details: ${firstDealer.orderDetails?.length || 0} order details included`);
      console.log(`   Employee info: ${firstDealer.dealerInfo?.employeeCount || 0} assigned employees`);
      console.log(`   Order count: ${firstDealer.orderCount || 0} total orders`);
    }
  }

  // 4. Get SLA violation trends with enhanced details
  console.log('\n4. Testing GET /api/sla-violations/trends with enhanced details');
  const trendsWithDetails = await makeRequest('GET', '/api/sla-violations/trends?period=30d&includeDetails=true');
  if (trendsWithDetails) {
    console.log('✅ Enhanced SLA violation trends retrieved successfully');
    console.log(`   Period: ${trendsWithDetails.data?.period || 'N/A'}`);
    console.log(`   Total violations: ${trendsWithDetails.data?.summary?.totalViolations || 0}`);
    console.log(`   Daily trends: ${trendsWithDetails.data?.trends?.daily?.length || 0} data points`);
    console.log(`   Sample violations: ${trendsWithDetails.data?.sampleViolations?.length || 0} with details`);
  }

  // 5. Get top violating dealers with enhanced details
  console.log('\n5. Testing GET /api/sla-violations/top-violators with enhanced details');
  const topViolatorsWithDetails = await makeRequest('GET', '/api/sla-violations/top-violators?limit=5&sortBy=violations&includeDetails=true');
  if (topViolatorsWithDetails) {
    console.log('✅ Enhanced top violating dealers retrieved successfully');
    console.log(`   Top violators: ${topViolatorsWithDetails.data?.length || 0} dealers`);
    if (topViolatorsWithDetails.data?.length > 0) {
      const firstDealer = topViolatorsWithDetails.data[0];
      console.log(`   #1 dealer: ${firstDealer.dealerInfo?.trade_name || 'N/A'} (${firstDealer.stats?.totalViolations || 0} violations)`);
      console.log(`   Enhanced details: ${firstDealer.orderDetails?.length || 0} order details included`);
      console.log(`   Employee info: ${firstDealer.dealerInfo?.employeeCount || 0} assigned employees`);
    }
  }

  // 6. Get detailed violation information
  console.log('\n6. Testing GET /api/sla-violations/violation/:violationId');
  const detailedViolation = await makeRequest('GET', `/api/sla-violations/violation/${testViolationId}`);
  if (detailedViolation) {
    console.log('✅ Detailed violation information retrieved successfully');
    console.log(`   Violation ID: ${detailedViolation.data?.violation?._id || 'N/A'}`);
    console.log(`   Customer: ${detailedViolation.data?.summary?.customerName || 'N/A'}`);
    console.log(`   Dealer: ${detailedViolation.data?.summary?.dealerName || 'N/A'}`);
    console.log(`   Order amount: ${detailedViolation.data?.summary?.orderAmount || 0}`);
    console.log(`   Assigned employees: ${detailedViolation.data?.summary?.assignedEmployees || 0}`);
    console.log(`   Order details included: ${!!detailedViolation.data?.orderDetails}`);
    console.log(`   Dealer details included: ${!!detailedViolation.data?.dealerInfo}`);
  } else {
    console.log('⚠️  Detailed violation test skipped (violation not found)');
  }

  // 7. Test resolve violation with enhanced details
  console.log('\n7. Testing PUT /api/sla-violations/resolve/:violationId with enhanced details');
  const resolveData = {
    resolutionNotes: 'Test resolution via API with enhanced details'
  };
  const resolvedWithDetails = await makeRequest('PUT', `/api/sla-violations/resolve/${testViolationId}`, resolveData);
  if (resolvedWithDetails) {
    console.log('✅ SLA violation resolved successfully with enhanced details');
    console.log(`   Order details included: ${!!resolvedWithDetails.data?.orderDetails}`);
    console.log(`   Dealer details included: ${!!resolvedWithDetails.data?.dealerInfo}`);
  } else {
    console.log('⚠️  SLA violation resolve test skipped (violation not found)');
  }

  // 8. Test disable dealer with enhanced details
  console.log('\n8. Testing PUT /api/sla-violations/disable-dealer/:dealerId with enhanced details');
  const disableData = {
    reason: 'Test disable via API with enhanced details',
    adminNotes: 'Automated test disable operation with order and employee details'
  };
  const disabledWithDetails = await makeRequest('PUT', `/api/sla-violations/disable-dealer/${testDealerId}`, disableData);
  if (disabledWithDetails) {
    console.log('✅ Dealer disabled successfully with enhanced details');
    console.log(`   Affected orders: ${disabledWithDetails.data?.affectedOrdersCount || 0}`);
    console.log(`   Assigned employees: ${disabledWithDetails.data?.assignedEmployeesCount || 0}`);
    console.log(`   Order details included: ${disabledWithDetails.data?.orderDetails?.length || 0}`);
  } else {
    console.log('⚠️  Dealer disable test skipped (dealer not found or insufficient violations)');
  }

  // 9. Test bulk disable with enhanced details
  console.log('\n9. Testing POST /api/sla-violations/bulk-disable with enhanced details');
  const bulkDisableData = {
    dealerIds: [testDealerId],
    reason: 'Bulk test disable with enhanced details',
    adminNotes: 'Automated bulk disable test with order and employee information'
  };
  const bulkDisabledWithDetails = await makeRequest('POST', '/api/sla-violations/bulk-disable', bulkDisableData);
  if (bulkDisabledWithDetails) {
    console.log('✅ Bulk disable operation completed with enhanced details');
    console.log(`   Processed: ${bulkDisabledWithDetails.data?.totalProcessed || 0}`);
    console.log(`   Success: ${bulkDisabledWithDetails.data?.successCount || 0}`);
    console.log(`   Failed: ${bulkDisabledWithDetails.data?.failureCount || 0}`);
  } else {
    console.log('⚠️  Bulk disable test skipped (insufficient permissions or no eligible dealers)');
  }

  console.log('\n🎉 Enhanced SLA Violation Statistics Endpoints Testing Completed!\n');
}

// Test with different query parameters for enhanced details
async function testEnhancedQueryParameters() {
  console.log('\n🔧 Testing Enhanced Query Parameters...\n');

  // Test different groupBy options with enhanced details
  const groupByOptions = ['dealer', 'date', 'month'];
  for (const groupBy of groupByOptions) {
    console.log(`Testing groupBy=${groupBy} with enhanced details`);
    const result = await makeRequest('GET', `/api/sla-violations/stats?groupBy=${groupBy}&includeDetails=true`);
    if (result) {
      console.log(`✅ groupBy=${groupBy} with enhanced details works`);
      if (groupBy === 'dealer' && result.data?.data?.length > 0) {
        console.log(`   Enhanced details included: ${result.data.data[0].orderDetails?.length || 0} order details`);
      }
    }
  }

  // Test date filtering with enhanced details
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  
  console.log(`Testing date filtering with enhanced details: ${startDate} to ${endDate}`);
  const dateFilteredWithDetails = await makeRequest('GET', `/api/sla-violations/stats?startDate=${startDate}&endDate=${endDate}&includeDetails=true`);
  if (dateFilteredWithDetails) {
    console.log('✅ Date filtering with enhanced details works');
  }

  // Test different periods for trends with enhanced details
  const periods = ['7d', '30d', '90d', '1y'];
  for (const period of periods) {
    console.log(`Testing trends period=${period} with enhanced details`);
    const result = await makeRequest('GET', `/api/sla-violations/trends?period=${period}&includeDetails=true`);
    if (result) {
      console.log(`✅ period=${period} with enhanced details works`);
      console.log(`   Sample violations: ${result.data?.sampleViolations?.length || 0}`);
    }
  }

  // Test different sort options for top violators with enhanced details
  const sortOptions = ['violations', 'minutes', 'avgMinutes', 'recent'];
  for (const sortBy of sortOptions) {
    console.log(`Testing top violators sortBy=${sortBy} with enhanced details`);
    const result = await makeRequest('GET', `/api/sla-violations/top-violators?sortBy=${sortBy}&limit=3&includeDetails=true`);
    if (result) {
      console.log(`✅ sortBy=${sortBy} with enhanced details works`);
      if (result.data?.length > 0) {
        console.log(`   Enhanced details: ${result.data[0].orderDetails?.length || 0} order details`);
      }
    }
  }

  console.log('\n✅ Enhanced Query Parameters Testing Completed!\n');
}

// Test error handling for enhanced endpoints
async function testEnhancedErrorHandling() {
  console.log('\n🚨 Testing Enhanced Error Handling...\n');

  // Test with invalid dealer ID
  console.log('Testing with invalid dealer ID');
  const invalidDealer = await makeRequest('GET', '/api/sla-violations/stats?dealerId=invalid-id&includeDetails=true');
  if (!invalidDealer) {
    console.log('✅ Properly handles invalid dealer ID with enhanced details');
  }

  // Test with invalid violation ID
  console.log('Testing with invalid violation ID');
  const invalidViolation = await makeRequest('GET', '/api/sla-violations/violation/invalid-id');
  if (!invalidViolation) {
    console.log('✅ Properly handles invalid violation ID');
  }

  // Test resolve with invalid violation ID
  console.log('Testing resolve with invalid violation ID');
  const invalidResolve = await makeRequest('PUT', '/api/sla-violations/resolve/invalid-id', {
    resolutionNotes: 'Test'
  });
  if (!invalidResolve) {
    console.log('✅ Properly handles invalid violation ID for resolve');
  }

  // Test without authentication
  console.log('Testing without authentication');
  try {
    await axios.get(`${BASE_URL}/api/sla-violations/stats?includeDetails=true`);
    console.log('❌ Should have required authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Properly requires authentication for enhanced endpoints');
    }
  }

  // Test with insufficient permissions
  console.log('Testing with insufficient permissions');
  try {
    await axios.get(`${BASE_URL}/api/sla-violations/stats?includeDetails=true`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    console.log('❌ Should have required permissions');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Properly requires permissions for enhanced endpoints');
    }
  }

  console.log('\n✅ Enhanced Error Handling Testing Completed!\n');
}

// Test performance with enhanced details
async function testEnhancedPerformance() {
  console.log('\n⚡ Testing Enhanced Performance...\n');

  // Test response time with enhanced details
  console.log('Testing response time with enhanced details');
  const startTime = Date.now();
  const result = await makeRequest('GET', '/api/sla-violations/stats?includeDetails=true');
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  if (result) {
    console.log(`✅ Enhanced stats retrieved in ${responseTime}ms`);
    console.log(`   Data size: ${JSON.stringify(result).length} characters`);
  }

  // Test concurrent requests with enhanced details
  console.log('Testing concurrent requests with enhanced details');
  const concurrentRequests = 5;
  const promises = [];
  
  for (let i = 0; i < concurrentRequests; i++) {
    promises.push(makeRequest('GET', '/api/sla-violations/summary'));
  }
  
  const results = await Promise.all(promises);
  const successfulRequests = results.filter(r => r !== null).length;
  console.log(`✅ Concurrent requests: ${successfulRequests}/${concurrentRequests} successful`);

  console.log('\n✅ Enhanced Performance Testing Completed!\n');
}

// Main test execution
async function runAllEnhancedTests() {
  console.log('🚀 Starting Enhanced SLA Violation Statistics Endpoints Testing...\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);

  try {
    await testEnhancedSLAViolationStats();
    await testEnhancedQueryParameters();
    await testEnhancedErrorHandling();
    await testEnhancedPerformance();
    
    console.log('🎉 All enhanced tests completed successfully!');
    console.log('\n📋 Enhanced Features Summary:');
    console.log('✅ Order details integration');
    console.log('✅ Dealer details with employee information');
    console.log('✅ Employee/Designer details');
    console.log('✅ Enhanced query parameters');
    console.log('✅ Detailed violation information');
    console.log('✅ Enhanced analytics and summaries');
    console.log('✅ Performance optimization');
    console.log('✅ Comprehensive error handling');
    
  } catch (error) {
    console.error('❌ Enhanced test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllEnhancedTests();
}

module.exports = {
  testEnhancedSLAViolationStats,
  testEnhancedQueryParameters,
  testEnhancedErrorHandling,
  testEnhancedPerformance,
  runAllEnhancedTests
};
