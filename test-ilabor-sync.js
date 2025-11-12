/**
 * Test iLabor360 Sync Flow
 * This script tests the complete sync workflow
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';
const userId = 'default-user';

async function testSync() {
  console.log('🧪 Testing iLabor360 Sync Flow\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Check if config exists
    console.log('\n📋 Step 1: Checking configuration...');
    try {
      const configResponse = await axios.get(`${API_URL}/api/ilabor360/config`, {
        params: { userId }
      });
      
      if (configResponse.data.config) {
        console.log('✅ Configuration found:');
        console.log(`   - Username: ${configResponse.data.config.username}`);
        console.log(`   - Login URL: ${configResponse.data.config.loginUrl}`);
        console.log(`   - Enabled: ${configResponse.data.config.enabled}`);
        console.log(`   - Last Sync: ${configResponse.data.config.lastSyncDate || 'Never'}`);
      } else {
        console.log('❌ No configuration found!');
        console.log('\n🔧 You need to:');
        console.log('   1. Go to http://localhost:3000/ilabor360-settings');
        console.log('   2. Enter your credentials');
        console.log('   3. Click "Save Configuration"');
        console.log('   4. Then try syncing again\n');
        return;
      }
    } catch (error) {
      console.log('❌ Error fetching config:', error.response?.data || error.message);
      return;
    }

    // Step 2: Test scraper service
    console.log('\n🔍 Step 2: Testing scraper service...');
    try {
      const scraperResponse = await axios.get('http://localhost:5002/health');
      console.log('✅ Scraper service is running');
    } catch (error) {
      console.log('❌ Scraper service is NOT running!');
      console.log('   Start it with: cd ilabor360-scraper && python app.py');
      return;
    }

    // Step 3: Trigger sync
    console.log('\n🚀 Step 3: Triggering sync...');
    console.log('   (Chrome window will open - you need to manually login)');
    
    const syncResponse = await axios.post(`${API_URL}/api/ilabor360/sync`, {
      userId
    }, {
      timeout: 600000 // 10 minutes for manual login
    });

    if (syncResponse.data.success) {
      console.log('\n✅ SYNC SUCCESSFUL!');
      console.log('\n📊 Results:');
      console.log(`   - Jobs Found: ${syncResponse.data.stats.requisitions.found}`);
      console.log(`   - Jobs Added: ${syncResponse.data.stats.requisitions.added}`);
      console.log(`   - Jobs Updated: ${syncResponse.data.stats.requisitions.updated}`);
      console.log(`   - Jobs Skipped: ${syncResponse.data.stats.requisitions.skipped}`);
      console.log(`   - Duration: ${(syncResponse.data.stats.durationMs / 1000).toFixed(2)}s`);
      console.log(`   - Errors: ${syncResponse.data.stats.errors}`);
    } else {
      console.log('\n❌ Sync failed:', syncResponse.data.error);
    }

  } catch (error) {
    console.error('\n❌ Error during sync:', error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.log('\n⏱️  Timeout - Did you manually login in the Chrome window?');
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

// Run the test
testSync().catch(console.error);
