/**
 * BaseSuite - Base class for all test suite implementations
 * 
 * Provides common functionality and interface for all test suite types.
 * Specific test suites should extend this class and implement required methods.
 */

import { Logger } from '../utils/logger.js';

export class BaseSuite {
  constructor(config) {
    this.config = config;
    this.logger = new Logger();
    this.name = config.name;
    this.displayName = config.displayName || config.name;
    this.description = config.description;
    this.type = config.type;
    this.workspace = config.workspace;
    this.command = config.command;
    this.requiredServices = config.requiredServices || [];
    this.dataScenario = config.dataScenario;
    this.timeout = config.timeout || 60000;
    this.canRunParallel = config.canRunParallel !== false;
    this.tags = config.tags || [];
    this.supportsCoverage = config.supportsCoverage !== false;
  }

  /**
   * Validate that this test suite can be executed
   * @returns {Promise<boolean>} True if suite is valid and executable
   */
  async validate() {
    try {
      // Check required configuration
      if (!this.name || !this.command) {
        this.logger.error(`Invalid suite configuration: missing name or command`);
        return false;
      }

      // Validate workspace if specified
      if (this.workspace) {
        const workspaceValid = await this.validateWorkspace();
        if (!workspaceValid) {
          return false;
        }
      }

      // Allow subclasses to perform additional validation
      return await this.customValidation();
    } catch (error) {
      this.logger.error(`Suite validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate workspace exists and has required files
   * @returns {Promise<boolean>} True if workspace is valid
   */
  async validateWorkspace() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const workspacePath = path.join(process.cwd(), this.workspace);
      await fs.promises.access(workspacePath);
      
      // Check for package.json
      const packageJsonPath = path.join(workspacePath, 'package.json');
      await fs.promises.access(packageJsonPath);
      
      return true;
    } catch (error) {
      this.logger.error(`Workspace validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Custom validation logic for specific test suite types
   * Override in subclasses to add specific validation
   * @returns {Promise<boolean>} True if custom validation passes
   */
  async customValidation() {
    return true;
  }

  /**
   * Get the data scenario required for this test suite
   * @returns {string|null} Required data scenario name
   */
  getRequiredDataScenario() {
    return this.dataScenario;
  }

  /**
   * Get services required for this test suite
   * @returns {Array} Array of required service names
   */
  getRequiredServices() {
    return this.requiredServices;
  }

  /**
   * Check if this suite can run in parallel with others
   * @returns {boolean} True if suite supports parallel execution
   */
  canRunInParallel() {
    return this.canRunParallel;
  }

  /**
   * Get estimated execution time for this suite
   * @returns {number} Estimated time in milliseconds
   */
  getEstimatedDuration() {
    return this.timeout;
  }

  /**
   * Get suite metadata for display purposes
   * @returns {Object} Suite metadata
   */
  getMetadata() {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      type: this.type,
      workspace: this.workspace,
      tags: this.tags,
      canRunParallel: this.canRunParallel,
      supportsCoverage: this.supportsCoverage,
      estimatedDuration: this.getEstimatedDuration(),
      requiredServices: this.requiredServices,
      dataScenario: this.dataScenario
    };
  }

  /**
   * Prepare environment before test execution
   * Override in subclasses for suite-specific preparation
   * @returns {Promise<void>}
   */
  async prepare() {
    this.logger.info(`Preparing test suite: ${this.name}`);
  }

  /**
   * Clean up after test execution
   * Override in subclasses for suite-specific cleanup
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.logger.info(`Cleaning up test suite: ${this.name}`);
  }

  /**
   * Transform command arguments based on options
   * Override in subclasses for suite-specific argument handling
   * @param {Object} options - Execution options
   * @returns {Array} Array of command arguments
   */
  transformCommandArgs(options = {}) {
    const [cmd, ...args] = this.command.split(' ');
    
    // Add coverage if supported and requested
    if (options.coverage && this.supportsCoverage) {
      args.push('--coverage');
    }

    // Add CI mode flags if in CI
    if (options.ci) {
      args.push('--ci');
      args.push('--watchAll=false');
    }

    return [cmd, ...args];
  }

  /**
   * Parse test results from command output
   * Override in subclasses for suite-specific result parsing
   * @param {string} stdout - Command stdout
   * @param {string} stderr - Command stderr
   * @param {number} exitCode - Command exit code
   * @returns {Object} Parsed test results
   */
  parseResults(stdout, stderr, exitCode) {
    return {
      exitCode,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
      coverage: null,
      errors: exitCode !== 0 ? [{ message: 'Test execution failed', stderr }] : []
    };
  }

  /**
   * Get suite configuration as JSON
   * @returns {Object} Suite configuration
   */
  toJSON() {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      type: this.type,
      workspace: this.workspace,
      command: this.command,
      requiredServices: this.requiredServices,
      dataScenario: this.dataScenario,
      timeout: this.timeout,
      canRunParallel: this.canRunParallel,
      tags: this.tags,
      supportsCoverage: this.supportsCoverage
    };
  }
}