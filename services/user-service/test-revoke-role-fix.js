const axios = require('axios');

const BASE_URL = 'http://localhost:3001'; // Adjust port as needed
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testRevokeRoleWithEmployeeId() {
  try {
    console.log('🧪 Testing revoke role endpoint with Employee ID...');
    
    // First, let's get a list of employees to find one to test with
    console.log('📋 Fetching employees list...');
    const employeesResponse = await axios.get(`${BASE_URL}/api/users/getemployees`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 10000
    });
    
    if (!employeesResponse.data.data || employeesResponse.data.data.length === 0) {
      console.log('❌ No employees found to test with');
      return;
    }
    
    // Find an employee with a role other than "User"
    const testEmployee = employeesResponse.data.data.find(emp => emp.role !== 'User');
    
    if (!testEmployee) {
      console.log('❌ No employees with roles other than "User" found to test with');
      return;
    }
    
    const employeeId = testEmployee._id;
    const userId = testEmployee.user_id._id || testEmployee.user_id;
    
    console.log(`👤 Testing with employee: ${testEmployee.First_name} (Employee ID: ${employeeId}, User ID: ${userId})`);
    console.log(`📊 Current user role: ${testEmployee.user_id.role}`);
    console.log(`📊 Current employee role: ${testEmployee.role}`);
    
    // Test the revoke role endpoint with Employee ID (this is the correct way)
    console.log('🔄 Revoking role using Employee ID...');
    const revokeResponse = await axios.put(`${BASE_URL}/api/users/revoke-role/${employeeId}`, {}, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 10000
    });
    
    console.log('✅ Revoke role response:', revokeResponse.data);
    
    // Verify the changes by fetching the employee details again
    console.log('🔍 Verifying changes...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/users/getemployees`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 10000
    });
    
    const updatedEmployee = verifyResponse.data.data.find(emp => 
      emp._id === employeeId
    );
    
    if (updatedEmployee) {
      console.log(`📊 Updated user role: ${updatedEmployee.user_id.role}`);
      console.log(`📊 Updated employee role: ${updatedEmployee.role}`);
      
      if (updatedEmployee.user_id.role === 'User' && updatedEmployee.role === 'User') {
        console.log('✅ SUCCESS: Both user and employee roles were updated to "User" using Employee ID');
      } else {
        console.log('❌ FAILED: Roles were not updated correctly');
        console.log(`Expected: user role = "User", employee role = "User"`);
        console.log(`Actual: user role = "${updatedEmployee.user_id.role}", employee role = "${updatedEmployee.role}"`);
      }
    } else {
      console.log('❌ FAILED: Could not find updated employee');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

async function testRevokeRoleWithInvalidEmployeeId() {
  try {
    console.log('\n🧪 Testing revoke role endpoint with invalid Employee ID...');
    
    const invalidEmployeeId = '507f1f77bcf86cd799439011'; // Random MongoDB ObjectId
    
    console.log(`🔄 Attempting to revoke role with invalid Employee ID: ${invalidEmployeeId}`);
    const revokeResponse = await axios.put(`${BASE_URL}/api/users/revoke-role/${invalidEmployeeId}`, {}, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 10000
    });
    
    console.log('✅ Revoke role response:', revokeResponse.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ SUCCESS: Correctly returned 404 for invalid Employee ID');
      console.log('📋 Error message:', error.response.data.message);
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting revoke role tests...\n');
  
  await testRevokeRoleWithEmployeeId();
  await testRevokeRoleWithInvalidEmployeeId();
  
  console.log('\n🏁 Tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testRevokeRoleWithEmployeeId, testRevokeRoleWithInvalidEmployeeId };
