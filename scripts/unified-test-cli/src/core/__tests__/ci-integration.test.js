/**
 * Integration tests for CI/CD features in UnifiedTestCLI
 */

// Mock all dependencies before importing
jest.mock('chalk', () => ({
  red: jest.fn(str => str),
  green: jest.fn(str => str),
  blue: jest.fn(str => str),
  yellow: jest.fn(str => str),
  gray: jest.fn(str => str),
  bold: jest.fn(str => str)
}));

jest.mock('../../utils/ci-detector.js');
jest.mock('../../utils/artifact-generator.js');
jest.mock('../test-discovery.js', () => ({
  TestDiscovery: jest.fn().mockImplementation(() => ({
    discoverSuites: jest.fn()
  }))
}));

jest.mock('../service-validator.js', () => ({
  ServiceValidator: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../data-manager.js', () => ({
  DataManager: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../test-executor.js', () => ({
  TestExecutor: jest.fn().mockImplementation(() => ({
    executeSuite: jest.fn()
  }))
}));

jest.mock('../../utils/parallel-executor.js', () => ({
  ParallelExecutor: jest.fn().mockImplementation(() => ({
    executeParallel: jest.fn()
  }))
}));
jest.mock('../../cli/interactive-menu.js', () => ({
  InteractiveMenu: jest.fn().mockImplementation(() => ({
    showSuiteSelectionMenu: jest.fn(),
    showExecutionOptionsMenu: jest.fn(),
    showConfirmationMenu: jest.fn()
  }))
}));
jest.mock('../../utils/logger.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }))
}));

jest.mock('../../reporters/console-reporter.js', () => 
  jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(),
    summary: jest.fn().mockResolvedValue({ success: true })
  }))
);

jest.mock('../../reporters/junit-reporter.js', () => 
  jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(),
    summary: jest.fn().mockResolvedValue({ success: true })
  }))
);

jest.mock('../../reporters/console-reporter.js', () => {
  function ConsoleReporter() {
    this.start = jest.fn().mockResolvedValue();
    this.summary = jest.fn().mockResolvedValue({ success: true });
  }
  return ConsoleReporter;
});

jest.mock('../../reporters/junit-reporter.js', () => {
  function JUnitReporter() {
    this.start = jest.fn().mockResolvedValue();
    this.summary = jest.fn().mockResolvedValue({ success: true });
  }
  return JUnitReporter;
});

jest.mock('../../reporters/json-reporter.js', () => ({
  JSONReporter: function JSONReporter() {
    this.start = jest.fn().mockResolvedValue();
    this.summary = jest.fn().mockResolvedValue({ success: true });
  }
}));

import { UnifiedTestCLI } from '../unified-test-cli.js';
import { CIDetector } from '../../utils/ci-detector.js';
import { ArtifactGenerator } from '../../utils/artifact-generator.js';

