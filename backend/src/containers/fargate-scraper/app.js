/**
 * Fargate Scraper Container Application
 * 
 * This container processes SQS messages containing artist scraping jobs.
 * It implements proper idempotency checks and error handling for scraping operations.
 * 
 * Requirements: 9.3, 9.5, 5.1, 4.5
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { createLogger } = require('./common/logger');
const { generateArtistKeys, updateArtist } = require('./common/dynamodb');

// Initialize AWS SDK v3 clients outside the handler for reuse
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'eu-west-2'
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const sqsClient = new SQSClient({
    region: process.env.AWS_REGION || 'eu-west-2'
});

// Environment variables
const QUEUE_URL = process.env.SQS_QUEUE_URL;
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const MAX_MESSAGES = parseInt(process.env.MAX_MESSAGES_PER_POLL) || 10;
const WAIT_TIME_SECONDS = parseInt(process.env.WAIT_TIME_SECONDS) || 20;
const VISIBILITY_TIMEOUT = parseInt(process.env.VISIBILITY_TIMEOUT) || 300;

// Create logger instance for container context
const logger = createLogger({ containerName: 'fargate-scraper' });

/**
 * Simulates web scraping logic for an artist
 * In a real implementation, this would scrape the actual website
 * @param {Object} message - SQS message containing scraping job details
 * @returns {Object} Scraped artist data
 */
async function scrapeArtistData(message) {
    const { artistId, portfolioUrl, instagramHandle } = message;
    
    logger.info('Starting scraping operation', {
        artistId,
        portfolioUrl,
        instagramHandle
    });
    
    try {
        // Simulate scraping delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulate scraped data - in real implementation, this would come from web scraping
        const scrapedData = {
            name: `Artist ${artistId}`,
            styles: ['illustrative', 'neo-traditional', 'blackwork'],
            location: 'London, UK',
            geohash: 'gcpvj0',
            locationDisplay: 'London, United Kingdom',
            portfolioImages: [
                {
                    url: `${portfolioUrl}/image1.jpg`,
                    alt: 'Portfolio image 1',
                    style: 'illustrative'
                },
                {
                    url: `${portfolioUrl}/image2.jpg`,
                    alt: 'Portfolio image 2',
                    style: 'neo-traditional'
                }
            ],
            contactInfo: {
                instagram: instagramHandle,
                website: portfolioUrl,
                bookingUrl: `${portfolioUrl}/booking`
            },
            biography: `Professional tattoo artist specializing in illustrative and neo-traditional styles.`,
            isActive: true,
            lastScrapedAt: new Date().toISOString()
        };
        
        logger.info('Scraping completed successfully', {
            artistId,
            stylesFound: scrapedData.styles.length,
            imagesFound: scrapedData.portfolioImages.length
        });
        
        return scrapedData;
    } catch (error) {
        logger.error('Scraping operation failed', {
            artistId,
            portfolioUrl,
            error: error.message
        });
        throw error;
    }
}

/**
 * Processes a single artist scraping job with idempotency checks
 * @param {Object} message - Parsed SQS message body
 */
async function processArtist(message) {
    const { artistId, portfolioUrl, scrapeId, instagramHandle } = message;
    
    if (!artistId || !scrapeId) {
        throw new Error('artistId and scrapeId are required in message');
    }
    
    logger.info('Processing artist scraping job', {
        artistId,
        scrapeId,
        portfolioUrl,
        instagramHandle
    });
    
    try {
        // Scrape the artist data
        const scrapedData = await scrapeArtistData(message);
        
        // Generate correct DynamoDB keys using consolidated patterns
        const keys = generateArtistKeys(artistId);
        
        // Prepare update command with idempotency check
        const command = new UpdateCommand({
            TableName: DYNAMODB_TABLE_NAME,
            Key: keys,
            // This condition is the core of the idempotency check.
            // It ensures the update only happens if the item's scrapeId is not the current one.
            ConditionExpression: 'attribute_not_exists(scrapeId) OR scrapeId <> :scrapeId',
            UpdateExpression: `SET 
                artistName = :name,
                styles = :styles,
                #location = :location,
                geohash = :geohash,
                locationDisplay = :locationDisplay,
                portfolioImages = :portfolioImages,
                contactInfo = :contactInfo,
                biography = :biography,
                isActive = :isActive,
                scrapeId = :scrapeId,
                lastScrapedAt = :lastScrapedAt,
                updatedAt = :updatedAt`,
            ExpressionAttributeNames: {
                '#location': 'location' // 'location' is a reserved word in DynamoDB
            },
            ExpressionAttributeValues: {
                ':name': scrapedData.name,
                ':styles': scrapedData.styles,
                ':location': scrapedData.location,
                ':geohash': scrapedData.geohash,
                ':locationDisplay': scrapedData.locationDisplay,
                ':portfolioImages': scrapedData.portfolioImages,
                ':contactInfo': scrapedData.contactInfo,
                ':biography': scrapedData.biography,
                ':isActive': scrapedData.isActive,
                ':scrapeId': scrapeId,
                ':lastScrapedAt': scrapedData.lastScrapedAt,
                ':updatedAt': new Date().toISOString()
            }
        });

        await ddbDocClient.send(command);
        
        logger.info('Successfully updated artist', {
            artistId,
            scrapeId,
            stylesCount: scrapedData.styles.length,
            imagesCount: scrapedData.portfolioImages.length
        });
        
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            // This is not an error, but an expected outcome for a duplicate message.
            logger.warn('Skipping update for artist, already processed in this scrape run', {
                artistId,
                scrapeId
            });
        } else {
            // A real error occurred.
            logger.error('Error updating artist', {
                artistId,
                scrapeId,
                error: error.message,
                errorStack: error.stack
            });
            throw error; // Re-throw to let SQS handle retry/DLQ logic.
        }
    }
}

