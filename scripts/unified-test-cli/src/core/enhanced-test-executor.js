/**
 * EnhancedTestExecutor - Advanced test suite execution with suite-specific logic
 * 
 * Extends the basic test executor to use suite classes for enhanced functionality
 * including suite-specific validation, preparation, and result parsing.
 */

import { spawn } from 'child_process';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { ServiceValidator } from './service-validator.js';
import { DataManager } from './data-manager.js';
import { SuiteFactory } from './suite-factory.js';

export class EnhancedTestExecutor {
  constructor() {
    this.logger = new Logger();
    this.serviceValidator = new ServiceValidator();
    this.dataManager = new DataManager();
    this.suiteFactory = new SuiteFactory();
  }

  /**
   * Execute a single test suite with enhanced workflow
   * @param {Object} suiteConfig - Test suite configuration
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Test execution result
   */
  async executeSuite(suiteConfig, options = {}) {
    const startTime = Date.now();
    this.logger.info(`Starting enhanced test suite execution: ${suiteConfig.name}`, { 
      suite: suiteConfig.name, 
      options 
    });

    // Create suite instance
    const suite = this.suiteFactory.createSuite(suiteConfig);

    let result = {
      suite: suiteConfig.name,
      status: 'running',
      startTime: new Date(startTime).toISOString(),
      endTime: null,
      duration: 0,
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
      coverage: null,
      errors: []
    };

    try {
      // Step 1: Validate suite configuration and environment
      await this.validateSuite(suite);

      // Step 2: Validate environment prerequisites
      await this.validatePrerequisites(suite);

      // Step 3: Prepare suite environment
      await suite.prepare();

      // Step 4: Seed required data scenario
      const scenario = options.scenario || suite.getRequiredDataScenario();
      if (scenario) {
        await this.dataManager.seedScenario(scenario);
      }

      // Step 5: Execute the test suite with suite-specific logic
      const testResult = await this.runTestSuiteEnhanced(suite, options);
      
      // Step 6: Process and format results
      result = { ...result, ...testResult };
      result.status = testResult.exitCode === 0 ? 'passed' : 'failed';

      // Step 7: Cleanup suite environment
      await suite.cleanup();

      // Step 8: Cleanup data scenario (if needed)
      if (scenario && !options.skipCleanup) {
        await this.dataManager.cleanupScenario(scenario);
      }

      const endTime = Date.now();
      result.endTime = new Date(endTime).toISOString();
      result.duration = endTime - startTime;

      this.logger.success(`Enhanced test suite completed: ${suiteConfig.name}`, { 
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

      // Attempt cleanup even on failure
      try {
        await suite.cleanup();
      } catch (cleanupError) {
        this.logger.warn(`Cleanup failed for suite: ${suiteConfig.name}`, { 
          error: cleanupError.message 
        });
      }

      this.logger.error(`Enhanced test suite failed: ${suiteConfig.name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Validate suite configuration and capabilities
   * @param {BaseSuite} suite - Test suite instance
   */
  async validateSuite(suite) {
    this.logger.info(`Validating suite: ${suite.name}`);

    const isValid = await suite.validate();
    if (!isValid) {
      throw new Error(`Suite validation failed: ${suite.name}`);
    }

    this.logger.success(`Suite validation passed: ${suite.name}`);
  }

  /**
   * Validate environment prerequisites for a test suite
   * @param {BaseSuite} suite - Test suite instance
   */
  async validatePrerequisites(suite) {
    this.logger.info(`Validating prerequisites for suite: ${suite.name}`);

    // Validate required services
    const requiredServices = suite.getRequiredServices();
    if (requiredServices && requiredServices.length > 0) {
      const validationResults = await this.serviceValidator.validateEnvironment(requiredServices);
      
      if (validationResults) {
        const unhealthyServices = Object.entries(validationResults)
          .filter(([, result]) => result.status !== 'healthy')
          .map(([name, result]) => ({ name, ...result }));

        if (unhealthyServices.length > 0) {
          const errorMessage = `Required services are not available: ${unhealthyServices.map(s => s.name).join(', ')}`;
          this.logger.error(errorMessage, { unhealthyServices });
          throw new Error(errorMessage);
        }
      }
    }

    this.logger.success(`Prerequisites validated for suite: ${suite.name}`);
  }

  /**
   * Run the test suite with enhanced suite-specific logic
   * @param {BaseSuite} suite - Test suite instance
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Test execution result
   */
  async runTestSuiteEnhanced(suite, options = {}) {
    this.logger.info(`Running enhanced test command for suite: ${suite.name}`);

    return new Promise((resolve, reject) => {
      // Get suite-specific command arguments
      const [cmd, ...args] = suite.transformCommandArgs(options);
      
      // Set working directory
      const cwd = suite.workspace ? 
        path.join(process.cwd(), suite.workspace) : 
        process.cwd();
      
      // Set environment variables
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        CI: options.ci ? 'true' : 'false'
      };

      this.logger.debug(`Executing command: ${cmd} ${args.join(' ')}`, { cwd, env: Object.keys(env) });

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
        this.logger.error('Enhanced test command execution error', { error: error.message });
        reject(new Error(`Failed to execute test command: ${error.message}`));
      });

      // Set timeout if specified
      let timeoutId;
      const timeout = suite.getEstimatedDuration();
      if (timeout) {
        timeoutId = setTimeout(() => {
          childProcess.kill('SIGTERM');
          reject(new Error(`Test suite timed out after ${timeout}ms`));
        }, timeout);
      }

      childProcess.on('close', (exitCode) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Use suite-specific result parsing
        const result = suite.parseResults(stdout, stderr, exitCode);

        if (exitCode === 0) {
          this.logger.success(`Enhanced test command completed successfully`);
          resolve(result);
        } else {
          this.logger.error(`Enhanced test command failed with exit code ${exitCode}`);
          resolve(result); // Don't reject, let caller handle the failure
        }
      });
    });
  }

  /**
   * Execute multiple test suites in parallel
   * @param {Array} suiteConfigs - Array of test suite configurations
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Array of test execution results
   */
  async executeParallel(suiteConfigs, options = {}) {
    const maxConcurrency = options.maxParallel || 3;
    this.logger.info(`Starting parallel execution of ${suiteConfigs.length} suites`, { maxConcurrency });

    // Filter suites that can run in parallel
    const parallelSuites = suiteConfigs.filter(config => {
      const suite = this.suiteFactory.createSuite(config);
      return suite.canRunInParallel();
    });

    const sequentialSuites = suiteConfigs.filter(config => {
      const suite = this.suiteFactory.createSuite(config);
      return !suite.canRunInParallel();
    });

    const results = [];

    // Execute parallel suites in batches
    if (parallelSuites.length > 0) {
      const parallelResults = await this.executeBatches(parallelSuites, maxConcurrency, options);
      results.push(...parallelResults);
    }

    // Execute sequential suites one by one
    for (const suiteConfig of sequentialSuites) {
      try {
        const result = await this.executeSuite(suiteConfig, options);
        results.push(result);
      } catch (error) {
        results.push({
          suite: suiteConfig.name,
          status: 'failed',
          error: error.message
        });
      }
    }

    this.logger.success(`Parallel execution completed`, { 
      total: suiteConfigs.length,
      passed: results.filter(r => r && r.status === 'passed').length,
      failed: results.filter(r => r && r.status === 'failed').length
    });

    return results;
  }

  /**
   * Execute suites in batches with concurrency limit
   * @param {Array} suiteConfigs - Array of suite configurations
   * @param {number} maxConcurrency - Maximum concurrent executions
   * @param {Object} options - Execution options
   * @returns {Promise<Array>} Array of results
   */
  async executeBatches(suiteConfigs, maxConcurrency, options) {
    const results = [];
    
    for (let i = 0; i < suiteConfigs.length; i += maxConcurrency) {
      const batch = suiteConfigs.slice(i, i + maxConcurrency);
      
      this.logger.info(`Executing batch ${Math.floor(i / maxConcurrency) + 1}`, { 
        suites: batch.map(s => s.name) 
      });

      const batchPromises = batch.map(async (suiteConfig) => {
        try {
          return await this.executeSuite(suiteConfig, options);
        } catch (error) {
          return {
            suite: suiteConfig.name,
            status: 'failed',
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get suite metadata for display purposes
   * @param {Object} suiteConfig - Suite configuration
   * @returns {Object} Suite metadata
   */
  getSuiteMetadata(suiteConfig) {
    const suite = this.suiteFactory.createSuite(suiteConfig);
    return suite.getMetadata();
  }
}