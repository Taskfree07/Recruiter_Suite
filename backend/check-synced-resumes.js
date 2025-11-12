const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkSyncedResumes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer');
    console.log('🔌 Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const resumesCollection = db.collection('resumes');
    
    // Count total resumes
    const totalCount = await resumesCollection.countDocuments();
    console.log(`📊 Total Resumes in Database: ${totalCount}`);
    
    // Count Ceipal resumes
    const ceipalCount = await resumesCollection.countDocuments({
      'sources.type': 'ceipal'
    });
    console.log(`📊 Ceipal Resumes: ${ceipalCount}`);
    
    // Get some sample Ceipal resumes
    console.log('\n📋 Sample Ceipal Resumes:');
    console.log('━'.repeat(80));
    
    const samples = await resumesCollection.find({
      'sources.type': 'ceipal'
    }).limit(5).toArray();
    
    if (samples.length === 0) {
      console.log('⚠️  No Ceipal resumes found in database');
      console.log('   Make sure the sync completed successfully');
    } else {
      samples.forEach((resume, index) => {
        console.log(`\n${index + 1}. ${resume.name || 'No Name'}`);
        console.log(`   Email: ${resume.email || 'No Email'}`);
        console.log(`   Phone: ${resume.phone || 'No Phone'}`);
        console.log(`   Skills: ${resume.skills?.slice(0, 3).join(', ') || 'None'}...`);
        console.log(`   Experience: ${resume.totalExperience || 'N/A'} years`);
        console.log(`   Source: ${resume.sources?.[0]?.type || 'Unknown'}`);
        console.log(`   Source ID: ${resume.sources?.[0]?.id || 'Unknown'}`);
        console.log(`   Created: ${resume.createdAt ? new Date(resume.createdAt).toLocaleString() : 'Unknown'}`);
      });
    }
    
    console.log('\n' + '━'.repeat(80));
    console.log(`\n✅ Found ${ceipalCount} Ceipal resumes out of ${totalCount} total resumes`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkSyncedResumes();
