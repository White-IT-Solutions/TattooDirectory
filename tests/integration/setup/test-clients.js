/**
 * Test Client Setup
 * 
 * Creates and configures AWS service clients for integration testing
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import axios from 'axios';
import { testConfig } from '../config/test-config.js';

/**
 * Create DynamoDB client for testing
 */
export function createTestDynamoDBClient() {
    const client = new DynamoDBClient({
        region: testConfig.localstack.region,
        endpoint: testConfig.localstack.endpoint,
        credentials: {
            accessKeyId: testConfig.localstack.accessKeyId,
            secretAccessKey: testConfig.localstack.secretAccessKey
        }
    });

    return DynamoDBDocumentClient.from(client);
}

/**
 * Create OpenSearch client for testing
 */
export function createTestOpenSearchClient() {
    return new OpenSearchClient({
        node: testConfig.opensearch.endpoint,
        auth: {
            username: 'admin',
            password: 'admin'
        },
        ssl: {
            rejectUnauthorized: false
        },
        headers: {
            'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
        }
    });
}

/**
 * Create HTTP client for API testing
 */
export function createTestAPIClient() {
    const client = axios.create({
        baseURL: testConfig.api.baseUrl,
        timeout: testConfig.api.timeout,
        headers: {
            'Content-Type': 'application/json'
        },
        validateStatus: () => true, // Don't throw on HTTP error status codes
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        // Add retry logic for socket hang up errors
        retry: 3,
        retryDelay: 1000
    });

    // Add request interceptor for debugging
    client.interceptors.request.use(
        (config) => {
            console.log(`Making request to: ${config.url}`);
            console.log(`Request data size: ${JSON.stringify(config.data).length} bytes`);
            return config;
        },
        (error) => {
            console.error('Request interceptor error:', error);
            return Promise.reject(error);
        }
    );

    // Add response interceptor to handle Lambda response format
    client.interceptors.response.use(
        (response) => {
            // Check if this is a Lambda response format
            if (response.data && typeof response.data === 'object' && 
                'statusCode' in response.data && 'body' in response.data) {
                
                const lambdaResponse = response.data;
                
                // Parse the Lambda response
                let parsedBody;
                try {
                    parsedBody = typeof lambdaResponse.body === 'string' 
                        ? JSON.parse(lambdaResponse.body) 
                        : lambdaResponse.body;
                } catch (e) {
                    parsedBody = lambdaResponse.body;
                }
                
                // Transform to HTTP-like response
                return {
                    ...response,
                    status: lambdaResponse.statusCode,
                    statusText: getStatusText(lambdaResponse.statusCode),
                    headers: {
                        ...response.headers,
                        ...lambdaResponse.headers,
                        'content-type': lambdaResponse.headers?.['Content-Type'] || 'application/json'
                    },
                    data: parsedBody
                };
            }
            
            return response;
        },
        (error) => {
            console.error('Response interceptor error:', {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            
            // Handle socket hang up errors with retry
            if (error.code === 'ECONNRESET' || error.message.includes('socket hang up')) {
                console.log('Socket hang up detected, this might be a container issue');
            }
            
            return Promise.reject(error);
        }
    );

    return client;
}

/**
 * Get HTTP status text for status code
 */
function getStatusText(statusCode) {
    const statusTexts = {
        200: 'OK',
        400: 'Bad Request',
        404: 'Not Found',
        500: 'Internal Server Error'
    };
    return statusTexts[statusCode] || 'Unknown';
}

/**
 * Test if LocalStack is available
 */
export async function testLocalStackConnection() {
    try {
        const response = await axios.get(`${testConfig.localstack.endpoint}/_localstack/health`, {
            timeout: 5000
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

/**
 * Test if API is available
 */
export async function testAPIConnection() {
    try {
        const client = createTestAPIClient();
        const response = await client.post('', {
            httpMethod: 'GET',
            path: '/v1/styles',
            requestContext: {
                http: { method: 'GET' },
                requestId: 'test-connection'
            },
            rawPath: '/v1/styles'
        });
        return response.status < 500; // Accept any non-server error
    } catch (error) {
        return false;
    }
}

export default {
    createTestDynamoDBClient,
    createTestOpenSearchClient,
    createTestAPIClient,
    testLocalStackConnection,
    testAPIConnection
};