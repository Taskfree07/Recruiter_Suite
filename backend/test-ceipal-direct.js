const axios = require('axios');

async function testCeipalAPI() {
  const apiKey = '312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd';
  const url = 'https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/b6d6b4f843d706549fa2b50f2dc9612a/';
  
  console.log('Testing Ceipal API...');
  console.log('URL:', url);
  console.log('API Key:', apiKey);
  console.log('\n--- Test 1: Bearer Token ---');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success with Bearer token!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    console.log('❌ Failed with Bearer token');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n--- Test 2: API Key Header ---');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success with X-API-Key header!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    console.log('❌ Failed with X-API-Key header');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n--- Test 3: No Authentication ---');
  
  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success with no auth!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    console.log('❌ Failed with no auth');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n--- Test 4: Basic Auth with Username/Password ---');
  
  try {
    const response = await axios.get(url, {
      auth: {
        username: 'pankaj.b@techgene.com',
        password: 'Jupiter@9090'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success with Basic Auth!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    console.log('❌ Failed with Basic Auth');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n--- Test 5: API Key in URL ---');
  
  try {
    const urlWithKey = `${url}?apiKey=${apiKey}`;
    const response = await axios.get(urlWithKey, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Success with API Key in URL!');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    console.log('❌ Failed with API Key in URL');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  console.log('\n=== RECOMMENDATION ===');
  console.log('The API key you have may not be valid.');
  console.log('Please get the correct API key from:');
  console.log('1. Login to https://app.ceipal.com');
  console.log('2. Go to Settings → API Settings');
  console.log('3. Generate or copy your API Key');
  console.log('4. Update it in the Ceipal Settings page');
}

testCeipalAPI();
