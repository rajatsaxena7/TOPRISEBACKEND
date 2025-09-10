const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002'; // Product service URL
const DEALER_ID = '507f1f77bcf86cd799439011'; // Replace with actual dealer ID

async function debugProductsByDealer() {
    console.log('🔍 Debugging Products by Dealer Endpoint');
    console.log('========================================\n');

    try {
        console.log(`📋 Testing with dealer ID: ${DEALER_ID}`);
        console.log(`🌐 Endpoint: ${BASE_URL}/api/products/dealer/${DEALER_ID}\n`);

        const response = await axios.get(`${BASE_URL}/api/products/dealer/${DEALER_ID}`, {
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.status === 200 && response.data.success) {
            const data = response.data.data;

            console.log('✅ Success!');
            console.log(`📊 Response Summary:`);
            console.log(`   - Dealer ID: ${data.dealerId}`);
            console.log(`   - Products Found: ${data.products.length}`);
            console.log(`   - Total Products: ${data.summary.totalProducts}`);
            console.log(`   - In Stock: ${data.summary.totalInStock}`);
            console.log(`   - Out of Stock: ${data.summary.totalOutOfStock}`);

            console.log(`\n🔍 Debug Information:`);
            console.log(`   - Total Products with Dealer: ${data.debug.totalProductsWithDealer}`);
            console.log(`   - Sample Products in System:`);

            if (data.debug.sampleProducts && data.debug.sampleProducts.length > 0) {
                data.debug.sampleProducts.forEach((product, index) => {
                    console.log(`     ${index + 1}. SKU: ${product.sku_code}`);
                    console.log(`        Dealers: ${JSON.stringify(product.available_dealers, null, 8)}`);
                });
            } else {
                console.log(`     No products with dealers found in system`);
            }

            console.log(`\n📦 Products for this dealer:`);
            if (data.products.length > 0) {
                data.products.forEach((product, index) => {
                    console.log(`   ${index + 1}. ${product.sku_code} - ${product.product_name}`);
                    console.log(`      Dealer Info: ${JSON.stringify(product.dealer_info, null, 6)}`);
                });
            } else {
                console.log(`   No products found for this dealer`);
            }

        } else {
            console.log('❌ Failed!');
            console.log(`   Status: ${response.status}`);
            console.log(`   Message: ${response.data.message || 'Unknown error'}`);
        }

    } catch (error) {
        console.log('❌ Error!');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
            if (error.response.data.details) {
                console.log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
            }
        } else if (error.request) {
            console.log('   Network Error: No response received');
            console.log(`   URL: ${error.config?.url}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

// Test with different dealer IDs
async function testMultipleDealers() {
    console.log('\n🔄 Testing Multiple Dealer IDs');
    console.log('===============================\n');

    const testDealerIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        'test-dealer-id',
        'invalid-id'
    ];

    for (const dealerId of testDealerIds) {
        console.log(`\n📋 Testing dealer ID: ${dealerId}`);
        console.log('─'.repeat(50));

        try {
            const response = await axios.get(`${BASE_URL}/api/products/dealer/${dealerId}`, {
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                console.log(`✅ Found ${data.products.length} products`);
                console.log(`   Total in system: ${data.debug.totalProductsWithDealer}`);
            } else {
                console.log(`❌ Failed: ${response.data.message || 'Unknown error'}`);
            }

        } catch (error) {
            if (error.response) {
                console.log(`❌ Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`);
            } else {
                console.log(`❌ Network Error: ${error.message}`);
            }
        }
    }
}

// Test the endpoint without authentication to see the error
async function testWithoutAuth() {
    console.log('\n🔒 Testing Without Authentication');
    console.log('==================================\n');

    try {
        const response = await axios.get(`${BASE_URL}/api/products/dealer/${DEALER_ID}`, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });

        console.log('❌ Unexpected Success! Should have failed without auth');
        console.log(`   Status: ${response.status}`);

    } catch (error) {
        if (error.response) {
            console.log('✅ Expected Error!');
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data.message || 'Unknown error'}`);
        } else {
            console.log(`❌ Unexpected Error: ${error.message}`);
        }
    }
}

// Main execution
async function runDebugTests() {
    console.log('🎯 Products by Dealer Debug Test Suite');
    console.log('======================================\n');

    console.log('📋 Test Configuration:');
    console.log(`   - Base URL: ${BASE_URL}`);
    console.log(`   - Dealer ID: ${DEALER_ID}`);
    console.log(`   - Note: Replace 'YOUR_JWT_TOKEN_HERE' with actual token\n`);

    try {
        await debugProductsByDealer();
        await testMultipleDealers();
        await testWithoutAuth();

        console.log('\n🎉 Debug tests completed!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Check the logs for detailed information');
        console.log('   2. Verify dealer IDs exist in the system');
        console.log('   3. Check if products have available_dealers populated');
        console.log('   4. Verify the dealer ID format matches the data');

    } catch (error) {
        console.error('💥 Debug test suite failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runDebugTests();
}

module.exports = {
    debugProductsByDealer,
    testMultipleDealers,
    testWithoutAuth,
    runDebugTests
};
