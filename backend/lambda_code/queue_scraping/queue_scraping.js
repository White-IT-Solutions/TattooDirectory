const logger = require('./logger');
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

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
    let queuedCount = 0;

    for (const artist of artistsToQueue) {
        try {
            const command = new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: JSON.stringify(artist),
            });
            await sqsClient.send(command);
            queuedCount++;
        } catch (error) {
            logger.error('Failed to send message to SQS', { error: error.toString(), artist });
        }
    }

    logger.info(`Successfully queued ${queuedCount} of ${artistsToQueue.length} scraping jobs.`);
    return { statusCode: 200, body: 'Scraping jobs queued' };
};