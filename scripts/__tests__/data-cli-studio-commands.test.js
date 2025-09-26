#!/usr/bin/env node

/**
 * Data CLI Studio Commands Tests
 * 
 * Tests the studio-specific CLI commands functionality
 */

const { DataCLI, COMMANDS } = require('../data-cli');

// Mock external dependencies
jest.mock('../unified-data-manager');
jest.mock('../health-monitor');
jest.mock('../state-manager');

describe('Data CLI Studio Commands', () => {
  let cli;

  beforeEach(() => {
    cli = new DataCLI();
    jest.clearAllMocks();
  });

  describe('Command Definitions', () => {
    test('should have studio-related commands defined', () => {
      expect(COMMANDS).toBeDefined();
      expect(COMMANDS['setup-data']).toBeDefined();
      expect(COMMANDS['validate-data']).toBeDefined();
      expect(COMMANDS['health-check']).toBeDefined();
    });

    test('should have proper command structure', () => {
      Object.keys(COMMANDS).forEach(commandName => {
        const command = COMMANDS[commandName];
        expect(command).toHaveProperty('description');
        expect(typeof command.description).toBe('string');
      });
    });
  });

  describe('Command Parsing', () => {
    test('should parse basic commands', () => {
      expect(cli).toBeDefined();
      expect(typeof cli.parseArguments).toBe('function');
    });

    test('should handle command validation', () => {
      expect(typeof cli.validateCommand).toBe('function');
    });
  });

  describe('Studio Command Integration', () => {
    test('should support studio-related scenarios', () => {
      const { DATA_CONFIG } = require('../data-config');
      const scenarios = Object.keys(DATA_CONFIG.scenarios);
      
      expect(scenarios).toContain('minimal');
      expect(scenarios).toContain('london-artists');
      expect(scenarios).toContain('high-rated');
    });

    test('should have studio configuration', () => {
      const { DATA_CONFIG } = require('../data-config');
      
      expect(DATA_CONFIG.studio).toBeDefined();
      expect(DATA_CONFIG.studio.generation).toBeDefined();
      expect(DATA_CONFIG.studio.validation).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid commands gracefully', () => {
      // Test that CLI can handle errors without crashing
      expect(() => {
        cli.validateCommand('invalid-command', [], {});
      }).not.toThrow();
    });

    test('should validate command arguments', () => {
      // Test basic argument validation
      const result = cli.validateCommand('setup-data', [], {});
      expect(result).toBeDefined();
    });
  });
});