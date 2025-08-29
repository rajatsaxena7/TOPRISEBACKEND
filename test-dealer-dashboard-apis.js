const axios = require('axios');

// Configuration
const USER_SERVICE_URL = 'http://localhost:5001';
const ORDER_SERVICE_URL = 'http://localhost:5003';
const TOKEN = 'YOUR_DEALER_JWT_TOKEN_HERE'; // Replace with actual dealer token

/**
 * Test dealer dashboard stats
 */
async function testDealerDashboardStats(dealerId) {
  try {
    console.log(`\n🧪 Testing dealer dashboard stats for dealer: ${dealerId}`);
    
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/dealer/${dealerId}/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success - Dashboard stats:');
    console.log('📊 Products:', response.data.data.stats.products);
    console.log('📦 Orders:', response.data.data.stats.orders);
    console.log('🏷️ Categories:', response.data.data.stats.categories);
    console.log('📈 Performance:', response.data.data.stats.performance);

    return response.data;
  } catch (error) {
    console.error('❌ Error getting dealer dashboard stats:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test dealer assigned categories
 */
async function testDealerAssignedCategories(dealerId) {
  try {
    console.log(`\n🧪 Testing dealer assigned categories for dealer: ${dealerId}`);
    
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/dealer/${dealerId}/assigned-categories`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success - Assigned categories:');
    console.log(`📋 Found ${response.data.data.assignedCategories.length} categories`);
    response.data.data.assignedCategories.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category.category_name} (${category.product_count} products)`);
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error getting dealer assigned categories:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test complete dealer dashboard
 */
async function testDealerDashboard(dealerId) {
  try {
    console.log(`\n🧪 Testing complete dealer dashboard for dealer: ${dealerId}`);
    
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/dealer/${dealerId}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success - Complete dashboard data:');
    console.log('📊 Stats:', response.data.data.stats);
    console.log('📈 Order KPIs:', response.data.data.orderKPIs.length, 'periods');
    console.log('🏷️ Assigned categories:', response.data.data.assignedCategories.length);

    return response.data;
  } catch (error) {
    console.error('❌ Error getting complete dealer dashboard:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test dealer order KPIs
 */
async function testDealerOrderKPIs(dealerId, period = 'week') {
  try {
    console.log(`\n🧪 Testing dealer order KPIs for dealer: ${dealerId} (period: ${period})`);
    
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/dealer/${dealerId}/kpis`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: { period }
    });

    console.log('✅ Success - Order KPIs:');
    console.log(`📈 Found ${response.data.data.orderKPIs.length} KPI periods`);
    response.data.data.orderKPIs.forEach((kpi, index) => {
      console.log(`  ${index + 1}. ${kpi.period}:`);
      console.log(`     Orders: ${kpi.orders.total}, Revenue: ₹${kpi.revenue.total}`);
      console.log(`     SLA Compliance: ${kpi.performance.slaCompliance}%`);
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error getting dealer order KPIs:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test dealer orders
 */
async function testDealerOrders(dealerId) {
  try {
    console.log(`\n🧪 Testing dealer orders for dealer: ${dealerId}`);
    
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/dealer/${dealerId}/orders`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: { page: 1, limit: 5 }
    });

    console.log('✅ Success - Dealer orders:');
    console.log(`📦 Found ${response.data.data.orders.length} orders (page 1 of ${response.data.data.pagination.pages})`);
    console.log(`📊 Total orders: ${response.data.data.pagination.total}`);
    
    response.data.data.orders.slice(0, 3).forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order.orderId}: ${order.status} - ₹${order.totalAmount}`);
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error getting dealer orders:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test dealer order KPIs with different periods
 */
async function testDealerOrderKPIsMultiplePeriods(dealerId) {
  const periods = ['week', 'month', 'quarter'];
  
  for (const period of periods) {
    await testDealerOrderKPIs(dealerId, period);
  }
}

/**
 * Test dealer orders with filters
 */
async function testDealerOrdersWithFilters(dealerId) {
  try {
    console.log(`\n🧪 Testing dealer orders with filters for dealer: ${dealerId}`);
    
    // Test with status filter
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/dealer/${dealerId}/orders`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: { 
        status: 'Pending',
        page: 1, 
        limit: 10 
      }
    });

    console.log('✅ Success - Filtered dealer orders:');
    console.log(`📦 Found ${response.data.data.orders.length} pending orders`);
    console.log(`📊 Total pending orders: ${response.data.data.pagination.total}`);

    return response.data;
  } catch (error) {
    console.error('❌ Error getting filtered dealer orders:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test dealer ID lookup by userId
 */
async function testGetDealerIdByUserId(userId) {
  try {
    console.log(`\n🧪 Testing dealer ID lookup for userId: ${userId}`);
    
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/user/${userId}/dealer-id`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success - Dealer ID lookup:');
    console.log('🆔 Dealer ID:', response.data.data.dealerInfo.dealerId);
    console.log('📝 Legal Name:', response.data.data.dealerInfo.legal_name);
    console.log('🏢 Business Name:', response.data.data.dealerInfo.business_name);

    return response.data;
  } catch (error) {
    console.error('❌ Error getting dealer ID by userId:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test all dealer IDs lookup by userId
 */
async function testGetAllDealerIdsByUserId(userId) {
  try {
    console.log(`\n🧪 Testing all dealer IDs lookup for userId: ${userId}`);
    
    const response = await axios.get(`${USER_SERVICE_URL}/api/users/user/${userId}/all-dealer-ids`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success - All dealer IDs lookup:');
    console.log(`📋 Found ${response.data.data.totalDealers} dealers`);
    response.data.data.dealerList.forEach((dealer, index) => {
      console.log(`  ${index + 1}. Dealer ID: ${dealer.dealerId}`);
      console.log(`     Legal Name: ${dealer.legal_name}`);
      console.log(`     Business Name: ${dealer.business_name}`);
      console.log(`     Active: ${dealer.is_active}`);
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error getting all dealer IDs by userId:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting tests for dealer dashboard APIs...\n');

  const dealerId = 'YOUR_TEST_DEALER_ID'; // Replace with actual dealer ID
  const userId = 'YOUR_TEST_USER_ID'; // Replace with actual user ID

  // Test dealer ID lookup endpoints
  await testGetDealerIdByUserId(userId);
  await testGetAllDealerIdsByUserId(userId);

  // Test all dashboard endpoints
  await testDealerDashboardStats(dealerId);
  await testDealerAssignedCategories(dealerId);
  await testDealerDashboard(dealerId);
  
  // Test order KPI endpoints
  await testDealerOrderKPIs(dealerId);
  await testDealerOrderKPIsMultiplePeriods(dealerId);
  
  // Test order endpoints
  await testDealerOrders(dealerId);
  await testDealerOrdersWithFilters(dealerId);

  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testDealerDashboardStats,
  testDealerAssignedCategories,
  testDealerDashboard,
  testDealerOrderKPIs,
  testDealerOrders,
  testDealerOrderKPIsMultiplePeriods,
  testDealerOrdersWithFilters,
  testGetDealerIdByUserId,
  testGetAllDealerIdsByUserId,
  runTests
};
