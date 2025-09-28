/**
 * Logging utility for documentation processing
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

/**
 * Logger class with different log levels and output options
 */
class Logger {
  constructor(config = {}) {
    this.level = config.level || 'info';
    this.outputFile = config.outputFile;
    this.includeTimestamp = config.includeTimestamp !== false;
    this.colorize = config.colorize !== false;
    
    // Log levels in order of severity
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    this.currentLevel = this.levels[this.level] || 1;
    
    // Ensure log directory exists if outputFile is specified
    if (this.outputFile) {
      fs.ensureDirSync(path.dirname(this.outputFile));
    }
  }

  /**
   * Format log message with timestamp and level
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {boolean} colorize - Whether to colorize output
   * @returns {string} Formatted message
   */
  formatMessage(level, message, colorize = true) {
    let formatted = '';
    
    if (this.includeTimestamp) {
      const timestamp = new Date().toISOString();
      formatted += `[${timestamp}] `;
    }
    
    formatted += `${level.toUpperCase()}: ${message}`;
    
    if (colorize && this.colorize) {
      switch (level) {
        case 'debug':
          return chalk.gray(formatted);
        case 'info':
          return chalk.blue(formatted);
        case 'warn':
          return chalk.yellow(formatted);
        case 'error':
          return chalk.red(formatted);
        default:
          return formatted;
      }
    }
    
    return formatted;
  }

  /**
   * Write log message to file if configured
   * @param {string} message - Formatted message
   */
  async writeToFile(message) {
    if (this.outputFile) {
      try {
        await fs.appendFile(this.outputFile, message + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error.message);
      }
    }
  }

  /**
   * Log a message at the specified level
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  async log(level, message, ...args) {
    if (this.levels[level] < this.currentLevel) {
      return; // Skip if below current log level
    }
    
    const fullMessage = args.length > 0 ? `${message} ${args.join(' ')}` : message;
    const formattedMessage = this.formatMessage(level, fullMessage);
    const fileMessage = this.formatMessage(level, fullMessage, false);
    
    // Output to console
    console.log(formattedMessage);
    
    // Write to file if configured
    await this.writeToFile(fileMessage);
  }

  /**
   * Log debug message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  async debug(message, ...args) {
    await this.log('debug', message, ...args);
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  async info(message, ...args) {
    await this.log('info', message, ...args);
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  async warn(message, ...args) {
    await this.log('warn', message, ...args);
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {...any} args - Additional arguments
   */
  async error(message, ...args) {
    await this.log('error', message, ...args);
  }

  /**
   * Create a child logger with additional context
   * @param {string} context - Context for child logger
   * @returns {Logger} Child logger instance
   */
  child(context) {
    const childLogger = new Logger({
      level: this.level,
      outputFile: this.outputFile,
      includeTimestamp: this.includeTimestamp,
      colorize: this.colorize
    });
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = async (level, message, ...args) => {
      const contextMessage = `[${context}] ${message}`;
      return originalLog(level, contextMessage, ...args);
    };
    
    return childLogger;
  }
}

module.exports = Logger;