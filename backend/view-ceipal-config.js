/**
 * View Current Ceipal Configuration
 * This script shows your current Ceipal config from the database
 * 
 * Usage: node view-ceipal-config.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer';

async function viewConfig() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const config = await mongoose.connection.db
      .collection('ceipalconfigs')
      .findOne({ userId: 'default-user' });

    if (!config) {
      console.log('⚠️  No Ceipal configuration found');
      console.log('\nTo set up Ceipal, run:');
      console.log('  node setup-ceipal-credentials.js');
      console.log('\nOr for quick setup:');
      console.log('  node quick-setup-ceipal.js <email> <password> <api_key>');
    } else {
      console.log('📊 Current Ceipal Configuration:');
      console.log('━'.repeat(60));
      console.log(`User ID:           ${config.userId}`);
      console.log(`Email:             ${config.username || 'NOT SET ❌'}`);
      console.log(`Password:          ${config.password ? '✅ Set (' + config.password.length + ' chars)' : 'NOT SET ❌'}`);
      console.log(`API Key:           ${config.apiKey && config.apiKey !== 'MOCK_API_KEY' ? '✅ ' + config.apiKey.substring(0, 30) + '...' : 'NOT SET ❌'}`);
      console.log(`Module:            ${config.module || 'ATS (default)'}`);
      console.log(`Resume API URL:    ${config.resumeApiUrl || 'NOT SET'}`);
      console.log(`Mock Mode:         ${config.mockMode ? '🎭 ON' : '✅ OFF (Real API)'}`);
      console.log(`Connection Status: ${config.connectionStatus}`);
      console.log(`Last Error:        ${config.lastError || 'None'}`);
      console.log(`Last Sync:         ${config.lastSyncDate ? new Date(config.lastSyncDate).toLocaleString() : 'Never'}`);
      console.log(`Sync Enabled:      ${config.syncEnabled ? 'Yes' : 'No'}`);
      console.log(`Created:           ${new Date(config.createdAt).toLocaleString()}`);
      console.log(`Updated:           ${new Date(config.updatedAt).toLocaleString()}`);
      console.log('━'.repeat(60));

      // Check for issues
      console.log('\n🔍 Configuration Check:');
      const issues = [];
      
      if (!config.username || config.username === '') {
        issues.push('❌ Email is missing');
      } else {
        console.log('✅ Email is set');
      }
      
      if (!config.password) {
        issues.push('❌ Password is missing');
      } else {
        console.log('✅ Password is set');
      }
      
      if (!config.apiKey || config.apiKey === 'MOCK_API_KEY') {
        issues.push('❌ API Key is missing or set to MOCK');
      } else {
        console.log('✅ API Key is set');
      }
      
      if (!config.module) {
        issues.push('⚠️  Module not set (will default to ATS)');
      } else {
        console.log(`✅ Module is set to: ${config.module}`);
      }
      
      if (!config.resumeApiUrl) {
        issues.push('⚠️  Resume API URL not set (optional but recommended)');
      } else {
        console.log('✅ Resume API URL is set');
      }

      if (config.mockMode) {
        console.log('⚠️  Mock mode is ON - using fake data');
      } else {
        console.log('✅ Mock mode is OFF - using real API');
      }

      if (issues.length > 0) {
        console.log('\n⚠️  Issues Found:');
        issues.forEach(issue => console.log(`   ${issue}`));
        console.log('\nTo fix these issues, run:');
        console.log('  node setup-ceipal-credentials.js');
        console.log('\nOr quick setup:');
        console.log('  node quick-setup-ceipal.js <email> <password> <api_key> [resume_api_url]');
      } else {
        console.log('\n✅ Configuration looks good!');
        console.log('\nTest your connection:');
        console.log('  node test-auth-from-db.js');
      }
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

viewConfig();
