const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Order service URL
const TEST_TOKEN = 'your_test_token_here'; // Replace with actual token

async function testPaymentStats() {
    try {
        console.log('🔧 Testing Payment Stats Controller...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get payment stats summary for dashboard cards
        console.log('📝 Test 1: Get payment stats summary for dashboard cards...');
        try {
            const response = await axios.get(`${BASE_URL}/api/orders/payment-stats/summary?period=7d`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved payment stats summary');
                console.log(`📝 Period: ${response.data.data.period}`);
                console.log(`📝 Cards count: ${response.data.data.cards.length}`);

                response.data.data.cards.forEach((card, index) => {
                    console.log(`\n📊 Card ${index + 1}: ${card.title}`);
                    console.log(`   Value: ${card.value}`);
                    console.log(`   Previous Value: ${card.previousValue}`);
                    console.log(`   Growth: ${card.growth.toFixed(2)}%`);
                    console.log(`   Icon: ${card.icon}`);
                    console.log(`   Color: ${card.color}`);
                    console.log(`   Format: ${card.format}`);
                });
            } else {
                console.log('❌ Failed to retrieve payment stats summary:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving payment stats summary:', error.response?.data || error.message);
        }

        // Test 2: Get comprehensive payment stats
        console.log('\n📝 Test 2: Get comprehensive payment stats...');
        try {
            const response = await axios.get(`${BASE_URL}/api/orders/payment-stats?groupBy=day&limit=10`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved comprehensive payment stats');
                const stats = response.data.data;

                console.log('\n📊 Overview:');
                console.log(`   Total Payments: ${stats.overview.totalPayments}`);
                console.log(`   Total Amount: ${stats.overview.totalAmount}`);
                console.log(`   Average Amount: ${stats.overview.averageAmount}`);
                console.log(`   Success Rate: ${stats.overview.successRate.toFixed(2)}%`);
                console.log(`   Refund Rate: ${stats.overview.refundRate.toFixed(2)}%`);

                console.log('\n📊 Status Breakdown:');
                stats.statusBreakdown.forEach(status => {
                    console.log(`   ${status.status}: ${status.count} (${status.totalAmount})`);
                });

                console.log('\n📊 Method Breakdown:');
                stats.methodBreakdown.forEach(method => {
                    console.log(`   ${method.method}: ${method.count} (${method.totalAmount})`);
                });

                console.log(`\n📊 Daily Trends: ${stats.dailyTrends.length} data points`);
                console.log(`📊 Monthly Trends: ${stats.monthlyTrends.length} data points`);
                console.log(`📊 Top Dealers: ${stats.topDealers.length} dealers`);
                console.log(`📊 Recent Payments: ${stats.recentPayments.length} payments`);
            } else {
                console.log('❌ Failed to retrieve comprehensive payment stats:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving comprehensive payment stats:', error.response?.data || error.message);
        }

        // Test 3: Get payment stats by period
        console.log('\n📝 Test 3: Get payment stats by period...');
        try {
            const response = await axios.get(`${BASE_URL}/api/orders/payment-stats/period?period=30d`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved payment stats by period');
                const stats = response.data.data;

                console.log(`📝 Period: ${stats.period}`);
                console.log('\n📊 Current Period:');
                console.log(`   Total Payments: ${stats.current.totalPayments}`);
                console.log(`   Total Amount: ${stats.current.totalAmount}`);
                console.log(`   Average Amount: ${stats.current.averageAmount}`);
                console.log(`   Successful Payments: ${stats.current.successfulPayments}`);
                console.log(`   Failed Payments: ${stats.current.failedPayments}`);
                console.log(`   Refunded Payments: ${stats.current.refundedPayments}`);

                console.log('\n📊 Growth Rates:');
                console.log(`   Total Payments: ${stats.growth.totalPayments.toFixed(2)}%`);
                console.log(`   Total Amount: ${stats.growth.totalAmount.toFixed(2)}%`);
                console.log(`   Average Amount: ${stats.growth.averageAmount.toFixed(2)}%`);
                console.log(`   Successful Payments: ${stats.growth.successfulPayments.toFixed(2)}%`);
                console.log(`   Failed Payments: ${stats.growth.failedPayments.toFixed(2)}%`);
                console.log(`   Refunded Payments: ${stats.growth.refundedPayments.toFixed(2)}%`);
            } else {
                console.log('❌ Failed to retrieve payment stats by period:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving payment stats by period:', error.response?.data || error.message);
        }

        // Test 4: Test different time periods
        console.log('\n📝 Test 4: Test different time periods...');
        const periods = ['1d', '7d', '30d', '90d'];

        for (const period of periods) {
            try {
                const response = await axios.get(`${BASE_URL}/api/orders/payment-stats/summary?period=${period}`, { headers });

                if (response.data.success) {
                    console.log(`✅ Period ${period}: ${response.data.data.cards[0].value} total payments`);
                } else {
                    console.log(`❌ Period ${period}: Failed - ${response.data.message}`);
                }
            } catch (error) {
                console.log(`❌ Period ${period}: Error - ${error.response?.data?.message || error.message}`);
            }
        }

        // Test 5: Test with filters
        console.log('\n📝 Test 5: Test with filters...');
        try {
            const response = await axios.get(`${BASE_URL}/api/orders/payment-stats?startDate=2024-01-01&endDate=2024-12-31&groupBy=month`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved filtered payment stats');
                console.log(`📝 Applied filters:`, response.data.data.filters);
                console.log(`📝 Monthly trends: ${response.data.data.monthlyTrends.length} months`);
            } else {
                console.log('❌ Failed to retrieve filtered payment stats:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving filtered payment stats:', error.response?.data || error.message);
        }

        // Test 6: Test error handling
        console.log('\n📝 Test 6: Test error handling...');
        try {
            const response = await axios.get(`${BASE_URL}/api/orders/payment-stats?invalidParam=test`, { headers });

            if (response.data.success) {
                console.log('✅ Handled invalid parameters gracefully');
            } else {
                console.log('❌ Failed with invalid parameters:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error with invalid parameters:', error.response?.data || error.message);
        }

        console.log('\n🎉 Payment Stats tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure the API endpoints are correct and the service is running');
        }

        if (error.response?.status === 500) {
            console.log('\n💡 Note: Check if the order service is running and accessible');
        }
    }
}

// Instructions for running the test
console.log('🔧 Payment Stats Controller Test Script');
console.log('=======================================\n');
console.log('This script will test the payment stats controller functionality:');
console.log('1. Get payment stats summary for dashboard cards');
console.log('2. Get comprehensive payment stats');
console.log('3. Get payment stats by period');
console.log('4. Test different time periods');
console.log('5. Test with filters');
console.log('6. Test error handling\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your order service is running');
console.log('4. Ensure you have payment data in the database\n');

// Uncomment the line below to run the test
// testPaymentStats();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-payment-stats.js');

console.log('\n📋 API Endpoints Tested:');
console.log('1. GET /api/orders/payment-stats/summary - Dashboard cards data');
console.log('2. GET /api/orders/payment-stats - Comprehensive statistics');
console.log('3. GET /api/orders/payment-stats/period - Period-based statistics');

console.log('\n📊 Dashboard Cards Data Structure:');
console.log('Each card includes:');
console.log('- title: Card title (e.g., "Total Payments")');
console.log('- value: Current period value');
console.log('- previousValue: Previous period value');
console.log('- growth: Growth percentage');
console.log('- icon: Icon name for frontend');
console.log('- color: Color theme for frontend');
console.log('- format: Data format (number, currency, percentage)');

console.log('\n📈 Comprehensive Stats Includes:');
console.log('- Overview: Total payments, amount, success rate, etc.');
console.log('- Status Breakdown: Payment status distribution');
console.log('- Method Breakdown: Payment method distribution');
console.log('- Daily Trends: Time-series data for charts');
console.log('- Monthly Trends: Monthly aggregated data');
console.log('- Top Dealers: Dealers with highest payment volume');
console.log('- Recent Payments: Latest payment transactions');
console.log('- Refunds: Refund statistics');

console.log('\n⏰ Supported Time Periods:');
console.log('- 1d: Last 24 hours');
console.log('- 7d: Last 7 days');
console.log('- 30d: Last 30 days');
console.log('- 90d: Last 90 days');
console.log('- 1y: Last 1 year');

console.log('\n🔍 Supported Filters:');
console.log('- startDate: Start date for filtering');
console.log('- endDate: End date for filtering');
console.log('- dealerId: Filter by specific dealer');
console.log('- orderType: Filter by order type (Online, Offline, System)');
console.log('- orderSource: Filter by order source (Web, Mobile, POS)');
console.log('- groupBy: Group data by day, week, month, or year');

console.log('\n✅ Expected Results:');
console.log('- All endpoints should return successful responses');
console.log('- Dashboard cards should have proper structure and data');
console.log('- Comprehensive stats should include all required sections');
console.log('- Period-based stats should show growth comparisons');
console.log('- Filters should work correctly');
console.log('- Error handling should be graceful');
