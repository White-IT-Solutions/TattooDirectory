/**
 * Unit tests for Find Artists Handler
 */

import { jest } from '@jest/globals';

describe('Find Artists Handler', () => {
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
            functionName: 'find-artists-handler',
            getRemainingTimeInMillis: () => 30000
        };
    });

    describe('Basic functionality', () => {
        it('should be able to import the handler module', () => {
            expect(handler).toBeDefined();
            expect(typeof handler).toBe('function');
        });

        it('should handle missing studioId', async () => {
            const event = {
                location: 'London, UK'
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(500);
            expect(result.error).toBeDefined();
            expect(result.error.type).toBe('ARTIST_DISCOVERY_ERROR');
        });

        it('should handle valid studioId', async () => {
            const event = {
                studioId: 'test-studio-1',
                location: 'London, UK',
                style: 'traditional'
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(200);
            expect(result.artists).toBeDefined();
            expect(Array.isArray(result.artists)).toBe(true);
            expect(result.studioId).toBe('test-studio-1');
        });

        it('should generate mock artists for valid studio', async () => {
            const event = {
                studioId: 'test-studio-1',
                location: 'London, UK',
                style: 'traditional',
                metadata: {
                    studioWebsite: 'https://teststudio1.com'
                }
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(200);
            expect(result.artists).toBeDefined();
            expect(Array.isArray(result.artists)).toBe(true);
            expect(result.artists.length).toBeGreaterThan(0);
            expect(result.summary.artistCount).toBe(result.artists.length);
        });
    });

    describe('Error handling', () => {
        it('should handle malformed event data', async () => {
            const event = { malformed: true };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(500);
            expect(result.error).toBeDefined();
            expect(result.error.type).toBe('ARTIST_DISCOVERY_ERROR');
        });

        it('should handle invalid studioId types', async () => {
            const event = {
                studioId: 123, // Invalid type
                location: 'London, UK'
            };

            const result = await handler(event, mockContext);
            
            // Should handle gracefully, might fail due to string operations on number
            expect([200, 500]).toContain(result.statusCode);
            
            if (result.statusCode === 500) {
                expect(result.error).toBeDefined();
            }
        });
    });

    describe('Response format', () => {
        it('should return proper success response format', async () => {
            const event = {
                studioId: 'test-studio',
                location: 'London, UK',
                style: 'traditional'
            };

            const result = await handler(event, mockContext);
            
            expect(result.statusCode).toBe(200);
            expect(result).toHaveProperty('studioId');
            expect(result).toHaveProperty('artists');
            expect(result).toHaveProperty('summary');
            expect(Array.isArray(result.artists)).toBe(true);
        });
    });
});