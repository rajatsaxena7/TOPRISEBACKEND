const mongoose = require('mongoose');
const Order = require('./src/models/order');
const DealerSLA = require('./src/models/dealerSla');
const SLAType = require('./src/models/slaType');
const SLAViolation = require('./src/models/slaViolation');
const slaViolationMiddleware = require('./src/middleware/slaViolationMiddleware');
const slaViolationScheduler = require('./src/jobs/slaViolationScheduler');

// Connect to MongoDB (update with your connection string)
mongoose.connect('mongodb://localhost:27017/your_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testSLAMiddleware() {
  try {
    console.log('🧪 Testing SLA Violation Middleware System...\n');

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
      orderId: 'TEST-ORD-002',
      orderDate: pastOrderDate,
      status: 'Confirmed',
      dealerMapping: [
        {
          sku: 'TEST-SKU-002',
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

    // 4. Test Middleware SLA Violation Check
    console.log('4. Testing Middleware SLA Violation Check...');
    const hasViolation = await slaViolationMiddleware.checkOrderSLAViolation(order);
    
    if (hasViolation) {
      console.log(`⚠️  SLA Violation Detected by Middleware!`);
      
      // 5. Check if violation was recorded
      console.log('5. Checking if violation was recorded...');
      const violations = await SLAViolation.find({ order_id: order._id });
      console.log(`✅ Found ${violations.length} violation(s) recorded for order ${order.orderId}`);
      
      violations.forEach(violation => {
        console.log(`   - Violation ID: ${violation._id}`);
        console.log(`   - Dealer ID: ${violation.dealer_id}`);
        console.log(`   - Violation Minutes: ${violation.violation_minutes}`);
        console.log(`   - Expected Time: ${violation.expected_fulfillment_time.toLocaleString()}`);
        console.log(`   - Actual Time: ${violation.actual_fulfillment_time.toLocaleString()}`);
        console.log(`   - Resolved: ${violation.resolved}\n`);
      });

      // 6. Check updated order
      console.log('6. Checking updated order...');
      const updatedOrder = await Order.findById(order._id);
      console.log(`✅ Order Status: ${updatedOrder.status}`);
      console.log(`   SLA Met: ${updatedOrder.slaInfo?.isSLAMet}`);
      console.log(`   Violation Minutes: ${updatedOrder.slaInfo?.violationMinutes}\n`);

    } else {
      console.log('✅ No SLA violation detected by middleware\n');
    }

    // 7. Test Scheduler Status
    console.log('7. Testing Scheduler Status...');
    const schedulerStatus = slaViolationScheduler.getStatus();
    console.log(`✅ Scheduler Status:`, schedulerStatus);

    // 8. Test Manual Trigger
    console.log('8. Testing Manual SLA Check Trigger...');
    const manualResult = await slaViolationScheduler.triggerManualCheck();
    console.log(`✅ Manual check completed: ${manualResult.processedCount} orders processed, ${manualResult.violationCount} violations found\n`);

    // 9. Test Approaching Violations
    console.log('9. Testing Approaching Violations Check...');
    const approachingViolations = await slaViolationMiddleware.getOrdersApproachingSLAViolation(30);
    console.log(`✅ Found ${approachingViolations.length} orders approaching SLA violation\n`);

    // 10. Cleanup
    console.log('10. Cleaning up test data...');
    await Order.findByIdAndDelete(order._id);
    await DealerSLA.findByIdAndDelete(dealerSLA._id);
    await SLAType.findByIdAndDelete(slaType._id);
    await SLAViolation.deleteMany({ order_id: order._id });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 SLA Middleware Test Completed Successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testSLAMiddleware();
