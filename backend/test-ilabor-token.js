/**
 * iLabor360 REST API v2.0 - Token Generation Test
 * 
 * This script tests the API login and token generation
 * based on the documentation you provided.
 */

const axios = require('axios');

// =============================================================================
// CONFIGURATION - REPLACE WITH YOUR ACTUAL CREDENTIALS
// =============================================================================

const API_CONFIG = {
  // Base URL
  baseUrl: 'https://api.ilabor360.com/v2/rest',
  
  // Your API Credentials (REPLACE THESE!)
  apiUsername: 'YOUR_API_USERNAME',        // Replace with actual username
  apiKey: 'YOUR_API_KEY',                   // Replace with actual key
  apiPassword: 'YOUR_API_PASSWORD',         // Replace with actual password
  sysUserId: 'YOUR_SYSTEM_USER_ID'          // Replace with actual user ID
};

// =============================================================================
// STEP 1: Login and Get Token
// =============================================================================

async function getApiToken() {
  console.log('\n🔐 STEP 1: Requesting API Token...\n');
  
  try {
    const loginUrl = `${API_CONFIG.baseUrl}/login`;
    console.log(`📡 Calling: ${loginUrl}`);
    console.log(`📋 Parameters:`);
    console.log(`   - userName: ${API_CONFIG.apiUsername}`);
    console.log(`   - key: ${API_CONFIG.apiKey.substring(0, 5)}***`);
    console.log(`   - password: ${'*'.repeat(API_CONFIG.apiPassword.length)}`);
    console.log('');

    const response = await axios.post(loginUrl, null, {
      params: {
        userName: API_CONFIG.apiUsername,
        key: API_CONFIG.apiKey,
        password: API_CONFIG.apiPassword
      },
      timeout: 30000
    });

    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    console.log('');

    if (response.data.status === 'success' && response.data.result) {
      const token = response.data.result;
      console.log('✅ SUCCESS! API Token obtained:');
      console.log(`   Token: ${token.substring(0, 20)}...`);
      console.log(`   Validity: 15 minutes`);
      console.log('');
      return token;
    } else if (response.data.status === 'error') {
      console.error('❌ ERROR:', response.data.error);
      throw new Error(response.data.error.message || 'Authentication failed');
    } else {
      throw new Error('Unexpected response format');
    }

  } catch (error) {
    console.error('\n❌ FAILED TO GET TOKEN\n');
    
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Cannot reach API server.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Request timeout. API server is not responding.');
    } else {
      console.error('Error:', error.message);
    }
    
    throw error;
  }
}

// =============================================================================
// STEP 2: Fetch Requisitions Using Token
// =============================================================================

