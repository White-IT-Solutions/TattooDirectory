import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { createLogger } from '../../common/logger.js';
import { 
    createOpenSearchClient, 
    createSecretsManagerClient, 
    getIndexName,
    config 
} from '../../common/aws-config.js';

// --- Client Initialization ---
// Cache the OpenSearch client and secrets manager client for reuse across invocations
let osClient;
const secretsManagerClient = createSecretsManagerClient();

/**
 * Initialize OpenSearch client with credentials from Secrets Manager
 * @returns {Promise<Client>} OpenSearch client instance
 */
async function getOpenSearchClient() {
    if (osClient) return osClient;

    try {
        if (config.isLocal) {
            // Local development - use default LocalStack credentials
            osClient = createOpenSearchClient();
            return osClient;
        }
        
        // Production - fetch the OpenSearch password from Secrets Manager
        const secretValue = await secretsManagerClient.send(
            new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN })
        );
        const secrets = JSON.parse(secretValue.SecretString);

        osClient = createOpenSearchClient({
            password: secrets.opensearch_master_password
        });

        return osClient;
    } catch (error) {
        throw new Error(`Failed to initialize OpenSearch client: ${error.message}`);
    }
}

/**
 * Transform DynamoDB item to OpenSearch document format
 * Maps DynamoDB attributes to OpenSearch fields with proper field mapping
 * @param {Object} dynamoItem - Unmarshalled DynamoDB item
 * @returns {Object} OpenSearch document
 */
function transformToOpenSearchDocument(dynamoItem) {
    // Extract artist ID from PK (format: ARTIST#{artistId})
    const artistId = dynamoItem.PK?.replace('ARTIST#', '') || '';
    
    return {
        id: artistId,
        artistId: artistId,
        name: dynamoItem.name || '',
        styles: dynamoItem.styles || [],
        location: dynamoItem.location || '',
        locationCity: dynamoItem.locationCity || '',
        locationCountry: dynamoItem.locationCountry || 'UK',
        instagramHandle: dynamoItem.instagramHandle || '',
        studioName: dynamoItem.studioName || '',
        portfolioImages: dynamoItem.portfolioImages || [],
        geohash: dynamoItem.geohash || '',
        // Add geolocation for map-based searches
        geoLocation: dynamoItem.latitude && dynamoItem.longitude ? {
            lat: parseFloat(dynamoItem.latitude),
            lon: parseFloat(dynamoItem.longitude)
        } : null,
        // Metadata for search optimization
        searchKeywords: [
            dynamoItem.name,
            dynamoItem.studioName,
            ...(dynamoItem.styles || []),
            dynamoItem.locationCity
        ].filter(Boolean).join(' ').toLowerCase(),
        lastUpdated: new Date().toISOString(),
        // Include original DynamoDB keys for reference
        pk: dynamoItem.PK,
        sk: dynamoItem.SK
    };
}

/**
 * Process DynamoDB stream record and sync to OpenSearch
 * @param {Object} record - DynamoDB stream record
 * @param {Object} logger - Logger instance with correlation ID
 * @param {Client} osClient - OpenSearch client
 */
