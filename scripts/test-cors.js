#!/usr/bin/env node

const http = require("http");

const server = http.createServer((req, res) => {
  console.log(`[TEST] ${req.method} ${req.url}`);
  
  if (req.method === 'OPTIONS') {
    console.log('[TEST] Handling OPTIONS request');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(200);
    res.end('OK');
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Hello from test server' }));
});

server.listen(9002, () => {
  console.log('Test server running on http://localhost:9002');
});