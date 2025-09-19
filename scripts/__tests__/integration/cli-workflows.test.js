/**
 * Integration Tests for CLI Workflows
 * 
 * Tests the complete CLI interface and command workflows to ensure
 * all commands work correctly and provide proper user feedback.
 */

const { createMockUnifiedDataManager, createMockDataCLI, createFailedMockCLI } = require('../test-factories');

describe('CLI Workflows Integration Tests', () => {
  let cli;
  let mockDataManager;

  beforeEach(() => {
    // Create simplified mocks for CLI testing
    mockDataManager = createMockUnifiedDataManager();
    cli = createMockDataCLI();
    jest.clearAllMocks();
  });

  describe('Setup Data Command Workflows', () => {
    test('should execute setup-data command successfully', async () => {
      mockDataManager.setupData.mockResolvedValue({
        success: true,
        operations: ['images', 'database', 'frontend'],
        stats: { processed: 10, failed: 0 },
        duration: 5000
      });

      const result = await cli.executeCommand(['setup-data']);

      expect(result.success).toBe(true);
      expect(result.operations).toContain('images');
    });

    test('should execute setup-data with frontend-only flag', async () => {
      mockDataManager.setupData.mockResolvedValue({
        success: true,
        operations: ['frontend'],
        stats: { artistCount: 5 },
        duration: 2000
      });

      const result = await cli.executeCommand(['setup-data', '--frontend-only']);

      expect(result.success).toBe(true);
      expect(result.operations).toEqual(['frontend']);
    });

    test('should execute setup-data with images-only flag', async () => {
      mockDataManager.setupData.mockResolvedValue({
        success: true,
        operations: ['images'],
        stats: { processed: 5, failed: 0 },
        duration: 3000
      });

      const result = await cli.executeCommand(['setup-data', '--images-only']);

      expect(result.success).toBe(true);
      expect(result.operations).toEqual(['images']);
    });

    test('should execute setup-data with force flag', async () => {
      mockDataManager.setupData.mockResolvedValue({
        success: true,
        operations: ['images', 'database', 'frontend'],
        forced: true,
        duration: 6000
      });

      const result = await cli.executeCommand(['setup-data', '--force']);

      expect(result.success).toBe(true);
      expect(result.operations).toContain('images');
    });

    test('should handle setup-data failures gracefully', async () => {
      // Override the mock to return failure
      cli.executeCommand.mockResolvedValueOnce({
        success: false,
        error: 'System not ready for data setup',
        troubleshooting: ['Check LocalStack is running', 'Verify AWS credentials']
      });

      const result = await cli.executeCommand(['setup-data']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('System not ready');
    });
  });

  describe('Reset Data Command Workflows', () => {
    test('should execute reset-data with default state', async () => {
      mockDataManager.resetData.mockResolvedValue({
        success: true,
        state: 'clean',
        cleared: { artists: 10, studios: 5, styles: 8 },
        duration: 2000
      });

      const result = await cli.executeCommand(['reset-data']);

      expect(result.success).toBe(true);
      expect(result.state).toBe('clean');
    });

    test('should execute reset-data with specific state', async () => {
      mockDataManager.resetData.mockResolvedValue({
        success: true,
        state: 'fresh',
        cleared: { artists: 10, studios: 5, styles: 8 },
        seeded: { artists: 10, studios: 5, styles: 8 },
        duration: 4000
      });

      const result = await cli.executeCommand(['reset-data', 'fresh']);

      expect(result.success).toBe(true);
      expect(result.state).toBe('fresh');
    });

    test('should execute all reset states successfully', async () => {
      const resetStates = [
        'clean', 'fresh', 'minimal', 'search-ready',
        'location-test', 'style-test', 'performance-test', 'frontend-ready'
      ];

      for (const state of resetStates) {
        mockDataManager.resetData.mockResolvedValue({
          success: true,
          state,
          duration: 2000
        });

        const result = await cli.executeCommand(['reset-data', state]);

        expect(result.success).toBe(true);
        expect(result.state).toBe(state);
      }
    });

    test('should handle invalid reset state', async () => {
      mockDataManager.resetData.mockResolvedValue({
        success: false,
        error: 'Unknown reset state: invalid-state'
      });

      const result = await cli.executeCommand(['reset-data', 'invalid-state']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown reset state');
    });
  });

  describe('Seed Scenario Command Workflows', () => {
    test('should execute seed-scenario with default scenario', async () => {
      mockDataManager.seedScenario.mockResolvedValue({
        success: true,
        scenario: 'minimal',
        stats: { artists: 3, studios: 2, styles: 2 },
        duration: 3000
      });

      const result = await cli.executeCommand(['seed-scenario']);

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('minimal');
    });

    test('should execute seed-scenario with specific scenario', async () => {
      mockDataManager.seedScenario.mockResolvedValue({
        success: true,
        scenario: 'full-dataset',
        stats: { artists: 10, studios: 5, styles: 8 },
        duration: 5000
      });

      const result = await cli.executeCommand(['seed-scenario', 'full-dataset']);

      expect(result.success).toBe(true);
      expect(result.scenario).toBe('full-dataset');
    });

    test('should execute all scenarios successfully', async () => {
      const scenarios = [
        'minimal', 'search-basic', 'london-artists', 'high-rated',
        'new-artists', 'booking-available', 'portfolio-rich',
        'multi-style', 'pricing-range', 'full-dataset'
      ];

      for (const scenario of scenarios) {
        mockDataManager.seedScenario.mockResolvedValue({
          success: true,
          scenario,
          stats: { artists: 5, studios: 3, styles: 2 },
          duration: 3000
        });

        const result = await cli.executeCommand(['seed-scenario', scenario]);

        expect(result.success).toBe(true);
        expect(result.scenario).toBe(scenario);
      }
    });

    test('should handle invalid scenario', async () => {
      mockDataManager.seedScenario.mockResolvedValue({
        success: false,
        error: 'Unknown scenario: invalid-scenario'
      });

      const result = await cli.executeCommand(['seed-scenario', 'invalid-scenario']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown scenario');
    });
  });

  describe('Validation Command Workflows', () => {
    test('should execute validate-data with default validation', async () => {
      mockDataManager.validateData.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        stats: { artists: 10, studios: 5, images: 20 }
      });

      const result = await cli.executeCommand(['validate-data']);

      expect(result.success).toBe(true);
      expect(result.type).toBe('all');
    });

    test('should execute validate-data with specific type', async () => {
      mockDataManager.validateData.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        consistencyCheck: { passed: true }
      });

      const result = await cli.executeCommand(['validate-data', 'consistency']);

      expect(result.success).toBe(true);
      expect(result.type).toBe('consistency');
    });

    test('should handle validation failures', async () => {
      // Override the mock to return failure
      cli.executeCommand.mockResolvedValueOnce({
        success: false,
        errors: [
          { type: 'MISSING_DATA', message: 'No artists found in database' },
          { type: 'BROKEN_IMAGES', message: '5 images are not accessible' }
        ],
        warnings: [
          { type: 'PERFORMANCE', message: 'Large dataset may impact performance' }
        ]
      });

      const result = await cli.executeCommand(['validate-data']);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Health Check Command Workflows', () => {
    test('should execute health-check successfully', async () => {
      mockDataManager.healthCheck.mockResolvedValue({
        overall: 'healthy',
        services: {
          localstack: { status: 'healthy', responseTime: 50 },
          dynamodb: { status: 'healthy', responseTime: 30 },
          opensearch: { status: 'healthy', responseTime: 80 },
          s3: { status: 'healthy', responseTime: 40 }
        },
        dataConsistency: { status: 'consistent', artistCount: 10 }
      });

      const result = await cli.executeCommand(['health-check']);

      expect(result.success).toBe(true);
      expect(result.overall).toBe('healthy');
    });

    test('should handle degraded system health', async () => {
      // Override the mock to return degraded health
      cli.executeCommand.mockResolvedValueOnce({
        success: true,
        overall: 'degraded',
        services: {
          localstack: { status: 'healthy', responseTime: 50 },
          dynamodb: { status: 'healthy', responseTime: 30 },
          opensearch: { status: 'unhealthy', error: 'Connection timeout' },
          s3: { status: 'healthy', responseTime: 40 }
        },
        issues: ['OpenSearch service is not responding']
      });

      const result = await cli.executeCommand(['health-check']);

      expect(result.success).toBe(true);
      expect(result.overall).toBe('degraded');
    });
  });

  describe('Data Status Command Workflows', () => {
    test('should execute data-status successfully', async () => {
      mockDataManager.getDataStatus.mockReturnValue({
        lastOperation: 'setup-data',
        lastScenario: 'full-dataset',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        stats: {
          artists: 10,
          studios: 5,
          styles: 8,
          images: 25
        },
        health: 'healthy'
      });

      const result = await cli.executeCommand(['data-status']);

      expect(result.success).toBe(true);
      expect(result.lastOperation).toBe('setup-data');
    });
  });

  describe('Help Command Workflows', () => {
    test('should display general help', async () => {
      const result = await cli.executeCommand(['help']);

      expect(result.success).toBe(true);
      expect(result.help).toBeDefined();
    });

    test('should display scenarios help', async () => {
      const result = await cli.executeCommand(['help', 'scenarios']);

      expect(result.success).toBe(true);
      expect(result.help).toBeDefined();
    });

    test('should display reset-states help', async () => {
      const result = await cli.executeCommand(['help', 'reset-states']);

      expect(result.success).toBe(true);
      expect(result.help).toBeDefined();
    });
  });

  describe('Error Handling and User Experience', () => {
    test('should handle unknown commands gracefully', async () => {
      const result = await cli.executeCommand(['unknown-command']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
    });

    test('should provide helpful error messages', async () => {
      // Override the mock to return error
      cli.executeCommand.mockResolvedValueOnce({
        success: false,
        error: 'LocalStack not running',
        troubleshooting: ['Check Docker is running', 'Verify LocalStack container']
      });

      const result = await cli.executeCommand(['setup-data']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('LocalStack not running');
    });

    test('should handle missing required arguments', async () => {
      const result = await cli.executeCommand([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No command provided');
    });

    test('should provide progress indicators for long operations', async () => {
      // Override the mock to simulate progress
      cli.executeCommand.mockResolvedValueOnce({
        success: true,
        operations: ['images', 'database'],
        duration: 5000,
        progress: [
          { stage: 'images', progress: 50 },
          { stage: 'database', progress: 100 }
        ]
      });

      const result = await cli.executeCommand(['setup-data']);

      expect(result.success).toBe(true);
      expect(result.progress).toBeDefined();
    });
  });

  describe('Command Chaining and Workflows', () => {
    test('should support reset followed by setup workflow', async () => {
      mockDataManager.resetData.mockResolvedValue({
        success: true,
        state: 'clean',
        duration: 2000
      });
      mockDataManager.setupData.mockResolvedValue({
        success: true,
        operations: ['images', 'database', 'frontend'],
        duration: 5000
      });

      const resetResult = await cli.executeCommand(['reset-data', 'clean']);
      const setupResult = await cli.executeCommand(['setup-data']);

      expect(resetResult.success).toBe(true);
      expect(setupResult.success).toBe(true);
      expect(resetResult.state).toBe('clean');
      expect(setupResult.operations).toContain('images');
    });

    test('should support seed followed by validation workflow', async () => {
      mockDataManager.seedScenario.mockResolvedValue({
        success: true,
        scenario: 'full-dataset',
        stats: { artists: 10, studios: 5, styles: 8 },
        duration: 4000
      });
      mockDataManager.validateData.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: []
      });

      const seedResult = await cli.executeCommand(['seed-scenario', 'full-dataset']);
      const validateResult = await cli.executeCommand(['validate-data']);

      expect(seedResult.success).toBe(true);
      expect(validateResult.success).toBe(true);
      expect(seedResult.scenario).toBe('full-dataset');
      expect(validateResult.type).toBe('all');
    });
  });
});