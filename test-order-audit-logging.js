const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002'; // Order service URL
const API_BASE = `${BASE_URL}/api/orders`;

// Test data
const testOrderData = {
  customerDetails: {
    userId: "test-customer-123",
    name: "Test Customer",
    phone: "9876543210",
    address: "Test Address, Test City"
  },
  skus: [
    {
      sku: "TEST-SKU-001",
      quantity: 2,
      productId: "test-product-1",
      productName: "Test Product 1",
      selling_price: 100,
      mrp: 120,
      mrp_gst_amount: 21.6,
      gst_percentage: 18,
      gst_amount: 18,
      product_total: 118,
      totalPrice: 236
    }
  ],
  totalAmount: 236,
  delivery_type: "Express",
  paymentType: "COD"
};

const testSuperAdminOrderData = {
  customerDetails: {
    userId: "test-customer-456",
    name: "Test Customer 2",
    phone: "9876543211",
    address: "Test Address 2, Test City"
  },
  skus: [
    {
      sku: "TEST-SKU-002",
      quantity: 1,
      productId: "test-product-2",
      productName: "Test Product 2",
      selling_price: 200,
      mrp: 240,
      mrp_gst_amount: 43.2,
      gst_percentage: 18,
      gst_amount: 36,
      product_total: 236,
      totalPrice: 236
    }
  ],
  totalAmount: 236,
  delivery_type: "Standard",
  paymentType: "Prepaid",
  purchaseOrderId: "PO-TEST-001"
};

