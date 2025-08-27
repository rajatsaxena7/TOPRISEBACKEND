const axios = require('axios');

const ORDER_SERVICE_URL = 'http://localhost:5002';
const USER_SERVICE_URL = 'http://localhost:5001';

async function testPaymentEndpoints() {
  try {
    console.log('🔍 Testing Enhanced Payment Endpoints...\n');

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

    // Step 2: Create a test order first
    console.log('\n2️⃣ Creating a test order...');
    
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

    if (!orderResponse.data.success) {
      console.log('❌ Order creation failed:', orderResponse.data);
      return;
    }

    const orderId = orderResponse.data.data._id;
    console.log('✅ Order created successfully');
    console.log('📋 Order ID:', orderId);

    // Step 3: Create a test payment
    console.log('\n3️⃣ Creating a test payment...');
    
    const paymentData = {
      userId: loginResponse.data.data.user._id,
      amount: 236,
      orderSource: "Web",
      orderType: "Regular",
      customerDetails: orderData.customerDetails
    };

    const paymentResponse = await axios.post(`${ORDER_SERVICE_URL}/api/payments/create`, paymentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.data.success) {
      console.log('❌ Payment creation failed:', paymentResponse.data);
      return;
    }

    const paymentId = paymentResponse.data.data.payment._id;
    console.log('✅ Payment created successfully');
    console.log('📋 Payment ID:', paymentId);

    // Step 4: Test getPaymentById endpoint
    console.log('\n4️⃣ Testing getPaymentById endpoint...');
    
    const paymentByIdResponse = await axios.get(`${ORDER_SERVICE_URL}/api/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentByIdResponse.data.success) {
      console.log('✅ getPaymentById endpoint works');
      console.log('📋 Payment Summary:', {
        paymentId: paymentByIdResponse.data.data.paymentSummary?.paymentId,
        amount: paymentByIdResponse.data.data.paymentSummary?.amount,
        status: paymentByIdResponse.data.data.paymentSummary?.paymentStatus
      });
      
      if (paymentByIdResponse.data.data.orderSummary) {
        console.log('📋 Order Summary:', {
          orderId: paymentByIdResponse.data.data.orderSummary.orderId,
          customerName: paymentByIdResponse.data.data.orderSummary.customerName,
          totalAmount: paymentByIdResponse.data.data.orderSummary.totalAmount,
          skuCount: paymentByIdResponse.data.data.orderSummary.skuCount
        });
      }
    } else {
      console.log('❌ getPaymentById failed:', paymentByIdResponse.data);
    }

    // Step 5: Test getPaymentByOrderId endpoint
    console.log('\n5️⃣ Testing getPaymentByOrderId endpoint...');
    
    const paymentByOrderResponse = await axios.get(`${ORDER_SERVICE_URL}/api/payments/order/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentByOrderResponse.data.success) {
      console.log('✅ getPaymentByOrderId endpoint works');
      console.log('📋 Payments found:', paymentByOrderResponse.data.data.length);
      
      if (paymentByOrderResponse.data.data.length > 0) {
        const firstPayment = paymentByOrderResponse.data.data[0];
        console.log('📋 First Payment Summary:', {
          paymentId: firstPayment.paymentSummary?.paymentId,
          amount: firstPayment.paymentSummary?.amount,
          status: firstPayment.paymentSummary?.paymentStatus
        });
      }
    } else {
      console.log('❌ getPaymentByOrderId failed:', paymentByOrderResponse.data);
    }

    // Step 6: Test getPaymentDetails endpoint (list all payments)
    console.log('\n6️⃣ Testing getPaymentDetails endpoint...');
    
    const paymentDetailsResponse = await axios.get(`${ORDER_SERVICE_URL}/api/payments?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentDetailsResponse.data.success) {
      console.log('✅ getPaymentDetails endpoint works');
      console.log('📋 Total payments:', paymentDetailsResponse.data.data.pagination.totalItems);
      console.log('📋 Payments in current page:', paymentDetailsResponse.data.data.data.length);
    } else {
      console.log('❌ getPaymentDetails failed:', paymentDetailsResponse.data);
    }

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('📊 Status:', error.response?.status);
    console.log('📊 Data:', error.response?.data);
    console.log('📊 Message:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Payment Endpoints Tests...\n');
  
  await testPaymentEndpoints();
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
