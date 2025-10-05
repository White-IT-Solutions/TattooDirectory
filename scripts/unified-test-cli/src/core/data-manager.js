/**
 * DataManager - Manages test data scenarios and seeding
 * 
 * Handles automatic data seeding for different test scenarios using
 * the existing data-cli.js infrastructure. Integrates with the unified
 * data management system to provide seamless test data setup and cleanup.
 */

import { spawn } from 'child_process';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';
import { DataSeedingError, TimeoutError, ErrorRecovery } from '../utils/errors.js';

export class DataManager {
  constructor() {
    this.logger = new Logger();
    this.config = new Config();
    this.projectRoot = this.findProjectRoot();
    this.dataCliPath = path.join(this.projectRoot, 'scripts', 'data-cli.js');
  }

  /**
   * Find the project root directory
   * @returns {string} Path to project root
   */
  findProjectRoot() {
    let currentDir = process.cwd();
    
    // If we're in the unified-test-cli directory, go up to scripts, then to project root
    if (currentDir.includes('unified-test-cli')) {
      while (!currentDir.endsWith('scripts') && currentDir !== path.dirname(currentDir)) {
        currentDir = path.dirname(currentDir);
      }
      if (currentDir.endsWith('scripts')) {
        currentDir = path.dirname(currentDir);
      }
    }
    
    return currentDir;
  }

  /**
   * Seed data scenario for a test suite
   * @param {string} scenarioName - Name of the data scenario to seed
   * @param {Object} options - Additional seeding options
   * @returns {Promise<boolean>} True if seeding was successful
   */
  async seedScenario(scenarioName, options = {}) {
    if (!scenarioName || scenarioName === 'null') {
      this.logger.info('No data scenario specified, skipping seeding');
      return true;
    }

    this.logger.info(`Seeding data scenario: ${scenarioName}`);

    try {
      // Validate scenario exists
      const isValid = await this.validateScenario(scenarioName);
      if (!isValid) {
        throw new DataSeedingError(scenarioName, new Error('Scenario validation failed'));
      }

      const scenarios = await this.config.getDataScenarios();
      const scenario = scenarios[scenarioName];
      
      // Build command with options
      let command = scenario.command;
      if (options.force) {
        command += ' --force';
      }
      if (options.validate) {
        command += ' --validate';
      }

      // Execute the seeding command using data-cli.js
      // Use longer timeout for performance test scenarios
      const seedingOptions = { ...options };
      if (scenarioName.includes('performance') || scenarioName.includes('mega')) {
        seedingOptions.timeout = 180000; // 3 minutes for performance tests
      }
      
      const success = await this.executeDataCliCommand('seed-scenario', [scenarioName], seedingOptions);
      
      if (success) {
        this.logger.success(`Data scenario '${scenarioName}' seeded successfully`);
        return true;
      } else {
        throw new DataSeedingError(scenarioName, new Error('Seeding command execution failed'));
      }
    } catch (error) {
      if (error instanceof DataSeedingError) {
        throw error;
      }
      this.logger.error(`Failed to seed data scenario '${scenarioName}'`, { error: error.message });
      throw new DataSeedingError(scenarioName, error);
    }
  }

  /**
   * Get the required data scenario for a test suite
   * @param {Object} testSuite - Test suite definition
   * @returns {string|null} Required scenario name or null if none needed
   */
  async getRequiredScenario(testSuite) {
    // Check if suite explicitly specifies a data scenario
    if (testSuite.dataScenario !== undefined) {
      return testSuite.dataScenario; // This can be null to explicitly disable seeding
    }

    // Enhanced mapping based on test suite characteristics
    const scenarioMapping = this.buildScenarioMapping();
    
    // Try to match by suite name first
    if (scenarioMapping.byName[testSuite.name]) {
      return scenarioMapping.byName[testSuite.name];
    }
    
    // Then try by suite type
    if (scenarioMapping.byType[testSuite.type]) {
      return scenarioMapping.byType[testSuite.type];
    }
    
    // Finally try by tags
    if (testSuite.tags && Array.isArray(testSuite.tags)) {
      for (const tag of testSuite.tags) {
        if (scenarioMapping.byTag[tag]) {
          return scenarioMapping.byTag[tag];
        }
      }
    }

    return null;
  }

