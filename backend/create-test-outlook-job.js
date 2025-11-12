// Script to manually create a test Outlook job to verify the database schema works
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ats_resume_optimizer';

// Define UnifiedJob schema (same as backend)
const unifiedJobSchema = new mongoose.Schema({
  userId: String,
  title: String,
  description: String,
  company: String,
  requiredSkills: [String],
  niceToHaveSkills: [String],
  experienceYears: {
    min: Number,
    max: Number
  },
  experienceLevel: String,
  location: String,
  locationType: String,
  salaryRange: {
    min: Number,
    max: Number,
    currency: String
  },
  status: String,
  postedDate: Date,
  priority: String,
  tags: [String],
  sources: [{
    type: String,
    id: String,
    emailId: String,
    emailSubject: String,
    senderEmail: String,
    syncDate: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  source: String
}, { timestamps: true });

const UnifiedJob = mongoose.model('UnifiedJob', unifiedJobSchema);

async function createTestJob() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testJob = new UnifiedJob({
      userId: 'default-user',
      title: 'Senior Software Developer (TEST)',
      description: 'Test job synced from Outlook email. This is a senior software developer position requiring expertise in Node.js, React, and TypeScript.',
      company: 'Test Company Inc.',
      requiredSkills: ['Node.js', 'React', 'TypeScript', 'MongoDB'],
      niceToHaveSkills: ['Docker', 'Kubernetes', 'AWS'],
      experienceYears: {
        min: 5,
        max: 8
      },
      experienceLevel: 'Senior',
      location: 'Remote',
      locationType: 'remote',
      salaryRange: {
        min: 120000,
        max: 160000,
        currency: 'USD'
      },
      status: 'open',
      postedDate: new Date(),
      priority: 'high',
      tags: ['outlook-synced', 'test'],
      sources: [{
        type: 'outlook',
        id: 'test-email-id-123',
        emailId: 'test-email-id-123',
        emailSubject: 'Test: Senior Software Developer Position',
        senderEmail: 'recruiter@testcompany.com',
        syncDate: new Date(),
        metadata: {
          syncedBy: 'test-user@techgene.com',
          emailBodyPreview: 'This is a test job from Outlook email sync'
        }
      }]
    });

    await testJob.save();
    console.log('✅ Test job created successfully!');
    console.log('Job ID:', testJob._id);
    console.log('Title:', testJob.title);
    console.log('Company:', testJob.company);
    console.log('Source:', testJob.source);

    await mongoose.disconnect();
    console.log('\n🎉 Done! Refresh the Job Pipeline page to see the test job.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

createTestJob();
