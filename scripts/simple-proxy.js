#!/usr/bin/env node

const http = require("http");

const server = http.createServer((req, res) => {
  console.log(`[SIMPLE] ${req.method} ${req.url}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('[SIMPLE] Handling OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.writeHead(200);
    res.end('OPTIONS OK');
    return;
  }
  
  // Handle other requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end(JSON.stringify([{
    artistId: "test-1",
    artistName: "Test Artist",
    locationDisplay: "London, UK"
  }]));
});

server.listen(9003, () => {
  console.log('Simple proxy running on http://localhost:9003');
});