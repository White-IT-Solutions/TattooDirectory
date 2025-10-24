import CoverageReporter from '../coverage-reporter.js';
import path from 'path';

// Mock fs.promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn()
}));

// Import the mocked fs module
import fs from 'fs/promises';
const mockMkdir = fs.mkdir;
const mockWriteFile = fs.writeFile;

describe('CoverageReporter', () => {
  let reporter;

  beforeEach(() => {
    reporter = new CoverageReporter();
    
    // Reset mocks
    mockMkdir.mockReset();
    mockWriteFile.mockReset();
    mockMkdir.mockResolvedValue();
    mockWriteFile.mockResolvedValue();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const reporter = new CoverageReporter();
      expect(reporter.options.outputDir).toBe('./coverage');
      expect(reporter.options.formats).toEqual(['json', 'lcov', 'html']);
      expect(reporter.options.threshold.lines).toBe(80);
      expect(reporter.options.threshold.functions).toBe(80);
      expect(reporter.options.threshold.branches).toBe(80);
      expect(reporter.options.threshold.statements).toBe(80);
      expect(reporter.options.includeUncovered).toBe(true);
    });

    it('should accept custom options', () => {
      const options = {
        outputDir: './custom-coverage',
        formats: ['json'],
        threshold: {
          lines: 90,
          functions: 85,
          branches: 75,
          statements: 88
        },
        includeUncovered: false
      };
      const reporter = new CoverageReporter(options);
      expect(reporter.options.outputDir).toBe('./custom-coverage');
      expect(reporter.options.formats).toEqual(['json']);
      expect(reporter.options.threshold.lines).toBe(90);
      expect(reporter.options.threshold.functions).toBe(85);
      expect(reporter.options.threshold.branches).toBe(75);
      expect(reporter.options.threshold.statements).toBe(88);
      expect(reporter.options.includeUncovered).toBe(false);
    });
  });

  describe('start', () => {
    it('should initialize reporting session and create output directory', async () => {
      await reporter.start(['suite1', 'suite2']);
      
      expect(reporter.startTime).toBeDefined();
      expect(reporter.coverageData).toEqual({});
      expect(reporter.suiteResults).toEqual([]);
      expect(mockMkdir).toHaveBeenCalledWith('./coverage', { recursive: true });
    });

    it('should handle directory creation failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockMkdir.mockRejectedValue(new Error('Permission denied'));
      
      await reporter.start();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Could not create coverage output directory'));
      consoleSpy.mockRestore();
    });
  });

  describe('suiteComplete', () => {
    it('should store suite result and merge coverage data', () => {
      const result = {
        suite: 'test-suite',
        status: 'passed',
        duration: 1500,
        tests: { total: 10, passed: 10, failed: 0, skipped: 0 },
        coverage: { lines: 85.2, functions: 78.9, branches: 82.1, statements: 85.2 },
        coverageData: {
          'src/file1.js': {
            s: { '1': 5, '2': 3, '3': 0 },
            f: { '1': 2, '2': 1 },
            b: { '1': [2, 1], '2': [0, 3] },
            statementMap: {
              '1': { start: { line: 1 }, end: { line: 1 } },
              '2': { start: { line: 2 }, end: { line: 2 } },
              '3': { start: { line: 3 }, end: { line: 3 } }
            },
            fnMap: {
              '1': { name: 'func1', loc: { start: { line: 1 } } },
              '2': { name: 'func2', loc: { start: { line: 5 } } }
            },
            branchMap: {
              '1': { loc: { start: { line: 2 } } },
              '2': { loc: { start: { line: 4 } } }
            }
          }
        }
      };

      reporter.suiteComplete(result);

      expect(reporter.suiteResults).toContain(result);
      expect(reporter.coverageData['src/file1.js']).toBeDefined();
      expect(reporter.coverageData['src/file1.js'].suites).toContain('test-suite');
    });

    it('should merge coverage data from multiple suites for same file', () => {
      const result1 = {
        suite: 'suite1',
        status: 'passed',
        coverage: { lines: 80 },
        coverageData: {
          'src/file1.js': {
            s: { '1': 2, '2': 1 },
            f: { '1': 1 },
            b: { '1': [1, 0] }
          }
        }
      };

      const result2 = {
        suite: 'suite2',
        status: 'passed',
        coverage: { lines: 90 },
        coverageData: {
          'src/file1.js': {
            s: { '1': 3, '2': 2 },
            f: { '1': 2 },
            b: { '1': [2, 1] }
          }
        }
      };

      reporter.suiteComplete(result1);
      reporter.suiteComplete(result2);

      const mergedData = reporter.coverageData['src/file1.js'];
      expect(mergedData.s['1']).toBe(5); // 2 + 3
      expect(mergedData.s['2']).toBe(3); // 1 + 2
      expect(mergedData.f['1']).toBe(3); // 1 + 2
      expect(mergedData.b['1']).toEqual([3, 1]); // [1+2, 0+1]
      expect(mergedData.suites).toEqual(['suite1', 'suite2']);
    });
  });

  describe('summary', () => {
    beforeEach(async () => {
      await reporter.start();
      
      // Add coverage data
      reporter.suiteComplete({
        suite: 'test-suite',
        status: 'passed',
        coverage: { lines: 85.2 },
        coverageData: {
          'src/file1.js': {
            s: { '1': 5, '2': 3, '3': 0 },
            f: { '1': 2, '2': 0 },
            b: { '1': [2, 1], '2': [0, 3] },
            statementMap: {
              '1': { start: { line: 1 }, end: { line: 1 } },
              '2': { start: { line: 2 }, end: { line: 2 } },
              '3': { start: { line: 3 }, end: { line: 3 } }
            },
            fnMap: {
              '1': { name: 'func1', loc: { start: { line: 1 } } },
              '2': { name: 'func2', loc: { start: { line: 5 } } }
            },
            branchMap: {
              '1': { loc: { start: { line: 2 } } },
              '2': { loc: { start: { line: 4 } } }
            }
          }
        }
      });
    });

    it('should generate comprehensive coverage summary', async () => {
      const summary = await reporter.summary();

      expect(summary.success).toBeDefined();
      expect(summary.coverage).toBeDefined();
      expect(summary.coverage.lines).toBeGreaterThan(0);
      expect(summary.coverage.functions).toBeGreaterThan(0);
      expect(summary.coverage.branches).toBeGreaterThan(0);
      expect(summary.coverage.statements).toBeGreaterThan(0);
      expect(summary.coverage.files).toBe(1);
      expect(summary.thresholds).toBeDefined();
      expect(summary.reports).toBeDefined();
      expect(summary.duration).toBeGreaterThanOrEqual(0);
      expect(summary.suiteCount).toBe(1);
    });

    it('should generate JSON report when requested', async () => {
      reporter.options.formats = ['json'];
      
      const summary = await reporter.summary();

      expect(summary.reports.json).toBeDefined();
      expect(summary.reports.json.format).toBe('json');
      expect(summary.reports.json.path).toBe(path.join('./coverage', 'coverage.json'));
      
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join('./coverage', 'coverage.json'),
        expect.stringContaining('"timestamp"'),
        'utf8'
      );
    });

    it('should generate LCOV report when requested', async () => {
      reporter.options.formats = ['lcov'];
      
      const summary = await reporter.summary();

      expect(summary.reports.lcov).toBeDefined();
      expect(summary.reports.lcov.format).toBe('lcov');
      expect(summary.reports.lcov.path).toBe(path.join('./coverage', 'lcov.info'));
      
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join('./coverage', 'lcov.info'),
        expect.stringContaining('SF:src/file1.js'),
        'utf8'
      );
    });

    it('should generate HTML report when requested', async () => {
      reporter.options.formats = ['html'];
      
      const summary = await reporter.summary();

      expect(summary.reports.html).toBeDefined();
      expect(summary.reports.html.format).toBe('html');
      expect(summary.reports.html.path).toBe(path.join('./coverage', 'coverage.html'));
      
      expect(mockWriteFile).toHaveBeenCalledWith(
        path.join('./coverage', 'coverage.html'),
        expect.stringContaining('<!DOCTYPE html>'),
        'utf8'
      );
    });

    it('should check coverage thresholds', async () => {
      // Set high thresholds that will fail
      reporter.options.threshold = {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95
      };
      
      const summary = await reporter.summary();

      expect(summary.success).toBe(false);
      expect(summary.thresholds.passed).toBe(false);
      expect(summary.thresholds.failures.length).toBeGreaterThan(0);
      
      const failure = summary.thresholds.failures[0];
      expect(failure.metric).toBeDefined();
      expect(failure.threshold).toBeDefined();
      expect(failure.actual).toBeDefined();
      expect(failure.message).toContain('is below threshold');
    });

    it('should pass thresholds when coverage is sufficient', async () => {
      // Set low thresholds that will pass
      reporter.options.threshold = {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50
      };
      
      const summary = await reporter.summary();

      expect(summary.success).toBe(true);
      expect(summary.thresholds.passed).toBe(true);
      expect(summary.thresholds.failures).toEqual([]);
    });

    it('should include uncovered lines when enabled', async () => {
      reporter.options.includeUncovered = true;
      
      const summary = await reporter.summary();

      expect(summary.coverage.uncoveredLines).toBeDefined();
      expect(Array.isArray(summary.coverage.uncoveredLines)).toBe(true);
    });

    it('should not include uncovered lines when disabled', async () => {
      reporter.options.includeUncovered = false;
      
      const summary = await reporter.summary();

      expect(summary.coverage.uncoveredLines).toBeUndefined();
    });
  });

  describe('coverage calculation', () => {
    it('should handle empty coverage data', () => {
      const coverage = reporter._calculateAggregatedCoverage();
      
      expect(coverage.lines).toBe(0);
      expect(coverage.functions).toBe(0);
      expect(coverage.branches).toBe(0);
      expect(coverage.statements).toBe(0);
      expect(coverage.files).toBe(0);
    });

    it('should calculate file metrics correctly', () => {
      const fileCoverage = {
        s: { '1': 5, '2': 3, '3': 0 }, // 2 covered, 1 uncovered
        f: { '1': 2, '2': 0 }, // 1 covered, 1 uncovered
        b: { '1': [2, 1], '2': [0, 3] }, // 3 covered, 1 uncovered
        statementMap: {
          '1': { start: { line: 1 }, end: { line: 1 } },
          '2': { start: { line: 2 }, end: { line: 2 } },
          '3': { start: { line: 3 }, end: { line: 3 } }
        },
        fnMap: {
          '1': { name: 'func1', loc: { start: { line: 1 } } },
          '2': { name: 'func2', loc: { start: { line: 5 } } }
        },
        branchMap: {
          '1': { loc: { start: { line: 2 } } },
          '2': { loc: { start: { line: 4 } } }
        }
      };

      const metrics = reporter._calculateFileMetrics(fileCoverage, 'test.js');

      expect(metrics.statements.total).toBe(3);
      expect(metrics.statements.covered).toBe(2);
      expect(metrics.functions.total).toBe(2);
      expect(metrics.functions.covered).toBe(1);
      expect(metrics.branches.total).toBe(4);
      expect(metrics.branches.covered).toBe(3);
      expect(metrics.lines.total).toBe(3);
      expect(metrics.lines.covered).toBe(2);
    });
  });

  describe('report generation', () => {
    beforeEach(async () => {
      await reporter.start();
      reporter.coverageData = {
        'src/file1.js': {
          s: { '1': 5, '2': 0 },
          f: { '1': 2 },
          b: { '1': [2, 1] },
          statementMap: {
            '1': { start: { line: 1 }, end: { line: 1 } },
            '2': { start: { line: 2 }, end: { line: 2 } }
          },
          fnMap: {
            '1': { name: 'testFunc', loc: { start: { line: 1 } } }
          },
          branchMap: {
            '1': { loc: { start: { line: 2 } } }
          }
        }
      };
    });

    it('should generate valid JSON report structure', async () => {
      await reporter._generateJSONReport({ lines: 50, functions: 100 });

      const jsonContent = JSON.parse(mockWriteFile.mock.calls[0][1]);
      
      expect(jsonContent.timestamp).toBeDefined();
      expect(jsonContent.coverage).toBeDefined();
      expect(jsonContent.files).toBeDefined();
      expect(jsonContent.summary).toBeDefined();
      expect(jsonContent.summary.files).toBe(1);
    });

    it('should generate valid LCOV report format', async () => {
      await reporter._generateLCOVReport({ lines: 50 });

      const lcovContent = mockWriteFile.mock.calls[0][1];
      
      expect(lcovContent).toContain('SF:src/file1.js');
      expect(lcovContent).toContain('FN:1,testFunc');
      expect(lcovContent).toContain('FNDA:2,testFunc');
      expect(lcovContent).toContain('DA:1,5');
      expect(lcovContent).toContain('DA:2,0');
      expect(lcovContent).toContain('end_of_record');
    });

    it('should generate valid HTML report structure', async () => {
      await reporter._generateHTMLReport({ 
        lines: 75, 
        functions: 80, 
        branches: 70, 
        statements: 85,
        files: 1 
      });

      const htmlContent = mockWriteFile.mock.calls[0][1];
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>Test Coverage Report</title>');
      expect(htmlContent).toContain('Total Files: 1');
      expect(htmlContent).toContain('75%');
      expect(htmlContent).toContain('80%');
      expect(htmlContent).toContain('70%');
      expect(htmlContent).toContain('85%');
    });
  });

  describe('error, warn, info methods', () => {
    it('should log error messages to console', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      reporter.error('Test error', new Error('Something went wrong'));
      
      expect(consoleSpy).toHaveBeenCalledWith('Coverage Reporter Error: Test error - Something went wrong');
      consoleSpy.mockRestore();
    });

    it('should log warning messages to console', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      reporter.warn('Test warning');
      
      expect(consoleSpy).toHaveBeenCalledWith('Coverage Reporter Warning: Test warning');
      consoleSpy.mockRestore();
    });

    it('should log info messages to console', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      reporter.info('Test info');
      
      expect(consoleSpy).toHaveBeenCalledWith('Coverage Reporter Info: Test info');
      consoleSpy.mockRestore();
    });
  });

  describe('coverage merging', () => {
    it('should merge file coverage correctly', () => {
      const existing = {
        s: { '1': 2, '2': 1 },
        f: { '1': 1 },
        b: { '1': [1, 0] },
        suites: ['suite1']
      };

      const newCoverage = {
        s: { '1': 3, '2': 2 },
        f: { '1': 2 },
        b: { '1': [2, 1] }
      };

      const merged = reporter._mergeFileCoverage(existing, newCoverage);

      expect(merged.s['1']).toBe(5); // 2 + 3
      expect(merged.s['2']).toBe(3); // 1 + 2
      expect(merged.f['1']).toBe(3); // 1 + 2
      expect(merged.b['1']).toEqual([3, 1]); // [1+2, 0+1]
    });
  });
});