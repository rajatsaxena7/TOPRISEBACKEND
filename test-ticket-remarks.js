const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5003'; // Order service URL
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testTicketRemarks() {
    try {
        console.log('🎫 Testing Ticket Remarks Functionality...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Create a test ticket first
        console.log('📝 Test 1: Creating a test ticket...');
        const createTicketData = {
            userRef: 'test-user-123',
            description: 'Test ticket for remarks functionality',
            ticketType: 'General'
        };

        let ticketId;
        try {
            const createResponse = await axios.post(`${BASE_URL}/api/tickets/`, createTicketData, { headers });
            if (createResponse.data.success) {
                ticketId = createResponse.data.data._id;
                console.log('✅ Test ticket created successfully');
                console.log(`🎫 Ticket ID: ${ticketId}`);
                console.log(`📝 Description: ${createResponse.data.data.description}`);
                console.log(`📊 Status: ${createResponse.data.data.status}`);
                console.log(`💬 Initial Remarks: "${createResponse.data.data.remarks || 'No remarks'}"`);
            } else {
                console.log('❌ Failed to create test ticket:', createResponse.data.message);
                return;
            }
        } catch (error) {
            console.log('❌ Error creating test ticket:', error.response?.data || error.message);
            return;
        }

        // Test 2: Update ticket remarks
        console.log('\n📝 Test 2: Updating ticket remarks...');
        const updateRemarksData = {
            remarks: 'This is a test remark for the ticket. The issue has been identified and is being worked on.',
            updated_by: 'admin-user-456'
        };

        try {
            const updateResponse = await axios.patch(
                `${BASE_URL}/api/tickets/updateRemarks/${ticketId}`,
                updateRemarksData,
                { headers }
            );

            if (updateResponse.data.success) {
                console.log('✅ Ticket remarks updated successfully');
                console.log(`💬 New Remarks: "${updateResponse.data.data.remarks}"`);
                console.log(`👤 Updated By: ${updateResponse.data.data.remarks_updated_by}`);
                console.log(`📅 Updated At: ${updateResponse.data.data.remarks_updated_at}`);
            } else {
                console.log('❌ Failed to update remarks:', updateResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error updating remarks:', error.response?.data || error.message);
        }

        // Test 3: Update remarks again (to test multiple updates)
        console.log('\n📝 Test 3: Updating remarks again...');
        const secondUpdateData = {
            remarks: 'Updated remark: Issue has been resolved. Customer has been notified.',
            updated_by: 'support-user-789'
        };

        try {
            const secondUpdateResponse = await axios.patch(
                `${BASE_URL}/api/tickets/updateRemarks/${ticketId}`,
                secondUpdateData,
                { headers }
            );

            if (secondUpdateResponse.data.success) {
                console.log('✅ Second remarks update successful');
                console.log(`💬 Updated Remarks: "${secondUpdateResponse.data.data.remarks}"`);
                console.log(`👤 Updated By: ${secondUpdateResponse.data.data.remarks_updated_by}`);
                console.log(`📅 Updated At: ${secondUpdateResponse.data.data.remarks_updated_at}`);
            } else {
                console.log('❌ Failed to update remarks second time:', secondUpdateResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error updating remarks second time:', error.response?.data || error.message);
        }

        // Test 4: Clear remarks (set to empty string)
        console.log('\n📝 Test 4: Clearing remarks...');
        const clearRemarksData = {
            remarks: '',
            updated_by: 'admin-user-456'
        };

        try {
            const clearResponse = await axios.patch(
                `${BASE_URL}/api/tickets/updateRemarks/${ticketId}`,
                clearRemarksData,
                { headers }
            );

            if (clearResponse.data.success) {
                console.log('✅ Remarks cleared successfully');
                console.log(`💬 Cleared Remarks: "${clearResponse.data.data.remarks}"`);
                console.log(`👤 Updated By: ${clearResponse.data.data.remarks_updated_by}`);
                console.log(`📅 Updated At: ${clearResponse.data.data.remarks_updated_at}`);
            } else {
                console.log('❌ Failed to clear remarks:', clearResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error clearing remarks:', error.response?.data || error.message);
        }

        // Test 5: Get ticket details to verify remarks
        console.log('\n📝 Test 5: Retrieving ticket details...');
        try {
            const getResponse = await axios.get(`${BASE_URL}/api/tickets/byId/${ticketId}`, { headers });

            if (getResponse.data.success) {
                const ticket = getResponse.data.data;
                console.log('✅ Ticket details retrieved successfully');
                console.log(`🎫 Ticket ID: ${ticket._id}`);
                console.log(`📝 Description: ${ticket.description}`);
                console.log(`📊 Status: ${ticket.status}`);
                console.log(`💬 Current Remarks: "${ticket.remarks || 'No remarks'}"`);
                console.log(`👤 Remarks Updated By: ${ticket.remarks_updated_by || 'Not set'}`);
                console.log(`📅 Remarks Updated At: ${ticket.remarks_updated_at || 'Not set'}`);
                console.log(`📅 Created At: ${ticket.createdAt}`);
                console.log(`📅 Updated At: ${ticket.updatedAt}`);
            } else {
                console.log('❌ Failed to retrieve ticket details:', getResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving ticket details:', error.response?.data || error.message);
        }

        // Test 6: Test validation errors
        console.log('\n📝 Test 6: Testing validation errors...');

        // Test without remarks field
        try {
            const invalidData1 = {
                updated_by: 'admin-user-456'
                // Missing remarks field
            };

            const invalidResponse1 = await axios.patch(
                `${BASE_URL}/api/tickets/updateRemarks/${ticketId}`,
                invalidData1,
                { headers }
            );

            console.log('❌ Should have failed but succeeded:', invalidResponse1.data);
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validation error caught (missing remarks):', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Test without updated_by field
        try {
            const invalidData2 = {
                remarks: 'Test remark'
                // Missing updated_by field
            };

            const invalidResponse2 = await axios.patch(
                `${BASE_URL}/api/tickets/updateRemarks/${ticketId}`,
                invalidData2,
                { headers }
            );

            console.log('❌ Should have failed but succeeded:', invalidResponse2.data);
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validation error caught (missing updated_by):', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Test 7: Test with invalid ticket ID
        console.log('\n📝 Test 7: Testing with invalid ticket ID...');
        try {
            const invalidTicketId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
            const invalidData = {
                remarks: 'Test remark for invalid ticket',
                updated_by: 'admin-user-456'
            };

            const invalidResponse = await axios.patch(
                `${BASE_URL}/api/tickets/updateRemarks/${invalidTicketId}`,
                invalidData,
                { headers }
            );

            console.log('❌ Should have failed but succeeded:', invalidResponse.data);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Not found error caught (invalid ticket ID):', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        console.log('\n🎉 Ticket remarks functionality tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure the API endpoint is correct and the service is running');
        }
    }
}

// Instructions for running the test
console.log('🎫 Ticket Remarks Test Script');
console.log('============================\n');
console.log('This script will test the new ticket remarks functionality.');
console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your order service is running');
console.log('4. Ensure you have the required permissions to create and update tickets\n');

// Uncomment the line below to run the test
// testTicketRemarks();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-ticket-remarks.js');

console.log('\n📋 API Endpoints Tested:');
console.log('POST /api/tickets/ - Create ticket');
console.log('PATCH /api/tickets/updateRemarks/:ticketId - Update ticket remarks');
console.log('GET /api/tickets/byId/:ticketId - Get ticket details');

console.log('\n📊 Expected Request Format:');
console.log('PATCH /api/tickets/updateRemarks/:ticketId');
console.log('Content-Type: application/json');
console.log('Authorization: Bearer <token>');
console.log('{');
console.log('  "remarks": "Your remarks here",');
console.log('  "updated_by": "user_id_who_updated"');
console.log('}');

console.log('\n📊 Expected Response Format:');
console.log('{');
console.log('  "success": true,');
console.log('  "message": "Ticket remarks updated successfully",');
console.log('  "data": {');
console.log('    "_id": "ticket_id",');
console.log('    "remarks": "Updated remarks",');
console.log('    "remarks_updated_by": "user_id",');
console.log('    "remarks_updated_at": "2024-01-15T10:30:00Z",');
console.log('    "description": "Ticket description",');
console.log('    "status": "Open",');
console.log('    "ticketType": "General"');
console.log('  }');
console.log('}');
