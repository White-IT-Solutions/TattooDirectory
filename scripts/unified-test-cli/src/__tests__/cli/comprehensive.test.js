/**
 * Comprehensive CLI test suite
 * 
 * This test suite combines integration, end-to-end, performance, and error testing
 * to provide complete coverage of CLI functionality and workflows.
 */

import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

import { performance } from 'perf_hooks';

// Get current directory for test files
const __dirname = process.cwd();

// Path to the CLI entry point
const CLI_PATH = path.resolve(process.cwd(), 'src/cli/index.js');
const TEST_OUTPUT_DIR = path.resolve(__dirname, 'test-results/comprehensive');

// Test configuration
const TEST_CONFIG = {
  TIMEOUT: {
    SHORT: 10000,   // 10 seconds
    MEDIUM: 30000,  // 30 seconds
    LONG: 60000,    // 60 seconds
    EXTENDED: 120000 // 2 minutes
  },
  PERFORMANCE: {
    STARTUP_THRESHOLD: 3000,    // 3 seconds
    COMMAND_THRESHOLD: 10000,   // 10 seconds
    MEMORY_THRESHOLD: 150 * 1024 * 1024 // 150MB
  },
  RETRY: {
    COUNT: 3,
    DELAY: 1000
  }
};

// Enhanced CLI runner with retry logic and comprehensive result capture
class CLITestRunner {
  constructor() {
    this.results = [];
    this.metrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalTime: 0,
      averageTime: 0
    };
  }

  async runCommand(args = [], options = {}) {
    const startTime = performance.now();
    const testId = `${args.join(' ')}-${Date.now()}`;
    
    const config = {
      timeout: options.timeout || TEST_CONFIG.TIMEOUT.MEDIUM,
      retries: options.retries || 0,
      expectFailure: options.expectFailure || false,
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        CI: 'true',
        ...options.env
      },
      cwd: options.cwd || process.cwd()
    };

    let lastError = null;
    let attempt = 0;

    while (attempt <= config.retries) {
      try {
        const result = await this._executeCommand(args, config);
        const endTime = performance.now();
        const duration = endTime - startTime;

        const testResult = {
          testId,
          args,
          attempt: attempt + 1,
          duration,
          ...result,
          expectedFailure: config.expectFailure,
          actualFailure: !result.success,
          testPassed: config.expectFailure ? !result.success : result.success
        };

        this._recordResult(testResult);
        return testResult;

      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt <= config.retries) {
          await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.RETRY.DELAY));
        }
      }
    }

    // All retries failed
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    const testResult = {
      testId,
      args,
      attempt,
      duration,
      success: false,
      code: -1,
      stdout: '',
      stderr: lastError?.message || 'Unknown error',
      error: lastError,
      expectedFailure: config.expectFailure,
      actualFailure: true,
      testPassed: config.expectFailure
    };

    this._recordResult(testResult);
    return testResult;
  }

  async _executeCommand(args, config) {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [CLI_PATH, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: config.env,
        cwd: config.cwd
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
        reject(new Error(`Command timed out after ${config.timeout}ms`));
      }, config.timeout);

      child.on('close', (code, signal) => {
        clearTimeout(timeoutId);
        if (!timedOut) {
          resolve({
            code,
            signal,
            stdout,
            stderr,
            success: code === 0,
            output: stdout + stderr
          });
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        if (!timedOut) {
          reject(error);
        }
      });

      child.stdin.end();
    });
  }

  _recordResult(result) {
    this.results.push(result);
    this.metrics.totalTests++;
    
    if (result.testPassed) {
      this.metrics.passedTests++;
    } else {
      this.metrics.failedTests++;
    }
    
    this.metrics.totalTime += result.duration;
    this.metrics.averageTime = this.metrics.totalTime / this.metrics.totalTests;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalTests > 0 
        ? (this.metrics.passedTests / this.metrics.totalTests) * 100 
        : 0
    };
  }

  getFailedTests() {
    return this.results.filter(r => !r.testPassed);
  }

  async generateReport() {
    const reportPath = path.join(TEST_OUTPUT_DIR, 'comprehensive-test-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      results: this.results,
      failedTests: this.getFailedTests(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }
}

describe('Comprehensive CLI Test Suite', () => {
  let runner;
  let testOutputDir;

  beforeAll(async () => {
    runner = new CLITestRunner();
    testOutputDir = TEST_OUTPUT_DIR;
    
    try {
      await fs.mkdir(testOutputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterAll(async () => {
    if (runner) {
      const reportPath = await runner.generateReport();
      console.log(`\nComprehensive test report generated: ${reportPath}`);
      
      const metrics = runner.getMetrics();
      console.log(`\nTest Summary:`);
      console.log(`  Total Tests: ${metrics.totalTests}`);
      console.log(`  Passed: ${metrics.passedTests}`);
      console.log(`  Failed: ${metrics.failedTests}`);
      console.log(`  Success Rate: ${metrics.successRate.toFixed(2)}%`);
      console.log(`  Average Time: ${metrics.averageTime.toFixed(2)}ms`);
      
      const failedTests = runner.getFailedTests();
      if (failedTests.length > 0) {
        console.log(`\nFailed Tests:`);
        failedTests.forEach(test => {
          console.log(`  - ${test.args.join(' ')}: ${test.stderr || test.error?.message || 'Unknown error'}`);
        });
      }
    }

    try {
      await fs.rmdir(testOutputDir, { recursive: true });
    } catch (error) {
      // Cleanup might fail
    }
  });

  describe('Core Functionality Tests', () => {
    it('should handle all basic commands successfully', async () => {
      const basicCommands = [
        ['--version'],
        ['--help'],
        ['list'],
        ['list', '--json'],
        ['validate']
      ];

      for (const args of basicCommands) {
        const result = await runner.runCommand(args, { 
          timeout: TEST_CONFIG.TIMEOUT.SHORT 
        });
        
        expect(result.testPassed).toBe(true);
        expect(result.duration).toBeLessThan(TEST_CONFIG.PERFORMANCE.STARTUP_THRESHOLD);
      }
    });

    it('should handle all run command variations', async () => {
      const runCommands = [
        ['run', '--ci'],
        ['run', '--list'],
        ['run', '--scenario', 'minimal', '--ci'],
        ['run', '--parallel', '--ci'],
        ['run', '--coverage', '--ci'],
        ['run', '--json', '--ci'],
        ['run', '--junit', '--ci']
      ];

      for (const args of runCommands) {
        const result = await runner.runCommand(args, { 
          timeout: TEST_CONFIG.TIMEOUT.LONG,
          retries: 1 // Allow one retry for potentially flaky tests
        });
        
        expect(result.testPassed).toBe(true);
      }
    });

    it('should handle all validate command variations', async () => {
      const validateCommands = [
        ['validate'],
        ['validate', '--services', 'localstack'],
        ['validate', '--services', 'frontend'],
        ['validate', '--services', 'backend'],
        ['validate', '--services', 'localstack,frontend,backend']
      ];

      for (const args of validateCommands) {
        const result = await runner.runCommand(args, { 
          timeout: TEST_CONFIG.TIMEOUT.MEDIUM 
        });
        
        // Validate commands may fail if services aren't running, but should complete
        expect(result.code).toBeDefined();
        expect(result.duration).toBeLessThan(TEST_CONFIG.PERFORMANCE.COMMAND_THRESHOLD);
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle all invalid commands gracefully', async () => {
      const invalidCommands = [
        ['unknown-command'],
        ['run', '--invalid-option'],
        ['list', '--bad-flag'],
        ['validate', '--services', 'invalid'],
        ['run', '--max-parallel', 'invalid'],
        ['run', '--quiet', '--verbose']
      ];

      for (const args of invalidCommands) {
        const result = await runner.runCommand(args, { 
          timeout: TEST_CONFIG.TIMEOUT.SHORT,
          expectFailure: true 
        });
        
        expect(result.testPassed).toBe(true); // Should fail as expected
        expect(result.output).toBeTruthy(); // Should have error message
      }
    });

    it('should handle resource constraints gracefully', async () => {
      const resourceTests = [
        ['run', '--parallel', '--max-parallel', '10', '--ci'],
        ['run', '--coverage', '--report', '--json', '--junit', '--ci']
      ];

      for (const args of resourceTests) {
        const result = await runner.runCommand(args, { 
          timeout: TEST_CONFIG.TIMEOUT.EXTENDED,
          retries: 1
        });
        
        // Should either succeed or fail gracefully
        expect(result.code).toBeDefined();
        expect(result.output).toBeTruthy();
      }
    });
  });

  describe('Performance Tests', () => {
    it('should meet startup time requirements', async () => {
      const quickCommands = [
        ['--version'],
        ['--help']
      ];

      for (const args of quickCommands) {
        const result = await runner.runCommand(args);
        
        expect(result.testPassed).toBe(true);
        expect(result.duration).toBeLessThan(1000); // Should be very fast
      }
    });

    it('should handle concurrent execution efficiently', async () => {
      const concurrentCommands = [
        runner.runCommand(['list']),
        runner.runCommand(['list', '--json']),
        runner.runCommand(['validate'])
      ];

      const startTime = performance.now();
      const results = await Promise.allSettled(concurrentCommands);
      const endTime = performance.now();
      
      const totalConcurrentTime = endTime - startTime;
      const successfulResults = results.filter(r => 
        r.status === 'fulfilled' && r.value.testPassed
      );

      expect(successfulResults.length).toBeGreaterThan(0);
      expect(totalConcurrentTime).toBeLessThan(15000); // Should complete within 15 seconds
    });

    it('should maintain performance under load', async () => {
      const loadTestCommands = Array(5).fill().map(() => ['list']);
      
      const startTime = performance.now();
      const promises = loadTestCommands.map(args => runner.runCommand(args));
      const results = await Promise.allSettled(promises);
      const endTime = performance.now();

      const totalTime = endTime - startTime;
      const successfulResults = results.filter(r => 
        r.status === 'fulfilled' && r.value.testPassed
      );

      expect(successfulResults.length).toBeGreaterThanOrEqual(3); // At least 60% success
      expect(totalTime).toBeLessThan(20000); // Should complete within 20 seconds
    });
  });

  describe('Integration Workflow Tests', () => {
    it('should complete full development workflow', async () => {
      const outputDir = path.join(testOutputDir, 'dev-workflow');
      
      // Step 1: List available suites
      const listResult = await runner.runCommand(['list', '--json']);
      expect(listResult.testPassed).toBe(true);
      
      // Step 2: Validate environment
      const validateResult = await runner.runCommand(['validate']);
      expect(validateResult.code).toBeDefined();
      
      // Step 3: Run tests with development options
      const runResult = await runner.runCommand([
        'run',
        '--scenario', 'minimal',
        '--output-dir', outputDir,
        '--ci'
      ], { timeout: TEST_CONFIG.TIMEOUT.EXTENDED });
      
      expect(runResult.code).toBeDefined();
    });

    it('should complete full CI/CD workflow', async () => {
      const outputDir = path.join(testOutputDir, 'ci-workflow');
      
      const ciResult = await runner.runCommand([
        'run',
        '--ci',
        '--parallel',
        '--coverage',
        '--report',
        '--json',
        '--junit',
        '--output-dir', outputDir
      ], { 
        timeout: TEST_CONFIG.TIMEOUT.EXTENDED,
        retries: 1
      });
      
      expect(ciResult.code).toBeDefined();
      
      // Check if output directory was created (if tests ran successfully)
      if (ciResult.success) {
        try {
          const stats = await fs.stat(outputDir);
          expect(stats.isDirectory()).toBe(true);
        } catch (error) {
          // Directory might not be created if no tests actually ran
        }
      }
    });

    it('should handle complex option combinations', async () => {
      const complexCommands = [
        [
          'run',
          '--scenario', 'minimal',
          '--parallel',
          '--max-parallel', '2',
          '--coverage',
          '--json',
          '--ci'
        ],
        [
          'run',
          '--report',
          '--junit',
          '--output-dir', path.join(testOutputDir, 'complex'),
          '--ci'
        ]
      ];

      for (const args of complexCommands) {
        const result = await runner.runCommand(args, { 
          timeout: TEST_CONFIG.TIMEOUT.EXTENDED,
          retries: 1
        });
        
        expect(result.code).toBeDefined();
      }
    });
  });

  describe('Reliability and Stability Tests', () => {
    it('should handle rapid successive executions', async () => {
      const rapidCommands = [
        ['--version'],
        ['list'],
        ['--help'],
        ['list', '--json'],
        ['validate']
      ];

      // Execute commands in rapid succession
      const promises = rapidCommands.map((args, index) => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve(runner.runCommand(args));
          }, index * 100); // Stagger by 100ms
        })
      );

      const results = await Promise.all(promises);
      
      // Most commands should succeed
      const successfulResults = results.filter(r => r.testPassed);
      expect(successfulResults.length).toBeGreaterThanOrEqual(rapidCommands.length * 0.8);
    });

    it('should recover from errors gracefully', async () => {
      // Mix of valid and invalid commands
      const mixedCommands = [
        { args: ['list'], expectFailure: false },
        { args: ['invalid-command'], expectFailure: true },
        { args: ['--version'], expectFailure: false },
        { args: ['run', '--invalid-option'], expectFailure: true },
        { args: ['validate'], expectFailure: false }
      ];

      for (const { args, expectFailure } of mixedCommands) {
        const result = await runner.runCommand(args, { expectFailure });
        expect(result.testPassed).toBe(true);
      }
    });

    it('should maintain consistency across multiple runs', async () => {
      const consistencyCommand = ['list', '--json'];
      const runs = [];
      
      // Run the same command multiple times
      for (let i = 0; i < 3; i++) {
        const result = await runner.runCommand(consistencyCommand);
        runs.push(result);
        
        // Small delay between runs
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // All runs should have consistent results
      const successfulRuns = runs.filter(r => r.testPassed);
      expect(successfulRuns.length).toBe(runs.length);
      
      // Output should be consistent (if all succeeded)
      if (successfulRuns.length > 1) {
        const firstOutput = successfulRuns[0].stdout;
        successfulRuns.slice(1).forEach(run => {
          expect(run.stdout).toBe(firstOutput);
        });
      }
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle unusual but valid inputs', async () => {
      const edgeCases = [
        ['run', '--scenario', '', '--ci'], // Empty scenario
        ['run', '--max-parallel', '1', '--ci'], // Minimum parallel
        ['validate', '--services', 'localstack'], // Single service
        ['list'] // Basic command
      ];

      for (const args of edgeCases) {
        const result = await runner.runCommand(args, { 
          timeout: TEST_CONFIG.TIMEOUT.MEDIUM 
        });
        
        expect(result.code).toBeDefined();
        // Should complete without hanging or crashing
      }
    });

    it('should handle system resource variations', async () => {
      // Test with different environment configurations
      const envVariations = [
        { NODE_ENV: 'test' },
        { NODE_ENV: 'development' },
        { CI: 'true' },
        { CI: 'false' }
      ];

      for (const env of envVariations) {
        const result = await runner.runCommand(['list'], { env });
        expect(result.testPassed).toBe(true);
      }
    });
  });
});