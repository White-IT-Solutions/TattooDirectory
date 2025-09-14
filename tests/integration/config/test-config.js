/**
 * Integration Test Configuration
 * 
 * Configuration for integration tests running against LocalStack backend
 */

export const testConfig = {
    // API Configuration
    api: {
        baseUrl: process.env.TEST_API_URL || 'http://localhost:9000/2015-03-31/functions/function/invocations',
        timeout: 10000,
        retries: 3
    },

    // LocalStack Configuration
    localstack: {
        endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
        region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
        accessKeyId: 'test',
        secretAccessKey: 'test'
    },

    // DynamoDB Configuration
    dynamodb: {
        tableName: process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local',
        endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566'
    },

    // OpenSearch Configuration
    opensearch: {
        endpoint: process.env.OPENSEARCH_ENDPOINT || 'http://localhost:4566',
        indexName: process.env.OPENSEARCH_INDEX_NAME || 'artists-local'
    },

    // Test Data Configuration
    testData: {
        cleanupAfterTests: process.env.CLEANUP_TEST_DATA !== 'false',
        seedDataPath: '../../../scripts/test-data',
        maxRetries: 5,
        retryDelay: 1000
    },

    // Test Timeouts
    timeouts: {
        api: 5000,
        database: 3000,
        setup: 30000,
        cleanup: 10000
    }
};

export default testConfig;