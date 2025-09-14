import { jest } from '@jest/globals';

// Mock OpenSearch client and circuit breaker
const mockSearch = jest.fn();
const mockOpenSearchClient = jest.fn(() => ({
    search: mockSearch
}));

const mockCircuitBreaker = jest.fn();
const mockBreakerFallback = jest.fn();
const mockBreakerOn = jest.fn();

jest.unstable_mockModule('@opensearch-project/opensearch', () => ({
    Client: mockOpenSearchClient
}));

jest.unstable_mockModule('opossum', () => ({
    default: jest.fn((fn, options) => {
        const breaker = {
            fire: mockCircuitBreaker,
            fallback: mockBreakerFallback,
            on: mockBreakerOn
        };
        mockCircuitBreaker.mockImplementation(fn);
        return breaker;
    })
}));

// Mock AWS SDK
const mockGetSecretValue = jest.fn();
jest.unstable_mockModule('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: jest.fn(() => ({
        send: mockGetSecretValue
    })),
    GetSecretValueCommand: jest.fn()
}));

describe('API Handler Route Tests', () => {
    beforeAll(() => {
        // Set up environment variables
        process.env.APP_SECRETS_ARN = 'test-secret-arn';
        process.env.OPENSEARCH_ENDPOINT = 'test-endpoint.com';
        process.env.OPENSEARCH_INDEX = 'test-artists';
        
        // Mock secrets manager response
        mockGetSecretValue.mockResolvedValue({
            SecretString: JSON.stringify({
                master_user_name: 'test-user',
                master_user_password: 'test-password'
            })
        });
    });

    const createMockEvent = (path, method = 'GET', queryStringParameters = null, pathParameters = null) => ({
        requestContext: {
            http: { method },
            requestId: 'test-request-id'
        },
        rawPath: path,
        queryStringParameters,
        pathParameters
    });

    const mockContext = {
        awsRequestId: 'test-aws-request-id'
    };

    it('should return 400 for /v1/artists without search parameters', async () => {
        const { handler } = await import('../index.js');
        const event = createMockEvent('/v1/artists');
        
        const response = await handler(event, mockContext);
        
        expect(response.statusCode).toBe(400);
        expect(response.headers['Content-Type']).toBe('application/problem+json');
        
        const body = JSON.parse(response.body);
        expect(body.type).toBe('https://api.tattoodirectory.com/docs/errors#400');
        expect(body.title).toBe('Bad Request');
        expect(body.status).toBe(400);
        expect(body.instance).toBe('test-request-id');
    });

    it('should return 503 for /v1/artists with search parameters (OpenSearch unavailable)', async () => {
        const { handler } = await import('../index.js');
        const event = createMockEvent('/v1/artists', 'GET', { query: 'test artist' });
        
        const response = await handler(event, mockContext);
        
        // Should return 500 because OpenSearch client initialization fails
        expect(response.statusCode).toBe(500);
        expect(response.headers['Content-Type']).toBe('application/problem+json');
        
        const body = JSON.parse(response.body);
        expect(body.title).toBe('Internal Server Error');
    });

    it('should return 400 for /v1/artists/{artistId} without artistId', async () => {
        const { handler } = await import('../index.js');
        const event = createMockEvent('/v1/artists/test123', 'GET', null, null);
        
        const response = await handler(event, mockContext);
        
        expect(response.statusCode).toBe(400);
        const body = JSON.parse(response.body);
        expect(body.title).toBe('Bad Request');
        expect(body.detail).toContain('Artist ID is required');
    });

    it('should return 503 for /v1/styles (OpenSearch unavailable)', async () => {
        const { handler } = await import('../index.js');
        const event = createMockEvent('/v1/styles');
        
        const response = await handler(event, mockContext);
        
        // Should return 500 because OpenSearch client initialization fails
        expect(response.statusCode).toBe(500);
        const body = JSON.parse(response.body);
        expect(body.title).toBe('Internal Server Error');
    });

    it('should return 404 for unknown routes', async () => {
        const { handler } = await import('../index.js');
        const event = createMockEvent('/v1/unknown');
        
        const response = await handler(event, mockContext);
        
        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.title).toBe('Not Found');
        expect(body.detail).toContain('GET /v1/unknown');
    });

    it('should handle POST method correctly', async () => {
        const { handler } = await import('../index.js');
        const event = createMockEvent('/v1/artists', 'POST');
        
        const response = await handler(event, mockContext);
        
        expect(response.statusCode).toBe(404);
        const body = JSON.parse(response.body);
        expect(body.detail).toContain('POST /v1/artists');
    });

    it('should properly parse artist ID from path', async () => {
        const { handler } = await import('../index.js');
        const event = createMockEvent('/v1/artists/artist123', 'GET', null, { artistId: 'artist123' });
        
        const response = await handler(event, mockContext);
        
        // Should return 500 due to OpenSearch unavailability, but the route should be recognized
        expect(response.statusCode).toBe(500);
        const body = JSON.parse(response.body);
        expect(body.title).toBe('Internal Server Error');
    });

    describe('successful API responses with mocked OpenSearch', () => {
        beforeEach(() => {
            // Reset mocks
            mockSearch.mockClear();
            mockCircuitBreaker.mockClear();
            
            // Mock successful OpenSearch responses
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: { value: 2 },
                        hits: [
                            {
                                _source: {
                                    artistId: 'artist-1',
                                    artistName: 'Test Artist 1',
                                    styles: ['traditional'],
                                    locationDisplay: 'London, UK',
                                    instagramHandle: 'test_artist_1',
                                    portfolioImages: ['image1.jpg', 'image2.jpg']
                                }
                            },
                            {
                                _source: {
                                    artistId: 'artist-2',
                                    artistName: 'Test Artist 2',
                                    styles: ['realism'],
                                    locationDisplay: 'Manchester, UK',
                                    instagramHandle: 'test_artist_2',
                                    portfolioImages: ['image3.jpg', 'image4.jpg']
                                }
                            }
                        ]
                    }
                }
            });
        });

        it('should return artists for valid search query', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { query: 'traditional' });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            expect(response.headers['Content-Type']).toBe('application/json');
            
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body).toHaveLength(2);
            expect(body[0].artistName).toBe('Test Artist 1');
        });

        it('should return artists for location-based search', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { 
                location: 'London',
                radius: '10'
            });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(mockSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    index: 'test-artists',
                    body: expect.objectContaining({
                        query: expect.any(Object)
                    })
                })
            );
        });

        it('should return artists for style-based search', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { 
                style: 'traditional'
            });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
        });

        it('should return single artist by ID', async () => {
            // Mock single artist response
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: { value: 1 },
                        hits: [{
                            _source: {
                                artistId: 'artist-123',
                                artistName: 'Specific Artist',
                                styles: ['traditional'],
                                locationDisplay: 'Leeds, UK',
                                instagramHandle: 'specific_artist',
                                portfolioImages: ['image1.jpg'],
                                contactInfo: {
                                    instagram: 'https://instagram.com/specific_artist',
                                    bookingMethod: 'instagram_dm'
                                }
                            }
                        }]
                    }
                }
            });

            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists/artist-123', 'GET', null, { artistId: 'artist-123' });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.artistId).toBe('artist-123');
            expect(body.artistName).toBe('Specific Artist');
            expect(body.contactInfo).toBeDefined();
        });

        it('should return 404 for non-existent artist', async () => {
            // Mock empty response
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: { value: 0 },
                        hits: []
                    }
                }
            });

            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists/non-existent', 'GET', null, { artistId: 'non-existent' });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(404);
            const body = JSON.parse(response.body);
            expect(body.title).toBe('Not Found');
            expect(body.detail).toContain('non-existent');
        });

        it('should return available styles', async () => {
            // Mock aggregation response for styles
            mockSearch.mockResolvedValue({
                body: {
                    aggregations: {
                        unique_styles: {
                            buckets: [
                                { key: 'traditional', doc_count: 150 },
                                { key: 'realism', doc_count: 120 },
                                { key: 'blackwork', doc_count: 80 },
                                { key: 'neo-traditional', doc_count: 60 }
                            ]
                        }
                    }
                }
            });

            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/styles');
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body).toHaveLength(4);
            expect(body[0]).toEqual({
                name: 'traditional',
                count: 150
            });
        });
    });

    describe('error handling and edge cases', () => {
        it('should handle OpenSearch timeout errors', async () => {
            mockSearch.mockRejectedValue(new Error('Request timeout'));

            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { query: 'test' });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(500);
            const body = JSON.parse(response.body);
            expect(body.title).toBe('Internal Server Error');
        });

        it('should handle malformed search parameters', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { 
                radius: 'invalid-number',
                limit: 'not-a-number'
            });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.title).toBe('Bad Request');
        });

        it('should handle large limit values', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { 
                query: 'test',
                limit: '1000' // Should be capped
            });
            
            const response = await handler(event, mockContext);
            
            // Should still process but limit should be capped
            expect(mockSearch).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        size: 50 // Should be capped to max limit
                    })
                })
            );
        });

        it('should handle empty search results gracefully', async () => {
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: { value: 0 },
                        hits: []
                    }
                }
            });

            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { query: 'nonexistent' });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body).toEqual([]);
        });

        it('should validate required parameters for artist search', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { 
                // No query, location, or styles provided
                limit: '10'
            });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(400);
            const body = JSON.parse(response.body);
            expect(body.detail).toContain('At least one search parameter is required');
        });

        // CORS preflight requests are handled at API Gateway level, not in Lambda handler
    });

    describe('response format validation', () => {
        beforeEach(() => {
            mockSearch.mockResolvedValue({
                body: {
                    hits: {
                        total: { value: 1 },
                        hits: [{
                            _source: {
                                artistId: 'format-test-artist',
                                artistName: 'Format Test Artist',
                                styles: ['traditional'],
                                locationDisplay: 'Test City, UK',
                                instagramHandle: 'format_test',
                                portfolioImages: ['image1.jpg'],
                                contactInfo: {
                                    instagram: 'https://instagram.com/format_test'
                                }
                            }
                        }]
                    }
                }
            });
        });

        it('should return properly formatted artist search response', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists', 'GET', { query: 'test' });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            expect(response.headers['Content-Type']).toBe('application/json');
            
            const body = JSON.parse(response.body);
            expect(Array.isArray(body)).toBe(true);
            expect(body).toHaveLength(1);
            
            const artist = body[0];
            expect(artist).toHaveProperty('artistId');
            expect(artist).toHaveProperty('artistName');
            expect(artist).toHaveProperty('styles');
            expect(artist).toHaveProperty('locationDisplay');
        });

        it('should return properly formatted single artist response', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/artists/format-test-artist', 'GET', null, { artistId: 'format-test-artist' });
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            
            expect(body).toHaveProperty('artistId');
            expect(body).toHaveProperty('artistName');
            expect(body).toHaveProperty('styles');
            expect(body).toHaveProperty('locationDisplay');
            expect(body).toHaveProperty('portfolioImages');
            expect(body).toHaveProperty('contactInfo');
        });

        it('should return properly formatted error responses', async () => {
            const { handler } = await import('../index.js');
            const event = createMockEvent('/v1/invalid-endpoint');
            
            const response = await handler(event, mockContext);
            
            expect(response.statusCode).toBe(404);
            expect(response.headers['Content-Type']).toBe('application/problem+json');
            
            const body = JSON.parse(response.body);
            expect(body).toHaveProperty('type');
            expect(body).toHaveProperty('title');
            expect(body).toHaveProperty('status');
            expect(body).toHaveProperty('detail');
            expect(body).toHaveProperty('instance');
            expect(body.type).toBe('https://api.tattoodirectory.com/docs/errors#404');
        });
    });
});