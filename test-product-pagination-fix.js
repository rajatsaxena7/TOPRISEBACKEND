const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001'; // Product service port

async function testProductPagination() {
    try {
        console.log('🧪 Testing Product Pagination Fix...\n');

        // Test 1: Page 1 with limit 1
        console.log('Test 1: Page 1 with limit 1');
        const response1 = await axios.get(`${BASE_URL}/api/products/filters`, {
            params: {
                page: 1,
                limit: 1
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Status:', response1.status);
        console.log('📊 Page 1 - First product:', response1.data.data.products[0]?.product_name || 'No products');
        console.log('📊 Pagination info:', response1.data.data.pagination);
        console.log('\n');

        // Test 2: Page 2 with limit 1
        console.log('Test 2: Page 2 with limit 1');
        const response2 = await axios.get(`${BASE_URL}/api/products/filters`, {
            params: {
                page: 2,
                limit: 1
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Status:', response2.status);
        console.log('📊 Page 2 - Second product:', response2.data.data.products[0]?.product_name || 'No products');
        console.log('📊 Pagination info:', response2.data.data.pagination);
        console.log('\n');

        // Test 3: Page 3 with limit 1
        console.log('Test 3: Page 3 with limit 1');
        const response3 = await axios.get(`${BASE_URL}/api/products/filters`, {
            params: {
                page: 3,
                limit: 1
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Status:', response3.status);
        console.log('📊 Page 3 - Third product:', response3.data.data.products[0]?.product_name || 'No products');
        console.log('📊 Pagination info:', response3.data.data.pagination);
        console.log('\n');

        // Test 4: Verify products are different
        console.log('Test 4: Verifying products are different across pages');
        const page1Product = response1.data.data.products[0]?.product_name;
        const page2Product = response2.data.data.products[0]?.product_name;
        const page3Product = response3.data.data.products[0]?.product_name;

        if (page1Product && page2Product && page1Product !== page2Product) {
            console.log('✅ Page 1 and Page 2 show different products');
        } else {
            console.log('❌ Page 1 and Page 2 show the same product');
        }

        if (page2Product && page3Product && page2Product !== page3Product) {
            console.log('✅ Page 2 and Page 3 show different products');
        } else {
            console.log('❌ Page 2 and Page 3 show the same product');
        }

        if (page1Product && page3Product && page1Product !== page3Product) {
            console.log('✅ Page 1 and Page 3 show different products');
        } else {
            console.log('❌ Page 1 and Page 3 show the same product');
        }

        console.log('\n');

        // Test 5: Test with different limit
        console.log('Test 5: Page 1 with limit 2');
        const response5 = await axios.get(`${BASE_URL}/api/products/filters`, {
            params: {
                page: 1,
                limit: 2
            },
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Status:', response5.status);
        console.log('📊 Page 1 with limit 2 - Products count:', response5.data.data.products.length);
        console.log('📊 First product:', response5.data.data.products[0]?.product_name || 'No products');
        console.log('📊 Second product:', response5.data.data.products[1]?.product_name || 'No products');
        console.log('\n');

        console.log('🎉 All pagination tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

// Run the test
testProductPagination();
