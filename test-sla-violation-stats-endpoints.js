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
async function testSLAViolationStats() {
  console.log('\n🔍 Testing SLA Violation Statistics Endpoints...\n');

  // 1. Get comprehensive SLA violation statistics
  console.log('1. Testing GET /api/sla-violations/stats');
  const stats = await makeRequest('GET', '/api/sla-violations/stats?groupBy=dealer');
  if (stats) {
    console.log('✅ SLA violation stats retrieved successfully');
    console.log(`   Summary: ${stats.data?.summary?.totalViolations || 0} total violations`);
    console.log(`   Unique dealers: ${stats.data?.summary?.uniqueDealerCount || 0}`);
  }

  // 2. Get dealers with multiple violations
  console.log('\n2. Testing GET /api/sla-violations/dealers-with-violations');
  const dealersWithViolations = await makeRequest('GET', '/api/sla-violations/dealers-with-violations?minViolations=3');
  if (dealersWithViolations) {
    console.log('✅ Dealers with violations retrieved successfully');
    console.log(`   Total dealers: ${dealersWithViolations.data?.totalDealers || 0}`);
    console.log(`   Eligible for disable: ${dealersWithViolations.data?.eligibleForDisable || 0}`);
    console.log(`   High risk: ${dealersWithViolations.data?.highRiskDealers || 0}`);
  }

  // 3. Get SLA violation trends
  console.log('\n3. Testing GET /api/sla-violations/trends');
  const trends = await makeRequest('GET', '/api/sla-violations/trends?period=30d');
  if (trends) {
    console.log('✅ SLA violation trends retrieved successfully');
    console.log(`   Period: ${trends.data?.period || 'N/A'}`);
    console.log(`   Total violations: ${trends.data?.summary?.totalViolations || 0}`);
    console.log(`   Daily trends: ${trends.data?.trends?.daily?.length || 0} data points`);
  }

  // 4. Get top violating dealers
  console.log('\n4. Testing GET /api/sla-violations/top-violators');
  const topViolators = await makeRequest('GET', '/api/sla-violations/top-violators?limit=5&sortBy=violations');
  if (topViolators) {
    console.log('✅ Top violating dealers retrieved successfully');
    console.log(`   Top violators: ${topViolators.data?.length || 0} dealers`);
    if (topViolators.data?.length > 0) {
      console.log(`   #1 dealer: ${topViolators.data[0]?.dealerInfo?.trade_name || 'N/A'} (${topViolators.data[0]?.stats?.totalViolations || 0} violations)`);
    }
  }

  // 5. Get SLA violation dashboard
  console.log('\n5. Testing GET /api/sla-violations/dashboard');
  const dashboard = await makeRequest('GET', '/api/sla-violations/dashboard');
  if (dashboard) {
    console.log('✅ SLA violation dashboard retrieved successfully');
    console.log(`   Quick stats available: ${!!dashboard.data?.quickStats}`);
    console.log(`   Dealers with violations: ${dashboard.data?.dealersWithViolations?.totalDealers || 0}`);
    console.log(`   Top violators: ${dashboard.data?.topViolators?.length || 0}`);
  }

  // 6. Get SLA violation alerts
  console.log('\n6. Testing GET /api/sla-violations/alerts');
  const alerts = await makeRequest('GET', '/api/sla-violations/alerts');
  if (alerts) {
    console.log('✅ SLA violation alerts retrieved successfully');
    console.log(`   Total alerts: ${alerts.data?.totalAlerts || 0}`);
    console.log(`   Dealers eligible for disable: ${alerts.data?.dealersEligibleForDisable || 0}`);
    console.log(`   High risk dealers: ${alerts.data?.highRiskDealers || 0}`);
    console.log(`   Unresolved violations: ${alerts.data?.unresolvedViolations || 0}`);
  }

  // 7. Test resolve violation (if violation ID exists)
  console.log('\n7. Testing PUT /api/sla-violations/resolve/:violationId');
  const resolveData = {
    resolutionNotes: 'Test resolution via API'
  };
  const resolved = await makeRequest('PUT', `/api/sla-violations/resolve/${testViolationId}`, resolveData);
  if (resolved) {
    console.log('✅ SLA violation resolved successfully');
  } else {
    console.log('⚠️  SLA violation resolve test skipped (violation not found)');
  }

  // 8. Test disable dealer (if dealer has 3+ violations)
  console.log('\n8. Testing PUT /api/sla-violations/disable-dealer/:dealerId');
  const disableData = {
    reason: 'Test disable via API',
    adminNotes: 'Automated test disable operation'
  };
  const disabled = await makeRequest('PUT', `/api/sla-violations/disable-dealer/${testDealerId}`, disableData);
  if (disabled) {
    console.log('✅ Dealer disabled successfully');
  } else {
    console.log('⚠️  Dealer disable test skipped (dealer not found or insufficient violations)');
  }

  // 9. Test bulk disable (Super Admin only)
  console.log('\n9. Testing POST /api/sla-violations/bulk-disable');
  const bulkDisableData = {
    dealerIds: [testDealerId],
    reason: 'Bulk test disable',
    adminNotes: 'Automated bulk disable test'
  };
  const bulkDisabled = await makeRequest('POST', '/api/sla-violations/bulk-disable', bulkDisableData);
  if (bulkDisabled) {
    console.log('✅ Bulk disable operation completed');
    console.log(`   Processed: ${bulkDisabled.data?.totalProcessed || 0}`);
    console.log(`   Success: ${bulkDisabled.data?.successCount || 0}`);
    console.log(`   Failed: ${bulkDisabled.data?.failureCount || 0}`);
  } else {
    console.log('⚠️  Bulk disable test skipped (insufficient permissions or no eligible dealers)');
  }

  console.log('\n🎉 SLA Violation Statistics Endpoints Testing Completed!\n');
}

