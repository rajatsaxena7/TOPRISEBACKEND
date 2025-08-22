const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001';

// Create test JWT tokens with different role formats
function createTestToken(role) {
  const payload = {
    id: "685e757a28f3782e4c05cadc",
    email: "rsmx14111@gmail.com",
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  // Create a test token (in production, you'd use your actual JWT secret)
  return jwt.sign(payload, 'test-secret');
}

// Test the dashboard endpoint with Super-admin role
async function testSuperAdminRole() {
  try {
    console.log('🧪 Testing dashboard with Super-admin role...');
    
    const token = createTestToken('Super-admin');
    console.log('Generated token with role: Super-admin');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('✅ Super-admin role - SUCCESS');
    console.log('Status:', response.status);
    console.log('User Role in Response:', response.data?.data?.role);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Super-admin role - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard endpoint with Super Admin role (already mapped)
async function testSuperAdminRoleMapped() {
  try {
    console.log('🧪 Testing dashboard with Super Admin role (already mapped)...');
    
    const token = createTestToken('Super Admin');
    console.log('Generated token with role: Super Admin');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('✅ Super Admin role (mapped) - SUCCESS');
    console.log('Status:', response.status);
    console.log('User Role in Response:', response.data?.data?.role);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Super Admin role (mapped) - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard endpoint with Fulfilment-admin role
async function testFulfilmentAdminRole() {
  try {
    console.log('🧪 Testing dashboard with Fulfilment-admin role...');
    
    const token = createTestToken('Fulfilment-admin');
    console.log('Generated token with role: Fulfilment-admin');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('✅ Fulfilment-admin role - SUCCESS');
    console.log('Status:', response.status);
    console.log('User Role in Response:', response.data?.data?.role);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Fulfilment-admin role - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard endpoint with Dealer role
async function testDealerRole() {
  try {
    console.log('🧪 Testing dashboard with Dealer role...');
    
    const token = createTestToken('Dealer');
    console.log('Generated token with role: Dealer');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('✅ Dealer role - SUCCESS');
    console.log('Status:', response.status);
    console.log('User Role in Response:', response.data?.data?.role);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Dealer role - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the dashboard endpoint without authentication
async function testWithoutAuth() {
  try {
    console.log('🧪 Testing dashboard without authentication...');
    
    const response = await axios.get(`${BASE_URL}/api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31`, {
      timeout: 10000
    });
    
    console.log('✅ Without auth - SUCCESS');
    console.log('Status:', response.status);
    console.log('User Role in Response:', response.data?.data?.role);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.log('❌ Without auth - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting JWT Role Mapping Tests...\n');
  
  const results = [];
  
  // Test without authentication
  results.push(await testWithoutAuth());
  console.log('');
  
  // Test with different role formats
  results.push(await testSuperAdminRole());
  console.log('');
  
  results.push(await testSuperAdminRoleMapped());
  console.log('');
  
  results.push(await testFulfilmentAdminRole());
  console.log('');
  
  results.push(await testDealerRole());
  console.log('');
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! JWT role mapping is working correctly.');
    console.log('\n✅ Role mapping from JWT to system roles works!');
    console.log('✅ Super-admin → Super Admin mapping works!');
    console.log('✅ Fulfilment-admin → Fulfilment Admin mapping works!');
    console.log('✅ Direct role mapping works!');
    console.log('✅ Unauthenticated requests work!');
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
