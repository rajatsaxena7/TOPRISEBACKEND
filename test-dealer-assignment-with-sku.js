const axios = require('axios');

// Test the updated dealer assignment endpoints that now support SKU codes
async function testDealerAssignmentWithSKU() {
  try {
    // Test 1: Manual dealer assignment using SKU code
    console.log('Testing manual dealer assignment with SKU code...');
    
    const manualAssignmentData = {
      productId: "SKU001", // Using SKU code instead of ObjectId
      dealerId: "DLR-12345678", // Dealer ID
      quantity: 10,
      margin: 15.5,
      priority: 1,
      inStock: true
    };

    const manualResponse = await axios.post(
      'http://localhost:5002/api/products/v1/assign/dealer/manual',
      manualAssignmentData,
      {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Manual assignment success:', manualResponse.data);

    // Test 2: Assign dealers for product using SKU code in URL
    console.log('\nTesting assign dealers for product with SKU code in URL...');
    
    const dealerData = [
      {
        dealers_Ref: "DLR-12345678",
        quantity_per_dealer: 15,
        dealer_margin: 12.0,
        dealer_priority_override: 2,
        inStock: true
      },
      {
        dealers_Ref: "DLR-87654321",
        quantity_per_dealer: 8,
        dealer_margin: 18.0,
        dealer_priority_override: 1,
        inStock: true
      }
    ];

    const assignResponse = await axios.post(
      'http://localhost:5002/api/products/v1/assign/dealerforProduct/SKU001', // Using SKU in URL
      { dealerData },
      {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Assign dealers success:', assignResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Example usage and documentation
console.log(`
Updated Dealer Assignment Endpoints
==================================

The following endpoints now support both ObjectId and SKU code for product identification:

1. Manual Dealer Assignment:
   POST /api/products/v1/assign/dealer/manual
   
   Request Body:
   {
     "productId": "SKU001",        // Can be ObjectId or SKU code
     "dealerId": "DLR-12345678",
     "quantity": 10,
     "margin": 15.5,
     "priority": 1,
     "inStock": true
   }

2. Assign Dealers for Product:
   POST /api/products/v1/assign/dealerforProduct/:productId
   
   URL Parameter:
   - productId: Can be ObjectId or SKU code (e.g., /SKU001)
   
   Request Body:
   {
     "dealerData": [
       {
         "dealers_Ref": "DLR-12345678",
         "quantity_per_dealer": 15,
         "dealer_margin": 12.0,
         "dealer_priority_override": 2,
         "inStock": true
       }
     ]
   }

3. Bulk Dealer Assignment (CSV):
   POST /api/products/v1/assign/dealer/bulk
   
   CSV Format:
   sku_code,legal_name,qty,margin,priority
   SKU001,ABC Motors Ltd,10,15.5,1
   SKU002,XYZ Auto Parts,5,12.0,2

Key Features:
- Automatic detection of ObjectId vs SKU code
- Fallback to SKU code lookup if ObjectId is invalid
- Improved error messages with context
- Backward compatibility with existing ObjectId usage

Required Headers:
- Authorization: Bearer <JWT_TOKEN>
- Content-Type: application/json (for manual/assign) or multipart/form-data (for bulk)

Required Roles: Super-admin, Inventory-Admin, or Fulfillment-Admin
`);

// Uncomment to run the test
// testDealerAssignmentWithSKU();
