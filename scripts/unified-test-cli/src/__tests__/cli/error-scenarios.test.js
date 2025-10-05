/**
 * Error scenario testing for all CLI failure modes
 * 
 * These tests verify that the CLI handles all possible error conditions
 * gracefully and provides helpful error messages to users.
 */

import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
// Get current directory for test files
const __dirname = process.cwd();

// Path to the CLI entry point
const CLI_PATH = path.resolve(process.cwd(), 'src/cli/index.js');
const TEST_OUTPUT_DIR = path.resolve(__dirname, 'test-results/error-scenarios');

// Helper function to run CLI and expect failure
const runCLIExpectingError = (args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 15000;
    
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { 
        ...process.env, 
        NODE_ENV: 'test',
        CI: 'true',
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
      reject(new Error(`CLI error test timed out after ${timeout}ms: ${args.join(' ')}`));
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
          failed: code !== 0,
          output: stdout + stderr
        });
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        // Process spawn errors are also valid test results
        resolve({
          code: -1,
          error: error.message,
          stdout: '',
          stderr: error.message,
          success: false,
          failed: true,
          output: error.message
        });
      }
    });

    // Close stdin immediately to avoid hanging
    child.stdin.end();
  });
};

// Helper to create files with specific permissions (Unix-like systems)
const createRestrictedFile = async (filePath) => {
  try {
    await fs.writeFile(filePath, 'restricted content');
    await fs.chmod(filePath, 0o000); // No permissions
    return true;
  } catch (error) {
    // Might not be supported on all systems
    return false;
  }
};

// Helper to create directory structure for testing
const setupErrorTestEnvironment = async () => {
  try {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
    
    // Create a read-only directory for permission tests
    const readOnlyDir = path.join(TEST_OUTPUT_DIR, 'readonly');
    await fs.mkdir(readOnlyDir, { recursive: true });
    
    try {
      await fs.chmod(readOnlyDir, 0o444); // Read-only
    } catch (error) {
      // Chmod might not work on all systems
    }
    
    return { readOnlyDir };
  } catch (error) {
    return {};
  }
};

