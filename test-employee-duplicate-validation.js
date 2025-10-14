const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000'; // User service URL
const TEST_TOKEN = 'your_super_admin_token_here'; // Replace with actual Super-admin token

async function testEmployeeDuplicateValidation() {
    try {
        console.log('🔧 Testing Employee Duplicate Validation...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test data for first employee
        const employeeData1 = {
            email: 'test.employee@example.com',
            username: 'testemployee',
            password: 'password123',
            phone_Number: '+91-1234567890',
            employee_id: 'EMP_TEST_001',
            First_name: 'Test Employee',
            mobile_number: '+91-9876543210',
            role: 'User',
            employeeRole: 'Fulfillment-Staff'
        };

        // Test 1: Create first employee (should succeed)
        console.log('📝 Test 1: Create first employee...');
        try {
            const response = await axios.post(
                `${BASE_URL}/api/users/employee`,
                employeeData1,
                { headers }
            );

            if (response.status === 201 || response.data.message) {
                console.log('✅ First employee created successfully');
                console.log(`   Employee ID: ${response.data.employee.employee_id}`);
                console.log(`   Email: ${response.data.user.email}`);
            }
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️  Employee already exists (that\'s OK for testing)');
            } else {
                console.log('❌ Failed:', error.response?.data?.message || error.message);
            }
        }

        // Test 2: Try to create employee with duplicate email
        console.log('\n📝 Test 2: Try duplicate email...');
        try {
            const response = await axios.post(
                `${BASE_URL}/api/users/employee`,
                {
                    ...employeeData1,
                    username: 'differentusername',
                    phone_Number: '+91-1111111111',
                    employee_id: 'EMP_TEST_002',
                    mobile_number: '+91-1111111111'
                },
                { headers }
            );

            console.log('❌ Should have failed but succeeded!');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('✅ Correctly rejected duplicate email');
                console.log(`   Error message: "${error.response.data.message}"`);
            } else {
                console.log('❌ Wrong error:', error.response?.data?.message || error.message);
            }
        }

        // Test 3: Try to create employee with duplicate username
        console.log('\n📝 Test 3: Try duplicate username...');
        try {
            const response = await axios.post(
                `${BASE_URL}/api/users/employee`,
                {
                    ...employeeData1,
                    email: 'different@example.com',
                    phone_Number: '+91-2222222222',
                    employee_id: 'EMP_TEST_003',
                    mobile_number: '+91-2222222222'
                },
                { headers }
            );

            console.log('❌ Should have failed but succeeded!');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('✅ Correctly rejected duplicate username');
                console.log(`   Error message: "${error.response.data.message}"`);
            } else {
                console.log('❌ Wrong error:', error.response?.data?.message || error.message);
            }
        }

        // Test 4: Try to create employee with duplicate phone number
        console.log('\n📝 Test 4: Try duplicate phone number...');
        try {
            const response = await axios.post(
                `${BASE_URL}/api/users/employee`,
                {
                    ...employeeData1,
                    email: 'another@example.com',
                    username: 'anotherusername',
                    employee_id: 'EMP_TEST_004',
                    mobile_number: '+91-3333333333'
                },
                { headers }
            );

            console.log('❌ Should have failed but succeeded!');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('✅ Correctly rejected duplicate phone number');
                console.log(`   Error message: "${error.response.data.message}"`);
            } else {
                console.log('❌ Wrong error:', error.response?.data?.message || error.message);
            }
        }

        // Test 5: Try to create employee with duplicate employee ID
        console.log('\n📝 Test 5: Try duplicate employee ID...');
        try {
            const response = await axios.post(
                `${BASE_URL}/api/users/employee`,
                {
                    ...employeeData1,
                    email: 'yet.another@example.com',
                    username: 'yetanotherusername',
                    phone_Number: '+91-4444444444',
                    mobile_number: '+91-4444444444'
                },
                { headers }
            );

            console.log('❌ Should have failed but succeeded!');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('✅ Correctly rejected duplicate employee ID');
                console.log(`   Error message: "${error.response.data.message}"`);
            } else {
                console.log('❌ Wrong error:', error.response?.data?.message || error.message);
            }
        }

        // Test 6: Try to create employee with duplicate mobile number
        console.log('\n📝 Test 6: Try duplicate mobile number...');
        try {
            const response = await axios.post(
                `${BASE_URL}/api/users/employee`,
                {
                    ...employeeData1,
                    email: 'final@example.com',
                    username: 'finalusername',
                    phone_Number: '+91-5555555555',
                    employee_id: 'EMP_TEST_005'
                },
                { headers }
            );

            console.log('❌ Should have failed but succeeded!');
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('✅ Correctly rejected duplicate mobile number');
                console.log(`   Error message: "${error.response.data.message}"`);
            } else {
                console.log('❌ Wrong error:', error.response?.data?.message || error.message);
            }
        }

        // Test 7: Create employee with all unique values (should succeed)
        console.log('\n📝 Test 7: Create employee with all unique values...');
        try {
            const response = await axios.post(
                `${BASE_URL}/api/users/employee`,
                {
                    email: 'unique.employee@example.com',
                    username: 'uniqueemployee',
                    password: 'password123',
                    phone_Number: '+91-6666666666',
                    employee_id: 'EMP_TEST_UNIQUE',
                    First_name: 'Unique Employee',
                    mobile_number: '+91-7777777777',
                    role: 'User',
                    employeeRole: 'Fulfillment-Staff'
                },
                { headers }
            );

            if (response.status === 201) {
                console.log('✅ Successfully created employee with unique values');
                console.log(`   Employee ID: ${response.data.employee.employee_id}`);
                console.log(`   Email: ${response.data.user.email}`);
            }
        } catch (error) {
            if (error.response?.status === 409) {
                console.log('ℹ️  Employee already exists from previous test run');
            } else {
                console.log('❌ Failed:', error.response?.data?.message || error.message);
            }
        }

        console.log('\n🎉 All tests completed!');
        console.log('\n📊 Summary:');
        console.log('Validation checks that should work:');
        console.log('✅ Email uniqueness');
        console.log('✅ Username uniqueness');
        console.log('✅ Phone number uniqueness');
        console.log('✅ Employee ID uniqueness');
        console.log('✅ Mobile number uniqueness');
        console.log('✅ Specific error messages for each field');
        console.log('✅ Proper HTTP status code (409)');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid Super-admin token');
        }
    }
}

