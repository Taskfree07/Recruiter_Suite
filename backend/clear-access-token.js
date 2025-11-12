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
}, { strict: false });

const CeipalConfig = mongoose.model('CeipalConfig', CeipalConfigSchema);

async function clearAccessToken() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('✅ Connected to MongoDB\n');

    console.log('🔧 Removing old accessToken field...');
    
    const result = await CeipalConfig.updateOne(
      { userId: 'default-user' },
      { $unset: { accessToken: "" } }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Successfully removed old accessToken field!');
      console.log('   The service will now generate a fresh token on each request.\n');
    } else {
      console.log('⚠️  No changes made (accessToken might not have existed)');
    }

    // Verify it's gone
    const config = await CeipalConfig.findOne({ userId: 'default-user' });
    if (!config.accessToken) {
      console.log('✅ Verified: accessToken field is now removed');
    } else {
      console.log('❌ Warning: accessToken still exists!');
    }

    console.log('\n🧪 Now test the connection:');
    console.log('   node test-endpoint.js');
    console.log('   Or open frontend and click "Test Connection"');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

clearAccessToken();
