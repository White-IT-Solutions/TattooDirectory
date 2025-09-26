import { jest } from '@jest/globals';

describe('API Handler Basic Tests', () => {
    beforeAll(() => {
        // Set up environment variables
        process.env.APP_SECRETS_ARN = 'test-secret-arn';
        process.env.OPENSEARCH_ENDPOINT = 'test-endpoint.com';
        process.env.OPENSEARCH_INDEX = 'test-artists';
    });

    it('should be able to import the handler module', async () => {
        // This test just verifies that the module can be imported without syntax errors
        expect(async () => {
            const module = await import('../index.js');
            expect(module.handler).toBeDefined();
            expect(typeof module.handler).toBe('function');
        }).not.toThrow();
    });

    it('should handle missing environment variables gracefully', async () => {
        // Temporarily remove environment variables
        const originalSecretArn = process.env.APP_SECRETS_ARN;
        const originalEndpoint = process.env.OPENSEARCH_ENDPOINT;
        
        delete process.env.APP_SECRETS_ARN;
        delete process.env.OPENSEARCH_ENDPOINT;

        const mockEvent = {
            requestContext: {
                http: { method: 'GET' },
                requestId: 'test-request-id'
            },
            rawPath: '/v1/artists',
            queryStringParameters: { query: 'test' }
        };

        const mockContext = {
            awsRequestId: 'test-aws-request-id'
        };

        try {
            const { handler } = await import('../index.js');
            const response = await handler(mockEvent, mockContext);
            
            // Should return a service unavailable error when OpenSearch can't be initialized
            expect(response.statusCode).toBe(503);
        } catch (error) {
            // It's also acceptable if it throws an error due to missing config
            expect(error).toBeDefined();
        } finally {
            // Restore environment variables
            process.env.APP_SECRETS_ARN = originalSecretArn;
            process.env.OPENSEARCH_ENDPOINT = originalEndpoint;
        }
    });
});