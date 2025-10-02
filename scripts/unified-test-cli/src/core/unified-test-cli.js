/**
 * UnifiedTestCLI - Main CLI orchestrator class
 * 
 * Coordinates test discovery, environment validation, data management,
 * and test execution across all test suites.
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { TestDiscovery } from './test-discovery.js';
import { ServiceValidator } from './service-validator.js';
import { DataManager } from './data-manager.js';
import { TestExecutor } from './test-executor.js';
import { ParallelExecutor } from '../utils/parallel-executor.js';
import { Logger } from '../utils/logger.js';

export class UnifiedTestCLI {
  constructor() {
    this.testDiscovery = new TestDiscovery();
    this.serviceValidator = new ServiceValidator();
    this.dataManager = new DataManager();
    this.testExecutor = new TestExecutor();
    this.parallelExecutor = new ParallelExecutor();
    this.logger = new Logger();
  }

  /**
   * Main CLI execution method
   * @param {string} suiteName - Optional test suite name
   * @param {Object} options - CLI options
   */
  async run(suiteName, options = {}) {
    this.logger.info('Starting Unified Test CLI', { suiteName, options });

    try {
      // Discover available test suites
      const availableSuites = await this.testDiscovery.discoverSuites();
      
      if (availableSuites.length === 0) {
        throw new Error('No test suites found in the workspace');
      }

      // Determine which suite(s) to run
      let suitesToRun;
      if (suiteName) {
        const suite = availableSuites.find(s => s.name === suiteName);
        if (!suite) {
          throw new Error(`Test suite '${suiteName}' not found`);
        }
        suitesToRun = [suite];
      } else if (options.ci) {
        // In CI mode, run all critical suites
        suitesToRun = availableSuites.filter(s => s.tags?.includes('critical'));
      } else {
        // Interactive mode - show menu
        suitesToRun = await this.showInteractiveMenu(availableSuites);
      }

      // Execute the selected test suites
      if (options.parallel && suitesToRun.length > 1) {
        await this.parallelExecutor.executeParallel(suitesToRun, {
          maxConcurrency: parseInt(options.maxParallel) || 3,
          scenario: options.scenario,
          coverage: options.coverage
        });
      } else {
        for (const suite of suitesToRun) {
          await this.testExecutor.executeSuite(suite, {
            scenario: options.scenario,
            coverage: options.coverage,
            ci: options.ci
          });
        }
      }

      this.logger.success('All test suites completed successfully');
    } catch (error) {
      this.logger.error('CLI execution failed', { error: error.message });
      throw error;
    }
  }

  /**
   * List all available test suites
   * @param {Object} options - List options
   */
  async listSuites(options = {}) {
    try {
      const suites = await this.testDiscovery.discoverSuites();
      
      if (options.json) {
        console.log(JSON.stringify(suites, null, 2));
      } else {
        console.log(chalk.blue('\n📋 Available Test Suites:\n'));
        suites.forEach(suite => {
          console.log(`${chalk.green('•')} ${chalk.bold(suite.displayName || suite.name)}`);
          console.log(`  ${chalk.gray(suite.description || 'No description available')}`);
          console.log(`  ${chalk.cyan('Type:')} ${suite.type || 'unknown'}`);
          console.log(`  ${chalk.cyan('Workspace:')} ${suite.workspace || 'root'}`);
          if (suite.tags?.length > 0) {
            console.log(`  ${chalk.cyan('Tags:')} ${suite.tags.join(', ')}`);
          }
          console.log();
        });
      }
    } catch (error) {
      this.logger.error('Failed to list test suites', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate environment and services
   * @param {Object} options - Validation options
   */
  async validateEnvironment(options = {}) {
    try {
      const services = options.services ? options.services.split(',') : null;
      const results = await this.serviceValidator.validateEnvironment(services);
      
      console.log(chalk.blue('\n🔍 Environment Validation Results:\n'));
      
      for (const [service, result] of Object.entries(results)) {
        if (result.status === 'healthy') {
          console.log(`${chalk.green('✅')} ${service}: ${chalk.green('Available')}`);
        } else {
          console.log(`${chalk.red('❌')} ${service}: ${chalk.red('Unavailable')}`);
          if (result.suggestions?.length > 0) {
            console.log(`   ${chalk.yellow('Suggestions:')}`);
            result.suggestions.forEach(suggestion => {
              console.log(`   • ${suggestion}`);
            });
          }
        }
      }
      
      const allHealthy = Object.values(results).every(r => r.status === 'healthy');
      if (allHealthy) {
        console.log(chalk.green('\n✅ All services are available and ready for testing'));
      } else {
        console.log(chalk.red('\n❌ Some services are not available. Please address the issues above.'));
        process.exit(1);
      }
    } catch (error) {
      this.logger.error('Environment validation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Show interactive menu for test suite selection
   * @param {Array} availableSuites - Available test suites
   * @returns {Array} Selected test suites
   */
  async showInteractiveMenu(availableSuites) {
    const choices = availableSuites.map(suite => ({
      name: `${suite.displayName || suite.name} - ${suite.description || 'No description'}`,
      value: suite,
      short: suite.name
    }));

    choices.push(
      { name: '─'.repeat(50), disabled: true },
      { name: 'Run all suites', value: 'all' },
      { name: 'Run critical suites only', value: 'critical' }
    );

    const { selectedSuites } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSuites',
        message: 'Select test suites to run:',
        choices,
        validate: (input) => {
          if (input.length === 0) {
            return 'Please select at least one test suite';
          }
          return true;
        }
      }
    ]);

    // Handle special selections
    if (selectedSuites.includes('all')) {
      return availableSuites;
    }
    if (selectedSuites.includes('critical')) {
      return availableSuites.filter(s => s.tags?.includes('critical'));
    }

    return selectedSuites.filter(s => typeof s === 'object');
  }
}