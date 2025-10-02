/**
 * Logger - Structured logging utility
 * 
 * Provides consistent logging across the CLI with different log levels
 * and structured output formatting.
 */

import chalk from 'chalk';

export class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.silent = options.silent || false;
    this.prefix = options.prefix || '';
    
    // Define log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.currentLevel = this.levels[this.level] || this.levels.info;
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      const timestamp = new Date().toISOString();
      const prefix = this.prefix ? `[${this.prefix}] ` : '';
      
      console.error(chalk.red(`❌ ${prefix}${message}`));
      
      if (meta && Object.keys(meta).length > 0) {
        console.error(chalk.gray(JSON.stringify(meta, null, 2)));
      }
      
      // Log to structured format if in CI
      if (process.env.CI) {
        console.error(JSON.stringify({
          level: 'error',
          timestamp,
          message,
          meta,
          prefix: this.prefix
        }));
      }
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      const timestamp = new Date().toISOString();
      const prefix = this.prefix ? `[${this.prefix}] ` : '';
      
      console.warn(chalk.yellow(`⚠️  ${prefix}${message}`));
      
      if (meta && Object.keys(meta).length > 0) {
        console.warn(chalk.gray(JSON.stringify(meta, null, 2)));
      }
      
      if (process.env.CI) {
        console.warn(JSON.stringify({
          level: 'warn',
          timestamp,
          message,
          meta,
          prefix: this.prefix
        }));
      }
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      const timestamp = new Date().toISOString();
      const prefix = this.prefix ? `[${this.prefix}] ` : '';
      
      console.log(chalk.blue(`ℹ️  ${prefix}${message}`));
      
      if (meta && Object.keys(meta).length > 0) {
        console.log(chalk.gray(JSON.stringify(meta, null, 2)));
      }
      
      if (process.env.CI) {
        console.log(JSON.stringify({
          level: 'info',
          timestamp,
          message,
          meta,
          prefix: this.prefix
        }));
      }
    }
  }

  /**
   * Log a success message
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   */
  success(message, meta = {}) {
    if (this.shouldLog('info')) {
      const timestamp = new Date().toISOString();
      const prefix = this.prefix ? `[${this.prefix}] ` : '';
      
      console.log(chalk.green(`✅ ${prefix}${message}`));
      
      if (meta && Object.keys(meta).length > 0) {
        console.log(chalk.gray(JSON.stringify(meta, null, 2)));
      }
      
      if (process.env.CI) {
        console.log(JSON.stringify({
          level: 'success',
          timestamp,
          message,
          meta,
          prefix: this.prefix
        }));
      }
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      const timestamp = new Date().toISOString();
      const prefix = this.prefix ? `[${this.prefix}] ` : '';
      
      console.log(chalk.gray(`🔍 ${prefix}${message}`));
      
      if (meta && Object.keys(meta).length > 0) {
        console.log(chalk.gray(JSON.stringify(meta, null, 2)));
      }
      
      if (process.env.CI) {
        console.log(JSON.stringify({
          level: 'debug',
          timestamp,
          message,
          meta,
          prefix: this.prefix
        }));
      }
    }
  }

  /**
   * Check if a message should be logged based on current log level
   * @param {string} level - Log level to check
   * @returns {boolean} True if message should be logged
   */
  shouldLog(level) {
    if (this.silent) {
      return false;
    }
    
    const messageLevel = this.levels[level];
    return messageLevel !== undefined && messageLevel <= this.currentLevel;
  }

  /**
   * Create a child logger with a prefix
   * @param {string} prefix - Prefix for child logger
   * @returns {Logger} New logger instance with prefix
   */
  child(prefix) {
    return new Logger({
      level: this.level,
      silent: this.silent,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix
    });
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
      this.currentLevel = this.levels[level];
    }
  }

  /**
   * Enable or disable silent mode
   * @param {boolean} silent - Whether to enable silent mode
   */
  setSilent(silent) {
    this.silent = silent;
  }
}