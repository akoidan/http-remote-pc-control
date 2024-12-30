const https = require('https');
const fs = require('fs');

// Load the client certificate, key, and CA
const httpsAgent = new https.Agent({
  cert: fs.readFileSync('../client/certs/cert.pem'), // Client certificate
  key: fs.readFileSync('../client/certs/key.pem'), // Client private key
  ca: fs.readFileSync('../client/certs/ca-cert.pem'), // CA certificate for verifying the server
  rejectUnauthorized: true, // Reject unauthorized servers
  checkServerIdentity: () => undefined
});

const options = {
  hostname: 'localhost',
  port: 8443,
  path: '/',
  method: 'GET',
  agent: httpsAgent,
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response from server:', data);
  });
});

req.on('error', (error) => {
  console.error('Error connecting to server:', error.message);
});

req.end();
console.log('wtf')
