/**
 * SuiteFactory - Creates test suite instances based on configuration
 * 
 * Factory class that instantiates the appropriate test suite class
 * based on the suite type and configuration.
 */

import { BaseSuite } from '../suites/base-suite.js';
import { BackendUnitSuite } from '../suites/backend-unit.js';
import { FrontendUnitSuite } from '../suites/frontend-unit.js';
import { IntegrationSuite } from '../suites/integration.js';
import { E2ESuite } from '../suites/e2e.js';
import { Logger } from '../utils/logger.js';

export class SuiteFactory {
  constructor() {
    this.logger = new Logger();
    this.suiteClasses = new Map([
      ['backend-unit', BackendUnitSuite],
      ['frontend-unit', FrontendUnitSuite],
      ['integration', IntegrationSuite],
      ['e2e', E2ESuite],
      // Add other suite types as they are implemented
      // ['security', SecuritySuite],
      // ['performance', PerformanceSuite],
      // ['contract', ContractSuite]
    ]);
  }

  /**
   * Create a test suite instance from configuration
   * @param {Object} config - Test suite configuration
   * @returns {BaseSuite} Test suite instance
   */
  createSuite(config) {
    try {
      if (!config) {
        throw new Error('Suite configuration is required');
      }
      
      // Get the appropriate suite class
      const SuiteClass = this.getSuiteClass(config);
      
      // Create and return the suite instance
      const suite = new SuiteClass(config);
      
      this.logger.debug(`Created suite instance: ${config.name}`, { 
        type: config.type, 
        class: SuiteClass.name 
      });
      
      return suite;
    } catch (error) {
      const suiteName = config?.name || 'unknown';
      this.logger.error(`Failed to create suite: ${suiteName}`, { error: error.message });
      throw new Error(`Suite creation failed: ${error.message}`);
    }
  }

  /**
   * Get the appropriate suite class for a configuration
   * @param {Object} config - Test suite configuration
   * @returns {Function} Suite class constructor
   */
  getSuiteClass(config) {
    // First try to match by exact name
    if (this.suiteClasses.has(config.name)) {
      return this.suiteClasses.get(config.name);
    }

    // Then try to match by type patterns
    const typePatterns = [
      { pattern: /backend.*unit/i, class: BackendUnitSuite },
      { pattern: /frontend.*unit/i, class: FrontendUnitSuite },
      { pattern: /integration/i, class: IntegrationSuite },
      // Add more patterns as needed
    ];

    for (const { pattern, class: SuiteClass } of typePatterns) {
      if (pattern.test(config.name) || pattern.test(config.type)) {
        return SuiteClass;
      }
    }

    // Fall back to base suite for unknown types
    this.logger.warn(`No specific suite class found for ${config.name}, using BaseSuite`);
    return BaseSuite;
  }

  /**
   * Register a new suite class
   * @param {string} name - Suite name or pattern
   * @param {Function} SuiteClass - Suite class constructor
   */
  registerSuite(name, SuiteClass) {
    if (typeof SuiteClass !== 'function') {
      throw new Error('Suite class must be a constructor function');
    }

    this.suiteClasses.set(name, SuiteClass);
    this.logger.debug(`Registered suite class: ${name}`, { class: SuiteClass.name });
  }

  /**
   * Get all registered suite types
   * @returns {Array} Array of registered suite names
   */
  getRegisteredSuites() {
    return Array.from(this.suiteClasses.keys());
  }

  /**
   * Check if a suite type is registered
   * @param {string} name - Suite name to check
   * @returns {boolean} True if suite is registered
   */
  isSuiteRegistered(name) {
    return this.suiteClasses.has(name);
  }
}