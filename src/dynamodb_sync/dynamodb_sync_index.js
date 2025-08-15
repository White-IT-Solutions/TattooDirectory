const { Client } = require('@opensearch-project/opensearch');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const secretsManager = new SecretsManagerClient({});
let openSearchPassword;

const getSecret = async () => {
    if (openSearchPassword) return openSearchPassword;
    const command = new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN });
    const response = await secretsManager.send(command);
    const secret = JSON.parse(response.SecretString);
    openSearchPassword = secret.opensearch_master_password;
    return openSearchPassword;
};

exports.handler = async (event) => {
    console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));
    
    const password = await getSecret();
    const client = new Client({
        node: 'https://' + process.env.OPENSEARCH_ENDPOINT,
        auth: {
            username: 'admin',
            password: password
        }
    });
    
    for (const record of event.Records) {
        try {
            if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
                const newImage = record.dynamodb.NewImage;
                if (newImage && newImage.PK && newImage.PK.S.startsWith('ARTIST#')) {
                    const document = {
                        id: newImage.PK.S,
                        name: newImage.name?.S || '',
                        styles: newImage.styles?.SS || [],
                        location: newImage.location?.S || '',
                    };
                    
                    await client.index({
                        index: process.env.OPENSEARCH_INDEX,
                        id: newImage.PK.S,
                        body: document
                    });
                    
                    console.log('Indexed document: ' + newImage.PK.S);
                }
            } else if (record.eventName === 'REMOVE') {
                const oldImage = record.dynamodb.OldImage;
                if (oldImage && oldImage.PK && oldImage.PK.S.startsWith('ARTIST#')) {
                    await client.delete({
                        index: process.env.OPENSEARCH_INDEX,
                        id: oldImage.PK.S
                    });
                    
                    console.log('Deleted document: ' + oldImage.PK.S);
                }
            }
        } catch (error) {
            console.error('Error processing record:', error);
        }
    }
    
    return { statusCode: 200, body: 'Success' };
};