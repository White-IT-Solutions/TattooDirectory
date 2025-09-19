/**
 * Unit Tests for DataCLI Class
 * 
 * Tests command parsing, validation, help system, and user interface components.
 */

const { DataCLI, COMMANDS, COLORS, SYMBOLS } = require('../data-cli');
const { UnifiedDataManager } = require('../unified-data-manager');
const { DATA_CONFIG } = require('../data-config');

// Mock dependencies
jest.mock('../unified-data-manager');
jest.mock('../data-config');

describe('DataCLI', () => {
  let cli;
  let mockManager;
  let consoleSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock UnifiedDataManager
    mockManager = {
      setupData: jest.fn(),
      resetData: jest.fn(),
      seedScenario: jest.fn(),
      validateData: jest.fn(),
      healthCheck: jest.fn(),
      getDataStatus: jest.fn()
    };
    
    UnifiedDataManager.mockImplementation(() => mockManager);
    
    // Mock DATA_CONFIG
    DATA_CONFIG.getScenarioConfig = jest.fn();
    DATA_CONFIG.getResetStateConfig = jest.fn();
    DATA_CONFIG.scenarios = {
      minimal: { description: 'Quick testing', artistCount: 3 },
      'full-dataset': { description: 'Complete dataset', artistCount: 10 }
    };
    DATA_CONFIG.resetStates = {
      clean: { description: 'Empty databases' },
      fresh: { description: 'Full dataset' }
    };

    // Create CLI instance
    cli = new DataCLI();
    
    // Spy on console methods
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {})
    };
    
    // Mock process.stdout.write for spinner tests
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    process.stdout.write.mockRestore();
    
    // Clear any running intervals
    if (cli.spinnerInterval) {
      clearInterval(cli.spinnerInterval);
    }
  });

  describe('parseArguments', () => {
    test('should parse command with no arguments', () => {
      const result = cli.parseArguments(['setup-data']);
      
      expect(result).toEqual({
        command: 'setup-data',
        args: [],
        options: {}
      });
    });

    test('should parse command with positional arguments', () => {
      const result = cli.parseArguments(['reset-data', 'fresh']);
      
      expect(result).toEqual({
        command: 'reset-data',
        args: ['fresh'],
        options: {}
      });
    });

    test('should parse command with boolean flags', () => {
      const result = cli.parseArguments(['setup-data', '--frontend-only', '--force']);
      
      expect(result).toEqual({
        command: 'setup-data',
        args: [],
        options: {
          'frontend-only': true,
          force: true
        }
      });
    });

    test('should parse command with value flags', () => {
      const result = cli.parseArguments(['setup-data', '--scenario', 'minimal']);
      
      expect(result).toEqual({
        command: 'setup-data',
        args: [],
        options: {
          scenario: 'minimal'
        }
      });
    });

    test('should parse mixed arguments and options', () => {
      const result = cli.parseArguments(['seed-scenario', 'minimal', '--force']);
      
      expect(result).toEqual({
        command: 'seed-scenario',
        args: ['minimal'],
        options: {
          force: true
        }
      });
    });

    test('should handle short flags', () => {
      const result = cli.parseArguments(['setup-data', '-f']);
      
      expect(result).toEqual({
        command: 'setup-data',
        args: [],
        options: {
          f: true
        }
      });
    });

    test('should return help command for empty arguments', () => {
      const result = cli.parseArguments([]);
      
      expect(result).toEqual({
        command: 'help',
        args: [],
        options: {}
      });
    });
  });

  describe('validateCommand', () => {
    test('should validate known commands', () => {
      const result = cli.validateCommand('setup-data', [], {});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject unknown commands', () => {
      const result = cli.validateCommand('unknown-command', [], {});
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unknown command: unknown-command');
    });

    test('should validate help command', () => {
      const result = cli.validateCommand('help', [], {});
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    describe('seed-scenario validation', () => {
      test('should require scenario name', () => {
        const result = cli.validateCommand('seed-scenario', [], {});
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Scenario name is required');
      });

      test('should validate scenario exists', () => {
        DATA_CONFIG.getScenarioConfig.mockImplementation((name) => {
          if (name === 'minimal') return { description: 'Test' };
          throw new Error('Invalid scenario');
        });

        const validResult = cli.validateCommand('seed-scenario', ['minimal'], {});
        expect(validResult.isValid).toBe(true);

        const invalidResult = cli.validateCommand('seed-scenario', ['invalid'], {});
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors).toContain('Invalid scenario: invalid');
      });
    });

    describe('reset-data validation', () => {
      test('should validate reset state exists', () => {
        DATA_CONFIG.getResetStateConfig.mockImplementation((name) => {
          if (name === 'fresh') return { description: 'Test' };
          throw new Error('Invalid state');
        });

        const validResult = cli.validateCommand('reset-data', ['fresh'], {});
        expect(validResult.isValid).toBe(true);

        const invalidResult = cli.validateCommand('reset-data', ['invalid'], {});
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors).toContain('Invalid reset state: invalid');
      });

      test('should allow no arguments (defaults to fresh)', () => {
        const result = cli.validateCommand('reset-data', [], {});
        expect(result.isValid).toBe(true);
      });
    });

    describe('validate-data validation', () => {
      test('should validate validation type', () => {
        const validResult = cli.validateCommand('validate-data', ['consistency'], {});
        expect(validResult.isValid).toBe(true);

        const invalidResult = cli.validateCommand('validate-data', ['invalid'], {});
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors).toContain('Invalid validation type: invalid');
      });

      test('should allow no arguments (defaults to all)', () => {
        const result = cli.validateCommand('validate-data', [], {});
        expect(result.isValid).toBe(true);
      });
    });

    describe('setup-data validation', () => {
      test('should reject conflicting options', () => {
        const result = cli.validateCommand('setup-data', [], {
          'frontend-only': true,
          'images-only': true
        });
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Cannot use --frontend-only and --images-only together');
      });

      test('should validate scenario option', () => {
        DATA_CONFIG.getScenarioConfig.mockImplementation((name) => {
          if (name === 'minimal') return { description: 'Test' };
          throw new Error('Invalid scenario');
        });

        const validResult = cli.validateCommand('setup-data', [], { scenario: 'minimal' });
        expect(validResult.isValid).toBe(true);

        const invalidResult = cli.validateCommand('setup-data', [], { scenario: 'invalid' });
        expect(invalidResult.isValid).toBe(false);
        expect(invalidResult.errors).toContain('Invalid scenario: invalid');
      });
    });
  });

  describe('handleSetupData', () => {
    test('should handle successful setup', async () => {
      mockManager.setupData.mockResolvedValue({
        success: true,
        results: {
          images: { processed: 5, uploaded: 5, failed: 0 },
          database: { artists: 10 },
          opensearch: { documents: 10 },
          frontend: { updated: true, artistCount: 10 }
        }
      });

      const result = await cli.handleSetupData([], {});
      
      expect(result).toBe(true);
      expect(mockManager.setupData).toHaveBeenCalledWith(
        expect.objectContaining({
          frontendOnly: false,
          imagesOnly: false,
          force: false,
          scenario: null,
          progressCallback: expect.any(Function)
        })
      );
    });

    test('should handle frontend-only setup', async () => {
      mockManager.setupData.mockResolvedValue({
        success: true,
        results: {
          frontend: { updated: true, artistCount: 5 }
        }
      });

      const result = await cli.handleSetupData([], { 'frontend-only': true });
      
      expect(result).toBe(true);
      expect(mockManager.setupData).toHaveBeenCalledWith(
        expect.objectContaining({
          frontendOnly: true,
          imagesOnly: false,
          force: false,
          scenario: null,
          progressCallback: expect.any(Function)
        })
      );
    });

    test('should handle setup failure', async () => {
      mockManager.setupData.mockResolvedValue({
        success: false,
        error: 'Setup failed'
      });

      const result = await cli.handleSetupData([], {});
      
      expect(result).toBe(false);
    });

    test('should handle setup with scenario', async () => {
      mockManager.setupData.mockResolvedValue({
        success: true,
        results: {}
      });

      const result = await cli.handleSetupData([], { scenario: 'minimal' });
      
      expect(result).toBe(true);
      expect(mockManager.setupData).toHaveBeenCalledWith(
        expect.objectContaining({
          frontendOnly: false,
          imagesOnly: false,
          force: false,
          scenario: 'minimal',
          progressCallback: expect.any(Function)
        })
      );
    });
  });

  describe('handleResetData', () => {
    test('should handle successful reset with default state', async () => {
      DATA_CONFIG.getResetStateConfig.mockReturnValue({
        description: 'Full dataset'
      });
      
      mockManager.resetData.mockResolvedValue({
        success: true,
        results: {
          cleared: true,
          seeded: true,
          seedStats: { artists: { loaded: 10 } }
        }
      });

      const result = await cli.handleResetData([], {});
      
      expect(result).toBe(true);
      expect(mockManager.resetData).toHaveBeenCalledWith('fresh');
    });

    test('should handle reset with specific state', async () => {
      DATA_CONFIG.getResetStateConfig.mockReturnValue({
        description: 'Empty databases'
      });
      
      mockManager.resetData.mockResolvedValue({
        success: true,
        results: { cleared: true }
      });

      const result = await cli.handleResetData(['clean'], {});
      
      expect(result).toBe(true);
      expect(mockManager.resetData).toHaveBeenCalledWith('clean');
    });

    test('should handle reset failure', async () => {
      DATA_CONFIG.getResetStateConfig.mockReturnValue({
        description: 'Test state'
      });
      
      mockManager.resetData.mockResolvedValue({
        success: false,
        error: 'Reset failed'
      });

      const result = await cli.handleResetData(['fresh'], {});
      
      expect(result).toBe(false);
    });
  });

  describe('handleSeedScenario', () => {
    test('should handle successful scenario seeding', async () => {
      DATA_CONFIG.getScenarioConfig.mockReturnValue({
        description: 'Quick testing',
        artistCount: 3
      });
      
      mockManager.seedScenario.mockResolvedValue({
        success: true,
        results: {
          seedStats: { artists: { loaded: 3 } },
          frontendUpdated: true
        }
      });

      const result = await cli.handleSeedScenario(['minimal'], {});
      
      expect(result).toBe(true);
      expect(mockManager.seedScenario).toHaveBeenCalledWith('minimal');
    });

    test('should handle scenario seeding failure', async () => {
      DATA_CONFIG.getScenarioConfig.mockReturnValue({
        description: 'Test scenario',
        artistCount: 5
      });
      
      mockManager.seedScenario.mockResolvedValue({
        success: false,
        error: 'Seeding failed'
      });

      const result = await cli.handleSeedScenario(['test'], {});
      
      expect(result).toBe(false);
    });
  });

  describe('handleValidateData', () => {
    test('should handle successful validation', async () => {
      mockManager.validateData.mockResolvedValue({
        success: true,
        results: { validation: 'passed' },
        errors: []
      });

      const result = await cli.handleValidateData([], {});
      
      expect(result).toBe(true);
      expect(mockManager.validateData).toHaveBeenCalledWith('all');
    });

    test('should handle validation with specific type', async () => {
      mockManager.validateData.mockResolvedValue({
        success: true,
        results: { validation: 'passed' },
        errors: []
      });

      const result = await cli.handleValidateData(['consistency'], {});
      
      expect(result).toBe(true);
      expect(mockManager.validateData).toHaveBeenCalledWith('consistency');
    });

    test('should handle validation failure', async () => {
      mockManager.validateData.mockResolvedValue({
        success: false,
        error: 'Validation failed'
      });

      const result = await cli.handleValidateData([], {});
      
      expect(result).toBe(false);
    });
  });

  describe('handleHealthCheck', () => {
    test('should handle successful health check', async () => {
      mockManager.healthCheck.mockResolvedValue({
        success: true,
        overall: 'healthy',
        services: {
          localstack: 'healthy',
          dynamodb: 'healthy'
        },
        summary: 'All services healthy'
      });

      const result = await cli.handleHealthCheck([], {});
      
      expect(result).toBe(true);
      expect(mockManager.healthCheck).toHaveBeenCalled();
    });

    test('should handle health check failure', async () => {
      mockManager.healthCheck.mockResolvedValue({
        success: false,
        error: 'Health check failed'
      });

      const result = await cli.handleHealthCheck([], {});
      
      expect(result).toBe(false);
    });
  });

  describe('handleDataStatus', () => {
    test('should handle successful status retrieval', async () => {
      mockManager.getDataStatus.mockResolvedValue({
        success: true,
        status: {
          overall: 'healthy',
          services: { localstack: 'healthy' },
          data: {
            dynamodb: { totalItems: 10 },
            opensearch: { totalDocuments: 10 },
            s3: { totalObjects: 5 },
            consistency: { consistent: true }
          },
          operations: { current: { isRunning: false } }
        }
      });

      const result = await cli.handleDataStatus([], {});
      
      expect(result).toBe(true);
      expect(mockManager.getDataStatus).toHaveBeenCalled();
    });

    test('should handle status retrieval failure', async () => {
      mockManager.getDataStatus.mockResolvedValue({
        success: false,
        error: 'Status retrieval failed'
      });

      const result = await cli.handleDataStatus([], {});
      
      expect(result).toBe(false);
    });
  });

  describe('spinner functionality', () => {
    test('should start and stop spinner', () => {
      cli.startSpinner('Testing');
      
      expect(process.stdout.write).toHaveBeenCalled();
      expect(cli.spinnerInterval).toBeTruthy();
      
      cli.stopSpinner();
      
      expect(cli.spinnerInterval).toBeNull();
    });

    test('should handle multiple spinner starts', () => {
      cli.startSpinner('First');
      const firstInterval = cli.spinnerInterval;
      
      cli.startSpinner('Second');
      const secondInterval = cli.spinnerInterval;
      
      expect(firstInterval).not.toBe(secondInterval);
      
      cli.stopSpinner();
    });
  });

  describe('progress bar functionality', () => {
    test('should start and stop progress bar', () => {
      cli.startProgressBar('Testing', 100);
      
      expect(cli.currentProgress.total).toBe(100);
      expect(cli.currentProgress.message).toBe('Testing');
      expect(cli.progressBarInterval).toBeTruthy();
      
      cli.stopProgressBar();
      
      expect(cli.progressBarInterval).toBeNull();
      expect(cli.currentProgress.total).toBe(0);
    });

    test('should update progress correctly', () => {
      cli.startProgressBar('Testing', 100);
      
      cli.updateProgress(50, 'Half way');
      
      expect(cli.currentProgress.current).toBe(50);
      expect(cli.currentProgress.message).toBe('Half way');
      
      cli.stopProgressBar();
    });

    test('should not exceed total progress', () => {
      cli.startProgressBar('Testing', 100);
      
      cli.updateProgress(150);
      
      expect(cli.currentProgress.current).toBe(100);
      
      cli.stopProgressBar();
    });

    test('should show step progress', () => {
      cli.showStepProgress(2, 5, 'Processing data');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Step 2/5: Processing data')
      );
    });
  });

  describe('enhanced error handling', () => {
    test('should categorize connection errors', () => {
      const error = new Error('ECONNREFUSED localhost:4566');
      const category = cli.categorizeError(error);
      
      expect(category).toBe('connection');
    });

    test('should categorize permission errors', () => {
      const error = new Error('EACCES: permission denied');
      const category = cli.categorizeError(error);
      
      expect(category).toBe('permission');
    });

    test('should categorize filesystem errors', () => {
      const error = new Error('ENOENT: no such file or directory');
      const category = cli.categorizeError(error);
      
      expect(category).toBe('filesystem');
    });

    test('should categorize validation errors', () => {
      const error = new Error('Data validation failed');
      const category = cli.categorizeError(error);
      
      expect(category).toBe('data');
    });

    test('should get appropriate error icons', () => {
      expect(cli.getErrorIcon('connection')).toBe('🔌');
      expect(cli.getErrorIcon('permission')).toBe('🔐');
      expect(cli.getErrorIcon('filesystem')).toBe('📁');
      expect(cli.getErrorIcon('unknown')).toBe('❓');
    });

    test('should provide detailed error information', () => {
      const error = new Error('Connection failed');
      
      cli.printErrorDetails(error, 'connection');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    test('should suggest recovery actions', () => {
      cli.suggestRecoveryActions('setup-data', 'connection');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Immediate Actions:')
      );
    });
  });

  describe('troubleshooting guidance', () => {
    test('should provide categorized troubleshooting steps', () => {
      const steps = cli.getTroubleshootingSteps('setup-data', 'localstack connection failed');
      
      expect(steps).toHaveLength(1);
      expect(steps[0].title).toContain('Docker & LocalStack');
      expect(steps[0].steps.length).toBeGreaterThan(0);
    });

    test('should provide permission troubleshooting', () => {
      const steps = cli.getTroubleshootingSteps('setup-data', 'permission denied');
      
      expect(steps.some(category => category.title.includes('Permission'))).toBe(true);
    });

    test('should provide data troubleshooting', () => {
      const steps = cli.getTroubleshootingSteps('validate-data', 'validation failed');
      
      expect(steps.some(category => category.title.includes('Validation'))).toBe(true);
    });

    test('should provide generic troubleshooting for unknown errors', () => {
      const steps = cli.getTroubleshootingSteps('unknown-command', 'unknown error');
      
      expect(steps.some(category => category.title.includes('General'))).toBe(true);
    });
  });

  describe('enhanced formatting', () => {
    test('should format subsections', () => {
      cli.printSubSection('Test Section');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test Section')
      );
    });

    test('should format commands', () => {
      cli.printCommand('npm run test');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('npm run test')
      );
    });

    test('should format notes', () => {
      cli.printNote('This is a helpful note');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('This is a helpful note')
      );
    });
  });

  describe('operation summaries', () => {
    test('should display operation summary', () => {
      const result = { success: true, results: {} };
      const startTime = Date.now() - 5000; // 5 seconds ago
      
      cli.displayOperationSummary('setup-data', result, startTime);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Operation Summary:')
      );
    });

    test('should display result statistics', () => {
      const results = {
        images: { processed: 10, uploaded: 8, failed: 2 },
        database: { artists: 5, studios: 3 },
        opensearch: { documents: 5 },
        frontend: { updated: true, artistCount: 5 }
      };
      
      cli.displayResultStatistics(results);
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Statistics:')
      );
    });

    test('should show performance metrics for long operations', () => {
      const results = { images: { processed: 100 }, database: { artists: 50 } };
      
      cli.showPerformanceMetrics('setup-data', 10000, results); // 10 seconds
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Performance Metrics:')
      );
    });

    test('should not show performance metrics for quick operations', () => {
      const results = {};
      
      cli.showPerformanceMetrics('setup-data', 1000, results); // 1 second
      
      // Should not show performance section for quick operations
      const calls = consoleSpy.log.mock.calls.map(call => call[0]).join('');
      expect(calls).not.toContain('Performance Metrics:');
    });
  });

  describe('resource warnings', () => {
    test('should check and display resource warnings', () => {
      // Mock high memory usage
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 600 * 1024 * 1024 // 600MB
      });
      
      cli.checkAndDisplayResourceWarnings();
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('High memory usage')
      );
      
      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });
  });

  describe('error handling', () => {
    test('should handle errors gracefully', () => {
      const error = new Error('Test error');
      
      cli.handleError(error, 'test-command');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    test('should provide troubleshooting guidance', () => {
      cli.provideTroubleshootingGuidance('setup-data', 'LocalStack connection failed');
      
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('help system', () => {
    test('should show general help', () => {
      cli.showHelp();
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const output = consoleSpy.log.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Data Management CLI');
      expect(output).toContain('COMMANDS:');
    });

    test('should show command-specific help', () => {
      cli.showCommandHelp('setup-data');
      
      expect(consoleSpy.log).toHaveBeenCalled();
      const output = consoleSpy.log.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('setup-data');
      expect(output).toContain('USAGE:');
    });
  });

  describe('output formatting', () => {
    test('should format success messages', () => {
      cli.printSuccess('Test success');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test success')
      );
    });

    test('should format error messages', () => {
      cli.printError('Test error');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
    });

    test('should format warning messages', () => {
      cli.printWarning('Test warning');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test warning')
      );
    });

    test('should format info messages', () => {
      cli.printInfo('Test info');
      
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Test info')
      );
    });
  });

  describe('integration with UnifiedDataManager', () => {
    test('should create UnifiedDataManager instance', () => {
      expect(UnifiedDataManager).toHaveBeenCalled();
      expect(cli.manager).toBeDefined();
    });

    test('should pass correct options to manager methods', async () => {
      mockManager.setupData.mockResolvedValue({ success: true, results: {} });
      
      await cli.handleSetupData([], { 
        'frontend-only': true, 
        force: true, 
        scenario: 'minimal' 
      });
      
      expect(mockManager.setupData).toHaveBeenCalledWith(
        expect.objectContaining({
          frontendOnly: true,
          imagesOnly: false,
          force: true,
          scenario: 'minimal',
          progressCallback: expect.any(Function)
        })
      );
    });
  });

  describe('command constants', () => {
    test('should have all required commands defined', () => {
      const requiredCommands = [
        'setup-data',
        'reset-data', 
        'seed-scenario',
        'validate-data',
        'health-check',
        'data-status'
      ];
      
      requiredCommands.forEach(command => {
        expect(COMMANDS[command]).toBeDefined();
        expect(COMMANDS[command].description).toBeDefined();
        expect(COMMANDS[command].usage).toBeDefined();
      });
    });

    test('should have color constants defined', () => {
      expect(COLORS.reset).toBeDefined();
      expect(COLORS.green).toBeDefined();
      expect(COLORS.red).toBeDefined();
      expect(COLORS.blue).toBeDefined();
    });

    test('should have symbol constants defined', () => {
      expect(SYMBOLS.success).toBeDefined();
      expect(SYMBOLS.error).toBeDefined();
      expect(SYMBOLS.warning).toBeDefined();
      expect(SYMBOLS.spinner).toBeDefined();
    });
  });
});