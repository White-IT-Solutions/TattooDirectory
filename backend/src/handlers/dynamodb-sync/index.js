import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { createLogger } from '../../common/logger.js';
import { 
    createOpenSearchClient, 
    createSecretsManagerClient, 
    getIndexName,
    config 
} from '../../common/aws-config.js';

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2
};

// Monitoring configuration
const METRICS_NAMESPACE = 'TattooDirectory/DataSync';

// --- Client Initialization ---
// Cache the OpenSearch client and secrets manager client for reuse across invocations
let osClient;
const secretsManagerClient = createSecretsManagerClient();
const cloudWatchClient = new CloudWatchClient({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint: config.isLocal ? process.env.AWS_ENDPOINT_URL : undefined,
    credentials: config.isLocal ? {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    } : undefined
});

/**
 * Send metrics to CloudWatch for monitoring
 * @param {string} metricName - Name of the metric
 * @param {number} value - Metric value
 * @param {string} unit - Metric unit (Count, Seconds, etc.)
 * @param {Object} dimensions - Additional dimensions for the metric
 * @param {Object} logger - Logger instance
 */
async function sendMetric(metricName, value, unit = 'Count', dimensions = {}, logger) {
    try {
        const metricData = {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
            Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
        };

        await cloudWatchClient.send(new PutMetricDataCommand({
            Namespace: METRICS_NAMESPACE,
            MetricData: [metricData]
        }));

        logger.debug('Metric sent to CloudWatch', { metricName, value, unit, dimensions });
    } catch (error) {
        logger.warn('Failed to send metric to CloudWatch', {
            error: error.message,
            metricName,
            value
        });
        // Don't throw - metrics are nice to have but not critical
    }
}

/**
 * Retry function with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {Object} logger - Logger instance
 * @param {string} operationName - Name of the operation for logging
 * @param {Object} retryConfig - Retry configuration
 * @returns {Promise<any>} Result of the operation
 */
