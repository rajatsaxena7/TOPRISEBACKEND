const axios = require('axios');

const ORDER_SERVICE_URL = 'http://localhost:5002';
const USER_SERVICE_URL = 'http://localhost:5001';

async function testOrderCreation() {
  try {
    console.log('🔍 Testing Order Creation Fix...\n');

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
    console.log('📋 Order Status:', orderResponse.data.data.status);

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('📊 Status:', error.response?.status);
    console.log('📊 Data:', error.response?.data);
    console.log('📊 Message:', error.response?.data?.message || error.message);
  }
}

// Test internal endpoints
async function testInternalEndpoints() {
  console.log('\n🔍 Testing Internal Endpoints...\n');

  try {
    // Test Super-admin endpoint
    console.log('1️⃣ Testing Super-admin internal endpoint...');
    const superAdminResponse = await axios.get(`${USER_SERVICE_URL}/api/users/internal/super-admins`);
    console.log('✅ Super-admin endpoint works');
    console.log('📋 Super-admin count:', superAdminResponse.data.data.length);

    // Test Customer-Support endpoint
    console.log('\n2️⃣ Testing Customer-Support internal endpoint...');
    const customerSupportResponse = await axios.get(`${USER_SERVICE_URL}/api/users/internal/customer-support`);
    console.log('✅ Customer-Support endpoint works');
    console.log('📋 Customer-Support count:', customerSupportResponse.data.data.length);

  } catch (error) {
    console.log('❌ Internal endpoint error:');
    console.log('📊 Status:', error.response?.status);
    console.log('📊 Data:', error.response?.data);
  }
}

async function runTests() {
  console.log('🚀 Starting Order Creation Fix Tests...\n');
  
  await testInternalEndpoints();
  await testOrderCreation();
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
