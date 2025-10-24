#!/usr/bin/env node

/**
 * Test runner for comprehensive CLI test coverage
 * 
 * This script runs all CLI tests in the correct order and generates
 * a comprehensive report of test coverage and results.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';


// Get current directory for test files
const __dirname = process.cwd();

// Test configuration
const TEST_CONFIG = {
  testFiles: [
    'integration.test.js',
    'e2e.test.js',
    'performance.test.js',
    'error-scenarios.test.js',
    'comprehensive.test.js'
  ],
  outputDir: path.resolve(__dirname, 'test-results/cli-coverage'),
  timeout: 300000, // 5 minutes per test file
  jestConfig: {
    testTimeout: 120000, // 2 minutes per individual test
    maxWorkers: 1, // Run tests sequentially to avoid conflicts
    verbose: true,
    collectCoverage: true,
    coverageDirectory: path.resolve(__dirname, 'coverage/cli'),
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    testMatch: ['**/__tests__/cli/*.test.js'],
    setupFilesAfterEnv: [],
    testEnvironment: 'node'
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = colors.reset) => {
  console.log(`${color}${message}${colors.reset}`);
};

const logSection = (title) => {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${title}`, colors.cyan + colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
};

const logSubsection = (title) => {
  log(`\n${'-'.repeat(40)}`, colors.blue);
  log(`${title}`, colors.blue + colors.bright);
  log(`${'-'.repeat(40)}`, colors.blue);
};

// Test runner class
class CLITestRunner {
  constructor() {
    this.results = {
      totalFiles: 0,
      passedFiles: 0,
      failedFiles: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalTime: 0,
      coverage: null,
      fileResults: []
    };
  }

  async setupEnvironment() {
    logSection('Setting up test environment');
    
    try {
      await fs.mkdir(TEST_CONFIG.outputDir, { recursive: true });
      log('✓ Created output directory', colors.green);
    } catch (error) {
      log(`✗ Failed to create output directory: ${error.message}`, colors.red);
      throw error;
    }

    // Create Jest configuration file
    const jestConfigPath = path.join(__dirname, 'jest.config.js');
    const jestConfigContent = `
export default ${JSON.stringify(TEST_CONFIG.jestConfig, null, 2)};
`;
    
    try {
      await fs.writeFile(jestConfigPath, jestConfigContent);
      log('✓ Created Jest configuration', colors.green);
    } catch (error) {
      log(`✗ Failed to create Jest configuration: ${error.message}`, colors.red);
      throw error;
    }

    return jestConfigPath;
  }

  async runTestFile(testFile, jestConfigPath) {
    logSubsection(`Running ${testFile}`);
    
    const startTime = Date.now();
    const testPath = path.join(__dirname, testFile);
    
    return new Promise((resolve) => {
      const jest = spawn('npx', ['jest', testPath, '--config', jestConfigPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          NODE_ENV: 'test',
          FORCE_COLOR: '1' // Enable colors in Jest output
        },
        cwd: path.resolve(__dirname, '../../..')
      });

      let stdout = '';
      let stderr = '';

      jest.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output); // Real-time output
      });

      jest.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output); // Real-time output
      });

      const timeout = setTimeout(() => {
        jest.kill('SIGKILL');
        log(`✗ Test file ${testFile} timed out`, colors.red);
        resolve({
          file: testFile,
          success: false,
          code: -1,
          stdout,
          stderr,
          duration: Date.now() - startTime,
          timedOut: true
        });
      }, TEST_CONFIG.timeout);

      jest.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        const success = code === 0;
        
        log(`${success ? '✓' : '✗'} ${testFile} completed in ${duration}ms`, 
            success ? colors.green : colors.red);
        
        resolve({
          file: testFile,
          success,
          code,
          stdout,
          stderr,
          duration,
          timedOut: false
        });
      });

      jest.on('error', (error) => {
        clearTimeout(timeout);
        log(`✗ Failed to run ${testFile}: ${error.message}`, colors.red);
        resolve({
          file: testFile,
          success: false,
          code: -1,
          stdout,
          stderr: error.message,
          duration: Date.now() - startTime,
          error: error.message
        });
      });
    });
  }

  async runAllTests() {
    logSection('Running CLI Test Suite');
    
    const jestConfigPath = await this.setupEnvironment();
    
    this.results.totalFiles = TEST_CONFIG.testFiles.length;
    const overallStartTime = Date.now();

    for (const testFile of TEST_CONFIG.testFiles) {
      const result = await this.runTestFile(testFile, jestConfigPath);
      this.results.fileResults.push(result);
      
      if (result.success) {
        this.results.passedFiles++;
      } else {
        this.results.failedFiles++;
      }
      
      this.results.totalTime += result.duration;
      
      // Parse Jest output for test counts (basic parsing)
      if (result.stdout) {
        const testMatch = result.stdout.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        if (testMatch) {
          this.results.failedTests += parseInt(testMatch[1]);
          this.results.passedTests += parseInt(testMatch[2]);
          this.results.totalTests += parseInt(testMatch[3]);
        } else {
          // Try alternative format
          const passMatch = result.stdout.match(/(\d+)\s+passing/);
          const failMatch = result.stdout.match(/(\d+)\s+failing/);
          
          if (passMatch) this.results.passedTests += parseInt(passMatch[1]);
          if (failMatch) this.results.failedTests += parseInt(failMatch[1]);
          if (passMatch || failMatch) {
            this.results.totalTests += (parseInt(passMatch?.[1] || 0) + parseInt(failMatch?.[1] || 0));
          }
        }
      }
    }

    this.results.totalTime = Date.now() - overallStartTime;
    
    // Clean up Jest config
    try {
      await fs.unlink(jestConfigPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  async generateReport() {
    logSection('Generating Test Report');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.results.totalFiles,
        passedFiles: this.results.passedFiles,
        failedFiles: this.results.failedFiles,
        fileSuccessRate: this.results.totalFiles > 0 
          ? (this.results.passedFiles / this.results.totalFiles) * 100 
          : 0,
        totalTests: this.results.totalTests,
        passedTests: this.results.passedTests,
        failedTests: this.results.failedTests,
        skippedTests: this.results.skippedTests,
        testSuccessRate: this.results.totalTests > 0 
          ? (this.results.passedTests / this.results.totalTests) * 100 
          : 0,
        totalTime: this.results.totalTime,
        averageTimePerFile: this.results.totalFiles > 0 
          ? this.results.totalTime / this.results.totalFiles 
          : 0
      },
      fileResults: this.results.fileResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      },
      configuration: TEST_CONFIG
    };

    const reportPath = path.join(TEST_CONFIG.outputDir, 'cli-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    log(`✓ Test report saved to: ${reportPath}`, colors.green);
    return { report, reportPath };
  }

  printSummary() {
    logSection('Test Summary');
    
    const { summary } = this.results;
    
    log(`Test Files:`, colors.bright);
    log(`  Total: ${summary.totalFiles || this.results.totalFiles}`);
    log(`  Passed: ${summary.passedFiles || this.results.passedFiles}`, colors.green);
    log(`  Failed: ${summary.failedFiles || this.results.failedFiles}`, 
        (summary.failedFiles || this.results.failedFiles) > 0 ? colors.red : colors.green);
    log(`  Success Rate: ${(summary.fileSuccessRate || 0).toFixed(2)}%`);
    
    if (this.results.totalTests > 0) {
      log(`\nIndividual Tests:`, colors.bright);
      log(`  Total: ${this.results.totalTests}`);
      log(`  Passed: ${this.results.passedTests}`, colors.green);
      log(`  Failed: ${this.results.failedTests}`, 
          this.results.failedTests > 0 ? colors.red : colors.green);
      log(`  Success Rate: ${((this.results.passedTests / this.results.totalTests) * 100).toFixed(2)}%`);
    }
    
    log(`\nTiming:`, colors.bright);
    log(`  Total Time: ${this.results.totalTime}ms`);
    log(`  Average per File: ${(this.results.totalTime / this.results.totalFiles).toFixed(2)}ms`);
    
    if (this.results.failedFiles > 0) {
      log(`\nFailed Files:`, colors.red + colors.bright);
      this.results.fileResults
        .filter(r => !r.success)
        .forEach(result => {
          log(`  ✗ ${result.file}: ${result.error || 'Test failures'}`, colors.red);
        });
    }
    
    const overallSuccess = this.results.failedFiles === 0;
    log(`\nOverall Result: ${overallSuccess ? 'PASSED' : 'FAILED'}`, 
        overallSuccess ? colors.green + colors.bright : colors.red + colors.bright);
  }
}

// Main execution
async function main() {
  const runner = new CLITestRunner();
  
  try {
    log('Starting CLI Test Coverage Suite', colors.magenta + colors.bright);
    log(`Node.js Version: ${process.version}`);
    log(`Platform: ${process.platform} ${process.arch}`);
    log(`Working Directory: ${process.cwd()}`);
    
    await runner.runAllTests();
    await runner.generateReport();
    runner.printSummary();
    
    // Exit with appropriate code
    process.exit(runner.results.failedFiles > 0 ? 1 : 0);
    
  } catch (error) {
    log(`\nFatal Error: ${error.message}`, colors.red + colors.bright);
    log(error.stack, colors.red);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\nReceived SIGINT, shutting down gracefully...', colors.yellow);
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('\nReceived SIGTERM, shutting down gracefully...', colors.yellow);
  process.exit(143);
});

// Run if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('run-all-tests.js')) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { CLITestRunner, TEST_CONFIG };

// Add a simple test to satisfy Jest requirements
import { describe, it, expect } from '@jest/globals';

describe('CLI Test Runner', () => {
  it('should export CLITestRunner class', () => {
    expect(CLITestRunner).toBeDefined();
    expect(typeof CLITestRunner).toBe('function');
  });

  it('should export TEST_CONFIG object', () => {
    expect(TEST_CONFIG).toBeDefined();
    expect(typeof TEST_CONFIG).toBe('object');
    expect(TEST_CONFIG.testFiles).toBeDefined();
    expect(Array.isArray(TEST_CONFIG.testFiles)).toBe(true);
  });
});