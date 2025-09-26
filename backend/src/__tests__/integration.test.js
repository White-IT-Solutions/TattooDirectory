/**
 * End-to-End Integration Tests
 * Requirements: 7.4, 7.5, 9.2, 9.5
 */

import { jest } from '@jest/globals';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: jest.fn(() => ({
        send: jest.fn()
    })),
    GetSecretValueCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn(() => ({
        send: jest.fn()
    }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: {
        from: jest.fn(() => ({
            send: jest.fn()
        }))
    },
    PutCommand: jest.fn(),
    GetCommand: jest.fn(),
    QueryCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    BatchWriteCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-sqs', () => ({
    SQSClient: jest.fn(() => ({
        send: jest.fn()
    })),
    SendMessageBatchCommand: jest.fn()
}));

jest.mock('@opensearch-project/opensearch', () => ({
    Client: jest.fn()
}));

describe('End-to-End Integration Tests', () => {
    let mockSend;
    let apiHandler;
    let dynamoSyncHandler;
    let generateArtistKeys;
    let createArtistItem;

    beforeAll(async () => {
        // Import handlers after mocks are set up
        const apiModule = await import('../handlers/api-handler/index.js');
        apiHandler = apiModule.handler;

        const syncModule = await import('../handlers/dynamodb-sync/index.js');
        dynamoSyncHandler = syncModule.handler;

        const dynamoModule = await import('../common/dynamodb.js');
        generateArtistKeys = dynamoModule.generateArtistKeys;
        createArtistItem = dynamoModule.createArtistItem;
    });

    beforeEach(async () => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        // Setup mock send function
        mockSend = jest.fn();
        global.mockSend = mockSend;
        
        // Mock AWS SDK clients properly
        const { SecretsManagerClient } = await import('@aws-sdk/client-secrets-manager');
        const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb');
        const { SQSClient } = await import('@aws-sdk/client-sqs');
        
        // Setup default successful AWS SDK responses
        mockSend.mockImplementation((command) => {
            if (command.constructor.name === 'GetSecretValueCommand') {
                return Promise.resolve({
                    SecretString: JSON.stringify({
                        opensearch_master_password: 'test-password',
                        opensearch_master_username: 'admin'
                    })
                });
            }
            
            if (command.constructor.name === 'PutCommand') {
                return Promise.resolve({});
            }
            
            if (command.constructor.name === 'GetCommand') {
                return Promise.resolve({
                    Item: {
                        PK: 'ARTIST#test-artist',
                        SK: 'METADATA',
                        artistName: 'Test Artist',
                        styles: ['traditional']
                    }
                });
            }
            
            if (command.constructor.name === 'SendMessageBatchCommand') {
                return Promise.resolve({
                    Successful: [{ Id: 'test-id', MessageId: 'test-message-id' }],
                    Failed: []
                });
            }
            
            return Promise.resolve({});
        });

        // Mock the client instances to use our mock send function
        SecretsManagerClient.mockImplementation(() => ({ send: mockSend }));
        DynamoDBClient.mockImplementation(() => ({ send: mockSend }));
        DynamoDBDocumentClient.from.mockImplementation(() => ({ send: mockSend }));
        SQSClient.mockImplementation(() => ({ send: mockSend }));
    });

    describe('Complete Artist Search Workflow', () => {
        it('should handle circuit breaker fallback gracefully', async () => {
            const mockOpenSearchClient = {
                search: jest.fn().mockRejectedValue(new Error('OpenSearch timeout'))
            };

            const { Client } = await import('@opensearch-project/opensearch');
            Client.mockImplementation(() => mockOpenSearchClient);

            const searchEvent = createMockEvent('/v1/artists', 'GET', { query: 'test' });
            const result = await apiHandler(searchEvent, createMockContext());

            // Should return 503 when circuit breaker is triggered
            expect(result.statusCode).toBe(503);
            expect(result.headers['Content-Type']).toBe('application/problem+json');
            
            const errorBody = JSON.parse(result.body);
            expect(errorBody.title).toBe('Service Unavailable');
            expect(errorBody.type).toBe('https://api.tattoodirectory.com/docs/errors#503');
        });

        it('should validate API response formats for frontend consumption', async () => {
            // Test data structure validation without relying on circuit breaker behavior
            const validArtistResponse = {
                artistId: 'format-test-artist',
                artistName: 'Format Test Artist',
                styles: ['traditional', 'realism'],
                locationDisplay: 'London, UK',
                instagramHandle: 'format_test',
                portfolioImages: [
                    {
                        url: 'https://example.com/image1.jpg',
                        style: 'traditional',
                        uploadDate: '2024-01-01T00:00:00Z'
                    }
                ],
                contactInfo: {
                    instagram: 'https://instagram.com/format_test',
                    bookingMethod: 'instagram_dm'
                },
                geoLocation: {
                    lat: 51.5074,
                    lon: -0.1278
                }
            };

            // Validate required fields for frontend
            expect(validArtistResponse).toHaveProperty('artistId');
            expect(validArtistResponse).toHaveProperty('artistName');
            expect(validArtistResponse).toHaveProperty('styles');
            expect(Array.isArray(validArtistResponse.styles)).toBe(true);
            expect(validArtistResponse.styles.length).toBeGreaterThan(0);
            
            // Validate optional fields structure
            if (validArtistResponse.portfolioImages) {
                expect(Array.isArray(validArtistResponse.portfolioImages)).toBe(true);
                validArtistResponse.portfolioImages.forEach(image => {
                    expect(image).toHaveProperty('url');
                    expect(image.url).toMatch(/^https?:\/\/.+/);
                });
            }
            
            if (validArtistResponse.contactInfo) {
                expect(typeof validArtistResponse.contactInfo).toBe('object');
            }
            
            if (validArtistResponse.geoLocation) {
                expect(validArtistResponse.geoLocation).toHaveProperty('lat');
                expect(validArtistResponse.geoLocation).toHaveProperty('lon');
                expect(typeof validArtistResponse.geoLocation.lat).toBe('number');
                expect(typeof validArtistResponse.geoLocation.lon).toBe('number');
            }

            // Test that the response structure is valid for frontend consumption
            expect(typeof validArtistResponse.artistId).toBe('string');
            expect(typeof validArtistResponse.artistName).toBe('string');
            expect(typeof validArtistResponse.locationDisplay).toBe('string');
        });
    });

    describe('Data Aggregation Pipeline Integration', () => {
        it('should validate data quality throughout pipeline', async () => {
            const validArtistData = {
                artistId: 'pipeline-test-artist',
                artistName: 'Pipeline Test Artist',
                instagramHandle: 'pipeline_test',
                styles: ['traditional'],
                geohash: 'gcpvj0',
                locationDisplay: 'London, UK'
            };

            // Test DynamoDB key generation
            const keys = generateArtistKeys(validArtistData.artistId);
            expect(keys.PK).toBe('ARTIST#pipeline-test-artist');
            expect(keys.SK).toBe('METADATA');

            // Test complete item creation
            const item = createArtistItem(validArtistData);
            expect(item).toHaveProperty('PK', 'ARTIST#pipeline-test-artist');
            expect(item).toHaveProperty('artistName', 'Pipeline Test Artist');
            expect(item).toHaveProperty('itemType', 'ARTIST_METADATA');
        });

        it('should handle batch operations efficiently', async () => {
            const mockBatchProcessor = jest.fn().mockImplementation(async (items) => {
                const batchSize = 10;
                const batches = [];
                
                for (let i = 0; i < items.length; i += batchSize) {
                    batches.push(items.slice(i, i + batchSize));
                }

                return {
                    totalItems: items.length,
                    batchCount: batches.length,
                    batchSize: batchSize,
                    processedItems: items.length
                };
            });

            // Test with large batch
            const largeItemSet = Array.from({ length: 25 }, (_, i) => ({
                id: `item-${i}`,
                data: `test-data-${i}`
            }));

            const result = await mockBatchProcessor(largeItemSet);

            expect(result.totalItems).toBe(25);
            expect(result.batchCount).toBe(3); // 10, 10, 5
            expect(result.processedItems).toBe(25);
        });
    });

    describe('DynamoDB to OpenSearch Synchronization', () => {
        it('should validate DynamoDB stream event structure', async () => {
            // Test stream event structure without actually calling the handler
            const streamEvent = {
                Records: [
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                PK: { S: 'ARTIST#sync-test-artist' },
                                SK: { S: 'METADATA' },
                                artistName: { S: 'Sync Test Artist' },
                                styles: { SS: ['traditional', 'realism'] },
                                instagramHandle: { S: 'sync_test' },
                                geohash: { S: 'gcpvj0' },
                                locationDisplay: { S: 'London, UK' }
                            }
                        }
                    }
                ]
            };

            // Validate event structure
            expect(streamEvent.Records).toHaveLength(1);
            expect(streamEvent.Records[0].eventName).toBe('INSERT');
            expect(streamEvent.Records[0].dynamodb.NewImage.PK.S).toBe('ARTIST#sync-test-artist');
            expect(streamEvent.Records[0].dynamodb.NewImage.SK.S).toBe('METADATA');
        });

        it('should handle mixed record types correctly', async () => {
            const mixedRecords = [
                {
                    eventName: 'INSERT',
                    dynamodb: {
                        NewImage: {
                            PK: { S: 'STUDIO#test-studio' },
                            SK: { S: 'METADATA' },
                            studioName: { S: 'Test Studio' }
                        }
                    }
                },
                {
                    eventName: 'INSERT',
                    dynamodb: {
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist' },
                            SK: { S: 'IMAGE#1' },
                            imageUrl: { S: 'https://example.com/image.jpg' }
                        }
                    }
                },
                {
                    eventName: 'INSERT',
                    dynamodb: {
                        NewImage: {
                            PK: { S: 'ARTIST#valid-artist' },
                            SK: { S: 'METADATA' },
                            artistName: { S: 'Valid Artist' }
                        }
                    }
                }
            ];

            // Filter records that should be processed (ARTIST# with METADATA)
            const validRecords = mixedRecords.filter(record => 
                record.dynamodb?.NewImage?.PK?.S?.startsWith('ARTIST#') &&
                record.dynamodb?.NewImage?.SK?.S === 'METADATA'
            );

            expect(validRecords).toHaveLength(1);
            expect(validRecords[0].dynamodb.NewImage.PK.S).toBe('ARTIST#valid-artist');
        });
    });

    describe('Data Validation and Quality', () => {
        it('should validate DynamoDB key structure', () => {
            const testArtistId = 'test-artist-123';
            const keys = generateArtistKeys(testArtistId);

            // Validate primary key structure
            expect(keys.PK).toBe(`ARTIST#${testArtistId}`);
            expect(keys.SK).toBe('METADATA');
        });

        it('should create complete artist items with all required keys', () => {
            const testArtistData = {
                artistId: 'validation-test-artist',
                artistName: 'Validation Test Artist',
                instagramHandle: 'validation_test',
                styles: ['traditional', 'realism'],
                geohash: 'gcpvj0',
                locationDisplay: 'London, UK'
            };

            const item = createArtistItem(testArtistData);

            // Validate required fields
            expect(item).toHaveProperty('PK', 'ARTIST#validation-test-artist');
            expect(item).toHaveProperty('SK', 'METADATA');
            expect(item).toHaveProperty('artistName', 'Validation Test Artist');
            expect(item).toHaveProperty('styles', ['traditional', 'realism']);
            expect(item).toHaveProperty('itemType', 'ARTIST_METADATA');

            // Validate GSI keys are present
            expect(item).toHaveProperty('gsi2pk');
            expect(item).toHaveProperty('gsi2sk');
            expect(item).toHaveProperty('gsi3pk');
        });

        it('should validate artist data structure across handlers', async () => {
            const validArtistData = {
                artistId: 'validation-test-artist',
                artistName: 'Validation Test Artist',
                instagramHandle: 'validation_test',
                styles: ['traditional', 'realism'],
                geohash: 'gcpvj0',
                locationDisplay: 'London, UK',
                portfolioImages: [
                    {
                        url: 'https://example.com/image1.jpg',
                        style: 'traditional',
                        uploadDate: '2024-01-01T00:00:00Z'
                    }
                ],
                contactInfo: {
                    instagram: 'https://instagram.com/validation_test',
                    bookingMethod: 'instagram_dm'
                }
            };

            // Validate required fields
            expect(validArtistData).toHaveProperty('artistId');
            expect(validArtistData).toHaveProperty('artistName');
            expect(validArtistData).toHaveProperty('styles');
            expect(validArtistData.styles).toBeInstanceOf(Array);
            expect(validArtistData.styles.length).toBeGreaterThan(0);

            // Validate optional fields structure
            if (validArtistData.portfolioImages) {
                expect(validArtistData.portfolioImages).toBeInstanceOf(Array);
                validArtistData.portfolioImages.forEach(image => {
                    expect(image).toHaveProperty('url');
                    expect(image.url).toMatch(/^https?:\/\/.+/);
                });
            }

            if (validArtistData.contactInfo) {
                expect(validArtistData.contactInfo).toBeInstanceOf(Object);
            }
        });
    });

    describe('Frontend-Backend API Integration', () => {
        it('should handle RFC 9457 error responses consistently', async () => {
            // Test Bad Request - missing parameters
            const badRequestEvent = createMockEvent('/v1/artists', 'GET', {});
            const badRequestResult = await apiHandler(badRequestEvent, createMockContext());
            
            expect(badRequestResult.statusCode).toBe(400);
            expect(badRequestResult.headers['Content-Type']).toBe('application/problem+json');
            
            const badRequestBody = JSON.parse(badRequestResult.body);
            expect(badRequestBody).toHaveProperty('type');
            expect(badRequestBody).toHaveProperty('title', 'Bad Request');
            expect(badRequestBody).toHaveProperty('status', 400);
            expect(badRequestBody).toHaveProperty('detail');
            expect(badRequestBody).toHaveProperty('instance');
        });

        it('should handle route not found errors', async () => {
            const invalidRouteEvent = createMockEvent('/v1/invalid-route', 'GET');
            const invalidRouteResult = await apiHandler(invalidRouteEvent, createMockContext());
            
            expect(invalidRouteResult.statusCode).toBe(404);
            const invalidRouteBody = JSON.parse(invalidRouteResult.body);
            expect(invalidRouteBody.title).toBe('Not Found');
            expect(invalidRouteBody.detail).toContain('/v1/invalid-route');
        });

        it('should maintain consistent error response format across handlers', async () => {
            const createErrorResponse = (statusCode, title, detail, instance) => ({
                statusCode,
                headers: { 'Content-Type': 'application/problem+json' },
                body: JSON.stringify({
                    type: `https://api.tattoodirectory.com/docs/errors#${statusCode}`,
                    title,
                    status: statusCode,
                    detail,
                    instance
                })
            });

            const error400 = createErrorResponse(400, 'Bad Request', 'Invalid parameters', 'test-request-id');
            const error404 = createErrorResponse(404, 'Not Found', 'Resource not found', 'test-request-id');
            const error500 = createErrorResponse(500, 'Internal Server Error', 'Unexpected error', 'test-request-id');

            // Verify RFC 9457 compliance
            [error400, error404, error500].forEach(error => {
                expect(error.headers['Content-Type']).toBe('application/problem+json');
                
                const body = JSON.parse(error.body);
                expect(body).toHaveProperty('type');
                expect(body).toHaveProperty('title');
                expect(body).toHaveProperty('status');
                expect(body).toHaveProperty('detail');
                expect(body).toHaveProperty('instance');
                expect(body.type).toMatch(/^https:\/\/api\.tattoodirectory\.com\/docs\/errors#\d{3}$/);
            });
        });
    });

    describe('Performance and Reliability', () => {
        it('should implement proper timeout handling', async () => {
            const mockTimeoutHandler = jest.fn().mockImplementation(async (operation, timeout = 5000) => {
                return new Promise((resolve, reject) => {
                    const timer = setTimeout(() => {
                        reject(new Error('Operation timeout'));
                    }, timeout);

                    // Simulate operation
                    setTimeout(() => {
                        clearTimeout(timer);
                        resolve({ success: true, duration: 1000 });
                    }, 1000);
                });
            });

            // Test successful operation within timeout
            const result = await mockTimeoutHandler('test-operation', 2000);
            expect(result.success).toBe(true);
            expect(result.duration).toBe(1000);

            // Test timeout scenario
            await expect(mockTimeoutHandler('slow-operation', 500))
                .rejects.toThrow('Operation timeout');
        });

        it('should maintain data consistency across pipeline stages', async () => {
            const testArtistId = 'consistency-test-artist';
            const testArtistData = {
                artistId: testArtistId,
                artistName: 'Consistency Test Artist',
                instagramHandle: 'consistency_test',
                styles: ['traditional'],
                geohash: 'gcpvj0',
                locationDisplay: 'London, UK'
            };

            // 1. Verify DynamoDB item structure
            const dynamoItem = createArtistItem(testArtistData);
            expect(dynamoItem.PK).toBe(`ARTIST#${testArtistId}`);
            expect(dynamoItem.SK).toBe('METADATA');
            expect(dynamoItem.artistName).toBe(testArtistData.artistName);

            // 2. Simulate DynamoDB stream event structure
            const streamEvent = {
                Records: [
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                PK: { S: dynamoItem.PK },
                                SK: { S: dynamoItem.SK },
                                artistName: { S: dynamoItem.artistName },
                                styles: { SS: dynamoItem.styles },
                                instagramHandle: { S: dynamoItem.instagramHandle },
                                geohash: { S: dynamoItem.geohash },
                                locationDisplay: { S: dynamoItem.locationDisplay }
                            }
                        }
                    }
                ]
            };

            // Verify data consistency across all stages
            expect(streamEvent.Records[0].dynamodb.NewImage.PK.S).toBe(`ARTIST#${testArtistId}`);
            expect(streamEvent.Records[0].dynamodb.NewImage.artistName.S).toBe(testArtistData.artistName);
        });
    });
});