const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '../.env' });

// Define schema directly
const RecruiterResumeSchema = new mongoose.Schema({
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    location: String,
    linkedIn: String,
    currentCompany: String
  },
  filePath: String,
  // ... other fields
}, { strict: false }); // Use strict: false to allow all fields

const RecruiterResume = mongoose.model('RecruiterResume', RecruiterResumeSchema);

async function extractNameFromFilename(filename) {
  // Pattern: "1234567890_ADIKA_MAUL_State_of_FL_Formatted.doc"
  // Remove extension, timestamp prefix, and everything after "State" or "Resume"
  const name = filename
    .replace(/\.\w+$/, '') // Remove extension
    .replace(/^\d+_/, '') // Remove timestamp prefix
    .replace(/_State.*$/i, '') // Remove "_State of FL_Formatted" etc.
    .replace(/_Resume.*$/i, '') // Remove "_Resume" etc.
    .replace(/_Original$/i, '') // Remove "_Original"
    .replace(/_Formatted$/i, '') // Remove "_Formatted"
    .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
    .trim()
    .split(' ') // Convert to title case
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return name || 'Unknown';
}

async function fixResumeNames() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats-optimizer';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all resumes with Unknown or problematic names
    const resumes = await RecruiterResume.find({
      $or: [
        { 'personalInfo.name': 'Unknown' },
        { 'personalInfo.name': /^(Company|Career|Professional|Skills|Experience|Education|Resume|CV)/i }
      ]
    });

    console.log(`\n📊 Found ${resumes.length} resumes with problematic names\n`);

    let fixed = 0;
    let failed = 0;

    for (const resume of resumes) {
      const oldName = resume.personalInfo.name;
      
      // Check if filePath exists
      if (!resume.filePath) {
        console.log(`⚠️  No filePath for resume: ${oldName}`);
        failed++;
        continue;
      }

      // Check if file exists
      if (!fs.existsSync(resume.filePath)) {
        console.log(`⚠️  File not found: ${resume.filePath}`);
        failed++;
        continue;
      }

      // Extract name from filename
      const filename = path.basename(resume.filePath);
      const newName = await extractNameFromFilename(filename);

      if (newName && newName !== 'Unknown' && newName !== oldName) {
        resume.personalInfo.name = newName;
        await resume.save();
        console.log(`✅ Fixed: "${oldName}" → "${newName}"`);
        fixed++;
      } else {
        console.log(`⚠️  Could not extract name from: ${filename}`);
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed} resumes`);
    console.log(`   ⚠️  Failed: ${failed} resumes`);
    console.log(`\n✅ Done! Please refresh your dashboard.\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

fixResumeNames();
