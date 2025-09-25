#!/usr/bin/env node

/**
 * Studio CLI Commands Tests
 * 
 * Tests for studio-specific CLI commands and operations
 * Tests basic CLI functionality and command structure
 */

const { DataCLI, COMMANDS } = require('../data-cli');
const { UnifiedDataManager } = require('../unified-data-manager');
const { DATA_CONFIG } = require('../data-config');

// Mock dependencies
jest.mock('../unified-data-manager');
jest.mock('../health-monitor');
jest.mock('../state-manager');

describe('Studio CLI Commands', () => {
  let cli;
  let mockManager;

  beforeEach(() => {
    // Create mock unified data manager
    mockManager = {
      setupData: jest.fn(),
      resetData: jest.fn(),
      seedScenario: jest.fn(),
      validateData: jest.fn(),
      healthCheck: jest.fn(),
      getDataStatus: jest.fn()
    };

    // Mock UnifiedDataManager constructor
    UnifiedDataManager.mockImplementation(() => mockManager);
    
    cli = new DataCLI();
    cli.manager = mockManager;

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('CLI initialization', () => {
    test('should initialize CLI with manager', () => {
      expect(cli).toBeDefined();
      expect(cli.manager).toBeDefined();
    });

    test('should have studio-related commands defined', () => {
      expect(COMMANDS).toBeDefined();
      expect(COMMANDS['setup-data']).toBeDefined();
      expect(COMMANDS['validate-data']).toBeDefined();
      expect(COMMANDS['health-check']).toBeDefined();
    });
  });

  describe('command handling', () => {
    test('should handle setup-data command with studio integration', async () => {
      mockManager.setupData.mockResolvedValue({
        success: true,
        results: {
          images: { processed: 5, uploaded: 5 },
          database: { artists: 10, studios: 5 },
          opensearch: { documents: 15, indexed: 15 },
          frontend: { updated: true, artistCount: 10, studioCount: 5 }
        }
      });

      const result = await cli.handleCommand('setup-data', [], {});

      expect(result).toBe(true);
      expect(mockManager.setupData).toHaveBeenCalled();
    });

    test('should handle validate-data command', async () => {
      mockManager.validateData.mockResolvedValue({
        success: true,
        isValid: true,
        summary: { total: 15, valid: 15, invalid: 0 }
      });

      const result = await cli.handleCommand('validate-data', [], {});

      expect(result).toBe(true);
      expect(mockManager.validateData).toHaveBeenCalled();
    });

    test('should handle health-check command', async () => {
      mockManager.healthCheck.mockResolvedValue({
        success: true,
        overall: 'healthy',
        services: {
          dynamodb: 'healthy',
          opensearch: 'healthy'
        }
      });

      const result = await cli.handleCommand('health-check', [], {});

      expect(result).toBe(true);
      expect(mockManager.healthCheck).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle unknown commands', async () => {
      const result = await cli.handleCommand('unknown-command', [], {});

      expect(result).toBe(false);
    });

    test('should handle manager errors gracefully', async () => {
      mockManager.setupData.mockRejectedValue(new Error('Database connection failed'));

      const result = await cli.handleCommand('setup-data', [], {});

      expect(result).toBe(false);
    });
  });

  describe('studio-specific functionality', () => {
    test('should support studio data in setup command', async () => {
      mockManager.setupData.mockResolvedValue({
        success: true,
        results: {
          database: { artists: 10, studios: 5 },
          frontend: { artistCount: 10, studioCount: 5 }
        }
      });

      const result = await cli.handleCommand('setup-data', [], { scenario: 'london-artists' });

      expect(result).toBe(true);
      expect(mockManager.setupData).toHaveBeenCalledWith(
        expect.objectContaining({ scenario: 'london-artists' })
      );
    });

    test('should support studio validation', async () => {
      mockManager.validateData.mockResolvedValue({
        success: true,
        isValid: true,
        studioValidation: {
          total: 5,
          valid: 5,
          invalid: 0
        }
      });

      const result = await cli.handleCommand('validate-data', [], { type: 'all' });

      expect(result).toBe(true);
      expect(mockManager.validateData).toHaveBeenCalled();
    });
  });

  describe('command configuration', () => {
    test('should have proper command structure', () => {
      Object.keys(COMMANDS).forEach(commandName => {
        const command = COMMANDS[commandName];
        expect(command).toHaveProperty('description');
        expect(typeof command.description).toBe('string');
      });
    });

    test('should support studio-related scenarios', () => {
      const scenarios = Object.keys(DATA_CONFIG.scenarios);
      expect(scenarios).toContain('london-artists');
      expect(scenarios).toContain('high-rated');
      expect(scenarios).toContain('full-dataset');
    });
  });
});