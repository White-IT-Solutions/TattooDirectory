import JUnitReporter from '../junit-reporter.js';
import path from 'path';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn()
}));

// Import after mocking
import fs from 'fs/promises';

describe('JUnitReporter', () => {
  let reporter;

  beforeEach(() => {
    reporter = new JUnitReporter();
    
    // Reset mocks
    fs.mkdir.mockReset();
    fs.writeFile.mockReset();
    fs.mkdir.mockResolvedValue();
    fs.writeFile.mockResolvedValue();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const reporter = new JUnitReporter();
      expect(reporter.options.outputDir).toBe('./test-results');
      expect(reporter.options.outputFile).toBe('junit.xml');
      expect(reporter.options.suiteName).toBe('Unified Test CLI');
      expect(reporter.options.includeConsoleOutput).toBe(true);
    });

    it('should accept custom options', () => {
      const options = {
        outputDir: './custom-results',
        outputFile: 'custom.xml',
        suiteName: 'Custom Suite',
        includeConsoleOutput: false
      };
      const reporter = new JUnitReporter(options);
      expect(reporter.options.outputDir).toBe('./custom-results');
      expect(reporter.options.outputFile).toBe('custom.xml');
      expect(reporter.options.suiteName).toBe('Custom Suite');
      expect(reporter.options.includeConsoleOutput).toBe(false);
    });
  });

  describe('start', () => {
    it('should initialize reporting session and create output directory', async () => {
      await reporter.start(['suite1', 'suite2']);
      
      expect(reporter.startTime).toBeDefined();
      expect(reporter.suiteResults).toEqual([]);
      expect(reporter.consoleOutput).toEqual([]);
      expect(fs.mkdir).toHaveBeenCalledWith('./test-results', { recursive: true });
    });

    it('should handle directory creation failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      await reporter.start();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Could not create output directory'));
      consoleSpy.mockRestore();
    });
  });

  describe('suiteStart', () => {
    it('should add console output for suite start', () => {
      reporter.suiteStart('test-suite');
      
      expect(reporter.consoleOutput.some(output => output.includes('Starting test suite: test-suite'))).toBe(true);
    });
  });

  describe('suiteComplete', () => {
    it('should store suite result and add console output', () => {
      const result = {
        suite: 'test-suite',
        status: 'passed',
        duration: 1500,
        tests: { total: 10, passed: 10, failed: 0, skipped: 0 },
        errors: []
      };

      reporter.suiteComplete(result);

      expect(reporter.suiteResults).toContain(result);
      expect(reporter.consoleOutput.some(output => output.includes('Completed test suite: test-suite - passed'))).toBe(true);
    });
  });

  describe('parallelProgress', () => {
    it('should add console output for parallel progress', () => {
      reporter.parallelProgress(3, 5);
      
      expect(reporter.consoleOutput.some(output => output.includes('Parallel execution progress: 3/5'))).toBe(true);
    });
  });

  describe('serviceValidation', () => {
    it('should add console output for service validation', () => {
      reporter.serviceValidation('localstack', 'success', 'Ready');
      
      expect(reporter.consoleOutput.some(output => output.includes('Service validation - localstack: success - Ready'))).toBe(true);
    });
  });

  describe('dataSeeding', () => {
    it('should add console output for data seeding', () => {
      reporter.dataSeeding('test-scenario', 'success', 'Completed');
      
      expect(reporter.consoleOutput.some(output => output.includes('Data seeding - test-scenario: success - Completed'))).toBe(true);
    });
  });

  describe('summary', () => {
    beforeEach(async () => {
      await reporter.start();
      // Add some test results
      reporter.suiteComplete({
        suite: 'suite1',
        status: 'passed',
        duration: 1000,
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 },
        errors: [],
        startTime: new Date().toISOString()
      });
      reporter.suiteComplete({
        suite: 'suite2',
        status: 'failed',
        duration: 2000,
        tests: { total: 8, passed: 6, failed: 2, skipped: 0 },
        errors: [
          { test: 'Test A', message: 'Failed assertion', stack: 'Error stack trace' }
        ],
        startTime: new Date().toISOString()
      });
    });

    it('should generate and save JUnit XML report', async () => {
      const summary = await reporter.summary();

      expect(summary.success).toBe(false);
      expect(summary.totalSuites).toBe(2);
      expect(summary.totalTests).toBe(13);
      expect(summary.passed).toBe(11);
      expect(summary.failed).toBe(2);
      expect(summary.skipped).toBe(0);
      expect(summary.outputPath).toBe(path.join('./test-results', 'junit.xml'));
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('./test-results', 'junit.xml'),
        expect.stringContaining('<?xml version="1.0" encoding="UTF-8"?>'),
        'utf8'
      );
    });

    it('should generate valid XML structure', async () => {
      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xmlContent).toContain('<testsuites name="Unified Test CLI"');
      expect(xmlContent).toContain('tests="13"');
      expect(xmlContent).toContain('failures="2"');
      expect(xmlContent).toContain('<testsuite name="suite1"');
      expect(xmlContent).toContain('<testsuite name="suite2"');
      expect(xmlContent).toContain('</testsuites>');
    });

    it('should include system properties', async () => {
      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).toContain('<properties>');
      expect(xmlContent).toContain(`<property name="platform" value="${process.platform}"/>`);
      expect(xmlContent).toContain(`<property name="node.version" value="${process.version}"/>`);
      expect(xmlContent).toContain('<property name="test.framework" value="Unified Test CLI"/>');
    });

    it('should include console output when enabled', async () => {
      reporter.options.includeConsoleOutput = true;
      reporter.consoleOutput.push('Test output line 1', 'Test output line 2');
      
      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).toContain('<system-out><![CDATA[');
      expect(xmlContent).toContain('Test output line 1');
      expect(xmlContent).toContain('Test output line 2');
    });

    it('should not include console output when disabled', async () => {
      reporter.options.includeConsoleOutput = false;
      reporter.consoleOutput.push('Test output line 1');
      
      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).not.toContain('<system-out>');
    });

    it('should handle file write errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      await expect(reporter.summary()).rejects.toThrow('Failed to write JUnit XML report: Write failed');
    });
  });

  describe('XML generation', () => {
    it('should escape XML special characters', async () => {
      await reporter.start();
      reporter.suiteComplete({
        suite: 'suite with <special> & "characters"',
        status: 'failed',
        duration: 1000,
        tests: { total: 1, passed: 0, failed: 1, skipped: 0 },
        errors: [
          { test: 'Test with <tags> & "quotes"', message: 'Error with <xml> & "chars"' }
        ]
      });

      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).toContain('&lt;special&gt; &amp; &quot;characters&quot;');
      expect(xmlContent).toContain('&lt;tags&gt; &amp; &quot;quotes&quot;');
      expect(xmlContent).toContain('&lt;xml&gt; &amp; &quot;chars&quot;');
    });

    it('should generate test cases for failed tests with error details', async () => {
      await reporter.start();
      reporter.suiteComplete({
        suite: 'test-suite',
        status: 'failed',
        duration: 1000,
        tests: { total: 2, passed: 1, failed: 1, skipped: 0 },
        errors: [
          { 
            test: 'Failed Test', 
            message: 'Assertion failed', 
            stack: 'Error: Assertion failed\n    at test.js:10:5',
            type: 'AssertionError'
          }
        ]
      });

      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).toContain('<testcase name="Failed Test"');
      expect(xmlContent).toContain('<failure message="Assertion failed" type="AssertionError">');
      expect(xmlContent).toContain('<![CDATA[Error: Assertion failed');
    });

    it('should generate test cases for skipped tests', async () => {
      await reporter.start();
      reporter.suiteComplete({
        suite: 'test-suite',
        status: 'passed',
        duration: 1000,
        tests: { total: 2, passed: 1, failed: 0, skipped: 1 },
        errors: []
      });

      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).toContain('<testcase name="Skipped Test 1"');
      expect(xmlContent).toContain('<skipped/>');
    });

    it('should handle suites with no individual test data', async () => {
      await reporter.start();
      reporter.suiteComplete({
        suite: 'simple-suite',
        status: 'passed',
        duration: 1000,
        tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
        errors: []
      });

      await reporter.summary();

      const xmlContent = fs.writeFile.mock.calls[0][1];
      
      expect(xmlContent).toContain('<testcase name="simple-suite Suite"');
      expect(xmlContent).toContain('classname="simple-suite"');
    });
  });

  describe('error, warn, info methods', () => {
    it('should add console output for error messages', () => {
      reporter.error('Test error', new Error('Something went wrong'));
      
      expect(reporter.consoleOutput.some(output => output.includes('ERROR: Test error - Something went wrong'))).toBe(true);
    });

    it('should add console output for warning messages', () => {
      reporter.warn('Test warning');
      
      expect(reporter.consoleOutput.some(output => output.includes('WARNING: Test warning'))).toBe(true);
    });

    it('should add console output for info messages', () => {
      reporter.info('Test info');
      
      expect(reporter.consoleOutput.some(output => output.includes('INFO: Test info'))).toBe(true);
    });
  });

  describe('helper methods', () => {
    beforeEach(async () => {
      await reporter.start();
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
        errors: [{ test: 'Test A', message: 'Failed' }]
      });
    });

    it('should calculate total tests correctly', () => {
      expect(reporter._getTotalTests()).toBe(13);
    });

    it('should calculate passed tests correctly', () => {
      expect(reporter._getPassedTests()).toBe(11);
    });

    it('should calculate failed tests correctly', () => {
      expect(reporter._getFailedTests()).toBe(2);
    });

    it('should calculate skipped tests correctly', () => {
      expect(reporter._getSkippedTests()).toBe(0);
    });

    it('should determine overall success correctly', () => {
      expect(reporter._isOverallSuccess()).toBe(false);
    });
  });
});