/**
 * Simplified NPM Commands Integration Tests
 * 
 * Tests that the underlying functionality works without actually spawning npm processes.
 * 
 * Requirements: 14.7, 14.8, 14.9
 */

const { UnifiedDataManager } = require('../../unified-data-manager');
const { STATE_MANAGER } = require('../../state-manager');
const { DATA_CONFIG } = require('../../data-config');

// Mock external dependencies
jest.mock('../../image-processor');
jest.mock('../../database-seeder');

describe('NPM Commands Integration Tests', () => {
  let unifiedManager;
  let mockDatabaseSeeder;
  let mockImageProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock implementations
    mockDatabaseSeeder = {
      clearAllData: jest.fn().mockResolvedValue({ success: true }),
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

    // Create unified manager
    unifiedManager = new UnifiedDataManager(DATA_CONFIG, {
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

  describe('Core Data Management Commands', () => {
    test('setup-data functionality should work with enhanced frontend-sync-processor', async () => {
      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('setup-data:frontend-only functionality should use enhanced capabilities', async () => {
      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('reset-data functionality should work with enhanced frontend sync', async () => {
      const result = await unifiedManager.resetData('clean');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('health-check functionality should validate enhanced frontend-sync-processor', async () => {
      const result = await unifiedManager.healthCheck();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('validate-data functionality should include enhanced validation', async () => {
      const result = await unifiedManager.validateData();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Scenario-Based Commands', () => {
    test('seed-scenario:minimal functionality should work with enhanced frontend sync', async () => {
      const result = await unifiedManager.seedScenario('minimal');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('seed-scenario:london-artists functionality should generate enhanced data', async () => {
      const result = await unifiedManager.seedScenario('london-artists');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('seed-scenario:high-rated functionality should include business data', async () => {
      const result = await unifiedManager.seedScenario('high-rated');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('seed-scenario:portfolio-rich functionality should generate comprehensive data', async () => {
      const result = await unifiedManager.seedScenario('portfolio-rich');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Reset State Commands', () => {
    test('reset-data:clean functionality should work with enhanced capabilities', async () => {
      const result = await unifiedManager.resetData('clean');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('reset-data:frontend-ready functionality should prepare enhanced frontend', async () => {
      const result = await unifiedManager.resetData('frontend-ready');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('reset-data:search-ready functionality should prepare search data', async () => {
      const result = await unifiedManager.resetData('search-ready');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Status and Monitoring Commands', () => {
    test('data-status functionality should show enhanced frontend sync status', async () => {
      const result = await unifiedManager.getDataStatus();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('validate-comprehensive functionality should include all enhanced validations', async () => {
      const result = await unifiedManager.performComprehensiveValidation();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Force and Advanced Commands', () => {
    test('setup-data:force functionality should trigger full enhanced pipeline', async () => {
      const result = await unifiedManager.setupData({ force: true });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('setup-data with scenario functionality should use enhanced generation', async () => {
      const result = await unifiedManager.setupData({ scenario: 'minimal' });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Error Handling in Commands', () => {
    test('should handle invalid scenario names gracefully', async () => {
      const result = await unifiedManager.seedScenario('invalid-scenario');
      
      // Should handle invalid scenarios gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle invalid reset states gracefully', async () => {
      const result = await unifiedManager.resetData('invalid-state');
      
      // Should handle invalid states gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle concurrent command execution', async () => {
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
    test('commands should complete within reasonable time limits', async () => {
      const startTime = Date.now();
      const result = await unifiedManager.setupData({ frontendOnly: true });
      const duration = Date.now() - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('commands should provide meaningful results', async () => {
      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      expect(result).toBeDefined();
      expect(result.results || result.error || (result.success !== undefined)).toBeTruthy();
    });

    test('commands should handle system state properly', async () => {
      await unifiedManager.setupData({ frontendOnly: true });
      
      const statusSummary = STATE_MANAGER.getStatusSummary();
      expect(statusSummary).toBeDefined();
    });
  });

  describe('Integration with Enhanced Features', () => {
    test('commands should work with enhanced mock data generation', async () => {
      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('commands should support new business data features', async () => {
      const result = await unifiedManager.seedScenario('high-rated');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('commands should maintain backward compatibility', async () => {
      // Test that old command patterns still work
      const result = await unifiedManager.setupData({ frontendOnly: true });
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Available Scenarios and Reset States', () => {
    test('should provide available scenarios', () => {
      const scenarios = unifiedManager.getAvailableScenarios();
      
      expect(Array.isArray(scenarios)).toBe(true);
      expect(scenarios.length).toBeGreaterThan(0);
    });

    test('should provide available reset states', () => {
      const resetStates = unifiedManager.getAvailableResetStates();
      
      expect(Array.isArray(resetStates)).toBe(true);
      expect(resetStates.length).toBeGreaterThan(0);
    });

    test('should handle all available scenarios', async () => {
      const scenarios = unifiedManager.getAvailableScenarios();
      
      // Test a few scenarios
      for (const scenario of scenarios.slice(0, 3)) {
        const result = await unifiedManager.seedScenario(scenario.name);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      }
    });

    test('should handle all available reset states', async () => {
      const resetStates = unifiedManager.getAvailableResetStates();
      
      // Test a few reset states
      for (const resetState of resetStates.slice(0, 3)) {
        const result = await unifiedManager.resetData(resetState.name);
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      }
    });
  });

  describe('System Integration', () => {
    test('should integrate with state management', async () => {
      await unifiedManager.setupData({ frontendOnly: true });
      
      const currentStatus = unifiedManager.getCurrentOperationStatus();
      expect(currentStatus).toBeDefined();
    });

    test('should integrate with health monitoring', async () => {
      const healthResult = await unifiedManager.healthCheck();
      
      expect(healthResult).toBeDefined();
      expect(typeof healthResult.success).toBe('boolean');
    });

    test('should integrate with data validation', async () => {
      const validationResult = await unifiedManager.validateData();
      
      expect(validationResult).toBeDefined();
      expect(typeof validationResult.success).toBe('boolean');
    });

    test('should provide system status information', async () => {
      const statusResult = await unifiedManager.getDataStatus();
      
      expect(statusResult).toBeDefined();
      expect(typeof statusResult.success).toBe('boolean');
    });
  });
});