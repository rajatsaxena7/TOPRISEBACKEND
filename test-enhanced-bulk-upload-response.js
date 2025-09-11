const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:5002/products/v1';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

// Test data for bulk upload
const testExcelData = [
    {
        product_name: "Test Brake Pad",
        manufacturer_part_name: "BRAKE001",
        category: "Bike Accessories",
        sub_category: "Brake Parts",
        brand: "Test Brand",
        product_type: "Spare Parts",
        model: "Test Model",
        variant: "Standard, Premium",
        make: "Test Make",
        year_range: "2020-2024",
        is_universal: "Yes",
        is_consumable: "No",
        mrp: 500,
        selling_price: 450,
        description: "High quality brake pad for testing"
    },
    {
        product_name: "Test Clutch Plate",
        manufacturer_part_name: "CLUTCH001",
        category: "Bike Accessories",
        sub_category: "Clutch Parts",
        brand: "Test Brand",
        product_type: "Spare Parts",
        model: "Test Model",
        variant: "Standard",
        make: "Test Make",
        year_range: "2020-2024",
        is_universal: "Yes",
        is_consumable: "No",
        mrp: 800,
        selling_price: 720,
        description: "High quality clutch plate for testing"
    },
    {
        product_name: "Invalid Product",
        manufacturer_part_name: "",
        category: "Unknown Category",
        sub_category: "Unknown Sub Category",
        brand: "Unknown Brand",
        product_type: "Spare Parts",
        model: "Unknown Model",
        variant: "Standard",
        make: "Test Make",
        year_range: "2020-2024",
        is_universal: "Yes",
        is_consumable: "No",
        mrp: 300,
        selling_price: 270,
        description: "This product should fail validation"
    }
];

// Function to create Excel file
function createExcelFile(data, filename) {
    const XLSX = require('xlsx');
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, filename);
    console.log(`📄 Created Excel file: ${filename}`);
}

// Function to create ZIP file with images
function createZipFile(filename) {
    const JSZip = require('jszip');
    const zip = new JSZip();

    // Create dummy image files
    const dummyImage1 = Buffer.from('dummy image data for BRAKE001');
    const dummyImage2 = Buffer.from('dummy image data for CLUTCH001');

    zip.file('brake001.jpg', dummyImage1);
    zip.file('clutch001.jpg', dummyImage2);

    return zip.generateAsync({ type: 'nodebuffer' }).then(content => {
        fs.writeFileSync(filename, content);
        console.log(`📦 Created ZIP file: ${filename}`);
    });
}

