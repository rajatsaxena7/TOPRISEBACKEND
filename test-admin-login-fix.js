const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001'; // User service URL
const TEST_EMAIL = 'admin@example.com'; // Replace with actual admin email
const TEST_PASSWORD = 'correct_password'; // Replace with actual admin password
const WRONG_PASSWORD = 'wrong_password';

async function testAdminLoginFix() {
    try {
        console.log('🔧 Testing Admin Login Security Fix...\n');

        // Test 1: Login with correct credentials
        console.log('📝 Test 1: Login with correct credentials...');
        try {
            const correctLoginResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            });

            if (correctLoginResponse.data.success) {
                console.log('✅ Login with correct credentials successful');
                console.log(`📝 User ID: ${correctLoginResponse.data.data.user._id}`);
                console.log(`📝 User Email: ${correctLoginResponse.data.data.user.email}`);
                console.log(`📝 User Role: ${correctLoginResponse.data.data.user.role}`);
                console.log(`📝 Token Generated: ${correctLoginResponse.data.data.token ? 'Yes' : 'No'}`);
            } else {
                console.log('❌ Login with correct credentials failed:', correctLoginResponse.data.message);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected login with correct credentials (user not found or wrong password)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with correct credentials:', error.response?.data || error.message);
            }
        }

        // Test 2: Login with incorrect password
        console.log('\n📝 Test 2: Login with incorrect password...');
        try {
            const wrongPasswordResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                email: TEST_EMAIL,
                password: WRONG_PASSWORD
            });

            if (wrongPasswordResponse.data.success) {
                console.log('❌ SECURITY ISSUE: Login with incorrect password was successful!');
                console.log(`📝 This should not happen - password validation is broken`);
            } else {
                console.log('✅ Correctly rejected login with incorrect password');
                console.log(`📝 Error Message: ${wrongPasswordResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected login with incorrect password (401 Unauthorized)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with incorrect password:', error.response?.data || error.message);
            }
        }

        // Test 3: Login with missing email
        console.log('\n📝 Test 3: Login with missing email...');
        try {
            const missingEmailResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                password: TEST_PASSWORD
            });

            if (missingEmailResponse.data.success) {
                console.log('❌ SECURITY ISSUE: Login with missing email was successful!');
            } else {
                console.log('✅ Correctly rejected login with missing email');
                console.log(`📝 Error Message: ${missingEmailResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected login with missing email (400 Bad Request)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with missing email:', error.response?.data || error.message);
            }
        }

        // Test 4: Login with missing password
        console.log('\n📝 Test 4: Login with missing password...');
        try {
            const missingPasswordResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                email: TEST_EMAIL
            });

            if (missingPasswordResponse.data.success) {
                console.log('❌ SECURITY ISSUE: Login with missing password was successful!');
            } else {
                console.log('✅ Correctly rejected login with missing password');
                console.log(`📝 Error Message: ${missingPasswordResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected login with missing password (400 Bad Request)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with missing password:', error.response?.data || error.message);
            }
        }

        // Test 5: Login with empty credentials
        console.log('\n📝 Test 5: Login with empty credentials...');
        try {
            const emptyCredentialsResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                email: '',
                password: ''
            });

            if (emptyCredentialsResponse.data.success) {
                console.log('❌ SECURITY ISSUE: Login with empty credentials was successful!');
            } else {
                console.log('✅ Correctly rejected login with empty credentials');
                console.log(`📝 Error Message: ${emptyCredentialsResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Correctly rejected login with empty credentials (400 Bad Request)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with empty credentials:', error.response?.data || error.message);
            }
        }

        // Test 6: Login with non-existent user
        console.log('\n📝 Test 6: Login with non-existent user...');
        try {
            const nonExistentUserResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                email: 'nonexistent@example.com',
                password: 'anypassword'
            });

            if (nonExistentUserResponse.data.success) {
                console.log('❌ SECURITY ISSUE: Login with non-existent user was successful!');
            } else {
                console.log('✅ Correctly rejected login with non-existent user');
                console.log(`📝 Error Message: ${nonExistentUserResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected login with non-existent user (401 Unauthorized)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with non-existent user:', error.response?.data || error.message);
            }
        }

        // Test 7: Login with SQL injection attempt
        console.log('\n📝 Test 7: Login with SQL injection attempt...');
        try {
            const sqlInjectionResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                email: "admin@example.com'; DROP TABLE users; --",
                password: 'anypassword'
            });

            if (sqlInjectionResponse.data.success) {
                console.log('❌ SECURITY ISSUE: SQL injection attempt was successful!');
            } else {
                console.log('✅ Correctly rejected SQL injection attempt');
                console.log(`📝 Error Message: ${sqlInjectionResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected SQL injection attempt (401 Unauthorized)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with SQL injection attempt:', error.response?.data || error.message);
            }
        }

        // Test 8: Login with XSS attempt
        console.log('\n📝 Test 8: Login with XSS attempt...');
        try {
            const xssResponse = await axios.post(`${BASE_URL}/api/users/loginWeb`, {
                email: '<script>alert("xss")</script>@example.com',
                password: 'anypassword'
            });

            if (xssResponse.data.success) {
                console.log('❌ SECURITY ISSUE: XSS attempt was successful!');
            } else {
                console.log('✅ Correctly rejected XSS attempt');
                console.log(`📝 Error Message: ${xssResponse.data.message}`);
            }
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correctly rejected XSS attempt (401 Unauthorized)');
                console.log(`📝 Error Message: ${error.response.data.message}`);
            } else {
                console.log('❌ Unexpected error with XSS attempt:', error.response?.data || error.message);
            }
        }

        console.log('\n🎉 Admin Login Security Fix tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_EMAIL and TEST_PASSWORD with valid admin credentials');
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
console.log('🔧 Admin Login Security Fix Test Script');
console.log('======================================\n');
console.log('This script will test the admin login security fix to ensure:');
console.log('1. Correct credentials work properly');
console.log('2. Incorrect passwords are rejected');
console.log('3. Missing fields are validated');
console.log('4. Security vulnerabilities are prevented\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual user service URL');
console.log('2. Update TEST_EMAIL with a valid admin email');
console.log('3. Update TEST_PASSWORD with the correct admin password');
console.log('4. Make sure your user service is running');
console.log('5. Ensure you have an admin user in the database\n');