/**
 * Polls SQS queue for messages and processes them
 */
async function pollQueue() {
    if (!QUEUE_URL) {
        throw new Error('SQS_QUEUE_URL environment variable is required');
    }
    
    if (!DYNAMODB_TABLE_NAME) {
        throw new Error('DYNAMODB_TABLE_NAME environment variable is required');
    }
    
    logger.info('Starting queue polling', {
        queueUrl: QUEUE_URL,
        maxMessages: MAX_MESSAGES,
        waitTimeSeconds: WAIT_TIME_SECONDS
    });
    
    while (true) {
        try {
            // Receive messages from SQS
            const receiveCommand = new ReceiveMessageCommand({
                QueueUrl: QUEUE_URL,
                MaxNumberOfMessages: MAX_MESSAGES,
                WaitTimeSeconds: WAIT_TIME_SECONDS,
                VisibilityTimeout: VISIBILITY_TIMEOUT,
                MessageAttributeNames: ['All']
            });
            
            const result = await sqsClient.send(receiveCommand);
            
            if (!result.Messages || result.Messages.length === 0) {
                logger.info('No messages received, continuing to poll');
                continue;
            }
            
            logger.info('Received messages from queue', {
                messageCount: result.Messages.length
            });
            
            // Process messages in parallel
            const processingPromises = result.Messages.map(async (sqsMessage) => {
                try {
                    // Parse message body
                    const messageBody = JSON.parse(sqsMessage.Body);
                    
                    logger.info('Processing SQS message', {
                        messageId: sqsMessage.MessageId,
                        receiptHandle: sqsMessage.ReceiptHandle?.substring(0, 20) + '...'
                    });
                    
                    // Process the artist scraping job
                    await processArtist(messageBody);
                    
                    // Delete message from queue after successful processing
                    const deleteCommand = new DeleteMessageCommand({
                        QueueUrl: QUEUE_URL,
                        ReceiptHandle: sqsMessage.ReceiptHandle
                    });
                    
                    await sqsClient.send(deleteCommand);
                    
                    logger.info('Successfully processed and deleted message', {
                        messageId: sqsMessage.MessageId,
                        artistId: messageBody.artistId
                    });
                    
                } catch (error) {
                    logger.error('Failed to process SQS message', {
                        messageId: sqsMessage.MessageId,
                        error: error.message,
                        errorStack: error.stack
                    });
                    
                    // Don't delete the message - let it return to queue for retry
                    // SQS will handle retry logic and eventual DLQ routing
                }
            });
            
            // Wait for all messages to be processed
            await Promise.allSettled(processingPromises);
            
        } catch (error) {
            logger.error('Error in queue polling loop', {
                error: error.message,
                errorStack: error.stack
            });
            
            // Wait before retrying to avoid tight error loops
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
    const shutdown = (signal) => {
        logger.info('Received shutdown signal, gracefully shutting down', { signal });
        process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

/**
 * Main application entry point
 */
async function main() {
    try {
        logger.info('Starting Fargate scraper container', {
            nodeVersion: process.version,
            region: process.env.AWS_REGION,
            queueUrl: QUEUE_URL,
            tableName: DYNAMODB_TABLE_NAME
        });
        
        // Setup graceful shutdown
        setupGracefulShutdown();
        
        // Start polling the queue
        await pollQueue();
        
    } catch (error) {
        logger.error('Fatal error in main application', {
            error: error.message,
            errorStack: error.stack
        });
        process.exit(1);
    }
}

// Start the application if this file is run directly
if (require.main === module) {
    main().catch((error) => {
        console.error('Unhandled error in main:', error);
        process.exit(1);
    });
}

module.exports = {
    processArtist,
    scrapeArtistData,
    pollQueue,
    main
};