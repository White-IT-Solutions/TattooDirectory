/**
 * AWS Configuration Module Tests
 */

import { jest } from '@jest/globals';

// Mock environment variables before importing the module
const originalEnv = process.env;

beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
});

afterEach(() => {
    process.env = originalEnv;
});

describe('AWS Configuration Module', () => {
    describe('Local Development Configuration', () => {
        beforeEach(() => {
            process.env.AWS_ENDPOINT_URL = 'http://localstack:4566';
            process.env.NODE_ENV = 'development';
            process.env.AWS_DEFAULT_REGION = 'eu-west-2';
        });

        test('should detect local environment correctly', async () => {
            const { config } = await import('../aws-config.js');
            
            expect(config.isLocal).toBe(true);
            expect(config.isProduction).toBe(false);
            expect(config.endpoint).toBe('http://localstack:4566');
        });

        test('should create DynamoDB client with LocalStack endpoint', async () => {
            const { createDynamoDBClient } = await import('../aws-config.js');
            
            const client = createDynamoDBClient();
            expect(client).toBeDefined();
            expect(client.config.endpoint).toBeDefined();
        });

        test('should create OpenSearch client with local configuration', async () => {
            process.env.OPENSEARCH_ENDPOINT = 'http://localstack:4566';
            const { createOpenSearchClient } = await import('../aws-config.js');
            
            const client = createOpenSearchClient();
            expect(client).toBeDefined();
        });

        test('should return local table name', async () => {
            process.env.DYNAMODB_TABLE_NAME = 'tattoo-directory-local';
            const { getTableName } = await import('../aws-config.js');
            
            const tableName = getTableName();
            expect(tableName).toBe('tattoo-directory-local');
        });

        test('should return local index name', async () => {
            process.env.OPENSEARCH_INDEX = 'artists-local';
            const { getIndexName } = await import('../aws-config.js');
            
            const indexName = getIndexName();
            expect(indexName).toBe('artists-local');
        });
    });

    describe('Production Configuration', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
            process.env.AWS_DEFAULT_REGION = 'eu-west-2';
            delete process.env.AWS_ENDPOINT_URL;
            delete process.env.LOCALSTACK_HOSTNAME;
        });

        test('should detect production environment correctly', async () => {
            const { config } = await import('../aws-config.js');
            
            expect(config.isLocal).toBe(false);
            expect(config.isProduction).toBe(true);
            expect(config.endpoint).toBeUndefined();
        });

        test('should create DynamoDB client without custom endpoint', async () => {
            const { createDynamoDBClient } = await import('../aws-config.js');
            
            const client = createDynamoDBClient();
            expect(client).toBeDefined();
        });

        test('should return production table name', async () => {
            process.env.DYNAMODB_TABLE_NAME = 'TattooDirectory';
            const { getTableName } = await import('../aws-config.js');
            
            const tableName = getTableName();
            expect(tableName).toBe('TattooDirectory');
        });
    });

    describe('Environment Validation', () => {
        test('should validate required environment variables', async () => {
            const { validateEnvironment } = await import('../aws-config.js');
            
            process.env.TEST_VAR = 'test-value';
            
            expect(() => validateEnvironment(['TEST_VAR'])).not.toThrow();
            expect(() => validateEnvironment(['MISSING_VAR'])).toThrow('Missing required environment variables: MISSING_VAR');
        });

        test('should throw error when using LocalStack in production', async () => {
            process.env.NODE_ENV = 'production';
            process.env.AWS_ENDPOINT_URL = 'http://localstack:4566';
            
            await expect(async () => {
                await import('../aws-config.js');
            }).rejects.toThrow('Cannot use LocalStack endpoints in production environment');
        });
    });

    describe('Service Endpoints', () => {
        test('should return service endpoints for local development', async () => {
            process.env.AWS_ENDPOINT_URL = 'http://localstack:4566';
            process.env.NODE_ENV = 'development';
            
            const { getServiceEndpoints } = await import('../aws-config.js');
            
            const endpoints = getServiceEndpoints();
            expect(endpoints.dynamodb).toBe('http://localstack:4566');
            expect(endpoints.opensearch).toBe('http://localstack:4566');
            expect(endpoints.s3).toBe('http://localstack:4566');
        });

        test('should return empty endpoints for production', async () => {
            process.env.NODE_ENV = 'production';
            delete process.env.AWS_ENDPOINT_URL;
            
            const { getServiceEndpoints } = await import('../aws-config.js');
            
            const endpoints = getServiceEndpoints();
            expect(Object.keys(endpoints)).toHaveLength(0);
        });
    });
});