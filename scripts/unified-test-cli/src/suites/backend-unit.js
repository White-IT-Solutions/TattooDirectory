/**
 * BackendUnitSuite - Backend unit test suite implementation
 * 
 * Executes Jest unit tests for Lambda handlers, services, and utilities
 * in the backend workspace with coverage collection and result parsing.
 */

import { BaseSuite } from './base-suite.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export class BackendUnitSuite extends BaseSuite {
  constructor(config) {
    super(config);
    this.jestConfigPath = null;
    this.coverageThreshold = {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    };
  }

  /**
   * Custom validation for backend unit tests
   * @returns {Promise<boolean>} True if validation passes
   */
  async customValidation() {
    try {
      // Check if backend workspace exists
      const backendPath = path.join(process.cwd(), this.workspace);
      await fs.access(backendPath);

      // Check for package.json with Jest configuration
      const packageJsonPath = path.join(backendPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      if (!packageJson.devDependencies?.jest && !packageJson.dependencies?.jest) {
        this.logger.error('Jest is not installed in backend workspace');
        return false;
      }

      // Check for test files
      const hasTests = await this.checkForTestFiles(backendPath);
      if (!hasTests) {
        this.logger.warn('No test files found in backend workspace');
      }

      // Check for Jest configuration
      if (packageJson.jest) {
        this.jestConfigPath = packageJsonPath;
      } else {
        // Look for separate Jest config files
        const configFiles = ['jest.config.js', 'jest.config.json', 'jest.config.mjs'];
        for (const configFile of configFiles) {
          const configPath = path.join(backendPath, configFile);
          try {
            await fs.access(configPath);
            this.jestConfigPath = configPath;
            break;
          } catch (error) {
            // Continue looking
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Backend unit suite validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for test files in the backend workspace
   * @param {string} backendPath - Path to backend workspace
   * @returns {Promise<boolean>} True if test files are found
   */
  async checkForTestFiles(backendPath) {
    try {
      const testPatterns = [
        '**/__tests__/**/*.test.js',
        '**/*.test.js',
        '**/__tests__/**/*.spec.js',
        '**/*.spec.js'
      ];

      // Check common test directories
      const testDirs = ['src/__tests__', '__tests__', 'tests'];
      for (const testDir of testDirs) {
        const testDirPath = path.join(backendPath, testDir);
        try {
          const stats = await fs.stat(testDirPath);
          if (stats.isDirectory()) {
            return true;
          }
        } catch (error) {
          // Directory doesn't exist, continue
        }
      }

      // Check for test files in src directory
      const srcPath = path.join(backendPath, 'src');
      try {
        await fs.access(srcPath);
        const hasTestFiles = await this.findTestFilesRecursively(srcPath);
        return hasTestFiles;
      } catch (error) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Recursively find test files in a directory
   * @param {string} dirPath - Directory to search
   * @returns {Promise<boolean>} True if test files are found
   */
  async findTestFilesRecursively(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name === '__tests__' || entry.name === 'tests') {
            return true;
          }
          const subDirPath = path.join(dirPath, entry.name);
          const hasTests = await this.findTestFilesRecursively(subDirPath);
          if (hasTests) {
            return true;
          }
        } else if (entry.isFile()) {
          if (entry.name.includes('.test.') || entry.name.includes('.spec.')) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Prepare environment for backend unit tests
   * @returns {Promise<void>}
   */
  async prepare() {
    await super.prepare();
    
    // Set environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    
    this.logger.info('Backend unit test environment prepared');
  }

  /**
   * Transform command arguments for Jest execution
   * @param {Object} options - Execution options
   * @returns {Array} Array of command arguments
   */
  transformCommandArgs(options = {}) {
    const args = ['run', 'test'];
    
    // Add coverage if requested
    if (options.coverage && this.supportsCoverage) {
      args.push('--coverage');
    }

    // Add CI mode flags
    if (options.ci) {
      args.push('--ci');
      args.push('--watchAll=false');
      args.push('--passWithNoTests');
    }

    // Add verbose output for debugging
    if (options.verbose) {
      args.push('--verbose');
    }

    // Add specific test pattern if provided
    if (options.testPattern) {
      args.push('--testNamePattern');
      args.push(options.testPattern);
    }

    // Add specific test file if provided
    if (options.testFile) {
      args.push(options.testFile);
    }

    // Add max workers for parallel execution
    if (options.maxWorkers) {
      args.push('--maxWorkers');
      args.push(options.maxWorkers.toString());
    }

    return ['npm', ...args];
  }

  /**
   * Parse Jest test results from output
   * @param {string} stdout - Command stdout
   * @param {string} stderr - Command stderr
   * @param {number} exitCode - Command exit code
   * @returns {Object} Parsed test results
   */
  parseResults(stdout, stderr, exitCode) {
    const result = {
      exitCode,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
      coverage: null,
      errors: [],
      duration: 0
    };

    try {
      // Parse test summary from Jest output
      const testSummaryMatch = stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
      if (testSummaryMatch) {
        result.tests.failed = parseInt(testSummaryMatch[1], 10);
        result.tests.passed = parseInt(testSummaryMatch[2], 10);
        result.tests.total = parseInt(testSummaryMatch[3], 10);
      } else {
        // Try alternative format
        const passedMatch = stdout.match(/(\d+)\s+passing/);
        const failedMatch = stdout.match(/(\d+)\s+failing/);
        const skippedMatch = stdout.match(/(\d+)\s+pending/);
        
        if (passedMatch) result.tests.passed = parseInt(passedMatch[1], 10);
        if (failedMatch) result.tests.failed = parseInt(failedMatch[1], 10);
        if (skippedMatch) result.tests.skipped = parseInt(skippedMatch[1], 10);
        
        result.tests.total = result.tests.passed + result.tests.failed + result.tests.skipped;
      }

      // Parse test duration
      const durationMatch = stdout.match(/Time:\s+([\d.]+)\s*s/);
      if (durationMatch) {
        result.duration = parseFloat(durationMatch[1]) * 1000; // Convert to milliseconds
      }

      // Parse coverage information
      if (stdout.includes('Coverage')) {
        result.coverage = this.parseCoverageFromOutput(stdout);
      }

      // Parse error details
      if (exitCode !== 0) {
        result.errors = this.parseErrorsFromOutput(stdout, stderr);
      }

    } catch (error) {
      this.logger.error(`Failed to parse Jest results: ${error.message}`);
      result.errors.push({
        message: 'Failed to parse test results',
        details: error.message
      });
    }

    return result;
  }

  /**
   * Parse coverage information from Jest output
   * @param {string} output - Jest stdout output
   * @returns {Object|null} Coverage information
   */
  parseCoverageFromOutput(output) {
    try {
      // Look for coverage summary table
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        return {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
      }

      // Try to find individual coverage metrics
      const statementsMatch = output.match(/Statements\s*:\s*([\d.]+)%/);
      const branchesMatch = output.match(/Branches\s*:\s*([\d.]+)%/);
      const functionsMatch = output.match(/Functions\s*:\s*([\d.]+)%/);
      const linesMatch = output.match(/Lines\s*:\s*([\d.]+)%/);

      if (statementsMatch || branchesMatch || functionsMatch || linesMatch) {
        return {
          statements: statementsMatch ? parseFloat(statementsMatch[1]) : 0,
          branches: branchesMatch ? parseFloat(branchesMatch[1]) : 0,
          functions: functionsMatch ? parseFloat(functionsMatch[1]) : 0,
          lines: linesMatch ? parseFloat(linesMatch[1]) : 0
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to parse coverage: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse error details from Jest output
   * @param {string} stdout - Jest stdout
   * @param {string} stderr - Jest stderr
   * @returns {Array} Array of error objects
   */
  parseErrorsFromOutput(stdout, stderr) {
    const errors = [];

    try {
      // Parse failed test details from stdout
      const failedTestMatches = stdout.matchAll(/● (.+?)\n\n\s+(.+?)\n/g);
      for (const match of failedTestMatches) {
        errors.push({
          test: match[1].trim(),
          message: match[2].trim(),
          type: 'test_failure'
        });
      }

      // Parse compilation errors from stderr
      if (stderr.includes('SyntaxError') || stderr.includes('TypeError')) {
        const errorLines = stderr.split('\n').filter(line => 
          line.includes('Error:') || line.includes('at ')
        );
        
        if (errorLines.length > 0) {
          errors.push({
            message: 'Compilation or runtime error',
            details: errorLines.join('\n'),
            type: 'compilation_error'
          });
        }
      }

      // Add generic error if no specific errors found but exit code indicates failure
      if (errors.length === 0 && stderr.trim()) {
        errors.push({
          message: 'Test execution failed',
          details: stderr.trim(),
          type: 'execution_error'
        });
      }

    } catch (error) {
      errors.push({
        message: 'Failed to parse error details',
        details: error.message,
        type: 'parsing_error'
      });
    }

    return errors;
  }

  /**
   * Get test categories that this suite covers
   * @returns {Array} Array of test categories
   */
  getTestCategories() {
    return [
      'handlers',
      'services', 
      'utilities',
      'common'
    ];
  }

  /**
   * Get coverage threshold for this suite
   * @returns {Object} Coverage threshold configuration
   */
  getCoverageThreshold() {
    return this.coverageThreshold;
  }

  /**
   * Check if coverage meets threshold requirements
   * @param {Object} coverage - Coverage results
   * @returns {boolean} True if coverage meets threshold
   */
  meetsCoverageThreshold(coverage) {
    if (!coverage) return false;

    const thresholds = this.getCoverageThreshold();
    return (
      coverage.statements >= thresholds.statements &&
      coverage.branches >= thresholds.branches &&
      coverage.functions >= thresholds.functions &&
      coverage.lines >= thresholds.lines
    );
  }

  /**
   * Get suite-specific metadata
   * @returns {Object} Extended metadata
   */
  getMetadata() {
    const baseMetadata = super.getMetadata();
    return {
      ...baseMetadata,
      testCategories: this.getTestCategories(),
      coverageThreshold: this.getCoverageThreshold(),
      jestConfigPath: this.jestConfigPath
    };
  }
}