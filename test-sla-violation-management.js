const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5003'; // Order service URL
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testSLAViolationManagement() {
    try {
        console.log('🔧 Testing SLA Violation Management...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Create a manual SLA violation
        console.log('📝 Test 1: Creating a manual SLA violation...');
        const manualViolationData = {
            dealer_id: 'test-dealer-id',
            order_id: 'test-order-id',
            expected_fulfillment_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            actual_fulfillment_time: new Date().toISOString(), // Now
            violation_minutes: 120, // 2 hours violation
            notes: 'Manual SLA violation for testing purposes',
            created_by: 'test-admin-user',
            contact_dealer: false
        };

        let violationId;
        try {
            const createResponse = await axios.post(`${BASE_URL}/api/orders/sla/violations/manual`, manualViolationData, { headers });

            if (createResponse.data.success) {
                violationId = createResponse.data.data._id;
                console.log('✅ Manual SLA violation created successfully');
                console.log(`📂 Violation ID: ${violationId}`);
                console.log(`📝 Violation Minutes: ${createResponse.data.data.violation_minutes}`);
                console.log(`📝 Dealer ID: ${createResponse.data.data.dealer_id}`);
                console.log(`📝 Order ID: ${createResponse.data.data.order_id}`);
            } else {
                console.log('❌ Failed to create manual SLA violation:', createResponse.data.message);
                return;
            }
        } catch (error) {
            console.log('❌ Error creating manual SLA violation:', error.response?.data || error.message);
            return;
        }

        // Test 2: Contact dealer about the violation
        console.log('\n📝 Test 2: Contacting dealer about SLA violation...');
        const contactData = {
            contact_method: 'notification',
            custom_message: 'Please address this SLA violation immediately'
        };

        try {
            const contactResponse = await axios.post(`${BASE_URL}/api/orders/sla/violations/${violationId}/contact-dealer`, contactData, { headers });

            if (contactResponse.data.success) {
                console.log('✅ Dealer contacted successfully');
                console.log(`📝 Contact Method: ${contactResponse.data.data.contactResult.method}`);
                console.log(`📝 Contact Success: ${contactResponse.data.data.contactResult.success}`);
                console.log(`📝 Message: ${contactResponse.data.data.contactResult.message}`);
            } else {
                console.log('❌ Failed to contact dealer:', contactResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error contacting dealer:', error.response?.data || error.message);
        }

        // Test 3: Get SLA violations with contact info
        console.log('\n📝 Test 3: Getting SLA violations with contact info...');
        try {
            const violationsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/with-contact-info`, { headers });

            if (violationsResponse.data.success) {
                console.log('✅ SLA violations with contact info fetched successfully');
                console.log(`📝 Total Violations: ${violationsResponse.data.data.length}`);

                const violations = violationsResponse.data.data;
                if (violations.length > 0) {
                    const firstViolation = violations[0];
                    console.log(`📝 First Violation ID: ${firstViolation._id}`);
                    console.log(`📝 Contact History Length: ${firstViolation.contactHistory?.length || 0}`);
                    console.log(`📝 Last Contacted: ${firstViolation.lastContacted || 'Never'}`);
                }
            } else {
                console.log('❌ Failed to get SLA violations:', violationsResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error getting SLA violations:', error.response?.data || error.message);
        }

        // Test 4: Bulk contact dealers
        console.log('\n📝 Test 4: Bulk contacting dealers...');
        const bulkContactData = {
            violationIds: [violationId],
            contact_method: 'notification',
            custom_message: 'Bulk contact test message'
        };

        try {
            const bulkContactResponse = await axios.post(`${BASE_URL}/api/orders/sla/violations/bulk-contact`, bulkContactData, { headers });

            if (bulkContactResponse.data.success) {
                console.log('✅ Bulk dealer contact completed');
                console.log(`📝 Total Violations: ${bulkContactResponse.data.data.totalViolations}`);
                console.log(`📝 Success Count: ${bulkContactResponse.data.data.successCount}`);
                console.log(`📝 Failure Count: ${bulkContactResponse.data.data.failureCount}`);
            } else {
                console.log('❌ Failed to bulk contact dealers:', bulkContactResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error in bulk contact:', error.response?.data || error.message);
        }

        // Test 5: Get dealer violation summary
        console.log('\n📝 Test 5: Getting dealer violation summary...');
        try {
            const summaryResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/dealer/test-dealer-id/summary`, { headers });

            if (summaryResponse.data.success) {
                console.log('✅ Dealer violation summary fetched successfully');
                const summary = summaryResponse.data.data;
                console.log(`📝 Total Violations: ${summary.statistics.totalViolations}`);
                console.log(`📝 Resolved Violations: ${summary.statistics.resolvedViolations}`);
                console.log(`📝 Unresolved Violations: ${summary.statistics.unresolvedViolations}`);
                console.log(`📝 Average Violation Minutes: ${summary.statistics.averageViolationMinutes}`);
                console.log(`📝 Resolution Rate: ${summary.statistics.resolutionRate}%`);
            } else {
                console.log('❌ Failed to get dealer summary:', summaryResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error getting dealer summary:', error.response?.data || error.message);
        }

        // Test 6: Resolve SLA violation
        console.log('\n📝 Test 6: Resolving SLA violation...');
        const resolveData = {
            resolution_notes: 'Violation resolved after dealer contact',
            resolved_by: 'test-admin-user'
        };

        try {
            const resolveResponse = await axios.put(`${BASE_URL}/api/orders/sla/violations/${violationId}/resolve`, resolveData, { headers });

            if (resolveResponse.data.success) {
                console.log('✅ SLA violation resolved successfully');
                console.log(`📝 Resolved: ${resolveResponse.data.data.resolved}`);
                console.log(`📝 Resolved At: ${resolveResponse.data.data.resolved_at}`);
                console.log(`📝 Resolution Notes: ${resolveResponse.data.data.resolution_notes}`);
            } else {
                console.log('❌ Failed to resolve SLA violation:', resolveResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error resolving SLA violation:', error.response?.data || error.message);
        }

        // Test 7: Test with invalid data
        console.log('\n📝 Test 7: Testing with invalid data...');
        const invalidData = {
            dealer_id: 'invalid-dealer-id',
            order_id: 'invalid-order-id',
            expected_fulfillment_time: 'invalid-date',
            actual_fulfillment_time: 'invalid-date'
        };

        try {
            const invalidResponse = await axios.post(`${BASE_URL}/api/orders/sla/violations/manual`, invalidData, { headers });

            if (invalidResponse.data.success) {
                console.log('❌ Unexpected success with invalid data');
            } else {
                console.log('✅ Correctly rejected invalid data');
                console.log(`📝 Error Message: ${invalidResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected invalid data with 400 error');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with invalid data:', error.response?.data || error.message);
            }
        }

        // Test 8: Test with missing required fields
        console.log('\n📝 Test 8: Testing with missing required fields...');
        const missingFieldsData = {
            dealer_id: 'test-dealer-id'
            // Missing order_id, expected_fulfillment_time, actual_fulfillment_time
        };

        try {
            const missingFieldsResponse = await axios.post(`${BASE_URL}/api/orders/sla/violations/manual`, missingFieldsData, { headers });

            if (missingFieldsResponse.data.success) {
                console.log('❌ Unexpected success with missing fields');
            } else {
                console.log('✅ Correctly rejected missing required fields');
                console.log(`📝 Error Message: ${missingFieldsResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected missing fields with 400 error');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with missing fields:', error.response?.data || error.message);
            }
        }

        console.log('\n🎉 SLA Violation Management tests completed!');

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
console.log('🔧 SLA Violation Management Test Script');
console.log('======================================\n');
console.log('This script will test the new SLA violation management functionality including:');
console.log('1. Manual SLA violation creation');
console.log('2. Dealer contact functionality');
console.log('3. Bulk dealer contact');
console.log('4. SLA violation resolution');
console.log('5. Dealer violation summaries');
console.log('6. Error handling with invalid data\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your order service is running');
console.log('4. Make sure your user service is running and accessible');
console.log('5. Ensure you have the required permissions for SLA management\n');

// Uncomment the line below to run the test
// testSLAViolationManagement();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-sla-violation-management.js');

console.log('\n📋 Test Scenarios:');
console.log('1. Create manual SLA violation');
console.log('2. Contact dealer about violation');
console.log('3. Get violations with contact info');
console.log('4. Bulk contact dealers');
console.log('5. Get dealer violation summary');
console.log('6. Resolve SLA violation');
console.log('7. Test with invalid data (should fail gracefully)');
console.log('8. Test with missing required fields (should fail gracefully)');

console.log('\n✅ Expected Behavior:');
console.log('- Manual SLA violations can be created with proper data');
console.log('- Dealers can be contacted about violations via notifications');
console.log('- Bulk contact operations work for multiple violations');
console.log('- Violations can be resolved with resolution notes');
console.log('- Dealer summaries provide comprehensive statistics');
console.log('- Invalid data is properly rejected with appropriate error messages');
console.log('- All operations include proper error handling and logging');

console.log('\n🔧 New API Endpoints:');
console.log('POST /api/orders/sla/violations/manual - Create manual SLA violation');
console.log('POST /api/orders/sla/violations/:violationId/contact-dealer - Contact dealer');
console.log('POST /api/orders/sla/violations/bulk-contact - Bulk contact dealers');
console.log('GET /api/orders/sla/violations/with-contact-info - Get violations with contact info');
console.log('PUT /api/orders/sla/violations/:violationId/resolve - Resolve violation');
console.log('GET /api/orders/sla/violations/dealer/:dealerId/summary - Get dealer summary');
