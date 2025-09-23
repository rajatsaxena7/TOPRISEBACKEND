const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5002'; // Adjust port as needed
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual token

// Test data for creating a product
const testProductData = {
    product_name: "Test Product",
    manufacturer_part_name: "TP001",
    category: "your-category-id-here", // Replace with actual category ID
    sub_category: "your-subcategory-id-here", // Replace with actual subcategory ID
    brand: "your-brand-id-here", // Replace with actual brand ID
    model: "your-model-id-here", // Replace with actual model ID
    variant: ["your-variant-id-here"], // Replace with actual variant ID
    product_type: "OEM",
    make: ["Test Make"],
    year_range: ["your-year-id-here"], // Replace with actual year ID
    is_universal: false,
    is_consumable: false,
    fitment_notes: "Test fitment notes",
    key_specifications: "Test specifications",
    admin_notes: "Test admin notes",
    // Note: sku_code is NOT included - it should be generated automatically
};

async function testSKUGeneration() {
    try {
        console.log('🧪 Testing automatic SKU generation...\n');

        // Test 1: Create product without SKU
        console.log('📝 Test 1: Creating product without providing SKU...');
        const response = await axios.post(`${BASE_URL}/api/products/createProduct`, testProductData, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            const product = response.data.data;
            console.log('✅ Product created successfully!');
            console.log(`📦 Generated SKU: ${product.sku_code}`);

            // Validate SKU format
            const skuRegex = /^TOP[TF]\d{7}$/;
            if (skuRegex.test(product.sku_code)) {
                console.log('✅ SKU format is correct (TOPT/F followed by 7 digits)');

                // Determine vehicle type from SKU
                const vehicleType = product.sku_code[3] === 'T' ? 'Two-wheeler' : 'Four-wheeler';
                console.log(`🚗 Vehicle type: ${vehicleType}`);
            } else {
                console.log('❌ SKU format is incorrect');
                console.log(`Expected format: TOP[T|F]XXXXXXX`);
                console.log(`Actual SKU: ${product.sku_code}`);
            }
        } else {
            console.log('❌ Product creation failed:', response.data.message);
        }

        // Test 2: Create another product to verify incrementing
        console.log('\n📝 Test 2: Creating another product to verify SKU increment...');
        const testProductData2 = {
            ...testProductData,
            product_name: "Test Product 2",
            manufacturer_part_name: "TP002"
        };

        const response2 = await axios.post(`${BASE_URL}/api/products/createProduct`, testProductData2, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response2.data.success) {
            const product2 = response2.data.data;
            console.log('✅ Second product created successfully!');
            console.log(`📦 Generated SKU: ${product2.sku_code}`);

            // Check if SKU is incremented
            const firstSku = response.data.data.sku_code;
            const secondSku = product2.sku_code;

            if (firstSku.substring(0, 4) === secondSku.substring(0, 4)) {
                const firstNumber = parseInt(firstSku.substring(4));
                const secondNumber = parseInt(secondSku.substring(4));

                if (secondNumber === firstNumber + 1) {
                    console.log('✅ SKU incremented correctly');
                } else {
                    console.log('❌ SKU increment failed');
                }
            }
        } else {
            console.log('❌ Second product creation failed:', response2.data.message);
        }

        // Test 3: Try to create product with manual SKU (should be ignored)
        console.log('\n📝 Test 3: Creating product with manual SKU (should be ignored)...');
        const testProductData3 = {
            ...testProductData,
            product_name: "Test Product 3",
            manufacturer_part_name: "TP003",
            sku_code: "MANUAL123" // This should be ignored
        };

        const response3 = await axios.post(`${BASE_URL}/api/products/createProduct`, testProductData3, {
            headers: {
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (response3.data.success) {
            const product3 = response3.data.data;
            console.log('✅ Third product created successfully!');
            console.log(`📦 Generated SKU: ${product3.sku_code}`);

            if (product3.sku_code !== "MANUAL123") {
                console.log('✅ Manual SKU was ignored and auto-generated SKU was used');
            } else {
                console.log('❌ Manual SKU was not ignored');
            }
        } else {
            console.log('❌ Third product creation failed:', response3.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
        }

        if (error.response?.status === 404) {
            console.log('\n💡 Note: Make sure to update the category, brand, model, and variant IDs with valid ones');
        }
    }
}

// Instructions for running the test
console.log('🚀 SKU Generation Test Script');
console.log('============================\n');
console.log('Before running this test, please:');
console.log('1. Update BASE_URL with your actual API URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('3. Update the category, brand, model, and variant IDs with valid ones');
console.log('4. Make sure your product service is running\n');

// Uncomment the line below to run the test
// testSKUGeneration();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-sku-generation.js');
