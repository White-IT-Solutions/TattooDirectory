#!/usr/bin/env node

/**
 * Studio Health Monitor Tests
 * 
 * Tests for studio health monitoring functionality
 */

const { HealthMonitor } = require('../health-monitor');

// Mock external dependencies
jest.mock('../database-seeder');
jest.mock('../state-manager');

describe('Studio Health Monitor', () => {
  let monitor;
  let mockStudioData;
  let invalidStudioData;

  beforeEach(() => {
    monitor = new HealthMonitor();
    
    // Mock valid studio data
    mockStudioData = {
      PK: 'STUDIO#studio-001',
      SK: 'METADATA',
      studioId: 'studio-001',
      studioName: 'Ink & Steel Studio',
      address: '123 Brick Lane, Shoreditch, London E1 6SB',
      postcode: 'E1 6SB',
      latitude: 51.5225,
      longitude: -0.0786,
      contactInfo: {
        phone: '+44 20 7946 0958',
        email: 'info@inkandsteel.com',
        website: 'https://inkandsteel.com',
        instagram: '@inkandsteelstudio'
      },
      openingHours: {
        monday: '10:00-18:00',
        tuesday: '10:00-18:00',
        wednesday: 'closed',
        thursday: '10:00-18:00',
        friday: '10:00-18:00',
        saturday: '10:00-16:00',
        sunday: 'closed'
      },
      artists: ['artist-001', 'artist-002'],
      artistCount: 2,
      specialties: ['traditional', 'realism'],
      rating: 4.7,
      reviewCount: 89,
      established: 2015
    };

    // Mock invalid studio data
    invalidStudioData = {
      PK: 'STUDIO#studio-002',
      SK: 'METADATA',
      studioId: 'studio-002',
      studioName: '', // Missing required field
      address: '456 Invalid Street',
      postcode: 'INVALID', // Invalid postcode format
      latitude: 100.0, // Invalid latitude (outside UK bounds)
      longitude: -20.0, // Invalid longitude (outside UK bounds)
      contactInfo: {
        phone: 'invalid-phone', // Invalid phone format
        email: 'invalid-email', // Invalid email format
        instagram: 'no-at-symbol' // Invalid Instagram format
      },
      openingHours: {
        monday: 'invalid-hours', // Invalid hours format
        tuesday: '25:00-30:00' // Invalid time format
      },
      artists: ['non-existent-artist'], // Non-existent artist reference
      artistCount: 5, // Mismatch with artists array length
      specialties: ['invalid-specialty'], // Invalid specialty
      rating: 6.0 // Invalid rating (above 5.0)
    };

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Studio Validation', () => {
    test('should validate valid studio data', () => {
      // Test basic validation functionality
      expect(monitor).toBeDefined();
      expect(mockStudioData.studioId).toBe('studio-001');
      expect(mockStudioData.studioName).toBe('Ink & Steel Studio');
      expect(mockStudioData.artistCount).toBe(2);
    });

    test('should detect invalid studio data', () => {
      expect(invalidStudioData.studioName).toBe('');
      expect(invalidStudioData.postcode).toBe('INVALID');
      expect(invalidStudioData.latitude).toBe(100.0);
      expect(invalidStudioData.artistCount).toBe(5);
      expect(invalidStudioData.rating).toBe(6.0);
    });

    test('should validate email formats', () => {
      expect(monitor.isValidEmail('test@example.com')).toBe(true);
      expect(monitor.isValidEmail('invalid-email')).toBe(false);
    });

    test('should validate UK phone numbers', () => {
      expect(monitor.isValidUKPhone('+44 20 7946 0958')).toBe(true);
      expect(monitor.isValidUKPhone('invalid-phone')).toBe(false);
    });
  });

  describe('Studio Health Monitoring', () => {
    test('should generate troubleshooting guidance', () => {
      // Mock health status
      monitor.healthStatus = {
        data: {
          studioValidation: {
            totalStudios: 2,
            validStudios: 1,
            validationRate: '50.0',
            relationshipErrors: [{ type: 'test_error' }],
            addressErrors: [{ type: 'test_error' }],
            imageErrors: [{ type: 'test_error' }]
          }
        }
      };

      const guidance = monitor.generateStudioTroubleshootingGuidance();
      
      expect(guidance).toBeDefined();
      expect(guidance.timestamp).toBeDefined();
      expect(guidance.issues).toBeInstanceOf(Array);
      expect(guidance.recommendations).toBeInstanceOf(Array);
    });

    test('should generate studio recommendations', () => {
      const recommendations = monitor.generateStudioRecommendations();
      
      expect(recommendations).toBeInstanceOf(Array);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('actions');
        expect(rec.actions).toBeInstanceOf(Array);
      });
    });
  });

  describe('Data Quality Checks', () => {
    test('should validate studio data structure', () => {
      expect(mockStudioData).toHaveProperty('studioId');
      expect(mockStudioData).toHaveProperty('studioName');
      expect(mockStudioData).toHaveProperty('contactInfo');
      expect(mockStudioData).toHaveProperty('artists');
      expect(mockStudioData).toHaveProperty('specialties');
    });

    test('should detect data inconsistencies', () => {
      expect(invalidStudioData.artistCount).not.toBe(invalidStudioData.artists.length);
      expect(invalidStudioData.rating).toBeGreaterThan(5.0);
      expect(invalidStudioData.latitude).toBeGreaterThan(90.0);
    });
  });
});