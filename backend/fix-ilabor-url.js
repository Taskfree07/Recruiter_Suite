/**
 * Fix iLabor360 Login URL in Database
 * Updates the default login URL from /logout to /login
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats-resume-optimizer';

async function fixLoginUrl() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all documents with the wrong login URL
    const result = await mongoose.connection.db.collection('ilabor360configs').updateMany(
      { loginUrl: 'https://vendor.ilabor360.com/logout' },
      { $set: { loginUrl: 'https://vendor.ilabor360.com/login' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} configuration(s)`);
    console.log('Login URL has been corrected from /logout to /login');

    await mongoose.connection.close();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixLoginUrl();
