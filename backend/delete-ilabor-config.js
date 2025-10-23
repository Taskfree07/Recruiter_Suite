const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function deleteConfig() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('Connected to MongoDB');

    const result = await mongoose.connection.db.collection('ilabor360configs').deleteMany({});
    console.log(`Deleted ${result.deletedCount} iLabor360 configurations`);

    await mongoose.disconnect();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteConfig();
