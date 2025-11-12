const axios = require('axios');

async function testCompleteFlow() {
  console.log('🔐 Testing Complete Ceipal Authentication Flow\n');
  
  const credentials = {
    email: 'pankaj.b@techgene.com',
    password: 'Jupiter@9090',
    api_key: '312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd'
  };
  
  const authEndpoint = 'https://api.ceipal.com/v1/createAuthtoken/';
  const jobsEndpoint = 'https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/b6d6b4f843d706549fa2b50f2dc9612a';
  
  try {
    // Step 1: Generate Auth Token
    console.log('📡 Step 1: Generating Auth Token...');
    console.log(`   Endpoint: ${authEndpoint}`);
    console.log(`   Email: ${credentials.email}`);
    console.log(`   API Key: ${credentials.api_key.substring(0, 20)}...`);
    
    const authResponse = await axios.post(authEndpoint, {
      email: credentials.email,
      password: credentials.password,
      api_key: credentials.api_key
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`✅ Auth Response Status: ${authResponse.status}`);
    console.log(`   Response:`, JSON.stringify(authResponse.data, null, 2));
    
    const token = authResponse.data.token || authResponse.data.authToken || authResponse.data.access_token;
    
    if (!token) {
      console.log('\n❌ No token found in response!');
      console.log('   Available fields:', Object.keys(authResponse.data));
      return;
    }
    
    console.log(`\n✅ Token Generated: ${token.substring(0, 30)}...`);
    
    // Step 2: Fetch Jobs with Token
    console.log(`\n📡 Step 2: Fetching Jobs with Token...`);
    console.log(`   Endpoint: ${jobsEndpoint}`);
    console.log(`   Authorization: Bearer ${token.substring(0, 20)}...`);
    
    const jobsResponse = await axios.get(jobsEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        paging_length: 40
      },
      timeout: 30000
    });
    
    console.log(`\n✅ Jobs Response Status: ${jobsResponse.status}`);
    console.log(`   Jobs fetched: ${Array.isArray(jobsResponse.data) ? jobsResponse.data.length : 'Unknown'}`);
    
    if (Array.isArray(jobsResponse.data) && jobsResponse.data.length > 0) {
      console.log(`\n📋 Sample Job:`);
      const sampleJob = jobsResponse.data[0];
      console.log(`   Job Code: ${sampleJob.job_code || 'N/A'}`);
      console.log(`   Job Title: ${sampleJob.job_title || 'N/A'}`);
      console.log(`   Job Status: ${sampleJob.job_status || 'N/A'}`);
      console.log(`   Client: ${sampleJob.client || 'N/A'}`);
      console.log(`   Location: ${sampleJob.location || `${sampleJob.city}, ${sampleJob.states}` || 'N/A'}`);
      console.log(`   Primary Skills: ${sampleJob.primary_skills || 'N/A'}`);
      console.log(`\n   Available Fields: ${Object.keys(sampleJob).length}`);
      console.log(`   Fields:`, Object.keys(sampleJob).slice(0, 20).join(', '));
    } else {
      console.log(`\n   Full Response:`, JSON.stringify(jobsResponse.data, null, 2).substring(0, 500));
    }
    
    console.log(`\n\n🎉 SUCCESS! Authentication flow works perfectly!`);
    console.log(`\n📋 Summary:`);
    console.log(`   ✅ Token generation: Working`);
    console.log(`   ✅ Jobs API: Working`);
    console.log(`   ✅ Authentication: Complete`);
    console.log(`\nYour system is ready to use!`);
    
  } catch (error) {
    console.error(`\n❌ Error:`, error.response?.status, error.response?.statusText);
    console.error(`   Message:`, error.response?.data || error.message);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log(`\n⚠️  Authentication failed. Please verify:`);
      console.log(`   1. Email: ${credentials.email}`);
      console.log(`   2. Password: ****`);
      console.log(`   3. API Key: ${credentials.api_key}`);
    }
  }
}

testCompleteFlow();
