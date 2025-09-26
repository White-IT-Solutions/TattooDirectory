/**
 * Test Factories for Integration Tests
 * 
 * Provides simplified mock implementations for integration testing
 * that avoid complex dependency injection issues.
 */

/**
 * Create a mock UnifiedDataManager for integration tests
 */
function createMockUnifiedDataManager() {
  const mockManager = {
    // Core operations
    setupData: jest.fn(),
    resetData: jest.fn(),
    seedScenario: jest.fn(),
    validateData: jest.fn(),
    healthCheck: jest.fn(),
    getDataStatus: jest.fn(),
    
    // Mock dependencies
    databaseSeeder: {
      clearAllData: jest.fn(),
      seedAllData: jest.fn(),
      seedScenario: jest.fn()
    },
    
    healthMonitor: {
      validateData: jest.fn(),
      checkAllServices: jest.fn(),
      isSystemReady: jest.fn()
    },
    
    frontendSyncProcessor: {
      processFrontendOnly: jest.fn(),
      syncWithBackend: jest.fn()
    },
    
    stateManager: {
      startOperation: jest.fn(),
      endOperation: jest.fn(),
      saveCurrentState: jest.fn(),
      releaseLock: jest.fn(),
      rollbackToLastKnownGood: jest.fn()
    }
  };
  
  // Setup default successful responses
  mockManager.setupData.mockResolvedValue({
    success: true,
    results: {
      images: { processed: 5, uploaded: 5 },
      database: { artists: 10, studios: 5 },
      opensearch: { documents: 10, indexed: 10 },
      frontend: { updated: true, artistCount: 10 }
    },
    validation: { isValid: true }
  });
  
  mockManager.resetData.mockResolvedValue({
    success: true,
    state: 'clean',
    results: { cleared: true }
  });
  
  mockManager.seedScenario.mockResolvedValue({
    success: true,
    scenario: 'test-scenario',
    results: { seeded: true }
  });
  
  mockManager.validateData.mockResolvedValue({
    isValid: true,
    summary: 'All data valid'
  });
  
  mockManager.healthCheck.mockResolvedValue({
    overall: 'healthy',
    services: { dynamodb: 'healthy', opensearch: 'healthy' }
  });
  
  mockManager.getDataStatus.mockResolvedValue({
    success: true,
    lastOperation: 'setup',
    lastScenario: 'test-scenario'
  });
  
  // Setup mock dependencies
  mockManager.databaseSeeder.clearAllData.mockResolvedValue({ success: true });
  mockManager.databaseSeeder.seedAllData.mockResolvedValue({ success: true });
  mockManager.databaseSeeder.seedScenario.mockResolvedValue({ success: true });
  
  mockManager.healthMonitor.validateData.mockResolvedValue({ isValid: true });
  mockManager.healthMonitor.checkAllServices.mockResolvedValue({ overall: 'healthy' });
  mockManager.healthMonitor.isSystemReady.mockResolvedValue(true);
  
  mockManager.frontendSyncProcessor.processFrontendOnly.mockResolvedValue({ success: true });
  mockManager.frontendSyncProcessor.syncWithBackend.mockResolvedValue({ success: true });
  
  mockManager.stateManager.startOperation.mockReturnValue('test-operation-id');
  mockManager.stateManager.endOperation.mockReturnValue(true);
  mockManager.stateManager.saveCurrentState.mockReturnValue(true);
  mockManager.stateManager.releaseLock.mockReturnValue(true);
  mockManager.stateManager.rollbackToLastKnownGood.mockReturnValue(true);
  
  return mockManager;
}

/**
 * Create a mock DataCLI for integration tests
 */
