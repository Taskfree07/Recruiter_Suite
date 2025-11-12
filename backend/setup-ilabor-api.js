/**
 * iLabor360 REST API v2.0 Setup Script
 * 
 * This script helps you configure iLabor360 REST API credentials
 * and test the connection.
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function setupILaborAPI() {
  try {
    console.log('\n🚀 iLabor360 REST API v2.0 Setup\n');
    console.log('================================================\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('✅ Connected to MongoDB\n');

    // Import service
    const iLabor360Service = require('./src/services/iLabor360Service').default;

    // STEP 1: Get your API credentials from iLabor360
    console.log('📋 STEP 1: API Credentials Required\n');
    console.log('You need the following credentials from your iLabor360 account manager:');
    console.log('  1. API Username (userName)');
    console.log('  2. API Key (key)');
    console.log('  3. API Password (password) - NOT your portal password');
    console.log('  4. System User ID (sysUserID)\n');

    // STEP 2: Configure credentials
    console.log('📝 STEP 2: Configuring Credentials\n');

    // Replace these with YOUR actual credentials
    const credentials = {
      apiUsername: 'YOUR_API_USERNAME_HERE',     // Replace this
      apiKey: 'YOUR_API_KEY_HERE',               // Replace this
      apiPassword: 'YOUR_API_PASSWORD_HERE',     // Replace this
      sysUserId: 'YOUR_SYSTEM_USER_ID_HERE',     // Replace this
      syncEnabled: true,
      syncDateRange: 1, // 1 day
      useModifiedDate: false
    };

    // Check if credentials are set
    if (
      credentials.apiUsername === 'YOUR_API_USERNAME_HERE' ||
      credentials.apiKey === 'YOUR_API_KEY_HERE' ||
      credentials.apiPassword === 'YOUR_API_PASSWORD_HERE' ||
      credentials.sysUserId === 'YOUR_SYSTEM_USER_ID_HERE'
    ) {
      console.log('❌ ERROR: Please edit this script and replace the placeholder credentials with your actual iLabor360 API credentials.\n');
      console.log('Edit this file: backend/setup-ilabor-api.js\n');
      console.log('Lines to update:');
      console.log('  - apiUsername: Line 32');
      console.log('  - apiKey: Line 33');
      console.log('  - apiPassword: Line 34');
      console.log('  - sysUserId: Line 35\n');
      process.exit(1);
    }

    // Save configuration
    const config = await iLabor360Service.updateConfig('default-user', credentials);
    console.log('✅ Credentials saved and encrypted\n');

    // STEP 3: Test connection
    console.log('📡 STEP 3: Testing API Connection\n');

    try {
      const result = await iLabor360Service.testConnection('default-user');
      console.log('✅ SUCCESS!', result.message);
      console.log('\n🎉 iLabor360 REST API is now configured and working!\n');
      
      // STEP 4: Show next steps
      console.log('📚 NEXT STEPS:\n');
      console.log('1. Start syncing jobs:');
      console.log('   - Use the frontend UI to manually trigger a sync');
      console.log('   - Or call POST /api/ilabor360/sync\n');
      
      console.log('2. Enable auto-sync (optional):');
      console.log('   - Update config with autoSync: true');
      console.log('   - Set syncInterval to desired minutes\n');

      console.log('3. View synced jobs:');
      console.log('   - Check the Job Pipeline in the frontend');
      console.log('   - Or call GET /api/jobs\n');

    } catch (testError) {
      console.log('❌ CONNECTION TEST FAILED\n');
      console.error('Error:', testError.message);
      console.log('\n🔍 Troubleshooting:\n');
      console.log('1. Verify your credentials are correct');
      console.log('2. Make sure you have access to the iLabor360 API');
      console.log('3. Check your network connection');
      console.log('4. Contact your iLabor360 account manager if issues persist\n');
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run setup
setupILaborAPI();
