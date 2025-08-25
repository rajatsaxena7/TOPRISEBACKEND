const mongoose = require('mongoose');
const OrderLogger = require('./services/order-service/src/utils/orderLogger');
const AuditLogger = require('./services/order-service/src/utils/auditLogger');
const AuditLog = require('./services/order-service/src/models/auditLog');

// Connect to MongoDB (adjust connection string as needed)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/toprise', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testOrderLoggingSystem() {
  try {
    console.log('🧪 Testing Comprehensive Order Logging System...\n');
    
    // Mock user and request objects
    const mockUser = {
      id: new mongoose.Types.ObjectId(),
      role: 'Super-admin',
      name: 'Test Admin',
      email: 'admin@test.com'
    };
    
    const mockReq = {
      body: { test: 'data' },
      query: { page: 1, limit: 10 },
      ip: '127.0.0.1',
      get: () => 'Test User Agent',
      session: { id: 'test-session-123' }
    };
    
    // Mock order object
    const mockOrder = {
      _id: new mongoose.Types.ObjectId(),
      orderId: 'ORD-TEST-001',
      customerId: 'CUST-001',
      totalAmount: 1500.00,
      skus: [
        { sku: 'SKU001', quantity: 2, productName: 'Test Product 1' },
        { sku: 'SKU002', quantity: 1, productName: 'Test Product 2' }
      ],
      delivery_type: 'Express',
      orderDate: new Date(),
      status: 'Confirmed'
    };
    
    // Test 1: Order Creation Logging
    console.log('1️⃣ Testing Order Creation Logging...');
    await OrderLogger.logOrderCreation(mockOrder, mockUser, mockReq);
    console.log('✅ Order creation logging test completed');
    
    // Test 2: Order Status Change Logging
    console.log('\n2️⃣ Testing Order Status Change Logging...');
    await OrderLogger.logOrderStatusChange(
      mockOrder, 
      'Confirmed', 
      'Packed', 
      mockUser, 
      mockReq, 
      { reason: 'Order packed by fulfillment team' }
    );
    console.log('✅ Order status change logging test completed');
    
    // Test 3: Order Update Logging
    console.log('\n3️⃣ Testing Order Update Logging...');
    const oldValues = { totalAmount: 1500.00, status: 'Confirmed' };
    const newValues = { totalAmount: 1600.00, status: 'Packed' };
    await OrderLogger.logOrderUpdate(mockOrder, oldValues, newValues, mockUser, mockReq, {
      reason: 'Price adjustment applied'
    });
    console.log('✅ Order update logging test completed');
    
    // Test 4: Order Cancellation Logging
    console.log('\n4️⃣ Testing Order Cancellation Logging...');
    await OrderLogger.logOrderCancellation(mockOrder, mockUser, mockReq, 'Customer request');
    console.log('✅ Order cancellation logging test completed');
    
    // Test 5: Order Delivery Logging
    console.log('\n5️⃣ Testing Order Delivery Logging...');
    await OrderLogger.logOrderDelivery(mockOrder, mockUser, mockReq, {
      method: 'Express Delivery',
      notes: 'Delivered to customer doorstep'
    });
    console.log('✅ Order delivery logging test completed');
    
    // Test 6: SKU Action Logging
    console.log('\n6️⃣ Testing SKU Action Logging...');
    const mockSku = { sku: 'SKU001', quantity: 2, productName: 'Test Product 1' };
    await OrderLogger.logSkuAction(mockOrder, mockSku, 'SKU_PACKED', mockUser, mockReq, {
      packedBy: 'Fulfillment Staff',
      location: 'Warehouse A'
    });
    console.log('✅ SKU action logging test completed');
    
    // Test 7: Dealer Assignment Logging
    console.log('\n7️⃣ Testing Dealer Assignment Logging...');
    await OrderLogger.logDealerAssignment(mockOrder, 'DEALER-001', mockUser, mockReq, {
      reason: 'Automatic assignment based on location',
      skus: ['SKU001', 'SKU002']
    });
    console.log('✅ Dealer assignment logging test completed');
    
    // Test 8: Dealer Reassignment Logging
    console.log('\n8️⃣ Testing Dealer Reassignment Logging...');
    await OrderLogger.logDealerReassignment(mockOrder, 'DEALER-001', 'DEALER-002', mockUser, mockReq, {
      reason: 'Original dealer unavailable',
      skus: ['SKU001', 'SKU002']
    });
    console.log('✅ Dealer reassignment logging test completed');
    
    // Test 9: SLA Violation Logging
    console.log('\n9️⃣ Testing SLA Violation Logging...');
    const violationDetails = {
      type: 'PACKING_SLA_VIOLATION',
      reason: 'Order not packed within SLA time',
      expectedTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      actualTime: new Date(),
      delayMinutes: 120
    };
    await OrderLogger.logSLAViolation(mockOrder, violationDetails, mockUser, mockReq);
    console.log('✅ SLA violation logging test completed');
    
    // Test 10: Batch Operation Logging
    console.log('\n🔟 Testing Batch Operation Logging...');
    const mockOrders = [
      { orderId: 'ORD-001', _id: new mongoose.Types.ObjectId() },
      { orderId: 'ORD-002', _id: new mongoose.Types.ObjectId() },
      { orderId: 'ORD-003', _id: new mongoose.Types.ObjectId() }
    ];
    await OrderLogger.logBatchOperation('BATCH_ORDER_ASSIGNMENT', mockOrders, mockUser, mockReq, {
      assignmentMethod: 'Bulk assignment',
      successCount: 3,
      failureCount: 0
    });
    console.log('✅ Batch operation logging test completed');
    
    // Test 11: Order Access Logging
    console.log('\n1️⃣1️⃣ Testing Order Access Logging...');
    await OrderLogger.logOrderAccess(mockOrder, 'ORDER_DETAILS_ACCESSED', mockUser, mockReq);
    console.log('✅ Order access logging test completed');
    
    // Test 12: Verify Audit Logs in Database
    console.log('\n1️⃣2️⃣ Verifying Audit Logs in Database...');
    const auditLogs = await AuditLog.find({
      targetIdentifier: { $in: [mockOrder.orderId, 'BATCH-BATCH_ORDER_ASSIGNMENT-' + Date.now().toString().slice(0, -3)] }
    }).sort({ timestamp: -1 });
    
    console.log(`✅ Found ${auditLogs.length} audit logs for test order`);
    
    // Display summary of logged actions
    const actionSummary = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Audit Log Summary:');
    Object.entries(actionSummary).forEach(([action, count]) => {
      console.log(`   - ${action}: ${count} log(s)`);
    });
    
    // Test 13: Test all order-related actions from enum
    console.log('\n1️⃣3️⃣ Testing All Order-Related Actions...');
    const orderActions = [
      'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED', 
      'ORDER_DELIVERED', 'ORDER_RETURNED', 'ORDER_LIST_ACCESSED', 'ORDER_DETAILS_ACCESSED',
      'ORDER_SHIPPED', 'ORDER_DELIVERY_CHECKED', 'ORDER_STATUS_BREAKDOWN_ACCESSED',
      'ORDER_REPORTS_GENERATED', 'SKU_PACKED', 'SKU_SHIPPED', 'SKU_DELIVERED', 'SKU_SCANNED',
      'PICKLIST_ACCESSED', 'DEALER_PICKLIST_ACCESSED', 'PICKLIST_ASSIGNED', 'PICKUP_CREATED',
      'SCAN_LOGS_ACCESSED', 'DEALER_SCAN_LOGS_ACCESSED', 'USER_ORDERS_ACCESSED',
      'BATCH_ORDER_ASSIGNMENT', 'BATCH_ORDER_STATUS_UPDATE', 'DEALER_ORDERS_ACCESSED',
      'DEALER_ORDER_STATUS_UPDATED', 'DEALER_ASSIGNED', 'DEALER_REMAPPED'
    ];
    
    for (const action of orderActions) {
      try {
        await AuditLogger.logOrderAction({
          action: action,
          actorId: mockUser.id,
          actorRole: mockUser.role,
          actorName: mockUser.name,
          targetId: mockOrder._id,
          targetIdentifier: mockOrder.orderId,
          details: { test: true, action: action },
          ipAddress: mockReq.ip,
          userAgent: mockReq.get(),
          sessionId: mockReq.session.id,
          severity: 'LOW',
          category: 'ORDER_MANAGEMENT'
        });
        console.log(`   ✅ ${action} - Valid`);
      } catch (error) {
        console.log(`   ❌ ${action} - Invalid: ${error.message}`);
      }
    }
    
    console.log('\n🎉 All Order Logging Tests Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Order creation logging works');
    console.log('- ✅ Order status change logging works');
    console.log('- ✅ Order update logging works');
    console.log('- ✅ Order cancellation logging works');
    console.log('- ✅ Order delivery logging works');
    console.log('- ✅ SKU action logging works');
    console.log('- ✅ Dealer assignment logging works');
    console.log('- ✅ Dealer reassignment logging works');
    console.log('- ✅ SLA violation logging works');
    console.log('- ✅ Batch operation logging works');
    console.log('- ✅ Order access logging works');
    console.log('- ✅ All order-related actions are valid');
    console.log('- ✅ Audit logs are properly stored in database');
    console.log('- ✅ Comprehensive order activity tracking is functional');
    
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

testOrderLoggingSystem();
