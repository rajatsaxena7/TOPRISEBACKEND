const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5002/api';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test scenarios for all model count endpoints
const testScenarios = [
    // Brand Count Tests
    {
        name: "Get all brand counts",
        url: `${BASE_URL}/brands/count`,
        params: {}
    },
    {
        name: "Get brand counts by status (active)",
        url: `${BASE_URL}/brands/count`,
        params: { status: 'active' }
    },
    {
        name: "Get brand counts by status (inactive)",
        url: `${BASE_URL}/brands/count`,
        params: { status: 'inactive' }
    },
    {
        name: "Get brand counts by type",
        url: `${BASE_URL}/brands/count`,
        params: { type: 'TYPE_ID_HERE' } // Replace with actual type ID
    },
    {
        name: "Get featured brands count",
        url: `${BASE_URL}/brands/count`,
        params: { featured_brand: 'true' }
    },
    {
        name: "Get non-featured brands count",
        url: `${BASE_URL}/brands/count`,
        params: { featured_brand: 'false' }
    },

    // Category Count Tests
    {
        name: "Get all category counts",
        url: `${BASE_URL}/categories/count`,
        params: {}
    },
    {
        name: "Get category counts by status (Active)",
        url: `${BASE_URL}/categories/count`,
        params: { category_Status: 'Active' }
    },
    {
        name: "Get category counts by status (Inactive)",
        url: `${BASE_URL}/categories/count`,
        params: { category_Status: 'Inactive' }
    },
    {
        name: "Get category counts by type",
        url: `${BASE_URL}/categories/count`,
        params: { type: 'TYPE_ID_HERE' } // Replace with actual type ID
    },
    {
        name: "Get main categories count",
        url: `${BASE_URL}/categories/count`,
        params: { main_category: 'true' }
    },
    {
        name: "Get sub categories count",
        url: `${BASE_URL}/categories/count`,
        params: { main_category: 'false' }
    },

    // SubCategory Count Tests
    {
        name: "Get all subcategory counts",
        url: `${BASE_URL}/subcategories/count`,
        params: {}
    },
    {
        name: "Get subcategory counts by status (Active)",
        url: `${BASE_URL}/subcategories/count`,
        params: { subcategory_status: 'Active' }
    },
    {
        name: "Get subcategory counts by status (Inactive)",
        url: `${BASE_URL}/subcategories/count`,
        params: { subcategory_status: 'Inactive' }
    },
    {
        name: "Get subcategory counts by category",
        url: `${BASE_URL}/subcategories/count`,
        params: { category_ref: 'CATEGORY_ID_HERE' } // Replace with actual category ID
    },

    // Variant Count Tests
    {
        name: "Get all variant counts",
        url: `${BASE_URL}/variants/count`,
        params: {}
    },
    {
        name: "Get variant counts by status (active)",
        url: `${BASE_URL}/variants/count`,
        params: { variant_status: 'active' }
    },
    {
        name: "Get variant counts by status (inactive)",
        url: `${BASE_URL}/variants/count`,
        params: { variant_status: 'inactive' }
    },
    {
        name: "Get variant counts by model",
        url: `${BASE_URL}/variants/count`,
        params: { model: 'MODEL_ID_HERE' } // Replace with actual model ID
    }
];

// Function to make API request
async function makeRequest(scenario) {
    try {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        console.log(`📡 URL: ${scenario.url}`);
        console.log(`📋 Params:`, JSON.stringify(scenario.params, null, 2));

        const response = await axios.get(scenario.url, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            },
            params: scenario.params,
            timeout: 30000
        });

        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Response Summary:`);

        if (response.data.success && response.data.data) {
            const data = response.data.data;

            // Display summary
            if (data.summary) {
                console.log(`   📈 Total Count: ${Object.values(data.summary)[0] || 0}`);
            }

            // Display breakdowns
            if (data.breakdown) {
                console.log(`   📋 Breakdowns:`);

                Object.entries(data.breakdown).forEach(([key, breakdown]) => {
                    console.log(`      ${key}:`);
                    breakdown.forEach(item => {
                        const label = item.status || item.type || item.category || item.model || item.year || item.featured || item.categoryType || 'Unknown';
                        console.log(`         ${label}: ${item.count} (${item.percentage}%)`);
                    });
                });
            }

            // Display filters
            if (data.filters) {
                console.log(`   🔧 Filters Applied:`);
                Object.entries(data.filters).forEach(([key, value]) => {
                    console.log(`      ${key}: ${value || 'All'}`);
                });
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
    console.log('🚀 Starting Model Count Endpoints API Tests');
    console.log('='.repeat(80));

    for (const scenario of testScenarios) {
        await makeRequest(scenario);
        console.log('-'.repeat(80));

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ All tests completed!');
}

// Function to run tests for specific model
async function runModelTests(modelName) {
    const modelScenarios = testScenarios.filter(s =>
        s.url.includes(`/${modelName.toLowerCase()}s/count`)
    );

    if (modelScenarios.length > 0) {
        console.log(`🚀 Running ${modelName} Count Tests`);
        console.log('='.repeat(80));

        for (const scenario of modelScenarios) {
            await makeRequest(scenario);
            console.log('-'.repeat(80));

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n✅ ${modelName} tests completed!`);
    } else {
        console.log(`❌ No tests found for model: ${modelName}`);
        console.log('Available models: brand, category, subcategory, variant');
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
🚀 Model Count Endpoints Test Script

Usage:
  node test-model-count-endpoints.js [options]

Options:
  --all                    Run all tests (default)
  --model <name>           Run tests for specific model (brand, category, subcategory, variant)
  --test <name>            Run specific test by name
  --help                   Show this help message

Examples:
  node test-model-count-endpoints.js
  node test-model-count-endpoints.js --all
  node test-model-count-endpoints.js --model brand
  node test-model-count-endpoints.js --model category
  node test-model-count-endpoints.js --test "Get all brand counts"

Available Models:
  - brand: Brand count endpoints
  - category: Category count endpoints  
  - subcategory: SubCategory count endpoints
  - variant: Variant count endpoints

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

    if (args.includes('--model')) {
        const modelIndex = args.indexOf('--model');
        const modelName = args[modelIndex + 1];
        if (modelName) {
            await runModelTests(modelName);
        } else {
            console.log('❌ Please specify a model name after --model');
            console.log('Available models: brand, category, subcategory, variant');
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
