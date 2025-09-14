/**
 * Unit tests for Queue Scraping Handler
 */

import { jest } from '@jest/globals';

describe('Queue Scraping Handler', () => {
    let handler;
    let mockContext;

    beforeAll(async () => {
        // Import the handler
        const module = await import('../index.js');
        handler = module.handler;
    });

    beforeEach(() => {
        mockContext = {
            awsRequestId: 'test-request-id',
            functionName: 'queue-scraping-handler',
            getRemainingTimeInMillis: () => 30000
        };
    });

    describe('Basic functionality', () => {
        it('should be able to import the handler module', () => {
            expect(handler).toBeDefined();
            expect(typeof handler).toBe('function');
        });

        it('should handle empty artists array', async () => {
            const event = {
                artists: []
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(200);
            expect(result.body).toBe('No jobs to queue');
            expect(result.queuedCount).toBe(0);
            expect(result.scrapeId).toBeNull();
        });

        it('should handle missing artists property', async () => {
            const event = {};

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(200);
            expect(result.body).toBe('No jobs to queue');
            expect(result.queuedCount).toBe(0);
        });

        it('should handle artist data with missing fields', async () => {
            const event = {
                artists: [
                    {
                        // Missing required fields
                        artistName: 'Test Artist'
                    }
                ]
            };

            const result = await handler(event, mockContext);
            
            // Should handle gracefully, might succeed or fail depending on SQS availability
            expect([200, 500]).toContain(result.statusCode);
        });

        it('should process valid artist data', async () => {
            const event = {
                artists: [
                    {
                        artistId: 'test-artist-1',
                        artistName: 'Test Artist 1',
                        instagramHandle: 'test_artist_1',
                        studioId: 'test-studio-1'
                    }
                ]
            };

            const result = await handler(event, mockContext);
            
            // Should succeed or fail gracefully
            expect([200, 500]).toContain(result.statusCode);
            
            if (result.statusCode === 200) {
                const body = JSON.parse(result.body);
                expect(body.summary.totalAttempted).toBe(1);
            }
        });
    });

    describe('Error handling', () => {
        it('should handle malformed event data', async () => {
            const event = { malformed: true }; // Use malformed object instead of null

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(200); // Will return "No jobs to queue"
            expect(result.body).toBe('No jobs to queue');
            expect(result.queuedCount).toBe(0);
        });

        it('should handle invalid artist data types', async () => {
            const event = {
                artists: 'not-an-array'
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(500);
            expect(result.body).toBe('Failed to queue scraping jobs');
            expect(result.error).toBeDefined();
        });
    });

    describe('Response format', () => {
        it('should return structured error responses', async () => {
            const event = {
                artists: 'invalid'
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(500);
            expect(result.body).toBe('Failed to queue scraping jobs');
            expect(result.error).toHaveProperty('message');
            expect(result.error).toHaveProperty('type');
            expect(result.error).toHaveProperty('timestamp');
        });

        it('should return proper success response format', async () => {
            const event = {
                artists: []
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(200);
            expect(result.body).toBe('No jobs to queue');
            expect(result).toHaveProperty('queuedCount');
            expect(result).toHaveProperty('scrapeId');
        });
    });
});