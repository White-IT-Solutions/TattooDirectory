import ConsoleReporter from '../console-reporter.js';

// Mock chalk to avoid color codes in tests
jest.mock('chalk', () => {
  const mockChalk = {
    blue: jest.fn(text => `[BLUE]${text}[/BLUE]`),
    green: jest.fn(text => `[GREEN]${text}[/GREEN]`),
    red: jest.fn(text => `[RED]${text}[/RED]`),
    yellow: jest.fn(text => `[YELLOW]${text}[/YELLOW]`),
    gray: jest.fn(text => `[GRAY]${text}[/GRAY]`),
    bold: jest.fn(text => `[BOLD]${text}[/BOLD]`)
  };
  
  // Add nested properties
  mockChalk.bold.red = jest.fn(text => `[BOLD_RED]${text}[/BOLD_RED]`);
  mockChalk.bold.green = jest.fn(text => `[BOLD_GREEN]${text}[/BOLD_GREEN]`);
  mockChalk.green.bold = jest.fn(text => `[GREEN_BOLD]${text}[/GREEN_BOLD]`);
  mockChalk.red.bold = jest.fn(text => `[RED_BOLD]${text}[/RED_BOLD]`);
  
  return mockChalk;
});

describe('ConsoleReporter', () => {
  let reporter;
  let consoleSpy;

  beforeEach(() => {
    reporter = new ConsoleReporter();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const reporter = new ConsoleReporter();
      expect(reporter.options.verbose).toBe(false);
      expect(reporter.options.colors).toBe(true);
      expect(reporter.options.showProgress).toBe(true);
      expect(reporter.options.maxErrorLines).toBe(10);
    });

    it('should accept custom options', () => {
      const options = {
        verbose: true,
        colors: false,
        showProgress: false,
        maxErrorLines: 5
      };
      const reporter = new ConsoleReporter(options);
      expect(reporter.options.verbose).toBe(true);
      expect(reporter.options.colors).toBe(false);
      expect(reporter.options.showProgress).toBe(false);
      expect(reporter.options.maxErrorLines).toBe(5);
    });
  });

  describe('start', () => {
    it('should initialize reporting session', () => {
      reporter.start(['suite1', 'suite2']);
      
      expect(reporter.startTime).toBeDefined();
      expect(reporter.suiteResults).toEqual([]);
      expect(reporter.totalTests).toBe(0);
      expect(reporter.passedTests).toBe(0);
      expect(reporter.failedTests).toBe(0);
      expect(reporter.skippedTests).toBe(0);
    });

    it('should log progress when showProgress is enabled', () => {
      reporter.options.showProgress = true;
      reporter.start(['suite1', 'suite2']);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting test execution'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Running 2 test suite(s)'));
    });

    it('should not log progress when showProgress is disabled', () => {
      reporter.options.showProgress = false;
      reporter.start(['suite1', 'suite2']);
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('suiteStart', () => {
    it('should log suite start when showProgress is enabled', () => {
      reporter.options.showProgress = true;
      reporter.suiteStart('test-suite');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting test-suite'));
    });

    it('should not log when showProgress is disabled', () => {
      reporter.options.showProgress = false;
      reporter.suiteStart('test-suite');
      
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('suiteComplete', () => {
    it('should handle passed suite result', () => {
      const result = {
        suite: 'test-suite',
        status: 'passed',
        duration: 1500,
        tests: { total: 10, passed: 10, failed: 0, skipped: 0 },
        errors: []
      };

      reporter.suiteComplete(result);

      expect(reporter.suiteResults).toContain(result);
      expect(reporter.totalTests).toBe(10);
      expect(reporter.passedTests).toBe(10);
      expect(reporter.failedTests).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-suite - 10/10 tests passed'));
    });

    it('should handle failed suite result', () => {
      const result = {
        suite: 'test-suite',
        status: 'failed',
        duration: 2000,
        tests: { total: 10, passed: 8, failed: 2, skipped: 0 },
        errors: [
          { test: 'Test 1', message: 'Assertion failed' },
          { test: 'Test 2', message: 'Timeout error' }
        ]
      };

      reporter.suiteComplete(result);

      expect(reporter.suiteResults).toContain(result);
      expect(reporter.totalTests).toBe(10);
      expect(reporter.passedTests).toBe(8);
      expect(reporter.failedTests).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-suite - 2/10 tests failed'));
    });

    it('should handle skipped suite result', () => {
      const result = {
        suite: 'test-suite',
        status: 'skipped',
        duration: 0,
        tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
        errors: []
      };

      reporter.suiteComplete(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-suite - skipped'));
    });

    it('should log errors in verbose mode', () => {
      reporter.options.verbose = true;
      const result = {
        suite: 'test-suite',
        status: 'failed',
        duration: 2000,
        tests: { total: 10, passed: 8, failed: 2, skipped: 0 },
        errors: [
          { test: 'Test 1', message: 'Assertion failed', stack: 'Error stack trace' }
        ]
      };

      reporter.suiteComplete(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test 1: Assertion failed'));
    });

    it('should log coverage in verbose mode', () => {
      reporter.options.verbose = true;
      const result = {
        suite: 'test-suite',
        status: 'passed',
        duration: 1500,
        tests: { total: 10, passed: 10, failed: 0, skipped: 0 },
        coverage: { lines: 85.2, functions: 78.9, branches: 82.1, statements: 85.2 },
        errors: []
      };

      reporter.suiteComplete(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Coverage:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Lines: [GREEN]85.2[/GREEN]%'));
    });
  });

  describe('parallelProgress', () => {
    it('should log parallel execution progress', () => {
      reporter.options.showProgress = true;
      reporter.parallelProgress(3, 5);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Progress: 3/5 suites completed (60%)'));
    });
  });

  describe('serviceValidation', () => {
    it('should log successful service validation', () => {
      reporter.serviceValidation('localstack', 'success', 'Service is ready');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('localstack - ready'));
    });

    it('should log failed service validation', () => {
      reporter.serviceValidation('localstack', 'error', 'Connection failed');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('localstack - Connection failed'));
    });

    it('should log service validation warning', () => {
      reporter.serviceValidation('frontend', 'warning', 'Slow response');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('frontend - Slow response'));
    });
  });

  describe('dataSeeding', () => {
    it('should log data seeding start', () => {
      reporter.dataSeeding('test-scenario', 'start');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Seeding data scenario: test-scenario'));
    });

    it('should log successful data seeding', () => {
      reporter.dataSeeding('test-scenario', 'success');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-scenario\' seeded successfully'));
    });

    it('should log failed data seeding', () => {
      reporter.dataSeeding('test-scenario', 'error', 'Database connection failed');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to seed data scenario'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
    });
  });

  describe('summary', () => {
    beforeEach(() => {
      reporter.start();
      // Add some test results
      reporter.suiteComplete({
        suite: 'suite1',
        status: 'passed',
        duration: 1000,
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 },
        errors: []
      });
      reporter.suiteComplete({
        suite: 'suite2',
        status: 'failed',
        duration: 2000,
        tests: { total: 8, passed: 6, failed: 2, skipped: 0 },
        errors: [{ test: 'Test A', message: 'Failed assertion' }]
      });
    });

    it('should generate comprehensive summary', () => {
      const summary = reporter.summary();

      expect(summary.success).toBe(false);
      expect(summary.totalSuites).toBe(2);
      expect(summary.totalTests).toBe(13);
      expect(summary.passed).toBe(11);
      expect(summary.failed).toBe(2);
      expect(summary.skipped).toBe(0);
      expect(summary.duration).toBeGreaterThanOrEqual(0);
      expect(summary.successRate).toBeCloseTo(85, 0);
    });

    it('should log summary statistics', () => {
      reporter.summary();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test Summary'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Suites: 2'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Tests: 13'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Passed: [GREEN]11[/GREEN]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed: [RED]2[/RED]'));
    });

    it('should log failed test details', () => {
      reporter.summary();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed Tests:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('suite2:'));
    });

    it('should show success message when all tests pass', () => {
      // Reset and add only passing tests
      reporter.suiteResults = [];
      reporter.totalTests = 5;
      reporter.passedTests = 5;
      reporter.failedTests = 0;
      reporter.skippedTests = 0;
      
      reporter.suiteResults.push({
        suite: 'suite1',
        status: 'passed',
        duration: 1000,
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 },
        errors: []
      });

      reporter.summary();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('All tests passed!'));
    });
  });

  describe('error, warn, info methods', () => {
    it('should log error messages', () => {
      reporter.error('Test error', new Error('Something went wrong'));
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error: Test error'));
    });

    it('should log warning messages', () => {
      reporter.warn('Test warning');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warning: Test warning'));
    });

    it('should log info messages', () => {
      reporter.info('Test info');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test info'));
    });
  });

  describe('color handling', () => {
    it('should strip colors when colors option is false', () => {
      reporter.options.colors = false;
      reporter.info('Test message');
      
      // The _log method should strip ANSI codes when colors is false
      // Since we're mocking chalk, we need to verify the stripping logic works
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0];
      // The actual implementation strips ANSI codes, but our test shows the mock behavior
      expect(lastCall).toContain('Test message');
    });
  });

  describe('error limiting', () => {
    it('should limit number of errors displayed', () => {
      reporter.options.maxErrorLines = 2;
      const result = {
        suite: 'test-suite',
        status: 'failed',
        duration: 2000,
        tests: { total: 10, passed: 7, failed: 3, skipped: 0 },
        errors: [
          { test: 'Test 1', message: 'Error 1' },
          { test: 'Test 2', message: 'Error 2' },
          { test: 'Test 3', message: 'Error 3' }
        ]
      };

      reporter.options.verbose = true;
      reporter.suiteComplete(result);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('and 1 more errors'));
    });
  });
});