/**
 * Tests for error handling classes and utilities
 */

import { 
  CLIError, 
  ServiceValidationError, 
  DataSeedingError, 
  TestExecutionError,
  ConfigurationError,
  TimeoutError,
  DependencyError,
  WorkspaceError,
  ParallelExecutionError,
  RecoveryError,
  ErrorFactory,
  ErrorRecovery
} from '../errors.js';

describe('CLIError', () => {
  test('should create basic CLI error', () => {
    const error = new CLIError('Test error message', 'TEST_ERROR');
    
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('CLIError');
    expect(error.details).toEqual({});
    expect(error.suggestions).toEqual([]);
    expect(error.timestamp).toBeDefined();
  });

  test('should support method chaining', () => {
    const error = new CLIError('Test error')
      .withSuggestions(['Suggestion 1', 'Suggestion 2'])
      .withDetails({ key: 'value' });
    
    expect(error.suggestions).toEqual(['Suggestion 1', 'Suggestion 2']);
    expect(error.details).toEqual({ key: 'value' });
  });

  test('should generate user-friendly message with suggestions', () => {
    const error = new CLIError('Test error')
      .withSuggestions(['Fix this', 'Try that']);
    
    const userMessage = error.getUserMessage();
    expect(userMessage).toContain('Test error');
    expect(userMessage).toContain('Suggested solutions:');
    expect(userMessage).toContain('1. Fix this');
    expect(userMessage).toContain('2. Try that');
  });

  test('should convert to JSON', () => {
    const error = new CLIError('Test error', 'TEST_CODE', { detail: 'value' })
      .withSuggestions(['Suggestion']);
    
    const json = error.toJSON();
    expect(json.name).toBe('CLIError');
    expect(json.message).toBe('Test error');
    expect(json.code).toBe('TEST_CODE');
    expect(json.details).toEqual({ detail: 'value' });
    expect(json.suggestions).toEqual(['Suggestion']);
    expect(json.timestamp).toBeDefined();
    expect(json.stack).toBeDefined();
  });
});

describe('ServiceValidationError', () => {
  test('should create service validation error with suggestions', () => {
    const originalError = new Error('Connection refused');
    const error = new ServiceValidationError('localstack', 'Service not running', originalError);
    
    expect(error.message).toContain('Service localstack is not available');
    expect(error.service).toBe('localstack');
    expect(error.originalError).toBe(originalError);
    expect(error.suggestions.length).toBeGreaterThan(0);
    expect(error.suggestions[0]).toContain('Start LocalStack');
  });

  test('should generate service-specific suggestions', () => {
    const error = new ServiceValidationError('frontend', 'Port not accessible');
    
    expect(error.suggestions).toContain('Start frontend: npm run dev --workspace=frontend');
    expect(error.suggestions).toContain('Check port 3000: netstat -an | findstr 3000');
  });

  test('should handle unknown services', () => {
    const error = new ServiceValidationError('unknown-service', 'Not found');
    
    expect(error.suggestions).toContain('Check if unknown-service service is running');
    expect(error.suggestions).toContain('Review unknown-service configuration');
  });
});

describe('DataSeedingError', () => {
  test('should create data seeding error', () => {
    const originalError = new Error('Database connection failed');
    const error = new DataSeedingError('test-scenario', originalError, 'seeding');
    
    expect(error.message).toContain("Failed to seed data scenario 'test-scenario'");
    expect(error.scenario).toBe('test-scenario');
    expect(error.originalError).toBe(originalError);
    expect(error.phase).toBe('seeding');
    expect(error.suggestions.length).toBeGreaterThan(0);
  });

  test('should default to seeding phase', () => {
    const originalError = new Error('Test error');
    const error = new DataSeedingError('scenario', originalError);
    
    expect(error.phase).toBe('seeding');
  });
});

describe('TestExecutionError', () => {
  test('should create test execution error', () => {
    const error = new TestExecutionError('frontend-unit', 1, 'Test failed', 'execution');
    
    expect(error.message).toContain("Test suite 'frontend-unit' failed during execution with exit code 1");
    expect(error.suite).toBe('frontend-unit');
    expect(error.exitCode).toBe(1);
    expect(error.stderr).toBe('Test failed');
    expect(error.phase).toBe('execution');
  });

  test('should generate exit code specific suggestions', () => {
    const error = new TestExecutionError('test-suite', 130, 'Interrupted');
    
    expect(error.suggestions).toContain('Test execution was interrupted (SIGINT)');
    expect(error.suggestions).toContain('Try running tests again');
  });

  test('should generate suite-specific suggestions', () => {
    const error = new TestExecutionError('frontend-unit', 1, 'Failed');
    
    expect(error.suggestions.some(s => s.includes('frontend'))).toBe(true);
  });
});

describe('ConfigurationError', () => {
  test('should create configuration error', () => {
    const error = new ConfigurationError('test-suites', 'Invalid JSON', '/path/to/config.json');
    
    expect(error.message).toContain('Configuration error in test-suites: Invalid JSON');
    expect(error.configType).toBe('test-suites');
    expect(error.configPath).toBe('/path/to/config.json');
    expect(error.suggestions).toContain('Check test-suites configuration file at /path/to/config.json');
  });
});

