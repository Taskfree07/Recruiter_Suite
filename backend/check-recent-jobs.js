const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer';

async function checkRecentJobs() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const UnifiedJob = mongoose.model('UnifiedJob', new mongoose.Schema({}, { strict: false }));

    // Get the 10 most recent jobs
    const recentJobs = await UnifiedJob.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title company source sources createdAt');

    console.log(`📊 Last 10 jobs in database:\n`);
    
    recentJobs.forEach((job, i) => {
      console.log(`${i + 1}. ${job.title} at ${job.company}`);
      console.log(`   Source field: "${job.source || 'MISSING'}"`);
      console.log(`   Sources array: ${job.sources ? job.sources.length + ' entries' : 'NONE'}`);
      if (job.sources && job.sources.length > 0) {
        console.log(`   First source type: "${job.sources[0].type}"`);
      }
      console.log(`   Created: ${job.createdAt}`);
      console.log('');
    });

    // Check specifically for jobs with outlook in sources
    const outlookJobs = await UnifiedJob.find({
      'sources.type': 'outlook'
    }).countDocuments();

    console.log(`\n✅ Total jobs with Outlook source: ${outlookJobs}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkRecentJobs();
