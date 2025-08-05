const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function processArtist(message) {
    // message is the parsed SQS message body, e.g.:
    // { artistId: '...', portfolioUrl: '...', scrapeId: '...' }

    // scrapedData is the result of your scraping logic
    const scrapedData = { name: 'Artist Name', styles: ['illustrative', 'neo-traditional'], location: 'London, UK' };

    const params = {
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
            ':styles': dynamoDb.createSet(scrapedData.styles), // Use createSet for String Sets
            ':location': scrapedData.location,
            ':scrapeId': message.scrapeId,
            ':updatedAt': new Date().toISOString()
        }
    };

    try {
        await dynamoDb.update(params).promise();
        console.log(`Successfully updated artist ${message.artistId} for scrape ${message.scrapeId}`);
    } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
            // This is not an error, but an expected outcome for a duplicate message.
            console.log(`Skipping update for artist ${message.artistId}, already processed in scrape ${message.scrapeId}.`);
        } else {
            // A real error occurred.
            console.error(`Error updating artist ${message.artistId}:`, error);
            throw error; // Re-throw to let SQS handle retry/DLQ logic.
        }
    }
}
