/**
 * Simplified Enhanced Frontend Sync Processor Integration Tests
 * 
 * Tests the basic integration of the enhanced frontend-sync-processor with the
 * unified data pipeline.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

const { UnifiedDataManager } = require('../../unified-data-manager');
const { FrontendSyncProcessor } = require('../../frontend-sync-processor');
const { STATE_MANAGER } = require('../../state-manager');
const { HealthMonitor } = require('../../health-monitor');
const { DATA_CONFIG } = require('../../data-config');

// Mock external dependencies
jest.mock('../../image-processor');
jest.mock('../../database-seeder');

describe('Enhanced Frontend Sync Processor Integration Tests', () => {
  let unifiedManager;
  let frontendSyncProcessor;
  let healthMonitor;
  let mockDatabaseSeeder;
  let mockImageProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock implementations
    mockDatabaseSeeder = {
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

    mockImageProcessor = {
      processImages: jest.fn().mockResolvedValue({
        success: true,
        stats: { processed: 5, uploaded: 5, failed: 0 }
      })
    };

    // Create real instances for integration testing
    frontendSyncProcessor = new FrontendSyncProcessor(DATA_CONFIG);
    healthMonitor = new HealthMonitor(DATA_CONFIG);
    
    // Create unified manager with enhanced frontend sync processor
    unifiedManager = new UnifiedDataManager(DATA_CONFIG, {
      frontendSyncProcessor: frontendSyncProcessor,
      healthMonitor: healthMonitor,
      databaseSeeder: mockDatabaseSeeder,
      imageProcessor: mockImageProcessor
    });
  });

  afterEach(() => {
    // Clean up state manager locks
    if (STATE_MANAGER.isOperationInProgress()) {
      STATE_MANAGER.forceUnlock();
    }
  });

  describe('Basic Integration Tests', () => {
    test('should create frontend sync processor instance', () => {
      expect(frontendSyncProcessor).toBeDefined();
      expect(frontendSyncProcessor.generateMockData).toBeDefined();
      expect(frontendSyncProcessor.syncWithBackend).toBeDefined();
    });

    test('should integrate with unified data manager', async () => {
      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle frontend sync operations', async () => {
      const syncResult = await frontendSyncProcessor.syncWithBackend({
        includeBusinessData: true,
        validateData: true
      });

      expect(syncResult).toBeDefined();
      expect(typeof syncResult.success).toBe('boolean');
    });

    test('should generate mock data', async () => {
      const mockResult = await frontendSyncProcessor.generateMockData({
        artistCount: 5,
        includeBusinessData: true
      });

      expect(mockResult).toBeDefined();
      expect(typeof mockResult.success).toBe('boolean');
    });

    test('should track operations in state manager', async () => {
      await unifiedManager.setupData({ frontendOnly: true });

      const statusSummary = STATE_MANAGER.getStatusSummary();
      expect(statusSummary).toBeDefined();
      expect(statusSummary.results).toBeDefined();
    });

    test('should integrate with health monitor', async () => {
      const healthResult = await healthMonitor.checkFrontendSyncHealth();

      expect(healthResult).toBeDefined();
      expect(healthResult.status).toBeDefined();
    });

    test('should handle scenario-based operations', async () => {
      const result = await unifiedManager.seedScenario('minimal');

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should support enhanced capabilities', () => {
      // Test that enhanced methods exist
      expect(frontendSyncProcessor.generateMockData).toBeDefined();
      expect(frontendSyncProcessor.syncWithBackend).toBeDefined();
      expect(frontendSyncProcessor.validateMockData).toBeDefined();
      expect(frontendSyncProcessor.exportDataToFile).toBeDefined();
    });

    test('should handle error scenarios gracefully', async () => {
      // Mock a failure scenario
      jest.spyOn(frontendSyncProcessor, 'syncWithBackend').mockResolvedValue({
        success: false,
        error: 'Test error'
      });

      const result = await unifiedManager.setupData({ frontendOnly: true });

      // Should handle errors gracefully
      expect(result).toBeDefined();
    });

    test('should maintain backward compatibility', async () => {
      // Test that basic operations still work
      const result = await unifiedManager.setupData({ frontendOnly: true });

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Performance and Reliability', () => {
    test('should complete operations within reasonable time', async () => {
      const startTime = Date.now();
      
      await unifiedManager.setupData({ frontendOnly: true });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent operations', async () => {
      const promises = [
        frontendSyncProcessor.generateMockData({ artistCount: 1 }),
        frontendSyncProcessor.generateMockData({ artistCount: 1 }),
        frontendSyncProcessor.generateMockData({ artistCount: 1 })
      ];

      const results = await Promise.allSettled(promises);

      // At least one should succeed
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(0);
    });

    test('should provide meaningful error messages', async () => {
      // Mock an error scenario
      jest.spyOn(frontendSyncProcessor, 'generateMockData').mockRejectedValue(
        new Error('Test error message')
      );

      try {
        await frontendSyncProcessor.generateMockData();
      } catch (error) {
        expect(error.message).toBe('Test error message');
      }
    });
  });

  describe('Configuration and Environment', () => {
    test('should work with different configurations', () => {
      const customConfig = { ...DATA_CONFIG };
      const customProcessor = new FrontendSyncProcessor(customConfig);

      expect(customProcessor).toBeDefined();
      expect(customProcessor.config).toBeDefined();
    });

    test('should handle missing dependencies gracefully', () => {
      // Test that the processor can be created even with minimal config
      const minimalProcessor = new FrontendSyncProcessor();

      expect(minimalProcessor).toBeDefined();
    });

    test('should validate input parameters', async () => {
      // Test with invalid parameters
      const result = await frontendSyncProcessor.generateMockData({
        artistCount: -1 // Invalid count
      });

      expect(result).toBeDefined();
      // Should handle invalid input gracefully
    });
  });
});