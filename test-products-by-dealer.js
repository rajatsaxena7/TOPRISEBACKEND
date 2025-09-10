const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002'; // Product service URL
const DEALER_ID = '507f1f77bcf86cd799439011'; // Replace with actual dealer ID

// Test data
const testCases = [
    {
        name: 'Basic dealer products fetch',
        params: {},
        description: 'Fetch all products for a dealer with default pagination'
    },
    {
        name: 'Filtered by status',
        params: { status: 'Active' },
        description: 'Fetch only active products for a dealer'
    },
    {
        name: 'Filtered by stock status',
        params: { inStock: 'true' },
        description: 'Fetch only in-stock products for a dealer'
    },
    {
        name: 'Search by product name',
        params: { search: 'bike' },
        description: 'Search products by name containing "bike"'
    },
    {
        name: 'Filtered by category',
        params: { category: '507f1f77bcf86cd799439012' },
        description: 'Fetch products filtered by category ID'
    },
    {
        name: 'Filtered by brand',
        params: { brand: '507f1f77bcf86cd799439013' },
        description: 'Fetch products filtered by brand ID'
    },
    {
        name: 'Custom pagination',
        params: { page: 2, limit: 5 },
        description: 'Fetch second page with 5 items per page'
    },
    {
        name: 'Sorted by price',
        params: { sortBy: 'selling_price', sortOrder: 'asc' },
        description: 'Sort products by selling price in ascending order'
    },
    {
        name: 'Without permission matrix',
        params: { includePermissionMatrix: 'false' },
        description: 'Fetch products without permission matrix data'
    },
    {
        name: 'Complex filters',
        params: {
            status: 'Active',
            inStock: 'true',
            search: 'accessory',
            sortBy: 'created_at',
            sortOrder: 'desc',
            page: 1,
            limit: 10
        },
        description: 'Complex query with multiple filters and sorting'
    }
];

