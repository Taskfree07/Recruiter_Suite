/**
 * Quick Credential Validator
 * 
 * Run this with your credentials to instantly test if they work
 * Usage: node quick-test-token.js <username> <key> <password> <userId>
 */

const axios = require('axios');

const args = process.argv.slice(2);

if (args.length < 4) {
  console.log('\n❌ Missing arguments!\n');
  console.log('Usage: node quick-test-token.js <username> <key> <password> <userId>\n');
  console.log('Example:');
  console.log('  node quick-test-token.js myuser mykey mypass 12345\n');
  process.exit(1);
}

const [username, key, password, userId] = args;

async function quickTest() {
  console.log('\n🔐 Testing iLabor360 API Token Generation...\n');
  
  try {
    const loginUrl = 'https://api.ilabor360.com/v2/rest/login';
    
    console.log(`📡 Calling: ${loginUrl}`);
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Key: ${key.substring(0, 5)}***`);
    console.log(`🔒 Password: ${'*'.repeat(password.length)}`);
    console.log(`🆔 User ID: ${userId}\n`);

    const response = await axios.post(loginUrl, null, {
      params: { userName: username, key, password },
      timeout: 30000
    });

    if (response.data.status === 'success' && response.data.result) {
      console.log('✅ SUCCESS! Token generated:\n');
      console.log(`   ${response.data.result}\n`);
      console.log('🎉 Your credentials are valid!\n');
      console.log('📝 Next: Run setup-ilabor-api.js to save these credentials\n');
      return response.data.result;
    } else {
      console.log('❌ FAILED:', response.data.error || 'Unknown error\n');
      process.exit(1);
    }

  } catch (error) {
    console.log('\n❌ ERROR:\n');
    if (error.response?.data) {
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
    console.log('');
    process.exit(1);
  }
}

quickTest();
