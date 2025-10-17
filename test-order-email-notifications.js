const axios = require('axios');

// Test script to verify order email notifications
async function testOrderEmailNotifications() {
    console.log('🧪 Testing Order Email Notifications...\n');

    try {
        // Test 1: Create a test order
        console.log('1. Creating test order...');
        const orderData = {
            customerDetails: {
                userId: 'test-user-123',
                name: 'Test User',
                email: 'test@example.com',
                phone: '+91-9876543210',
                address: '123 Test Street, Test City, Test State 123456'
            },
            skus: [
                {
                    sku: 'TEST-SKU-001',
                    quantity: 2,
                    productId: 'product-123',
                    productName: 'Test Product 1',
                    selling_price: 100,
                    mrp: 150,
                    mrp_gst_amount: 27,
                    gst_percentage: 18,
                    gst_amount: 18,
                    product_total: 200,
                    totalPrice: 236
                },
                {
                    sku: 'TEST-SKU-002',
                    quantity: 1,
                    productId: 'product-456',
                    productName: 'Test Product 2',
                    selling_price: 200,
                    mrp: 250,
                    mrp_gst_amount: 45,
                    gst_percentage: 18,
                    gst_amount: 36,
                    product_total: 200,
                    totalPrice: 236
                }
            ],
            order_Amount: 472,
            paymentType: 'COD',
            delivery_type: 'Express',
            deliveryCharges: 50,
            gst_amount: 54
        };

        const createOrderResponse = await axios.post('http://localhost:5001/api/orders', orderData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token' // Replace with actual token
            }
        });

        if (createOrderResponse.data.success) {
            console.log('✅ Test order created successfully');
            console.log('📧 Email notification should have been sent to:', orderData.customerDetails.email);
            console.log('📱 Push notification should have been sent to user');
            console.log('📧 Admin email notification should have been sent');
        } else {
            console.log('❌ Failed to create test order:', createOrderResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n🔍 Check the following:');
    console.log('1. Check email inbox for order confirmation email');
    console.log('2. Check application logs for email sending status');
    console.log('3. Verify SMTP configuration in user service');
    console.log('4. Check notification service logs');
}

// Run the test
testOrderEmailNotifications();
