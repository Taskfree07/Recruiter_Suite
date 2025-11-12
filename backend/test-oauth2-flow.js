/**
 * Test OAuth2 Client Credentials Flow
 * Based on the error message suggesting grant_type should be 'client_credentials'
 */

const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer';

async function testOAuth2() {
  try {
    console.log('🔐 Testing Ceipal OAuth2 Client Credentials Flow\n');

    await mongoose.connect(MONGODB_URI);
    const config = await mongoose.connection.db
      .collection('ceipalconfigs')
      .findOne({ userId: 'default-user' });

    if (!config) {
      console.error('❌ No config found');
      process.exit(1);
    }

    console.log('Testing with OAuth2 client_credentials grant type...\n');

    const endpoint = 'https://api.ceipal.com/createAuthtoken/';

    // Try OAuth2 client credentials format
    const payload = {
      grant_type: 'client_credentials',
      client_id: config.apiKey,
      client_secret: config.password,
      email: config.username
    };

    console.log('📤 Payload:');
    console.log(`   grant_type: client_credentials`);
    console.log(`   client_id: ${config.apiKey.substring(0, 20)}...`);
    console.log(`   client_secret: ********`);
    console.log(`   email: ${config.username}\n`);

    try {
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('✅ Response:', response.status);
      console.log(JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log(`❌ Status: ${error.response?.status}`);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

testOAuth2();
