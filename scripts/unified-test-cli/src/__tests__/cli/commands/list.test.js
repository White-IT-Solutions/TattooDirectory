/**
 * Unit tests for ListCommand
 */

import { jest } from '@jest/globals';
import { ListCommand } from '../../../cli/commands/list.js';

// Mock dependencies
const mockCli = {
  listSuites: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn()
};

jest.mock('../../../utils/logger.js', () => ({
  Logger: jest.fn(() => mockLogger)
}));

describe('ListCommand', () => {
  let listCommand;

  beforeEach(() => {
    listCommand = new ListCommand(mockCli);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute successfully with default options', async () => {
      const options = {};

      await listCommand.execute(options);

      expect(mockLogger.info).toHaveBeenCalledWith('Executing list command', { options });
      expect(mockCli.listSuites).toHaveBeenCalledWith(options);
      expect(mockLogger.success).toHaveBeenCalledWith('List command completed successfully');
    });

    it('should execute successfully with json option', async () => {
      const options = { json: true };

      await listCommand.execute(options);

      expect(mockCli.listSuites).toHaveBeenCalledWith(options);
      expect(mockLogger.success).not.toHaveBeenCalled(); // No success logging in JSON mode
    });

    it('should handle CLI execution errors', async () => {
      const error = new Error('Failed to list suites');
      mockCli.listSuites.mockRejectedValue(error);

      await expect(listCommand.execute({})).rejects.toThrow('Failed to list suites');
      expect(mockLogger.error).toHaveBeenCalledWith('List command failed', { error: error.message });
    });
  });

  describe('validateOptions', () => {
    it('should convert json option to boolean', () => {
      const options = { json: 'true' };
      listCommand.validateOptions(options);
      expect(options.json).toBe(true);

      const options2 = { json: 0 };
      listCommand.validateOptions(options2);
      expect(options2.json).toBe(false);
    });

    it('should handle valid boolean json option', () => {
      const options = { json: true };
      listCommand.validateOptions(options);
      expect(options.json).toBe(true);

      const options2 = { json: false };
      listCommand.validateOptions(options2);
      expect(options2.json).toBe(false);
    });

    it('should handle undefined json option', () => {
      const options = {};
      listCommand.validateOptions(options);
      expect(options.json).toBeUndefined();
    });
  });
});