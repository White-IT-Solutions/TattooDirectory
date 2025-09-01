const logger = require('./logger');
const { SQSClient, SendMessageBatchCommand } = require("@aws-sdk/client-sqs");
const { randomUUID } = require('crypto');

const sqsClient = new SQSClient({});

exports.handler = async (event) => {
    logger.info('Queue Scraping Event received', { event });

    // In a real implementation, this would receive a list of artists
    // from the previous Step Functions state.
    const artistsToQueue = event.discoveredItems || [];

    if (artistsToQueue.length === 0) {
        logger.warn('No artists provided to queue for scraping.');
        return { statusCode: 200, body: 'No jobs to queue.' };
    }

    const queueUrl = process.env.SQS_QUEUE_URL;
    // Generate a single, unique ID for this entire scrape run.
    // This is critical for the idempotency check in the Fargate container.
    const scrapeId = randomUUID();
    logger.info(`Generated new scrape run ID: ${scrapeId}`);

    let successfulCount = 0;
    const batchSize = 10; // SQS allows up to 10 messages per batch

    for (let i = 0; i < artistsToQueue.length; i += batchSize) {
        const batch = artistsToQueue.slice(i, i + batchSize);
        const entries = batch.map((artist, index) => ({
            Id: `${scrapeId}-${i + index}`, // Unique ID for the message within the batch
            MessageBody: JSON.stringify({ ...artist, scrapeId }),
        }));

        const command = new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: entries,
        });

        try {
            const result = await sqsClient.send(command);
            successfulCount += result.Successful?.length || 0;

            if (result.Failed && result.Failed.length > 0) {
                logger.error('Some messages failed to queue in batch', { failedMessages: result.Failed });
                // TODO: Implement retry logic for failed messages if necessary
            }
        } catch (error) {
            logger.error('Failed to send entire batch to SQS', { error: error.toString(), batchStartIndex: i });
        }
    }

    logger.info(`Attempted to queue ${artistsToQueue.length} jobs. Successfully queued: ${successfulCount}.`);
    return { statusCode: 200, body: 'Scraping jobs queued' };
};