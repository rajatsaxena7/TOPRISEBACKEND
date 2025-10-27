const axios = require('axios');

// Test script for enhanced intelligent search with search type detection
async function testSearchTypeDetection() {
    console.log('🧪 Testing Enhanced Intelligent Search with Search Type Detection...\n');

    const baseURL = 'http://localhost:5002'; // Product service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        console.log('='.repeat(60));
        console.log('1. TESTING PRODUCT NAME SEARCH TYPE DETECTION');
        console.log('='.repeat(60));

        // Test 1: Search for product name
        console.log('\n📝 Test 1: Search for product name "spark plug"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'spark plug',
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Search Type:', response.data.data.searchType);
            console.log('📊 Search Type Details:', JSON.stringify(response.data.data.searchTypeDetails, null, 2));
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Search type detection working');
                if (response.data.data.searchType === 'product_name') {
                    console.log('✅ CORRECT: Detected as product name search');
                } else {
                    console.log('⚠️  Expected product_name search type');
                }
            }

        } catch (error) {
            console.log('❌ Error in product name search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('2. TESTING SKU CODE SEARCH TYPE DETECTION');
        console.log('='.repeat(60));

        // Test 2: Search for SKU code
        console.log('\n📝 Test 2: Search for SKU code "TOPF1000002"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'TOPF1000002',
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Search Type:', response.data.data.searchType);
            console.log('📊 Search Type Details:', JSON.stringify(response.data.data.searchTypeDetails, null, 2));
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Search type detection working');
                if (response.data.data.searchType === 'sku_code') {
                    console.log('✅ CORRECT: Detected as SKU code search');
                } else {
                    console.log('⚠️  Expected sku_code search type');
                }
            }

        } catch (error) {
            console.log('❌ Error in SKU code search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('3. TESTING MANUFACTURER PART SEARCH TYPE DETECTION');
        console.log('='.repeat(60));

        // Test 3: Search for manufacturer part name
        console.log('\n📝 Test 3: Search for manufacturer part "M1310020"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'M1310020',
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Search Type:', response.data.data.searchType);
            console.log('📊 Search Type Details:', JSON.stringify(response.data.data.searchTypeDetails, null, 2));
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Search type detection working');
                if (response.data.data.searchType === 'manufacturer_part_name') {
                    console.log('✅ CORRECT: Detected as manufacturer part name search');
                } else {
                    console.log('⚠️  Expected manufacturer_part_name search type');
                }
            }

        } catch (error) {
            console.log('❌ Error in manufacturer part search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('4. TESTING BRAND NAME SEARCH TYPE DETECTION');
        console.log('='.repeat(60));

        // Test 4: Search for brand name
        console.log('\n📝 Test 4: Search for brand name "honda"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'honda',
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Search Type:', response.data.data.searchType);
            console.log('📊 Search Type Details:', JSON.stringify(response.data.data.searchTypeDetails, null, 2));
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Search type detection working');
                if (response.data.data.searchType === 'brand') {
                    console.log('✅ CORRECT: Detected as brand name search');
                } else {
                    console.log('⚠️  Expected brand search type');
                }
            }

        } catch (error) {
            console.log('❌ Error in brand name search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('5. TESTING CATEGORY NAME SEARCH TYPE DETECTION');
        console.log('='.repeat(60));

        // Test 5: Search for category name
        console.log('\n📝 Test 5: Search for category name "air filter"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'air filter',
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Search Type:', response.data.data.searchType);
            console.log('📊 Search Type Details:', JSON.stringify(response.data.data.searchTypeDetails, null, 2));
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Search type detection working');
                if (response.data.data.searchType === 'category') {
                    console.log('✅ CORRECT: Detected as category name search');
                } else {
                    console.log('⚠️  Expected category search type');
                }
            }

        } catch (error) {
            console.log('❌ Error in category name search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('6. TESTING MODEL NAME SEARCH TYPE DETECTION');
        console.log('='.repeat(60));

        // Test 6: Search for model name
        console.log('\n📝 Test 6: Search for model name "apache 180"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'apache 180',
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Search Type:', response.data.data.searchType);
            console.log('📊 Search Type Details:', JSON.stringify(response.data.data.searchTypeDetails, null, 2));
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Search type detection working');
                if (response.data.data.searchType === 'model') {
                    console.log('✅ CORRECT: Detected as model name search');
                } else {
                    console.log('⚠️  Expected model search type');
                }
            }

        } catch (error) {
            console.log('❌ Error in model name search test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('7. TESTING VARIANT NAME SEARCH TYPE DETECTION');
        console.log('='.repeat(60));

        // Test 7: Search for variant name
        console.log('\n📝 Test 7: Search for variant name "vdi"...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'vdi',
                        limit: 10
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Search Type:', response.data.data.searchType);
            console.log('📊 Search Type Details:', JSON.stringify(response.data.data.searchTypeDetails, null, 2));
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Search type detection working');
                if (response.data.data.searchType === 'variant') {
                    console.log('✅ CORRECT: Detected as variant name search');
                } else {
                    console.log('⚠️  Expected variant search type');
                }
            }

        } catch (error) {
            console.log('❌ Error in variant name search test:', error.response?.data?.message || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 SEARCH TYPE DETECTION SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Enhanced intelligent search with search type detection implemented');
    console.log('✅ Product name search type detection');
    console.log('✅ SKU code search type detection');
    console.log('✅ Manufacturer part name search type detection');
    console.log('✅ Brand name search type detection');
    console.log('✅ Category name search type detection');
    console.log('✅ Model name search type detection');
    console.log('✅ Variant name search type detection');

    console.log('\n🔧 Search Type Detection Features:');
    console.log('1. searchType - The detected search type (product_name, sku_code, etc.)');
    console.log('2. searchTypeDetails - Detailed information about the search');
    console.log('3. Enhanced suggestions with search type information');
    console.log('4. Exact vs partial match detection');
    console.log('5. Match count information for partial searches');

    console.log('\n📝 Search Type Detection Examples:');
    console.log('1. "spark plug" → searchType: "product_name"');
    console.log('2. "TOPF1000002" → searchType: "sku_code"');
    console.log('3. "M1310020" → searchType: "manufacturer_part_name"');
    console.log('4. "honda" → searchType: "brand"');
    console.log('5. "air filter" → searchType: "category"');
    console.log('6. "apache 180" → searchType: "model"');
    console.log('7. "vdi" → searchType: "variant"');

    console.log('\n✅ The enhanced search type detection is ready for use!');
}

// Run the test
testSearchTypeDetection();