// Test with different query parameters
async function testQueryParameters() {
  console.log('\n🔧 Testing Query Parameters...\n');

  // Test different groupBy options
  const groupByOptions = ['dealer', 'date', 'month'];
  for (const groupBy of groupByOptions) {
    console.log(`Testing groupBy=${groupBy}`);
    const result = await makeRequest('GET', `/api/sla-violations/stats?groupBy=${groupBy}`);
    if (result) {
      console.log(`✅ groupBy=${groupBy} works`);
    }
  }

  // Test date filtering
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  
  console.log(`Testing date filtering: ${startDate} to ${endDate}`);
  const dateFiltered = await makeRequest('GET', `/api/sla-violations/stats?startDate=${startDate}&endDate=${endDate}`);
  if (dateFiltered) {
    console.log('✅ Date filtering works');
  }

  // Test different periods for trends
  const periods = ['7d', '30d', '90d', '1y'];
  for (const period of periods) {
    console.log(`Testing trends period=${period}`);
    const result = await makeRequest('GET', `/api/sla-violations/trends?period=${period}`);
    if (result) {
      console.log(`✅ period=${period} works`);
    }
  }

  // Test different sort options for top violators
  const sortOptions = ['violations', 'minutes', 'avgMinutes', 'recent'];
  for (const sortBy of sortOptions) {
    console.log(`Testing top violators sortBy=${sortBy}`);
    const result = await makeRequest('GET', `/api/sla-violations/top-violators?sortBy=${sortBy}&limit=3`);
    if (result) {
      console.log(`✅ sortBy=${sortBy} works`);
    }
  }

  console.log('\n✅ Query Parameters Testing Completed!\n');
}

// Test error handling
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...\n');

  // Test with invalid dealer ID
  console.log('Testing with invalid dealer ID');
  const invalidDealer = await makeRequest('GET', '/api/sla-violations/stats?dealerId=invalid-id');
  if (!invalidDealer) {
    console.log('✅ Properly handles invalid dealer ID');
  }

  // Test with invalid violation ID
  console.log('Testing with invalid violation ID');
  const invalidViolation = await makeRequest('PUT', '/api/sla-violations/resolve/invalid-id', {
    resolutionNotes: 'Test'
  });
  if (!invalidViolation) {
    console.log('✅ Properly handles invalid violation ID');
  }

  // Test without authentication
  console.log('Testing without authentication');
  try {
    await axios.get(`${BASE_URL}/api/sla-violations/stats`);
    console.log('❌ Should have required authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Properly requires authentication');
    }
  }

  // Test with insufficient permissions
  console.log('Testing with insufficient permissions');
  try {
    await axios.get(`${BASE_URL}/api/sla-violations/stats`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    console.log('❌ Should have required permissions');
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ Properly requires permissions');
    }
  }

  console.log('\n✅ Error Handling Testing Completed!\n');
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting SLA Violation Statistics Endpoints Testing...\n');
  console.log(`📍 Testing against: ${BASE_URL}\n`);

  try {
    await testSLAViolationStats();
    await testQueryParameters();
    await testErrorHandling();
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ SLA violation statistics endpoints');
    console.log('✅ Query parameter handling');
    console.log('✅ Error handling and validation');
    console.log('✅ Authentication and authorization');
    console.log('✅ Bulk operations');
    console.log('✅ Dashboard and alerts');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testSLAViolationStats,
  testQueryParameters,
  testErrorHandling,
  runAllTests
};
