const axios = require('axios');

const BASE_URL = 'http://localhost:5002'; // Product service URL

async function testPaginationFix() {
  console.log('🧪 Testing pagination fix for getProductsByFilters...\n');

  const testCases = [
    { page: '0', description: 'Page 0 (should return first page)' },
    { page: '1', description: 'Page 1 (first page)' },
    { page: '2', description: 'Page 2 (second page)' },
    { page: '', description: 'Empty page (should default to page 1)' },
    { page: 'invalid', description: 'Invalid page (should default to page 1)' },
    { page: '-1', description: 'Negative page (should default to page 1)' }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.description}`);
      console.log(`🔗 URL: GET /api/products/filters?page=${testCase.page}&limit=5`);
      
      const response = await axios.get(`${BASE_URL}/api/products/filters`, {
        params: {
          page: testCase.page,
          limit: 5
        },
        timeout: 10000
      });

      if (response.data.success) {
        const { products, pagination } = response.data.data;
        console.log(`✅ SUCCESS - Products: ${products.length}, Current Page: ${pagination.currentPage}, Total Pages: ${pagination.totalPages}`);
        
        // Verify that page 0 returns the same as page 1
        if (testCase.page === '0' && pagination.currentPage === 1) {
          console.log(`✅ Page 0 correctly mapped to page 1`);
        }
        
        // Verify that invalid pages default to page 1
        if ((testCase.page === 'invalid' || testCase.page === '-1' || testCase.page === '') && pagination.currentPage === 1) {
          console.log(`✅ Invalid page correctly defaulted to page 1`);
        }
        
        // Verify products are returned
        if (products.length > 0) {
          console.log(`✅ Products returned successfully`);
        } else {
          console.log(`⚠️  No products returned (this might be expected for higher page numbers)`);
        }
      } else {
        console.log(`❌ FAILED - ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ERROR - ${error.response?.data?.message || error.message}`);
    }
    
    console.log('─'.repeat(60));
  }

  // Test specific edge case: page=0 with different limits
  console.log('\n🔍 Testing page=0 with different limits...');
  const limits = [1, 5, 10];
  
  for (const limit of limits) {
    try {
      const response = await axios.get(`${BASE_URL}/api/products/filters`, {
        params: {
          page: '0',
          limit: limit
        },
        timeout: 10000
      });

      if (response.data.success) {
        const { products, pagination } = response.data.data;
        console.log(`✅ Limit ${limit}: Products: ${products.length}, Page: ${pagination.currentPage}, Skip: ${(pagination.currentPage - 1) * limit}`);
      }
    } catch (error) {
      console.log(`❌ Limit ${limit}: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Run the test
testPaginationFix().catch(console.error);
