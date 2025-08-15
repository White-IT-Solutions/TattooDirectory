const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
    console.log('Queue Scraping Event:', JSON.stringify(event, null, 2));

    const { artists, scrapeId } = event;

    if (!artists || !scrapeId) {
        throw new Error('Missing artists array or scrapeId in the event payload.');
    }

    const queueUrl = process.env.SQS_QUEUE_URL;
    const promises = artists.map(artist => {
        const messageBody = {
            ...artist,
            scrapeId: scrapeId // Add the scrapeId to each message
        };
        return sqs.sendMessage({
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(messageBody)
        }).promise();
    });

    await Promise.all(promises);
    console.log(`Successfully queued ${artists.length} artists for scraping with scrapeId: ${scrapeId}`);
    return { statusCode: 200, body: `${artists.length} scraping jobs queued` };
};