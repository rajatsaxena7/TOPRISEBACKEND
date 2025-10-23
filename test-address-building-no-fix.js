const axios = require('axios');

// Test script for address building_no field fix
async function testAddressBuildingNoFix() {
    console.log('🧪 Testing Address Building No Field Fix...\n');

    const baseURL = 'http://localhost:5001'; // User service URL
    const testUserId = '6866875e68bef2112db897cb'; // Use the actual user ID from the issue
    const authToken = 'Bearer your-auth-token-here'; // Replace with actual token

    // Test address data with building_no
    const testAddress = {
        address: [
            {
                building_no: "123222",
                nick_name: "Home",
                street: "123 MG Road",
                city: "Pune",
                pincode: "411001",
                state: "Maharashtra"
            }
        ]
    };

    try {
        // Test 1: Update address with building_no
        console.log('1. Testing address update with building_no...');
        const response = await axios.put(
            `${baseURL}/api/users/updateAddress/${testUserId}`,
            testAddress,
            {
                headers: {
                    'Authorization': authToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 200) {
            console.log('✅ Address update request successful');
            console.log('📊 Response:', JSON.stringify(response.data, null, 2));

            // Check if building_no is in the response
            if (response.data.data && response.data.data.address) {
                const savedAddress = response.data.data.address[response.data.data.address.length - 1];
                if (savedAddress.building_no === "123222") {
                    console.log('✅ building_no field saved correctly!');
                } else {
                    console.log('❌ building_no field not saved or has wrong value');
                    console.log('Expected: "123222", Got:', savedAddress.building_no);
                }
            } else {
                console.log('⚠️  Address data not found in response');
            }
        } else {
            console.log('❌ Address update failed:', response.data);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 2: Verify the saved address by fetching user data
        console.log('2. Verifying saved address by fetching user data...');
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

            if (userResponse.status === 200) {
                console.log('✅ User data fetched successfully');
                const userData = userResponse.data.data;

                if (userData.address && userData.address.length > 0) {
                    const latestAddress = userData.address[userData.address.length - 1];
                    console.log('📊 Latest Address Details:');
                    console.log('  building_no:', latestAddress.building_no);
                    console.log('  nick_name:', latestAddress.nick_name);
                    console.log('  street:', latestAddress.street);
                    console.log('  city:', latestAddress.city);
                    console.log('  pincode:', latestAddress.pincode);
                    console.log('  state:', latestAddress.state);

                    if (latestAddress.building_no === "123222") {
                        console.log('✅ building_no field is correctly saved and retrievable!');
                    } else {
                        console.log('❌ building_no field is not saved correctly');
                        console.log('Expected: "123222", Got:', latestAddress.building_no);
                    }
                } else {
                    console.log('⚠️  No addresses found for user');
                }
            } else {
                console.log('❌ Failed to fetch user data:', userResponse.data);
            }
        } catch (fetchError) {
            console.log('❌ Error fetching user data:', fetchError.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 3: Test with different building_no values
        console.log('3. Testing with different building_no values...');
        const testAddress2 = {
            address: [
                {
                    building_no: "456789",
                    nick_name: "Office",
                    street: "456 Business Park",
                    city: "Mumbai",
                    pincode: "400001",
                    state: "Maharashtra"
                }
            ]
        };

        try {
            const response2 = await axios.put(
                `${baseURL}/api/users/updateAddress/${testUserId}`,
                testAddress2,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response2.status === 200) {
                console.log('✅ Second address update successful');
                const savedAddress = response2.data.data.address[response2.data.data.address.length - 1];
                if (savedAddress.building_no === "456789") {
                    console.log('✅ Second building_no field saved correctly!');
                } else {
                    console.log('❌ Second building_no field not saved correctly');
                }
            } else {
                console.log('❌ Second address update failed:', response2.data);
            }
        } catch (error) {
            console.log('❌ Error in second address update:', error.message);
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // Test 4: Test with empty building_no
        console.log('4. Testing with empty building_no...');
        const testAddress3 = {
            address: [
                {
                    building_no: "",
                    nick_name: "Empty Building",
                    street: "789 Test Street",
                    city: "Delhi",
                    pincode: "110001",
                    state: "Delhi"
                }
            ]
        };

        try {
            const response3 = await axios.put(
                `${baseURL}/api/users/updateAddress/${testUserId}`,
                testAddress3,
                {
                    headers: {
                        'Authorization': authToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response3.status === 200) {
                console.log('✅ Third address update successful');
                const savedAddress = response3.data.data.address[response3.data.data.address.length - 1];
                console.log('building_no value:', `"${savedAddress.building_no}"`);
                if (savedAddress.building_no === "") {
                    console.log('✅ Empty building_no field saved correctly!');
                } else {
                    console.log('⚠️  Empty building_no field not saved as expected');
                }
            } else {
                console.log('❌ Third address update failed:', response3.data);
            }
        } catch (error) {
            console.log('❌ Error in third address update:', error.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }

    console.log('\n🔍 Summary:');
    console.log('✅ building_no field should now be saved correctly');
    console.log('✅ The schema fix ensures proper field type definition');
    console.log('✅ All address fields should work as expected');
    console.log('\n📝 What was fixed:');
    console.log('1. Added missing "type:" keyword to building_no field in user model');
    console.log('2. building_no field now properly defined as String type');
    console.log('3. Address update endpoint should now save building_no correctly');
}

// Run the test
testAddressBuildingNoFix();
