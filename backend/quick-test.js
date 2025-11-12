const axios = require('axios');

async function quickTest() {
  console.log('Testing Ceipal API endpoint...\n');
  
  try {
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
    console.log('❌ Failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    console.log('\nFull error:', error);
  }
}

quickTest();
