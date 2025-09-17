/**
 * Test script for Catalog Controller functionality
 * This script demonstrates how to use the catalog controller to create catalogs
 * and automatically assign products based on brand, model, and variants
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001/api/catalogs';
const AUTH_TOKEN = 'your-jwt-token-here'; // Replace with actual JWT token

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
};

/**
 * Test 1: Create a catalog with automatic product assignment
 */
async function testCreateCatalog() {
    console.log('\n=== Test 1: Creating Catalog with Auto Product Assignment ===');

    const catalogData = {
        catalog_name: "Honda Cars Parts Catalog",
        catalog_description: "Comprehensive catalog for Honda car parts including all models and variants",
        catalog_image: "https://example.com/honda-catalog.jpg",
        catalog_created_by: "admin@toprise.in",
        catalog_updated_by: "admin@toprise.in",
        catalog_brands: ["BRAND_ID_1", "BRAND_ID_2"], // Replace with actual brand IDs
        catalog_models: ["MODEL_ID_1", "MODEL_ID_2"], // Replace with actual model IDs
        catalog_variants: ["VARIANT_ID_1", "VARIANT_ID_2"], // Replace with actual variant IDs
        catalog_categories: ["CATEGORY_ID_1"], // Replace with actual category IDs
        catalog_subcategories: ["SUBCATEGORY_ID_1"] // Replace with actual subcategory IDs
    };

    try {
        const response = await axios.post(BASE_URL, catalogData, { headers });
        console.log('✅ Catalog created successfully:');
        console.log(`   Catalog ID: ${response.data.data.catalog._id}`);
        console.log(`   Products assigned: ${response.data.data.assignedProductsCount}`);
        console.log(`   Message: ${response.data.data.message}`);
        return response.data.data.catalog._id;
    } catch (error) {
        console.error('❌ Error creating catalog:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Test 2: Get all catalogs
 */
async function testGetAllCatalogs() {
    console.log('\n=== Test 2: Getting All Catalogs ===');

    try {
        const response = await axios.get(`${BASE_URL}?page=1&limit=10`, { headers });
        console.log('✅ Catalogs retrieved successfully:');
        console.log(`   Total catalogs: ${response.data.data.pagination.totalItems}`);
        console.log(`   Current page: ${response.data.data.pagination.currentPage}`);
        response.data.data.catalogs.forEach((catalog, index) => {
            console.log(`   ${index + 1}. ${catalog.catalog_name} (${catalog.catalog_products.length} products)`);
        });
    } catch (error) {
        console.error('❌ Error getting catalogs:', error.response?.data || error.message);
    }
}

/**
 * Test 3: Get catalog by ID
 */
async function testGetCatalogById(catalogId) {
    console.log('\n=== Test 3: Getting Catalog by ID ===');

    if (!catalogId) {
        console.log('❌ No catalog ID provided');
        return;
    }

    try {
        const response = await axios.get(`${BASE_URL}/${catalogId}`, { headers });
        console.log('✅ Catalog retrieved successfully:');
        console.log(`   Name: ${response.data.data.catalog.catalog_name}`);
        console.log(`   Description: ${response.data.data.catalog.catalog_description}`);
        console.log(`   Status: ${response.data.data.catalog.catalog_status}`);
        console.log(`   Products count: ${response.data.data.catalog.catalog_products.length}`);
        console.log(`   Brands: ${response.data.data.catalog.catalog_brands.length}`);
        console.log(`   Models: ${response.data.data.catalog.catalog_models.length}`);
        console.log(`   Variants: ${response.data.data.catalog.catalog_variants.length}`);
    } catch (error) {
        console.error('❌ Error getting catalog by ID:', error.response?.data || error.message);
    }
}

/**
 * Test 4: Preview products by criteria
 */
async function testPreviewProducts() {
    console.log('\n=== Test 4: Preview Products by Catalog Criteria ===');

    const criteria = {
        brands: 'BRAND_ID_1,BRAND_ID_2', // Replace with actual brand IDs
        models: 'MODEL_ID_1', // Replace with actual model IDs
        categories: 'CATEGORY_ID_1' // Replace with actual category IDs
    };

    try {
        const response = await axios.get(`${BASE_URL}/preview/products`, {
            headers,
            params: criteria
        });
        console.log('✅ Products preview retrieved successfully:');
        console.log(`   Products found: ${response.data.data.count}`);
        console.log(`   Criteria used:`, response.data.data.criteria);
        response.data.data.products.slice(0, 5).forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.product_name} (SKU: ${product.sku_code})`);
        });
    } catch (error) {
        console.error('❌ Error previewing products:', error.response?.data || error.message);
    }
}

/**
 * Test 5: Update catalog
 */
async function testUpdateCatalog(catalogId) {
    console.log('\n=== Test 5: Updating Catalog ===');

    if (!catalogId) {
        console.log('❌ No catalog ID provided');
        return;
    }

    const updateData = {
        catalog_name: "Updated Honda Cars Parts Catalog",
        catalog_description: "Updated comprehensive catalog for Honda car parts",
        catalog_brands: ["BRAND_ID_1", "BRAND_ID_2", "BRAND_ID_3"], // Add more brands
        catalog_models: ["MODEL_ID_1", "MODEL_ID_2", "MODEL_ID_3"] // Add more models
    };

    try {
        const response = await axios.put(`${BASE_URL}/${catalogId}`, updateData, { headers });
        console.log('✅ Catalog updated successfully:');
        console.log(`   Updated name: ${response.data.data.catalog.catalog_name}`);
        console.log(`   Products assigned: ${response.data.data.assignedProductsCount}`);
        console.log(`   Message: ${response.data.data.message}`);
    } catch (error) {
        console.error('❌ Error updating catalog:', error.response?.data || error.message);
    }
}

/**
 * Test 6: Get catalog statistics
 */
async function testGetCatalogStatistics(catalogId) {
    console.log('\n=== Test 6: Getting Catalog Statistics ===');

    if (!catalogId) {
        console.log('❌ No catalog ID provided');
        return;
    }

    try {
        const response = await axios.get(`${BASE_URL}/${catalogId}/statistics`, { headers });
        console.log('✅ Catalog statistics retrieved successfully:');
        console.log(`   Catalog: ${response.data.data.catalogName}`);
        console.log(`   Total products: ${response.data.data.statistics.totalProducts}`);
        console.log(`   Total brands: ${response.data.data.statistics.totalBrands}`);
        console.log(`   Total models: ${response.data.data.statistics.totalModels}`);
        console.log(`   Total variants: ${response.data.data.statistics.totalVariants}`);
        console.log(`   Status: ${response.data.data.statistics.catalogStatus}`);
        console.log(`   Product type distribution:`, response.data.data.statistics.productTypeDistribution);
    } catch (error) {
        console.error('❌ Error getting catalog statistics:', error.response?.data || error.message);
    }
}

/**
 * Test 7: Manually assign products to catalog
 */
async function testAssignProductsToCatalog(catalogId) {
    console.log('\n=== Test 7: Manually Assigning Products to Catalog ===');

    if (!catalogId) {
        console.log('❌ No catalog ID provided');
        return;
    }

    const productIds = ["PRODUCT_ID_1", "PRODUCT_ID_2"]; // Replace with actual product IDs

    try {
        const response = await axios.post(`${BASE_URL}/${catalogId}/assign-products`,
            { productIds },
            { headers }
        );
        console.log('✅ Products assigned successfully:');
        console.log(`   Products assigned: ${response.data.data.assignedProductsCount}`);
        console.log(`   Message: ${response.data.data.message}`);
    } catch (error) {
        console.error('❌ Error assigning products:', error.response?.data || error.message);
    }
}

/**
 * Test 8: Re-assign products to catalog
 */
async function testReassignProductsToCatalog(catalogId) {
    console.log('\n=== Test 8: Re-assigning Products to Catalog ===');

    if (!catalogId) {
        console.log('❌ No catalog ID provided');
        return;
    }

    try {
        const response = await axios.post(`${BASE_URL}/${catalogId}/reassign-products`, {}, { headers });
        console.log('✅ Products re-assigned successfully:');
        console.log(`   Products assigned: ${response.data.data.assignedProductsCount}`);
        console.log(`   Message: ${response.data.data.message}`);
    } catch (error) {
        console.error('❌ Error re-assigning products:', error.response?.data || error.message);
    }
}

/**
 * Main test function
 */
async function runAllTests() {
    console.log('🚀 Starting Catalog Controller Tests...\n');

    // Test 1: Create catalog
    const catalogId = await testCreateCatalog();

    // Test 2: Get all catalogs
    await testGetAllCatalogs();

    // Test 3: Get catalog by ID
    await testGetCatalogById(catalogId);

    // Test 4: Preview products
    await testPreviewProducts();

    // Test 5: Update catalog
    await testUpdateCatalog(catalogId);

    // Test 6: Get statistics
    await testGetCatalogStatistics(catalogId);

    // Test 7: Assign products manually
    await testAssignProductsToCatalog(catalogId);

    // Test 8: Re-assign products
    await testReassignProductsToCatalog(catalogId);

    console.log('\n✅ All tests completed!');
}

/**
 * Instructions for running the tests
 */
function printInstructions() {
    console.log(`
📋 INSTRUCTIONS FOR RUNNING CATALOG CONTROLLER TESTS:

1. Make sure the product service is running on port 5001
2. Replace the AUTH_TOKEN with a valid JWT token
3. Replace the placeholder IDs with actual IDs from your database:
   - BRAND_ID_1, BRAND_ID_2, etc. (from brands collection)
   - MODEL_ID_1, MODEL_ID_2, etc. (from models collection)
   - VARIANT_ID_1, VARIANT_ID_2, etc. (from variants collection)
   - CATEGORY_ID_1, etc. (from categories collection)
   - SUBCATEGORY_ID_1, etc. (from subcategories collection)
   - PRODUCT_ID_1, PRODUCT_ID_2, etc. (from products collection)

4. Run the test: node test-catalog-controller.js

📚 AVAILABLE ENDPOINTS:

POST   /api/catalogs                           - Create catalog with auto product assignment
GET    /api/catalogs                           - Get all catalogs (with pagination)
GET    /api/catalogs/:id                       - Get catalog by ID
PUT    /api/catalogs/:id                       - Update catalog and re-assign products
DELETE /api/catalogs/:id                       - Delete catalog
POST   /api/catalogs/:id/assign-products       - Manually assign products
DELETE /api/catalogs/:id/remove-products       - Remove products from catalog
GET    /api/catalogs/preview/products          - Preview products by criteria
POST   /api/catalogs/:id/reassign-products     - Re-assign products to catalog
GET    /api/catalogs/:id/statistics            - Get catalog statistics

🔧 KEY FEATURES:

✅ Automatic product assignment based on brand, model, and variants
✅ Manual product assignment and removal
✅ Catalog statistics and analytics
✅ Product preview before catalog creation
✅ Re-assignment when products are updated
✅ Comprehensive error handling and logging
✅ Role-based access control
✅ Pagination and filtering support

`);
}

// Run tests if this file is executed directly
if (require.main === module) {
    printInstructions();
    // Uncomment the line below to run tests
    // runAllTests();
}

module.exports = {
    testCreateCatalog,
    testGetAllCatalogs,
    testGetCatalogById,
    testPreviewProducts,
    testUpdateCatalog,
    testGetCatalogStatistics,
    testAssignProductsToCatalog,
    testReassignProductsToCatalog,
    runAllTests
};
