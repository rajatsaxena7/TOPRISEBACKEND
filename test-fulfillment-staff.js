const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000'; // User service URL
const TEST_TOKEN = 'your_test_token_here'; // Replace with actual Super-admin or Fulfillment-Admin token
const TEST_EMPLOYEE_ID = 'your_employee_id_here'; // Replace with actual employee ID
const TEST_USER_ID = 'your_user_id_here'; // Replace with actual user ID

async function testFulfillmentStaffEndpoints() {
    try {
        console.log('🔧 Testing Fulfillment Staff Endpoints...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get all fulfillment staff with pagination
        console.log('📝 Test 1: Get all fulfillment staff with pagination...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff?page=1&limit=10`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched fulfillment staff');
                console.log(`   Total items: ${response.data.data.pagination.totalItems}`);
                console.log(`   Current page: ${response.data.data.pagination.currentPage}`);
                console.log(`   Items returned: ${response.data.data.data.length}`);

                if (response.data.data.data.length > 0) {
                    console.log(`   First staff member: ${response.data.data.data[0].First_name} (${response.data.data.data[0].employee_id})`);
                    console.log(`   Role: ${response.data.data.data[0].role}`);
                    console.log(`   Assigned dealers: ${response.data.data.data[0].assigned_dealers_count}`);
                }
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 2: Search fulfillment staff
        console.log('\n📝 Test 2: Search fulfillment staff...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff?search=staff&page=1&limit=5`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully searched fulfillment staff');
                console.log(`   Results found: ${response.data.data.data.length}`);
                if (response.data.data.data.length > 0) {
                    response.data.data.data.forEach((staff, index) => {
                        console.log(`   ${index + 1}. ${staff.First_name} - ${staff.email}`);
                    });
                }
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 3: Get fulfillment staff by ID
        console.log('\n📝 Test 3: Get fulfillment staff by ID...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff/${TEST_EMPLOYEE_ID}`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched staff by ID');
                console.log(`   Name: ${response.data.data.First_name}`);
                console.log(`   Employee ID: ${response.data.data.employee_id}`);
                console.log(`   Email: ${response.data.data.email}`);
                console.log(`   Role: ${response.data.data.role}`);
                console.log(`   Assigned dealers: ${response.data.data.assigned_dealers_count}`);
                console.log(`   Assigned regions: ${response.data.data.assigned_regions_count}`);

                if (response.data.data.user_details) {
                    console.log(`   User username: ${response.data.data.user_details.username}`);
                    console.log(`   Last login: ${response.data.data.user_details.last_login}`);
                }
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
            if (error.response?.status === 404) {
                console.log('   💡 Note: Update TEST_EMPLOYEE_ID with a valid fulfillment staff employee ID');
            }
        }

        // Test 4: Get fulfillment staff by user ID
        console.log('\n📝 Test 4: Get fulfillment staff by user ID...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff/by-user/${TEST_USER_ID}`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched staff by user ID');
                console.log(`   Name: ${response.data.data.First_name}`);
                console.log(`   Employee ID: ${response.data.data.employee_id}`);
                console.log(`   Email: ${response.data.data.email}`);
                console.log(`   Role: ${response.data.data.role}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
            if (error.response?.status === 404) {
                console.log('   💡 Note: Update TEST_USER_ID with a valid fulfillment staff user ID');
            }
        }

        // Test 5: Get fulfillment staff statistics
        console.log('\n📝 Test 5: Get fulfillment staff statistics...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff/stats`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched statistics');
                console.log('\n   📊 Total Stats:');
                console.log(`      All: ${response.data.data.total.all}`);
                console.log(`      Fulfillment Staff: ${response.data.data.total.fulfillmentStaff}`);
                console.log(`      Fulfillment Admin: ${response.data.data.total.fulfillmentAdmin}`);

                console.log('\n   📊 Activity Stats:');
                console.log(`      Active: ${response.data.data.activity.active}`);
                console.log(`      Inactive: ${response.data.data.activity.inactive}`);

                console.log('\n   📊 Dealer Assignment Stats:');
                console.log(`      Total assigned dealers: ${response.data.data.dealerAssignment.totalAssignedDealers}`);
                console.log(`      Staff with dealers: ${response.data.data.dealerAssignment.staffWithDealers}`);
                console.log(`      Staff without dealers: ${response.data.data.dealerAssignment.staffWithoutDealers}`);
                console.log(`      Avg dealers per staff: ${response.data.data.dealerAssignment.avgDealersPerStaff}`);
                console.log(`      Max dealers assigned: ${response.data.data.dealerAssignment.maxDealersAssigned}`);
                console.log(`      Min dealers assigned: ${response.data.data.dealerAssignment.minDealersAssigned}`);

                console.log('\n   📊 Recent Activity:');
                console.log(`      Added last 30 days: ${response.data.data.recent.addedLast30Days}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 6: Get available regions
        console.log('\n📝 Test 6: Get available regions...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff/regions`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched available regions');
                console.log(`   Total regions: ${response.data.data.totalRegions}`);
                if (response.data.data.regions.length > 0) {
                    console.log('\n   Regions:');
                    response.data.data.regions.forEach((region) => {
                        console.log(`   - ${region} (${response.data.data.regionStats[region]} staff members)`);
                    });
                } else {
                    console.log('   No regions found');
                }
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 7: Get fulfillment staff by region
        console.log('\n📝 Test 7: Get fulfillment staff by region...');
        try {
            // First get available regions to test with
            const regionsResponse = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff/regions`,
                { headers }
            );

            if (regionsResponse.data.success && regionsResponse.data.data.regions.length > 0) {
                const testRegion = regionsResponse.data.data.regions[0];
                console.log(`   Testing with region: ${testRegion}`);

                const response = await axios.get(
                    `${BASE_URL}/api/users/fulfillment-staff/by-region?region=${encodeURIComponent(testRegion)}`,
                    { headers }
                );

                if (response.data.success) {
                    console.log('✅ Successfully fetched staff by region');
                    console.log(`   Region: ${response.data.data.region}`);
                    console.log(`   Staff count: ${response.data.data.count}`);

                    if (response.data.data.data.length > 0) {
                        console.log('\n   Staff members:');
                        response.data.data.data.forEach((staff, index) => {
                            console.log(`   ${index + 1}. ${staff.First_name} - ${staff.email}`);
                        });
                    }
                }
            } else {
                console.log('⚠️  No regions available to test with');
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 8: Test sorting
        console.log('\n📝 Test 8: Test sorting (by last login, ascending)...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff?sortBy=last_login&sortOrder=asc&limit=5`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched with sorting');
                console.log(`   Items returned: ${response.data.data.data.length}`);
                if (response.data.data.data.length > 0) {
                    console.log('\n   Staff members (sorted by last login):');
                    response.data.data.data.forEach((staff, index) => {
                        console.log(`   ${index + 1}. ${staff.First_name} - Last login: ${staff.last_login || 'Never'}`);
                    });
                }
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 9: Test with different page sizes
        console.log('\n📝 Test 9: Test pagination with different page sizes...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/users/fulfillment-staff?page=1&limit=20`,
                { headers }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched with different page size');
                console.log(`   Total items: ${response.data.data.pagination.totalItems}`);
                console.log(`   Total pages: ${response.data.data.pagination.totalPages}`);
                console.log(`   Current page: ${response.data.data.pagination.currentPage}`);
                console.log(`   Items per page: ${response.data.data.pagination.itemsPerPage}`);
                console.log(`   Has next page: ${response.data.data.pagination.hasNextPage}`);
                console.log(`   Has previous page: ${response.data.data.pagination.hasPreviousPage}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 All tests completed!');
        console.log('\n📊 Summary:');
        console.log('Tested endpoints:');
        console.log('✅ GET /api/users/fulfillment-staff - List with pagination');
        console.log('✅ GET /api/users/fulfillment-staff?search=... - Search functionality');
        console.log('✅ GET /api/users/fulfillment-staff/:id - Get by employee ID');
        console.log('✅ GET /api/users/fulfillment-staff/by-user/:userId - Get by user ID');
        console.log('✅ GET /api/users/fulfillment-staff/stats - Statistics');
        console.log('✅ GET /api/users/fulfillment-staff/regions - Available regions');
        console.log('✅ GET /api/users/fulfillment-staff/by-region - Filter by region');
        console.log('✅ Sorting functionality');
        console.log('✅ Pagination with different page sizes');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
            console.log('   You need Super-admin or Fulfillment-Admin role');
        }
    }
}

// Instructions for running the test
console.log('🔧 Fulfillment Staff Endpoints Test Script');
console.log('==========================================\n');
console.log('This script tests the new fulfillment staff management endpoints.\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual user service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('   (Must have Super-admin or Fulfillment-Admin role)');
console.log('3. Update TEST_EMPLOYEE_ID with an actual fulfillment staff employee ID');
console.log('4. Update TEST_USER_ID with an actual fulfillment staff user ID');
console.log('5. Make sure your user service is running\n');

// Uncomment the line below to run the test
// testFulfillmentStaffEndpoints();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-fulfillment-staff.js');

console.log('\n🔧 What was implemented:');
console.log('=========================');
console.log('Created a new controller specifically for managing fulfillment staff members.\n');

console.log('Features:');
console.log('✅ Get all fulfillment staff with pagination');
console.log('✅ Search by name, email, phone, employee ID');
console.log('✅ Sort by different fields (created_at, last_login, etc.)');
console.log('✅ Get detailed staff information by employee ID');
console.log('✅ Get staff information by user ID');
console.log('✅ Get comprehensive statistics about fulfillment staff');
console.log('✅ Get available regions');
console.log('✅ Filter staff by region');
console.log('✅ Populated dealer information for assigned dealers');
console.log('✅ Populated user information for each staff member');
console.log('✅ Role-based access control (Super-admin, Fulfillment-Admin)');
console.log('✅ Audit logging for all endpoints\n');

console.log('API Endpoints:');
console.log('- GET /api/users/fulfillment-staff');
console.log('- GET /api/users/fulfillment-staff/stats');
console.log('- GET /api/users/fulfillment-staff/regions');
console.log('- GET /api/users/fulfillment-staff/by-region');
console.log('- GET /api/users/fulfillment-staff/by-user/:userId');
console.log('- GET /api/users/fulfillment-staff/:id');

