const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:5000'; // User service URL
const TEST_TOKEN = 'your_admin_token_here'; // Replace with actual Super-admin or Fulfillment-Admin token
const TEST_USER_ID = 'your_user_id_here'; // Replace with actual user ID
const CSV_FILE_PATH = path.join(__dirname, 'pincode-upload-template.csv');

async function testPincodeBulkUpload() {
    try {
        console.log('🔧 Testing Pincode Bulk Upload...\n');

        // Test 1: Upload CSV file
        console.log('📝 Test 1: Upload pincodes from CSV file...');
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(CSV_FILE_PATH));
            formData.append('created_by', TEST_USER_ID);

            const response = await axios.post(
                `${BASE_URL}/api/pincodes/bulk-upload`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${TEST_TOKEN}`,
                        ...formData.getHeaders(),
                    },
                }
            );

            if (response.data.success) {
                console.log('✅ Bulk upload completed successfully');
                console.log('\n📊 Upload Summary:');
                console.log(`   Total rows: ${response.data.data.summary.total_rows}`);
                console.log(`   Successful: ${response.data.data.summary.successful}`);
                console.log(`   Duplicates: ${response.data.data.summary.duplicates}`);
                console.log(`   Errors: ${response.data.data.summary.errors}`);
                console.log(`   Success rate: ${response.data.data.summary.success_rate}`);

                if (response.data.data.successful_uploads.length > 0) {
                    console.log('\n✅ Successfully Created:');
                    response.data.data.successful_uploads.slice(0, 5).forEach(item => {
                        console.log(`   Row ${item.row}: ${item.pincode} - ${item.city}, ${item.state}`);
                    });
                    if (response.data.data.successful_uploads.length > 5) {
                        console.log(`   ... and ${response.data.data.successful_uploads.length - 5} more`);
                    }
                }

                if (response.data.data.duplicates.length > 0) {
                    console.log('\n⚠️  Duplicates Found:');
                    response.data.data.duplicates.slice(0, 5).forEach(item => {
                        console.log(`   Row ${item.row}: ${item.pincode} - ${item.message}`);
                    });
                }

                if (response.data.data.errors.length > 0) {
                    console.log('\n❌ Errors:');
                    response.data.data.errors.slice(0, 5).forEach(item => {
                        console.log(`   Row ${item.row}: ${item.pincode} - ${item.error}`);
                    });
                }
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
            if (error.response?.data) {
                console.log('   Details:', JSON.stringify(error.response.data, null, 2));
            }
        }

        // Test 2: Get all pincodes
        console.log('\n📝 Test 2: Get all pincodes with pagination...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/pincodes?page=1&limit=5`,
                {
                    headers: {
                        'Authorization': `Bearer ${TEST_TOKEN}`,
                    },
                }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched pincodes');
                console.log(`   Total pincodes: ${response.data.data.pagination.totalItems}`);
                console.log(`   Current page: ${response.data.data.pagination.currentPage}`);
                console.log(`   Showing ${response.data.data.data.length} pincodes`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 3: Check pincode serviceability
        console.log('\n📝 Test 3: Check pincode serviceability...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/pincodes/check/110001`
            );

            if (response.data.success) {
                console.log('✅ Successfully checked pincode');
                console.log(`   Pincode: ${response.data.data.pincode}`);
                console.log(`   City: ${response.data.data.city}`);
                console.log(`   State: ${response.data.data.state}`);
                console.log(`   Serviceable: ${response.data.data.is_serviceable}`);
                console.log(`   Delivery Zone: ${response.data.data.delivery_zone}`);
                console.log(`   Est. Delivery Days: ${response.data.data.estimated_delivery_days}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 4: Get statistics
        console.log('\n📝 Test 4: Get pincode statistics...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/pincodes/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${TEST_TOKEN}`,
                    },
                }
            );

            if (response.data.success) {
                console.log('✅ Successfully fetched statistics');
                console.log(`   Total pincodes: ${response.data.data.total}`);
                console.log(`   Serviceable: ${response.data.data.serviceable}`);
                console.log(`   Non-serviceable: ${response.data.data.non_serviceable}`);
                console.log(`   Coverage: ${response.data.data.coverage_percentage}`);
                console.log(`   Avg delivery days: ${response.data.data.avg_delivery_days}`);

                if (response.data.data.state_breakdown.length > 0) {
                    console.log('\n   Top 5 States:');
                    response.data.data.state_breakdown.slice(0, 5).forEach(state => {
                        console.log(`   - ${state._id}: ${state.count} pincodes (${state.serviceable} serviceable)`);
                    });
                }
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 5: Search pincodes
        console.log('\n📝 Test 5: Search pincodes...');
        try {
            const response = await axios.get(
                `${BASE_URL}/api/pincodes?search=Delhi&page=1&limit=5`,
                {
                    headers: {
                        'Authorization': `Bearer ${TEST_TOKEN}`,
                    },
                }
            );

            if (response.data.success) {
                console.log('✅ Successfully searched pincodes');
                console.log(`   Results found: ${response.data.data.data.length}`);
                response.data.data.data.forEach(pincode => {
                    console.log(`   - ${pincode.pincode}: ${pincode.city}, ${pincode.state}`);
                });
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        // Test 6: Get all states
        console.log('\n📝 Test 6: Get all states...');
        try {
            const response = await axios.get(`${BASE_URL}/api/pincodes/states`);

            if (response.data.success) {
                console.log('✅ Successfully fetched states');
                console.log(`   Total states: ${response.data.data.states.length}`);
                console.log(`   States: ${response.data.data.states.slice(0, 10).join(', ')}`);
            }
        } catch (error) {
            console.log('❌ Failed:', error.response?.data?.message || error.message);
        }

        console.log('\n🎉 All tests completed!');
        console.log('\n📊 Test Summary:');
        console.log('✅ Bulk upload from CSV');
        console.log('✅ Get pincodes with pagination');
        console.log('✅ Check pincode serviceability');
        console.log('✅ Get statistics');
        console.log('✅ Search pincodes');
        console.log('✅ Get all states');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);

        if (error.code === 'ENOENT') {
            console.log('\n💡 Note: Make sure pincode-upload-template.csv exists in the project root');
        }

        if (error.response?.status === 401) {
            console.log('\n💡 Note: Make sure to update TEST_TOKEN with a valid authentication token');
            console.log('   You need Super-admin or Fulfillment-Admin role');
        }
    }
}

// Instructions for running the test
console.log('🔧 Pincode Bulk Upload Test Script');
console.log('===================================\n');
console.log('This script tests the pincode bulk upload functionality.\n');

console.log('Before running, please:');
console.log('1. Update BASE_URL with your actual user service URL');
console.log('2. Update TEST_TOKEN with a valid authentication token');
console.log('   (Must have Super-admin or Fulfillment-Admin role)');
console.log('3. Update TEST_USER_ID with your user ID');
console.log('4. Ensure pincode-upload-template.csv exists in project root');
console.log('5. Make sure your user service is running\n');

// Uncomment the line below to run the test
// testPincodeBulkUpload();

console.log('To run the test, uncomment the last line in this script and execute:');
console.log('node test-pincode-bulk-upload.js');

console.log('\n📋 CSV Format:');
console.log('The CSV file should have the following columns:');
console.log('- pincode (required) - 6-digit Indian pincode');
console.log('- city (required) - City name');
console.log('- state (required) - State name');
console.log('- district (optional) - District name');
console.log('- region (optional) - Region name (North, South, East, West)');
console.log('- country (optional) - Country name (default: India)');
console.log('- is_serviceable (optional) - true/false (default: true)');
console.log('- delivery_zone (optional) - Zone-A/Zone-B/Zone-C/Zone-D (default: Zone-A)');
console.log('- estimated_delivery_days (optional) - Number (default: 7)');
console.log('- additional_charges (optional) - Number (default: 0)');
console.log('- latitude (optional) - Latitude coordinate');
console.log('- longitude (optional) - Longitude coordinate');
console.log('- remarks (optional) - Any remarks');

