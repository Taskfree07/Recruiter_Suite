/**
 * Quick Ceipal Credentials Setup
 * 
 * Usage: node quick-setup-ceipal.js <email> <password> <api_key> [resume_api_url] [module]
 * 
 * Example:
 *   node quick-setup-ceipal.js pankaj.b@techgene.com MyPass123 abc123xyz https://api.ceipal.com/... ATS
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer';

async function quickSetup() {
  try {
    const [,, email, password, apiKey, resumeApiUrl, module] = process.argv;

    if (!email || !password || !apiKey) {
      console.error('❌ Missing required arguments\n');
      console.error('Usage: node quick-setup-ceipal.js <email> <password> <api_key> [resume_api_url] [module]');
      console.error('\nExample:');
      console.error('  node quick-setup-ceipal.js pankaj.b@techgene.com MyPass123 abc123xyz');
      console.error('  node quick-setup-ceipal.js pankaj.b@techgene.com MyPass123 abc123xyz https://api.ceipal.com/...');
      console.error('  node quick-setup-ceipal.js pankaj.b@techgene.com MyPass123 abc123xyz https://api.ceipal.com/... ATS');
      process.exit(1);
    }

    console.log('🔐 Quick Ceipal Setup\n');
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const updateData = {
      username: email,
      password: password,
      apiKey: apiKey,
      module: module || 'ATS',
      mockMode: false,
      connectionStatus: 'disconnected',
      lastError: undefined,
      updatedAt: new Date()
    };

    if (resumeApiUrl && resumeApiUrl.trim()) {
      updateData.resumeApiUrl = resumeApiUrl.trim();
    }

    console.log('📝 Updating configuration...');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${'*'.repeat(8)}`);
    console.log(`   API Key: ${apiKey.substring(0, 20)}...`);
    console.log(`   Module: ${updateData.module}`);
    if (resumeApiUrl) console.log(`   Resume API URL: ${resumeApiUrl}`);

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
      console.log('\n✅ Configuration updated successfully!');

      // Verify the update
      const config = await mongoose.connection.db
        .collection('ceipalconfigs')
        .findOne({ userId: 'default-user' });

      console.log('\n📊 Verified Configuration:');
      console.log(`   Email: ${config.username}`);
      console.log(`   Password: Set (${config.password ? config.password.length : 0} chars)`);
      console.log(`   API Key: ${config.apiKey.substring(0, 20)}...`);
      console.log(`   Module: ${config.module}`);
      console.log(`   Resume API URL: ${config.resumeApiUrl || 'Not set'}`);
      console.log(`   Mock Mode: ${config.mockMode ? 'ON' : 'OFF'}`);

      console.log('\n📋 Next Steps:');
      console.log('1. Restart your backend server');
      console.log('2. Test connection: node test-auth-from-db.js');
      console.log('3. Or use the frontend Ceipal Settings page');
    } else {
      console.log('\n⚠️  Configuration might already be set with these values');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

quickSetup();
