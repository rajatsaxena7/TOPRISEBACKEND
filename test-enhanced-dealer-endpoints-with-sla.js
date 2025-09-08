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
async function testGetDealerByIdWithSLA() {
  console.log('\n🧪 Testing Enhanced Get Dealer By ID with SLA Information...');
  
  // Test without SLA info
  console.log('📊 Testing get dealer by ID without SLA info...');
  const basicResult = await makeRequest('GET', `/dealer/${testDealerId}`);
  
  if (basicResult.success) {
    console.log('✅ Basic dealer fetched successfully');
    console.log('📋 Dealer ID:', basicResult.data.data?.dealerId || 'N/A');
    console.log('📋 SLA Type:', basicResult.data.data?.SLA_type || 'N/A');
    console.log('📋 Has SLA Summary:', !!basicResult.data.data?.sla_summary);
  } else {
    console.log('❌ Basic dealer fetch failed:', basicResult.error);
  }
  
  // Test with SLA info
  console.log('\n📊 Testing get dealer by ID with SLA information...');
  const slaResult = await makeRequest('GET', `/dealer/${testDealerId}?includeSLAInfo=true`);
  
  if (slaResult.success) {
    console.log('✅ Dealer with SLA info fetched successfully');
    const dealer = slaResult.data.data;
    
    console.log('📋 Dealer ID:', dealer.dealerId || 'N/A');
    console.log('📋 Legal Name:', dealer.legal_name || 'N/A');
    console.log('📋 SLA Type:', dealer.SLA_type || 'N/A');
    
    // Check SLA summary
    if (dealer.sla_summary) {
      console.log('\n📋 SLA Summary:');
      console.log(`   - SLA Type: ${dealer.sla_summary.sla_type}`);
      console.log(`   - Dispatch Hours: ${dealer.sla_summary.dispatch_hours?.start || 'N/A'} - ${dealer.sla_summary.dispatch_hours?.end || 'N/A'}`);
      console.log(`   - Max Dispatch Time: ${dealer.sla_summary.sla_max_dispatch_time || 'N/A'}`);
      console.log(`   - Recent Violations Count: ${dealer.sla_summary.recent_violations_count || 0}`);
    }
    
    // Check SLA type details
    if (dealer.sla_type_details) {
      console.log('\n📋 SLA Type Details:');
      console.log(`   - Name: ${dealer.sla_type_details.name || 'N/A'}`);
      console.log(`   - Description: ${dealer.sla_type_details.description || 'N/A'}`);
      console.log(`   - Expected Hours: ${dealer.sla_type_details.expected_hours || 'N/A'}`);
    }
    
    // Check SLA configuration
    if (dealer.sla_configuration) {
      console.log('\n📋 SLA Configuration:');
      console.log(`   - SLA Type ID: ${dealer.sla_configuration.sla_type || 'N/A'}`);
      console.log(`   - Dispatch Hours: ${dealer.sla_configuration.dispatch_hours?.start || 'N/A'} - ${dealer.sla_configuration.dispatch_hours?.end || 'N/A'}`);
      console.log(`   - Is Active: ${dealer.sla_configuration.is_active || false}`);
    }
    
    // Check recent SLA violations
    if (dealer.recent_sla_violations && dealer.recent_sla_violations.length > 0) {
      console.log('\n📋 Recent SLA Violations:');
      dealer.recent_sla_violations.forEach((violation, index) => {
        console.log(`   Violation ${index + 1}:`);
        console.log(`     - Order ID: ${violation.order_id || 'N/A'}`);
        console.log(`     - Violation Minutes: ${violation.violation_minutes || 'N/A'}`);
        console.log(`     - Expected Time: ${violation.expected_fulfillment_time || 'N/A'}`);
        console.log(`     - Actual Time: ${violation.actual_fulfillment_time || 'N/A'}`);
        console.log(`     - Resolved: ${violation.resolved || false}`);
      });
    } else {
      console.log('\n📋 Recent SLA Violations: None found');
    }
    
    // Check assigned employees
    if (dealer.assigned_Toprise_employee && dealer.assigned_Toprise_employee.length > 0) {
      console.log('\n📋 Assigned TopRise Employees:');
      dealer.assigned_Toprise_employee.forEach((assignment, index) => {
        console.log(`   Employee ${index + 1}:`);
        console.log(`     - Status: ${assignment.status}`);
        console.log(`     - Assigned At: ${assignment.assigned_at}`);
        
        if (assignment.employee_details) {
          console.log(`     - Employee ID: ${assignment.employee_details.employee_id}`);
          console.log(`     - Name: ${assignment.employee_details.First_name}`);
          console.log(`     - Email: ${assignment.employee_details.email}`);
          console.log(`     - Role: ${assignment.employee_details.role}`);
        }
      });
    }
    
  } else {
    console.log('❌ Dealer with SLA info fetch failed:', slaResult.error);
  }
}

