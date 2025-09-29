const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5003'; // Order service URL
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

async function testSLAViolationEnhanced() {
    try {
        console.log('🔧 Testing Enhanced SLA Violation Controller...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get SLA violations with populated data
        console.log('📝 Test 1: Getting SLA violations with populated data...');
        try {
            const violationsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?limit=10&page=1`, { headers });

            if (violationsResponse.data.success) {
                console.log('✅ SLA violations with populated data fetched successfully');
                console.log(`📝 Total Violations: ${violationsResponse.data.data.pagination.totalCount}`);
                console.log(`📝 Current Page: ${violationsResponse.data.data.pagination.currentPage}`);
                console.log(`📝 Total Pages: ${violationsResponse.data.data.pagination.totalPages}`);

                const violations = violationsResponse.data.data.violations;
                if (violations.length > 0) {
                    const firstViolation = violations[0];
                    console.log(`📝 First Violation ID: ${firstViolation._id}`);
                    console.log(`📝 Dealer Details: ${firstViolation.dealerDetails ? 'Available' : 'Not Available'}`);
                    console.log(`📝 Order Details: ${firstViolation.orderDetails ? 'Available' : 'Not Available'}`);
                    console.log(`📝 Violation Priority: ${firstViolation.priority}`);
                    console.log(`📝 Violation Status: ${firstViolation.status}`);
                    console.log(`📝 Contact Count: ${firstViolation.contactCount}`);
                }
            } else {
                console.log('❌ Failed to get SLA violations:', violationsResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error getting SLA violations:', error.response?.data || error.message);
        }

        // Test 2: Get SLA violations with filters
        console.log('\n📝 Test 2: Getting SLA violations with filters...');
        try {
            const filteredResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?resolved=false&priority=High&limit=5`, { headers });

            if (filteredResponse.data.success) {
                console.log('✅ Filtered SLA violations fetched successfully');
                console.log(`📝 Filtered Violations Count: ${filteredResponse.data.data.violations.length}`);

                const violations = filteredResponse.data.data.violations;
                if (violations.length > 0) {
                    violations.forEach((violation, index) => {
                        console.log(`📝 Violation ${index + 1}: ID=${violation._id}, Priority=${violation.priority}, Status=${violation.status}`);
                    });
                }
            } else {
                console.log('❌ Failed to get filtered SLA violations:', filteredResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error getting filtered SLA violations:', error.response?.data || error.message);
        }

        // Test 3: Get single SLA violation by ID
        console.log('\n📝 Test 3: Getting single SLA violation by ID...');
        try {
            // First get a violation ID from the previous request
            const violationsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?limit=1`, { headers });

            if (violationsResponse.data.success && violationsResponse.data.data.violations.length > 0) {
                const violationId = violationsResponse.data.data.violations[0]._id;

                const singleViolationResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced/${violationId}`, { headers });

                if (singleViolationResponse.data.success) {
                    console.log('✅ Single SLA violation fetched successfully');
                    const violation = singleViolationResponse.data.data;
                    console.log(`📝 Violation ID: ${violation._id}`);
                    console.log(`📝 Dealer Name: ${violation.dealerDetails?.dealer_name || 'N/A'}`);
                    console.log(`📝 Order Number: ${violation.orderDetails?.order_number || 'N/A'}`);
                    console.log(`📝 Violation Minutes: ${violation.violation_minutes}`);
                    console.log(`📝 Violation Hours: ${violation.violation_hours}`);
                    console.log(`📝 Priority: ${violation.priority}`);
                    console.log(`📝 Status: ${violation.status}`);
                    console.log(`📝 Contact Count: ${violation.contactCount}`);
                    console.log(`📝 Last Contacted: ${violation.lastContacted || 'Never'}`);
                } else {
                    console.log('❌ Failed to get single SLA violation:', singleViolationResponse.data.message);
                }
            } else {
                console.log('❌ No violations found to test single violation retrieval');
            }
        } catch (error) {
            console.log('❌ Error getting single SLA violation:', error.response?.data || error.message);
        }

        // Test 4: Get SLA violations by dealer
        console.log('\n📝 Test 4: Getting SLA violations by dealer...');
        try {
            // First get a dealer ID from the previous request
            const violationsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?limit=1`, { headers });

            if (violationsResponse.data.success && violationsResponse.data.data.violations.length > 0) {
                const dealerId = violationsResponse.data.data.violations[0].dealer_id;

                const dealerViolationsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced/dealer/${dealerId}?limit=5`, { headers });

                if (dealerViolationsResponse.data.success) {
                    console.log('✅ SLA violations by dealer fetched successfully');
                    const response = dealerViolationsResponse.data.data;
                    console.log(`📝 Dealer Name: ${response.dealerDetails?.dealer_name || 'N/A'}`);
                    console.log(`📝 Total Violations: ${response.statistics.totalViolations}`);
                    console.log(`📝 Resolved Violations: ${response.statistics.resolvedViolations}`);
                    console.log(`📝 Unresolved Violations: ${response.statistics.unresolvedViolations}`);
                    console.log(`📝 Average Violation Minutes: ${response.statistics.averageViolationMinutes}`);
                    console.log(`📝 Resolution Rate: ${response.statistics.resolutionRate}%`);
                    console.log(`📝 Violations Count: ${response.violations.length}`);
                } else {
                    console.log('❌ Failed to get SLA violations by dealer:', dealerViolationsResponse.data.message);
                }
            } else {
                console.log('❌ No violations found to test dealer violations retrieval');
            }
        } catch (error) {
            console.log('❌ Error getting SLA violations by dealer:', error.response?.data || error.message);
        }

        // Test 5: Get SLA violations by order
        console.log('\n📝 Test 5: Getting SLA violations by order...');
        try {
            // First get an order ID from the previous request
            const violationsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?limit=1`, { headers });

            if (violationsResponse.data.success && violationsResponse.data.data.violations.length > 0) {
                const orderId = violationsResponse.data.data.violations[0].order_id;

                const orderViolationsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced/order/${orderId}`, { headers });

                if (orderViolationsResponse.data.success) {
                    console.log('✅ SLA violations by order fetched successfully');
                    const response = orderViolationsResponse.data.data;
                    console.log(`📝 Order Number: ${response.orderDetails?.order_number || 'N/A'}`);
                    console.log(`📝 Order Status: ${response.orderDetails?.status || 'N/A'}`);
                    console.log(`📝 Total Violations: ${response.totalViolations}`);
                    console.log(`📝 Resolved Violations: ${response.resolvedViolations}`);
                    console.log(`📝 Unresolved Violations: ${response.unresolvedViolations}`);
                } else {
                    console.log('❌ Failed to get SLA violations by order:', orderViolationsResponse.data.message);
                }
            } else {
                console.log('❌ No violations found to test order violations retrieval');
            }
        } catch (error) {
            console.log('❌ Error getting SLA violations by order:', error.response?.data || error.message);
        }

        // Test 6: Get SLA violation analytics
        console.log('\n📝 Test 6: Getting SLA violation analytics...');
        try {
            const analyticsResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced/analytics`, { headers });

            if (analyticsResponse.data.success) {
                console.log('✅ SLA violation analytics fetched successfully');
                const analytics = analyticsResponse.data.data;
                console.log(`📝 Total Violations: ${analytics.summary.totalViolations}`);
                console.log(`📝 Resolved Violations: ${analytics.summary.resolvedViolations}`);
                console.log(`📝 Unresolved Violations: ${analytics.summary.unresolvedViolations}`);
                console.log(`📝 Average Violation Minutes: ${analytics.summary.averageViolationMinutes}`);
                console.log(`📝 Max Violation Minutes: ${analytics.summary.maxViolationMinutes}`);
                console.log(`📝 Resolution Rate: ${analytics.summary.resolutionRate}%`);
                console.log(`📝 High Priority Violations: ${analytics.byPriority.high}`);
                console.log(`📝 Medium Priority Violations: ${analytics.byPriority.medium}`);
                console.log(`📝 Low Priority Violations: ${analytics.byPriority.low}`);
                console.log(`📝 Top Violating Dealers: ${analytics.topViolatingDealers.length}`);
                console.log(`📝 Recent Violations: ${analytics.recentViolations.length}`);
            } else {
                console.log('❌ Failed to get SLA violation analytics:', analyticsResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error getting SLA violation analytics:', error.response?.data || error.message);
        }

        // Test 7: Search SLA violations
        console.log('\n📝 Test 7: Searching SLA violations...');
        try {
            const searchResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced/search?query=test&limit=5`, { headers });

            if (searchResponse.data.success) {
                console.log('✅ SLA violation search completed successfully');
                console.log(`📝 Search Query: ${searchResponse.data.data.searchQuery}`);
                console.log(`📝 Search Results: ${searchResponse.data.data.violations.length}`);
                console.log(`📝 Total Count: ${searchResponse.data.data.pagination.totalCount}`);
            } else {
                console.log('❌ Failed to search SLA violations:', searchResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error searching SLA violations:', error.response?.data || error.message);
        }

        // Test 8: Test with date filters
        console.log('\n📝 Test 8: Testing with date filters...');
        try {
            const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
            const endDate = new Date().toISOString(); // Now

            const dateFilterResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?startDate=${startDate}&endDate=${endDate}&limit=5`, { headers });

            if (dateFilterResponse.data.success) {
                console.log('✅ SLA violations with date filters fetched successfully');
                console.log(`📝 Date Range: ${startDate} to ${endDate}`);
                console.log(`📝 Filtered Violations: ${dateFilterResponse.data.data.violations.length}`);
                console.log(`📝 Total Count: ${dateFilterResponse.data.data.pagination.totalCount}`);
            } else {
                console.log('❌ Failed to get SLA violations with date filters:', dateFilterResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error getting SLA violations with date filters:', error.response?.data || error.message);
        }

        // Test 9: Test pagination
        console.log('\n📝 Test 9: Testing pagination...');
        try {
            const page1Response = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?limit=3&page=1`, { headers });

            if (page1Response.data.success) {
                console.log('✅ Page 1 fetched successfully');
                console.log(`📝 Page 1 Violations: ${page1Response.data.data.violations.length}`);
                console.log(`📝 Has Next Page: ${page1Response.data.data.pagination.hasNextPage}`);
                console.log(`📝 Has Prev Page: ${page1Response.data.data.pagination.hasPrevPage}`);

                if (page1Response.data.data.pagination.hasNextPage) {
                    const page2Response = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?limit=3&page=2`, { headers });

                    if (page2Response.data.success) {
                        console.log('✅ Page 2 fetched successfully');
                        console.log(`📝 Page 2 Violations: ${page2Response.data.data.violations.length}`);
                    } else {
                        console.log('❌ Failed to get page 2:', page2Response.data.message);
                    }
                }
            } else {
                console.log('❌ Failed to get page 1:', page1Response.data.message);
            }
        } catch (error) {
            console.log('❌ Error testing pagination:', error.response?.data || error.message);
        }

        // Test 10: Test sorting
        console.log('\n📝 Test 10: Testing sorting...');
        try {
            const sortResponse = await axios.get(`${BASE_URL}/api/orders/sla/violations/enhanced?sortBy=violation_minutes&sortOrder=desc&limit=5`, { headers });

            if (sortResponse.data.success) {
                console.log('✅ SLA violations with sorting fetched successfully');
                console.log(`📝 Sort By: violation_minutes`);
                console.log(`📝 Sort Order: desc`);
                console.log(`📝 Sorted Violations: ${sortResponse.data.data.violations.length}`);

                const violations = sortResponse.data.data.violations;
                if (violations.length > 1) {
                    console.log(`📝 First Violation Minutes: ${violations[0].violation_minutes}`);
                    console.log(`📝 Second Violation Minutes: ${violations[1].violation_minutes}`);
                    console.log(`📝 Sort Working: ${violations[0].violation_minutes >= violations[1].violation_minutes ? 'Yes' : 'No'}`);
                }
            } else {
                console.log('❌ Failed to get sorted SLA violations:', sortResponse.data.message);
            }
        } catch (error) {
            console.log('❌ Error testing sorting:', error.response?.data || error.message);
        }

        console.log('\n🎉 Enhanced SLA Violation Controller tests completed!');

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
console.log('🔧 Enhanced SLA Violation Controller Test Script');
console.log('================================================\n');
console.log('This script will test the enhanced SLA violation controller with populated data including:');
console.log('1. SLA violations with comprehensive dealer and order details');
console.log('2. Filtering and pagination capabilities');
console.log('3. Single violation retrieval with populated data');
console.log('4. Dealer-specific violation retrieval with statistics');
console.log('5. Order-specific violation retrieval');
console.log('6. Analytics and reporting capabilities');
console.log('7. Search functionality');
console.log('8. Date filtering');
console.log('9. Pagination testing');
console.log('10. Sorting capabilities\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your order service is running');
console.log('4. Make sure your user service is running and accessible');
console.log('5. Ensure you have the required permissions for SLA management');
console.log('6. Make sure there are some SLA violations in the database for testing\n');

// Uncomment the line below to run the test
// testSLAViolationEnhanced();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-sla-violation-enhanced.js');

console.log('\n📋 Test Scenarios:');
console.log('1. Get SLA violations with populated data (dealer + order details)');
console.log('2. Filter violations by status, priority, etc.');
console.log('3. Get single violation with comprehensive data');
console.log('4. Get violations by dealer with statistics');
console.log('5. Get violations by order');
console.log('6. Get analytics and reporting data');
console.log('7. Search violations by text');
console.log('8. Filter by date range');
console.log('9. Test pagination functionality');
console.log('10. Test sorting capabilities');

console.log('\n✅ Expected Behavior:');
console.log('- All violations should include comprehensive dealer details');
console.log('- All violations should include comprehensive order details');
console.log('- Filtering should work correctly for all supported fields');
console.log('- Pagination should work with proper metadata');
console.log('- Sorting should work for all supported fields');
console.log('- Analytics should provide comprehensive statistics');
console.log('- Search should work with text queries');
console.log('- Date filtering should work correctly');
console.log('- All responses should include proper error handling');

console.log('\n🔧 New Enhanced API Endpoints:');
console.log('GET /api/orders/sla/violations/enhanced - Get violations with populated data');
console.log('GET /api/orders/sla/violations/enhanced/:violationId - Get single violation with populated data');
console.log('GET /api/orders/sla/violations/enhanced/dealer/:dealerId - Get dealer violations with statistics');
console.log('GET /api/orders/sla/violations/enhanced/order/:orderId - Get order violations');
console.log('GET /api/orders/sla/violations/enhanced/analytics - Get comprehensive analytics');
console.log('GET /api/orders/sla/violations/enhanced/search - Search violations');

console.log('\n📊 Enhanced Data Includes:');
console.log('- Dealer Details: name, code, contact info, address, status, etc.');
console.log('- Order Details: number, status, amount, customer info, timestamps, etc.');
console.log('- Calculated Fields: violation hours, priority, status, contact count, etc.');
console.log('- Statistics: resolution rates, averages, trends, etc.');
console.log('- Pagination: current page, total pages, has next/prev, etc.');
console.log('- Filtering: by dealer, order, date, status, priority, etc.');
console.log('- Sorting: by any field in ascending or descending order');
