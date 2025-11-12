const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function testAuthFromDB() {
  console.log('🔐 Testing Ceipal Authentication from Database Config\n');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const CeipalConfig = mongoose.model('CeipalConfig', new mongoose.Schema({}, { strict: false }));
    const config = await CeipalConfig.findOne({ userId: 'default-user' });
    
    if (!config) {
      console.log('❌ No config found');
      process.exit(1);
    }
    
    console.log('📋 Config loaded:');
    console.log('   Email:', config.username);
    console.log('   Password:', config.password ? '****' : 'MISSING');
    console.log('   API Key:', config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'MISSING');
    console.log('   Auth Endpoint:', config.authTokenEndpoint);
    console.log('   Two-step Auth:', config.useTwoStepAuth);
    
    // Step 1: Generate Token
    console.log('\n📡 Step 1: Generating auth token...');
    const authEndpoint = config.authTokenEndpoint || 'https://api.ceipal.com/v1/createAuthtoken/';
    
    try {
      const authResponse = await axios.post(authEndpoint, {
        email: config.username,
        password: config.password,
        api_key: config.apiKey
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      console.log('✅ Auth Status:', authResponse.status);
      const token = authResponse.data.access_token || authResponse.data.token;
      
      if (!token) {
        console.log('❌ No token in response');
        console.log('   Response:', authResponse.data);
        process.exit(1);
      }
      
      console.log('✅ Token:', token.substring(0, 30) + '...');
      
      // Step 2: Test Jobs API
      console.log('\n📡 Step 2: Testing jobs API with token...');
      const jobsUrl = `https://api.ceipal.com/getCustomJobPostingDetails/${config.tenantId}/${config.companyId}`;
      console.log('   URL:', jobsUrl);
      
      const jobsResponse = await axios.get(jobsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          paging_length: 5
        },
        timeout: 15000
      });
      
      console.log('✅ Jobs API Status:', jobsResponse.status);
      console.log('✅ Jobs count:', jobsResponse.data.count || 'Unknown');
      console.log('✅ Results:', jobsResponse.data.results?.length || 'Unknown');
      
      console.log('\n🎉 SUCCESS! Both authentication and API access working!');
      
    } catch (error) {
      console.error('\n❌ Request failed');
      console.error('   Status:', error.response?.status);
      console.error('   Error:', error.response?.data || error.message);
      
      if (error.response?.status === 403) {
        console.log('\n⚠️  403 Forbidden - Authentication issue');
        console.log('   Possible causes:');
        console.log('   1. Invalid email/password');
        console.log('   2. Invalid API key');
        console.log('   3. Account permissions issue');
        console.log('   4. Token generation failed but no error thrown');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testAuthFromDB();
