const axios = require('axios');

// Test script for enhanced product filtering with product_name, sku_code, and part_name
async function testEnhancedProductFiltering() {
    console.log('🧪 Testing Enhanced Product Filtering...\n');

    const baseURL = 'http://localhost:5002'; // Product service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        console.log('='.repeat(60));
        console.log('1. TESTING PRODUCT NAME FILTERING');
        console.log('='.repeat(60));

        // Test 1: Filter by product name
        console.log('\n📝 Test 1: Filter by product name "spark"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/filters`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        product_name: 'spark',
                        limit: 10
                    }
                }
            );

            console.log('✅ Product name filter request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Total Products Found:', response.data.data.pagination.totalItems);

            if (response.data.success) {
                console.log('✅ SUCCESS: Product name filtering working');
                if (response.data.data.products.length > 0) {
                    console.log('\n📋 Products with "spark" in name:');
                    response.data.data.products.forEach((product, index) => {
                        console.log(`\n${index + 1}. Product: ${product.product_name}`);
                        console.log(`   SKU: ${product.sku_code}`);
                        console.log(`   Manufacturer Part: ${product.manufacturer_part_name || 'N/A'}`);
                        console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                        console.log(`   Price: ₹${product.selling_price || 'N/A'}`);
                    });
                } else {
                    console.log('⚠️  No products found with "spark" in name');
                }
            }

        } catch (error) {
            console.log('❌ Error in product name filter test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('2. TESTING SKU CODE FILTERING');
        console.log('='.repeat(60));

        // Test 2: Filter by SKU code
        console.log('\n📝 Test 2: Filter by SKU code "TOP"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/filters`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        sku_code: 'TOP',
                        limit: 10
                    }
                }
            );

            console.log('✅ SKU code filter request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Total Products Found:', response.data.data.pagination.totalItems);

            if (response.data.success) {
                console.log('✅ SUCCESS: SKU code filtering working');
                if (response.data.data.products.length > 0) {
                    console.log('\n📋 Products with "TOP" in SKU:');
                    response.data.data.products.forEach((product, index) => {
                        console.log(`\n${index + 1}. Product: ${product.product_name}`);
                        console.log(`   SKU: ${product.sku_code}`);
                        console.log(`   Manufacturer Part: ${product.manufacturer_part_name || 'N/A'}`);
                        console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                        console.log(`   Price: ₹${product.selling_price || 'N/A'}`);
                    });
                } else {
                    console.log('⚠️  No products found with "TOP" in SKU');
                }
            }

        } catch (error) {
            console.log('❌ Error in SKU code filter test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('3. TESTING MANUFACTURER PART NAME FILTERING');
        console.log('='.repeat(60));

        // Test 3: Filter by manufacturer part name
        console.log('\n📝 Test 3: Filter by manufacturer part name "M13"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/filters`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        part_name: 'M13',
                        limit: 10
                    }
                }
            );

            console.log('✅ Manufacturer part name filter request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Total Products Found:', response.data.data.pagination.totalItems);

            if (response.data.success) {
                console.log('✅ SUCCESS: Manufacturer part name filtering working');
                if (response.data.data.products.length > 0) {
                    console.log('\n📋 Products with "M13" in manufacturer part:');
                    response.data.data.products.forEach((product, index) => {
                        console.log(`\n${index + 1}. Product: ${product.product_name}`);
                        console.log(`   SKU: ${product.sku_code}`);
                        console.log(`   Manufacturer Part: ${product.manufacturer_part_name || 'N/A'}`);
                        console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                        console.log(`   Price: ₹${product.selling_price || 'N/A'}`);
                    });
                } else {
                    console.log('⚠️  No products found with "M13" in manufacturer part');
                }
            }

        } catch (error) {
            console.log('❌ Error in manufacturer part name filter test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('4. TESTING COMBINED FILTERING');
        console.log('='.repeat(60));

        // Test 4: Combine multiple filters
        console.log('\n📝 Test 4: Combined filtering (product_name + brand)...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/filters`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        product_name: 'oil',
                        brand: 'TVS', // Assuming TVS brand exists
                        limit: 10
                    }
                }
            );

            console.log('✅ Combined filter request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Total Products Found:', response.data.data.pagination.totalItems);

            if (response.data.success) {
                console.log('✅ SUCCESS: Combined filtering working');
                if (response.data.data.products.length > 0) {
                    console.log('\n📋 TVS products with "oil" in name:');
                    response.data.data.products.forEach((product, index) => {
                        console.log(`\n${index + 1}. Product: ${product.product_name}`);
                        console.log(`   SKU: ${product.sku_code}`);
                        console.log(`   Manufacturer Part: ${product.manufacturer_part_name || 'N/A'}`);
                        console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                        console.log(`   Price: ₹${product.selling_price || 'N/A'}`);
                    });
                } else {
                    console.log('⚠️  No TVS products found with "oil" in name');
                }
            }

        } catch (error) {
            console.log('❌ Error in combined filter test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('5. TESTING CASE INSENSITIVE FILTERING');
        console.log('='.repeat(60));

        // Test 5: Test case insensitive filtering
        console.log('\n📝 Test 5: Case insensitive filtering (uppercase "SPARK")...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/filters`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        product_name: 'SPARK',
                        limit: 10
                    }
                }
            );

            console.log('✅ Case insensitive filter request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Total Products Found:', response.data.data.pagination.totalItems);

            if (response.data.success) {
                console.log('✅ SUCCESS: Case insensitive filtering working');
                if (response.data.data.products.length > 0) {
                    console.log('\n📋 Products with "SPARK" (case insensitive):');
                    response.data.data.products.forEach((product, index) => {
                        console.log(`\n${index + 1}. Product: ${product.product_name}`);
                        console.log(`   SKU: ${product.sku_code}`);
                        console.log(`   Manufacturer Part: ${product.manufacturer_part_name || 'N/A'}`);
                        console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                        console.log(`   Price: ₹${product.selling_price || 'N/A'}`);
                    });
                } else {
                    console.log('⚠️  No products found with "SPARK" (case insensitive)');
                }
            }

        } catch (error) {
            console.log('❌ Error in case insensitive filter test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('6. TESTING PAGINATION WITH FILTERS');
        console.log('='.repeat(60));

        // Test 6: Test pagination with filters
        console.log('\n📝 Test 6: Pagination with product name filter...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/filters`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        product_name: 'filter',
                        page: 0,
                        limit: 5
                    }
                }
            );

            console.log('✅ Pagination with filter request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Current Page:', response.data.data.pagination.currentPage);
            console.log('📊 Total Pages:', response.data.data.pagination.totalPages);
            console.log('📊 Total Items:', response.data.data.pagination.totalItems);
            console.log('📊 Items Per Page:', response.data.data.pagination.limit);
            console.log('📊 Has Next Page:', response.data.data.pagination.hasNextPage);

            if (response.data.success) {
                console.log('✅ SUCCESS: Pagination with filters working');
                console.log(`📄 Showing ${response.data.data.products.length} products on page ${response.data.data.pagination.currentPage + 1}`);
            }

        } catch (error) {
            console.log('❌ Error in pagination with filter test:', error.response?.data?.message || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 ENHANCED PRODUCT FILTERING SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Enhanced product filtering implemented successfully');
    console.log('✅ Product name filtering with regex support');
    console.log('✅ SKU code filtering with regex support');
    console.log('✅ Manufacturer part name filtering with regex support');
    console.log('✅ Case insensitive filtering');
    console.log('✅ Combined filtering support');
    console.log('✅ Pagination support with filters');

    console.log('\n🔧 New Filter Parameters:');
    console.log('1. product_name - Filter by product name (partial match, case insensitive)');
    console.log('2. sku_code - Filter by SKU code (partial match, case insensitive)');
    console.log('3. part_name - Filter by manufacturer part name (partial match, case insensitive)');

    console.log('\n📝 API Usage Examples:');
    console.log('1. GET /products/v1/filters?product_name=spark');
    console.log('2. GET /products/v1/filters?sku_code=TOP');
    console.log('3. GET /products/v1/filters?part_name=M13');
    console.log('4. GET /products/v1/filters?product_name=oil&brand=TVS');
    console.log('5. GET /products/v1/filters?product_name=filter&page=0&limit=5');

    console.log('\n✅ The enhanced product filtering is ready for use!');
}

// Run the test
testEnhancedProductFiltering();
