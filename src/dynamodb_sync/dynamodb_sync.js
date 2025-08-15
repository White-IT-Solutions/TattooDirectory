const { Client } = require('@opensearch-project/opensearch');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const logger = require('../common/logger'); // Use the common logger

let osClient;
const secretsManagerClient = new SecretsManagerClient({});

async function getOpenSearchClient() {
    if (osClient) return osClient;

    try {
        const secretValue = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN }));
        const secrets = JSON.parse(secretValue.SecretString);
        logger.info('Successfully retrieved OpenSearch credentials from Secrets Manager');

        osClient = new Client({
            node: 'https://' + process.env.OPENSEARCH_ENDPOINT,
            auth: {
                username: secrets.opensearch_master_username || 'admin',
                password: secrets.opensearch_master_password
            }
        });
        return osClient;
    } catch (error) {
        logger.error('Failed to initialize OpenSearch client', { error: error.toString() });
        throw error; // Fail fast if we can't get credentials
    }
}

exports.handler = async (event) => {
    logger.info('DynamoDB Stream Event received', { recordCount: event.Records.length });

    const client = await getOpenSearchClient();
    
    for (const record of event.Records) {
        try {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = unmarshall(record.dynamodb.NewImage);
                // Log the event but scrub the PII
                logger.info('Processing INSERT/MODIFY event', { eventName: record.eventName, keys: record.dynamodb.Keys });
                
                if (newImage?.PK?.startsWith('ARTIST#')) {
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
                        id: newImage.PK,
                        body: document
                    });
                    
                    logger.info('Indexed document in OpenSearch', { documentId: newImage.PK });
                }
            } else if (record.eventName === 'REMOVE') {
                const oldImage = unmarshall(record.dynamodb.OldImage);
                logger.info('Processing REMOVE event', { eventName: record.eventName, keys: record.dynamodb.Keys });

                if (oldImage?.PK?.startsWith('ARTIST#')) {
                    await client.delete({
                        index: process.env.OPENSEARCH_INDEX,
                        id: oldImage.PK
                    });
                    
                    logger.info('Deleted document from OpenSearch', { documentId: oldImage.PK });
                }
            }
        } catch (error) {
            // Log key details for debugging. The logger will scrub the record object.
            logger.error('Error processing DynamoDB stream record', { error: error.toString(), recordKey: record.dynamodb.Keys, eventName: record.eventName });
        }
    }
    
    return { statusCode: 200, body: 'Success' };
};