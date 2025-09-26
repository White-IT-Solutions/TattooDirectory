#!/usr/bin/env node

/**
 * Artist-Studio Relationship Manager Tests
 * 
 * Tests for bidirectional artist-studio relationship management
 * Tests relationship creation, validation, and consistency maintenance
 */

const { FrontendSyncProcessor } = require('../frontend-sync-processor');
const { DATA_CONFIG } = require('../data-config');

describe('ArtistStudioRelationshipManager', () => {
  let processor;
  let mockArtistsWithStudios;

  beforeEach(() => {
    processor = new FrontendSyncProcessor(DATA_CONFIG);
    
    // Mock artist data with existing studio assignments
    mockArtistsWithStudios = [
      {
        artistId: 'artist-001',
        artistName: 'John Smith',
        styles: ['traditional', 'realism'],
        location: 'London',
        rating: 4.5,
        tattooStudio: {
          studioId: 'studio-001',
          studioName: 'London Ink Studio',
          address: {
            city: 'London',
            street: '123 Test Street, London E1 6SB',
            postcode: 'E1 6SB',
            latitude: 51.5074,
            longitude: -0.1278
          }
        }
      },
      {
        artistId: 'artist-002',
        artistName: 'Jane Doe',
        styles: ['geometric', 'blackwork'],
        location: 'London',
        rating: 4.2,
        tattooStudio: {
          studioId: 'studio-001',
          studioName: 'London Ink Studio',
          address: {
            city: 'London',
            street: '123 Test Street, London E1 6SB',
            postcode: 'E1 6SB',
            latitude: 51.5074,
            longitude: -0.1278
          }
        }
      },
      {
        artistId: 'artist-003',
        artistName: 'Mike Johnson',
        styles: ['watercolour', 'fineline'],
        location: 'Manchester',
        rating: 4.8,
        tattooStudio: {
          studioId: 'studio-002',
          studioName: 'Manchester Tattoo Co',
          address: {
            city: 'Manchester',
            street: '456 Test Road, Manchester M1 1AA',
            postcode: 'M1 1AA',
            latitude: 53.4808,
            longitude: -2.2426
          }
        }
      }
    ];
  });

  describe('generateArtistStudioRelationships', () => {
    test('should process existing artist-studio relationships', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);

      expect(result).toBeDefined();
      expect(result.artists).toBeInstanceOf(Array);
      expect(result.studios).toBeInstanceOf(Array);
      expect(result.artists.length).toBe(mockArtistsWithStudios.length);
    });

    test('should maintain artist studio references', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);

      // Verify artists still have studio references
      result.artists.forEach(artist => {
        expect(artist.tattooStudio).toBeDefined();
        expect(artist.tattooStudio.studioId).toBeDefined();
        expect(artist.tattooStudio.studioName).toBeDefined();
        expect(artist.tattooStudio.address).toBeDefined();
      });
    });

    test('should create studio data from relationships', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);

      expect(result.studios.length).toBeGreaterThan(0);
      
      // Studios are already an array
      const studiosArray = result.studios;
      studiosArray.forEach(studio => {
        expect(studio.studioId).toBeDefined();
        expect(studio.studioName).toBeDefined();
        expect(studio.artists).toBeInstanceOf(Array);
        expect(studio.artists.length).toBeGreaterThan(0);
      });
    });

    test('should handle empty artist list', () => {
      const result = processor.generateArtistStudioRelationships([]);
      
      expect(result.artists).toHaveLength(0);
      expect(result.studios).toBeDefined();
    });
  });

  describe('relationship consistency', () => {
    test('should maintain bidirectional relationships', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);

      // Check that each artist references a studio
      result.artists.forEach(artist => {
        expect(artist.tattooStudio).toBeDefined();
        expect(artist.tattooStudio.studioId).toBeDefined();
      });

      // Check that each studio has artists assigned
      const studiosArray = result.studios;
      studiosArray.forEach(studio => {
        expect(studio.artists).toBeInstanceOf(Array);
        expect(studio.artists.length).toBeGreaterThan(0);
      });
    });

    test('should group artists by location', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);

      // Artists from the same location should be grouped together
      const londonArtists = result.artists.filter(a => a.tattooStudio.address.city === 'London');
      const manchesterArtists = result.artists.filter(a => a.tattooStudio.address.city === 'Manchester');

      expect(londonArtists.length).toBe(2);
      expect(manchesterArtists.length).toBe(1);

      // London artists should reference the same studio
      if (londonArtists.length > 1) {
        const firstLondonStudio = londonArtists[0].tattooStudio.studioId;
        londonArtists.forEach(artist => {
          expect(artist.tattooStudio.studioId).toBe(firstLondonStudio);
        });
      }
    });

    test('should maintain location consistency', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);

      result.artists.forEach(artist => {
        // Artist's location should match their studio's city
        expect(artist.tattooStudio.address.city).toBe(artist.location);
      });
    });
  });

  describe('data validation', () => {
    test('should validate studio data structure', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);
      
      const studiosArray = result.studios;
      studiosArray.forEach(studio => {
        expect(studio).toHaveProperty('studioId');
        expect(studio).toHaveProperty('studioName');
        expect(studio).toHaveProperty('address');
        expect(studio).toHaveProperty('artists');
        expect(studio).toHaveProperty('specialties');
      });
    });

    test('should validate artist studio references', () => {
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);

      result.artists.forEach(artist => {
        expect(artist.tattooStudio).toHaveProperty('studioId');
        expect(artist.tattooStudio).toHaveProperty('studioName');
        expect(artist.tattooStudio).toHaveProperty('address');
        expect(artist.tattooStudio.address).toHaveProperty('city');
        expect(artist.tattooStudio.address).toHaveProperty('postcode');
      });
    });
  });

  describe('performance', () => {
    test('should handle datasets efficiently', () => {
      const startTime = Date.now();
      const result = processor.generateArtistStudioRelationships(mockArtistsWithStudios);
      const endTime = Date.now();

      // Should complete within reasonable time (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      
      // Verify relationships were processed
      expect(result.artists.length).toBe(3);
      expect(result.studios.length).toBeGreaterThan(0);
      
      result.artists.forEach(artist => {
        expect(artist.tattooStudio).toBeDefined();
      });
    });

    test('should handle studio generation methods', () => {
      // Test the studio data generation method
      const studioData = processor.generateStudioData(
        'test-studio-001',
        'Test Studio',
        {
          city: 'London',
          latitude: 51.5074,
          longitude: -0.1278,
          addresses: ['123 Test Street, London E1 6SB']
        },
        ['artist-001', 'artist-002']
      );

      expect(studioData).toBeDefined();
      expect(studioData.studioId).toBe('test-studio-001');
      expect(studioData.studioName).toBe('Test Studio');
      expect(studioData.artists).toEqual(['artist-001', 'artist-002']);
    });
  });
});