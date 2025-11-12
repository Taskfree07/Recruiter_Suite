const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Define schema directly
const RecruiterResumeSchema = new mongoose.Schema({
  personalInfo: {
    name: String,
  },
  filePath: String,
}, { strict: false });

const RecruiterResume = mongoose.model('RecruiterResume', RecruiterResumeSchema);

async function deleteUnknownResumes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats-optimizer';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Delete all resumes with Unknown or problematic names
    const result = await RecruiterResume.deleteMany({
      $or: [
        { 'personalInfo.name': 'Unknown' },
        { 'personalInfo.name': /^(Company|Career|Professional|Skills|Experience|Education|Resume|CV|SOFTWARE|ENGINEERING)/i }
      ]
    });

    console.log(`\n✅ Deleted ${result.deletedCount} problematic resumes`);
    console.log(`\n📝 Now sync from Outlook to get clean resume data with proper names from filenames.\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

deleteUnknownResumes();
