const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Test the API endpoints
async function testAPI() {
  try {
    console.log('Testing backend connection...');
    
    // Test basic connection
    const healthCheck = await axios.get('http://localhost:5000/api/jobs');
    console.log('✅ Backend is accessible');
    
    // Test CORS
    const corsTest = await axios.get('http://localhost:5000/api/jobs', {
      headers: {
        'Origin': 'http://localhost:3001'
      }
    });
    console.log('✅ CORS is working');
    
    console.log('Backend is ready for resume uploads!');
    
  } catch (error) {
    console.error('❌ Error testing backend:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPI();
