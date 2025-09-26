#!/usr/bin/env node

/**
 * Studio Data Validator Tests
 * 
 * Comprehensive tests for the StudioDataValidator class
 */

const { StudioDataValidator } = require('../data-management/studio-data-validator');
const { DATA_CONFIG } = require('../data-config');

describe('StudioDataValidator', () => {
  let validator;
  let validStudio;

  beforeEach(() => {
    validator = new StudioDataValidator();
    
    // Valid studio data for testing
    validStudio = {
      studioId: 'studio-001',
      studioName: 'Test Studio',
      address: '123 Test Street, Test Area, London E1 6SB',
      postcode: 'E1 6SB',
      latitude: 51.5225,
      longitude: -0.0786,
      locationDisplay: 'Test Area, London, UK',
      contactInfo: {
        phone: '+44 20 7946 0958',
        email: 'test@teststudio.com',
        website: 'https://teststudio.com',
        instagram: '@teststudio'
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
      rating: 4.5,
      reviewCount: 50,
      established: 2020,
      specialties: ['traditional', 'realism']
    };
  });

  describe('validateStudio', () => {
    test('should validate a correct studio', () => {
      const result = validator.validateStudio(validStudio);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidStudio = { ...validStudio };
      delete invalidStudio.studioId;
      delete invalidStudio.studioName;
      
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required field: studioId');
      expect(result.errors).toContain('Missing required field: studioName');
    });

    test('should validate studio ID format', () => {
      const invalidStudio = { ...validStudio, studioId: 'invalid-id' };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Studio ID must follow format'))).toBe(true);
    });

    test('should validate UK postcode format', () => {
      const invalidStudio = { ...validStudio, postcode: 'INVALID' };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid UK postcode format'))).toBe(true);
    });

    test('should validate coordinate ranges for UK', () => {
      const invalidStudio = { ...validStudio, latitude: 70.0, longitude: 10.0 };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('outside UK range'))).toBe(true);
    });

    test('should validate phone number format', () => {
      const invalidStudio = { 
        ...validStudio, 
        contactInfo: { ...validStudio.contactInfo, phone: 'invalid-phone' }
      };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid UK phone number format'))).toBe(true);
    });

    test('should validate email format', () => {
      const invalidStudio = { 
        ...validStudio, 
        contactInfo: { ...validStudio.contactInfo, email: 'invalid-email' }
      };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid email format'))).toBe(true);
    });

    test('should validate Instagram handle format', () => {
      const invalidStudio = { 
        ...validStudio, 
        contactInfo: { ...validStudio.contactInfo, instagram: 'invalid-handle' }
      };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid Instagram handle format'))).toBe(true);
    });

    test('should validate opening hours format', () => {
      const invalidStudio = { 
        ...validStudio, 
        openingHours: { ...validStudio.openingHours, monday: 'invalid-hours' }
      };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid opening hours format'))).toBe(true);
    });

    test('should validate specialties against allowed values', () => {
      const invalidStudio = { ...validStudio, specialties: ['invalid-specialty'] };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid specialty'))).toBe(true);
    });

    test('should validate rating range', () => {
      const invalidStudio = { ...validStudio, rating: 6.0 };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Rating must be between 1.0 and 5.0'))).toBe(true);
    });

    test('should validate established year', () => {
      const invalidStudio = { ...validStudio, established: 1800 };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('outside reasonable range'))).toBe(true);
    });

    test('should validate artist ID format', () => {
      const invalidStudio = { ...validStudio, artists: ['invalid-artist-id'] };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid artist ID format'))).toBe(true);
    });

    test('should validate artist count consistency', () => {
      const invalidStudio = { ...validStudio, artistCount: 5 };
      const result = validator.validateStudio(invalidStudio);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Artist count') && error.includes('does not match'))).toBe(true);
    });
  });

  describe('validateStudios', () => {
    test('should validate multiple studios', () => {
      const studios = [validStudio, { ...validStudio, studioId: 'studio-002' }];
      const result = validator.validateStudios(studios);
      expect(result.isValid).toBe(true);
      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(2);
      expect(result.summary.invalid).toBe(0);
    });

    test('should detect duplicate studio IDs', () => {
      const studios = [validStudio, validStudio];
      const result = validator.validateStudios(studios);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Duplicate studio IDs'))).toBe(true);
    });

    test('should handle non-array input', () => {
      const result = validator.validateStudios('not-an-array');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Studios data must be an array');
    });

    test('should provide summary statistics', () => {
      const invalidStudio = { ...validStudio, studioId: 'invalid-id' };
      const studios = [validStudio, invalidStudio];
      const result = validator.validateStudios(studios);
      
      expect(result.summary.total).toBe(2);
      expect(result.summary.valid).toBe(1);
      expect(result.summary.invalid).toBe(1);
    });
  });

  describe('generateValidationReport', () => {
    test('should generate a comprehensive report', () => {
      const validationResult = validator.validateStudios([validStudio]);
      const report = validator.generateValidationReport(validationResult);
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('overall');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('warnings');
      expect(report).toHaveProperty('details');
      expect(report.overall.totalStudios).toBe(1);
      expect(report.overall.validStudios).toBe(1);
    });
  });

  describe('formatValidationReport', () => {
    test('should format report as readable text', () => {
      const validationResult = validator.validateStudios([validStudio]);
      const formatted = validator.formatValidationReport(validationResult);
      
      expect(formatted).toContain('Studio Data Validation Report');
      expect(formatted).toContain('Total Studios: 1');
      expect(formatted).toContain('✅ VALID');
    });

    test('should show errors in formatted report', () => {
      const invalidStudio = { ...validStudio, studioId: 'invalid' };
      const validationResult = validator.validateStudios([invalidStudio]);
      const formatted = validator.formatValidationReport(validationResult);
      
      expect(formatted).toContain('❌ INVALID');
      expect(formatted).toContain('❌ Errors:');
    });
  });

  describe('edge cases', () => {
    test('should handle empty studio object', () => {
      const result = validator.validateStudio({});
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle null values', () => {
      const studioWithNulls = { ...validStudio, studioName: null, rating: null };
      const result = validator.validateStudio(studioWithNulls);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('cannot be null'))).toBe(true);
    });

    test('should handle empty arrays', () => {
      const result = validator.validateStudios([]);
      expect(result.isValid).toBe(true);
      expect(result.summary.total).toBe(0);
    });
  });
});