const axios = require('axios');
require('dotenv').config({ path: '../.env' });

async function testGroqAPI() {
  console.log('🧪 Testing Groq API Configuration...\n');

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log('❌ GROQ_API_KEY not found in .env file');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 15) + '...');

  try {
    console.log('\n🤖 Testing Groq API with Llama 3.2 90B...');
    
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: 'Say "Groq is working!" in one sentence.' }
      ],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const message = response.data.choices[0].message.content;
    console.log('✅ Response:', message);
    console.log('\n🎉 Groq API is working perfectly!');
    console.log('📊 Model: Llama 3.2 90B (90 billion parameters)');
    console.log('⚡ Free tier: 30 requests/minute');
    console.log('💾 Storage saved: ~2GB (no local model needed)');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if your API key is correct');
    console.error('2. Ensure you have internet connection');
    console.error('3. Verify at: https://console.groq.com/keys');
  }
}

testGroqAPI();
