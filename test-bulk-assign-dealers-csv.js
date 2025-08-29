const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const API_BASE_URL = "http://localhost:3001";
const TOKEN = "YOUR_SUPER_ADMIN_TOKEN"; // Replace with actual token

// Test CSV content with legal names containing spaces
const csvContent = `sku_code,legal_name,qty,margin,priority
TOP001,rAJAT FIRM PVT. LTD.,10,5,1
TOP002,ANOTHER DEALER WITH SPACES,15,3,2
TOP003,DEALER_NO_SPACES,20,4,1`;

async function testBulkAssignDealersCSV() {
  try {
    console.log("🧪 Testing bulk dealer assignment with CSV...");

    // Create a temporary CSV file
    const csvFilePath = "./test-dealers.csv";
    fs.writeFileSync(csvFilePath, csvContent);

    // Create form data
    const form = new FormData();
    form.append("dealersFile", fs.createReadStream(csvFilePath), {
      filename: "dealers.csv",
      contentType: "text/csv",
    });

    // Make the API call
    const response = await axios.post(
      `${API_BASE_URL}/products/v1/assign/dealer/bulk`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${TOKEN}`,
        },
        timeout: 30000,
      }
    );

    console.log("✅ Response:", response.data);

    // Clean up
    fs.unlinkSync(csvFilePath);

    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    
    // Clean up on error
    if (fs.existsSync("./test-dealers.csv")) {
      fs.unlinkSync("./test-dealers.csv");
    }
    
    throw error;
  }
}

async function testDealerLookupWithSpaces() {
  try {
    console.log("🧪 Testing dealer lookup with spaces in legal name...");

    // Test the specific legal name from the error
    const response = await axios.get(
      `${API_BASE_URL}/products/v1/products/TOP001/availableDealers`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      }
    );

    console.log("✅ Dealer lookup response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Dealer lookup error:", error.response?.data || error.message);
    throw error;
  }
}

// Run tests
async function runTests() {
  try {
    console.log("🚀 Starting tests...\n");

    // Test 1: Dealer lookup with spaces
    await testDealerLookupWithSpaces();

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Bulk assignment with CSV
    await testBulkAssignDealersCSV();

    console.log("\n✅ All tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Tests failed:", error.message);
    process.exit(1);
  }
}

// Uncomment to run tests
// runTests();

module.exports = {
  testBulkAssignDealersCSV,
  testDealerLookupWithSpaces,
  runTests,
};
