/**
 * FrontendUnitSuite Tests
 * 
 * Tests for the frontend unit test suite implementation
 */

import { FrontendUnitSuite } from '../frontend-unit.js';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('../../utils/logger.js', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));
jest.mock('fs/promises');
jest.mock('path');

describe('FrontendUnitSuite', () => {
  let suite;
  let mockLogger;
  let mockConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock logger is already set up in the mock above
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    // Mock config
    mockConfig = {
      name: 'frontend-unit',
      displayName: 'Frontend Unit Tests',
      description: 'Jest unit tests for React components and utilities',
      type: 'unit',
      workspace: 'frontend',
      command: 'npm run test',
      requiredServices: [],
      dataScenario: null,
      timeout: 60000,
      canRunParallel: true,
      tags: ['unit', 'frontend', 'fast'],
      supportsCoverage: true
    };

    suite = new FrontendUnitSuite(mockConfig);
    // Override the logger instance with our mock
    suite.logger = mockLogger;
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(suite.name).toBe('frontend-unit');
      expect(suite.workspace).toBe('frontend');
      expect(suite.supportsCoverage).toBe(true);
      expect(suite.coverageThreshold).toEqual({
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      });
    });

    it('should set default coverage threshold', () => {
      const threshold = suite.getCoverageThreshold();
      expect(threshold.branches).toBe(80);
      expect(threshold.functions).toBe(80);
      expect(threshold.lines).toBe(80);
      expect(threshold.statements).toBe(80);
    });
  });

  describe('customValidation', () => {
    beforeEach(() => {
      // Mock path.join
      path.join.mockImplementation((...args) => args.join('/'));
      
      // Mock process.cwd
      jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
    });

    it('should validate successfully with proper setup', async () => {
      // Mock filesystem access
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'jest': '^29.7.0',
          '@testing-library/react': '^14.1.2'
        }
      }));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'component.test.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await suite.customValidation();
      
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/test/project/frontend');
    });

    it('should fail validation if Jest is not installed', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'react': '^18.0.0'
        }
      }));

      const result = await suite.customValidation();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Jest is not installed in frontend workspace');
    });

    it('should fail validation if React Testing Library is not installed', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'jest': '^29.7.0'
        }
      }));

      const result = await suite.customValidation();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('React Testing Library is not installed in frontend workspace');
    });

    it('should warn if no test files are found', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'jest': '^29.7.0',
          '@testing-library/react': '^14.1.2'
        }
      }));
      // Mock checkForTestFiles to return false
      jest.spyOn(suite, 'checkForTestFiles').mockResolvedValue(false);

      const result = await suite.customValidation();
      
      expect(result).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith('No test files found in frontend workspace');
    });

    it('should detect Jest configuration in package.json', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'jest': '^29.7.0',
          '@testing-library/react': '^14.1.2'
        },
        jest: {
          testEnvironment: 'jsdom'
        }
      }));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'component.test.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await suite.customValidation();
      
      expect(result).toBe(true);
      expect(suite.jestConfigPath).toBe('/test/project/frontend/package.json');
    });

    it('should detect separate Jest config file', async () => {
      fs.access
        .mockResolvedValueOnce() // frontend directory
        .mockResolvedValueOnce() // package.json
        .mockResolvedValueOnce(); // jest.config.js
      
      fs.readFile.mockResolvedValue(JSON.stringify({
        devDependencies: {
          'jest': '^29.7.0',
          '@testing-library/react': '^14.1.2'
        }
      }));
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'component.test.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await suite.customValidation();
      
      expect(result).toBe(true);
      expect(suite.jestConfigPath).toBe('/test/project/frontend/jest.config.js');
    });

    it('should handle validation errors gracefully', async () => {
      fs.access.mockRejectedValue(new Error('Access denied'));

      const result = await suite.customValidation();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Frontend unit suite validation failed')
      );
    });
  });

  describe('checkForTestFiles', () => {
    beforeEach(() => {
      path.join.mockImplementation((...args) => args.join('/'));
      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    it('should find test files in __tests__ directories', async () => {
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue([
        { name: 'component.test.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await suite.checkForTestFiles('/test/frontend');
      
      expect(result).toBe(true);
    });

    it('should find test files recursively', async () => {
      fs.stat
        .mockResolvedValueOnce({ isDirectory: () => true }) // src/__tests__
        .mockResolvedValueOnce({ isDirectory: () => true }); // src
      
      fs.readdir
        .mockResolvedValueOnce([
          { name: 'component.test.js', isFile: () => true, isDirectory: () => false }
        ])
        .mockResolvedValueOnce([
          { name: '__tests__', isFile: () => false, isDirectory: () => true }
        ]);

      const result = await suite.checkForTestFiles('/test/frontend');
      
      expect(result).toBe(true);
    });

    it.skip('should return false if no test files found', async () => {
      // Mock all filesystem operations to fail
      fs.stat.mockRejectedValue(new Error('Directory not found'));
      fs.access.mockRejectedValue(new Error('Directory not found'));

      const result = await suite.checkForTestFiles('/test/frontend');
      
      expect(result).toBe(false);
    });
  });

  describe('findTestFilesRecursively', () => {
    beforeEach(() => {
      path.join.mockImplementation((...args) => args.join('/'));
    });

    it('should find test files by name pattern', async () => {
      fs.readdir.mockResolvedValue([
        { name: 'component.test.js', isFile: () => true, isDirectory: () => false },
        { name: 'utils.spec.js', isFile: () => true, isDirectory: () => false },
        { name: 'regular.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await suite.findTestFilesRecursively('/test/src');
      
      expect(result).toBe(true);
    });

    it('should find __tests__ directories', async () => {
      fs.readdir.mockResolvedValue([
        { name: '__tests__', isFile: () => false, isDirectory: () => true },
        { name: 'components', isFile: () => false, isDirectory: () => true }
      ]);

      const result = await suite.findTestFilesRecursively('/test/src');
      
      expect(result).toBe(true);
    });

    it('should search recursively in subdirectories', async () => {
      fs.readdir
        .mockResolvedValueOnce([
          { name: 'components', isFile: () => false, isDirectory: () => true }
        ])
        .mockResolvedValueOnce([
          { name: 'button.test.js', isFile: () => true, isDirectory: () => false }
        ]);

      const result = await suite.findTestFilesRecursively('/test/src');
      
      expect(result).toBe(true);
    });

    it('should return false if no test files found', async () => {
      fs.readdir.mockResolvedValue([
        { name: 'regular.js', isFile: () => true, isDirectory: () => false }
      ]);

      const result = await suite.findTestFilesRecursively('/test/src');
      
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      fs.readdir.mockRejectedValue(new Error('Permission denied'));

      const result = await suite.findTestFilesRecursively('/test/src');
      
      expect(result).toBe(false);
    });
  });

  describe('prepare', () => {
    it('should set up frontend test environment', async () => {
      await suite.prepare();
      
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.NEXT_PUBLIC_API_URL).toBe('http://localhost:9000');
      expect(mockLogger.info).toHaveBeenCalledWith('Frontend unit test environment prepared');
    });
  });

  describe('transformCommandArgs', () => {
    it('should transform basic command arguments', () => {
      const args = suite.transformCommandArgs();
      
      expect(args).toEqual(['npm', 'run', 'test', '--testPathIgnorePatterns', 'tests/e2e/', 'playwright-report/', 'test-results/']);
    });

    it('should add coverage flag when requested', () => {
      const args = suite.transformCommandArgs({ coverage: true });
      
      expect(args).toContain('--coverage');
    });

    it('should add CI mode flags', () => {
      const args = suite.transformCommandArgs({ ci: true });
      
      expect(args).toContain('--ci');
      expect(args).toContain('--watchAll=false');
      expect(args).toContain('--passWithNoTests');
    });

    it('should add verbose flag', () => {
      const args = suite.transformCommandArgs({ verbose: true });
      
      expect(args).toContain('--verbose');
    });

    it('should add test pattern', () => {
      const args = suite.transformCommandArgs({ testPattern: 'Button' });
      
      expect(args).toContain('--testNamePattern');
      expect(args).toContain('Button');
    });

    it('should add specific test file', () => {
      const args = suite.transformCommandArgs({ testFile: 'src/components/Button.test.js' });
      
      expect(args).toContain('src/components/Button.test.js');
    });

    it('should add max workers', () => {
      const args = suite.transformCommandArgs({ maxWorkers: 4 });
      
      expect(args).toContain('--maxWorkers');
      expect(args).toContain('4');
    });

    it('should always exclude E2E test paths', () => {
      const args = suite.transformCommandArgs();
      
      expect(args).toContain('--testPathIgnorePatterns');
      expect(args).toContain('tests/e2e/');
      expect(args).toContain('playwright-report/');
      expect(args).toContain('test-results/');
    });
  });

  describe('parseResults', () => {
    it('should parse successful test results', () => {
      const stdout = `
        Test Suites: 1 passed, 1 total
        Tests: 0 failed, 5 passed, 5 total
        Snapshots: 0 total
        Time: 2.5 s
      `;
      
      const result = suite.parseResults(stdout, '', 0);
      
      expect(result.exitCode).toBe(0);
      expect(result.tests.passed).toBe(5);
      expect(result.tests.total).toBe(5);
      expect(result.duration).toBe(2500);
      expect(result.errors).toHaveLength(0);
    });

    it('should parse failed test results', () => {
      const stdout = `
        Tests: 2 failed, 3 passed, 5 total
        Time: 1.8 s
      `;
      
      const result = suite.parseResults(stdout, '', 1);
      
      expect(result.exitCode).toBe(1);
      expect(result.tests.failed).toBe(2);
      expect(result.tests.passed).toBe(3);
      expect(result.tests.total).toBe(5);
      expect(result.duration).toBe(1800);
    });

    it('should parse coverage information', () => {
      const stdout = `
        Tests: 5 passed, 5 total
        Coverage:
        All files        |   85.2 |   78.9 |   82.1 |   85.2 |
      `;
      
      const result = suite.parseResults(stdout, '', 0);
      
      expect(result.coverage).toEqual({
        statements: 85.2,
        branches: 78.9,
        functions: 82.1,
        lines: 85.2
      });
    });

    it('should parse individual coverage metrics', () => {
      const stdout = `
        Tests: 5 passed, 5 total
        Coverage:
        Statements: 85.2%
        Branches: 78.9%
        Functions: 82.1%
        Lines: 85.2%
      `;
      
      const result = suite.parseResults(stdout, '', 0);
      
      expect(result.coverage).toEqual({
        statements: 85.2,
        branches: 78.9,
        functions: 82.1,
        lines: 85.2
      });
    });

    it('should parse test errors', () => {
      const stdout = `
        ● Button component › should render correctly

          Expected element to be in the document
      `;
      
      const result = suite.parseResults(stdout, '', 1);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].test).toBe('Button component › should render correctly');
      expect(result.errors[0].message).toBe('Expected element to be in the document');
      expect(result.errors[0].type).toBe('test_failure');
    });

    it('should parse compilation errors', () => {
      const stderr = `
        SyntaxError: Unexpected token
        at Module._compile (internal/modules/cjs/loader.js:723:23)
      `;
      
      const result = suite.parseResults('', stderr, 1);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('compilation_error');
    });

    it('should parse module resolution errors', () => {
      const stderr = `
        Module not found: Can't resolve '@/components/Button'
      `;
      
      const result = suite.parseResults('', stderr, 1);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('module_error');
    });

    it('should handle parsing errors gracefully', () => {
      // Mock console.error to avoid noise in test output
      const originalError = console.error;
      console.error = jest.fn();
      
      // Cause a parsing error by mocking a method to throw
      jest.spyOn(suite, 'parseCoverageFromOutput').mockImplementation(() => {
        throw new Error('Parsing failed');
      });
      
      const result = suite.parseResults('Coverage: test', '', 0);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Failed to parse test results');
      
      // Restore console.error
      console.error = originalError;
    });
  });

  describe('parseCoverageFromOutput', () => {
    it('should parse coverage table format', () => {
      const output = `
        All files        |   85.2 |   78.9 |   82.1 |   85.2 |
      `;
      
      const coverage = suite.parseCoverageFromOutput(output);
      
      expect(coverage).toEqual({
        statements: 85.2,
        branches: 78.9,
        functions: 82.1,
        lines: 85.2
      });
    });

    it('should parse individual metrics format', () => {
      const output = `
        Statements: 85.2%
        Branches: 78.9%
        Functions: 82.1%
        Lines: 85.2%
      `;
      
      const coverage = suite.parseCoverageFromOutput(output);
      
      expect(coverage).toEqual({
        statements: 85.2,
        branches: 78.9,
        functions: 82.1,
        lines: 85.2
      });
    });

    it('should return null if no coverage found', () => {
      const coverage = suite.parseCoverageFromOutput('No coverage info');
      
      expect(coverage).toBeNull();
    });

    it('should handle parsing errors', () => {
      const coverage = suite.parseCoverageFromOutput('Invalid coverage format');
      
      expect(coverage).toBeNull();
    });
  });

  describe('parseErrorsFromOutput', () => {
    it('should parse test failure errors', () => {
      const stdout = `
        ● Component › should work

          Expected true but got false
      `;
      
      const errors = suite.parseErrorsFromOutput(stdout, '');
      
      expect(errors).toHaveLength(1);
      expect(errors[0].test).toBe('Component › should work');
      expect(errors[0].message).toBe('Expected true but got false');
      expect(errors[0].type).toBe('test_failure');
    });

    it('should parse compilation errors', () => {
      const stderr = 'SyntaxError: Unexpected token';
      
      const errors = suite.parseErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('compilation_error');
    });

    it('should parse module errors', () => {
      const stderr = 'Module not found: Cannot resolve module';
      
      const errors = suite.parseErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('module_error');
    });

    it('should add generic error for stderr without specific patterns', () => {
      const stderr = 'Some generic error message';
      
      const errors = suite.parseErrorsFromOutput('', stderr);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('execution_error');
    });

    it('should handle parsing errors', () => {
      // Force an error in the parsing logic
      const errors = suite.parseErrorsFromOutput(null, null);
      
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('parsing_error');
    });
  });

  describe('getTestCategories', () => {
    it('should return frontend test categories', () => {
      const categories = suite.getTestCategories();
      
      expect(categories).toEqual([
        'components',
        'hooks',
        'utilities',
        'pages',
        'design-system',
        'integration'
      ]);
    });
  });

  describe('meetsCoverageThreshold', () => {
    it('should return true when coverage meets threshold', () => {
      const coverage = {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85
      };
      
      const result = suite.meetsCoverageThreshold(coverage);
      
      expect(result).toBe(true);
    });

    it('should return false when coverage does not meet threshold', () => {
      const coverage = {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75
      };
      
      const result = suite.meetsCoverageThreshold(coverage);
      
      expect(result).toBe(false);
    });

    it('should return false for null coverage', () => {
      const result = suite.meetsCoverageThreshold(null);
      
      expect(result).toBe(false);
    });
  });

  describe('getMetadata', () => {
    it('should return extended metadata', () => {
      const metadata = suite.getMetadata();
      
      expect(metadata).toHaveProperty('testCategories');
      expect(metadata).toHaveProperty('coverageThreshold');
      expect(metadata).toHaveProperty('testingLibraries');
      expect(metadata.testingLibraries).toContain('@testing-library/react');
      expect(metadata.testingLibraries).toContain('jest-axe');
    });
  });

  describe('getTestPatterns', () => {
    it('should return frontend test patterns', () => {
      const patterns = suite.getTestPatterns();
      
      expect(patterns).toContain('src/**/__tests__/**/*.test.{js,jsx,ts,tsx}');
      expect(patterns).toContain('src/**/*.test.{js,jsx,ts,tsx}');
      expect(patterns).toContain('!tests/e2e/**/*');
    });
  });

  describe('getTestEnvironment', () => {
    it('should return jsdom test environment configuration', () => {
      const env = suite.getTestEnvironment();
      
      expect(env.testEnvironment).toBe('jsdom');
      expect(env.setupFilesAfterEnv).toContain('<rootDir>/jest.setup.js');
      expect(env.moduleNameMapper['^@/(.*)$']).toBe('<rootDir>/src/$1');
    });
  });

  describe('validateReactTestingLibrary', () => {
    beforeEach(() => {
      path.join.mockImplementation((...args) => args.join('/'));
      jest.spyOn(process, 'cwd').mockReturnValue('/test/project');
    });

    it('should validate RTL setup successfully', async () => {
      const setupContent = `
        import '@testing-library/jest-dom';
        import { toHaveNoViolations } from 'jest-axe';
        expect.extend(toHaveNoViolations);
      `;
      
      fs.readFile.mockResolvedValue(setupContent);
      
      const result = await suite.validateReactTestingLibrary();
      
      expect(result).toBe(true);
    });

    it('should warn if jest-dom is not configured', async () => {
      const setupContent = `
        import { toHaveNoViolations } from 'jest-axe';
      `;
      
      fs.readFile.mockResolvedValue(setupContent);
      
      const result = await suite.validateReactTestingLibrary();
      
      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('jest-dom matchers not found in Jest setup');
    });

    it('should warn if jest-axe is not configured', async () => {
      const setupContent = `
        import '@testing-library/jest-dom';
      `;
      
      fs.readFile.mockResolvedValue(setupContent);
      
      const result = await suite.validateReactTestingLibrary();
      
      expect(result).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith('jest-axe accessibility testing not configured');
    });

    it('should handle file read errors', async () => {
      fs.readFile.mockRejectedValue(new Error('File not found'));
      
      const result = await suite.validateReactTestingLibrary();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to validate React Testing Library setup')
      );
    });
  });
});