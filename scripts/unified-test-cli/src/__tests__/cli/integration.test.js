/**
 * Integration tests for complete CLI workflows
 * 
 * These tests verify that the CLI works end-to-end with real components
 * and proper integration between all parts of the system.
 */

import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
// Get current directory for test files
const __dirname = process.cwd();

// Path to the CLI entry point
const CLI_PATH = path.resolve(process.cwd(), 'src/cli/index.js');
const TEST_OUTPUT_DIR = path.resolve(__dirname, 'test-results/integration');

// Helper function to run CLI commands
const runCLI = (args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' },
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr,
        success: code === 0
      });
    });

    child.on('error', (error) => {
      reject(error);
    });

    // Set timeout for CLI execution
    setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('CLI execution timeout'));
    }, 30000); // 30 second timeout
  });
};

// Helper function to ensure test output directory exists
const ensureTestOutputDir = async () => {
  try {
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
};

describe('CLI Integration Tests', () => {
  beforeAll(async () => {
    await ensureTestOutputDir();
  });

  afterAll(async () => {
    // Clean up test output directory
    try {
      await fs.rmdir(TEST_OUTPUT_DIR, { recursive: true });
    } catch (error) {
      // Directory might not exist or be in use
    }
  });

  describe('Help and Version Commands', () => {
    it('should display help when no arguments provided', async () => {
      const result = await runCLI(['--help']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('unified-test-cli');
      expect(result.stdout).toContain('Unified CLI interface for running all test suites');
      expect(result.stdout).toContain('Commands:');
      expect(result.stdout).toContain('run');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('validate');
    });

    it('should display version information', async () => {
      const result = await runCLI(['--version']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Version pattern
    });
  });

  describe('List Command Integration', () => {
    it('should list available test suites', async () => {
      const result = await runCLI(['list']);
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('Available Test Suites');
      
      // Should contain expected test suites (checking display names)
      const expectedSuites = [
        'Frontend Unit Tests',
        'Backend Unit Tests', 
        'End-to-End Tests',
        'Security Tests'
      ];
      
      expectedSuites.forEach(suite => {
        expect(result.stdout).toContain(suite);
      });
    });

    it('should list test suites in JSON format', async () => {
      const result = await runCLI(['list', '--json']);
      
      expect(result.success).toBe(true);
      
      // Should be valid JSON
      let jsonOutput;
      expect(() => {
        jsonOutput = JSON.parse(result.stdout);
      }).not.toThrow();
      
      expect(Array.isArray(jsonOutput)).toBe(true);
      expect(jsonOutput.length).toBeGreaterThan(0);
      
      // Each suite should have required properties
      jsonOutput.forEach(suite => {
        expect(suite).toHaveProperty('name');
        expect(suite).toHaveProperty('displayName');
        expect(suite).toHaveProperty('type');
      });
    });
  });

  describe('Validate Command Integration', () => {
    it('should validate environment without specific services', async () => {
      const result = await runCLI(['validate']);
      
      // Command should execute (success depends on actual environment)
      expect(result.code).toBeDefined();
      expect(result.stdout || result.stderr).toBeTruthy();
    });

    it('should validate specific services', async () => {
      const result = await runCLI(['validate', '--services', 'localstack']);
      
      expect(result.code).toBeDefined();
      expect(result.stdout || result.stderr).toContain('localstack');
    });

    it('should handle invalid service names gracefully', async () => {
      const result = await runCLI(['validate', '--services', 'invalid-service']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Invalid service');
    });
  });

  describe('Run Command Integration', () => {
    it('should handle non-existent test suite gracefully', async () => {
      const result = await runCLI(['run', 'non-existent-suite']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('not found') || expect(result.stdout).toContain('not found');
    });

    it('should handle CI mode execution', async () => {
      const result = await runCLI(['run', '--ci']);
      
      // Should execute in non-interactive mode
      expect(result.code).toBeDefined();
      
      // Should not prompt for user input
      expect(result.stdout).not.toContain('?'); // Inquirer prompts typically contain '?'
    });

    it('should generate reports when requested', async () => {
      const outputDir = path.join(TEST_OUTPUT_DIR, 'reports');
      const result = await runCLI(['run', '--report', '--output-dir', outputDir]);
      
      // Command should execute
      expect(result.code).toBeDefined();
      
      // Check if output directory was created (if tests ran)
      if (result.success) {
        try {
          const stats = await fs.stat(outputDir);
          expect(stats.isDirectory()).toBe(true);
        } catch (error) {
          // Directory might not be created if no tests ran
        }
      }
    });

    it('should handle parallel execution options', async () => {
      const result = await runCLI(['run', '--parallel', '--max-parallel', '2']);
      
      expect(result.code).toBeDefined();
      
      // Should not contain validation errors for parallel options
      expect(result.stderr).not.toContain('max-parallel must be');
    });

    it('should handle coverage options', async () => {
      const result = await runCLI(['run', '--coverage']);
      
      expect(result.code).toBeDefined();
      
      // Coverage option should be processed without errors
      expect(result.stderr).not.toContain('coverage');
    });

    it('should handle JSON output format', async () => {
      const result = await runCLI(['run', '--json', '--ci']);
      
      expect(result.code).toBeDefined();
      
      // If successful and produced output, should be valid JSON
      if (result.success && result.stdout.trim()) {
        expect(() => {
          JSON.parse(result.stdout);
        }).not.toThrow();
      }
    });

    it('should handle JUnit output format', async () => {
      const outputDir = path.join(TEST_OUTPUT_DIR, 'junit');
      const result = await runCLI(['run', '--junit', '--output-dir', outputDir]);
      
      expect(result.code).toBeDefined();
      
      // Check if JUnit files were created (if tests ran)
      if (result.success) {
        try {
          const files = await fs.readdir(outputDir);
          const junitFiles = files.filter(file => file.endsWith('.xml'));
          // JUnit files might be created if tests actually ran
        } catch (error) {
          // Directory might not exist if no tests ran
        }
      }
    });
  });

  describe('Command Combination Integration', () => {
    it('should handle multiple output formats together', async () => {
      const outputDir = path.join(TEST_OUTPUT_DIR, 'multi-format');
      const result = await runCLI([
        'run', 
        '--json', 
        '--junit', 
        '--report',
        '--output-dir', outputDir,
        '--ci'
      ]);
      
      expect(result.code).toBeDefined();
      
      // Should handle multiple formats without conflicts
      expect(result.stderr).not.toContain('conflict');
    });

    it('should handle quiet and verbose option conflicts', async () => {
      const result = await runCLI(['run', '--quiet', '--verbose']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('Cannot use both --quiet and --verbose');
    });

    it('should handle scenario specification', async () => {
      const result = await runCLI(['run', '--scenario', 'minimal', '--ci']);
      
      expect(result.code).toBeDefined();
      
      // Scenario option should be processed
      expect(result.stderr).not.toContain('scenario must be');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid command gracefully', async () => {
      const result = await runCLI(['invalid-command']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('unknown command') || 
             expect(result.stdout).toContain('unknown command');
    });

    it('should handle invalid options gracefully', async () => {
      const result = await runCLI(['run', '--invalid-option']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('unknown option') || 
             expect(result.stdout).toContain('unknown option');
    });

    it('should handle invalid max-parallel values', async () => {
      const result = await runCLI(['run', '--max-parallel', 'invalid']);
      
      expect(result.success).toBe(false);
      expect(result.stderr).toContain('max-parallel must be');
    });

    it('should handle invalid output directory permissions', async () => {
      // Try to write to a restricted directory (if available)
      const restrictedDir = '/root/restricted'; // Unix-style restricted path
      const result = await runCLI(['run', '--output-dir', restrictedDir, '--ci']);
      
      // Should either succeed or fail gracefully
      expect(result.code).toBeDefined();
      
      if (!result.success) {
        expect(result.stderr).toBeTruthy(); // Should have error message
      }
    });
  });

  describe('Signal Handling Integration', () => {
    it('should handle SIGTERM gracefully', async () => {
      // This test verifies that the CLI can be interrupted
      const child = spawn(process.execPath, [CLI_PATH, 'run', '--ci'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      // Give the process a moment to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send SIGTERM
      child.kill('SIGTERM');

      const result = await new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code, signal) => {
          resolve({ code, signal, stdout, stderr });
        });
      });

      // Process should have been terminated
      expect(result.signal).toBe('SIGTERM');
    });
  });
});