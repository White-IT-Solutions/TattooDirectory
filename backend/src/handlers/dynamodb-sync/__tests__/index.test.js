/**
 * Unit tests for DynamoDB to OpenSearch synchronization handler
 * Tests sync logic with mock DynamoDB stream events
 * Requirements: 3.3, 3.4, 3.5
 */

import { jest } from '@jest/globals';
import { handler } from '../index.js';

// Mock AWS SDK clients
const mockOpenSearchClient = {
    index: jest.fn(),
    delete: jest.fn(),
    cluster: {
        health: jest.fn()
    },
    indices: {
        stats: jest.fn()
    }
};

const mockCloudWatchClient = {
    send: jest.fn()
};

const mockSecretsManagerClient = {
    send: jest.fn()
};

// Mock the AWS config module
jest.unstable_mockModule('../../common/aws-config.js', () => ({
    createOpenSearchClient: jest.fn(() => mockOpenSearchClient),
    createSecretsManagerClient: jest.fn(() => mockSecretsManagerClient),
    getIndexName: jest.fn(() => 'tattoo-artists-test'),
    config: {
        isLocal: true
    }
}));

// Mock the logger
jest.unstable_mockModule('../../common/logger.js', () => ({
    createLogger: jest.fn(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }))
}));

// Mock CloudWatch client
jest.unstable_mockModule('@aws-sdk/client-cloudwatch', () => ({
    CloudWatchClient: jest.fn(() => mockCloudWatchClient),
    PutMetricDataCommand: jest.fn()
}));

