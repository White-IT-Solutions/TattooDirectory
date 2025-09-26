const AWS = require('aws-sdk');

// Configure AWS SDK for LocalStack
AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION || 'eu-west-2',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localstack:4566',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  s3ForcePathStyle: true
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbClient = new AWS.DynamoDB();
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'tattoo-directory-local';

async function testConnection() {
  console.log('Testing connection to LocalStack...');
  console.log('Endpoint:', process.env.AWS_ENDPOINT_URL || 'http://localstack:4566');
  console.log('Table:', TABLE_NAME);
  
  try {
    const result = await dynamodbClient.describeTable({ TableName: TABLE_NAME }).promise();
    console.log('✅ Successfully connected to DynamoDB');
    console.log('Table status:', result.Table.TableStatus);
    console.log('Item count:', result.Table.ItemCount);
    
    // Test a simple scan to see if we can read data
    const scanResult = await dynamodb.scan({ 
      TableName: TABLE_NAME,
      Limit: 1
    }).promise();
    console.log('✅ Successfully scanned table');
    console.log('Items found:', scanResult.Count);
  } catch (error) {
    console.error('❌ Failed to connect to DynamoDB:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

testConnection();