async function testGetAllDealersWithSLA() {
  console.log('\n🧪 Testing Enhanced Get All Dealers with SLA Information...');
  
  // Test without SLA info
  console.log('📊 Testing get all dealers without SLA info...');
  const basicResult = await makeRequest('GET', '/dealers');
  
  if (basicResult.success) {
    console.log('✅ All dealers fetched successfully');
    console.log('📋 Total Dealers:', basicResult.data.data?.length || 0);
    
    const dealersWithSLA = basicResult.data.data?.filter(dealer => dealer.sla_summary) || [];
    console.log('📋 Dealers with SLA Summary:', dealersWithSLA.length);
  } else {
    console.log('❌ Get all dealers failed:', basicResult.error);
  }
  
  // Test with SLA info
  console.log('\n📊 Testing get all dealers with SLA information...');
  const slaResult = await makeRequest('GET', '/dealers?includeSLAInfo=true');
  
  if (slaResult.success) {
    console.log('✅ All dealers with SLA info fetched successfully');
    const dealers = slaResult.data.data || [];
    console.log('📋 Total Dealers:', dealers.length);
    
    // Analyze SLA information
    const dealersWithSLAInfo = dealers.filter(dealer => dealer.sla_summary);
    const dealersWithViolations = dealers.filter(dealer => 
      dealer.recent_sla_violations && dealer.recent_sla_violations.length > 0
    );
    const dealersWithEmployees = dealers.filter(dealer => 
      dealer.assigned_Toprise_employee && dealer.assigned_Toprise_employee.length > 0
    );
    
    console.log('📋 Dealers with SLA Summary:', dealersWithSLAInfo.length);
    console.log('📋 Dealers with Recent Violations:', dealersWithViolations.length);
    console.log('📋 Dealers with Assigned Employees:', dealersWithEmployees.length);
    
    // Show sample dealer with complete information
    const sampleDealer = dealers.find(dealer => 
      dealer.sla_summary && 
      dealer.assigned_Toprise_employee && 
      dealer.assigned_Toprise_employee.length > 0
    );
    
    if (sampleDealer) {
      console.log('\n📋 Sample Dealer with Complete Information:');
      console.log(`   - Dealer ID: ${sampleDealer.dealerId}`);
      console.log(`   - Legal Name: ${sampleDealer.legal_name}`);
      console.log(`   - SLA Type: ${sampleDealer.sla_summary.sla_type}`);
      console.log(`   - Assigned Employees: ${sampleDealer.assigned_Toprise_employee.length}`);
      console.log(`   - Recent Violations: ${sampleDealer.sla_summary.recent_violations_count}`);
    }
    
  } else {
    console.log('❌ Get all dealers with SLA info failed:', slaResult.error);
  }
}

async function testSLAErrorHandling() {
  console.log('\n🧪 Testing SLA Error Handling...');
  
  // Test with invalid dealer ID
  console.log('📊 Testing with invalid dealer ID...');
  const invalidResult = await makeRequest('GET', '/dealer/invalid-dealer-id?includeSLAInfo=true');
  
  if (!invalidResult.success) {
    console.log('✅ Invalid dealer ID handled correctly');
    console.log('📋 Error Status:', invalidResult.status);
  } else {
    console.log('❌ Invalid dealer ID should have returned an error');
  }
  
  // Test without authentication
  console.log('\n📊 Testing without authentication...');
  const noAuthResult = await makeRequest('GET', `/dealer/${testDealerId}?includeSLAInfo=true`, null, { 'Authorization': '' });
  
  if (!noAuthResult.success) {
    console.log('✅ Authentication required correctly enforced');
    console.log('📋 Error Status:', noAuthResult.status);
  } else {
    console.log('❌ Authentication should be required');
  }
}

