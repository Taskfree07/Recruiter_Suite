const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Define schema directly
const RecruiterResumeSchema = new mongoose.Schema({
  personalInfo: {
    name: String,
    email: String,
  },
  filePath: String,
}, { strict: false });

const RecruiterResume = mongoose.model('RecruiterResume', RecruiterResumeSchema);

async function checkResumeNames() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats-optimizer';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all resumes
    const resumes = await RecruiterResume.find()
      .select('personalInfo.name personalInfo.email filePath')
      .sort({ _id: -1 })
      .limit(10);

    console.log(`📊 Found ${resumes.length} resumes:\n`);

    resumes.forEach((resume, index) => {
      console.log(`${index + 1}. Name: "${resume.personalInfo.name}"`);
      console.log(`   Email: ${resume.personalInfo.email || 'N/A'}`);
      if (resume.filePath) {
        const filename = require('path').basename(resume.filePath);
        console.log(`   File: ${filename}`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

checkResumeNames();
