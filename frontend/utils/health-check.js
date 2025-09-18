#!/usr/bin/env node

/**
 * Health check script for frontend service
 * Used by Docker Compose to verify the frontend is ready
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Frontend health check passed');
    process.exit(0);
  } else {
    console.log(`Frontend health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log(`Frontend health check failed: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Frontend health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();