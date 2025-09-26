// Custom Swagger UI configuration for Lambda RIE integration
window.onload = function() {
  // Build a system
  const ui = SwaggerUIBundle({
    url: '/openapi/openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    requestInterceptor: function(request) {
      // Transform requests to work with Lambda RIE
      if (request.url.includes('/v1/')) {
        const originalUrl = request.url;
        const path = originalUrl.split('/v1/')[1];
        const method = request.method.toUpperCase();
        
        // Create Lambda event structure
        const lambdaEvent = {
          httpMethod: method,
          rawPath: '/v1/' + path.split('?')[0],
          requestContext: {
            http: {
              method: method
            },
            requestId: 'swagger-' + Date.now()
          },
          headers: request.headers || {},
          queryStringParameters: null,
          pathParameters: null,
          body: request.body || null
        };
        
        // Parse query parameters
        if (originalUrl.includes('?')) {
          const queryString = originalUrl.split('?')[1];
          const params = new URLSearchParams(queryString);
          const queryParams = {};
          for (const [key, value] of params) {
            queryParams[key] = value;
          }
          if (Object.keys(queryParams).length > 0) {
            lambdaEvent.queryStringParameters = queryParams;
          }
        }
        
        // Parse path parameters
        const pathMatch = path.match(/^artists\/([^\/\?]+)/);
        if (pathMatch) {
          lambdaEvent.pathParameters = {
            artistId: pathMatch[1]
          };
        }
        
        // Transform to Lambda RIE format
        request.url = 'http://localhost:9000/2015-03-31/functions/function/invocations';
        request.method = 'POST';
        request.headers['Content-Type'] = 'application/json';
        request.body = JSON.stringify(lambdaEvent);
      }
      
      return request;
    },
    responseInterceptor: function(response) {
      // Handle Lambda RIE responses
      if (response.url.includes('/2015-03-31/functions/function/invocations')) {
        try {
          const lambdaResponse = JSON.parse(response.text);
          
          // Extract the actual response from Lambda format
          if (lambdaResponse.statusCode) {
            response.status = lambdaResponse.statusCode;
            response.text = lambdaResponse.body;
            
            // Update headers if present
            if (lambdaResponse.headers) {
              Object.assign(response.headers, lambdaResponse.headers);
            }
          }
        } catch (e) {
          console.warn('Failed to parse Lambda response:', e);
        }
      }
      
      return response;
    }
  });
  
  window.ui = ui;
};