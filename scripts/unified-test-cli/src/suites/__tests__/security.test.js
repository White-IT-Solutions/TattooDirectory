/**
 * SecuritySuite Unit Tests
 * 
 * Tests for the SecuritySuite class including validation, service checks,
 * result parsing, vulnerability detection, and security score calculation.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SecuritySuite } from '../security.js';
import fs from 'fs/promises';
import axios from 'axios';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('axios');
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn()
  })),
  ListTablesCommand: jest.fn()
}));
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn()
  })),
  ListBucketsCommand: jest.fn()
}));

describe('SecuritySuite', () => {
  let securitySuite;
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
      name: 'security',
      displayName: 'Security Tests',
      description: 'Security vulnerability and penetration tests',
      type: 'security',
      workspace: 'tests/security',
      command: 'npm run test:security',
      requiredServices: ['localstack', 'backend'],
      dataScenario: 'minimal',
      timeout: 180000,
      canRunParallel: true,
      supportsCoverage: false,
      tags: ['security', 'vulnerability']
    };

    securitySuite = new SecuritySuite(mockConfig);
    securitySuite.logger = mockLogger;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(securitySuite.name).toBe('security');
      expect(securitySuite.testTimeout).toBe(180000);
      expect(securitySuite.maxRetries).toBe(2);
      expect(securitySuite.retryDelay).toBe(1000);
      expect(securitySuite.securityCategories).toContain('authentication');
      expect(securitySuite.securityCategories).toContain('authorization');
      expect(securitySuite.securityCategories).toContain('xss-prevention');
      expect(securitySuite.vulnerabilityLevels).toContain('critical');
      expect(securitySuite.vulnerabilityLevels).toContain('high');
    });

    it('should set correct service endpoints', () => {
      expect(securitySuite.serviceEndpoints.localstack).toBe('http://localhost:4566');
      expect(securitySuite.serviceEndpoints.backend).toBe('http://localhost:9000');
      expect(securitySuite.serviceEndpoints.frontend).toBe('http://localhost:3000');
    });
  });

  describe('customValidation', () => {
    beforeEach(() => {
      // Mock fs.access to simulate workspace exists
      fs.access.mockResolvedValue();
      
      // Mock package.json reading
      const mockPackageJson = {
        dependencies: {
          'mocha': '^10.0.0',
          'chai': '^4.3.0',
          'axios': '^1.0.0'
        },
        devDependencies: {
          'helmet': '^7.0.0',
          'jsonwebtoken': '^9.0.0'
        }
      };
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
    });

    it('should pass validation with valid workspace and dependencies', async () => {
      // Mock directory structure
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'auth.test.js', isFile: () => true, isDirectory: () => false },
        { name: 'xss.test.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await securitySuite.customValidation();
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Security testing dependencies available')
      );
    });

    it('should fail validation if workspace does not exist', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const result = await securitySuite.customValidation();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Security suite validation failed')
      );
    });

    it('should fail validation if package.json is invalid', async () => {
      fs.readFile.mockRejectedValue(new Error('Failed to read package.json'));

      const result = await securitySuite.customValidation();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read security package.json')
      );
    });

    it('should warn if no security dependencies are found', async () => {
      const mockPackageJson = {
        dependencies: {},
        devDependencies: {}
      };
      fs.readFile.mockResolvedValue(JSON.stringify(mockPackageJson));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([]);

      const result = await securitySuite.customValidation();
      
      expect(result).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No security testing dependencies found, using basic HTTP testing'
      );
    });
  });

  describe('checkForSecurityTests', () => {
    it('should find security test files in subdirectories', async () => {
      const securityPath = '/test/security';
      
      // Mock directory structure
      fs.stat.mockImplementation((path) => {
        if (path.includes('auth') || path.includes('xss')) {
          return Promise.resolve({ isDirectory: () => true });
        }
        return Promise.reject(new Error('ENOENT'));
      });

      fs.readdir.mockImplementation((path) => {
        if (path.includes('auth')) {
          return Promise.resolve([
            { name: 'auth.test.js', isFile: () => true, isDirectory: () => false }
          ]);
        }
        if (path.includes('xss')) {
          return Promise.resolve([
            { name: 'xss.spec.js', isFile: () => true, isDirectory: () => false }
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await securitySuite.checkForSecurityTests(securityPath);
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Found security tests in: auth');
      expect(mockLogger.info).toHaveBeenCalledWith('Found security tests in: xss');
    });

    it('should return false if no test files are found', async () => {
      const securityPath = '/test/security';
      
      fs.stat.mockRejectedValue(new Error('ENOENT'));
      fs.readdir.mockResolvedValue([]);

      const result = await securitySuite.checkForSecurityTests(securityPath);
      
      expect(result).toBe(false);
    });
  });

  describe('validateSecurityServices', () => {
    beforeEach(() => {
      // Mock AWS SDK
      const mockDynamoClient = {
        send: jest.fn().mockResolvedValue({})
      };
      const mockS3Client = {
        send: jest.fn().mockResolvedValue({})
      };
      
      jest.doMock('@aws-sdk/client-dynamodb', () => ({
        DynamoDBClient: jest.fn(() => mockDynamoClient),
        ListTablesCommand: jest.fn()
      }));
      
      jest.doMock('@aws-sdk/client-s3', () => ({
        S3Client: jest.fn(() => mockS3Client),
        ListBucketsCommand: jest.fn()
      }));
    });

    it('should pass validation when all required services are running', async () => {
      // Mock successful HTTP responses
      axios.get.mockResolvedValue({ status: 200 });

      const result = await securitySuite.validateSecurityServices();
      
      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('✅ LocalStack is responding');
      expect(mockLogger.info).toHaveBeenCalledWith('✅ Backend API is responding');
    });

    it('should fail validation when required services are not running', async () => {
      // Mock failed HTTP responses
      axios.get.mockImplementation((url) => {
        if (url.includes('localstack')) {
          throw new Error('ECONNREFUSED');
        }
        return Promise.resolve({ status: 200 });
      });

      const result = await securitySuite.validateSecurityServices();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('LocalStack is not responding')
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Required services are not running. Please start them:'
      );
    });

    it('should handle optional services gracefully', async () => {
      // Mock LocalStack and Backend success, Frontend failure
      axios.get.mockImplementation((url) => {
        if (url.includes('3000')) { // Frontend
          throw new Error('ECONNREFUSED');
        }
        return Promise.resolve({ status: 200 });
      });

      const result = await securitySuite.validateSecurityServices();
      
      expect(result).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Frontend (optional) is not responding')
      );
    });
  });

  describe('transformCommandArgs', () => {
    it('should transform npm command correctly', () => {
      const options = { ci: true, verbose: true };
      const args = securitySuite.transformCommandArgs(options);
      
      expect(args).toContain('npm');
      expect(args).toContain('run');
      expect(args).toContain('test:security');
      expect(args).toContain('--reporter');
      expect(args).toContain('json');
    });

    it('should add security category filter when specified', () => {
      const options = { category: 'authentication' };
      const args = securitySuite.transformCommandArgs(options);
      
      expect(args).toContain('--grep');
      expect(args).toContain('authentication');
    });

    it('should add timeout for mocha tests', () => {
      securitySuite.command = 'mocha test/**/*.js';
      const args = securitySuite.transformCommandArgs();
      
      expect(args).toContain('--timeout');
      expect(args).toContain('180000');
    });

    it('should add parallel execution when supported', () => {
      const options = { parallel: true };
      const args = securitySuite.transformCommandArgs(options);
      
      expect(args).toContain('--parallel');
    });
  });

  describe('parseResults', () => {
    it('should parse JSON test results correctly', () => {
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
            fullTitle: 'Authentication should prevent unauthorized access',
            err: {
              message: 'Expected 401 but got 200',
              stack: 'Error stack trace'
            }
          }
        ]
      });

      const result = securitySuite.parseResults(stdout, '', 0);
      
      expect(result.tests.total).toBe(10);
      expect(result.tests.passed).toBe(8);
      expect(result.tests.failed).toBe(2);
      expect(result.duration).toBe(5000);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('security_test_failure');
    });

    it('should parse Mocha spec output correctly', () => {
      const stdout = `
        Authentication Tests
          ✓ should require valid credentials
          ✓ should reject invalid tokens
          × should prevent brute force attacks
          
        8 passing (2s)
        2 failing
        0 pending
      `;

      const result = securitySuite.parseResults(stdout, '', 1);
      
      expect(result.tests.passed).toBe(8);
      expect(result.tests.failed).toBe(2);
      expect(result.tests.total).toBe(10);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should detect vulnerabilities from output', () => {
      const stdout = 'Test output';
      const stderr = `
        CRITICAL: SQL injection vulnerability detected
        HIGH: XSS vulnerability in user input
        MEDIUM: Weak password policy
      `;

      const result = securitySuite.parseResults(stdout, stderr, 1);
      
      expect(result.vulnerabilities).toHaveLength(3);
      expect(result.vulnerabilities[0].severity).toBe('critical');
      expect(result.vulnerabilities[1].severity).toBe('high');
      expect(result.vulnerabilities[2].severity).toBe('medium');
    });

    it('should calculate security score correctly', () => {
      const stdout = JSON.stringify({
        stats: {
          tests: 10,
          passes: 8,
          failures: 2,
          pending: 0
        },
        failures: []
      });

      const result = securitySuite.parseResults(stdout, '', 0);
      
      expect(result.securityScore).toBe(80); // 8/10 * 100
    });

    it('should deduct points for vulnerabilities in security score', () => {
      const stdout = 'Test output';
      const stderr = `
        CRITICAL: Critical vulnerability detected
        HIGH: High severity issue
      `;

      const mockResult = {
        tests: { total: 10, passed: 10, failed: 0 },
        vulnerabilities: [
          { severity: 'critical' },
          { severity: 'high' }
        ]
      };

      const score = securitySuite.calculateSecurityScore(mockResult);
      
      expect(score).toBe(60); // 100 - 25 (critical) - 15 (high)
    });
  });

  describe('categorizeVulnerability', () => {
    it('should categorize authentication vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('authentication bypass detected');
      expect(category).toBe('authentication');
    });

    it('should categorize XSS vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('XSS script injection found');
      expect(category).toBe('xss-prevention');
    });

    it('should categorize rate limiting vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('rate limit bypass detected');
      expect(category).toBe('rate-limiting');
    });

    it('should categorize CORS vulnerabilities correctly', () => {
      const category = securitySuite.categorizeVulnerability('CORS policy violation');
      expect(category).toBe('cors-policies');
    });

    it('should return general for unknown vulnerabilities', () => {
      const category = securitySuite.categorizeVulnerability('unknown security issue');
      expect(category).toBe('general');
    });
  });

  describe('getSecurityCategories', () => {
    it('should return all security categories', () => {
      const categories = securitySuite.getSecurityCategories();
      
      expect(categories).toContain('authentication');
      expect(categories).toContain('authorization');
      expect(categories).toContain('input-validation');
      expect(categories).toContain('xss-prevention');
      expect(categories).toContain('rate-limiting');
      expect(categories).toContain('cors-policies');
      expect(categories).toContain('api-security');
      expect(categories).toContain('token-security');
    });
  });

  describe('getVulnerabilitySeverityLevels', () => {
    it('should return all vulnerability severity levels', () => {
      const levels = securitySuite.getVulnerabilitySeverityLevels();
      
      expect(levels).toContain('critical');
      expect(levels).toContain('high');
      expect(levels).toContain('medium');
      expect(levels).toContain('low');
      expect(levels).toContain('info');
    });
  });

  describe('getRequiredDataScenario', () => {
    it('should return minimal data scenario', () => {
      const scenario = securitySuite.getRequiredDataScenario();
      expect(scenario).toBe('minimal');
    });
  });

  describe('prepare', () => {
    beforeEach(() => {
      // Mock successful service validation
      jest.spyOn(securitySuite, 'validateSecurityServices').mockResolvedValue(true);
    });

    it('should set security-specific environment variables', async () => {
      await securitySuite.prepare();
      
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.SECURITY_TEST_MODE).toBe('true');
      expect(process.env.JWT_SECRET).toBe('test-jwt-secret-for-security-tests');
      expect(process.env.RATE_LIMIT_WINDOW).toBe('60000');
      expect(process.env.RATE_LIMIT_MAX).toBe('100');
    });

    it('should throw error if service validation fails', async () => {
      jest.spyOn(securitySuite, 'validateSecurityServices').mockResolvedValue(false);

      await expect(securitySuite.prepare()).rejects.toThrow(
        'Service validation failed. Ensure all required services are running before executing security tests.'
      );
    });
  });

  describe('cleanup', () => {
    it('should clean up security test artifacts and environment variables', async () => {
      // Set some environment variables
      process.env.SECURITY_TEST_MODE = 'true';
      process.env.JWT_SECRET = 'test-secret';
      
      // Mock fs.access to simulate artifacts exist
      fs.access.mockResolvedValue();

      await securitySuite.cleanup();
      
      expect(process.env.SECURITY_TEST_MODE).toBeUndefined();
      expect(process.env.JWT_SECRET).toBeUndefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Security test cleanup completed');
    });

    it('should handle cleanup errors gracefully', async () => {
      fs.access.mockRejectedValue(new Error('Access denied'));

      await securitySuite.cleanup();
      
      // Should not throw, just log the error
      expect(mockLogger.info).toHaveBeenCalledWith('Security test cleanup completed');
    });
  });

  describe('getMetadata', () => {
    it('should return extended metadata with security-specific information', () => {
      const metadata = securitySuite.getMetadata();
      
      expect(metadata.name).toBe('security');
      expect(metadata.securityCategories).toContain('authentication');
      expect(metadata.vulnerabilitySeverityLevels).toContain('critical');
      expect(metadata.serviceEndpoints).toBeDefined();
      expect(metadata.testTimeout).toBe(180000);
      expect(metadata.dataScenario).toBe('minimal');
    });
  });

  describe('parseSecurityErrorsFromOutput', () => {
    it('should parse authentication errors correctly', () => {
      const stderr = 'Authentication failed: unauthorized access detected';
      
      const errors = securitySuite.parseSecurityErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('auth_error');
      expect(errors[0].message).toBe('Authentication/Authorization test failed');
    });

    it('should parse service validation errors correctly', () => {
      const stderr = 'Service LocalStack is not responding';
      
      const errors = securitySuite.parseSecurityErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('service_error');
      expect(errors[0].message).toBe('Security test service validation failed');
    });

    it('should parse connection errors correctly', () => {
      const stderr = 'ECONNREFUSED: Connection refused';
      
      const errors = securitySuite.parseSecurityErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('connection_error');
      expect(errors[0].message).toBe('Connection error during security tests');
    });
  });

  describe('extractVulnerabilityFromFailure', () => {
    it('should extract vulnerability information from test failure', () => {
      const failure = {
        fullTitle: 'CRITICAL: Authentication bypass vulnerability',
        err: {
          message: 'Unauthorized access was allowed'
        }
      };

      const vulnerability = securitySuite.extractVulnerabilityFromFailure(failure);
      
      expect(vulnerability.severity).toBe('critical');
      expect(vulnerability.category).toBe('authentication');
      expect(vulnerability.type).toBe('test_failure_vulnerability');
    });

    it('should handle failures without proper structure', () => {
      const failure = {};

      const vulnerability = securitySuite.extractVulnerabilityFromFailure(failure);
      
      expect(vulnerability.severity).toBe('medium');
      expect(vulnerability.category).toBe('general');
    });
  });

  describe('error handling', () => {
    it('should handle parsing errors gracefully', () => {
      const invalidJson = '{ invalid json }';
      
      const result = securitySuite.parseResults(invalidJson, '', 1);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('parsing_error');
    });

    it('should handle service check failures gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const result = await securitySuite.validateSecurityServices();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});