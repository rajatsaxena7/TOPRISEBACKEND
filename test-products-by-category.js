const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api/products-by-category';
const AUTH_TOKEN = 'Bearer YOUR_JWT_TOKEN_HERE'; // Replace with actual token

// Test data
const testCategoryId = 'YOUR_CATEGORY_ID_HERE'; // Replace with actual category ID
const testCategoryName = 'Engine Parts'; // Replace with actual category name
const testCategoryCode = 'ENG001'; // Replace with actual category code

// Helper function to make requests
async function makeRequest(method, url, data = null, headers = {}) {
    try {
        const config = {
            method,
            url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': AUTH_TOKEN,
                ...headers
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`❌ Error in ${method} ${url}:`, error.response?.data || error.message);
        return null;
    }
}

// Test functions
async function testGetProductsByCategoryId() {
    console.log('\n🧪 Testing: Get Products by Category ID');
    console.log('='.repeat(50));

    const response = await makeRequest('GET', `${BASE_URL}/category/${testCategoryId}?page=1&limit=5`);

    if (response) {
        console.log('✅ Success!');
        console.log(`📊 Found ${response.data.products.length} products`);
        console.log(`📄 Page: ${response.data.pagination.currentPage}/${response.data.pagination.totalPages}`);
        console.log(`📦 Total Products: ${response.data.pagination.totalProducts}`);
        console.log(`🏷️ Category: ${response.data.category.category_name}`);

        if (response.data.products.length > 0) {
            console.log('\n📋 Sample Product:');
            const product = response.data.products[0];
            console.log(`   - Name: ${product.product_name}`);
            console.log(`   - SKU: ${product.sku_code}`);
            console.log(`   - Status: ${product.live_status}`);
            console.log(`   - Price: ₹${product.selling_price}`);
        }
    }
}

async function testGetProductsByCategoryName() {
    console.log('\n🧪 Testing: Get Products by Category Name');
    console.log('='.repeat(50));

    const response = await makeRequest('GET', `${BASE_URL}/category/name/${encodeURIComponent(testCategoryName)}?page=1&limit=5`);

    if (response) {
        console.log('✅ Success!');
        console.log(`📊 Found ${response.data.products.length} products`);
        console.log(`📄 Page: ${response.data.pagination.currentPage}/${response.data.pagination.totalPages}`);
        console.log(`📦 Total Products: ${response.data.pagination.totalProducts}`);
        console.log(`🏷️ Category: ${response.data.category.category_name}`);
    }
}

async function testGetProductsByCategoryCode() {
    console.log('\n🧪 Testing: Get Products by Category Code');
    console.log('='.repeat(50));

    const response = await makeRequest('GET', `${BASE_URL}/category/code/${testCategoryCode}?page=1&limit=5`);

    if (response) {
        console.log('✅ Success!');
        console.log(`📊 Found ${response.data.products.length} products`);
        console.log(`📄 Page: ${response.data.pagination.currentPage}/${response.data.pagination.totalPages}`);
        console.log(`📦 Total Products: ${response.data.pagination.totalProducts}`);
        console.log(`🏷️ Category: ${response.data.category.category_name}`);
    }
}

async function testGetProductCountByCategory() {
    console.log('\n🧪 Testing: Get Product Count by Category');
    console.log('='.repeat(50));

    const response = await makeRequest('GET', `${BASE_URL}/category/${testCategoryId}/count`);

    if (response) {
        console.log('✅ Success!');
        console.log(`📊 Total Products: ${response.data.summary.totalProducts}`);
        console.log(`🏷️ Category: ${response.data.category.category_name}`);

        console.log('\n📈 Status Breakdown:');
        response.data.breakdown.byStatus.forEach(item => {
            console.log(`   - ${item.status}: ${item.count} (${item.percentage}%)`);
        });

        console.log('\n🔧 Product Type Breakdown:');
        response.data.breakdown.byProductType.forEach(item => {
            console.log(`   - ${item.productType}: ${item.count} (${item.percentage}%)`);
        });
    }
}

async function testGetCategoriesWithProductCounts() {
    console.log('\n🧪 Testing: Get Categories with Product Counts');
    console.log('='.repeat(50));

    const response = await makeRequest('GET', `${BASE_URL}/categories/with-counts`);

    if (response) {
        console.log('✅ Success!');
        console.log(`📊 Total Categories: ${response.data.summary.totalCategories}`);
        console.log(`📦 Total Products: ${response.data.summary.totalProducts}`);

        console.log('\n🏷️ Top 5 Categories by Product Count:');
        response.data.categories.slice(0, 5).forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.category_name} (${cat.category_code}): ${cat.productCount} products`);
        });
    }
}

async function testErrorHandling() {
    console.log('\n🧪 Testing: Error Handling');
    console.log('='.repeat(50));

    // Test with invalid category ID
    console.log('Testing with invalid category ID...');
    const invalidResponse = await makeRequest('GET', `${BASE_URL}/category/invalid-id`);

    if (invalidResponse === null) {
        console.log('✅ Error handling working correctly for invalid category ID');
    }

    // Test with non-existent category name
    console.log('Testing with non-existent category name...');
    const nonExistentResponse = await makeRequest('GET', `${BASE_URL}/category/name/NonExistentCategory`);

    if (nonExistentResponse === null) {
        console.log('✅ Error handling working correctly for non-existent category name');
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Products by Category API Tests');
    console.log('='.repeat(60));

    console.log('\n⚠️  Note: Make sure to update the test data variables at the top of this file:');
    console.log('   - AUTH_TOKEN: Your JWT token');
    console.log('   - testCategoryId: A valid category ID from your database');
    console.log('   - testCategoryName: A valid category name from your database');
    console.log('   - testCategoryCode: A valid category code from your database');

    // Check if test data is configured
    if (AUTH_TOKEN === 'Bearer YOUR_JWT_TOKEN_HERE' ||
        testCategoryId === 'YOUR_CATEGORY_ID_HERE') {
        console.log('\n❌ Please configure the test data before running tests!');
        return;
    }

    try {
        await testGetProductsByCategoryId();
        await testGetProductsByCategoryName();
        await testGetProductsByCategoryCode();
        await testGetProductCountByCategory();
        await testGetCategoriesWithProductCounts();
        await testErrorHandling();

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
    testGetProductsByCategoryId,
    testGetProductsByCategoryName,
    testGetProductsByCategoryCode,
    testGetProductCountByCategory,
    testGetCategoriesWithProductCounts,
    testErrorHandling,
    runAllTests
};
