const axios = require('axios');

async function testCeipalAuthFlow() {
  const apiKey = '312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd';
  
  console.log('=== CEIPAL TWO-STEP AUTHENTICATION ===\n');
  
  // Step 1: Generate Auth Token
  console.log('Step 1: Generating Auth Token...');
  console.log('API Key:', apiKey);
  
  try {
    // Try different auth token endpoints
    const possibleAuthEndpoints = [
      'https://api.ceipal.com/v1/auth/token',
      'https://api.ceipal.com/auth/token',
      'https://api.ceipal.com/token',
      'https://api.ceipal.com/v1/authenticate',
      'https://api.ceipal.com/authenticate',
      'https://api.ceipal.com/getAuthToken'
    ];
    
    let authToken = null;
    let successfulEndpoint = null;
    
    for (const endpoint of possibleAuthEndpoints) {
      console.log(`\nTrying: ${endpoint}`);
      try {
        const response = await axios.post(endpoint, {
          api_key: apiKey,
          json: 1
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        authToken = response.data.token || response.data.authToken || response.data.access_token;
        successfulEndpoint = endpoint;
        break;
      } catch (error) {
        console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
      }
    }
    
    if (!authToken) {
      console.log('\n❌ Could not generate auth token from any endpoint');
      console.log('\nTrying with query parameters instead of body...');
      
      // Try with query parameters
      for (const endpoint of possibleAuthEndpoints) {
        console.log(`\nTrying: ${endpoint}?api_key=...&json=1`);
        try {
          const response = await axios.get(`${endpoint}?api_key=${apiKey}&json=1`);
          
          console.log('✅ Success!');
          console.log('Response:', JSON.stringify(response.data, null, 2));
          authToken = response.data.token || response.data.authToken || response.data.access_token;
          successfulEndpoint = endpoint;
          break;
        } catch (error) {
          console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
        }
      }
    }
    
    if (authToken) {
      console.log('\n✅ Auth Token Generated Successfully!');
      console.log('Endpoint:', successfulEndpoint);
      console.log('Auth Token:', authToken);
      
      // Step 2: Use Auth Token to Get Jobs
      console.log('\n\nStep 2: Fetching Jobs with Auth Token...');
      const jobsUrl = 'https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/b6d6b4f843d706549fa2b50f2dc9612a/';
      
      console.log('URL:', jobsUrl);
      console.log('Using Auth Token:', authToken.substring(0, 20) + '...');
      
      try {
        const response = await axios.get(jobsUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('\n✅ SUCCESS! Jobs fetched successfully!');
        console.log('Status:', response.status);
        console.log('Jobs count:', response.data?.length || 'N/A');
        console.log('Sample data:', JSON.stringify(response.data, null, 2).substring(0, 1000));
      } catch (error) {
        console.log('\n❌ Failed to fetch jobs with auth token');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
      }
    } else {
      console.log('\n❌ Could not generate auth token');
      console.log('\nPossible reasons:');
      console.log('1. The auth token endpoint URL is different');
      console.log('2. Additional parameters are required');
      console.log('3. The API key needs to be sent in headers');
      console.log('\nPlease check Ceipal API documentation for the correct auth endpoint.');
    }
    
  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
  }
}

testCeipalAuthFlow();
