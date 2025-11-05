const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function enableTwoStepAuth() {
  console.log('🔐 Enabling Two-Step Authentication for Ceipal...\n');
  
  // Correct Ceipal auth endpoint
  const AUTH_TOKEN_ENDPOINT = 'https://api.ceipal.com/v1/createAuthtoken/';
  
  console.log(`Auth Token Endpoint: ${AUTH_TOKEN_ENDPOINT}`);
  console.log(`\n⚠️  Please update AUTH_TOKEN_ENDPOINT if this is not correct!\n`);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const CeipalConfig = mongoose.model('CeipalConfig', new mongoose.Schema({}, { strict: false }));
    
    const result = await CeipalConfig.updateOne(
      { userId: 'default-user' },
      {
        $set: {
          useTwoStepAuth: true,
          authTokenEndpoint: AUTH_TOKEN_ENDPOINT
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Two-step authentication enabled!');
      console.log(`   Auth endpoint: ${AUTH_TOKEN_ENDPOINT}`);
      
      const config = await CeipalConfig.findOne({ userId: 'default-user' });
      console.log('\nCurrent configuration:');
      console.log(`   API Key: ${config.apiKey}`);
      console.log(`   Two-step Auth: ${config.useTwoStepAuth}`);
      console.log(`   Auth Endpoint: ${config.authTokenEndpoint}`);
      
      console.log('\n📋 Next steps:');
      console.log('1. Verify the auth token endpoint URL is correct');
      console.log('2. Go to Ceipal Settings page');
      console.log('3. Click "Test Connection"');
      console.log('4. It will now use two-step authentication');
      
    } else {
      console.log('ℹ️  No changes made (already configured or config not found)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

enableTwoStepAuth();
