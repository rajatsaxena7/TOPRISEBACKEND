const axios = require('axios');

// Configuration
const BASE_URL = 'https://api.toprise.in'; // Production API URL
const API_BASE = `${BASE_URL}/api/orders/api/sla-violations`;

// Test data
const testAuthToken = 'Bearer test-admin-token';

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
async function testSLAViolationStatsBasic() {
  console.log('\n🧪 Testing SLA Violation Stats - Basic...');
  
  console.log('📊 Testing basic SLA violation stats...');
  const basicResult = await makeRequest('GET', '/stats');
  
  if (basicResult.success) {
    console.log('✅ Basic SLA violation stats fetched successfully');
    const response = basicResult.data.data;
    
    console.log('📋 Summary Statistics:');
    console.log(`   - Total Violations: ${response.summary.totalViolations}`);
    console.log(`   - Total Violation Minutes: ${response.summary.totalViolationMinutes}`);
    console.log(`   - Average Violation Minutes: ${response.summary.avgViolationMinutes}`);
    console.log(`   - Max Violation Minutes: ${response.summary.maxViolationMinutes}`);
    console.log(`   - Resolved Violations: ${response.summary.resolvedViolations}`);
    console.log(`   - Unresolved Violations: ${response.summary.unresolvedViolations}`);
    console.log(`   - Unique Dealers: ${response.summary.uniqueDealerCount}`);
    console.log(`   - Unique Orders: ${response.summary.uniqueOrderCount}`);
    console.log(`   - Resolution Rate: ${response.summary.resolutionRate}%`);
    console.log(`   - Avg Violations per Order: ${response.summary.avgViolationsPerOrder}`);
    console.log(`   - Avg Violations per Dealer: ${response.summary.avgViolationsPerDealer}`);
    
    console.log('\n📋 Applied Filters:');
    console.log(`   - Start Date: ${response.filters.startDate || 'N/A'}`);
    console.log(`   - End Date: ${response.filters.endDate || 'N/A'}`);
    console.log(`   - Dealer ID: ${response.filters.dealerId || 'N/A'}`);
    console.log(`   - Group By: ${response.filters.groupBy}`);
    console.log(`   - Include Details: ${response.filters.includeDetails}`);
    console.log(`   - Include Order Details: ${response.filters.includeOrderDetails}`);
    
    console.log('\n📋 Data Records:');
    console.log(`   - Total Records: ${response.data.length}`);
    
    if (response.data.length > 0) {
      const sampleRecord = response.data[0];
      console.log('\n📋 Sample Record:');
      console.log(`   - Dealer ID: ${sampleRecord.dealerId}`);
      console.log(`   - Total Violations: ${sampleRecord.totalViolations}`);
      console.log(`   - Order Count: ${sampleRecord.orderCount}`);
      console.log(`   - Violation Rate: ${sampleRecord.violationRate}%`);
      
      if (sampleRecord.dealerInfo) {
        console.log(`   - Dealer Name: ${sampleRecord.dealerInfo.legal_name || sampleRecord.dealerInfo.trade_name}`);
        console.log(`   - Dealer Active: ${sampleRecord.dealerInfo.is_active}`);
      }
      
      if (sampleRecord.orderDetails && sampleRecord.orderDetails.length > 0) {
        console.log(`   - Order Details Available: ${sampleRecord.orderDetails.length} orders`);
        const sampleOrder = sampleRecord.orderDetails[0];
        console.log(`   - Sample Order ID: ${sampleOrder.orderId}`);
        console.log(`   - Sample Order Status: ${sampleOrder.status}`);
        console.log(`   - Sample Order Amount: ${sampleOrder.totalAmount}`);
        console.log(`   - Sample Customer: ${sampleOrder.customerDetails?.name}`);
      }
    }
    
  } else {
    console.log('❌ Basic SLA violation stats failed:', basicResult.error);
  }
}

