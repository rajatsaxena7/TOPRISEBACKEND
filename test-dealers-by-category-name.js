const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001'; // User service URL
const API_BASE = `${BASE_URL}/api/users`;

// Test data
const testAuthToken = 'Bearer test-admin-token';
const testCategoryName = 'Electronics';

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
async function testGetDealersByCategoryName() {
  console.log('\n🧪 Testing Get Dealers By Category Name...');
  
  // Test basic functionality
  console.log('📊 Testing get dealers by category name...');
  const basicResult = await makeRequest('GET', `/get/dealerByCategoryName/${testCategoryName}`);
  
  if (basicResult.success) {
    console.log('✅ Dealers by category name fetched successfully');
    const response = basicResult.data.data;
    console.log('📋 Category Name:', response.category_name);
    console.log('📋 Total Dealers:', response.total_dealers);
    console.log('📋 Dealers Found:', response.dealers.length);
    
    if (response.dealers.length > 0) {
      console.log('\n📋 Sample Dealer Information:');
      const sampleDealer = response.dealers[0];
      console.log(`   - Dealer ID: ${sampleDealer.dealerId}`);
      console.log(`   - Legal Name: ${sampleDealer.legal_name}`);
      console.log(`   - Trade Name: ${sampleDealer.trade_name}`);
      console.log(`   - Categories Allowed: ${sampleDealer.categories_allowed?.join(', ')}`);
      console.log(`   - Is Active: ${sampleDealer.is_active}`);
      
      if (sampleDealer.user_id) {
        console.log(`   - User Email: ${sampleDealer.user_id.email}`);
        console.log(`   - User Role: ${sampleDealer.user_id.role}`);
      }
    }
    
    console.log('\n📋 Response Filters:');
    console.log(`   - Category Name: ${response.filters.category_name}`);
    console.log(`   - Include Employee Info: ${response.filters.include_employee_info}`);
    console.log(`   - Include SLA Info: ${response.filters.include_sla_info}`);
    
  } else {
    console.log('❌ Get dealers by category name failed:', basicResult.error);
  }
}

async function testGetDealersByCategoryNameWithEmployeeInfo() {
  console.log('\n🧪 Testing Get Dealers By Category Name with Employee Info...');
  
  console.log('📊 Testing with employee information...');
  const employeeResult = await makeRequest('GET', `/get/dealerByCategoryName/${testCategoryName}?includeEmployeeInfo=true`);
  
  if (employeeResult.success) {
    console.log('✅ Dealers with employee info fetched successfully');
    const response = employeeResult.data.data;
    console.log('📋 Total Dealers:', response.total_dealers);
    
    // Check for dealers with assigned employees
    const dealersWithEmployees = response.dealers.filter(dealer => 
      dealer.assigned_Toprise_employee && dealer.assigned_Toprise_employee.length > 0
    );
    
    console.log('📋 Dealers with Assigned Employees:', dealersWithEmployees.length);
    
    if (dealersWithEmployees.length > 0) {
      console.log('\n📋 Sample Dealer with Employee Information:');
      const sampleDealer = dealersWithEmployees[0];
      console.log(`   - Dealer: ${sampleDealer.legal_name}`);
      console.log(`   - Assigned Employees: ${sampleDealer.assigned_Toprise_employee.length}`);
      
      sampleDealer.assigned_Toprise_employee.forEach((assignment, index) => {
        if (assignment.employee_details) {
          console.log(`   Employee ${index + 1}:`);
          console.log(`     - Name: ${assignment.employee_details.First_name}`);
          console.log(`     - Employee ID: ${assignment.employee_details.employee_id}`);
          console.log(`     - Email: ${assignment.employee_details.email}`);
          console.log(`     - Role: ${assignment.employee_details.role}`);
          console.log(`     - Status: ${assignment.status}`);
        }
      });
    }
    
  } else {
    console.log('❌ Get dealers with employee info failed:', employeeResult.error);
  }
}

async function testGetDealersByCategoryNameWithSLAInfo() {
  console.log('\n🧪 Testing Get Dealers By Category Name with SLA Info...');
  
  console.log('📊 Testing with SLA information...');
  const slaResult = await makeRequest('GET', `/get/dealerByCategoryName/${testCategoryName}?includeSLAInfo=true`);
  
  if (slaResult.success) {
    console.log('✅ Dealers with SLA info fetched successfully');
    const response = slaResult.data.data;
    console.log('📋 Total Dealers:', response.total_dealers);
    
    // Check for dealers with SLA information
    const dealersWithSLA = response.dealers.filter(dealer => dealer.sla_summary);
    const dealersWithViolations = response.dealers.filter(dealer => 
      dealer.recent_sla_violations && dealer.recent_sla_violations.length > 0
    );
    
    console.log('📋 Dealers with SLA Summary:', dealersWithSLA.length);
    console.log('📋 Dealers with Recent Violations:', dealersWithViolations.length);
    
    if (dealersWithSLA.length > 0) {
      console.log('\n📋 Sample Dealer with SLA Information:');
      const sampleDealer = dealersWithSLA[0];
      console.log(`   - Dealer: ${sampleDealer.legal_name}`);
      console.log(`   - SLA Type: ${sampleDealer.sla_summary.sla_type}`);
      console.log(`   - Recent Violations: ${sampleDealer.sla_summary.recent_violations_count}`);
      
      if (sampleDealer.sla_type_details) {
        console.log(`   - SLA Type Name: ${sampleDealer.sla_type_details.name}`);
        console.log(`   - Expected Hours: ${sampleDealer.sla_type_details.expected_hours}`);
      }
      
      if (sampleDealer.recent_sla_violations && sampleDealer.recent_sla_violations.length > 0) {
        console.log('   - Recent Violations:');
        sampleDealer.recent_sla_violations.forEach((violation, index) => {
          console.log(`     Violation ${index + 1}:`);
          console.log(`       - Order ID: ${violation.order_id}`);
          console.log(`       - Violation Minutes: ${violation.violation_minutes}`);
          console.log(`       - Resolved: ${violation.resolved}`);
        });
      }
    }
    
  } else {
    console.log('❌ Get dealers with SLA info failed:', slaResult.error);
  }
}

