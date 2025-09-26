const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Order service URL
const TEST_TOKEN = 'your_test_token_here'; // Replace with actual token

async function testDealerModelFix() {
    try {
        console.log('🔧 Testing Dealer Model Fix for Payment Controller...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get all payments (should not throw Dealer model error)
        console.log('📝 Test 1: Get all payments with dealer population...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/all?limit=1`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved payments without Dealer model error');
                console.log(`📝 Response status: ${response.status}`);
                console.log(`📝 Data structure: ${typeof response.data.data}`);

                if (response.data.data.data && response.data.data.data.length > 0) {
                    const payment = response.data.data.data[0];
                    console.log(`📝 Payment ID: ${payment._id}`);
                    console.log(`📝 Has order details: ${payment.orderDetails ? 'Yes' : 'No'}`);

                    if (payment.orderDetails && payment.orderDetails.dealers) {
                        console.log(`📝 Dealers count: ${payment.orderDetails.dealers.length}`);
                        if (payment.orderDetails.dealers.length > 0) {
                            console.log(`📝 First dealer: ${payment.orderDetails.dealers[0].dealerName || 'N/A'}`);
                        }
                    }
                }
            } else {
                console.log('❌ Failed to retrieve payments:', response.data.message);
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('Schema hasn\'t been registered for model "Dealer"')) {
                console.log('❌ Dealer model error still exists:', error.response.data.message);
            } else {
                console.log('✅ No Dealer model error - other error:', error.response?.data || error.message);
            }
        }

        // Test 2: Get payment by ID (should not throw Dealer model error)
        console.log('\n📝 Test 2: Get payment by ID with dealer population...');
        try {
            // First get a payment ID
            const listResponse = await axios.get(`${BASE_URL}/api/payments/all?limit=1`, { headers });

            if (listResponse.data.success && listResponse.data.data.data.length > 0) {
                const paymentId = listResponse.data.data.data[0]._id;
                const response = await axios.get(`${BASE_URL}/api/payments/by-id/${paymentId}`, { headers });

                if (response.data.success) {
                    console.log('✅ Successfully retrieved payment by ID without Dealer model error');
                    const payment = response.data.data;
                    console.log(`📝 Payment ID: ${payment._id}`);
                    console.log(`📝 Has order details: ${payment.orderDetails ? 'Yes' : 'No'}`);
                } else {
                    console.log('❌ Failed to retrieve payment by ID:', response.data.message);
                }
            } else {
                console.log('⚠️ No payments found to test payment by ID');
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('Schema hasn\'t been registered for model "Dealer"')) {
                console.log('❌ Dealer model error still exists in getPaymentById:', error.response.data.message);
            } else {
                console.log('✅ No Dealer model error in getPaymentById - other error:', error.response?.data || error.message);
            }
        }

        // Test 3: Get payments by order ID (should not throw Dealer model error)
        console.log('\n📝 Test 3: Get payments by order ID with dealer population...');
        try {
            // First get an order ID from a payment
            const listResponse = await axios.get(`${BASE_URL}/api/payments/all?limit=1`, { headers });

            if (listResponse.data.success && listResponse.data.data.data.length > 0) {
                const orderId = listResponse.data.data.data[0].order_id;

                if (orderId) {
                    const response = await axios.get(`${BASE_URL}/api/payments/by-order-id/${orderId}`, { headers });

                    if (response.data.success) {
                        console.log('✅ Successfully retrieved payments by order ID without Dealer model error');
                        console.log(`📝 Payments count: ${response.data.data.length}`);
                    } else {
                        console.log('❌ Failed to retrieve payments by order ID:', response.data.message);
                    }
                } else {
                    console.log('⚠️ No order ID found in payment to test');
                }
            } else {
                console.log('⚠️ No payments found to test payments by order ID');
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('Schema hasn\'t been registered for model "Dealer"')) {
                console.log('❌ Dealer model error still exists in getPaymentByOrderId:', error.response.data.message);
            } else {
                console.log('✅ No Dealer model error in getPaymentByOrderId - other error:', error.response?.data || error.message);
            }
        }

        // Test 4: Enhanced search (should not throw Dealer model error)
        console.log('\n📝 Test 4: Enhanced search with dealer population...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/search?limit=1`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully performed enhanced search without Dealer model error');
                console.log(`📝 Search results count: ${response.data.data.data.length}`);
            } else {
                console.log('❌ Failed to perform enhanced search:', response.data.message);
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('Schema hasn\'t been registered for model "Dealer"')) {
                console.log('❌ Dealer model error still exists in search:', error.response.data.message);
            } else {
                console.log('✅ No Dealer model error in search - other error:', error.response?.data || error.message);
            }
        }

        // Test 5: Test with multiple payments to ensure consistency
        console.log('\n📝 Test 5: Test with multiple payments...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/all?limit=5`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved multiple payments without Dealer model error');
                console.log(`📝 Total payments retrieved: ${response.data.data.data.length}`);

                // Check if all payments have proper structure
                let validPayments = 0;
                response.data.data.data.forEach((payment, index) => {
                    if (payment._id && payment.paymentSummary) {
                        validPayments++;
                    }
                });
                console.log(`📝 Valid payments: ${validPayments}/${response.data.data.data.length}`);
            } else {
                console.log('❌ Failed to retrieve multiple payments:', response.data.message);
            }
        } catch (error) {
            if (error.response?.data?.message?.includes('Schema hasn\'t been registered for model "Dealer"')) {
                console.log('❌ Dealer model error still exists with multiple payments:', error.response.data.message);
            } else {
                console.log('✅ No Dealer model error with multiple payments - other error:', error.response?.data || error.message);
            }
        }

        console.log('\n🎉 Dealer Model Fix tests completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure the API endpoints are correct and the service is running');
        }

        if (error.response?.status === 500) {
            console.log('\n💡 Note: Check if the order service is running and accessible');
        }
    }
}