// Instructions for running the test
console.log('🔧 Employee Duplicate Validation Test Script');
console.log('==============================================\n');
console.log('This script tests the employee duplicate validation.\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual user service URL');
console.log('2. Update TEST_TOKEN with a valid Super-admin authentication token');
console.log('3. Make sure your user service is running\n');

// Uncomment the line below to run the test
// testEmployeeDuplicateValidation();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-employee-duplicate-validation.js');

console.log('\n🔧 What was fixed:');
console.log('==================');
console.log('Issue: No error message when creating employee with existing phone/email\n');
console.log('Root cause:');
console.log('- Only checked email and username duplicates');
console.log('- Didn\'t check phone_Number in User model');
console.log('- Didn\'t check employee_id in Employee model');
console.log('- Didn\'t check mobile_number in Employee model');
console.log('- Generic error messages\n');
console.log('Fix applied:');
console.log('✅ Added phone_Number duplicate check (User model)');
console.log('✅ Added employee_id duplicate check (Employee model)');
console.log('✅ Added mobile_number duplicate check (Employee model)');
console.log('✅ Specific error messages for each field');
console.log('✅ Proper logging of duplicate attempts');
console.log('✅ Conditional checking (only if fields provided)');
console.log('\nNow returns proper errors:');
console.log('- Email "x" is already registered. (409)');
console.log('- Username "x" is already taken. (409)');
console.log('- Phone number "x" is already registered. (409)');
console.log('- Employee ID "x" is already in use. (409)');
console.log('- Mobile number "x" is already registered. (409)');
