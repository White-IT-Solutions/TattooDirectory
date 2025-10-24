/**
 * Tests for enhanced Logger functionality
 */

import { Logger } from '../logger.js';
import { CLIError, ServiceValidationError } from '../errors.js';

// Mock chalk to avoid ES module issues
jest.mock('chalk', () => ({
  red: jest.fn((text) => `RED:${text}`),
  yellow: jest.fn((text) => `YELLOW:${text}`),
  blue: jest.fn((text) => `BLUE:${text}`),
  green: jest.fn((text) => `GREEN:${text}`),
  gray: jest.fn((text) => `GRAY:${text}`),
  dim: jest.fn((text) => `DIM:${text}`)
}));

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  Object.assign(console, originalConsole);
});

describe('Logger', () => {
  describe('Basic Logging', () => {
    test('should create logger with default options', () => {
      const logger = new Logger();
      
      expect(logger.level).toBe('info');
      expect(logger.silent).toBe(false);
      expect(logger.prefix).toBe('');
      expect(logger.currentLevel).toBe(2);
    });

    test('should create logger with custom options', () => {
      const logger = new Logger({
        level: 'debug',
        silent: true,
        prefix: 'TEST',
        context: { app: 'test-cli' }
      });
      
      expect(logger.level).toBe('debug');
      expect(logger.silent).toBe(true);
      expect(logger.prefix).toBe('TEST');
      expect(logger.context).toEqual({ app: 'test-cli' });
    });

    test('should respect log levels', () => {
      const logger = new Logger({ level: 'warn' });
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      // Debug and info should not log, warn and error should log
      // Both warn and error use console.log in our implementation
      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.error).not.toHaveBeenCalled();
    });

    test('should not log when silent', () => {
      const logger = new Logger({ silent: true });
      
      logger.info('Test message');
      logger.error('Error message');
      
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    test('should log CLIError with full context', () => {
      const logger = new Logger();
      const error = new CLIError('Test error', 'TEST_ERROR', { detail: 'value' })
        .withSuggestions(['Fix this', 'Try that']);
      
      logger.error(error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Details:')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Suggested solutions:')
      );
    });

    test('should log standard Error', () => {
      const logger = new Logger();
      const error = new Error('Standard error');
      
      logger.error(error, { context: 'test' });
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌')
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Context:')
      );
    });

    test('should log string error message', () => {
      const logger = new Logger();
      
      logger.error('Simple error message', { meta: 'data' });
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('RED:❌Simple error message')
      );
    });

    test('should include stack trace in debug mode', () => {
      const logger = new Logger({ level: 'debug' });
      const error = new Error('Test error');
      
      logger.error(error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stack trace:')
      );
    });
  });

  describe('Structured Logging', () => {
    test('should create structured log entries', () => {
      const logger = new Logger();
      const entry = logger.createLogEntry('info', 'Test message', { key: 'value' });
      
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('Test message');
      expect(entry.meta.key).toBe('value');
      expect(entry.timestamp).toBeDefined();
    });

    test('should handle Error objects in log entries', () => {
      const logger = new Logger();
      const error = new Error('Test error');
      const entry = logger.createLogEntry('error', error);
      
      expect(entry.error.name).toBe('Error');
      expect(entry.error.message).toBe('Test error');
      expect(entry.error.stack).toBeDefined();
    });

    test('should handle CLIError objects in log entries', () => {
      const logger = new Logger();
      const error = new CLIError('CLI error', 'TEST_CODE', { detail: 'value' });
      const entry = logger.createLogEntry('error', error);
      
      expect(entry.error.code).toBe('TEST_CODE');
      expect(entry.error.details).toEqual({ detail: 'value' });
    });
  });

  describe('Log Buffer Management', () => {
    test('should add entries to buffer', () => {
      const logger = new Logger();
      
      logger.info('Message 1');
      logger.warn('Message 2');
      logger.error('Message 3');
      
      expect(logger.logBuffer.length).toBe(3);
    });

    test('should maintain buffer size limit', () => {
      const logger = new Logger({ maxBufferSize: 2 });
      
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      
      expect(logger.logBuffer.length).toBe(2);
      expect(logger.logBuffer[0].message).toBe('Message 2');
      expect(logger.logBuffer[1].message).toBe('Message 3');
    });

    test('should get recent logs', () => {
      const logger = new Logger();
      
      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      
      const recent = logger.getRecentLogs(2);
      expect(recent.length).toBe(2);
      expect(recent[0].message).toBe('Message 2');
      expect(recent[1].message).toBe('Message 3');
    });

    test('should filter logs by level', () => {
      const logger = new Logger();
      
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');
      
      const errorLogs = logger.getLogsByLevel('error');
      expect(errorLogs.length).toBe(1);
      expect(errorLogs[0].message).toBe('Error message');
    });

    test('should clear buffer', () => {
      const logger = new Logger();
      
      logger.info('Message');
      expect(logger.logBuffer.length).toBe(1);
      
      logger.clearBuffer();
      expect(logger.logBuffer.length).toBe(0);
    });

    test('should get log statistics', () => {
      const logger = new Logger();
      
      logger.info('Info 1');
      logger.info('Info 2');
      logger.warn('Warning');
      logger.error('Error');
      
      const stats = logger.getLogStats();
      expect(stats.total).toBe(4);
      expect(stats.byLevel.info).toBe(2);
      expect(stats.byLevel.warn).toBe(1);
      expect(stats.byLevel.error).toBe(1);
    });
  });

  describe('Child Logger', () => {
    test('should create child logger with prefix', () => {
      const parent = new Logger({ prefix: 'PARENT' });
      const child = parent.child('CHILD');
      
      expect(child.prefix).toBe('PARENT:CHILD');
      expect(child.level).toBe(parent.level);
      expect(child.silent).toBe(parent.silent);
    });

    test('should create child logger without parent prefix', () => {
      const parent = new Logger();
      const child = parent.child('CHILD');
      
      expect(child.prefix).toBe('CHILD');
    });
  });

  describe('Performance Timing', () => {
    test('should create and stop timer', () => {
      const logger = new Logger();
      const timer = logger.startTimer('test-operation');
      
      expect(timer.stop).toBeDefined();
      
      const duration = timer.stop();
      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    test('should time async operations', async () => {
      const logger = new Logger();
      
      const result = await logger.withTiming('test-op', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'success';
      });
      
      expect(result).toBe('success');
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('test-op completed')
      );
    });

    test('should handle timing errors', async () => {
      const logger = new Logger();
      
      await expect(
        logger.withTiming('failing-op', async () => {
          throw new Error('Operation failed');
        })
      ).rejects.toThrow('Operation failed');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('RED:❌failing-op failed')
      );
    });
  });

  describe('Progress Logging', () => {
    test('should create progress logger', () => {
      const logger = new Logger();
      const progress = logger.createProgress('test-operation', 10);
      
      expect(progress.increment).toBeDefined();
      expect(progress.complete).toBeDefined();
      expect(progress.error).toBeDefined();
    });

    test('should track progress increments', () => {
      const logger = new Logger();
      const progress = logger.createProgress('test-operation', 3);
      
      progress.increment('Step 1');
      progress.increment('Step 2');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('test-operation: 1/3 (33%)')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('test-operation: 2/3 (67%)')
      );
    });

    test('should handle progress completion', () => {
      const logger = new Logger();
      const progress = logger.createProgress('test-operation', 2);
      
      progress.complete('finished successfully');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('test-operation finished successfully')
      );
    });

    test('should handle progress errors', () => {
      const logger = new Logger();
      const progress = logger.createProgress('test-operation', 2);
      
      progress.error(new Error('Something went wrong'), 'failed');
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('RED:❌test-operation failed')
      );
    });
  });

  describe('Level Management', () => {
    test('should set log level', () => {
      const logger = new Logger({ level: 'info' });
      
      logger.setLevel('debug');
      expect(logger.level).toBe('debug');
      expect(logger.currentLevel).toBe(3);
    });

    test('should ignore invalid log level', () => {
      const logger = new Logger({ level: 'info' });
      
      logger.setLevel('invalid');
      expect(logger.level).toBe('info');
      expect(logger.currentLevel).toBe(2);
    });

    test('should toggle silent mode', () => {
      const logger = new Logger({ silent: false });
      
      logger.setSilent(true);
      expect(logger.silent).toBe(true);
      
      logger.info('Should not log');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('CI Mode', () => {
    test('should enable structured logging in CI', () => {
      process.env.CI = 'true';
      const logger = new Logger();
      
      logger.info('Test message');
      
      // Should have both regular and structured output
      expect(console.log).toHaveBeenCalledTimes(2);
      
      delete process.env.CI;
    });
  });
});