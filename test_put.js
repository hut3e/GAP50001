const http = require('http');

const data = JSON.stringify({
  client: { name: 'Test' },
  responses: { '9.3.1': { score: 3, note: 'Testing realtime save' } }
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 5002,
  path: '/api/surveys/6612b1234567890123456789', // We'll just create a new one first using POST!
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('POST Response:', res.statusCode, body));
});
req.write(data);
req.end();
