const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Order service URL
const TEST_TOKEN = 'your_test_token_here'; // Replace with actual token

async function testPaymentOrderDetails() {
    try {
        console.log('🔧 Testing Enhanced Payment Controller with Order Details...\n');

        const headers = {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Get all payments with enhanced order details
        console.log('📝 Test 1: Get all payments with enhanced order details...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/all`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved payments with order details');
                console.log(`📝 Total payments: ${response.data.data.pagination.totalItems}`);
                console.log(`📝 Current page: ${response.data.data.pagination.currentPage}`);
                console.log(`📝 Total pages: ${response.data.data.pagination.totalPages}`);

                if (response.data.data.data.length > 0) {
                    const firstPayment = response.data.data.data[0];
                    console.log('\n📋 Sample Payment Structure:');
                    console.log(`- Payment ID: ${firstPayment._id}`);
                    console.log(`- Razorpay Order ID: ${firstPayment.razorpay_order_id}`);
                    console.log(`- Payment Status: ${firstPayment.payment_status}`);
                    console.log(`- Amount: ${firstPayment.amount}`);

                    if (firstPayment.orderDetails) {
                        console.log('\n📋 Order Details:');
                        console.log(`- Order ID: ${firstPayment.orderDetails.orderId}`);
                        console.log(`- Order Date: ${firstPayment.orderDetails.orderDate}`);
                        console.log(`- Customer Name: ${firstPayment.orderDetails.customerName}`);
                        console.log(`- Customer Email: ${firstPayment.orderDetails.customerEmail}`);
                        console.log(`- SKU Count: ${firstPayment.orderDetails.skuCount}`);
                        console.log(`- Total SKUs: ${firstPayment.orderDetails.totalSKUs}`);
                        console.log(`- Dealers: ${firstPayment.orderDetails.dealers.length}`);
                    }

                    if (firstPayment.paymentSummary) {
                        console.log('\n📋 Payment Summary:');
                        console.log(`- Payment Method: ${firstPayment.paymentSummary.paymentMethod}`);
                        console.log(`- Created At: ${firstPayment.paymentSummary.createdAt}`);
                        console.log(`- Is Refund: ${firstPayment.paymentSummary.isRefund}`);
                    }
                }
            } else {
                console.log('❌ Failed to retrieve payments:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving payments:', error.response?.data || error.message);
        }

        // Test 2: Get payments with filtering
        console.log('\n📝 Test 2: Get payments with filtering...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/all?payment_status=Captured&limit=5`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully retrieved filtered payments');
                console.log(`📝 Filtered payments count: ${response.data.data.data.length}`);
                console.log(`📝 Applied filters:`, response.data.data.filters);
            } else {
                console.log('❌ Failed to retrieve filtered payments:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error retrieving filtered payments:', error.response?.data || error.message);
        }

        // Test 3: Enhanced search functionality
        console.log('\n📝 Test 3: Enhanced search functionality...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/search?search=test&limit=3`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully performed enhanced search');
                console.log(`📝 Search results count: ${response.data.data.data.length}`);
                console.log(`📝 Search filters:`, response.data.data.filters);
            } else {
                console.log('❌ Failed to perform enhanced search:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error in enhanced search:', error.response?.data || error.message);
        }

        // Test 4: Search with multiple filters
        console.log('\n📝 Test 4: Search with multiple filters...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/search?payment_status=Captured&order_status=Confirmed&minAmount=100&maxAmount=10000&limit=2`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully performed multi-filter search');
                console.log(`📝 Multi-filter results count: ${response.data.data.data.length}`);
                console.log(`📝 Applied filters:`, response.data.data.filters);
            } else {
                console.log('❌ Failed to perform multi-filter search:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error in multi-filter search:', error.response?.data || error.message);
        }

        // Test 5: Get payment by ID with enhanced details
        console.log('\n📝 Test 5: Get payment by ID with enhanced details...');
        try {
            // First get a payment ID from the list
            const listResponse = await axios.get(`${BASE_URL}/api/payments/all?limit=1`, { headers });

            if (listResponse.data.success && listResponse.data.data.data.length > 0) {
                const paymentId = listResponse.data.data.data[0]._id;
                const response = await axios.get(`${BASE_URL}/api/payments/by-id/${paymentId}`, { headers });

                if (response.data.success) {
                    console.log('✅ Successfully retrieved payment by ID with enhanced details');
                    const payment = response.data.data;
                    console.log(`📝 Payment ID: ${payment._id}`);
                    console.log(`📝 Payment Status: ${payment.payment_status}`);

                    if (payment.orderDetails) {
                        console.log(`📝 Order ID: ${payment.orderDetails.orderId}`);
                        console.log(`📝 Customer: ${payment.orderDetails.customerName}`);
                        console.log(`📝 SKUs: ${payment.orderDetails.skuCount}`);
                    }
                } else {
                    console.log('❌ Failed to retrieve payment by ID:', response.data.message);
                }
            } else {
                console.log('⚠️ No payments found to test payment by ID');
            }
        } catch (error) {
            console.log('❌ Error retrieving payment by ID:', error.response?.data || error.message);
        }

        // Test 6: Get payments by order ID
        console.log('\n📝 Test 6: Get payments by order ID...');
        try {
            // First get an order ID from a payment
            const listResponse = await axios.get(`${BASE_URL}/api/payments/all?limit=1`, { headers });

            if (listResponse.data.success && listResponse.data.data.data.length > 0) {
                const orderId = listResponse.data.data.data[0].order_id;

                if (orderId) {
                    const response = await axios.get(`${BASE_URL}/api/payments/by-order-id/${orderId}`, { headers });

                    if (response.data.success) {
                        console.log('✅ Successfully retrieved payments by order ID');
                        console.log(`📝 Payments count for order: ${response.data.data.length}`);

                        if (response.data.data.length > 0) {
                            const payment = response.data.data[0];
                            console.log(`📝 Payment Status: ${payment.payment_status}`);
                            console.log(`📝 Amount: ${payment.amount}`);
                        }
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
            console.log('❌ Error retrieving payments by order ID:', error.response?.data || error.message);
        }

        // Test 7: Test pagination
        console.log('\n📝 Test 7: Test pagination...');
        try {
            const response = await axios.get(`${BASE_URL}/api/payments/all?page=1&limit=2`, { headers });

            if (response.data.success) {
                console.log('✅ Successfully tested pagination');
                console.log(`📝 Current page: ${response.data.data.pagination.currentPage}`);
                console.log(`📝 Total pages: ${response.data.data.pagination.totalPages}`);
                console.log(`📝 Total items: ${response.data.data.pagination.totalItems}`);
                console.log(`📝 Items per page: ${response.data.data.pagination.itemsPerPage}`);
                console.log(`📝 Has next page: ${response.data.data.pagination.hasNextPage}`);
                console.log(`📝 Has previous page: ${response.data.data.pagination.hasPreviousPage}`);
            } else {
                console.log('❌ Failed to test pagination:', response.data.message);
            }
        } catch (error) {
            console.log('❌ Error testing pagination:', error.response?.data || error.message);
        }

        console.log('\n🎉 Enhanced Payment Controller tests completed!');

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
console.log('🔧 Enhanced Payment Controller Test Script');
console.log('==========================================\n');
console.log('This script will test the enhanced payment controller with comprehensive order details:');
console.log('1. Get all payments with enhanced order details');
console.log('2. Filter payments by status and other criteria');
console.log('3. Enhanced search functionality');
console.log('4. Multi-filter search capabilities');
console.log('5. Get payment by ID with enhanced details');
console.log('6. Get payments by order ID');
console.log('7. Test pagination functionality\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual order service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Make sure your order service is running');
console.log('4. Ensure you have payment data in the database\n');

// Uncomment the line below to run the test
// testPaymentOrderDetails();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-payment-order-details.js');

console.log('\n📋 Enhanced Features Tested:');
console.log('1. Comprehensive order details population');
console.log('2. Dealer information integration');
console.log('3. Advanced filtering capabilities');
console.log('4. Enhanced search functionality');
console.log('5. Computed fields (SKU count, customer info, etc.)');
console.log('6. Payment and order summaries');
console.log('7. Pagination with filter tracking');

console.log('\n✅ Expected Behavior:');
console.log('- All payment endpoints should return comprehensive order details');
console.log('- Order details should include customer information, SKUs, dealers');
console.log('- Search should work across payment and order fields');
console.log('- Filtering should work for both payment and order criteria');
console.log('- Pagination should work correctly with all filters');
console.log('- Computed fields should be calculated and included');

console.log('\n🔧 API Endpoints Enhanced:');
console.log('- GET /api/payments/all - Enhanced with comprehensive order details');
console.log('- GET /api/payments/by-id/:paymentId - Enhanced with order details');
console.log('- GET /api/payments/by-order-id/:orderId - Enhanced with order details');
console.log('- GET /api/payments/search - New enhanced search endpoint');

console.log('\n📊 New Features Added:');
console.log('- Comprehensive order details population');
console.log('- Dealer information integration');
console.log('- Advanced filtering (payment status, order status, amount range, etc.)');
console.log('- Enhanced search across multiple fields');
console.log('- Computed fields (SKU count, customer info, dealer info)');
console.log('- Payment and order summaries');
console.log('- Filter tracking in response');
console.log('- Improved error handling and logging');
