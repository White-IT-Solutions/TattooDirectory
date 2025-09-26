/**
 * DynamoDB Integration Tests
 * 
 * Tests for DynamoDB operations with LocalStack
 */

import { expect } from 'chai';
import { PutCommand, GetCommand, ScanCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createTestDynamoDBClient } from '../setup/test-clients.js';
import TestDataManager from '../setup/test-data-manager.js';
import { testConfig } from '../config/test-config.js';
import { v4 as uuidv4 } from 'uuid';

describe('DynamoDB Integration Tests', function() {
    this.timeout(testConfig.timeouts.database);

    let dynamoClient;
    let dataManager;
    let testItems = [];

    before(async function() {
        this.timeout(testConfig.timeouts.setup);
        
        dynamoClient = createTestDynamoDBClient();
        dataManager = new TestDataManager();
        
        // Wait for DynamoDB to be ready
        await dataManager.waitForServices();
        
        console.log('DynamoDB client initialized and ready');
    });

    after(async function() {
        this.timeout(testConfig.timeouts.cleanup);
        
        // Clean up test items
        for (const item of testItems) {
            try {
                await dynamoClient.send(new DeleteCommand({
                    TableName: testConfig.dynamodb.tableName,
                    Key: { PK: item.PK, SK: item.SK }
                }));
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
        
        console.log('Cleaned up DynamoDB test items');
    });

    describe('Basic Operations', function() {
        it('should successfully put an item', async function() {
            const testItem = {
                PK: `ARTIST#test-${uuidv4()}`,
                SK: 'METADATA',
                artistId: `test-${uuidv4()}`,
                artistName: 'Test Artist',
                instagramHandle: 'testartist',
                geohash: 'gcpvj0',
                locationDisplay: 'London, UK',
                styles: ['traditional', 'realism'],
                portfolioImages: [],
                contactInfo: {
                    instagram: '@testartist',
                    email: 'test@example.com'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const putCommand = new PutCommand({
                TableName: testConfig.dynamodb.tableName,
                Item: testItem
            });

            const result = await dynamoClient.send(putCommand);
            expect(result).to.exist;
            
            testItems.push(testItem);
        });

        it('should successfully get an item by key', async function() {
            // First put an item
            const testItem = {
                PK: `ARTIST#test-${uuidv4()}`,
                SK: 'METADATA',
                artistId: `test-${uuidv4()}`,
                artistName: 'Get Test Artist',
                instagramHandle: 'gettestartist',
                geohash: 'gcpvj1',
                locationDisplay: 'Manchester, UK',
                styles: ['blackwork'],
                createdAt: new Date().toISOString()
            };

            await dynamoClient.send(new PutCommand({
                TableName: testConfig.dynamodb.tableName,
                Item: testItem
            }));

            testItems.push(testItem);

            // Now get the item
            const getCommand = new GetCommand({
                TableName: testConfig.dynamodb.tableName,
                Key: {
                    PK: testItem.PK,
                    SK: testItem.SK
                }
            });

            const result = await dynamoClient.send(getCommand);
            expect(result.Item).to.exist;
            expect(result.Item.artistId).to.equal(testItem.artistId);
            expect(result.Item.artistName).to.equal(testItem.artistName);
            expect(result.Item.styles).to.deep.equal(testItem.styles);
        });

        it('should successfully scan for items', async function() {
            const scanCommand = new ScanCommand({
                TableName: testConfig.dynamodb.tableName,
                FilterExpression: 'begins_with(PK, :pk)',
                ExpressionAttributeValues: {
                    ':pk': 'ARTIST#test-'
                },
                Limit: 10
            });

            const result = await dynamoClient.send(scanCommand);
            expect(result.Items).to.be.an('array');
            expect(result.Items.length).to.be.greaterThan(0);
            
            // Verify all items are test items
            result.Items.forEach(item => {
                expect(item.PK).to.match(/^ARTIST#test-/);
            });
        });

        it('should successfully delete an item', async function() {
            // First put an item
            const testItem = {
                PK: `ARTIST#test-${uuidv4()}`,
                SK: 'METADATA',
                artistId: `test-${uuidv4()}`,
                artistName: 'Delete Test Artist'
            };

            await dynamoClient.send(new PutCommand({
                TableName: testConfig.dynamodb.tableName,
                Item: testItem
            }));

            // Delete the item
            const deleteCommand = new DeleteCommand({
                TableName: testConfig.dynamodb.tableName,
                Key: {
                    PK: testItem.PK,
                    SK: testItem.SK
                }
            });

            await dynamoClient.send(deleteCommand);

            // Verify item is deleted
            const getCommand = new GetCommand({
                TableName: testConfig.dynamodb.tableName,
                Key: {
                    PK: testItem.PK,
                    SK: testItem.SK
                }
            });

            const result = await dynamoClient.send(getCommand);
            expect(result.Item).to.be.undefined;
        });
    });

    describe('Query Operations', function() {
        it('should query items by partition key', async function() {
            const artistId = `test-query-${uuidv4()}`;
            const pk = `ARTIST#${artistId}`;

            // Put multiple items with same PK
            const items = [
                { PK: pk, SK: 'METADATA', artistId, type: 'profile' },
                { PK: pk, SK: 'IMAGE#001', artistId, type: 'image' }
            ];

            for (const item of items) {
                await dynamoClient.send(new PutCommand({
                    TableName: testConfig.dynamodb.tableName,
                    Item: item
                }));
                testItems.push(item);
            }

            // Query by PK
            const queryCommand = new QueryCommand({
                TableName: testConfig.dynamodb.tableName,
                KeyConditionExpression: 'PK = :pk',
                ExpressionAttributeValues: {
                    ':pk': pk
                }
            });

            const result = await dynamoClient.send(queryCommand);
            expect(result.Items).to.be.an('array');
            expect(result.Items.length).to.equal(2);
            
            result.Items.forEach(item => {
                expect(item.PK).to.equal(pk);
                expect(item.artistId).to.equal(artistId);
            });
        });

        it('should query with sort key condition', async function() {
            const artistId = `test-sk-${uuidv4()}`;
            const pk = `ARTIST#${artistId}`;

            // Put item
            const testItem = {
                PK: pk,
                SK: 'METADATA',
                artistId,
                artistName: 'Sort Key Test Artist'
            };

            await dynamoClient.send(new PutCommand({
                TableName: testConfig.dynamodb.tableName,
                Item: testItem
            }));

            testItems.push(testItem);

            // Query with SK condition
            const queryCommand = new QueryCommand({
                TableName: testConfig.dynamodb.tableName,
                KeyConditionExpression: 'PK = :pk AND SK = :sk',
                ExpressionAttributeValues: {
                    ':pk': pk,
                    ':sk': 'METADATA'
                }
            });

            const result = await dynamoClient.send(queryCommand);
            expect(result.Items).to.be.an('array');
            expect(result.Items.length).to.equal(1);
            expect(result.Items[0].artistName).to.equal('Sort Key Test Artist');
        });
    });

    describe('Data Validation', function() {
        it('should handle complex nested objects', async function() {
            const testItem = {
                PK: `ARTIST#test-${uuidv4()}`,
                SK: 'METADATA',
                artistId: `test-${uuidv4()}`,
                artistName: 'Complex Data Artist',
                portfolioImages: [
                    {
                        url: 'https://example.com/image1.jpg',
                        description: 'Traditional rose tattoo',
                        style: 'traditional',
                        tags: ['rose', 'color', 'arm']
                    },
                    {
                        url: 'https://example.com/image2.jpg',
                        description: 'Blackwork geometric design',
                        style: 'blackwork',
                        tags: ['geometric', 'black', 'back']
                    }
                ],
                contactInfo: {
                    instagram: '@complexartist',
                    website: 'https://complexartist.com',
                    email: 'complex@example.com',
                    phone: '+44 20 1234 5678'
                },
                studioInfo: {
                    studioName: 'Complex Studio',
                    address: '123 Complex Street, London, UK',
                    openingHours: {
                        monday: '10:00-18:00',
                        tuesday: '10:00-18:00',
                        wednesday: 'Closed'
                    }
                }
            };

            await dynamoClient.send(new PutCommand({
                TableName: testConfig.dynamodb.tableName,
                Item: testItem
            }));

            testItems.push(testItem);

            // Retrieve and verify
            const result = await dynamoClient.send(new GetCommand({
                TableName: testConfig.dynamodb.tableName,
                Key: { PK: testItem.PK, SK: testItem.SK }
            }));

            expect(result.Item).to.exist;
            expect(result.Item.portfolioImages).to.be.an('array');
            expect(result.Item.portfolioImages.length).to.equal(2);
            expect(result.Item.contactInfo).to.be.an('object');
            expect(result.Item.studioInfo.openingHours.wednesday).to.equal('Closed');
        });

        it('should handle arrays and sets correctly', async function() {
            const testItem = {
                PK: `ARTIST#test-${uuidv4()}`,
                SK: 'METADATA',
                artistId: `test-${uuidv4()}`,
                styles: ['traditional', 'neo-traditional', 'realism'],
                tags: ['experienced', 'award-winning', 'custom-work'],
                ratings: [4.5, 4.8, 5.0, 4.2]
            };

            await dynamoClient.send(new PutCommand({
                TableName: testConfig.dynamodb.tableName,
                Item: testItem
            }));

            testItems.push(testItem);

            const result = await dynamoClient.send(new GetCommand({
                TableName: testConfig.dynamodb.tableName,
                Key: { PK: testItem.PK, SK: testItem.SK }
            }));

            expect(result.Item.styles).to.deep.equal(['traditional', 'neo-traditional', 'realism']);
            expect(result.Item.tags).to.deep.equal(['experienced', 'award-winning', 'custom-work']);
            expect(result.Item.ratings).to.deep.equal([4.5, 4.8, 5.0, 4.2]);
        });
    });

    describe('Error Handling', function() {
        it('should handle non-existent table gracefully', async function() {
            try {
                await dynamoClient.send(new ScanCommand({
                    TableName: 'non-existent-table'
                }));
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.name).to.include('ResourceNotFoundException');
            }
        });

        it('should handle invalid key structure', async function() {
            try {
                await dynamoClient.send(new GetCommand({
                    TableName: testConfig.dynamodb.tableName,
                    Key: {
                        InvalidKey: 'test'
                    }
                }));
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.name).to.include('ValidationException');
            }
        });
    });

    describe('Performance', function() {
        it('should handle batch operations efficiently', async function() {
            const startTime = Date.now();
            const batchSize = 10;
            const promises = [];

            for (let i = 0; i < batchSize; i++) {
                const testItem = {
                    PK: `ARTIST#test-batch-${i}`,
                    SK: 'METADATA',
                    artistId: `test-batch-${i}`,
                    artistName: `Batch Test Artist ${i}`,
                    batchIndex: i
                };

                promises.push(
                    dynamoClient.send(new PutCommand({
                        TableName: testConfig.dynamodb.tableName,
                        Item: testItem
                    }))
                );

                testItems.push(testItem);
            }

            await Promise.all(promises);
            const duration = Date.now() - startTime;

            expect(duration).to.be.below(5000); // Should complete within 5 seconds
            console.log(`Batch operation (${batchSize} items) completed in ${duration}ms`);
        });
    });
});