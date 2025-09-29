const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Product service URL
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testCategoryErrorFix() {
    try {
        console.log('🔧 Testing Category Error Fix...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Create a category to test
        console.log('📝 Test 1: Creating a test category...');
        const createData = {
            category_name: 'Test Category for Error Fix',
            category_code: 'TEST_ERROR_FIX',
            category_description: 'Test category to verify error handling',
            category_Status: 'Active',
            created_by: 'test-user-id',
            updated_by: 'test-user-id',
            type: 'test-type-id'
        };

        let categoryId;
        try {
            const createResponse = await axios.post(`${BASE_URL}/api/category/`, createData, { headers });
            if (createResponse.data.success) {
                categoryId = createResponse.data.data._id;
                console.log('✅ Test category created successfully');
                console.log(`📂 Category ID: ${categoryId}`);
                console.log(`📝 Category Name: ${createResponse.data.data.category_name}`);
            } else {
                console.log('❌ Failed to create test category:', createResponse.data.message);
                return;
            }
        } catch (error) {
            console.log('❌ Error creating test category:', error.response?.data || error.message);
            return;
        }

        // Test 2: Update category with invalid updated_by user ID
        console.log('\n📝 Test 2: Updating category with invalid user ID...');
        const updateData = {
            category_name: 'Updated Test Category',
            category_code: 'UPDATED_TEST_ERROR_FIX',
            category_description: 'Updated test category description',
            category_Status: 'Active',
            updated_by: 'invalid-user-id-that-does-not-exist',
            type: 'test-type-id'
        };

        try {
            const updateResponse = await axios.put(`${BASE_URL}/api/category/${categoryId}`, updateData, { headers });

            if (updateResponse.data.success) {
                console.log('✅ Category updated successfully despite invalid user ID');
                console.log(`📝 Updated Category Name: ${updateResponse.data.data.category_name}`);
                console.log(`📝 Updated Category Code: ${updateResponse.data.data.category_code}`);
                console.log(`📝 Updated Category Description: ${updateResponse.data.data.category_description}`);
            } else {
                console.log('❌ Failed to update category:', updateResponse.data.message);
            }
        } catch (error) {
            if (error.response?.status === 500) {
                console.log('❌ Server error occurred:', error.response.data.message);
                if (error.response.data.message.includes('Cannot read properties of undefined')) {
                    console.log('❌ The original error is still present - fix not working');
                } else {
                    console.log('✅ Different error occurred - original fix may be working');
                }
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Test 3: Update category with valid user ID
        console.log('\n📝 Test 3: Updating category with valid user ID...');
        const validUpdateData = {
            category_name: 'Updated Test Category with Valid User',
            category_code: 'VALID_UPDATE_TEST',
            category_description: 'Updated with valid user ID',
            category_Status: 'Active',
            updated_by: 'valid-user-id',
            type: 'test-type-id'
        };

        try {
            const validUpdateResponse = await axios.put(`${BASE_URL}/api/category/${categoryId}`, validUpdateData, { headers });

            if (validUpdateResponse.data.success) {
                console.log('✅ Category updated successfully with valid user ID');
                console.log(`📝 Updated Category Name: ${validUpdateResponse.data.data.category_name}`);
                console.log(`📝 Updated Category Code: ${validUpdateResponse.data.data.category_code}`);
            } else {
                console.log('❌ Failed to update category with valid user:', validUpdateResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error updating category with valid user:', error.response?.data || error.message);
        }

        // Test 4: Update category with empty updated_by
        console.log('\n📝 Test 4: Updating category with empty updated_by...');
        const emptyUserUpdateData = {
            category_name: 'Updated Test Category with Empty User',
            category_code: 'EMPTY_USER_UPDATE_TEST',
            category_description: 'Updated with empty user ID',
            category_Status: 'Active',
            updated_by: '',
            type: 'test-type-id'
        };

        try {
            const emptyUserUpdateResponse = await axios.put(`${BASE_URL}/api/category/${categoryId}`, emptyUserUpdateData, { headers });

            if (emptyUserUpdateResponse.data.success) {
                console.log('✅ Category updated successfully with empty user ID');
                console.log(`📝 Updated Category Name: ${emptyUserUpdateResponse.data.data.category_name}`);
                console.log(`📝 Updated Category Code: ${emptyUserUpdateResponse.data.data.category_code}`);
            } else {
                console.log('❌ Failed to update category with empty user:', emptyUserUpdateResponse.data.message);
            }
        } catch (error) {
            if (error.response?.status === 500) {
                console.log('❌ Server error occurred with empty user:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Test 5: Update category with null updated_by
        console.log('\n📝 Test 5: Updating category with null updated_by...');
        const nullUserUpdateData = {
            category_name: 'Updated Test Category with Null User',
            category_code: 'NULL_USER_UPDATE_TEST',
            category_description: 'Updated with null user ID',
            category_Status: 'Active',
            updated_by: null,
            type: 'test-type-id'
        };

        try {
            const nullUserUpdateResponse = await axios.put(`${BASE_URL}/api/category/${categoryId}`, nullUserUpdateData, { headers });

            if (nullUserUpdateResponse.data.success) {
                console.log('✅ Category updated successfully with null user ID');
                console.log(`📝 Updated Category Name: ${nullUserUpdateResponse.data.data.category_name}`);
                console.log(`📝 Updated Category Code: ${nullUserUpdateResponse.data.data.category_code}`);
            } else {
                console.log('❌ Failed to update category with null user:', nullUserUpdateResponse.data.message);
            }
        } catch (error) {
            if (error.response?.status === 500) {
                console.log('❌ Server error occurred with null user:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Test 6: Test with missing updated_by field
        console.log('\n📝 Test 6: Updating category with missing updated_by field...');
        const missingUserUpdateData = {
            category_name: 'Updated Test Category with Missing User',
            category_code: 'MISSING_USER_UPDATE_TEST',
            category_description: 'Updated with missing user field',
            category_Status: 'Active',
            type: 'test-type-id'
            // updated_by field is missing
        };

        try {
            const missingUserUpdateResponse = await axios.put(`${BASE_URL}/api/category/${categoryId}`, missingUserUpdateData, { headers });

            if (missingUserUpdateResponse.data.success) {
                console.log('✅ Category updated successfully with missing user field');
                console.log(`📝 Updated Category Name: ${missingUserUpdateResponse.data.data.category_name}`);
                console.log(`📝 Updated Category Code: ${missingUserUpdateResponse.data.data.category_code}`);
            } else {
                console.log('❌ Failed to update category with missing user field:', missingUserUpdateResponse.data.message);
            }
        } catch (error) {
            if (error.response?.status === 500) {
                console.log('❌ Server error occurred with missing user field:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Clean up: Delete the test category
        console.log('\n📝 Cleanup: Deleting test category...');
        try {
            const deleteResponse = await axios.delete(`${BASE_URL}/api/category/${categoryId}`, { headers });

            if (deleteResponse.data.success) {
                console.log('✅ Test category deleted successfully');
            } else {
                console.log('❌ Failed to delete test category:', deleteResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error deleting test category:', error.response?.data || error.message);
        }

        console.log('\n🎉 Category error fix tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure the API endpoint is correct and the service is running');
        }

        if (error.response?.status === 500) {
            console.log('\n💡 Note: Check if the user service is running and accessible');
        }
    }
}

// Instructions for running the test
console.log('🔧 Category Error Fix Test Script');
console.log('==================================\n');
console.log('This script will test the fix for the "Cannot read properties of undefined (reading \'username\')" error.');
console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual product service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your product service is running');
console.log('4. Make sure your user service is running and accessible');
console.log('5. Ensure you have the required permissions to create, update, and delete categories\n');

// Uncomment the line below to run the test
// testCategoryErrorFix();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-category-error-fix.js');

console.log('\n📋 Test Scenarios:');
console.log('1. Create a test category');
console.log('2. Update category with invalid user ID (should not crash)');
console.log('3. Update category with valid user ID (should work normally)');
console.log('4. Update category with empty user ID (should not crash)');
console.log('5. Update category with null user ID (should not crash)');
console.log('6. Update category with missing user field (should not crash)');
console.log('7. Delete test category (cleanup)');

console.log('\n✅ Expected Behavior After Fix:');
console.log('- All update operations should succeed without 500 errors');
console.log('- Invalid/missing user IDs should be handled gracefully');
console.log('- Username should default to "Unknown" when user is not found');
console.log('- Notifications should still be sent when possible');
console.log('- Category updates should complete successfully regardless of user service issues');

console.log('\n❌ Original Error:');
console.log('PUT /api/category/6867b92c1245e10b7e854222 500 36.815 ms - 86');
console.log('ERROR: ❌ Update category error: Cannot read properties of undefined (reading \'username\')');
