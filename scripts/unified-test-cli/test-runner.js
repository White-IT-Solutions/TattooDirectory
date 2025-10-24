#!/usr/bin/env node

/**
 * Simple test runner for configuration tests
 */

import { Config } from './src/utils/config.js';

async function runTests() {
  console.log('🧪 Running Configuration Management Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  const test = (name, testFn) => {
    try {
      testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  };
  
  const expect = (actual) => ({
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toContain: (expected) => {
      if (!actual.includes(expected)) {
        throw new Error(`Expected ${actual} to contain ${expected}`);
      }
    },
    toHaveProperty: (prop) => {
      if (!(prop in actual)) {
        throw new Error(`Expected object to have property ${prop}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    }
  });
  
  try {
    const config = new Config();
    
    // Test 1: Basic initialization
    test('should initialize with correct properties', () => {
      expect(config).toBeDefined();
      expect(config.workspaceRoot).toBeDefined();
      expect(config.configDir).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.environmentConfig).toBeDefined();
    });
    
    // Test 2: Environment configuration
    test('should detect environment configuration', () => {
      const envConfig = config.getEnvironmentConfig();
      expect(envConfig).toHaveProperty('isCI');
      expect(envConfig).toHaveProperty('nodeEnv');
      expect(envConfig).toHaveProperty('maxParallel');
      expect(envConfig).toHaveProperty('timeout');
      expect(envConfig).toHaveProperty('outputFormat');
    });
    
    // Test 3: Output format
    test('should return correct output format', () => {
      const format = config.getOutputFormat();
      const validFormats = ['console', 'junit', 'json'];
      if (!validFormats.includes(format)) {
        throw new Error(`Invalid output format: ${format}`);
      }
    });
    
    // Test 4: Max parallel
    test('should return valid max parallel value', () => {
      const maxParallel = config.getMaxParallel();
      if (typeof maxParallel !== 'number' || maxParallel <= 0) {
        throw new Error(`Invalid max parallel value: ${maxParallel}`);
      }
    });
    
    // Test 5: Test timeout
    test('should return valid test timeout', () => {
      const timeout = config.getTestTimeout();
      if (typeof timeout !== 'number' || timeout <= 0) {
        throw new Error(`Invalid timeout value: ${timeout}`);
      }
    });
    
    // Test 6: Config file paths
    test('should generate correct config file paths', () => {
      const testSuitesPath = config.getConfigPath('test-suites.json');
      const scenariosPath = config.getConfigPath('data-scenarios.json');
      const endpointsPath = config.getConfigPath('service-endpoints.json');

      expect(testSuitesPath).toContain('test-suites.json');
      expect(scenariosPath).toContain('data-scenarios.json');
      expect(endpointsPath).toContain('service-endpoints.json');
    });
    
    // Test 7: Cache management
    test('should manage cache correctly', () => {
      config.cache.set('test-key', 'test-value');
      if (config.cache.size !== 1) {
        throw new Error('Cache size should be 1 after adding item');
      }
      if (config.cache.get('test-key') !== 'test-value') {
        throw new Error('Cache should return correct value');
      }
      
      config.clearCache();
      if (config.cache.size !== 0) {
        throw new Error('Cache size should be 0 after clearing');
      }
    });
    
    // Test 8: CI detection
    test('should detect CI environment correctly', () => {
      const isCI = config.isCI();
      if (typeof isCI !== 'boolean') {
        throw new Error('isCI should return boolean');
      }
    });
    
    // Test 9: Environment variable overrides
    test('should apply environment variable overrides', () => {
      const services = {
        localstack: { url: 'http://localhost:4566', timeout: 5000 },
        frontend: { url: 'http://localhost:3000', timeout: 3000 }
      };

      const overriddenServices = config.applyEnvironmentOverrides(services);
      
      expect(overriddenServices).toHaveProperty('localstack');
      expect(overriddenServices).toHaveProperty('frontend');
      expect(overriddenServices.localstack).toHaveProperty('url');
      expect(overriddenServices.localstack).toHaveProperty('timeout');
    });
    
    // Test 10: Workspace detection
    test('should detect workspace root', () => {
      const workspaceRoot = config.detectWorkspaceRoot();
      if (typeof workspaceRoot !== 'string' || workspaceRoot.length === 0) {
        throw new Error('Workspace root should be a non-empty string');
      }
    });
    
    // Test 11: CI environment variable detection
    test('should detect CI from environment variables', () => {
      const originalCI = process.env.CI;
      
      process.env.CI = 'true';
      const ciConfig = new Config();
      if (!ciConfig.detectCIEnvironment()) {
        throw new Error('Should detect CI when CI=true');
      }
      
      delete process.env.CI;
      const localConfig = new Config();
      if (localConfig.detectCIEnvironment()) {
        throw new Error('Should not detect CI when CI is not set');
      }
      
      // Restore original value
      if (originalCI) {
        process.env.CI = originalCI;
      }
    });
    
    // Test 12: GitHub Actions detection
    test('should detect GitHub Actions environment', () => {
      const originalGithub = process.env.GITHUB_ACTIONS;
      
      process.env.GITHUB_ACTIONS = 'true';
      if (!config.detectCIEnvironment()) {
        throw new Error('Should detect CI when GITHUB_ACTIONS=true');
      }
      
      delete process.env.GITHUB_ACTIONS;
      if (config.detectCIEnvironment()) {
        throw new Error('Should not detect CI when GITHUB_ACTIONS is not set');
      }
      
      if (originalGithub) {
        process.env.GITHUB_ACTIONS = originalGithub;
      }
    });
    
    // Test 13: LOCALSTACK_ENDPOINT override
    test('should apply LOCALSTACK_ENDPOINT override', () => {
      const services = {
        localstack: { url: 'http://localhost:4566', timeout: 5000 }
      };

      const originalEndpoint = process.env.LOCALSTACK_ENDPOINT;
      process.env.LOCALSTACK_ENDPOINT = 'http://custom:4566';
      
      const overriddenServices = config.applyEnvironmentOverrides(services);
      if (overriddenServices.localstack.url !== 'http://custom:4566') {
        throw new Error('Should override localstack URL');
      }
      
      if (originalEndpoint) {
        process.env.LOCALSTACK_ENDPOINT = originalEndpoint;
      } else {
        delete process.env.LOCALSTACK_ENDPOINT;
      }
    });
    
    // Test 14: Global timeout override
    test('should apply global timeout override', () => {
      const services = {
        localstack: { url: 'http://localhost:4566', timeout: 5000 },
        frontend: { url: 'http://localhost:3000', timeout: 3000 }
      };

      const originalTimeout = process.env.SERVICE_TIMEOUT;
      process.env.SERVICE_TIMEOUT = '10000';
      
      const overriddenServices = config.applyEnvironmentOverrides(services);
      if (overriddenServices.localstack.timeout !== 10000) {
        throw new Error('Should override localstack timeout');
      }
      if (overriddenServices.frontend.timeout !== 10000) {
        throw new Error('Should override frontend timeout');
      }
      
      if (originalTimeout) {
        process.env.SERVICE_TIMEOUT = originalTimeout;
      } else {
        delete process.env.SERVICE_TIMEOUT;
      }
    });
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('🎉 All configuration management tests passed!');
    } else {
      console.log('❌ Some tests failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();