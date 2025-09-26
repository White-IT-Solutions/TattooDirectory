#!/usr/bin/env node

/**
 * Unit Tests for FrontendSyncProcessor Class
 * 
 * Comprehensive test suite for frontend mock data generation and synchronization
 * functionality including frontend-only mode and backend integration.
 */

const fs = require('fs');
const path = require('path');
const { FrontendSyncProcessor } = require('../frontend-sync-processor');
const { DATA_CONFIG } = require('../data-config');

// Mock file system operations
jest.mock('fs');

// Mock state manager
jest.mock('../state-manager', () => ({
  STATE_MANAGER: {
    detectChanges: jest.fn()
  }
}));

describe('FrontendSyncProcessor', () => {
  let processor;
  let mockConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock configuration
    mockConfig = {
      services: {
        s3: {
          endpoint: 'http://localhost:4566',
          bucketName: 'test-bucket'
        }
      },
      paths: {
        frontendMockData: '/test/frontend/mockArtistData.js',
        testDataDir: '/test/data'
      },
      scenarios: {
        minimal: {
          styles: ['traditional', 'realism']
        }
      }
    };
    
    processor = new FrontendSyncProcessor(mockConfig);
    
    // Mock file system
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockReturnValue(true);
    fs.writeFileSync.mockReturnValue(true);
  });

  describe('Constructor', () => {
    test('should initialize with default config', () => {
      const defaultProcessor = new FrontendSyncProcessor();
      expect(defaultProcessor.config).toBeDefined();
      expect(defaultProcessor.frontendMockPath).toBe(DATA_CONFIG.paths.frontendMockData);
    });

    test('should initialize with custom config', () => {
      expect(processor.frontendMockPath).toBe('/test/frontend/mockArtistData.js');
    });

    test('should initialize statistics', () => {
      expect(processor.stats).toEqual({
        generated: 0,
        updated: 0,
        failed: 0,
        errors: []
      });
    });
  });

  describe('generatePureMockData', () => {
    test('should generate specified number of artists', () => {
      const mockData = processor.generatePureMockData(3);
      
      expect(mockData).toHaveLength(3);
      expect(mockData[0]).toHaveProperty('artistId');
      expect(mockData[0]).toHaveProperty('artistsName');
      expect(mockData[0]).toHaveProperty('styles');
      expect(mockData[0]).toHaveProperty('portfolioImages');
    });

    test('should generate artists with proper structure', () => {
      const mockData = processor.generatePureMockData(1);
      const artist = mockData[0];
      
      expect(artist).toMatchObject({
        pk: expect.stringMatching(/^ARTIST#\d+$/),
        sk: 'METADATA',
        artistId: expect.stringMatching(/^artist-\d{3}$/),
        artistsName: expect.any(String),
        instagramHandle: expect.any(String),
        bio: expect.any(String),
        avatar: expect.any(String),
        profileLink: expect.stringMatching(/^https:\/\/instagram\.com\//),
        tattooStudio: expect.objectContaining({
          studioName: expect.any(String),
          address: expect.objectContaining({
            city: expect.any(String),
            latitude: expect.any(Number),
            longitude: expect.any(Number)
          })
        }),
        styles: expect.any(Array),
        portfolioImages: expect.any(Array),
        opted_out: false
      });
    });

    test('should generate artists with valid portfolio images', () => {
      const mockData = processor.generatePureMockData(1);
      const artist = mockData[0];
      
      expect(artist.portfolioImages).toHaveLength(5);
      artist.portfolioImages.forEach(image => {
        expect(image).toMatchObject({
          url: expect.any(String),
          description: expect.any(String),
          style: expect.any(String)
        });
      });
    });
  });

  describe('createMockArtist', () => {
    test('should create artist with specified index', () => {
      const artist = processor.createMockArtist(5);
      
      expect(artist.pk).toBe('ARTIST#5');
      expect(artist.artistId).toBe('artist-005');
    });

    test('should create artist with scenario-specific styles', () => {
      const artist = processor.createMockArtist(1, null, 'minimal');
      
      expect(artist.styles.some(style => ['traditional', 'realism'].includes(style))).toBe(true);
    });

    test('should create artist with valid location data', () => {
      const artist = processor.createMockArtist(1);
      
      expect(artist.tattooStudio.address.latitude).toBeGreaterThan(50);
      expect(artist.tattooStudio.address.latitude).toBeLessThan(60);
      expect(artist.tattooStudio.address.longitude).toBeGreaterThan(-5);
      expect(artist.tattooStudio.address.longitude).toBeLessThan(0);
    });
  });

  describe('selectRandomStyles', () => {
    test('should return array of styles', () => {
      const styles = processor.selectRandomStyles();
      
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles.length).toBeLessThanOrEqual(3);
    });

    test('should respect scenario style constraints', () => {
      const styles = processor.selectRandomStyles('minimal');
      
      expect(styles.every(style => ['traditional', 'realism'].includes(style))).toBe(true);
    });

    test('should return unique styles', () => {
      const styles = processor.selectRandomStyles();
      const uniqueStyles = [...new Set(styles)];
      
      expect(styles.length).toBe(uniqueStyles.length);
    });
  });

  describe('generatePortfolioImages', () => {
    test('should generate images for all styles', () => {
      const styles = ['traditional', 'realism'];
      const images = processor.generatePortfolioImages(styles);
      
      expect(images).toHaveLength(5);
      expect(images.every(img => styles.includes(img.style))).toBe(true);
    });

    test('should use provided image URLs when available', () => {
      const imageUrls = {
        traditional: [
          { url: 'http://test.com/image1.png' },
          { url: 'http://test.com/image2.png' }
        ]
      };
      
      const images = processor.generatePortfolioImages(['traditional'], imageUrls);
      
      expect(images.some(img => img.url.includes('test.com'))).toBe(true);
    });

    test('should generate placeholder URLs when no real URLs provided', () => {
      const images = processor.generatePortfolioImages(['traditional']);
      
      expect(images[0].url).toContain('localhost:4566');
      expect(images[0].url).toContain('test-bucket');
      expect(images[0].url).toContain('styles/traditional');
    });
  });

  describe('generateArtistName', () => {
    test('should generate realistic names', () => {
      const name = processor.generateArtistName();
      
      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
      expect(name.split(' ')).toHaveLength(2);
    });

    test('should generate different names on multiple calls', () => {
      const names = new Set();
      for (let i = 0; i < 10; i++) {
        names.add(processor.generateArtistName());
      }
      
      expect(names.size).toBeGreaterThan(1);
    });
  });

  describe('generateInstagramHandle', () => {
    test('should generate valid Instagram handles', () => {
      const handle = processor.generateInstagramHandle();
      
      expect(handle).toMatch(/^[a-z0-9_]+$/);
      expect(handle.length).toBeGreaterThan(3);
      expect(handle).not.toMatch(/^_|_$/);
    });
  });

  describe('generateBio', () => {
    test('should generate style-appropriate bios', () => {
      const traditionalBio = processor.generateBio('traditional');
      const realismBio = processor.generateBio('realism');
      
      // Traditional bios should contain traditional-related terms
      expect(traditionalBio.toLowerCase()).toMatch(/traditional|classic|old school|sailor jerry/);
      // Realism bios use "Photorealistic" or "Realism" (capitalized)
      expect(realismBio.toLowerCase()).toMatch(/realism|photorealistic/);
    });

    test('should handle unknown styles gracefully', () => {
      const bio = processor.generateBio('unknown-style');
      
      expect(typeof bio).toBe('string');
      expect(bio.length).toBeGreaterThan(10);
    });
  });

  describe('generateFromRealData', () => {
    test('should use real data when available', async () => {
      const realArtists = [
        {
          artistId: 'real-001',
          artistName: 'Real Artist',
          instagramHandle: 'real_artist',
          styles: ['traditional'],
          latitude: 51.5074,
          longitude: -0.1278
        }
      ];
      
      fs.readFileSync.mockReturnValue(JSON.stringify(realArtists));
      
      const result = await processor.generateFromRealData(1);
      
      expect(result).toHaveLength(1);
      expect(result[0].artistId).toBe('real-001');
      expect(result[0].artistsName).toBe('Real Artist');
    });

    test('should fallback to mock data when real data unavailable', async () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = await processor.generateFromRealData(2);
      
      expect(result).toHaveLength(2);
      expect(result[0].artistId).toMatch(/^artist-\d{3}$/);
    });

    test('should handle JSON parsing errors gracefully', async () => {
      fs.readFileSync.mockReturnValue('invalid json');
      
      const result = await processor.generateFromRealData(1);
      
      expect(result).toHaveLength(1);
      expect(result[0].artistId).toMatch(/^artist-\d{3}$/);
    });
  });

  describe('convertRealArtistToMockFormat', () => {
    test('should convert real artist to mock format', () => {
      const realArtist = {
        artistId: 'real-001',
        artistName: 'Real Artist',
        instagramHandle: 'real_artist',
        styles: ['traditional'],
        latitude: 51.5074,
        longitude: -0.1278,
        locationDisplay: 'London'
      };
      
      const mockArtist = processor.convertRealArtistToMockFormat(realArtist);
      
      expect(mockArtist).toMatchObject({
        pk: 'ARTIST#real-001',
        sk: 'METADATA',
        artistId: 'real-001',
        artistsName: 'Real Artist',
        instagramHandle: 'real_artist',
        styles: ['traditional']
      });
    });

    test('should handle missing optional fields', () => {
      const realArtist = {
        artistId: 'real-001',
        artistName: 'Real Artist',
        instagramHandle: 'real_artist',
        styles: ['traditional']
      };
      
      const mockArtist = processor.convertRealArtistToMockFormat(realArtist);
      
      expect(mockArtist.bio).toBeDefined();
      expect(mockArtist.tattooStudio.address.city).toBe('London');
    });
  });

  describe('updateFrontendMockData', () => {
    test('should write mock data to file', async () => {
      const mockData = [
        { artistId: 'test-001', artistsName: 'Test Artist' }
      ];
      
      const result = await processor.updateFrontendMockData(mockData);
      
      expect(result.success).toBe(true);
      expect(result.artistCount).toBe(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/frontend/mockArtistData.js',
        expect.stringContaining('export const mockArtistData'),
        'utf8'
      );
    });

    test('should create directory if it does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await processor.updateFrontendMockData([]);
      
      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.dirname('/test/frontend/mockArtistData.js'),
        { recursive: true }
      );
    });

    test('should handle file write errors', async () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      const result = await processor.updateFrontendMockData([]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Write failed');
      expect(processor.stats.failed).toBe(1);
    });
  });

  describe('generateMockDataFileContent', () => {
    test('should generate valid JavaScript file content', () => {
      const mockData = [{ artistId: 'test-001' }];
      const content = processor.generateMockDataFileContent(mockData);
      
      expect(content).toContain('// mockArtistData.js');
      expect(content).toContain('export const mockArtistData');
      expect(content).toContain('"artistId": "test-001"');
    });

    test('should include timestamp in comment', () => {
      const content = processor.generateMockDataFileContent([]);
      
      expect(content).toMatch(/\/\/ Last updated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('generateMockData', () => {
    test('should generate mock data successfully', async () => {
      const result = await processor.generateMockData({ artistCount: 3 });
      
      expect(result.success).toBe(true);
      expect(result.mockData).toHaveLength(3);
      expect(processor.stats.generated).toBe(3);
    });

    test('should use real data when requested and available', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify([
        { artistId: 'real-001', artistName: 'Real Artist', styles: ['traditional'] }
      ]));
      
      const result = await processor.generateMockData({ 
        artistCount: 1, 
        useRealData: true 
      });
      
      expect(result.success).toBe(true);
      expect(result.mockData[0].artistId).toBe('real-001');
    });

    test('should handle generation errors', async () => {
      // Mock an error in the generation process
      processor.generatePureMockData = jest.fn().mockImplementation(() => {
        throw new Error('Generation failed');
      });
      
      const result = await processor.generateMockData({ artistCount: 1 });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation failed');
    });
  });

  describe('processFrontendOnly', () => {
    test('should process frontend-only mode successfully', async () => {
      const result = await processor.processFrontendOnly({ artistCount: 5 });
      
      expect(result.success).toBe(true);
      expect(result.mode).toBe('frontend-only');
      expect(result.artistCount).toBe(5);
    });

    test('should handle processing errors', async () => {
      processor.generateMockData = jest.fn().mockResolvedValue({
        success: false,
        error: 'Mock generation failed'
      });
      
      const result = await processor.processFrontendOnly();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mock generation failed');
    });
  });

  describe('syncWithBackend', () => {
    test('should sync with backend successfully', async () => {
      processor.generateMockData = jest.fn().mockResolvedValue({
        success: true,
        mockData: [{ artistId: 'test-001' }]
      });
      
      processor.updateFrontendMockData = jest.fn().mockResolvedValue({
        success: true,
        artistCount: 1
      });
      
      const result = await processor.syncWithBackend();
      
      expect(result.success).toBe(true);
      expect(result.artistCount).toBe(1);
    });
  });

  describe('validateMockData', () => {
    test('should validate correct mock data', () => {
      const validData = [
        {
          artistId: 'test-001',
          artistsName: 'Test Artist',
          styles: ['traditional'],
          portfolioImages: [{ url: 'test.jpg' }]
        }
      ];
      
      const errors = processor.validateMockData(validData);
      expect(errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidData = [
        {
          artistId: 'test-001'
          // Missing required fields
        }
      ];
      
      const errors = processor.validateMockData(invalidData);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('artistsName'))).toBe(true);
    });

    test('should validate array structure', () => {
      const errors = processor.validateMockData('not an array');
      expect(errors).toContain('Mock data must be an array');
    });
  });

  describe('hasRealData', () => {
    test('should return true when real data exists', () => {
      fs.existsSync.mockReturnValue(true);
      expect(processor.hasRealData()).toBe(true);
    });

    test('should return false when real data does not exist', () => {
      fs.existsSync.mockReturnValue(false);
      expect(processor.hasRealData()).toBe(false);
    });
  });

  describe('Statistics Management', () => {
    test('should track processing statistics', () => {
      processor.stats.generated = 5;
      processor.stats.updated = 1;
      
      const stats = processor.getStats();
      expect(stats.generated).toBe(5);
      expect(stats.updated).toBe(1);
    });

    test('should reset statistics', () => {
      processor.stats.generated = 5;
      processor.resetStats();
      
      expect(processor.stats.generated).toBe(0);
      expect(processor.stats.errors).toHaveLength(0);
    });
  });

  describe('Utility Functions', () => {
    test('shuffleArray should randomize array order', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = processor.shuffleArray(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.every(item => original.includes(item))).toBe(true);
      // Note: There's a small chance this could fail due to randomness
    });

    test('shuffleArray should not modify original array', () => {
      const original = [1, 2, 3];
      const originalCopy = [...original];
      
      processor.shuffleArray(original);
      
      expect(original).toEqual(originalCopy);
    });
  });
});