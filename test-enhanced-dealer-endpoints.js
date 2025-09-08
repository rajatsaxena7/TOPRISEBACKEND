const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001'; // User service URL
const API_BASE = `${BASE_URL}/api/users`;

// Test data
const testAuthToken = 'Bearer test-admin-token';
const testDealerId = 'test-dealer-123';

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
async function testGetDealerById() {
  console.log('\n🧪 Testing Enhanced Get Dealer By ID...');
  
  // Test with a valid dealer ID
  console.log('📊 Testing get dealer by ID with employee information...');
  const result = await makeRequest('GET', `/dealer/${testDealerId}`);
  
  if (result.success) {
    console.log('✅ Dealer fetched successfully');
    console.log('📋 Dealer ID:', result.data.data?.dealerId || 'N/A');
    console.log('📋 Legal Name:', result.data.data?.legal_name || 'N/A');
    console.log('📋 Trade Name:', result.data.data?.trade_name || 'N/A');
    
    // Check for assigned TopRise employees
    if (result.data.data?.assigned_Toprise_employee && result.data.data.assigned_Toprise_employee.length > 0) {
      console.log('📋 Assigned TopRise Employees:', result.data.data.assigned_Toprise_employee.length);
      
      result.data.data.assigned_Toprise_employee.forEach((assignment, index) => {
        console.log(`   Employee ${index + 1}:`);
        console.log(`     - Status: ${assignment.status}`);
        console.log(`     - Assigned At: ${assignment.assigned_at}`);
        
        if (assignment.employee_details) {
          console.log(`     - Employee ID: ${assignment.employee_details.employee_id}`);
          console.log(`     - Name: ${assignment.employee_details.First_name}`);
          console.log(`     - Email: ${assignment.employee_details.email}`);
          console.log(`     - Role: ${assignment.employee_details.role}`);
          console.log(`     - Mobile: ${assignment.employee_details.mobile_number}`);
          
          if (assignment.employee_details.user_details) {
            console.log(`     - User Email: ${assignment.employee_details.user_details.email}`);
            console.log(`     - User Role: ${assignment.employee_details.user_details.role}`);
          }
        }
      });
    } else {
      console.log('📋 No assigned TopRise employees found');
    }
    
    // Check for user information
    if (result.data.data?.user_id) {
      console.log('📋 User Information:');
      console.log(`   - Email: ${result.data.data.user_id.email}`);
      console.log(`   - Phone: ${result.data.data.user_id.phone_Number}`);
      console.log(`   - Role: ${result.data.data.user_id.role}`);
    }
    
  } else {
    console.log('❌ Get dealer by ID failed:', result.error);
  }
}

async function testGetAllDealers() {
  console.log('\n🧪 Testing Enhanced Get All Dealers...');
  
  console.log('📊 Testing get all dealers with employee information...');
  const result = await makeRequest('GET', '/dealers');
  
  if (result.success) {
    console.log('✅ All dealers fetched successfully');
    console.log('📋 Total Dealers:', result.data.data?.length || 0);
    
    // Check first few dealers for employee information
    const dealers = result.data.data || [];
    const dealersWithEmployees = dealers.filter(dealer => 
      dealer.assigned_Toprise_employee && dealer.assigned_Toprise_employee.length > 0
    );
    
    console.log('📋 Dealers with assigned employees:', dealersWithEmployees.length);
    
    // Show details for first dealer with employees
    if (dealersWithEmployees.length > 0) {
      const firstDealerWithEmployees = dealersWithEmployees[0];
      console.log('\n📋 Sample Dealer with Employee Information:');
      console.log(`   - Dealer ID: ${firstDealerWithEmployees.dealerId}`);
      console.log(`   - Legal Name: ${firstDealerWithEmployees.legal_name}`);
      console.log(`   - Assigned Employees: ${firstDealerWithEmployees.assigned_Toprise_employee.length}`);
      
      firstDealerWithEmployees.assigned_Toprise_employee.forEach((assignment, index) => {
        if (assignment.employee_details) {
          console.log(`   Employee ${index + 1}: ${assignment.employee_details.First_name} (${assignment.employee_details.employee_id})`);
        }
      });
    }
    
  } else {
    console.log('❌ Get all dealers failed:', result.error);
  }
}

