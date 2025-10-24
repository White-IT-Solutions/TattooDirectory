/**
 * Unit tests for TestDiscovery class
 * 
 * Tests test suite discovery, validation, and metadata extraction functionality
 */

import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('path');

describe('TestDiscovery', () => {
  let TestDiscovery;
  let testDiscovery;
  let mockLogger;
  let mockConfig;

  beforeAll(async () => {
    // Mock logger first
    jest.doMock('../../utils/logger.js', () => ({
      Logger: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      }))
    }));

    // Mock config
    jest.doMock('../../utils/config.js', () => ({
      Config: jest.fn().mockImplementation(() => ({
        getConfigPath: jest.fn()
      }))
    }));

    // Import TestDiscovery class
    const testDiscoveryModule = await import('../../core/test-discovery.js');
    TestDiscovery = testDiscoveryModule.TestDiscovery;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock process.cwd() to return a consistent path
    jest.spyOn(process, 'cwd').mockReturnValue('/project/scripts/unified-test-cli');

    // Mock path.join to return predictable paths
    path.join.mockImplementation((...args) => args.join('/'));

    // Create TestDiscovery instance
    testDiscovery = new TestDiscovery();
    mockLogger = testDiscovery.logger;
    mockConfig = testDiscovery.config;
  });

  describe('constructor', () => {
    it('should initialize with logger and config instances', () => {
      expect(testDiscovery.logger).toBeDefined();
      expect(testDiscovery.config).toBeDefined();
    });
  });

  describe('discoverSuites', () => {
    it('should discover and return valid test suites', async () => {
      const mockSuites = [
        {
          name: 'frontend-unit',
          command: 'npm run test',
          workspace: 'frontend'
        },
        {
          name: 'backend-unit',
          command: 'npm run test',
          workspace: 'backend'
        }
      ];

      // Mock loadConfigSuites to return test suites
      jest.spyOn(testDiscovery, 'loadConfigSuites').mockResolvedValue(mockSuites);
      
      // Mock validateSuite to return true for all suites
      jest.spyOn(testDiscovery, 'validateSuite').mockResolvedValue(true);

      const result = await testDiscovery.discoverSuites();

      expect(result).toEqual(mockSuites);
      expect(mockLogger.info).toHaveBeenCalledWith('Discovering test suites in workspace');
      expect(mockLogger.info).toHaveBeenCalledWith('Discovered 2 valid test suites');
      expect(testDiscovery.loadConfigSuites).toHaveBeenCalled();
      expect(testDiscovery.validateSuite).toHaveBeenCalledTimes(2);
    });

    it('should filter out invalid test suites', async () => {
      const mockSuites = [
        {
          name: 'valid-suite',
          command: 'npm run test',
          workspace: 'frontend'
        },
        {
          name: 'invalid-suite',
          command: 'npm run test',
          workspace: 'nonexistent'
        }
      ];

      jest.spyOn(testDiscovery, 'loadConfigSuites').mockResolvedValue(mockSuites);
      jest.spyOn(testDiscovery, 'validateSuite')
        .mockResolvedValueOnce(true)  // valid-suite
        .mockResolvedValueOnce(false); // invalid-suite

      const result = await testDiscovery.discoverSuites();

      expect(result).toEqual([mockSuites[0]]);
      expect(mockLogger.warn).toHaveBeenCalledWith('Skipping invalid test suite: invalid-suite');
      expect(mockLogger.info).toHaveBeenCalledWith('Discovered 1 valid test suites');
    });

    it('should handle errors during discovery', async () => {
      const error = new Error('Config loading failed');
      jest.spyOn(testDiscovery, 'loadConfigSuites').mockRejectedValue(error);

      await expect(testDiscovery.discoverSuites()).rejects.toThrow('Test suite discovery failed: Config loading failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to discover test suites', { error: 'Config loading failed' });
    });
  });

  describe('loadConfigSuites', () => {
    it('should load test suites from configuration file', async () => {
      const configPath = '/path/to/test-suites.json';
      const mockConfigData = {
        testSuites: [
          { name: 'suite1', command: 'test1' },
          { name: 'suite2', command: 'test2' }
        ]
      };

      const { readFile } = require('fs/promises');
      mockConfig.getConfigPath.mockReturnValue(configPath);
      fs.existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(JSON.stringify(mockConfigData));

      const result = await testDiscovery.loadConfigSuites();

      expect(result).toEqual(mockConfigData.testSuites);
      expect(mockConfig.getConfigPath).toHaveBeenCalledWith('test-suites.json');
      expect(fs.existsSync).toHaveBeenCalledWith(configPath);
      expect(readFile).toHaveBeenCalledWith(configPath, 'utf-8');
    });

    it('should throw error if configuration file does not exist', async () => {
      const configPath = '/path/to/test-suites.json';
      mockConfig.getConfigPath.mockReturnValue(configPath);
      fs.existsSync.mockReturnValue(false);

      await expect(testDiscovery.loadConfigSuites()).rejects.toThrow(
        `Test suites configuration not found at: ${configPath}`
      );
    });

    it('should throw error if configuration is invalid JSON', async () => {
      const configPath = '/path/to/test-suites.json';
      const { readFile } = require('fs/promises');
      mockConfig.getConfigPath.mockReturnValue(configPath);
      fs.existsSync.mockReturnValue(true);
      readFile.mockResolvedValue('invalid json');

      await expect(testDiscovery.loadConfigSuites()).rejects.toThrow(
        'Failed to load test suites configuration:'
      );
    });

    it('should throw error if testSuites is not an array', async () => {
      const configPath = '/path/to/test-suites.json';
      const mockConfigData = { testSuites: 'not an array' };
      const { readFile } = require('fs/promises');

      mockConfig.getConfigPath.mockReturnValue(configPath);
      fs.existsSync.mockReturnValue(true);
      readFile.mockResolvedValue(JSON.stringify(mockConfigData));

      await expect(testDiscovery.loadConfigSuites()).rejects.toThrow(
        'Invalid configuration: testSuites must be an array'
      );
    });
  });

  describe('validateSuite', () => {

    it('should validate suite with all required fields', async () => {
      const suite = {
        name: 'test-suite',
        command: 'npm run test',
        workspace: 'frontend'
      };

      fs.existsSync.mockReturnValueOnce(true)  // workspace exists
                   .mockReturnValueOnce(true); // package.json exists

      const result = await testDiscovery.validateSuite(suite);

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/project/scripts/unified-test-cli/../../frontend');
      expect(fs.existsSync).toHaveBeenCalledWith('/project/scripts/unified-test-cli/../../frontend/package.json');
    });

    it('should reject suite missing required name field', async () => {
      const suite = {
        command: 'npm run test'
      };

      const result = await testDiscovery.validateSuite(suite);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Test suite missing required field 'name': undefined"
      );
    });

    it('should reject suite missing required command field', async () => {
      const suite = {
        name: 'test-suite'
      };

      const result = await testDiscovery.validateSuite(suite);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Test suite missing required field 'command': test-suite"
      );
    });

    it('should reject suite with nonexistent workspace', async () => {
      const suite = {
        name: 'test-suite',
        command: 'npm run test',
        workspace: 'nonexistent'
      };

      fs.existsSync.mockReturnValue(false);

      const result = await testDiscovery.validateSuite(suite);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Workspace not found for suite 'test-suite': /project/scripts/unified-test-cli/../../nonexistent"
      );
    });

    it('should reject suite with workspace missing package.json', async () => {
      const suite = {
        name: 'test-suite',
        command: 'npm run test',
        workspace: 'frontend'
      };

      fs.existsSync.mockReturnValueOnce(true)   // workspace exists
                   .mockReturnValueOnce(false); // package.json missing

      const result = await testDiscovery.validateSuite(suite);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "package.json not found in workspace for suite 'test-suite': /project/scripts/unified-test-cli/../../frontend/package.json"
      );
    });

    it('should validate suite without workspace', async () => {
      const suite = {
        name: 'test-suite',
        command: 'npm run test'
      };

      const result = await testDiscovery.validateSuite(suite);

      expect(result).toBe(true);
      expect(fs.existsSync).not.toHaveBeenCalled();
    });

    it('should handle project root detection when not in unified-test-cli directory', async () => {
      jest.spyOn(process, 'cwd').mockReturnValue('/project');
      
      const suite = {
        name: 'test-suite',
        command: 'npm run test',
        workspace: 'frontend'
      };

      fs.existsSync.mockReturnValueOnce(true)  // workspace exists
                   .mockReturnValueOnce(true); // package.json exists

      const result = await testDiscovery.validateSuite(suite);

      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/project/frontend');
    });
  });

  describe('getSuite', () => {
    it('should return suite by name', async () => {
      const mockSuites = [
        { name: 'suite1', command: 'test1' },
        { name: 'suite2', command: 'test2' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuite('suite2');

      expect(result).toEqual(mockSuites[1]);
    });

    it('should return null if suite not found', async () => {
      const mockSuites = [
        { name: 'suite1', command: 'test1' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuite('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSuitesByType', () => {
    it('should return suites filtered by type', async () => {
      const mockSuites = [
        { name: 'suite1', type: 'unit', command: 'test1' },
        { name: 'suite2', type: 'integration', command: 'test2' },
        { name: 'suite3', type: 'unit', command: 'test3' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuitesByType('unit');

      expect(result).toEqual([mockSuites[0], mockSuites[2]]);
    });

    it('should return empty array if no suites match type', async () => {
      const mockSuites = [
        { name: 'suite1', type: 'unit', command: 'test1' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuitesByType('e2e');

      expect(result).toEqual([]);
    });
  });

  describe('getSuitesByTags', () => {
    it('should return suites filtered by tags', async () => {
      const mockSuites = [
        { name: 'suite1', tags: ['fast', 'unit'], command: 'test1' },
        { name: 'suite2', tags: ['slow', 'integration'], command: 'test2' },
        { name: 'suite3', tags: ['fast', 'e2e'], command: 'test3' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuitesByTags(['fast']);

      expect(result).toEqual([mockSuites[0], mockSuites[2]]);
    });

    it('should return suites matching any of the provided tags', async () => {
      const mockSuites = [
        { name: 'suite1', tags: ['fast', 'unit'], command: 'test1' },
        { name: 'suite2', tags: ['slow', 'integration'], command: 'test2' },
        { name: 'suite3', tags: ['critical'], command: 'test3' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuitesByTags(['fast', 'critical']);

      expect(result).toEqual([mockSuites[0], mockSuites[2]]);
    });

    it('should return empty array if no suites have matching tags', async () => {
      const mockSuites = [
        { name: 'suite1', tags: ['unit'], command: 'test1' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuitesByTags(['nonexistent']);

      expect(result).toEqual([]);
    });

    it('should handle suites without tags', async () => {
      const mockSuites = [
        { name: 'suite1', command: 'test1' },
        { name: 'suite2', tags: ['fast'], command: 'test2' }
      ];

      jest.spyOn(testDiscovery, 'discoverSuites').mockResolvedValue(mockSuites);

      const result = await testDiscovery.getSuitesByTags(['fast']);

      expect(result).toEqual([mockSuites[1]]);
    });
  });

  describe('error handling', () => {
    it('should handle file system errors gracefully', async () => {
      const error = new Error('File system error');
      jest.spyOn(testDiscovery, 'loadConfigSuites').mockRejectedValue(error);

      await expect(testDiscovery.discoverSuites()).rejects.toThrow(
        'Test suite discovery failed: File system error'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to discover test suites',
        { error: 'File system error' }
      );
    });

    it('should handle JSON parsing errors', async () => {
      const configPath = '/path/to/test-suites.json';
      const { readFile } = require('fs/promises');
      mockConfig.getConfigPath.mockReturnValue(configPath);
      fs.existsSync.mockReturnValue(true);
      readFile.mockRejectedValue(new SyntaxError('Unexpected token'));

      await expect(testDiscovery.loadConfigSuites()).rejects.toThrow(
        'Failed to load test suites configuration:'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex suite configurations', async () => {
      const complexSuite = {
        name: 'complex-suite',
        displayName: 'Complex Test Suite',
        description: 'A complex test suite with all options',
        type: 'integration',
        workspace: 'tests/integration',
        command: 'npm run test:integration',
        requiredServices: ['localstack', 'database'],
        dataScenario: 'full-dataset',
        timeout: 120000,
        canRunParallel: false,
        supportsCoverage: true,
        tags: ['integration', 'slow', 'critical']
      };

      jest.spyOn(testDiscovery, 'loadConfigSuites').mockResolvedValue([complexSuite]);
      jest.spyOn(testDiscovery, 'validateSuite').mockResolvedValue(true);

      const result = await testDiscovery.discoverSuites();

      expect(result).toEqual([complexSuite]);
      expect(testDiscovery.validateSuite).toHaveBeenCalledWith(complexSuite, {});
    });

    it('should handle empty configuration', async () => {
      jest.spyOn(testDiscovery, 'loadConfigSuites').mockResolvedValue([]);

      const result = await testDiscovery.discoverSuites();

      expect(result).toEqual([]);
      expect(mockLogger.info).toHaveBeenCalledWith('Discovered 0 valid test suites');
    });

    it('should handle mixed valid and invalid suites', async () => {
      const mixedSuites = [
        { name: 'valid1', command: 'test1' },
        { name: 'invalid1' }, // missing command
        { name: 'valid2', command: 'test2' },
        { name: 'invalid2', command: 'test3', workspace: 'nonexistent' }
      ];

      jest.spyOn(testDiscovery, 'loadConfigSuites').mockResolvedValue(mixedSuites);
      jest.spyOn(testDiscovery, 'validateSuite')
        .mockResolvedValueOnce(true)   // valid1
        .mockResolvedValueOnce(false)  // invalid1
        .mockResolvedValueOnce(true)   // valid2
        .mockResolvedValueOnce(false); // invalid2

      const result = await testDiscovery.discoverSuites();

      expect(result).toEqual([mixedSuites[0], mixedSuites[2]]);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Discovered 2 valid test suites');
    });
  });
});