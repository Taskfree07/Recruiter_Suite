const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CeipalConfigSchema = new mongoose.Schema({
  userId: String,
  username: String,
  password: String,
  apiKey: String,
  accessToken: String,
  module: String,
  resumeApiUrl: String,
  mockMode: Boolean
});

const CeipalConfig = mongoose.model('CeipalConfig', CeipalConfigSchema);

async function checkAccessToken() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('✅ Connected to MongoDB\n');

    const config = await CeipalConfig.findOne({ userId: 'default-user' });

    if (!config) {
      console.log('❌ No configuration found');
      return;
    }

    console.log('📊 Checking accessToken field:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (config.accessToken) {
      console.log('⚠️  accessToken field EXISTS in database');
      console.log(`   Value: ${config.accessToken.substring(0, 50)}...`);
      console.log('\n🔧 This is likely an OLD/EXPIRED token causing the 403 error!');
      console.log('   The service is using this old token instead of generating a new one.');
      
      console.log('\n💡 SOLUTION: Remove the accessToken field');
      console.log('   Run: node clear-access-token.js');
    } else {
      console.log('✅ accessToken field is NOT set (good!)');
      console.log('   The service will generate a fresh token on each request.');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAccessToken();
