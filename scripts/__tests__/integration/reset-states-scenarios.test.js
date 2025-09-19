/**
 * Integration Tests for Reset States and Scenarios
 * 
 * Tests all reset states and seeding scenarios to ensure they work
 * correctly and preserve existing functionality.
 */

const { createMockUnifiedDataManager, createFailedMockManager } = require('../test-factories');

describe('Reset States and Scenarios Integration Tests', () => {
  let dataManager;

  beforeEach(() => {
    dataManager = createMockUnifiedDataManager();
    jest.clearAllMocks();
  });

  describe('Reset States Integration', () => {
    test('should execute clean reset state successfully', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);

      const result = await dataManager.resetData('clean');

      expect(result.success).toBe(true);
      expect(result.state).toBe('clean');
      expect(dataManager.databaseSeeder.clearAllData).toHaveBeenCalled();
      expect(dataManager.healthMonitor.isSystemReady).toHaveBeenCalled();
    });

    test('should execute fresh reset state with seeding', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.healthMonitor.isSystemReady = jest.fn().mockResolvedValue(true);

      const result = await dataManager.resetData('fresh');

      expect(result.success).toBe(true);
      expect(result.state).toBe('fresh');
      expect(dataManager.databaseSeeder.clearAllData).toHaveBeenCalled();
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalledWith('full-dataset');
    });

    test('should execute minimal reset state', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 3, studios: 2, styles: 2 }
      });

      const result = await dataManager.resetData('minimal');

      expect(result.success).toBe(true);
      expect(result.state).toBe('minimal');
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalledWith('minimal');
    });

    test('should execute search-ready reset state', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 2 }
      });

      const result = await dataManager.resetData('search-ready');

      expect(result.success).toBe(true);
      expect(result.state).toBe('search-ready');
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalledWith('search-basic');
    });

    test('should execute location-test reset state', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 3 }
      });

      const result = await dataManager.resetData('location-test');

      expect(result.success).toBe(true);
      expect(result.state).toBe('location-test');
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalledWith('london-artists');
    });

    test('should execute style-test reset state', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 3, studios: 2, styles: 4 }
      });

      const result = await dataManager.resetData('style-test');

      expect(result.success).toBe(true);
      expect(result.state).toBe('style-test');
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalledWith('multi-style');
    });

    test('should execute performance-test reset state', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 10, studios: 5, styles: 8 }
      });

      const result = await dataManager.resetData('performance-test');

      expect(result.success).toBe(true);
      expect(result.state).toBe('performance-test');
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalledWith('full-dataset');
    });

    test('should execute frontend-ready reset state', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.frontendSyncProcessor.processFrontendOnly = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 3,
        mockDataGenerated: true
      });

      const result = await dataManager.resetData('frontend-ready');

      expect(result.success).toBe(true);
      expect(result.state).toBe('frontend-ready');
      expect(dataManager.frontendSyncProcessor.processFrontendOnly).toHaveBeenCalled();
    });

    test('should handle unknown reset state', async () => {
      const result = await dataManager.resetData('unknown-state');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown reset state');
    });
  });

  describe('Scenario Seeding Integration', () => {
    test('should seed minimal scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'minimal',
        stats: { artists: 3, studios: 2, styles: 2 }
      });

      const result = await dataManager.seedScenario('minimal');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('minimal');
      expect(dataManager.databaseSeeder.seedScenario).toHaveBeenCalledWith('minimal');
    });

    test('should seed search-basic scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'search-basic',
        stats: { artists: 5, studios: 3, styles: 2 }
      });

      const result = await dataManager.seedScenario('search-basic');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('search-basic');
    });

    test('should seed london-artists scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'london-artists',
        stats: { artists: 5, studios: 3, styles: 3 }
      });

      const result = await dataManager.seedScenario('london-artists');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('london-artists');
    });

    test('should seed high-rated scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'high-rated',
        stats: { artists: 3, studios: 2, styles: 2 }
      });

      const result = await dataManager.seedScenario('high-rated');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('high-rated');
    });

    test('should seed new-artists scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'new-artists',
        stats: { artists: 4, studios: 3, styles: 2 }
      });

      const result = await dataManager.seedScenario('new-artists');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('new-artists');
    });

    test('should seed booking-available scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'booking-available',
        stats: { artists: 6, studios: 4, styles: 3 }
      });

      const result = await dataManager.seedScenario('booking-available');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('booking-available');
    });

    test('should seed portfolio-rich scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'portfolio-rich',
        stats: { artists: 4, studios: 3, styles: 3 }
      });

      const result = await dataManager.seedScenario('portfolio-rich');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('portfolio-rich');
    });

    test('should seed multi-style scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'multi-style',
        stats: { artists: 3, studios: 2, styles: 4 }
      });

      const result = await dataManager.seedScenario('multi-style');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('multi-style');
    });

    test('should seed pricing-range scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'pricing-range',
        stats: { artists: 5, studios: 3, styles: 2 }
      });

      const result = await dataManager.seedScenario('pricing-range');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('pricing-range');
    });

    test('should seed full-dataset scenario successfully', async () => {
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        scenario: 'full-dataset',
        stats: { artists: 10, studios: 5, styles: 8 }
      });

      const result = await dataManager.seedScenario('full-dataset');

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('full-dataset');
    });

    test('should handle unknown scenario', async () => {
      const result = await dataManager.seedScenario('unknown-scenario');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown scenario');
    });
  });

  describe('Cross-State Validation', () => {
    test('should validate data consistency after reset and seed', async () => {
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });
      dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
        success: true,
        stats: { artists: 5, studios: 3, styles: 2 }
      });
      dataManager.healthMonitor.validateData = jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const resetResult = await dataManager.resetData('search-ready');
      const validationResult = await dataManager.validateData();

      expect(resetResult.success).toBe(true);
      expect(validationResult.isValid).toBe(true);
      expect(dataManager.healthMonitor.validateData).toHaveBeenCalled();
    });

    test('should maintain state consistency across operations', async () => {
      dataManager.stateManager.saveCurrentState = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.getCurrentState = jest.fn().mockReturnValue({
        lastOperation: 'reset',
        lastScenario: 'minimal',
        timestamp: new Date()
      });

      await dataManager.resetData('minimal');
      const state = dataManager.getDataStatus();

      expect(state.lastOperation).toBe('reset');
      expect(state.lastScenario).toBe('minimal');
      expect(dataManager.stateManager.saveCurrentState).toHaveBeenCalled();
    });
  });

  describe('Performance and Resource Management', () => {
    test('should handle concurrent reset operations safely', async () => {
      dataManager.stateManager.acquireLock = jest.fn().mockResolvedValue(true);
      dataManager.stateManager.releaseLock = jest.fn().mockResolvedValue(true);
      dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
        success: true,
        cleared: { artists: 10, studios: 5, styles: 8 }
      });

      const promise1 = dataManager.resetData('clean');
      const promise2 = dataManager.resetData('minimal');

      const [result1, result2] = await Promise.allSettled([promise1, promise2]);

      // One should succeed, one should fail due to locking
      expect(
        (result1.status === 'fulfilled' && result1.value.success) ||
        (result2.status === 'fulfilled' && result2.value.success)
      ).toBe(true);
    });

    test('should clean up resources after failed operations', async () => {
      // Use failed mock manager for this test
      const failedManager = createFailedMockManager();
      
      const result = await failedManager.resetData('clean');

      expect(result.success).toBe(false);
      expect(failedManager.stateManager.releaseLock).toHaveBeenCalled();
      expect(failedManager.stateManager.rollbackToLastKnownGood).toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility', () => {
    test('should preserve existing functionality for all scenarios', async () => {
      // Test that all existing scenarios are still supported
      const scenarios = Object.keys(SCENARIOS);
      
      for (const scenario of scenarios) {
        dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
          success: true,
          scenario,
          stats: { artists: 5, studios: 3, styles: 2 }
        });

        const result = await dataManager.seedScenario(scenario);
        expect(result.success).toBe(true);
        expect(result.scenario).toBe(scenario);
      }
    });

    test('should preserve existing functionality for all reset states', async () => {
      // Test that all existing reset states are still supported
      const resetStates = Object.keys(RESET_STATES);
      
      for (const state of resetStates) {
        dataManager.databaseSeeder.clearAllData = jest.fn().mockResolvedValue({
          success: true,
          cleared: { artists: 10, studios: 5, styles: 8 }
        });
        
        if (RESET_STATES[state].scenario) {
          dataManager.databaseSeeder.seedScenario = jest.fn().mockResolvedValue({
            success: true,
            stats: { artists: 5, studios: 3, styles: 2 }
          });
        }
        
        if (RESET_STATES[state].frontendOnly) {
          dataManager.frontendSyncProcessor.processFrontendOnly = jest.fn().mockResolvedValue({
            success: true,
            artistCount: 3
          });
        }

        const result = await dataManager.resetData(state);
        expect(result.success).toBe(true);
        expect(result.state).toBe(state);
      }
    });
  });
});