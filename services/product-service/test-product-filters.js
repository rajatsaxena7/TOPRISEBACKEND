const axios = require('axios');

const BASE_URL = 'http://localhost:5002'; // Product service port

// Test the getProductsByFilters endpoint
async function testGetProductsByFilters() {
  try {
    console.log('🧪 Testing getProductsByFilters endpoint...');
    
    const response = await axios.get(`${BASE_URL}/api/products/`, {
      params: {
        limit: 5,
        page: 1
      },
      timeout: 10000
    });
    
    console.log('✅ getProductsByFilters - SUCCESS');
    console.log('Status:', response.status);
    console.log('Total Products:', response.data?.data?.pagination?.totalItems || 0);
    console.log('Products Returned:', response.data?.data?.products?.length || 0);
    
    // Check if all returned products are approved
    const products = response.data?.data?.products || [];
    const allApproved = products.every(product => 
      product.live_status === "Approved" && product.Qc_status === "Approved"
    );
    
    if (allApproved) {
      console.log('✅ All products are approved and QC approved');
    } else {
      console.log('❌ Some products are not approved');
      products.forEach((product, index) => {
        if (product.live_status !== "Approved" || product.Qc_status !== "Approved") {
          console.log(`  Product ${index + 1}: live_status=${product.live_status}, Qc_status=${product.Qc_status}`);
        }
      });
    }
    
    return allApproved;
  } catch (error) {
    console.log('❌ getProductsByFilters - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test the getProductsByFiltersWithPagination endpoint
async function testGetProductsByFiltersWithPagination() {
  try {
    console.log('🧪 Testing getProductsByFiltersWithPagination endpoint...');
    
    const response = await axios.get(`${BASE_URL}/api/products/get-all-products/pagination`, {
      params: {
        limit: 5,
        page: 1
      },
      timeout: 10000
    });
    
    console.log('✅ getProductsByFiltersWithPagination - SUCCESS');
    console.log('Status:', response.status);
    console.log('Total Products:', response.data?.data?.pagination?.totalItems || 0);
    console.log('Products Returned:', response.data?.data?.products?.length || 0);
    
    // Check if all returned products are approved
    const products = response.data?.data?.products || [];
    const allApproved = products.every(product => 
      product.live_status === "Approved" && product.Qc_status === "Approved"
    );
    
    if (allApproved) {
      console.log('✅ All products are approved and QC approved');
    } else {
      console.log('❌ Some products are not approved');
      products.forEach((product, index) => {
        if (product.live_status !== "Approved" || product.Qc_status !== "Approved") {
          console.log(`  Product ${index + 1}: live_status=${product.live_status}, Qc_status=${product.Qc_status}`);
        }
      });
    }
    
    return allApproved;
  } catch (error) {
    console.log('❌ getProductsByFiltersWithPagination - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Test with additional filters
async function testWithAdditionalFilters() {
  try {
    console.log('🧪 Testing with additional filters (brand, category, etc.)...');
    
    const response = await axios.get(`${BASE_URL}/api/products/`, {
      params: {
        limit: 3,
        page: 1,
        is_universal: 'false',
        is_consumable: 'false'
      },
      timeout: 10000
    });
    
    console.log('✅ Additional filters test - SUCCESS');
    console.log('Status:', response.status);
    console.log('Products Returned:', response.data?.data?.products?.length || 0);
    
    // Check if all returned products are approved
    const products = response.data?.data?.products || [];
    const allApproved = products.every(product => 
      product.live_status === "Approved" && product.Qc_status === "Approved"
    );
    
    if (allApproved) {
      console.log('✅ All products with additional filters are approved and QC approved');
    } else {
      console.log('❌ Some products with additional filters are not approved');
    }
    
    return allApproved;
  } catch (error) {
    console.log('❌ Additional filters test - FAILED');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Product Filters Test...\n');
  
  const results = [];
  
  // Test getProductsByFilters
  results.push(await testGetProductsByFilters());
  console.log('');
  
  // Test getProductsByFiltersWithPagination
  results.push(await testGetProductsByFiltersWithPagination());
  console.log('');
  
  // Test with additional filters
  results.push(await testWithAdditionalFilters());
  console.log('');
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Product filters are working correctly.');
    console.log('\n✅ Only approved products are shown!');
    console.log('✅ Only QC approved products are shown!');
    console.log('✅ Filters work with additional parameters!');
    console.log('✅ Both endpoints respect the approval filters!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
  
  return passed === total;
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
