const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

// Test the dashboard endpoint without authentication
async function testDashboardWithoutAuth() {
  try {
    console.log('🧪 Testing dashboard without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard`, {
      timeout: 10000
    });
    
    console.log('✅ Dashboard without auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Dashboard without auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard endpoint with authentication
async function testDashboardWithAuth() {
  try {
    console.log('🧪 Testing dashboard with authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard`, {
      headers: {
        'Authorization': 'Bearer test-token'
      },
      timeout: 10000
    });
    
    console.log('✅ Dashboard with auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Dashboard with auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test KPIs endpoint without authentication
async function testKPIsWithoutAuth() {
  try {
    console.log('🧪 Testing KPIs without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/kpis`, {
      timeout: 10000
    });
    
    console.log('✅ KPIs without auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ KPIs without auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test trends endpoint without authentication
async function testTrendsWithoutAuth() {
  try {
    console.log('🧪 Testing trends without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/trends`, {
      timeout: 10000
    });
    
    console.log('✅ Trends without auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Trends without auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test audit logs endpoint without authentication (should fail)
async function testAuditLogsWithoutAuth() {
  try {
    console.log('🧪 Testing audit logs without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/audit-logs`, {
      timeout: 10000
    });
    
    console.log('❌ Audit logs without auth - UNEXPECTED SUCCESS');
    console.log('Status:', response.status);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Audit logs without auth - CORRECTLY FAILED (401 Unauthorized)');
      return true;
    } else {
      console.log('❌ Audit logs without auth - UNEXPECTED ERROR');
      console.log('Error:', error.response?.status, error.response?.data || error.message);
      return false;
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Dashboard API Tests...\n');
  
  const results = [];
  
  // Test without authentication
  results.push(await testDashboardWithoutAuth());
  console.log('');
  
  results.push(await testKPIsWithoutAuth());
  console.log('');
  
  results.push(await testTrendsWithoutAuth());
  console.log('');
  
  results.push(await testAuditLogsWithoutAuth());
  console.log('');
  
  // Test with authentication
  results.push(await testDashboardWithAuth());
  console.log('');
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! The dashboard API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  return passed === total;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
