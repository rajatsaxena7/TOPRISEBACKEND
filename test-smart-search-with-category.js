const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api/search';
const AUTH_TOKEN = 'Bearer YOUR_JWT_TOKEN_HERE'; // Replace with actual token

// Test data - Replace with actual values from your database
const testData = {
    categoryId: 'YOUR_CATEGORY_ID_HERE', // Replace with actual category ID
    categoryName: 'Engine Parts', // Replace with actual category name
    searchQuery: 'Honda Civic', // Replace with actual search query
    type: 'YOUR_TYPE_ID_HERE' // Replace with actual type ID (optional)
};

// Helper function to make requests
async function makeRequest(url, params = {}) {
    try {
        const response = await axios.get(url, {
            params,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_TOKEN
            }
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Error in request:`, error.response?.data || error.message);
        return null;
    }
}

// Test functions
async function testSmartSearchWithoutCategory() {
    console.log('\n🧪 Testing: Smart Search without Category');
    console.log('='.repeat(50));

    const response = await makeRequest(`${BASE_URL}/smart-search`, {
        query: testData.searchQuery,
        page: 1,
        limit: 5
    });

    if (response) {
        console.log('✅ Success!');
        console.log(`🔍 Search Query: ${response.searchQuery}`);
        console.log(`📊 Results Type: ${getResultType(response)}`);
        console.log(`📦 Total Items: ${response.pagination?.totalitems || 'N/A'}`);

        if (response.results.products) {
            console.log(`🏷️ Products Found: ${response.results.products.length}`);
            if (response.results.products.length > 0) {
                console.log('\n📋 Sample Product:');
                const product = response.results.products[0];
                console.log(`   - Name: ${product.product_name}`);
                console.log(`   - SKU: ${product.sku_code}`);
                console.log(`   - Price: ₹${product.selling_price}`);
            }
        }
    }
}

async function testSmartSearchWithCategoryId() {
    console.log('\n🧪 Testing: Smart Search with Category ID');
    console.log('='.repeat(50));

    const response = await makeRequest(`${BASE_URL}/smart-search`, {
        query: testData.searchQuery,
        category: testData.categoryId,
        page: 1,
        limit: 5
    });

    if (response) {
        console.log('✅ Success!');
        console.log(`🔍 Search Query: ${response.searchQuery}`);
        console.log(`📊 Results Type: ${getResultType(response)}`);
        console.log(`📦 Total Items: ${response.pagination?.totalitems || 'N/A'}`);

        if (response.results.category) {
            console.log(`🏷️ Category: ${response.results.category.category_name} (${response.results.category.category_code})`);
        }

        if (response.results.products) {
            console.log(`🏷️ Products Found: ${response.results.products.length}`);
        }
    }
}

async function testSmartSearchWithCategoryName() {
    console.log('\n🧪 Testing: Smart Search with Category Name');
    console.log('='.repeat(50));

    const response = await makeRequest(`${BASE_URL}/smart-search`, {
        query: testData.searchQuery,
        category: testData.categoryName,
        page: 1,
        limit: 5
    });

    if (response) {
        console.log('✅ Success!');
        console.log(`🔍 Search Query: ${response.searchQuery}`);
        console.log(`📊 Results Type: ${getResultType(response)}`);
        console.log(`📦 Total Items: ${response.pagination?.totalitems || 'N/A'}`);

        if (response.results.category) {
            console.log(`🏷️ Category: ${response.results.category.category_name} (${response.results.category.category_code})`);
        }

        if (response.results.products) {
            console.log(`🏷️ Products Found: ${response.results.products.length}`);
        }
    }
}

async function testSmartSearchWithAllFilters() {
    console.log('\n🧪 Testing: Smart Search with All Filters');
    console.log('='.repeat(50));

    const response = await makeRequest(`${BASE_URL}/smart-search`, {
        query: testData.searchQuery,
        category: testData.categoryId,
        type: testData.type,
        min_price: 1000,
        max_price: 50000,
        sort_by: 'L-H',
        page: 1,
        limit: 5
    });

    if (response) {
        console.log('✅ Success!');
        console.log(`🔍 Search Query: ${response.searchQuery}`);
        console.log(`📊 Results Type: ${getResultType(response)}`);
        console.log(`📦 Total Items: ${response.pagination?.totalitems || 'N/A'}`);

        if (response.results.category) {
            console.log(`🏷️ Category: ${response.results.category.category_name}`);
        }

        if (response.results.products) {
            console.log(`🏷️ Products Found: ${response.results.products.length}`);
            if (response.results.products.length > 0) {
                console.log('\n📋 Price Range Check:');
                const prices = response.results.products.map(p => p.selling_price);
                console.log(`   - Min Price: ₹${Math.min(...prices)}`);
                console.log(`   - Max Price: ₹${Math.max(...prices)}`);
            }
        }
    }
}

async function testSmartSearchWithInvalidCategory() {
    console.log('\n🧪 Testing: Smart Search with Invalid Category');
    console.log('='.repeat(50));

    const response = await makeRequest(`${BASE_URL}/smart-search`, {
        query: testData.searchQuery,
        category: 'invalid-category-id',
        page: 1,
        limit: 5
    });

    if (response === null) {
        console.log('✅ Error handling working correctly for invalid category');
    } else {
        console.log('⚠️ Unexpected response for invalid category');
    }
}

async function testSmartSearchCategoryOnly() {
    console.log('\n🧪 Testing: Smart Search with Category Only (No Brand Match)');
    console.log('='.repeat(50));

    const response = await makeRequest(`${BASE_URL}/smart-search`, {
        query: 'xyz123nonexistentbrand', // Query that won't match any brand
        category: testData.categoryId,
        page: 1,
        limit: 5
    });

    if (response) {
        console.log('✅ Success!');
        console.log(`🔍 Search Query: ${response.searchQuery}`);
        console.log(`📊 Results Type: ${getResultType(response)}`);

        if (response.results.category) {
            console.log(`🏷️ Category: ${response.results.category.category_name}`);
        }

        if (response.results.message) {
            console.log(`💬 Message: ${response.results.message}`);
        }
    }
}

// Helper function to determine result type
function getResultType(response) {
    if (response.is_brand) return 'Brand Results';
    if (response.is_model) return 'Model Results';
    if (response.is_variant) return 'Variant Results';
    if (response.is_product) return 'Product Results';
    return 'Unknown';
}

// Performance test
async function testPerformance() {
    console.log('\n🧪 Testing: Performance with Category Filter');
    console.log('='.repeat(50));

    const startTime = Date.now();

    const response = await makeRequest(`${BASE_URL}/smart-search`, {
        query: testData.searchQuery,
        category: testData.categoryId,
        page: 1,
        limit: 20
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response) {
        console.log(`✅ Request completed in ${duration}ms`);
        console.log(`📦 Results: ${response.pagination?.totalitems || 0} items`);
        console.log(`⚡ Performance: ${duration < 1000 ? 'Good' : duration < 3000 ? 'Acceptable' : 'Slow'}`);
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Smart Search with Category Tests');
    console.log('='.repeat(60));

    console.log('\n⚠️  Note: Make sure to update the test data variables:');
    console.log('   - AUTH_TOKEN: Your JWT token');
    console.log('   - testData.categoryId: A valid category ID from your database');
    console.log('   - testData.categoryName: A valid category name from your database');
    console.log('   - testData.searchQuery: A search query that will find results');
    console.log('   - testData.type: A valid type ID (optional)');

    // Check if test data is configured
    if (AUTH_TOKEN === 'Bearer YOUR_JWT_TOKEN_HERE' ||
        testData.categoryId === 'YOUR_CATEGORY_ID_HERE') {
        console.log('\n❌ Please configure the test data before running tests!');
        return;
    }

    try {
        await testSmartSearchWithoutCategory();
        await testSmartSearchWithCategoryId();
        await testSmartSearchWithCategoryName();
        await testSmartSearchWithAllFilters();
        await testSmartSearchWithInvalidCategory();
        await testSmartSearchCategoryOnly();
        await testPerformance();

        console.log('\n🎉 All tests completed!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testSmartSearchWithoutCategory,
    testSmartSearchWithCategoryId,
    testSmartSearchWithCategoryName,
    testSmartSearchWithAllFilters,
    testSmartSearchWithInvalidCategory,
    testSmartSearchCategoryOnly,
    testPerformance,
    runAllTests
};
