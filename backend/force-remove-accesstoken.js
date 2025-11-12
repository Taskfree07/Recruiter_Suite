const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function forceRemoveAccessToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('🔌 Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('ceipalconfigs');
    
    // Check before
    const before = await collection.findOne({ userId: 'default-user' });
    console.log('Before:');
    console.log('  accessToken:', before.accessToken ? `EXISTS (${before.accessToken.substring(0, 30)}...)` : 'NOT SET');
    console.log('  apiKey:', before.apiKey ? `EXISTS (${before.apiKey.substring(0, 30)}...)` : 'NOT SET');
    
    // Remove accessToken field completely
    const result = await collection.updateOne(
      { userId: 'default-user' },
      { $unset: { accessToken: 1 } }
    );
    
    console.log(`\n✅ Update result: ${result.modifiedCount} document(s) modified`);
    
    // Check after
    const after = await collection.findOne({ userId: 'default-user' });
    console.log('\nAfter:');
    console.log('  accessToken:', after.accessToken ? `STILL EXISTS (${after.accessToken.substring(0, 30)}...)` : '✅ REMOVED');
    console.log('  apiKey:', after.apiKey ? `EXISTS (${after.apiKey.substring(0, 30)}...)` : 'NOT SET');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected');
  }
}

forceRemoveAccessToken();
