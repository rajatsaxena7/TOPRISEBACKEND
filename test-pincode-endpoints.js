const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002/api/pincodes';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test data
const testPincode = {
    pincode: "110001",
    city: "New Delhi",
    state: "Delhi",
    district: "Central Delhi",
    area: "Connaught Place",
    delivery_available: true,
    delivery_charges: 50,
    estimated_delivery_days: 2,
    cod_available: true,
    status: "active",
    created_by: "test-user",
    updated_by: "test-user"
};

const bulkPincodes = [
    {
        pincode: "400001",
        city: "Mumbai",
        state: "Maharashtra",
        district: "Mumbai",
        area: "Fort",
        delivery_available: true,
        delivery_charges: 75,
        estimated_delivery_days: 3,
        cod_available: true,
        status: "active"
    },
    {
        pincode: "560001",
        city: "Bangalore",
        state: "Karnataka",
        district: "Bangalore Urban",
        area: "MG Road",
        delivery_available: true,
        delivery_charges: 60,
        estimated_delivery_days: 2,
        cod_available: true,
        status: "active"
    },
    {
        pincode: "600001",
        city: "Chennai",
        state: "Tamil Nadu",
        district: "Chennai",
        area: "Parrys",
        delivery_available: true,
        delivery_charges: 70,
        estimated_delivery_days: 4,
        cod_available: true,
        status: "active"
    }
];

// Test scenarios
const testScenarios = [
    {
        name: "Create a new pincode",
        method: "POST",
        url: BASE_URL,
        data: testPincode,
        requiresAuth: true
    },
    {
        name: "Get all pincodes",
        method: "GET",
        url: BASE_URL,
        requiresAuth: true
    },
    {
        name: "Get pincodes with search filter",
        method: "GET",
        url: `${BASE_URL}?search=Delhi`,
        requiresAuth: true
    },
    {
        name: "Get pincodes with city filter",
        method: "GET",
        url: `${BASE_URL}?city=Mumbai`,
        requiresAuth: true
    },
    {
        name: "Get pincodes with state filter",
        method: "GET",
        url: `${BASE_URL}?state=Delhi`,
        requiresAuth: true
    },
    {
        name: "Get pincodes with delivery available filter",
        method: "GET",
        url: `${BASE_URL}?delivery_available=true`,
        requiresAuth: true
    },
    {
        name: "Get pincodes with pagination",
        method: "GET",
        url: `${BASE_URL}?page=1&limit=5`,
        requiresAuth: true
    },
    {
        name: "Get pincodes with sorting",
        method: "GET",
        url: `${BASE_URL}?sortBy=city&sortOrder=asc`,
        requiresAuth: true
    },
    {
        name: "Check pincode availability (110001)",
        method: "GET",
        url: `${BASE_URL}/check/110001`,
        requiresAuth: false
    },
    {
        name: "Check pincode availability (999999)",
        method: "GET",
        url: `${BASE_URL}/check/999999`,
        requiresAuth: false
    },
    {
        name: "Check invalid pincode format",
        method: "GET",
        url: `${BASE_URL}/check/12345`,
        requiresAuth: false
    },
    {
        name: "Bulk create pincodes",
        method: "POST",
        url: `${BASE_URL}/bulk`,
        data: {
            pincodes: bulkPincodes,
            created_by: "test-user",
            updated_by: "test-user"
        },
        requiresAuth: true
    },
    {
        name: "Get pincode statistics",
        method: "GET",
        url: `${BASE_URL}/stats/overview`,
        requiresAuth: true
    },
    {
        name: "Get pincode statistics by state",
        method: "GET",
        url: `${BASE_URL}/stats/overview?state=Delhi`,
        requiresAuth: true
    }
];

