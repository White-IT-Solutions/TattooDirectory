/**
 * Unit tests for EnhancedTestExecutor class
 */

import { jest } from '@jest/globals';
import { EnhancedTestExecutor } from '../enhanced-test-executor.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock dependencies
jest.mock('child_process');
jest.mock('../../utils/logger.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}));

jest.mock('../service-validator.js', () => ({
  ServiceValidator: jest.fn().mockImplementation(() => ({
    validateEnvironment: jest.fn().mockResolvedValue({})
  }))
}));

jest.mock('../data-manager.js', () => ({
  DataManager: jest.fn().mockImplementation(() => ({
    seedScenario: jest.fn().mockResolvedValue(),
    cleanupScenario: jest.fn().mockResolvedValue(),
    getRequiredScenario: jest.fn().mockResolvedValue(null)
  }))
}));

jest.mock('../suite-factory.js', () => ({
  SuiteFactory: jest.fn().mockImplementation(() => ({
    createSuite: jest.fn()
  }))
}));

describe('EnhancedTestExecutor', () => {
  let executor;
  let mockSuite;
  let mockChildProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock child process
    mockChildProcess = new EventEmitter();
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockChildProcess.kill = jest.fn();
    spawn.mockReturnValue(mockChildProcess);

    // Mock suite
    mockSuite = {
      name: 'test-suite',
      workspace: 'backend',
      validate: jest.fn().mockResolvedValue(true),
      prepare: jest.fn().mockResolvedValue(),
      cleanup: jest.fn().mockResolvedValue(),
      getRequiredServices: jest.fn().mockReturnValue([]),
      getRequiredDataScenario: jest.fn().mockReturnValue(null),
      getEstimatedDuration: jest.fn().mockReturnValue(60000),
      canRunInParallel: jest.fn().mockReturnValue(true),
      transformCommandArgs: jest.fn().mockReturnValue(['npm', 'run', 'test']),
      parseResults: jest.fn().mockReturnValue({
        exitCode: 0,
        stdout: 'test output',
        stderr: '',
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 },
        coverage: null,
        errors: []
      }),
      getMetadata: jest.fn().mockReturnValue({
        name: 'test-suite',
        type: 'unit'
      })
    };

    executor = new EnhancedTestExecutor();
    executor.suiteFactory.createSuite.mockReturnValue(mockSuite);
  });

  describe('constructor', () => {
    it('should initialize with required dependencies', () => {
      expect(executor.logger).toBeDefined();
      expect(executor.serviceValidator).toBeDefined();
      expect(executor.dataManager).toBeDefined();
      expect(executor.suiteFactory).toBeDefined();
    });
  });

  describe('executeSuite', () => {
    const mockConfig = {
      name: 'test-suite',
      type: 'unit',
      workspace: 'backend',
      command: 'npm run test'
    };

    it('should execute suite successfully', async () => {
      // Setup successful execution
      setTimeout(() => {
        mockChildProcess.stdout.emit('data', 'Test output\n');
        mockChildProcess.emit('close', 0);
      }, 10);

      const result = await executor.executeSuite(mockConfig);

      expect(result.status).toBe('passed');
      expect(result.suite).toBe('test-suite');
      expect(result.tests.total).toBe(5);
      expect(result.tests.passed).toBe(5);
      expect(mockSuite.validate).toHaveBeenCalled();
      expect(mockSuite.prepare).toHaveBeenCalled();
      expect(mockSuite.cleanup).toHaveBeenCalled();
    });

    it('should handle suite validation failure', async () => {
      mockSuite.validate.mockResolvedValue(false);

      await expect(executor.executeSuite(mockConfig)).rejects.toThrow(
        'Suite validation failed: test-suite'
      );
    });

    it('should handle service validation failure', async () => {
      mockSuite.getRequiredServices.mockReturnValue(['localstack']);
      executor.serviceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'unhealthy', error: 'Service not running' }
      });

      await expect(executor.executeSuite(mockConfig)).rejects.toThrow(
        'Required services are not available: localstack'
      );
    });

    it('should handle test execution failure', async () => {
      mockSuite.parseResults.mockReturnValue({
        exitCode: 1,
        stdout: 'test output',
        stderr: 'error output',
        tests: { total: 5, passed: 3, failed: 2, skipped: 0 },
        coverage: null,
        errors: [{ message: 'Test failed' }]
      });

      setTimeout(() => {
        mockChildProcess.stdout.emit('data', 'Test output\n');
        mockChildProcess.stderr.emit('data', 'Error output\n');
        mockChildProcess.emit('close', 1);
      }, 10);

      const result = await executor.executeSuite(mockConfig);

      expect(result.status).toBe('failed');
      expect(result.tests.failed).toBe(2);
    });

    it('should handle data scenario seeding', async () => {
      mockSuite.getRequiredDataScenario.mockReturnValue('test-scenario');

      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);

      await executor.executeSuite(mockConfig);

      expect(executor.dataManager.seedScenario).toHaveBeenCalledWith('test-scenario');
      expect(executor.dataManager.cleanupScenario).toHaveBeenCalledWith('test-scenario');
    });

    it('should skip cleanup when requested', async () => {
      mockSuite.getRequiredDataScenario.mockReturnValue('test-scenario');

      setTimeout(() => {
        mockChildProcess.emit('close', 0);
      }, 10);

      await executor.executeSuite(mockConfig, { skipCleanup: true });

      expect(executor.dataManager.seedScenario).toHaveBeenCalledWith('test-scenario');
      expect(executor.dataManager.cleanupScenario).not.toHaveBeenCalled();
    });

    it('should handle timeout', async () => {
      mockSuite.getEstimatedDuration.mockReturnValue(100); // 100ms timeout

      const promise = executor.executeSuite(mockConfig);

      // Don't emit close event to simulate hanging process
      await expect(promise).rejects.toThrow('Test suite timed out after 100ms');
      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should perform cleanup even on failure', async () => {
      mockSuite.prepare.mockRejectedValue(new Error('Preparation failed'));

      await expect(executor.executeSuite(mockConfig)).rejects.toThrow('Preparation failed');
      expect(mockSuite.cleanup).toHaveBeenCalled();
    });
  });

  describe('validateSuite', () => {
    it('should validate suite successfully', async () => {
      await executor.validateSuite(mockSuite);

      expect(mockSuite.validate).toHaveBeenCalled();
      expect(executor.logger.success).toHaveBeenCalledWith(
        'Suite validation passed: test-suite'
      );
    });

    it('should throw error if validation fails', async () => {
      mockSuite.validate.mockResolvedValue(false);

      await expect(executor.validateSuite(mockSuite)).rejects.toThrow(
        'Suite validation failed: test-suite'
      );
    });
  });

  describe('validatePrerequisites', () => {
    it('should validate prerequisites successfully', async () => {
      await executor.validatePrerequisites(mockSuite);

      expect(executor.logger.success).toHaveBeenCalledWith(
        'Prerequisites validated for suite: test-suite'
      );
    });

    it('should handle service validation failure', async () => {
      mockSuite.getRequiredServices.mockReturnValue(['localstack', 'backend']);
      executor.serviceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'healthy' },
        backend: { status: 'unhealthy', error: 'Connection failed' }
      });

      await expect(executor.validatePrerequisites(mockSuite)).rejects.toThrow(
        'Required services are not available: backend'
      );
    });
  });

  describe('runTestSuiteEnhanced', () => {
    it('should run test suite with enhanced logic', async () => {
      const options = { coverage: true, ci: true };

      setTimeout(() => {
        mockChildProcess.stdout.emit('data', 'Test output\n');
        mockChildProcess.emit('close', 0);
      }, 10);

      const result = await executor.runTestSuiteEnhanced(mockSuite, options);

      expect(mockSuite.transformCommandArgs).toHaveBeenCalledWith(options);
      expect(spawn).toHaveBeenCalledWith('npm', ['run', 'test'], expect.objectContaining({
        cwd: expect.stringContaining('backend'),
        env: expect.objectContaining({
          NODE_ENV: 'test',
          CI: 'true'
        }),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      }));
      expect(mockSuite.parseResults).toHaveBeenCalled();
      expect(result.exitCode).toBe(0);
    });

    it('should handle command execution error', async () => {
      setTimeout(() => {
        mockChildProcess.emit('error', new Error('Command not found'));
      }, 10);

      await expect(executor.runTestSuiteEnhanced(mockSuite)).rejects.toThrow(
        'Failed to execute test command: Command not found'
      );
    });
  });

  describe('executeParallel', () => {
    const mockConfigs = [
      { name: 'suite1', type: 'unit' },
      { name: 'suite2', type: 'unit' }
    ];

    it('should execute suites in parallel', async () => {
      // Mock suite factory to return parallel suites
      executor.suiteFactory.createSuite = jest.fn()
        .mockImplementation((config) => ({
          ...mockSuite,
          name: config.name,
          canRunInParallel: () => true
        }));

      // Mock executeSuite to resolve quickly
      executor.executeSuite = jest.fn()
        .mockResolvedValueOnce({ suite: 'suite1', status: 'passed' })
        .mockResolvedValueOnce({ suite: 'suite2', status: 'passed' });

      const results = await executor.executeParallel(mockConfigs, { maxParallel: 2 });

      expect(results).toHaveLength(2);
      expect(results.map(r => r.suite)).toEqual(['suite1', 'suite2']);
      expect(executor.executeSuite).toHaveBeenCalledTimes(2);
    });

    it('should handle execution failures gracefully', async () => {
      // Mock suite factory to return parallel suites
      executor.suiteFactory.createSuite = jest.fn()
        .mockImplementation((config) => ({
          ...mockSuite,
          name: config.name,
          canRunInParallel: () => true
        }));

      executor.executeSuite = jest.fn()
        .mockResolvedValueOnce({ suite: 'suite1', status: 'passed' })
        .mockRejectedValueOnce(new Error('Suite2 failed'));

      const results = await executor.executeParallel(mockConfigs);

      expect(results).toHaveLength(2);
      expect(results[1]).toEqual({
        suite: 'suite2',
        status: 'failed',
        error: 'Suite2 failed'
      });
    });
  });

  describe('executeBatches', () => {
    it('should execute suites in batches with concurrency limit', async () => {
      const configs = [
        { name: 'suite1' },
        { name: 'suite2' },
        { name: 'suite3' },
        { name: 'suite4' }
      ];

      executor.executeSuite = jest.fn()
        .mockResolvedValue({ status: 'passed' });

      const results = await executor.executeBatches(configs, 2, {});

      expect(results).toHaveLength(4);
      expect(executor.executeSuite).toHaveBeenCalledTimes(4);
    });
  });

  describe('getSuiteMetadata', () => {
    it('should return suite metadata', () => {
      const config = { name: 'test-suite' };

      const metadata = executor.getSuiteMetadata(config);

      expect(executor.suiteFactory.createSuite).toHaveBeenCalledWith(config);
      expect(mockSuite.getMetadata).toHaveBeenCalled();
      expect(metadata).toEqual({ name: 'test-suite', type: 'unit' });
    });
  });
});