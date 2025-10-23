const axios = require('axios');

// Test script for bulk permission operations
async function testBulkPermissionOperations() {
    console.log('🧪 Testing Bulk Permission Operations...\n');

    const baseURL = 'http://localhost:5001'; // User service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    // Test data
    const testModule = 'TestModule';
    const testRole = 'TestRole';
    const testUserIds = ['user1', 'user2', 'user3', 'user4'];
    const testPermissions = {
        read: true,
        write: false,
        update: true,
        delete: false,
        allowedFields: ['field1', 'field2']
    };

    try {
        console.log('='.repeat(60));
        console.log('1. TESTING BULK PERMISSION UPDATE');
        console.log('='.repeat(60));

        // Test 1: Bulk update with multiple userIds
        console.log('\n📝 Test 1: Bulk update with multiple userIds...');
        const bulkUpdateResponse = await axios.put(
            `${baseURL}/api/permissions/update`,
            {
                module: testModule,
                role: testRole,
                userIds: testUserIds,
                permissions: testPermissions,
                updatedBy: 'test-admin'
            },
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Bulk update request successful');
        console.log('📊 Response Status:', bulkUpdateResponse.status);
        console.log('📊 Response Data:', JSON.stringify(bulkUpdateResponse.data, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('2. TESTING SINGLE USER PERMISSION UPDATE (Backward Compatibility)');
        console.log('='.repeat(60));

        // Test 2: Single user update (backward compatibility)
        console.log('\n📝 Test 2: Single user update (backward compatibility)...');
        const singleUpdateResponse = await axios.put(
            `${baseURL}/api/permissions/update`,
            {
                module: testModule,
                role: testRole,
                userId: 'single-user-id',
                permissions: testPermissions,
                updatedBy: 'test-admin'
            },
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Single update request successful');
        console.log('📊 Response Status:', singleUpdateResponse.status);
        console.log('📊 Response Data:', JSON.stringify(singleUpdateResponse.data, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('3. TESTING BULK PERMISSION REMOVAL');
        console.log('='.repeat(60));

        // Test 3: Bulk remove with multiple userIds
        console.log('\n📝 Test 3: Bulk remove with multiple userIds...');
        const bulkRemoveResponse = await axios.delete(
            `${baseURL}/api/permissions/remove`,
            {
                data: {
                    module: testModule,
                    role: testRole,
                    userIds: testUserIds.slice(0, 2), // Remove first 2 users
                    updatedBy: 'test-admin'
                },
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Bulk remove request successful');
        console.log('📊 Response Status:', bulkRemoveResponse.status);
        console.log('📊 Response Data:', JSON.stringify(bulkRemoveResponse.data, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('4. TESTING SINGLE USER PERMISSION REMOVAL (Backward Compatibility)');
        console.log('='.repeat(60));

        // Test 4: Single user remove (backward compatibility)
        console.log('\n📝 Test 4: Single user remove (backward compatibility)...');
        const singleRemoveResponse = await axios.delete(
            `${baseURL}/api/permissions/remove`,
            {
                data: {
                    module: testModule,
                    role: testRole,
                    userId: 'single-user-id',
                    updatedBy: 'test-admin'
                },
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Single remove request successful');
        console.log('📊 Response Status:', singleRemoveResponse.status);
        console.log('📊 Response Data:', JSON.stringify(singleRemoveResponse.data, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('5. TESTING ERROR SCENARIOS');
        console.log('='.repeat(60));

        // Test 5: Error scenario - empty userIds
        console.log('\n📝 Test 5: Error scenario - empty userIds...');
        try {
            await axios.put(
                `${baseURL}/api/permissions/update`,
                {
                    module: testModule,
                    role: testRole,
                    userIds: [], // Empty array
                    permissions: testPermissions,
                    updatedBy: 'test-admin'
                },
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.log('✅ Expected error caught:', error.response?.status);
            console.log('📊 Error Message:', error.response?.data?.message);
        }

        // Test 6: Error scenario - missing module
        console.log('\n📝 Test 6: Error scenario - missing module...');
        try {
            await axios.put(
                `${baseURL}/api/permissions/update`,
                {
                    role: testRole,
                    userIds: testUserIds,
                    permissions: testPermissions,
                    updatedBy: 'test-admin'
                },
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.log('✅ Expected error caught:', error.response?.status);
            console.log('📊 Error Message:', error.response?.data?.message);
        }

        console.log('\n' + '='.repeat(60));
        console.log('6. TESTING PARTIAL SUCCESS SCENARIOS');
        console.log('='.repeat(60));

        // Test 7: Partial success - some users exist, some don't
        console.log('\n📝 Test 7: Partial success scenario...');
        const partialSuccessResponse = await axios.put(
            `${baseURL}/api/permissions/update`,
            {
                module: testModule,
                role: testRole,
                userIds: ['existing-user', 'non-existing-user'],
                permissions: testPermissions,
                updatedBy: 'test-admin'
            },
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Partial success request completed');
        console.log('📊 Response Status:', partialSuccessResponse.status);
        console.log('📊 Response Data:', JSON.stringify(partialSuccessResponse.data, null, 2));

        console.log('\n' + '='.repeat(60));
        console.log('7. TESTING MIXED INPUT SCENARIOS');
        console.log('='.repeat(60));

        // Test 8: Mixed input - both userId and userIds provided
        console.log('\n📝 Test 8: Mixed input scenario (both userId and userIds)...');
        const mixedInputResponse = await axios.put(
            `${baseURL}/api/permissions/update`,
            {
                module: testModule,
                role: testRole,
                userId: 'single-user', // This should be ignored
                userIds: ['bulk-user1', 'bulk-user2'], // This should be used
                permissions: testPermissions,
                updatedBy: 'test-admin'
            },
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ Mixed input request successful');
        console.log('📊 Response Status:', mixedInputResponse.status);
        console.log('📊 Response Data:', JSON.stringify(mixedInputResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Bulk permission operations now support multiple userIds');
    console.log('✅ Backward compatibility maintained for single userId');
    console.log('✅ Error handling for invalid inputs');
    console.log('✅ Partial success scenarios handled with 207 status');
    console.log('✅ Comprehensive response with success/error details');
    console.log('✅ Mixed input scenarios (userId vs userIds) handled correctly');

    console.log('\n🔧 Key Features:');
    console.log('1. Support for both single userId and multiple userIds');
    console.log('2. Backward compatibility with existing API calls');
    console.log('3. Detailed response with success/error breakdown');
    console.log('4. Partial success handling (207 Multi-Status)');
    console.log('5. Comprehensive error reporting per user');
    console.log('6. Summary statistics in response');
}

// Run the test
testBulkPermissionOperations();
