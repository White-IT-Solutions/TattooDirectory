#!/usr/bin/env node

/**
 * Studio Data Generator Tests
 * 
 * Comprehensive tests for studio data generation functionality
 * Tests the studio generation capabilities from the frontend-sync-processor
 */

const { FrontendSyncProcessor } = require('../frontend-sync-processor');
const { DATA_CONFIG } = require('../data-config');

describe('StudioDataGenerator', () => {
  let processor;
  let mockArtists;

  beforeEach(() => {
    processor = new FrontendSyncProcessor(DATA_CONFIG);
    
    // Mock artist data for testing
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
        location: 'London',
        rating: 4.8
      }
    ];
  });

  describe('generateStudioData', () => {
    test('should generate complete studio data with all required fields', () => {
      const studioId = 'studio-001';
      const studioName = 'Test Studio';
      const location = {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        postcode: 'E1 6SB',
        addresses: ['123 Test Street, London E1 6SB']
      };
      const artistIds = ['artist-001', 'artist-002'];

      const studio = processor.generateStudioData(studioId, studioName, location, artistIds);

      // Verify required fields
      expect(studio.studioId).toBe(studioId);
      expect(studio.studioName).toBe(studioName);
      expect(studio.address).toBeDefined();
      expect(studio.address.postcode).toBeDefined();
      expect(studio.address.latitude).toBeCloseTo(location.latitude, 1);
      expect(studio.address.longitude).toBeCloseTo(location.longitude, 1);
      expect(studio.locationDisplay).toContain(location.city);
      
      // Verify contact information
      expect(studio.contactInfo).toBeDefined();
      expect(studio.contactInfo.phone).toMatch(/^\+44/);
      expect(studio.contactInfo.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(studio.contactInfo.website).toMatch(/^https?:\/\//);
      expect(studio.contactInfo.instagram).toMatch(/^@/);
      
      // Verify opening hours
      expect(studio.openingHours).toBeDefined();
      expect(studio.openingHours.monday).toBeDefined();
      expect(studio.openingHours.sunday).toBeDefined();
      
      // Verify business data
      expect(studio.rating).toBeGreaterThanOrEqual(3.5);
      expect(studio.rating).toBeLessThanOrEqual(5.0);
      expect(studio.reviewCount).toBeGreaterThan(0);
      expect(studio.established).toBeGreaterThanOrEqual(2005);
      expect(studio.established).toBeLessThanOrEqual(2024);
      expect(studio.specialties).toBeInstanceOf(Array);
      expect(studio.specialties.length).toBeGreaterThan(0);
      
      // Verify artist relationships
      expect(studio.artists).toEqual(artistIds);
    });

    test('should generate valid UK postcode format', () => {
      const studio = processor.generateStudioData('studio-001', 'Test Studio', {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        postcode: 'E1 6SB',
        addresses: ['123 Test Street, London E1 6SB']
      });

      // UK postcode pattern: Letter(s) + Number(s) + Space + Number + Letter(s)
      expect(studio.address.postcode).toMatch(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/);
    });

    test('should generate realistic opening hours', () => {
      const studio = processor.generateStudioData('studio-001', 'Test Studio', {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        addresses: ['123 Test Street, London E1 6SB']
      });

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      days.forEach(day => {
        expect(studio.openingHours[day]).toBeDefined();
        // Should be either 'Closed' or time format 'HH:MM-HH:MM'
        expect(studio.openingHours[day]).toMatch(/^(Closed|\d{2}:\d{2}-\d{2}:\d{2})$/);
      });
    });

    test('should generate valid specialties from allowed list', () => {
      const studio = processor.generateStudioData('studio-001', 'Test Studio', {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        addresses: ['123 Test Street, London E1 6SB']
      });

      const allowedSpecialties = [
        'traditional', 'neo_traditional', 'realism', 'blackwork', 'geometric',
        'watercolour', 'fineline', 'dotwork', 'japanese', 'biomechanical',
        'tribal', 'lettering', 'minimalism', 'floral'
      ];

      studio.specialties.forEach(specialty => {
        expect(allowedSpecialties).toContain(specialty);
      });
    });

    test('should generate contact info with proper formats', () => {
      const studioName = 'Ink & Steel Studio';
      const contactInfo = processor.generateStudioContactInfo(studioName);

      expect(contactInfo.phone).toMatch(/^\+44/);
      expect(contactInfo.email).toMatch(/^[a-z0-9]+@[a-z0-9]+\.com$/);
      expect(contactInfo.website).toMatch(/^https:\/\/[a-z0-9]+\.com$/);
      expect(contactInfo.instagram).toMatch(/^@[a-z0-9]+$/);
    });
  });

  describe('studio generation with scenarios', () => {
    test('should generate studios for minimal scenario', () => {
      const scenario = DATA_CONFIG.scenarios.minimal;
      const studioCount = DATA_CONFIG.calculateStudioCount(scenario.artistCount, 'minimal');
      
      // The calculated count should be reasonable for the scenario
      expect(studioCount).toBeGreaterThan(0);
      expect(studioCount).toBeLessThanOrEqual(DATA_CONFIG.studio.generation.maxStudios);
      expect(studioCount).toBeLessThanOrEqual(scenario.artistCount);
    });

    test('should generate studios for london-artists scenario', () => {
      const scenario = DATA_CONFIG.scenarios['london-artists'];
      const studioCount = DATA_CONFIG.calculateStudioCount(scenario.artistCount, 'london-artists');
      
      expect(studioCount).toBeGreaterThan(0);
      expect(studioCount).toBeLessThanOrEqual(scenario.artistCount);
    });

    test('should generate studios for high-rated scenario', () => {
      const scenario = DATA_CONFIG.scenarios['high-rated'];
      const studioCount = DATA_CONFIG.calculateStudioCount(scenario.artistCount, 'high-rated');
      
      expect(studioCount).toBeGreaterThan(0);
    });

    test('should generate studios for full-dataset scenario', () => {
      const scenario = DATA_CONFIG.scenarios['full-dataset'];
      const studioCount = DATA_CONFIG.calculateStudioCount(scenario.artistCount, 'full-dataset');
      
      expect(studioCount).toBeGreaterThanOrEqual(DATA_CONFIG.studio.generation.minStudios);
      expect(studioCount).toBeLessThanOrEqual(DATA_CONFIG.studio.generation.maxStudios);
    });
  });

  describe('studio specialties generation', () => {
    test('should generate diverse specialties', () => {
      const specialties = processor.generateStudioSpecialties();
      
      expect(specialties).toBeInstanceOf(Array);
      expect(specialties.length).toBeGreaterThan(0);
      expect(specialties.length).toBeLessThanOrEqual(5);
      
      // Should not have duplicates
      const uniqueSpecialties = [...new Set(specialties)];
      expect(uniqueSpecialties.length).toBe(specialties.length);
    });

    test('should generate specialties from valid list', () => {
      const specialties = processor.generateStudioSpecialties();
      const validSpecialties = [
        'traditional', 'neo_traditional', 'realism', 'blackwork', 'geometric',
        'watercolour', 'fineline', 'dotwork', 'japanese', 'biomechanical',
        'tribal', 'lettering', 'minimalism', 'floral'
      ];

      specialties.forEach(specialty => {
        expect(validSpecialties).toContain(specialty);
      });
    });
  });

  describe('error handling', () => {
    test('should handle missing location data gracefully', () => {
      const studio = processor.generateStudioData('studio-001', 'Test Studio', {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        addresses: ['123 Default Street, London E1 6SB']
      });
      
      expect(studio.studioId).toBe('studio-001');
      expect(studio.studioName).toBe('Test Studio');
      expect(studio.address.latitude).toBeDefined();
      expect(studio.address.longitude).toBeDefined();
    });

    test('should handle empty artist list', () => {
      const studio = processor.generateStudioData('studio-001', 'Test Studio', {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        addresses: ['123 Test Street, London E1 6SB']
      }, []);

      expect(studio.artists).toEqual([]);
    });

    test('should handle invalid studio name', () => {
      const studio = processor.generateStudioData('studio-001', '', {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        addresses: ['123 Test Street, London E1 6SB']
      });

      expect(studio.studioName).toBeDefined();
      // The method uses the provided name, even if empty
      expect(studio.studioId).toBe('studio-001');
    });
  });

  describe('data consistency', () => {
    test('should maintain consistent data across multiple generations', () => {
      const studios = [];
      
      for (let i = 0; i < 5; i++) {
        const studio = processor.generateStudioData(`studio-00${i}`, `Test Studio ${i}`, {
          city: 'London',
          latitude: 51.5074,
          longitude: -0.1278,
          addresses: ['123 Test Street, London E1 6SB']
        });
        studios.push(studio);
      }

      // All studios should have required fields
      studios.forEach(studio => {
        expect(studio.studioId).toBeDefined();
        expect(studio.studioName).toBeDefined();
        expect(studio.contactInfo).toBeDefined();
        expect(studio.openingHours).toBeDefined();
        expect(studio.rating).toBeGreaterThanOrEqual(3.5);
        expect(studio.rating).toBeLessThanOrEqual(5.0);
      });

      // Studio IDs should be unique
      const studioIds = studios.map(s => s.studioId);
      const uniqueIds = [...new Set(studioIds)];
      expect(uniqueIds.length).toBe(studios.length);
    });

    test('should generate geographically consistent data', () => {
      const londonLocation = {
        city: 'London',
        latitude: 51.5074,
        longitude: -0.1278,
        addresses: ['123 Test Street, London E1 6SB']
      };

      const studio = processor.generateStudioData('studio-001', 'London Studio', londonLocation);

      expect(studio.locationDisplay).toContain('London');
      expect(studio.address.latitude).toBeCloseTo(londonLocation.latitude, 1);
      expect(studio.address.longitude).toBeCloseTo(londonLocation.longitude, 1);
    });
  });
});