async function retryWithBackoff(operation, logger, operationName, retryConfig = RETRY_CONFIG) {
    let lastError;
    
    for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            const result = await operation();
            
            if (attempt > 1) {
                logger.info('Operation succeeded after retry', {
                    operationName,
                    attempt,
                    totalAttempts: retryConfig.maxRetries
                });
            }
            
            return result;
        } catch (error) {
            lastError = error;
            
            if (attempt === retryConfig.maxRetries) {
                logger.error('Operation failed after all retries', {
                    operationName,
                    attempt,
                    totalAttempts: retryConfig.maxRetries,
                    error: error.message
                });
                break;
            }
            
            // Calculate delay with exponential backoff
            const delay = Math.min(
                retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
                retryConfig.maxDelayMs
            );
            
            logger.warn('Operation failed, retrying', {
                operationName,
                attempt,
                totalAttempts: retryConfig.maxRetries,
                error: error.message,
                retryDelayMs: delay
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

/**
 * Check OpenSearch cluster health and lag
 * @param {Client} osClient - OpenSearch client
 * @param {Object} logger - Logger instance
 * @returns {Promise<Object>} Health status and metrics
 */
async function checkOpenSearchHealth(osClient, logger) {
    try {
        const healthResponse = await osClient.cluster.health({
            wait_for_status: 'yellow',
            timeout: '5s'
        });
        
        const indexStats = await osClient.indices.stats({
            index: getIndexName()
        });
        
        const health = {
            status: healthResponse.body.status,
            numberOfNodes: healthResponse.body.number_of_nodes,
            numberOfDataNodes: healthResponse.body.number_of_data_nodes,
            activePrimaryShards: healthResponse.body.active_primary_shards,
            activeShards: healthResponse.body.active_shards,
            relocatingShards: healthResponse.body.relocating_shards,
            initializingShards: healthResponse.body.initializing_shards,
            unassignedShards: healthResponse.body.unassigned_shards,
            indexDocCount: indexStats.body._all?.total?.docs?.count || 0,
            indexSizeBytes: indexStats.body._all?.total?.store?.size_in_bytes || 0
        };
        
        // Send health metrics to CloudWatch
        await sendMetric('ClusterStatus', health.status === 'green' ? 1 : 0, 'Count', 
            { Status: health.status }, logger);
        await sendMetric('DocumentCount', health.indexDocCount, 'Count', {}, logger);
        await sendMetric('IndexSizeBytes', health.indexSizeBytes, 'Bytes', {}, logger);
        
        return health;
    } catch (error) {
        logger.error('Failed to check OpenSearch health', {
            error: error.message,
            stack: error.stack
        });
        
        await sendMetric('HealthCheckFailure', 1, 'Count', {}, logger);
        throw error;
    }
}

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
 * Enhanced to handle NEW_AND_OLD_IMAGES stream view type with retry logic
 * @param {Object} record - DynamoDB stream record
 * @param {Object} logger - Logger instance with correlation ID
 * @param {Client} osClient - OpenSearch client
 */
async function processStreamRecord(record, logger, osClient) {
    const { eventName, dynamodb } = record;
    
    try {
        // Extract record keys for logging
        const recordKeys = {
            pk: dynamodb.Keys?.PK?.S || 'unknown',
            sk: dynamodb.Keys?.SK?.S || 'unknown'
        };

        if (eventName === 'INSERT' || eventName === 'MODIFY') {
            // Validate NewImage exists for INSERT/MODIFY events
            if (!dynamodb.NewImage) {
                logger.warn('NewImage missing for INSERT/MODIFY event', {
                    eventName,
                    ...recordKeys
                });
                return;
            }

            const newImage = unmarshall(dynamodb.NewImage);
            
            // For MODIFY events, also log what changed if OldImage is available
            let changeDetails = {};
            if (eventName === 'MODIFY' && dynamodb.OldImage) {
                const oldImage = unmarshall(dynamodb.OldImage);
                changeDetails = {
                    hasOldImage: true,
                    fieldsChanged: Object.keys(newImage).filter(key => 
                        JSON.stringify(newImage[key]) !== JSON.stringify(oldImage[key])
                    )
                };
            }
            
            logger.info('Processing INSERT/MODIFY event', {
                eventName,
                pk: newImage.PK,
                sk: newImage.SK,
                ...changeDetails
            });
            
            // Only process ARTIST records with METADATA sort key
            if (newImage?.PK?.startsWith('ARTIST#') && newImage?.SK === 'METADATA') {
                const document = transformToOpenSearchDocument(newImage);
                
                // Use retry logic for OpenSearch indexing
                await retryWithBackoff(async () => {
                    return await osClient.index({
                        index: getIndexName(),
                        id: newImage.PK,
                        body: document,
                        refresh: 'wait_for' // Ensure document is immediately searchable
                    });
                }, logger, `index-document-${newImage.PK}`);
                
                logger.info('Successfully indexed document in OpenSearch', {
                    documentId: newImage.PK,
                    artistId: document.artistId,
                    operation: eventName === 'INSERT' ? 'created' : 'updated'
                });
                
                // Send success metric
                await sendMetric('DocumentIndexed', 1, 'Count', {
                    Operation: eventName === 'INSERT' ? 'Create' : 'Update'
                }, logger);
            } else {
                logger.debug('Skipping non-artist record or non-metadata record', {
                    pk: newImage.PK,
                    sk: newImage.SK,
                    eventName
                });
            }
            
        } else if (eventName === 'REMOVE') {
            // Validate OldImage exists for REMOVE events
            if (!dynamodb.OldImage) {
                logger.warn('OldImage missing for REMOVE event', {
                    eventName,
                    ...recordKeys
                });
                return;
            }

            const oldImage = unmarshall(dynamodb.OldImage);
            
            logger.info('Processing REMOVE event', {
                eventName,
                pk: oldImage.PK,
                sk: oldImage.SK
            });
            
            // Only process ARTIST records with METADATA sort key
            if (oldImage?.PK?.startsWith('ARTIST#') && oldImage?.SK === 'METADATA') {
                try {
                    // Use retry logic for OpenSearch deletion
                    await retryWithBackoff(async () => {
                        return await osClient.delete({
                            index: getIndexName(),
                            id: oldImage.PK
                        });
                    }, logger, `delete-document-${oldImage.PK}`);
                    
                    logger.info('Successfully deleted document from OpenSearch', {
                        documentId: oldImage.PK,
                        artistId: oldImage.PK?.replace('ARTIST#', '') || 'unknown'
                    });
                    
                    // Send success metric
                    await sendMetric('DocumentDeleted', 1, 'Count', {}, logger);
                } catch (deleteError) {
                    // If document doesn't exist, that's okay - log as warning, not error
                    if (deleteError.meta?.statusCode === 404) {
                        logger.warn('Document not found in OpenSearch for deletion', {
                            documentId: oldImage.PK
                        });
                        
                        // Send metric for missing document
                        await sendMetric('DocumentNotFound', 1, 'Count', {}, logger);
                    } else {
                        throw deleteError;
                    }
                }
            } else {
                logger.debug('Skipping non-artist record or non-metadata record for deletion', {
                    pk: oldImage.PK,
                    sk: oldImage.SK,
                    eventName
                });
            }
        } else {
            logger.debug('Skipping unsupported event type', { 
                eventName,
                ...recordKeys
            });
        }
        
    } catch (error) {
        logger.error('Error processing DynamoDB stream record', {
            error: error.message,
            eventName,
            pk: dynamodb.Keys?.PK?.S || 'unknown',
            sk: dynamodb.Keys?.SK?.S || 'unknown',
            stack: error.stack
        });
        
        // Re-throw error to trigger dead letter queue processing
        throw error;
    }
}

/**
 * Lambda handler for DynamoDB to OpenSearch synchronization
 * Processes DynamoDB stream events and maintains OpenSearch index
 * Enhanced with retry logic, monitoring, and lag detection
 * @param {Object} event - DynamoDB stream event
 * @param {Object} context - Lambda context
 */
export const handler = async (event, context) => {
    const startTime = Date.now();
    const logger = createLogger(context, event);
    
    logger.info('DynamoDB Stream Event received', {
        recordCount: event.Records?.length || 0,
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        eventSourceARN: event.Records?.[0]?.eventSourceARN
    });
    
    // Send metric for function invocation
    await sendMetric('FunctionInvocation', 1, 'Count', {}, logger);

    // Validate environment variables
    if (!process.env.OPENSEARCH_ENDPOINT) {
        const error = new Error('OPENSEARCH_ENDPOINT environment variable is required');
        logger.error('Missing required environment variable', { error: error.message });
        throw error;
    }
    
    // APP_SECRETS_ARN is only required in production, not in local development
    if (!config.isLocal && !process.env.APP_SECRETS_ARN) {
        const error = new Error('APP_SECRETS_ARN environment variable is required in production');
        logger.error('Missing required environment variable', { error: error.message });
        throw error;
    }

    let osClient;
    try {
        osClient = await getOpenSearchClient();
        logger.info('Successfully initialized OpenSearch client');
        
        // Check OpenSearch health and send metrics
        const health = await checkOpenSearchHealth(osClient, logger);
        logger.info('OpenSearch cluster health check completed', health);
    } catch (error) {
        logger.error('Failed to initialize OpenSearch client or check health', {
            error: error.message,
            stack: error.stack
        });
        
        await sendMetric('InitializationFailure', 1, 'Count', {}, logger);
        throw error;
    }

    // Validate stream event structure
    if (!event.Records || !Array.isArray(event.Records)) {
        const error = new Error('Invalid DynamoDB stream event: missing or invalid Records array');
        logger.error('Invalid stream event structure', { 
            error: error.message,
            eventStructure: typeof event.Records 
        });
        throw error;
    }

    // Process each record in the stream
    const results = [];
    let totalLagMs = 0;
    
    for (const record of event.Records) {
        const recordStartTime = Date.now();
        
        try {
            // Validate record structure
            if (!record.eventName || !record.dynamodb) {
                logger.warn('Skipping invalid stream record', {
                    recordId: record.dynamodb?.Keys?.PK?.S || 'unknown',
                    missingFields: {
                        eventName: !record.eventName,
                        dynamodb: !record.dynamodb
                    }
                });
                continue;
            }
            
            // Calculate lag from DynamoDB stream timestamp
            const streamTimestamp = record.dynamodb.ApproximateCreationDateTime;
            const lagMs = streamTimestamp ? Date.now() - (streamTimestamp * 1000) : 0;
            totalLagMs += lagMs;
            
            if (lagMs > 30000) { // Alert if lag > 30 seconds
                logger.warn('High sync lag detected', {
                    recordId: record.dynamodb?.Keys?.PK?.S || 'unknown',
                    lagMs,
                    lagSeconds: Math.round(lagMs / 1000)
                });
                
                await sendMetric('HighSyncLag', 1, 'Count', {
                    LagThreshold: '30s'
                }, logger);
            }

            await processStreamRecord(record, logger, osClient);
            
            const processingTimeMs = Date.now() - recordStartTime;
            
            results.push({ 
                success: true, 
                recordId: record.dynamodb?.Keys?.PK?.S || 'unknown',
                eventName: record.eventName,
                lagMs,
                processingTimeMs
            });
            
            // Send processing time metric
            await sendMetric('RecordProcessingTime', processingTimeMs, 'Milliseconds', {
                EventName: record.eventName
            }, logger);
            
        } catch (error) {
            const processingTimeMs = Date.now() - recordStartTime;
            
            logger.error('Failed to process stream record', {
                error: error.message,
                recordId: record.dynamodb?.Keys?.PK?.S || 'unknown',
                eventName: record.eventName,
                processingTimeMs,
                stack: error.stack
            });
            
            results.push({ 
                success: false, 
                recordId: record.dynamodb?.Keys?.PK?.S || 'unknown',
                eventName: record.eventName,
                error: error.message,
                processingTimeMs
            });
            
            // Send error metric
            await sendMetric('RecordProcessingError', 1, 'Count', {
                EventName: record.eventName,
                ErrorType: error.name || 'Unknown'
            }, logger);
        }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const totalProcessingTime = Date.now() - startTime;
    const averageLagMs = results.length > 0 ? totalLagMs / results.length : 0;
    
    // Send batch metrics
    await sendMetric('BatchProcessingTime', totalProcessingTime, 'Milliseconds', {}, logger);
    await sendMetric('BatchSuccessCount', successCount, 'Count', {}, logger);
    await sendMetric('BatchFailureCount', failureCount, 'Count', {}, logger);
    await sendMetric('AverageSyncLag', averageLagMs, 'Milliseconds', {}, logger);
    
    logger.info('DynamoDB sync processing completed', {
        totalRecords: results.length,
        successCount,
        failureCount,
        totalProcessingTimeMs: totalProcessingTime,
        averageLagMs: Math.round(averageLagMs),
        averageLagSeconds: Math.round(averageLagMs / 1000)
    });

    // If any records failed, throw an error to trigger DLQ processing
    if (failureCount > 0) {
        const failedRecords = results.filter(r => !r.success);
        const error = new Error(`Failed to process ${failureCount} out of ${results.length} records`);
        logger.error('Batch processing failed', {
            error: error.message,
            failedRecords: failedRecords.map(r => ({ recordId: r.recordId, error: r.error }))
        });
        
        await sendMetric('BatchProcessingFailure', 1, 'Count', {
            FailureRate: (failureCount / results.length * 100).toFixed(2)
        }, logger);
        
        throw error;
    }
    
    await sendMetric('BatchProcessingSuccess', 1, 'Count', {}, logger);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Successfully processed all DynamoDB stream records',
            processedRecords: successCount,
            totalProcessingTimeMs: totalProcessingTime,
            averageLagMs: Math.round(averageLagMs)
        })
    };
};