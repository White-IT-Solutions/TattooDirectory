/**
 * TestDiscovery - Discovers and validates test suites
 * 
 * Scans the workspace for test configurations and loads test suite definitions
 * from configuration files and workspace structure.
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

export class TestDiscovery {
  constructor() {
    this.logger = new Logger();
    this.config = new Config();
  }

  /**
   * Discover all available test suites in the workspace
   * @returns {Array} Array of test suite definitions
   */
  async discoverSuites() {
    this.logger.info('Discovering test suites in workspace');

    try {
      // Load test suite definitions from config
      const configSuites = await this.loadConfigSuites();
      
      // Validate each suite exists and is executable
      const validSuites = [];
      for (const suite of configSuites) {
        if (await this.validateSuite(suite)) {
          validSuites.push(suite);
        } else {
          this.logger.warn(`Skipping invalid test suite: ${suite.name}`);
        }
      }

      this.logger.info(`Discovered ${validSuites.length} valid test suites`);
      return validSuites;
    } catch (error) {
      this.logger.error('Failed to discover test suites', { error: error.message });
      throw new Error(`Test suite discovery failed: ${error.message}`);
    }
  }

  /**
   * Load test suite definitions from configuration file
   * @returns {Array} Array of test suite configurations
   */
  async loadConfigSuites() {
    const configPath = path.join(process.cwd(), 'scripts/unified-test-cli/config/test-suites.json');
    
    if (!existsSync(configPath)) {
      throw new Error(`Test suites configuration not found at: ${configPath}`);
    }

    try {
      const configContent = await readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (!Array.isArray(config.testSuites)) {
        throw new Error('Invalid configuration: testSuites must be an array');
      }

      return config.testSuites;
    } catch (error) {
      throw new Error(`Failed to load test suites configuration: ${error.message}`);
    }
  }

  /**
   * Validate that a test suite exists and is executable
   * @param {Object} suite - Test suite definition
   * @returns {boolean} True if suite is valid
   */
  async validateSuite(suite) {
    // Check required fields
    const requiredFields = ['name', 'command'];
    for (const field of requiredFields) {
      if (!suite[field]) {
        this.logger.warn(`Test suite missing required field '${field}': ${suite.name}`);
        return false;
      }
    }

    // Check workspace exists if specified
    if (suite.workspace) {
      const workspacePath = path.join(process.cwd(), suite.workspace);
      if (!existsSync(workspacePath)) {
        this.logger.warn(`Workspace not found for suite '${suite.name}': ${workspacePath}`);
        return false;
      }

      // Check package.json exists in workspace
      const packageJsonPath = path.join(workspacePath, 'package.json');
      if (!existsSync(packageJsonPath)) {
        this.logger.warn(`package.json not found in workspace for suite '${suite.name}': ${packageJsonPath}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get test suite by name
   * @param {string} suiteName - Name of the test suite
   * @returns {Object|null} Test suite definition or null if not found
   */
  async getSuite(suiteName) {
    const suites = await this.discoverSuites();
    return suites.find(suite => suite.name === suiteName) || null;
  }

  /**
   * Get test suites by type
   * @param {string} type - Type of test suites to retrieve
   * @returns {Array} Array of test suites matching the type
   */
  async getSuitesByType(type) {
    const suites = await this.discoverSuites();
    return suites.filter(suite => suite.type === type);
  }

  /**
   * Get test suites by tags
   * @param {Array} tags - Array of tags to match
   * @returns {Array} Array of test suites matching any of the tags
   */
  async getSuitesByTags(tags) {
    const suites = await this.discoverSuites();
    return suites.filter(suite => 
      suite.tags && suite.tags.some(tag => tags.includes(tag))
    );
  }
}