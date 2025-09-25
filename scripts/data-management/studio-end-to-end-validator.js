/**
 * Studio End-to-End Data Validator
 * 
 * Comprehensive validation system that verifies studio data consistency
 * across all services (DynamoDB, OpenSearch, S3, Frontend Mock Data).
 * 
 * Validates:
 * - DynamoDB studio records match OpenSearch indices
 * - Studio images are accessible via S3 URLs
 * - Artist-studio relationships are bidirectional and consistent
 * - Frontend mock data matches backend seeded data structure
 * - Studio address data accuracy and postcode format
 * - Studio specialties match assigned artist styles
 */

const AWS = require('aws-sdk');
const { Client } = require('@opensearch-project/opensearch');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class StudioEndToEndValidator {
  constructor(config = {}) {
    this.config = {
      localstack: {
        endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
        region: 'us-east-1'
      },
      validation: {
        maxConcurrentRequests: 10,
        imageTimeoutMs: 5000,
        retryAttempts: 3
      },
      ...config
    };

    // Initialize AWS clients
    this.dynamodb = new AWS.DynamoDB.DocumentClient({
      endpoint: this.config.localstack.endpoint,
      region: this.config.localstack.region,
      accessKeyId: 'test',
      secretAccessKey: 'test'
    });

    this.s3 = new AWS.S3({
      endpoint: this.config.localstack.endpoint,
      region: this.config.localstack.region,
      accessKeyId: 'test',
      secretAccessKey: 'test',
      s3ForcePathStyle: true
    });

    // Initialize OpenSearch client
    this.opensearch = new Client({
      node: this.config.localstack.endpoint,
      auth: {
        username: 'admin',
        password: 'admin'
      },
      ssl: {
        rejectUnauthorized: false
      }
    });

    this.validationResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      warnings: [],
      details: {}
    };
  }

  /**
   * Run comprehensive end-to-end validation
   */
  async validateStudioDataEndToEnd() {
    console.log('🔍 Starting comprehensive studio data validation...');
    
    try {
      // Reset validation results
      this.resetValidationResults();

      // Step 1: Validate DynamoDB-OpenSearch consistency
      await this.validateDynamoDBOpenSearchConsistency();

      // Step 2: Validate studio image accessibility
      await this.validateStudioImageAccessibility();

      // Step 3: Validate artist-studio relationships
      await this.validateArtistStudioRelationships();

      // Step 4: Validate frontend mock data consistency
      await this.validateFrontendMockDataConsistency();

      // Step 5: Validate studio address data
      await this.validateStudioAddressData();

      // Step 6: Validate studio specialties alignment
      await this.validateStudioSpecialtiesAlignment();

      // Generate final report
      const report = this.generateValidationReport();
      
      console.log('✅ End-to-end validation completed');
      return report;

    } catch (error) {
      this.addError('VALIDATION_SYSTEM_ERROR', `Validation system error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate DynamoDB studio records match OpenSearch indices
   */
  async validateDynamoDBOpenSearchConsistency() {
    console.log('📊 Validating DynamoDB-OpenSearch consistency...');
    
    try {
      // Get all studios from DynamoDB
      const dynamoStudios = await this.getAllStudiosFromDynamoDB();
      
      // Get all studios from OpenSearch
      const opensearchStudios = await this.getAllStudiosFromOpenSearch();

      // Create maps for comparison
      const dynamoMap = new Map(dynamoStudios.map(s => [s.studioId, s]));
      const opensearchMap = new Map(opensearchStudios.map(s => [s.studioId, s]));

      // Check for missing studios in OpenSearch
      for (const [studioId, dynamoStudio] of dynamoMap) {
        if (!opensearchMap.has(studioId)) {
          this.addError('MISSING_OPENSEARCH_RECORD', 
            `Studio ${studioId} exists in DynamoDB but missing in OpenSearch`);
          continue;
        }

        // Validate field consistency
        const opensearchStudio = opensearchMap.get(studioId);
        this.validateStudioFieldConsistency(dynamoStudio, opensearchStudio);
      }

      // Check for extra studios in OpenSearch
      for (const [studioId] of opensearchMap) {
        if (!dynamoMap.has(studioId)) {
          this.addWarning('EXTRA_OPENSEARCH_RECORD', 
            `Studio ${studioId} exists in OpenSearch but missing in DynamoDB`);
        }
      }

      this.validationResults.details.dynamoOpenSearchConsistency = {
        dynamoCount: dynamoStudios.length,
        opensearchCount: opensearchStudios.length,
        consistent: this.validationResults.errors.filter(e => 
          e.type.includes('OPENSEARCH')).length === 0
      };

      console.log(`✅ DynamoDB-OpenSearch consistency check completed`);

    } catch (error) {
      this.addError('DYNAMO_OPENSEARCH_VALIDATION_ERROR', 
        `Failed to validate DynamoDB-OpenSearch consistency: ${error.message}`);
    }
  }

  /**
   * Validate all studio images are accessible via S3 URLs
   */
  async validateStudioImageAccessibility() {
    console.log('🖼️ Validating studio image accessibility...');
    
    try {
      const studios = await this.getAllStudiosFromDynamoDB();
      const imageValidationResults = [];

      for (const studio of studios) {
        if (studio.images && studio.images.length > 0) {
          const studioImageResults = await this.validateStudioImages(studio);
          imageValidationResults.push({
            studioId: studio.studioId,
            ...studioImageResults
          });
        } else {
          this.addWarning('NO_STUDIO_IMAGES', 
            `Studio ${studio.studioId} has no images configured`);
        }
      }

      this.validationResults.details.imageAccessibility = {
        studiosWithImages: imageValidationResults.length,
        totalImagesChecked: imageValidationResults.reduce((sum, r) => sum + r.totalImages, 0),
        accessibleImages: imageValidationResults.reduce((sum, r) => sum + r.accessibleImages, 0),
        inaccessibleImages: imageValidationResults.reduce((sum, r) => sum + r.inaccessibleImages, 0)
      };

      console.log(`✅ Studio image accessibility check completed`);

    } catch (error) {
      this.addError('IMAGE_ACCESSIBILITY_VALIDATION_ERROR', 
        `Failed to validate studio image accessibility: ${error.message}`);
    }
  }

  /**
   * Validate artist-studio relationships are bidirectional and consistent
   */
  async validateArtistStudioRelationships() {
    console.log('🔗 Validating artist-studio relationships...');
    
    try {
      const studios = await this.getAllStudiosFromDynamoDB();
      const artists = await this.getAllArtistsFromDynamoDB();

      // Create maps for efficient lookup
      const studioMap = new Map(studios.map(s => [s.studioId, s]));
      const artistMap = new Map(artists.map(a => [a.artistId, a]));

      let validRelationships = 0;
      let invalidRelationships = 0;

      // Validate studio -> artist relationships
      for (const studio of studios) {
        if (studio.artists && studio.artists.length > 0) {
          for (const artistId of studio.artists) {
            const artist = artistMap.get(artistId);
            
            if (!artist) {
              this.addError('MISSING_ARTIST_REFERENCE', 
                `Studio ${studio.studioId} references non-existent artist ${artistId}`);
              invalidRelationships++;
              continue;
            }

            // Check if artist references this studio back
            if (!artist.tattooStudio || artist.tattooStudio.studioId !== studio.studioId) {
              this.addError('BROKEN_BIDIRECTIONAL_RELATIONSHIP', 
                `Artist ${artistId} doesn't reference studio ${studio.studioId} correctly`);
              invalidRelationships++;
            } else {
              validRelationships++;
            }
          }
        }
      }

      // Validate artist -> studio relationships
      for (const artist of artists) {
        if (artist.tattooStudio) {
          const studio = studioMap.get(artist.tattooStudio.studioId);
          
          if (!studio) {
            this.addError('MISSING_STUDIO_REFERENCE', 
              `Artist ${artist.artistId} references non-existent studio ${artist.tattooStudio.studioId}`);
            invalidRelationships++;
            continue;
          }

          // Check if studio lists this artist
          if (!studio.artists || !studio.artists.includes(artist.artistId)) {
            this.addError('BROKEN_STUDIO_ARTIST_LIST', 
              `Studio ${studio.studioId} doesn't list artist ${artist.artistId} in its artists array`);
            invalidRelationships++;
          }
        }
      }

      this.validationResults.details.artistStudioRelationships = {
        validRelationships,
        invalidRelationships,
        totalStudios: studios.length,
        totalArtists: artists.length,
        studiosWithArtists: studios.filter(s => s.artists && s.artists.length > 0).length,
        artistsWithStudios: artists.filter(a => a.tattooStudio).length
      };

      console.log(`✅ Artist-studio relationship validation completed`);

    } catch (error) {
      this.addError('RELATIONSHIP_VALIDATION_ERROR', 
        `Failed to validate artist-studio relationships: ${error.message}`);
    }
  }

  /**
   * Validate frontend mock data matches backend seeded data structure
   */
  async validateFrontendMockDataConsistency() {
    console.log('🎭 Validating frontend mock data consistency...');
    
    try {
      // Load frontend mock data
      const frontendMockPath = path.join(process.cwd(), 'frontend', 'src', 'app', 'data', 'mockStudioData.js');
      
      let frontendStudios = [];
      try {
        const mockDataContent = await fs.readFile(frontendMockPath, 'utf8');
        // Extract the mockStudios array from the file
        const mockStudiosMatch = mockDataContent.match(/export const mockStudios = (\[[\s\S]*?\]);/);
        if (mockStudiosMatch) {
          frontendStudios = JSON.parse(mockStudiosMatch[1]);
        }
      } catch (error) {
        this.addError('FRONTEND_MOCK_DATA_MISSING', 
          `Frontend mock data file not found or invalid: ${frontendMockPath}`);
        return;
      }

      // Get backend studios
      const backendStudios = await this.getAllStudiosFromDynamoDB();

      // Create maps for comparison
      const frontendMap = new Map(frontendStudios.map(s => [s.studioId, s]));
      const backendMap = new Map(backendStudios.map(s => [s.studioId, s]));

      let consistentStudios = 0;
      let inconsistentStudios = 0;

      // Validate each studio's structure and data
      for (const [studioId, backendStudio] of backendMap) {
        const frontendStudio = frontendMap.get(studioId);
        
        if (!frontendStudio) {
          this.addWarning('MISSING_FRONTEND_STUDIO', 
            `Studio ${studioId} exists in backend but missing in frontend mock data`);
          inconsistentStudios++;
          continue;
        }

        // Validate required fields match
        const requiredFields = ['studioId', 'studioName', 'locationDisplay', 'address', 'contactInfo', 'specialties'];
        let fieldConsistency = true;

        for (const field of requiredFields) {
          if (!this.compareStudioField(backendStudio, frontendStudio, field)) {
            this.addError('FRONTEND_BACKEND_FIELD_MISMATCH', 
              `Studio ${studioId} field '${field}' doesn't match between backend and frontend`);
            fieldConsistency = false;
          }
        }

        if (fieldConsistency) {
          consistentStudios++;
        } else {
          inconsistentStudios++;
        }
      }

      // Check for extra studios in frontend
      for (const [studioId] of frontendMap) {
        if (!backendMap.has(studioId)) {
          this.addWarning('EXTRA_FRONTEND_STUDIO', 
            `Studio ${studioId} exists in frontend mock data but missing in backend`);
        }
      }

      this.validationResults.details.frontendMockConsistency = {
        backendStudios: backendStudios.length,
        frontendStudios: frontendStudios.length,
        consistentStudios,
        inconsistentStudios
      };

      console.log(`✅ Frontend mock data consistency check completed`);

    } catch (error) {
      this.addError('FRONTEND_MOCK_VALIDATION_ERROR', 
        `Failed to validate frontend mock data consistency: ${error.message}`);
    }
  }

  /**
   * Validate studio address data accuracy and postcode format
   */
  async validateStudioAddressData() {
    console.log('📍 Validating studio address data...');
    
    try {
      const studios = await this.getAllStudiosFromDynamoDB();
      
      let validAddresses = 0;
      let invalidAddresses = 0;

      for (const studio of studios) {
        let addressValid = true;

        // Validate required address fields
        if (!studio.address || typeof studio.address !== 'string') {
          this.addError('INVALID_STUDIO_ADDRESS', 
            `Studio ${studio.studioId} has invalid or missing address`);
          addressValid = false;
        }

        // Validate postcode format (UK postcodes)
        if (!studio.postcode || !this.isValidUKPostcode(studio.postcode)) {
          this.addError('INVALID_POSTCODE_FORMAT', 
            `Studio ${studio.studioId} has invalid UK postcode: ${studio.postcode}`);
          addressValid = false;
        }

        // Validate coordinates
        if (!this.isValidCoordinate(studio.latitude) || !this.isValidCoordinate(studio.longitude)) {
          this.addError('INVALID_COORDINATES', 
            `Studio ${studio.studioId} has invalid coordinates: ${studio.latitude}, ${studio.longitude}`);
          addressValid = false;
        }

        // Validate UK coordinate bounds
        if (!this.isWithinUKBounds(studio.latitude, studio.longitude)) {
          this.addError('COORDINATES_OUTSIDE_UK', 
            `Studio ${studio.studioId} coordinates are outside UK bounds: ${studio.latitude}, ${studio.longitude}`);
          addressValid = false;
        }

        // Validate location display format
        if (!studio.locationDisplay || !studio.locationDisplay.includes(',')) {
          this.addWarning('INVALID_LOCATION_DISPLAY', 
            `Studio ${studio.studioId} has invalid locationDisplay format: ${studio.locationDisplay}`);
        }

        if (addressValid) {
          validAddresses++;
        } else {
          invalidAddresses++;
        }
      }

      this.validationResults.details.addressValidation = {
        totalStudios: studios.length,
        validAddresses,
        invalidAddresses
      };

      console.log(`✅ Studio address data validation completed`);

    } catch (error) {
      this.addError('ADDRESS_VALIDATION_ERROR', 
        `Failed to validate studio address data: ${error.message}`);
    }
  }

  /**
   * Validate studio specialties match assigned artist styles
   */
  async validateStudioSpecialtiesAlignment() {
    console.log('🎨 Validating studio specialties alignment...');
    
    try {
      const studios = await this.getAllStudiosFromDynamoDB();
      const artists = await this.getAllArtistsFromDynamoDB();

      // Create artist map for efficient lookup
      const artistMap = new Map(artists.map(a => [a.artistId, a]));

      let alignedStudios = 0;
      let misalignedStudios = 0;

      for (const studio of studios) {
        if (!studio.artists || studio.artists.length === 0) {
          this.addWarning('STUDIO_NO_ARTISTS', 
            `Studio ${studio.studioId} has no assigned artists`);
          continue;
        }

        // Collect all artist styles for this studio
        const artistStyles = new Set();
        for (const artistId of studio.artists) {
          const artist = artistMap.get(artistId);
          if (artist && artist.styles) {
            artist.styles.forEach(style => artistStyles.add(style));
          }
        }

        // Check if studio specialties align with artist styles
        const studioSpecialties = new Set(studio.specialties || []);
        const alignmentIssues = [];

        // Check for studio specialties not covered by any artist
        for (const specialty of studioSpecialties) {
          if (!artistStyles.has(specialty)) {
            alignmentIssues.push(`Specialty '${specialty}' not covered by any artist`);
          }
        }

        // Check for major artist styles not reflected in studio specialties
        for (const style of artistStyles) {
          if (!studioSpecialties.has(style)) {
            alignmentIssues.push(`Artist style '${style}' not reflected in studio specialties`);
          }
        }

        if (alignmentIssues.length > 0) {
          this.addWarning('SPECIALTY_ALIGNMENT_MISMATCH', 
            `Studio ${studio.studioId} specialty alignment issues: ${alignmentIssues.join(', ')}`);
          misalignedStudios++;
        } else {
          alignedStudios++;
        }
      }

      this.validationResults.details.specialtyAlignment = {
        totalStudios: studios.length,
        alignedStudios,
        misalignedStudios
      };

      console.log(`✅ Studio specialties alignment validation completed`);

    } catch (error) {
      this.addError('SPECIALTY_ALIGNMENT_VALIDATION_ERROR', 
        `Failed to validate studio specialties alignment: ${error.message}`);
    }
  }

  // Helper methods

  async getAllStudiosFromDynamoDB() {
    const params = {
      TableName: 'TattooArtists',
      FilterExpression: 'begins_with(pk, :studioPrefix)',
      ExpressionAttributeValues: {
        ':studioPrefix': 'STUDIO#'
      }
    };

    const result = await this.dynamodb.scan(params).promise();
    return result.Items || [];
  }

  async getAllArtistsFromDynamoDB() {
    const params = {
      TableName: 'TattooArtists',
      FilterExpression: 'begins_with(pk, :artistPrefix)',
      ExpressionAttributeValues: {
        ':artistPrefix': 'ARTIST#'
      }
    };

    const result = await this.dynamodb.scan(params).promise();
    return result.Items || [];
  }

  async getAllStudiosFromOpenSearch() {
    try {
      const response = await this.opensearch.search({
        index: 'studios',
        body: {
          query: { match_all: {} },
          size: 1000
        }
      });

      return response.body.hits.hits.map(hit => hit._source);
    } catch (error) {
      this.addError('OPENSEARCH_QUERY_ERROR', `Failed to query OpenSearch: ${error.message}`);
      return [];
    }
  }

  validateStudioFieldConsistency(dynamoStudio, opensearchStudio) {
    const fieldsToCheck = ['studioName', 'locationDisplay', 'postcode', 'rating', 'specialties'];
    
    for (const field of fieldsToCheck) {
      if (!this.compareStudioField(dynamoStudio, opensearchStudio, field)) {
        this.addError('FIELD_INCONSISTENCY', 
          `Studio ${dynamoStudio.studioId} field '${field}' differs between DynamoDB and OpenSearch`);
      }
    }
  }

  async validateStudioImages(studio) {
    const results = {
      totalImages: 0,
      accessibleImages: 0,
      inaccessibleImages: 0,
      errors: []
    };

    for (const image of studio.images) {
      results.totalImages++;
      
      try {
        // Check if image exists in S3
        const s3Key = this.extractS3KeyFromUrl(image.url);
        await this.s3.headObject({
          Bucket: 'tattoo-images',
          Key: s3Key
        }).promise();
        
        results.accessibleImages++;
      } catch (error) {
        results.inaccessibleImages++;
        results.errors.push(`Image ${image.url} not accessible: ${error.message}`);
        this.addError('INACCESSIBLE_STUDIO_IMAGE', 
          `Studio ${studio.studioId} image not accessible: ${image.url}`);
      }
    }

    return results;
  }

  compareStudioField(obj1, obj2, field) {
    const val1 = obj1[field];
    const val2 = obj2[field];

    // Handle arrays
    if (Array.isArray(val1) && Array.isArray(val2)) {
      return JSON.stringify(val1.sort()) === JSON.stringify(val2.sort());
    }

    // Handle objects
    if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
      return JSON.stringify(val1) === JSON.stringify(val2);
    }

    // Handle primitives
    return val1 === val2;
  }

  isValidUKPostcode(postcode) {
    // UK postcode regex pattern
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode);
  }

  isValidCoordinate(coord) {
    return typeof coord === 'number' && !isNaN(coord) && isFinite(coord);
  }

  isWithinUKBounds(lat, lng) {
    // UK approximate bounds
    return lat >= 49.9 && lat <= 60.9 && lng >= -8.2 && lng <= 1.8;
  }

  extractS3KeyFromUrl(url) {
    // Extract S3 key from LocalStack URL
    // URL format: http://localhost:4566/bucket-name/key/path
    try {
      const urlObj = new URL(url);
      // Remove leading slash and return the path
      return urlObj.pathname.substring(1);
    } catch (error) {
      // Fallback to regex if URL parsing fails
      const match = url.match(/\/([^\/]+\/.+)$/);
      return match ? match[1] : url;
    }
  }

  resetValidationResults() {
    this.validationResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      warningsList: [],
      details: {}
    };
  }

  addError(type, message) {
    this.validationResults.errors.push({ type, message, timestamp: new Date().toISOString() });
    this.validationResults.failed++;
  }

  addWarning(type, message) {
    this.validationResults.warningsList.push({ type, message, timestamp: new Date().toISOString() });
    this.validationResults.warnings++;
  }

  generateValidationReport() {
    const totalChecks = this.validationResults.passed + this.validationResults.failed + this.validationResults.warnings;
    
    return {
      summary: {
        totalChecks,
        passed: this.validationResults.passed,
        failed: this.validationResults.failed,
        warnings: this.validationResults.warnings,
        success: this.validationResults.failed === 0
      },
      errors: this.validationResults.errors,
      warnings: this.validationResults.warningsList,
      details: this.validationResults.details,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = StudioEndToEndValidator;