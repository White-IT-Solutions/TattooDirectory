/**
 * IntegrationSuite Tests
 * 
 * Unit tests for the IntegrationSuite class covering service validation,
 * data flow testing, and integration test execution.
 */

import { jest } from '@jest/globals';
import { IntegrationSuite } from '../integration.js';

// Mock dependencies
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn()
}));

jest.mock('axios', () => ({
  default: {
    get: jest.fn()
  }
}));

describe('IntegrationSuite', () => {
  let suite;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    mockConfig = {
      name: 'integration',
      displayName: 'Integration Tests',
      description: 'Cross-service integration tests with LocalStack',
      type: 'integration',
      workspace: 'tests/integration',
      command: 'npm run test:integration',
      requiredServices: ['localstack'],
      dataScenario: 'minimal',
      timeout: 120000,
      canRunParallel: true,
      supportsCoverage: false,
      tags: ['integration', 'localstack', 'critical']
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    suite = new IntegrationSuite(mockConfig);
    suite.logger = mockLogger;

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(suite.name).toBe('integration');
      expect(suite.displayName).toBe('Integration Tests');
      expect(suite.type).toBe('integration');
      expect(suite.workspace).toBe('tests/integration');
      expect(suite.testTimeout).toBe(120000);
      expect(suite.maxRetries).toBe(3);
      expect(suite.retryDelay).toBe(2000);
    });

    it('should set up service endpoints', () => {
      expect(suite.serviceEndpoints).toEqual({
        localstack: 'http://localhost:4566',
        backend: 'http://localhost:9000',
        frontend: 'http://localhost:3000'
      });
    });
  });

  describe('customValidation', () => {
    it('should pass validation with valid setup', async () => {
      const fs = await import('fs/promises');
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: {
          mocha: '^10.0.0',
          chai: '^4.0.0',
          axios: '^1.0.0'
        }
      }));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'api.test.js', isFile: () => true, isDirectory: () => false }
      ]);
      
      const result = await suite.customValidation();
      
      expect(result).toBe(true);
    });

    it('should fail validation if workspace does not exist', async () => {
      const fs = await import('fs/promises');
      fs.access.mockRejectedValue(new Error('ENOENT'));
      
      const result = await suite.customValidation();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Integration suite validation failed')
      );
    });

    it('should fail validation if required dependencies are missing', async () => {
      const fs = await import('fs/promises');
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        dependencies: {
          mocha: '^10.0.0'
          // Missing chai and axios
        }
      }));
      
      const result = await suite.customValidation();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Missing required dependencies: chai, axios')
      );
    });
  });

  describe('transformCommandArgs', () => {
    it('should transform npm command correctly', () => {
      const args = suite.transformCommandArgs();
      
      expect(args).toEqual(['npm', 'run', 'test:integration']);
    });

    it('should add CI mode flags', () => {
      const args = suite.transformCommandArgs({ ci: true });
      
      expect(args).toContain('--reporter');
      expect(args).toContain('json');
      expect(args).toContain('--exit');
    });

    it('should add verbose output', () => {
      const args = suite.transformCommandArgs({ verbose: true });
      
      expect(args).toContain('--reporter');
      expect(args).toContain('spec');
    });

    it('should add test pattern', () => {
      const args = suite.transformCommandArgs({ testPattern: 'api' });
      
      expect(args).toContain('--grep');
      expect(args).toContain('api');
    });

    it('should add bail option', () => {
      const args = suite.transformCommandArgs({ bail: true });
      
      expect(args).toContain('--bail');
    });
  });

  describe('parseResults', () => {
    it('should parse JSON test results', () => {
      const stdout = JSON.stringify({
        stats: {
          tests: 10,
          passes: 8,
          failures: 2,
          pending: 0,
          duration: 5000
        },
        failures: [
          {
            fullTitle: 'API test should return 200',
            err: {
              message: 'Expected 200 but got 500',
              stack: 'Error stack trace'
            }
          }
        ]
      });
      
      const result = suite.parseResults(stdout, '', 1);
      
      expect(result.tests.total).toBe(10);
      expect(result.tests.passed).toBe(8);
      expect(result.tests.failed).toBe(2);
      expect(result.duration).toBe(5000);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].test).toBe('API test should return 200');
    });

    it('should parse Mocha spec output', () => {
      const stdout = `
        ✓ should connect to database
        ✓ should create user
        1) should handle errors
        
        2 passing (1.5s)
        1 failing
      `;
      
      const result = suite.parseResults(stdout, '', 1);
      
      expect(result.tests.passed).toBe(2);
      expect(result.tests.failed).toBe(1);
      expect(result.tests.total).toBe(3);
      expect(result.duration).toBe(1500);
    });

    it('should handle parsing errors gracefully', () => {
      const result = suite.parseResults('invalid output', 'error', 1);
      
      expect(result.exitCode).toBe(1);
      expect(result.tests.total).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('execution_error');
    });
  });

  describe('parseDuration', () => {
    it('should parse seconds correctly', () => {
      expect(suite.parseDuration('1.5s')).toBe(1500);
      expect(suite.parseDuration('0.5s')).toBe(500);
    });

    it('should parse milliseconds correctly', () => {
      expect(suite.parseDuration('1500ms')).toBe(1500);
      expect(suite.parseDuration('500ms')).toBe(500);
    });

    it('should return 0 for invalid duration', () => {
      expect(suite.parseDuration('invalid')).toBe(0);
      expect(suite.parseDuration('')).toBe(0);
    });
  });

  describe('getTestCategories', () => {
    it('should return correct test categories', () => {
      const categories = suite.getTestCategories();
      
      expect(categories).toEqual([
        'api-endpoints',
        'data-flow',
        'service-integration',
        'cross-service'
      ]);
    });
  });

  describe('getRequiredDataScenario', () => {
    it('should return minimal data scenario', () => {
      const scenario = suite.getRequiredDataScenario();
      
      expect(scenario).toBe('minimal');
    });
  });

  describe('getMetadata', () => {
    it('should return extended metadata', () => {
      const metadata = suite.getMetadata();
      
      expect(metadata).toMatchObject({
        name: 'integration',
        displayName: 'Integration Tests',
        type: 'integration',
        testCategories: ['api-endpoints', 'data-flow', 'service-integration', 'cross-service'],
        serviceEndpoints: {
          localstack: 'http://localhost:4566',
          backend: 'http://localhost:9000',
          frontend: 'http://localhost:3000'
        },
        testTimeout: 120000,
        maxRetries: 3,
        dataScenario: 'minimal'
      });
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now();
      await suite.sleep(100);
      const end = Date.now();
      
      expect(end - start).toBeGreaterThanOrEqual(90); // Allow some variance
    });
  });

  describe('parseErrorsFromOutput', () => {
    it('should parse Mocha test failures', () => {
      const stdout = `
        1) API test should return 200
        
           Expected 200 but got 500
           
        2) Database test should connect
        
           Connection timeout
      `;
      
      const errors = suite.parseErrorsFromOutput(stdout, '');
      
      expect(errors).toHaveLength(2);
      expect(errors[0].test).toBe('API test should return 200');
      expect(errors[0].message).toBe('Expected 200 but got 500');
      expect(errors[0].type).toBe('test_failure');
    });

    it('should parse service validation errors', () => {
      const stderr = 'Service LocalStack is not responding';
      
      const errors = suite.parseErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('service_error');
    });

    it('should parse connection errors', () => {
      const stderr = 'ECONNREFUSED localhost:4566';
      
      const errors = suite.parseErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('connection_error');
    });

    it('should add generic error for unknown failures', () => {
      const errors = suite.parseErrorsFromOutput('', 'Unknown error occurred');
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('execution_error');
    });
  });
});