const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Adjust port as needed
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testProductWithUserDetails() {
    try {
        console.log('👥 Testing Product Endpoint with User Details...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Basic product fetch with user details
        console.log('📝 Test 1: Fetch products with user details...');
        const response = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?page=1&limit=5`, { headers });

        if (response.data.success) {
            console.log('✅ Products fetched successfully with user details');
            console.log(`📦 Found ${response.data.data.products.length} products`);
            console.log(`📄 Total items: ${response.data.data.pagination.totalItems}`);

            // Check if user details are included
            if (response.data.data.products.length > 0) {
                const firstProduct = response.data.data.products[0];
                console.log(`\n🔍 Sample Product Details:`);
                console.log(`   Product Name: ${firstProduct.product_name}`);
                console.log(`   SKU: ${firstProduct.sku_code}`);
                console.log(`   Created By: ${firstProduct.created_by}`);
                console.log(`   Created By Role: ${firstProduct.created_by_role}`);

                // Check user details structure
                if (firstProduct.userDetails) {
                    console.log(`\n👥 User Details Found:`);
                    console.log(`   Total users referenced: ${Object.keys(firstProduct.userDetails).length}`);

                    // Show user details for created_by
                    if (firstProduct.createdByUser) {
                        console.log(`\n👤 Created By User Details:`);
                        console.log(`   Name: ${firstProduct.createdByUser.first_name} ${firstProduct.createdByUser.last_name}`);
                        console.log(`   Email: ${firstProduct.createdByUser.email}`);
                        console.log(`   Role: ${firstProduct.createdByUser.role}`);
                        console.log(`   Username: ${firstProduct.createdByUser.username}`);
                    }

                    // Show user details for dealer if exists
                    if (firstProduct.addedByDealerUser) {
                        console.log(`\n🏪 Added By Dealer User Details:`);
                        console.log(`   Name: ${firstProduct.addedByDealerUser.first_name} ${firstProduct.addedByDealerUser.last_name}`);
                        console.log(`   Email: ${firstProduct.addedByDealerUser.email}`);
                        console.log(`   Role: ${firstProduct.addedByDealerUser.role}`);
                    }

                    // Show all user details
                    console.log(`\n📋 All User Details:`);
                    Object.entries(firstProduct.userDetails).forEach(([userId, userData]) => {
                        console.log(`   User ID: ${userId}`);
                        console.log(`   Name: ${userData.first_name} ${userData.last_name}`);
                        console.log(`   Role: ${userData.role}`);
                        console.log(`   Email: ${userData.email}`);
                        console.log(`   ---`);
                    });
                } else {
                    console.log('❌ No user details found in response');
                }
            }
        } else {
            console.log('❌ Failed to fetch products:', response.data.message);
        }

        // Test 2: Search with user details
        console.log('\n📝 Test 2: Search products with user details...');
        const searchResponse = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=motorcycle&page=1&limit=3`, { headers });

        if (searchResponse.data.success) {
            console.log('✅ Search with user details successful');
            console.log(`📦 Found ${searchResponse.data.data.products.length} products`);

            if (searchResponse.data.data.products.length > 0) {
                const product = searchResponse.data.data.products[0];
                console.log(`🔍 Search Result: ${product.product_name}`);
                if (product.createdByUser) {
                    console.log(`👤 Created by: ${product.createdByUser.first_name} ${product.createdByUser.last_name} (${product.createdByUser.role})`);
                }
            }
        } else {
            console.log('❌ Search with user details failed:', searchResponse.data.message);
        }

        // Test 3: Filter with user details
        console.log('\n📝 Test 3: Filter products with user details...');
        const filterResponse = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?status=Approved&page=1&limit=3`, { headers });

        if (filterResponse.data.success) {
            console.log('✅ Filter with user details successful');
            console.log(`📦 Found ${filterResponse.data.data.products.length} approved products`);

            if (filterResponse.data.data.products.length > 0) {
                const product = filterResponse.data.data.products[0];
                console.log(`🔍 Filtered Result: ${product.product_name}`);
                console.log(`📊 Status: ${product.live_status} / ${product.Qc_status}`);
                if (product.createdByUser) {
                    console.log(`👤 Created by: ${product.createdByUser.first_name} ${product.createdByUser.last_name}`);
                }
            }
        } else {
            console.log('❌ Filter with user details failed:', filterResponse.data.message);
        }

        // Test 4: Check for products with rejection state
        console.log('\n📝 Test 4: Check products with rejection state...');
        const rejectedResponse = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?status=Rejected&page=1&limit=3`, { headers });

        if (rejectedResponse.data.success) {
            console.log('✅ Rejected products fetch successful');
            console.log(`📦 Found ${rejectedResponse.data.data.products.length} rejected products`);

            if (rejectedResponse.data.data.products.length > 0) {
                const product = rejectedResponse.data.data.products[0];
                console.log(`🔍 Rejected Product: ${product.product_name}`);

                if (product.rejection_state && product.rejection_state.length > 0) {
                    console.log(`❌ Rejection Details:`);
                    product.rejection_state.forEach((rejection, index) => {
                        console.log(`   Rejection ${index + 1}:`);
                        console.log(`   Rejected by: ${rejection.rejected_by}`);
                        console.log(`   Reason: ${rejection.reason}`);
                        console.log(`   Date: ${rejection.rejected_at}`);

                        // Check if user details are available for rejected_by
                        if (product.userDetails && product.userDetails[rejection.rejected_by]) {
                            const user = product.userDetails[rejection.rejected_by];
                            console.log(`   Rejected by user: ${user.first_name} ${user.last_name} (${user.role})`);
                        }
                    });
                }
            }
        } else {
            console.log('❌ Rejected products fetch failed:', rejectedResponse.data.message);
        }

        // Test 5: Check for products with change logs
        console.log('\n📝 Test 5: Check products with change logs...');
        const changeLogResponse = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?page=1&limit=3`, { headers });

        if (changeLogResponse.data.success) {
            console.log('✅ Products with change logs fetch successful');

            if (changeLogResponse.data.data.products.length > 0) {
                const product = changeLogResponse.data.data.products[0];
                console.log(`🔍 Product: ${product.product_name}`);

                if (product.change_logs && product.change_logs.length > 0) {
                    console.log(`📝 Change Logs (${product.change_logs.length} entries):`);
                    product.change_logs.slice(0, 2).forEach((log, index) => {
                        console.log(`   Change ${index + 1}:`);
                        console.log(`   Modified by: ${log.modified_by}`);
                        console.log(`   Changes: ${log.changes}`);
                        console.log(`   Date: ${log.modified_At}`);

                        // Check if user details are available for modified_by
                        if (product.userDetails && product.userDetails[log.modified_by]) {
                            const user = product.userDetails[log.modified_by];
                            console.log(`   Modified by user: ${user.first_name} ${user.last_name} (${user.role})`);
                        }
                    });
                } else {
                    console.log('📝 No change logs found for this product');
                }
            }
        } else {
            console.log('❌ Products with change logs fetch failed:', changeLogResponse.data.message);
        }

        console.log('\n🎉 User details integration tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure the API endpoint is correct and the service is running');
        }

        if (error.response?.status === 500) {
            console.log('\n💡 Note: Check if the user service is running and accessible');
        }
    }
}

// Instructions for running the test
console.log('👥 Product with User Details Test Script');
console.log('========================================\n');
console.log('Before running this test, please:');
console.log('1. Update BASE_URL with your actual API URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your product service is running');
console.log('4. Make sure your user service is running and accessible');
console.log('5. Ensure you have some products in your database for testing\n');

// Uncomment the line below to run the test
// testProductWithUserDetails();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-product-with-user-details.js');

// Example API calls for manual testing:
console.log('\n📋 Example API calls for manual testing:');
console.log('GET /api/products/get-all-products/pagination?page=1&limit=5');
console.log('GET /api/products/get-all-products/pagination?query=motorcycle&page=1&limit=3');
console.log('GET /api/products/get-all-products/pagination?status=Approved&page=1&limit=3');
console.log('GET /api/products/get-all-products/pagination?status=Rejected&page=1&limit=3');

console.log('\n📊 Expected Response Structure:');
console.log('{');
console.log('  "success": true,');
console.log('  "data": {');
console.log('    "products": [');
console.log('      {');
console.log('        "product_name": "Product Name",');
console.log('        "sku_code": "TOPT1000001",');
console.log('        "created_by": "user_id",');
console.log('        "createdByUser": {');
console.log('          "_id": "user_id",');
console.log('          "first_name": "John",');
console.log('          "last_name": "Doe",');
console.log('          "email": "john@example.com",');
console.log('          "role": "Admin"');
console.log('        },');
console.log('        "userDetails": {');
console.log('          "user_id": { "first_name": "John", "last_name": "Doe", ... }');
console.log('        }');
console.log('      }');
console.log('    ],');
console.log('    "pagination": { ... }');
console.log('  }');
console.log('}');
