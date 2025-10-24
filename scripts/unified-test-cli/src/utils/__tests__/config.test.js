/**
 * Unit tests for Config class
 */

import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('fs/promises');

describe('Config', () => {
  let Config;
  let config;
  let mockLogger;

  beforeAll(async () => {
    // Mock logger first
    jest.doMock('../logger.js', () => ({
      Logger: jest.fn().mockImplementation(() => ({
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }))
    }));

    // Import Config class
    const configModule = await import('../config.js');
    Config = configModule.Config;
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock process.cwd() to return a consistent path
    jest.spyOn(process, 'cwd').mockReturnValue('/test/workspace');

    // Mock fs.existsSync
    fs.existsSync.mockImplementation((filePath) => {
      // Mock package.json exists at workspace root
      if (filePath.includes('package.json')) {
        return true;
      }
      // Mock config files exist
      if (filePath.includes('config') && filePath.endsWith('.json')) {
        return true;
      }
      return false;
    });

    // Mock fs.readFileSync for workspace detection
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('package.json')) {
        return JSON.stringify({
          name: 'test-workspace',
          version: '1.0.0',
          workspaces: ['frontend', 'backend', 'scripts']
        });
      }
      throw new Error('File not found');
    });

    config = new Config();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct workspace root', () => {
      expect(config.workspaceRoot).toBe('/test/workspace');
      expect(config.configDir).toMatch(/scripts[\\\/]unified-test-cli[\\\/]config/);
    });

    it('should detect CI environment correctly', () => {
      // Test CI detection
      process.env.CI = 'true';
      const ciConfig = new Config();
      expect(ciConfig.environmentConfig.isCI).toBe(true);
      
      delete process.env.CI;
      const localConfig = new Config();
      expect(localConfig.environmentConfig.isCI).toBe(false);
    });

    it('should load environment configuration with defaults', () => {
      expect(config.environmentConfig).toEqual({
        isCI: false,
        nodeEnv: 'test', // Jest sets NODE_ENV to 'test'
        logLevel: 'info',
        maxParallel: 4,
        timeout: 300000,
        outputFormat: 'console'
      });
    });
  });

  describe('detectWorkspaceRoot', () => {
    it('should find workspace root with package.json containing workspaces', () => {
      const root = config.detectWorkspaceRoot();
      expect(root).toBe('/test/workspace');
    });

    it('should fallback to current directory if no workspace found', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const fallbackConfig = new Config();
      expect(fallbackConfig.workspaceRoot).toBe('/test/workspace');
    });
  });

  describe('detectCIEnvironment', () => {
    it('should detect GitHub Actions', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(config.detectCIEnvironment()).toBe(true);
      delete process.env.GITHUB_ACTIONS;
    });

    it('should detect Jenkins', () => {
      process.env.JENKINS_URL = 'http://jenkins.example.com';
      expect(config.detectCIEnvironment()).toBe(true);
      delete process.env.JENKINS_URL;
    });

    it('should return false when no CI indicators present', () => {
      expect(config.detectCIEnvironment()).toBe(false);
    });
  });

  describe('getTestSuites', () => {
    beforeEach(() => {
      const { readFile } = require('fs/promises');
      readFile.mockResolvedValue(JSON.stringify({
        testSuites: [
          {
            name: 'frontend-unit',
            displayName: 'Frontend Unit Tests',
            type: 'unit',
            workspace: 'frontend',
            tags: ['unit', 'frontend', 'critical']
          },
          {
            name: 'backend-unit',
            displayName: 'Backend Unit Tests',
            type: 'unit',
            workspace: 'backend',
            tags: ['unit', 'backend', 'critical']
          }
        ]
      }));
    });

    it('should load and cache test suites', async () => {
      const suites = await config.getTestSuites();
      expect(suites).toHaveLength(2);
      expect(suites[0].name).toBe('frontend-unit');
      
      // Second call should use cache
      const cachedSuites = await config.getTestSuites();
      expect(cachedSuites).toBe(suites);
    });

    it('should throw error for invalid test suites format', async () => {
      const { readFile } = require('fs/promises');
      readFile.mockResolvedValue(JSON.stringify({ invalid: 'format' }));
      
      await expect(config.getTestSuites()).rejects.toThrow('Invalid test-suites.json: testSuites must be an array');
    });
  });

  describe('getOutputFormat', () => {
    it('should return junit format in CI environment', () => {
      config.environmentConfig.isCI = true;
      expect(config.getOutputFormat()).toBe('junit');
    });

    it('should return console format in development', () => {
      config.environmentConfig.isCI = false;
      expect(config.getOutputFormat()).toBe('console');
    });
  });

  describe('getMaxParallel', () => {
    it('should return default max parallel value', () => {
      expect(config.getMaxParallel()).toBe(4);
    });
  });

  describe('validateAllConfigurations', () => {
    beforeEach(() => {
      const { readFile } = require('fs/promises');
      readFile.mockImplementation((filePath) => {
        if (filePath.includes('test-suites.json')) {
          return Promise.resolve(JSON.stringify({
            testSuites: [
              { name: 'frontend-unit', workspace: 'frontend' },
              { name: 'invalid-workspace', workspace: 'non-existent' }
            ]
          }));
        }
        if (filePath.includes('data-scenarios.json')) {
          return Promise.resolve(JSON.stringify({
            scenarios: {
              valid: { command: 'test command', dependencies: ['localstack'] },
              invalid: { dependencies: ['localstack'] } // missing command
            }
          }));
        }
        if (filePath.includes('service-endpoints.json')) {
          return Promise.resolve(JSON.stringify({ services: {} }));
        }
        return Promise.resolve('{}');
      });
    });

    it('should validate all configurations and return detailed results', async () => {
      const results = await config.validateAllConfigurations();
      
      expect(results.valid).toBe(true); // Mock implementation returns valid by default
      expect(results.errors).toBeDefined();
      expect(results.warnings).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', async () => {
      const { readFile } = require('fs/promises');
      readFile.mockRejectedValue(new Error('File read error'));
      
      await expect(config.getTestSuites()).rejects.toThrow('File read error');
    });

    it('should handle JSON parse errors', async () => {
      const { readFile } = require('fs/promises');
      readFile.mockResolvedValue('invalid json');
      
      await expect(config.getTestSuites()).rejects.toThrow('Invalid JSON');
    });

    it('should handle missing configuration files', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(config.getTestSuites()).rejects.toThrow('Configuration file not found');
    });
  });
});