/**
 * Interactive Menu System
 * 
 * Provides interactive test suite selection and configuration
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { Logger } from '../utils/logger.js';

export class InteractiveMenu {
  constructor() {
    this.logger = new Logger();
  }

  /**
   * Show main test suite selection menu
   * @param {Array} availableSuites - Available test suites
   * @returns {Array} Selected test suites
   */
  async showSuiteSelectionMenu(availableSuites) {
    if (!availableSuites || availableSuites.length === 0) {
      throw new Error('No test suites available');
    }

    console.log(chalk.blue('\n🧪 Unified Test CLI - Test Suite Selection\n'));

    // Create choices for individual suites
    const suiteChoices = availableSuites.map(suite => ({
      name: this.formatSuiteChoice(suite),
      value: suite,
      short: suite.name
    }));

    // Add separator and bulk options
    const choices = [
      ...suiteChoices,
      new inquirer.Separator('─'.repeat(60)),
      {
        name: chalk.green('🚀 Run all suites'),
        value: 'all',
        short: 'all'
      },
      {
        name: chalk.yellow('⚡ Run critical suites only'),
        value: 'critical',
        short: 'critical'
      },
      {
        name: chalk.cyan('🏃 Run fast suites only'),
        value: 'fast',
        short: 'fast'
      }
    ];

    const { selectedSuites } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedSuites',
        message: 'Select test suites to run:',
        choices,
        pageSize: 15,
        validate: (input) => {
          if (input.length === 0) {
            return 'Please select at least one test suite or option';
          }
          return true;
        }
      }
    ]);

    return this.processSuiteSelection(selectedSuites, availableSuites);
  }

  /**
   * Show execution options menu
   * @param {Array} selectedSuites - Selected test suites
   * @returns {Object} Execution options
   */
  async showExecutionOptionsMenu(selectedSuites) {
    console.log(chalk.blue('\n⚙️  Execution Options\n'));

    const questions = [];

    // Ask about parallel execution if multiple suites selected
    if (selectedSuites.length > 1) {
      const parallelCapableSuites = selectedSuites.filter(s => s.canRunParallel);
      if (parallelCapableSuites.length > 1) {
        questions.push({
          type: 'confirm',
          name: 'parallel',
          message: 'Run compatible suites in parallel?',
          default: true
        });

        questions.push({
          type: 'input',
          name: 'maxParallel',
          message: 'Maximum parallel executions:',
          default: '3',
          when: (answers) => answers.parallel,
          validate: (input) => {
            const num = parseInt(input, 10);
            if (isNaN(num) || num < 1 || num > 10) {
              return 'Please enter a number between 1 and 10';
            }
            return true;
          }
        });
      }
    }

    // Ask about coverage if any suite supports it
    const coverageCapableSuites = selectedSuites.filter(s => s.supportsCoverage);
    if (coverageCapableSuites.length > 0) {
      questions.push({
        type: 'confirm',
        name: 'coverage',
        message: 'Generate coverage reports?',
        default: false
      });
    }

    // Ask about data scenario if any suite requires it
    const suitesWithScenarios = selectedSuites.filter(s => s.dataScenario);
    if (suitesWithScenarios.length > 0) {
      const scenarios = [...new Set(suitesWithScenarios.map(s => s.dataScenario))];
      if (scenarios.length > 1) {
        questions.push({
          type: 'list',
          name: 'scenario',
          message: 'Select data scenario:',
          choices: [
            { name: 'Use default scenarios for each suite', value: null },
            ...scenarios.map(scenario => ({ name: scenario, value: scenario }))
          ],
          default: null
        });
      }
    }

    // Only ask about reporting if there are other applicable options
    const hasApplicableOptions = questions.length > 0 || 
                                 selectedSuites.length > 1 || 
                                 coverageCapableSuites.length > 0 || 
                                 suitesWithScenarios.length > 0;

    if (hasApplicableOptions) {
      questions.push({
        type: 'confirm',
        name: 'report',
        message: 'Generate comprehensive test reports?',
        default: false
      });
    }

    if (questions.length === 0) {
      return {};
    }

    const options = await inquirer.prompt(questions);

    // Convert maxParallel to number
    if (options.maxParallel) {
      options.maxParallel = parseInt(options.maxParallel, 10);
    }

    return options;
  }

  /**
   * Show confirmation menu before execution
   * @param {Array} selectedSuites - Selected test suites
   * @param {Object} options - Execution options
   * @returns {boolean} Whether to proceed
   */
  async showConfirmationMenu(selectedSuites, options) {
    console.log(chalk.blue('\n📋 Execution Summary\n'));

    // Display selected suites
    console.log(chalk.bold('Selected Test Suites:'));
    selectedSuites.forEach(suite => {
      console.log(`  ${chalk.green('•')} ${suite.displayName || suite.name}`);
    });

    // Display execution options
    if (Object.keys(options).length > 0) {
      console.log(chalk.bold('\nExecution Options:'));
      if (options.parallel) {
        console.log(`  ${chalk.cyan('•')} Parallel execution: ${options.maxParallel || 3} max`);
      }
      if (options.coverage) {
        console.log(`  ${chalk.cyan('•')} Coverage reports: enabled`);
      }
      if (options.scenario) {
        console.log(`  ${chalk.cyan('•')} Data scenario: ${options.scenario}`);
      }
      if (options.report) {
        console.log(`  ${chalk.cyan('•')} Comprehensive reports: enabled`);
      }
    }

    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: '\nProceed with test execution?',
        default: true
      }
    ]);

    return proceed;
  }

  /**
   * Format suite choice for display
   * @param {Object} suite - Test suite object
   * @returns {string} Formatted choice text
   */
  formatSuiteChoice(suite) {
    const name = suite.displayName || suite.name;
    const description = suite.description || 'No description';
    const tags = suite.tags ? ` [${suite.tags.join(', ')}]` : '';
    
    let icon = '🧪';
    if (suite.type === 'unit') icon = '⚡';
    else if (suite.type === 'integration') icon = '🔗';
    else if (suite.type === 'e2e') icon = '🎭';
    else if (suite.type === 'security') icon = '🔒';
    else if (suite.type === 'performance') icon = '🚀';
    else if (suite.type === 'contract') icon = '📋';

    return `${icon} ${chalk.bold(name)} - ${chalk.gray(description)}${chalk.dim(tags)}`;
  }

  /**
   * Process suite selection and handle bulk options
   * @param {Array} selectedSuites - Raw selected values
   * @param {Array} availableSuites - All available suites
   * @returns {Array} Processed suite selection
   */
  processSuiteSelection(selectedSuites, availableSuites) {
    // Handle bulk selections
    if (selectedSuites.includes('all')) {
      return availableSuites;
    }

    if (selectedSuites.includes('critical')) {
      return availableSuites.filter(s => s.tags?.includes('critical'));
    }

    if (selectedSuites.includes('fast')) {
      return availableSuites.filter(s => s.tags?.includes('fast'));
    }

    // Filter out bulk options and return individual suites
    return selectedSuites.filter(s => typeof s === 'object');
  }

  /**
   * Show error menu with retry option
   * @param {Error} error - The error that occurred
   * @returns {boolean} Whether to retry
   */
  async showErrorMenu(error) {
    console.log(chalk.red(`\n❌ Error: ${error.message}\n`));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Retry', value: 'retry' },
          { name: 'Exit', value: 'exit' }
        ],
        default: 'retry'
      }
    ]);

    return action === 'retry';
  }
}