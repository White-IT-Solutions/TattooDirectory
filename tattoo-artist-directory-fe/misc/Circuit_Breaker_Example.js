// In your Lambda function code, e.g., api_handler/index.js

const { Client } = require('@opensearch-project/opensearch');
const CircuitBreaker = require('opossum');

// Initialize the OpenSearch client
const osClient = new Client({
    node: 'https://' + process.env.OPENSEARCH_ENDPOINT,
    // ... auth configuration
});

// Configure the circuit breaker for OpenSearch calls
const circuitBreakerOptions = {
  timeout: 3000, // If the function doesn't resolve in 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // If 50% of requests fail, trip the circuit
  resetTimeout: 30000 // After 30 seconds, let one request through to test recovery
};

const breaker = new CircuitBreaker(async (searchParams) => {
  // This is the function the circuit breaker will protect
  return osClient.search(searchParams);
}, circuitBreakerOptions);

// Fallback action for when the circuit is open
breaker.fallback(() => ({ 
    statusCode: 503, 
    body: JSON.stringify({ 
        title: "Service Unavailable",
        detail: "The search service is temporarily unavailable. Please try again later." 
    })
}));


exports.handler = async (event) => {
    // Example for the /v1/artists route
    if (event.rawPath === '/v1/artists' && event.requestContext.http.method === 'GET') {
        try {
            const searchParams = {
                index: 'artists',
                body: { query: { match_all: {} } } // Build your actual query here
            };

            // Fire the request through the circuit breaker
            const result = await breaker.fire(searchParams);

            // Assuming 'result' is the raw OpenSearch response
            const hits = result.body.hits.hits; 
            const artists = hits.map(hit => hit._source);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(artists)
            };

        } catch (error) {
            console.error("Error during search:", error);

            // Opossum's fallback will be triggered automatically if the circuit is open
            // or if the underlying function fails repeatedly.
            // You might still want a generic catch-all.
            if (error.code === 'EOPENBREAKER') {
                // This block is often handled by the fallback, but you can add specific logic here
                return {
                    statusCode: 503,
                    headers: { 'Content-Type': 'application/problem+json' },
                    body: JSON.stringify({ 
                        title: "Service Unavailable",
                        detail: "The search service is currently experiencing issues. Please try again shortly.",
                        instance: event.requestContext.requestId
                    })
                };
            }
            
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/problem+json' },
                body: JSON.stringify({ 
                    title: "Internal Server Error",
                    detail: "An unexpected error occurred.",
                    instance: event.requestContext.requestId
                })
            };
        }
    }

    // ... other routes
};
