/**
 * List Command Handler
 * 
 * Handles the 'list' command for displaying available test suites
 */

import chalk from 'chalk';
import { Logger } from '../../utils/logger.js';

export class ListCommand {
  constructor(cli) {
    this.cli = cli;
    this.logger = new Logger();
  }

  /**
   * Execute the list command
   * @param {Object} options - Command options
   */
  async execute(options) {
    // Set up logger with verbose mode if requested
    if (options.verbose) {
      this.logger.setLevel('debug');
    }

    // Only log if not in JSON mode
    if (!options.json) {
      this.logger.info('Executing list command');
    }

    try {
      // Validate options
      this.validateOptions(options);

      // Execute the CLI listSuites method
      await this.cli.listSuites(options);

      // Only log success if not in JSON mode
      if (!options.json) {
        this.logger.success('List command completed successfully');
      }
    } catch (error) {
      this.logger.error('List command failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate command options
   * @param {Object} options - Command options
   */
  validateOptions(options) {
    // Validate json option
    if (options.json !== undefined && typeof options.json !== 'boolean') {
      options.json = Boolean(options.json);
    }

    // Validate verbose option
    if (options.verbose !== undefined && typeof options.verbose !== 'boolean') {
      options.verbose = Boolean(options.verbose);
    }
  }
}