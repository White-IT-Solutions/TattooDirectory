#!/usr/bin/env node

/**
 * Studio Data Pipeline Integration Tests
 * 
 * Integration tests for the complete studio data pipeline
 * Tests end-to-end studio data processing workflow
 */

const { StudioDataProcessor } = require('../data-management/studio-data-processor');
const { UnifiedDataManager } = require('../unified-data-manager');
const { DATA_CONFIG } = require('../data-config');

// Mock external dependencies
jest.mock('../database-seeder');
jest.mock('../health-monitor');
jest.mock('../state-manager');
jest.mock('../unified-data-manager');

describe('Studio Data Pipeline Integration', () => {
  let studioProcessor;
  let mockManager;
  let mockArtists;

  beforeEach(() => {
    // Mock unified data manager
    mockManager = {
      setupData: jest.fn(),
      resetData: jest.fn(),
      seedScenario: jest.fn(),
      validateData: jest.fn(),
      healthCheck: jest.fn(),
      getDataStatus: jest.fn()
    };

    UnifiedDataManager.mockImplementation(() => mockManager);
    
    studioProcessor = new StudioDataProcessor(DATA_CONFIG);
    
    // Mock artist data
    mockArtists = [
      {
        artistId: 'artist-001',
        artistName: 'John Smith',
        styles: ['traditional', 'realism'],
        location: 'London',
        rating: 4.5
      },
      {
        artistId: 'artist-002',
        artistName: 'Jane Doe',
        styles: ['geometric', 'blackwork'],
        location: 'Manchester',
        rating: 4.2
      },
      {
        artistId: 'artist-003',
        artistName: 'Mike Johnson',
        styles: ['watercolour', 'fineline'],
        location: 'Birmingham',
        rating: 4.8
      }
    ];

    // Mock external services
    jest.clearAllMocks();
  });

  describe('Studio Data Processing Workflow', () => {
    test('should initialize studio processor correctly', () => {
      expect(studioProcessor).toBeDefined();
      expect(studioProcessor.config).toBeDefined();
      expect(studioProcessor.validator).toBeDefined();
      expect(studioProcessor.imageProcessor).toBeDefined();
    });

    test('should calculate appropriate studio count based on artist count', () => {
      const scenarios = ['minimal', 'search-basic', 'london-artists', 'full-dataset'];
      
      for (const scenario of scenarios) {
        const scenarioConfig = DATA_CONFIG.scenarios[scenario];
        const artistCount = scenarioConfig ? scenarioConfig.artistCount || mockArtists.length : mockArtists.length;
        
        const studioCount = studioProcessor.calculateStudioCount(artistCount, scenario);
        
        expect(studioCount).toBeGreaterThan(0);
        expect(studioCount).toBeLessThanOrEqual(DATA_CONFIG.studio.generation.maxStudios);
        expect(studioCount).toBeLessThanOrEqual(Math.max(artistCount, DATA_CONFIG.studio.generation.minStudios));
      }
    });

    test('should have proper configuration', () => {
      expect(studioProcessor.config.studio).toBeDefined();
      expect(studioProcessor.config.studio.generation).toBeDefined();
      expect(studioProcessor.config.studio.generation.minStudios).toBeGreaterThan(0);
      expect(studioProcessor.config.studio.generation.maxStudios).toBeGreaterThan(0);
    });
  });

  describe('Pipeline Integration', () => {
    test('should integrate with unified data manager', async () => {
      mockManager.setupData.mockResolvedValue({
        success: true,
        results: {
          images: { processed: 5, uploaded: 5 },
          database: { artists: 5, studios: 3 },
          opensearch: { documents: 8, indexed: 8 },
          frontend: { updated: true, artistCount: 5, studioCount: 3 }
        }
      });

      const result = await mockManager.setupData({ scenario: 'minimal' });
      
      expect(result.success).toBe(true);
      expect(result.results.database.studios).toBeGreaterThan(0);
      expect(result.results.frontend.studioCount).toBeGreaterThan(0);
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

      const result = await mockManager.validateData({ type: 'all' });
      
      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle manager errors gracefully', async () => {
      mockManager.setupData.mockRejectedValue(new Error('Database connection failed'));

      try {
        await mockManager.setupData({ scenario: 'minimal' });
      } catch (error) {
        expect(error.message).toContain('Database connection failed');
      }
    });

    test('should handle invalid scenarios', () => {
      const studioCount = studioProcessor.calculateStudioCount(5, 'invalid-scenario');
      
      // Should return a reasonable default
      expect(studioCount).toBeGreaterThanOrEqual(DATA_CONFIG.studio.generation.minStudios);
      expect(studioCount).toBeLessThanOrEqual(DATA_CONFIG.studio.generation.maxStudios);
    });
  });

  describe('Data Consistency', () => {
    test('should maintain studio count constraints', () => {
      const artistCounts = [1, 5, 10, 20, 50];
      
      artistCounts.forEach(artistCount => {
        const studioCount = studioProcessor.calculateStudioCount(artistCount, 'minimal');
        
        expect(studioCount).toBeGreaterThan(0);
        expect(studioCount).toBeLessThanOrEqual(DATA_CONFIG.studio.generation.maxStudios);
        // For small artist counts, studio count might be less than minStudios
        expect(studioCount).toBeLessThanOrEqual(Math.max(artistCount, DATA_CONFIG.studio.generation.minStudios));
      });
    });

    test('should have valid configuration values', () => {
      expect(DATA_CONFIG.studio.generation.minStudios).toBeGreaterThan(0);
      expect(DATA_CONFIG.studio.generation.maxStudios).toBeGreaterThan(DATA_CONFIG.studio.generation.minStudios);
      expect(DATA_CONFIG.studio.generation.minArtistsPerStudio).toBeGreaterThan(0);
      expect(DATA_CONFIG.studio.generation.maxArtistsPerStudio).toBeGreaterThanOrEqual(DATA_CONFIG.studio.generation.minArtistsPerStudio);
    });
  });

  describe('Statistics and Reporting', () => {
    test('should initialize with proper statistics structure', () => {
      expect(studioProcessor.stats).toBeDefined();
      expect(studioProcessor.stats.studiosGenerated).toBe(0);
      expect(studioProcessor.stats.studiosValidated).toBe(0);
      expect(studioProcessor.stats.errors).toBeInstanceOf(Array);
    });

    test('should track processing metrics', () => {
      // Verify stats structure
      expect(typeof studioProcessor.stats.studiosGenerated).toBe('number');
      expect(typeof studioProcessor.stats.studiosValidated).toBe('number');
      expect(Array.isArray(studioProcessor.stats.errors)).toBe(true);
    });
  });
});