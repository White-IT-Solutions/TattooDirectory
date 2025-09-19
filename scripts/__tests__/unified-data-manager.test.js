/**
 * Unit Tests for UnifiedDataManager
 * 
 * Comprehensive test suite for the main orchestration class covering all
 * core operations, validation methods, and error handling scenarios.
 */

const { UnifiedDataManager } = require('../unified-data-manager');

// Mock all dependencies
jest.mock('../pipeline-engine');
jest.mock('../state-manager');
jest.mock('../health-monitor');
jest.mock('../image-processor');
jest.mock('../database-seeder');
jest.mock('../frontend-sync-processor');

describe('UnifiedDataManager', () => {
  let manager;
  let mockPipeline, mockStateManager, mockHealthMonitor;
  let mockImageProcessor, mockDatabaseSeeder, mockFrontendSyncProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock objects
    mockPipeline = {
      buildPipeline: jest.fn(),
      executePipeline: jest.fn(),
      getStatus: jest.fn().mockReturnValue({
        isRunning: false,
        lastExecution: null
      })
    };

    mockStateManager = {
      startOperation: jest.fn().mockReturnValue('test-operation-id'),
      endOperation: jest.fn().mockReturnValue(true),
      forceUnlock: jest.fn(),
      getStatusSummary: jest.fn().mockReturnValue({
        lastOperation: 'setup',
        lastScenario: 'test-scenario'
      })
    };

    mockHealthMonitor = {
      validateData: jest.fn().mockResolvedValue({
        isValid: true,
        summary: 'All data valid',
        results: {},
        timestamp: new Date().toISOString(),
        errors: []
      }),
      checkAllServices: jest.fn().mockResolvedValue({
        overall: 'healthy',
        services: { dynamodb: 'healthy', opensearch: 'healthy' }
      }),
      performHealthCheck: jest.fn().mockResolvedValue({
        overall: 'healthy',
        services: {
          LocalStack: { status: 'healthy' },
          DynamoDB: { status: 'healthy' },
          OpenSearch: { status: 'healthy' },
          S3: { status: 'healthy' }
        },
        data: { crossServiceConsistency: { consistent: true } }
      }),
      isSystemReady: jest.fn().mockResolvedValue(true)
    };

    mockImageProcessor = {
      processImages: jest.fn()
    };

    mockDatabaseSeeder = {
      clearAllData: jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      }),
      seedAllData: jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 10, studios: 5, styles: 8 }
      }),
      seedScenario: jest.fn().mockResolvedValue({
        success: true,
        scenario: 'test-scenario',
        stats: { artists: 5, studios: 2, styles: 3 }
      })
    };

    mockFrontendSyncProcessor = {
      processFrontendOnly: jest.fn().mockResolvedValue({
        success: true,
        stats: { mockArtistsGenerated: 5 }
      }),
      syncWithBackend: jest.fn().mockResolvedValue({
        success: true,
        stats: { artistsUpdated: 5 }
      })
    };
    
    // Create mock config with required methods
    const mockConfig = {
      getScenarioConfig: jest.fn().mockReturnValue({
        description: 'Test scenario description',
        artistCount: 5
      }),
      getResetStateConfig: jest.fn().mockReturnValue({
        description: 'Test reset state',
        clearAll: true
      }),
      getAvailableScenarios: jest.fn().mockReturnValue(['test-scenario']),
      getAvailableResetStates: jest.fn().mockReturnValue(['clean', 'fresh'])
    };
    
    // Create manager with dependency injection for better testability
    manager = new UnifiedDataManager(mockConfig, {
      pipeline: mockPipeline,
      stateManager: mockStateManager,
      healthMonitor: mockHealthMonitor,
      imageProcessor: mockImageProcessor,
      databaseSeeder: mockDatabaseSeeder,
      frontendSyncProcessor: mockFrontendSyncProcessor
    });
  });

  describe('Constructor', () => {
    test('should initialize with default config', () => {
      const defaultManager = new UnifiedDataManager();
      expect(defaultManager).toBeInstanceOf(UnifiedDataManager);
    });

    test('should initialize with custom config', () => {
      const customConfig = { test: 'config' };
      const customManager = new UnifiedDataManager(customConfig);
      expect(customManager.config).toEqual(customConfig);
    });

    test('should initialize with dependency injection', () => {
      expect(manager.databaseSeeder).toBe(mockDatabaseSeeder);
      expect(manager.healthMonitor).toBe(mockHealthMonitor);
      expect(manager.frontendSyncProcessor).toBe(mockFrontendSyncProcessor);
    });
  });

  describe('seedScenario', () => {
    test('should seed scenario successfully', async () => {
      const result = await manager.seedScenario('test-scenario');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('test-scenario');
      expect(mockDatabaseSeeder.seedScenario).toHaveBeenCalledWith('test-scenario');
      expect(mockFrontendSyncProcessor.syncWithBackend).toHaveBeenCalled();
    });

    test('should handle seeding errors', async () => {
      mockDatabaseSeeder.seedScenario.mockResolvedValue({
        success: false,
        error: 'Seeding failed'
      });

      const result = await manager.seedScenario('test-scenario');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Seeding failed');
    });
  });

  describe('resetData', () => {
    test('should reset data successfully', async () => {
      const result = await manager.resetData('clean');

      expect(result.success).toBe(true);
      expect(mockDatabaseSeeder.clearAllData).toHaveBeenCalled();
    });
  });

  describe('validateData', () => {
    test('should validate data successfully', async () => {
      const result = await manager.validateData();

      expect(result.success).toBe(true);
      expect(result.type).toBe('all');
      expect(mockHealthMonitor.validateData).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    test('should perform health check successfully', async () => {
      const result = await manager.healthCheck();

      expect(result.overall).toBe('healthy');
      expect(mockHealthMonitor.checkAllServices).toHaveBeenCalled();
    });
  });

  describe('getDataStatus', () => {
    test('should get data status successfully', async () => {
      const result = await manager.getDataStatus();

      expect(result.success).toBe(true);
      expect(mockHealthMonitor.performHealthCheck).toHaveBeenCalled();
    });
  });
});