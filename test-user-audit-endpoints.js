const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const BASE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Test user data
const testUsers = {
  'Super-admin': {
    id: '507f1f77bcf86cd799439011',
    role: 'Super-admin',
    name: 'Super Admin User',
    email: 'superadmin@test.com'
  },
  'Fulfillment-Admin': {
    id: '507f1f77bcf86cd799439012',
    role: 'Fulfillment-Admin',
    name: 'Fulfillment Admin User',
    email: 'fulfillment@test.com'
  },
  'Inventory-Admin': {
    id: '507f1f77bcf86cd799439013',
    role: 'Inventory-Admin',
    name: 'Inventory Admin User',
    email: 'inventory@test.com'
  },
  'Dealer': {
    id: '507f1f77bcf86cd799439014',
    role: 'Dealer',
    name: 'Dealer User',
    email: 'dealer@test.com'
  },
  'User': {
    id: '507f1f77bcf86cd799439015',
    role: 'User',
    name: 'Regular User',
    email: 'user@test.com'
  }
};

// Generate JWT token
function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

// Test data
const testData = {
  user: {
    name: 'Test User',
    email: 'testuser@example.com',
    phone: '+1234567890',
    role: 'User',
    password: 'TestPassword123!'
  },
  dealer: {
    name: 'Test Dealer',
    email: 'testdealer@example.com',
    phone: '+1234567891',
    role: 'Dealer',
    businessName: 'Test Business',
    gstNumber: 'GST123456789',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    }
  },
  employee: {
    name: 'Test Employee',
    email: 'testemployee@example.com',
    phone: '+1234567892',
    role: 'Fulfillment-Staff',
    employeeId: 'EMP001',
    department: 'Fulfillment'
  }
};

// Test functions
async function testUserAuditEndpoints() {
  console.log('🧪 Testing User Service Audit Logging System...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Get all audit logs
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get all audit logs - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get all audit logs - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get all audit logs - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 2: Get audit statistics
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get audit statistics - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get audit statistics - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get audit statistics - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 3: Get audit logs by action
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/logs/action/USER_CREATED`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get audit logs by action - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get audit logs by action - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get audit logs by action - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 4: Get audit logs by user
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/logs/user/${testUsers['Super-admin'].id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get audit logs by user - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get audit logs by user - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get audit logs by user - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 5: Get audit logs by category
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/logs/category/USER_MANAGEMENT`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get audit logs by category - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get audit logs by category - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get audit logs by category - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 6: Get login attempt logs
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/logs/login-attempts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get login attempt logs - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get login attempt logs - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get login attempt logs - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 7: Get security event logs
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/logs/security-events`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get security event logs - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get security event logs - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get security event logs - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 8: Export audit logs
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/audit/export`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Export audit logs - PASSED');
      results.passed++;
    } else {
      console.log('❌ Export audit logs - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Export audit logs - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 9: Get user-specific audit logs
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/${testUsers['User'].id}/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get user-specific audit logs - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get user-specific audit logs - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get user-specific audit logs - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 10: Get dealer-specific audit logs
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/dealer/${testUsers['Dealer'].id}/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get dealer-specific audit logs - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get dealer-specific audit logs - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get dealer-specific audit logs - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 11: Get employee-specific audit logs
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/employee/${testUsers['Fulfillment-Admin'].id}/audit-logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Get employee-specific audit logs - PASSED');
      results.passed++;
    } else {
      console.log('❌ Get employee-specific audit logs - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Get employee-specific audit logs - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 12: Test user creation with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.post(`${BASE_URL}/api/users/createUser`, testData.user, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ User creation with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ User creation with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ User creation with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 13: Test dealer creation with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.post(`${BASE_URL}/api/users/dealer`, testData.dealer, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Dealer creation with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ Dealer creation with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Dealer creation with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 14: Test employee creation with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.post(`${BASE_URL}/api/users/create-Employee`, testData.employee, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Employee creation with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ Employee creation with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Employee creation with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 15: Test user login with audit logging
  try {
    const response = await axios.post(`${BASE_URL}/api/users/login`, {
      email: testData.user.email,
      password: testData.user.password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 200) {
      console.log('✅ User login with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ User login with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ User login with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 16: Test user list access with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ User list access with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ User list access with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ User list access with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 17: Test dealer list access with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/dealers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Dealer list access with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ Dealer list access with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Dealer list access with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 18: Test employee list access with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/getemployees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Employee list access with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ Employee list access with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Employee list access with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 19: Test user stats access with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ User stats access with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ User stats access with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ User stats access with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Test 20: Test dealer stats access with audit logging
  try {
    const token = generateToken(testUsers['Super-admin']);
    const response = await axios.get(`${BASE_URL}/api/users/dealer/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.status === 200) {
      console.log('✅ Dealer stats access with audit logging - PASSED');
      results.passed++;
    } else {
      console.log('❌ Dealer stats access with audit logging - FAILED');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ Dealer stats access with audit logging - FAILED:', error.response?.data?.error || error.message);
    results.failed++;
  }

  // Print summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All User Audit Endpoint Tests Passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }

  return results;
}

// Run tests
if (require.main === module) {
  testUserAuditEndpoints()
    .then(() => {
      console.log('\n🏁 User Audit Endpoint Testing Completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testUserAuditEndpoints };
