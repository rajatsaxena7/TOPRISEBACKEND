const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Test the new CSV-based bulk assign dealers endpoint
async function testBulkAssignDealersCSV() {
  try {
    // Create sample CSV content
    const csvContent = `sku_code,legal_name,qty,margin,priority
SKU001,ABC Motors Ltd,10,15.5,1
SKU002,XYZ Auto Parts,5,12.0,2
SKU003,ABC Motors Ltd,8,18.0,1
SKU004,Best Dealers Inc,12,10.5,3`;

    // Create a temporary CSV file
    const tempFilePath = './temp_dealers.csv';
    fs.writeFileSync(tempFilePath, csvContent);

    // Create form data
    const form = new FormData();
    form.append('dealersFile', fs.createReadStream(tempFilePath));

    // Make the API call
    const response = await axios.post('http://localhost:5002/api/products/v1/assign/dealer/bulk', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
      }
    });

    console.log('Success:', response.data);

    // Clean up
    fs.unlinkSync(tempFilePath);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Example CSV format for bulk dealer assignment:
console.log(`
CSV Format for Bulk Dealer Assignment:
=====================================

The CSV should have the following columns:
- sku_code: Product SKU code
- legal_name: Dealer's legal name (instead of dealer_id)
- qty: Quantity to assign
- margin: Dealer margin percentage
- priority: Priority override (optional)

Example CSV:
sku_code,legal_name,qty,margin,priority
SKU001,ABC Motors Ltd,10,15.5,1
SKU002,XYZ Auto Parts,5,12.0,2
SKU003,ABC Motors Ltd,8,18.0,1
SKU004,Best Dealers Inc,12,10.5,3

API Endpoint: POST /api/products/v1/assign/dealer/bulk
Content-Type: multipart/form-data
File field: dealersFile

Required Headers:
- Authorization: Bearer <JWT_TOKEN>
- Content-Type: multipart/form-data

Required Roles: Super-admin, Inventory-Admin, or Fulfillment-Admin
`);

// Uncomment to run the test
// testBulkAssignDealersCSV();
