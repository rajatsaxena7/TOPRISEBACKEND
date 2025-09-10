const axios = require('axios');

// Test script to verify the new dealer stats endpoint
async function testDealerStatsEndpoint() {
    const baseURL = 'http://localhost:5003'; // Order service URL

    // You'll need to replace these with actual values from your system
    const testDealerId = 'YOUR_DEALER_ID_HERE'; // Replace with actual dealer ID
    const authToken = 'YOUR_AUTH_TOKEN_HERE'; // Replace with valid auth token

    console.log('🧪 Testing Dealer Stats Endpoint...\n');

    try {
        // Test 1: Basic dealer stats (last 30 days)
        console.log('1️⃣ Testing Basic Dealer Stats (Last 30 Days)');

        try {
            const response = await axios.get(`${baseURL}/api/orders/dealer/${testDealerId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Basic Dealer Stats Response:', {
                success: response.data.success,
                message: response.data.message,
                dealerId: response.data.data.dealerId,
                dateRange: response.data.data.dateRange,
                orderStats: {
                    totalOrders: response.data.data.orderStats.totalOrders,
                    ordersToday: response.data.data.orderStats.ordersToday,
                    pendingOrders: response.data.data.orderStats.pendingOrders,
                    deliveredOrders: response.data.data.orderStats.deliveredOrders,
                    completionRate: response.data.data.orderStats.completionRate
                },
                picklistStats: {
                    totalPicklists: response.data.data.picklistStats.totalPicklists,
                    pendingPicklists: response.data.data.picklistStats.pendingPicklists,
                    completedPicklists: response.data.data.picklistStats.completedPicklists,
                    completionRate: response.data.data.picklistStats.completionRate
                },
                financialStats: {
                    totalOrderValue: response.data.data.financialStats.totalOrderValue,
                    averageOrderValue: response.data.data.financialStats.averageOrderValue,
                    minOrderValue: response.data.data.financialStats.minOrderValue,
                    maxOrderValue: response.data.data.financialStats.maxOrderValue
                },
                summary: response.data.data.summary
            });

        } catch (error) {
            console.log('❌ Basic Dealer Stats Error:', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Dealer stats with custom date range
        console.log('2️⃣ Testing Dealer Stats with Custom Date Range');

        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
        const endDate = new Date().toISOString(); // Today

        try {
            const response = await axios.get(`${baseURL}/api/orders/dealer/${testDealerId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    startDate: startDate,
                    endDate: endDate
                }
            });

            console.log('✅ Custom Date Range Response:', {
                success: response.data.success,
                dateRange: response.data.data.dateRange,
                totalOrders: response.data.data.orderStats.totalOrders,
                totalPicklists: response.data.data.picklistStats.totalPicklists,
                totalRevenue: response.data.data.financialStats.totalOrderValue
            });

        } catch (error) {
            console.log('❌ Custom Date Range Error:', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Test with invalid dealer ID
        console.log('3️⃣ Testing with Invalid Dealer ID');

        try {
            const response = await axios.get(`${baseURL}/api/orders/dealer/invalid_dealer_id/stats`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Invalid Dealer ID Response:', response.data);

        } catch (error) {
            console.log('❌ Invalid Dealer ID Error (Expected):', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 4: Test without authentication
        console.log('4️⃣ Testing without Authentication');

        try {
            const response = await axios.get(`${baseURL}/api/orders/dealer/${testDealerId}/stats`);

            console.log('✅ No Auth Response:', response.data);

        } catch (error) {
            console.log('❌ No Auth Error (Expected):', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    console.log('\n🏁 Test completed!');
    console.log('\n📝 Instructions:');
    console.log('1. Replace YOUR_DEALER_ID_HERE with an actual dealer ID from your database');
    console.log('2. Replace YOUR_AUTH_TOKEN_HERE with a valid authentication token');
    console.log('3. Make sure the order-service is running on port 5003');
    console.log('4. Run: node test-dealer-stats-endpoint.js');
    console.log('\n📊 Expected Response Structure:');
    console.log(`
{
  "success": true,
  "message": "Dealer statistics retrieved successfully",
  "data": {
    "dealerId": "dealer_id",
    "dateRange": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "orderStats": {
      "totalOrders": 150,
      "ordersToday": 5,
      "pendingOrders": 12,
      "deliveredOrders": 120,
      "cancelledOrders": 8,
      "returnedOrders": 2,
      "completionRate": 80.0
    },
    "picklistStats": {
      "totalPicklists": 145,
      "pendingPicklists": 10,
      "completedPicklists": 130,
      "picklistsToday": 4,
      "completionRate": 89.66
    },
    "financialStats": {
      "totalOrderValue": 150000,
      "averageOrderValue": 1000,
      "minOrderValue": 100,
      "maxOrderValue": 5000,
      "orderCount": 150
    },
    "summary": {
      "totalRevenue": 150000,
      "averageOrderValue": 1000,
      "orderCompletionRate": 80.0,
      "picklistCompletionRate": 89.66,
      "activeOrders": 12,
      "totalPicklistsGenerated": 145
    }
  }
}
  `);
}

// Run the test
testDealerStatsEndpoint();