/**
 * Unit tests for HealthMonitor class
 */

// Mock AWS SDK first
const mockDynamoDB = {
    listTables: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
            TableNames: ['test-table']
        })
    }),
    describeTable: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
            Table: {
                TableStatus: 'ACTIVE',
                CreationDateTime: new Date()
            }
        })
    })
};

const mockDocumentClient = {
    scan: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
            Count: 10,
            Items: [
                {
                    PK: 'ARTIST#1',
                    portfolioImages: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg']
                }
            ]
        })
    })
};

const mockS3 = {
    listBuckets: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
            Buckets: [
                { Name: 'test-bucket', CreationDate: new Date() }
            ]
        })
    }),
    listObjectsV2: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue({
            Contents: [{ Key: 'test-object' }],
            NextContinuationToken: null
        })
    })
};

jest.mock('aws-sdk', () => {
    const DynamoDBConstructor = jest.fn().mockImplementation(() => mockDynamoDB);
    DynamoDBConstructor.DocumentClient = jest.fn().mockImplementation(() => mockDocumentClient);
    
    return {
        DynamoDB: DynamoDBConstructor,
        S3: jest.fn().mockImplementation(() => mockS3)
    };
});

const { HealthMonitor } = require('../health-monitor');
const { DataConfiguration } = require('../data-config');

// Mock HTTP modules
jest.mock('http', () => ({
    get: jest.fn(),
    request: jest.fn()
}));

jest.mock('https', () => ({
    get: jest.fn(),
    request: jest.fn()
}));