function createMockDataCLI() {
  const mockCLI = {
    handleCommand: jest.fn(),
    executeCommand: jest.fn(),
    handleSetupData: jest.fn(),
    handleResetData: jest.fn(),
    handleSeedScenario: jest.fn(),
    handleValidateData: jest.fn(),
    handleHealthCheck: jest.fn(),
    handleDataStatus: jest.fn(),
    showHelp: jest.fn(),
    parseArguments: jest.fn(),
    validateCommand: jest.fn()
  };
  
  // Setup default successful responses
  mockCLI.handleCommand.mockResolvedValue({ success: true });
  mockCLI.executeCommand.mockImplementation(async (args) => {
    const command = args[0];
    const options = args.slice(1);
    
    switch (command) {
      case 'setup-data':
        return {
          success: true,
          operations: options.includes('--frontend-only') ? ['frontend'] : 
                     options.includes('--images-only') ? ['images'] : 
                     ['images', 'database', 'frontend'],
          stats: { processed: 10, failed: 0 },
          duration: 5000
        };
      case 'reset-data':
        const resetState = options[0] || 'clean';
        const validResetStates = ['clean', 'fresh', 'minimal', 'search-ready', 'location-test', 'style-test', 'performance-test', 'frontend-ready'];
        if (!validResetStates.includes(resetState)) {
          return {
            success: false,
            error: `Unknown reset state: ${resetState}`
          };
        }
        return {
          success: true,
          state: resetState,
          results: { cleared: true }
        };
      case 'seed-scenario':
        const scenario = options[0] || 'minimal';
        const validScenarios = ['minimal', 'search-basic', 'london-artists', 'high-rated', 'new-artists', 'booking-available', 'portfolio-rich', 'multi-style', 'pricing-range', 'full-dataset'];
        if (!validScenarios.includes(scenario)) {
          return {
            success: false,
            error: `Unknown scenario: ${scenario}`
          };
        }
        return {
          success: true,
          scenario: scenario,
          results: { seeded: true }
        };
      case 'validate-data':
        return {
          success: true,
          type: options[0] || 'all',
          isValid: true,
          errors: []
        };
      case 'health-check':
        return {
          success: true,
          overall: 'healthy',
          services: { dynamodb: 'healthy', opensearch: 'healthy' }
        };
      case 'data-status':
        return {
          success: true,
          lastOperation: 'setup-data',
          lastScenario: 'test-scenario'
        };
      case 'help':
        return {
          success: true,
          help: 'Help information'
        };
      default:
        if (!command || command === 'undefined') {
          return {
            success: false,
            error: 'No command provided'
          };
        }
        return {
          success: false,
          error: `Unknown command: ${command}`
        };
    }
  });
  
  mockCLI.handleSetupData.mockResolvedValue({ success: true });
  mockCLI.handleResetData.mockResolvedValue({ success: true });
  mockCLI.handleSeedScenario.mockResolvedValue({ success: true });
  mockCLI.handleValidateData.mockResolvedValue({ success: true });
  mockCLI.handleHealthCheck.mockResolvedValue({ success: true });
  mockCLI.handleDataStatus.mockResolvedValue({ success: true });
  
  return mockCLI;
}

/**
 * Create mock for failed operations
 */
function createFailedMockManager() {
  const mockManager = createMockUnifiedDataManager();
  
  // Override with failure responses
  mockManager.setupData.mockResolvedValue({
    success: false,
    error: 'Setup failed'
  });
  
  mockManager.resetData.mockResolvedValue({
    success: false,
    error: 'Database connection failed'
  });
  
  mockManager.seedScenario.mockResolvedValue({
    success: false,
    error: 'Seeding failed'
  });
  
  return mockManager;
}

/**
 * Create mock CLI with error scenarios
 */
function createFailedMockCLI() {
  const mockCLI = createMockDataCLI();
  
  // Override executeCommand to simulate failures
  mockCLI.executeCommand.mockImplementation(async (args) => {
    const command = args[0];
    
    if (command === 'setup-data' && args.includes('--fail')) {
      return {
        success: false,
        error: 'System not ready'
      };
    }
    
    if (command === 'reset-data' && args.includes('invalid-state')) {
      return {
        success: false,
        error: 'Unknown reset state: invalid-state'
      };
    }
    
    if (command === 'seed-scenario' && args.includes('invalid-scenario')) {
      return {
        success: false,
        error: 'Unknown scenario: invalid-scenario'
      };
    }
    
    if (command === 'validate-data' && args.includes('--fail')) {
      return {
        success: false,
        errors: [
          { type: 'consistency', message: 'Data mismatch' },
          { type: 'accessibility', message: 'Image not accessible' }
        ]
      };
    }
    
    if (command === 'health-check' && args.includes('--degraded')) {
      return {
        success: true,
        overall: 'degraded',
        services: { dynamodb: 'healthy', opensearch: 'unhealthy' }
      };
    }
    
    if (!command) {
      return {
        success: false,
        error: 'No command provided'
      };
    }
    
    // Default to success for other commands
    return mockCLI.executeCommand.mockImplementation.call(this, args);
  });
  
  return mockCLI;
}

module.exports = {
  createMockUnifiedDataManager,
  createMockDataCLI,
  createFailedMockManager,
  createFailedMockCLI
};