// Function to test bulk upload with enhanced response
async function testBulkUploadWithEnhancedResponse() {
    try {
        console.log('🚀 Testing Enhanced Bulk Upload Response');
        console.log('='.repeat(80));

        // Create test files
        const excelFile = 'test-products.xlsx';
        const zipFile = 'test-images.zip';

        createExcelFile(testExcelData, excelFile);
        await createZipFile(zipFile);

        // Prepare form data
        const formData = new FormData();
        formData.append('dataFile', fs.createReadStream(excelFile), {
            filename: excelFile,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        formData.append('imageZip', fs.createReadStream(zipFile), {
            filename: zipFile,
            contentType: 'application/zip'
        });

        console.log('📤 Uploading files...');
        const startTime = Date.now();

        const response = await axios.post(`${BASE_URL}/`, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            timeout: 60000 // 60 seconds timeout
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        console.log(`✅ Upload completed in ${duration}s`);
        console.log(`📊 Status: ${response.status}`);

        if (response.data.success) {
            const data = response.data.data;

            console.log('\n📋 BULK UPLOAD SUMMARY:');
            console.log('='.repeat(50));
            console.log(`📄 Total Rows: ${data.totalRows}`);
            console.log(`✅ Inserted: ${data.inserted}`);
            console.log(`⏱️ Duration: ${data.durationSec}s`);
            console.log(`🔐 Requires Approval: ${data.requiresApproval}`);
            console.log(`📊 Status: ${data.status}`);
            console.log(`💬 Message: ${data.message}`);
            console.log(`🆔 Session ID: ${data.sessionId}`);

            // Image Summary
            if (data.imgSummary) {
                console.log('\n🖼️ IMAGE UPLOAD SUMMARY:');
                console.log('='.repeat(50));
                console.log(`📦 Total Images: ${data.imgSummary.total}`);
                console.log(`✅ Successful: ${data.imgSummary.ok}`);
                console.log(`⏭️ Skipped: ${data.imgSummary.skip}`);
                console.log(`❌ Failed: ${data.imgSummary.fail}`);
            }

            // Success Logs
            if (data.successLogs && data.successLogs.products.length > 0) {
                console.log('\n✅ SUCCESSFUL PRODUCTS:');
                console.log('='.repeat(50));
                console.log(`📊 Total Successful: ${data.successLogs.totalSuccessful}`);

                data.successLogs.products.forEach((product, index) => {
                    console.log(`\n   ${index + 1}. Product Details:`);
                    console.log(`      🆔 Product ID: ${product.productId}`);
                    console.log(`      🏷️ SKU: ${product.sku}`);
                    console.log(`      📦 Name: ${product.productName}`);
                    console.log(`      🔧 Part Name: ${product.manufacturerPartName}`);
                    console.log(`      📊 Status: ${product.status}`);
                    console.log(`      🔍 QC Status: ${product.qcStatus}`);
                    console.log(`      🖼️ Images: ${product.images}`);
                    console.log(`      💬 Message: ${product.message}`);
                });
            }

            // Failure Logs
            if (data.failureLogs && data.failureLogs.products.length > 0) {
                console.log('\n❌ FAILED PRODUCTS:');
                console.log('='.repeat(50));
                console.log(`📊 Total Failed: ${data.failureLogs.totalFailed}`);

                data.failureLogs.products.forEach((product, index) => {
                    console.log(`\n   ${index + 1}. Failed Product:`);
                    console.log(`      📦 Name: ${product.productName}`);
                    console.log(`      🔧 Part Name: ${product.manufacturerPartName}`);
                    console.log(`      ❌ Error: ${product.error}`);
                    console.log(`      💬 Message: ${product.message}`);
                });
            }

            // Error Details
            if (data.errors && data.errors.length > 0) {
                console.log('\n🚨 VALIDATION ERRORS:');
                console.log('='.repeat(50));
                data.errors.forEach((error, index) => {
                    console.log(`\n   ${index + 1}. Row ${error.row}:`);
                    console.log(`      ❌ Error: ${error.error}`);
                    if (error.sku) console.log(`      🏷️ SKU: ${error.sku}`);
                    if (error.rowData) {
                        console.log(`      📦 Product: ${error.rowData.product_name || 'N/A'}`);
                        console.log(`      🔧 Part: ${error.rowData.manufacturer_part_name || 'N/A'}`);
                    }
                });
            }

            // Summary Statistics
            console.log('\n📈 SUMMARY STATISTICS:');
            console.log('='.repeat(50));
            const successRate = ((data.inserted / data.totalRows) * 100).toFixed(1);
            const failureRate = (((data.totalRows - data.inserted) / data.totalRows) * 100).toFixed(1);

            console.log(`✅ Success Rate: ${successRate}%`);
            console.log(`❌ Failure Rate: ${failureRate}%`);
            console.log(`📊 Processing Speed: ${(data.totalRows / parseFloat(data.durationSec)).toFixed(2)} products/second`);

        } else {
            console.log('❌ Upload failed:', response.data.message);
        }

        // Cleanup test files
        try {
            fs.unlinkSync(excelFile);
            fs.unlinkSync(zipFile);
            console.log('\n🧹 Cleaned up test files');
        } catch (cleanupError) {
            console.log('\n⚠️ Could not clean up test files:', cleanupError.message);
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message);
        if (error.response) {
            console.log('📊 Status:', error.response.status);
            console.log('📋 Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

// Function to test with different scenarios
async function testDifferentScenarios() {
    console.log('\n🧪 Testing Different Scenarios');
    console.log('='.repeat(80));

    const scenarios = [
        {
            name: "All Valid Products",
            data: testExcelData.slice(0, 2), // Only valid products
            description: "Testing with products that should all succeed"
        },
        {
            name: "Mixed Valid/Invalid Products",
            data: testExcelData, // All products including invalid ones
            description: "Testing with mix of valid and invalid products"
        },
        {
            name: "All Invalid Products",
            data: testExcelData.slice(2), // Only invalid products
            description: "Testing with products that should all fail"
        }
    ];

    for (const scenario of scenarios) {
        console.log(`\n🔬 Scenario: ${scenario.name}`);
        console.log(`📝 Description: ${scenario.description}`);
        console.log('-'.repeat(60));

        // Create scenario-specific files
        const excelFile = `test-${scenario.name.toLowerCase().replace(/\s+/g, '-')}.xlsx`;
        const zipFile = `test-${scenario.name.toLowerCase().replace(/\s+/g, '-')}.zip`;

        createExcelFile(scenario.data, excelFile);
        await createZipFile(zipFile);

        try {
            const formData = new FormData();
            formData.append('dataFile', fs.createReadStream(excelFile), {
                filename: excelFile,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            formData.append('imageZip', fs.createReadStream(zipFile), {
                filename: zipFile,
                contentType: 'application/zip'
            });

            const response = await axios.post(`${BASE_URL}/`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                timeout: 60000
            });

            if (response.data.success) {
                const data = response.data.data;
                console.log(`✅ Results: ${data.inserted}/${data.totalRows} successful`);
                console.log(`📊 Success Rate: ${((data.inserted / data.totalRows) * 100).toFixed(1)}%`);

                if (data.successLogs && data.successLogs.products.length > 0) {
                    console.log(`🎉 Successful Products: ${data.successLogs.products.length}`);
                }

                if (data.failureLogs && data.failureLogs.products.length > 0) {
                    console.log(`💥 Failed Products: ${data.failureLogs.products.length}`);
                }
            }

        } catch (error) {
            console.log(`❌ Scenario failed: ${error.message}`);
        }

        // Cleanup
        try {
            fs.unlinkSync(excelFile);
            fs.unlinkSync(zipFile);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
}

// Function to display help
function displayHelp() {
    console.log(`
🚀 Enhanced Bulk Upload Response Test Script

Usage:
  node test-enhanced-bulk-upload-response.js [options]

Options:
  --basic                    Run basic bulk upload test (default)
  --scenarios               Run different scenario tests
  --help                    Show this help message

Examples:
  node test-enhanced-bulk-upload-response.js
  node test-enhanced-bulk-upload-response.js --basic
  node test-enhanced-bulk-upload-response.js --scenarios

Note: Make sure to update AUTH_TOKEN in the script with your actual authentication token.
Also ensure that the required dependencies (xlsx, jszip) are installed:
  npm install xlsx jszip
  `);
}

// Main execution
async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--help')) {
        displayHelp();
        return;
    }

    if (args.includes('--scenarios')) {
        await testDifferentScenarios();
    } else {
        await testBulkUploadWithEnhancedResponse();
    }
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Promise Rejection:', error);
    process.exit(1);
});

// Run the tests
main().catch(console.error);
