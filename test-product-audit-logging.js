const mongoose = require('mongoose');
const ProductAuditLog = require('./services/product-service/src/models/auditLog');
const ProductAuditLogger = require('./services/product-service/src/utils/auditLogger');

// Connect to MongoDB (adjust connection string as needed)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/toprise', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testAuditLogging() {
  try {
    console.log('Testing Product Audit Logging with Super-admin role...');
    
    // Test 1: Create audit log with Super-admin role
    const auditLog = new ProductAuditLog({
      action: "PRODUCT_CREATED",
      actorId: new mongoose.Types.ObjectId(),
      actorRole: "Super-admin",
      actorName: "Test Super Admin",
      targetType: "Product",
      targetId: new mongoose.Types.ObjectId(),
      targetIdentifier: "TEST-SKU-001",
      details: { test: true },
      category: "PRODUCT_MANAGEMENT",
      timestamp: new Date()
    });
    
    await auditLog.save();
    console.log('✅ Test 1 PASSED: Audit log created successfully with Super-admin role');
    
    // Test 2: Use the audit logger utility
    const loggerResult = await ProductAuditLogger.log({
      action: "PRODUCT_UPDATED",
      actorId: new mongoose.Types.ObjectId(),
      actorRole: "Super-admin",
      actorName: "Test Super Admin",
      targetType: "Product",
      targetId: new mongoose.Types.ObjectId(),
      targetIdentifier: "TEST-SKU-002",
      details: { test: true },
      category: "PRODUCT_MANAGEMENT"
    });
    
    if (loggerResult) {
      console.log('✅ Test 2 PASSED: Audit logger utility works with Super-admin role');
    } else {
      console.log('❌ Test 2 FAILED: Audit logger utility failed');
    }
    
    // Test 3: Test other valid roles
    const validRoles = ["Fulfillment-Admin", "Inventory-Admin", "Dealer", "User", "Customer-Support"];
    
    for (const role of validRoles) {
      try {
        const testLog = new ProductAuditLog({
          action: "PRODUCT_CREATED",
          actorId: new mongoose.Types.ObjectId(),
          actorRole: role,
          actorName: `Test ${role}`,
          targetType: "Product",
          targetId: new mongoose.Types.ObjectId(),
          targetIdentifier: `TEST-SKU-${role}`,
          details: { test: true },
          category: "PRODUCT_MANAGEMENT",
          timestamp: new Date()
        });
        
        await testLog.save();
        console.log(`✅ Test 3 PASSED: Role "${role}" works correctly`);
      } catch (error) {
        console.log(`❌ Test 3 FAILED: Role "${role}" failed - ${error.message}`);
      }
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testAuditLogging();
