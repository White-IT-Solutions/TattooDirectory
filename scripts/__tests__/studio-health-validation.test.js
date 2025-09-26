#!/usr/bin/env node

/**
 * Studio Health Validation Tests
 * 
 * Tests for studio data validation and health checking functionality
 * Tests health monitoring, data consistency validation, and troubleshooting
 */

const { HealthMonitor } = require('../health-monitor');
const { StudioDataValidator } = require('../data-management/studio-data-validator');
const { DATA_CONFIG } = require('../data-config');

// Mock external dependencies
jest.mock('../database-seeder');
jest.mock('../state-manager');

describe('Studio Health Validation', () => {
  let healthMonitor;
  let studioValidator;
  let mockStudios;
  let mockArtists;

  beforeEach(() => {
    healthMonitor = new HealthMonitor(DATA_CONFIG);
    studioValidator = new StudioDataValidator(DATA_CONFIG);
    
    // Mock studio data
    mockStudios = [
      {
        studioId: 'studio-001',
        studioName: 'London Ink Studio',
        address: '123 Test Street, Shoreditch, London E1 6SB',
        postcode: 'E1 6SB',
        latitude: 51.5225,
        longitude: -0.0786,
        locationDisplay: 'Shoreditch, London, UK',
        contactInfo: {
          phone: '+44 20 7946 0958',
          email: 'info@londonink.com',
          website: 'https://londonink.com',
          instagram: '@londoninkstudio'
        },
        openingHours: {
          monday: '10:00-18:00',
          tuesday: '10:00-18:00',
          wednesday: '10:00-18:00',
          thursday: '10:00-18:00',
          friday: '10:00-18:00',
          saturday: '10:00-18:00',
          sunday: 'closed'
        },
        artists: ['artist-001', 'artist-002'],
        artistCount: 2,
        rating: 4.7,
        reviewCount: 89,
        established: 2015,
        specialties: ['traditional', 'neo_traditional'],
        images: [
          {
            type: 'exterior',
            url: 'http://localhost:4566/test-bucket/studios/studio-001/exterior/1_medium.webp',
            description: 'Studio exterior',
            isPrimary: true
          }
        ]
      },
      {
        studioId: 'studio-002',
        studioName: 'Manchester Tattoo Co',
        address: '456 Test Road, Northern Quarter, Manchester M1 1AA',
        postcode: 'M1 1AA',
        latitude: 53.4808,
        longitude: -2.2426,
        locationDisplay: 'Northern Quarter, Manchester, UK',
        contactInfo: {
          phone: '+44 161 123 4567',
          email: 'hello@manchestertattoo.co.uk',
          website: 'https://manchestertattoo.co.uk',
          instagram: '@manchestertattoo'
        },
        openingHours: {
          monday: 'closed',
          tuesday: '11:00-19:00',
          wednesday: '11:00-19:00',
          thursday: '11:00-19:00',
          friday: '11:00-19:00',
          saturday: '10:00-18:00',
          sunday: '12:00-17:00'
        },
        artists: ['artist-003'],
        artistCount: 1,
        rating: 4.5,
        reviewCount: 67,
        established: 2018,
        specialties: ['geometric', 'blackwork']
      }
    ];

    // Mock artist data
    mockArtists = [
      {
        artistId: 'artist-001',
        artistName: 'John Smith',
        styles: ['traditional', 'realism'],
        tattooStudio: {
          studioId: 'studio-001',
          studioName: 'London Ink Studio',
          address: {
            street: '123 Test Street, Shoreditch, London E1 6SB',
            city: 'London',
            postcode: 'E1 6SB',
            latitude: 51.5225,
            longitude: -0.0786
          }
        }
      },
      {
        artistId: 'artist-002',
        artistName: 'Jane Doe',
        styles: ['neo_traditional', 'blackwork'],
        tattooStudio: {
          studioId: 'studio-001',
          studioName: 'London Ink Studio',
          address: {
            street: '123 Test Street, Shoreditch, London E1 6SB',
            city: 'London',
            postcode: 'E1 6SB',
            latitude: 51.5225,
            longitude: -0.0786
          }
        }
      },
      {
        artistId: 'artist-003',
        artistName: 'Mike Johnson',
        styles: ['geometric', 'blackwork'],
        tattooStudio: {
          studioId: 'studio-002',
          studioName: 'Manchester Tattoo Co',
          address: {
            street: '456 Test Road, Northern Quarter, Manchester M1 1AA',
            city: 'Manchester',
            postcode: 'M1 1AA',
            latitude: 53.4808,
            longitude: -2.2426
          }
        }
      }
    ];

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('Studio Data Validation Health Checks', () => {
    test('should initialize health monitor correctly', () => {
      expect(healthMonitor).toBeDefined();
      expect(healthMonitor.config).toBeDefined();
    });

    test('should initialize studio validator correctly', () => {
      expect(studioValidator).toBeDefined();
      expect(studioValidator.config).toBeDefined();
    });

    test('should validate studio data structure', () => {
      const studio = mockStudios[0];
      const result = studioValidator.validateStudio(studio);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect studio data inconsistencies', () => {
      const inconsistentStudio = {
        ...mockStudios[0],
        artistCount: 5 // Doesn't match artists array length
      };

      const result = studioValidator.validateStudio(inconsistentStudio);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Artist count'))).toBe(true);
    });
  });

  describe('Studio Health Monitoring', () => {
    test('should have health monitoring capabilities', () => {
      expect(typeof healthMonitor.generateStudioTroubleshootingGuidance).toBe('function');
      expect(typeof healthMonitor.generateStudioRecommendations).toBe('function');
    });

    test('should generate troubleshooting guidance', () => {
      const guidance = healthMonitor.generateStudioTroubleshootingGuidance();

      expect(guidance).toBeDefined();
      expect(guidance.timestamp).toBeDefined();
      expect(guidance.issues).toBeInstanceOf(Array);
      expect(guidance.recommendations).toBeInstanceOf(Array);
    });

    test('should generate studio recommendations', () => {
      const recommendations = healthMonitor.generateStudioRecommendations();

      expect(recommendations).toBeInstanceOf(Array);
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('actions');
        expect(rec.actions).toBeInstanceOf(Array);
      });
    });
  });

  describe('Data Quality Validation', () => {
    test('should validate studio data quality', () => {
      const validationResult = studioValidator.validateStudios(mockStudios);

      expect(validationResult).toBeDefined();
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.summary).toBeDefined();
      expect(validationResult.summary.total).toBe(2);
      expect(validationResult.summary.valid).toBe(2);
    });

    test('should detect data quality issues', () => {
      const poorQualityStudios = [
        {
          studioId: 'studio-001',
          studioName: 'Test Studio',
          contactInfo: {
            phone: 'invalid-phone',
            email: 'invalid-email'
          },
          rating: 6.0, // Invalid rating
          established: 1800 // Invalid year
        }
      ];

      const validationResult = studioValidator.validateStudios(poorQualityStudios);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.summary.invalid).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery', () => {
    test('should handle validation errors gracefully', () => {
      const invalidStudio = {
        studioId: 'invalid-id',
        studioName: null
      };

      const result = studioValidator.validateStudio(invalidStudio);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeInstanceOf(Array);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should provide meaningful error messages', () => {
      const invalidStudio = {
        studioId: 'studio-001'
        // Missing required fields
      };

      const result = studioValidator.validateStudio(invalidStudio);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Missing required field'))).toBe(true);
    });
  });
});