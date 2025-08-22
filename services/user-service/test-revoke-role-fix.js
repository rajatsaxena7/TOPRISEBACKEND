const axios = require('axios');

const BASE_URL = 'http://localhost:3001'; // Adjust port as needed
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testRevokeRole() {
  try {
    console.log('🧪 Testing revoke role endpoint...');
    
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
    
    const testEmployee = employeesResponse.data.data[0];
    const userId = testEmployee.user_id._id || testEmployee.user_id;
    
    console.log(`👤 Testing with employee: ${testEmployee.First_name} (User ID: ${userId})`);
    console.log(`📊 Current user role: ${testEmployee.user_id.role}`);
    console.log(`📊 Current employee role: ${testEmployee.role}`);
    
    // Test the revoke role endpoint
    console.log('🔄 Revoking role...');
    const revokeResponse = await axios.put(`${BASE_URL}/api/users/revoke-role/${userId}`, {}, {
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
      (emp.user_id._id || emp.user_id) === userId
    );
    
    if (updatedEmployee) {
      console.log(`📊 Updated user role: ${updatedEmployee.user_id.role}`);
      console.log(`📊 Updated employee role: ${updatedEmployee.role}`);
      
      if (updatedEmployee.user_id.role === 'User' && updatedEmployee.role === 'User') {
        console.log('✅ SUCCESS: Both user and employee roles were updated to "User"');
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

async function testRevokeRoleForNonEmployee() {
  try {
    console.log('\n🧪 Testing revoke role for non-employee user...');
    
    // Get a regular user (not an employee)
    const usersResponse = await axios.get(`${BASE_URL}/api/users/getusers`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 10000
    });
    
    if (!usersResponse.data.data || usersResponse.data.data.length === 0) {
      console.log('❌ No users found to test with');
      return;
    }
    
    // Find a user who is not an employee (role is not related to employee roles)
    const regularUser = usersResponse.data.data.find(user => 
      !['Fulfillment-Admin', 'Fulfillment-Staff', 'Inventory-Admin', 'Inventory-Staff'].includes(user.role)
    );
    
    if (!regularUser) {
      console.log('❌ No regular users found to test with');
      return;
    }
    
    console.log(`👤 Testing with regular user: ${regularUser.email} (ID: ${regularUser._id})`);
    console.log(`📊 Current user role: ${regularUser.role}`);
    
    // Test the revoke role endpoint
    console.log('🔄 Revoking role...');
    const revokeResponse = await axios.put(`${BASE_URL}/api/users/revoke-role/${regularUser._id}`, {}, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 10000
    });
    
    console.log('✅ Revoke role response:', revokeResponse.data);
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/users/getusers`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 10000
    });
    
    const updatedUser = verifyResponse.data.data.find(user => user._id === regularUser._id);
    
    if (updatedUser) {
      console.log(`📊 Updated user role: ${updatedUser.role}`);
      
      if (updatedUser.role === 'User') {
        console.log('✅ SUCCESS: User role was updated to "User"');
      } else {
        console.log('❌ FAILED: User role was not updated correctly');
        console.log(`Expected: "User", Actual: "${updatedUser.role}"`);
      }
    } else {
      console.log('❌ FAILED: Could not find updated user');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting revoke role tests...\n');
  
  await testRevokeRole();
  await testRevokeRoleForNonEmployee();
  
  console.log('\n🏁 Tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testRevokeRole, testRevokeRoleForNonEmployee };
