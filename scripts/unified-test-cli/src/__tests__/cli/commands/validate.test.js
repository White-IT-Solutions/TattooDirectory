/**
 * Unit tests for ValidateCommand
 */

import { jest } from '@jest/globals';
import { ValidateCommand } from '../../../cli/commands/validate.js';

// Mock dependencies
const mockCli = {
  validateEnvironment: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn()
};

jest.mock('../../../utils/logger.js', () => ({
  Logger: jest.fn(() => mockLogger)
}));

describe('ValidateCommand', () => {
  let validateCommand;

  beforeEach(() => {
    validateCommand = new ValidateCommand(mockCli);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should execute successfully with default options', async () => {
      const options = {};

      await validateCommand.execute(options);

      expect(mockLogger.info).toHaveBeenCalledWith('Executing validate command', { options });
      expect(mockCli.validateEnvironment).toHaveBeenCalledWith(options);
      expect(mockLogger.success).toHaveBeenCalledWith('Validate command completed successfully');
    });

    it('should execute successfully with services option', async () => {
      const options = { services: 'localstack,frontend' };

      await validateCommand.execute(options);

      expect(mockCli.validateEnvironment).toHaveBeenCalledWith(options);
      expect(mockLogger.success).toHaveBeenCalledWith('Validate command completed successfully');
    });

    it('should handle CLI execution errors', async () => {
      const error = new Error('Validation failed');
      mockCli.validateEnvironment.mockRejectedValue(error);

      await expect(validateCommand.execute({})).rejects.toThrow('Validation failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Validate command failed', { error: error.message });
    });
  });

  describe('validateOptions', () => {
    it('should validate valid services option', () => {
      const options = { services: 'localstack,frontend,backend' };
      expect(() => validateCommand.validateOptions(options)).not.toThrow();
    });

    it('should validate single service', () => {
      const options = { services: 'localstack' };
      expect(() => validateCommand.validateOptions(options)).not.toThrow();
    });

    it('should throw error for non-string services option', () => {
      expect(() => {
        validateCommand.validateOptions({ services: 123 });
      }).toThrow('services must be a comma-separated string');
    });

    it('should throw error for invalid service names', () => {
      expect(() => {
        validateCommand.validateOptions({ services: 'invalid-service' });
      }).toThrow("Invalid service 'invalid-service'. Valid services: localstack, frontend, backend");

      expect(() => {
        validateCommand.validateOptions({ services: 'localstack,invalid,frontend' });
      }).toThrow("Invalid service 'invalid'. Valid services: localstack, frontend, backend");
    });

    it('should handle services with extra whitespace', () => {
      const options = { services: ' localstack , frontend , backend ' };
      expect(() => validateCommand.validateOptions(options)).not.toThrow();
    });

    it('should handle undefined services option', () => {
      const options = {};
      expect(() => validateCommand.validateOptions(options)).not.toThrow();
    });
  });
});