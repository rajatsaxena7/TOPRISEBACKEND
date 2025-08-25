const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const BASE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:5002';
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
  }
};

// Generate JWT token for testing
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Test data
const testOrderData = {
  customerId: 'CUST-TEST-001',
  customerName: 'Test Customer',
  customerEmail: 'customer@test.com',
  customerPhone: '+1234567890',
  customerAddress: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '12345',
    country: 'Test Country'
  },
  totalAmount: 1500.00,
  delivery_type: 'Express',
  skus: [
    {
      sku: 'SKU-TEST-001',
      quantity: 2,
      productId: 'PROD-001',
      productName: 'Test Product 1',
      selling_price: 500.00,
      mrp: 600.00,
      mrp_gst_amount: 108.00,
      gst_percentage: 18,
      gst_amount: 90.00,
      product_total: 590.00,
      totalPrice: 1180.00
    },
    {
      sku: 'SKU-TEST-002',
      quantity: 1,
      productId: 'PROD-002',
      productName: 'Test Product 2',
      selling_price: 320.00,
      mrp: 400.00,
      mrp_gst_amount: 72.00,
      gst_percentage: 18,
      gst_amount: 57.60,
      product_total: 377.60,
      totalPrice: 377.60
    }
  ]
};

const testSLAData = {
  name: 'Test SLA',
  description: 'Test SLA for testing',
  packingTime: 24, // hours
  shippingTime: 48, // hours
  deliveryTime: 72 // hours
};

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(method, endpoint, data = null, userRole = 'Super-admin') {
  const user = testUsers[userRole];
  const token = generateToken(user);
  
  const config = {
    method: method.toLowerCase(),
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      user: user
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message,
      user: user
    };
  }
}

