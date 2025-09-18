#!/usr/bin/env node

/**
 * Simple test script to verify OpenSearch connectivity and data
 */

import http from 'http';

function makeOpenSearchRequestWithoutHost(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localstack',
      port: 4566,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function makeOpenSearchRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localstack',
      port: 4566,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testOpenSearch() {
  try {
    console.log('🔍 Testing OpenSearch connectivity...');
    
    // Test basic connectivity
    const clusterHealth = await makeOpenSearchRequest('GET', '/');
    console.log('✅ OpenSearch is accessible');
    
    // List all indices
    try {
      const indices = await makeOpenSearchRequest('GET', '/_cat/indices?format=json');
      console.log('📋 Available indices:', indices);
    } catch (error) {
      console.log('❌ Could not list indices:', error.message);
    }
    
    // Check if index exists
    try {
      await makeOpenSearchRequest('HEAD', '/artists-local');
      console.log('✅ Index "artists-local" exists');
    } catch (error) {
      console.log('❌ Index "artists-local" does not exist:', error.message);
      
      // Try without the Host header
      console.log('🔄 Trying without Host header...');
      try {
        const result = await makeOpenSearchRequestWithoutHost('HEAD', '/artists-local');
        console.log('✅ Index exists without Host header');
      } catch (error2) {
        console.log('❌ Index still does not exist without Host header:', error2.message);
        return;
      }
    }
    
    // Get document count
    const countResponse = await makeOpenSearchRequest('GET', '/artists-local/_count');
    console.log(`📊 Index contains ${countResponse.count} documents`);
    
    // Search for all artists
    const searchResponse = await makeOpenSearchRequest('POST', '/artists-local/_search', {
      query: { match_all: {} },
      size: 5
    });
    
    console.log(`🎨 Found ${searchResponse.hits.total.value} total artists`);
    console.log('Sample artists:');
    searchResponse.hits.hits.forEach((hit, index) => {
      const artist = hit._source;
      console.log(`  ${index + 1}. ${artist.artistName || artist.name} (${artist.artistId}) - ${artist.locationDisplay || artist.location}`);
      console.log(`     Fields: ${Object.keys(artist).join(', ')}`);
    });
    
    console.log('✅ OpenSearch test completed successfully!');
    
  } catch (error) {
    console.error('❌ OpenSearch test failed:', error.message);
  }
}

testOpenSearch();