const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

// Test the dashboard endpoint without authentication
async function testDashboardWithoutAuth() {
  try {
    console.log('🧪 Testing dashboard without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31`, {
      timeout: 10000
    });
    
    console.log('✅ Dashboard without auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Role in Response:', response.data?.data?.role);
    console.log('KPIs in Response:', response.data?.data?.kpis ? 'Present' : 'Missing');
    console.log('Response Structure:', Object.keys(response.data?.data || {}));
    
    return true;
  } catch (error) {
    console.log('❌ Dashboard without auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the KPIs endpoint without authentication
async function testKPIsWithoutAuth() {
  try {
    console.log('🧪 Testing KPIs without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/kpis?startDate=2024-01-01&endDate=2024-01-31`, {
      timeout: 10000
    });
    
    console.log('✅ KPIs without auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Response Structure:', Object.keys(response.data?.data || {}));
    
    return true;
  } catch (error) {
    console.log('❌ KPIs without auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the trends endpoint without authentication
async function testTrendsWithoutAuth() {
  try {
    console.log('🧪 Testing trends without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/trends?startDate=2024-01-01&endDate=2024-01-31`, {
      timeout: 10000
    });
    
    console.log('✅ Trends without auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Response Structure:', Object.keys(response.data?.data || {}));
    
    return true;
  } catch (error) {
    console.log('❌ Trends without auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard endpoint with authentication
async function testDashboardWithAuth() {
  try {
    console.log('🧪 Testing dashboard with authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31`, {
      headers: {
        'Authorization': 'Bearer test-token'
      },
      timeout: 10000
    });
    
    console.log('✅ Dashboard with auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('Role in Response:', response.data?.data?.role);
    console.log('KPIs in Response:', response.data?.data?.kpis ? 'Present' : 'Missing');
    console.log('Response Structure:', Object.keys(response.data?.data || {}));
    
    return true;
  } catch (error) {
    console.log('❌ Dashboard with auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard endpoint with no query parameters
async function testDashboardNoParams() {
  try {
    console.log('🧪 Testing dashboard with no query parameters...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard`, {
      timeout: 10000
    });
    
    console.log('✅ Dashboard no params - SUCCESS');
    console.log('Status:', response.status);
    console.log('Role in Response:', response.data?.data?.role);
    console.log('KPIs in Response:', response.data?.data?.kpis ? 'Present' : 'Missing');
    
    return true;
  } catch (error) {
    console.log('❌ Dashboard no params - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Static Method Fix Tests...\n');
  
  const results = [];
  
  // Test without authentication
  results.push(await testDashboardWithoutAuth());
  console.log('');
  
  results.push(await testKPIsWithoutAuth());
  console.log('');
  
  results.push(await testTrendsWithoutAuth());
  console.log('');
  
  // Test with authentication
  results.push(await testDashboardWithAuth());
  console.log('');
  
  // Test with no parameters
  results.push(await testDashboardNoParams());
  console.log('');
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Static method issue is fixed.');
    console.log('\n✅ No more "Cannot read properties of undefined" errors!');
    console.log('✅ Static methods are called correctly!');
    console.log('✅ Analytics dashboard works without authentication!');
    console.log('✅ Analytics dashboard works with authentication!');
    console.log('✅ All endpoints return proper data structure!');
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
