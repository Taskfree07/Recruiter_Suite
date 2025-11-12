const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testOutlookJobSync() {
  console.log('🧪 Testing Outlook Job Sync...\n');

  try {
    // Step 1: Check Outlook status
    console.log('📊 Step 1: Checking Outlook status...');
    const statusResponse = await axios.get(`${API_URL}/api/outlook/status`, {
      params: { userId: 'default-user' }
    });
    
    console.log('Status:', statusResponse.data);
    console.log('✅ Configured:', statusResponse.data.configured);
    console.log('✅ Authenticated:', statusResponse.data.authenticated);
    console.log('');

    if (!statusResponse.data.authenticated) {
      console.log('❌ Not authenticated with Outlook');
      console.log('Please authenticate first by visiting:');
      const authResponse = await axios.get(`${API_URL}/api/outlook/auth/login`);
      console.log(authResponse.data.authUrl);
      return;
    }

    // Step 2: Trigger job sync
    console.log('📧 Step 2: Syncing jobs from Outlook...');
    const syncResponse = await axios.post(`${API_URL}/api/outlook/sync-jobs`, {
      userId: 'default-user',
      syncPeriod: 'all' // Try 'all' to get more emails
    });

    console.log('\n✅ Sync Response:');
    console.log('Success:', syncResponse.data.success);
    console.log('Jobs Processed:', syncResponse.data.jobsProcessed);
    console.log('User Email:', syncResponse.data.userEmail);
    console.log('Errors:', syncResponse.data.errors);
    console.log('');

    // Step 3: Check if jobs were actually saved
    console.log('📋 Step 3: Checking saved jobs in database...');
    const jobsResponse = await axios.get(`${API_URL}/api/jobs`);
    
    const outlookJobs = jobsResponse.data.filter(job => 
      job.source === 'outlook' || 
      (job.sources && job.sources.some(s => s.type === 'outlook'))
    );

    console.log(`Total jobs in database: ${jobsResponse.data.length}`);
    console.log(`Outlook-sourced jobs: ${outlookJobs.length}`);
    
    if (outlookJobs.length > 0) {
      console.log('\n✨ Sample Outlook Jobs:');
      outlookJobs.slice(0, 3).forEach((job, i) => {
        console.log(`\n${i + 1}. ${job.title} at ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   Skills: ${job.requiredSkills.join(', ')}`);
        console.log(`   Source: ${job.source}`);
      });
    } else {
      console.log('\n⚠️ No Outlook jobs found in database');
      console.log('This could mean:');
      console.log('1. No emails matched job keywords');
      console.log('2. Gemini AI failed to parse job details');
      console.log('3. Job saving failed');
      console.log('\nCheck backend logs for more details');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
  }
}

testOutlookJobSync();
