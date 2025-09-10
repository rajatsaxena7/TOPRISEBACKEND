const axios = require('axios');

// Test script to verify the updated dealer endpoint with category population
async function testDealerCategoryPopulation() {
    const baseURL = 'http://localhost:5001'; // User service URL
    const productServiceURL = 'http://localhost:5002'; // Product service URL

    // You'll need to replace these with actual values from your system
    const testDealerId = 'YOUR_DEALER_ID_HERE'; // Replace with actual dealer ID
    const authToken = 'YOUR_AUTH_TOKEN_HERE'; // Replace with valid auth token

    console.log('🧪 Testing Dealer Category Population...\n');

    try {
        // Test 1: Test the new product service endpoint for fetching categories by IDs
        console.log('1️⃣ Testing Product Service - Get Categories by IDs');
        const testCategoryIds = ['CATEGORY_ID_1', 'CATEGORY_ID_2']; // Replace with actual category IDs

        try {
            const categoryResponse = await axios.post(`${productServiceURL}/api/categories/bulk-by-ids`, {
                user_id: 'YOUR_USER_ID_HERE', // Replace with actual user ID
                ids: testCategoryIds
            });

            console.log('✅ Product Service Response:', {
                success: categoryResponse.data.success,
                message: categoryResponse.data.message,
                dataCount: categoryResponse.data.data?.length || 0,
                sampleData: categoryResponse.data.data?.[0] || 'No data'
            });
        } catch (error) {
            console.log('❌ Product Service Error:', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Test the updated dealer endpoint
        console.log('2️⃣ Testing User Service - Get Dealer by ID with Category Population');

        try {
            const dealerResponse = await axios.get(`${baseURL}/api/users/dealer/${testDealerId}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const dealer = dealerResponse.data.data;

            console.log('✅ Dealer Response:', {
                success: dealerResponse.data.success,
                dealerId: dealer.dealerId,
                legal_name: dealer.legal_name,
                categories_allowed: dealer.categories_allowed,
                assigned_categories: dealer.assigned_categories?.map(cat => ({
                    _id: cat._id,
                    category_name: cat.category_name,
                    category_code: cat.category_code
                })) || 'No assigned categories'
            });

            // Verify that assigned_categories field exists and has proper structure
            if (dealer.assigned_categories && Array.isArray(dealer.assigned_categories)) {
                console.log('\n✅ Category Population Verification:');
                dealer.assigned_categories.forEach((category, index) => {
                    console.log(`   ${index + 1}. ${category.category_name} (${category._id})`);
                });
            } else {
                console.log('\n⚠️  No assigned_categories field found or it\'s not an array');
            }

        } catch (error) {
            console.log('❌ Dealer Endpoint Error:', error.response?.data || error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Test with includeSLAInfo parameter
        console.log('3️⃣ Testing Dealer Endpoint with SLA Info');

        try {
            const dealerWithSLA = await axios.get(`${baseURL}/api/users/dealer/${testDealerId}?includeSLAInfo=true`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const dealer = dealerWithSLA.data.data;

            console.log('✅ Dealer with SLA Response:', {
                success: dealerWithSLA.data.success,
                hasSLAInfo: !!dealer.sla_summary,
                hasAssignedCategories: !!dealer.assigned_categories,
                assignedCategoriesCount: dealer.assigned_categories?.length || 0
            });

        } catch (error) {
            console.log('❌ Dealer with SLA Error:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    console.log('\n🏁 Test completed!');
    console.log('\n📝 Instructions:');
    console.log('1. Replace YOUR_DEALER_ID_HERE with an actual dealer ID from your database');
    console.log('2. Replace YOUR_AUTH_TOKEN_HERE with a valid authentication token');
    console.log('3. Replace CATEGORY_ID_1, CATEGORY_ID_2 with actual category IDs');
    console.log('4. Make sure both user-service and product-service are running');
    console.log('5. Run: node test-dealer-category-population.js');
}

// Run the test
testDealerCategoryPopulation();
