#!/usr/bin/env node

/**
 * Helper script to get the current LocalStack API Gateway URL
 * This script queries LocalStack to find the API Gateway ID and returns the URL
 */

const { execSync } = require('child_process');

async function getApiGatewayUrl() {
  try {
    // Get all REST APIs from LocalStack
    const result = execSync(
      'aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis --region eu-west-2 --output json',
      { encoding: 'utf8' }
    );
    
    const apis = JSON.parse(result);
    
    // Find the tattoo directory API
    const tattooApi = apis.items.find(api => 
      api.name === 'tattoo-directory-local'
    );
    
    if (!tattooApi) {
      throw new Error('Tattoo directory API not found');
    }
    
    const apiUrl = `http://localhost:4566/restapis/${tattooApi.id}/local/_user_request_`;
    
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify({
        apiId: tattooApi.id,
        apiUrl: apiUrl,
        createdDate: tattooApi.createdDate
      }, null, 2));
    } else {
      console.log(apiUrl);
    }
    
    return apiUrl;
  } catch (error) {
    console.error('Error getting API Gateway URL:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  getApiGatewayUrl();
}

module.exports = { getApiGatewayUrl };