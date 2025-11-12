/**
 * Setup Ceipal Credentials
 * This script updates all your Ceipal configuration in the database
 * 
 * Usage: node setup-ceipal-credentials.js
 */

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupCredentials() {
  console.log('🔐 Ceipal Credentials Setup\n');
  console.log('This script will update your Ceipal configuration in the database.\n');

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get current config
    const currentConfig = await mongoose.connection.db
      .collection('ceipalconfigs')
      .findOne({ userId: 'default-user' });

    if (currentConfig) {
      console.log('📊 Current Configuration:');
      console.log(`   Email: ${currentConfig.username || 'Not set'}`);
      console.log(`   Password: ${currentConfig.password ? '***' : 'Not set'}`);
      console.log(`   API Key: ${currentConfig.apiKey && currentConfig.apiKey !== 'MOCK_API_KEY' ? currentConfig.apiKey.substring(0, 20) + '...' : 'Not set'}`);
      console.log(`   Resume API URL: ${currentConfig.resumeApiUrl || 'Not set'}`);
      console.log(`   Module: ${currentConfig.module || 'ATS (default)'}`);
      console.log(`   Mock Mode: ${currentConfig.mockMode ? 'ON' : 'OFF'}\n`);
    }

    // Collect credentials
    const email = await question('Enter your Ceipal email: ');
    const password = await question('Enter your Ceipal password: ');
    const apiKey = await question('Enter your Ceipal API key: ');
    const resumeApiUrl = await question('Enter your Resume API URL (or press Enter to skip): ');
    const module = await question('Enter module name (press Enter for ATS): ') || 'ATS';
    const mockMode = await question('Enable mock mode? (yes/no, default: no): ');

    console.log('\n📝 Updating configuration...');

    const updateData = {
      username: email,
      password: password,
      apiKey: apiKey,
      module: module,
      mockMode: mockMode.toLowerCase() === 'yes' || mockMode.toLowerCase() === 'y',
      connectionStatus: 'disconnected',
      lastError: undefined,
      updatedAt: new Date()
    };

    if (resumeApiUrl && resumeApiUrl.trim()) {
      updateData.resumeApiUrl = resumeApiUrl.trim();
    }

    const result = await mongoose.connection.db
      .collection('ceipalconfigs')
      .updateOne(
        { userId: 'default-user' },
        { 
          $set: updateData,
          $setOnInsert: { 
            userId: 'default-user',
            createdAt: new Date(),
            syncEnabled: false,
            syncInterval: 30,
            syncJobs: true,
            syncCandidates: true,
            syncApplications: true
          }
        },
        { upsert: true }
      );

    if (result.modifiedCount > 0 || result.upsertedCount > 0) {
      console.log('✅ Configuration updated successfully!\n');

      // Show final config
      const updatedConfig = await mongoose.connection.db
        .collection('ceipalconfigs')
        .findOne({ userId: 'default-user' });

      console.log('📊 Updated Configuration:');
      console.log(`   Email: ${updatedConfig.username}`);
      console.log(`   Password: ${'*'.repeat(8)}`);
      console.log(`   API Key: ${updatedConfig.apiKey.substring(0, 20)}...`);
      console.log(`   Resume API URL: ${updatedConfig.resumeApiUrl || 'Not set'}`);
      console.log(`   Module: ${updatedConfig.module}`);
      console.log(`   Mock Mode: ${updatedConfig.mockMode ? 'ON' : 'OFF'}`);

      console.log('\n📋 Next Steps:');
      console.log('1. Start your backend server: npm start');
      console.log('2. Go to the Ceipal Settings page in the frontend');
      console.log('3. Click "Test Connection" to verify credentials');
      console.log('4. Click "Sync Jobs Now" or "Sync Resumes" to fetch data');
    } else {
      console.log('⚠️  No changes made');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    rl.close();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

setupCredentials();
