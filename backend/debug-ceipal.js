const mongoose = require('mongoose');
const CeipalConfig = require('./dist/models/ceipalConfig').default;
const ceipalService = require('./dist/services/ceipalService').default;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/recruiter-suite')
  .then(() => {
    console.log('Connected to MongoDB');
    return testCeipalConnection();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

async function testCeipalConnection() {
  try {
    console.log('\n=== CEIPAL CONNECTION DEBUG ===\n');

    // Get current config
    const config = await CeipalConfig.findOne({ userId: 'default-user' });
    if (!config) {
      console.error('No config found!');
      return;
    }

    console.log('Current Configuration:');
    console.log('- Mock Mode:', config.mockMode);
    console.log('- Custom Endpoint:', config.customEndpoint);
    console.log('- Username:', config.username);
    console.log('- Password:', config.password ? '***' : 'NOT SET');
    console.log('- API Key:', config.apiKey);
    console.log('- Tenant ID:', config.tenantId);
    console.log('- Company ID:', config.companyId);
    console.log('- Connection Status:', config.connectionStatus);
    console.log('- Last Error:', config.lastError);

    console.log('\n=== TESTING CONNECTION ===\n');

    // Test connection
    const result = await ceipalService.testConnection('default-user');
    console.log('Test Result:', result);

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    mongoose.disconnect();
  }
}