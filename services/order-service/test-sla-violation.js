const mongoose = require('mongoose');
const Order = require('./src/models/order');
const DealerSLA = require('./src/models/dealerSla');
const SLAType = require('./src/models/slaType');
const SLAViolation = require('./src/models/slaViolation');
const { checkSLAViolationOnPacking, recordSLAViolation, updateOrderWithSLAViolation } = require('./src/utils/slaViolationUtils');

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testSLAViolation() {
  try {
    console.log('🧪 Testing SLA Violation System...\n');

    // 1. Create an SLA Type
    console.log('1. Creating SLA Type...');
    const slaType = await SLAType.create({
      name: 'Express',
      description: 'Express delivery within 2 hours',
      expected_hours: 2
    });
    console.log(`✅ Created SLA Type: ${slaType.name} (${slaType.expected_hours} hours)\n`);

    // 2. Create Dealer SLA Configuration
    console.log('2. Creating Dealer SLA Configuration...');
    const dealerSLA = await DealerSLA.create({
      dealer_id: 'test-dealer-123',
      sla_type: slaType._id,
      dispatch_hours: {
        start: 9,
        end: 18
      },
      is_active: true
    });
    console.log(`✅ Created Dealer SLA for dealer: ${dealerSLA.dealer_id}\n`);

    // 3. Create an Order (with past order date to simulate delay)
    console.log('3. Creating Test Order...');
    const pastOrderDate = new Date();
    pastOrderDate.setHours(pastOrderDate.getHours() - 3); // Order placed 3 hours ago

    const order = await Order.create({
      orderId: 'TEST-ORD-001',
      orderDate: pastOrderDate,
      status: 'Confirmed',
      dealerMapping: [
        {
          sku: 'TEST-SKU-001',
          dealerId: 'test-dealer-123',
          status: 'Pending'
        }
      ],
      timestamps: {
        createdAt: pastOrderDate
      },
      customerDetails: {
        name: 'Test Customer',
        phone: '1234567890',
        address: 'Test Address'
      }
    });
    console.log(`✅ Created Order: ${order.orderId} (placed ${pastOrderDate.toLocaleString()})\n`);

    // 4. Test SLA Violation Check
    console.log('4. Testing SLA Violation Check...');
    const packedAt = new Date(); // Current time (3 hours after order)
    const slaCheck = await checkSLAViolationOnPacking(order, packedAt);
    
    if (slaCheck.hasViolation) {
      console.log(`⚠️  SLA Violation Detected!`);
      console.log(`   Expected fulfillment: ${slaCheck.violation.expected_fulfillment_time.toLocaleString()}`);
      console.log(`   Actual packing time: ${slaCheck.violation.actual_fulfillment_time.toLocaleString()}`);
      console.log(`   Violation: ${slaCheck.violation.violation_minutes} minutes late\n`);

      // 5. Record the Violation
      console.log('5. Recording SLA Violation...');
      const violationRecord = await recordSLAViolation(slaCheck.violation);
      console.log(`✅ Recorded SLA Violation: ${violationRecord._id}\n`);

      // 6. Update Order with Violation Info
      console.log('6. Updating Order with Violation Info...');
      await updateOrderWithSLAViolation(order._id, slaCheck.violation);
      console.log(`✅ Updated Order with SLA violation information\n`);

      // 7. Verify the Violation was Recorded
      console.log('7. Verifying Violation Record...');
      const recordedViolation = await SLAViolation.findById(violationRecord._id);
      console.log(`✅ Verified violation record:`);
      console.log(`   Order ID: ${recordedViolation.order_id}`);
      console.log(`   Dealer ID: ${recordedViolation.dealer_id}`);
      console.log(`   Violation Minutes: ${recordedViolation.violation_minutes}`);
      console.log(`   Resolved: ${recordedViolation.resolved}\n`);

      // 8. Check Updated Order
      console.log('8. Checking Updated Order...');
      const updatedOrder = await Order.findById(order._id);
      console.log(`✅ Order Status: ${updatedOrder.status}`);
      console.log(`   SLA Met: ${updatedOrder.slaInfo?.isSLAMet}`);
      console.log(`   Violation Minutes: ${updatedOrder.slaInfo?.violationMinutes}\n`);

    } else {
      console.log('✅ No SLA violation detected\n');
    }

    // 9. Cleanup
    console.log('9. Cleaning up test data...');
    await Order.findByIdAndDelete(order._id);
    await DealerSLA.findByIdAndDelete(dealerSLA._id);
    await SLAType.findByIdAndDelete(slaType._id);
    if (slaCheck.hasViolation) {
      await SLAViolation.findByIdAndDelete(violationRecord._id);
    }
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 SLA Violation Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testSLAViolation();
