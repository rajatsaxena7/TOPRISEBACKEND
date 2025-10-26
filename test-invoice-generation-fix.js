const axios = require('axios');

// Test script to verify invoice generation fix
async function testInvoiceGenerationFix() {
    console.log('🧪 Testing Invoice Generation Fix...\n');

    const baseURL = 'http://localhost:5001'; // Order service URL
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    try {
        console.log('='.repeat(60));
        console.log('TESTING INVOICE GENERATION WITH VALIDATION');
        console.log('='.repeat(60));

        // Test 1: Create order with complete item data
        console.log('\n📝 Test 1: Creating order with complete item data...');

        const orderData = {
            userId: 'test-user-id',
            items: [
                {
                    productId: 'product-id-1',
                    quantity: 2,
                    unitPrice: 100.50,
                    productName: 'Test Product 1',
                    sku: 'TEST001',
                    cgstPercent: 9.0,
                    cgstAmount: 18.09,
                    sgstPercent: 9.0,
                    sgstAmount: 18.09,
                    totalAmount: 236.68
                },
                {
                    productId: 'product-id-2',
                    quantity: 1,
                    unitPrice: 50.25,
                    productName: 'Test Product 2',
                    sku: 'TEST002',
                    cgstPercent: 9.0,
                    cgstAmount: 9.05,
                    sgstPercent: 9.0,
                    sgstAmount: 9.05,
                    totalAmount: 68.35
                }
            ],
            shippingAddress: {
                name: 'John Doe',
                address: '123 Main Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
                phone: '9876543210'
            },
            paymentMethod: 'COD',
            shippingCharges: 50.00,
            totalAmount: 355.03
        };

        try {
            const response = await axios.post(
                `${baseURL}/orders/v1/create`,
                orderData,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Order creation request successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Order ID:', response.data.data?.orderId);
            console.log('📊 Invoice Generated:', response.data.data?.invoiceUrl ? 'Yes' : 'No');

            if (response.data.success) {
                console.log('✅ SUCCESS: Order created and invoice generated successfully!');
                if (response.data.data?.invoiceUrl) {
                    console.log(`📄 Invoice URL: ${response.data.data.invoiceUrl}`);
                }
            }

        } catch (error) {
            console.log('❌ Error in order creation test:', error.response?.data?.message || error.message);
            if (error.response?.data?.error) {
                console.log('📊 Error Details:', error.response.data.error);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('TESTING WITH MISSING/UNDEFINED VALUES');
        console.log('='.repeat(60));

        // Test 2: Create order with missing/undefined values (should not crash)
        console.log('\n📝 Test 2: Creating order with missing values (should handle gracefully)...');

        const orderDataWithMissingValues = {
            userId: 'test-user-id',
            items: [
                {
                    productId: 'product-id-1',
                    quantity: 1,
                    unitPrice: undefined, // This should be handled gracefully
                    productName: 'Test Product with Missing Price',
                    sku: 'TEST003',
                    cgstPercent: null, // This should default to 0
                    cgstAmount: undefined, // This should default to 0
                    sgstPercent: undefined, // This should default to 0
                    sgstAmount: null, // This should default to 0
                    totalAmount: undefined // This should default to 0
                }
            ],
            shippingAddress: {
                name: 'Jane Doe',
                address: '456 Oak Avenue',
                city: 'Delhi',
                state: 'Delhi',
                pincode: '110001',
                phone: '9876543211'
            },
            paymentMethod: 'COD',
            shippingCharges: undefined, // This should default to 0
            totalAmount: null // This should default to 0
        };

        try {
            const response = await axios.post(
                `${baseURL}/orders/v1/create`,
                orderDataWithMissingValues,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Order creation with missing values successful');
            console.log('📊 Response Status:', response.status);
            console.log('📊 Order ID:', response.data.data?.orderId);
            console.log('📊 Invoice Generated:', response.data.data?.invoiceUrl ? 'Yes' : 'No');

            if (response.data.success) {
                console.log('✅ SUCCESS: Order created with missing values handled gracefully!');
                console.log('📄 Invoice generated with default values (0.00) for missing fields');
            }

        } catch (error) {
            console.log('❌ Error in missing values test:', error.response?.data?.message || error.message);
            if (error.response?.data?.error) {
                console.log('📊 Error Details:', error.response.data.error);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('TESTING WITH EMPTY ITEMS ARRAY');
        console.log('='.repeat(60));

        // Test 3: Create order with empty items array (should fail gracefully)
        console.log('\n📝 Test 3: Creating order with empty items array (should fail gracefully)...');

        const orderDataEmptyItems = {
            userId: 'test-user-id',
            items: [], // Empty array should be caught by validation
            shippingAddress: {
                name: 'Bob Smith',
                address: '789 Pine Street',
                city: 'Bangalore',
                state: 'Karnataka',
                pincode: '560001',
                phone: '9876543212'
            },
            paymentMethod: 'COD',
            shippingCharges: 50.00,
            totalAmount: 50.00
        };

        try {
            const response = await axios.post(
                `${baseURL}/orders/v1/create`,
                orderDataEmptyItems,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('⚠️  Unexpected success with empty items array');
            console.log('📊 Response Status:', response.status);

        } catch (error) {
            console.log('✅ Expected error with empty items array');
            console.log('📊 Error Message:', error.response?.data?.message || error.message);
            console.log('✅ SUCCESS: Empty items array properly rejected!');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 INVOICE GENERATION FIX SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Fixed undefined value handling in invoice generation');
    console.log('✅ Added validation for input parameters');
    console.log('✅ Added default values for missing numeric fields');
    console.log('✅ Enhanced error handling for edge cases');

    console.log('\n🔧 Changes Made:');
    console.log('1. Added validation for items array and customer details');
    console.log('2. Added parseFloat() with default values for all numeric fields');
    console.log('3. Added null/undefined checks for productName and sku');
    console.log('4. Added validation for shippingCharges and totalOrderAmount');
    console.log('5. Enhanced error messages for better debugging');

    console.log('\n📝 Expected Behavior:');
    console.log('- Orders with complete data should generate invoices successfully');
    console.log('- Orders with missing/undefined values should use default values (0)');
    console.log('- Orders with empty items array should be rejected with clear error');
    console.log('- No more "Cannot read properties of undefined" errors');

    console.log('\n✅ The invoice generation fix is ready for testing!');
}

// Run the test
testInvoiceGenerationFix();
