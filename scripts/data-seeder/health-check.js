const http = require('http');

/**
 * Health check script for the data seeder container
 */
async function healthCheck() {
  try {
    // Check if LocalStack is accessible
    const localstackEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localstack:4566';
    
    await makeRequest(localstackEndpoint + '/_localstack/health');
    
    console.log('✅ Health check passed - LocalStack is accessible');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 4566,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run if this file is executed directly
if (require.main === module) {
  healthCheck();
}

module.exports = { healthCheck };