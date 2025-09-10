const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002'; // Product service URL
const DEALER_ID = '685e43419c0131bc04cb7d4a'; // Your actual dealer ID from the document

async function testSpecificDealer() {
    console.log('🔍 Testing Products by Dealer with Your Specific Data');
    console.log('====================================================\n');

    console.log(`📋 Testing with dealer ID: ${DEALER_ID}`);
    console.log(`🌐 Endpoint: ${BASE_URL}/api/products/dealer/${DEALER_ID}\n`);

    // Test 1: Get all products for this dealer (no status filter)
    console.log('🧪 Test 1: Get all products (no status filter)');
    console.log('─'.repeat(50));

    try {
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

            if (data.debug.sampleProducts && data.debug.sampleProducts.length > 0) {
                console.log(`   - Sample Products in System:`);
                data.debug.sampleProducts.forEach((product, index) => {
                    console.log(`     ${index + 1}. SKU: ${product.sku_code}`);
                    console.log(`        Dealers: ${JSON.stringify(product.available_dealers, null, 8)}`);
                });
            }

            console.log(`\n📦 Products for this dealer:`);
            if (data.products.length > 0) {
                data.products.forEach((product, index) => {
                    console.log(`   ${index + 1}. ${product.sku_code} - ${product.product_name}`);
                    console.log(`      Status: ${product.status || 'N/A'}`);
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
        } else if (error.request) {
            console.log('   Network Error: No response received');
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }

    // Test 2: Get products with specific status
    console.log('\n\n🧪 Test 2: Get products with status "Approved"');
    console.log('─'.repeat(50));

    try {
        const response = await axios.get(`${BASE_URL}/api/products/dealer/${DEALER_ID}?status=Approved`, {
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.status === 200 && response.data.success) {
            const data = response.data.data;
            console.log(`✅ Found ${data.products.length} products with status "Approved"`);
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

    // Test 3: Get products with status "Rejected"
    console.log('\n\n🧪 Test 3: Get products with status "Rejected"');
    console.log('─'.repeat(50));

    try {
        const response = await axios.get(`${BASE_URL}/api/products/dealer/${DEALER_ID}?status=Rejected`, {
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.status === 200 && response.data.success) {
            const data = response.data.data;
            console.log(`✅ Found ${data.products.length} products with status "Rejected"`);

            if (data.products.length > 0) {
                console.log('📦 Products found:');
                data.products.forEach((product, index) => {
                    console.log(`   ${index + 1}. ${product.sku_code} - ${product.product_name}`);
                });
            }
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

    // Test 4: Check available dealers endpoint
    console.log('\n\n🧪 Test 4: Check available dealers endpoint');
    console.log('─'.repeat(50));

    try {
        const response = await axios.get(`${BASE_URL}/api/products/debug/available-dealers`, {
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        if (response.status === 200 && response.data.success) {
            const data = response.data.data;
            console.log(`✅ Found ${data.totalDealers} dealers in the system`);

            // Check if our dealer ID exists
            const ourDealer = data.dealers.find(d => d.dealerId === DEALER_ID);
            if (ourDealer) {
                console.log(`✅ Our dealer ID ${DEALER_ID} found in system:`);
                console.log(`   - Product Count: ${ourDealer.productCount}`);
                console.log(`   - In Stock Count: ${ourDealer.inStockCount}`);
                console.log(`   - Sample Products: ${ourDealer.sampleProducts.join(', ')}`);
            } else {
                console.log(`❌ Our dealer ID ${DEALER_ID} NOT found in system`);
                console.log(`📋 Available dealer IDs:`);
                data.dealers.forEach((dealer, index) => {
                    console.log(`   ${index + 1}. ${dealer.dealerId} (${dealer.productCount} products)`);
                });
            }
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

// Run the test
if (require.main === module) {
    testSpecificDealer().then(() => {
        console.log('\n🎉 Test completed!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Replace "YOUR_JWT_TOKEN_HERE" with actual JWT token');
        console.log('   2. Run the test again');
        console.log('   3. Check the logs for detailed information');
        console.log('   4. Verify the dealer ID matches exactly');
    });
}

module.exports = { testSpecificDealer };
