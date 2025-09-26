/**
 * AWS Configuration Module
 * 
 * Provides environment-specific AWS SDK configuration for local development
 * and production environments. Automatically detects LocalStack and configures
 * endpoints accordingly.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { SQSClient } from '@aws-sdk/client-sqs';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { createLogger } from './logger.js';

const logger = createLogger();

// Environment detection
const isLocal = process.env.AWS_ENDPOINT_URL?.includes('localstack') || 
                process.env.LOCALSTACK_HOSTNAME || 
                process.env.NODE_ENV === 'development' ||
                process.env.OPENSEARCH_ENDPOINT?.includes('localhost');

const isProduction = process.env.NODE_ENV === 'production';

// Validate environment configuration
if (isProduction && isLocal) {
    throw new Error('Cannot use LocalStack endpoints in production environment');
}

// Base AWS configuration
const baseAwsConfig = {
    region: process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'eu-west-2'
};

// LocalStack-specific configuration
const localStackConfig = isLocal ? {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localstack:4566',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    },
    forcePathStyle: true, // Required for S3 with LocalStack
    tls: false
} : {};

// Combined configuration
const awsConfig = {
    ...baseAwsConfig,
    ...localStackConfig
};

// Log configuration for debugging
logger.info('AWS Configuration initialized', {
    isLocal,
    isProduction,
    region: awsConfig.region,
    endpoint: awsConfig.endpoint || 'AWS default',
    hasCustomCredentials: !!awsConfig.credentials
});

/**
 * Create configured DynamoDB client
 * @returns {DynamoDBClient} Configured DynamoDB client
 */
export function createDynamoDBClient() {
    const client = new DynamoDBClient(awsConfig);
    
    logger.debug('DynamoDB client created', {
        endpoint: awsConfig.endpoint || 'AWS default',
        region: awsConfig.region
    });
    
    return client;
}

/**
 * Create configured DynamoDB Document client
 * @returns {DynamoDBDocumentClient} Configured DynamoDB Document client
 */
export function createDynamoDBDocumentClient() {
    const client = createDynamoDBClient();
    const docClient = DynamoDBDocumentClient.from(client, {
        marshallOptions: {
            convertEmptyValues: false,
            removeUndefinedValues: true,
            convertClassInstanceToMap: false
        },
        unmarshallOptions: {
            wrapNumbers: false
        }
    });
    
    logger.debug('DynamoDB Document client created');
    return docClient;
}

/**
 * Create configured Secrets Manager client
 * @returns {SecretsManagerClient} Configured Secrets Manager client
 */
export function createSecretsManagerClient() {
    const client = new SecretsManagerClient(awsConfig);
    
    logger.debug('Secrets Manager client created', {
        endpoint: awsConfig.endpoint || 'AWS default',
        region: awsConfig.region
    });
    
    return client;
}

/**
 * Create configured SQS client
 * @returns {SQSClient} Configured SQS client
 */
export function createSQSClient() {
    const client = new SQSClient(awsConfig);
    
    logger.debug('SQS client created', {
        endpoint: awsConfig.endpoint || 'AWS default',
        region: awsConfig.region
    });
    
    return client;
}

/**
 * Create configured OpenSearch client
 * @param {Object} options - OpenSearch client options
 * @returns {OpenSearchClient} Configured OpenSearch client
 */
export function createOpenSearchClient(options = {}) {
    let clientConfig;
    
    if (isLocal) {
        // LocalStack OpenSearch configuration
        const endpoint = process.env.OPENSEARCH_ENDPOINT || 'http://localstack:4566';
        clientConfig = {
            node: endpoint,
            auth: {
                username: 'admin',
                password: 'admin' // LocalStack default
            },
            ssl: {
                rejectUnauthorized: false
            },
            headers: {
                'Host': 'search-tattoo-directory.eu-west-2.opensearch.localhost.localstack.cloud'
            },
            ...options
        };
    } else {
        // Production OpenSearch configuration
        const endpoint = process.env.OPENSEARCH_ENDPOINT;
        const node = endpoint?.startsWith('http') ? endpoint : `https://${endpoint}`;
        
        clientConfig = {
            node: node,
            auth: {
                username: 'admin',
                password: options.password || process.env.OPENSEARCH_PASSWORD
            },
            ssl: {
                rejectUnauthorized: !endpoint?.startsWith('http://') // Don't reject for http://
            },
            ...options
        };
    }
    
    const client = new OpenSearchClient(clientConfig);
    
    logger.debug('OpenSearch client created', {
        node: clientConfig.node,
        isLocal,
        hasAuth: !!clientConfig.auth
    });
    
    return client;
}

/**
 * Get environment-specific table name
 * @param {string} baseTableName - Base table name
 * @returns {string} Environment-specific table name
 */
export function getTableName(baseTableName = 'TattooDirectory') {
    if (isLocal) {
        return process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';
    }
    return process.env.DYNAMODB_TABLE_NAME || baseTableName;
}

/**
 * Get environment-specific OpenSearch index name
 * @param {string} baseIndexName - Base index name
 * @returns {string} Environment-specific index name
 */
export function getIndexName(baseIndexName = 'artists') {
    if (isLocal) {
        return process.env.OPENSEARCH_INDEX || 'artists-local';
    }
    return process.env.OPENSEARCH_INDEX || baseIndexName;
}

/**
 * Get environment-specific S3 bucket name
 * @param {string} baseBucketName - Base bucket name
 * @returns {string} Environment-specific bucket name
 */
export function getBucketName(baseBucketName) {
    if (isLocal) {
        return `${baseBucketName}-local`;
    }
    return process.env.S3_BUCKET_NAME || baseBucketName;
}

/**
 * Validate required environment variables
 * @param {Array<string>} requiredVars - Array of required environment variable names
 * @throws {Error} If required variables are missing
 */
export function validateEnvironment(requiredVars = []) {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
        logger.error('Environment validation failed', { missing });
        throw error;
    }
    
    logger.debug('Environment validation passed', { requiredVars });
}

/**
 * Get AWS service endpoints for local development
 * @returns {Object} Service endpoints
 */
export function getServiceEndpoints() {
    if (!isLocal) {
        return {};
    }
    
    const baseEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localstack:4566';
    
    return {
        dynamodb: baseEndpoint,
        opensearch: baseEndpoint,
        s3: baseEndpoint,
        sqs: baseEndpoint,
        secretsmanager: baseEndpoint,
        apigateway: baseEndpoint
    };
}

// Export configuration constants
export const config = {
    isLocal,
    isProduction,
    region: awsConfig.region,
    endpoint: awsConfig.endpoint,
    tableName: getTableName(),
    indexName: getIndexName(),
    serviceEndpoints: getServiceEndpoints()
};

// Export AWS configuration for direct use
export { awsConfig };

logger.info('AWS configuration module loaded', {
    isLocal,
    isProduction,
    region: config.region,
    tableName: config.tableName,
    indexName: config.indexName
});