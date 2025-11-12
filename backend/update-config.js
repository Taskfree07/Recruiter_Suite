const mongoose = require('mongoose');
const CeipalConfig = require('./dist/models/ceipalConfig').default;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/recruiter-suite')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create/update configuration with the credentials from previous session
    let config = await CeipalConfig.findOne({ userId: 'default-user' });
    
    if (!config) {
      config = new CeipalConfig({
        userId: 'default-user'
      });
    }
    
    // Update with the configuration from your previous setup
    config.mockMode = false;
    config.username = 'pankaj.b@techgene.com';
    config.password = 'Jupiter@9090';
    config.customEndpoint = 'https://api.ceipal.com/getCustomJobPostingDetails';
    config.apiUrl = 'https://api.ceipal.com';
    config.connectionStatus = 'disconnected';
    config.syncEnabled = true;
    config.syncJobs = true;
    config.syncCandidates = true;
    config.syncApplications = true;
    
    // Clear these since you mentioned they're not needed
    config.tenantId = undefined;
    config.companyId = undefined;
    config.apiKey = undefined;
    
    await config.save();
    console.log('✅ Updated Ceipal configuration');
    console.log('📋 Configuration details:');
    console.log('   - Username:', config.username);
    console.log('   - Password: ***');
    console.log('   - Custom Endpoint:', config.customEndpoint);
    console.log('   - Mock Mode:', config.mockMode);
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
  });