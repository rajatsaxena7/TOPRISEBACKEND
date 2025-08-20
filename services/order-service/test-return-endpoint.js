const axios = require('axios');

// Test the return endpoint
async function testReturnEndpoint() {
  const userId = '6866875e68bef2112db897cb'; // The user ID from the error
  const baseUrl = 'http://localhost:5001';
  
  console.log('🧪 Testing Return Endpoint Fix...\n');
  
  try {
    // Test 1: Simple test endpoint
    console.log('1. Testing simple endpoint...');
    const testResponse = await axios.get(`${baseUrl}/api/returns/user/${userId}/test`);
    console.log('✅ Test endpoint response:', testResponse.data);
    
    // Test 2: Full endpoint
    console.log('\n2. Testing full endpoint...');
    const fullResponse = await axios.get(`${baseUrl}/api/returns/user/${userId}`);
    console.log('✅ Full endpoint response status:', fullResponse.status);
    console.log('✅ Response data keys:', Object.keys(fullResponse.data.data || {}));
    
    if (fullResponse.data.data?.returnRequests) {
      console.log(`✅ Found ${fullResponse.data.data.returnRequests.length} return requests`);
    }
    
    console.log('\n🎉 Return endpoint is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 This might indicate the dealer model issue is still present.');
      console.log('Check the server logs for more details.');
    }
  }
}

// Run the test
testReturnEndpoint();
