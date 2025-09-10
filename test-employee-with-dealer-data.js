const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001'; // User service URL
const EMPLOYEE_ID = '68af0504c67857e01c33b3b3'; // Your actual employee ID

async function testEmployeeWithDealerData() {
    console.log('🔍 Testing Employee Endpoint with Dealer Data Population');
    console.log('======================================================\n');

    console.log(`📋 Testing with employee ID: ${EMPLOYEE_ID}`);
    console.log(`🌐 Endpoint: ${BASE_URL}/api/users/employee/get-by-id?employee_id=${EMPLOYEE_ID}\n`);

    try {
        const response = await axios.get(`${BASE_URL}/api/users/employee/get-by-id`, {
            params: {
                employee_id: EMPLOYEE_ID
            },
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });

        if (response.status === 200 && response.data.success) {
            const data = response.data.data;

            console.log('✅ Success!');
            console.log(`📊 Employee Information:`);
            console.log(`   - Employee ID: ${data.employee_id}`);
            console.log(`   - Name: ${data.First_name}`);
            console.log(`   - Email: ${data.email}`);
            console.log(`   - Role: ${data.role}`);
            console.log(`   - Mobile: ${data.mobile_number}`);
            console.log(`   - Assigned Regions: ${data.assigned_regions?.join(', ') || 'None'}`);

            console.log(`\n👥 User Details:`);
            if (data.user_id) {
                console.log(`   - User ID: ${data.user_id._id}`);
                console.log(`   - Username: ${data.user_id.username}`);
                console.log(`   - Email: ${data.user_id.email}`);
                console.log(`   - Phone: ${data.user_id.phone_Number}`);
                console.log(`   - Role: ${data.user_id.role}`);
            }

            console.log(`\n🏪 Assigned Dealers (${data.assigned_dealers?.length || 0}):`);
            if (data.assigned_dealers && data.assigned_dealers.length > 0) {
                data.assigned_dealers.forEach((dealer, index) => {
                    console.log(`\n   ${index + 1}. Dealer: ${dealer.legal_name} (${dealer.trade_name})`);
                    console.log(`      - Dealer ID: ${dealer.dealerId}`);
                    console.log(`      - GSTIN: ${dealer.GSTIN}`);
                    console.log(`      - PAN: ${dealer.Pan}`);
                    console.log(`      - SLA Type: ${dealer.SLA_type || 'Not set'}`);
                    console.log(`      - Dispatch Hours: ${dealer.dispatch_hours || 'Not set'}`);
                    console.log(`      - SLA Max Dispatch Time: ${dealer.SLA_max_dispatch_time || 'Not set'}`);

                    if (dealer.Address) {
                        console.log(`      - Address: ${dealer.Address.street}, ${dealer.Address.city}, ${dealer.Address.state} - ${dealer.Address.pincode}`);
                    }

                    if (dealer.user_details) {
                        console.log(`      - Dealer User Details:`);
                        console.log(`        * Username: ${dealer.user_details.username}`);
                        console.log(`        * Email: ${dealer.user_details.email}`);
                        console.log(`        * Phone: ${dealer.user_details.phone_Number}`);
                        console.log(`        * Role: ${dealer.user_details.role}`);
                    }

                    console.log(`      - Categories Allowed (${dealer.categories_allowed?.length || 0}):`);
                    if (dealer.categories_allowed && dealer.categories_allowed.length > 0) {
                        dealer.categories_allowed.forEach((categoryId, catIndex) => {
                            console.log(`        ${catIndex + 1}. Category ID: ${categoryId}`);
                        });
                    }

                    console.log(`      - Assigned Categories (${dealer.assigned_categories?.length || 0}):`);
                    if (dealer.assigned_categories && dealer.assigned_categories.length > 0) {
                        dealer.assigned_categories.forEach((category, catIndex) => {
                            console.log(`        ${catIndex + 1}. ${category.category_name} (${category.category_code})`);
                            console.log(`           - Status: ${category.category_Status}`);
                            console.log(`           - Main Category: ${category.main_category}`);
                        });
                    } else {
                        console.log(`        No category details available`);
                    }

                    console.log(`      - Created: ${new Date(dealer.created_at).toLocaleString()}`);
                    console.log(`      - Updated: ${new Date(dealer.updated_at).toLocaleString()}`);
                });
            } else {
                console.log(`   No dealers assigned to this employee`);
            }

            console.log(`\n📅 Timestamps:`);
            console.log(`   - Created: ${new Date(data.created_at).toLocaleString()}`);
            console.log(`   - Updated: ${new Date(data.updated_at).toLocaleString()}`);
            console.log(`   - Last Login: ${new Date(data.last_login).toLocaleString()}`);

        } else {
            console.log('❌ Failed!');
            console.log(`   Status: ${response.status}`);
            console.log(`   Message: ${response.data.message || 'Unknown error'}`);
        }

    } catch (error) {
        console.log('❌ Error!');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data.message || error.response.data.error || 'Unknown error'}`);
            if (error.response.data.details) {
                console.log(`   Details: ${JSON.stringify(error.response.data.details, null, 2)}`);
            }
        } else if (error.request) {
            console.log('   Network Error: No response received');
            console.log(`   URL: ${error.config?.url}`);
        } else {
            console.log(`   Error: ${error.message}`);
        }
    }
}

// Test with different employee IDs
async function testMultipleEmployees() {
    console.log('\n🔄 Testing Multiple Employee IDs');
    console.log('=================================\n');

    const testEmployeeIds = [
        '68af0504c67857e01c33b3b3',
        'EMP001',
        'EMP002',
        'invalid-id'
    ];

    for (const employeeId of testEmployeeIds) {
        console.log(`\n📋 Testing employee ID: ${employeeId}`);
        console.log('─'.repeat(50));

        try {
            const response = await axios.get(`${BASE_URL}/api/users/employee/get-by-id`, {
                params: {
                    employee_id: employeeId
                },
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.status === 200 && response.data.success) {
                const data = response.data.data;
                console.log(`✅ Found employee: ${data.First_name}`);
                console.log(`   - Assigned Dealers: ${data.assigned_dealers?.length || 0}`);
                console.log(`   - Assigned Regions: ${data.assigned_regions?.length || 0}`);
            } else {
                console.log(`❌ Failed: ${response.data.message || 'Unknown error'}`);
            }

        } catch (error) {
            if (error.response) {
                console.log(`❌ Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`);
            } else {
                console.log(`❌ Network Error: ${error.message}`);
            }
        }
    }
}

// Test the endpoint without authentication to see the error
async function testWithoutAuth() {
    console.log('\n🔒 Testing Without Authentication');
    console.log('==================================\n');

    try {
        const response = await axios.get(`${BASE_URL}/api/users/employee/get-by-id`, {
            params: {
                employee_id: EMPLOYEE_ID
            },
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });

        console.log('❌ Unexpected Success! Should have failed without auth');
        console.log(`   Status: ${response.status}`);

    } catch (error) {
        if (error.response) {
            console.log('✅ Expected Error!');
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data.message || 'Unknown error'}`);
        } else {
            console.log(`❌ Unexpected Error: ${error.message}`);
        }
    }
}