describe('TimeoutError', () => {
  test('should create timeout error', () => {
    const error = new TimeoutError('data-seeding', 30000, { scenario: 'test' });
    
    expect(error.message).toContain("Operation 'data-seeding' timed out after 30000ms");
    expect(error.operation).toBe('data-seeding');
    expect(error.timeout).toBe(30000);
    expect(error.details.scenario).toBe('test');
  });
});

describe('DependencyError', () => {
  test('should create dependency error', () => {
    const error = new DependencyError('docker', 'Not installed', '20.10.0');
    
    expect(error.message).toContain("Dependency 'docker' is not available: Not installed");
    expect(error.dependency).toBe('docker');
    expect(error.requiredVersion).toBe('20.10.0');
  });

  test('should generate dependency-specific suggestions', () => {
    const error = new DependencyError('node', 'Version too old');
    
    expect(error.suggestions).toContain('Install Node.js from https://nodejs.org/');
    expect(error.suggestions).toContain('Check Node.js version: node --version');
  });
});

describe('WorkspaceError', () => {
  test('should create workspace error', () => {
    const error = new WorkspaceError('frontend', 'Directory not found', 'access');
    
    expect(error.message).toContain("Workspace 'frontend' error during access: Directory not found");
    expect(error.workspace).toBe('frontend');
    expect(error.operation).toBe('access');
  });
});

describe('ParallelExecutionError', () => {
  test('should create parallel execution error', () => {
    const failedSuites = ['suite1', 'suite2'];
    const error = new ParallelExecutionError('Multiple suites failed', failedSuites);
    
    expect(error.message).toContain('Parallel execution failed: Multiple suites failed');
    expect(error.failedSuites).toEqual(failedSuites);
  });
});

describe('RecoveryError', () => {
  test('should create recovery error', () => {
    const originalError = new Error('Service down');
    const error = new RecoveryError(originalError, 'restart-service', 'Restart failed');
    
    expect(error.message).toContain("Recovery action 'restart-service' failed: Restart failed");
    expect(error.originalError).toBe(originalError);
    expect(error.recoveryAction).toBe('restart-service');
  });
});

describe('ErrorFactory', () => {
  test('should create service error', () => {
    const originalError = new Error('Connection failed');
    const context = { type: 'service', service: 'localstack' };
    
    const error = ErrorFactory.createError(originalError, context);
    
    expect(error).toBeInstanceOf(ServiceValidationError);
    expect(error.service).toBe('localstack');
  });

  test('should create data error', () => {
    const originalError = new Error('Seeding failed');
    const context = { type: 'data', scenario: 'test-scenario', phase: 'cleanup' };
    
    const error = ErrorFactory.createError(originalError, context);
    
    expect(error).toBeInstanceOf(DataSeedingError);
    expect(error.scenario).toBe('test-scenario');
    expect(error.phase).toBe('cleanup');
  });

  test('should create test error', () => {
    const originalError = new Error('Test failed');
    const context = { type: 'test', suite: 'frontend-unit', exitCode: 1, stderr: 'Error output' };
    
    const error = ErrorFactory.createError(originalError, context);
    
    expect(error).toBeInstanceOf(TestExecutionError);
    expect(error.suite).toBe('frontend-unit');
    expect(error.exitCode).toBe(1);
  });

  test('should create generic CLI error for unknown type', () => {
    const originalError = new Error('Unknown error');
    const context = { type: 'unknown' };
    
    const error = ErrorFactory.createError(originalError, context);
    
    expect(error).toBeInstanceOf(CLIError);
    expect(error.code).toBe('UNKNOWN_ERROR');
  });

  test('should wrap existing CLI error', () => {
    const originalError = new ServiceValidationError('test', 'Test error');
    const context = { additionalInfo: 'extra' };
    
    const error = ErrorFactory.wrapError(originalError, context);
    
    expect(error).toBe(originalError);
    expect(error.details.additionalInfo).toBe('extra');
  });
});

describe('ErrorRecovery', () => {
  test('should not attempt recovery when autoRestart is false', async () => {
    const error = new ServiceValidationError('localstack', 'Service down');
    const options = { autoRestart: false };
    
    const result = await ErrorRecovery.recoverFromServiceError(error, options);
    
    expect(result).toBe(false);
  });

  test('should not attempt data recovery when resetData is false', async () => {
    const error = new DataSeedingError('test-scenario', new Error('Seeding failed'));
    const options = { resetData: false };
    
    const result = await ErrorRecovery.recoverFromDataError(error, options);
    
    expect(result).toBe(false);
  });

  test('should return false for unsupported service recovery', async () => {
    const error = new ServiceValidationError('unknown-service', 'Service down');
    const options = { autoRestart: true };
    
    const result = await ErrorRecovery.recoverFromServiceError(error, options);
    
    expect(result).toBe(false);
  });
});