/**
 * TestExecutor - Orchestrates test suite execution
 * 
 * Handles the complete test execution workflow including environment validation,
 * data seeding, test running, and result collection.
 */

import { spawn } from 'child_process';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { ServiceValidator } from './service-validator.js';
import { DataManager } from './data-manager.js';
import { TestExecutionError, WorkspaceError, TimeoutError, ErrorRecovery } from '../utils/errors.js';

export class TestExecutor {
  constructor() {
    this.logger = new Logger();
    this.serviceValidator = new ServiceValidator();
    this.dataManager = new DataManager();
  }

  /**
   * Execute a single test suite with full workflow
   * @param {Object} suite - Test suite definition
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Test execution result
   */
  async executeSuite(suite, options = {}) {
    const startTime = Date.now();
    this.logger.info(`Starting test suite execution: ${suite.name}`);

    let result = {
      suite: suite.name,
      status: 'running',
      startTime: new Date(startTime).toISOString(),
      endTime: null,
      duration: 0,
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
      coverage: null,
      errors: []
    };

    try {
      // Step 1: Validate environment prerequisites
      await this.validatePrerequisites(suite);

      // Step 2: Seed required data scenario
      const scenario = options.scenario || await this.dataManager.getRequiredScenario(suite);
      if (scenario) {
        await this.dataManager.seedScenario(scenario);
      }

      // Step 3: Execute the test suite
      const testResult = await this.runTestSuite(suite, options);
      
      // Step 4: Process and format results
      result = { ...result, ...testResult };
      result.status = testResult.exitCode === 0 ? 'passed' : 'failed';

      // Step 5: Cleanup (if needed)
      if (scenario && !options.skipCleanup) {
        await this.dataManager.cleanupScenario(scenario);
      }

      const endTime = Date.now();
      result.endTime = new Date(endTime).toISOString();
      result.duration = endTime - startTime;

      this.logger.success(`Test suite completed: ${suite.name}`, { 
        status: result.status, 
        duration: result.duration 
      });

      return result;
    } catch (error) {
      const endTime = Date.now();
      result.status = 'failed';
      result.endTime = new Date(endTime).toISOString();
      result.duration = endTime - startTime;
      result.errors.push({
        type: 'execution_error',
        message: error.message,
        stack: error.stack
      });

      this.logger.error(`Test suite failed: ${suite.name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Validate environment prerequisites for a test suite
   * @param {Object} suite - Test suite definition
   */
  async validatePrerequisites(suite) {
    this.logger.info(`Validating prerequisites for suite: ${suite.name}`);

    // Validate required services
    if (suite.requiredServices && suite.requiredServices.length > 0) {
      const validationResults = await this.serviceValidator.validateEnvironment(suite.requiredServices);
      
      if (validationResults) {
        const unhealthyServices = Object.entries(validationResults)
          .filter(([, result]) => result.status !== 'healthy')
          .map(([name, result]) => ({ name, ...result }));

        if (unhealthyServices.length > 0) {
          const errorMessage = `Required services are not available: ${unhealthyServices.map(s => s.name).join(', ')}`;
          this.logger.error(errorMessage, { unhealthyServices });
          
          // Try to recover from service errors if enabled
          const recoveryOptions = { autoRestart: false, timeout: 30000 };
          for (const service of unhealthyServices) {
            try {
              await ErrorRecovery.recoverFromServiceError(service, recoveryOptions);
            } catch (recoveryError) {
              this.logger.warn(`Failed to recover service ${service.name}: ${recoveryError.message}`);
            }
          }
          
          throw new TestExecutionError(suite.name, 1, errorMessage, 'prerequisite-validation');
        }
      }
    }

    // Validate workspace exists
    if (suite.workspace) {
      const workspacePath = path.join(process.cwd(), suite.workspace);
      try {
        await import('fs').then(fs => fs.promises.access(workspacePath));
      } catch (error) {
        throw new WorkspaceError(suite.workspace, `Workspace not accessible: ${workspacePath}`, 'access');
      }
    }

    this.logger.success(`Prerequisites validated for suite: ${suite.name}`);
  }

  /**
   * Run the actual test suite command
   * @param {Object} suite - Test suite definition
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Test execution result
   */
  async runTestSuite(suite, options = {}) {
    this.logger.info(`Running test command: ${suite.command}`);

    return new Promise((resolve, reject) => {
      // Prepare command and arguments
      const [cmd, ...args] = suite.command.split(' ');
      
      // Add coverage flag if requested
      if (options.coverage && suite.supportsCoverage !== false) {
        args.push('--coverage');
      }

      // Set working directory
      const cwd = suite.workspace ? path.join(process.cwd(), suite.workspace) : process.cwd();
      
      // Set environment variables
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        CI: options.ci ? 'true' : 'false'
      };

      const childProcess = spawn(cmd, args, {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Stream output in real-time for better user experience
        if (!options.silent) {
          process.stdout.write(output);
        }
      });

      childProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        if (!options.silent) {
          process.stderr.write(output);
        }
      });



      childProcess.on('error', (error) => {
        this.logger.error('Test command execution error', { error: error.message });
        reject(new TestExecutionError(suite.name, -1, error.message, 'command-execution'));
      });

      // Set timeout if specified
      let timeoutId;
      if (suite.timeout) {
        timeoutId = setTimeout(() => {
          childProcess.kill('SIGTERM');
          reject(new TimeoutError('test-suite-execution', suite.timeout, { suite: suite.name }));
        }, suite.timeout);
      }

      childProcess.on('close', (exitCode) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        const result = {
          exitCode,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          tests: this.parseTestResults(stdout, suite.type),
          coverage: this.parseCoverageResults(stdout, options.coverage)
        };

        if (exitCode === 0) {
          this.logger.success(`Test command completed successfully`);
          resolve(result);
        } else {
          this.logger.error(`Test command failed with exit code ${exitCode}`);
          resolve(result); // Don't reject, let caller handle the failure
        }
      });
    });
  }

  /**
   * Parse test results from command output
   * @param {string} output - Command stdout
   * @param {string} suiteType - Type of test suite
   * @returns {Object} Parsed test statistics
   */
  parseTestResults(output, suiteType) {
    const defaultResult = { total: 0, passed: 0, failed: 0, skipped: 0 };

    try {
      // Jest output parsing
      if (output.includes('Tests:') || suiteType === 'unit') {
        const testMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
        if (testMatch) {
          return {
            total: parseInt(testMatch[3]),
            passed: parseInt(testMatch[2]),
            failed: parseInt(testMatch[1]),
            skipped: 0
          };
        }
      }

      // Playwright output parsing
      if (suiteType === 'e2e') {
        const passedMatch = output.match(/(\d+)\s+passed/);
        const failedMatch = output.match(/(\d+)\s+failed/);
        const totalMatch = output.match(/Running\s+(\d+)\s+tests/);
        
        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;
        
        return {
          total,
          passed,
          failed,
          skipped: 0
        };
      }

      // Performance test output parsing
      if (suiteType === 'performance' || output.includes('Performance Test Summary')) {
        const passedMatch = output.match(/Tests passed:\s+(\d+)/);
        const failedMatch = output.match(/Tests failed:\s+(\d+)/);
        const totalMatch = output.match(/Total tests:\s+(\d+)/);
        
        const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;
        
        return {
          total,
          passed,
          failed,
          skipped: 0
        };
      }

      return defaultResult;
    } catch (error) {
      this.logger.warn('Failed to parse test results', { error: error.message });
      return defaultResult;
    }
  }

  /**
   * Parse coverage results from command output
   * @param {string} output - Command stdout
   * @param {boolean} coverageEnabled - Whether coverage was requested
   * @returns {Object|null} Parsed coverage statistics
   */
  parseCoverageResults(output, coverageEnabled) {
    if (!coverageEnabled) {
      return null;
    }

    try {
      // Jest coverage parsing
      const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
      if (coverageMatch) {
        return {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to parse coverage results', { error: error.message });
      return null;
    }
  }
}