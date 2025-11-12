const mongoose = require('mongoose');
const axios = require('axios');

// Test POST requests and different authentication methods
const credentials = {
  username: 'pankaj.b@techgene.com',
  password: 'Jupiter@9090'
};

async function testCeipalAPI() {
  console.log('🔍 Testing Ceipal API with different methods...\n');
  
  const baseUrls = [
    'https://api.ceipal.com',
    'https://recruit.ceipal.com/api',
    'https://app.ceipal.com/api',
    'https://ceipal.com/api'
  ];
  
  const endpoints = [
    'getCustomJobPostingDetails',
    'jobs',
    'job-postings',
    'api/jobs',
    'rest/jobs'
  ];
  
  for (const baseUrl of baseUrls) {
    console.log(`🌐 Testing base URL: ${baseUrl}`);
    
    for (const endpoint of endpoints) {
      const fullUrl = `${baseUrl}/${endpoint}`;
      console.log(`  📍 Endpoint: ${fullUrl}`);
      
      // Test 1: GET with Basic Auth
      try {
        const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        const headers = {
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        
        const response = await axios.get(fullUrl, {
          headers,
          timeout: 8000,
          validateStatus: (status) => status < 500
        });
        
        console.log(`    GET: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`    🎉 SUCCESS with GET! Endpoint: ${fullUrl}`);
          console.log(`    📊 Response preview:`, typeof response.data === 'string' ? 
            response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200));
          return { method: 'GET', url: fullUrl, status: response.status };
        }
        
      } catch (error) {
        console.log(`    GET: ${error.response?.status || 'ERROR'}`);
      }
      
      // Test 2: POST with Basic Auth
      try {
        const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        const headers = {
          'Accept': 'application/json',
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        };
        
        const response = await axios.post(fullUrl, {}, {
          headers,
          timeout: 8000,
          validateStatus: (status) => status < 500
        });
        
        console.log(`    POST: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`    🎉 SUCCESS with POST! Endpoint: ${fullUrl}`);
          console.log(`    📊 Response preview:`, typeof response.data === 'string' ? 
            response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200));
          return { method: 'POST', url: fullUrl, status: response.status };
        }
        
      } catch (error) {
        console.log(`    POST: ${error.response?.status || 'ERROR'}`);
      }
      
      // Test 3: POST with form data
      try {
        const params = new URLSearchParams();
        params.append('username', credentials.username);
        params.append('password', credentials.password);
        
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        };
        
        const response = await axios.post(fullUrl, params, {
          headers,
          timeout: 8000,
          validateStatus: (status) => status < 500
        });
        
        console.log(`    FORM: ${response.status}`);
        
        if (response.status === 200) {
          console.log(`    🎉 SUCCESS with FORM! Endpoint: ${fullUrl}`);
          console.log(`    📊 Response preview:`, typeof response.data === 'string' ? 
            response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200));
          return { method: 'FORM', url: fullUrl, status: response.status };
        }
        
      } catch (error) {
        console.log(`    FORM: ${error.response?.status || 'ERROR'}`);
      }
      
      console.log('');
    }
    console.log('');
  }
  
  console.log('🏁 API testing complete! No working endpoints found.');
  console.log('💡 Suggestions:');
  console.log('   1. Check if you have the correct API base URL');
  console.log('   2. Verify your credentials are active');
  console.log('   3. Contact Ceipal support for correct API documentation');
  console.log('   4. Check if the API requires additional parameters or headers');
}

testCeipalAPI().catch(console.error);