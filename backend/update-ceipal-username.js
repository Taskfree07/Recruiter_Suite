/**
 * Quick script to update Ceipal username/email
 * Run with: node update-ceipal-username.js <your-email@example.com>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats-optimizer';

async function updateUsername() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Please provide an email address');
      console.error('Usage: node update-ceipal-username.js <your-email@example.com>');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`📝 Updating username to: ${email}`);

    const result = await mongoose.connection.db.collection('ceipalconfigs').updateOne(
      { userId: 'default-user' },
      { $set: { username: email } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Username updated successfully!\n');

      // Show current config
      const config = await mongoose.connection.db.collection('ceipalconfigs').findOne({ userId: 'default-user' });
      console.log('📊 Updated Configuration:');
      console.log(`   Username: ${config.username}`);
      console.log(`   Password: ${config.password ? '***' + config.password.substring(config.password.length - 3) : 'Not set'}`);
      console.log(`   API Key: ${config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'Not set'}`);
      console.log(`   Resume API URL: ${config.resumeApiUrl || config.customEndpoint || 'Not set'}`);
    } else {
      console.log('⚠️  No changes made (username might already be set)');
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateUsername();
