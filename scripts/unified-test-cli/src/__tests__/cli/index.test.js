/**
 * Unit tests for CLI entry point
 */

import { jest } from '@jest/globals';

// Mock all dependencies before importing the main module
const mockRunCommand = {
  execute: jest.fn()
};

const mockListCommand = {
  execute: jest.fn()
};

const mockValidateCommand = {
  execute: jest.fn()
};

const mockProgram = {
  name: jest.fn().mockReturnThis(),
  description: jest.fn().mockReturnThis(),
  version: jest.fn().mockReturnThis(),
  command: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  action: jest.fn().mockReturnThis(),
  parse: jest.fn(),
  on: jest.fn().mockReturnThis()
};

const mockUnifiedTestCLI = jest.fn();

// Mock modules
jest.mock('commander', () => ({
  Command: jest.fn(() => mockProgram)
}));

jest.mock('../../core/unified-test-cli.js', () => ({
  UnifiedTestCLI: mockUnifiedTestCLI
}));

jest.mock('../../cli/commands/index.js', () => ({
  RunCommand: jest.fn(() => mockRunCommand),
  ListCommand: jest.fn(() => mockListCommand),
  ValidateCommand: jest.fn(() => mockValidateCommand)
}));

// Mock console methods
const originalConsoleError = console.error;
const originalProcessExit = process.exit;

beforeAll(() => {
  console.error = jest.fn();
  process.exit = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  process.exit = originalProcessExit;
});

describe('CLI Entry Point', () => {
  beforeAll(async () => {
    // Import the module once to trigger initialization
    await import('../../cli/index.js');
  });

  beforeEach(() => {
    // Don't clear all mocks since we need the accumulated calls
  });

  it('should initialize CLI with correct configuration', () => {
    expect(mockProgram.name).toHaveBeenCalledWith('unified-test-cli');
    expect(mockProgram.description).toHaveBeenCalledWith('Unified CLI interface for running all test suites');
    expect(mockProgram.version).toHaveBeenCalledWith('1.0.0');
  });

  it('should configure run command with correct options', () => {
    // Verify run command was configured
    expect(mockProgram.command).toHaveBeenCalledWith('run [suite]');
    
    // Verify options were added
    const optionCalls = mockProgram.option.mock.calls;
    const optionFlags = optionCalls.map(call => call[0]);
    
    expect(optionFlags).toContain('-s, --scenario <name>');
    expect(optionFlags).toContain('-p, --parallel');
    expect(optionFlags).toContain('--max-parallel <number>');
    expect(optionFlags).toContain('--ci');
    expect(optionFlags).toContain('--coverage');
    expect(optionFlags).toContain('--report');
  });

  it('should configure list command with correct options', () => {
    expect(mockProgram.command).toHaveBeenCalledWith('list');
    
    const optionCalls = mockProgram.option.mock.calls;
    const optionFlags = optionCalls.map(call => call[0]);
    
    expect(optionFlags).toContain('--json');
  });

  it('should configure validate command with correct options', () => {
    expect(mockProgram.command).toHaveBeenCalledWith('validate');
    
    const optionCalls = mockProgram.option.mock.calls;
    const optionFlags = optionCalls.map(call => call[0]);
    
    expect(optionFlags).toContain('--services <services>');
  });

  it('should call parse on program', () => {
    expect(mockProgram.parse).toHaveBeenCalled();
  });

  // Note: Testing the actual command action functions would require more complex mocking
  // of the commander.js action callbacks, which is beyond the scope of this unit test.
  // Integration tests would be more appropriate for testing the full command execution flow.
});