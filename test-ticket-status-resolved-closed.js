const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Order service URL
const TEST_TOKEN = 'your_test_token_here'; // Replace with actual token
const TEST_TICKET_ID = 'your_ticket_id_here'; // Replace with actual ticket ID
const TEST_USER_ID = 'your_user_id_here'; // Replace with actual user ID

async function testTicketStatusUpdate() {
    try {
        console.log('🔧 Testing Ticket Status Update for Resolved and Closed...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Update to "Open"
        console.log('📝 Test 1: Update ticket to "Open"...');
        try {
            const response = await axios.patch(
                `${BASE_URL}/api/tickets/updateStatus/${TEST_TICKET_ID}`,
                {
                    status: 'Open',
                    updated_by: TEST_USER_ID,
                    admin_notes: 'Testing Open status'
                },
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully updated to Open');
                console.log(`   Status: ${response.data.data.status}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 2: Update to "In Progress"
        console.log('\n📝 Test 2: Update ticket to "In Progress"...');
        try {
            const response = await axios.patch(
                `${BASE_URL}/api/tickets/updateStatus/${TEST_TICKET_ID}`,
                {
                    status: 'In Progress',
                    updated_by: TEST_USER_ID,
                    admin_notes: 'Testing In Progress status'
                },
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully updated to In Progress');
                console.log(`   Status: ${response.data.data.status}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 3: Update to "Resolved" (This was failing before)
        console.log('\n📝 Test 3: Update ticket to "Resolved" (Previously failing)...');
        try {
            const response = await axios.patch(
                `${BASE_URL}/api/tickets/updateStatus/${TEST_TICKET_ID}`,
                {
                    status: 'Resolved',
                    updated_by: TEST_USER_ID,
                    admin_notes: 'Testing Resolved status'
                },
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully updated to Resolved');
                console.log(`   Status: ${response.data.data.status}`);
                console.log(`   Ticket ID: ${response.data.data._id}`);
                console.log(`   Updated by: ${response.data.data.updated_by}`);
                console.log(`   Admin notes: ${response.data.data.admin_notes}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
            console.log('   Error details:', error.response?.data);
        }

        // Wait a bit before next test
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 4: Update to "Closed" (This was failing before)
        console.log('\n📝 Test 4: Update ticket to "Closed" (Previously failing)...');
        try {
            const response = await axios.patch(
                `${BASE_URL}/api/tickets/updateStatus/${TEST_TICKET_ID}`,
                {
                    status: 'Closed',
                    updated_by: TEST_USER_ID,
                    admin_notes: 'Testing Closed status'
                },
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully updated to Closed');
                console.log(`   Status: ${response.data.data.status}`);
                console.log(`   Ticket ID: ${response.data.data._id}`);
                console.log(`   Updated by: ${response.data.data.updated_by}`);
                console.log(`   Admin notes: ${response.data.data.admin_notes}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
            console.log('   Error details:', error.response?.data);
        }

        // Test 5: Test all statuses in sequence
        console.log('\n📝 Test 5: Testing all status transitions...');
        const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

        for (const status of statuses) {
            try {
                const response = await axios.patch(
                    `${BASE_URL}/api/tickets/updateStatus/${TEST_TICKET_ID}`,
                    {
                        status: status,
                        updated_by: TEST_USER_ID,
                        admin_notes: `Testing ${status} status transition`
                    },
                    { headers }
                );

                if (response.data.success) {
                    console.log(`✅ ${status}: Success`);
                }
            } catch (error) {
                console.log(`❌ ${status}: Failed - ${error.response?.data?.message || error.message}`);
            }

            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Test 6: Verify final ticket state
        console.log('\n📝 Test 6: Verify final ticket state...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/tickets/byId/${TEST_TICKET_ID}`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Final ticket state retrieved');
                console.log(`   Status: ${response.data.data.status}`);
                console.log(`   Updated by: ${response.data.data.updated_by}`);
                console.log(`   Admin notes: ${response.data.data.admin_notes}`);
            }
        } catch (error) {
            console.log('❌ Failed to retrieve ticket:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 All tests completed!');
        console.log('\n📊 Summary:');
        console.log('If all tests passed, the issue is fixed:');
        console.log('✅ Open status - Should work');
        console.log('✅ In Progress status - Should work');
        console.log('✅ Resolved status - Should work (was failing before)');
        console.log('✅ Closed status - Should work (was failing before)');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure TEST_TICKET_ID is valid and the ticket exists');
        }
    }
}

// Instructions for running the test
console.log('🔧 Ticket Status Update Test Script');
console.log('===================================\n');
console.log('This script tests the ticket status update functionality,');
console.log('specifically for "Resolved" and "Closed" statuses that were failing.\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Update TEST_TICKET_ID with an actual ticket ID');
console.log('4. Update TEST_USER_ID with a valid user ID');
console.log('5. Make sure your order service is running\n');

// Uncomment the line below to run the test
// testTicketStatusUpdate();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-ticket-status-resolved-closed.js');

console.log('\n🔧 What was fixed:');
console.log('================');
console.log('Issue: Ticket status update was failing for "Resolved" and "Closed" statuses');
console.log('\nRoot cause:');
console.log('- When status was "Resolved" or "Closed", the code tried to call user service');
console.log('- If the user service call failed, it would throw an error');
console.log('- The error was not being caught properly');
console.log('- This prevented the ticket from being updated');
console.log('\nFix applied:');
console.log('- Added try-catch around user service call');
console.log('- Added proper error handling and logging');
console.log('- Made user service call non-blocking (won\'t fail ticket update)');
console.log('- Added timeout to prevent hanging');
console.log('- Added proper authorization headers');
console.log('- Wrapped notification call in try-catch as well');
console.log('\nExpected behavior after fix:');
console.log('✅ Ticket status updates even if user service call fails');
console.log('✅ Errors are logged but don\'t break the update');
console.log('✅ All four statuses (Open, In Progress, Resolved, Closed) work');
console.log('✅ User assignment removal is attempted but optional');
console.log('✅ Notifications are sent but won\'t break the update if they fail');