describe('HealthMonitor', () => {
    let healthMonitor;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            services: {
                aws: {
                    region: 'us-east-1',
                    accessKeyId: 'test',
                    secretAccessKey: 'test',
                    endpoint: 'http://localhost:4566'
                },
                opensearch: {
                    endpoint: 'http://localhost:4566'
                },
                dynamodb: {
                    tableName: 'test-table'
                }
            }
        };

        healthMonitor = new HealthMonitor(mockConfig);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with provided config', () => {
            expect(healthMonitor.config).toBe(mockConfig);
            expect(healthMonitor.healthStatus).toEqual({
                services: {},
                data: {},
                lastCheck: null,
                errors: []
            });
        });

        it('should initialize with default config if none provided', () => {
            // Mock DataConfiguration constructor for this test
            jest.doMock('../data-config', () => ({
                DataConfiguration: jest.fn().mockImplementation(() => mockConfig)
            }));
            
            const monitor = new HealthMonitor();
            expect(monitor.config).toBeDefined();
        });
    });

    describe('setupAWSClients', () => {
        it('should setup AWS clients with correct configuration', () => {
            healthMonitor.setupAWSClients();
            
            expect(healthMonitor.dynamodb).toBeDefined();
            expect(healthMonitor.dynamodbDoc).toBeDefined();
            expect(healthMonitor.s3).toBeDefined();
            expect(healthMonitor.opensearchEndpoint).toBe(mockConfig.services.opensearch.endpoint);
        });
    });

    describe('checkDynamoDBHealth', () => {
        it('should return healthy status for DynamoDB', async () => {
            const result = await healthMonitor.checkDynamoDBHealth();
            
            expect(result).toEqual({
                tablesFound: 1,
                tables: {
                    'test-table': {
                        status: 'ACTIVE',
                        itemCount: 10,
                        creationDateTime: expect.any(Date)
                    }
                }
            });
        });

        it('should handle DynamoDB connection errors', async () => {
            healthMonitor.dynamodb.listTables.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Connection failed'))
            });

            await expect(healthMonitor.checkDynamoDBHealth()).rejects.toThrow('DynamoDB connectivity failed');
        });
    });

    describe('checkS3Health', () => {
        it('should return healthy status for S3', async () => {
            const result = await healthMonitor.checkS3Health();
            
            expect(result).toEqual({
                bucketsFound: 1,
                buckets: {
                    'test-bucket': {
                        objectCount: 1,
                        creationDate: expect.any(Date)
                    }
                }
            });
        });

        it('should handle S3 connection errors', async () => {
            healthMonitor.s3.listBuckets.mockReturnValue({
                promise: jest.fn().mockRejectedValue(new Error('Connection failed'))
            });

            await expect(healthMonitor.checkS3Health()).rejects.toThrow('S3 connectivity failed');
        });
    });

    describe('checkLocalStackHealth', () => {
        it('should check LocalStack health endpoint', async () => {
            const http = require('http');
            const mockResponse = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback('{"services": {"dynamodb": "available"}, "version": "1.0.0"}');
                    } else if (event === 'end') {
                        callback();
                    }
                })
            };

            const mockRequest = {
                on: jest.fn(),
                setTimeout: jest.fn()
            };

            http.get.mockImplementation((url, callback) => {
                callback(mockResponse);
                return mockRequest;
            });

            const result = await healthMonitor.checkLocalStackHealth();
            
            expect(result).toEqual({
                services: { dynamodb: 'available' },
                version: '1.0.0'
            });
        });

        it('should handle LocalStack connection timeout', async () => {
            const http = require('http');
            const mockRequest = {
                on: jest.fn(),
                setTimeout: jest.fn((timeout, callback) => {
                    callback();
                }),
                destroy: jest.fn()
            };

            http.get.mockImplementation(() => mockRequest);

            await expect(healthMonitor.checkLocalStackHealth()).rejects.toThrow('LocalStack health check timeout');
        });
    });

    describe('validateCrossServiceConsistency', () => {
        it('should validate data consistency between services', async () => {
            // Mock OpenSearch response
            const https = require('https');
            const http = require('http');
            
            const mockResponse = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback('{"hits": {"total": {"value": 10}}}');
                    } else if (event === 'end') {
                        callback();
                    }
                })
            };

            const mockRequest = {
                on: jest.fn(),
                setTimeout: jest.fn(),
                write: jest.fn(),
                end: jest.fn()
            };

            http.request.mockImplementation((options, callback) => {
                callback(mockResponse);
                return mockRequest;
            });

            await healthMonitor.validateCrossServiceConsistency();
            
            expect(healthMonitor.healthStatus.data.crossServiceConsistency).toEqual({
                dynamoArtistCount: 10,
                opensearchArtistCount: 10,
                consistent: true,
                lastCheck: expect.any(String)
            });
        });
    });

    describe('validateImageAccessibility', () => {
        it('should validate image URL accessibility', async () => {
            const http = require('http');
            const mockRequest = {
                on: jest.fn(),
                end: jest.fn()
            };

            http.request.mockImplementation((options, callback) => {
                const mockResponse = { statusCode: 200 };
                callback(mockResponse);
                return mockRequest;
            });

            await healthMonitor.validateImageAccessibility();
            
            expect(healthMonitor.healthStatus.data.imageAccessibility).toEqual({
                totalChecked: 2,
                accessible: 2,
                accessibilityRate: '100.0',
                errors: [],
                lastCheck: expect.any(String)
            });
        });
    });

    describe('performHealthCheck', () => {
        it('should perform comprehensive health check', async () => {
            // Ensure AWS SDK mocks are working properly
            healthMonitor.dynamodb.listTables.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    TableNames: ['test-table']
                })
            });
            
            healthMonitor.s3.listBuckets.mockReturnValue({
                promise: jest.fn().mockResolvedValue({
                    Buckets: [{ Name: 'test-bucket', CreationDate: new Date() }]
                })
            });

            // Mock all HTTP requests for LocalStack and OpenSearch
            const http = require('http');
            
            // Mock LocalStack health response
            const mockHealthResponse = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback('{"services": {"dynamodb": "available"}, "version": "1.0.0"}');
                    } else if (event === 'end') {
                        callback();
                    }
                })
            };

            // Mock OpenSearch responses
            const mockOpenSearchResponse = {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback('{"cluster_name": "test", "status": "green", "number_of_nodes": 1, "number_of_data_nodes": 1}');
                    } else if (event === 'end') {
                        callback();
                    }
                })
            };

            const mockRequest = {
                on: jest.fn(),
                setTimeout: jest.fn(),
                write: jest.fn(),
                end: jest.fn()
            };

            http.get.mockImplementation((url, callback) => {
                callback(mockHealthResponse);
                return mockRequest;
            });

            http.request.mockImplementation((options, callback) => {
                if (options.method === 'HEAD') {
                    // Image accessibility check
                    const mockResponse = { statusCode: 200 };
                    callback(mockResponse);
                } else {
                    // OpenSearch requests
                    callback(mockOpenSearchResponse);
                }
                return mockRequest;
            });

            const result = await healthMonitor.performHealthCheck();
            
            expect(result.overall).toBe('healthy');
            expect(result.services).toBeDefined();
            expect(result.data).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('calculateOverallHealth', () => {
        it('should return healthy when all services are healthy', () => {
            healthMonitor.healthStatus.services = {
                'LocalStack': { status: 'healthy' },
                'DynamoDB': { status: 'healthy' },
                'S3': { status: 'healthy' },
                'OpenSearch': { status: 'healthy' }
            };
            healthMonitor.healthStatus.errors = [];

            const result = healthMonitor.calculateOverallHealth();
            expect(result).toBe('healthy');
        });

        it('should return degraded when some services are unhealthy', () => {
            healthMonitor.healthStatus.services = {
                'LocalStack': { status: 'healthy' },
                'DynamoDB': { status: 'healthy' },
                'S3': { status: 'unhealthy' },
                'OpenSearch': { status: 'healthy' }
            };
            healthMonitor.healthStatus.errors = [];

            const result = healthMonitor.calculateOverallHealth();
            expect(result).toBe('degraded');
        });

        it('should return unhealthy when most services are unhealthy', () => {
            healthMonitor.healthStatus.services = {
                'LocalStack': { status: 'unhealthy' },
                'DynamoDB': { status: 'unhealthy' },
                'S3': { status: 'unhealthy' },
                'OpenSearch': { status: 'healthy' }
            };
            healthMonitor.healthStatus.errors = [];

            const result = healthMonitor.calculateOverallHealth();
            expect(result).toBe('unhealthy');
        });
    });

    describe('getSystemStatus', () => {
        it('should return current system status', () => {
            healthMonitor.healthStatus = {
                lastCheck: '2023-01-01T00:00:00.000Z',
                services: {
                    'LocalStack': { status: 'healthy' },
                    'DynamoDB': { status: 'healthy' }
                },
                data: {},
                errors: []
            };

            const result = healthMonitor.getSystemStatus();
            
            expect(result).toEqual({
                lastCheck: '2023-01-01T00:00:00.000Z',
                overall: 'healthy',
                summary: expect.any(Object),
                services: {
                    'LocalStack': 'healthy',
                    'DynamoDB': 'healthy'
                }
            });
        });
    });

    describe('isSystemReady', () => {
        it('should return true when system is healthy', async () => {
            // Mock successful health check
            jest.spyOn(healthMonitor, 'performHealthCheck').mockResolvedValue({});
            jest.spyOn(healthMonitor, 'calculateOverallHealth').mockReturnValue('healthy');

            const result = await healthMonitor.isSystemReady();
            expect(result).toBe(true);
        });

        it('should return true when system is degraded', async () => {
            jest.spyOn(healthMonitor, 'performHealthCheck').mockResolvedValue({});
            jest.spyOn(healthMonitor, 'calculateOverallHealth').mockReturnValue('degraded');

            const result = await healthMonitor.isSystemReady();
            expect(result).toBe(true);
        });

        it('should return false when system is unhealthy', async () => {
            jest.spyOn(healthMonitor, 'performHealthCheck').mockResolvedValue({});
            jest.spyOn(healthMonitor, 'calculateOverallHealth').mockReturnValue('unhealthy');

            const result = await healthMonitor.isSystemReady();
            expect(result).toBe(false);
        });

        it('should return false when health check fails', async () => {
            jest.spyOn(healthMonitor, 'performHealthCheck').mockRejectedValue(new Error('Health check failed'));

            const result = await healthMonitor.isSystemReady();
            expect(result).toBe(false);
        });
    });

    describe('validateData', () => {
        beforeEach(() => {
            jest.spyOn(healthMonitor, 'validateCrossServiceConsistency').mockResolvedValue();
            jest.spyOn(healthMonitor, 'validateImageAccessibility').mockResolvedValue();
            jest.spyOn(healthMonitor, 'validateTestScenarioIntegrity').mockResolvedValue();
            
            healthMonitor.healthStatus.data = {
                crossServiceConsistency: { consistent: true },
                imageAccessibility: { accessibilityRate: '100.0' },
                scenarioIntegrity: { scenarios: {} }
            };
        });

        it('should validate all data types by default', async () => {
            const result = await healthMonitor.validateData();
            
            expect(result.type).toBe('all');
            expect(result.results.consistency).toBeDefined();
            expect(result.results.images).toBeDefined();
            expect(result.results.scenarios).toBeDefined();
            expect(healthMonitor.validateCrossServiceConsistency).toHaveBeenCalled();
            expect(healthMonitor.validateImageAccessibility).toHaveBeenCalled();
            expect(healthMonitor.validateTestScenarioIntegrity).toHaveBeenCalled();
        });

        it('should validate only consistency when type is consistency', async () => {
            const result = await healthMonitor.validateData('consistency');
            
            expect(result.type).toBe('consistency');
            expect(result.results.consistency).toBeDefined();
            expect(result.results.images).toBeUndefined();
            expect(healthMonitor.validateCrossServiceConsistency).toHaveBeenCalled();
            expect(healthMonitor.validateImageAccessibility).not.toHaveBeenCalled();
        });

        it('should validate only images when type is images', async () => {
            const result = await healthMonitor.validateData('images');
            
            expect(result.type).toBe('images');
            expect(result.results.images).toBeDefined();
            expect(result.results.consistency).toBeUndefined();
            expect(healthMonitor.validateImageAccessibility).toHaveBeenCalled();
            expect(healthMonitor.validateCrossServiceConsistency).not.toHaveBeenCalled();
        });

        it('should handle validation errors', async () => {
            healthMonitor.validateCrossServiceConsistency.mockRejectedValue(new Error('Validation failed'));

            await expect(healthMonitor.validateData('consistency')).rejects.toThrow('Validation failed');
        });
    });

    describe('checkAllServices', () => {
        beforeEach(() => {
            jest.spyOn(healthMonitor, 'checkServiceConnectivity').mockResolvedValue();
            jest.spyOn(healthMonitor, 'calculateServiceHealth').mockReturnValue('healthy');
            jest.spyOn(healthMonitor, 'generateServiceSummary').mockReturnValue({});
        });

        it('should check all services and return status', async () => {
            const result = await healthMonitor.checkAllServices();
            
            expect(result.timestamp).toBeDefined();
            expect(result.services).toBeDefined();
            expect(result.overall).toBe('healthy');
            expect(result.summary).toBeDefined();
            expect(healthMonitor.checkServiceConnectivity).toHaveBeenCalled();
        });

        it('should handle service check errors', async () => {
            healthMonitor.checkServiceConnectivity.mockRejectedValue(new Error('Service check failed'));

            await expect(healthMonitor.checkAllServices()).rejects.toThrow('Service check failed');
        });
    });

    describe('calculateServiceHealth', () => {
        it('should return healthy when all services are healthy', () => {
            healthMonitor.healthStatus.services = {
                'LocalStack': { status: 'healthy' },
                'DynamoDB': { status: 'healthy' }
            };

            const result = healthMonitor.calculateServiceHealth();
            expect(result).toBe('healthy');
        });

        it('should return degraded when some services are unhealthy', () => {
            healthMonitor.healthStatus.services = {
                'LocalStack': { status: 'healthy' },
                'DynamoDB': { status: 'unhealthy' },
                'S3': { status: 'healthy' }
            };

            const result = healthMonitor.calculateServiceHealth();
            expect(result).toBe('degraded');
        });

        it('should return unhealthy when most services are unhealthy', () => {
            healthMonitor.healthStatus.services = {
                'LocalStack': { status: 'unhealthy' },
                'DynamoDB': { status: 'unhealthy' },
                'S3': { status: 'healthy' }
            };

            const result = healthMonitor.calculateServiceHealth();
            expect(result).toBe('unhealthy');
        });

        it('should return unknown when no services are defined', () => {
            healthMonitor.healthStatus.services = {};

            const result = healthMonitor.calculateServiceHealth();
            expect(result).toBe('unknown');
        });
    });

    describe('generateServiceSummary', () => {
        it('should generate summary with service details', () => {
            healthMonitor.healthStatus.services = {
                'DynamoDB': {
                    status: 'healthy',
                    lastCheck: '2023-01-01T00:00:00.000Z',
                    details: {
                        tables: {
                            'test-table': { itemCount: 10 }
                        }
                    }
                },
                'S3': {
                    status: 'healthy',
                    lastCheck: '2023-01-01T00:00:00.000Z',
                    details: {
                        buckets: {
                            'test-bucket': { objectCount: 5 }
                        }
                    }
                },
                'OpenSearch': {
                    status: 'healthy',
                    lastCheck: '2023-01-01T00:00:00.000Z',
                    details: {
                        indices: {
                            'test-index': { docsCount: 15 }
                        }
                    }
                }
            };

            const result = healthMonitor.generateServiceSummary();
            
            expect(result.DynamoDB).toEqual({
                status: 'healthy',
                lastCheck: '2023-01-01T00:00:00.000Z',
                tableCount: 1,
                totalItems: 10
            });
            
            expect(result.S3).toEqual({
                status: 'healthy',
                lastCheck: '2023-01-01T00:00:00.000Z',
                bucketCount: 1,
                totalObjects: 5
            });
            
            expect(result.OpenSearch).toEqual({
                status: 'healthy',
                lastCheck: '2023-01-01T00:00:00.000Z',
                indexCount: 1,
                totalDocuments: 15
            });
        });
    });
});