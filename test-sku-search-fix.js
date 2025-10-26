const axios = require('axios');

// Test script to verify SKU search fix
async function testSKUSearchFix() {
    console.log('🧪 Testing SKU Search Fix...\n');

    const baseURL = 'http://localhost:5002'; // Product service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        console.log('='.repeat(60));
        console.log('TESTING SKU SEARCH AFTER FIX');
        console.log('='.repeat(60));

        // Test the specific SKU that was failing
        const testSKU = 'TOPTES001';
        console.log(`\n📝 Testing SKU: "${testSKU}"`);

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
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Suggestion:', response.data.data.suggestion);
            console.log('📊 Total Results:', response.data.data.total);

            if (response.data.success) {
                if (response.data.data.results.length > 0) {
                    console.log('✅ SUCCESS: SKU search is now working!');
                    console.log('\n📋 Results Found:');
                    response.data.data.results.forEach((result, index) => {
                        console.log(`\n${index + 1}. Type: ${response.data.data.type}`);
                        console.log(`   ID: ${result.id}`);
                        console.log(`   Name: ${result.name || result.product_name}`);
                        console.log(`   Code: ${result.code || result.sku_code}`);
                        if (result.productCount) {
                            console.log(`   Product Count: ${result.productCount}`);
                        }
                        console.log(`   Next Step: ${result.nextStep}`);
                    });
                } else {
                    console.log('❌ Still no results found');
                    console.log('📊 Full Response:', JSON.stringify(response.data, null, 2));
                }
            }

        } catch (error) {
            console.log('❌ Error in SKU search test:', error.response?.data?.message || error.message);
        }

        // Test with a few more SKUs to make sure the fix works broadly
        const testSKUs = ['TOPF1000002', 'TOPOIL129', 'TOPTES001'];

        for (const sku of testSKUs) {
            console.log(`\n📝 Testing additional SKU: "${sku}"`);
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
                            limit: 5
                        }
                    }
                );

                console.log(`✅ SKU "${sku}" search successful`);
                console.log(`📊 Results: ${response.data.data.results.length}`);
                console.log(`📊 Type: ${response.data.data.type}`);

                if (response.data.data.results.length > 0) {
                    console.log(`✅ SUCCESS: Found results for SKU "${sku}"`);
                } else {
                    console.log(`⚠️  No results for SKU "${sku}"`);
                }

            } catch (error) {
                console.log(`❌ Error testing SKU "${sku}":`, error.response?.data?.message || error.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 SKU SEARCH FIX SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Fixed live_status filter to include correct values');
    console.log('✅ Added exact match for SKU and manufacturer part');
    console.log('✅ Added debugging logs for troubleshooting');
    console.log('✅ Enhanced search with both regex and exact matching');

    console.log('\n🔧 Changes Made:');
    console.log('1. Updated live_status filter: ["Live", "Approved", "Created", "Pending"]');
    console.log('2. Added exact SKU matching: { sku_code: query }');
    console.log('3. Added exact manufacturer part matching: { manufacturer_part_name: query }');
    console.log('4. Added debugging logs to track search process');

    console.log('\n📝 Expected Behavior:');
    console.log('- SKU "TOPTES001" should now return results if product exists');
    console.log('- Both regex and exact matching should work');
    console.log('- Products with live_status "Live", "Approved", "Created", or "Pending" should be found');
    console.log('- Debug logs will show search process in console');

    console.log('\n✅ The SKU search fix is ready for testing!');
}

// Run the test
testSKUSearchFix();
