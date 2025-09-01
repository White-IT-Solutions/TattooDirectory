const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const logger = require('../common/logger');

const ddbClient = new DynamoDBClient({});

exports.handler = async (event) => {
  logger.info('Idempotency handler invoked', { path: event.rawPath, method: event.requestContext.http.method });

  // --- Idempotency Check for POST requests ---
  if (event.requestContext.http.method === 'POST') {
    const idempotencyKey = event.headers['idempotency-key'];

    if (!idempotencyKey) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Idempotency-Key header is required for this operation.' })
      };
    }

    const fiveMinutesInSeconds = 300;
    const expiry = Math.floor(Date.now() / 1000) + fiveMinutesInSeconds;

    const command = new PutItemCommand({
      TableName: process.env.IDEMPOTENCY_TABLE,
      Item: marshall({
        id: idempotencyKey,
        expiry: expiry
      }),
      ConditionExpression: 'attribute_not_exists(id)'
    });

    try {
      await ddbClient.send(command);
      // If we get here, the key was new. Proceed with the actual logic.
      logger.info(`Idempotency key successfully recorded.`, { idempotencyKey });
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        logger.warn(`Duplicate request detected with idempotency key.`, { idempotencyKey });
        // This is a duplicate request, so we return a success response without re-processing.
        // Note: Some APIs may prefer a 409 Conflict status code here.
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Request already processed.' })
        };
      }
      // Some other DynamoDB error occurred
      logger.error('DynamoDB error during idempotency check', { error: error.toString(), idempotencyKey });
      return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error.' }) };
    }
  }
  // --- End of Idempotency Check ---

  // Placeholder for actual business logic
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Request processed successfully.' })
  };
};