async function testProductsByDealer() {
    console.log('🚀 Testing Products by Dealer Endpoint');
    console.log('=====================================\n');

    for (const testCase of testCases) {
        console.log(`📋 Test: ${testCase.name}`);
        console.log(`📝 Description: ${testCase.description}`);

        try {
            const response = await axios.get(`${BASE_URL}/api/products/dealer/${DEALER_ID}`, {
                params: testCase.params,
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.status === 200 && response.data.success) {
                const data = response.data.data;

                console.log('✅ Success!');
                console.log(`📊 Summary:`);
                console.log(`   - Total Products: ${data.summary.totalProducts}`);
                console.log(`   - In Stock: ${data.summary.totalInStock}`);
                console.log(`   - Out of Stock: ${data.summary.totalOutOfStock}`);
                console.log(`   - Average Price: ₹${data.summary.averagePrice}`);
                console.log(`   - Price Range: ₹${data.summary.minPrice} - ₹${data.summary.maxPrice}`);

                console.log(`📄 Pagination:`);
                console.log(`   - Current Page: ${data.pagination.currentPage}`);
                console.log(`   - Total Pages: ${data.pagination.totalPages}`);
                console.log(`   - Products on Page: ${data.products.length}`);
                console.log(`   - Has Next Page: ${data.pagination.hasNextPage}`);

                console.log(`🔍 Filters Applied:`);
                console.log(`   - Status: ${data.filters.status || 'All'}`);
                console.log(`   - In Stock: ${data.filters.inStock || 'All'}`);
                console.log(`   - Category: ${data.filters.category || 'All'}`);
                console.log(`   - Brand: ${data.filters.brand || 'All'}`);
                console.log(`   - Search: ${data.filters.search || 'None'}`);
                console.log(`   - Sort: ${data.filters.sortBy} (${data.filters.sortOrder})`);

                if (data.products.length > 0) {
                    const firstProduct = data.products[0];
                    console.log(`📦 Sample Product:`);
                    console.log(`   - SKU: ${firstProduct.sku_code}`);
                    console.log(`   - Name: ${firstProduct.product_name}`);
                    console.log(`   - MRP: ₹${firstProduct.pricing.mrp_with_gst}`);
                    console.log(`   - Dealer Price: ₹${firstProduct.pricing.dealer_selling_price}`);
                    console.log(`   - In Stock: ${firstProduct.dealer_info.in_stock}`);
                    console.log(`   - Quantity: ${firstProduct.dealer_info.quantity_available}`);

                    if (firstProduct.permission_matrix) {
                        console.log(`🔐 Permission Matrix:`);
                        console.log(`   - Can Edit Pricing: ${firstProduct.permission_matrix.canEdit.selling_price}`);
                        console.log(`   - Can Edit Images: ${firstProduct.permission_matrix.canEdit.images}`);
                        console.log(`   - Can Manage Stock: ${firstProduct.permission_matrix.canManage.stock}`);
                        console.log(`   - Can Manage Availability: ${firstProduct.permission_matrix.canManage.availability}`);
                    }
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
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }

        console.log('\n' + '─'.repeat(80) + '\n');
    }
}

// Test error cases
async function testErrorCases() {
    console.log('🚨 Testing Error Cases');
    console.log('=====================\n');

    const errorTestCases = [
        {
            name: 'Missing dealer ID',
            url: `${BASE_URL}/api/products/dealer/`,
            description: 'Test with missing dealer ID'
        },
        {
            name: 'Invalid dealer ID',
            url: `${BASE_URL}/api/products/dealer/invalid-id`,
            description: 'Test with invalid dealer ID format'
        },
        {
            name: 'Non-existent dealer ID',
            url: `${BASE_URL}/api/products/dealer/507f1f77bcf86cd799439999`,
            description: 'Test with non-existent dealer ID'
        }
    ];

    for (const testCase of errorTestCases) {
        console.log(`📋 Test: ${testCase.name}`);
        console.log(`📝 Description: ${testCase.description}`);

        try {
            const response = await axios.get(testCase.url, {
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('❌ Unexpected Success!');
            console.log(`   Status: ${response.status}`);
            console.log(`   This should have failed but didn't.`);

        } catch (error) {
            if (error.response) {
                console.log('✅ Expected Error!');
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Message: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
            } else {
                console.log('❌ Unexpected Error!');
                console.log(`   Error: ${error.message}`);
            }
        }

        console.log('\n' + '─'.repeat(80) + '\n');
    }
}

// Performance test
async function testPerformance() {
    console.log('⚡ Performance Test');
    console.log('==================\n');

    const iterations = 5;
    const times = [];

    for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        try {
            await axios.get(`${BASE_URL}/api/products/dealer/${DEALER_ID}`, {
                params: { limit: 20 },
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            const endTime = Date.now();
            const duration = endTime - startTime;
            times.push(duration);

            console.log(`⏱️  Request ${i + 1}: ${duration}ms`);

        } catch (error) {
            console.log(`❌ Request ${i + 1}: Failed - ${error.message}`);
        }
    }

    if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log(`\n📊 Performance Summary:`);
        console.log(`   - Average Response Time: ${avgTime.toFixed(2)}ms`);
        console.log(`   - Fastest Response: ${minTime}ms`);
        console.log(`   - Slowest Response: ${maxTime}ms`);
        console.log(`   - Successful Requests: ${times.length}/${iterations}`);
    }
}

// Main execution
async function runTests() {
    console.log('🎯 Products by Dealer Endpoint Test Suite');
    console.log('==========================================\n');

    console.log('📋 Test Configuration:');
    console.log(`   - Base URL: ${BASE_URL}`);
    console.log(`   - Dealer ID: ${DEALER_ID}`);
    console.log(`   - Total Test Cases: ${testCases.length}\n`);

    try {
        await testProductsByDealer();
        await testErrorCases();
        await testPerformance();

        console.log('🎉 All tests completed!');

    } catch (error) {
        console.error('💥 Test suite failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testProductsByDealer,
    testErrorCases,
    testPerformance,
    runTests
};
