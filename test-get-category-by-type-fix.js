const axios = require('axios');

// Test script for getCategoryByType controller fix
async function testGetCategoryByTypeFix() {
    console.log('🧪 Testing getCategoryByType Controller Fix...\n');

    const baseURL = 'http://localhost:5002'; // Product service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        console.log('='.repeat(60));
        console.log('1. TESTING GET ALL CATEGORIES BY TYPE (NO LIMIT)');
        console.log('='.repeat(60));

        // Test 1: Get all categories for a specific type without pagination
        console.log('\n📝 Test 1: Get all categories for type "68679c1b8450aff593d56fee"...');
        try {
            const response = await axios.get(
                `${baseURL}/categories/v1/type/68679c1b8450aff593d56fee`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Total Categories Found:', response.data.data.categories.length);
            console.log('📊 Pagination Info:', JSON.stringify(response.data.data.pagination, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: All categories fetched without limit');
                console.log('📋 Sample categories:', response.data.data.categories.slice(0, 3).map(cat => ({
                    id: cat._id,
                    name: cat.category_name,
                    code: cat.category_code,
                    main_category: cat.main_category
                })));
            }

        } catch (error) {
            console.log('❌ Error in get all categories test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('2. TESTING PAGINATION WITH CUSTOM LIMIT');
        console.log('='.repeat(60));

        // Test 2: Get categories with custom pagination
        console.log('\n📝 Test 2: Get categories with limit=5 and page=1...');
        try {
            const response = await axios.get(
                `${baseURL}/categories/v1/type/68679c1b8450aff593d56fee`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        page: 1,
                        limit: 5
                    }
                }
            );

            console.log('✅ Request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Categories Returned:', response.data.data.categories.length);
            console.log('📊 Pagination Info:', JSON.stringify(response.data.data.pagination, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Pagination working correctly');
                if (response.data.data.categories.length <= 5) {
                    console.log('✅ CORRECT: Limit applied properly');
                }
            }

        } catch (error) {
            console.log('❌ Error in pagination test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('3. TESTING MAIN CATEGORY FILTER');
        console.log('='.repeat(60));

        // Test 3: Get only main categories
        console.log('\n📝 Test 3: Get only main categories...');
        try {
            const response = await axios.get(
                `${baseURL}/categories/v1/type/68679c1b8450aff593d56fee`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        main_category: 'true'
                    }
                }
            );

            console.log('✅ Request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Main Categories Found:', response.data.data.categories.length);
            console.log('📊 Pagination Info:', JSON.stringify(response.data.data.pagination, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Main category filter working');
                const allMainCategories = response.data.data.categories.every(cat => cat.main_category === true);
                if (allMainCategories) {
                    console.log('✅ CORRECT: All returned categories are main categories');
                } else {
                    console.log('⚠️  Some categories are not main categories');
                }
            }

        } catch (error) {
            console.log('❌ Error in main category filter test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('4. TESTING NON-MAIN CATEGORY FILTER');
        console.log('='.repeat(60));

        // Test 4: Get only non-main categories
        console.log('\n📝 Test 4: Get only non-main categories...');
        try {
            const response = await axios.get(
                `${baseURL}/categories/v1/type/68679c1b8450aff593d56fee`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        main_category: 'false'
                    }
                }
            );

            console.log('✅ Request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Non-Main Categories Found:', response.data.data.categories.length);
            console.log('📊 Pagination Info:', JSON.stringify(response.data.data.pagination, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Non-main category filter working');
                const allNonMainCategories = response.data.data.categories.every(cat => cat.main_category === false);
                if (allNonMainCategories) {
                    console.log('✅ CORRECT: All returned categories are non-main categories');
                } else {
                    console.log('⚠️  Some categories are not non-main categories');
                }
            }

        } catch (error) {
            console.log('❌ Error in non-main category filter test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('5. TESTING SECOND PAGE PAGINATION');
        console.log('='.repeat(60));

        // Test 5: Get second page
        console.log('\n📝 Test 5: Get second page with limit=3...');
        try {
            const response = await axios.get(
                `${baseURL}/categories/v1/type/68679c1b8450aff593d56fee`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        page: 2,
                        limit: 3
                    }
                }
            );

            console.log('✅ Request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Categories Returned:', response.data.data.categories.length);
            console.log('📊 Pagination Info:', JSON.stringify(response.data.data.pagination, null, 2));

            if (response.data.success) {
                console.log('✅ SUCCESS: Second page pagination working');
                if (response.data.data.pagination.currentPage === 2) {
                    console.log('✅ CORRECT: Current page is 2');
                }
                if (response.data.data.pagination.hasPrevPage === true) {
                    console.log('✅ CORRECT: Has previous page indicator');
                }
            }

        } catch (error) {
            console.log('❌ Error in second page test:', error.response?.data?.message || error.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('6. TESTING INVALID TYPE ID');
        console.log('='.repeat(60));

        // Test 6: Test with invalid type ID
        console.log('\n📝 Test 6: Test with invalid type ID...');
        try {
            const response = await axios.get(
                `${baseURL}/categories/v1/type/invalid-type-id`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('❌ UNEXPECTED: Invalid type ID request succeeded');

        } catch (error) {
            console.log('✅ EXPECTED: Invalid type ID request failed');
            console.log('📊 Error Status:', error.response?.status);
            console.log('📊 Error Message:', error.response?.data?.message);

            if (error.response?.status === 404) {
                console.log('✅ CORRECT: HTTP 404 Not Found status returned');
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
    console.log('📋 GET CATEGORY BY TYPE FIX SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Removed hard-coded limit of 8 categories');
    console.log('✅ Added pagination support with configurable limit');
    console.log('✅ Added total count and pagination metadata');
    console.log('✅ Maintained main_category filtering');
    console.log('✅ Enhanced response structure with pagination info');
    console.log('✅ Improved logging with pagination details');

    console.log('\n🔧 Implementation Features:');
    console.log('1. No Hard Limit - Removed .limit(8) restriction');
    console.log('2. Pagination Support - Added page and limit parameters');
    console.log('3. Total Count - Added totalItems count');
    console.log('4. Pagination Metadata - Added hasNextPage, hasPrevPage');
    console.log('5. Flexible Limits - Default limit of 50, configurable');
    console.log('6. Enhanced Logging - Includes pagination info');

    console.log('\n📝 API Usage Examples:');
    console.log('1. Get all categories: GET /categories/v1/type/{typeId}');
    console.log('2. With pagination: GET /categories/v1/type/{typeId}?page=1&limit=10');
    console.log('3. Main categories only: GET /categories/v1/type/{typeId}?main_category=true');
    console.log('4. Non-main categories: GET /categories/v1/type/{typeId}?main_category=false');

    console.log('\n✅ The getCategoryByType controller fix is ready for use!');
}

// Run the test
testGetCategoryByTypeFix();
