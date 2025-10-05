#!/usr/bin/env node

/**
 * Unified Test CLI - Main Entry Point
 * 
 * Provides a single command-line interface for executing all test suites
 * with proper environment validation and data scenario management.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { UnifiedTestCLI } from '../core/unified-test-cli.js';
import { RunCommand, ListCommand, ValidateCommand } from './commands/index.js';

const program = new Command();
const cli = new UnifiedTestCLI();

// Initialize command handlers
const runCommand = new RunCommand(cli);
const listCommand = new ListCommand(cli);
const validateCommand = new ValidateCommand(cli);

program
  .name('unified-test-cli')
  .description('Unified CLI interface for running all test suites')
  .version('1.0.0');

program
  .command('run [suite]')
  .description('Run a specific test suite or show interactive menu')
  .option('-s, --scenario <name>', 'specify data scenario to use')
  .option('-p, --parallel', 'run tests in parallel where possible')
  .option('--max-parallel <number>', 'maximum number of parallel executions', '3')
  .option('--ci', 'run in CI mode (non-interactive)')
  .option('--coverage', 'generate coverage reports')
  .option('--report', 'generate comprehensive test reports')
  .option('--junit', 'generate JUnit XML output')
  .option('--json', 'generate JSON output')
  .option('--quiet', 'suppress console output')
  .option('--verbose', 'enable verbose output')
  .option('--output-dir <dir>', 'specify output directory for reports', './test-results')
  .action(async (suite, options) => {
    try {
      await runCommand.execute(suite, options);
    } catch (error) {
      console.error(chalk.red('❌ CLI execution failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available test suites')
  .option('--json', 'output in JSON format')
  .option('--verbose', 'enable verbose output')
  .action(async (options) => {
    try {
      await listCommand.execute(options);
    } catch (error) {
      console.error(chalk.red('❌ Failed to list test suites:'), error.message);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate environment and service availability')
  .option('--services <services>', 'comma-separated list of services to validate')
  .action(async (options) => {
    try {
      await validateCommand.execute(options);
    } catch (error) {
      console.error(chalk.red('❌ Environment validation failed:'), error.message);
      process.exit(1);
    }
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Add custom error handling for unknown commands
program.on('command:*', function (operands) {
  console.error(chalk.red(`❌ Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('\n💡 Available commands:'));
  console.log(chalk.cyan('  • run') + '      - Run test suites');
  console.log(chalk.cyan('  • list') + '     - List available test suites');
  console.log(chalk.cyan('  • validate') + ' - Validate environment and services');
  console.log(chalk.gray('\nUse --help with any command for more information.'));
  process.exit(1);
});

// Parse command line arguments
program.parse();