describe('UnifiedTestCLI CI/CD Integration', () => {
  let cli;
  let mockCIDetector;
  let mockArtifactGenerator;
  let originalExit;

  beforeEach(() => {
    // Mock process.exit to prevent test termination
    originalExit = process.exit;
    process.exit = jest.fn();

    // Setup CI detector mock
    mockCIDetector = {
      isCI: jest.fn().mockReturnValue(false),
      getCIConfig: jest.fn().mockReturnValue({
        isCI: false,
        nonInteractive: false,
        outputFormats: ['console'],
        artifactDir: './test-results',
        exitOnFailure: false
      }),
      getArtifactPaths: jest.fn().mockReturnValue({
        testResults: './test-results',
        junit: './test-results/junit.xml',
        json: './test-results/results.json'
      })
    };

    // Setup artifact generator mock
    mockArtifactGenerator = {
      generateArtifacts: jest.fn().mockResolvedValue({
        success: true,
        artifactCount: 5,
        artifacts: []
      }),
      getExitCode: jest.fn().mockReturnValue(0)
    };

    CIDetector.mockImplementation(() => mockCIDetector);
    ArtifactGenerator.mockImplementation(() => mockArtifactGenerator);

    cli = new UnifiedTestCLI();

    // Mock test discovery to return sample suites
    cli.testDiscovery.discoverSuites = jest.fn().mockResolvedValue([
      {
        name: 'frontend-unit',
        displayName: 'Frontend Unit Tests',
        tags: ['critical', 'unit'],
        type: 'unit'
      },
      {
        name: 'backend-unit',
        displayName: 'Backend Unit Tests',
        tags: ['critical', 'unit'],
        type: 'unit'
      }
    ]);

    // Mock test executor with proper return values
    cli.testExecutor.executeSuite = jest.fn().mockResolvedValue({
      suite: 'test-suite',
      status: 'passed',
      duration: 1000,
      tests: { total: 5, passed: 5, failed: 0, skipped: 0 }
    });

    // Mock parallel executor to return array of results
    cli.parallelExecutor.executeParallel = jest.fn().mockResolvedValue([
      {
        suite: 'frontend-unit',
        status: 'passed',
        duration: 1000,
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 }
      }
    ]);
  });

  afterEach(() => {
    process.exit = originalExit;
    jest.clearAllMocks();
  });

  describe('CI environment detection', () => {
    test('should detect CI environment and apply CI configuration', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: true,
        nonInteractive: true,
        environment: { name: 'GitHub Actions' },
        outputFormats: ['console', 'junit', 'json'],
        exitOnFailure: true,
        parallelDefault: true
      });

      await cli.run(null, {});

      expect(mockCIDetector.getCIConfig).toHaveBeenCalled();
      expect(cli.testExecutor.executeSuite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ci: true,
          reporters: expect.any(Array)
        })
      );
    });

    test('should run critical suites in CI mode', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: true,
        nonInteractive: true,
        outputFormats: ['console'],
        exitOnFailure: true
      });

      await cli.run(null, { ci: true });

      // Should execute both critical suites
      expect(cli.testExecutor.executeSuite).toHaveBeenCalledTimes(2);
      expect(cli.testExecutor.executeSuite).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'frontend-unit' }),
        expect.any(Object)
      );
      expect(cli.testExecutor.executeSuite).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'backend-unit' }),
        expect.any(Object)
      );
    });

    test('should enable parallel execution by default in CI', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: true,
        nonInteractive: true,
        parallelDefault: true,
        outputFormats: ['console'],
        exitOnFailure: true
      });

      cli.parallelExecutor.executeParallel = jest.fn().mockResolvedValue([
        { suite: 'frontend-unit', status: 'passed' },
        { suite: 'backend-unit', status: 'passed' }
      ]);

      await cli.run(null, {});

      expect(cli.parallelExecutor.executeParallel).toHaveBeenCalled();
    });
  });

  describe('reporter initialization', () => {
    test('should initialize console reporter by default', async () => {
      const reporters = cli._initializeReporters({}, { isCI: false });
      
      expect(reporters).toHaveLength(1);
      expect(reporters[0].constructor.name).toBe('ConsoleReporter');
    });

    test('should initialize JUnit reporter in CI environment', async () => {
      const ciConfig = {
        isCI: true,
        outputFormats: ['console', 'junit']
      };
      
      const reporters = cli._initializeReporters({}, ciConfig);
      
      expect(reporters.length).toBeGreaterThanOrEqual(2);
      expect(reporters.some(r => r.constructor.name === 'JUnitReporter')).toBe(true);
    });

    test('should initialize JSON reporter when requested', async () => {
      const reporters = cli._initializeReporters({ json: true }, { isCI: false });
      
      expect(reporters.some(r => r.constructor.name === 'JSONReporter')).toBe(true);
    });

    test('should not initialize console reporter when quiet option is set', async () => {
      const reporters = cli._initializeReporters({ quiet: true }, { isCI: false });
      
      expect(reporters).toHaveLength(0);
    });
  });

  describe('artifact generation', () => {
    test('should generate artifacts in CI environment', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: true,
        nonInteractive: true,
        outputFormats: ['console', 'junit'],
        exitOnFailure: true
      });

      await cli.run(null, {});

      expect(mockArtifactGenerator.generateArtifacts).toHaveBeenCalledWith(
        expect.any(Array), // test results
        expect.any(Array)  // reporter results
      );
    });

    test('should not generate artifacts in local environment', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: false,
        nonInteractive: false,
        outputFormats: ['console'],
        exitOnFailure: false
      });

      await cli.run(null, {});

      expect(mockArtifactGenerator.generateArtifacts).not.toHaveBeenCalled();
    });
  });

  describe('exit code handling', () => {
    test('should exit with success code when all tests pass in CI', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: true,
        nonInteractive: true,
        exitOnFailure: true
      });

      await cli.run(null, {});

      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('should exit with failure code when tests fail in CI', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: true,
        nonInteractive: true,
        exitOnFailure: true
      });

      mockArtifactGenerator.getExitCode.mockReturnValue(1);

      // Mock parallel executor to return failed results with exactly 1 failed test
      cli.parallelExecutor.executeParallel = jest.fn().mockResolvedValue([
        {
          suite: 'test-suite',
          status: 'failed',
          duration: 1000,
          tests: { total: 5, passed: 4, failed: 1, skipped: 0 }
        }
      ]);

      await cli.run(null, {});

      expect(mockArtifactGenerator.getExitCode).toHaveBeenCalledWith({
        success: false,
        failedTests: 1
      });
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should not exit in local environment on failure', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: false,
        exitOnFailure: false
      });

      // Mock parallel executor to return failed results
      cli.parallelExecutor.executeParallel = jest.fn().mockResolvedValue([
        {
          suite: 'test-suite',
          status: 'failed',
          tests: { total: 5, passed: 3, failed: 2, skipped: 0 }
        }
      ]);

      await expect(cli.run(null, {})).rejects.toThrow('Some test suites failed');
      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('non-interactive mode', () => {
    test('should skip interactive menus in CI mode', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: true,
        nonInteractive: true,
        outputFormats: ['console']
      });

      cli.interactiveMenu.showSuiteSelectionMenu = jest.fn();

      await cli.run(null, { ci: true });

      expect(cli.interactiveMenu.showSuiteSelectionMenu).not.toHaveBeenCalled();
    });

    test('should use interactive menus in local environment', async () => {
      mockCIDetector.getCIConfig.mockReturnValue({
        isCI: false,
        nonInteractive: false
      });

      cli.interactiveMenu.showSuiteSelectionMenu = jest.fn().mockResolvedValue([
        { name: 'frontend-unit' }
      ]);
      cli.interactiveMenu.showExecutionOptionsMenu = jest.fn().mockResolvedValue({});
      cli.interactiveMenu.showConfirmationMenu = jest.fn().mockResolvedValue(true);

      await cli.run(null, {});

      expect(cli.interactiveMenu.showSuiteSelectionMenu).toHaveBeenCalled();
    });
  });

  describe('error handling in CI', () => {
    test('should exit with error code on CLI execution failure in CI', async () => {
      mockCIDetector.isCI.mockReturnValue(true);
      mockArtifactGenerator.getExitCode.mockReturnValue(2);

      cli.testDiscovery.discoverSuites = jest.fn().mockRejectedValue(
        new Error('Failed to discover test suites')
      );

      await expect(cli.run(null, {})).rejects.toThrow();
      expect(process.exit).toHaveBeenCalledWith(2);
    });

    test('should not exit on error in local environment', async () => {
      mockCIDetector.isCI.mockReturnValue(false);

      cli.testDiscovery.discoverSuites = jest.fn().mockRejectedValue(
        new Error('Failed to discover test suites')
      );

      await expect(cli.run(null, {})).rejects.toThrow('Failed to discover test suites');
      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('reporter integration', () => {
    test('should pass reporters to test executor', async () => {
      const mockReporter = {
        start: jest.fn().mockResolvedValue(),
        summary: jest.fn().mockResolvedValue({ success: true })
      };

      cli._initializeReporters = jest.fn().mockReturnValue([mockReporter]);

      await cli.run('frontend-unit', {});

      expect(cli.testExecutor.executeSuite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          reporters: [mockReporter]
        })
      );
    });

    test('should handle reporter failures gracefully', async () => {
      const mockReporter = {
        start: jest.fn().mockResolvedValue(),
        summary: jest.fn().mockRejectedValue(new Error('Reporter failed'))
      };

      cli._initializeReporters = jest.fn().mockReturnValue([mockReporter]);

      // Mock successful execution despite reporter failure
      cli.parallelExecutor.executeParallel = jest.fn().mockResolvedValue([
        {
          suite: 'frontend-unit',
          status: 'failed',
          tests: { total: 5, passed: 3, failed: 2, skipped: 0 }
        }
      ]);

      // Should throw because tests failed, not because of reporter failure
      await expect(cli.run('frontend-unit', {})).rejects.toThrow();
    });
  });
});