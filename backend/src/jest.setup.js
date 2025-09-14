/**
 * Jest setup file for comprehensive testing
 * This file is run before each test file
 */

import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    // Keep console.error and console.warn for debugging
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'eu-west-2';
process.env.DYNAMODB_TABLE_NAME = 'test-table';
process.env.OPENSEARCH_ENDPOINT = 'test-opensearch.amazonaws.com';
process.env.APP_SECRETS_ARN = 'arn:aws:secretsmanager:region:account:secret:test';
process.env.OPENSEARCH_INDEX = 'test-artists';
process.env.SQS_QUEUE_URL = 'https://sqs.eu-west-2.amazonaws.com/123456789/test-queue';

// Global test utilities
global.createMockEvent = (path, method = 'GET', queryStringParameters = null, pathParameters = null) => ({
    requestContext: {
        http: { method },
        requestId: 'test-request-id'
    },
    rawPath: path,
    queryStringParameters,
    pathParameters
});

global.createMockContext = (awsRequestId = 'test-aws-request-id') => ({
    awsRequestId,
    functionName: 'test-function',
    getRemainingTimeInMillis: () => 30000
});

// Mock AWS SDK clients globally
const mockSend = jest.fn();
const mockSecretsManagerClient = jest.fn(() => ({ send: mockSend }));
const mockDynamoDBClient = jest.fn(() => ({ send: mockSend }));
const mockSQSClient = jest.fn(() => ({ send: mockSend }));

// Set up default successful responses
beforeEach(() => {
    mockSend.mockClear();
    
    // Default secrets manager response
    mockSend.mockImplementation((command) => {
        if (command.constructor.name === 'GetSecretValueCommand') {
            return Promise.resolve({
                SecretString: JSON.stringify({
                    master_user_name: 'test-user',
                    master_user_password: 'test-password'
                })
            });
        }
        
        // Default DynamoDB responses
        if (command.constructor.name === 'PutCommand' || command.constructor.name === 'UpdateCommand') {
            return Promise.resolve({});
        }
        
        if (command.constructor.name === 'GetCommand') {
            return Promise.resolve({ Item: null });
        }
        
        // Default SQS responses
        if (command.constructor.name === 'SendMessageBatchCommand') {
            return Promise.resolve({
                Successful: [{ Id: 'test-id', MessageId: 'test-message-id' }],
                Failed: []
            });
        }
        
        return Promise.resolve({});
    });
});

// Export mocks for use in tests
global.mockSend = mockSend;
global.mockSecretsManagerClient = mockSecretsManagerClient;
global.mockDynamoDBClient = mockDynamoDBClient;
global.mockSQSClient = mockSQSClient;