describe('DynamoDB Sync Handler', () => {
    let mockContext;
    
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Setup mock context
        mockContext = {
            functionName: 'test-sync-function',
            functionVersion: '1.0.0',
            awsRequestId: 'test-request-id'
        };
        
        // Setup environment variables
        process.env.OPENSEARCH_ENDPOINT = 'http://localhost:4566';
        process.env.AWS_REGION = 'us-east-1';
        
        // Setup default mock responses
        mockOpenSearchClient.cluster.health.mockResolvedValue({
            body: {
                status: 'green',
                number_of_nodes: 1,
                number_of_data_nodes: 1,
                active_primary_shards: 1,
                active_shards: 1,
                relocating_shards: 0,
                initializing_shards: 0,
                unassigned_shards: 0
            }
        });
        
        mockOpenSearchClient.indices.stats.mockResolvedValue({
            body: {
                _all: {
                    total: {
                        docs: { count: 100 },
                        store: { size_in_bytes: 1024000 }
                    }
                }
            }
        });
        
        mockOpenSearchClient.index.mockResolvedValue({
            body: { result: 'created' }
        });
        
        mockOpenSearchClient.delete.mockResolvedValue({
            body: { result: 'deleted' }
        });
        
        mockCloudWatchClient.send.mockResolvedValue({});
    });
    
    afterEach(() => {
        delete process.env.OPENSEARCH_ENDPOINT;
        delete process.env.AWS_REGION;
    });

    describe('INSERT events', () => {
        test('should process INSERT event for artist record', async () => {
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' },
                            styles: { SS: ['traditional', 'blackwork'] },
                            location: { S: 'London, UK' },
                            locationCity: { S: 'London' },
                            locationCountry: { S: 'UK' },
                            instagramHandle: { S: '@testartist' },
                            studioName: { S: 'Test Studio' },
                            portfolioImages: { SS: ['image1.jpg', 'image2.jpg'] },
                            geohash: { S: 'gcpvj0du6' },
                            latitude: { N: '51.5074' },
                            longitude: { N: '-0.1278' }
                        }
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.index).toHaveBeenCalledWith({
                index: 'tattoo-artists-test',
                id: 'ARTIST#test-artist-123',
                body: expect.objectContaining({
                    id: 'test-artist-123',
                    artistId: 'test-artist-123',
                    name: 'Test Artist',
                    styles: ['traditional', 'blackwork'],
                    location: 'London, UK',
                    locationCity: 'London',
                    locationCountry: 'UK',
                    instagramHandle: '@testartist',
                    studioName: 'Test Studio',
                    portfolioImages: ['image1.jpg', 'image2.jpg'],
                    geohash: 'gcpvj0du6',
                    geoLocation: {
                        lat: 51.5074,
                        lon: -0.1278
                    },
                    pk: 'ARTIST#test-artist-123',
                    sk: 'METADATA'
                }),
                refresh: 'wait_for'
            });
        });

        test('should skip non-artist records', async () => {
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'STUDIO#test-studio-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'STUDIO#test-studio-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Studio' }
                        }
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.index).not.toHaveBeenCalled();
        });

        test('should skip artist records without METADATA sort key', async () => {
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'PORTFOLIO' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'PORTFOLIO' },
                            imageUrl: { S: 'image.jpg' }
                        }
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.index).not.toHaveBeenCalled();
        });
    });

    describe('MODIFY events', () => {
        test('should process MODIFY event for artist record', async () => {
            const event = {
                Records: [{
                    eventName: 'MODIFY',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        OldImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Old Artist Name' },
                            styles: { SS: ['traditional'] }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Updated Artist Name' },
                            styles: { SS: ['traditional', 'blackwork'] },
                            location: { S: 'London, UK' }
                        }
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.index).toHaveBeenCalledWith({
                index: 'tattoo-artists-test',
                id: 'ARTIST#test-artist-123',
                body: expect.objectContaining({
                    name: 'Updated Artist Name',
                    styles: ['traditional', 'blackwork']
                }),
                refresh: 'wait_for'
            });
        });
    });

    describe('REMOVE events', () => {
        test('should process REMOVE event for artist record', async () => {
            const event = {
                Records: [{
                    eventName: 'REMOVE',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        OldImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' }
                        }
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.delete).toHaveBeenCalledWith({
                index: 'tattoo-artists-test',
                id: 'ARTIST#test-artist-123'
            });
        });

        test('should handle document not found during deletion', async () => {
            mockOpenSearchClient.delete.mockRejectedValue({
                meta: { statusCode: 404 },
                message: 'Document not found'
            });

            const event = {
                Records: [{
                    eventName: 'REMOVE',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        OldImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' }
                        }
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.delete).toHaveBeenCalled();
        });
    });

    describe('Error handling', () => {
        test('should retry on OpenSearch failures', async () => {
            // Mock first two calls to fail, third to succeed
            mockOpenSearchClient.index
                .mockRejectedValueOnce(new Error('Connection timeout'))
                .mockRejectedValueOnce(new Error('Service unavailable'))
                .mockResolvedValueOnce({ body: { result: 'created' } });

            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' }
                        }
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.index).toHaveBeenCalledTimes(3);
        });

        test('should throw error after max retries exceeded', async () => {
            mockOpenSearchClient.index.mockRejectedValue(new Error('Persistent failure'));

            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' }
                        }
                    }
                }]
            };

            await expect(handler(event, mockContext)).rejects.toThrow('Failed to process 1 out of 1 records');
            expect(mockOpenSearchClient.index).toHaveBeenCalledTimes(3); // Max retries
        });

        test('should handle missing NewImage for INSERT event', async () => {
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        }
                        // Missing NewImage
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.index).not.toHaveBeenCalled();
        });

        test('should handle missing OldImage for REMOVE event', async () => {
            const event = {
                Records: [{
                    eventName: 'REMOVE',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        }
                        // Missing OldImage
                    }
                }]
            };

            const result = await handler(event, mockContext);

            expect(result.statusCode).toBe(200);
            expect(mockOpenSearchClient.delete).not.toHaveBeenCalled();
        });
    });

    describe('Monitoring and metrics', () => {
        test('should send metrics for successful processing', async () => {
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' }
                        }
                    }
                }]
            };

            await handler(event, mockContext);

            // Verify metrics were sent
            expect(mockCloudWatchClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        Namespace: 'TattooDirectory/DataSync'
                    })
                })
            );
        });

        test('should detect and report high sync lag', async () => {
            const oldTimestamp = (Date.now() - 60000) / 1000; // 1 minute ago
            
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: oldTimestamp,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' }
                        }
                    }
                }]
            };

            await handler(event, mockContext);

            // Should have sent high lag metric
            expect(mockCloudWatchClient.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    input: expect.objectContaining({
                        MetricData: expect.arrayContaining([
                            expect.objectContaining({
                                MetricName: 'HighSyncLag'
                            })
                        ])
                    })
                })
            );
        });
    });

    describe('Data transformation', () => {
        test('should transform DynamoDB item to OpenSearch document correctly', async () => {
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Test Artist' },
                            styles: { SS: ['traditional', 'blackwork'] },
                            location: { S: 'London, UK' },
                            locationCity: { S: 'London' },
                            locationCountry: { S: 'UK' },
                            instagramHandle: { S: '@testartist' },
                            studioName: { S: 'Test Studio' },
                            portfolioImages: { SS: ['image1.jpg', 'image2.jpg'] },
                            geohash: { S: 'gcpvj0du6' },
                            latitude: { N: '51.5074' },
                            longitude: { N: '-0.1278' }
                        }
                    }
                }]
            };

            await handler(event, mockContext);

            const indexCall = mockOpenSearchClient.index.mock.calls[0][0];
            const document = indexCall.body;

            expect(document).toEqual(expect.objectContaining({
                id: 'test-artist-123',
                artistId: 'test-artist-123',
                name: 'Test Artist',
                styles: ['traditional', 'blackwork'],
                location: 'London, UK',
                locationCity: 'London',
                locationCountry: 'UK',
                instagramHandle: '@testartist',
                studioName: 'Test Studio',
                portfolioImages: ['image1.jpg', 'image2.jpg'],
                geohash: 'gcpvj0du6',
                geoLocation: {
                    lat: 51.5074,
                    lon: -0.1278
                },
                searchKeywords: 'test artist test studio traditional blackwork london',
                pk: 'ARTIST#test-artist-123',
                sk: 'METADATA'
            }));

            expect(document.lastUpdated).toBeDefined();
            expect(new Date(document.lastUpdated)).toBeInstanceOf(Date);
        });

        test('should handle missing optional fields gracefully', async () => {
            const event = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        ApproximateCreationDateTime: Date.now() / 1000,
                        Keys: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#test-artist-123' },
                            SK: { S: 'METADATA' },
                            name: { S: 'Minimal Artist' }
                            // Missing most optional fields
                        }
                    }
                }]
            };

            await handler(event, mockContext);

            const indexCall = mockOpenSearchClient.index.mock.calls[0][0];
            const document = indexCall.body;

            expect(document).toEqual(expect.objectContaining({
                id: 'test-artist-123',
                artistId: 'test-artist-123',
                name: 'Minimal Artist',
                styles: [],
                location: '',
                locationCity: '',
                locationCountry: 'UK',
                instagramHandle: '',
                studioName: '',
                portfolioImages: [],
                geohash: '',
                geoLocation: null,
                searchKeywords: 'minimal artist',
                pk: 'ARTIST#test-artist-123',
                sk: 'METADATA'
            }));
        });
    });
});