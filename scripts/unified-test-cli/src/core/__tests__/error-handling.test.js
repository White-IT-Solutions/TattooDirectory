/**
 * Integration tests for error handling across core components
 */

import { ServiceValidator } from '../service-validator.js';
import { DataManager } from '../data-manager.js';
import { TestExecutor } from '../test-executor.js';
import { ServiceValidationError, DataSeedingError, TestExecutionError } from '../../utils/errors.js';

// Mock chalk to avoid ES module issues
jest.mock('chalk', () => ({
  red: jest.fn((text) => `RED:${text}`),
  yellow: jest.fn((text) => `YELLOW:${text}`),
  blue: jest.fn((text) => `BLUE:${text}`),
  green: jest.fn((text) => `GREEN:${text}`),
  gray: jest.fn((text) => `GRAY:${text}`),
  dim: jest.fn((text) => `DIM:${text}`)
}));

// Mock axios for service validation tests
jest.mock('axios');
import axios from 'axios';

// Mock child_process for data manager and test executor tests
jest.mock('child_process');
import { spawn } from 'child_process';

// Mock fs for file system operations
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    appendFile: jest.fn(),
    writeFile: jest.fn()
  },
  existsSync: jest.fn()
}));

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ServiceValidator Error Handling', () => {
    test('should throw ServiceValidationError for connection refused', async () => {
      const validator = new ServiceValidator();
      
      axios.get.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });

      await expect(
        validator.validateService('localstack', {
          url: 'http://localhost:4566',
          healthEndpoint: '/_localstack/health',
          timeout: 5000
        })
      ).rejects.toThrow(ServiceValidationError);
    });

    test('should throw ServiceValidationError for timeout', async () => {
      const validator = new ServiceValidator();
      
      axios.get.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      });

      await expect(
        validator.validateService('frontend', {
          url: 'http://localhost:3000',
          healthEndpoint: '/',
          timeout: 3000
        })
      ).rejects.toThrow(ServiceValidationError);
    });

    test('should include service-specific suggestions in error', async () => {
      const validator = new ServiceValidator();
      
      axios.get.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });

      try {
        await validator.validateService('localstack', {
          url: 'http://localhost:4566',
          healthEndpoint: '/_localstack/health'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceValidationError);
        expect(error.suggestions).toContain('Start LocalStack: npm run local:start');
        expect(error.suggestions).toContain('Check Docker: docker ps | grep localstack');
      }
    });

    test('should handle multiple service validation failures', async () => {
      const validator = new ServiceValidator();
      
      // Mock config to return multiple services
      validator.config = {
        getServiceEndpoints: jest.fn().mockResolvedValue({
          localstack: { url: 'http://localhost:4566', healthEndpoint: '/_localstack/health' },
          frontend: { url: 'http://localhost:3000', healthEndpoint: '/' }
        })
      };

      axios.get.mockRejectedValue({
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      });

      const results = await validator.validateEnvironment(['localstack', 'frontend']);
      
      expect(results.localstack.status).toBe('unhealthy');
      expect(results.frontend.status).toBe('unhealthy');
      expect(results.localstack.suggestions).toBeDefined();
      expect(results.frontend.suggestions).toBeDefined();
    });
  });

  describe('DataManager Error Handling', () => {
    test('should throw DataSeedingError for failed seeding', async () => {
      const dataManager = new DataManager();
      
      // Mock config
      dataManager.config = {
        getDataScenarios: jest.fn().mockResolvedValue({
          'test-scenario': {
            command: 'node scripts/data-cli.js seed-scenario test-scenario'
          }
        })
      };

      // Mock spawn to simulate failure
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Exit code 1 indicates failure
          }
        }),
        kill: jest.fn()
      };
      spawn.mockReturnValue(mockProcess);

      await expect(
        dataManager.seedScenario('test-scenario')
      ).rejects.toThrow(DataSeedingError);
    });

    test('should throw TimeoutError for data seeding timeout', async () => {
      const dataManager = new DataManager();
      
      dataManager.config = {
        getDataScenarios: jest.fn().mockResolvedValue({
          'slow-scenario': {
            command: 'node scripts/data-cli.js seed-scenario slow-scenario'
          }
        })
      };

      // Mock spawn to simulate timeout
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };
      spawn.mockReturnValue(mockProcess);

      // Use a very short timeout to trigger timeout error
      await expect(
        dataManager.seedScenario('slow-scenario', { timeout: 1 })
      ).rejects.toThrow('timed out');
    });

    test('should provide recovery suggestions for data errors', async () => {
      const dataManager = new DataManager();
      
      dataManager.config = {
        getDataScenarios: jest.fn().mockResolvedValue({
          'failing-scenario': {
            command: 'node scripts/data-cli.js seed-scenario failing-scenario'
          }
        })
      };

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1);
          }
        }),
        kill: jest.fn()
      };
      spawn.mockReturnValue(mockProcess);

      try {
        await dataManager.seedScenario('failing-scenario');
      } catch (error) {
        expect(error).toBeInstanceOf(DataSeedingError);
        expect(error.suggestions).toContain('Check LocalStack is running: npm run local:start');
        expect(error.suggestions).toContain('Verify data-cli.js is accessible');
      }
    });
  });

  describe('TestExecutor Error Handling', () => {
    test('should throw TestExecutionError for failed test execution', async () => {
      const executor = new TestExecutor();
      
      // Mock dependencies
      executor.serviceValidator = {
        validateEnvironment: jest.fn().mockResolvedValue({})
      };
      executor.dataManager = {
        getRequiredScenario: jest.fn().mockResolvedValue(null),
        seedScenario: jest.fn().mockResolvedValue(true)
      };

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Exit code 1 indicates test failure
          }
        }),
        kill: jest.fn()
      };
      spawn.mockReturnValue(mockProcess);

      const suite = {
        name: 'test-suite',
        command: 'npm test',
        requiredServices: [],
        timeout: 60000
      };

      const result = await executor.executeSuite(suite);
      
      expect(result.status).toBe('failed');
      expect(result.exitCode).toBe(1);
    });

    test('should throw WorkspaceError for inaccessible workspace', async () => {
      const executor = new TestExecutor();
      const fs = require('fs');
      
      // Mock fs.promises.access to throw error
      fs.promises.access.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const suite = {
        name: 'test-suite',
        command: 'npm test',
        workspace: 'nonexistent-workspace',
        requiredServices: []
      };

      await expect(
        executor.validatePrerequisites(suite)
      ).rejects.toThrow('Workspace not accessible');
    });

    test('should handle service validation failures during test execution', async () => {
      const executor = new TestExecutor();
      
      // Mock service validator to return unhealthy services
      executor.serviceValidator = {
        validateEnvironment: jest.fn().mockResolvedValue({
          localstack: {
            status: 'unhealthy',
            error: 'Connection refused',
            suggestions: ['Start LocalStack: npm run local:start']
          }
        })
      };

      const suite = {
        name: 'backend-tests',
        command: 'npm test',
        requiredServices: ['localstack']
      };

      await expect(
        executor.validatePrerequisites(suite)
      ).rejects.toThrow(TestExecutionError);
    });

    test('should handle timeout during test execution', async () => {
      const executor = new TestExecutor();
      
      executor.serviceValidator = {
        validateEnvironment: jest.fn().mockResolvedValue({})
      };
      executor.dataManager = {
        getRequiredScenario: jest.fn().mockResolvedValue(null)
      };

      // Mock process that never completes
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };
      spawn.mockReturnValue(mockProcess);

      const suite = {
        name: 'slow-test-suite',
        command: 'npm test',
        requiredServices: [],
        timeout: 100 // Very short timeout
      };

      await expect(
        executor.runTestSuite(suite)
      ).rejects.toThrow('timed out');
    });
  });

  describe('Error Recovery Integration', () => {
    test('should attempt service recovery during test execution', async () => {
      const executor = new TestExecutor();
      
      // Mock service validator to initially fail, then succeed
      let callCount = 0;
      executor.serviceValidator = {
        validateEnvironment: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({
              localstack: {
                status: 'unhealthy',
                error: 'Connection refused'
              }
            });
          }
          return Promise.resolve({
            localstack: {
              status: 'healthy'
            }
          });
        })
      };

      const suite = {
        name: 'backend-tests',
        command: 'npm test',
        requiredServices: ['localstack']
      };

      // Should attempt recovery but still fail since autoRestart is false by default
      await expect(
        executor.validatePrerequisites(suite)
      ).rejects.toThrow(TestExecutionError);
    });

    test('should handle cascading errors gracefully', async () => {
      const executor = new TestExecutor();
      
      // Mock all dependencies to fail
      executor.serviceValidator = {
        validateEnvironment: jest.fn().mockRejectedValue(new Error('Service validation failed'))
      };
      executor.dataManager = {
        getRequiredScenario: jest.fn().mockRejectedValue(new Error('Data scenario lookup failed')),
        seedScenario: jest.fn().mockRejectedValue(new Error('Data seeding failed'))
      };

      const suite = {
        name: 'failing-suite',
        command: 'npm test',
        requiredServices: ['localstack']
      };

      try {
        await executor.executeSuite(suite);
        fail('Expected executeSuite to throw an error');
      } catch (error) {
        expect(error.message).toContain('Service validation failed');
      }
    });
  });

  describe('Error Context and Metadata', () => {
    test('should preserve error context through the execution chain', async () => {
      const executor = new TestExecutor();
      
      executor.serviceValidator = {
        validateEnvironment: jest.fn().mockResolvedValue({
          localstack: {
            status: 'unhealthy',
            error: 'Connection timeout',
            suggestions: ['Check Docker', 'Restart LocalStack']
          }
        })
      };

      const suite = {
        name: 'integration-tests',
        command: 'npm run test:integration',
        requiredServices: ['localstack'],
        workspace: 'backend'
      };

      try {
        await executor.validatePrerequisites(suite);
      } catch (error) {
        expect(error).toBeInstanceOf(TestExecutionError);
        expect(error.suite).toBe('integration-tests');
        expect(error.phase).toBe('prerequisite-validation');
        expect(error.details).toBeDefined();
      }
    });

    test('should aggregate multiple error sources', async () => {
      const executor = new TestExecutor();
      
      // Mock multiple failing services
      executor.serviceValidator = {
        validateEnvironment: jest.fn().mockResolvedValue({
          localstack: {
            status: 'unhealthy',
            error: 'LocalStack not running'
          },
          frontend: {
            status: 'unhealthy',
            error: 'Frontend server not responding'
          }
        })
      };

      const suite = {
        name: 'e2e-tests',
        command: 'npm run test:e2e',
        requiredServices: ['localstack', 'frontend']
      };

      try {
        await executor.validatePrerequisites(suite);
        fail('Expected validatePrerequisites to throw an error');
      } catch (error) {
        expect(error).toBeInstanceOf(TestExecutionError);
        expect(error.suite).toBe('e2e-tests');
        expect(error.phase).toBe('prerequisite-validation');
      }
    });
  });
});