// Performance test
async function testPerformance() {
    console.log('\n⚡ Performance Test');
    console.log('==================\n');

    const iterations = 3;
    const times = [];

    for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        try {
            await axios.get(`${BASE_URL}/api/users/employee/get-by-id`, {
                params: {
                    employee_id: EMPLOYEE_ID
                },
                headers: {
                    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                    'Content-Type': 'application/json'
                },
                timeout: 20000
            });

            const endTime = Date.now();
            const duration = endTime - startTime;
            times.push(duration);

            console.log(`⏱️  Request ${i + 1}: ${duration}ms`);

        } catch (error) {
            console.log(`❌ Request ${i + 1}: Failed - ${error.message}`);
        }
    }

    if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log(`\n📊 Performance Summary:`);
        console.log(`   - Average Response Time: ${avgTime.toFixed(2)}ms`);
        console.log(`   - Fastest Response: ${minTime}ms`);
        console.log(`   - Slowest Response: ${maxTime}ms`);
        console.log(`   - Successful Requests: ${times.length}/${iterations}`);
    }
}

// Main execution
async function runTests() {
    console.log('🎯 Employee with Dealer Data Test Suite');
    console.log('=======================================\n');

    console.log('📋 Test Configuration:');
    console.log(`   - Base URL: ${BASE_URL}`);
    console.log(`   - Employee ID: ${EMPLOYEE_ID}`);
    console.log(`   - Note: Replace 'YOUR_JWT_TOKEN_HERE' with actual token\n`);

    try {
        await testEmployeeWithDealerData();
        await testMultipleEmployees();
        await testWithoutAuth();
        await testPerformance();

        console.log('\n🎉 All tests completed!');
        console.log('\n📝 Next Steps:');
        console.log('   1. Replace "YOUR_JWT_TOKEN_HERE" with actual JWT token');
        console.log('   2. Run the test again');
        console.log('   3. Check the logs for detailed information');
        console.log('   4. Verify the employee ID exists in the system');
        console.log('   5. Check if the employee has assigned dealers');

    } catch (error) {
        console.error('💥 Test suite failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = {
    testEmployeeWithDealerData,
    testMultipleEmployees,
    testWithoutAuth,
    testPerformance,
    runTests
};
