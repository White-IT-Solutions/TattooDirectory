/**
 * Config - Configuration management utility
 * 
 * Handles loading and managing configuration files for test suites,
 * data scenarios, and service endpoints with environment variable overrides
 * and workspace detection.
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { Logger } from './logger.js';

export class Config {
  constructor() {
    this.logger = new Logger();
    this.workspaceRoot = this.detectWorkspaceRoot();
    this.configDir = this.resolveConfigDir();
    this.cache = new Map();
    this.environmentConfig = this.loadEnvironmentConfig();
  }

  /**
   * Resolve config directory path
   * @returns {string} Path to config directory
   */
  resolveConfigDir() {
    const currentDir = process.cwd();
    
    // If we're in the unified-test-cli directory, use relative config path
    if (currentDir.endsWith('unified-test-cli') || currentDir.includes('unified-test-cli')) {
      const localConfigDir = path.join(currentDir, 'config');
      if (existsSync(localConfigDir)) {
        return localConfigDir;
      }
    }
    
    // Otherwise, use workspace root + scripts/unified-test-cli/config
    return path.join(this.workspaceRoot, 'scripts/unified-test-cli/config');
  }

  /**
   * Detect workspace root directory
   * @returns {string} Path to workspace root
   */
  detectWorkspaceRoot() {
    let currentDir = process.cwd();
    
    // If we're already in the unified-test-cli directory, go up to find workspace root
    if (currentDir.includes('unified-test-cli')) {
      // Go up until we find the workspace root
      while (currentDir !== path.dirname(currentDir)) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (existsSync(packageJsonPath)) {
          try {
            const fs = require('fs');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.workspaces) {
              this.logger.debug(`Detected workspace root: ${currentDir}`);
              return currentDir;
            }
          } catch (error) {
            // Continue searching
          }
        }
        currentDir = path.dirname(currentDir);
      }
    }
    
    // Look for package.json with workspaces property starting from current directory
    currentDir = process.cwd();
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (existsSync(packageJsonPath)) {
        try {
          const fs = require('fs');
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          if (packageJson.workspaces) {
            this.logger.debug(`Detected workspace root: ${currentDir}`);
            return currentDir;
          }
        } catch (error) {
          // Continue searching
        }
      }
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback to current working directory
    this.logger.debug(`Using fallback workspace root: ${process.cwd()}`);
    return process.cwd();
  }

  /**
   * Load environment-specific configuration
   * @returns {Object} Environment configuration
   */
  loadEnvironmentConfig() {
    const config = {
      isCI: this.detectCIEnvironment(),
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      maxParallel: parseInt(process.env.MAX_PARALLEL_TESTS) || 4,
      timeout: parseInt(process.env.TEST_TIMEOUT) || 300000,
      outputFormat: process.env.TEST_OUTPUT_FORMAT || 'console'
    };

    this.logger.debug('Environment configuration loaded', config);
    return config;
  }

  /**
   * Detect if running in CI environment
   * @returns {boolean} True if running in CI
   */
  detectCIEnvironment() {
    const ciIndicators = [
      'CI',
      'CONTINUOUS_INTEGRATION',
      'GITHUB_ACTIONS',
      'JENKINS_URL',
      'BUILDKITE',
      'CIRCLECI',
      'TRAVIS',
      'GITLAB_CI'
    ];

    return ciIndicators.some(indicator => process.env[indicator]);
  }

  /**
   * Get test suite configurations
   * @returns {Promise<Array>} Array of test suite configurations
   */
  async getTestSuites() {
    const cacheKey = 'test-suites';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const configPath = path.join(this.configDir, 'test-suites.json');
      const config = await this.loadJsonConfig(configPath);
      
      if (!Array.isArray(config.testSuites)) {
        throw new Error('Invalid test-suites.json: testSuites must be an array');
      }

      this.cache.set(cacheKey, config.testSuites);
      return config.testSuites;
    } catch (error) {
      this.logger.error('Failed to load test suites configuration', { error: error.message });
      throw error;
    }
  }

  /**
   * Get data scenario configurations
   * @returns {Promise<Object>} Object mapping scenario names to configurations
   */
  async getDataScenarios() {
    const cacheKey = 'data-scenarios';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const configPath = path.join(this.configDir, 'data-scenarios.json');
      const config = await this.loadJsonConfig(configPath);
      
      if (!config.scenarios || typeof config.scenarios !== 'object') {
        throw new Error('Invalid data-scenarios.json: scenarios must be an object');
      }

      this.cache.set(cacheKey, config.scenarios);
      return config.scenarios;
    } catch (error) {
      this.logger.error('Failed to load data scenarios configuration', { error: error.message });
      throw error;
    }
  }

  /**
   * Get service endpoint configurations
   * @returns {Promise<Object>} Object mapping service names to endpoint configurations
   */
  async getServiceEndpoints() {
    const cacheKey = 'service-endpoints';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const configPath = path.join(this.configDir, 'service-endpoints.json');
      const config = await this.loadJsonConfig(configPath);
      
      if (!config.services || typeof config.services !== 'object') {
        throw new Error('Invalid service-endpoints.json: services must be an object');
      }

      // Apply environment variable overrides
      const services = this.applyEnvironmentOverrides(config.services);
      
      this.cache.set(cacheKey, services);
      return services;
    } catch (error) {
      this.logger.error('Failed to load service endpoints configuration', { error: error.message });
      throw error;
    }
  }

  /**
   * Load and parse a JSON configuration file
   * @param {string} configPath - Path to the configuration file
   * @returns {Promise<Object>} Parsed configuration object
   */
  async loadJsonConfig(configPath) {
    if (!existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    try {
      const content = await readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in configuration file ${configPath}: ${error.message}`);
      }
      throw new Error(`Failed to read configuration file ${configPath}: ${error.message}`);
    }
  }

  /**
   * Apply environment variable overrides to service configurations
   * @param {Object} services - Service configurations
   * @returns {Object} Services with environment overrides applied
   */
  applyEnvironmentOverrides(services) {
    const overriddenServices = { ...services };

    // Apply common environment variable patterns
    const envMappings = {
      'LOCALSTACK_ENDPOINT': ['localstack', 'url'],
      'FRONTEND_URL': ['frontend', 'url'],
      'BACKEND_URL': ['backend', 'url'],
      'DYNAMODB_ENDPOINT': ['dynamodb', 'url'],
      'OPENSEARCH_ENDPOINT': ['opensearch', 'url'],
      'S3_ENDPOINT': ['s3', 'url']
    };

    for (const [envVar, [serviceName, property]] of Object.entries(envMappings)) {
      const envValue = process.env[envVar];
      if (envValue && overriddenServices[serviceName]) {
        this.logger.debug(`Applying environment override: ${envVar}=${envValue}`);
        overriddenServices[serviceName] = {
          ...overriddenServices[serviceName],
          [property]: envValue
        };
      }
    }

    // Apply timeout overrides
    const timeoutOverride = process.env.SERVICE_TIMEOUT;
    if (timeoutOverride) {
      const timeout = parseInt(timeoutOverride);
      if (!isNaN(timeout)) {
        Object.keys(overriddenServices).forEach(serviceName => {
          overriddenServices[serviceName].timeout = timeout;
        });
        this.logger.debug(`Applied global timeout override: ${timeout}ms`);
      }
    }

    return overriddenServices;
  }

  /**
   * Get workspace configuration
   * @returns {Promise<Object>} Workspace configuration
   */
  async getWorkspaceConfig() {
    const cacheKey = 'workspace-config';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Load root package.json to get workspace information
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = await this.loadJsonConfig(packageJsonPath);
      
      const workspaceConfig = {
        root: process.cwd(),
        workspaces: packageJson.workspaces || [],
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0'
      };

      this.cache.set(cacheKey, workspaceConfig);
      return workspaceConfig;
    } catch (error) {
      this.logger.error('Failed to load workspace configuration', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache() {
    this.cache.clear();
    this.logger.debug('Configuration cache cleared');
  }

  /**
   * Validate configuration files exist
   * @returns {Promise<Object>} Validation results
   */
  async validateConfigurations() {
    const requiredConfigs = [
      'test-suites.json',
      'data-scenarios.json',
      'service-endpoints.json'
    ];

    const results = {};

    for (const configFile of requiredConfigs) {
      const configPath = path.join(this.configDir, configFile);
      results[configFile] = {
        exists: existsSync(configPath),
        path: configPath
      };

      if (results[configFile].exists) {
        try {
          await this.loadJsonConfig(configPath);
          results[configFile].valid = true;
        } catch (error) {
          results[configFile].valid = false;
          results[configFile].error = error.message;
        }
      } else {
        results[configFile].valid = false;
        results[configFile].error = 'File does not exist';
      }
    }

    return results;
  }

  /**
   * Get configuration file path
   * @param {string} configName - Name of the configuration file
   * @returns {string} Full path to configuration file
   */
  getConfigPath(configName) {
    return path.join(this.configDir, configName);
  }

  /**
   * Get environment configuration
   * @returns {Object} Environment configuration
   */
  getEnvironmentConfig() {
    return { ...this.environmentConfig };
  }

  /**
   * Check if running in CI environment
   * @returns {boolean} True if running in CI
   */
  isCI() {
    return this.environmentConfig.isCI;
  }

  /**
   * Get test suite by name
   * @param {string} suiteName - Name of the test suite
   * @returns {Promise<Object|null>} Test suite configuration or null if not found
   */
  async getTestSuite(suiteName) {
    const suites = await this.getTestSuites();
    return suites.find(suite => suite.name === suiteName) || null;
  }

  /**
   * Get test suites filtered by tags
   * @param {string[]} tags - Tags to filter by
   * @returns {Promise<Array>} Filtered test suites
   */
  async getTestSuitesByTags(tags) {
    const suites = await this.getTestSuites();
    if (!tags || tags.length === 0) {
      return suites;
    }

    return suites.filter(suite => 
      suite.tags && tags.some(tag => suite.tags.includes(tag))
    );
  }

  /**
   * Get critical test suites (for CI execution)
   * @returns {Promise<Array>} Critical test suites
   */
  async getCriticalTestSuites() {
    return this.getTestSuitesByTags(['critical']);
  }

  /**
   * Get data scenario by name
   * @param {string} scenarioName - Name of the data scenario
   * @returns {Promise<Object|null>} Data scenario configuration or null if not found
   */
  async getDataScenario(scenarioName) {
    const scenarios = await this.getDataScenarios();
    return scenarios[scenarioName] || null;
  }

  /**
   * Get service endpoint by name
   * @param {string} serviceName - Name of the service
   * @returns {Promise<Object|null>} Service endpoint configuration or null if not found
   */
  async getServiceEndpoint(serviceName) {
    const services = await this.getServiceEndpoints();
    return services[serviceName] || null;
  }

  /**
   * Get output format configuration
   * @returns {string} Output format (console, junit, json)
   */
  getOutputFormat() {
    // Override with command line argument if provided
    const args = process.argv;
    if (args.includes('--junit')) return 'junit';
    if (args.includes('--json')) return 'json';
    
    // Use CI format in CI environment
    if (this.isCI()) return 'junit';
    
    return this.environmentConfig.outputFormat;
  }

  /**
   * Get maximum parallel test execution limit
   * @returns {number} Maximum parallel executions
   */
  getMaxParallel() {
    // Check for command line override
    const args = process.argv;
    const maxParallelIndex = args.findIndex(arg => arg === '--max-parallel');
    if (maxParallelIndex !== -1 && args[maxParallelIndex + 1]) {
      const override = parseInt(args[maxParallelIndex + 1]);
      if (!isNaN(override) && override > 0) {
        return override;
      }
    }

    return this.environmentConfig.maxParallel;
  }

  /**
   * Get test timeout configuration
   * @returns {number} Test timeout in milliseconds
   */
  getTestTimeout() {
    return this.environmentConfig.timeout;
  }

  /**
   * Validate all configuration files and return detailed results
   * @returns {Promise<Object>} Comprehensive validation results
   */
  async validateAllConfigurations() {
    const results = {
      valid: true,
      errors: [],
      warnings: [],
      files: {}
    };

    // Validate configuration files
    const fileValidation = await this.validateConfigurations();
    results.files = fileValidation;

    // Check for invalid files
    Object.entries(fileValidation).forEach(([filename, result]) => {
      if (!result.valid) {
        results.valid = false;
        results.errors.push(`${filename}: ${result.error}`);
      }
    });

    // Validate workspace structure
    try {
      const workspaceConfig = await this.getWorkspaceConfig();
      if (!workspaceConfig.workspaces || workspaceConfig.workspaces.length === 0) {
        results.warnings.push('No workspaces defined in package.json');
      }
    } catch (error) {
      results.valid = false;
      results.errors.push(`Workspace validation failed: ${error.message}`);
    }

    // Validate test suites reference valid workspaces
    try {
      const testSuites = await this.getTestSuites();
      const workspaceConfig = await this.getWorkspaceConfig();
      const validWorkspaces = ['tests/integration', 'tests/e2e', 'tests/security', 'tests/performance', 'tests/contracts', ...workspaceConfig.workspaces];

      testSuites.forEach(suite => {
        if (suite.workspace && !validWorkspaces.includes(suite.workspace)) {
          results.warnings.push(`Test suite '${suite.name}' references unknown workspace '${suite.workspace}'`);
        }
      });
    } catch (error) {
      results.errors.push(`Test suite validation failed: ${error.message}`);
    }

    // Validate data scenarios reference valid commands
    try {
      const scenarios = await this.getDataScenarios();
      Object.entries(scenarios).forEach(([name, scenario]) => {
        if (!scenario.command) {
          results.errors.push(`Data scenario '${name}' missing command`);
        }
        if (!scenario.dependencies || !Array.isArray(scenario.dependencies)) {
          results.warnings.push(`Data scenario '${name}' missing or invalid dependencies`);
        }
      });
    } catch (error) {
      results.errors.push(`Data scenario validation failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Reload configuration from files (clear cache)
   */
  async reloadConfiguration() {
    this.clearCache();
    this.environmentConfig = this.loadEnvironmentConfig();
    this.logger.debug('Configuration reloaded');
  }
}