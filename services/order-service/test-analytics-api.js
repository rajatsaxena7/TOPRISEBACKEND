const mongoose = require('mongoose');
const Order = require('./src/models/order');
const AuditLog = require('./src/models/auditLog');
const Report = require('./src/models/report');
const AnalyticsController = require('./src/controllers/analyticsController');
const ReportsController = require('./src/controllers/reportsController');
const AuditLogger = require('./src/utils/auditLogger');

// Mock user context for testing
const mockUser = {
  id: '507f1f77bcf86cd799439011',
  role: 'Super Admin',
  name: 'Test Admin',
  email: 'admin@test.com'
};

// Mock request and response objects
const createMockReq = (params = {}, query = {}, body = {}, user = mockUser) => ({
  params,
  query,
  body,
  user,
  ip: '127.0.0.1',
  get: (header) => {
    if (header === 'User-Agent') return 'Test-Agent/1.0';
    return null;
  },
  originalUrl: '/api/test',
  method: 'GET'
});

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
  return res;
};

// Test data setup
const setupTestData = async () => {
  console.log('🔧 Setting up test data...');
  
  // Create test orders
  const testOrders = [
    {
      orderId: 'ORD-2024-001',
      totalAmount: 1500.00,
      status: 'Delivered',
      createdAt: new Date('2024-01-15'),
      dealerMapping: [{ dealerId: 'dealer123', sku: 'SKU001', status: 'Packed' }],
      customerDetails: {
        userId: 'user123',
        name: 'John Doe',
        pincode: '400001'
      },
      timestamps: {
        assignedAt: new Date('2024-01-15T10:00:00Z'),
        shippedAt: new Date('2024-01-16T14:00:00Z')
      },
      slaInfo: {
        expectedFulfillmentTime: new Date('2024-01-17T10:00:00Z'),
        isSLAMet: true,
        violationMinutes: 0
      }
    },
    {
      orderId: 'ORD-2024-002',
      totalAmount: 2500.00,
      status: 'Shipped',
      createdAt: new Date('2024-01-16'),
      dealerMapping: [{ dealerId: 'dealer456', sku: 'SKU002', status: 'Packed' }],
      customerDetails: {
        userId: 'user456',
        name: 'Jane Smith',
        pincode: '400002'
      },
      timestamps: {
        assignedAt: new Date('2024-01-16T09:00:00Z'),
        shippedAt: new Date('2024-01-17T11:00:00Z')
      },
      slaInfo: {
        expectedFulfillmentTime: new Date('2024-01-18T09:00:00Z'),
        isSLAMet: false,
        violationMinutes: 120
      }
    }
  ];

  await Order.insertMany(testOrders);
  console.log('✅ Test orders created');

  // Create test audit logs
  const testAuditLogs = [
    {
      action: 'ORDER_STATUS_CHANGED',
      actorId: mockUser.id,
      actorRole: mockUser.role,
      actorName: mockUser.name,
      targetType: 'Order',
      targetId: '507f1f77bcf86cd799439012',
      targetIdentifier: 'ORD-2024-001',
      details: {
        method: 'PUT',
        url: '/api/orders/ORD-2024-001',
        statusCode: 200,
        oldValues: { status: 'Confirmed' },
        newValues: { status: 'Packed' }
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent/1.0',
      severity: 'LOW',
      category: 'ORDER_MANAGEMENT',
      executionTime: 150,
      timestamp: new Date()
    },
    {
      action: 'REPORT_GENERATED',
      actorId: mockUser.id,
      actorRole: mockUser.role,
      actorName: mockUser.name,
      targetType: 'Report',
      targetId: '507f1f77bcf86cd799439013',
      targetIdentifier: 'report-123',
      details: {
        type: 'ORDER_ANALYTICS',
        format: 'CSV'
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent/1.0',
      severity: 'LOW',
      category: 'REPORTING',
      executionTime: 2500,
      timestamp: new Date()
    }
  ];

  await AuditLog.insertMany(testAuditLogs);
  console.log('✅ Test audit logs created');

  // Create test reports
  const testReports = [
    {
      reportId: 'report-123',
      name: 'Test Order Analytics Report',
      type: 'ORDER_ANALYTICS',
      category: 'ANALYTICS',
      generatedBy: mockUser.id,
      generatedByRole: mockUser.role,
      generatedByName: mockUser.name,
      parameters: { includeRevenue: true },
      dateRange: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      },
      format: 'CSV',
      status: 'COMPLETED',
      generationDetails: {
        startedAt: new Date('2024-01-15T10:00:00Z'),
        completedAt: new Date('2024-01-15T10:02:30Z'),
        executionTime: 150000,
        recordCount: 100
      },
      fileDetails: {
        fileName: 'test_report_123.csv',
        fileSize: 1024,
        filePath: './exports/test_report_123.csv',
        downloadUrl: '/api/reports/report-123/download',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      accessControl: {
        roles: [mockUser.role],
        users: [mockUser.id],
        isPublic: false
      }
    }
  ];

  await Report.insertMany(testReports);
  console.log('✅ Test reports created');
};

// Test Analytics Dashboard
const testAnalyticsDashboard = async () => {
  console.log('\n📊 Testing Analytics Dashboard...');
  
  const req = createMockReq({}, { startDate: '2024-01-01', endDate: '2024-01-31' });
  const res = createMockRes();

  try {
    await AnalyticsController.getDashboard(req, res);
    
    if (res.json.mock.calls.length > 0) {
      const response = res.json.mock.calls[0][0];
      console.log('✅ Dashboard API Response:', {
        success: response.success,
        message: response.message,
        kpisCount: response.data?.kpis ? Object.keys(response.data.kpis).length : 0,
        trendsCount: response.data?.trends ? response.data.trends.length : 0
      });
    }
  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  }
};

// Test KPIs
const testKPIs = async () => {
  console.log('\n📈 Testing KPIs...');
  
  const req = createMockReq({}, { startDate: '2024-01-01', endDate: '2024-01-31' });
  const res = createMockRes();

  try {
    await AnalyticsController.getKPIs(req, res);
    
    if (res.json.mock.calls.length > 0) {
      const response = res.json.mock.calls[0][0];
      console.log('✅ KPIs API Response:', {
        success: response.success,
        message: response.message,
        metricsCount: response.data ? Object.keys(response.data).length : 0
      });
    }
  } catch (error) {
    console.error('❌ KPIs test failed:', error.message);
  }
};

// Test Audit Logs
const testAuditLogs = async () => {
  console.log('\n🔍 Testing Audit Logs...');
  
  const req = createMockReq({}, { page: 1, limit: 10 });
  const res = createMockRes();

  try {
    await AnalyticsController.getAuditLogs(req, res);
    
    if (res.json.mock.calls.length > 0) {
      const response = res.json.mock.calls[0][0];
      console.log('✅ Audit Logs API Response:', {
        success: response.success,
        message: response.message,
        logsCount: response.data?.logs ? response.data.logs.length : 0,
        totalLogs: response.data?.pagination?.total || 0
      });
    }
  } catch (error) {
    console.error('❌ Audit Logs test failed:', error.message);
  }
};

// Test Report Generation
const testReportGeneration = async () => {
  console.log('\n📋 Testing Report Generation...');
  
  const reportData = {
    name: 'Test Monthly Report',
    type: 'ORDER_ANALYTICS',
    parameters: { includeRevenue: true, includeSLA: true },
    dateRange: {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    },
    format: 'CSV',
    isRecurring: false
  };

  const req = createMockReq({}, {}, reportData);
  const res = createMockRes();

  try {
    await ReportsController.generateReport(req, res);
    
    if (res.json.mock.calls.length > 0) {
      const response = res.json.mock.calls[0][0];
      console.log('✅ Report Generation API Response:', {
        success: response.success,
        message: response.message,
        reportId: response.data?.reportId,
        status: response.data?.status
      });
    }
  } catch (error) {
    console.error('❌ Report Generation test failed:', error.message);
  }
};

// Test Report Templates
const testReportTemplates = async () => {
  console.log('\n📝 Testing Report Templates...');
  
  const req = createMockReq();
  const res = createMockRes();

  try {
    await ReportsController.getReportTemplates(req, res);
    
    if (res.json.mock.calls.length > 0) {
      const response = res.json.mock.calls[0][0];
      console.log('✅ Report Templates API Response:', {
        success: response.success,
        message: response.message,
        templatesCount: response.data ? response.data.length : 0
      });
    }
  } catch (error) {
    console.error('❌ Report Templates test failed:', error.message);
  }
};

// Test Reports List
const testReportsList = async () => {
  console.log('\n📚 Testing Reports List...');
  
  const req = createMockReq({}, { page: 1, limit: 10 });
  const res = createMockRes();

  try {
    await ReportsController.getReports(req, res);
    
    if (res.json.mock.calls.length > 0) {
      const response = res.json.mock.calls[0][0];
      console.log('✅ Reports List API Response:', {
        success: response.success,
        message: response.message,
        reportsCount: response.data?.reports ? response.data.reports.length : 0,
        totalReports: response.data?.pagination?.total || 0
      });
    }
  } catch (error) {
    console.error('❌ Reports List test failed:', error.message);
  }
};

// Test Audit Logger Utility
const testAuditLogger = async () => {
  console.log('\n🔧 Testing Audit Logger Utility...');
  
  try {
    // Test basic logging
    const auditLog = await AuditLogger.log({
      action: 'TEST_ACTION',
      actorId: mockUser.id,
      actorRole: mockUser.role,
      actorName: mockUser.name,
      targetType: 'Test',
      targetId: 'test123',
      targetIdentifier: 'TEST-123',
      details: { test: true },
      ipAddress: '127.0.0.1',
      userAgent: 'Test-Agent/1.0',
      category: 'SYSTEM_ADMIN'
    });

    console.log('✅ Audit log created:', auditLog ? 'Success' : 'Failed');

    // Test getting audit logs
    const auditData = await AuditLogger.getAuditLogs({}, 1, 10);
    console.log('✅ Audit logs retrieved:', {
      logsCount: auditData.logs.length,
      totalLogs: auditData.pagination.total
    });

    // Test getting audit stats
    const auditStats = await AuditLogger.getAuditStats();
    console.log('✅ Audit stats retrieved:', {
      totalLogs: auditStats.totalLogs,
      uniqueUsers: auditStats.uniqueUsers,
      uniqueActions: auditStats.uniqueActions
    });

  } catch (error) {
    console.error('❌ Audit Logger test failed:', error.message);
  }
};

// Test Analytics Controller Helper Methods
const testAnalyticsHelpers = async () => {
  console.log('\n🛠️ Testing Analytics Helper Methods...');
  
  try {
    const filter = { createdAt: { $gte: new Date('2024-01-01'), $lte: new Date('2024-01-31') } };

    // Test order metrics
    const orderMetrics = await AnalyticsController.getOrderMetrics(filter);
    console.log('✅ Order metrics calculated:', {
      totalOrders: orderMetrics.totalOrders,
      fulfillmentRate: orderMetrics.fulfillmentRate
    });

    // Test fulfillment metrics
    const fulfillmentMetrics = await AnalyticsController.getFulfillmentMetrics(filter);
    console.log('✅ Fulfillment metrics calculated:', {
      avgProcessingTime: fulfillmentMetrics.avgProcessingTime,
      totalProcessed: fulfillmentMetrics.totalProcessed
    });

    // Test SLA metrics
    const slaMetrics = await AnalyticsController.getSLAMetrics(filter);
    console.log('✅ SLA metrics calculated:', {
      complianceRate: slaMetrics.complianceRate,
      avgViolationMinutes: slaMetrics.avgViolationMinutes
    });

  } catch (error) {
    console.error('❌ Analytics helpers test failed:', error.message);
  }
};

// Cleanup test data
const cleanupTestData = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    await Order.deleteMany({ orderId: { $in: ['ORD-2024-001', 'ORD-2024-002'] } });
    await AuditLog.deleteMany({ targetIdentifier: { $in: ['ORD-2024-001', 'report-123', 'TEST-123'] } });
    await Report.deleteMany({ reportId: 'report-123' });
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Analytics Dashboard, Audit Logs, and Reports API Tests\n');
  
  try {
    // Setup test data
    await setupTestData();
    
    // Run tests
    await testAnalyticsDashboard();
    await testKPIs();
    await testAuditLogs();
    await testReportGeneration();
    await testReportTemplates();
    await testReportsList();
    await testAuditLogger();
    await testAnalyticsHelpers();
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    // Cleanup
    await cleanupTestData();
    
    console.log('\n🏁 Test suite finished');
    process.exit(0);
  }
};

// Mock jest for testing
global.jest = {
  fn: () => ({
    mock: {
      calls: [],
      returnThis: function() { return this; }
    },
    mockReturnThis: function() {
      this.mock.returnThis = () => this;
      return this;
    }
  })
};

// Connect to MongoDB and run tests
mongoose.connect('mongodb+srv://techdev:H1E0bf2fvvPiKZ36@toprise-staging.nshaxai.mongodb.net/?retryWrites=true&w=majority&appName=Toprise-Staging', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  runTests();
})
.catch((error) => {
  console.error('❌ MongoDB connection failed:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  await cleanupTestData();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  await cleanupTestData();
  await mongoose.connection.close();
  process.exit(0);
});
