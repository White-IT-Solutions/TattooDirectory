/**
 * Test Data Cleanup Script
 * 
 * Cleans up test data from DynamoDB and OpenSearch
 */

import { ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { createTestDynamoDBClient, createTestOpenSearchClient } from './test-clients.js';
import { testConfig } from '../config/test-config.js';

async function cleanupTestData() {
    console.log('🧹 Cleaning up test data...\n');

    const dynamoClient = createTestDynamoDBClient();
    const openSearchClient = createTestOpenSearchClient();

    try {
        // Clean up DynamoDB test items
        console.log('Cleaning DynamoDB test items...');
        
        const scanCommand = new ScanCommand({
            TableName: testConfig.dynamodb.tableName,
            FilterExpression: 'begins_with(artistId, :prefix)',
            ExpressionAttributeValues: {
                ':prefix': 'test-'
            }
        });

        const scanResult = await dynamoClient.send(scanCommand);
        const testItems = scanResult.Items || [];

        console.log(`Found ${testItems.length} test items in DynamoDB`);

        for (const item of testItems) {
            const deleteCommand = new DeleteCommand({
                TableName: testConfig.dynamodb.tableName,
                Key: {
                    PK: item.PK,
                    SK: item.SK
                }
            });

            await dynamoClient.send(deleteCommand);
            console.log(`  Deleted: ${item.artistId}`);
        }

        // Clean up OpenSearch test documents
        console.log('\nCleaning OpenSearch test documents...');
        
        try {
            const searchResponse = await openSearchClient.search({
                index: testConfig.opensearch.indexName,
                body: {
                    query: {
                        prefix: {
                            artistId: 'test-'
                        }
                    },
                    size: 1000
                }
            });

            const testDocs = searchResponse.body.hits.hits;
            console.log(`Found ${testDocs.length} test documents in OpenSearch`);

            for (const doc of testDocs) {
                await openSearchClient.delete({
                    index: testConfig.opensearch.indexName,
                    id: doc._id,
                    refresh: true
                });
                console.log(`  Deleted: ${doc._source.artistId}`);
            }
        } catch (error) {
            if (error.statusCode === 404) {
                console.log('  OpenSearch index not found (this is normal for fresh environments)');
            } else {
                throw error;
            }
        }

        console.log('\n✅ Test data cleanup completed successfully!');

    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    cleanupTestData().catch(error => {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    });
}