const axios = require('axios');

// Configuration
const SERVICES = {
  product: {
    baseUrl: 'http://localhost:5002/api/reports',
    name: 'Product Service'
  },
  user: {
    baseUrl: 'http://localhost:5001/api/reports',
    name: 'User Service'
  },
  order: {
    baseUrl: 'http://localhost:5003/api/reports',
    name: 'Order Service'
  }
};

const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test scenarios for each service
const testScenarios = {
  product: [
    {
      name: "Product Analytics Report",
      endpoint: "/analytics",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        brand: "Test Brand",
        category: "Bike Accessories",
        subCategory: "Brake Parts",
        model: "Test Model",
        variant: "Standard",
        status: "Approved",
        qcStatus: "Approved",
        liveStatus: "Active",
        productType: "Spare Parts",
        isUniversal: "true",
        isConsumable: "false",
        minPrice: "100",
        maxPrice: "10000",
        createdBy: "test-user",
        createdByRole: "Super-admin",
        groupBy: "brand",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Product Performance Report",
      endpoint: "/performance",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        brand: "Test Brand",
        category: "Bike Accessories",
        subCategory: "Brake Parts",
        model: "Test Model",
        variant: "Standard",
        status: "Approved",
        productType: "Spare Parts",
        minPrice: "100",
        maxPrice: "10000",
        sortBy: "totalValue",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Product Inventory Report",
      endpoint: "/inventory",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        brand: "Test Brand",
        category: "Bike Accessories",
        subCategory: "Brake Parts",
        model: "Test Model",
        variant: "Standard",
        status: "Approved",
        qcStatus: "Approved",
        liveStatus: "Active",
        productType: "Spare Parts",
        isUniversal: "true",
        isConsumable: "false",
        minPrice: "100",
        maxPrice: "10000",
        createdBy: "test-user",
        createdByRole: "Super-admin",
        groupBy: "status",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Product Category Report",
      endpoint: "/category",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        category: "Bike Accessories",
        subCategory: "Brake Parts",
        brand: "Test Brand",
        model: "Test Model",
        variant: "Standard",
        status: "Approved",
        productType: "Spare Parts",
        minPrice: "100",
        maxPrice: "10000",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Product Brand Report",
      endpoint: "/brand",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        brand: "Test Brand",
        category: "Bike Accessories",
        subCategory: "Brake Parts",
        model: "Test Model",
        variant: "Standard",
        status: "Approved",
        productType: "Spare Parts",
        minPrice: "100",
        maxPrice: "10000",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Product Export Report",
      endpoint: "/export",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        brand: "Test Brand",
        category: "Bike Accessories",
        subCategory: "Brake Parts",
        model: "Test Model",
        variant: "Standard",
        status: "Approved",
        qcStatus: "Approved",
        liveStatus: "Active",
        productType: "Spare Parts",
        isUniversal: "true",
        isConsumable: "false",
        minPrice: "100",
        maxPrice: "10000",
        createdBy: "test-user",
        createdByRole: "Super-admin",
        format: "json",
        fields: "all"
      }
    }
  ],
  user: [
    {
      name: "User Analytics Report",
      endpoint: "/analytics",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        role: "Super-admin",
        status: "Active",
        isActive: "true",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        createdBy: "test-user",
        groupBy: "role",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Dealer Analytics Report",
      endpoint: "/dealers",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "Active",
        isActive: "true",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        categoriesAllowed: "68a041de1e140480128866e6,68a041de1e140480128866e7",
        createdBy: "test-user",
        groupBy: "status",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Employee Analytics Report",
      endpoint: "/employees",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "Active",
        isActive: "true",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        assignedDealers: "6877611b3fb93eecfd9f57bb,6877611b3fb93eecfd9f57bc",
        createdBy: "test-user",
        groupBy: "status",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "User Performance Report",
      endpoint: "/performance",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        role: "Super-admin",
        status: "Active",
        isActive: "true",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        createdBy: "test-user",
        sortBy: "lastLogin",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "User Export Report",
      endpoint: "/export",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        role: "Super-admin",
        status: "Active",
        isActive: "true",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        createdBy: "test-user",
        format: "json",
        fields: "all"
      }
    }
  ],
  order: [
    {
      name: "Order Analytics Report",
      endpoint: "/analytics",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "Delivered",
        orderType: "Online",
        paymentType: "COD",
        orderSource: "Web",
        deliveryType: "standard",
        typeOfDelivery: "Express",
        minAmount: "100",
        maxAmount: "10000",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        groupBy: "status",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Sales Analytics Report",
      endpoint: "/sales",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "Delivered",
        orderType: "Online",
        paymentType: "COD",
        orderSource: "Web",
        deliveryType: "standard",
        typeOfDelivery: "Express",
        minAmount: "100",
        maxAmount: "10000",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        groupBy: "date",
        sortBy: "totalAmount",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Order Performance Report",
      endpoint: "/performance",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "Delivered",
        orderType: "Online",
        paymentType: "COD",
        orderSource: "Web",
        deliveryType: "standard",
        typeOfDelivery: "Express",
        minAmount: "100",
        maxAmount: "10000",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        sortBy: "orderAmount",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Picklist Analytics Report",
      endpoint: "/picklists",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "Completed",
        orderType: "Online",
        paymentType: "COD",
        orderSource: "Web",
        deliveryType: "standard",
        typeOfDelivery: "Express",
        minAmount: "100",
        maxAmount: "10000",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        groupBy: "status",
        sortBy: "count",
        sortOrder: "desc",
        limit: "50"
      }
    },
    {
      name: "Order Export Report",
      endpoint: "/export",
      params: {
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        status: "Delivered",
        orderType: "Online",
        paymentType: "COD",
        orderSource: "Web",
        deliveryType: "standard",
        typeOfDelivery: "Express",
        minAmount: "100",
        maxAmount: "10000",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        format: "json",
        fields: "all"
      }
    }
  ]
};

