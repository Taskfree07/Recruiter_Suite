/**
 * Test Ceipal Sync via Backend API
 * Tests the actual /api/ceipal/sync-resumes endpoint
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSyncAPI() {
  try {
    console.log('🧪 Testing Ceipal Sync via Backend API\n');

    // Test 1: Get Config
    console.log('━'.repeat(60));
    console.log('Test 1: Get Ceipal Configuration');
    console.log('━'.repeat(60));
    
    const configResponse = await axios.get(`${API_URL}/api/ceipal/config`, {
      params: { userId: 'default-user' }
    });

    console.log('✅ Status:', configResponse.status);
    console.log('📊 Config:');
    console.log(`   Mock Mode: ${configResponse.data.mockMode}`);
    console.log(`   Connection Status: ${configResponse.data.connectionStatus}`);
    console.log(`   Last Sync: ${configResponse.data.lastSyncDate || 'Never'}`);
    console.log('');

    // Test 2: Test Connection
    console.log('━'.repeat(60));
    console.log('Test 2: Test Connection');
    console.log('━'.repeat(60));

    const testResponse = await axios.post(`${API_URL}/api/ceipal/test-connection`, {
      userId: 'default-user'
    });

    console.log('✅ Status:', testResponse.status);
    console.log('📊 Result:', testResponse.data.message);
    console.log('');

    // Test 3: Sync Resumes
    console.log('━'.repeat(60));
    console.log('Test 3: Sync Resumes (This may take a moment...)');
    console.log('━'.repeat(60));

    console.log('⏳ Starting sync... (syncing first 100 resumes)');
    
    const syncResponse = await axios.post(`${API_URL}/api/ceipal/sync-resumes`, {
      userId: 'default-user'
    }, {
      timeout: 120000 // 2 minutes timeout
    });

    console.log('✅ Status:', syncResponse.status);
    console.log('📊 Sync Results:');
    console.log(`   Message: ${syncResponse.data.message}`);
    if (syncResponse.data.stats) {
      console.log(`   Total: ${syncResponse.data.stats.total}`);
      console.log(`   Added: ${syncResponse.data.stats.added}`);
      console.log(`   Updated: ${syncResponse.data.stats.updated}`);
      console.log(`   Skipped: ${syncResponse.data.stats.skipped}`);
    }
    console.log('');

    console.log('━'.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Test Failed');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    console.error('\nMake sure backend is running: npm start');
  }
}

testSyncAPI();
