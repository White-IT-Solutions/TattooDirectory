/**
 * Unit tests for error handling utilities and patterns
 */

import { jest } from '@jest/globals';

describe('Error Handling Utilities', () => {
    describe('RFC 9457 Error Response Format', () => {
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

        it('should create properly formatted 400 error responses', () => {
            const error = createErrorResponse(
                400, 
                'Bad Request', 
                'Missing required parameter: query', 
                'test-request-123'
            );

            expect(error.statusCode).toBe(400);
            expect(error.headers['Content-Type']).toBe('application/problem+json');

            const body = JSON.parse(error.body);
            expect(body.type).toBe('https://api.tattoodirectory.com/docs/errors#400');
            expect(body.title).toBe('Bad Request');
            expect(body.status).toBe(400);
            expect(body.detail).toBe('Missing required parameter: query');
            expect(body.instance).toBe('test-request-123');
        });

        it('should create properly formatted 404 error responses', () => {
            const error = createErrorResponse(
                404, 
                'Artist Not Found', 
                'Artist with ID artist-123 was not found', 
                'test-request-456'
            );

            expect(error.statusCode).toBe(404);
            const body = JSON.parse(error.body);
            expect(body.type).toBe('https://api.tattoodirectory.com/docs/errors#404');
            expect(body.title).toBe('Artist Not Found');
            expect(body.detail).toContain('artist-123');
        });

        it('should create properly formatted 500 error responses', () => {
            const error = createErrorResponse(
                500, 
                'Internal Server Error', 
                'An unexpected error occurred while processing the request', 
                'test-request-789'
            );

            expect(error.statusCode).toBe(500);
            const body = JSON.parse(error.body);
            expect(body.type).toBe('https://api.tattoodirectory.com/docs/errors#500');
            expect(body.title).toBe('Internal Server Error');
        });

        it('should create properly formatted 503 error responses', () => {
            const error = createErrorResponse(
                503, 
                'Service Unavailable', 
                'The search service is temporarily unavailable', 
                'test-request-503'
            );

            expect(error.statusCode).toBe(503);
            const body = JSON.parse(error.body);
            expect(body.type).toBe('https://api.tattoodirectory.com/docs/errors#503');
            expect(body.title).toBe('Service Unavailable');
        });
    });

    describe('Circuit Breaker Error Handling', () => {
        const mockCircuitBreaker = {
            fire: jest.fn(),
            fallback: jest.fn(),
            on: jest.fn()
        };

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should handle circuit breaker open state', async () => {
            const circuitBreakerError = new Error('Circuit breaker is open');
            circuitBreakerError.name = 'CircuitBreakerOpenException';
            
            mockCircuitBreaker.fire.mockRejectedValue(circuitBreakerError);
            mockCircuitBreaker.fallback.mockReturnValue({
                statusCode: 503,
                body: JSON.stringify({
                    type: 'https://api.tattoodirectory.com/docs/errors#503',
                    title: 'Service Unavailable',
                    status: 503,
                    detail: 'The search service is temporarily unavailable due to high error rates'
                })
            });

            try {
                await mockCircuitBreaker.fire();
            } catch (error) {
                expect(error.name).toBe('CircuitBreakerOpenException');
                
                const fallbackResponse = mockCircuitBreaker.fallback();
                expect(fallbackResponse.statusCode).toBe(503);
                
                const body = JSON.parse(fallbackResponse.body);
                expect(body.title).toBe('Service Unavailable');
            }
        });

        it('should handle circuit breaker timeout', async () => {
            const timeoutError = new Error('Operation timeout');
            timeoutError.name = 'TimeoutError';
            
            mockCircuitBreaker.fire.mockRejectedValue(timeoutError);

            try {
                await mockCircuitBreaker.fire();
            } catch (error) {
                expect(error.name).toBe('TimeoutError');
            }
        });
    });

    describe('AWS Service Error Handling', () => {
        it('should handle DynamoDB conditional check failures', () => {
            const conditionalCheckError = new Error('The conditional request failed');
            conditionalCheckError.name = 'ConditionalCheckFailedException';
            conditionalCheckError.code = 'ConditionalCheckFailedException';

            const handleDynamoDBError = (error) => {
                if (error.name === 'ConditionalCheckFailedException') {
                    return {
                        isIdempotent: true,
                        shouldRetry: false,
                        message: 'Item already exists or condition not met'
                    };
                }
                return {
                    isIdempotent: false,
                    shouldRetry: true,
                    message: error.message
                };
            };

            const result = handleDynamoDBError(conditionalCheckError);
            expect(result.isIdempotent).toBe(true);
            expect(result.shouldRetry).toBe(false);
        });

        it('should handle OpenSearch connection errors', () => {
            const connectionError = new Error('Connection timeout');
            connectionError.name = 'ConnectionError';

            const handleOpenSearchError = (error) => {
                if (error.name === 'ConnectionError' || error.message.includes('timeout')) {
                    return {
                        statusCode: 503,
                        shouldRetry: true,
                        backoffMs: 1000
                    };
                }
                return {
                    statusCode: 500,
                    shouldRetry: false,
                    backoffMs: 0
                };
            };

            const result = handleOpenSearchError(connectionError);
            expect(result.statusCode).toBe(503);
            expect(result.shouldRetry).toBe(true);
            expect(result.backoffMs).toBe(1000);
        });

        it('should handle SQS send failures', () => {
            const sqsError = new Error('Message too large');
            sqsError.name = 'InvalidParameterValue';

            const handleSQSError = (error) => {
                if (error.message.includes('too large')) {
                    return {
                        shouldRetry: false,
                        shouldSplit: true,
                        errorType: 'MESSAGE_TOO_LARGE'
                    };
                }
                return {
                    shouldRetry: true,
                    shouldSplit: false,
                    errorType: 'UNKNOWN_ERROR'
                };
            };

            const result = handleSQSError(sqsError);
            expect(result.shouldRetry).toBe(false);
            expect(result.shouldSplit).toBe(true);
            expect(result.errorType).toBe('MESSAGE_TOO_LARGE');
        });
    });

    describe('Validation Error Handling', () => {
        const validateArtistData = (data) => {
            const errors = [];

            if (!data.artistId) {
                errors.push({
                    field: 'artistId',
                    message: 'Artist ID is required',
                    code: 'REQUIRED_FIELD'
                });
            }

            if (!data.artistName) {
                errors.push({
                    field: 'artistName',
                    message: 'Artist name is required',
                    code: 'REQUIRED_FIELD'
                });
            }

            if (data.styles && !Array.isArray(data.styles)) {
                errors.push({
                    field: 'styles',
                    message: 'Styles must be an array',
                    code: 'INVALID_TYPE'
                });
            }

            if (data.portfolioImages && !Array.isArray(data.portfolioImages)) {
                errors.push({
                    field: 'portfolioImages',
                    message: 'Portfolio images must be an array',
                    code: 'INVALID_TYPE'
                });
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        };

        it('should validate required fields', () => {
            const invalidData = {
                styles: ['traditional']
            };

            const result = validateArtistData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0].field).toBe('artistId');
            expect(result.errors[1].field).toBe('artistName');
        });

        it('should validate field types', () => {
            const invalidData = {
                artistId: 'test-artist',
                artistName: 'Test Artist',
                styles: 'traditional', // Should be array
                portfolioImages: 'image.jpg' // Should be array
            };

            const result = validateArtistData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0].code).toBe('INVALID_TYPE');
            expect(result.errors[1].code).toBe('INVALID_TYPE');
        });

        it('should pass validation for valid data', () => {
            const validData = {
                artistId: 'test-artist',
                artistName: 'Test Artist',
                styles: ['traditional'],
                portfolioImages: ['image1.jpg', 'image2.jpg']
            };

            const result = validateArtistData(validData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    describe('Retry Logic and Exponential Backoff', () => {
        const createRetryHandler = (maxRetries = 3, baseDelayMs = 100) => {
            return async (operation, ...args) => {
                let lastError;
                
                for (let attempt = 0; attempt <= maxRetries; attempt++) {
                    try {
                        return await operation(...args);
                    } catch (error) {
                        lastError = error;
                        
                        if (attempt === maxRetries) {
                            throw error;
                        }
                        
                        // Exponential backoff with jitter
                        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 100;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                
                throw lastError;
            };
        };

        it('should retry failed operations with exponential backoff', async () => {
            let attemptCount = 0;
            const mockOperation = jest.fn().mockImplementation(() => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            });

            const retryHandler = createRetryHandler(3, 10);
            const result = await retryHandler(mockOperation);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });

        it('should fail after max retries', async () => {
            const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
            const retryHandler = createRetryHandler(2, 10);

            await expect(retryHandler(mockOperation)).rejects.toThrow('Persistent failure');
            expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });
    });

    describe('Error Aggregation and Reporting', () => {
        const createErrorAggregator = () => {
            const errors = [];
            
            return {
                addError: (error, context = {}) => {
                    errors.push({
                        message: error.message,
                        name: error.name,
                        stack: error.stack,
                        context,
                        timestamp: new Date().toISOString()
                    });
                },
                
                getErrors: () => errors,
                
                hasErrors: () => errors.length > 0,
                
                getSummary: () => ({
                    totalErrors: errors.length,
                    errorTypes: [...new Set(errors.map(e => e.name))],
                    firstError: errors[0]?.timestamp,
                    lastError: errors[errors.length - 1]?.timestamp
                })
            };
        };

        it('should aggregate multiple errors', () => {
            const aggregator = createErrorAggregator();
            
            aggregator.addError(new Error('First error'), { operation: 'search' });
            aggregator.addError(new TypeError('Type error'), { operation: 'validation' });
            aggregator.addError(new Error('Third error'), { operation: 'database' });

            expect(aggregator.hasErrors()).toBe(true);
            expect(aggregator.getErrors()).toHaveLength(3);

            const summary = aggregator.getSummary();
            expect(summary.totalErrors).toBe(3);
            expect(summary.errorTypes).toContain('Error');
            expect(summary.errorTypes).toContain('TypeError');
        });

        it('should provide error context', () => {
            const aggregator = createErrorAggregator();
            const testError = new Error('Test error');
            
            aggregator.addError(testError, { 
                artistId: 'test-artist',
                operation: 'scraping',
                retryCount: 2
            });

            const errors = aggregator.getErrors();
            expect(errors[0].context.artistId).toBe('test-artist');
            expect(errors[0].context.operation).toBe('scraping');
            expect(errors[0].context.retryCount).toBe(2);
        });
    });
});