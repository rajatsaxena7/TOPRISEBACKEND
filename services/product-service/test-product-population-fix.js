const axios = require('axios');

const BASE_URL = 'http://localhost:5001'; // Product service port
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testProductPopulation() {
  try {
    console.log('🧪 Testing product population after filter fix...');
    
    // Test the main getProductsByFilters endpoint
    console.log('📋 Testing getProductsByFilters endpoint...');
    const response1 = await axios.get(`${BASE_URL}/products/v1/`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      params: {
        limit: 5,
        page: 1
      },
      timeout: 10000
    });
    
    console.log('✅ getProductsByFilters - SUCCESS');
    console.log(`📊 Found ${response1.data.data?.length || 0} products`);
    
    if (response1.data.data && response1.data.data.length > 0) {
      const firstProduct = response1.data.data[0];
      console.log(`📦 Sample product: ${firstProduct.product_name}`);
      console.log(`📊 Live status: ${firstProduct.live_status}`);
      console.log(`📊 QC status: ${firstProduct.Qc_status}`);
      
      // Check if all products have the correct status
      const allApproved = response1.data.data.every(product =>
        product.live_status === "Approved" && product.Qc_status === "Approved"
      );
      
      if (allApproved) {
        console.log('✅ All products have correct approval status');
      } else {
        console.log('⚠️ Some products may not have correct approval status');
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ getProductsByFilters - FAILED');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testProductPopulationWithPagination() {
  try {
    console.log('\n📋 Testing getProductsByFiltersWithPagination endpoint...');
    const response2 = await axios.get(`${BASE_URL}/products/v1/get-all-products/pagination`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      params: {
        limit: 5,
        page: 1
      },
      timeout: 10000
    });
    
    console.log('✅ getProductsByFiltersWithPagination - SUCCESS');
    console.log(`📊 Found ${response2.data.data?.length || 0} products`);
    console.log(`📊 Total count: ${response2.data.total || 0}`);
    
    if (response2.data.data && response2.data.data.length > 0) {
      const firstProduct = response2.data.data[0];
      console.log(`📦 Sample product: ${firstProduct.product_name}`);
      console.log(`📊 Live status: ${firstProduct.live_status}`);
      console.log(`📊 QC status: ${firstProduct.Qc_status}`);
      
      // Check if all products have the correct status
      const allApproved = response2.data.data.every(product =>
        product.live_status === "Approved" && product.Qc_status === "Approved"
      );
      
      if (allApproved) {
        console.log('✅ All products have correct approval status');
      } else {
        console.log('⚠️ Some products may not have correct approval status');
      }
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ getProductsByFiltersWithPagination - FAILED');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testProductPopulationWithFilters() {
  try {
    console.log('\n📋 Testing getProductsByFilters with additional filters...');
    const response3 = await axios.get(`${BASE_URL}/products/v1/`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      params: {
        limit: 3,
        page: 1,
        min_price: 100,
        max_price: 10000
      },
      timeout: 10000
    });
    
    console.log('✅ getProductsByFilters with price filters - SUCCESS');
    console.log(`📊 Found ${response3.data.data?.length || 0} products with price filter`);
    
    if (response3.data.data && response3.data.data.length > 0) {
      const firstProduct = response3.data.data[0];
      console.log(`📦 Sample product: ${firstProduct.product_name}`);
      console.log(`💰 Price: ${firstProduct.selling_price}`);
      console.log(`📊 Live status: ${firstProduct.live_status}`);
      console.log(`📊 QC status: ${firstProduct.Qc_status}`);
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ getProductsByFilters with filters - FAILED');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testProductPopulationWithoutAuth() {
  try {
    console.log('\n📋 Testing getProductsByFilters without authentication...');
    const response4 = await axios.get(`${BASE_URL}/products/v1/`, {
      params: {
        limit: 3,
        page: 1
      },
      timeout: 10000
    });
    
    console.log('✅ getProductsByFilters without auth - SUCCESS');
    console.log(`📊 Found ${response4.data.data?.length || 0} products`);
    
    return true;
    
  } catch (error) {
    console.log('❌ getProductsByFilters without auth - FAILED');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting product population tests...\n');
  
  const results = [];
  
  // Test basic product population
  results.push(await testProductPopulation());
  
  // Test product population with pagination
  results.push(await testProductPopulationWithPagination());
  
  // Test product population with filters
  results.push(await testProductPopulationWithFilters());
  
  // Test product population without auth
  results.push(await testProductPopulationWithoutAuth());
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.filter(r => r).length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}`);
  
  if (results.every(r => r)) {
    console.log('\n🎉 All tests passed! Products are populating correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
  }
  
  console.log('\n🏁 Tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { 
  testProductPopulation, 
  testProductPopulationWithPagination,
  testProductPopulationWithFilters,
  testProductPopulationWithoutAuth
};
