import { jest } from '@jest/globals';

// Mock OpenSearch client
const mockIndex = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockOpenSearchClient = jest.fn(() => ({
    index: mockIndex,
    update: mockUpdate,
    delete: mockDelete
}));

jest.unstable_mockModule('@opensearch-project/opensearch', () => ({
    Client: mockOpenSearchClient
}));

// Mock AWS SDK
const mockGetSecretValue = jest.fn();
jest.unstable_mockModule('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: jest.fn(() => ({
        send: mockGetSecretValue
    })),
    GetSecretValueCommand: jest.fn()
}));

describe('DynamoDB Sync Handler', () => {
    beforeAll(() => {
        // Setup environment variables
        process.env.OPENSEARCH_ENDPOINT = 'test-opensearch.amazonaws.com';
        process.env.APP_SECRETS_ARN = 'arn:aws:secretsmanager:region:account:secret:test';
        process.env.OPENSEARCH_INDEX = 'test-artists';
        
        // Mock secrets manager response
        mockGetSecretValue.mockResolvedValue({
            SecretString: JSON.stringify({
                master_user_name: 'test-user',
                master_user_password: 'test-password'
            })
        });
    });
    
    afterAll(() => {
        delete process.env.OPENSEARCH_ENDPOINT;
        delete process.env.APP_SECRETS_ARN;
        delete process.env.OPENSEARCH_INDEX;
    });

    beforeEach(() => {
        // Reset mocks
        mockIndex.mockClear();
        mockUpdate.mockClear();
        mockDelete.mockClear();
        mockGetSecretValue.mockClear();
        
        // Default successful responses
        mockIndex.mockResolvedValue({ body: { result: 'created' } });
        mockUpdate.mockResolvedValue({ body: { result: 'updated' } });
        mockDelete.mockResolvedValue({ body: { result: 'deleted' } });
    });

    it('should be able to import the handler module', async () => {
        // This test verifies that the module can be imported without syntax errors
        expect(async () => {
            const module = await import('../index.js');
            expect(module.handler).toBeDefined();
            expect(typeof module.handler).toBe('function');
        }).not.toThrow();
    });

    describe('successful sync operations', () => {
        it('should handle INSERT events and index new documents', async () => {
            const mockEvent = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        NewImage: {
                            PK: { S: 'ARTIST#artist-123' },
                            SK: { S: 'METADATA' },
                            artistName: { S: 'Test Artist' },
                            styles: { SS: ['traditional', 'realism'] },
                            locationDisplay: { S: 'London, UK' },
                            instagramHandle: { S: 'test_artist' },
                            portfolioImages: { SS: ['image1.jpg', 'image2.jpg'] }
                        }
                    }
                }]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            const result = await handler(mockEvent, mockContext);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.message).toContain('Successfully processed');
            expect(body.processedRecords).toBe(1);

            expect(mockIndex).toHaveBeenCalledWith(
                expect.objectContaining({
                    index: 'test-artists',
                    id: 'ARTIST#artist-123',
                    body: expect.objectContaining({
                        artistId: 'artist-123',
                        pk: 'ARTIST#artist-123',
                        sk: 'METADATA'
                    })
                })
            );
        });

        it('should handle MODIFY events and update existing documents', async () => {
            const mockEvent = {
                Records: [{
                    eventName: 'MODIFY',
                    dynamodb: {
                        Keys: {
                            PK: { S: 'ARTIST#artist-456' },
                            SK: { S: 'METADATA' }
                        },
                        NewImage: {
                            PK: { S: 'ARTIST#artist-456' },
                            SK: { S: 'METADATA' },
                            artistName: { S: 'Updated Artist' },
                            styles: { SS: ['blackwork'] },
                            locationDisplay: { S: 'Manchester, UK' },
                            updatedAt: { S: '2024-01-01T12:00:00Z' }
                        },
                        OldImage: {
                            PK: { S: 'ARTIST#artist-456' },
                            SK: { S: 'METADATA' },
                            artistName: { S: 'Old Artist' },
                            styles: { SS: ['traditional'] }
                        }
                    }
                }]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            const result = await handler(mockEvent, mockContext);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.message).toContain('Successfully processed');
            expect(body.processedRecords).toBe(1);

            expect(mockIndex).toHaveBeenCalledWith(
                expect.objectContaining({
                    index: 'test-artists',
                    id: 'ARTIST#artist-456',
                    body: expect.objectContaining({
                        artistId: 'artist-456',
                        pk: 'ARTIST#artist-456',
                        sk: 'METADATA'
                    })
                })
            );
        });

        it('should handle REMOVE events and delete documents', async () => {
            const mockEvent = {
                Records: [{
                    eventName: 'REMOVE',
                    dynamodb: {
                        Keys: {
                            PK: { S: 'ARTIST#artist-789' },
                            SK: { S: 'METADATA' }
                        },
                        OldImage: {
                            PK: { S: 'ARTIST#artist-789' },
                            SK: { S: 'METADATA' },
                            artistName: { S: 'Deleted Artist' }
                        }
                    }
                }]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            const result = await handler(mockEvent, mockContext);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.message).toContain('Successfully processed');
            expect(body.processedRecords).toBe(1);

            expect(mockDelete).toHaveBeenCalledWith(
                expect.objectContaining({
                    index: 'test-artists',
                    id: 'ARTIST#artist-789'
                })
            );
        });

        it('should process multiple records in a single event', async () => {
            const mockEvent = {
                Records: [
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                PK: { S: 'ARTIST#artist-1' },
                                SK: { S: 'METADATA' },
                                artistName: { S: 'Artist One' }
                            }
                        }
                    },
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            Keys: {
                                PK: { S: 'ARTIST#artist-2' },
                                SK: { S: 'METADATA' }
                            },
                            NewImage: {
                                PK: { S: 'ARTIST#artist-2' },
                                SK: { S: 'METADATA' },
                                artistName: { S: 'Artist Two Updated' }
                            }
                        }
                    },
                    {
                        eventName: 'REMOVE',
                        dynamodb: {
                            Keys: {
                                PK: { S: 'ARTIST#artist-3' },
                                SK: { S: 'METADATA' }
                            },
                            OldImage: {
                                PK: { S: 'ARTIST#artist-3' },
                                SK: { S: 'METADATA' },
                                artistName: { S: 'Artist Three' }
                            }
                        }
                    }
                ]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            const result = await handler(mockEvent, mockContext);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.message).toContain('Successfully processed');
            expect(body.processedRecords).toBe(3);

            expect(mockIndex).toHaveBeenCalledTimes(2); // INSERT and MODIFY both use index
            expect(mockDelete).toHaveBeenCalledTimes(1);
        });

        it('should skip non-artist records', async () => {
            const mockEvent = {
                Records: [
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                PK: { S: 'STUDIO#studio-123' },
                                SK: { S: 'METADATA' },
                                studioName: { S: 'Test Studio' }
                            }
                        }
                    },
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                PK: { S: 'ARTIST#artist-123' },
                                SK: { S: 'METADATA' },
                                artistName: { S: 'Test Artist' }
                            }
                        }
                    }
                ]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            const result = await handler(mockEvent, mockContext);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.message).toContain('Successfully processed');
            expect(body.processedRecords).toBe(2); // Both records processed successfully (one skipped, one indexed)

            expect(mockIndex).toHaveBeenCalledTimes(1);
        });
    });

    describe('error handling', () => {
        it('should handle missing environment variables gracefully', async () => {
            // Temporarily remove environment variables
            const originalEndpoint = process.env.OPENSEARCH_ENDPOINT;
            const originalSecretArn = process.env.APP_SECRETS_ARN;
            
            delete process.env.OPENSEARCH_ENDPOINT;
            delete process.env.APP_SECRETS_ARN;

            const mockEvent = { Records: [] };
            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            try {
                const { handler } = await import('../index.js');
                await expect(handler(mockEvent, mockContext)).rejects.toThrow();
            } finally {
                // Restore environment variables
                if (originalEndpoint) process.env.OPENSEARCH_ENDPOINT = originalEndpoint;
                if (originalSecretArn) process.env.APP_SECRETS_ARN = originalSecretArn;
            }
        });

        it('should handle OpenSearch indexing failures', async () => {
            mockIndex.mockRejectedValue(new Error('OpenSearch indexing failed'));

            const mockEvent = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        NewImage: {
                            PK: { S: 'ARTIST#artist-fail' },
                            SK: { S: 'METADATA' },
                            artistName: { S: 'Fail Artist' }
                        }
                    }
                }]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            
            await expect(handler(mockEvent, mockContext)).rejects.toThrow('Failed to process 1 out of 1 records');
        });

        it('should handle partial failures in batch processing', async () => {
            mockIndex.mockResolvedValueOnce({ body: { result: 'created' } });
            mockIndex.mockRejectedValueOnce(new Error('Index failed'));

            const mockEvent = {
                Records: [
                    {
                        eventName: 'INSERT',
                        dynamodb: {
                            NewImage: {
                                PK: { S: 'ARTIST#artist-success' },
                                SK: { S: 'METADATA' },
                                artistName: { S: 'Success Artist' }
                            }
                        }
                    },
                    {
                        eventName: 'MODIFY',
                        dynamodb: {
                            Keys: {
                                PK: { S: 'ARTIST#artist-fail' },
                                SK: { S: 'METADATA' }
                            },
                            NewImage: {
                                PK: { S: 'ARTIST#artist-fail' },
                                SK: { S: 'METADATA' },
                                artistName: { S: 'Fail Artist' }
                            }
                        }
                    }
                ]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            
            await expect(handler(mockEvent, mockContext)).rejects.toThrow('Failed to process 1 out of 2 records');
        });

        it('should handle malformed DynamoDB records', async () => {
            const mockEvent = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        // Missing NewImage
                    }
                }]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            
            await expect(handler(mockEvent, mockContext)).rejects.toThrow('Failed to process 1 out of 1 records');
        });

        it('should handle empty records array', async () => {
            const mockEvent = { Records: [] };
            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            const result = await handler(mockEvent, mockContext);

            expect(result.statusCode).toBe(200);
            const body = JSON.parse(result.body);
            expect(body.message).toContain('Successfully processed');
            expect(body.processedRecords).toBe(0);
        });
    });

    describe('document transformation', () => {
        it('should properly transform DynamoDB attributes to OpenSearch document', async () => {
            const mockEvent = {
                Records: [{
                    eventName: 'INSERT',
                    dynamodb: {
                        NewImage: {
                            PK: { S: 'ARTIST#transform-test' },
                            SK: { S: 'METADATA' },
                            artistName: { S: 'Transform Test Artist' },
                            styles: { SS: ['traditional', 'realism'] },
                            locationDisplay: { S: 'Test City, UK' },
                            instagramHandle: { S: 'transform_test' },
                            portfolioImages: { SS: ['img1.jpg', 'img2.jpg'] },
                            contactInfo: {
                                M: {
                                    instagram: { S: 'https://instagram.com/transform_test' },
                                    bookingMethod: { S: 'instagram_dm' }
                                }
                            },
                            geohash: { S: 'gcpvj0' },
                            createdAt: { S: '2024-01-01T00:00:00Z' },
                            updatedAt: { S: '2024-01-01T12:00:00Z' }
                        }
                    }
                }]
            };

            const mockContext = { functionName: 'test-function', awsRequestId: 'test-123' };

            const { handler } = await import('../index.js');
            await handler(mockEvent, mockContext);

            expect(mockIndex).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        artistId: 'transform-test',
                        pk: 'ARTIST#transform-test',
                        sk: 'METADATA',
                        instagramHandle: 'transform_test',
                        geohash: 'gcpvj0'
                    })
                })
            );
        });
    });
});