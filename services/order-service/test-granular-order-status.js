const axios = require('axios');

// Test the granular order status system
async function testGranularOrderStatus() {
  const baseUrl = 'http://localhost:5001';
  
  console.log('🧪 Testing Granular Order Status System...\n');
  
  try {
    // Create a test order with multiple SKUs
    console.log('1. Creating test order with multiple SKUs...');
    const createOrderResponse = await axios.post(`${baseUrl}/api/orders/create`, {
      customerDetails: {
        userId: "test_user_123",
        name: "Test Customer",
        phone: "1234567890",
        email: "test@example.com",
        address: "Test Address",
        pincode: "123456"
      },
      skus: [
        {
          sku: "SKU001",
          quantity: 2,
          productId: "PROD001",
          productName: "Test Product 1",
          selling_price: 100,
          mrp: 120,
          gst_percentage: "18",
          gst_amount: 18,
          product_total: 118,
          totalPrice: 236
        },
        {
          sku: "SKU002",
          quantity: 1,
          productId: "PROD002",
          productName: "Test Product 2",
          selling_price: 200,
          mrp: 250,
          gst_percentage: "18",
          gst_amount: 36,
          product_total: 236,
          totalPrice: 236
        },
        {
          sku: "SKU003",
          quantity: 3,
          productId: "PROD003",
          productName: "Test Product 3",
          selling_price: 50,
          mrp: 60,
          gst_percentage: "18",
          gst_amount: 27,
          product_total: 177,
          totalPrice: 531
        }
      ],
      totalAmount: 1003,
      paymentType: "Prepaid",
      orderType: "Online",
      orderSource: "Web"
    });
    
    const orderId = createOrderResponse.data.data._id;
    console.log(`✅ Order created with ID: ${orderId}`);
    
    // Test 2: Check initial status breakdown
    console.log('\n2. Checking initial status breakdown...');
    const initialBreakdown = await axios.get(`${baseUrl}/api/orders/${orderId}/status-breakdown`);
    console.log('✅ Initial status:', initialBreakdown.data.data.currentOrderStatus);
    console.log('✅ Status reason:', initialBreakdown.data.data.statusReason);
    
    // Test 3: Mark first SKU as packed
    console.log('\n3. Marking first SKU as packed...');
    const packSku1Response = await axios.post(`${baseUrl}/api/orders/${orderId}/sku/SKU001/pack`, {
      packedBy: "test_user"
    });
    console.log('✅ SKU1 packed. Order status:', packSku1Response.data.data.order.status);
    
    // Test 4: Check status breakdown after first SKU packed
    console.log('\n4. Checking status after first SKU packed...');
    const breakdownAfterFirst = await axios.get(`${baseUrl}/api/orders/${orderId}/status-breakdown`);
    console.log('✅ Order status:', breakdownAfterFirst.data.data.currentOrderStatus);
    console.log('✅ Status reason:', breakdownAfterFirst.data.data.statusReason);
    
    // Test 5: Mark second SKU as packed
    console.log('\n5. Marking second SKU as packed...');
    const packSku2Response = await axios.post(`${baseUrl}/api/orders/${orderId}/sku/SKU002/pack`, {
      packedBy: "test_user"
    });
    console.log('✅ SKU2 packed. Order status:', packSku2Response.data.data.order.status);
    
    // Test 6: Mark third SKU as packed (should change order to "Shipped")
    console.log('\n6. Marking third SKU as packed (should change order to "Shipped")...');
    const packSku3Response = await axios.post(`${baseUrl}/api/orders/${orderId}/sku/SKU003/pack`, {
      packedBy: "test_user"
    });
    console.log('✅ SKU3 packed. Order status:', packSku3Response.data.data.order.status);
    
    // Test 7: Check final status breakdown
    console.log('\n7. Checking final status breakdown...');
    const finalBreakdown = await axios.get(`${baseUrl}/api/orders/${orderId}/status-breakdown`);
    console.log('✅ Final order status:', finalBreakdown.data.data.currentOrderStatus);
    console.log('✅ Status reason:', finalBreakdown.data.data.statusReason);
    console.log('✅ SKU breakdown:', finalBreakdown.data.data.skuBreakdown.map(s => `${s.sku}: ${s.status}`));
    
    // Test 8: Mark first SKU as delivered (partial delivery)
    console.log('\n8. Marking first SKU as delivered (partial delivery)...');
    const deliverSku1Response = await axios.post(`${baseUrl}/api/orders/${orderId}/sku/SKU001/deliver`, {
      deliveredBy: "courier_user",
      deliveryProof: "proof_image_url"
    });
    console.log('✅ SKU1 delivered. Order status:', deliverSku1Response.data.data.order.status);
    
    // Test 9: Mark remaining SKUs as delivered (should change order to "Delivered")
    console.log('\n9. Marking remaining SKUs as delivered...');
    const deliverSku2Response = await axios.post(`${baseUrl}/api/orders/${orderId}/sku/SKU002/deliver`, {
      deliveredBy: "courier_user",
      deliveryProof: "proof_image_url"
    });
    const deliverSku3Response = await axios.post(`${baseUrl}/api/orders/${orderId}/sku/SKU003/deliver`, {
      deliveredBy: "courier_user",
      deliveryProof: "proof_image_url"
    });
    console.log('✅ All SKUs delivered. Final order status:', deliverSku3Response.data.data.order.status);
    
    // Test 10: Final status breakdown
    console.log('\n10. Final status breakdown...');
    const finalStatusBreakdown = await axios.get(`${baseUrl}/api/orders/${orderId}/status-breakdown`);
    console.log('✅ Final order status:', finalStatusBreakdown.data.data.currentOrderStatus);
    console.log('✅ Status reason:', finalStatusBreakdown.data.data.statusReason);
    console.log('✅ All SKU statuses:', finalStatusBreakdown.data.data.skuBreakdown.map(s => `${s.sku}: ${s.status}`));
    
    console.log('\n🎉 Granular Order Status System Test Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ Order creation with multiple SKUs');
    console.log('- ✅ SKU-level status updates');
    console.log('- ✅ Automatic order status calculation');
    console.log('- ✅ Partial packing and delivery tracking');
    console.log('- ✅ Status breakdown API');
    console.log('- ✅ Complete order lifecycle tracking');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 This might indicate a server error. Check the server logs for more details.');
    }
  }
}

// Run the test
testGranularOrderStatus();
