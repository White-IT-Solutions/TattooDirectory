const { Client } = require('@opensearch-project/opensearch');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const CircuitBreaker = require('opossum');
const logger = require('../common/logger');

// --- Client Initialization ---
// Cache the secret and client outside the handler for reuse
let osClient;
const secretsManagerClient = new SecretsManagerClient({});

async function getOpenSearchClient() {
    if (osClient) {
        return osClient;
    }
    try {
        // Fetch the OpenSearch password from Secrets Manager
        const secretValue = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN })); // Uses the client from the outer scope
        const secrets = JSON.parse(secretValue.SecretString);
        logger.info('Successfully retrieved OpenSearch credentials from Secrets Manager');

        osClient = new Client({
            node: 'https://' + process.env.OPENSEARCH_ENDPOINT,
            auth: {
                username: 'admin',
                password: secrets.opensearch_master_password
            }
        });
        return osClient;
    } catch (error) {
        logger.error('Failed to initialize OpenSearch client', { error: error.toString() });
        throw error;
    }
}

// --- Circuit Breaker Configuration ---
const circuitBreakerOptions = {
  timeout: 3000, // If the function doesn't resolve in 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // If 50% of requests fail, trip the circuit
  resetTimeout: 30000 // After 30 seconds, let one request through to test recovery
};

// The protected function that the circuit breaker will wrap
const protectedSearch = async (searchParams) => {
  const client = await getOpenSearchClient();
  return client.search(searchParams);
};

const breaker = new CircuitBreaker(protectedSearch, circuitBreakerOptions);

// Define a fallback action for when the circuit is open
breaker.fallback(() => ({
    // This structure will be caught and formatted into a proper HTTP response below
    isFallback: true,
    statusCode: 503,
    body: {
        title: "Service Unavailable",
        detail: "The search service is temporarily unavailable. Please try again later."
    }
}));

// --- Route Handlers ---
async function handleSearchArtists(event) {
    try {
        const query = event.queryStringParameters?.query;
        const style = event.queryStringParameters?.style;

        if (!query && !style) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/problem+json' },
                body: JSON.stringify({
                    title: "Bad Request",
                    detail: "A 'query' or 'style' query string parameter is required for search.",
                })
            };
        }

        // A more realistic search query based on input
        const searchQuery = {
            query: {
                bool: {
                    must: query ? [{ match: { name: query } }] : [],
                    filter: style ? [{ term: { "styles.keyword": style } }] : []
                }
            }
        };

        const searchParams = {
            index: process.env.OPENSEARCH_INDEX,
            body: searchQuery
        };

        logger.info('Performing search via circuit breaker', { searchParams });
        const result = await breaker.fire(searchParams);

        if (result.isFallback) {
             return {
                statusCode: result.statusCode,
                headers: { 'Content-Type': 'application/problem+json' },
                body: JSON.stringify(result.body)
            };
        }

        const hits = result.body.hits.hits;
        const artists = hits.map(hit => hit._source);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(artists)
        };
    } catch (error) {
        logger.error("Error during search", { error: error.toString(), code: error.code });
        // The fallback handles 'EOPENBREAKER' automatically.
        // This catch block handles other unexpected errors.
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/problem+json' },
            body: JSON.stringify({
                title: "Internal Server Error",
                detail: "An unexpected error occurred during the search operation.",
                instance: event.requestContext.requestId
            })
        };
    }
}

exports.handler = async (event) => {
    logger.info('API Handler invoked', { path: event.rawPath, method: event.requestContext.http.method });

    // Simple router
    if (event.rawPath === '/v1/artists' && event.requestContext.http.method === 'GET') {
        return handleSearchArtists(event);
    }

    // Default response for unhandled routes
    return { statusCode: 404, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({message: `Route ${event.requestContext.http.method} ${event.rawPath} not found.`}) };
};