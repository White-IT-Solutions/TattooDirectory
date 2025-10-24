/**
 * Unit tests for ContractSuite class
 * 
 * Tests the contract test suite implementation including OpenAPI schema compliance,
 * request/response validation, and breaking change detection functionality.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ContractSuite } from '../contracts.js';
import fs from 'fs/promises';
import axios from 'axios';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('axios');

describe('ContractSuite', () => {
  let contractSuite;
  let mockConfig;
  let mockLogger;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Mock config
    mockConfig = {
      name: 'contracts',
      displayName: 'Contract Tests',
      description: 'API contract validation and schema compliance tests',
      type: 'contract',
      workspace: 'tests/contracts',
      command: 'npm run test:contracts',
      requiredServices: ['localstack', 'backend'],
      dataScenario: 'minimal',
      timeout: 90000,
      canRunParallel: true,
      supportsCoverage: false,
      tags: ['contract', 'api', 'schema']
    };

    contractSuite = new ContractSuite(mockConfig);
    contractSuite.logger = mockLogger;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(contractSuite.name).toBe('contracts');
      expect(contractSuite.displayName).toBe('Contract Tests');
      expect(contractSuite.type).toBe('contract');
      expect(contractSuite.workspace).toBe('tests/contracts');
      expect(contractSuite.timeout).toBe(90000);
      expect(contractSuite.canRunParallel).toBe(true);
    });

    it('should set contract-specific properties', () => {
      expect(contractSuite.contractCategories).toEqual([
        'schema-compliance',
        'request-validation',
        'response-validation',
        'breaking-changes',
        'api-versioning',
        'data-types',
        'error-responses'
      ]);
      expect(contractSuite.severityLevels).toEqual(['critical', 'major', 'minor', 'patch']);
      expect(contractSuite.testTimeout).toBe(90000);
      expect(contractSuite.maxRetries).toBe(3);
    });

    it('should set service endpoints', () => {
      expect(contractSuite.serviceEndpoints).toEqual({
        localstack: 'http://localhost:4566',
        backend: 'http://localhost:9000',
        frontend: 'http://localhost:3000'
      });
    });
  });

  describe('customValidation', () => {
    beforeEach(() => {
      // Mock fs.access to simulate workspace exists
      fs.access.mockResolvedValue();
      
      // Mock package.json reading
      const mockPackageJson = {
        dependencies: {
          'mocha': '^10.2.0',
          'chai': '^4.3.0',
          'axios': '^1.6.0',
          'ajv': '^8.12.0'
        }
      };
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
    });

    it('should validate successfully with proper setup', async () => {
      // Mock OpenAPI spec file exists
      fs.access.mockResolvedValueOnce(); // workspace
      fs.access.mockResolvedValueOnce(); // package.json (implicitly)
      fs.access.mockResolvedValueOnce(); // OpenAPI spec
      fs.readFile.mockResolvedValueOnce(JSON.stringify({ dependencies: { mocha: '1.0.0' } })); // package.json
      fs.readFile.mockResolvedValueOnce('openapi: 3.0.0\npaths:\n  /test: {}'); // OpenAPI spec

      // Mock test file discovery
      contractSuite.checkForContractTests = jest.fn().mockResolvedValue(true);
      contractSuite.validateContractConfiguration = jest.fn().mockResolvedValue();

      const result = await contractSuite.customValidation();

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Contract testing dependencies available'));
    });

    it('should handle missing workspace', async () => {
      fs.access.mockRejectedValueOnce(new Error('ENOENT'));

      const result = await contractSuite.customValidation();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Contract suite validation failed'));
    });

    it('should handle invalid package.json', async () => {
      fs.access.mockResolvedValueOnce(); // workspace exists
      fs.readFile.mockRejectedValueOnce(new Error('Invalid JSON'));

      const result = await contractSuite.customValidation();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to read contract package.json'));
    });
  });

  describe('validateOpenApiSpec', () => {
    it('should validate existing OpenAPI spec', async () => {
      const validSpec = `
openapi: 3.0.0
info:
  title: Test API
paths:
  /test:
    get:
      responses:
        '200':
          description: Success
`;
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(validSpec);

      await expect(contractSuite.validateOpenApiSpec()).resolves.not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Found OpenAPI specification'));
      expect(mockLogger.info).toHaveBeenCalledWith('OpenAPI specification appears valid');
    });

    it('should reject invalid OpenAPI spec', async () => {
      const invalidSpec = 'invalid yaml content';
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(invalidSpec);

      await expect(contractSuite.validateOpenApiSpec()).rejects.toThrow('Invalid OpenAPI specification format');
    });

    it('should handle missing OpenAPI spec file', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));

      await expect(contractSuite.validateOpenApiSpec()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('OpenAPI specification validation failed'));
    });
  });

  describe('validateContractServices', () => {
    beforeEach(() => {
      contractSuite.checkServiceWithRetry = jest.fn();
      contractSuite.validateAWSServices = jest.fn().mockResolvedValue(true);
    });

    it('should validate all required services successfully', async () => {
      contractSuite.checkServiceWithRetry.mockResolvedValue({ status: 200 });

      const result = await contractSuite.validateContractServices();

      expect(result).toBe(true);
      expect(contractSuite.checkServiceWithRetry).toHaveBeenCalledTimes(2); // LocalStack + Backend
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('✅ LocalStack is responding'));
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('✅ Backend API is responding'));
    });

    it('should handle service failures', async () => {
      contractSuite.checkServiceWithRetry
        .mockResolvedValueOnce({ status: 200 }) // LocalStack OK
        .mockRejectedValueOnce(new Error('Connection refused')); // Backend fails

      const result = await contractSuite.validateContractServices();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('❌ Backend API is not responding'));
      expect(mockLogger.error).toHaveBeenCalledWith('Required services are not running. Please start them:');
    });

    it('should handle non-200 status codes', async () => {
      contractSuite.checkServiceWithRetry.mockResolvedValue({ status: 503 });

      const result = await contractSuite.validateContractServices();

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('⚠️  LocalStack returned status 503'));
    });
  });

  describe('checkServiceWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockResponse = { status: 200 };
      axios.get.mockResolvedValue(mockResponse);

      const result = await contractSuite.checkServiceWithRetry('http://test.com');

      expect(result).toBe(mockResponse);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockResponse = { status: 200 };
      axios.get
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockResponse);

      contractSuite.sleep = jest.fn().mockResolvedValue();

      const result = await contractSuite.checkServiceWithRetry('http://test.com');

      expect(result).toBe(mockResponse);
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(contractSuite.sleep).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries', async () => {
      const error = new Error('Connection failed');
      axios.get.mockRejectedValue(error);
      contractSuite.sleep = jest.fn().mockResolvedValue();

      await expect(contractSuite.checkServiceWithRetry('http://test.com')).rejects.toThrow('Connection failed');
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });

  describe('prepare', () => {
    beforeEach(() => {
      contractSuite.validateContractServices = jest.fn().mockResolvedValue(true);
    });

    it('should set up environment variables', async () => {
      await contractSuite.prepare();

      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.CONTRACT_TEST_MODE).toBe('true');
      expect(process.env.LOCALSTACK_ENDPOINT).toBe('http://localhost:4566');
      expect(process.env.API_BASE_URL).toBe('http://localhost:9000');
      expect(process.env.CONTRACT_VALIDATION_STRICT).toBe('true');
      expect(process.env.BREAKING_CHANGE_DETECTION).toBe('true');
    });

    it('should validate services before preparation', async () => {
      await contractSuite.prepare();

      expect(contractSuite.validateContractServices).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Contract test environment prepared');
    });

    it('should throw error if service validation fails', async () => {
      contractSuite.validateContractServices.mockResolvedValue(false);

      await expect(contractSuite.prepare()).rejects.toThrow('Service validation failed');
    });
  });

  describe('transformCommandArgs', () => {
    it('should transform npm script command', () => {
      const args = contractSuite.transformCommandArgs();

      expect(args).toEqual(['npm', 'run', 'test:contracts']);
    });

    it('should add CI mode flags', () => {
      const args = contractSuite.transformCommandArgs({ ci: true });

      expect(args).toContain('--reporter');
      expect(args).toContain('json');
      expect(args).toContain('--exit');
    });

    it('should add verbose output', () => {
      const args = contractSuite.transformCommandArgs({ verbose: true });

      expect(args).toContain('--reporter');
      expect(args).toContain('spec');
    });

    it('should add category filter', () => {
      const args = contractSuite.transformCommandArgs({ category: 'schema-compliance' });

      expect(args).toContain('--grep');
      expect(args).toContain('schema-compliance');
    });

    it('should add test pattern filter', () => {
      const args = contractSuite.transformCommandArgs({ testPattern: 'breaking.*change' });

      expect(args).toContain('--grep');
      expect(args).toContain('breaking.*change');
    });

    it('should add bail option', () => {
      const args = contractSuite.transformCommandArgs({ bail: true });

      expect(args).toContain('--bail');
    });

    it('should add parallel execution', () => {
      const args = contractSuite.transformCommandArgs({ parallel: true });

      expect(args).toContain('--parallel');
    });
  });

  describe('parseResults', () => {
    it('should parse JSON test results', () => {
      const jsonOutput = JSON.stringify({
        stats: {
          tests: 10,
          passes: 8,
          failures: 2,
          pending: 0,
          duration: 5000
        },
        failures: [
          {
            fullTitle: 'Schema validation should pass',
            err: {
              message: 'Schema violation detected',
              stack: 'Error stack trace'
            }
          }
        ]
      });

      contractSuite.parseContractViolationsFromJson = jest.fn().mockReturnValue([]);
      contractSuite.parseBreakingChangesFromJson = jest.fn().mockReturnValue([]);
      contractSuite.parseSchemaValidationFromJson = jest.fn().mockReturnValue({ valid: true });
      contractSuite.calculateCompatibilityScore = jest.fn().mockReturnValue(80);
      contractSuite.categorizeContractResults = jest.fn().mockReturnValue({});

      const result = contractSuite.parseResults(jsonOutput, '', 0);

      expect(result.tests.total).toBe(10);
      expect(result.tests.passed).toBe(8);
      expect(result.tests.failed).toBe(2);
      expect(result.duration).toBe(5000);
      expect(result.errors).toHaveLength(1);
    });

    it('should parse Mocha spec output', () => {
      const specOutput = `
  ✓ should validate schema
  ✓ should check compatibility
  × should detect breaking changes

  8 passing (2s)
  2 failing
`;

      contractSuite.parseContractViolationsFromText = jest.fn().mockReturnValue([]);
      contractSuite.parseBreakingChangesFromText = jest.fn().mockReturnValue([]);
      contractSuite.parseSchemaValidationFromText = jest.fn().mockReturnValue({ valid: true });
      contractSuite.calculateCompatibilityScore = jest.fn().mockReturnValue(80);
      contractSuite.categorizeContractResultsFromText = jest.fn().mockReturnValue({});
      contractSuite.parseContractErrorsFromOutput = jest.fn().mockReturnValue([]);

      const result = contractSuite.parseResults(specOutput, '', 1);

      expect(result.tests.passed).toBe(8);
      expect(result.tests.failed).toBe(2);
      expect(result.tests.total).toBe(10);
    });

    it('should handle parsing errors gracefully', () => {
      const invalidOutput = 'invalid json {';

      const result = contractSuite.parseResults(invalidOutput, '', 1);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('parsing_error');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to parse contract test results'));
    });
  });

  describe('categorizeContractViolation', () => {
    it('should categorize schema violations', () => {
      const category = contractSuite.categorizeContractViolation('schema validation failed');
      expect(category).toBe('schema-compliance');
    });

    it('should categorize request violations', () => {
      const category = contractSuite.categorizeContractViolation('request parameter invalid');
      expect(category).toBe('request-validation');
    });

    it('should categorize response violations', () => {
      const category = contractSuite.categorizeContractViolation('response format incorrect');
      expect(category).toBe('response-validation');
    });

    it('should categorize breaking changes', () => {
      const category = contractSuite.categorizeContractViolation('breaking change detected');
      expect(category).toBe('breaking-changes');
    });

    it('should categorize API versioning issues', () => {
      const category = contractSuite.categorizeContractViolation('api version mismatch');
      expect(category).toBe('api-versioning');
    });

    it('should categorize data type issues', () => {
      const category = contractSuite.categorizeContractViolation('type validation failed');
      expect(category).toBe('data-types');
    });

    it('should categorize error response issues', () => {
      const category = contractSuite.categorizeContractViolation('error status incorrect');
      expect(category).toBe('error-responses');
    });

    it('should default to general category', () => {
      const category = contractSuite.categorizeContractViolation('unknown issue');
      expect(category).toBe('general');
    });
  });

  describe('calculateCompatibilityScore', () => {
    it('should calculate score based on pass rate', () => {
      const result = {
        tests: { total: 10, passed: 8, failed: 2 },
        contractViolations: [],
        breakingChanges: []
      };

      const score = contractSuite.calculateCompatibilityScore(result);
      expect(score).toBe(80); // 8/10 * 100
    });

    it('should deduct points for violations', () => {
      const result = {
        tests: { total: 10, passed: 8, failed: 2 },
        contractViolations: [
          { severity: 'critical' },
          { severity: 'major' },
          { severity: 'minor' }
        ],
        breakingChanges: []
      };

      const score = contractSuite.calculateCompatibilityScore(result);
      expect(score).toBe(25); // 80 - 30 (critical) - 20 (major) - 5 (minor)
    });

    it('should deduct points for breaking changes', () => {
      const result = {
        tests: { total: 10, passed: 10, failed: 0 },
        contractViolations: [],
        breakingChanges: [{ change: 'field removed' }]
      };

      const score = contractSuite.calculateCompatibilityScore(result);
      expect(score).toBe(75); // 100 - 25 (breaking change)
    });

    it('should not go below zero', () => {
      const result = {
        tests: { total: 10, passed: 0, failed: 10 },
        contractViolations: [
          { severity: 'critical' },
          { severity: 'critical' },
          { severity: 'critical' },
          { severity: 'critical' }
        ],
        breakingChanges: []
      };

      const score = contractSuite.calculateCompatibilityScore(result);
      expect(score).toBe(0);
    });

    it('should handle zero total tests', () => {
      const result = {
        tests: { total: 0, passed: 0, failed: 0 },
        contractViolations: [],
        breakingChanges: []
      };

      const score = contractSuite.calculateCompatibilityScore(result);
      expect(score).toBe(0);
    });
  });

  describe('getMetadata', () => {
    it('should return extended metadata', () => {
      const metadata = contractSuite.getMetadata();

      expect(metadata.name).toBe('contracts');
      expect(metadata.contractCategories).toEqual(contractSuite.contractCategories);
      expect(metadata.severityLevels).toEqual(contractSuite.severityLevels);
      expect(metadata.serviceEndpoints).toEqual(contractSuite.serviceEndpoints);
      expect(metadata.openApiSpecPath).toBeDefined();
    });
  });

  describe('getRequiredDataScenario', () => {
    it('should return minimal scenario', () => {
      const scenario = contractSuite.getRequiredDataScenario();
      expect(scenario).toBe('minimal');
    });
  });

  describe('getContractCategories', () => {
    it('should return contract categories', () => {
      const categories = contractSuite.getContractCategories();
      expect(categories).toEqual([
        'schema-compliance',
        'request-validation',
        'response-validation',
        'breaking-changes',
        'api-versioning',
        'data-types',
        'error-responses'
      ]);
    });
  });

  describe('getSeverityLevels', () => {
    it('should return severity levels', () => {
      const levels = contractSuite.getSeverityLevels();
      expect(levels).toEqual(['critical', 'major', 'minor', 'patch']);
    });
  });
});