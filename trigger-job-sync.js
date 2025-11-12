// Quick script to trigger job sync and see server logs
const http = require('http');

const postData = JSON.stringify({
  userId: 'default-user',
  syncPeriod: 'all'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/outlook/sync-jobs',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Triggering Outlook job sync...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(postData);
req.end();
