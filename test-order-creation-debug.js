const axios = require('axios');

const ORDER_SERVICE_URL = 'http://localhost:5002';
const USER_SERVICE_URL = 'http://localhost:5001';

async function testOrderCreation() {
  try {
    console.log('🔍 Testing Order Creation with User Role...\n');

    // Step 1: Login to get a valid token
    console.log('1️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      email: 'user@example.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log('📋 User role:', loginResponse.data.data.user.role);

    // Step 2: Test order creation
    console.log('\n2️⃣ Testing order creation...');
    
    const orderData = {
      customerDetails: {
        name: "Test Customer",
        phone: "+1234567890",
        email: "customer@example.com",
        userId: loginResponse.data.data.user._id
      },
      skus: [
        {
          sku: "TEST-SKU-001",
          quantity: 2,
          productId: "test-product-id",
          productName: "Test Product",
          selling_price: 100,
          mrp: 120,
          mrp_gst_amount: 20,
          gst_percentage: 18,
          gst_amount: 18,
          product_total: 200,
          totalPrice: 236
        }
      ],
      totalAmount: 236,
      paymentType: "COD",
      orderType: "Regular"
    };

    const orderResponse = await axios.post(`${ORDER_SERVICE_URL}/api/orders/create`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Order creation successful!');
    console.log('📋 Order ID:', orderResponse.data.data.orderId);

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('📊 Status:', error.response?.status);
    console.log('📊 Data:', error.response?.data);
    console.log('📊 Message:', error.response?.data?.message || error.message);
  }
}

testOrderCreation();
