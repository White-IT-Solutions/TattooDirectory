/**
 * Integration Tests for Setup Data Workflow
 * 
 * Tests the complete end-to-end setup-data workflow including:
 * - Full setup with all components
 * - Frontend-only mode
 * - Images-only mode
 * - Error handling and recovery
 */

const { createMockUnifiedDataManager } = require('../test-factories');

describe('Setup Data Workflow Integration Tests', () => {
  let dataManager;

  beforeEach(() => {
    dataManager = createMockUnifiedDataManager();
    jest.clearAllMocks();
  });

  describe('Complete Setup Data Workflow', () => {
    test('should execute full setup-data workflow successfully', async () => {
      // Mock successful operations
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: true,
        imageUrls: { traditional: ['image1.jpg'], realism: ['image2.jpg'] },
        stats: { processed: 2, failed: 0 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 2 }
      });
      dataManager.frontendSyncProcessor.syncWithBackend = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 5
      });

      const result = await dataManager.setupData();

      expect(result.success).toBe(true);
      expect(result.operations).toContain('images');
      expect(result.operations).toContain('database');
      expect(result.operations).toContain('frontend');
      expect(dataManager.healthMonitor.isSystemReady).toHaveBeenCalled();
      expect(dataManager.imageProcessor.processImages).toHaveBeenCalled();
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalled();
      expect(dataManager.frontendSyncProcessor.syncWithBackend).toHaveBeenCalled();
    });

    test('should handle system not ready gracefully', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(false);

      const result = await dataManager.setupData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('System not ready');
      expect(dataManager.imageProcessor.processImages).not.toHaveBeenCalled();
    });

    test('should handle partial failures and continue', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: false,
        error: 'Image processing failed'
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 2 }
      });
      dataManager.frontendSyncProcessor.syncWithBackend = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 5
      });

      const result = await dataManager.setupData();

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('Image processing failed');
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalled();
      expect(dataManager.frontendSyncProcessor.syncWithBackend).toHaveBeenCalled();
    });
  });

  describe('Frontend-Only Mode Workflow', () => {
    test('should execute frontend-only setup successfully', async () => {
      dataManager.frontendSyncProcessor.processFrontendOnly = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 5,
        mockDataGenerated: true
      });

      const result = await dataManager.setupData({ frontendOnly: true });

      expect(result.success).toBe(true);
      expect(result.operations).toEqual(['frontend']);
      expect(dataManager.frontendSyncProcessor.processFrontendOnly).toHaveBeenCalled();
      expect(dataManager.imageProcessor.processImages).not.toHaveBeenCalled();
      expect(dataManager.databaseSeeder.seedScenario).not.toHaveBeenCalled();
    });

    test('should handle frontend-only mode failures', async () => {
      dataManager.frontendSyncProcessor.processFrontendOnly = jest.fn().mockResolvedValue({
        success: false,
        error: 'Frontend processing failed'
      });

      const result = await dataManager.setupData({ frontendOnly: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Frontend processing failed');
    });
  });

  describe('Images-Only Mode Workflow', () => {
    test('should execute images-only setup successfully', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: true,
        imageUrls: { traditional: ['image1.jpg'], realism: ['image2.jpg'] },
        stats: { processed: 2, failed: 0 }
      });

      const result = await dataManager.setupData({ imagesOnly: true });

      expect(result.success).toBe(true);
      expect(result.operations).toEqual(['images']);
      expect(dataManager.imageProcessor.processImages).toHaveBeenCalled();
      expect(dataManager.databaseSeeder.seedScenario).not.toHaveBeenCalled();
      expect(dataManager.frontendSyncProcessor.syncWithBackend).not.toHaveBeenCalled();
    });

    test('should handle images-only mode failures', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: false,
        error: 'Image processing failed'
      });

      const result = await dataManager.setupData({ imagesOnly: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Image processing failed');
    });
  });

  describe('Incremental Processing', () => {
    test('should skip processing when no changes detected', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(false);

      const result = await dataManager.setupData();

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('No changes detected');
      expect(dataManager.imageProcessor.processImages).not.toHaveBeenCalled();
    });

    test('should force processing when requested', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(false);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: true,
        imageUrls: {},
        stats: { processed: 0, failed: 0 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 2 }
      });
      dataManager.frontendSyncProcessor.syncWithBackend = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 5
      });

      const result = await dataManager.setupData({ force: true });

      expect(result.success).toBe(true);
      expect(result.forced).toBe(true);
      expect(dataManager.imageProcessor.processImages).toHaveBeenCalled();
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalled();
    });
  });

  describe('Error Recovery and Rollback', () => {
    test('should attempt rollback on critical failures', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: true,
        imageUrls: { traditional: ['image1.jpg'] },
        stats: { processed: 1, failed: 0 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockRejectedValue(
        new Error('Critical database failure')
      );
      dataManager.stateManager.rollbackToLastKnownGood = jest.fn().mockResolvedValue(true);

      const result = await dataManager.setupData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Critical database failure');
      expect(dataManager.stateManager.rollbackToLastKnownGood).toHaveBeenCalled();
    });

    test('should handle rollback failures gracefully', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.databaseSeeder.seedScenario = jest.fn().mockRejectedValue(
        new Error('Critical failure')
      );
      dataManager.stateManager.rollbackToLastKnownGood = jest.fn().mockRejectedValue(
        new Error('Rollback failed')
      );

      const result = await dataManager.setupData();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Critical failure');
      expect(result.rollbackFailed).toBe(true);
    });
  });

  describe('Performance and Monitoring', () => {
    test('should track execution time and performance metrics', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: true,
        imageUrls: {},
        stats: { processed: 0, failed: 0 },
        duration: 1000
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 2 },
        duration: 2000
      });
      dataManager.frontendSyncProcessor.syncWithBackend = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 5,
        duration: 500
      });

      const result = await dataManager.setupData();

      expect(result.success).toBe(true);
      expect(result.performance).toBeDefined();
      expect(result.performance.totalDuration).toBeGreaterThan(0);
      expect(result.performance.stages).toBeDefined();
    });

    test('should validate data consistency after setup', async () => {
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.hasChanges = jest.fn().mockReturnValue(true);
      dataManager.imageProcessor.processImages = jest.fn().mockResolvedValue({
        success: true,
        imageUrls: { traditional: ['image1.jpg'] },
        stats: { processed: 1, failed: 0 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 2 }
      });
      dataManager.frontendSyncProcessor.syncWithBackend = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 5
      });
      dataManager.healthMonitor.validateData = jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const result = await dataManager.setupData({ validate: true });

      expect(result.success).toBe(true);
      expect(dataManager.healthMonitor.validateData).toHaveBeenCalled();
      expect(result.validation).toBeDefined();
      expect(result.validation.isValid).toBe(true);
    });
  });
});