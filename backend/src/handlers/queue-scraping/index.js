/**
 * Queue Scraping Handler
 * 
 * This Lambda function receives discovered artists from the data aggregation pipeline
 * and queues them for detailed scraping by Fargate containers. It manages SQS message
 * batching and includes idempotency controls for scraping operations.
 */

import { createLogger } from '../../common/logger.js';
import { generateArtistKeys, generateAllGSIKeys } from '../../common/dynamodb.js';
import { SendMessageBatchCommand } from "@aws-sdk/client-sqs";
import { createSQSClient } from '../../common/aws-config.js';
import { randomUUID } from 'crypto';

const sqsClient = createSQSClient();

export const handler = async (event, context) => {
    const logger = createLogger(context, event);
    
    try {
        logger.info('Queue Scraping Event received', {
            eventSource: event.source || 'step_functions',
            itemCount: event.discoveredItems?.length || 0
        });

        // Extract discovered items from the event
        // This could come from discover-studios or find-artists steps
        const discoveredItems = event.discoveredItems || event.artists || [];

        if (discoveredItems.length === 0) {
            logger.warn('No artists provided to queue for scraping', {
                eventKeys: Object.keys(event)
            });
            return { 
                statusCode: 200, 
                body: 'No jobs to queue',
                queuedCount: 0,
                scrapeId: null
            };
        }

        const queueUrl = process.env.SQS_QUEUE_URL;
        if (!queueUrl) {
            throw new Error('SQS_QUEUE_URL environment variable is required');
        }

        // Generate a single, unique ID for this entire scrape run.
        // This is critical for the idempotency check in the Fargate container.
        const scrapeId = randomUUID();
        logger.info('Generated new scrape run ID', { 
            scrapeId,
            itemCount: discoveredItems.length 
        });

        let successfulCount = 0;
        let failedCount = 0;
        const batchSize = 10; // SQS allows up to 10 messages per batch
        const failedItems = [];

        // Process items in batches
        for (let i = 0; i < discoveredItems.length; i += batchSize) {
            const batch = discoveredItems.slice(i, i + batchSize);
            
            try {
                const entries = batch.map((item, index) => {
                    // Ensure proper key structure for each item
                    const enrichedItem = enrichItemWithKeys(item, logger);
                    
                    return {
                        Id: `${scrapeId}-${i + index}`, // Unique ID for the message within the batch
                        MessageBody: JSON.stringify({ 
                            ...enrichedItem, 
                            scrapeId,
                            queuedAt: new Date().toISOString(),
                            priority: calculateScrapingPriority(enrichedItem)
                        }),
                        MessageAttributes: {
                            'scrapeId': {
                                DataType: 'String',
                                StringValue: scrapeId
                            },
                            'artistId': {
                                DataType: 'String',
                                StringValue: enrichedItem.artistId || 'unknown'
                            },
                            'source': {
                                DataType: 'String',
                                StringValue: enrichedItem.source || 'unknown'
                            }
                        }
                    };
                });

                const command = new SendMessageBatchCommand({
                    QueueUrl: queueUrl,
                    Entries: entries,
                });

                const result = await sqsClient.send(command);
                
                // Track successful and failed messages
                const batchSuccessCount = result.Successful?.length || 0;
                successfulCount += batchSuccessCount;

                if (result.Failed && result.Failed.length > 0) {
                    failedCount += result.Failed.length;
                    failedItems.push(...result.Failed);
                    
                    logger.error('Some messages failed to queue in batch', { 
                        failedMessages: result.Failed,
                        batchStartIndex: i,
                        scrapeId
                    });
                }

                logger.info('Batch queued successfully', {
                    batchIndex: Math.floor(i / batchSize) + 1,
                    batchSize: entries.length,
                    successCount: batchSuccessCount,
                    failedCount: result.Failed?.length || 0,
                    scrapeId
                });

            } catch (error) {
                failedCount += batch.length;
                logger.error('Failed to send entire batch to SQS', { 
                    error: error.message,
                    batchStartIndex: i,
                    batchSize: batch.length,
                    scrapeId
                });
                
                // Add all items in the failed batch to failedItems
                failedItems.push(...batch.map((item, index) => ({
                    Id: `${scrapeId}-${i + index}`,
                    Code: 'BatchSendError',
                    Message: error.message
                })));
            }
        }

        const totalAttempted = discoveredItems.length;
        const successRate = totalAttempted > 0 ? (successfulCount / totalAttempted) * 100 : 0;

        logger.info('Scraping queue operation completed', {
            totalAttempted,
            successfulCount,
            failedCount,
            successRate: `${successRate.toFixed(2)}%`,
            scrapeId
        });

        // Return structured response for Step Functions
        return {
            statusCode: successfulCount > 0 ? 200 : 500,
            body: 'Scraping jobs queued',
            scrapeId,
            summary: {
                totalAttempted,
                successfulCount,
                failedCount,
                successRate,
                timestamp: new Date().toISOString()
            },
            failedItems: failedItems.length > 0 ? failedItems : undefined
        };

    } catch (error) {
        logger.error('Failed to queue scraping jobs', {
            error: error.message,
            stack: error.stack,
            eventData: event
        });

        return {
            statusCode: 500,
            body: 'Failed to queue scraping jobs',
            error: {
                message: error.message,
                type: 'QUEUE_ERROR',
                timestamp: new Date().toISOString()
            }
        };
    }
};

