const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Adjust port as needed
const DEALER_ID = '507f1f77bcf86cd799439011'; // Replace with actual dealer ID for testing

async function testDealerStatsEndpoint() {
    try {
        console.log('🧪 Testing Dealer Stats Endpoint...\n');

        // Test 1: Basic endpoint call
        console.log('Test 1: Basic endpoint call');
        const response1 = await axios.get(`${BASE_URL}/api/reports/dealer/${DEALER_ID}/stats`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Status:', response1.status);
        console.log('📊 Response Data:', JSON.stringify(response1.data, null, 2));
        console.log('\n');

        // Test 2: With date range
        console.log('Test 2: With date range');
        const startDate = '2024-01-01';
        const endDate = '2024-12-31';

        const response2 = await axios.get(`${BASE_URL}/api/reports/dealer/${DEALER_ID}/stats`, {
            params: {
                startDate,
                endDate
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Status:', response2.status);
        console.log('📊 Response Data:', JSON.stringify(response2.data, null, 2));
        console.log('\n');

        // Test 3: Invalid dealer ID
        console.log('Test 3: Invalid dealer ID');
        try {
            await axios.get(`${BASE_URL}/api/reports/dealer/invalid-id/stats`);
        } catch (error) {
            console.log('✅ Expected error for invalid dealer ID:', error.response?.status);
            console.log('📝 Error message:', error.response?.data?.message || error.message);
        }
        console.log('\n');

        console.log('🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Run the test
testDealerStatsEndpoint();
