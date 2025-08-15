const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const logger = require('./common/logger'); // Assumes logger is copied to a 'common' subdir

// Initialize AWS SDK v3 clients outside the handler for reuse
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

async function processArtist(message) {
    // `message` is the parsed SQS message body, e.g.:
    // { artistId: '...', portfolioUrl: '...', scrapeId: '...' }

    // scrapedData is the result of your scraping logic
    const scrapedData = { name: 'Artist Name', styles: ['illustrative', 'neo-traditional'], location: 'London, UK' };

    const command = new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
            // Your primary key for the artist item
            'PK': `ARTIST#${message.artistId}`,
            'SK': `ARTIST#${message.artistId}`
        },
        // This condition is the core of the idempotency check.
        // It ensures the update only happens if the item's scrapeId is not the current one.
        ConditionExpression: 'attribute_not_exists(scrapeId) OR scrapeId <> :scrapeId',
        UpdateExpression: 'SET #name = :name, #styles = :styles, #location = :location, #scrapeId = :scrapeId, #updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#name': 'name',
            '#styles': 'styles',
            '#location': 'location',
            '#scrapeId': 'scrapeId',
            '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
            ':name': scrapedData.name,
            ':styles': new Set(scrapedData.styles), // The Document Client automatically handles JS Sets
            ':location': scrapedData.location,
            ':scrapeId': message.scrapeId,
            ':updatedAt': new Date().toISOString()
        }
    });

    try {
        await ddbDocClient.send(command);
        logger.info(`Successfully updated artist`, { artistId: message.artistId, scrapeId: message.scrapeId });
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            // This is not an error, but an expected outcome for a duplicate message.
            logger.warn(`Skipping update for artist, already processed in this scrape run.`, { artistId: message.artistId, scrapeId: message.scrapeId });
        } else {
            // A real error occurred.
            logger.error(`Error updating artist`, { artistId: message.artistId, error: error.toString() });
            throw error; // Re-throw to let SQS handle retry/DLQ logic.
        }
    }
}
