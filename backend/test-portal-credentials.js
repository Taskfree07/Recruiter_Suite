/**
 * Test if portal credentials work for API access
 */

const axios = require('axios');

async function testPortalCredentials() {
  console.log('\n🔐 Testing Portal Credentials for API Access...\n');
  
  const portalUsername = 'Matt.s@techgene.com';
  const portalPassword = 'King@1234';
  
  console.log('📋 Attempting login with portal credentials:');
  console.log(`   Username: ${portalUsername}`);
  console.log(`   Password: ${'*'.repeat(portalPassword.length)}`);
  console.log('');

  try {
    const loginUrl = 'https://api.ilabor360.com/v2/rest/login';
    
    // Test 1: Try with email as userName and password only (no key)
    console.log('🧪 Test 1: Email + Password (no API key)...');
    try {
      const response1 = await axios.post(loginUrl, null, {
        params: {
          userName: portalUsername,
          password: portalPassword
        },
        timeout: 15000,
        validateStatus: () => true
      });
      
      console.log('Response:', JSON.stringify(response1.data, null, 2));
      
      if (response1.data.status === 'success') {
        console.log('\n✅ SUCCESS! Portal credentials work for API!');
        console.log(`Token: ${response1.data.result}`);
        return response1.data.result;
      }
    } catch (e) {
      console.log('❌ Failed:', e.message);
    }
    
    console.log('');
    
    // Test 2: Try with email as both userName AND key
    console.log('🧪 Test 2: Email as userName AND key + Password...');
    try {
      const response2 = await axios.post(loginUrl, null, {
        params: {
          userName: portalUsername,
          key: portalUsername, // Using email as key too
          password: portalPassword
        },
        timeout: 15000,
        validateStatus: () => true
      });
      
      console.log('Response:', JSON.stringify(response2.data, null, 2));
      
      if (response2.data.status === 'success') {
        console.log('\n✅ SUCCESS! Portal credentials work for API!');
        console.log(`Token: ${response2.data.result}`);
        return response2.data.result;
      }
    } catch (e) {
      console.log('❌ Failed:', e.message);
    }
    
    console.log('');
    
    // Test 3: Try just username part before @
    const usernameOnly = portalUsername.split('@')[0];
    console.log('🧪 Test 3: Username only (Matt.s) + Password...');
    try {
      const response3 = await axios.post(loginUrl, null, {
        params: {
          userName: usernameOnly,
          password: portalPassword
        },
        timeout: 15000,
        validateStatus: () => true
      });
      
      console.log('Response:', JSON.stringify(response3.data, null, 2));
      
      if (response3.data.status === 'success') {
        console.log('\n✅ SUCCESS! Portal credentials work for API!');
        console.log(`Token: ${response3.data.result}`);
        return response3.data.result;
      }
    } catch (e) {
      console.log('❌ Failed:', e.message);
    }
    
    console.log('\n');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('❌ PORTAL CREDENTIALS DO NOT WORK FOR API ACCESS');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 What this means:');
    console.log('');
    console.log('Your portal login (Matt.s@techgene.com / King@1234) is for:');
    console.log('   ✅ Logging into https://vendor.ilabor360.com');
    console.log('   ❌ NOT for the REST API');
    console.log('');
    console.log('The REST API requires SEPARATE credentials:');
    console.log('   1. API Username (not necessarily your email)');
    console.log('   2. API Key (a unique key string)');
    console.log('   3. API Password (different from portal password)');
    console.log('   4. System User ID (a numeric or GUID identifier)');
    console.log('');
    console.log('📞 Action Required:');
    console.log('   Contact your iLabor360 account manager and request:');
    console.log('   "REST API v2.0 access credentials"');
    console.log('');
    console.log('They will provide you with 4 separate values for API access.');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error testing credentials:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('⚠️  Cannot reach iLabor360 API server.');
      console.log('   This could mean:');
      console.log('   - Network/firewall issue');
      console.log('   - API endpoint has changed');
      console.log('   - API server is down');
    }
  }
}

testPortalCredentials();
