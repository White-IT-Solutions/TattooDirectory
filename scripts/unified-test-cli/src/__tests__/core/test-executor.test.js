/**
 * Unit tests for TestExecutor class
 * 
 * Tests test execution orchestration, environment validation,
 * data seeding, test running, and result collection functionality.
 */

import { spawn } from 'child_process';

// Mock dependencies
jest.mock('child_process');
jest.mock('../../utils/logger.js');
jest.mock('../../core/service-validator.js');
jest.mock('../../core/data-manager.js');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn()
  }
}));

describe('TestExecutor', () => {
  let TestExecutor;
  let testExecutor;
  let mockLogger;
  let mockServiceValidator;
  let mockDataManager;
  let mockSpawn;

  beforeAll(async () => {
    // Mock logger first
    jest.doMock('../../utils/logger.js', () => ({
      Logger: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn()
      }))
    }));

    // Mock ServiceValidator
    jest.doMock('../../core/service-validator.js', () => ({
      ServiceValidator: jest.fn().mockImplementation(() => ({
        validateEnvironment: jest.fn()
      }))
    }));

    // Mock DataManager
    jest.doMock('../../core/data-manager.js', () => ({
      DataManager: jest.fn().mockImplementation(() => ({
        getRequiredScenario: jest.fn(),
        seedScenario: jest.fn(),
        cleanupScenario: jest.fn()
      }))
    }));

    // Import TestExecutor class
    const testExecutorModule = await import('../../core/test-executor.js');
    TestExecutor = testExecutorModule.TestExecutor;
  });

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup spawn mock
    mockSpawn = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };
    spawn.mockReturnValue(mockSpawn);

    // Mock fs.promises.access to succeed by default
    const fs = await import('fs');
    fs.promises.access.mockResolvedValue();

    testExecutor = new TestExecutor();
    mockLogger = testExecutor.logger;
    mockServiceValidator = testExecutor.serviceValidator;
    mockDataManager = testExecutor.dataManager;
  });

  describe('constructor', () => {
    it('should initialize with logger, service validator, and data manager', () => {
      expect(testExecutor.logger).toBeDefined();
      expect(testExecutor.serviceValidator).toBeDefined();
      expect(testExecutor.dataManager).toBeDefined();
    });
  });

  describe('executeSuite', () => {
    const mockSuite = {
      name: 'test-suite',
      command: 'npm run test',
      workspace: 'frontend',
      requiredServices: ['localstack'],
      timeout: 60000
    };

    beforeEach(() => {
      // Mock successful service validation
      mockServiceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'healthy' }
      });

      // Mock successful data management
      mockDataManager.getRequiredScenario.mockResolvedValue('minimal');
      mockDataManager.seedScenario.mockResolvedValue(true);
      mockDataManager.cleanupScenario.mockResolvedValue(true);

      // Mock successful test execution
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });
      mockSpawn.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('Tests: 0 failed, 5 passed, 5 total'));
        }
      });
      mockSpawn.stderr.on.mockImplementation(() => {});
    });

    it('should execute test suite successfully with full workflow', async () => {
      const result = await testExecutor.executeSuite(mockSuite);

      expect(result.suite).toBe('test-suite');
      expect(result.status).toBe('passed');
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.tests.total).toBe(5);
      expect(result.tests.passed).toBe(5);
      expect(result.tests.failed).toBe(0);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting test suite execution: test-suite',
        expect.any(Object)
      );
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Test suite completed: test-suite',
        expect.any(Object)
      );
    });

    it('should validate prerequisites before execution', async () => {
      await testExecutor.executeSuite(mockSuite);

      expect(mockServiceValidator.validateEnvironment).toHaveBeenCalledWith(['localstack']);
    });

    it('should seed data scenario when required', async () => {
      await testExecutor.executeSuite(mockSuite);

      expect(mockDataManager.getRequiredScenario).toHaveBeenCalledWith(mockSuite);
      expect(mockDataManager.seedScenario).toHaveBeenCalledWith('minimal');
    });

    it('should cleanup data scenario after execution', async () => {
      await testExecutor.executeSuite(mockSuite);

      expect(mockDataManager.cleanupScenario).toHaveBeenCalledWith('minimal');
    });

    it('should skip cleanup when skipCleanup option is true', async () => {
      await testExecutor.executeSuite(mockSuite, { skipCleanup: true });

      expect(mockDataManager.cleanupScenario).not.toHaveBeenCalled();
    });

    it('should use custom scenario from options', async () => {
      await testExecutor.executeSuite(mockSuite, { scenario: 'custom-scenario' });

      expect(mockDataManager.seedScenario).toHaveBeenCalledWith('custom-scenario');
      expect(mockDataManager.cleanupScenario).toHaveBeenCalledWith('custom-scenario');
    });

    it('should handle test execution failure', async () => {
      // Mock failed test execution
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });
      mockSpawn.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('Tests: 2 failed, 3 passed, 5 total'));
        }
      });

      const result = await testExecutor.executeSuite(mockSuite);

      expect(result.status).toBe('failed');
      expect(result.tests.failed).toBe(2);
      expect(result.tests.passed).toBe(3);
    });

    it('should handle service validation failure', async () => {
      mockServiceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'unhealthy' }
      });

      await expect(testExecutor.executeSuite(mockSuite)).rejects.toThrow(
        'Test suite \'test-suite\' failed during prerequisite-validation with exit code 1'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Required services are not available'),
        expect.any(Object)
      );
    });

    it('should handle data seeding failure', async () => {
      mockDataManager.seedScenario.mockRejectedValue(new Error('Seeding failed'));

      await expect(testExecutor.executeSuite(mockSuite)).rejects.toThrow('Seeding failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Test suite failed: test-suite',
        expect.any(Object)
      );
    });

    it('should handle test execution error', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Command not found')), 10);
        }
      });

      await expect(testExecutor.executeSuite(mockSuite)).rejects.toThrow();
    });

    it('should skip data seeding when no scenario required', async () => {
      mockDataManager.getRequiredScenario.mockResolvedValue(null);

      await testExecutor.executeSuite(mockSuite);

      expect(mockDataManager.seedScenario).not.toHaveBeenCalled();
      expect(mockDataManager.cleanupScenario).not.toHaveBeenCalled();
    });

    it('should handle suite without required services', async () => {
      const suiteWithoutServices = { ...mockSuite, requiredServices: [] };

      await testExecutor.executeSuite(suiteWithoutServices);

      expect(mockServiceValidator.validateEnvironment).not.toHaveBeenCalled();
    });

    it('should handle suite without workspace', async () => {
      const suiteWithoutWorkspace = { ...mockSuite };
      delete suiteWithoutWorkspace.workspace;

      await testExecutor.executeSuite(suiteWithoutWorkspace);

      // Should still execute successfully
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Test suite completed: test-suite',
        expect.any(Object)
      );
    });
  });

  describe('validatePrerequisites', () => {
    const mockSuite = {
      name: 'test-suite',
      requiredServices: ['localstack', 'frontend'],
      workspace: 'frontend'
    };

    beforeEach(async () => {
      // Mock fs access to succeed by default
      const fs = await import('fs');
      fs.promises.access.mockResolvedValue();
    });

    it('should validate required services successfully', async () => {
      mockServiceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'healthy' },
        frontend: { status: 'healthy' }
      });

      await testExecutor.validatePrerequisites(mockSuite);

      expect(mockServiceValidator.validateEnvironment).toHaveBeenCalledWith([
        'localstack', 'frontend'
      ]);
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Prerequisites validated for suite: test-suite'
      );
    });

    it('should throw error when services are unhealthy', async () => {
      mockServiceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'healthy' },
        frontend: { status: 'unhealthy' }
      });

      await expect(testExecutor.validatePrerequisites(mockSuite)).rejects.toThrow(
        'Test suite \'test-suite\' failed during prerequisite-validation with exit code 1'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Required services are not available'),
        expect.any(Object)
      );
    });

    it('should validate workspace accessibility', async () => {
      mockServiceValidator.validateEnvironment.mockResolvedValue({});

      await testExecutor.validatePrerequisites(mockSuite);

      // Should not throw error if workspace is accessible
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Prerequisites validated for suite: test-suite'
      );
    });

    it('should throw error when workspace is not accessible', async () => {
      const fs = await import('fs');
      fs.promises.access.mockRejectedValue(new Error('Access denied'));

      await expect(testExecutor.validatePrerequisites(mockSuite)).rejects.toThrow(
        'Workspace not accessible'
      );
    });

    it('should skip service validation when no services required', async () => {
      const suiteWithoutServices = { ...mockSuite, requiredServices: [] };

      await testExecutor.validatePrerequisites(suiteWithoutServices);

      expect(mockServiceValidator.validateEnvironment).not.toHaveBeenCalled();
    });

    it('should skip workspace validation when no workspace specified', async () => {
      const suiteWithoutWorkspace = { ...mockSuite };
      delete suiteWithoutWorkspace.workspace;

      await testExecutor.validatePrerequisites(suiteWithoutWorkspace);

      // Should still validate successfully
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Prerequisites validated for suite: test-suite'
      );
    });
  });

  describe('runTestSuite', () => {
    const mockSuite = {
      name: 'test-suite',
      command: 'npm run test',
      workspace: 'frontend',
      timeout: 60000,
      supportsCoverage: true
    };

    beforeEach(() => {
      mockSpawn.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('Tests: 1 failed, 4 passed, 5 total'));
        }
      });
      mockSpawn.stderr.on.mockImplementation(() => {});
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });
    });

    it('should run test suite command successfully', async () => {
      const result = await testExecutor.runTestSuite(mockSuite);

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'test'],
        expect.objectContaining({
          cwd: expect.stringContaining('frontend'),
          env: expect.objectContaining({
            NODE_ENV: 'test',
            CI: 'false'
          }),
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true
        })
      );

      expect(result.exitCode).toBe(0);
      expect(result.tests.total).toBe(5);
      expect(result.tests.passed).toBe(4);
      expect(result.tests.failed).toBe(1);
    });

    it('should add coverage flag when coverage option is enabled', async () => {
      await testExecutor.runTestSuite(mockSuite, { coverage: true });

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        expect.arrayContaining(['run', 'test', '--coverage']),
        expect.any(Object)
      );
    });

    it('should set CI environment variable when ci option is enabled', async () => {
      await testExecutor.runTestSuite(mockSuite, { ci: true });

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'test'],
        expect.objectContaining({
          env: expect.objectContaining({
            CI: 'true'
          })
        })
      );
    });

    it('should use project root when no workspace specified', async () => {
      const suiteWithoutWorkspace = { ...mockSuite };
      delete suiteWithoutWorkspace.workspace;

      await testExecutor.runTestSuite(suiteWithoutWorkspace);

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'test'],
        expect.objectContaining({
          cwd: process.cwd()
        })
      );
    });

    it('should handle test command failure', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      const result = await testExecutor.runTestSuite(mockSuite);

      expect(result.exitCode).toBe(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Test command failed with exit code 1'
      );
    });

    it('should handle command execution error', async () => {
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Command not found')), 10);
        }
      });

      await expect(testExecutor.runTestSuite(mockSuite)).rejects.toThrow(
        'Test suite \'test-suite\' failed during command-execution with exit code -1'
      );
    });

    it('should handle timeout', async () => {
      const shortTimeoutSuite = { ...mockSuite, timeout: 100 };
      // Don't call any callbacks to simulate hanging process
      mockSpawn.on.mockImplementation(() => {});

      await expect(testExecutor.runTestSuite(shortTimeoutSuite)).rejects.toThrow(
        'Operation \'test-suite-execution\' timed out after 100ms'
      );

      expect(mockSpawn.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should stream output when not in silent mode', async () => {
      const mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
      const mockStderrWrite = jest.spyOn(process.stderr, 'write').mockImplementation(() => {});

      mockSpawn.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('Test output'));
        }
      });
      mockSpawn.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('Error output'));
        }
      });

      await testExecutor.runTestSuite(mockSuite, { silent: false });

      expect(mockStdoutWrite).toHaveBeenCalledWith('Test output');
      expect(mockStderrWrite).toHaveBeenCalledWith('Error output');

      mockStdoutWrite.mockRestore();
      mockStderrWrite.mockRestore();
    });

    it('should not stream output in silent mode', async () => {
      const mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => {});

      await testExecutor.runTestSuite(mockSuite, { silent: true });

      expect(mockStdoutWrite).not.toHaveBeenCalled();

      mockStdoutWrite.mockRestore();
    });
  });

  describe('parseTestResults', () => {
    it('should parse Jest test results', () => {
      const jestOutput = `
        Test Suites: 1 passed, 1 total
        Tests: 2 failed, 8 passed, 10 total
        Snapshots: 0 total
        Time: 5.123s
      `;

      const result = testExecutor.parseTestResults(jestOutput, 'unit');

      expect(result).toEqual({
        total: 10,
        passed: 8,
        failed: 2,
        skipped: 0
      });
    });

    it('should parse Playwright test results', () => {
      const playwrightOutput = `
        Running 15 tests using 3 workers
        
        15 passed (30s)
      `;

      const result = testExecutor.parseTestResults(playwrightOutput, 'e2e');

      expect(result).toEqual({
        total: 15,
        passed: 15,
        failed: 0,
        skipped: 0
      });
    });

    it('should parse Playwright test results with failures', () => {
      const playwrightOutput = `
        Running 10 tests using 2 workers
        
        2 failed
        8 passed (25s)
      `;

      const result = testExecutor.parseTestResults(playwrightOutput, 'e2e');

      expect(result).toEqual({
        total: 10,
        passed: 8,
        failed: 2,
        skipped: 0
      });
    });

    it('should return default result for unparseable output', () => {
      const unknownOutput = 'Some unknown test output format';

      const result = testExecutor.parseTestResults(unknownOutput, 'unknown');

      expect(result).toEqual({
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      });
    });

    it('should handle parsing errors gracefully', () => {
      const result = testExecutor.parseTestResults(null, 'unit');

      expect(result).toEqual({
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to parse test results',
        expect.any(Object)
      );
    });
  });

  describe('parseCoverageResults', () => {
    it('should parse Jest coverage results', () => {
      const jestOutput = `
        ----------|---------|----------|---------|---------|-------------------
        File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
        ----------|---------|----------|---------|---------|-------------------
        All files |   85.2  |   78.9   |   82.1  |   85.2  |                   
        ----------|---------|----------|---------|---------|-------------------
      `;

      const result = testExecutor.parseCoverageResults(jestOutput, true);

      expect(result).toEqual({
        statements: 85.2,
        branches: 78.9,
        functions: 82.1,
        lines: 85.2
      });
    });

    it('should return null when coverage is not enabled', () => {
      const result = testExecutor.parseCoverageResults('some output', false);

      expect(result).toBeNull();
    });

    it('should return null for unparseable coverage output', () => {
      const result = testExecutor.parseCoverageResults('no coverage data', true);

      expect(result).toBeNull();
    });

    it('should handle coverage parsing errors gracefully', () => {
      const result = testExecutor.parseCoverageResults(null, true);

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to parse coverage results',
        expect.any(Object)
      );
    });
  });

  describe('error handling and edge cases', () => {
    const mockSuite = {
      name: 'test-suite',
      command: 'npm run test'
    };

    it('should handle missing suite name', async () => {
      const suiteWithoutName = { command: 'npm run test' };

      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await testExecutor.executeSuite(suiteWithoutName);

      expect(result.suite).toBeUndefined();
    }, 10000);

    it('should handle complex command with arguments', async () => {
      const complexSuite = {
        ...mockSuite,
        command: 'npm run test -- --verbose --bail'
      };

      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await testExecutor.runTestSuite(complexSuite);

      expect(spawn).toHaveBeenCalledWith(
        'npm',
        ['run', 'test', '--', '--verbose', '--bail'],
        expect.any(Object)
      );
    });

    it('should handle suite with all optional properties', async () => {
      const fullSuite = {
        name: 'full-suite',
        displayName: 'Full Test Suite',
        description: 'A comprehensive test suite',
        type: 'integration',
        workspace: 'tests',
        command: 'npm run test:integration',
        requiredServices: ['localstack', 'database'],
        dataScenario: 'full-dataset',
        timeout: 120000,
        canRunParallel: false,
        supportsCoverage: true,
        tags: ['integration', 'slow']
      };

      mockServiceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'healthy' },
        database: { status: 'healthy' }
      });
      mockDataManager.getRequiredScenario.mockResolvedValue('full-dataset');
      mockDataManager.seedScenario.mockResolvedValue(true);
      mockDataManager.cleanupScenario.mockResolvedValue(true);

      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await testExecutor.executeSuite(fullSuite);

      expect(result.status).toBe('passed');
      expect(mockDataManager.seedScenario).toHaveBeenCalledWith('full-dataset');
    });

    it('should handle execution with all options', async () => {
      const options = {
        coverage: true,
        ci: true,
        silent: true,
        scenario: 'custom',
        skipCleanup: true,
        timeout: 30000
      };

      mockDataManager.seedScenario.mockResolvedValue(true);
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await testExecutor.executeSuite(mockSuite, options);

      expect(result.status).toBe('passed');
      expect(mockDataManager.seedScenario).toHaveBeenCalledWith('custom');
      expect(mockDataManager.cleanupScenario).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete successful workflow', async () => {
      const integrationSuite = {
        name: 'integration-tests',
        command: 'npm run test:integration',
        workspace: 'tests/integration',
        requiredServices: ['localstack', 'frontend'],
        timeout: 90000
      };

      // Mock all dependencies to succeed
      mockServiceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'healthy' },
        frontend: { status: 'healthy' }
      });
      mockDataManager.getRequiredScenario.mockResolvedValue('integration-data');
      mockDataManager.seedScenario.mockResolvedValue(true);
      mockDataManager.cleanupScenario.mockResolvedValue(true);

      mockSpawn.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('Tests: 0 failed, 12 passed, 12 total\nAll files | 92.5 | 88.3 | 90.1 | 92.5'));
        }
      });
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      const result = await testExecutor.executeSuite(integrationSuite, { coverage: true });

      expect(result.suite).toBe('integration-tests');
      expect(result.status).toBe('passed');
      expect(result.tests.total).toBe(12);
      expect(result.tests.passed).toBe(12);
      expect(result.tests.failed).toBe(0);
      expect(result.coverage).toEqual({
        statements: 92.5,
        branches: 88.3,
        functions: 90.1,
        lines: 92.5
      });

      // Verify complete workflow was executed
      expect(mockServiceValidator.validateEnvironment).toHaveBeenCalled();
      expect(mockDataManager.getRequiredScenario).toHaveBeenCalled();
      expect(mockDataManager.seedScenario).toHaveBeenCalled();
      expect(mockDataManager.cleanupScenario).toHaveBeenCalled();
      expect(spawn).toHaveBeenCalled();
    });

    it('should handle partial failure with proper cleanup', async () => {
      const suite = {
        name: 'failing-suite',
        command: 'npm run test',
        requiredServices: ['localstack']
      };

      mockServiceValidator.validateEnvironment.mockResolvedValue({
        localstack: { status: 'healthy' }
      });
      mockDataManager.getRequiredScenario.mockResolvedValue('test-data');
      mockDataManager.seedScenario.mockResolvedValue(true);
      mockDataManager.cleanupScenario.mockResolvedValue(true);

      // Mock test failure
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });
      mockSpawn.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('Tests: 3 failed, 2 passed, 5 total'));
        }
      });

      const result = await testExecutor.executeSuite(suite);

      expect(result.status).toBe('failed');
      expect(result.tests.failed).toBe(3);
      expect(result.tests.passed).toBe(2);

      // Verify cleanup still happened despite test failure
      expect(mockDataManager.cleanupScenario).toHaveBeenCalledWith('test-data');
    });
  });
});