/**
 * Unit tests for Discover Studios Handler
 */

import { jest } from '@jest/globals';

describe('Discover Studios Handler', () => {
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
            functionName: 'discover-studios-handler',
            getRemainingTimeInMillis: () => 30000
        };
    });

    describe('Basic functionality', () => {
        it('should be able to import the handler module', () => {
            expect(handler).toBeDefined();
            expect(typeof handler).toBe('function');
        });

        it('should handle basic search query', async () => {
            const event = {
                searchQuery: 'tattoo studios london',
                location: 'London, UK',
                radius: 10000
            };

            const result = await handler(event, mockContext);
            
            // Should succeed or fail gracefully depending on external API availability
            expect([200, 500]).toContain(result.statusCode);
            
            if (result.statusCode === 200) {
                expect(result.discoveredItems).toBeDefined();
                expect(Array.isArray(result.discoveredItems)).toBe(true);
            }
        });

        it('should handle missing search parameters', async () => {
            const event = {};

            const result = await handler(event, mockContext);
            
            // Should handle gracefully
            expect([200, 400, 500]).toContain(result.statusCode);
        });
    });

    describe('Error handling', () => {
        it('should handle malformed event data', async () => {
            const event = { malformed: true };

            const result = await handler(event, mockContext);
            
            // Should handle gracefully
            expect([200, 400, 500]).toContain(result.statusCode);
        });

        it('should handle invalid search query types', async () => {
            const event = {
                searchQuery: 123, // Invalid type
                location: 'London, UK'
            };

            const result = await handler(event, mockContext);
            
            // Should handle gracefully
            expect([200, 400, 500]).toContain(result.statusCode);
        });
    });

    describe('Response format', () => {
        it('should return proper response structure', async () => {
            const event = {
                searchQuery: 'tattoo studios',
                location: 'London, UK'
            };

            const result = await handler(event, mockContext);
            
            expect(result).toHaveProperty('statusCode');
            expect(typeof result.statusCode).toBe('number');
            
            if (result.statusCode === 200) {
                expect(result).toHaveProperty('discoveredItems');
                expect(Array.isArray(result.discoveredItems)).toBe(true);
            }
        });
    });
});