/**
 * Backward Compatibility Layer Tests
 * 
 * Tests the backward compatibility layer to ensure legacy scripts
 * continue to work with the new unified system.
 */

const { BackwardCompatibilityLayer } = require('../backward-compatibility');
const { UnifiedDataManager } = require('../unified-data-manager');

// Mock the UnifiedDataManager
jest.mock('../unified-data-manager');

describe('BackwardCompatibilityLayer', () => {
  let compatLayer;
  let mockManager;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock manager
    mockManager = {
      setupData: jest.fn().mockResolvedValue({ success: true }),
      seedScenario: jest.fn().mockResolvedValue({ success: true }),
      resetData: jest.fn().mockResolvedValue({ success: true }),
      validateData: jest.fn().mockResolvedValue({ success: true }),
      healthCheck: jest.fn().mockResolvedValue({ success: true }),
      getDataStatus: jest.fn().mockResolvedValue({ success: true })
    };
    
    // Mock the constructor
    UnifiedDataManager.mockImplementation(() => mockManager);
    
    compatLayer = new BackwardCompatibilityLayer();
  });

  describe('Legacy Seed Operations', () => {
    test('should handle legacy seed operation', async () => {
      const options = { force: true };
      
      const result = await compatLayer.legacySeed(options);
      
      expect(mockManager.setupData).toHaveBeenCalledWith({
        force: true,
        frontendOnly: false
      });
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy seed with default options', async () => {
      const result = await compatLayer.legacySeed();
      
      expect(mockManager.setupData).toHaveBeenCalledWith({
        force: false,
        frontendOnly: false
      });
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy seed errors', async () => {
      const error = new Error('Setup failed');
      mockManager.setupData.mockRejectedValue(error);
      
      await expect(compatLayer.legacySeed()).rejects.toThrow('Setup failed');
    });
  });

  describe('Legacy Selective Seeder Operations', () => {
    test('should handle legacy selective seeding', async () => {
      const scenario = 'minimal';
      
      const result = await compatLayer.legacySelectiveSeeder(scenario);
      
      expect(mockManager.seedScenario).toHaveBeenCalledWith(scenario);
      expect(result).toEqual({ success: true });
    });

    test('should handle selective seeder errors', async () => {
      const error = new Error('Scenario not found');
      mockManager.seedScenario.mockRejectedValue(error);
      
      await expect(compatLayer.legacySelectiveSeeder('invalid')).rejects.toThrow('Scenario not found');
    });
  });

  describe('Legacy Data Management Operations', () => {
    test('should handle legacy seed action', async () => {
      const options = { force: true };
      
      const result = await compatLayer.legacyDataManagement('seed', options);
      
      expect(mockManager.setupData).toHaveBeenCalledWith(options);
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy reset action', async () => {
      const options = { state: 'clean' };
      
      const result = await compatLayer.legacyDataManagement('reset', options);
      
      expect(mockManager.resetData).toHaveBeenCalledWith('clean');
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy reset with default state', async () => {
      const result = await compatLayer.legacyDataManagement('reset', {});
      
      expect(mockManager.resetData).toHaveBeenCalledWith('fresh');
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy validate action', async () => {
      const options = { type: 'consistency' };
      
      const result = await compatLayer.legacyDataManagement('validate', options);
      
      expect(mockManager.validateData).toHaveBeenCalledWith('consistency');
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy validate with default type', async () => {
      const result = await compatLayer.legacyDataManagement('validate', {});
      
      expect(mockManager.validateData).toHaveBeenCalledWith('all');
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy status action', async () => {
      const result = await compatLayer.legacyDataManagement('status', {});
      
      expect(mockManager.getDataStatus).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('should handle unimplemented actions gracefully', async () => {
      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = await compatLayer.legacyDataManagement('export', {});
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Feature "export" is not yet implemented')
      );
      expect(result).toBeUndefined();
      
      consoleSpy.mockRestore();
    });

    test('should throw error for unknown actions', async () => {
      await expect(compatLayer.legacyDataManagement('unknown', {}))
        .rejects.toThrow('Unknown legacy action: unknown');
    });
  });

  describe('Legacy Image Processing', () => {
    test('should handle legacy image processing', async () => {
      const options = { force: true };
      
      const result = await compatLayer.legacyImageProcessing(options);
      
      expect(mockManager.setupData).toHaveBeenCalledWith({
        imagesOnly: true,
        force: true
      });
      expect(result).toEqual({ success: true });
    });

    test('should handle image processing with default options', async () => {
      const result = await compatLayer.legacyImageProcessing();
      
      expect(mockManager.setupData).toHaveBeenCalledWith({
        imagesOnly: true,
        force: false
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('Legacy Health Check', () => {
    test('should handle legacy health check', async () => {
      const result = await compatLayer.legacyHealthCheck();
      
      expect(mockManager.healthCheck).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('should handle health check errors', async () => {
      const error = new Error('Health check failed');
      mockManager.healthCheck.mockRejectedValue(error);
      
      await expect(compatLayer.legacyHealthCheck()).rejects.toThrow('Health check failed');
    });
  });

  describe('Legacy Validation', () => {
    test('should handle legacy validation with specific type', async () => {
      const result = await compatLayer.legacyValidation('consistency');
      
      expect(mockManager.validateData).toHaveBeenCalledWith('consistency');
      expect(result).toEqual({ success: true });
    });

    test('should handle legacy validation with default type', async () => {
      const result = await compatLayer.legacyValidation();
      
      expect(mockManager.validateData).toHaveBeenCalledWith('all');
      expect(result).toEqual({ success: true });
    });
  });

  describe('Deprecation Warnings', () => {
    test('should show deprecation warning only once per command', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // First call should show warning
      compatLayer.showDeprecationWarning('old-command', 'new-command');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING')
      );
      
      // Reset spy
      consoleSpy.mockClear();
      
      // Second call should not show warning (already shown)
      compatLayer.showDeprecationWarning('old-command', 'new-command');
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING')
      );
      
      consoleSpy.mockRestore();
    });

    test('should show different warnings for different commands', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // First command warning
      compatLayer.showDeprecationWarning('old-command-1', 'new-command-1');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING')
      );
      
      // Reset spy
      consoleSpy.mockClear();
      
      // Different command should show warning
      compatLayer.showDeprecationWarning('old-command-2', 'new-command-2');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Legacy Script Detection', () => {
    test('should detect existing legacy scripts', () => {
      const fs = require('fs');
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = compatLayer.checkLegacyScript('scripts/data-seeder/seed.js');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Legacy script found')
      );
      
      existsSyncSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    test('should handle non-existing legacy scripts', () => {
      const fs = require('fs');
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const result = compatLayer.checkLegacyScript('non-existent-script.js');
      
      expect(result).toBe(false);
      
      existsSyncSpy.mockRestore();
    });
  });

  describe('Migration Report', () => {
    test('should generate migration report', () => {
      const fs = require('fs');
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
        // Mock some scripts as existing, others as not
        return path.includes('seed.js') || path.includes('selective-seeder.js');
      });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      compatLayer.generateMigrationReport();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('MIGRATION ANALYSIS REPORT')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Legacy scripts found:')
      );
      
      existsSyncSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });
});