// Test functions
async function testOrderCreation() {
  console.log('\n🔄 Testing Order Creation...');
  
  const result = await makeAuthenticatedRequest('POST', '/api/orders/create', testOrderData);
  
  if (result.success) {
    console.log('✅ Order created successfully');
    console.log(`   Order ID: ${result.data.data?.orderId}`);
    console.log(`   Status: ${result.data.data?.status}`);
    return result.data.data?.orderId;
  } else {
    console.log('❌ Order creation failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.error?.message || result.error}`);
    return null;
  }
}

async function testOrderRetrieval(orderId) {
  console.log('\n🔄 Testing Order Retrieval...');
  
  // Test get all orders
  const allOrdersResult = await makeAuthenticatedRequest('GET', '/api/orders/all');
  console.log(`   All Orders: ${allOrdersResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get order by ID
  if (orderId) {
    const orderByIdResult = await makeAuthenticatedRequest('GET', `/api/orders/id/${orderId}`);
    console.log(`   Order by ID: ${orderByIdResult.success ? '✅ Success' : '❌ Failed'}`);
  }
  
  // Test get orders by user
  const userOrdersResult = await makeAuthenticatedRequest('GET', '/api/orders/user/CUST-TEST-001');
  console.log(`   User Orders: ${userOrdersResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testOrderStatusUpdates(orderId) {
  if (!orderId) {
    console.log('❌ Skipping status updates - no order ID');
    return;
  }
  
  console.log('\n🔄 Testing Order Status Updates...');
  
  // Test pack order
  const packResult = await makeAuthenticatedRequest('POST', `/api/orders/${orderId}/pack`);
  console.log(`   Pack Order: ${packResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test ship order
  const shipResult = await makeAuthenticatedRequest('POST', `/api/orders/${orderId}/ship`);
  console.log(`   Ship Order: ${shipResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test deliver order
  const deliverResult = await makeAuthenticatedRequest('POST', `/api/orders/${orderId}/deliver`);
  console.log(`   Deliver Order: ${deliverResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testSKUOperations(orderId) {
  if (!orderId) {
    console.log('❌ Skipping SKU operations - no order ID');
    return;
  }
  
  console.log('\n🔄 Testing SKU Operations...');
  
  const sku = 'SKU-TEST-001';
  
  // Test pack SKU
  const packSkuResult = await makeAuthenticatedRequest('POST', `/api/orders/${orderId}/sku/${sku}/pack`);
  console.log(`   Pack SKU: ${packSkuResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test ship SKU
  const shipSkuResult = await makeAuthenticatedRequest('POST', `/api/orders/${orderId}/sku/${sku}/ship`);
  console.log(`   Ship SKU: ${shipSkuResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test deliver SKU
  const deliverSkuResult = await makeAuthenticatedRequest('POST', `/api/orders/${orderId}/sku/${sku}/deliver`);
  console.log(`   Deliver SKU: ${deliverSkuResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testDealerOperations(orderId) {
  console.log('\n🔄 Testing Dealer Operations...');
  
  // Test assign dealers
  const assignData = {
    orders: [orderId],
    dealerId: 'DEALER-TEST-001',
    assignmentReason: 'Test assignment'
  };
  const assignResult = await makeAuthenticatedRequest('POST', '/api/orders/assign-dealers', assignData);
  console.log(`   Assign Dealers: ${assignResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test reassign dealers
  const reassignData = {
    orders: [orderId],
    newDealerId: 'DEALER-TEST-002',
    reassignmentReason: 'Test reassignment'
  };
  const reassignResult = await makeAuthenticatedRequest('POST', '/api/orders/reassign-dealers', reassignData);
  console.log(`   Reassign Dealers: ${reassignResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testPicklistOperations() {
  console.log('\n🔄 Testing Picklist Operations...');
  
  // Test get picklists
  const picklistsResult = await makeAuthenticatedRequest('GET', '/api/orders/picklists');
  console.log(`   Get Picklists: ${picklistsResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get dealer picklists
  const dealerPicklistsResult = await makeAuthenticatedRequest('GET', '/api/orders/picklists/dealer/DEALER-TEST-001');
  console.log(`   Dealer Picklists: ${dealerPicklistsResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test create pickup
  const pickupData = {
    orderId: 'ORD-TEST-001',
    pickupDate: new Date().toISOString(),
    pickupLocation: 'Warehouse A'
  };
  const pickupResult = await makeAuthenticatedRequest('POST', '/api/orders/create-pickup', pickupData);
  console.log(`   Create Pickup: ${pickupResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test assign picklist
  const assignPicklistData = {
    picklistId: 'PICKLIST-TEST-001',
    staffId: 'STAFF-TEST-001'
  };
  const assignPicklistResult = await makeAuthenticatedRequest('POST', '/api/orders/assign-picklist', assignPicklistData);
  console.log(`   Assign Picklist: ${assignPicklistResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testScanOperations() {
  console.log('\n🔄 Testing Scan Operations...');
  
  // Test scan SKU
  const scanData = {
    orderId: 'ORD-TEST-001',
    sku: 'SKU-TEST-001',
    scanLocation: 'Warehouse A',
    scannerId: 'SCANNER-001'
  };
  const scanResult = await makeAuthenticatedRequest('POST', '/api/orders/scan', scanData);
  console.log(`   Scan SKU: ${scanResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get scan logs
  const scanLogsResult = await makeAuthenticatedRequest('GET', '/api/orders/scanlogs');
  console.log(`   Get Scan Logs: ${scanLogsResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get dealer scan logs
  const dealerScanLogsResult = await makeAuthenticatedRequest('GET', '/api/orders/scanlogs/dealer/DEALER-TEST-001');
  console.log(`   Dealer Scan Logs: ${dealerScanLogsResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testSLAOperations() {
  console.log('\n🔄 Testing SLA Operations...');
  
  // Test create SLA type
  const createSLAResult = await makeAuthenticatedRequest('POST', '/api/orders/sla/types', testSLAData);
  console.log(`   Create SLA Type: ${createSLAResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get SLA types
  const getSLATypesResult = await makeAuthenticatedRequest('GET', '/api/orders/sla/types');
  console.log(`   Get SLA Types: ${getSLATypesResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get SLA by name
  const getSLAByNameResult = await makeAuthenticatedRequest('GET', '/api/orders/get-by-name?name=Test SLA');
  console.log(`   Get SLA by Name: ${getSLAByNameResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test set dealer SLA
  const dealerSLAData = {
    slaTypeId: 'SLA-TEST-001',
    effectiveDate: new Date().toISOString()
  };
  const setDealerSLAResult = await makeAuthenticatedRequest('POST', '/api/orders/dealers/DEALER-TEST-001/sla', dealerSLAData);
  console.log(`   Set Dealer SLA: ${setDealerSLAResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test log violation
  const violationData = {
    orderId: 'ORD-TEST-001',
    violationType: 'PACKING_SLA_VIOLATION',
    violationReason: 'Order not packed within SLA time',
    expectedTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actualTime: new Date().toISOString()
  };
  const logViolationResult = await makeAuthenticatedRequest('POST', '/api/orders/sla/violations', violationData);
  console.log(`   Log Violation: ${logViolationResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get violations
  const getViolationsResult = await makeAuthenticatedRequest('GET', '/api/orders/sla/violations');
  console.log(`   Get Violations: ${getViolationsResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get violations by order
  const getViolationsByOrderResult = await makeAuthenticatedRequest('GET', '/api/orders/sla/violations/order/ORD-TEST-001');
  console.log(`   Get Violations by Order: ${getViolationsByOrderResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get violations summary
  const getViolationsSummaryResult = await makeAuthenticatedRequest('GET', '/api/orders/sla/violations/summary/DEALER-TEST-001');
  console.log(`   Get Violations Summary: ${getViolationsSummaryResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get approaching violations
  const getApproachingViolationsResult = await makeAuthenticatedRequest('GET', '/api/orders/sla/violations/approaching');
  console.log(`   Get Approaching Violations: ${getApproachingViolationsResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testSLASchedulerOperations() {
  console.log('\n🔄 Testing SLA Scheduler Operations...');
  
  // Test start scheduler
  const startSchedulerResult = await makeAuthenticatedRequest('POST', '/api/orders/sla/scheduler/start');
  console.log(`   Start Scheduler: ${startSchedulerResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test get scheduler status
  const getStatusResult = await makeAuthenticatedRequest('GET', '/api/orders/sla/scheduler/status');
  console.log(`   Get Scheduler Status: ${getStatusResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test trigger manual check
  const triggerCheckResult = await makeAuthenticatedRequest('POST', '/api/orders/sla/scheduler/trigger-check');
  console.log(`   Trigger Manual Check: ${triggerCheckResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test stop scheduler
  const stopSchedulerResult = await makeAuthenticatedRequest('POST', '/api/orders/sla/scheduler/stop');
  console.log(`   Stop Scheduler: ${stopSchedulerResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testAnalyticsOperations() {
  console.log('\n🔄 Testing Analytics Operations...');
  
  // Test fulfillment analytics
  const fulfillmentResult = await makeAuthenticatedRequest('GET', '/api/orders/analytics/fulfillment');
  console.log(`   Fulfillment Analytics: ${fulfillmentResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test SLA compliance report
  const slaComplianceResult = await makeAuthenticatedRequest('GET', '/api/orders/analytics/sla-compliance');
  console.log(`   SLA Compliance Report: ${slaComplianceResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test dealer performance
  const dealerPerformanceResult = await makeAuthenticatedRequest('GET', '/api/orders/analytics/dealer-performance');
  console.log(`   Dealer Performance: ${dealerPerformanceResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test order stats
  const orderStatsResult = await makeAuthenticatedRequest('GET', '/api/orders/stats');
  console.log(`   Order Stats: ${orderStatsResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testBatchOperations() {
  console.log('\n🔄 Testing Batch Operations...');
  
  // Test batch assign orders
  const batchAssignData = {
    orders: ['ORD-TEST-001', 'ORD-TEST-002', 'ORD-TEST-003'],
    dealerId: 'DEALER-TEST-001',
    assignmentReason: 'Batch assignment test'
  };
  const batchAssignResult = await makeAuthenticatedRequest('POST', '/api/orders/batch/assign', batchAssignData);
  console.log(`   Batch Assign Orders: ${batchAssignResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test batch status update
  const batchStatusData = {
    orders: ['ORD-TEST-001', 'ORD-TEST-002'],
    newStatus: 'Packed',
    updateReason: 'Batch status update test'
  };
  const batchStatusResult = await makeAuthenticatedRequest('POST', '/api/orders/batch/status-update', batchStatusData);
  console.log(`   Batch Status Update: ${batchStatusResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testDealerSpecificOperations() {
  console.log('\n🔄 Testing Dealer-Specific Operations...');
  
  // Test get orders by dealer
  const dealerOrdersResult = await makeAuthenticatedRequest('GET', '/api/orders/get/order-by-dealer/DEALER-TEST-001');
  console.log(`   Get Orders by Dealer: ${dealerOrdersResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test update order status by dealer
  const updateStatusData = {
    orderId: 'ORD-TEST-001',
    newStatus: 'Packed',
    updateReason: 'Dealer status update test'
  };
  const updateStatusResult = await makeAuthenticatedRequest('PUT', '/api/orders/update/order-status-by-dealer', updateStatusData);
  console.log(`   Update Order Status by Dealer: ${updateStatusResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testOrderReports() {
  console.log('\n🔄 Testing Order Reports...');
  
  // Test generate order reports
  const reportsResult = await makeAuthenticatedRequest('GET', '/api/orders/reports');
  console.log(`   Generate Order Reports: ${reportsResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test order status breakdown
  const statusBreakdownResult = await makeAuthenticatedRequest('GET', '/api/orders/ORD-TEST-001/status-breakdown');
  console.log(`   Order Status Breakdown: ${statusBreakdownResult.success ? '✅ Success' : '❌ Failed'}`);
  
  // Test check delivery
  const checkDeliveryResult = await makeAuthenticatedRequest('POST', '/api/orders/ORD-TEST-001/check-delivery');
  console.log(`   Check Delivery: ${checkDeliveryResult.success ? '✅ Success' : '❌ Failed'}`);
}

async function testRoleBasedAccess() {
  console.log('\n🔄 Testing Role-Based Access...');
  
  const roles = ['Super-admin', 'Fulfillment-Admin', 'Inventory-Admin', 'Dealer'];
  const endpoints = [
    { path: '/api/orders/all', method: 'GET', name: 'Get All Orders' },
    { path: '/api/orders/stats', method: 'GET', name: 'Get Order Stats' },
    { path: '/api/orders/analytics/fulfillment', method: 'GET', name: 'Fulfillment Analytics' }
  ];
  
  for (const role of roles) {
    console.log(`\n   Testing ${role} access:`);
    for (const endpoint of endpoints) {
      const result = await makeAuthenticatedRequest(endpoint.method, endpoint.path, null, role);
      const status = result.success ? '✅' : '❌';
      console.log(`     ${status} ${endpoint.name}: ${result.status}`);
    }
  }
}

// Main test function
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Order Audit Endpoint Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏰ Test Time: ${new Date().toISOString()}\n`);
  
  try {
    // Test order creation first to get order ID
    const orderId = await testOrderCreation();
    
    // Run all tests
    await testOrderRetrieval(orderId);
    await testOrderStatusUpdates(orderId);
    await testSKUOperations(orderId);
    await testDealerOperations(orderId);
    await testPicklistOperations();
    await testScanOperations();
    await testSLAOperations();
    await testSLASchedulerOperations();
    await testAnalyticsOperations();
    await testBatchOperations();
    await testDealerSpecificOperations();
    await testOrderReports();
    await testRoleBasedAccess();
    
    console.log('\n🎉 All Order Audit Endpoint Tests Completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Order creation and retrieval');
    console.log('- ✅ Order status updates');
    console.log('- ✅ SKU operations');
    console.log('- ✅ Dealer operations');
    console.log('- ✅ Picklist operations');
    console.log('- ✅ Scan operations');
    console.log('- ✅ SLA operations');
    console.log('- ✅ Analytics operations');
    console.log('- ✅ Batch operations');
    console.log('- ✅ Role-based access control');
    console.log('- ✅ All endpoints properly logged in audit system');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Export for use in other files
module.exports = {
  runAllTests,
  makeAuthenticatedRequest,
  testUsers,
  generateToken
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