async function fetchRequisitions(apiToken) {
  console.log('\n📥 STEP 2: Fetching Requisitions...\n');
  
  try {
    // Calculate date range (today and yesterday)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 1);

    // Format dates as MM/DD/YYYY
    const formatDate = (date) => {
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const reqProvUrl = `${API_CONFIG.baseUrl}/ReqProv`;
    console.log(`📡 Calling: ${reqProvUrl}`);
    console.log(`📋 Parameters:`);
    console.log(`   - apiToken: ${apiToken.substring(0, 20)}...`);
    console.log(`   - userName: ${API_CONFIG.apiUsername}`);
    console.log(`   - sysUserID: ${API_CONFIG.sysUserId}`);
    console.log(`   - StartDate: ${startDateStr}`);
    console.log(`   - EndDate: ${endDateStr}`);
    console.log('');

    const response = await axios.get(reqProvUrl, {
      params: {
        apiToken: apiToken,
        userName: API_CONFIG.apiUsername,
        sysUserID: API_CONFIG.sysUserId,
        StartDate: startDateStr,
        EndDate: endDateStr
      },
      timeout: 60000
    });

    console.log('📥 Response Status:', response.data.status);
    console.log('');

    if (response.data.status === 'success' && Array.isArray(response.data.result)) {
      const requisitions = response.data.result;
      console.log(`✅ SUCCESS! Retrieved ${requisitions.length} requisitions`);
      console.log('');

      if (requisitions.length > 0) {
        console.log('📋 Sample Requisition (first one):');
        console.log('');
        const sample = requisitions[0];
        console.log(`   ID: ${sample.requisition_id}`);
        console.log(`   Job Title: ${sample.job_title_code || sample.position_type_name}`);
        console.log(`   Company: ${sample.customer_name || sample.client_name}`);
        console.log(`   Department: ${sample.department_name}`);
        console.log(`   Positions: ${sample.no_of_positions}`);
        console.log(`   Status: ${sample.status_name}`);
        console.log(`   Location: ${sample.location?.city}, ${sample.location?.state}`);
        console.log(`   Skills: ${sample.primary_skill_set}`);
        console.log(`   Bill Rate: $${sample.bill_rate_low}/hr`);
        console.log('');
        
        // Show all requisition IDs
        console.log('📋 All Requisition IDs:');
        requisitions.forEach((req, idx) => {
          console.log(`   ${idx + 1}. ID: ${req.requisition_id} - ${req.job_title_code || req.position_type_name || 'Untitled'}`);
        });
      } else {
        console.log('⚠️  No requisitions found in the date range.');
        console.log('   Try increasing the date range or use modifyStartDate/modifyEndDate instead.');
      }

      return requisitions;

    } else if (response.data.status === 'error') {
      console.error('❌ ERROR:', response.data.error);
      throw new Error(response.data.error.message || 'Failed to fetch requisitions');
    } else {
      throw new Error('Unexpected response format');
    }

  } catch (error) {
    console.error('\n❌ FAILED TO FETCH REQUISITIONS\n');
    
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    throw error;
  }
}

// =============================================================================
// MAIN TEST FUNCTION
// =============================================================================

async function testILaborAPI() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   iLabor360 REST API v2.0 - Token Generation & Test          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  
  // Check if credentials are configured
  if (
    API_CONFIG.apiUsername === 'YOUR_API_USERNAME' ||
    API_CONFIG.apiKey === 'YOUR_API_KEY' ||
    API_CONFIG.apiPassword === 'YOUR_API_PASSWORD' ||
    API_CONFIG.sysUserId === 'YOUR_SYSTEM_USER_ID'
  ) {
    console.log('\n❌ ERROR: Credentials not configured!\n');
    console.log('Please edit this file and replace the placeholder values:');
    console.log('');
    console.log('   Lines 14-17:');
    console.log('   - apiUsername: YOUR_API_USERNAME');
    console.log('   - apiKey: YOUR_API_KEY');
    console.log('   - apiPassword: YOUR_API_PASSWORD');
    console.log('   - sysUserId: YOUR_SYSTEM_USER_ID');
    console.log('');
    console.log('📞 Contact your iLabor360 account manager to get these credentials.');
    console.log('');
    process.exit(1);
  }

  try {
    // Step 1: Get token
    const token = await getApiToken();
    
    // Step 2: Fetch requisitions
    const requisitions = await fetchRequisitions(token);
    
    // Summary
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ TEST COMPLETED SUCCESSFULLY!                             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Token generated: ✅`);
    console.log(`   - Token validity: 15 minutes`);
    console.log(`   - Requisitions retrieved: ${requisitions.length}`);
    console.log('');
    console.log('🎉 Your iLabor360 API credentials are working correctly!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Run: node setup-ilabor-api.js (to save credentials to database)');
    console.log('   2. Use the frontend to sync jobs automatically');
    console.log('');

  } catch (error) {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║   ❌ TEST FAILED                                              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('');
    console.log('1. Verify your credentials are correct');
    console.log('   - API Username');
    console.log('   - API Key');
    console.log('   - API Password (NOT your portal password)');
    console.log('   - System User ID');
    console.log('');
    console.log('2. Check with your iLabor360 account manager:');
    console.log('   - Confirm you have API access enabled');
    console.log('   - Verify the credentials are for REST API v2.0');
    console.log('');
    console.log('3. Network issues:');
    console.log('   - Check your internet connection');
    console.log('   - Verify no firewall is blocking https://api.ilabor360.com');
    console.log('');
    
    process.exit(1);
  }
}

// Run the test
testILaborAPI();
