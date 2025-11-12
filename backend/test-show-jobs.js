const axios = require('axios');

async function testAndShowJobs() {
  console.log('🔐 Testing Ceipal API - Full Job Data\n');
  
  const credentials = {
    email: 'pankaj.b@techgene.com',
    password: 'Jupiter@9090',
    api_key: '312fe01c3730c82b30a7d7ea50ad8c08b0b3360717cebda0fd'
  };
  
  try {
    // Step 1: Get Token
    console.log('📡 Generating auth token...');
    const authResponse = await axios.post('https://api.ceipal.com/v1/createAuthtoken/', {
      email: credentials.email,
      password: credentials.password,
      api_key: credentials.apiKey
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const token = authResponse.data.access_token;
    console.log(`✅ Token: ${token.substring(0, 30)}...\n`);
    
    // Step 2: Fetch Jobs
    console.log('📡 Fetching jobs...');
    const jobsResponse = await axios.get(
      'https://api.ceipal.com/getCustomJobPostingDetails/Z3RkUkt2OXZJVld2MjFpOVRSTXoxZz09/b6d6b4f843d706549fa2b50f2dc9612a',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          paging_length: 5  // Just get 5 for testing
        }
      }
    );
    
    const data = jobsResponse.data;
    console.log(`✅ Total Jobs Available: ${data.count}`);
    console.log(`   Pages: ${data.num_pages}`);
    console.log(`   Jobs in this response: ${data.results.length}\n`);
    
    // Show first 2 jobs with all fields
    data.results.slice(0, 2).forEach((job, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`JOB #${index + 1}: ${job.job_title || 'No Title'}`);
      console.log('='.repeat(80));
      
      Object.entries(job).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'null' && value !== null) {
          const displayValue = typeof value === 'string' && value.length > 100 
            ? value.substring(0, 100) + '...'
            : value;
          console.log(`   ${key}: ${displayValue}`);
        }
      });
    });
    
    console.log(`\n\n📊 Field Analysis:`);
    const allFields = new Set();
    data.results.forEach(job => {
      Object.keys(job).forEach(field => allFields.add(field));
    });
    
    console.log(`   Total unique fields found: ${allFields.size}`);
    console.log(`   Fields:`, Array.from(allFields).sort().join(', '));
    
    console.log(`\n\n🎉 SUCCESS! Your Ceipal integration is working!`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAndShowJobs();