  /**
   * Build comprehensive scenario mapping for different test suite characteristics
   * @returns {Object} Mapping object with byName, byType, and byTag mappings
   */
  buildScenarioMapping() {
    return {
      byName: {
        'frontend-unit': null, // Unit tests don't need data seeding
        'backend-unit': null,  // Unit tests don't need data seeding
        'frontend-e2e': 'frontend-ready',
        'backend-e2e': 'frontend-ready',
        'integration-tests': 'minimal',
        'security-tests': 'minimal',
        'performance-tests': 'performance-test',
        'contract-tests': 'minimal'
      },
      byType: {
        'unit': null,           // Unit tests typically don't need data seeding
        'integration': 'minimal',
        'e2e': 'frontend-ready',
        'security': 'minimal',
        'performance': 'performance-test',
        'contract': 'minimal'
      },
      byTag: {
        'e2e': 'full-dataset',
        'integration': 'minimal',
        'search': 'search-basic',
        'performance': 'performance-test',
        'security': 'minimal',
        'load': 'performance-test'
      }
    };
  }

  /**
   * Clean up test data after test execution
   * @param {string} scenarioName - Name of the scenario to clean up
   * @param {Object} options - Cleanup options
   * @returns {Promise<boolean>} True if cleanup was successful
   */
  async cleanupScenario(scenarioName, options = {}) {
    if (!scenarioName) {
      return true;
    }

    this.logger.info(`Cleaning up data scenario: ${scenarioName}`);

    try {
      const scenarios = await this.config.getDataScenarios();
      const scenario = scenarios[scenarioName];
      
      if (!scenario || !scenario.cleanup) {
        this.logger.info(`No cleanup command specified for scenario '${scenarioName}', using default cleanup`);
        // Use default cleanup command
        return await this.executeDataCliCommand('reset-data', ['clean'], options);
      }

      // Execute custom cleanup command
      const success = await this.executeDataCliCommand('reset-data', ['clean'], options);
      
      if (success) {
        this.logger.success(`Data scenario '${scenarioName}' cleaned up successfully`);
        return true;
      } else {
        this.logger.warn(`Cleanup command failed for scenario '${scenarioName}'`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup data scenario '${scenarioName}'`, { error: error.message });
      return false;
    }
  }

  /**
   * Check if a data scenario exists and is valid
   * @param {string} scenarioName - Name of the scenario to validate
   * @returns {Promise<boolean>} True if scenario is valid
   */
  async validateScenario(scenarioName) {
    try {
      const scenarios = await this.config.getDataScenarios();
      const scenario = scenarios[scenarioName];
      
      if (!scenario) {
        return false;
      }

      // Check required fields
      const requiredFields = ['command'];
      for (const field of requiredFields) {
        if (!scenario[field]) {
          this.logger.warn(`Data scenario '${scenarioName}' missing required field: ${field}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to validate scenario '${scenarioName}'`, { error: error.message });
      return false;
    }
  }

  /**
   * Execute data-cli.js command with proper integration
   * @param {string} command - Data CLI command (e.g., 'seed-scenario', 'reset-data')
   * @param {Array} args - Command arguments
   * @param {Object} options - Execution options
   * @returns {Promise<boolean>} True if command executed successfully
   */
  async executeDataCliCommand(command, args = [], options = {}) {
    const timeout = options.timeout || 60000; // Default 60 seconds for data operations
    
    // Build the full command
    const cmdArgs = ['node', this.dataCliPath, command, ...args];
    
    // Add option flags
    if (options.force) cmdArgs.push('--force');
    if (options.validate) cmdArgs.push('--validate');
    if (options.scenario) cmdArgs.push('--scenario', options.scenario);
    
    const fullCommand = cmdArgs.join(' ');
    
    this.logger.debug(`Executing data CLI command: ${fullCommand}`);

    return new Promise((resolve, reject) => {
      const childProcess = spawn('node', [this.dataCliPath, command, ...args], {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Log progress in real-time for long-running operations
        if (options.verbose) {
          this.logger.debug('Data CLI output:', output.trim());
        }
      });

      childProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        // Log errors in real-time
        this.logger.debug('Data CLI error output:', output.trim());
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          this.logger.debug('Data CLI command executed successfully');
          resolve(true);
        } else {
          const errorMsg = `Data CLI command failed with exit code ${code}`;
          this.logger.error(errorMsg, { 
            command: fullCommand,
            stdout: stdout.trim(), 
            stderr: stderr.trim() 
          });
          reject(new Error(`${errorMsg}: ${stderr.trim() || stdout.trim()}`));
        }
      });

      childProcess.on('error', (error) => {
        this.logger.error('Data CLI command execution error', { 
          command: fullCommand,
          error: error.message 
        });
        reject(error);
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new TimeoutError('data-cli-command', timeout, { command: fullCommand }));
      }, timeout);

      childProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Execute a generic command with timeout and proper error handling
   * @param {string} command - Command to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} True if command executed successfully
   */
  async executeCommand(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Executing command: ${command}`);

      // Parse command and arguments
      const [cmd, ...args] = command.split(' ');
      
      const childProcess = spawn(cmd, args, {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          this.logger.debug('Command executed successfully', { stdout: stdout.trim() });
          resolve(true);
        } else {
          this.logger.error('Command failed', { 
            code, 
            stdout: stdout.trim(), 
            stderr: stderr.trim() 
          });
          reject(new Error(`Command failed with exit code ${code}: ${stderr.trim()}`));
        }
      });

      childProcess.on('error', (error) => {
        this.logger.error('Command execution error', { error: error.message });
        reject(error);
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        reject(new TimeoutError('generic-command', timeout, { command }));
      }, timeout);

      childProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * List all available data scenarios
   * @returns {Promise<Array>} Array of scenario names with descriptions
   */
  async listScenarios() {
    try {
      const scenarios = await this.config.getDataScenarios();
      
      return Object.entries(scenarios).map(([name, config]) => ({
        name,
        description: config.description || 'No description available',
        estimatedTime: config.estimatedTime || 'Unknown',
        dependencies: config.dependencies || []
      }));
    } catch (error) {
      this.logger.error('Failed to list data scenarios', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if data-cli.js is available and accessible
   * @returns {Promise<boolean>} True if data-cli.js is available
   */
  async isDataCliAvailable() {
    try {
      const fs = await import('fs');
      return fs.existsSync(this.dataCliPath);
    } catch (error) {
      this.logger.error('Failed to check data-cli.js availability', { error: error.message });
      return false;
    }
  }

  /**
   * Get data status from the data management system
   * @returns {Promise<Object>} Current data status
   */
  async getDataStatus() {
    try {
      this.logger.debug('Getting data status from data-cli.js');
      
      // Execute data-status command
      const success = await this.executeDataCliCommand('data-status', [], { timeout: 15000 });
      
      if (success) {
        return {
          available: true,
          message: 'Data management system is operational'
        };
      } else {
        return {
          available: false,
          message: 'Data management system is not responding'
        };
      }
    } catch (error) {
      this.logger.error('Failed to get data status', { error: error.message });
      return {
        available: false,
        message: `Data management system error: ${error.message}`
      };
    }
  }

  /**
   * Validate that all required services are available for data seeding
   * @param {Array} dependencies - Array of service dependencies
   * @returns {Promise<boolean>} True if all dependencies are available
   */
  async validateDependencies(dependencies = []) {
    if (!dependencies || dependencies.length === 0) {
      return true;
    }

    this.logger.debug(`Validating dependencies: ${dependencies.join(', ')}`);

    try {
      // Use health-check command to validate services
      const success = await this.executeDataCliCommand('health-check', [], { timeout: 10000 });
      return success;
    } catch (error) {
      this.logger.error('Dependency validation failed', { 
        dependencies, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Reset data to a specific state
   * @param {string} state - Reset state (clean, fresh, minimal, etc.)
   * @param {Object} options - Reset options
   * @returns {Promise<boolean>} True if reset was successful
   */
  async resetData(state = 'clean', options = {}) {
    this.logger.info(`Resetting data to state: ${state}`);

    try {
      const success = await this.executeDataCliCommand('reset-data', [state], options);
      
      if (success) {
        this.logger.success(`Data reset to '${state}' state successfully`);
        return true;
      } else {
        throw new Error(`Data reset to '${state}' state failed`);
      }
    } catch (error) {
      this.logger.error(`Failed to reset data to '${state}' state`, { error: error.message });
      throw error;
    }
  }
}

// Re-export DataSeedingError for testing
export { DataSeedingError };