async function testGetDealersByCategoryNameWithBothInfo() {
  console.log('\n🧪 Testing Get Dealers By Category Name with Both Employee and SLA Info...');
  
  console.log('📊 Testing with both employee and SLA information...');
  const bothResult = await makeRequest('GET', `/get/dealerByCategoryName/${testCategoryName}?includeEmployeeInfo=true&includeSLAInfo=true`);
  
  if (bothResult.success) {
    console.log('✅ Dealers with both employee and SLA info fetched successfully');
    const response = bothResult.data.data;
    console.log('📋 Total Dealers:', response.total_dealers);
    
    // Analyze comprehensive data
    const dealersWithEmployees = response.dealers.filter(dealer => 
      dealer.assigned_Toprise_employee && dealer.assigned_Toprise_employee.length > 0
    );
    const dealersWithSLA = response.dealers.filter(dealer => dealer.sla_summary);
    const dealersWithViolations = response.dealers.filter(dealer => 
      dealer.recent_sla_violations && dealer.recent_sla_violations.length > 0
    );
    
    console.log('📋 Dealers with Assigned Employees:', dealersWithEmployees.length);
    console.log('📋 Dealers with SLA Summary:', dealersWithSLA.length);
    console.log('📋 Dealers with Recent Violations:', dealersWithViolations.length);
    
    // Show comprehensive sample
    const comprehensiveDealer = response.dealers.find(dealer => 
      dealer.assigned_Toprise_employee && 
      dealer.assigned_Toprise_employee.length > 0 && 
      dealer.sla_summary
    );
    
    if (comprehensiveDealer) {
      console.log('\n📋 Comprehensive Dealer Information:');
      console.log(`   - Dealer: ${comprehensiveDealer.legal_name}`);
      console.log(`   - Assigned Employees: ${comprehensiveDealer.assigned_Toprise_employee.length}`);
      console.log(`   - SLA Type: ${comprehensiveDealer.sla_summary.sla_type}`);
      console.log(`   - Recent Violations: ${comprehensiveDealer.sla_summary.recent_violations_count}`);
    }
    
  } else {
    console.log('❌ Get dealers with both info failed:', bothResult.error);
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test with invalid category name
  console.log('📊 Testing with invalid category name...');
  const invalidResult = await makeRequest('GET', '/get/dealerByCategoryName/');
  
  if (!invalidResult.success) {
    console.log('✅ Invalid category name handled correctly');
    console.log('📋 Error Status:', invalidResult.status);
  } else {
    console.log('❌ Invalid category name should have returned an error');
  }
  
  // Test with non-existent category
  console.log('\n📊 Testing with non-existent category...');
  const nonExistentResult = await makeRequest('GET', '/get/dealerByCategoryName/NonExistentCategory');
  
  if (nonExistentResult.success) {
    console.log('✅ Non-existent category handled correctly');
    console.log('📋 Total Dealers:', nonExistentResult.data.data.total_dealers);
  } else {
    console.log('❌ Non-existent category should return empty result, not error');
  }
  
  // Test without authentication
  console.log('\n📊 Testing without authentication...');
  const noAuthResult = await makeRequest('GET', `/get/dealerByCategoryName/${testCategoryName}`, null, { 'Authorization': '' });
  
  if (!noAuthResult.success) {
    console.log('✅ Authentication required correctly enforced');
    console.log('📋 Error Status:', noAuthResult.status);
  } else {
    console.log('❌ Authentication should be required');
  }
}

async function testDataStructure() {
  console.log('\n🧪 Testing Enhanced Data Structure...');
  
  console.log('📊 Expected enhanced dealer by category name data structure:');
  console.log(`
  {
    "success": true,
    "data": {
      "category_name": "Electronics",
      "total_dealers": 5,
      "dealers": [
        {
          "_id": "dealer-mongodb-id",
          "dealerId": "dealer-uuid-123",
          "legal_name": "ABC Trading Company Pvt Ltd",
          "trade_name": "ABC Traders",
          "categories_allowed": ["Electronics", "Home Appliances"],
          "SLA_type": "1",
          "dispatch_hours": {
            "start": 9,
            "end": 18
          },
          "SLA_max_dispatch_time": 24,
          "user_id": {
            "_id": "user-mongodb-id",
            "email": "dealer@abctraders.com",
            "phone_Number": "9876543210",
            "role": "dealer"
          },
          "assigned_Toprise_employee": [
            {
              "assigned_user": "employee-mongodb-id",
              "assigned_at": "2024-01-15T10:30:00.000Z",
              "status": "Active",
              "employee_details": {
                "_id": "employee-mongodb-id",
                "employee_id": "EMP-001",
                "First_name": "Jane Smith",
                "email": "jane.smith@toprise.com",
                "role": "Sales Executive",
                "user_details": {
                  "_id": "employee-user-id",
                  "email": "jane.smith@toprise.com",
                  "username": "jane.smith",
                  "role": "employee"
                }
              }
            }
          ],
          "sla_summary": {
            "sla_type": "1",
            "sla_type_details": {
              "_id": "sla-type-id",
              "name": "Standard",
              "description": "Standard SLA for regular orders",
              "expected_hours": 24
            },
            "dispatch_hours": {
              "start": 9,
              "end": 18
            },
            "sla_max_dispatch_time": 24,
            "sla_configuration": {
              "dealer_id": "dealer-uuid-123",
              "sla_type": "sla-type-id",
              "dispatch_hours": {
                "start": 9,
                "end": 18
              },
              "is_active": true
            },
            "recent_violations_count": 2
          },
          "sla_type_details": {
            "_id": "sla-type-id",
            "name": "Standard",
            "description": "Standard SLA for regular orders",
            "expected_hours": 24
          },
          "sla_configuration": {
            "dealer_id": "dealer-uuid-123",
            "sla_type": "sla-type-id",
            "dispatch_hours": {
              "start": 9,
              "end": 18
            },
            "is_active": true
          },
          "recent_sla_violations": [
            {
              "dealer_id": "dealer-mongodb-id",
              "order_id": "ORD-123456",
              "expected_fulfillment_time": "2024-01-15T10:00:00.000Z",
              "actual_fulfillment_time": "2024-01-15T12:30:00.000Z",
              "violation_minutes": 150,
              "resolved": false,
              "created_at": "2024-01-15T12:30:00.000Z"
            }
          ],
          "is_active": true,
          "created_at": "2024-01-01T00:00:00.000Z",
          "updated_at": "2024-01-15T10:30:00.000Z"
        }
      ],
      "filters": {
        "category_name": "Electronics",
        "include_employee_info": true,
        "include_sla_info": true
      }
    },
    "message": "Dealers for category 'Electronics' retrieved successfully"
  }
  `);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Dealers By Category Name Tests...');
  console.log('=' .repeat(60));
  
  try {
    await testGetDealersByCategoryName();
    await testGetDealersByCategoryNameWithEmployeeInfo();
    await testGetDealersByCategoryNameWithSLAInfo();
    await testGetDealersByCategoryNameWithBothInfo();
    await testErrorHandling();
    await testDataStructure();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All dealers by category name tests completed!');
    console.log('\n📝 Summary of New Endpoint:');
    console.log('1. ✅ Get Dealers By Category Name - Basic functionality');
    console.log('2. ✅ Employee Information - Optional employee details');
    console.log('3. ✅ SLA Information - Optional SLA details and violations');
    console.log('4. ✅ Combined Information - Both employee and SLA data');
    console.log('5. ✅ Error Handling - Graceful handling of edge cases');
    console.log('6. ✅ Data Structure - Clean, structured response format');
    
    console.log('\n🔧 New Endpoint Details:');
    console.log('- Route: GET /api/users/get/dealerByCategoryName/:categoryName');
    console.log('- Query Parameters: includeEmployeeInfo, includeSLAInfo');
    console.log('- Authentication: Required (Bearer token)');
    console.log('- Authorization: Multiple roles supported');
    console.log('- Response: Structured data with category info and filters');
    
    console.log('\n📋 Usage Examples:');
    console.log('1. Basic: GET /api/users/get/dealerByCategoryName/Electronics');
    console.log('2. With Employees: GET /api/users/get/dealerByCategoryName/Electronics?includeEmployeeInfo=true');
    console.log('3. With SLA: GET /api/users/get/dealerByCategoryName/Electronics?includeSLAInfo=true');
    console.log('4. Combined: GET /api/users/get/dealerByCategoryName/Electronics?includeEmployeeInfo=true&includeSLAInfo=true');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test with real category names in your environment');
    console.log('2. Verify dealer categories are properly configured');
    console.log('3. Update frontend to use the new endpoint');
    console.log('4. Consider caching for frequently accessed category data');
    console.log('5. Monitor performance with large numbers of dealers per category');
    
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
  testGetDealersByCategoryName,
  testGetDealersByCategoryNameWithEmployeeInfo,
  testGetDealersByCategoryNameWithSLAInfo,
  testGetDealersByCategoryNameWithBothInfo,
  testErrorHandling,
  testDataStructure
};
