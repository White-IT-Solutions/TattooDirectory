#!/usr/bin/env node

/**
 * Unit Tests for DatabaseSeeder Class
 * 
 * Comprehensive test suite for database seeding functionality including
 * DynamoDB operations, OpenSearch indexing, and scenario-based seeding.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSeeder, TEST_SCENARIOS } = require('../database-seeder');
const { DATA_CONFIG } = require('../data-config');

// Mock AWS SDK
const mockDynamoDB = {
  put: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue() }),
  scan: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Items: [], Count: 0 }) }),
  batchWrite: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue() })
};

const mockDynamoDBClient = {
  describeTable: jest.fn().mockReturnValue({ promise: jest.fn().mockResolvedValue({ Table: { TableStatus: 'ACTIVE' } }) })
};

jest.mock('aws-sdk', () => ({
  DynamoDB: jest.fn(() => mockDynamoDBClient),
  config: {
    update: jest.fn()
  }
}));

// Add DocumentClient after creating the mock
const AWS = require('aws-sdk');
AWS.DynamoDB.DocumentClient = jest.fn(() => mockDynamoDB);

// Mock HTTP requests for OpenSearch
jest.mock('http');

// Mock file system operations
jest.mock('fs');

// Mock state manager
jest.mock('../state-manager', () => ({
  STATE_MANAGER: {
    detectChanges: jest.fn()
  }
}));

// Mock validator
jest.mock('../data-seeder/simple-validator', () => ({
  validateArtistData: jest.fn(() => []),
  validateStudioData: jest.fn(() => []),
  validateStyleData: jest.fn(() => [])
}));

const { validateArtistData, validateStudioData, validateStyleData } = require('../data-seeder/simple-validator');

describe('DatabaseSeeder', () => {
  let seeder;
  let mockConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock configuration
    mockConfig = {
      services: {
        aws: {
          region: 'eu-west-2',
          endpoint: 'http://localhost:4566',
          accessKeyId: 'test',
          secretAccessKey: 'test'
        },
        dynamodb: {
          tableName: 'test-table'
        },
        opensearch: {
          indexName: 'test-index'
        }
      },
      paths: {
        testDataDir: '/test/data'
      },
      environment: {
        isDocker: false
      }
    };
    
    seeder = new DatabaseSeeder(mockConfig);
    
    // Mock file system
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify([
      { artistId: 'artist-001', artistName: 'Test Artist' }
    ]));
  });

  describe('Constructor', () => {
    test('should initialize with default config', () => {
      const defaultSeeder = new DatabaseSeeder();
      expect(defaultSeeder.config).toBeDefined();
      expect(defaultSeeder.tableName).toBe(DATA_CONFIG.services.dynamodb.tableName);
    });

    test('should initialize with custom config', () => {
      expect(seeder.tableName).toBe('test-table');
      expect(seeder.opensearchIndex).toBe('test-index');
    });

    test('should initialize statistics', () => {
      expect(seeder.stats).toEqual({
        artists: { loaded: 0, failed: 0 },
        studios: { loaded: 0, failed: 0 },
        styles: { loaded: 0, failed: 0 },
        opensearch: { indexed: 0, failed: 0 },
        errors: []
      });
    });
  });

  describe('loadTestData', () => {
    test('should load test data successfully', async () => {
      const mockData = [{ id: 'test', name: 'Test Item' }];
      fs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const result = await seeder.loadTestData('test.json');
      
      expect(result).toEqual(mockData);
      // Check that readFileSync was called with the correct path (cross-platform)
      const calls = fs.readFileSync.mock.calls;
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toMatch(/test[\/\\]data[\/\\]test\.json$/);
      expect(calls[0][1]).toBe('utf8');
    });

    test('should throw error if file does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(seeder.loadTestData('missing.json'))
        .rejects.toThrow('Test data file not found');
    });

    test('should throw error if JSON is invalid', async () => {
      fs.readFileSync.mockReturnValue('invalid json');

      await expect(seeder.loadTestData('invalid.json'))
        .rejects.toThrow('Failed to parse invalid.json');
    });
  });

  describe('loadAllTestData', () => {
    test('should load all data types', async () => {
      const mockArtists = [{ artistId: 'artist-001' }];
      const mockStudios = [{ studioId: 'studio-001' }];
      const mockStyles = [{ styleId: 'traditional' }];

      fs.readFileSync
        .mockReturnValueOnce(JSON.stringify(mockArtists))
        .mockReturnValueOnce(JSON.stringify(mockStudios))
        .mockReturnValueOnce(JSON.stringify(mockStyles));

      await seeder.loadAllTestData();

      expect(seeder.allData.artists).toEqual(mockArtists);
      expect(seeder.allData.studios).toEqual(mockStudios);
      expect(seeder.allData.styles).toEqual(mockStyles);
    });

    test('should handle missing data files gracefully', async () => {
      fs.existsSync.mockReturnValue(false);

      await seeder.loadAllTestData();

      expect(seeder.stats.errors.length).toBeGreaterThan(0);
      expect(seeder.stats.errors[0].type).toBe('data_loading_error');
    });
  });

  describe('filterDataForScenario', () => {
    beforeEach(() => {
      seeder.allData = {
        artists: [
          { artistId: 'artist-001', styles: ['traditional'], locationDisplay: 'London' },
          { artistId: 'artist-002', styles: ['realism'], locationDisplay: 'Manchester' },
          { artistId: 'artist-003', styles: ['traditional', 'realism'], locationDisplay: 'London' }
        ],
        studios: [
          { studioId: 'studio-001' },
          { studioId: 'studio-002' }
        ],
        styles: [
          { styleId: 'traditional' },
          { styleId: 'realism' }
        ]
      };
    });

    test('should return full dataset for loadAll scenario', () => {
      const scenario = { loadAll: true };
      const result = seeder.filterDataForScenario(scenario);

      expect(result.artists).toHaveLength(3);
      expect(result.studios).toHaveLength(2);
      expect(result.styles).toHaveLength(2);
    });

    test('should filter by specific IDs', () => {
      const scenario = {
        artists: ['artist-001'],
        studios: ['studio-001'],
        styles: ['traditional']
      };
      const result = seeder.filterDataForScenario(scenario);

      expect(result.artists).toHaveLength(1);
      expect(result.artists[0].artistId).toBe('artist-001');
      expect(result.studios).toHaveLength(1);
      expect(result.styles).toHaveLength(1);
    });

    test('should filter by custom filter function', () => {
      const scenario = {
        filter: (artist) => artist.locationDisplay.includes('London'),
        minItems: 2
      };
      const result = seeder.filterDataForScenario(scenario);

      expect(result.artists).toHaveLength(2);
      expect(result.artists.every(a => a.locationDisplay.includes('London'))).toBe(true);
    });

    test('should ensure minimum items when filter returns fewer', () => {
      const scenario = {
        filter: (artist) => artist.artistId === 'artist-001',
        minItems: 2
      };
      const result = seeder.filterDataForScenario(scenario);

      expect(result.artists).toHaveLength(2);
    });
  });

  describe('ensurePricingVariety', () => {
    test('should add pricing to artists without it', () => {
      const artists = [
        { artistId: 'artist-001' },
        { artistId: 'artist-002' }
      ];

      seeder.ensurePricingVariety(artists);

      expect(artists[0].pricing).toBeDefined();
      expect(artists[0].pricing.currency).toBe('GBP');
      expect(artists[0].pricing.hourlyRate).toBeDefined();
      expect(artists[1].pricing).toBeDefined();
    });

    test('should not override existing pricing', () => {
      const artists = [
        { artistId: 'artist-001', pricing: { hourlyRate: 300, currency: 'GBP' } }
      ];

      seeder.ensurePricingVariety(artists);

      expect(artists[0].pricing.hourlyRate).toBe(300);
    });
  });

  describe('seedArtists', () => {
    test('should seed valid artists successfully', async () => {
      const artists = [
        { artistId: 'artist-001', artistName: 'Test Artist', styles: ['traditional'] }
      ];

      mockDynamoDB.put.mockReturnValue({
        promise: () => Promise.resolve()
      });

      await seeder.seedArtists(artists);

      expect(mockDynamoDB.put).toHaveBeenCalledWith({
        TableName: 'test-table',
        Item: expect.objectContaining({
          PK: 'ARTIST#artist-001',
          SK: 'PROFILE',
          artistId: 'artist-001'
        })
      });
      expect(seeder.stats.artists.loaded).toBe(1);
    });

    test('should handle validation errors', async () => {
      const artists = [
        { artistId: 'invalid-artist' }
      ];

      validateArtistData.mockReturnValue(['Missing required field']);

      await seeder.seedArtists(artists);

      expect(seeder.stats.artists.failed).toBe(1);
      expect(seeder.stats.errors).toHaveLength(1);
      expect(seeder.stats.errors[0].type).toBe('validation_error');
    });

    test('should handle DynamoDB errors', async () => {
      // Provide a fully valid artist to avoid validation errors
      const artists = [
        { 
          artistId: 'artist-001', 
          artistName: 'Test Artist', 
          styles: ['traditional'],
          studioName: 'Test Studio',
          location: { city: 'London', postcode: 'SW1A 1AA' },
          portfolioImages: ['image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg', 'image5.jpg'],
          contactMethods: [{ type: 'instagram', value: '@testartist' }]
        }
      ];

      // Mock validation to pass
      validateArtistData.mockReturnValue([]);

      mockDynamoDB.put.mockReturnValue({
        promise: () => Promise.reject(new Error('DynamoDB error'))
      });

      await seeder.seedArtists(artists);

      expect(seeder.stats.artists.failed).toBe(1);
      expect(seeder.stats.errors).toHaveLength(1);
      expect(seeder.stats.errors[0].type).toBe('seeding_error');
    });
  });

  describe('seedStudios', () => {
    test('should seed valid studios successfully', async () => {
      const studios = [
        { studioId: 'studio-001', studioName: 'Test Studio' }
      ];

      mockDynamoDB.put.mockReturnValue({
        promise: () => Promise.resolve()
      });

      await seeder.seedStudios(studios);

      expect(mockDynamoDB.put).toHaveBeenCalledWith({
        TableName: 'test-table',
        Item: expect.objectContaining({
          PK: 'STUDIO#studio-001',
          SK: 'PROFILE',
          studioId: 'studio-001'
        })
      });
      expect(seeder.stats.studios.loaded).toBe(1);
    });
  });

  describe('seedStyles', () => {
    test('should seed valid styles successfully', async () => {
      const styles = [
        { styleId: 'traditional', styleName: 'Traditional' }
      ];

      mockDynamoDB.put.mockReturnValue({
        promise: () => Promise.resolve()
      });

      await seeder.seedStyles(styles);

      expect(mockDynamoDB.put).toHaveBeenCalledWith({
        TableName: 'test-table',
        Item: expect.objectContaining({
          PK: 'STYLE#traditional',
          SK: 'METADATA',
          styleId: 'traditional'
        })
      });
      expect(seeder.stats.styles.loaded).toBe(1);
    });
  });

  describe('makeOpenSearchRequest', () => {
    test('should make HTTP request to OpenSearch', async () => {
      const mockRequest = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      const mockResponse = {
        statusCode: 200,
        on: jest.fn()
      };

      const http = require('http');
      http.request.mockImplementation((options, callback) => {
        // Simulate successful response
        setTimeout(() => {
          callback(mockResponse);
          // Simulate data event
          const dataHandler = mockResponse.on.mock.calls.find(call => call[0] === 'data')[1];
          dataHandler('{"result": "success"}');
          // Simulate end event
          const endHandler = mockResponse.on.mock.calls.find(call => call[0] === 'end')[1];
          endHandler();
        }, 0);
        return mockRequest;
      });

      const result = await seeder.makeOpenSearchRequest('GET', '/test');
      expect(result).toEqual({ result: 'success' });
    });
  });

  describe('clearAllData', () => {
    test('should clear DynamoDB and OpenSearch data', async () => {
      mockDynamoDB.scan.mockReturnValue({
        promise: () => Promise.resolve({
          Items: [
            { PK: 'ARTIST#001', SK: 'PROFILE' },
            { PK: 'STUDIO#001', SK: 'PROFILE' }
          ]
        })
      });

      mockDynamoDB.batchWrite.mockReturnValue({
        promise: () => Promise.resolve()
      });

      // Mock OpenSearch request
      seeder.makeOpenSearchRequest = jest.fn().mockResolvedValue();

      const result = await seeder.clearAllData();

      expect(result.success).toBe(true);
      expect(mockDynamoDB.scan).toHaveBeenCalled();
      expect(mockDynamoDB.batchWrite).toHaveBeenCalled();
    });
  });

  describe('validateSeededData', () => {
    test('should validate data counts', async () => {
      mockDynamoDB.scan.mockReturnValue({
        promise: () => Promise.resolve({ Count: 10 })
      });

      seeder.makeOpenSearchRequest = jest.fn().mockResolvedValue({ count: 8 });

      const result = await seeder.validateSeededData();

      expect(result.dynamodb).toBe(10);
      expect(result.opensearch).toBe(8);
      expect(result.consistent).toBe(true);
    });
  });

  describe('seedScenario', () => {
    test('should seed a valid scenario', async () => {
      seeder.loadAllTestData = jest.fn().mockResolvedValue();
      seeder.filterDataForScenario = jest.fn().mockReturnValue({
        artists: [{ artistId: 'artist-001' }],
        studios: [{ studioId: 'studio-001' }],
        styles: [{ styleId: 'traditional' }]
      });
      seeder.setupOpenSearchIndex = jest.fn().mockResolvedValue();
      seeder.seedStyles = jest.fn().mockResolvedValue();
      seeder.seedStudios = jest.fn().mockResolvedValue();
      seeder.seedArtists = jest.fn().mockResolvedValue();
      seeder.indexArtistsInOpenSearch = jest.fn().mockResolvedValue();

      const result = await seeder.seedScenario('minimal');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('minimal');
      expect(seeder.seedStyles).toHaveBeenCalled();
      expect(seeder.seedStudios).toHaveBeenCalled();
      expect(seeder.seedArtists).toHaveBeenCalled();
    });

    test('should throw error for unknown scenario', async () => {
      await expect(seeder.seedScenario('unknown-scenario'))
        .rejects.toThrow('Unknown scenario: unknown-scenario');
    });
  });

  describe('getAvailableScenarios', () => {
    test('should return all available scenarios', () => {
      const scenarios = seeder.getAvailableScenarios();

      expect(scenarios).toHaveLength(Object.keys(TEST_SCENARIOS).length);
      expect(scenarios[0]).toHaveProperty('name');
      expect(scenarios[0]).toHaveProperty('description');
    });
  });

  describe('Statistics Management', () => {
    test('should track processing statistics', () => {
      seeder.stats.artists.loaded = 5;
      seeder.stats.studios.loaded = 3;

      const stats = seeder.getStats();
      expect(stats.artists.loaded).toBe(5);
      expect(stats.studios.loaded).toBe(3);
    });

    test('should reset statistics', () => {
      seeder.stats.artists.loaded = 5;
      seeder.resetStats();

      expect(seeder.stats.artists.loaded).toBe(0);
      expect(seeder.stats.errors).toHaveLength(0);
    });
  });

  describe('TEST_SCENARIOS', () => {
    test('should include all expected scenarios', () => {
      const expectedScenarios = [
        'minimal', 'search-basic', 'london-artists', 'high-rated',
        'new-artists', 'booking-available', 'portfolio-rich',
        'multi-style', 'pricing-range', 'full-dataset'
      ];

      expectedScenarios.forEach(scenario => {
        expect(TEST_SCENARIOS).toHaveProperty(scenario);
        expect(TEST_SCENARIOS[scenario]).toHaveProperty('description');
      });
    });

    test('should have proper scenario structure', () => {
      expect(TEST_SCENARIOS.minimal).toHaveProperty('artists');
      expect(TEST_SCENARIOS.minimal).toHaveProperty('studios');
      expect(TEST_SCENARIOS.minimal).toHaveProperty('styles');

      expect(TEST_SCENARIOS['london-artists']).toHaveProperty('filter');
      expect(TEST_SCENARIOS['london-artists']).toHaveProperty('minItems');

      expect(TEST_SCENARIOS['full-dataset']).toHaveProperty('loadAll');
    });
  });

  describe('Error Handling', () => {
    test('should handle service timeout errors', async () => {
      mockDynamoDBClient.describeTable.mockReturnValue({
        promise: () => Promise.reject(new Error('Timeout'))
      });

      // Mock the sleep function to avoid actual delays
      const originalSleep = seeder.sleep;
      seeder.sleep = jest.fn().mockResolvedValue();

      await expect(seeder.waitForDynamoDB()).rejects.toThrow('DynamoDB not ready');
      
      // Restore original sleep function
      seeder.sleep = originalSleep;
    }, 5000); // Reduce timeout to 5 seconds

    test('should collect and report errors', async () => {
      const artists = [{ artistId: 'invalid' }];
      validateArtistData.mockReturnValue(['Validation error']);

      await seeder.seedArtists(artists);

      expect(seeder.stats.errors).toHaveLength(1);
      expect(seeder.stats.errors[0]).toMatchObject({
        type: 'validation_error',
        dataType: 'artist',
        id: 'invalid'
      });
    });
  });
});