// Function to make API request
async function makeRequest(service, scenario) {
  try {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`📡 ${service.name} - ${scenario.endpoint}`);
    console.log(`🔗 URL: ${service.baseUrl}${scenario.endpoint}`);
    
    if (scenario.params) {
      console.log(`📋 Parameters:`, JSON.stringify(scenario.params, null, 2));
    }

    const config = {
      method: 'GET',
      url: `${service.baseUrl}${scenario.endpoint}`,
      params: scenario.params,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };

    const response = await axios(config);

    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response Summary:`);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      
      // Display summary information
      if (data.summary) {
        console.log(`   📈 Summary:`);
        Object.entries(data.summary).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            console.log(`      ${key}:`, JSON.stringify(value, null, 2));
          } else {
            console.log(`      ${key}: ${value}`);
          }
        });
      }
      
      // Display main data
      if (data.analytics || data.performance || data.inventory || data.categoryReport || data.brandReport || data.salesAnalytics || data.users || data.orders) {
        const mainData = data.analytics || data.performance || data.inventory || data.categoryReport || data.brandReport || data.salesAnalytics || data.users || data.orders;
        if (Array.isArray(mainData)) {
          console.log(`   📊 Records: ${mainData.length}`);
          if (mainData.length > 0) {
            console.log(`   🔍 Sample Record:`, JSON.stringify(mainData[0], null, 2));
          }
        } else if (mainData && typeof mainData === 'object') {
          console.log(`   📊 Data:`, JSON.stringify(mainData, null, 2));
        }
      }
      
      // Display filters
      if (data.filters) {
        console.log(`   🔧 Applied Filters:`, JSON.stringify(data.filters, null, 2));
      }
      
    } else {
      console.log(`❌ Unexpected response format:`, response.data);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Function to run all tests for a service
async function runServiceTests(serviceName) {
  const service = SERVICES[serviceName];
  if (!service) {
    console.log(`❌ Unknown service: ${serviceName}`);
    return;
  }

  console.log(`\n🚀 Testing ${service.name} Reporting Endpoints`);
  console.log('=' .repeat(80));
  
  const scenarios = testScenarios[serviceName];
  if (!scenarios || scenarios.length === 0) {
    console.log(`❌ No test scenarios found for ${serviceName}`);
    return;
  }

  for (const scenario of scenarios) {
    await makeRequest(service, scenario);
    console.log('-'.repeat(80));
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n✅ ${service.name} tests completed!`);
}

// Function to run all tests
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Reporting API Tests');
  console.log('=' .repeat(80));
  
  for (const serviceName of Object.keys(SERVICES)) {
    await runServiceTests(serviceName);
    console.log('\n' + '=' .repeat(80));
  }
  
  console.log('\n✅ All reporting API tests completed!');
}

// Function to run specific test
async function runSpecificTest(serviceName, testName) {
  const service = SERVICES[serviceName];
  if (!service) {
    console.log(`❌ Unknown service: ${serviceName}`);
    return;
  }

  const scenarios = testScenarios[serviceName];
  if (!scenarios) {
    console.log(`❌ No test scenarios found for ${serviceName}`);
    return;
  }

  const scenario = scenarios.find(s => s.name === testName);
  if (!scenario) {
    console.log(`❌ Test "${testName}" not found for ${serviceName}. Available tests:`);
    scenarios.forEach((s, index) => {
      console.log(`   ${index + 1}. ${s.name}`);
    });
    return;
  }

  console.log('🚀 Running Specific Test');
  console.log('=' .repeat(80));
  await makeRequest(service, scenario);
}

// Function to display help
function displayHelp() {
  console.log(`
🚀 Comprehensive Reporting API Test Script

Usage:
  node test-comprehensive-reporting-endpoints.js [options]

Options:
  --all                    Run all tests (default)
  --service <name>         Run tests for specific service (product, user, order)
  --test <service> <name>  Run specific test by name
  --help                   Show this help message

Services:
  - product: Product Service reporting endpoints
  - user: User Service reporting endpoints  
  - order: Order Service reporting endpoints

Examples:
  node test-comprehensive-reporting-endpoints.js
  node test-comprehensive-reporting-endpoints.js --all
  node test-comprehensive-reporting-endpoints.js --service product
  node test-comprehensive-reporting-endpoints.js --service user
  node test-comprehensive-reporting-endpoints.js --service order
  node test-comprehensive-reporting-endpoints.js --test product "Product Analytics Report"
  node test-comprehensive-reporting-endpoints.js --test user "User Analytics Report"
  node test-comprehensive-reporting-endpoints.js --test order "Order Analytics Report"

Note: Make sure to update AUTH_TOKEN in the script with your actual authentication token.
  `);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    displayHelp();
    return;
  }
  
  if (args.includes('--service')) {
    const serviceIndex = args.indexOf('--service');
    const serviceName = args[serviceIndex + 1];
    if (serviceName) {
      await runServiceTests(serviceName);
    } else {
      console.log('❌ Please specify a service name after --service');
      console.log('Available services: product, user, order');
    }
    return;
  }
  
  if (args.includes('--test')) {
    const testIndex = args.indexOf('--test');
    const serviceName = args[testIndex + 1];
    const testName = args.slice(testIndex + 2).join(' ');
    if (serviceName && testName) {
      await runSpecificTest(serviceName, testName);
    } else {
      console.log('❌ Please specify service name and test name after --test');
    }
    return;
  }
  
  // Default: run all tests
  await runAllTests();
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Promise Rejection:', error);
  process.exit(1);
});

// Run the tests
main().catch(console.error);