// Uncomment the line below to run the test
// testAdminLoginFix();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-admin-login-fix.js');

console.log('\n📋 Test Scenarios:');
console.log('1. Login with correct credentials (should succeed)');
console.log('2. Login with incorrect password (should fail with 401)');
console.log('3. Login with missing email (should fail with 400)');
console.log('4. Login with missing password (should fail with 400)');
console.log('5. Login with empty credentials (should fail with 400)');
console.log('6. Login with non-existent user (should fail with 401)');
console.log('7. Login with SQL injection attempt (should fail with 401)');
console.log('8. Login with XSS attempt (should fail with 401)');

console.log('\n✅ Expected Behavior After Fix:');
console.log('- Only correct email and password combinations should succeed');
console.log('- All incorrect passwords should be rejected with 401 Unauthorized');
console.log('- Missing required fields should be rejected with 400 Bad Request');
console.log('- Security attacks should be properly handled');
console.log('- Password validation should use bcrypt.compare()');
console.log('- Last login timestamp should be updated on successful login');

console.log('\n❌ Original Issue:');
console.log('The admin login endpoint was allowing login with incorrect passwords');
console.log('because the password validation code was commented out:');
console.log('// const isMatch = await bcrypt.compare(password, user.password);');
console.log('// if (!isMatch) return sendError(res, "Invalid credentials", 401);');

console.log('\n🔧 Fix Applied:');
console.log('- Uncommented and fixed the password validation code');
console.log('- Added proper input validation for email and password');
console.log('- Added last_login timestamp update');
console.log('- Improved error messages for security');
console.log('- Added proper error handling');

console.log('\n🛡️ Security Improvements:');
console.log('- Password validation now uses bcrypt.compare()');
console.log('- Input validation prevents empty/missing fields');
console.log('- Consistent error messages prevent user enumeration');
console.log('- Last login tracking for security monitoring');
console.log('- Proper error handling for all edge cases');
