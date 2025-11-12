const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/recruiter-suite')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    collections.forEach(col => console.log(' -', col.name));
    
    // Check if ceipalconfigs exists
    const ceipalConfigsCol = mongoose.connection.db.collection('ceipalconfigs');
    const count = await ceipalConfigsCol.countDocuments();
    console.log(`\nCeipal configs count: ${count}`);
    
    if (count > 0) {
      const configs = await ceipalConfigsCol.find({}).toArray();
      console.log('\nExisting configs:');
      configs.forEach(config => {
        console.log(`- User ID: ${config.userId}`);
        console.log(`- Mock Mode: ${config.mockMode}`);
        console.log(`- Custom Endpoint: ${config.customEndpoint}`);
        console.log(`- Username: ${config.username}`);
        console.log(`- Connection Status: ${config.connectionStatus}`);
        console.log('---');
      });
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });