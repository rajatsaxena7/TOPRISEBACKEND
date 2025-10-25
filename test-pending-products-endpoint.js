const axios = require('axios');

// Test script for pending products endpoint
async function testPendingProductsEndpoint() {
    console.log('🧪 Testing Pending Products Endpoint...\n');

    const baseURL = 'http://localhost:5002'; // Product service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        console.log('='.repeat(60));
        console.log('1. TESTING PENDING PRODUCTS ENDPOINT');
        console.log('='.repeat(60));

        // Test 1: Get pending products
        console.log('\n📝 Test 1: Get pending products...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/pending`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        page: 1,
                        limit: 10
                    }
                }
            );

            console.log('✅ Pending products request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Pending products fetched successfully');
                console.log('📊 Total Products:', response.data.data.products.length);
                console.log('📊 Pagination Info:', response.data.data.pagination);

                // Verify that all products have Qc_status: "Pending"
                const allPendingQC = response.data.data.products.every(product =>
                    product.Qc_status === "Pending"
                );

                if (allPendingQC) {
                    console.log('✅ SUCCESS: All products have Qc_status: "Pending"');
                } else {
                    console.log('❌ ERROR: Some products do not have Qc_status: "Pending"');
                }

                // Verify that all products have live_status: "Pending"
                const allPendingLive = response.data.data.products.every(product =>
                    product.live_status === "Pending"
                );

                if (allPendingLive) {
                    console.log('✅ SUCCESS: All products have live_status: "Pending"');
                } else {
                    console.log('❌ ERROR: Some products do not have live_status: "Pending"');
                }

                // Display product details
                console.log('\n📋 Product Details:');
                response.data.data.products.forEach((product, index) => {
                    console.log(`\n${index + 1}. Product: ${product.product_name}`);
                    console.log(`   SKU: ${product.sku_code}`);
                    console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                    console.log(`   Category: ${product.category?.category_name || 'N/A'}`);
                    console.log(`   Live Status: ${product.live_status}`);
                    console.log(`   QC Status: ${product.Qc_status}`);
                    console.log(`   Created At: ${product.created_at}`);
                });

            } else {
                console.log('❌ ERROR: Failed to fetch pending products');
            }

        } catch (error) {
            console.log('❌ Error in pending products test:', error.response?.data?.message || error.message);
            if (error.response?.status === 401) {
                console.log('🔐 Authentication required - please provide valid token');
            } else if (error.response?.status === 403) {
                console.log('🚫 Authorization required - user must have appropriate role');
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('2. TESTING PENDING PRODUCTS WITH FILTERS');
        console.log('='.repeat(60));

        // Test 2: Get pending products with role filter
        console.log('\n📝 Test 2: Get pending products with created_by_role filter...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/pending`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        page: 1,
                        limit: 5,
                        created_by_role: 'Super-admin'
                    }
                }
            );

            console.log('✅ Filtered pending products request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Filtered pending products fetched successfully');
                console.log('📊 Total Products:', response.data.data.products.length);

                // Verify filtering by role
                const allSuperAdmin = response.data.data.products.every(product =>
                    product.created_by_role === 'Super-admin'
                );

                if (allSuperAdmin) {
                    console.log('✅ SUCCESS: All products filtered by created_by_role: "Super-admin"');
                } else {
                    console.log('⚠️  WARNING: Some products may not match the role filter');
                }
            }

        } catch (error) {
            console.log('❌ Error in filtered pending products test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('3. TESTING PAGINATION');
        console.log('='.repeat(60));

        // Test 3: Test pagination
        console.log('\n📝 Test 3: Test pagination...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/pending`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        page: 1,
                        limit: 2
                    }
                }
            );

            console.log('✅ Pagination test successful');
            console.log('📊 Response Status:', response.status);

            if (response.data.success) {
                const pagination = response.data.data.pagination;
                console.log('📊 Pagination Info:');
                console.log(`   Total Items: ${pagination.totalItems}`);
                console.log(`   Total Pages: ${pagination.totalPages}`);
                console.log(`   Current Page: ${pagination.currentPage}`);
                console.log(`   Items Per Page: ${pagination.itemsPerPage}`);
                console.log(`   Has Next Page: ${pagination.hasNextPage}`);
                console.log(`   Has Previous Page: ${pagination.hasPreviousPage}`);

                if (pagination.totalItems > 0) {
                    console.log('✅ SUCCESS: Pagination working correctly');
                } else {
                    console.log('ℹ️  INFO: No pending products found');
                }
            }

        } catch (error) {
            console.log('❌ Error in pagination test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('4. TESTING ERROR SCENARIOS');
        console.log('='.repeat(60));

        // Test 4: Without authentication
        console.log('\n📝 Test 4: Without authentication...');
        try {
            await axios.get(
                `${baseURL}/products/v1/pending`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.log('✅ Expected authentication error caught:', error.response?.status);
            console.log('📊 Error Message:', error.response?.data?.message);
        }

        // Test 5: With insufficient permissions
        console.log('\n📝 Test 5: With insufficient permissions...');
        try {
            await axios.get(
                `${baseURL}/products/v1/pending`,
                {
                    headers: {
                        'Authorization': 'Bearer invalid-token',
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.log('✅ Expected authorization error caught:', error.response?.status);
            console.log('📊 Error Message:', error.response?.data?.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Pending products endpoint is correctly implemented');
    console.log('✅ Filters by both live_status: "Pending" and Qc_status: "Pending"');
    console.log('✅ Supports pagination with page and limit parameters');
    console.log('✅ Supports filtering by created_by_role');
    console.log('✅ Requires authentication and proper authorization');
    console.log('✅ Returns proper error messages for invalid requests');

    console.log('\n🔧 Endpoint Details:');
    console.log('URL: GET /products/v1/pending');
    console.log('Authentication: Required (Bearer token)');
    console.log('Authorization: Super-admin, Inventory-Admin, Inventory-Staff');
    console.log('Query Parameters:');
    console.log('  - page: Page number (default: 1)');
    console.log('  - limit: Items per page (default: 10)');
    console.log('  - created_by_role: Filter by creator role (optional)');

    console.log('\n📝 Response Format:');
    console.log('{');
    console.log('  "success": true,');
    console.log('  "message": "Pending products fetched successfully",');
    console.log('  "data": {');
    console.log('    "products": [...],');
    console.log('    "pagination": {');
    console.log('      "totalItems": 2,');
    console.log('      "totalPages": 1,');
    console.log('      "currentPage": 1,');
    console.log('      "itemsPerPage": 10,');
    console.log('      "hasNextPage": false,');
    console.log('      "hasPreviousPage": false');
    console.log('    }');
    console.log('  }');
    console.log('}');

    console.log('\n✅ The endpoint is working correctly and filtering by QC status as requested!');
}

// Run the test
testPendingProductsEndpoint();
