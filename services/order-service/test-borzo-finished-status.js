const mongoose = require('mongoose');
const Order = require('./src/models/order');
const { checkAllSkusFinished, markOrderAsDeliveredIfAllFinished } = require('./src/utils/orderStatusCalculator');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/toprise';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestOrder() {
  console.log('\n📦 Creating test order with multiple SKUs...');
  
  const testOrder = new Order({
    orderId: `TEST_BORZO_${Date.now()}`,
    orderDate: new Date(),
    totalAmount: 1500,
    orderType: "Online",
    orderSource: "Web",
    status: "Confirmed",
    customerDetails: {
      userId: "test-user-123",
      name: "Test Customer",
      phone: "9876543210",
      address: "Test Address",
      pincode: "123456",
      email: "test@example.com"
    },
    paymentType: "Prepaid",
    skus: [
      {
        sku: "SKU001",
        quantity: 2,
        productId: "PROD001",
        productName: "Test Product 1",
        selling_price: 500,
        totalPrice: 1000,
        tracking_info: {
          status: "Confirmed",
          borzo_order_status: "active", // Not finished yet
          timestamps: {
            confirmedAt: new Date()
          }
        }
      },
      {
        sku: "SKU002",
        quantity: 1,
        productId: "PROD002",
        productName: "Test Product 2",
        selling_price: 500,
        totalPrice: 500,
        tracking_info: {
          status: "Confirmed",
          borzo_order_status: "active", // Not finished yet
          timestamps: {
            confirmedAt: new Date()
          }
        }
      }
    ],
    timestamps: {
      createdAt: new Date()
    }
  });

  const savedOrder = await testOrder.save();
  console.log(`✅ Test order created: ${savedOrder.orderId}`);
  return savedOrder;
}

async function simulateBorzoWebhook(orderId, borzoStatus) {
  console.log(`\n🔄 Simulating Borzo webhook with status: "${borzoStatus}"`);
  
  // Simulate the webhook logic
  const order = await Order.findById(orderId);
  if (!order) {
    console.log('❌ Order not found');
    return;
  }

  // Update all SKUs with the new Borzo status
  for (let i = 0; i < order.skus.length; i++) {
    order.skus[i].tracking_info.borzo_order_status = borzoStatus;
    order.skus[i].tracking_info.borzo_last_updated = new Date();
    
    // Update SKU status based on Borzo status
    if (borzoStatus === 'finished') {
      order.skus[i].tracking_info.status = 'Delivered';
      order.skus[i].tracking_info.timestamps.deliveredAt = new Date();
    }
  }

  await order.save();
  console.log(`✅ Updated all SKUs with Borzo status: "${borzoStatus}"`);
}

async function testFinishedStatusLogic(orderId) {
  console.log('\n🧪 Testing "finished" status logic...');
  
  const order = await Order.findById(orderId);
  if (!order) {
    console.log('❌ Order not found');
    return;
  }

  // Check current status
  const finishedCheck = checkAllSkusFinished(order);
  console.log('📊 Current finished status check:', finishedCheck);

  // Try to mark as delivered
  const result = await markOrderAsDeliveredIfAllFinished(orderId);
  console.log('📋 Mark as delivered result:', result);

  return result;
}

async function runTest() {
  try {
    await connectDB();

    // Create test order
    const testOrder = await createTestOrder();

    // Test 1: Check initial status (should not be delivered)
    console.log('\n🔍 Test 1: Initial status check');
    await testFinishedStatusLogic(testOrder._id);

    // Test 2: Update one SKU to "finished"
    console.log('\n🔍 Test 2: One SKU finished');
    await simulateBorzoWebhook(testOrder._id, 'finished');
    await testFinishedStatusLogic(testOrder._id);

    // Test 3: Update all SKUs to "finished" (should mark as delivered)
    console.log('\n🔍 Test 3: All SKUs finished');
    await simulateBorzoWebhook(testOrder._id, 'finished');
    await testFinishedStatusLogic(testOrder._id);

    // Test 4: Check final order status
    console.log('\n🔍 Test 4: Final order status');
    const finalOrder = await Order.findById(testOrder._id);
    console.log('📦 Final order status:', finalOrder.status);
    console.log('📦 Final order timestamps:', finalOrder.timestamps);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  runTest();
}

module.exports = {
  createTestOrder,
  simulateBorzoWebhook,
  testFinishedStatusLogic
};
