const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust if needed
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

async function testProductStatusFiltering() {
  console.log('🧪 Testing Product Status Filtering...\n');

  const testCases = [
    {
      name: 'All Statuses',
      params: { status: 'all' },
      expected: 'Should return products with any status'
    },
    {
      name: 'Pending Status Only',
      params: { status: 'Pending' },
      expected: 'Should return only pending products'
    },
    {
      name: 'Approved Status Only',
      params: { status: 'Approved' },
      expected: 'Should return only approved products'
    },
    {
      name: 'Rejected Status Only',
      params: { status: 'Rejected' },
      expected: 'Should return only rejected products'
    },
    {
      name: 'Created Status Only',
      params: { status: 'Created' },
      expected: 'Should return only created products'
    },
    {
      name: 'Live Status Only',
      params: { status: 'Live' },
      expected: 'Should return only live products'
    },
    {
      name: 'Multiple Statuses',
      params: { status: 'Pending,Approved' },
      expected: 'Should return products with either pending or approved status'
    },
    {
      name: 'No Status Filter (Default)',
      params: {},
      expected: 'Should return only approved and live products'
    },
    {
      name: 'Status with Other Filters',
      params: { 
        status: 'Pending',
        limit: 5,
        page: 1
      },
      expected: 'Should return pending products with pagination'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📋 Testing: ${testCase.name}`);
      console.log(`🎯 Expected: ${testCase.expected}`);
      
      const response = await axios.get(`${BASE_URL}/api/category/products/filter`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: testCase.params,
        timeout: 10000
      });

      const { products, pagination } = response.data.data;
      
      console.log(`✅ Success: Found ${products.length} products`);
      console.log(`📊 Pagination: ${pagination.totalItems} total items, ${pagination.totalPages} pages`);
      
      // Show status distribution
      const statusCount = {};
      products.forEach(product => {
        const status = product.live_status || 'Unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      
      console.log(`📈 Status Distribution:`, statusCount);
      
      // Validate results based on test case
      if (testCase.params.status === 'all') {
        console.log(`✅ Validation: All statuses allowed - ${Object.keys(statusCount).length} different statuses found`);
      } else if (testCase.params.status && testCase.params.status !== 'all') {
        const expectedStatuses = testCase.params.status.includes(',') 
          ? testCase.params.status.split(',').map(s => s.trim())
          : [testCase.params.status];
        
        const actualStatuses = Object.keys(statusCount);
        const isValid = actualStatuses.every(status => expectedStatuses.includes(status));
        
        if (isValid) {
          console.log(`✅ Validation: All products have expected statuses`);
        } else {
          console.log(`⚠️  Warning: Found unexpected statuses: ${actualStatuses.join(', ')}`);
        }
      } else {
        // Default case - should only have Approved or Live
        const validStatuses = ['Approved', 'Live'];
        const actualStatuses = Object.keys(statusCount);
        const isValid = actualStatuses.every(status => validStatuses.includes(status));
        
        if (isValid) {
          console.log(`✅ Validation: Default filter working correctly`);
        } else {
          console.log(`⚠️  Warning: Default filter found unexpected statuses: ${actualStatuses.join(', ')}`);
        }
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error in ${testCase.name}:`, error.response?.data?.message || error.message);
      console.log('---\n');
    }
  }
}

async function testSpecificStatuses() {
  console.log('🔍 Testing Specific Status Scenarios...\n');

  const scenarios = [
    {
      name: 'Pending Products for Approval',
      params: { status: 'Pending' },
      description: 'Get products that need approval'
    },
    {
      name: 'Rejected Products for Review',
      params: { status: 'Rejected' },
      description: 'Get products that were rejected'
    },
    {
      name: 'Live Products for Customers',
      params: { status: 'Live' },
      description: 'Get products available to customers'
    },
    {
      name: 'Pending and Created Products',
      params: { status: 'Pending,Created' },
      description: 'Get products in initial stages'
    }
  ];

  for (const scenario of scenarios) {
    try {
      console.log(`📋 Scenario: ${scenario.name}`);
      console.log(`📝 Description: ${scenario.description}`);
      
      const response = await axios.get(`${BASE_URL}/api/category/products/filter`, {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: scenario.params,
        timeout: 10000
      });

      const { products } = response.data.data;
      
      console.log(`✅ Found ${products.length} products`);
      
      if (products.length > 0) {
        console.log(`📋 Sample products:`);
        products.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.product_name} (${product.live_status})`);
        });
      }
      
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error in ${scenario.name}:`, error.response?.data?.message || error.message);
      console.log('---\n');
    }
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Product Status Filtering Tests...\n');
  
  await testProductStatusFiltering();
  await testSpecificStatuses();
  
  console.log('🏁 All tests completed!');
}

// Run if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testProductStatusFiltering, testSpecificStatuses };
