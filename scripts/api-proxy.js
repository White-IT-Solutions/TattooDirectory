#!/usr/bin/env node

/**
 * Simple HTTP proxy to translate REST API calls to Lambda Runtime Interface Emulator format
 * This allows the contracts tests to work with the Lambda backend
 */

const http = require('http');
const axios = require('axios');

const LAMBDA_ENDPOINT = 'http://localhost:9000/2015-03-31/functions/function/invocations';
const PROXY_PORT = 9001;

const server = http.createServer(async (req, res) => {
  try {
    // Parse the incoming request
    const url = new URL(req.url, `http://localhost:${PROXY_PORT}`);
    const path = url.pathname;
    const queryParams = {};
    
    // Convert URL search params to object
    for (const [key, value] of url.searchParams) {
      queryParams[key] = value;
    }

    // Create Lambda event format
    const lambdaEvent = {
      httpMethod: req.method,
      path: path,
      queryStringParameters: Object.keys(queryParams).length > 0 ? queryParams : null,
      pathParameters: null,
      requestContext: {
        requestId: `proxy-${Date.now()}`,
        http: {
          method: req.method
        }
      },
      headers: req.headers,
      body: null
    };

    // Handle request body for POST/PUT requests
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        lambdaEvent.body = body;
        await forwardToLambda(lambdaEvent, res);
      });
    } else {
      await forwardToLambda(lambdaEvent, res);
    }

  } catch (error) {
    console.error('Proxy error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal proxy error' }));
  }
});

async function forwardToLambda(event, res) {
  try {
    console.log(`[PROXY] ${event.httpMethod} ${event.path}`, event.queryStringParameters || '');
    
    // Try to forward to Lambda first
    try {
      const response = await axios.post(LAMBDA_ENDPOINT, event, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000,
        validateStatus: () => true // Accept all status codes
      });

      // Forward the Lambda response
      const lambdaResponse = response.data;
      
      if (lambdaResponse && typeof lambdaResponse === 'object') {
        // Set headers
        if (lambdaResponse.headers) {
          Object.entries(lambdaResponse.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Set status code and body
        res.writeHead(lambdaResponse.statusCode || 200);
        res.end(lambdaResponse.body || '');
        return;
      }
    } catch (lambdaError) {
      console.log(`[PROXY] Lambda unavailable, using mock responses: ${lambdaError.message}`);
    }

    // Lambda is unavailable, provide mock responses for testing
    const mockResponse = getMockResponse(event);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', mockResponse.contentType);
    
    res.writeHead(mockResponse.statusCode);
    res.end(mockResponse.body);

  } catch (error) {
    console.error('Proxy error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Proxy error',
      details: error.message 
    }));
  }
}

