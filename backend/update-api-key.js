const mongoose = require('mongoose');
const CeipalConfig = require('./dist/models/ceipalConfig').default;

// ⚠️ REPLACE THIS WITH YOUR ACTUAL CEIPAL API KEY
const YOUR_API_KEY = 'PASTE_YOUR_API_KEY_HERE';

mongoose.connect('mongodb://localhost:27017/recruiter-suite')
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    const config = await CeipalConfig.findOne({ userId: 'default-user' });
    
    if (!config) {
      console.log('❌ No config found!');
      mongoose.disconnect();
      return;
    }
    
    console.log('📋 Updating configuration...\n');
    
    // Update with API Key
    config.apiKey = YOUR_API_KEY;
    config.accessToken = YOUR_API_KEY; // Set both fields
    config.mockMode = false;
    
    await config.save();
    
    console.log('✅ Configuration updated!');
    console.log('📋 Current settings:');
    console.log('   - API Key: ' + (YOUR_API_KEY.substring(0, 20) + '...'));
    console.log('   - Custom Endpoint:', config.customEndpoint);
    console.log('   - Mock Mode:', config.mockMode);
    console.log('\n🧪 Testing connection...\n');
    
    mongoose.disconnect();
    
    // Test the connection
    const axios = require('axios');
    
    try {
      const response = await axios.get(config.customEndpoint, {
        headers: {
          'Authorization': `Bearer ${YOUR_API_KEY}`,
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      console.log('🎉 SUCCESS! Connection working!');
      console.log('📊 Status:', response.status);
      console.log('📦 Data type:', typeof response.data);
      
      if (Array.isArray(response.data)) {
        console.log('📋 Found', response.data.length, 'jobs!');
        if (response.data.length > 0) {
          console.log('\n📄 First job fields:', Object.keys(response.data[0]).slice(0, 10).join(', '));
        }
      } else if (response.data && typeof response.data === 'object') {
        console.log('📋 Response keys:', Object.keys(response.data).join(', '));
      }
      
      console.log('\n✅ You can now use the Ceipal Settings page to sync jobs!');
      
    } catch (error) {
      console.log('❌ Connection failed!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      console.log('\n💡 Make sure your API key is correct!');
    }
  })
  .catch(err => {
    console.error('Error:', err);
  });
