const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002/api';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test the fixed count endpoints
const testEndpoints = [
    {
        name: "Brand Count",
        url: `${BASE_URL}/brands/count`
    },
    {
        name: "Category Count",
        url: `${BASE_URL}/categories/count`
    },
    {
        name: "SubCategory Count",
        url: `${BASE_URL}/subcategories/count`
    },
    {
        name: "Variant Count",
        url: `${BASE_URL}/variants/count`
    }
];

// Function to test an endpoint
async function testEndpoint(endpoint) {
    try {
        console.log(`\n🧪 Testing: ${endpoint.name}`);
        console.log(`📡 URL: ${endpoint.url}`);

        const response = await axios.get(endpoint.url, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log(`✅ Status: ${response.status}`);

        if (response.data.success) {
            const data = response.data.data;
            console.log(`📊 Total Count: ${Object.values(data.summary)[0] || 0}`);
            console.log(`📋 Breakdowns: ${Object.keys(data.breakdown).length} types`);
            console.log(`✅ ${endpoint.name} endpoint working correctly!`);
        } else {
            console.log(`❌ Unexpected response:`, response.data);
        }

    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            if (error.response.data.message) {
                console.log(`   Message: ${error.response.data.message}`);
            }
        }
    }
}

// Main function
async function main() {
    console.log('🚀 Testing Fixed Count Endpoints');
    console.log('='.repeat(60));

    for (const endpoint of testEndpoints) {
        await testEndpoint(endpoint);
        console.log('-'.repeat(60));

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ All count endpoint tests completed!');
    console.log('\n📝 Note: Make sure to update AUTH_TOKEN in the script with your actual token.');
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Promise Rejection:', error);
    process.exit(1);
});

// Run the tests
main().catch(console.error);
