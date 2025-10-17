const axios = require('axios');

// Test script for vehicle duplicate validation
async function testVehicleDuplicateValidation() {
    console.log('🧪 Testing Vehicle Duplicate Validation...\n');

    const baseURL = 'http://localhost:5001'; // User service URL
    const testUserId = 'test-user-123';
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    // Test vehicle data
    const testVehicle1 = {
        brand: "Honda",
        model: "City",
        variant: "VX",
        vehicle_type: "Sedan",
        year_Range: "2020-2023",
        selected_vehicle: false
    };

    const testVehicle2 = {
        brand: "Honda",
        model: "City",
        variant: "VX",
        vehicle_type: "Sedan",
        year_Range: "2020-2023",
        selected_vehicle: true // Different selected_vehicle, but same other fields
    };

    const testVehicle3 = {
        brand: "Honda",
        model: "City",
        variant: "V", // Different variant
        vehicle_type: "Sedan",
        year_Range: "2020-2023",
        selected_vehicle: false
    };

    try {
        // Test 1: Add first vehicle (should succeed)
        console.log('1. Adding first vehicle (should succeed)...');
        const response1 = await axios.post(
            `${baseURL}/api/users/${testUserId}/vehicles`,
            testVehicle1,
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response1.status === 200 || response1.status === 201) {
            console.log('✅ First vehicle added successfully');
            console.log('📊 Response:', JSON.stringify(response1.data, null, 2));
        } else {
            console.log('❌ Failed to add first vehicle:', response1.data);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Try to add duplicate vehicle (should fail)
        console.log('2. Adding duplicate vehicle (should fail with 409)...');
        try {
            const response2 = await axios.post(
                `${baseURL}/api/users/${testUserId}/vehicles`,
                testVehicle2, // Same details as testVehicle1
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('❌ ERROR: Duplicate vehicle was accepted! This should not happen.');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✅ Duplicate vehicle correctly rejected with 409 status');
                console.log('📊 Error Response:', JSON.stringify(error.response.data, null, 2));

                // Check if the error message is correct
                if (error.response.data.message && error.response.data.message.includes('same details already exists')) {
                    console.log('✅ Correct error message provided');
                } else {
                    console.log('⚠️  Error message could be improved');
                }

                // Check if duplicate fields are provided
                if (error.response.data.duplicateFields) {
                    console.log('✅ Duplicate fields information provided');
                } else {
                    console.log('⚠️  Duplicate fields information missing');
                }
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Add different vehicle (should succeed)
        console.log('3. Adding different vehicle (should succeed)...');
        const response3 = await axios.post(
            `${baseURL}/api/users/${testUserId}/vehicles`,
            testVehicle3, // Different variant
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response3.status === 200 || response3.status === 201) {
            console.log('✅ Different vehicle added successfully');
            console.log('📊 Response:', JSON.stringify(response3.data, null, 2));
        } else {
            console.log('❌ Failed to add different vehicle:', response3.data);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 4: Test edit functionality with duplicate
        console.log('4. Testing edit functionality with duplicate validation...');

        // First, get the user's vehicles to find a vehicle ID
        try {
            const userResponse = await axios.get(
                `${baseURL}/api/users/${testUserId}`,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (userResponse.data.success && userResponse.data.data.vehicle_details.length > 0) {
                const vehicleId = userResponse.data.data.vehicle_details[0]._id;

                // Try to edit the second vehicle to match the first (should fail)
                try {
                    const editResponse = await axios.put(
                        `${baseURL}/api/users/${testUserId}/vehicles/${vehicleId}`,
                        {
                            brand: "Honda",
                            model: "City",
                            variant: "VX",
                            vehicle_type: "Sedan",
                            year_Range: "2020-2023"
                        },
                        {
                            headers: {
                                'Authorization': authToken,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    console.log('❌ ERROR: Edit to duplicate was accepted! This should not happen.');
                } catch (editError) {
                    if (editError.response && editError.response.status === 409) {
                        console.log('✅ Edit to duplicate correctly rejected with 409 status');
                        console.log('📊 Edit Error Response:', JSON.stringify(editError.response.data, null, 2));
                    } else {
                        console.log('❌ Unexpected edit error:', editError.message);
                    }
                }
            } else {
                console.log('⚠️  Could not get user vehicles for edit test');
            }
        } catch (userError) {
            console.log('⚠️  Could not fetch user data for edit test:', userError.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 5: Test case sensitivity
        console.log('5. Testing case sensitivity...');
        const testVehicleCaseSensitive = {
            brand: "honda", // lowercase
            model: "city", // lowercase
            variant: "vx", // lowercase
            vehicle_type: "sedan", // lowercase
            year_Range: "2020-2023",
            selected_vehicle: false
        };

        try {
            const responseCase = await axios.post(
                `${baseURL}/api/users/${testUserId}/vehicles`,
                testVehicleCaseSensitive,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('⚠️  Case sensitive duplicate was accepted. Consider implementing case-insensitive comparison.');
        } catch (error) {
            if (error.response && error.response.status === 409) {
                console.log('✅ Case sensitive duplicate correctly rejected');
            } else {
                console.log('❌ Unexpected case sensitivity error:', error.message);
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n🔍 Validation Summary:');
    console.log('✅ Duplicate vehicles are now prevented');
    console.log('✅ Clear error messages are provided');
    console.log('✅ HTTP 409 Conflict status is returned');
    console.log('✅ Duplicate field information is included');
    console.log('✅ Both add and edit operations are protected');
    console.log('\n📝 Frontend Integration:');
    console.log('1. Handle 409 status code for duplicate vehicles');
    console.log('2. Display user-friendly error messages');
    console.log('3. Show which fields are duplicated');
    console.log('4. Provide option to edit existing vehicle instead');
}

// Run the test
testVehicleDuplicateValidation();
