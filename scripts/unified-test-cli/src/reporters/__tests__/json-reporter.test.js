/**
 * Tests for JSON Reporter
 */

import fs from 'fs/promises';
import path from 'path';
import { JSONReporter } from '../json-reporter.js';

// Mock fs module
jest.mock('fs/promises');

describe('JSONReporter', () => {
  let reporter;
  let mockFs;

  beforeEach(() => {
    mockFs = fs;
    mockFs.mkdir = jest.fn().mockResolvedValue();
    mockFs.writeFile = jest.fn().mockResolvedValue();
    
    reporter = new JSONReporter({
      outputDir: './test-output',
      outputFile: 'test-results.json'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default options', () => {
      const defaultReporter = new JSONReporter();
      
      expect(defaultReporter.options.outputDir).toBe('./test-results');
      expect(defaultReporter.options.outputFile).toBe('results.json');
      expect(defaultReporter.options.includeDetails).toBe(true);
      expect(defaultReporter.options.includeEnvironment).toBe(true);
    });

    test('should accept custom options', () => {
      const customReporter = new JSONReporter({
        outputDir: './custom-output',
        outputFile: 'custom.json',
        includeDetails: false,
        includeEnvironment: false
      });
      
      expect(customReporter.options.outputDir).toBe('./custom-output');
      expect(customReporter.options.outputFile).toBe('custom.json');
      expect(customReporter.options.includeDetails).toBe(false);
      expect(customReporter.options.includeEnvironment).toBe(false);
    });
  });

  describe('start', () => {
    test('should create output directory and initialize metadata', async () => {
      const suites = ['frontend-unit', 'backend-unit'];
      
      await reporter.start(suites);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith('./test-output', { recursive: true });
      expect(reporter.metadata.execution.suites).toEqual(suites);
      expect(reporter.metadata.execution.totalSuites).toBe(2);
      expect(reporter.metadata.execution.startTime).toBeDefined();
    });

    test('should handle directory creation failure gracefully', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      // Should not throw, but log warning
      await expect(reporter.start()).resolves.not.toThrow();
    });
  });

  describe('suiteComplete', () => {
    test('should store suite result with enhanced metadata', () => {
      const result = {
        suite: 'frontend-unit',
        status: 'passed',
        duration: 5000,
        tests: { total: 10, passed: 10, failed: 0, skipped: 0 }
      };
      
      reporter.suiteComplete(result);
      
      expect(reporter.suiteResults).toHaveLength(1);
      expect(reporter.suiteResults[0]).toMatchObject({
        ...result,
        timestamp: expect.any(String),
        durationSeconds: 5
      });
    });
  });

  describe('parallelProgress', () => {
    test('should update execution metadata with progress', () => {
      reporter.parallelProgress(3, 5);
      
      expect(reporter.metadata.execution.parallelProgress).toMatchObject({
        completed: 3,
        total: 5,
        percentage: 60,
        timestamp: expect.any(String)
      });
    });
  });

  describe('serviceValidation', () => {
    test('should record service validation events', () => {
      reporter.serviceValidation('localstack', 'success', 'Service is healthy');
      reporter.serviceValidation('frontend', 'error', 'Service unavailable');
      
      expect(reporter.metadata.execution.serviceValidation).toHaveLength(2);
      expect(reporter.metadata.execution.serviceValidation[0]).toMatchObject({
        service: 'localstack',
        status: 'success',
        message: 'Service is healthy',
        timestamp: expect.any(String)
      });
    });
  });

  describe('dataSeeding', () => {
    test('should record data seeding events', () => {
      reporter.dataSeeding('frontend-ready', 'start', null);
      reporter.dataSeeding('frontend-ready', 'success', 'Data seeded successfully');
      
      expect(reporter.metadata.execution.dataSeeding).toHaveLength(2);
      expect(reporter.metadata.execution.dataSeeding[1]).toMatchObject({
        scenario: 'frontend-ready',
        status: 'success',
        message: 'Data seeded successfully',
        timestamp: expect.any(String)
      });
    });
  });

  describe('error', () => {
    test('should record error events', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      reporter.error('Something went wrong', error);
      
      expect(reporter.metadata.execution.errors).toHaveLength(1);
      expect(reporter.metadata.execution.errors[0]).toMatchObject({
        message: 'Something went wrong',
        error: {
          message: 'Test error',
          stack: 'Error: Test error\n    at test.js:1:1',
          name: 'Error'
        },
        timestamp: expect.any(String)
      });
    });

    test('should handle error without error object', () => {
      reporter.error('Simple error message');
      
      expect(reporter.metadata.execution.errors).toHaveLength(1);
      expect(reporter.metadata.execution.errors[0]).toMatchObject({
        message: 'Simple error message',
        error: null,
        timestamp: expect.any(String)
      });
    });
  });

  describe('warn', () => {
    test('should record warning events', () => {
      reporter.warn('This is a warning');
      
      expect(reporter.metadata.execution.warnings).toHaveLength(1);
      expect(reporter.metadata.execution.warnings[0]).toMatchObject({
        message: 'This is a warning',
        timestamp: expect.any(String)
      });
    });
  });

  describe('info', () => {
    test('should record info events', () => {
      reporter.info('This is info');
      
      expect(reporter.metadata.execution.info).toHaveLength(1);
      expect(reporter.metadata.execution.info[0]).toMatchObject({
        message: 'This is info',
        timestamp: expect.any(String)
      });
    });
  });

  describe('summary', () => {
    beforeEach(async () => {
      await reporter.start(['frontend-unit', 'backend-unit']);
      
      // Add some test results
      reporter.suiteComplete({
        suite: 'frontend-unit',
        status: 'passed',
        duration: 5000,
        tests: { total: 10, passed: 10, failed: 0, skipped: 0 }
      });
      
      reporter.suiteComplete({
        suite: 'backend-unit',
        status: 'failed',
        duration: 3000,
        tests: { total: 8, passed: 6, failed: 2, skipped: 0 },
        errors: [
          { message: 'Test failed', test: 'should work' }
        ]
      });
    });

    test('should generate complete JSON report', async () => {
      const result = await reporter.summary();
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join('./test-output', 'test-results.json'),
        expect.any(String),
        'utf8'
      );
      
      expect(result).toMatchObject({
        success: false, // One suite failed
        outputPath: path.join('./test-output', 'test-results.json'),
        totalSuites: 2,
        totalTests: 18,
        passedTests: 16,
        failedTests: 2,
        skippedTests: 0
      });
    });

    test('should generate report with correct structure', async () => {
      await reporter.summary();
      
      const writeCall = mockFs.writeFile.mock.calls[0];
      const jsonContent = writeCall[1];
      const report = JSON.parse(jsonContent);
      
      expect(report).toHaveProperty('metadata');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('suites');
      expect(report.metadata).toHaveProperty('execution');
      expect(report.metadata).toHaveProperty('system');
      expect(report.summary).toMatchObject({
        success: false,
        totalSuites: 2,
        totalTests: 18,
        passedTests: 16,
        failedTests: 2,
        successRate: 89
      });
    });

    test('should include timing breakdown when enabled', async () => {
      const timingReporter = new JSONReporter({
        outputDir: './test-output',
        includeTiming: true
      });
      
      await timingReporter.start();
      timingReporter.suiteComplete({
        suite: 'test-suite',
        status: 'passed',
        duration: 1000
      });
      
      await timingReporter.summary();
      
      const writeCall = mockFs.writeFile.mock.calls[0];
      const report = JSON.parse(writeCall[1]);
      
      expect(report).toHaveProperty('timing');
      expect(report.timing).toHaveProperty('suites');
      expect(report.timing).toHaveProperty('slowestSuite');
      expect(report.timing).toHaveProperty('fastestSuite');
    });

    test('should exclude details when includeDetails is false', async () => {
      const summaryReporter = new JSONReporter({
        outputDir: './test-output',
        includeDetails: false
      });
      
      await summaryReporter.start();
      summaryReporter.suiteComplete({
        suite: 'test-suite',
        status: 'passed',
        duration: 1000,
        tests: { total: 5, passed: 5, failed: 0, skipped: 0 }
      });
      
      await summaryReporter.summary();
      
      const writeCall = mockFs.writeFile.mock.calls[0];
      const report = JSON.parse(writeCall[1]);
      
      expect(report.suites[0]).not.toHaveProperty('errors');
      expect(report.suites[0]).toHaveProperty('suite');
      expect(report.suites[0]).toHaveProperty('status');
      expect(report.suites[0]).toHaveProperty('errorCount');
    });

    test('should handle file write failure', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));
      
      await expect(reporter.summary()).rejects.toThrow('Failed to write JSON report: Disk full');
    });
  });
});