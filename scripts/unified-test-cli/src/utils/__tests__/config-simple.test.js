/**
 * Simple unit tests for Config class functionality
 * These tests focus on core functionality without complex mocking
 */

describe('Config Simple Tests', () => {
  let Config;
  let config;

  beforeAll(async () => {
    // Import Config class
    const configModule = await import('../config.js');
    Config = configModule.Config;
  });

  beforeEach(() => {
    config = new Config();
  });

  describe('Basic Functionality', () => {
    test('should initialize with correct properties', () => {
      expect(config).toBeDefined();
      expect(config.workspaceRoot).toBeDefined();
      expect(config.configDir).toBeDefined();
      expect(config.cache).toBeDefined();
      expect(config.environmentConfig).toBeDefined();
    });

    test('should detect environment configuration', () => {
      const envConfig = config.getEnvironmentConfig();
      expect(envConfig).toHaveProperty('isCI');
      expect(envConfig).toHaveProperty('nodeEnv');
      expect(envConfig).toHaveProperty('maxParallel');
      expect(envConfig).toHaveProperty('timeout');
      expect(envConfig).toHaveProperty('outputFormat');
    });

    test('should return correct output format', () => {
      const format = config.getOutputFormat();
      expect(['console', 'junit', 'json']).toContain(format);
    });

    test('should return valid max parallel value', () => {
      const maxParallel = config.getMaxParallel();
      expect(typeof maxParallel).toBe('number');
      expect(maxParallel).toBeGreaterThan(0);
    });

    test('should return valid test timeout', () => {
      const timeout = config.getTestTimeout();
      expect(typeof timeout).toBe('number');
      expect(timeout).toBeGreaterThan(0);
    });

    test('should generate correct config file paths', () => {
      const testSuitesPath = config.getConfigPath('test-suites.json');
      const scenariosPath = config.getConfigPath('data-scenarios.json');
      const endpointsPath = config.getConfigPath('service-endpoints.json');

      expect(testSuitesPath).toContain('test-suites.json');
      expect(scenariosPath).toContain('data-scenarios.json');
      expect(endpointsPath).toContain('service-endpoints.json');
    });

    test('should manage cache correctly', () => {
      // Add item to cache
      config.cache.set('test-key', 'test-value');
      expect(config.cache.size).toBe(1);
      expect(config.cache.get('test-key')).toBe('test-value');

      // Clear cache
      config.clearCache();
      expect(config.cache.size).toBe(0);
    });

    test('should detect CI environment correctly', () => {
      const isCI = config.isCI();
      expect(typeof isCI).toBe('boolean');
    });

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

    test('should detect workspace root', () => {
      const workspaceRoot = config.detectWorkspaceRoot();
      expect(typeof workspaceRoot).toBe('string');
      expect(workspaceRoot.length).toBeGreaterThan(0);
    });
  });

  describe('Environment Variable Handling', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should detect CI environment from environment variables', () => {
      // Test CI detection
      process.env.CI = 'true';
      const ciConfig = new Config();
      expect(ciConfig.detectCIEnvironment()).toBe(true);
      
      // Test non-CI
      delete process.env.CI;
      const localConfig = new Config();
      expect(localConfig.detectCIEnvironment()).toBe(false);
    });

    test('should detect GitHub Actions environment', () => {
      process.env.GITHUB_ACTIONS = 'true';
      expect(config.detectCIEnvironment()).toBe(true);
      
      delete process.env.GITHUB_ACTIONS;
      expect(config.detectCIEnvironment()).toBe(false);
    });

    test('should apply LOCALSTACK_ENDPOINT override', () => {
      const services = {
        localstack: { url: 'http://localhost:4566', timeout: 5000 }
      };

      process.env.LOCALSTACK_ENDPOINT = 'http://custom:4566';
      const overriddenServices = config.applyEnvironmentOverrides(services);
      expect(overriddenServices.localstack.url).toBe('http://custom:4566');
      
      delete process.env.LOCALSTACK_ENDPOINT;
    });

    test('should apply global timeout override', () => {
      const services = {
        localstack: { url: 'http://localhost:4566', timeout: 5000 },
        frontend: { url: 'http://localhost:3000', timeout: 3000 }
      };

      process.env.SERVICE_TIMEOUT = '10000';
      const overriddenServices = config.applyEnvironmentOverrides(services);
      expect(overriddenServices.localstack.timeout).toBe(10000);
      expect(overriddenServices.frontend.timeout).toBe(10000);
      
      delete process.env.SERVICE_TIMEOUT;
    });
  });
});