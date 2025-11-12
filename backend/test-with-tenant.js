const axios = require('axios');

// From your previous configuration
const credentials = {
  username: 'pankaj.b@techgene.com',
  password: 'Jupiter@9090'
};

// These were in your previous config - let's test WITH them
const tenantId = 'Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09';
const companyId = 'b6d6b4f843d706549fa2b50f2dc9612a';

async function testWithTenantCompany() {
  console.log('🔍 Testing Ceipal API WITH Tenant ID and Company ID...\n');
  console.log(`📋 Tenant ID: ${tenantId}`);
  console.log(`📋 Company ID: ${companyId}\n`);
  
  const endpoints = [
    `https://api.ceipal.com/getCustomJobPostingDetails/${tenantId}/${companyId}`,
    `https://api.ceipal.com/getCustomJobPostingDetails/${tenantId}/${companyId}/`,
    `https://api.ceipal.com/${tenantId}/${companyId}/jobs`,
    `https://api.ceipal.com/${tenantId}/${companyId}/getCustomJobPostingDetails`,
    `https://api.ceipal.com/v1/${tenantId}/${companyId}/jobs`,
    `https://api.ceipal.com/api/${tenantId}/${companyId}/jobs`
  ];
  
  for (const endpoint of endpoints) {
    console.log(`📍 Testing: ${endpoint}`);
    
    // Test with Basic Auth
    try {
      const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      const headers = {
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };
      
      const response = await axios.get(endpoint, {
        headers,
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      console.log(`   ✅ Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`   🎉 SUCCESS! Found working endpoint!`);
        console.log(`   📊 Response type:`, typeof response.data);
        
        if (Array.isArray(response.data)) {
          console.log(`   📊 Array with ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log(`   📋 First item keys:`, Object.keys(response.data[0]));
          }
        } else if (typeof response.data === 'object') {
          console.log(`   📊 Object with keys:`, Object.keys(response.data));
        }
        
        console.log(`   📄 Response preview:`, JSON.stringify(response.data).substring(0, 500));
        return { success: true, endpoint, data: response.data };
      } else if (response.status === 401) {
        console.log(`   🔐 Unauthorized - credentials may be invalid`);
      } else if (response.status === 403) {
        console.log(`   🚫 Forbidden - access denied`);
      } else if (response.status === 404) {
        console.log(`   ❌ Not found`);
      } else {
        console.log(`   ⚠️ Status: ${response.status}`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Error: ${error.response.status}`);
        if (error.response.data) {
          console.log(`   📄 Error details:`, typeof error.response.data === 'string' ? 
            error.response.data.substring(0, 200) : 
            JSON.stringify(error.response.data).substring(0, 200));
        }
      } else {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('🏁 Testing complete!');
}

testWithTenantCompany().catch(console.error);