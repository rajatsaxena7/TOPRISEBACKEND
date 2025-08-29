const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5002'; // Product service URL
const TOKEN = 'YOUR_SUPER_ADMIN_JWT_TOKEN_HERE'; // Replace with actual token

/**
 * Test function to get products by dealerId
 */
async function testGetProductsByDealerId(dealerId) {
  try {
    console.log(`\n🧪 Testing getProductsByDealerId with dealerId: ${dealerId}`);
    
    const response = await axios.get(`${API_BASE_URL}/products/v1/get-products-by-dealer/${dealerId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success - Products by dealerId:');
    console.log(`📊 Found ${response.data.data.length} products`);
    console.log('📋 Products:', response.data.data.map(p => ({
      id: p._id,
      sku: p.sku_code,
      name: p.product_name,
      dealers: p.available_dealers?.length || 0
    })));

    return response.data;
  } catch (error) {
    console.error('❌ Error getting products by dealerId:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test function to get products by userId
 */
async function testGetProductsByUserId(userId) {
  try {
    console.log(`\n🧪 Testing getProductsByDealerId with userId: ${userId}`);
    
    const response = await axios.get(`${API_BASE_URL}/products/v1/get-products-by-dealer?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success - Products by userId:');
    console.log(`📊 Found ${response.data.data.length} products`);
    console.log('📋 Products:', response.data.data.map(p => ({
      id: p._id,
      sku: p.sku_code,
      name: p.product_name,
      dealers: p.available_dealers?.length || 0
    })));

    return response.data;
  } catch (error) {
    console.error('❌ Error getting products by userId:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test function to get products without any parameters (should return error)
 */
async function testGetProductsWithoutParameters() {
  try {
    console.log('\n🧪 Testing getProductsByDealerId without parameters (should fail)');
    
    const response = await axios.get(`${API_BASE_URL}/products/v1/get-products-by-dealer`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('❌ Unexpected success - should have failed');
    return response.data;
  } catch (error) {
    console.log('✅ Correctly failed - Error message:', error.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting tests for enhanced getProductByDealerId function...\n');

  // Test with dealerId
  await testGetProductsByDealerId('YOUR_TEST_DEALER_ID'); // Replace with actual dealer ID

  // Test with userId
  await testGetProductsByUserId('YOUR_TEST_USER_ID'); // Replace with actual user ID

  // Test without parameters (should fail)
  await testGetProductsWithoutParameters();

  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGetProductsByDealerId,
  testGetProductsByUserId,
  testGetProductsWithoutParameters,
  runTests
};
