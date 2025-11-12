/**
 * Test Ceipal Authentication - Official Documentation Method
 * Based on: https://developer.ceipal.com/ceipal-ats-version-one/ceipal-ats-v1-api-reference
 * 
 * This follows the EXACT structure from the official Ceipal API documentation
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer';

async function testOfficialAuth() {
  try {
    console.log('🔐 Testing Ceipal Authentication - Official Documentation Method\n');
    console.log('📖 Reference: https://developer.ceipal.com/ceipal-ats-version-one/\n');

    // Connect to MongoDB to get credentials
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const config = await mongoose.connection.db
      .collection('ceipalconfigs')
      .findOne({ userId: 'default-user' });

    if (!config) {
      console.error('❌ No Ceipal config found');
      process.exit(1);
    }

    console.log('📊 Using credentials:');
    console.log(`   Email: ${config.username}`);
    console.log(`   Password: ${'*'.repeat(8)}`);
    console.log(`   API Key: ${config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'Missing'}\n`);

    // Test different authentication endpoints
    const endpoints = [
      'https://api.ceipal.com/v1/auth/createToken/',  // From documentation
      'https://api.ceipal.com/v1/createAuthtoken/',   // Current implementation
      'https://api.ceipal.com/auth/createToken/',     // Without v1
      'https://api.ceipal.com/createAuthtoken/',      // Without v1
    ];

    // Official payload structure (from documentation)
    const authPayload = {
      email: config.username,
      password: config.password,
      api_key: config.apiKey
    };

    console.log('📤 Authentication Payload (per official docs):');
    console.log(`   email: ${authPayload.email}`);
    console.log(`   password: ${'*'.repeat(8)}`);
    console.log(`   api_key: ${authPayload.api_key.substring(0, 20)}...`);
    console.log('   (NOTE: No "module" or "json" parameters in official docs)\n');

    console.log('🧪 Testing different endpoints...\n');

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      console.log(`━`.repeat(70));
      console.log(`Test ${i + 1}/${endpoints.length}: ${endpoint}`);
      console.log(`━`.repeat(70));

      try {
        const response = await axios.post(endpoint, authPayload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: (status) => status < 500
        });

        console.log(`✅ Response Status: ${response.status}`);

        if (response.status === 200) {
          console.log(`\n🎉 SUCCESS! Working endpoint found: ${endpoint}\n`);
          console.log('📊 Response Data:');
          console.log(JSON.stringify(response.data, null, 2));

          const token = response.data.access_token || response.data.token || response.data.authToken;
          
          if (token) {
            console.log(`\n✅ Access Token: ${token.substring(0, 40)}...`);
            console.log(`\n📝 Use this endpoint in your configuration:`);
            console.log(`   ${endpoint}`);
            
            // Test token with jobs API
            console.log(`\n🧪 Testing token with Resume API...`);
            if (config.resumeApiUrl) {
              try {
                const testResponse = await axios.get(config.resumeApiUrl, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  params: {
                    page: 1,
                    paging_length: 5
                  },
                  timeout: 15000
                });

                console.log(`✅ Resume API Test: ${testResponse.status}`);
                console.log(`✅ Records found: ${testResponse.data.count || 'Unknown'}`);
                console.log(`\n🎊 COMPLETE SUCCESS! Both authentication and API access working!`);
              } catch (apiError) {
                console.log(`⚠️ Token works but API test failed: ${apiError.response?.status} - ${apiError.response?.statusText}`);
                console.log(`   This might be a permission or URL issue, not authentication.`);
              }
            }

            await mongoose.disconnect();
            process.exit(0);
          } else {
            console.log(`⚠️ Response successful but no token found`);
            console.log(`   Available fields:`, Object.keys(response.data));
          }
        } else if (response.status === 401 || response.status === 403) {
          console.log(`❌ Authentication Failed: ${response.status}`);
          console.log(`   Response:`, response.data);
          console.log(`   This could mean:`);
          console.log(`   - Invalid credentials`);
          console.log(`   - API key doesn't have permission`);
          console.log(`   - Account locked or inactive`);
        } else if (response.status === 404) {
          console.log(`❌ Not Found (404) - Endpoint doesn't exist`);
        } else {
          console.log(`⚠️ Unexpected status: ${response.status}`);
          console.log(`   Response:`, response.data);
        }

      } catch (error) {
        if (error.response) {
          console.log(`❌ HTTP Error: ${error.response.status} - ${error.response.statusText}`);
          console.log(`   Message:`, error.response.data);
        } else if (error.code === 'ENOTFOUND') {
          console.log(`❌ DNS Error: Cannot resolve endpoint`);
        } else {
          console.log(`❌ Network Error: ${error.message}`);
        }
      }

      console.log('');
    }

    console.log('━'.repeat(70));
    console.log('🏁 All endpoint tests complete');
    console.log('━'.repeat(70));
    console.log('\n⚠️ If none of the endpoints worked:');
    console.log('1. Verify your email, password, and API key are correct');
    console.log('2. Check if your Ceipal account has API access enabled');
    console.log('3. Contact Ceipal support to verify your API credentials');
    console.log('4. Check if there are IP whitelist restrictions');

    await mongoose.disconnect();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testOfficialAuth();
