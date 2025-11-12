const axios = require('axios');

async function testOllamaJobSync() {
  console.log('🧪 Testing Ollama Local AI Job Sync...\n');

  try {
    // Test 1: Check if Ollama is running
    console.log('📊 Step 1: Checking Ollama status...');
    try {
      await axios.get('http://localhost:11434');
      console.log('✅ Ollama is running!');
    } catch (error) {
      console.log('❌ Ollama not running. Please run: ollama serve');
      return;
    }

    // Test 2: Test Ollama model
    console.log('\n🤖 Step 2: Testing Llama 3.2 model...');
    const testResponse = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2:3b',
      prompt: 'Say hello in one sentence.',
      stream: false
    });
    console.log('Model response:', testResponse.data.response.substring(0, 100) + '...');
    console.log('✅ Model is working!');

    // Test 3: Trigger job sync
    console.log('\n📧 Step 3: Syncing jobs from Outlook...');
    const syncResponse = await axios.post('http://localhost:5000/api/outlook/sync-jobs', {
      userId: 'default-user',
      syncPeriod: 'all'
    });

    console.log('\n✅ Sync Response:');
    console.log('Success:', syncResponse.data.success);
    console.log('Jobs Processed:', syncResponse.data.jobsProcessed);
    console.log('Errors:', syncResponse.data.errors.length);
    
    if (syncResponse.data.jobsProcessed > 0) {
      console.log('\n🎉 SUCCESS! Jobs were parsed and saved!');
    } else {
      console.log('\n⚠️ No jobs processed. Errors:');
      syncResponse.data.errors.forEach(err => console.log('  -', err));
    }

    // Test 4: Check database
    console.log('\n📋 Step 4: Checking saved jobs...');
    const jobsResponse = await axios.get('http://localhost:5000/api/jobs');
    const outlookJobs = jobsResponse.data.filter(job => 
      job.source === 'outlook' || 
      (job.sources && job.sources.some(s => s.type === 'outlook'))
    );

    console.log(`Total jobs: ${jobsResponse.data.length}`);
    console.log(`Outlook jobs: ${outlookJobs.length}`);

    if (outlookJobs.length > 0) {
      console.log('\n✨ Latest Outlook Jobs:');
      outlookJobs.slice(0, 3).forEach((job, i) => {
        console.log(`\n${i + 1}. ${job.title} at ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   Skills: ${job.requiredSkills.slice(0, 3).join(', ')}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testOllamaJobSync();
