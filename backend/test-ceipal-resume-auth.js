/**
 * Test Ceipal Resume Authentication Flow
 * This script tests:
 * 1. Token generation from https://api.ceipal.com/v1/createAuthtoken/
 * 2. Using token to fetch resumes from Resume API URL
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats-optimizer';

async function testCeipalResumeAuth() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Query config directly from MongoDB (avoiding TypeScript import issues)
    console.log('📋 Fetching Ceipal config for default-user...');
    const config = await mongoose.connection.db.collection('ceipalconfigs').findOne({ userId: 'default-user' });

    if (!config) {
      console.error('❌ No Ceipal config found. Please configure Ceipal first.');
      process.exit(1);
    }

    console.log('✅ Config found\n');
    console.log('📊 Configuration:');
    console.log(`   Mock Mode: ${config.mockMode}`);
    console.log(`   API Key: ${config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'Not set'}`);
    console.log(`   Username: ${config.username || 'EMPTY/NOT SET'}`);
    console.log(`   Password: ${config.password ? '***' + config.password.substring(config.password.length - 3) : 'Not set'}`);
    console.log(`   Resume API URL: ${config.resumeApiUrl || 'Not set'}`);
    console.log(`   Custom Endpoint (old): ${config.customEndpoint || 'Not set'}\n`);

    // Validate required fields
    if (!config.apiKey || config.apiKey === 'MOCK_API_KEY') {
      console.error('❌ API Key is missing or set to MOCK_API_KEY');
      process.exit(1);
    }

    if (!config.username || config.username === '') {
      console.error('❌ Username/Email is missing or empty');
      console.error('   Please go to Ceipal Settings and enter your email in the Username field');
      process.exit(1);
    }

    if (!config.password) {
      console.error('❌ Password is missing');
      process.exit(1);
    }

    const resumeApiUrl = config.resumeApiUrl || config.customEndpoint;
    if (!resumeApiUrl) {
      console.error('❌ Resume API URL is missing');
      console.error('   Please go to Ceipal Settings and enter your Resume API URL');
      process.exit(1);
    }

    // Step 1: Generate Token
    console.log('━'.repeat(60));
    console.log('STEP 1: Generate Access Token');
    console.log('━'.repeat(60));

    const authEndpoint = 'https://api.ceipal.com/v1/createAuthtoken/';
    console.log(`🔐 Auth Endpoint: ${authEndpoint}`);

    const authPayload = {
      email: config.username,
      password: config.password,
      api_key: config.apiKey
    };

    console.log('📤 Request Payload:');
    console.log(`   email: ${authPayload.email}`);
    console.log(`   password: ${'*'.repeat(authPayload.password.length)}`);
    console.log(`   api_key: ${authPayload.api_key.substring(0, 20)}...\n`);

    console.log('📡 Sending POST request to auth endpoint...');

    let accessToken = null;
    try {
      const authResponse = await axios.post(authEndpoint, authPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      console.log(`✅ Response Status: ${authResponse.status}`);
      console.log(`📊 Response Data:`, JSON.stringify(authResponse.data, null, 2));

      if (authResponse.status === 200) {
        accessToken = authResponse.data.access_token ||
                     authResponse.data.token ||
                     authResponse.data.authToken;

        if (accessToken) {
          console.log(`\n✅ Access Token Generated: ${accessToken.substring(0, 30)}...\n`);
        } else {
          console.error('\n❌ No token found in response');
          console.error('Available fields:', Object.keys(authResponse.data));
          process.exit(1);
        }
      } else {
        console.error(`\n❌ Auth failed with status ${authResponse.status}`);
        console.error('Response:', authResponse.data);
        process.exit(1);
      }
    } catch (authError) {
      console.error('\n❌ Token Generation Failed');
      console.error('Status:', authError.response?.status);
      console.error('Status Text:', authError.response?.statusText);
      console.error('Error Data:', authError.response?.data);
      console.error('Error Message:', authError.message);
      process.exit(1);
    }

    // Step 2: Test Resume API
    console.log('━'.repeat(60));
    console.log('STEP 2: Test Resume API');
    console.log('━'.repeat(60));

    console.log(`📍 Resume API URL: ${resumeApiUrl}`);

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    const params = {
      page: 1,
      paging_length: 5
    };

    console.log('📤 Request Headers:');
    console.log(`   Authorization: Bearer ${accessToken.substring(0, 30)}...`);
    console.log(`   Content-Type: application/json`);
    console.log('\n📤 Request Params:');
    console.log(`   page: ${params.page}`);
    console.log(`   paging_length: ${params.paging_length}\n`);

    console.log('📡 Sending GET request to Resume API...');

    try {
      const resumeResponse = await axios.get(resumeApiUrl, {
        headers,
        params,
        timeout: 15000,
        validateStatus: (status) => status < 500
      });

      console.log(`✅ Response Status: ${resumeResponse.status}`);
      console.log(`📊 Response Headers:`, Object.keys(resumeResponse.headers));

      if (resumeResponse.status === 200) {
        console.log(`\n✅ SUCCESS! Resume API is working!\n`);
        console.log('📊 Response Data Preview:');
        const preview = JSON.stringify(resumeResponse.data, null, 2);
        console.log(preview.substring(0, 500) + (preview.length > 500 ? '...' : ''));

        const count = resumeResponse.data.count || 0;
        const results = resumeResponse.data.results || resumeResponse.data.data || [];
        console.log(`\n📈 Stats:`);
        console.log(`   Total Count: ${count}`);
        console.log(`   Results in Response: ${results.length}`);
      } else {
        console.error(`\n❌ API returned status ${resumeResponse.status}`);
        console.error('Response:', resumeResponse.data);
        process.exit(1);
      }
    } catch (apiError) {
      console.error('\n❌ Resume API Call Failed');
      console.error('Status:', apiError.response?.status);
      console.error('Status Text:', apiError.response?.statusText);
      console.error('Error Data:', apiError.response?.data);
      console.error('Error Message:', apiError.message);

      if (apiError.response?.status === 404) {
        console.error('\n🔍 404 Error Debugging:');
        console.error('   - Check if Resume API URL is correct');
        console.error('   - Verify the endpoint exists in Ceipal');
        console.error('   - Current URL:', resumeApiUrl);
      }

      process.exit(1);
    }

    console.log('\n━'.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run test
testCeipalResumeAuth();
