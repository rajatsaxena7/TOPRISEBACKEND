const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5003/api/orders';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test scenarios
const testScenarios = [
    {
        name: "Get all order statistics",
        url: `${BASE_URL}/stats/filters`,
        params: {}
    },
    {
        name: "Get today's order statistics",
        url: `${BASE_URL}/stats/filters`,
        params: { today: 'true' }
    },
    {
        name: "Get orders by specific status (Assigned)",
        url: `${BASE_URL}/stats/filters`,
        params: { status: 'Assigned' }
    },
    {
        name: "Get orders by specific status (Delivered)",
        url: `${BASE_URL}/stats/filters`,
        params: { status: 'Delivered' }
    },
    {
        name: "Get today's orders with specific status",
        url: `${BASE_URL}/stats/filters`,
        params: { today: 'true', status: 'Assigned' }
    },
    {
        name: "Get orders with date range",
        url: `${BASE_URL}/stats/filters`,
        params: {
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-12-31T23:59:59.999Z'
        }
    },
    {
        name: "Get orders with SKU level tracking",
        url: `${BASE_URL}/stats/filters`,
        params: { includeSkuLevelTracking: 'true' }
    },
    {
        name: "Get today's orders with SKU level tracking",
        url: `${BASE_URL}/stats/filters`,
        params: {
            today: 'true',
            includeSkuLevelTracking: 'true'
        }
    },
    {
        name: "Get orders by status with SKU level tracking",
        url: `${BASE_URL}/stats/filters`,
        params: {
            status: 'Assigned',
            includeSkuLevelTracking: 'true'
        }
    },
    {
        name: "Get orders with all filters",
        url: `${BASE_URL}/stats/filters`,
        params: {
            today: 'true',
            status: 'Assigned',
            includeSkuLevelTracking: 'true'
        }
    }
];

// Function to make API request
async function makeRequest(scenario) {
    try {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        console.log(`📡 URL: ${scenario.url}`);
        console.log(`📋 Params:`, JSON.stringify(scenario.params, null, 2));

        const response = await axios.get(scenario.url, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: scenario.params,
            timeout: 30000
        });

        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Response Summary:`);

        if (response.data.success && response.data.data) {
            const data = response.data.data;

            console.log(`   📈 Total Orders: ${data.summary?.totalOrders || 0}`);
            console.log(`   💰 Total Revenue: ₹${data.summary?.totalRevenue || 0}`);
            console.log(`   📊 Avg Order Value: ₹${data.summary?.avgOrderValue || 0}`);

            if (data.todayStats) {
                console.log(`   📅 Today's Orders: ${data.todayStats.ordersToday || 0}`);
                console.log(`   💵 Today's Revenue: ₹${data.todayStats.revenueToday || 0}`);
            }

            console.log(`   📋 Status Breakdown:`);
            data.statusBreakdown?.forEach(status => {
                console.log(`      ${status.status}: ${status.count} orders (${status.percentage}%)`);
            });

            console.log(`   📦 Recent Orders: ${data.recentOrders?.length || 0} orders`);

            if (data.recentOrders && data.recentOrders.length > 0) {
                console.log(`   🔍 Sample Recent Order:`);
                const sampleOrder = data.recentOrders[0];
                console.log(`      Order ID: ${sampleOrder.orderId}`);
                console.log(`      Status: ${sampleOrder.status}`);
                console.log(`      Amount: ₹${sampleOrder.totalAmount}`);
                console.log(`      Customer: ${sampleOrder.customerName}`);
                console.log(`      SKU Count: ${sampleOrder.skuCount}`);

                if (sampleOrder.skuTracking && sampleOrder.skuTracking.length > 0) {
                    console.log(`      SKU Tracking Sample:`);
                    const sampleSku = sampleOrder.skuTracking[0];
                    console.log(`         SKU: ${sampleSku.sku}`);
                    console.log(`         Product: ${sampleSku.productName}`);
                    console.log(`         Quantity: ${sampleSku.quantity}`);
                    console.log(`         Tracking Status: ${sampleSku.tracking_info?.status || 'N/A'}`);
                }
            }

            console.log(`   🔧 Filters Applied:`);
            console.log(`      Today: ${data.filters?.today || false}`);
            console.log(`      Status: ${data.filters?.status || 'All'}`);
            console.log(`      Start Date: ${data.filters?.startDate || 'N/A'}`);
            console.log(`      End Date: ${data.filters?.endDate || 'N/A'}`);
            console.log(`      SKU Tracking: ${data.filters?.includeSkuLevelTracking || false}`);
        } else {
            console.log(`❌ Unexpected response format:`, response.data);
        }

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Function to run all tests
async function runAllTests() {
    console.log('🚀 Starting Order Statistics with Filters API Tests');
    console.log('='.repeat(60));

    for (const scenario of testScenarios) {
        await makeRequest(scenario);
        console.log('-'.repeat(60));

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ All tests completed!');
}

// Function to run specific test
async function runSpecificTest(testName) {
    const scenario = testScenarios.find(s => s.name === testName);
    if (scenario) {
        console.log('🚀 Running Specific Test');
        console.log('='.repeat(60));
        await makeRequest(scenario);
    } else {
        console.log(`❌ Test "${testName}" not found. Available tests:`);
        testScenarios.forEach((s, index) => {
            console.log(`   ${index + 1}. ${s.name}`);
        });
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    if (args.length > 0) {
        const testName = args.join(' ');
        await runSpecificTest(testName);
    } else {
        await runAllTests();
    }
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Promise Rejection:', error);
    process.exit(1);
});

// Run the tests
main().catch(console.error);
