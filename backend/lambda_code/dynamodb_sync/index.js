const { Client } = require('@opensearch-project/opensearch');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const logger = require('./logger');

let openSearchPassword;

exports.handler = async (event) => {
    logger.info('DynamoDB Stream Event received', { recordCount: event.Records.length });

    if (!openSearchPassword) {
        try {
            const secretsManagerClient = new SecretsManagerClient({});
            const secretValue = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN }));
            openSearchPassword = JSON.parse(secretValue.SecretString).opensearch_master_password;
            logger.info('Successfully retrieved OpenSearch password from Secrets Manager');
        } catch (error) {
            logger.error('Failed to retrieve secret from Secrets Manager', { error: error.toString() });
            throw error; // Fail fast if we can't get credentials
        }
    }

    const client = new Client({
        node: 'https://' + process.env.OPENSEARCH_ENDPOINT,
        auth: {
            username: 'admin',
            password: openSearchPassword
        }
    });
    
    for (const record of event.Records) {
        try {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;
                // Log the event but scrub the PII
                logger.info('Processing INSERT/MODIFY event', { eventName: record.eventName, keys: record.dynamodb.Keys });
                
                if (newImage && newImage.PK && newImage.PK.S.startsWith('ARTIST#')) {
                    // Transform DynamoDB item to OpenSearch document
                    const document = {
                        id: newImage.PK.S,
                        name: newImage.name?.S || '',
                        styles: newImage.styles?.SS || [],
                        location: newImage.location?.S || '',
                        // Add more fields as needed
                    };
                    
                    await client.index({
                        index: process.env.OPENSEARCH_INDEX,
                        id: newImage.PK.S,
                        body: document
                    });
                    
                    logger.info('Indexed document in OpenSearch', { documentId: newImage.PK.S });
                }
            } else if (record.eventName === 'REMOVE') {
                const oldImage = record.dynamodb.OldImage;
                logger.info('Processing REMOVE event', { eventName: record.eventName, keys: record.dynamodb.Keys });

                if (oldImage && oldImage.PK && oldImage.PK.S.startsWith('ARTIST#')) {
                    await client.delete({
                        index: process.env.OPENSEARCH_INDEX,
                        id: oldImage.PK.S
                    });
                    
                    logger.info('Deleted document from OpenSearch', { documentId: oldImage.PK.S });
                }
            }
        } catch (error) {
            // Log the scrubbed record on error for debugging
            logger.error('Error processing DynamoDB stream record', { error: error.toString(), record });
        }
    }
    
    return { statusCode: 200, body: 'Success' };
};