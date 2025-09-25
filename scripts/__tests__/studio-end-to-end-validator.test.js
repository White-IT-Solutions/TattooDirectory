/**
 * Studio End-to-End Validator Tests
 * 
 * Tests for the comprehensive studio data validation system
 * that checks consistency across all services.
 */

const StudioEndToEndValidator = require('../data-management/studio-end-to-end-validator');
const AWS = require('aws-sdk');

// Mock AWS services
jest.mock('aws-sdk');
jest.mock('@opensearch-project/opensearch');

describe('StudioEndToEndValidator', () => {
  let validator;
  let mockDynamoDB;
  let mockS3;
  let mockOpenSearch;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock DynamoDB
    mockDynamoDB = {
      scan: jest.fn(),
      promise: jest.fn()
    };
    mockDynamoDB.scan.mockReturnValue({ promise: mockDynamoDB.promise });

    // Mock S3
    mockS3 = {
      headObject: jest.fn(),
      promise: jest.fn()
    };
    mockS3.headObject.mockReturnValue({ promise: mockS3.promise });

    // Mock OpenSearch
    mockOpenSearch = {
      search: jest.fn()
    };

    // Mock AWS constructors
    AWS.DynamoDB.DocumentClient.mockImplementation(() => mockDynamoDB);
    AWS.S3.mockImplementation(() => mockS3);

    // Create validator instance
    validator = new StudioEndToEndValidator({
      localstack: {
        endpoint: 'http://localhost:4566',
        region: 'us-east-1'
      }
    });

    // Override the OpenSearch client
    validator.opensearch = mockOpenSearch;
    
    // Ensure validation results are properly initialized
    validator.resetValidationResults();
  });

  describe('Constructor', () => {
    test('should initialize with default configuration', () => {
      const defaultValidator = new StudioEndToEndValidator();
      expect(defaultValidator.config.localstack.endpoint).toBe('http://localhost:4566');
      expect(defaultValidator.config.validation.maxConcurrentRequests).toBe(10);
    });

    test('should initialize with custom configuration', () => {
      const customConfig = {
        localstack: { endpoint: 'http://custom:4566' },
        validation: { maxConcurrentRequests: 5 }
      };
      const customValidator = new StudioEndToEndValidator(customConfig);
      expect(customValidator.config.localstack.endpoint).toBe('http://custom:4566');
      expect(customValidator.config.validation.maxConcurrentRequests).toBe(5);
    });
  });

  describe('validateStudioDataEndToEnd', () => {
    test('should run all validation steps successfully', async () => {
      // Mock successful responses
      mockDynamoDB.promise
        .mockResolvedValueOnce({ Items: [] }) // Studios
        .mockResolvedValueOnce({ Items: [] }); // Artists

      mockOpenSearch.search.mockResolvedValue({
        body: { hits: { hits: [] } }
      });

      const result = await validator.validateStudioDataEndToEnd();

      expect(result.summary).toBeDefined();
      expect(result.summary.success).toBeDefined();
      expect(result.details).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    test('should handle validation errors gracefully', async () => {
      // Mock error response
      mockDynamoDB.promise.mockRejectedValue(new Error('DynamoDB connection failed'));

      const result = await validator.validateStudioDataEndToEnd();

      expect(result.summary.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('DynamoDB connection failed');
    });
  });

  describe('validateDynamoDBOpenSearchConsistency', () => {
    test('should detect consistent data between services', async () => {
      const mockStudios = [
        { studioId: 'studio-001', studioName: 'Test Studio 1' },
        { studioId: 'studio-002', studioName: 'Test Studio 2' }
      ];

      // Mock DynamoDB response
      mockDynamoDB.promise.mockResolvedValue({ Items: mockStudios });

      // Mock OpenSearch response
      mockOpenSearch.search.mockResolvedValue({
        body: {
          hits: {
            hits: mockStudios.map(studio => ({ _source: studio }))
          }
        }
      });

      await validator.validateDynamoDBOpenSearchConsistency();

      expect(validator.validationResults.details.dynamoOpenSearchConsistency).toBeDefined();
      expect(validator.validationResults.details.dynamoOpenSearchConsistency.consistent).toBe(true);
      expect(validator.validationResults.details.dynamoOpenSearchConsistency.dynamoCount).toBe(2);
      expect(validator.validationResults.details.dynamoOpenSearchConsistency.opensearchCount).toBe(2);
    });

    test('should detect inconsistent data between services', async () => {
      const dynamoStudios = [
        { studioId: 'studio-001', studioName: 'Test Studio 1' },
        { studioId: 'studio-002', studioName: 'Test Studio 2' }
      ];

      const opensearchStudios = [
        { studioId: 'studio-001', studioName: 'Test Studio 1' }
        // Missing studio-002
      ];

      // Mock responses
      mockDynamoDB.promise.mockResolvedValue({ Items: dynamoStudios });
      mockOpenSearch.search.mockResolvedValue({
        body: {
          hits: {
            hits: opensearchStudios.map(studio => ({ _source: studio }))
          }
        }
      });

      await validator.validateDynamoDBOpenSearchConsistency();

      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors[0].type).toBe('MISSING_OPENSEARCH_RECORD');
    });
  });

  describe('validateStudioImageAccessibility', () => {
    test('should validate accessible studio images', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          images: [
            { url: 'http://localhost:4566/tattoo-images/studios/studio-001/exterior.jpg' },
            { url: 'http://localhost:4566/tattoo-images/studios/studio-001/interior.jpg' }
          ]
        }
      ];

      // Mock DynamoDB response
      mockDynamoDB.promise.mockResolvedValue({ Items: mockStudios });

      // Mock S3 responses (images exist)
      mockS3.promise.mockResolvedValue({});

      await validator.validateStudioImageAccessibility();

      expect(validator.validationResults.details.imageAccessibility).toBeDefined();
      expect(validator.validationResults.details.imageAccessibility.totalImagesChecked).toBe(2);
      expect(validator.validationResults.details.imageAccessibility.accessibleImages).toBe(2);
      expect(validator.validationResults.details.imageAccessibility.inaccessibleImages).toBe(0);
    });

    test('should detect inaccessible studio images', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          images: [
            { url: 'http://localhost:4566/tattoo-images/studios/studio-001/missing.jpg' }
          ]
        }
      ];

      // Mock DynamoDB response
      mockDynamoDB.promise.mockResolvedValue({ Items: mockStudios });

      // Mock S3 error (image doesn't exist)
      mockS3.promise.mockRejectedValue(new Error('NoSuchKey'));

      await validator.validateStudioImageAccessibility();

      expect(validator.validationResults.details.imageAccessibility.inaccessibleImages).toBe(1);
      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors[0].type).toBe('INACCESSIBLE_STUDIO_IMAGE');
    });
  });

  describe('validateArtistStudioRelationships', () => {
    test('should validate correct bidirectional relationships', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          artists: ['artist-001', 'artist-002']
        }
      ];

      const mockArtists = [
        {
          artistId: 'artist-001',
          tattooStudio: { studioId: 'studio-001' }
        },
        {
          artistId: 'artist-002',
          tattooStudio: { studioId: 'studio-001' }
        }
      ];

      // Mock DynamoDB responses
      mockDynamoDB.promise
        .mockResolvedValueOnce({ Items: mockStudios })
        .mockResolvedValueOnce({ Items: mockArtists });

      await validator.validateArtistStudioRelationships();

      expect(validator.validationResults.details.artistStudioRelationships).toBeDefined();
      expect(validator.validationResults.details.artistStudioRelationships.validRelationships).toBe(2);
      expect(validator.validationResults.details.artistStudioRelationships.invalidRelationships).toBe(0);
    });

    test('should detect broken bidirectional relationships', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          artists: ['artist-001', 'artist-002']
        }
      ];

      const mockArtists = [
        {
          artistId: 'artist-001',
          tattooStudio: { studioId: 'studio-001' }
        },
        {
          artistId: 'artist-002',
          // Missing tattooStudio reference
        }
      ];

      // Mock DynamoDB responses
      mockDynamoDB.promise
        .mockResolvedValueOnce({ Items: mockStudios })
        .mockResolvedValueOnce({ Items: mockArtists });

      await validator.validateArtistStudioRelationships();

      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors[0].type).toBe('BROKEN_BIDIRECTIONAL_RELATIONSHIP');
    });
  });

  describe('validateStudioAddressData', () => {
    test('should validate correct UK addresses', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          address: '123 High Street, London',
          postcode: 'SW1A 1AA',
          latitude: 51.5074,
          longitude: -0.1278
        }
      ];

      mockDynamoDB.promise.mockResolvedValue({ Items: mockStudios });

      await validator.validateStudioAddressData();

      expect(validator.validationResults.details.addressValidation).toBeDefined();
      expect(validator.validationResults.details.addressValidation.validAddresses).toBe(1);
      expect(validator.validationResults.details.addressValidation.invalidAddresses).toBe(0);
    });

    test('should detect invalid UK postcodes', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          address: '123 High Street, London',
          postcode: 'INVALID',
          latitude: 51.5074,
          longitude: -0.1278
        }
      ];

      mockDynamoDB.promise.mockResolvedValue({ Items: mockStudios });

      await validator.validateStudioAddressData();

      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors[0].type).toBe('INVALID_POSTCODE_FORMAT');
    });

    test('should detect coordinates outside UK bounds', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          address: '123 High Street, London',
          postcode: 'SW1A 1AA',
          latitude: 40.7128, // New York coordinates
          longitude: -74.0060
        }
      ];

      mockDynamoDB.promise.mockResolvedValue({ Items: mockStudios });

      await validator.validateStudioAddressData();

      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors.some(e => e.type === 'COORDINATES_OUTSIDE_UK')).toBe(true);
    });
  });

  describe('validateStudioSpecialtiesAlignment', () => {
    test('should validate aligned studio specialties with artist styles', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          artists: ['artist-001'],
          specialties: ['traditional', 'realism']
        }
      ];

      const mockArtists = [
        {
          artistId: 'artist-001',
          styles: ['traditional', 'realism']
        }
      ];

      mockDynamoDB.promise
        .mockResolvedValueOnce({ Items: mockStudios })
        .mockResolvedValueOnce({ Items: mockArtists });

      await validator.validateStudioSpecialtiesAlignment();

      expect(validator.validationResults.details.specialtyAlignment).toBeDefined();
      expect(validator.validationResults.details.specialtyAlignment.alignedStudios).toBe(1);
      expect(validator.validationResults.details.specialtyAlignment.misalignedStudios).toBe(0);
    });

    test('should detect misaligned studio specialties', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          artists: ['artist-001'],
          specialties: ['traditional', 'geometric'] // geometric not in artist styles
        }
      ];

      const mockArtists = [
        {
          artistId: 'artist-001',
          styles: ['traditional', 'realism'] // realism not in studio specialties
        }
      ];

      mockDynamoDB.promise
        .mockResolvedValueOnce({ Items: mockStudios })
        .mockResolvedValueOnce({ Items: mockArtists });

      await validator.validateStudioSpecialtiesAlignment();

      expect(validator.validationResults.warningsList.length).toBeGreaterThan(0);
      expect(validator.validationResults.warningsList[0].type).toBe('SPECIALTY_ALIGNMENT_MISMATCH');
    });
  });

  describe('Helper Methods', () => {
    test('isValidUKPostcode should validate UK postcodes correctly', () => {
      expect(validator.isValidUKPostcode('SW1A 1AA')).toBe(true);
      expect(validator.isValidUKPostcode('M1 1AA')).toBe(true);
      expect(validator.isValidUKPostcode('B33 8TH')).toBe(true);
      expect(validator.isValidUKPostcode('W1A 0AX')).toBe(true);
      expect(validator.isValidUKPostcode('INVALID')).toBe(false);
      expect(validator.isValidUKPostcode('12345')).toBe(false);
      expect(validator.isValidUKPostcode('')).toBe(false);
    });

    test('isWithinUKBounds should validate UK coordinates correctly', () => {
      // London coordinates
      expect(validator.isWithinUKBounds(51.5074, -0.1278)).toBe(true);
      
      // Edinburgh coordinates
      expect(validator.isWithinUKBounds(55.9533, -3.1883)).toBe(true);
      
      // New York coordinates (outside UK)
      expect(validator.isWithinUKBounds(40.7128, -74.0060)).toBe(false);
      
      // Paris coordinates (outside UK)
      expect(validator.isWithinUKBounds(48.8566, 2.3522)).toBe(false);
    });

    test('extractS3KeyFromUrl should extract S3 keys correctly', () => {
      const url = 'http://localhost:4566/tattoo-images/studios/studio-001/exterior.jpg';
      const key = validator.extractS3KeyFromUrl(url);
      expect(key).toBe('tattoo-images/studios/studio-001/exterior.jpg');
    });

    test('compareStudioField should compare fields correctly', () => {
      // Primitive values
      expect(validator.compareStudioField({ name: 'Test' }, { name: 'Test' }, 'name')).toBe(true);
      expect(validator.compareStudioField({ name: 'Test1' }, { name: 'Test2' }, 'name')).toBe(false);
      
      // Arrays
      expect(validator.compareStudioField(
        { styles: ['a', 'b'] }, 
        { styles: ['b', 'a'] }, 
        'styles'
      )).toBe(true);
      
      // Objects
      expect(validator.compareStudioField(
        { contact: { email: 'test@example.com' } },
        { contact: { email: 'test@example.com' } },
        'contact'
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle DynamoDB errors gracefully', async () => {
      mockDynamoDB.promise.mockRejectedValue(new Error('DynamoDB error'));

      await validator.validateDynamoDBOpenSearchConsistency();

      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors[0].type).toBe('DYNAMO_OPENSEARCH_VALIDATION_ERROR');
    });

    test('should handle OpenSearch errors gracefully', async () => {
      mockDynamoDB.promise.mockResolvedValue({ Items: [] });
      mockOpenSearch.search.mockRejectedValue(new Error('OpenSearch error'));

      await validator.validateDynamoDBOpenSearchConsistency();

      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors[0].type).toBe('OPENSEARCH_QUERY_ERROR');
    });

    test('should handle S3 errors gracefully', async () => {
      const mockStudios = [
        {
          studioId: 'studio-001',
          images: [{ url: 'http://localhost:4566/tattoo-images/test.jpg' }]
        }
      ];

      mockDynamoDB.promise.mockResolvedValue({ Items: mockStudios });
      mockS3.promise.mockRejectedValue(new Error('S3 error'));

      await validator.validateStudioImageAccessibility();

      expect(validator.validationResults.errors.length).toBeGreaterThan(0);
      expect(validator.validationResults.errors[0].type).toBe('INACCESSIBLE_STUDIO_IMAGE');
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive validation report', async () => {
      // Add some test data to validation results
      validator.validationResults.passed = 5;
      validator.validationResults.failed = 2;
      validator.validationResults.warnings = 1;
      validator.validationResults.errors = [
        { type: 'TEST_ERROR', message: 'Test error message' }
      ];
      validator.validationResults.warningsList = [
        { type: 'TEST_WARNING', message: 'Test warning message' }
      ];

      const report = validator.generateValidationReport();

      expect(report.summary).toBeDefined();
      expect(report.summary.totalChecks).toBe(8);
      expect(report.summary.passed).toBe(5);
      expect(report.summary.failed).toBe(2);
      expect(report.summary.warnings).toBe(1);
      expect(report.summary.success).toBe(false);
      expect(report.errors).toHaveLength(1);
      expect(report.warnings).toHaveLength(1);
      expect(report.timestamp).toBeDefined();
    });
  });
});