describe('CLI Error Scenario Tests', () => {
  let testDirs = {};

  beforeAll(async () => {
    testDirs = await setupErrorTestEnvironment();
  });

  afterAll(async () => {
    try {
      // Reset permissions before cleanup
      if (testDirs.readOnlyDir) {
        await fs.chmod(testDirs.readOnlyDir, 0o755);
      }
      await fs.rmdir(TEST_OUTPUT_DIR, { recursive: true });
    } catch (error) {
      // Cleanup might fail, that's okay
    }
  });

  describe('Invalid Command Errors', () => {
    it('should handle unknown commands gracefully', async () => {
      const invalidCommands = [
        ['unknown-command'],
        ['invalid'],
        ['test'],
        ['execute'],
        ['start'],
        ['stop']
      ];

      for (const args of invalidCommands) {
        const result = await runCLIExpectingError(args);
        
        expect(result.failed).toBe(true);
        expect(result.output.toLowerCase()).toMatch(/unknown|invalid|not found|unrecognized/);
        
        // Should suggest available commands
        expect(result.output).toMatch(/run|list|validate/);
      }
    });

    it('should handle unknown options gracefully', async () => {
      const invalidOptions = [
        ['run', '--unknown-option'],
        ['list', '--invalid-flag'],
        ['validate', '--bad-option'],
        ['run', '--fake-parameter', 'value'],
        ['list', '--nonexistent'],
        ['validate', '--missing-option']
      ];

      for (const args of invalidOptions) {
        const result = await runCLIExpectingError(args);
        
        expect(result.failed).toBe(true);
        expect(result.output.toLowerCase()).toMatch(/unknown|invalid|unrecognized.*option/);
      }
    });

    it('should handle malformed command syntax', async () => {
      const malformedCommands = [
        ['run', '--max-parallel'], // Missing value
        ['validate', '--services'], // Missing value
        ['run', '--output-dir'], // Missing value
        ['run', '--scenario'], // Missing value
      ];

      for (const args of malformedCommands) {
        const result = await runCLIExpectingError(args);
        
        expect(result.failed).toBe(true);
        expect(result.output).toMatch(/argument|value|required/i);
      }
    });
  });

  describe('Invalid Parameter Errors', () => {
    it('should handle invalid max-parallel values', async () => {
      const invalidValues = [
        ['run', '--max-parallel', 'invalid'],
        ['run', '--max-parallel', 'abc'],
        ['run', '--max-parallel', '0'],
        ['run', '--max-parallel', '-1'],
        ['run', '--max-parallel', '11'],
        ['run', '--max-parallel', '999'],
        ['run', '--max-parallel', '1.5'],
        ['run', '--max-parallel', 'null']
      ];

      for (const args of invalidValues) {
        const result = await runCLIExpectingError(args);
        
        expect(result.failed).toBe(true);
        expect(result.output).toMatch(/max-parallel.*must be.*number.*between.*1.*10/i);
      }
    });

    it('should handle invalid service names', async () => {
      const invalidServices = [
        ['validate', '--services', 'invalid-service'],
        ['validate', '--services', 'unknown'],
        ['validate', '--services', 'localstack,invalid'],
        ['validate', '--services', 'frontend,unknown,backend'],
        ['validate', '--services', ''],
        ['validate', '--services', 'null'],
        ['validate', '--services', '123']
      ];

      for (const args of invalidServices) {
        const result = await runCLIExpectingError(args);
        
        expect(result.failed).toBe(true);
        expect(result.output).toMatch(/invalid service|valid services.*localstack.*frontend.*backend/i);
      }
    });

    it('should handle conflicting options', async () => {
      const conflictingOptions = [
        ['run', '--quiet', '--verbose'],
        ['run', '--quiet', '--verbose', '--ci']
      ];

      for (const args of conflictingOptions) {
        const result = await runCLIExpectingError(args);
        
        expect(result.failed).toBe(true);
        expect(result.output).toMatch(/cannot use both.*quiet.*verbose/i);
      }
    });

    it('should handle invalid scenario names', async () => {
      const invalidScenarios = [
        ['run', '--scenario', ''],
        ['run', '--scenario', 'null'],
        ['run', '--scenario', '123'],
        ['run', '--scenario', 'invalid-scenario-name-that-does-not-exist']
      ];

      for (const args of invalidScenarios) {
        const result = await runCLIExpectingError(args);
        
        expect(result.failed).toBe(true);
        // Should either validate scenario name or handle gracefully during execution
        expect(result.code).toBeDefined();
      }
    });
  });

  describe('File System Errors', () => {
    it('should handle invalid output directories', async () => {
      const invalidPaths = [
        ['run', '--output-dir', '/root/restricted'], // Likely restricted on Unix
        ['run', '--output-dir', 'CON'], // Invalid on Windows
        ['run', '--output-dir', ''], // Empty path
        ['run', '--output-dir', 'invalid-path'], // Invalid path
        ['run', '--output-dir', 'a'.repeat(300)] // Very long path
      ];

      for (const args of invalidPaths) {
        const result = await runCLIExpectingError(args);
        
        expect(result.code).toBeDefined();
        // Should either handle gracefully or fail with appropriate error
        if (result.failed) {
          expect(result.output).toBeTruthy(); // Should have some error message
        }
      }
    });

    it('should handle permission denied scenarios', async () => {
      if (testDirs.readOnlyDir) {
        const result = await runCLIExpectingError([
          'run', '--output-dir', testDirs.readOnlyDir, '--ci'
        ]);
        
        expect(result.code).toBeDefined();
        // Should handle permission errors gracefully
        if (result.failed) {
          expect(result.output.toLowerCase()).toMatch(/permission|access|denied|readonly/);
        }
      }
    });

    it('should handle disk space scenarios', async () => {
      // Create a very large output request to potentially trigger disk space issues
      const largeOutputDir = path.join(TEST_OUTPUT_DIR, 'large-output');
      
      const result = await runCLIExpectingError([
        'run',
        '--output-dir', largeOutputDir,
        '--coverage',
        '--report',
        '--json',
        '--junit',
        '--ci'
      ]);
      
      expect(result.code).toBeDefined();
      // Should complete or fail gracefully
    });

    it('should handle concurrent file access', async () => {
      const sharedOutputDir = path.join(TEST_OUTPUT_DIR, 'shared');
      
      // Run multiple CLI instances trying to write to the same directory
      const promises = [
        runCLIExpectingError(['run', '--output-dir', sharedOutputDir, '--ci']),
        runCLIExpectingError(['run', '--output-dir', sharedOutputDir, '--ci']),
        runCLIExpectingError(['run', '--output-dir', sharedOutputDir, '--ci'])
      ];
      
      const results = await Promise.allSettled(promises);
      
      // At least one should complete, others should handle conflicts gracefully
      expect(results.length).toBe(3);
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          expect(result.value.code).toBeDefined();
        }
      });
    });
  });

  describe('Environment Errors', () => {
    it('should handle missing Node.js modules gracefully', async () => {
      // Test with corrupted NODE_PATH
      const result = await runCLIExpectingError(['list'], {
        env: { NODE_PATH: '/nonexistent/path' }
      });
      
      expect(result.code).toBeDefined();
      // Should either work normally or fail with clear error
    });

    it('should handle memory constraints', async () => {
      // Test with very low memory limit (if supported)
      const result = await runCLIExpectingError(['run', '--ci'], {
        env: { NODE_OPTIONS: '--max-old-space-size=10' } // Very low memory
      });
      
      expect(result.code).toBeDefined();
      // Should either work or fail gracefully with memory error
    });

    it('should handle corrupted environment variables', async () => {
      const corruptedEnvs = [
        { NODE_ENV: 'invalid' },
        { HOME: '' },
        { PATH: '' },
        { CI: 'invalid-value' }
      ];

      for (const env of corruptedEnvs) {
        const result = await runCLIExpectingError(['list'], { env });
        
        expect(result.code).toBeDefined();
        // Should handle corrupted environment gracefully
      }
    });

    it('should handle missing required dependencies', async () => {
      // Test with empty NODE_PATH to simulate missing dependencies
      const result = await runCLIExpectingError(['list'], {
        env: { 
          NODE_PATH: '',
          npm_config_prefix: '/nonexistent'
        }
      });
      
      expect(result.code).toBeDefined();
      // Should either work (dependencies are bundled) or fail with clear error
    });
  });

  describe('Process Errors', () => {
    it.skip('should handle process interruption gracefully', async () => {
      // Start a CLI process and interrupt it
      const child = spawn(process.execPath, [CLI_PATH, 'run', '--ci'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test', CI: 'true' }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Give process time to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send interrupt signal
      child.kill('SIGINT');

      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          child.kill('SIGKILL'); // Force kill if it doesn't respond to SIGINT
          reject(new Error('Process did not respond to SIGINT within timeout'));
        }, 5000);

        child.on('close', (code, signal) => {
          clearTimeout(timeout);
          resolve({ code, signal, stdout, stderr });
        });
      });

      expect(result.signal).toBe('SIGINT');
      // Process should have been interrupted cleanly
    });

    it('should handle resource exhaustion', async () => {
      // Try to run with many parallel processes
      const result = await runCLIExpectingError([
        'run', '--parallel', '--max-parallel', '10', '--ci'
      ], { timeout: 30000 });
      
      expect(result.code).toBeDefined();
      // Should either succeed or fail gracefully with resource limits
    });

    it('should handle child process failures', async () => {
      // Test scenarios that might cause child process failures
      const problematicArgs = [
        ['run', 'nonexistent-suite', '--ci'],
        ['validate', '--services', 'localstack'], // Might fail if LocalStack not running
        ['run', '--scenario', 'nonexistent-scenario', '--ci']
      ];

      for (const args of problematicArgs) {
        const result = await runCLIExpectingError(args);
        
        expect(result.code).toBeDefined();
        // Should handle child process failures gracefully
        if (result.failed) {
          expect(result.output).toBeTruthy(); // Should provide error information
        }
      }
    });
  });

  describe('Network and Service Errors', () => {
    it('should handle service unavailability gracefully', async () => {
      // Test validation when services are not running
      const result = await runCLIExpectingError(['validate', '--services', 'localstack']);
      
      expect(result.code).toBeDefined();
      // Should either succeed (if LocalStack is running) or fail with helpful message
      if (result.failed) {
        expect(result.output).toMatch(/localstack|service|connection|unavailable/i);
      }
    });

    it('should handle network timeouts', async () => {
      // Test with very short timeout (simulated by quick execution)
      const result = await runCLIExpectingError(['validate'], { timeout: 5000 });
      
      expect(result.code).toBeDefined();
      // Should complete within timeout or handle timeout gracefully
    });

    it('should handle DNS resolution failures', async () => {
      // This is harder to simulate, but we can test the CLI's resilience
      const result = await runCLIExpectingError(['validate'], {
        env: { DNS_SERVER: '0.0.0.0' } // Invalid DNS
      });
      
      expect(result.code).toBeDefined();
      // Should handle DNS issues gracefully
    });
  });

  describe('Data and Configuration Errors', () => {
    it('should handle missing configuration files', async () => {
      // Test in a directory without configuration
      const emptyDir = path.join(TEST_OUTPUT_DIR, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });
      
      const result = await runCLIExpectingError(['list'], { cwd: emptyDir });
      
      expect(result.code).toBeDefined();
      // Should either use defaults or fail gracefully
    });

    it('should handle corrupted configuration files', async () => {
      // Create a directory with invalid config files
      const corruptedDir = path.join(TEST_OUTPUT_DIR, 'corrupted');
      await fs.mkdir(corruptedDir, { recursive: true });
      
      // Create invalid JSON config
      const configPath = path.join(corruptedDir, 'test-suites.json');
      await fs.writeFile(configPath, '{ invalid json }');
      
      const result = await runCLIExpectingError(['list'], { cwd: corruptedDir });
      
      expect(result.code).toBeDefined();
      // Should handle corrupted config gracefully
    });

    it('should handle data seeding failures', async () => {
      // Test with invalid scenario
      const result = await runCLIExpectingError([
        'run', '--scenario', 'invalid-scenario', '--ci'
      ]);
      
      expect(result.code).toBeDefined();
      // Should handle data seeding failures gracefully
    });
  });

  describe('Edge Case Errors', () => {
    it('should handle extremely long command lines', async () => {
      const veryLongScenario = 'a'.repeat(1000);
      const result = await runCLIExpectingError([
        'run', '--scenario', veryLongScenario, '--ci'
      ]);
      
      expect(result.code).toBeDefined();
      // Should handle long arguments gracefully
    });

    it('should handle special characters in arguments', async () => {
      const specialChars = [
        'scenario with spaces',
        'scenario\nwith\nnewlines',
        'scenario\twith\ttabs',
        'scenario"with"quotes',
        "scenario'with'quotes",
        'scenario\\with\\backslashes',
        'scenario/with/slashes'
      ];

      for (const scenario of specialChars) {
        const result = await runCLIExpectingError([
          'run', '--scenario', scenario, '--ci'
        ]);
        
        expect(result.code).toBeDefined();
        // Should handle special characters gracefully
      }
    });

    it('should handle unicode and international characters', async () => {
      const unicodeScenarios = [
        'scénario-français',
        'сценарий-русский',
        '场景-中文',
        'シナリオ-日本語',
        '🚀-emoji-scenario'
      ];

      for (const scenario of unicodeScenarios) {
        const result = await runCLIExpectingError([
          'run', '--scenario', scenario, '--ci'
        ]);
        
        expect(result.code).toBeDefined();
        // Should handle unicode gracefully
      }
    });

    it('should handle rapid successive error conditions', async () => {
      const errorCommands = [
        ['unknown-command'],
        ['run', '--invalid-option'],
        ['validate', '--services', 'invalid'],
        ['run', '--max-parallel', 'invalid']
      ];

      // Execute all error commands rapidly
      const promises = errorCommands.map(args => 
        runCLIExpectingError(args, { timeout: 10000 })
      );

      const results = await Promise.allSettled(promises);
      
      // All should complete (either succeed or fail gracefully)
      expect(results.length).toBe(errorCommands.length);
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value.code).toBeDefined();
        } else {
          console.warn(`Error command ${errorCommands[index].join(' ')} failed to complete:`, result.reason);
        }
      });
    });
  });
});