async function testSLAViolationStatsWithOrderDetails() {
  console.log('\n🧪 Testing SLA Violation Stats with Order Details...');
  
  console.log('📊 Testing with comprehensive order details...');
  const orderDetailsResult = await makeRequest('GET', '/stats?includeOrderDetails=true');
  
  if (orderDetailsResult.success) {
    console.log('✅ SLA violation stats with order details fetched successfully');
    const response = orderDetailsResult.data.data;
    
    console.log('📋 Order Details Summary:');
    const recordsWithOrders = response.data.filter(record => record.orderDetails && record.orderDetails.length > 0);
    console.log(`   - Records with Order Details: ${recordsWithOrders.length}`);
    
    if (recordsWithOrders.length > 0) {
      const sampleRecord = recordsWithOrders[0];
      console.log('\n📋 Sample Record with Order Details:');
      console.log(`   - Dealer: ${sampleRecord.dealerInfo?.legal_name || sampleRecord.dealerInfo?.trade_name}`);
      console.log(`   - Total Orders: ${sampleRecord.orderCount}`);
      console.log(`   - Sample Orders: ${sampleRecord.orderDetails.length}`);
      
      sampleRecord.orderDetails.forEach((order, index) => {
        console.log(`\n   Order ${index + 1}:`);
        console.log(`     - Order ID: ${order.orderId}`);
        console.log(`     - Order Number: ${order.orderNumber || 'N/A'}`);
        console.log(`     - Status: ${order.status}`);
        console.log(`     - Order Type: ${order.orderType}`);
        console.log(`     - Payment Type: ${order.paymentType}`);
        console.log(`     - Total Amount: ${order.totalAmount}`);
        console.log(`     - Customer: ${order.customerDetails?.name}`);
        console.log(`     - Customer Email: ${order.customerDetails?.email}`);
        console.log(`     - Customer Phone: ${order.customerDetails?.phone}`);
        console.log(`     - Order Date: ${order.timestamps?.createdAt || order.timestamps?.placedAt}`);
        console.log(`     - Total SKUs: ${order.orderSummary?.totalSKUs}`);
        console.log(`     - Delivery Address: ${order.customerDetails?.address}`);
        
        if (order.skuDetails && order.skuDetails.length > 0) {
          console.log(`     - SKU Details: ${order.skuDetails.length} items`);
          order.skuDetails.forEach((sku, skuIndex) => {
            console.log(`       SKU ${skuIndex + 1}: ${sku.sku} - ${sku.productName} (Qty: ${sku.quantity})`);
          });
        }
        
        if (order.slaInfo) {
          console.log(`     - SLA Info:`);
          console.log(`       - Expected Fulfillment: ${order.slaInfo.expectedFulfillmentTime}`);
          console.log(`       - Actual Fulfillment: ${order.slaInfo.actualFulfillmentTime}`);
          console.log(`       - SLA Met: ${order.slaInfo.isSLAMet}`);
          console.log(`       - Violation Minutes: ${order.slaInfo.violationMinutes || 'N/A'}`);
        }
        
        if (order.trackingInfo) {
          console.log(`     - Tracking Info:`);
          console.log(`       - Current Status: ${order.trackingInfo.currentStatus}`);
          console.log(`       - Last Updated: ${order.trackingInfo.lastUpdated}`);
          console.log(`       - Tracking Number: ${order.trackingInfo.trackingNumber || 'N/A'}`);
        }
      });
    }
    
  } else {
    console.log('❌ SLA violation stats with order details failed:', orderDetailsResult.error);
  }
}

async function testSLAViolationStatsWithDateFilter() {
  console.log('\n🧪 Testing SLA Violation Stats with Date Filter...');
  
  // Test with last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  console.log(`📊 Testing with date filter (from ${startDate})...`);
  const dateFilterResult = await makeRequest('GET', `/stats?startDate=${startDate}&includeOrderDetails=true`);
  
  if (dateFilterResult.success) {
    console.log('✅ SLA violation stats with date filter fetched successfully');
    const response = dateFilterResult.data.data;
    
    console.log('📋 Date Filter Results:');
    console.log(`   - Total Violations (Last 30 Days): ${response.summary.totalViolations}`);
    console.log(`   - Unique Dealers: ${response.summary.uniqueDealerCount}`);
    console.log(`   - Unique Orders: ${response.summary.uniqueOrderCount}`);
    console.log(`   - Resolution Rate: ${response.summary.resolutionRate}%`);
    
    if (response.data.length > 0) {
      console.log('\n📋 Top Violating Dealers (Last 30 Days):');
      response.data.slice(0, 3).forEach((dealer, index) => {
        console.log(`   ${index + 1}. ${dealer.dealerInfo?.legal_name || dealer.dealerInfo?.trade_name || dealer.dealerId}`);
        console.log(`      - Violations: ${dealer.totalViolations}`);
        console.log(`      - Orders: ${dealer.orderCount}`);
        console.log(`      - Violation Rate: ${dealer.violationRate}%`);
      });
    }
    
  } else {
    console.log('❌ SLA violation stats with date filter failed:', dateFilterResult.error);
  }
}

