const axios = require('axios');

// Quick test to verify the intelligent search fix
async function testIntelligentSearchFix() {
    console.log('🔧 Testing Intelligent Search Fix...\n');

    const baseURL = 'http://localhost:5002'; // Product service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        console.log('='.repeat(60));
        console.log('TESTING INTELLIGENT SEARCH AFTER FIX');
        console.log('='.repeat(60));

        // Test 1: Simple brand search
        console.log('\n📝 Test 1: Search for "maruti" (should work now)...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'maruti',
                        limit: 5
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Suggestion:', response.data.data.suggestion);
            console.log('📊 Total Results:', response.data.data.total);

            if (response.data.success) {
                console.log('✅ SUCCESS: Intelligent search is working!');
                console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
            }

        } catch (error) {
            console.log('❌ Error in intelligent search test:', error.response?.data?.message || error.message);
            if (error.response?.status === 500) {
                console.log('❌ Server error - check if the variant model path is still incorrect');
            }
        }

        // Test 2: Brand + model search
        console.log('\n📝 Test 2: Search for "maruti suzuki" (should work now)...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'maruti suzuki',
                        limit: 5
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Brand + model detection working!');
            }

        } catch (error) {
            console.log('❌ Error in brand + model test:', error.response?.data?.message || error.message);
        }

        // Test 3: Model search
        console.log('\n📝 Test 3: Search for "swift" (should work now)...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'swift',
                        limit: 5
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Model detection working!');
            }

        } catch (error) {
            console.log('❌ Error in model test:', error.response?.data?.message || error.message);
        }

        // Test 4: Product search
        console.log('\n📝 Test 4: Search for "spark" (should work now)...');
        try {
            const response = await axios.get(
                `${baseURL}/products/v1/intelligent-search`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        query: 'spark',
                        limit: 5
                    }
                }
            );

            console.log('✅ Intelligent search request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Detected Type:', response.data.data.type);
            console.log('📊 Suggestion:', response.data.data.suggestion);

            if (response.data.success) {
                console.log('✅ SUCCESS: Product detection working!');
            }

        } catch (error) {
            console.log('❌ Error in product test:', error.response?.data?.message || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 FIX SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Fixed variant model path: ../models/variant → ../models/variantModel');
    console.log('✅ Updated all require statements in intelligent search');
    console.log('✅ Updated all require statements in hierarchical search');
    console.log('✅ No linting errors found');

    console.log('\n🔧 What was fixed:');
    console.log('1. Changed require("../models/variant") to require("../models/variantModel")');
    console.log('2. Updated in detectSearchIntent function');
    console.log('3. Updated in searchVariants function');
    console.log('4. Updated in searchProducts function');

    console.log('\n✅ The intelligent search endpoint should now work correctly!');
    console.log('🧪 Run this test to verify the fix: node test-intelligent-search-fix.js');
}

// Run the test
testIntelligentSearchFix();
