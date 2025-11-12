const mongoose = require('mongoose');
const axios = require('axios');

// Test different Ceipal API endpoints to find the right one
const endpoints = [
  'https://api.ceipal.com/getCustomJobPostingDetails',
  'https://api.ceipal.com/jobs',
  'https://api.ceipal.com/api/jobs',
  'https://api.ceipal.com/v1/jobs',
  'https://api.ceipal.com/jobpostings',
  'https://api.ceipal.com/api/jobpostings',
  'https://api.ceipal.com/applicanttracking/jobs',
  'https://api.ceipal.com/ats/jobs',
  'https://api.ceipal.com/recruitment/jobs'
];

const credentials = {
  username: 'pankaj.b@techgene.com',
  password: 'Jupiter@9090'
};

async function testEndpoints() {
  console.log('🔍 Testing different Ceipal API endpoints...\n');
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    console.log(`${i + 1}. Testing: ${endpoint}`);
    
    try {
      // Build auth headers
      const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      };
      
      // Try with query params as well
      const params = {
        username: credentials.username,
        password: credentials.password
      };
      
      const response = await axios.get(endpoint, {
        headers,
        params,
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   🎉 SUCCESS! Found working endpoint: ${endpoint}`);
        console.log(`   📊 Response preview:`, typeof response.data === 'string' ? 
          response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200));
        break;
      } else if (response.status === 401) {
        console.log(`   🔐 Authentication required`);
      } else if (response.status === 403) {
        console.log(`   🚫 Forbidden - check credentials`);
      } else if (response.status === 404) {
        console.log(`   ❌ Not found`);
      } else {
        console.log(`   ⚠️ Other status: ${response.status}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ Domain not found`);
      } else {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('🏁 Endpoint testing complete!');
}

testEndpoints().catch(console.error);