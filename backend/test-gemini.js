// Simple test script for Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

console.log('Testing Gemini API...');
console.log('API Key:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 15) + '...' : 'NOT FOUND');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try different model names
    const modelNames = [
      'gemini-1.5-flash-002',
      'gemini-1.5-pro-002',
      'gemini-1.5-flash',
      'gemini-pro',
      'models/gemini-pro'
    ];

    for (const modelName of modelNames) {
      try {
        console.log(`\nTrying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello World" if you can read this.');
        const response = await result.response;
        const text = response.text();

        console.log('✅ SUCCESS with model:', modelName);
        console.log('Response:', text);
        break; // Stop after first success
      } catch (err) {
        console.log('❌ Failed:', err.message.substring(0, 100));
      }
    }

  } catch (error) {
    console.error('❌ FATAL ERROR:', error.message);
  }
}

test();