/**
 * Enrich an item with proper DynamoDB key structure
 * @param {Object} item - Discovered item
 * @param {Object} logger - Logger instance
 * @returns {Object} Enriched item with proper keys
 */
function enrichItemWithKeys(item, logger) {
    try {
        // If keys are already present, use them
        if (item.keys) {
            return item;
        }

        // Generate keys if missing
        const { artistId, artistName, instagramHandle, styles, geohash } = item;
        
        if (!artistId) {
            logger.warn('Item missing artistId, cannot generate keys', { item });
            return item;
        }

        // Generate primary keys
        const primaryKeys = generateArtistKeys(artistId);
        
        // Generate GSI keys if we have enough data
        let gsiKeys = {};
        if (artistName || instagramHandle || (styles && geohash)) {
            try {
                gsiKeys = generateAllGSIKeys({
                    artistId,
                    artistName: artistName || `Artist ${artistId}`,
                    instagramHandle,
                    styles: styles || ['traditional'],
                    geohash
                });
            } catch (keyError) {
                logger.warn('Failed to generate GSI keys for item', {
                    artistId,
                    error: keyError.message
                });
            }
        }

        return {
            ...item,
            keys: {
                ...primaryKeys,
                ...gsiKeys
            }
        };

    } catch (error) {
        logger.error('Failed to enrich item with keys', {
            error: error.message,
            artistId: item.artistId
        });
        return item;
    }
}

/**
 * Calculate scraping priority based on item characteristics
 * @param {Object} item - Item to calculate priority for
 * @returns {number} Priority score (1-10, higher is more important)
 */
function calculateScrapingPriority(item) {
    let priority = 5; // Base priority
    
    // Higher priority for items with Instagram handles
    if (item.instagramHandle) {
        priority += 2;
    }
    
    // Higher priority for popular styles
    const popularStyles = ['traditional', 'realism', 'blackwork', 'neo-traditional'];
    if (item.styles && item.styles.some(style => popularStyles.includes(style))) {
        priority += 1;
    }
    
    // Higher priority for major cities
    const majorCities = ['london', 'manchester', 'birmingham', 'leeds', 'glasgow'];
    if (item.location && majorCities.includes(item.location.toLowerCase())) {
        priority += 1;
    }
    
    // Higher priority for high-confidence discoveries
    if (item.metadata?.confidence && item.metadata.confidence > 0.9) {
        priority += 1;
    }
    
    return Math.min(priority, 10); // Cap at 10
}