const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Adjust port as needed
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testProductSearch() {
    try {
        console.log('🔍 Testing Product Search Functionality...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Search by product name
        console.log('📝 Test 1: Search by product name...');
        const searchByName = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=motorcycle&page=1&limit=10`, { headers });

        if (searchByName.data.success) {
            console.log('✅ Search by product name successful');
            console.log(`📦 Found ${searchByName.data.data.products.length} products`);
            console.log(`📄 Total items: ${searchByName.data.data.pagination.totalItems}`);

            // Show first product details
            if (searchByName.data.data.products.length > 0) {
                const firstProduct = searchByName.data.data.products[0];
                console.log(`🔍 Sample result: ${firstProduct.product_name} (SKU: ${firstProduct.sku_code})`);
            }
        } else {
            console.log('❌ Search by product name failed:', searchByName.data.message);
        }

        // Test 2: Search by manufacturer part name
        console.log('\n📝 Test 2: Search by manufacturer part name...');
        const searchByPartName = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=brake&page=1&limit=10`, { headers });

        if (searchByPartName.data.success) {
            console.log('✅ Search by manufacturer part name successful');
            console.log(`📦 Found ${searchByPartName.data.data.products.length} products`);
            console.log(`📄 Total items: ${searchByPartName.data.data.pagination.totalItems}`);

            // Show first product details
            if (searchByPartName.data.data.products.length > 0) {
                const firstProduct = searchByPartName.data.data.products[0];
                console.log(`🔍 Sample result: ${firstProduct.product_name} (Part: ${firstProduct.manufacturer_part_name})`);
            }
        } else {
            console.log('❌ Search by manufacturer part name failed:', searchByPartName.data.message);
        }

        // Test 3: Search by SKU
        console.log('\n📝 Test 3: Search by SKU...');
        const searchBySku = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=TOPT&page=1&limit=10`, { headers });

        if (searchBySku.data.success) {
            console.log('✅ Search by SKU successful');
            console.log(`📦 Found ${searchBySku.data.data.products.length} products`);
            console.log(`📄 Total items: ${searchBySku.data.data.pagination.totalItems}`);

            // Show first product details
            if (searchBySku.data.data.products.length > 0) {
                const firstProduct = searchBySku.data.data.products[0];
                console.log(`🔍 Sample result: ${firstProduct.product_name} (SKU: ${firstProduct.sku_code})`);
            }
        } else {
            console.log('❌ Search by SKU failed:', searchBySku.data.message);
        }

        // Test 4: Search with filters (brand + search)
        console.log('\n📝 Test 4: Search with brand filter...');
        const searchWithBrand = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=oil&brand=your-brand-id&page=1&limit=10`, { headers });

        if (searchWithBrand.data.success) {
            console.log('✅ Search with brand filter successful');
            console.log(`📦 Found ${searchWithBrand.data.data.products.length} products`);
            console.log(`📄 Total items: ${searchWithBrand.data.data.pagination.totalItems}`);
        } else {
            console.log('❌ Search with brand filter failed:', searchWithBrand.data.message);
        }

        // Test 5: Search with status filter
        console.log('\n📝 Test 5: Search with status filter...');
        const searchWithStatus = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=filter&status=Approved&page=1&limit=10`, { headers });

        if (searchWithStatus.data.success) {
            console.log('✅ Search with status filter successful');
            console.log(`📦 Found ${searchWithStatus.data.data.products.length} products`);
            console.log(`📄 Total items: ${searchWithStatus.data.data.pagination.totalItems}`);
        } else {
            console.log('❌ Search with status filter failed:', searchWithStatus.data.message);
        }

        // Test 6: Case insensitive search
        console.log('\n📝 Test 6: Case insensitive search...');
        const caseInsensitiveSearch = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=MOTORCYCLE&page=1&limit=10`, { headers });

        if (caseInsensitiveSearch.data.success) {
            console.log('✅ Case insensitive search successful');
            console.log(`📦 Found ${caseInsensitiveSearch.data.data.products.length} products`);
        } else {
            console.log('❌ Case insensitive search failed:', caseInsensitiveSearch.data.message);
        }

        // Test 7: No results search
        console.log('\n📝 Test 7: No results search...');
        const noResultsSearch = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=nonexistentproduct123&page=1&limit=10`, { headers });

        if (noResultsSearch.data.success) {
            console.log('✅ No results search handled correctly');
            console.log(`📦 Found ${noResultsSearch.data.data.products.length} products`);
            console.log(`📄 Total items: ${noResultsSearch.data.data.pagination.totalItems}`);
        } else {
            console.log('❌ No results search failed:', noResultsSearch.data.message);
        }

        // Test 8: Pagination with search
        console.log('\n📝 Test 8: Pagination with search...');
        const paginationSearch = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination?query=part&page=2&limit=5`, { headers });

        if (paginationSearch.data.success) {
            console.log('✅ Pagination with search successful');
            console.log(`📦 Found ${paginationSearch.data.data.products.length} products on page 2`);
            console.log(`📄 Total items: ${paginationSearch.data.data.pagination.totalItems}`);
            console.log(`📄 Current page: ${paginationSearch.data.data.pagination.currentPage}`);
            console.log(`📄 Total pages: ${paginationSearch.data.data.pagination.totalPages}`);
        } else {
            console.log('❌ Pagination with search failed:', paginationSearch.data.message);
        }

        console.log('\n🎉 Search functionality tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure the API endpoint is correct and the service is running');
        }
    }
}

// Instructions for running the test
console.log('🔍 Product Search Test Script');
console.log('============================\n');
console.log('Before running this test, please:');
console.log('1. Update BASE_URL with your actual API URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your product service is running');
console.log('4. Ensure you have some products in your database for testing\n');

// Uncomment the line below to run the test
// testProductSearch();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-product-search.js');

// Example API calls for manual testing:
console.log('\n📋 Example API calls for manual testing:');
console.log('GET /api/products/get-all-products/pagination?query=motorcycle&page=1&limit=10');
console.log('GET /api/products/get-all-products/pagination?query=brake&page=1&limit=10');
console.log('GET /api/products/get-all-products/pagination?query=TOPT&page=1&limit=10');
console.log('GET /api/products/get-all-products/pagination?query=oil&brand=brand-id&page=1&limit=10');
console.log('GET /api/products/get-all-products/pagination?query=filter&status=Approved&page=1&limit=10');
