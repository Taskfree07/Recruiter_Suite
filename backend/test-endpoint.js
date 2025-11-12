/**
 * Test the actual /api/ceipal/test-connection endpoint
 */

const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🧪 Testing /api/ceipal/test-connection endpoint\n');
    
    const response = await axios.post('http://localhost:5000/api/ceipal/test-connection', {
      userId: 'default-user'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.status);
    console.error('Message:', error.response?.data);
    console.error('Full error:', error.message);
  }
}

testEndpoint();
