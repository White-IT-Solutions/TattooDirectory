/**
 * DataManager - Manages test data scenarios and seeding
 * 
 * Handles automatic data seeding for different test scenarios using
 * the existing data-cli.js infrastructure.
 */

import { spawn } from 'child_process';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

export class DataManager {
  constructor() {
    this.logger = new Logger();
    this.config = new Config();
  }

  /**
   * Seed data scenario for a test suite
   * @param {string} scenarioName - Name of the data scenario to seed
   * @returns {Promise<boolean>} True if seeding was successful
   */
  async seedScenario(scenarioName) {
    if (!scenarioName) {
      this.logger.info('No data scenario specified, skipping seeding');
      return true;
    }

    this.logger.info(`Seeding data scenario: ${scenarioName}`);

    try {
      const scenarios = await this.config.getDataScenarios();
      const scenario = scenarios[scenarioName];
      
      if (!scenario) {
        throw new Error(`Data scenario '${scenarioName}' not found in configuration`);
      }

      // Execute the seeding command
      const success = await this.executeCommand(scenario.command, scenario.estimatedTime || 30000);
      
      if (success) {
        this.logger.success(`Data scenario '${scenarioName}' seeded successfully`);
        return true;
      } else {
        throw new Error(`Data seeding command failed for scenario '${scenarioName}'`);
      }
    } catch (error) {
      this.logger.error(`Failed to seed data scenario '${scenarioName}'`, { error: error.message });
      throw new Error(`Data seeding failed: ${error.message}`);
    }
  }

  /**
   * Get the required data scenario for a test suite
   * @param {Object} testSuite - Test suite definition
   * @returns {string|null} Required scenario name or null if none needed
   */
  async getRequiredScenario(testSuite) {
    // Check if suite explicitly specifies a data scenario
    if (testSuite.dataScenario) {
      return testSuite.dataScenario;
    }

    // Map test suite types to default scenarios
    const defaultScenarios = {
      'e2e': 'frontend-ready',
      'integration': 'minimal',
      'performance': 'performance-test',
      'security': 'minimal'
    };

    return defaultScenarios[testSuite.type] || null;
  }

  /**
   * Clean up test data after test execution
   * @param {string} scenarioName - Name of the scenario to clean up
   * @returns {Promise<boolean>} True if cleanup was successful
   */
  async cleanupScenario(scenarioName) {
    if (!scenarioName) {
      return true;
    }

    this.logger.info(`Cleaning up data scenario: ${scenarioName}`);

    try {
      const scenarios = await this.config.getDataScenarios();
      const scenario = scenarios[scenarioName];
      
      if (!scenario || !scenario.cleanup) {
        this.logger.info(`No cleanup command specified for scenario '${scenarioName}'`);
        return true;
      }

      const success = await this.executeCommand(scenario.cleanup, 15000);
      
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
   * Execute a command with timeout and proper error handling
   * @param {string} command - Command to execute
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} True if command executed successfully
   */
  async executeCommand(command, timeout = 30000) {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Executing command: ${command}`);

      // Parse command and arguments
      const [cmd, ...args] = command.split(' ');
      
      // Set working directory to project root
      const cwd = process.cwd();
      
      const childProcess = spawn(cmd, args, {
        cwd,
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
        reject(new Error(`Command timed out after ${timeout}ms`));
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
}