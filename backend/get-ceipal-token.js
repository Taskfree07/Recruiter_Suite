const axios = require('axios');

// Attempt to get OAuth token from Ceipal
async function getCeipalToken() {
  const credentials = {
    username: 'pankaj.b@techgene.com',
    password: 'Jupiter@9090'
  };

  console.log('🔍 Attempting to get Ceipal Access Token...\n');

  // Common OAuth/Token endpoints to try
  const tokenEndpoints = [
    'https://api.ceipal.com/oauth/token',
    'https://api.ceipal.com/auth/token',
    'https://api.ceipal.com/token',
    'https://api.ceipal.com/api/token',
    'https://api.ceipal.com/api/auth/token',
    'https://api.ceipal.com/v1/oauth/token',
    'https://api.ceipal.com/v1/auth/login',
    'https://api.ceipal.com/login',
    'https://api.ceipal.com/api/login'
  ];

  for (const endpoint of tokenEndpoints) {
    console.log(`📍 Trying: ${endpoint}`);
    
    // Try different request formats
    const attempts = [
      // Attempt 1: JSON body
      {
        method: 'POST',
        data: credentials,
        headers: { 'Content-Type': 'application/json' }
      },
      // Attempt 2: Form data
      {
        method: 'POST',
        data: new URLSearchParams(credentials),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      },
      // Attempt 3: OAuth format
      {
        method: 'POST',
        data: new URLSearchParams({
          grant_type: 'password',
          username: credentials.username,
          password: credentials.password
        }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    ];

    for (let i = 0; i < attempts.length; i++) {
      try {
        const response = await axios({
          url: endpoint,
          ...attempts[i],
          timeout: 10000,
          validateStatus: (status) => status < 500
        });

        if (response.status === 200 && response.data) {
          console.log(`\n🎉 SUCCESS! Token obtained from: ${endpoint}`);
          console.log('Response:', JSON.stringify(response.data, null, 2));
          
          // Look for token in response
          const token = response.data.access_token || 
                       response.data.token || 
                       response.data.accessToken ||
                       response.data.bearer_token;
          
          if (token) {
            console.log(`\n✅ ACCESS TOKEN: ${token}`);
            console.log('\n📋 Save this token in your Ceipal Settings!');
            return token;
          }
        } else {
          console.log(`   Attempt ${i + 1}: ${response.status}`);
        }
      } catch (error) {
        if (error.response) {
          console.log(`   Attempt ${i + 1}: ${error.response.status}`);
        }
      }
    }
    console.log('');
  }

  console.log('❌ Could not obtain token automatically.');
  console.log('\n💡 Next Steps:');
  console.log('1. Log into Ceipal web interface');
  console.log('2. Go to Settings → API/Integrations');
  console.log('3. Generate or copy your API Access Token');
  console.log('4. Or contact Ceipal support: support@ceipal.com');
}

getCeipalToken().catch(console.error);