async function processStreamRecord(record, logger, osClient) {
    const { eventName, dynamodb } = record;
    
    try {
        if (eventName === 'INSERT' || eventName === 'MODIFY') {
            const newImage = unmarshall(dynamodb.NewImage);
            
            logger.info('Processing INSERT/MODIFY event', {
                eventName,
                pk: newImage.PK,
                sk: newImage.SK
            });
            
            // Only process ARTIST records with METADATA sort key
            if (newImage?.PK?.startsWith('ARTIST#') && newImage?.SK === 'METADATA') {
                const document = transformToOpenSearchDocument(newImage);
                
                await osClient.index({
                    index: getIndexName(),
                    id: newImage.PK,
                    body: document,
                    refresh: 'wait_for' // Ensure document is immediately searchable
                });
                
                logger.info('Successfully indexed document in OpenSearch', {
                    documentId: newImage.PK,
                    artistId: document.artistId
                });
            } else {
                logger.debug('Skipping non-artist record or non-metadata record', {
                    pk: newImage.PK,
                    sk: newImage.SK
                });
            }
            
        } else if (eventName === 'REMOVE') {
            const oldImage = unmarshall(dynamodb.OldImage);
            
            logger.info('Processing REMOVE event', {
                eventName,
                pk: oldImage.PK,
                sk: oldImage.SK
            });
            
            // Only process ARTIST records with METADATA sort key
            if (oldImage?.PK?.startsWith('ARTIST#') && oldImage?.SK === 'METADATA') {
                try {
                    await osClient.delete({
                        index: getIndexName(),
                        id: oldImage.PK
                    });
                    
                    logger.info('Successfully deleted document from OpenSearch', {
                        documentId: oldImage.PK
                    });
                } catch (deleteError) {
                    // If document doesn't exist, that's okay - log as warning, not error
                    if (deleteError.meta?.statusCode === 404) {
                        logger.warn('Document not found in OpenSearch for deletion', {
                            documentId: oldImage.PK
                        });
                    } else {
                        throw deleteError;
                    }
                }
            } else {
                logger.debug('Skipping non-artist record or non-metadata record for deletion', {
                    pk: oldImage.PK,
                    sk: oldImage.SK
                });
            }
        } else {
            logger.debug('Skipping unsupported event type', { eventName });
        }
        
    } catch (error) {
        logger.error('Error processing DynamoDB stream record', {
            error: error.message,
            eventName,
            pk: dynamodb.Keys?.PK?.S,
            sk: dynamodb.Keys?.SK?.S,
            stack: error.stack
        });
        
        // Re-throw error to trigger dead letter queue processing
        throw error;
    }
}

/**
 * Lambda handler for DynamoDB to OpenSearch synchronization
 * Processes DynamoDB stream events and maintains OpenSearch index
 * @param {Object} event - DynamoDB stream event
 * @param {Object} context - Lambda context
 */
export const handler = async (event, context) => {
    const logger = createLogger(context, event);
    
    logger.info('DynamoDB Stream Event received', {
        recordCount: event.Records?.length || 0,
        functionName: context.functionName,
        functionVersion: context.functionVersion
    });

    // Validate environment variables
    if (!process.env.OPENSEARCH_ENDPOINT) {
        const error = new Error('OPENSEARCH_ENDPOINT environment variable is required');
        logger.error('Missing required environment variable', { error: error.message });
        throw error;
    }
    
    if (!process.env.APP_SECRETS_ARN) {
        const error = new Error('APP_SECRETS_ARN environment variable is required');
        logger.error('Missing required environment variable', { error: error.message });
        throw error;
    }

    let osClient;
    try {
        osClient = await getOpenSearchClient();
        logger.info('Successfully initialized OpenSearch client');
    } catch (error) {
        logger.error('Failed to initialize OpenSearch client', {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }

    // Process each record in the stream
    const results = [];
    for (const record of event.Records || []) {
        try {
            await processStreamRecord(record, logger, osClient);
            results.push({ success: true, recordId: record.dynamodb?.Keys?.PK?.S });
        } catch (error) {
            logger.error('Failed to process stream record', {
                error: error.message,
                recordId: record.dynamodb?.Keys?.PK?.S,
                eventName: record.eventName
            });
            results.push({ 
                success: false, 
                recordId: record.dynamodb?.Keys?.PK?.S,
                error: error.message 
            });
            
            // For DynamoDB streams, we should throw to trigger retry/DLQ
            // But we'll continue processing other records first
        }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    logger.info('DynamoDB sync processing completed', {
        totalRecords: results.length,
        successCount,
        failureCount
    });

    // If any records failed, throw an error to trigger DLQ processing
    if (failureCount > 0) {
        const failedRecords = results.filter(r => !r.success);
        const error = new Error(`Failed to process ${failureCount} out of ${results.length} records`);
        logger.error('Batch processing failed', {
            error: error.message,
            failedRecords: failedRecords.map(r => ({ recordId: r.recordId, error: r.error }))
        });
        throw error;
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Successfully processed all DynamoDB stream records',
            processedRecords: successCount
        })
    };
};