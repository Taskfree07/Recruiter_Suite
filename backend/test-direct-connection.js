/**
 * Direct test of what the backend testConnection() does
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

async function testDirectConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    
    const config = await mongoose.connection.db
      .collection('ceipalconfigs')
      .findOne({ userId: 'default-user' });

    console.log('📊 Config:');
    console.log(`   Email: ${config.username}`);
    console.log(`   API Key: ${config.apiKey.substring(0, 20)}...`);
    console.log(`   Resume URL: ${config.resumeApiUrl}\n`);

    // Step 1: Generate token (exactly like buildAuthHeaders does)
    console.log('Step 1: Generating token...');
    const authEndpoint = 'https://api.ceipal.com/v1/createAuthtoken/';
    
    const authPayload = {
      email: config.username,
      password: config.password,
      api_key: config.apiKey
    };

    const authResponse = await axios.post(authEndpoint, authPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });

    const token = authResponse.data.access_token;
    console.log(`✅ Token: ${token.substring(0, 40)}...\n`);

    // Step 2: Test Resume API (exactly like testConnection does)
    console.log('Step 2: Testing Resume API...');
    
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const params = {
      page: 1,
      paging_length: 5
    };

    console.log(`📍 URL: ${config.resumeApiUrl}`);
    console.log(`📤 Headers: Authorization = Bearer ${token.substring(0, 30)}...`);
    console.log(`📤 Params:`, params);

    const response = await axios.get(config.resumeApiUrl, {
      headers,
      params,
      timeout: 15000,
      validateStatus: (status) => status < 500
    });

    console.log(`\n📊 Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`✅ SUCCESS!`);
      console.log(`   Count: ${response.data.count}`);
    } else if (response.status === 403) {
      console.log(`❌ 403 FORBIDDEN`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      
      // Check if it's a permission issue with this specific URL
      console.log(`\n🔍 Checking if token is valid with another endpoint...`);
      const jobsUrl = 'https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/b6d6b4f843d706549fa2b50f2dc9612a';
      
      try {
        const jobsResponse = await axios.get(jobsUrl, {
          headers,
          params: { paging_length: 5 },
          timeout: 15000
        });
        
        console.log(`✅ Jobs API works: ${jobsResponse.status} - Token is valid!`);
        console.log(`   This means the Resume API URL might require different credentials/permissions`);
      } catch (jobsError) {
        console.log(`❌ Jobs API also failed: ${jobsError.response?.status}`);
      }
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    await mongoose.disconnect();
  }
}

testDirectConnection();