// Function to make API request
async function makeRequest(scenario) {
    try {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        console.log(`📡 ${scenario.method} ${scenario.url}`);

        if (scenario.data) {
            console.log(`📋 Request Data:`, JSON.stringify(scenario.data, null, 2));
        }

        const config = {
            method: scenario.method,
            url: scenario.url,
            timeout: 30000
        };

        // Add headers
        config.headers = {
            'Content-Type': 'application/json'
        };

        if (scenario.requiresAuth) {
            config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
        }

        // Add data for POST requests
        if (scenario.data) {
            config.data = scenario.data;
        }

        const response = await axios(config);

        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Response Summary:`);

        if (response.data.success && response.data.data) {
            const data = response.data.data;

            if (scenario.name.includes("Check pincode")) {
                console.log(`   📍 Pincode: ${data.pincode}`);
                console.log(`   ✅ Available: ${data.available}`);
                console.log(`   📦 Delivery Available: ${data.delivery_available || 'N/A'}`);
                console.log(`   💰 Delivery Charges: ₹${data.delivery_charges || 'N/A'}`);
                console.log(`   📅 Estimated Days: ${data.estimated_delivery_days || 'N/A'}`);
                console.log(`   💳 COD Available: ${data.cod_available || 'N/A'}`);
                if (data.city) console.log(`   🏙️ City: ${data.city}, ${data.state}`);
            } else if (scenario.name.includes("statistics")) {
                console.log(`   📊 Total Pincodes: ${data.summary?.totalPincodes || 0}`);
                console.log(`   ✅ Active Pincodes: ${data.summary?.activePincodes || 0}`);
                console.log(`   📦 Delivery Available: ${data.summary?.deliveryAvailable || 0}`);
                console.log(`   💰 Avg Delivery Charges: ₹${Math.round(data.summary?.avgDeliveryCharges || 0)}`);
                console.log(`   📅 Avg Delivery Days: ${Math.round(data.summary?.avgDeliveryDays || 0)}`);
                console.log(`   🗺️ States: ${data.distribution?.byState?.length || 0}`);
                console.log(`   🏙️ Top Cities: ${data.distribution?.byCity?.length || 0}`);
            } else if (scenario.name.includes("Get all pincodes") || scenario.name.includes("filter")) {
                console.log(`   📍 Pincodes Found: ${data.pincodes?.length || 0}`);
                console.log(`   📄 Total Pages: ${data.pagination?.totalPages || 0}`);
                console.log(`   📊 Total Count: ${data.pagination?.totalPincodes || 0}`);
                if (data.pincodes && data.pincodes.length > 0) {
                    const sample = data.pincodes[0];
                    console.log(`   🔍 Sample: ${sample.pincode} - ${sample.city}, ${sample.state}`);
                }
            } else if (scenario.name.includes("Bulk create")) {
                console.log(`   📤 Submitted: ${data.totalSubmitted || 0}`);
                console.log(`   ✅ Valid: ${data.validPincodes || 0}`);
                console.log(`   💾 Inserted: ${data.insertedCount || 0}`);
                console.log(`   ❌ Errors: ${data.errorCount || 0}`);
                if (data.errors && data.errors.length > 0) {
                    console.log(`   🚨 Sample Error: ${data.errors[0].error}`);
                }
            } else if (scenario.name.includes("Create") || scenario.name.includes("Update")) {
                console.log(`   📍 Pincode: ${data.pincode}`);
                console.log(`   🏙️ Location: ${data.city}, ${data.state}`);
                console.log(`   📦 Delivery: ${data.delivery_available ? 'Available' : 'Not Available'}`);
                console.log(`   💰 Charges: ₹${data.delivery_charges}`);
                console.log(`   📅 Days: ${data.estimated_delivery_days}`);
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

// Function to run all tests
async function runAllTests() {
    console.log('🚀 Starting Pincode API Tests');
    console.log('='.repeat(80));

    for (const scenario of testScenarios) {
        await makeRequest(scenario);
        console.log('-'.repeat(80));

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ All pincode API tests completed!');
}

// Function to run specific test category
async function runCategoryTests(category) {
    const categoryScenarios = testScenarios.filter(s =>
        s.name.toLowerCase().includes(category.toLowerCase())
    );

    if (categoryScenarios.length > 0) {
        console.log(`🚀 Running ${category} Tests`);
        console.log('='.repeat(80));

        for (const scenario of categoryScenarios) {
            await makeRequest(scenario);
            console.log('-'.repeat(80));

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n✅ ${category} tests completed!`);
    } else {
        console.log(`❌ No tests found for category: ${category}`);
        console.log('Available categories: create, get, check, bulk, stats, filter');
    }
}

// Function to run specific test
async function runSpecificTest(testName) {
    const scenario = testScenarios.find(s => s.name === testName);
    if (scenario) {
        console.log('🚀 Running Specific Test');
        console.log('='.repeat(80));
        await makeRequest(scenario);
    } else {
        console.log(`❌ Test "${testName}" not found. Available tests:`);
        testScenarios.forEach((s, index) => {
            console.log(`   ${index + 1}. ${s.name}`);
        });
    }
}

// Function to display help
function displayHelp() {
    console.log(`
🚀 Pincode API Test Script

Usage:
  node test-pincode-endpoints.js [options]

Options:
  --all                    Run all tests (default)
  --category <name>        Run tests for specific category
  --test <name>            Run specific test by name
  --help                   Show this help message

Categories:
  - create: Create pincode tests
  - get: Get pincode tests
  - check: Check pincode availability tests
  - bulk: Bulk operations tests
  - stats: Statistics tests
  - filter: Filter and search tests

Examples:
  node test-pincode-endpoints.js
  node test-pincode-endpoints.js --all
  node test-pincode-endpoints.js --category create
  node test-pincode-endpoints.js --category check
  node test-pincode-endpoints.js --test "Check pincode availability (110001)"

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

    if (args.includes('--category')) {
        const categoryIndex = args.indexOf('--category');
        const categoryName = args[categoryIndex + 1];
        if (categoryName) {
            await runCategoryTests(categoryName);
        } else {
            console.log('❌ Please specify a category name after --category');
            console.log('Available categories: create, get, check, bulk, stats, filter');
        }
        return;
    }

    if (args.includes('--test')) {
        const testIndex = args.indexOf('--test');
        const testName = args.slice(testIndex + 1).join(' ');
        if (testName) {
            await runSpecificTest(testName);
        } else {
            console.log('❌ Please specify a test name after --test');
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
