const axios = require('axios');

// Debug script for SKU search issue
async function debugSKUSearch() {
    console.log('🔍 Debugging SKU Search Issue...\n');

    const baseURL = 'http://localhost:5002'; // Product service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token
    const testSKU = 'TOPTES001';

    try {
        console.log('='.repeat(60));
        console.log('1. TESTING INTELLIGENT SEARCH WITH SKU');
        console.log('='.repeat(60));

        // Test 1: Intelligent search with SKU
        console.log(`\n📝 Test 1: Intelligent search for SKU "${testSKU}"...`);
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: testSKU,
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Full Response:', JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Intelligent search working');
                if (response.data.data.results.length > 0) {
                    console.log('\n📋 Results Found:');
                    response.data.data.results.forEach((result, index) => {
                        console.log(`\n${index + 1}. Type: ${response.data.data.type}`);
                        console.log(`   ID: ${result.id}`);
                        console.log(`   Name: ${result.name || result.product_name}`);
                        console.log(`   Code: ${result.code || result.sku_code}`);
                    });
                } else {
                    console.log('❌ ISSUE: No results found despite successful response');
                }
            }

        } catch (error) {
            console.log('❌ Error in intelligent search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('2. TESTING DIRECT PRODUCT SEARCH');
        console.log('='.repeat(60));

        // Test 2: Direct product search to verify product exists
        console.log(`\n📝 Test 2: Direct product search for SKU "${testSKU}"...`);
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: testSKU,
                        limit: 10
                    }
                }
            );

            console.log('✅ Direct product search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Direct product search working');
                if (response.data.data && response.data.data.length > 0) {
                    console.log('\n📋 Products Found:');
                    response.data.data.forEach((product, index) => {
                        console.log(`\n${index + 1}. Product: ${product.product_name}`);
                        console.log(`   SKU: ${product.sku_code}`);
                        console.log(`   Live Status: ${product.live_status}`);
                        console.log(`   QC Status: ${product.Qc_status}`);
                        console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                    });
                } else {
                    console.log('❌ ISSUE: No products found in direct search');
                }
            }

        } catch (error) {
            console.log('❌ Error in direct product search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('3. TESTING PRODUCT BY SKU ENDPOINT');
        console.log('='.repeat(60));

        // Test 3: Try to get product by SKU directly
        console.log(`\n📝 Test 3: Get product by SKU "${testSKU}"...`);
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/sku/${testSKU}`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Get product by SKU request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Product found by SKU');
                const product = response.data.data;
                console.log('\n📋 Product Details:');
                console.log(`   Product Name: ${product.product_name}`);
                console.log(`   SKU: ${product.sku_code}`);
                console.log(`   Live Status: ${product.live_status}`);
                console.log(`   QC Status: ${product.Qc_status}`);
                console.log(`   Brand: ${product.brand?.brand_name || 'N/A'}`);
                console.log(`   Manufacturer Part: ${product.manufacturer_part_name || 'N/A'}`);
            }

        } catch (error) {
            console.log('❌ Error in get product by SKU test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('4. TESTING DIFFERENT SKU FORMATS');
        console.log('='.repeat(60));

        // Test 4: Try different SKU formats
        const testSKUs = [testSKU, testSKU.toLowerCase(), testSKU.toUpperCase()];

        for (const sku of testSKUs) {
            console.log(`\n📝 Test 4: Testing SKU format "${sku}"...`);
            try {
                const response = await axios.get(
                    `${baseURL}/products/v1/intelligent-search`,
                    {
                        headers: {
                            'Authorization': authToken,
                            'Content-Type': 'application/json'
                        },
                        params: {
                            query: sku,
                            limit: 10
                        }
                    }
                );

                console.log(`✅ SKU "${sku}" search successful`);
                console.log(`📊 Results: ${response.data.data.results.length}`);

                if (response.data.data.results.length > 0) {
                    console.log(`✅ SUCCESS: Found results for SKU "${sku}"`);
                    break;
                }

            } catch (error) {
                console.log(`❌ Error testing SKU "${sku}":`, error.response?.data?.message || error.message);
            }
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 DEBUG SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Debug script completed');
    console.log('✅ Tested intelligent search with SKU');
    console.log('✅ Tested direct product search');
    console.log('✅ Tested get product by SKU');
    console.log('✅ Tested different SKU formats');

    console.log('\n🔧 Possible Issues:');
    console.log('1. live_status filter might be too restrictive');
    console.log('2. SKU case sensitivity issues');
    console.log('3. Product might be in "Rejected" status');
    console.log('4. Database connection issues');
    console.log('5. Authentication issues');

    console.log('\n📝 Next Steps:');
    console.log('1. Check if product exists in database');
    console.log('2. Verify live_status value');
    console.log('3. Check SKU format and case');
    console.log('4. Test with different SKUs');
    console.log('5. Check authentication token');

    console.log('\n✅ Debug script completed!');
}

// Run the debug
debugSKUSearch();
