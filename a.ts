import {
  createClient,
} from './client/client';

import {
  appControllerPing,
  keyboardControllerKeyPress,
  keyboardControllerTypeText,
  monitorControllerGetMonitors,
  mouseControllerLeftMouseClick
} from './client/sdk.gen'
import * as fs from 'fs';
import * as path from 'path';
import { Agent } from 'https';

// Create HTTPS agent with MTLS certificates
const certDir = process.env.CERT_DIR || path.join(__dirname, './certs');
const httpsAgent = new Agent({
  cert: fs.readFileSync(path.join(certDir, 'cert.pem')),
  key: fs.readFileSync(path.join(certDir, 'key.pem')),
  ca: fs.readFileSync(path.join(certDir, 'ca-cert.pem')),
  rejectUnauthorized: false, // Disable hostname verification for local development
});

// Create a custom fetch function that uses the HTTPS agent
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const nodeFetch = require('node-fetch');
  
  // Handle Request object or string/URL
  let url: string;
  let options: any = init || {};
  
  if (input instanceof Request) {
    url = input.url;
    options = {
      ...options,
      method: input.method,
      headers: input.headers,
      body: input.body,
    };
  } else {
    url = typeof input === 'string' ? input : input.toString();
  }
  
  // Add HTTPS agent for MTLS
  options.agent = httpsAgent;
  
  console.log('Making request to:', url);
  return nodeFetch(url, options);
};

// Create a client instance with MTLS
const client = createClient({
  baseUrl: 'https://localhost:5000',
  headers: {
    'x-request-id': 'unique-request-id'
  },
  // Use custom fetch for MTLS
  fetch: customFetch as any,
});

// Use the API functions
async function example() {
  try {
    console.log('Attempting to ping server...');
    
    // Ping the server
    const pingResponse = await appControllerPing({ client });
    console.log('Ping response:', pingResponse);
    console.log('Ping data:', pingResponse.data);

    // Press keys
    await keyboardControllerKeyPress({
      client,
      body: { keys: ['control', 'c'] }
    });

    // Type text
    await keyboardControllerTypeText({
      client,
      body: { text: 'Hello World!' }
    });

    // Get monitors
    const monitors = await monitorControllerGetMonitors({ client });
    console.log(monitors.data);

  } catch (error) {
    console.error('Error occurred:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

example();