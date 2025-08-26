const axios = require('axios');

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5002';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';

// Test token (you may need to generate a valid one)
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YzFhYzFhYzFhYzFhYyIsInJvbGUiOiJTdXBlci1hZG1pbiIsImlhdCI6MTcwMzE5MjAwMCwiZXhwIjoxNzAzMjc4NDAwfQ.test';

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testInternalDealerEndpoint() {
  console.log('\n🔍 Testing Internal Dealer Endpoint...');
  
  try {
    // First, let's test the internal dealer endpoint directly
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/internal/dealer/65c1ac1ac1ac1ac1ac1ac1a`, {
      timeout: 5000
    });
    
    console.log('✅ Internal dealer endpoint response:', {
      success: response.data.success,
      hasData: !!response.data.data,
      dealerInfo: response.data.data ? {
        id: response.data.data._id,
        name: response.data.data.name,
        email: response.data.data.email,
        hasAssignedEmployees: !!(response.data.data.assigned_Toprise_employee && response.data.data.assigned_Toprise_employee.length > 0)
      } : null
    });
    
    return response.data.data;
  } catch (error) {
    console.log('❌ Internal dealer endpoint error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    return null;
  }
}

async function testInternalEmployeeEndpoint() {
  console.log('\n🔍 Testing Internal Employee Endpoint...');
  
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/internal/employee/65c1ac1ac1ac1ac1ac1ac1b`, {
      timeout: 5000
    });
    
    console.log('✅ Internal employee endpoint response:', {
      success: response.data.success,
      hasData: !!response.data.data,
      employeeInfo: response.data.data ? {
        id: response.data.data._id,
        name: response.data.data.name,
        email: response.data.data.email,
        role: response.data.data.role
      } : null
    });
    
    return response.data.data;
  } catch (error) {
    console.log('❌ Internal employee endpoint error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    return null;
  }
}

async function testSLAViolationStatsWithDetails() {
  console.log('\n🔍 Testing SLA Violation Stats with Enhanced Details...');
  
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/sla-violations?includeDetails=true&limit=5`, {
      headers,
      timeout: 10000
    });
    
    console.log('✅ SLA Violation Stats response:', {
      success: response.data.success,
      totalViolations: response.data.data?.length || 0,
      hasEnhancedData: false
    });
    
    if (response.data.success && response.data.data && response.data.data.length > 0) {
      const firstViolation = response.data.data[0];
      console.log('📊 First violation details:', {
        hasOrderDetails: !!firstViolation.orderDetails,
        hasDealerInfo: !!firstViolation.dealerInfo,
        hasEmployeeInfo: !!firstViolation.employeeInfo,
        dealerInfo: firstViolation.dealerInfo ? {
          id: firstViolation.dealerInfo._id,
          name: firstViolation.dealerInfo.name,
          email: firstViolation.dealerInfo.email,
          hasAssignedEmployees: !!(firstViolation.dealerInfo.assignedEmployees && firstViolation.dealerInfo.assignedEmployees.length > 0)
        } : null
      });
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ SLA Violation Stats error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    return null;
  }
}

async function testSLAViolationSummary() {
  console.log('\n🔍 Testing SLA Violation Summary...');
  
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/sla-violations/summary?includeDetails=true`, {
      headers,
      timeout: 10000
    });
    
    console.log('✅ SLA Violation Summary response:', {
      success: response.data.success,
      hasData: !!response.data.data,
      summaryInfo: response.data.data ? {
        totalViolations: response.data.data.totalViolations,
        activeViolations: response.data.data.activeViolations,
        resolvedViolations: response.data.data.resolvedViolations,
        hasTopViolatingDealers: !!(response.data.data.topViolatingDealers && response.data.data.topViolatingDealers.length > 0)
      } : null
    });
    
    if (response.data.success && response.data.data && response.data.data.topViolatingDealers) {
      const firstDealer = response.data.data.topViolatingDealers[0];
      console.log('🏆 Top violating dealer details:', {
        hasDealerInfo: !!firstDealer.dealerInfo,
        dealerInfo: firstDealer.dealerInfo ? {
          id: firstDealer.dealerInfo._id,
          name: firstDealer.dealerInfo.name,
          email: firstDealer.dealerInfo.email,
          hasAssignedEmployees: !!(firstDealer.dealerInfo.assignedEmployees && firstDealer.dealerInfo.assignedEmployees.length > 0)
        } : null
      });
    }
    
    return response.data;
  } catch (error) {
    console.log('❌ SLA Violation Summary error:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Dealer Population Fix Tests...\n');
  
  // Test 1: Internal dealer endpoint
  await testInternalDealerEndpoint();
  
  // Test 2: Internal employee endpoint
  await testInternalEmployeeEndpoint();
  
  // Test 3: SLA violation stats with enhanced details
  await testSLAViolationStatsWithDetails();
  
  // Test 4: SLA violation summary
  await testSLAViolationSummary();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📝 Summary:');
  console.log('- Internal dealer and employee endpoints should now work without authentication');
  console.log('- SLA violation statistics should now include dealer information');
  console.log('- Dealer details should include assigned employees information');
  console.log('- Employee/designer details should be populated in the reports');
}

// Run the tests
runAllTests().catch(console.error);
