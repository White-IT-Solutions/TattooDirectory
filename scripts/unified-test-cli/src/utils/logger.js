/**
 * Logger - Enhanced structured logging utility
 * 
 * Provides consistent logging across the CLI with different log levels,
 * structured output formatting, and comprehensive error handling integration.
 */

import chalk from 'chalk';
import { CLIError } from './errors.js';

class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.silent = options.silent || false;
    this.prefix = options.prefix || '';
    this.context = options.context || {};
    this.enableStructuredLogging = options.structured || process.env.CI === 'true';
    this.logFile = options.logFile || null;
    
    // Define log levels
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.currentLevel = this.levels[this.level] || this.levels.info;
    
    // Initialize log buffer for structured logging
    this.logBuffer = [];
    this.maxBufferSize = options.maxBufferSize || 1000;
  }

  /**
   * Log an error message or CLIError instance
   * @param {string|Error|CLIError} message - Error message or error instance
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      const logEntry = this.createLogEntry('error', message, meta);
      
      // Handle CLIError instances specially
      if (message instanceof CLIError) {
        this.logCLIError(message);
      } else if (message instanceof Error) {
        this.logStandardError(message, meta);
      } else {
        this.logMessage('error', message, meta, '❌', chalk.red);
      }
      
      this.addToBuffer(logEntry);
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log a CLIError with full context and suggestions
   * @param {CLIError} error - CLI error instance
   */
  logCLIError(error) {
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    
    // Main error message
    console.error(chalk.red(`❌ ${prefix}${error.message}`));
    
    // Error details
    if (error.details && Object.keys(error.details).length > 0) {
      console.error(chalk.gray('   Details:'));
      Object.entries(error.details).forEach(([key, value]) => {
        console.error(chalk.gray(`     ${key}: ${value}`));
      });
    }
    
    // Recovery suggestions
    if (error.suggestions && error.suggestions.length > 0) {
      console.error(chalk.yellow('\n   Suggested solutions:'));
      error.suggestions.forEach((suggestion, index) => {
        console.error(chalk.yellow(`     ${index + 1}. ${suggestion}`));
      });
    }
    
    // Stack trace in debug mode
    if (this.shouldLog('debug') && error.stack) {
      console.error(chalk.gray('\n   Stack trace:'));
      console.error(chalk.gray(error.stack));
    }
  }

  /**
   * Log a standard Error instance
   * @param {Error} error - Standard error instance
   * @param {Object} meta - Additional metadata
   */
  logStandardError(error, meta = {}) {
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    
    console.error(chalk.red(`❌ ${prefix}${error.message}`));
    
    if (meta && Object.keys(meta).length > 0) {
      console.error(chalk.gray('   Context:'));
      console.error(chalk.gray(JSON.stringify(meta, null, 4)));
    }
    
    if (this.shouldLog('debug') && error.stack) {
      console.error(chalk.gray('\n   Stack trace:'));
      console.error(chalk.gray(error.stack));
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      const logEntry = this.createLogEntry('warn', message, meta);
      this.logMessage('warn', message, meta, '⚠️ ', chalk.yellow);
      this.addToBuffer(logEntry);
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      const logEntry = this.createLogEntry('info', message, meta);
      this.logMessage('info', message, meta, 'ℹ️ ', chalk.blue);
      this.addToBuffer(logEntry);
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log a success message
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   */
  success(message, meta = {}) {
    if (this.shouldLog('info')) {
      const logEntry = this.createLogEntry('success', message, meta);
      this.logMessage('success', message, meta, '✅ ', chalk.green);
      this.addToBuffer(logEntry);
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      const logEntry = this.createLogEntry('debug', message, meta);
      this.logMessage('debug', message, meta, '🔍 ', chalk.gray);
      this.addToBuffer(logEntry);
      this.writeToFile(logEntry);
    }
  }

  /**
   * Log a trace message (most verbose level)
   * @param {string} message - Trace message
   * @param {Object} meta - Additional metadata
   */
  trace(message, meta = {}) {
    if (this.shouldLog('trace')) {
      const logEntry = this.createLogEntry('trace', message, meta);
      this.logMessage('trace', message, meta, '🔬 ', chalk.dim);
      this.addToBuffer(logEntry);
      this.writeToFile(logEntry);
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

  /**
   * Create a structured log entry
   * @param {string} level - Log level
   * @param {string|Error} message - Log message or error
   * @param {Object} meta - Additional metadata
   * @returns {Object} Structured log entry
   */
  createLogEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      prefix: this.prefix,
      context: this.context,
      meta: { ...meta }
    };

    if (message instanceof Error) {
      entry.error = {
        name: message.name,
        message: message.message,
        stack: message.stack
      };
      
      if (message instanceof CLIError) {
        entry.error.code = message.code;
        entry.error.details = message.details;
        entry.error.suggestions = message.suggestions;
      }
    } else {
      entry.message = message;
    }

    return entry;
  }

  /**
   * Log a message with consistent formatting
   * @param {string} level - Log level
   * @param {string} message - Message to log
   * @param {Object} meta - Additional metadata
   * @param {string} icon - Icon for the message
   * @param {Function} colorFn - Chalk color function
   */
  logMessage(level, message, meta, icon, colorFn) {
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    
    // Console output
    console.log(colorFn(`${icon}${prefix}${message}`));
    
    // Only show JSON metadata in verbose mode or debug level
    const showMetadata = this.shouldLog('debug') || process.env.VERBOSE === 'true' || process.argv.includes('--verbose');
    
    if (meta && Object.keys(meta).length > 0 && showMetadata) {
      console.log(chalk.gray(JSON.stringify(meta, null, 2)));
    }
    
    // Structured output for CI
    if (this.enableStructuredLogging) {
      const structuredEntry = this.createLogEntry(level, message, meta);
      console.log(JSON.stringify(structuredEntry));
    }
  }

  /**
   * Add log entry to buffer
   * @param {Object} entry - Log entry to add
   */
  addToBuffer(entry) {
    this.logBuffer.push(entry);
    
    // Maintain buffer size limit
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Write log entry to file if configured
   * @param {Object} entry - Log entry to write
   */
  async writeToFile(entry) {
    if (!this.logFile) {
      return;
    }

    try {
      const { promises: fs } = await import('fs');
      const logLine = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      // Avoid infinite recursion by not logging this error
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Get recent log entries from buffer
   * @param {number} count - Number of entries to retrieve
   * @returns {Array} Recent log entries
   */
  getRecentLogs(count = 50) {
    return this.logBuffer.slice(-count);
  }

  /**
   * Get log entries by level
   * @param {string} level - Log level to filter by
   * @returns {Array} Log entries for the specified level
   */
  getLogsByLevel(level) {
    return this.logBuffer.filter(entry => entry.level === level);
  }

  /**
   * Clear the log buffer
   */
  clearBuffer() {
    this.logBuffer = [];
  }

  /**
   * Get log statistics
   * @returns {Object} Log statistics
   */
  getLogStats() {
    const stats = {
      total: this.logBuffer.length,
      byLevel: {}
    };

    this.logBuffer.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export logs to a file
   * @param {string} filePath - Path to export logs to
   * @param {Object} options - Export options
   */
  async exportLogs(filePath, options = {}) {
    const { format = 'json', level = null, since = null } = options;
    
    try {
      const { promises: fs } = await import('fs');
      let logs = this.logBuffer;
      
      // Filter by level if specified
      if (level) {
        logs = logs.filter(entry => entry.level === level);
      }
      
      // Filter by time if specified
      if (since) {
        const sinceTime = new Date(since);
        logs = logs.filter(entry => new Date(entry.timestamp) >= sinceTime);
      }
      
      let content;
      if (format === 'json') {
        content = JSON.stringify(logs, null, 2);
      } else if (format === 'text') {
        content = logs.map(entry => {
          const timestamp = entry.timestamp;
          const level = entry.level.toUpperCase();
          const prefix = entry.prefix ? `[${entry.prefix}] ` : '';
          const message = entry.message || (entry.error && entry.error.message) || '';
          return `${timestamp} ${level} ${prefix}${message}`;
        }).join('\n');
      }
      
      await fs.writeFile(filePath, content);
      this.success(`Logs exported to ${filePath}`);
    } catch (error) {
      this.error(`Failed to export logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a performance timer
   * @param {string} name - Timer name
   * @returns {Object} Timer object with stop method
   */
  startTimer(name) {
    const startTime = Date.now();
    this.debug(`Timer started: ${name}`);
    
    return {
      stop: () => {
        const duration = Date.now() - startTime;
        this.debug(`Timer stopped: ${name} (${duration}ms)`, { duration, timer: name });
        return duration;
      }
    };
  }

  /**
   * Log with performance timing
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to time
   * @param {Object} meta - Additional metadata
   * @returns {Promise<any>} Result of the function
   */
  async withTiming(operation, fn, meta = {}) {
    const timer = this.startTimer(operation);
    
    try {
      const result = await fn();
      const duration = timer.stop();
      this.info(`${operation} completed`, { ...meta, duration });
      return result;
    } catch (error) {
      const duration = timer.stop();
      this.error(`${operation} failed`, { ...meta, duration, error: error.message });
      throw error;
    }
  }

  /**
   * Create a progress logger for long-running operations
   * @param {string} operation - Operation name
   * @param {number} total - Total number of items
   * @returns {Object} Progress logger object
   */
  createProgress(operation, total) {
    let current = 0;
    const startTime = Date.now();
    
    return {
      increment: (message = '') => {
        current++;
        const percentage = Math.round((current / total) * 100);
        const elapsed = Date.now() - startTime;
        const eta = current > 0 ? Math.round((elapsed / current) * (total - current)) : 0;
        
        this.info(`${operation}: ${current}/${total} (${percentage}%) ${message}`, {
          progress: { current, total, percentage, elapsed, eta }
        });
      },
      
      complete: (message = 'completed') => {
        const duration = Date.now() - startTime;
        this.success(`${operation} ${message}`, { duration, total });
      },
      
      error: (error, message = 'failed') => {
        const duration = Date.now() - startTime;
        this.error(`${operation} ${message}`, { duration, current, total, error: error.message });
      }
    };
  }
}

export { Logger };