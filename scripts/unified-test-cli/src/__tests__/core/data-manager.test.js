/**
 * DataManager Tests
 * 
 * Comprehensive unit tests for the DataManager class including
 * scenario management, data seeding, cleanup, and error handling.
 */

import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../utils/logger.js');
jest.mock('../../utils/config.js');
jest.mock('child_process');
jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

describe('DataManager', () => {
  let DataManager, DataSeedingError;
  let dataManager;
  let mockLogger;
  let mockConfig;
  let mockSpawn;

  beforeAll(async () => {
    // Mock logger first
    jest.doMock('../../utils/logger.js', () => ({
      Logger: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn()
      }))
    }));

    // Mock config
    jest.doMock('../../utils/config.js', () => ({
      Config: jest.fn().mockImplementation(() => ({
        getDataScenarios: jest.fn()
      }))
    }));

    // Import DataManager class
    const dataManagerModule = await import('../../core/data-manager.js');
    DataManager = dataManagerModule.DataManager;
    DataSeedingError = dataManagerModule.DataSeedingError;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup spawn mock
    const { spawn } = require('child_process');
    mockSpawn = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };
    spawn.mockReturnValue(mockSpawn);

    dataManager = new DataManager();
    mockLogger = dataManager.logger;
    mockConfig = dataManager.config;
  });

  describe('constructor', () => {
    it('should initialize with logger and config', () => {
      expect(dataManager.logger).toBeDefined();
      expect(dataManager.config).toBeDefined();
    });

    it('should set project root and data CLI path', () => {
      expect(dataManager.projectRoot).toBeDefined();
      expect(dataManager.dataCliPath).toContain('data-cli.js');
    });
  });

  describe('findProjectRoot', () => {
    it('should find project root from unified-test-cli directory', () => {
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue('/project/scripts/unified-test-cli');
      
      const manager = new DataManager();
      const root = manager.findProjectRoot();
      
      expect(root).toBe('/project');
      process.cwd = originalCwd;
    });

    it('should return current directory if not in unified-test-cli', () => {
      const originalCwd = process.cwd;
      process.cwd = jest.fn().mockReturnValue('/project');
      
      const manager = new DataManager();
      const root = manager.findProjectRoot();
      
      expect(root).toBe('/project');
      process.cwd = originalCwd;
    });
  });

  describe('seedScenario', () => {
    beforeEach(() => {
      mockConfig.getDataScenarios.mockResolvedValue({
        'minimal': {
          command: 'node scripts/data-cli.js seed-scenario minimal',
          estimatedTime: 15000,
          dependencies: ['localstack']
        }
      });
    });

    it('should skip seeding when no scenario specified', async () => {
      const result = await dataManager.seedScenario(null);
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('No data scenario specified, skipping seeding');
    });

    it('should successfully seed a valid scenario', async () => {
      // Mock successful command execution
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await dataManager.seedScenario('minimal');
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Seeding data scenario: minimal');
      expect(mockLogger.success).toHaveBeenCalledWith('Data scenario \'minimal\' seeded successfully');
    });

    it('should throw DataSeedingError for invalid scenario', async () => {
      mockConfig.getDataScenarios.mockResolvedValue({});
      
      await expect(dataManager.seedScenario('invalid-scenario'))
        .rejects.toThrow(DataSeedingError);
    });

    it('should handle command execution failure', async () => {
      // Mock failed command execution
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });
      mockSpawn.stderr = { on: jest.fn() };
      mockSpawn.stdout = { on: jest.fn() };

      await expect(dataManager.seedScenario('minimal'))
        .rejects.toThrow(DataSeedingError);
    });

    it('should pass options to data CLI command', async () => {
      const { spawn } = require('child_process');
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await dataManager.seedScenario('minimal', { force: true, validate: true });
      
      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining('data-cli.js'),
          'seed-scenario',
          'minimal'
        ]),
        expect.any(Object)
      );
    });
  });

  describe('getRequiredScenario', () => {
    it('should return explicit dataScenario from test suite', async () => {
      const testSuite = { dataScenario: 'custom-scenario' };
      const result = await dataManager.getRequiredScenario(testSuite);
      
      expect(result).toBe('custom-scenario');
    });

    it('should map by suite name', async () => {
      const testSuite = { name: 'frontend-e2e', type: 'e2e' };
      const result = await dataManager.getRequiredScenario(testSuite);
      
      expect(result).toBe('frontend-ready');
    });

    it('should map by suite type', async () => {
      const testSuite = { name: 'unknown-suite', type: 'integration' };
      const result = await dataManager.getRequiredScenario(testSuite);
      
      expect(result).toBe('minimal');
    });

    it('should map by tags', async () => {
      const testSuite = { 
        name: 'unknown-suite', 
        type: 'unknown', 
        tags: ['performance', 'load'] 
      };
      const result = await dataManager.getRequiredScenario(testSuite);
      
      expect(result).toBe('performance-test');
    });

    it('should return null for unit tests', async () => {
      const testSuite = { name: 'frontend-unit', type: 'unit' };
      const result = await dataManager.getRequiredScenario(testSuite);
      
      expect(result).toBe(null);
    });

    it('should return null when no mapping found', async () => {
      const testSuite = { name: 'unknown', type: 'unknown' };
      const result = await dataManager.getRequiredScenario(testSuite);
      
      expect(result).toBe(null);
    });
  });

  describe('buildScenarioMapping', () => {
    it('should return comprehensive mapping object', () => {
      const mapping = dataManager.buildScenarioMapping();
      
      expect(mapping).toHaveProperty('byName');
      expect(mapping).toHaveProperty('byType');
      expect(mapping).toHaveProperty('byTag');
      
      expect(mapping.byName['frontend-e2e']).toBe('frontend-ready');
      expect(mapping.byType['integration']).toBe('minimal');
      expect(mapping.byTag['performance']).toBe('performance-test');
    });
  });

  describe('cleanupScenario', () => {
    beforeEach(() => {
      mockConfig.getDataScenarios.mockResolvedValue({
        'minimal': {
          cleanup: 'node scripts/data-cli.js reset-data clean'
        }
      });
    });

    it('should skip cleanup when no scenario specified', async () => {
      const result = await dataManager.cleanupScenario(null);
      
      expect(result).toBe(true);
    });

    it('should successfully cleanup scenario', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await dataManager.cleanupScenario('minimal');
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up data scenario: minimal');
    });

    it('should use default cleanup when no custom cleanup specified', async () => {
      mockConfig.getDataScenarios.mockResolvedValue({
        'minimal': {}
      });
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await dataManager.cleanupScenario('minimal');
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'No cleanup command specified for scenario \'minimal\', using default cleanup'
      );
    });

    it('should handle cleanup failure gracefully', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });
      mockSpawn.stderr = { on: jest.fn() };
      mockSpawn.stdout = { on: jest.fn() };

      const result = await dataManager.cleanupScenario('minimal');
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('validateScenario', () => {
    it('should validate existing scenario', async () => {
      mockConfig.getDataScenarios.mockResolvedValue({
        'minimal': {
          command: 'node scripts/data-cli.js seed-scenario minimal'
        }
      });

      const result = await dataManager.validateScenario('minimal');
      
      expect(result).toBe(true);
    });

    it('should reject non-existent scenario', async () => {
      mockConfig.getDataScenarios.mockResolvedValue({});

      const result = await dataManager.validateScenario('non-existent');
      
      expect(result).toBe(false);
    });

    it('should reject scenario missing required fields', async () => {
      mockConfig.getDataScenarios.mockResolvedValue({
        'invalid': {}
      });

      const result = await dataManager.validateScenario('invalid');
      
      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Data scenario \'invalid\' missing required field: command'
      );
    });

    it('should handle validation errors', async () => {
      mockConfig.getDataScenarios.mockRejectedValue(new Error('Config error'));

      const result = await dataManager.validateScenario('minimal');
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('executeDataCliCommand', () => {
    it('should execute data CLI command successfully', async () => {
      const { spawn } = require('child_process');
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await dataManager.executeDataCliCommand('seed-scenario', ['minimal']);
      
      expect(result).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining('data-cli.js'),
          'seed-scenario',
          'minimal'
        ]),
        expect.objectContaining({
          cwd: dataManager.projectRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: false
        })
      );
    });

    it('should handle command execution error', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Command not found')), 10);
        }
      });

      await expect(dataManager.executeDataCliCommand('invalid-command'))
        .rejects.toThrow('Command not found');
    });

    it('should handle command timeout', async () => {
      // Don't call any callbacks to simulate timeout
      mockSpawn.on.mockImplementation(() => {});

      await expect(
        dataManager.executeDataCliCommand('seed-scenario', ['minimal'], { timeout: 100 })
      ).rejects.toThrow('timed out');
    });

    it('should add option flags to command', async () => {
      const { spawn } = require('child_process');
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await dataManager.executeDataCliCommand('seed-scenario', ['minimal'], {
        force: true,
        validate: true,
        scenario: 'test'
      });
      
      // Verify spawn was called with correct arguments
      expect(spawn).toHaveBeenCalled();
    });
  });

  describe('listScenarios', () => {
    it('should list all available scenarios', async () => {
      const mockScenarios = {
        'minimal': {
          description: 'Minimal test data',
          estimatedTime: 15000,
          dependencies: ['localstack']
        },
        'full': {
          description: 'Full test dataset'
        }
      };
      mockConfig.getDataScenarios.mockResolvedValue(mockScenarios);

      const result = await dataManager.listScenarios();
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'minimal',
        description: 'Minimal test data',
        estimatedTime: 15000,
        dependencies: ['localstack']
      });
      expect(result[1]).toEqual({
        name: 'full',
        description: 'Full test dataset',
        estimatedTime: 'Unknown',
        dependencies: []
      });
    });

    it('should handle listing error', async () => {
      mockConfig.getDataScenarios.mockRejectedValue(new Error('Config error'));

      await expect(dataManager.listScenarios()).rejects.toThrow('Config error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('isDataCliAvailable', () => {
    it('should return true when data-cli.js exists', async () => {
      const fs = await import('fs');
      fs.existsSync.mockReturnValue(true);

      const result = await dataManager.isDataCliAvailable();
      
      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(dataManager.dataCliPath);
    });

    it('should return false when data-cli.js does not exist', async () => {
      const fs = await import('fs');
      fs.existsSync.mockReturnValue(false);

      const result = await dataManager.isDataCliAvailable();
      
      expect(result).toBe(false);
    });

    it('should handle file system errors', async () => {
      const fs = await import('fs');
      fs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = await dataManager.isDataCliAvailable();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getDataStatus', () => {
    it('should return available status when data-status succeeds', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await dataManager.getDataStatus();
      
      expect(result).toEqual({
        available: true,
        message: 'Data management system is operational'
      });
    });

    it('should return unavailable status when data-status fails', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });
      mockSpawn.stderr = { on: jest.fn() };
      mockSpawn.stdout = { on: jest.fn() };

      const result = await dataManager.getDataStatus();
      
      expect(result.available).toBe(false);
      expect(result.message).toContain('Data management system error');
    });

    it('should handle execution errors', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Execution error')), 10);
        }
      });

      const result = await dataManager.getDataStatus();
      
      expect(result).toEqual({
        available: false,
        message: 'Data management system error: Execution error'
      });
    });
  });

  describe('validateDependencies', () => {
    it('should return true when no dependencies specified', async () => {
      const result = await dataManager.validateDependencies([]);
      
      expect(result).toBe(true);
    });

    it('should validate dependencies using health-check', async () => {
      const { spawn } = require('child_process');
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await dataManager.validateDependencies(['localstack']);
      
      expect(result).toBe(true);
      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining('data-cli.js'),
          'health-check'
        ]),
        expect.any(Object)
      );
    });

    it('should return false when health-check fails', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      const result = await dataManager.validateDependencies(['localstack']);
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('resetData', () => {
    it('should reset data to specified state', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await dataManager.resetData('clean');
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Resetting data to state: clean');
      expect(mockLogger.success).toHaveBeenCalledWith('Data reset to \'clean\' state successfully');
    });

    it('should handle reset failure', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });
      mockSpawn.stderr = { on: jest.fn() };
      mockSpawn.stdout = { on: jest.fn() };

      await expect(dataManager.resetData('clean')).rejects.toThrow(
        'Data CLI command failed with exit code 1'
      );
    });

    it('should use default clean state', async () => {
      const { spawn } = require('child_process');
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await dataManager.resetData();
      
      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining('data-cli.js'),
          'reset-data',
          'clean'
        ]),
        expect.any(Object)
      );
    });
  });

  describe('DataSeedingError', () => {
    it('should create error with scenario and original error', () => {
      const originalError = new Error('Original error message');
      const error = new DataSeedingError('test-scenario', originalError);
      
      expect(error.name).toBe('DataSeedingError');
      expect(error.message).toBe('Failed to seed data scenario \'test-scenario\': Original error message');
      expect(error.scenario).toBe('test-scenario');
      expect(error.originalError).toBe(originalError);
    });
  });
});