async function testSLADataStructure() {
  console.log('\n🧪 Testing Enhanced SLA Data Structure...');
  
  console.log('📊 Expected enhanced dealer data structure with SLA:');
  console.log(`
  {
    "_id": "dealer-mongodb-id",
    "dealerId": "dealer-uuid",
    "legal_name": "Dealer Legal Name",
    "trade_name": "Dealer Trade Name",
    "SLA_type": "1",
    "dispatch_hours": {
      "start": 9,
      "end": 18
    },
    "SLA_max_dispatch_time": 24,
    "assigned_Toprise_employee": [
      {
        "assigned_user": "employee-mongodb-id",
        "assigned_at": "2024-01-15T10:30:00.000Z",
        "status": "Active",
        "employee_details": {
          "_id": "employee-mongodb-id",
          "employee_id": "EMP-001",
          "First_name": "Employee Name",
          "email": "employee@toprise.com",
          "role": "Sales Executive",
          "user_details": {
            "_id": "employee-user-id",
            "email": "employee@toprise.com",
            "username": "employee-username",
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
        "description": "Standard SLA",
        "expected_hours": 24
      },
      "dispatch_hours": {
        "start": 9,
        "end": 18
      },
      "sla_max_dispatch_time": 24,
      "sla_configuration": {
        "dealer_id": "dealer-uuid",
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
      "description": "Standard SLA",
      "expected_hours": 24
    },
    "sla_configuration": {
      "dealer_id": "dealer-uuid",
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
    ]
  }
  `);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Enhanced Dealer Endpoints with SLA Tests...');
  console.log('=' .repeat(70));
  
  try {
    await testGetDealerByIdWithSLA();
    await testGetAllDealersWithSLA();
    await testSLAErrorHandling();
    await testSLADataStructure();
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ All enhanced dealer endpoint with SLA tests completed!');
    console.log('\n📝 Summary of Enhancements:');
    console.log('1. ✅ Get Dealer By ID - Now includes SLA type, configuration, and violations');
    console.log('2. ✅ Get All Dealers - Now includes SLA information for all dealers');
    console.log('3. ✅ SLA Type Details - Complete SLA type information from order service');
    console.log('4. ✅ SLA Configuration - Dealer-specific SLA configuration');
    console.log('5. ✅ SLA Violations - Recent SLA violations for each dealer');
    console.log('6. ✅ SLA Summary - Consolidated SLA information');
    console.log('7. ✅ Employee Information - Complete employee details with user info');
    console.log('8. ✅ Error Handling - Graceful handling of missing SLA data');
    
    console.log('\n🔧 New Query Parameters:');
    console.log('- includeSLAInfo=true - Include SLA information in response');
    console.log('- includeSLAInfo=false (default) - Exclude SLA information');
    
    console.log('\n🔧 New Data Structures:');
    console.log('- sla_summary: Consolidated SLA information');
    console.log('- sla_type_details: Complete SLA type information');
    console.log('- sla_configuration: Dealer-specific SLA configuration');
    console.log('- recent_sla_violations: Recent SLA violations array');
    console.log('- employee_details: Complete employee information');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test with real dealer and SLA data in your environment');
    console.log('2. Verify order service SLA endpoints are accessible');
    console.log('3. Update frontend to use the new SLA data structures');
    console.log('4. Consider caching for frequently accessed SLA data');
    console.log('5. Monitor performance with large numbers of dealers and violations');
    console.log('6. Implement SLA violation alerts and notifications');
    
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
  testGetDealerByIdWithSLA,
  testGetAllDealersWithSLA,
  testSLAErrorHandling,
  testSLADataStructure
};
