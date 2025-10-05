/**
 * Run Command Handler
 * 
 * Handles the 'run' command for executing test suites
 */

import chalk from 'chalk';
import { Logger } from '../../utils/logger.js';

export class RunCommand {
  constructor(cli) {
    this.cli = cli;
    this.logger = new Logger();
  }

  /**
   * Execute the run command
   * @param {string} suite - Test suite name (optional)
   * @param {Object} options - Command options
   */
  async execute(suite, options) {
    // Set up logger with verbose mode if requested
    if (options.verbose) {
      this.logger.setLevel('debug');
    }

    this.logger.info('Executing run command');

    try {
      // Validate options
      this.validateOptions(options);

      // Execute the CLI run method
      await this.cli.run(suite, options);

      this.logger.success('Run command completed successfully');
    } catch (error) {
      this.logger.error('Run command failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate command options
   * @param {Object} options - Command options
   */
  validateOptions(options) {
    // Validate max-parallel option
    if (options.maxParallel) {
      const maxParallel = parseInt(options.maxParallel, 10);
      // Check if the original string is a valid integer (no decimals)
      if (isNaN(maxParallel) || maxParallel < 1 || maxParallel > 10 || 
          options.maxParallel.toString() !== maxParallel.toString()) {
        throw new Error('max-parallel must be a number between 1 and 10');
      }
      options.maxParallel = maxParallel;
    }

    // Validate scenario option
    if (options.scenario && typeof options.scenario !== 'string') {
      throw new Error('scenario must be a string');
    }

    // Validate output directory
    if (options.outputDir && typeof options.outputDir !== 'string') {
      throw new Error('output-dir must be a string');
    }

    // Convert string boolean options to actual booleans
    const booleanOptions = [
      'parallel', 'ci', 'coverage', 'report', 
      'junit', 'json', 'quiet', 'verbose'
    ];
    booleanOptions.forEach(option => {
      if (options[option] !== undefined && typeof options[option] !== 'boolean') {
        // Handle string 'false' and falsy values
        if (options[option] === 'false' || options[option] === '0' || options[option] === 0) {
          options[option] = false;
        } else {
          options[option] = Boolean(options[option]);
        }
      }
    });

    // Validate conflicting options
    if (options.quiet && options.verbose) {
      throw new Error('Cannot use both --quiet and --verbose options');
    }
  }
}