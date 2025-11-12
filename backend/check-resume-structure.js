const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkResumeStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('🔌 Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const resumesCollection = db.collection('resumes');
    
    // Get one resume to see its structure
    const resume = await resumesCollection.findOne({});
    
    if (!resume) {
      console.log('⚠️  No resumes found');
      return;
    }
    
    console.log('📋 Resume Structure:');
    console.log('━'.repeat(80));
    console.log(JSON.stringify(resume, null, 2));
    console.log('━'.repeat(80));
    
    // Also check what collections exist
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available Collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check recruiterresumes collection
    const recruiterResumes = await db.collection('recruiterresumes').countDocuments();
    console.log(`\n📊 RecruiterResumes collection: ${recruiterResumes} documents`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkResumeStructure();
