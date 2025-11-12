/**
 * Test the actual /api/ceipal/test-connection endpoint with detailed output
 */

const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🧪 Testing /api/ceipal/test-connection endpoint\n');
    console.log('📡 Sending POST to http://localhost:5000/api/ceipal/test-connection');
    console.log('📤 Payload: { userId: "default-user" }\n');
    
    const response = await axios.post('http://localhost:5000/api/ceipal/test-connection', {
      userId: 'default-user'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000,
      validateStatus: () => true // Don't throw on any status
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Data:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('\n✅ SUCCESS! Connection test passed!');
    } else {
      console.log('\n❌ FAILED! See response above for details');
    }

  } catch (error) {
    console.error('\n❌ Request Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend server is not running or not accessible on port 5000');
    }
  }
}

testEndpoint();
