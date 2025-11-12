const mongoose = require('mongoose');
const CeipalConfig = require('./dist/models/ceipalConfig').default;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/recruiter-suite')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create a new configuration for testing
    // Since you mentioned you have all credentials except company ID and tenant ID
    const config = new CeipalConfig({
      userId: 'default-user',
      mockMode: false, // Use real API
      
      // Primary authentication method - username/password (you mentioned these are provided)
      username: '', // You'll need to provide this
      password: '', // You'll need to provide this
      
      // API endpoint - this should be the base endpoint without tenant/company IDs
      customEndpoint: 'https://api.ceipal.com/getCustomJobPostingDetails',
      apiUrl: 'https://api.ceipal.com',
      
      // Not required according to your note
      // tenantId: undefined,
      // companyId: undefined,
      
      connectionStatus: 'disconnected',
      syncEnabled: true,
      syncJobs: true,
      syncCandidates: true,
      syncApplications: true
    });
    
    await config.save();
    console.log('✅ Created new Ceipal configuration');
    console.log('📋 Please update the configuration with your actual credentials:');
    console.log('   - Username: config.username');
    console.log('   - Password: config.password');
    console.log('   - Custom Endpoint: config.customEndpoint');
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
  });