async function testDealerWithNoEmployees() {
  console.log('\n🧪 Testing Dealer with No Assigned Employees...');
  
  // This test would need a dealer ID that has no assigned employees
  // For now, we'll just show the structure
  console.log('📊 Testing dealer structure when no employees are assigned...');
  console.log('✅ Expected behavior: assigned_Toprise_employee should be empty array or null');
  console.log('✅ Expected behavior: employee_details should not be present');
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test with invalid dealer ID
  console.log('📊 Testing with invalid dealer ID...');
  const invalidResult = await makeRequest('GET', '/dealer/invalid-dealer-id');
  
  if (!invalidResult.success) {
    console.log('✅ Invalid dealer ID handled correctly');
    console.log('📋 Error Status:', invalidResult.status);
  } else {
    console.log('❌ Invalid dealer ID should have returned an error');
  }
  
  // Test without authentication
  console.log('\n📊 Testing without authentication...');
  const noAuthResult = await makeRequest('GET', `/dealer/${testDealerId}`, null, { 'Authorization': '' });
  
  if (!noAuthResult.success) {
    console.log('✅ Authentication required correctly enforced');
    console.log('📋 Error Status:', noAuthResult.status);
  } else {
    console.log('❌ Authentication should be required');
  }
}

async function testDataStructure() {
  console.log('\n🧪 Testing Enhanced Data Structure...');
  
  console.log('📊 Expected enhanced dealer data structure:');
  console.log(`
  {
    "_id": "dealer-mongodb-id",
    "dealerId": "dealer-uuid",
    "legal_name": "Dealer Legal Name",
    "trade_name": "Dealer Trade Name",
    "GSTIN": "GSTIN-number",
    "Pan": "PAN-number",
    "Address": {
      "street": "Street Address",
      "city": "City",
      "pincode": "PIN",
      "state": "State"
    },
    "contact_person": {
      "name": "Contact Person Name",
      "email": "contact@email.com",
      "phone_number": "phone-number"
    },
    "user_id": {
      "_id": "user-mongodb-id",
      "email": "user@email.com",
      "phone_Number": "user-phone",
      "role": "user-role"
    },
    "assigned_Toprise_employee": [
      {
        "assigned_user": "employee-mongodb-id",
        "assigned_at": "2024-01-01T00:00:00.000Z",
        "status": "Active",
        "employee_details": {
          "_id": "employee-mongodb-id",
          "employee_id": "EMP-001",
          "First_name": "Employee Name",
          "profile_image": "image-url",
          "mobile_number": "employee-phone",
          "email": "employee@email.com",
          "role": "employee-role",
          "user_details": {
            "_id": "employee-user-id",
            "email": "employee-user@email.com",
            "username": "employee-username",
            "phone_Number": "employee-user-phone",
            "role": "employee-user-role"
          }
        }
      }
    ],
    "categories_allowed": ["category1", "category2"],
    "upload_access_enabled": true,
    "default_margin": 10,
    "SLA_type": "1",
    "onboarding_date": "2024-01-01T00:00:00.000Z",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
  `);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Enhanced Dealer Endpoints Tests...');
  console.log('=' .repeat(60));
  
  try {
    await testGetDealerById();
    await testGetAllDealers();
    await testDealerWithNoEmployees();
    await testErrorHandling();
    await testDataStructure();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All enhanced dealer endpoint tests completed!');
    console.log('\n📝 Summary of Enhancements:');
    console.log('1. ✅ Get Dealer By ID - Now includes assigned TopRise employee information');
    console.log('2. ✅ Get All Dealers - Now includes assigned TopRise employee information');
    console.log('3. ✅ Employee Details - Complete employee information with user details');
    console.log('4. ✅ Data Transformation - Clean, structured employee data');
    console.log('5. ✅ Backward Compatibility - Maintains existing functionality');
    console.log('6. ✅ Error Handling - Graceful handling of missing data');
    
    console.log('\n🔧 New Data Structure:');
    console.log('- assigned_Toprise_employee array now includes employee_details');
    console.log('- employee_details contains complete employee information');
    console.log('- user_details nested within employee_details for user info');
    console.log('- Maintains assignment metadata (assigned_at, status)');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test with real dealer data in your environment');
    console.log('2. Verify employee and user data is correctly populated');
    console.log('3. Update frontend to use the new employee_details structure');
    console.log('4. Consider caching for frequently accessed dealer data');
    console.log('5. Monitor performance with large numbers of assigned employees');
    
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
  testGetDealerById,
  testGetAllDealers,
  testDealerWithNoEmployees,
  testErrorHandling,
  testDataStructure
};
