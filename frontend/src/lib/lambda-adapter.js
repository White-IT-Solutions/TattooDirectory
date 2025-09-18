/**
 * Lambda RIE Adapter
 * Converts REST API calls to Lambda Runtime Interface Emulator format
 */

/**
 * Convert a REST API request to Lambda event format
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API path (e.g., '/v1/artists')
 * @param {URLSearchParams} searchParams - Query parameters
 * @param {Object} body - Request body (for POST requests)
 * @returns {Object} Lambda event object
 */
function createLambdaEvent(method, path, searchParams = null, body = null) {
  const queryStringParameters = {};
  
  if (searchParams) {
    for (const [key, value] of searchParams.entries()) {
      queryStringParameters[key] = value;
    }
  }

  // Extract path parameters (e.g., artistId from /v1/artists/{artistId})
  const pathParameters = {};
  const pathMatch = path.match(/\/v1\/artists\/([^\/]+)$/);
  if (pathMatch) {
    pathParameters.artistId = pathMatch[1];
  }

  return {
    rawPath: path,
    requestContext: {
      http: {
        method: method.toUpperCase()
      },
      requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    },
    queryStringParameters: Object.keys(queryStringParameters).length > 0 ? queryStringParameters : null,
    pathParameters: Object.keys(pathParameters).length > 0 ? pathParameters : null,
    body: body ? JSON.stringify(body) : null,
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

/**
 * Make a request to the Lambda RIE endpoint
 * @param {string} lambdaUrl - Lambda RIE URL
 * @param {string} method - HTTP method
 * @param {string} path - API path
 * @param {URLSearchParams} searchParams - Query parameters
 * @param {Object} body - Request body
 * @returns {Promise<Response>} Fetch response
 */
export async function lambdaRequest(lambdaUrl, method, path, searchParams = null, body = null) {
  const lambdaEvent = createLambdaEvent(method, path, searchParams, body);
  
  // Ensure we always send valid JSON
  const requestBody = JSON.stringify(lambdaEvent);
  
  console.log('Lambda RIE Request:', {
    url: lambdaUrl,
    method: 'POST',
    body: requestBody,
    event: lambdaEvent
  });
  
  const response = await fetch(lambdaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: requestBody
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lambda RIE Error Response:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Lambda request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const responseText = await response.text();
  console.log('Lambda RIE Response:', responseText);
  
  let lambdaResponse;
  try {
    lambdaResponse = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse Lambda response:', responseText);
    throw new Error(`Invalid JSON response from Lambda: ${parseError.message}`);
  }
  
  // Lambda RIE returns a response object with statusCode, headers, and body
  // We need to convert this back to a regular fetch Response
  const responseBody = typeof lambdaResponse.body === 'string' 
    ? lambdaResponse.body 
    : JSON.stringify(lambdaResponse.body);

  return new Response(responseBody, {
    status: lambdaResponse.statusCode || 200,
    statusText: getStatusText(lambdaResponse.statusCode || 200),
    headers: lambdaResponse.headers || {}
  });
}

/**
 * Get HTTP status text for a status code
 * @param {number} status - HTTP status code
 * @returns {string} Status text
 */
function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable'
  };
  
  return statusTexts[status] || 'Unknown';
}