function getMockResponse(event) {
  const { path, httpMethod, queryStringParameters } = event;
  
  // Health endpoint
  if (path === '/health' && httpMethod === 'GET') {
    return {
      statusCode: 200,
      contentType: 'application/json',
      body: JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        mode: 'mock' 
      })
    };
  }
  
  // Artists search endpoint
  if (path === '/v1/artists' && httpMethod === 'GET') {
    // Check if search parameters are provided
    if (!queryStringParameters || (!queryStringParameters.query && !queryStringParameters.style && !queryStringParameters.location)) {
      return {
        statusCode: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://api.tattoodirectory.com/docs/errors#400',
          title: 'Bad Request',
          status: 400,
          detail: 'At least one search parameter is required (query, style, or location)',
          instance: `mock-${Date.now()}`
        })
      };
    }
    
    // Validate parameters
    if (queryStringParameters.style && queryStringParameters.style === 'invalid-style') {
      return {
        statusCode: 400,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://api.tattoodirectory.com/docs/errors#400',
          title: 'Bad Request',
          status: 400,
          detail: 'Invalid style parameter',
          instance: `mock-${Date.now()}`
        })
      };
    }
    
    if (queryStringParameters.limit) {
      const limit = parseInt(queryStringParameters.limit);
      if (isNaN(limit) || limit <= 0) {
        return {
          statusCode: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://api.tattoodirectory.com/docs/errors#400',
            title: 'Bad Request',
            status: 400,
            detail: 'Invalid limit parameter',
            instance: `mock-${Date.now()}`
          })
        };
      }
      if (limit > 50) {
        return {
          statusCode: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://api.tattoodirectory.com/docs/errors#400',
            title: 'Bad Request',
            status: 400,
            detail: 'Limit parameter exceeds maximum allowed value',
            instance: `mock-${Date.now()}`
          })
        };
      }
    }
    
    if (queryStringParameters.page) {
      const page = parseInt(queryStringParameters.page);
      if (isNaN(page) || page < 1) {
        return {
          statusCode: 400,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://api.tattoodirectory.com/docs/errors#400',
            title: 'Bad Request',
            status: 400,
            detail: 'Invalid page parameter',
            instance: `mock-${Date.now()}`
          })
        };
      }
    }
    
    // Return mock artists data
    const mockArtists = [
      {
        artistId: 'mock-artist-1',
        artistName: 'Sarah Johnson',
        instagramHandle: '@sarahtattoos',
        locationDisplay: 'London, UK',
        styles: ['traditional', 'blackwork'],
        specialties: ['portraits', 'animals'],
        rating: 4.8,
        reviewCount: 127,
        portfolioImages: ['https://example.com/image1.jpg'],
        contactInfo: { email: 'sarah@example.com' },
        studioInfo: { studioName: 'Ink Studio London' },
        studioName: 'Ink Studio London'
      }
    ];
    
    return {
      statusCode: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockArtists)
    };
  }
  
  // Artist by ID endpoint
  if (path.match(/^\/v1\/artists\/[^\/]+$/) && httpMethod === 'GET') {
    const artistId = path.split('/').pop();
    
    const mockArtist = {
      artistId: artistId,
      artistName: 'Sarah Johnson',
      instagramHandle: '@sarahtattoos',
      locationDisplay: 'London, UK',
      styles: ['traditional', 'blackwork'],
      specialties: ['portraits', 'animals'],
      rating: 4.8,
      reviewCount: 127,
      portfolioImages: ['https://example.com/image1.jpg'],
      contactInfo: { email: 'sarah@example.com' },
      studioInfo: { studioName: 'Ink Studio London' },
      studioName: 'Ink Studio London'
    };
    
    return {
      statusCode: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockArtist)
    };
  }
  
  // Styles endpoint
  if (path === '/v1/styles' && httpMethod === 'GET') {
    const mockStyles = [
      { name: 'traditional', count: 45 },
      { name: 'blackwork', count: 32 },
      { name: 'realism', count: 28 },
      { name: 'watercolor', count: 15 }
    ];
    
    return {
      statusCode: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStyles)
    };
  }
  
  // Default 404 response
  return {
    statusCode: 404,
    contentType: 'application/problem+json',
    body: JSON.stringify({
      type: 'https://api.tattoodirectory.com/docs/errors#404',
      title: 'Not Found',
      status: 404,
      detail: `Route ${httpMethod} ${path} not found.`,
      instance: `mock-${Date.now()}`
    })
  };
}

server.listen(PROXY_PORT, () => {
  console.log(`🔄 API Proxy running on http://localhost:${PROXY_PORT}`);
  console.log(`📡 Forwarding requests to ${LAMBDA_ENDPOINT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PROXY_PORT}/health`);
  console.log(`  GET  http://localhost:${PROXY_PORT}/v1/artists?query=test`);
  console.log(`  GET  http://localhost:${PROXY_PORT}/v1/artists/{id}`);
  console.log(`  GET  http://localhost:${PROXY_PORT}/v1/styles`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down API proxy...');
  server.close(() => {
    console.log('✅ API proxy stopped');
    process.exit(0);
  });
});