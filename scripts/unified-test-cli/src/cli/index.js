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

const program = new Command();
const cli = new UnifiedTestCLI();

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
  .action(async (suite, options) => {
    try {
      await cli.run(suite, options);
    } catch (error) {
      console.error(chalk.red('❌ CLI execution failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all available test suites')
  .option('--json', 'output in JSON format')
  .action(async (options) => {
    try {
      await cli.listSuites(options);
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
      await cli.validateEnvironment(options);
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

// Parse command line arguments
program.parse();