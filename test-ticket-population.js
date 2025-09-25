const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5003'; // Order service URL
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testTicketPopulation() {
    try {
        console.log('🎫 Testing Ticket Population with User and Order Details...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get all tickets with populated details
        console.log('📝 Test 1: Get all tickets with populated details...');
        try {
            const response = await axios.get(`${BASE_URL}/api/tickets/`, { headers });

            if (response.data.success) {
                console.log('✅ Tickets retrieved successfully with populated details');
                console.log(`📦 Found ${response.data.data.length} tickets`);

                if (response.data.data.length > 0) {
                    const ticket = response.data.data[0];
                    console.log(`\n🔍 Sample Ticket Details:`);
                    console.log(`   Ticket ID: ${ticket._id}`);
                    console.log(`   Description: ${ticket.description}`);
                    console.log(`   Status: ${ticket.status}`);
                    console.log(`   Type: ${ticket.ticketType}`);
                    console.log(`   User Ref: ${ticket.userRef}`);

                    // Check user details population
                    if (ticket.userDetails) {
                        console.log(`\n👥 User Details Found:`);
                        console.log(`   Total users referenced: ${Object.keys(ticket.userDetails).length}`);

                        // Show user details for userRef
                        if (ticket.userRefDetails) {
                            console.log(`\n👤 Ticket Creator Details:`);
                            console.log(`   Name: ${ticket.userRefDetails.first_name} ${ticket.userRefDetails.last_name}`);
                            console.log(`   Email: ${ticket.userRefDetails.email}`);
                            console.log(`   Role: ${ticket.userRefDetails.role}`);
                            console.log(`   Username: ${ticket.userRefDetails.username}`);
                            console.log(`   Phone: ${ticket.userRefDetails.phone}`);
                        }

                        // Show assigned user details
                        if (ticket.assignedToDetails) {
                            console.log(`\n👨‍💼 Assigned User Details:`);
                            console.log(`   Name: ${ticket.assignedToDetails.first_name} ${ticket.assignedToDetails.last_name}`);
                            console.log(`   Email: ${ticket.assignedToDetails.email}`);
                            console.log(`   Role: ${ticket.assignedToDetails.role}`);
                        }

                        // Show updated by user details
                        if (ticket.updatedByDetails) {
                            console.log(`\n✏️ Updated By User Details:`);
                            console.log(`   Name: ${ticket.updatedByDetails.first_name} ${ticket.updatedByDetails.last_name}`);
                            console.log(`   Email: ${ticket.updatedByDetails.email}`);
                            console.log(`   Role: ${ticket.updatedByDetails.role}`);
                        }

                        // Show remarks updated by user details
                        if (ticket.remarksUpdatedByDetails) {
                            console.log(`\n💬 Remarks Updated By User Details:`);
                            console.log(`   Name: ${ticket.remarksUpdatedByDetails.first_name} ${ticket.remarksUpdatedByDetails.last_name}`);
                            console.log(`   Email: ${ticket.remarksUpdatedByDetails.email}`);
                            console.log(`   Role: ${ticket.remarksUpdatedByDetails.role}`);
                        }

                        // Show involved users details
                        if (ticket.involvedUsersDetails && ticket.involvedUsersDetails.length > 0) {
                            console.log(`\n👥 Involved Users Details (${ticket.involvedUsersDetails.length} users):`);
                            ticket.involvedUsersDetails.forEach((user, index) => {
                                console.log(`   User ${index + 1}:`);
                                console.log(`   Name: ${user.first_name} ${user.last_name}`);
                                console.log(`   Email: ${user.email}`);
                                console.log(`   Role: ${user.role}`);
                            });
                        }
                    } else {
                        console.log('❌ No user details found in response');
                    }

                    // Check order details population
                    if (ticket.orderDetails) {
                        console.log(`\n📦 Order Details Found:`);
                        console.log(`   Order ID: ${ticket.orderDetails._id}`);
                        console.log(`   Order Number: ${ticket.orderDetails.order_number}`);
                        console.log(`   Status: ${ticket.orderDetails.status}`);
                        console.log(`   Total Amount: ${ticket.orderDetails.total_amount}`);
                        console.log(`   Order Date: ${ticket.orderDetails.order_date}`);
                        console.log(`   Payment Status: ${ticket.orderDetails.payment_status}`);

                        if (ticket.orderDetails.delivery_address) {
                            console.log(`   Delivery Address: ${JSON.stringify(ticket.orderDetails.delivery_address)}`);
                        }

                        if (ticket.orderDetails.items && ticket.orderDetails.items.length > 0) {
                            console.log(`   Items (${ticket.orderDetails.items.length}):`);
                            ticket.orderDetails.items.slice(0, 3).forEach((item, index) => {
                                console.log(`     Item ${index + 1}: ${item.product_name || item.name} - Qty: ${item.quantity}`);
                            });
                        }
                    } else if (ticket.order_id) {
                        console.log('❌ Order details not found despite having order_id');
                    } else {
                        console.log('📝 No order details (General ticket)');
                    }
                }
            } else {
                console.log('❌ Failed to retrieve tickets:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving tickets:', error.response?.data || error.message);
        }

        // Test 2: Get ticket by ID with populated details
        console.log('\n📝 Test 2: Get ticket by ID with populated details...');
        try {
            // First get a ticket ID from the previous request
            const ticketsResponse = await axios.get(`${BASE_URL}/api/tickets/`, { headers });
            if (ticketsResponse.data.success && ticketsResponse.data.data.length > 0) {
                const ticketId = ticketsResponse.data.data[0]._id;

                const response = await axios.get(`${BASE_URL}/api/tickets/byId/${ticketId}`, { headers });

                if (response.data.success) {
                    console.log('✅ Ticket retrieved by ID successfully with populated details');
                    const ticket = response.data.data;
                    console.log(`🎫 Ticket ID: ${ticket._id}`);
                    console.log(`📝 Description: ${ticket.description}`);

                    if (ticket.userRefDetails) {
                        console.log(`👤 Creator: ${ticket.userRefDetails.first_name} ${ticket.userRefDetails.last_name} (${ticket.userRefDetails.role})`);
                    }

                    if (ticket.orderDetails) {
                        console.log(`📦 Order: ${ticket.orderDetails.order_number} - ${ticket.orderDetails.status}`);
                    }
                } else {
                    console.log('❌ Failed to retrieve ticket by ID:', response.data.message);
                }
            } else {
                console.log('❌ No tickets available for testing ticket by ID');
            }
        } catch (error) {
            console.log('❌ Error retrieving ticket by ID:', error.response?.data || error.message);
        }

        // Test 3: Get tickets by user reference with populated details
        console.log('\n📝 Test 3: Get tickets by user reference with populated details...');
        try {
            // First get a userRef from the previous request
            const ticketsResponse = await axios.get(`${BASE_URL}/api/tickets/`, { headers });
            if (ticketsResponse.data.success && ticketsResponse.data.data.length > 0) {
                const userRef = ticketsResponse.data.data[0].userRef;

                const response = await axios.get(`${BASE_URL}/api/tickets/byUser/${userRef}`, { headers });

                if (response.data.success) {
                    console.log('✅ Tickets retrieved by user reference successfully with populated details');
                    console.log(`📦 Found ${response.data.data.length} tickets for user ${userRef}`);

                    if (response.data.data.length > 0) {
                        const ticket = response.data.data[0];
                        console.log(`🎫 Sample Ticket: ${ticket._id}`);
                        console.log(`📝 Description: ${ticket.description}`);

                        if (ticket.userRefDetails) {
                            console.log(`👤 User: ${ticket.userRefDetails.first_name} ${ticket.userRefDetails.last_name}`);
                        }

                        if (ticket.orderDetails) {
                            console.log(`📦 Order: ${ticket.orderDetails.order_number}`);
                        }
                    }
                } else {
                    console.log('❌ Failed to retrieve tickets by user reference:', response.data.message);
                }
            } else {
                console.log('❌ No tickets available for testing tickets by user reference');
            }
        } catch (error) {
            console.log('❌ Error retrieving tickets by user reference:', error.response?.data || error.message);
        }

        // Test 4: Test with filters
        console.log('\n📝 Test 4: Get tickets with filters and populated details...');
        try {
            const response = await axios.get(`${BASE_URL}/api/tickets/?status=Open&ticketType=General`, { headers });

            if (response.data.success) {
                console.log('✅ Filtered tickets retrieved successfully with populated details');
                console.log(`📦 Found ${response.data.data.length} open general tickets`);

                if (response.data.data.length > 0) {
                    const ticket = response.data.data[0];
                    console.log(`🎫 Sample Ticket: ${ticket._id}`);
                    console.log(`📝 Description: ${ticket.description}`);
                    console.log(`📊 Status: ${ticket.status}`);
                    console.log(`🏷️ Type: ${ticket.ticketType}`);

                    if (ticket.userRefDetails) {
                        console.log(`👤 Creator: ${ticket.userRefDetails.first_name} ${ticket.userRefDetails.last_name}`);
                    }
                }
            } else {
                console.log('❌ Failed to retrieve filtered tickets:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving filtered tickets:', error.response?.data || error.message);
        }

        // Test 5: Test error handling
        console.log('\n📝 Test 5: Test error handling...');
        try {
            const response = await axios.get(`${BASE_URL}/api/tickets/byId/invalid-ticket-id`, { headers });
            console.log('❌ Should have failed but succeeded:', response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('✅ Not found error handled correctly:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        console.log('\n🎉 Ticket population tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure the API endpoint is correct and the service is running');
        }

        if (error.response?.status === 500) {
            console.log('\n💡 Note: Check if the user service and order service are running and accessible');
        }
    }
}

// Instructions for running the test
console.log('🎫 Ticket Population Test Script');
console.log('=================================\n');
console.log('This script will test the enhanced ticket population functionality.');
console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your order service is running');
console.log('4. Make sure your user service is running and accessible');
console.log('5. Ensure you have some tickets in your database for testing\n');

// Uncomment the line below to run the test
// testTicketPopulation();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-ticket-population.js');

console.log('\n📋 API Endpoints Tested:');
console.log('GET /api/tickets/ - Get all tickets with populated details');
console.log('GET /api/tickets/byId/:ticketId - Get ticket by ID with populated details');
console.log('GET /api/tickets/byUser/:userRef - Get tickets by user with populated details');
console.log('GET /api/tickets/?status=Open&ticketType=General - Get filtered tickets with populated details');

console.log('\n📊 Expected Response Structure:');
console.log('{');
console.log('  "success": true,');
console.log('  "data": [');
console.log('    {');
console.log('      "_id": "ticket_id",');
console.log('      "description": "Ticket description",');
console.log('      "status": "Open",');
console.log('      "ticketType": "General",');
console.log('      "userRef": "user_id",');
console.log('      "userRefDetails": {');
console.log('        "_id": "user_id",');
console.log('        "first_name": "John",');
console.log('        "last_name": "Doe",');
console.log('        "email": "john@example.com",');
console.log('        "role": "User"');
console.log('      },');
console.log('      "userDetails": {');
console.log('        "user_id": { "first_name": "John", "last_name": "Doe", ... }');
console.log('      },');
console.log('      "orderDetails": {');
console.log('        "_id": "order_id",');
console.log('        "order_number": "ORD123",');
console.log('        "status": "Processing",');
console.log('        "total_amount": 150.00');
console.log('      }');
console.log('    }');
console.log('  ]');
console.log('}');
