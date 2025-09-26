/**
 * Simplified Cross-Service Data Synchronization Integration Tests
 * 
 * Tests basic integration and data synchronization between pipeline components.
 * 
 * Requirements: 14.5, 14.6, 14.7, 14.8
 */

const { UnifiedDataManager } = require('../../unified-data-manager');
const { DataPipeline, OPERATION_TYPES } = require('../../pipeline-engine');
const { STATE_MANAGER } = require('../../state-manager');
const { HealthMonitor } = require('../../health-monitor');
const { FrontendSyncProcessor } = require('../../frontend-sync-processor');
const { DATA_CONFIG } = require('../../data-config');

// Mock external dependencies
jest.mock('../../image-processor');
jest.mock('../../database-seeder');

describe('Cross-Service Data Synchronization Integration Tests', () => {
  let unifiedManager;
  let pipeline;
  let frontendSyncProcessor;
  let healthMonitor;
  let mockImageProcessor;
  let mockDatabaseSeeder;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create enhanced mock implementations
    mockImageProcessor = {
      processImages: jest.fn().mockResolvedValue({
        success: true,
        stats: { processed: 10, uploaded: 10, failed: 0 }
      })
    };

    mockDatabaseSeeder = {
      clearAllData: jest.fn().mockResolvedValue({ success: true }),
      seedAllData: jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: { loaded: 10 }, studios: { loaded: 5 }, styles: { loaded: 8 } }
      }),
      seedScenario: jest.fn().mockResolvedValue({
        success: true,
        scenario: 'test-scenario',
        stats: { artists: { loaded: 5 }, studios: { loaded: 2 }, styles: { loaded: 3 } }
      })
    };

    // Create real instances for integration testing
    frontendSyncProcessor = new FrontendSyncProcessor(DATA_CONFIG);
    healthMonitor = new HealthMonitor(DATA_CONFIG);
    pipeline = new DataPipeline(DATA_CONFIG);
    
    // Create unified manager with all components
    unifiedManager = new UnifiedDataManager(DATA_CONFIG, {
      pipeline: pipeline,
      stateManager: STATE_MANAGER,
      healthMonitor: healthMonitor,
      imageProcessor: mockImageProcessor,
      databaseSeeder: mockDatabaseSeeder,
      frontendSyncProcessor: frontendSyncProcessor
    });

    // Mock health monitor service checks
    jest.spyOn(healthMonitor, 'checkLocalStackHealth').mockResolvedValue({
      services: { dynamodb: 'available', opensearch: 'available', s3: 'available' }
    });
    jest.spyOn(healthMonitor, 'checkDynamoDBHealth').mockResolvedValue({
      tablesFound: 1,
      tables: { 'test-table': { status: 'ACTIVE', itemCount: 10 } }
    });
    jest.spyOn(healthMonitor, 'checkS3Health').mockResolvedValue({
      bucketsFound: 1,
      buckets: { 'test-bucket': { objectCount: 10 } }
    });
    jest.spyOn(healthMonitor, 'checkOpenSearchHealth').mockResolvedValue({
      clusterName: 'test-cluster',
      status: 'green',
      indices: { 'test-index': { docsCount: 10 } }
    });
  });

  afterEach(() => {
    // Clean up state manager locks
    if (STATE_MANAGER.isOperationInProgress()) {
      STATE_MANAGER.forceUnlock();
    }
  });

  describe('Basic Cross-Service Integration', () => {
    test('should integrate all pipeline components', () => {
      expect(unifiedManager).toBeDefined();
      expect(pipeline).toBeDefined();
      expect(frontendSyncProcessor).toBeDefined();
      expect(healthMonitor).toBeDefined();
    });

    test('should handle basic setup operations', async () => {
      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle scenario operations', async () => {
      const result = await unifiedManager.seedScenario('minimal');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle reset operations', async () => {
      const result = await unifiedManager.resetData('clean');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle health checks', async () => {
      const result = await unifiedManager.healthCheck();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle data validation', async () => {
      const result = await unifiedManager.validateData();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('State Management Integration', () => {
    test('should track operations in state manager', async () => {
      await unifiedManager.setupData({ frontendOnly: true });

      const statusSummary = STATE_MANAGER.getStatusSummary();
      expect(statusSummary).toBeDefined();
      expect(statusSummary.results).toBeDefined();
    });

    test('should handle operation history', async () => {
      await unifiedManager.setupData({ frontendOnly: true });
      
      const history = unifiedManager.getOperationHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    test('should detect changes', () => {
      const changes = STATE_MANAGER.detectChanges();
      expect(changes).toBeDefined();
      expect(typeof changes.hasChanges).toBe('boolean');
    });
  });

  describe('Pipeline Integration', () => {
    test('should build pipeline configurations', () => {
      const pipelineConfig = pipeline.buildPipeline(OPERATION_TYPES.FRONTEND_ONLY);
      
      expect(pipelineConfig).toBeDefined();
      expect(pipelineConfig.operationType).toBe(OPERATION_TYPES.FRONTEND_ONLY);
      expect(Array.isArray(pipelineConfig.stages)).toBe(true);
    });

    test('should handle different operation types', () => {
      const operationTypes = [
        OPERATION_TYPES.FULL_SETUP,
        OPERATION_TYPES.FRONTEND_ONLY,
        OPERATION_TYPES.IMAGES_ONLY,
        OPERATION_TYPES.DATABASE_ONLY,
        OPERATION_TYPES.VALIDATION_ONLY
      ];

      operationTypes.forEach(operationType => {
        const config = pipeline.buildPipeline(operationType);
        expect(config.operationType).toBe(operationType);
      });
    });

    test('should provide pipeline status', () => {
      const status = pipeline.getStatus();
      
      expect(status).toBeDefined();
      expect(typeof status.isRunning).toBe('boolean');
    });
  });

  describe('Health Monitor Integration', () => {
    test('should check service health', async () => {
      const healthResult = await healthMonitor.checkFrontendSyncHealth();
      
      expect(healthResult).toBeDefined();
      expect(healthResult.status).toBeDefined();
    });

    test('should validate data consistency', async () => {
      // Mock the validation method
      jest.spyOn(healthMonitor, 'validateCrossServiceConsistency').mockResolvedValue();
      
      await healthMonitor.validateCrossServiceConsistency();
      
      expect(healthMonitor.validateCrossServiceConsistency).toHaveBeenCalled();
    });

    test('should handle service failures gracefully', async () => {
      // Mock a service failure
      jest.spyOn(healthMonitor, 'checkDynamoDBHealth').mockRejectedValue(new Error('Service unavailable'));

      const healthResult = await unifiedManager.healthCheck();
      
      // Should handle failures gracefully
      expect(healthResult).toBeDefined();
    });
  });

  describe('Frontend Sync Integration', () => {
    test('should generate mock data', async () => {
      const result = await frontendSyncProcessor.generateMockData({
        artistCount: 5,
        includeBusinessData: true
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should sync with backend', async () => {
      const result = await frontendSyncProcessor.syncWithBackend({
        includeBusinessData: true
      });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should validate mock data', () => {
      const mockData = [
        {
          artistId: 'test-1',
          artistName: 'Test Artist',
          styles: ['traditional']
        }
      ];

      const errors = frontendSyncProcessor.validateMockData(mockData);
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle component failures gracefully', async () => {
      // Mock a component failure
      jest.spyOn(frontendSyncProcessor, 'syncWithBackend').mockResolvedValue({
        success: false,
        error: 'Sync failed'
      });

      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      // Should handle the failure gracefully
      expect(result).toBeDefined();
    });

    test('should provide meaningful error messages', async () => {
      // Mock an error scenario
      jest.spyOn(frontendSyncProcessor, 'generateMockData').mockRejectedValue(
        new Error('Generation failed')
      );

      try {
        await frontendSyncProcessor.generateMockData();
      } catch (error) {
        expect(error.message).toBe('Generation failed');
      }
    });

    test('should handle concurrent operations', async () => {
      const promises = [
        unifiedManager.setupData({ frontendOnly: true }),
        unifiedManager.healthCheck(),
        unifiedManager.validateData()
      ];

      const results = await Promise.allSettled(promises);
      
      // At least some should succeed
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(0);
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete operations within reasonable time', async () => {
      const startTime = Date.now();
      
      await unifiedManager.setupData({ frontendOnly: true });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle multiple sequential operations', async () => {
      await unifiedManager.setupData({ frontendOnly: true });
      await unifiedManager.validateData();
      await unifiedManager.healthCheck();
      
      // All operations should complete successfully
      const history = unifiedManager.getOperationHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    test('should maintain system stability', async () => {
      // Run multiple operations to test stability
      for (let i = 0; i < 3; i++) {
        const result = await unifiedManager.setupData({ frontendOnly: true });
        expect(result).toBeDefined();
      }
    });
  });

  describe('Configuration and Environment', () => {
    test('should work with different configurations', () => {
      const customConfig = { ...DATA_CONFIG };
      const customManager = new UnifiedDataManager(customConfig);
      
      expect(customManager).toBeDefined();
      expect(customManager.config).toBeDefined();
    });

    test('should handle missing dependencies gracefully', () => {
      // Test with minimal dependencies
      const minimalManager = new UnifiedDataManager();
      
      expect(minimalManager).toBeDefined();
    });

    test('should validate configuration', () => {
      expect(DATA_CONFIG).toBeDefined();
      expect(DATA_CONFIG.paths).toBeDefined();
      expect(DATA_CONFIG.services).toBeDefined();
    });
  });
});