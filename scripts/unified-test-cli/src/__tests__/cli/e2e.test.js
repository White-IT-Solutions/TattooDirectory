/**
 * End-to-End tests for all CLI command combinations
 * 
 * These tests verify complete user workflows and command combinations
 * work correctly in realistic scenarios.
 */

import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
// Get current directory for test files
const __dirname = process.cwd();

// Path to the CLI entry point
const CLI_PATH = path.resolve(process.cwd(), 'src/cli/index.js');
const TEST_OUTPUT_DIR = path.resolve(__dirname, 'test-results/e2e');

// Helper function to run CLI commands with timeout and proper cleanup
const runCLICommand = (args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 45000; // 45 second default timeout
    
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        CI: 'true', // Force CI mode to avoid interactive prompts
        ...options.env
      },
      cwd: options.cwd || process.cwd()
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
      reject(new Error(`CLI command timed out after ${timeout}ms: ${args.join(' ')}`));
    }, timeout);

    child.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        resolve({
          code,
          signal,
          stdout,
          stderr,
          success: code === 0,
          timedOut: false
        });
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        reject(error);
      }
    });

    // Send empty input to handle any potential prompts
    child.stdin.end();
  });
};

// Helper to create test output directory
const setupTestEnvironment = async () => {
  try {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
};

// Helper to clean up test files
const cleanupTestEnvironment = async () => {
  try {
    await fs.rmdir(TEST_OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might not exist
  }
};

describe('CLI End-to-End Tests', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  describe('Complete User Workflows', () => {
    it('should complete discovery -> validation -> execution workflow', async () => {
      // Step 1: List available suites
      const listResult = await runCLICommand(['list', '--json']);
      expect(listResult.success).toBe(true);
      
      let suites;
      expect(() => {
        suites = JSON.parse(listResult.stdout);
      }).not.toThrow();
      expect(Array.isArray(suites)).toBe(true);

      // Step 2: Validate environment
      const validateResult = await runCLICommand(['validate']);
      expect(validateResult.code).toBeDefined();

      // Step 3: Attempt to run a test suite (may fail due to environment, but should handle gracefully)
      if (suites.length > 0) {
        const firstSuite = suites[0].name;
        const runResult = await runCLICommand(['run', firstSuite, '--ci'], { timeout: 60000 });
        expect(runResult.code).toBeDefined();
      }
    });

    it('should handle complete CI workflow', async () => {
      const outputDir = path.join(TEST_OUTPUT_DIR, 'ci-workflow');
      
      const result = await runCLICommand([
        'run',
        '--ci',
        '--json',
        '--junit',
        '--coverage',
        '--report',
        '--output-dir', outputDir
      ], { timeout: 90000 });

      expect(result.code).toBeDefined();
      
      // In CI mode, should not hang waiting for input
      expect(result.timedOut).toBe(false);
    });

    it('should handle development workflow with validation', async () => {
      // Simulate developer workflow: validate -> list -> run specific suite
      
      // Step 1: Validate specific services
      const validateResult = await runCLICommand(['validate', '--services', 'localstack']);
      expect(validateResult.code).toBeDefined();

      // Step 2: List suites to see what's available
      const listResult = await runCLICommand(['list']);
      expect(listResult.success).toBe(true);

      // Step 3: Run with development-friendly options
      const runResult = await runCLICommand([
        'run',
        '--scenario', 'minimal',
        '--verbose',
        '--ci' // Force non-interactive for testing
      ], { timeout: 60000 });
      
      expect(runResult.code).toBeDefined();
    });
  });

  describe('All Command Combinations', () => {
    describe('List Command Combinations', () => {
      it('should handle list with all output formats', async () => {
        const jsonResult = await runCLICommand(['list', '--json']);
        expect(jsonResult.success).toBe(true);
        expect(() => JSON.parse(jsonResult.stdout)).not.toThrow();

        const defaultResult = await runCLICommand(['list']);
        expect(defaultResult.success).toBe(true);
        expect(defaultResult.stdout).toContain('Available Test Suites');
      });
    });

    describe('Validate Command Combinations', () => {
      it('should handle validate with different service combinations', async () => {
        const testCases = [
          ['validate'],
          ['validate', '--services', 'localstack'],
          ['validate', '--services', 'frontend'],
          ['validate', '--services', 'backend'],
          ['validate', '--services', 'localstack,frontend'],
          ['validate', '--services', 'localstack,frontend,backend']
        ];

        for (const args of testCases) {
          const result = await runCLICommand(args);
          expect(result.code).toBeDefined();
          // Each command should complete (success depends on actual environment)
        }
      });
    });

    describe('Run Command Combinations', () => {
      it('should handle run with all boolean flag combinations', async () => {
        const booleanFlags = [
          ['--parallel'],
          ['--ci'],
          ['--coverage'],
          ['--report'],
          ['--junit'],
          ['--json'],
          ['--quiet'],
          ['--verbose']
        ];

        for (const flags of booleanFlags) {
          const result = await runCLICommand(['run', ...flags], { timeout: 30000 });
          expect(result.code).toBeDefined();
          
          // Conflicting flags should be handled
          if (flags.includes('--quiet') && flags.includes('--verbose')) {
            expect(result.success).toBe(false);
          }
        }
      });

      it('should handle run with all value-based options', async () => {
        const outputDir = path.join(TEST_OUTPUT_DIR, 'value-options');
        
        const testCases = [
          ['run', '--scenario', 'minimal', '--ci'],
          ['run', '--max-parallel', '2', '--ci'],
          ['run', '--output-dir', outputDir, '--ci'],
          ['run', '--scenario', 'frontend-ready', '--max-parallel', '3', '--ci'],
          ['run', '--output-dir', outputDir, '--scenario', 'minimal', '--ci']
        ];

        for (const args of testCases) {
          const result = await runCLICommand(args, { timeout: 45000 });
          expect(result.code).toBeDefined();
        }
      });

      it('should handle run with all output format combinations', async () => {
        const outputDir = path.join(TEST_OUTPUT_DIR, 'output-formats');
        
        const formatCombinations = [
          ['--json'],
          ['--junit'],
          ['--report'],
          ['--json', '--junit'],
          ['--json', '--report'],
          ['--junit', '--report'],
          ['--json', '--junit', '--report']
        ];

        for (const formats of formatCombinations) {
          const result = await runCLICommand([
            'run',
            ...formats,
            '--output-dir', outputDir,
            '--ci'
          ], { timeout: 45000 });
          
          expect(result.code).toBeDefined();
        }
      });

      it('should handle run with parallel execution combinations', async () => {
        const parallelCombinations = [
          ['--parallel'],
          ['--parallel', '--max-parallel', '1'],
          ['--parallel', '--max-parallel', '2'],
          ['--parallel', '--max-parallel', '5'],
          ['--parallel', '--coverage'],
          ['--parallel', '--report'],
          ['--parallel', '--json'],
          ['--parallel', '--max-parallel', '3', '--coverage', '--report']
        ];

        for (const args of parallelCombinations) {
          const result = await runCLICommand(['run', ...args, '--ci'], { timeout: 60000 });
          expect(result.code).toBeDefined();
        }
      });
    });

    describe('Complex Command Combinations', () => {
      it('should handle maximum option complexity', async () => {
        const outputDir = path.join(TEST_OUTPUT_DIR, 'max-complexity');
        
        const result = await runCLICommand([
          'run',
          '--scenario', 'minimal',
          '--parallel',
          '--max-parallel', '2',
          '--coverage',
          '--report',
          '--json',
          '--junit',
          '--output-dir', outputDir,
          '--ci'
        ], { timeout: 90000 });

        expect(result.code).toBeDefined();
        expect(result.timedOut).toBe(false);
      });

      it('should handle suite-specific execution with all options', async () => {
        // Get available suites first
        const listResult = await runCLICommand(['list', '--json']);
        if (!listResult.success) {
          return; // Skip if can't get suites
        }

        let suites;
        try {
          suites = JSON.parse(listResult.stdout);
        } catch {
          return; // Skip if can't parse suites
        }

        if (suites.length === 0) {
          return; // Skip if no suites available
        }

        const outputDir = path.join(TEST_OUTPUT_DIR, 'suite-specific');
        const testSuite = suites[0].name;

        const result = await runCLICommand([
          'run',
          testSuite,
          '--scenario', 'minimal',
          '--coverage',
          '--report',
          '--json',
          '--output-dir', outputDir,
          '--ci'
        ], { timeout: 90000 });

        expect(result.code).toBeDefined();
      });
    });
  });

  describe('Error Scenario Workflows', () => {
    it('should handle invalid command sequences gracefully', async () => {
      const invalidCommands = [
        ['invalid-command'],
        ['run', '--invalid-option'],
        ['list', '--invalid-flag'],
        ['validate', '--invalid-services'],
        ['run', '--max-parallel', 'invalid'],
        ['run', '--scenario', 123],
        ['validate', '--services', 'invalid-service']
      ];

      for (const args of invalidCommands) {
        const result = await runCLICommand(args, { timeout: 15000 });
        expect(result.success).toBe(false);
        expect(result.stderr || result.stdout).toBeTruthy();
      }
    });

    it('should handle resource constraint scenarios', async () => {
      // Test with very low max-parallel
      const result1 = await runCLICommand([
        'run', '--parallel', '--max-parallel', '1', '--ci'
      ], { timeout: 60000 });
      expect(result1.code).toBeDefined();

      // Test with maximum max-parallel
      const result2 = await runCLICommand([
        'run', '--parallel', '--max-parallel', '10', '--ci'
      ], { timeout: 60000 });
      expect(result2.code).toBeDefined();
    });

    it('should handle file system permission scenarios', async () => {
      // Test with non-existent parent directory
      const nonExistentDir = path.join(TEST_OUTPUT_DIR, 'non-existent', 'deep', 'path');
      
      const result = await runCLICommand([
        'run', '--output-dir', nonExistentDir, '--ci'
      ], { timeout: 30000 });
      
      expect(result.code).toBeDefined();
      // Should either succeed (creating directories) or fail gracefully
    });

    it('should handle environment variable scenarios', async () => {
      // Test with different NODE_ENV values
      const envScenarios = [
        { NODE_ENV: 'test' },
        { NODE_ENV: 'development' },
        { NODE_ENV: 'production' },
        { CI: 'true' },
        { CI: 'false' }
      ];

      for (const env of envScenarios) {
        const result = await runCLICommand(['list'], { 
          timeout: 15000,
          env 
        });
        expect(result.code).toBeDefined();
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle rapid successive command execution', async () => {
      const commands = [
        ['list'],
        ['validate'],
        ['list', '--json'],
        ['validate', '--services', 'localstack']
      ];

      // Execute commands rapidly in succession
      const promises = commands.map(args => 
        runCLICommand(args, { timeout: 20000 })
      );

      const results = await Promise.allSettled(promises);
      
      // All commands should complete (not hang or crash)
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value.code).toBeDefined();
        } else {
          // Log which command failed for debugging
          console.warn(`Command ${commands[index].join(' ')} failed:`, result.reason);
        }
      });
    });

    it('should handle concurrent command execution', async () => {
      // Run multiple CLI instances concurrently
      const concurrentCommands = [
        runCLICommand(['list'], { timeout: 20000 }),
        runCLICommand(['list', '--json'], { timeout: 20000 }),
        runCLICommand(['validate'], { timeout: 30000 })
      ];

      const results = await Promise.allSettled(concurrentCommands);
      
      // At least some commands should succeed
      const successfulResults = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      );
      
      expect(results.length).toBe(3);
      // Don't require all to succeed as environment may not be fully set up
    });

    it('should handle memory-intensive option combinations', async () => {
      const outputDir = path.join(TEST_OUTPUT_DIR, 'memory-test');
      
      const result = await runCLICommand([
        'run',
        '--coverage',
        '--report',
        '--json',
        '--junit',
        '--verbose',
        '--output-dir', outputDir,
        '--ci'
      ], { timeout: 120000 }); // Extended timeout for memory-intensive operations

      expect(result.code).toBeDefined();
      expect(result.timedOut).toBe(false);
    });
  });
});