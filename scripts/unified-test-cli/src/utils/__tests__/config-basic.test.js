/**
 * Basic integration tests for Config class
 * Tests the actual configuration loading functionality
 */

import fs from 'fs';
import path from 'path';

describe('Config Integration Tests', () => {
  let Config;
  let config;

  beforeAll(async () => {
    // Import the Config class
    const configModule = await import('../config.js');
    Config = configModule.Config;
  });

  beforeEach(() => {
    config = new Config();
  });

  describe('Environment Detection', () => {
    it('should detect CI environment from environment variables', () => {
      const originalCI = process.env.CI;
      
      // Test CI detection
      process.env.CI = 'true';
      const ciConfig = new Config();
      expect(ciConfig.detectCIEnvironment()).toBe(true);
      
      // Test non-CI
      delete process.env.CI;
      const localConfig = new Config();
      expect(localConfig.detectCIEnvironment()).toBe(false);
      
      // Restore original value
      if (originalCI) {
        process.env.CI = originalCI;
      }
    });

    it('should detect GitHub Actions environment', () => {
      const originalGithub = process.env.GITHUB_ACTIONS;
      
      process.env.GITHUB_ACTIONS = 'true';
      expect(config.detectCIEnvironment()).toBe(true);
      
      delete process.env.GITHUB_ACTIONS;
      expect(config.detectCIEnvironment()).toBe(false);
      
      if (originalGithub) {
        process.env.GITHUB_ACTIONS = originalGithub;
      }
    });
  });

  describe('Configuration Methods', () => {
    it('should have correct configuration directory path', () => {
      expect(config.configDir).toMatch(/unified-test-cli[\\\/]config/);
    });

    it('should return environment configuration', () => {
      const envConfig = config.getEnvironmentConfig();
      expect(envConfig).toHaveProperty('isCI');
      expect(envConfig).toHaveProperty('nodeEnv');
      expect(envConfig).toHaveProperty('maxParallel');
      expect(envConfig).toHaveProperty('timeout');
      expect(envConfig).toHaveProperty('outputFormat');
    });

    it('should return correct output format based on environment', () => {
      // In development, should return console
      config.environmentConfig.isCI = false;
      expect(config.getOutputFormat()).toBe('console');
      
      // In CI, should return junit
      config.environmentConfig.isCI = true;
      expect(config.getOutputFormat()).toBe('junit');
    });

    it('should return default max parallel value', () => {
      expect(config.getMaxParallel()).toBe(4);
    });

    it('should return test timeout', () => {
      expect(config.getTestTimeout()).toBe(300000);
    });
  });

  describe('Configuration File Paths', () => {
    it('should return correct config file paths', () => {
      const testSuitesPath = config.getConfigPath('test-suites.json');
      expect(testSuitesPath).toContain('test-suites.json');
      
      const scenariosPath = config.getConfigPath('data-scenarios.json');
      expect(scenariosPath).toContain('data-scenarios.json');
      
      const endpointsPath = config.getConfigPath('service-endpoints.json');
      expect(endpointsPath).toContain('service-endpoints.json');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', () => {
      // Add something to cache
      config.cache.set('test', 'value');
      expect(config.cache.size).toBe(1);
      
      // Clear cache
      config.clearCache();
      expect(config.cache.size).toBe(0);
    });
  });

  describe('Environment Variable Overrides', () => {
    it('should apply environment variable overrides to services', () => {
      const services = {
        localstack: {
          url: 'http://localhost:4566',
          timeout: 5000
        },
        frontend: {
          url: 'http://localhost:3000',
          timeout: 3000
        }
      };

      // Test LOCALSTACK_ENDPOINT override
      const originalEndpoint = process.env.LOCALSTACK_ENDPOINT;
      process.env.LOCALSTACK_ENDPOINT = 'http://custom:4566';
      
      const overriddenServices = config.applyEnvironmentOverrides(services);
      expect(overriddenServices.localstack.url).toBe('http://custom:4566');
      
      // Restore original value
      if (originalEndpoint) {
        process.env.LOCALSTACK_ENDPOINT = originalEndpoint;
      } else {
        delete process.env.LOCALSTACK_ENDPOINT;
      }
    });

    it('should apply global timeout override', () => {
      const services = {
        localstack: { url: 'http://localhost:4566', timeout: 5000 },
        frontend: { url: 'http://localhost:3000', timeout: 3000 }
      };

      const originalTimeout = process.env.SERVICE_TIMEOUT;
      process.env.SERVICE_TIMEOUT = '10000';
      
      const overriddenServices = config.applyEnvironmentOverrides(services);
      expect(overriddenServices.localstack.timeout).toBe(10000);
      expect(overriddenServices.frontend.timeout).toBe(10000);
      
      // Restore original value
      if (originalTimeout) {
        process.env.SERVICE_TIMEOUT = originalTimeout;
      } else {
        delete process.env.SERVICE_TIMEOUT;
      }
    });
  });

  describe('Workspace Detection', () => {
    it('should detect workspace root', () => {
      const workspaceRoot = config.detectWorkspaceRoot();
      expect(workspaceRoot).toBeTruthy();
      expect(typeof workspaceRoot).toBe('string');
    });
  });
});