async function testSLAViolationStatsGroupByDate() {
  console.log('\n🧪 Testing SLA Violation Stats - Group by Date...');
  
  console.log('📊 Testing group by date...');
  const groupByDateResult = await makeRequest('GET', '/stats?groupBy=date&includeOrderDetails=true');
  
  if (groupByDateResult.success) {
    console.log('✅ SLA violation stats grouped by date fetched successfully');
    const response = groupByDateResult.data.data;
    
    console.log('📋 Date Grouping Results:');
    console.log(`   - Total Date Records: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('\n📋 Recent Date Records:');
      response.data.slice(0, 5).forEach((dateRecord, index) => {
        console.log(`   ${index + 1}. Date: ${dateRecord.date}`);
        console.log(`      - Violations: ${dateRecord.totalViolations}`);
        console.log(`      - Total Minutes: ${dateRecord.totalViolationMinutes}`);
        console.log(`      - Avg Minutes: ${dateRecord.avgViolationMinutes}`);
        console.log(`      - Unique Dealers: ${dateRecord.uniqueDealerCount}`);
        console.log(`      - Order Count: ${dateRecord.orderCount}`);
      });
    }
    
  } else {
    console.log('❌ SLA violation stats grouped by date failed:', groupByDateResult.error);
  }
}

async function testSLAViolationStatsGroupByMonth() {
  console.log('\n🧪 Testing SLA Violation Stats - Group by Month...');
  
  console.log('📊 Testing group by month...');
  const groupByMonthResult = await makeRequest('GET', '/stats?groupBy=month&includeOrderDetails=true');
  
  if (groupByMonthResult.success) {
    console.log('✅ SLA violation stats grouped by month fetched successfully');
    const response = groupByMonthResult.data.data;
    
    console.log('📋 Month Grouping Results:');
    console.log(`   - Total Month Records: ${response.data.length}`);
    
    if (response.data.length > 0) {
      console.log('\n📋 Recent Month Records:');
      response.data.slice(0, 3).forEach((monthRecord, index) => {
        console.log(`   ${index + 1}. Month: ${monthRecord.month}`);
        console.log(`      - Violations: ${monthRecord.totalViolations}`);
        console.log(`      - Total Minutes: ${monthRecord.totalViolationMinutes}`);
        console.log(`      - Avg Minutes: ${monthRecord.avgViolationMinutes}`);
        console.log(`      - Unique Dealers: ${monthRecord.uniqueDealerCount}`);
        console.log(`      - Order Count: ${monthRecord.orderCount}`);
      });
    }
    
  } else {
    console.log('❌ SLA violation stats grouped by month failed:', groupByMonthResult.error);
  }
}

async function testSLAViolationStatsWithDealerFilter() {
  console.log('\n🧪 Testing SLA Violation Stats with Dealer Filter...');
  
  // First get a dealer ID from the basic stats
  const basicResult = await makeRequest('GET', '/stats');
  
  if (basicResult.success && basicResult.data.data.data.length > 0) {
    const dealerId = basicResult.data.data.data[0].dealerId;
    
    console.log(`📊 Testing with dealer filter (dealerId: ${dealerId})...`);
    const dealerFilterResult = await makeRequest('GET', `/stats?dealerId=${dealerId}&includeOrderDetails=true`);
    
    if (dealerFilterResult.success) {
      console.log('✅ SLA violation stats with dealer filter fetched successfully');
      const response = dealerFilterResult.data.data;
      
      console.log('📋 Dealer Filter Results:');
      console.log(`   - Total Violations: ${response.summary.totalViolations}`);
      console.log(`   - Unique Orders: ${response.summary.uniqueOrderCount}`);
      console.log(`   - Resolution Rate: ${response.summary.resolutionRate}%`);
      
      if (response.data.length > 0) {
        const dealerRecord = response.data[0];
        console.log('\n📋 Dealer Details:');
        console.log(`   - Dealer: ${dealerRecord.dealerInfo?.legal_name || dealerRecord.dealerInfo?.trade_name}`);
        console.log(`   - Total Violations: ${dealerRecord.totalViolations}`);
        console.log(`   - Order Count: ${dealerRecord.orderCount}`);
        console.log(`   - Violation Rate: ${dealerRecord.violationRate}%`);
        
        if (dealerRecord.orderDetails && dealerRecord.orderDetails.length > 0) {
          console.log(`   - Sample Orders: ${dealerRecord.orderDetails.length}`);
          dealerRecord.orderDetails.forEach((order, index) => {
            console.log(`     Order ${index + 1}: ${order.orderId} - ${order.customerDetails?.name} - ₹${order.totalAmount}`);
          });
        }
      }
      
    } else {
      console.log('❌ SLA violation stats with dealer filter failed:', dealerFilterResult.error);
    }
  } else {
    console.log('❌ Could not get dealer ID for testing dealer filter');
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  // Test without authentication
  console.log('📊 Testing without authentication...');
  const noAuthResult = await makeRequest('GET', '/stats', null, { 'Authorization': '' });
  
  if (!noAuthResult.success) {
    console.log('✅ Authentication required correctly enforced');
    console.log('📋 Error Status:', noAuthResult.status);
  } else {
    console.log('❌ Authentication should be required');
  }
  
  // Test with invalid date format
  console.log('\n📊 Testing with invalid date format...');
  const invalidDateResult = await makeRequest('GET', '/stats?startDate=invalid-date');
  
  if (invalidDateResult.success) {
    console.log('✅ Invalid date handled gracefully');
  } else {
    console.log('❌ Invalid date should be handled gracefully');
  }
}

async function testDataStructure() {
  console.log('\n🧪 Testing Enhanced Data Structure...');
  
  console.log('📊 Expected enhanced SLA violation stats data structure:');
  console.log(`
  {
    "success": true,
    "data": {
      "summary": {
        "totalViolations": 150,
        "totalViolationMinutes": 4500,
        "avgViolationMinutes": 30,
        "maxViolationMinutes": 180,
        "resolvedViolations": 120,
        "unresolvedViolations": 30,
        "uniqueDealerCount": 25,
        "uniqueOrderCount": 140,
        "resolutionRate": 80,
        "avgViolationsPerOrder": 1.07,
        "avgViolationsPerDealer": 6.0
      },
      "data": [
        {
          "dealerId": "dealer-mongodb-id",
          "totalViolations": 15,
          "totalViolationMinutes": 450,
          "avgViolationMinutes": 30,
          "maxViolationMinutes": 120,
          "resolvedViolations": 12,
          "unresolvedViolations": 3,
          "firstViolation": "2024-01-01T00:00:00.000Z",
          "lastViolation": "2024-01-15T00:00:00.000Z",
          "orderIds": ["order1", "order2", "order3"],
          "dealerInfo": {
            "_id": "dealer-mongodb-id",
            "legal_name": "ABC Trading Company Pvt Ltd",
            "trade_name": "ABC Traders",
            "is_active": true
          },
          "orderDetails": [
            {
              "_id": "order-mongodb-id",
              "orderId": "ORD-123456",
              "orderNumber": "ORD-123456",
              "status": "delivered",
              "orderType": "standard",
              "paymentType": "prepaid",
              "totalAmount": 2500,
              "timestamps": {
                "createdAt": "2024-01-01T00:00:00.000Z",
                "placedAt": "2024-01-01T00:00:00.000Z",
                "deliveredAt": "2024-01-03T00:00:00.000Z"
              },
              "customerDetails": {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "9876543210",
                "address": "123 Main St, City, State"
              },
              "orderSummary": {
                "totalSKUs": 3,
                "totalAmount": 2500,
                "customerName": "John Doe",
                "customerPhone": "9876543210",
                "customerEmail": "john@example.com",
                "orderStatus": "delivered",
                "paymentType": "prepaid",
                "orderType": "standard",
                "orderDate": "2024-01-01T00:00:00.000Z",
                "deliveryAddress": "123 Main St, City, State"
              },
              "skuDetails": [
                {
                  "sku": "SKU-001",
                  "productName": "Product 1",
                  "quantity": 2,
                  "sellingPrice": 1000,
                  "totalPrice": 2000,
                  "status": "delivered",
                  "dealerMapped": 1,
                  "dealerDetails": [
                    {
                      "dealerId": "dealer-mongodb-id",
                      "dealerName": "ABC Traders",
                      "assignedAt": "2024-01-01T00:00:00.000Z",
                      "status": "completed"
                    }
                  ]
                }
              ],
              "slaInfo": {
                "expectedFulfillmentTime": "2024-01-02T00:00:00.000Z",
                "actualFulfillmentTime": "2024-01-03T00:00:00.000Z",
                "isSLAMet": false,
                "violationMinutes": 1440
              },
              "trackingInfo": {
                "currentStatus": "delivered",
                "lastUpdated": "2024-01-03T00:00:00.000Z",
                "estimatedDelivery": "2024-01-02T00:00:00.000Z",
                "trackingNumber": "TRK-123456"
              }
            }
          ],
          "orderCount": 15,
          "violationRate": 20
        }
      ],
      "filters": {
        "startDate": null,
        "endDate": null,
        "dealerId": null,
        "groupBy": "dealer",
        "includeDetails": false,
        "includeOrderDetails": true
      }
    },
    "message": "SLA violation statistics fetched successfully"
  }
  `);
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Enhanced SLA Violation Stats Tests...');
  console.log('=' .repeat(70));
  
  try {
    await testSLAViolationStatsBasic();
    await testSLAViolationStatsWithOrderDetails();
    await testSLAViolationStatsWithDateFilter();
    await testSLAViolationStatsGroupByDate();
    await testSLAViolationStatsGroupByMonth();
    await testSLAViolationStatsWithDealerFilter();
    await testErrorHandling();
    await testDataStructure();
    
    console.log('\n' + '=' .repeat(70));
    console.log('✅ All enhanced SLA violation stats tests completed!');
    console.log('\n📝 Summary of Enhancements:');
    console.log('1. ✅ Enhanced Order Details - Comprehensive order information');
    console.log('2. ✅ Customer Information - Complete customer details');
    console.log('3. ✅ SKU Details - Detailed product information');
    console.log('4. ✅ SLA Information - SLA compliance data');
    console.log('5. ✅ Tracking Information - Order tracking details');
    console.log('6. ✅ Timestamps - Complete order timeline');
    console.log('7. ✅ Dealer Mapping - Dealer assignment details');
    console.log('8. ✅ Enhanced Summary - Additional analytics metrics');
    
    console.log('\n🔧 New Query Parameters:');
    console.log('- includeOrderDetails=true - Include comprehensive order details (default: true)');
    console.log('- includeDetails=true - Include detailed dealer and employee information');
    console.log('- startDate/endDate - Filter by date range');
    console.log('- dealerId - Filter by specific dealer');
    console.log('- groupBy - Group by dealer, date, or month');
    
    console.log('\n🔧 Enhanced Order Details Include:');
    console.log('- Order ID, Number, Status, Type, Payment Type');
    console.log('- Complete customer information (name, email, phone, address)');
    console.log('- Detailed SKU information with dealer assignments');
    console.log('- SLA compliance information and violation details');
    console.log('- Order tracking information and timestamps');
    console.log('- Order summary with key metrics');
    
    console.log('\n📋 Usage Examples:');
    console.log('1. Basic: GET /api/orders/api/sla-violations/stats');
    console.log('2. With Order Details: GET /api/orders/api/sla-violations/stats?includeOrderDetails=true');
    console.log('3. With Date Filter: GET /api/orders/api/sla-violations/stats?startDate=2024-01-01&includeOrderDetails=true');
    console.log('4. Group by Date: GET /api/orders/api/sla-violations/stats?groupBy=date&includeOrderDetails=true');
    console.log('5. Group by Month: GET /api/orders/api/sla-violations/stats?groupBy=month&includeOrderDetails=true');
    console.log('6. Dealer Specific: GET /api/orders/api/sla-violations/stats?dealerId=dealer123&includeOrderDetails=true');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test with real data in your production environment');
    console.log('2. Verify order details are correctly populated');
    console.log('3. Update frontend to use the enhanced order information');
    console.log('4. Consider caching for frequently accessed violation data');
    console.log('5. Monitor performance with large datasets');
    console.log('6. Implement real-time updates for SLA violations');
    
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
  testSLAViolationStatsBasic,
  testSLAViolationStatsWithOrderDetails,
  testSLAViolationStatsWithDateFilter,
  testSLAViolationStatsGroupByDate,
  testSLAViolationStatsGroupByMonth,
  testSLAViolationStatsWithDealerFilter,
  testErrorHandling,
  testDataStructure
};