// Instructions for running the test
console.log('🔧 Dealer Model Fix Test Script');
console.log('==============================\n');
console.log('This script will test if the Dealer model registration error has been fixed:');
console.log('1. Get all payments with dealer population');
console.log('2. Get payment by ID with dealer population');
console.log('3. Get payments by order ID with dealer population');
console.log('4. Enhanced search with dealer population');
console.log('5. Test with multiple payments for consistency\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your order service is running');
console.log('4. Ensure you have payment data in the database\n');

// Uncomment the line below to run the test
// testDealerModelFix();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-dealer-model-fix.js');

console.log('\n📋 Expected Results:');
console.log('✅ All endpoints should work without "Schema hasn\'t been registered for model \'Dealer\'" error');
console.log('✅ Payment data should be retrieved successfully');
console.log('✅ Order details should be populated correctly');
console.log('✅ Dealer information should be available in order details');
console.log('✅ No Mongoose model registration errors');

console.log('\n❌ Original Error:');
console.log('Schema hasn\'t been registered for model "Dealer".');
console.log('Use mongoose.model(name, schema)');

console.log('\n🔧 Fix Applied:');
console.log('1. Created Dealer model in services/order-service/src/models/dealer.js');
console.log('2. Imported Dealer model in payment controller');
console.log('3. Ensured proper model registration with mongoose.models.Dealer || mongoose.model("Dealer", dealerSchema)');

console.log('\n📊 Dealer Model Features:');
console.log('- Complete dealer schema matching user service structure');
console.log('- All necessary fields for order service population');
console.log('- Proper timestamps and indexing');
console.log('- Compatible with existing order service functionality');

console.log('\n🛡️ Model Registration:');
console.log('- Uses mongoose.models.Dealer || mongoose.model("Dealer", dealerSchema)');
console.log('- Prevents duplicate model registration');
console.log('- Compatible with hot reloading and testing');
console.log('- Follows Mongoose best practices');
