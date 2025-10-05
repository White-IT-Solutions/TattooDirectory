/**
 * Validate Command Handler
 * 
 * Handles the 'validate' command for environment and service validation
 */

import chalk from 'chalk';
import { Logger } from '../../utils/logger.js';

export class ValidateCommand {
  constructor(cli) {
    this.cli = cli;
    this.logger = new Logger();
  }

  /**
   * Execute the validate command
   * @param {Object} options - Command options
   */
  async execute(options) {
    this.logger.info('Executing validate command', { options });

    try {
      // Validate options
      this.validateOptions(options);

      // Execute the CLI validateEnvironment method
      await this.cli.validateEnvironment(options);

      this.logger.success('Validate command completed successfully');
    } catch (error) {
      this.logger.error('Validate command failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate command options
   * @param {Object} options - Command options
   */
  validateOptions(options) {
    // Validate services option
    if (options.services !== undefined) {
      if (typeof options.services !== 'string') {
        throw new Error('services must be a comma-separated string');
      }

      // Validate service names
      const validServices = ['localstack', 'frontend', 'backend'];
      const requestedServices = options.services.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      if (requestedServices.length === 0) {
        throw new Error(`Invalid service names. Valid services: ${validServices.join(', ')}`);
      }
      
      for (const service of requestedServices) {
        if (!validServices.includes(service)) {
          throw new Error(`Invalid service '${service}'. Valid services: ${validServices.join(', ')}`);
        }
      }
    }
  }
}