// Helper function to make API calls
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${url}`,
      headers: {
        'Content-Type': 'application/json',
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
async function testOrderCreation() {
  console.log('\n🧪 Testing Order Creation Audit Logging...');
  
  const result = await makeRequest('POST', '/create', testOrderData);
  
  if (result.success) {
    console.log('✅ Order created successfully');
    console.log('📋 Order ID:', result.data.data.orderId);
    return result.data.data._id;
  } else {
    console.log('❌ Order creation failed:', result.error);
    return null;
  }
}

async function testSuperAdminOrderCreation() {
  console.log('\n🧪 Testing Super Admin Order Creation Audit Logging...');
  
  const result = await makeRequest('POST', '/create-by-super-admin', testSuperAdminOrderData, {
    'Authorization': 'Bearer test-super-admin-token'
  });
  
  if (result.success) {
    console.log('✅ Super Admin order created successfully');
    console.log('📋 Order ID:', result.data.data.orderId);
    return result.data.data._id;
  } else {
    console.log('❌ Super Admin order creation failed:', result.error);
    return null;
  }
}

async function testDealerAssignment(orderId) {
  console.log('\n🧪 Testing Dealer Assignment Audit Logging...');
  
  const assignmentData = {
    orderId: orderId,
    assignments: [
      {
        sku: "TEST-SKU-001",
        dealerId: "test-dealer-123",
        quantity: 2
      }
    ]
  };
  
  const result = await makeRequest('POST', '/assign-dealers', assignmentData, {
    'Authorization': 'Bearer test-admin-token'
  });
  
  if (result.success) {
    console.log('✅ Dealer assignment successful');
  } else {
    console.log('❌ Dealer assignment failed:', result.error);
  }
}

async function testBatchStatusUpdate(orderId) {
  console.log('\n🧪 Testing Batch Status Update Audit Logging...');
  
  const updateData = {
    updates: [
      {
        orderId: orderId,
        status: "Packed"
      }
    ]
  };
  
  const result = await makeRequest('POST', '/batch-update-status', updateData, {
    'Authorization': 'Bearer test-admin-token'
  });
  
  if (result.success) {
    console.log('✅ Batch status update successful');
  } else {
    console.log('❌ Batch status update failed:', result.error);
  }
}

async function testDealerPacking(orderId) {
  console.log('\n🧪 Testing Dealer Packing Audit Logging...');
  
  const packingData = {
    orderId: orderId,
    dealerId: "test-dealer-123",
    total_weight_kg: "2.5"
  };
  
  const result = await makeRequest('POST', '/mark-dealer-packed', packingData, {
    'Authorization': 'Bearer test-dealer-token'
  });
  
  if (result.success) {
    console.log('✅ Dealer packing successful');
  } else {
    console.log('❌ Dealer packing failed:', result.error);
  }
}

async function testSkuTrackingUpdate(orderId) {
  console.log('\n🧪 Testing SKU Tracking Update Audit Logging...');
  
  const trackingData = {
    status: "Shipped",
    borzo_order_id: "BORZO-123456",
    tracking_url: "https://track.borzo.com/123456",
    tracking_number: "TRK123456"
  };
  
  const result = await makeRequest('PUT', `/sku-tracking/${orderId}/TEST-SKU-001`, trackingData, {
    'Authorization': 'Bearer test-admin-token'
  });
  
  if (result.success) {
    console.log('✅ SKU tracking update successful');
  } else {
    console.log('❌ SKU tracking update failed:', result.error);
  }
}

async function testSkuPacking(orderId) {
  console.log('\n🧪 Testing SKU Packing Audit Logging...');
  
  const packingData = {
    packedBy: "test-dealer-123",
    notes: "Packed with care"
  };
  
  const result = await makeRequest('POST', `/mark-sku-packed/${orderId}/TEST-SKU-001`, packingData, {
    'Authorization': 'Bearer test-dealer-token'
  });
  
  if (result.success) {
    console.log('✅ SKU packing successful');
  } else {
    console.log('❌ SKU packing failed:', result.error);
  }
}

async function testOrderReview(orderId) {
  console.log('\n🧪 Testing Order Review Audit Logging...');
  
  const reviewData = {
    orderId: orderId,
    ratting: 5,
    review: "Excellent service and fast delivery!"
  };
  
  const result = await makeRequest('POST', '/add-review', reviewData, {
    'Authorization': 'Bearer test-customer-token'
  });
  
  if (result.success) {
    console.log('✅ Order review added successfully');
  } else {
    console.log('❌ Order review failed:', result.error);
  }
}

async function testAuditLogRetrieval() {
  console.log('\n🧪 Testing Audit Log Retrieval...');
  
  const result = await makeRequest('GET', '/audit-logs', null, {
    'Authorization': 'Bearer test-admin-token'
  });
  
  if (result.success) {
    console.log('✅ Audit logs retrieved successfully');
    console.log('📊 Total audit logs:', result.data.data?.length || 0);
    
    // Show recent audit logs
    if (result.data.data && result.data.data.length > 0) {
      console.log('\n📋 Recent Audit Logs:');
      result.data.data.slice(0, 5).forEach((log, index) => {
        console.log(`${index + 1}. ${log.action} - ${log.performedBy} (${log.performedByRole}) - ${new Date(log.timestamp).toLocaleString()}`);
      });
    }
  } else {
    console.log('❌ Audit log retrieval failed:', result.error);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Order Audit Logging Tests...');
  console.log('=' .repeat(50));
  
  try {
    // Test order creation
    const orderId = await testOrderCreation();
    
    if (orderId) {
      // Test various order operations
      await testDealerAssignment(orderId);
      await testBatchStatusUpdate(orderId);
      await testDealerPacking(orderId);
      await testSkuTrackingUpdate(orderId);
      await testSkuPacking(orderId);
      await testOrderReview(orderId);
    }
    
    // Test super admin order creation
    await testSuperAdminOrderCreation();
    
    // Test audit log retrieval
    await testAuditLogRetrieval();
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check the OrderAuditLog collection in MongoDB');
    console.log('2. Verify that audit logs are being created for each action');
    console.log('3. Test the audit log endpoints with proper authentication');
    console.log('4. Monitor the logs for any errors or missing data');
    
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
  testOrderCreation,
  testSuperAdminOrderCreation,
  testDealerAssignment,
  testBatchStatusUpdate,
  testDealerPacking,
  testSkuTrackingUpdate,
  testSkuPacking,
  testOrderReview,
  testAuditLogRetrieval
};
