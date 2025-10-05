/**
 * Unit tests for RunCommand
 */

import { jest } from '@jest/globals';
import { RunCommand } from '../../../cli/commands/run.js';

// Mock dependencies
const mockCli = {
  run: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn()
};

jest.mock('../../../utils/logger.js', () => ({
  Logger: jest.fn(() => mockLogger)
}));

describe('RunCommand', () => {
  let runCommand;

  beforeEach(() => {
    runCommand = new RunCommand(mockCli);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute successfully with valid suite and options', async () => {
      const suite = 'frontend-unit';
      const options = {
        scenario: 'minimal',
        parallel: true,
        maxParallel: '3',
        coverage: true
      };

      await runCommand.execute(suite, options);

      expect(mockLogger.info).toHaveBeenCalledWith('Executing run command', { suite, options });
      expect(mockCli.run).toHaveBeenCalledWith(suite, {
        scenario: 'minimal',
        parallel: true,
        maxParallel: 3,
        coverage: true
      });
      expect(mockLogger.success).toHaveBeenCalledWith('Run command completed successfully');
    });

    it('should execute successfully without suite name', async () => {
      const options = { ci: true };

      await runCommand.execute(undefined, options);

      expect(mockCli.run).toHaveBeenCalledWith(undefined, { ci: true });
      expect(mockLogger.success).toHaveBeenCalledWith('Run command completed successfully');
    });

    it('should handle CLI execution errors', async () => {
      const error = new Error('Test execution failed');
      mockCli.run.mockRejectedValue(error);

      await expect(runCommand.execute('test-suite', {})).rejects.toThrow('Test execution failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Run command failed', { error: error.message });
    });
  });

  describe('validateOptions', () => {
    it('should validate and convert maxParallel option', () => {
      const options = { maxParallel: '5' };
      runCommand.validateOptions(options);
      expect(options.maxParallel).toBe(5);
    });

    it('should throw error for invalid maxParallel', () => {
      expect(() => {
        runCommand.validateOptions({ maxParallel: 'invalid' });
      }).toThrow('max-parallel must be a number between 1 and 10');

      expect(() => {
        runCommand.validateOptions({ maxParallel: '0' });
      }).toThrow('max-parallel must be a number between 1 and 10');

      expect(() => {
        runCommand.validateOptions({ maxParallel: '15' });
      }).toThrow('max-parallel must be a number between 1 and 10');
    });

    it('should validate scenario option', () => {
      expect(() => {
        runCommand.validateOptions({ scenario: 123 });
      }).toThrow('scenario must be a string');
    });

    it('should convert boolean options', () => {
      const options = {
        parallel: 'true',
        ci: 1,
        coverage: 'false',
        report: 0
      };

      runCommand.validateOptions(options);

      expect(options.parallel).toBe(true);
      expect(options.ci).toBe(true);
      expect(options.coverage).toBe(false);
      expect(options.report).toBe(false);
    });

    it('should handle valid options without modification', () => {
      const options = {
        scenario: 'test-scenario',
        parallel: true,
        maxParallel: '3',
        ci: false,
        coverage: true,
        report: false
      };

      const originalOptions = { ...options };
      runCommand.validateOptions(options);

      expect(options.scenario).toBe(originalOptions.scenario);
      expect(options.parallel).toBe(originalOptions.parallel);
      expect(options.maxParallel).toBe(3); // Should be converted to number
      expect(options.ci).toBe(originalOptions.ci);
      expect(options.coverage).toBe(originalOptions.coverage);
      expect(options.report).toBe(originalOptions.report);
    });
  });
});