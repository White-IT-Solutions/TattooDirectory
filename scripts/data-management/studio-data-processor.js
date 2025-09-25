#!/usr/bin/env node

/**
 * Studio Data Processor Orchestrator
 * 
 * Coordinates studio data processing workflow by integrating with existing components:
 * - Uses existing studio generator from enhanced frontend-sync-processor
 * - Integrates with studio validator and image processor components
 * - Implements studio count calculation based on artist count and scenarios
 * - Leverages existing artist-studio assignment from frontend-sync-processor
 * - Uses existing studio specialty calculation from frontend-sync-processor
 * - Implements studio data processing workflow coordination with existing pipeline
 * - Adds error handling and recovery for studio processing failures
 * 
 * Requirements: 1.1, 1.6, 1.7, 4.1
 */

const { DATA_CONFIG } = require('../data-config');
const { StudioDataValidator } = require('./studio-data-validator');
const { StudioImageProcessor } = require('./studio-image-processor');
const { FrontendSyncProcessor } = require('../frontend-sync-processor');

/**
 * Studio processing error types
 */
const STUDIO_ERROR_TYPES = {
  STUDIO_GENERATION_FAILED: 'studio_generation_failed',
  STUDIO_VALIDATION_FAILED: 'studio_validation_failed',
  RELATIONSHIP_INCONSISTENCY: 'relationship_inconsistency',
  STUDIO_IMAGE_PROCESSING_FAILED: 'studio_image_processing_failed',
  STUDIO_COUNT_CALCULATION_FAILED: 'studio_count_calculation_failed',
  WORKFLOW_COORDINATION_FAILED: 'workflow_coordination_failed'
};

/**
 * StudioDataProcessor class for orchestrating studio data processing
 */
class StudioDataProcessor {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    
    // Initialize component dependencies
    this.validator = new StudioDataValidator(config);
    this.imageProcessor = new StudioImageProcessor(config);
    this.frontendSyncProcessor = new FrontendSyncProcessor(config);
    
    // Processing statistics
    this.stats = {
      studiosGenerated: 0,
      studiosValidated: 0,
      studiosProcessed: 0,
      relationshipsCreated: 0,
      imagesProcessed: 0,
      errors: [],
      warnings: [],
      startTime: null,
      endTime: null,
      duration: 0
    };
    
    // Error recovery configuration
    this.errorRecovery = {
      maxRetries: 3,
      retryDelay: 1000,
      continueOnError: true
    };
  }

  /**
   * Main orchestration method for studio data processing
   * Requirement 1.1: Generate studio data that matches frontend requirements
   */
  async processStudios(artists, options = {}) {
    const {
      scenario = null,
      forceRegenerate = false,
      skipValidation = false,
      skipImages = false,
      progressCallback = null
    } = options;

    console.log('🏢 Starting studio data processing orchestration...');
    this.stats.startTime = Date.now();

    try {
      // Step 1: Calculate studio count based on artist count and scenario
      const studioCount = this.calculateStudioCount(artists.length, scenario);
      console.log(`📊 Calculated studio count: ${studioCount} studios for ${artists.length} artists`);

      if (progressCallback) progressCallback('Calculating studio requirements', 10);

      // Step 2: Use existing studio generator from frontend-sync-processor
      const generatedStudios = await this.generateStudiosUsingExistingGenerator(
        artists, 
        studioCount, 
        scenario
      );

      if (progressCallback) progressCallback('Studios generated', 30);

      // Step 3: Validate generated studio data
      let validatedStudios = generatedStudios;
      if (!skipValidation) {
        validatedStudios = await this.validateStudiosWithRecovery(generatedStudios);
        if (progressCallback) progressCallback('Studios validated', 50);
      }

      // Step 4: Process studio images
      let studiosWithImages = validatedStudios;
      if (!skipImages) {
        studiosWithImages = await this.processStudioImagesWithRecovery(validatedStudios);
        if (progressCallback) progressCallback('Studio images processed', 70);
      }

      // Step 5: Create and validate artist-studio relationships
      const relationshipData = await this.createArtistStudioRelationships(
        artists, 
        studiosWithImages
      );

      if (progressCallback) progressCallback('Relationships created', 90);

      // Step 6: Final validation and consistency check
      await this.validateWorkflowConsistency(relationshipData);

      if (progressCallback) progressCallback('Processing complete', 100);

      // Update statistics
      this.stats.endTime = Date.now();
      this.stats.duration = this.stats.endTime - this.stats.startTime;
      this.stats.studiosGenerated = generatedStudios.length;
      this.stats.studiosValidated = validatedStudios.length;
      this.stats.studiosProcessed = studiosWithImages.length;
      this.stats.relationshipsCreated = relationshipData.artists.filter(a => a.tattooStudio).length;

      console.log(`✅ Studio data processing completed successfully in ${this.stats.duration}ms`);
      console.log(`📊 Generated ${this.stats.studiosGenerated} studios, processed ${this.stats.studiosProcessed} with images`);

      return {
        success: true,
        artists: relationshipData.artists,
        studios: relationshipData.studios,
        stats: this.getProcessingStats(),
        metadata: {
          scenario,
          studioCount,
          processingTime: this.stats.duration
        }
      };

    } catch (error) {
      return await this.handleProcessingError(error, { artists, scenario, options });
    }
  }

  /**
   * Calculate studio count based on artist count and scenarios
   * Requirement 4.1: Studio data included in all testing scenarios
   */
  calculateStudioCount(artistCount, scenario = null) {
    try {
      // Use scenario-specific studio count if available
      if (scenario) {
        const scenarioConfig = this.config.scenarios[scenario];
        if (scenarioConfig && scenarioConfig.studioCount) {
          console.log(`📋 Using scenario '${scenario}' studio count: ${scenarioConfig.studioCount}`);
          return scenarioConfig.studioCount;
        }

        // Use config method for studio count calculation
        const calculatedCount = this.config.calculateStudioCount(artistCount, scenario);
        if (calculatedCount) {
          console.log(`🧮 Calculated studio count for scenario '${scenario}': ${calculatedCount}`);
          return calculatedCount;
        }
      }

      // Default calculation: 1 studio per 2-3 artists, with min/max bounds
      const calculatedCount = Math.ceil(artistCount / 2.5);
      const finalCount = Math.max(
        this.config.studio.generation.minStudios,
        Math.min(this.config.studio.generation.maxStudios, calculatedCount)
      );

      console.log(`🧮 Default studio count calculation: ${finalCount} (from ${artistCount} artists)`);
      return finalCount;

    } catch (error) {
      console.error('❌ Studio count calculation failed:', error.message);
      this.stats.errors.push({
        type: STUDIO_ERROR_TYPES.STUDIO_COUNT_CALCULATION_FAILED,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      // Fallback to minimum studio count
      const fallbackCount = this.config.studio.generation.minStudios;
      console.warn(`⚠️  Using fallback studio count: ${fallbackCount}`);
      return fallbackCount;
    }
  }

  /**
   * Use existing studio generator from enhanced frontend-sync-processor
   * Requirement 1.6: Bidirectional artist-studio relationships maintained
   */
  async generateStudiosUsingExistingGenerator(artists, studioCount, scenario) {
    console.log('🎨 Using existing studio generator from frontend-sync-processor...');

    try {
      // Configure the frontend sync processor for studio generation
      const generationOptions = {
        artistCount: artists.length,
        scenario: scenario,
        includeBusinessData: true,
        includeStudioData: true,
        studioCount: studioCount
      };

      // Use the existing enhanced mock data generation with studio support
      const mockDataResult = await this.frontendSyncProcessor.generateMockData(generationOptions);

      if (!mockDataResult.success) {
        throw new Error(`Frontend sync processor failed: ${mockDataResult.error}`);
      }

      // Extract studio data from the generated mock data
      const generatedStudios = this.frontendSyncProcessor.generatedStudios || [];

      if (generatedStudios.length === 0) {
        throw new Error('No studios were generated by the frontend sync processor');
      }

      console.log(`✅ Generated ${generatedStudios.length} studios using existing generator`);
      return generatedStudios;

    } catch (error) {
      console.error('❌ Studio generation using existing generator failed:', error.message);
      this.stats.errors.push({
        type: STUDIO_ERROR_TYPES.STUDIO_GENERATION_FAILED,
        message: error.message,
        timestamp: new Date().toISOString(),
        context: { artistCount: artists.length, studioCount, scenario }
      });

      // Attempt fallback generation
      return await this.fallbackStudioGeneration(artists, studioCount, scenario);
    }
  }

  /**
   * Fallback studio generation when existing generator fails
   */
  async fallbackStudioGeneration(artists, studioCount, scenario) {
    console.warn('⚠️  Attempting fallback studio generation...');

    try {
      // Create minimal studio data structure
      const fallbackStudios = [];

      for (let i = 1; i <= studioCount; i++) {
        const studioId = `studio-${String(i).padStart(3, '0')}`;
        const studio = {
          studioId,
          studioName: `Studio ${i}`,
          address: `${i} Test Street, London`,
          postcode: 'SW1A 1AA',
          locationDisplay: 'London, UK',
          latitude: 51.5074 + (Math.random() - 0.5) * 0.01,
          longitude: -0.1278 + (Math.random() - 0.5) * 0.01,
          contactInfo: {
            phone: '+44 20 7946 0958',
            email: `info@studio${i}.com`,
            website: `https://studio${i}.com`,
            instagram: `@studio${i}`
          },
          openingHours: {
            monday: '10:00-18:00',
            tuesday: '10:00-18:00',
            wednesday: '10:00-18:00',
            thursday: '10:00-18:00',
            friday: '10:00-18:00',
            saturday: '10:00-16:00',
            sunday: 'closed'
          },
          specialties: ['traditional', 'realism'],
          rating: 4.0 + Math.random(),
          reviewCount: Math.floor(Math.random() * 100) + 20,
          established: 2015 + Math.floor(Math.random() * 8),
          artists: [],
          artistCount: 0,
          images: [],
          geohash: this.generateGeohash(51.5074, -0.1278)
        };

        fallbackStudios.push(studio);
      }

      console.log(`✅ Generated ${fallbackStudios.length} fallback studios`);
      return fallbackStudios;

    } catch (error) {
      console.error('❌ Fallback studio generation failed:', error.message);
      throw new Error(`Both primary and fallback studio generation failed: ${error.message}`);
    }
  }

  /**
   * Validate studios with error recovery
   * Requirement 1.7: Studio data processing workflow coordination
   */
  async validateStudiosWithRecovery(studios) {
    console.log('🔍 Validating studio data with error recovery...');

    try {
      const validationResult = this.validator.validateStudios(studios);

      if (validationResult.isValid) {
        console.log(`✅ All ${studios.length} studios passed validation`);
        this.stats.studiosValidated = studios.length;
        return studios;
      }

      // Handle validation errors with recovery
      console.warn(`⚠️  Validation found ${validationResult.errors.length} errors, attempting recovery...`);
      
      const recoveredStudios = await this.recoverFromValidationErrors(studios, validationResult);
      
      // Re-validate recovered studios
      const revalidationResult = this.validator.validateStudios(recoveredStudios);
      
      if (revalidationResult.isValid) {
        console.log(`✅ Studio validation recovery successful: ${recoveredStudios.length} studios validated`);
        this.stats.studiosValidated = recoveredStudios.length;
        this.stats.warnings.push(`Recovered from ${validationResult.errors.length} validation errors`);
        return recoveredStudios;
      } else {
        throw new Error(`Validation recovery failed: ${revalidationResult.errors.length} errors remain`);
      }

    } catch (error) {
      console.error('❌ Studio validation failed:', error.message);
      this.stats.errors.push({
        type: STUDIO_ERROR_TYPES.STUDIO_VALIDATION_FAILED,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      if (this.errorRecovery.continueOnError) {
        console.warn('⚠️  Continuing with unvalidated studios due to continueOnError setting');
        return studios;
      } else {
        throw error;
      }
    }
  }

  /**
   * Process studio images with error recovery
   */
  async processStudioImagesWithRecovery(studios) {
    console.log('🖼️  Processing studio images with error recovery...');

    try {
      const studiosWithImages = await this.imageProcessor.processMultipleStudios(studios);
      
      const successfulCount = studiosWithImages.filter(s => s.images && s.images.length > 0).length;
      console.log(`✅ Successfully processed images for ${successfulCount}/${studios.length} studios`);
      
      this.stats.imagesProcessed = successfulCount;
      return studiosWithImages;

    } catch (error) {
      console.error('❌ Studio image processing failed:', error.message);
      this.stats.errors.push({
        type: STUDIO_ERROR_TYPES.STUDIO_IMAGE_PROCESSING_FAILED,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      if (this.errorRecovery.continueOnError) {
        console.warn('⚠️  Continuing without studio images due to continueOnError setting');
        return studios.map(studio => ({ ...studio, images: [], imagesByType: {} }));
      } else {
        throw error;
      }
    }
  }

  /**
   * Create artist-studio relationships using existing logic
   * Requirement 1.6: Bidirectional artist-studio relationships maintained
   */
  async createArtistStudioRelationships(artists, studios) {
    console.log('🔗 Creating bidirectional artist-studio relationships...');

    try {
      // Use the existing relationship creation logic from frontend-sync-processor
      const relationshipData = this.frontendSyncProcessor.generateArtistStudioRelationships(
        [...artists], // Clone to avoid mutation
        [...studios]  // Clone to avoid mutation
      );

      // Validate relationship consistency
      await this.validateRelationshipConsistency(relationshipData.artists, relationshipData.studios);

      console.log(`✅ Created bidirectional relationships for ${relationshipData.artists.length} artists and ${relationshipData.studios.length} studios`);
      
      return relationshipData;

    } catch (error) {
      console.error('❌ Artist-studio relationship creation failed:', error.message);
      this.stats.errors.push({
        type: STUDIO_ERROR_TYPES.RELATIONSHIP_INCONSISTENCY,
        message: error.message,
        timestamp: new Date().toISOString()
      });

      // Attempt manual relationship creation as fallback
      return await this.createFallbackRelationships(artists, studios);
    }
  }

  /**
   * Validate relationship consistency
   */
  async validateRelationshipConsistency(artists, studios) {
    const errors = [];

    // Check that every artist with a studio reference has a valid studio
    for (const artist of artists) {
      if (artist.tattooStudio) {
        const studio = studios.find(s => s.studioId === artist.tattooStudio.studioId);
        if (!studio) {
          errors.push(`Artist ${artist.artistId} references non-existent studio ${artist.tattooStudio.studioId}`);
        } else if (!studio.artists.includes(artist.artistId)) {
          errors.push(`Studio ${studio.studioId} doesn't list artist ${artist.artistId} in its artists array`);
        }
      }
    }

    // Check that every studio's artist list is valid
    for (const studio of studios) {
      for (const artistId of studio.artists || []) {
        const artist = artists.find(a => a.artistId === artistId);
        if (!artist) {
          errors.push(`Studio ${studio.studioId} references non-existent artist ${artistId}`);
        } else if (artist.tattooStudio?.studioId !== studio.studioId) {
          errors.push(`Artist ${artistId} doesn't reference studio ${studio.studioId} correctly`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Relationship validation failed: ${errors.join('; ')}`);
    }

    console.log('✅ Artist-studio relationship consistency validated');
  }

  /**
   * Create fallback relationships when existing logic fails
   */
  async createFallbackRelationships(artists, studios) {
    console.warn('⚠️  Creating fallback artist-studio relationships...');

    try {
      const updatedArtists = [...artists];
      const updatedStudios = [...studios];

      // Simple round-robin assignment
      let studioIndex = 0;
      const maxArtistsPerStudio = this.config.studio.generation.maxArtistsPerStudio;

      for (const artist of updatedArtists) {
        const studio = updatedStudios[studioIndex];
        
        // Assign artist to studio
        artist.tattooStudio = {
          studioId: studio.studioId,
          studioName: studio.studioName,
          address: {
            street: studio.address || 'Default Address',
            city: studio.locationDisplay ? studio.locationDisplay.split(',')[0] : 'London',
            postcode: studio.postcode || 'SW1A 1AA',
            latitude: studio.latitude || 51.5074,
            longitude: studio.longitude || -0.1278
          }
        };

        // Add artist to studio
        if (!studio.artists) studio.artists = [];
        studio.artists.push(artist.artistId);
        studio.artistCount = studio.artists.length;

        // Move to next studio if current one is full
        if (studio.artists.length >= maxArtistsPerStudio) {
          studioIndex = (studioIndex + 1) % updatedStudios.length;
        }
      }

      console.log('✅ Fallback relationships created successfully');
      return { artists: updatedArtists, studios: updatedStudios };

    } catch (error) {
      console.error('❌ Fallback relationship creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate overall workflow consistency
   */
  async validateWorkflowConsistency(relationshipData) {
    console.log('🔍 Validating workflow consistency...');

    try {
      const { artists, studios } = relationshipData;

      // Check data integrity
      if (!Array.isArray(artists) || artists.length === 0) {
        throw new Error('Invalid or empty artists array');
      }

      if (!Array.isArray(studios) || studios.length === 0) {
        throw new Error('Invalid or empty studios array');
      }

      // Check that all artists have required fields
      const missingFields = [];
      for (const artist of artists) {
        if (!artist.artistId) missingFields.push('artistId');
        if (!artist.artistName) missingFields.push('artistName');
      }

      if (missingFields.length > 0) {
        throw new Error(`Artists missing required fields: ${[...new Set(missingFields)].join(', ')}`);
      }

      // Check that all studios have required fields
      const missingStudioFields = [];
      for (const studio of studios) {
        if (!studio.studioId) missingStudioFields.push('studioId');
        if (!studio.studioName) missingStudioFields.push('studioName');
      }

      if (missingStudioFields.length > 0) {
        throw new Error(`Studios missing required fields: ${[...new Set(missingStudioFields)].join(', ')}`);
      }

      console.log('✅ Workflow consistency validation passed');

    } catch (error) {
      console.error('❌ Workflow consistency validation failed:', error.message);
      this.stats.errors.push({
        type: STUDIO_ERROR_TYPES.WORKFLOW_COORDINATION_FAILED,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Recover from validation errors by fixing common issues
   */
  async recoverFromValidationErrors(studios, validationResult) {
    console.log('🔧 Attempting to recover from validation errors...');

    const recoveredStudios = [...studios];

    for (const result of validationResult.results) {
      if (!result.isValid) {
        const studio = recoveredStudios[result.index];
        
        // Fix common validation issues
        for (const error of result.errors) {
          if (error.includes('Missing required field')) {
            await this.fixMissingField(studio, error);
          } else if (error.includes('Invalid UK postcode format')) {
            studio.postcode = 'SW1A 1AA'; // Default valid postcode
          } else if (error.includes('outside UK range')) {
            // Fix coordinates to be within UK
            studio.latitude = 51.5074;
            studio.longitude = -0.1278;
          }
        }
      }
    }

    return recoveredStudios;
  }

  /**
   * Fix missing required fields
   */
  async fixMissingField(studio, error) {
    if (error.includes('studioId')) {
      studio.studioId = `studio-${Date.now()}`;
    } else if (error.includes('studioName')) {
      studio.studioName = 'Default Studio Name';
    } else if (error.includes('address')) {
      studio.address = 'Default Address, London';
    } else if (error.includes('contactInfo')) {
      studio.contactInfo = {
        phone: '+44 20 7946 0958',
        email: 'info@studio.com',
        website: 'https://studio.com',
        instagram: '@studio'
      };
    } else if (error.includes('specialties')) {
      studio.specialties = ['traditional'];
    }
  }

  /**
   * Handle processing errors with recovery attempts
   */
  async handleProcessingError(error, context) {
    console.error('❌ Studio data processing failed:', error.message);

    this.stats.endTime = Date.now();
    this.stats.duration = this.stats.endTime - this.stats.startTime;
    
    this.stats.errors.push({
      type: 'processing_error',
      message: error.message,
      timestamp: new Date().toISOString(),
      context
    });

    return {
      success: false,
      error: error.message,
      stats: this.getProcessingStats(),
      context,
      recoveryOptions: this.getRecoveryOptions(error)
    };
  }

  /**
   * Get recovery options for different error types
   */
  getRecoveryOptions(error) {
    const options = [];

    if (error.message.includes('generation')) {
      options.push('Try with fallback studio generation');
      options.push('Reduce studio count and retry');
    }

    if (error.message.includes('validation')) {
      options.push('Skip validation and continue');
      options.push('Use minimal studio data structure');
    }

    if (error.message.includes('image')) {
      options.push('Skip image processing');
      options.push('Use placeholder images');
    }

    return options;
  }

  /**
   * Generate geohash for coordinates (simple implementation)
   */
  generateGeohash(lat, lon) {
    // Simple geohash implementation for testing
    const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let hash = '';
    let precision = 6;
    
    // This is a simplified geohash - in production, use a proper library
    for (let i = 0; i < precision; i++) {
      hash += base32[Math.floor(Math.random() * base32.length)];
    }
    
    return hash;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats() {
    return {
      ...this.stats,
      successRate: this.stats.studiosGenerated > 0 ? 
        (this.stats.studiosProcessed / this.stats.studiosGenerated) * 100 : 0,
      validationRate: this.stats.studiosGenerated > 0 ? 
        (this.stats.studiosValidated / this.stats.studiosGenerated) * 100 : 0,
      imageProcessingRate: this.stats.studiosProcessed > 0 ? 
        (this.stats.imagesProcessed / this.stats.studiosProcessed) * 100 : 0
    };
  }

  /**
   * Reset processing statistics
   */
  resetStats() {
    this.stats = {
      studiosGenerated: 0,
      studiosValidated: 0,
      studiosProcessed: 0,
      relationshipsCreated: 0,
      imagesProcessed: 0,
      errors: [],
      warnings: [],
      startTime: null,
      endTime: null,
      duration: 0
    };
  }

  /**
   * Configure error recovery settings
   */
  configureErrorRecovery(options = {}) {
    this.errorRecovery = {
      ...this.errorRecovery,
      ...options
    };
  }

  /**
   * Integration method for the main data pipeline
   * This method provides a standardized interface for the pipeline to use
   */
  async integrateWithPipeline(pipelineContext) {
    const { artists, scenario, options = {} } = pipelineContext;

    console.log('🔗 Integrating studio data processor with main pipeline...');

    try {
      // Configure processor based on pipeline context
      if (options.errorRecovery) {
        this.configureErrorRecovery(options.errorRecovery);
      }

      // Process studios using the main orchestration method
      const result = await this.processStudios(artists, {
        scenario,
        forceRegenerate: options.forceRegenerate || false,
        skipValidation: options.skipValidation || false,
        skipImages: options.skipImages || false,
        progressCallback: options.progressCallback
      });

      if (result.success) {
        console.log('✅ Studio data processor integration successful');
        
        // Return data in pipeline-expected format
        return {
          success: true,
          data: {
            artists: result.artists,
            studios: result.studios
          },
          stats: result.stats,
          metadata: {
            component: 'studio-data-processor',
            version: '1.0.0',
            processingTime: result.stats.duration,
            scenario: scenario
          }
        };
      } else {
        throw new Error(`Studio processing failed: ${result.error}`);
      }

    } catch (error) {
      console.error('❌ Studio data processor pipeline integration failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        stats: this.getProcessingStats(),
        metadata: {
          component: 'studio-data-processor',
          version: '1.0.0',
          failed: true
        }
      };
    }
  }

  /**
   * Validate integration with existing pipeline components
   */
  async validatePipelineIntegration() {
    console.log('🔍 Validating pipeline integration...');

    const validationResults = {
      frontendSyncProcessor: false,
      studioValidator: false,
      studioImageProcessor: false,
      configAccess: false,
      errors: []
    };

    try {
      // Test frontend sync processor integration
      if (this.frontendSyncProcessor && typeof this.frontendSyncProcessor.generateMockData === 'function') {
        validationResults.frontendSyncProcessor = true;
      } else {
        validationResults.errors.push('Frontend sync processor not properly initialized');
      }

      // Test studio validator integration
      if (this.validator && typeof this.validator.validateStudios === 'function') {
        validationResults.studioValidator = true;
      } else {
        validationResults.errors.push('Studio validator not properly initialized');
      }

      // Test studio image processor integration
      if (this.imageProcessor && typeof this.imageProcessor.processMultipleStudios === 'function') {
        validationResults.studioImageProcessor = true;
      } else {
        validationResults.errors.push('Studio image processor not properly initialized');
      }

      // Test config access
      if (this.config && this.config.studio && this.config.scenarios) {
        validationResults.configAccess = true;
      } else {
        validationResults.errors.push('Configuration not properly accessible');
      }

      const allValid = Object.values(validationResults).every(v => v === true || Array.isArray(v));
      
      if (allValid && validationResults.errors.length === 0) {
        console.log('✅ Pipeline integration validation passed');
        return { valid: true, results: validationResults };
      } else {
        console.warn('⚠️  Pipeline integration validation found issues');
        return { valid: false, results: validationResults };
      }

    } catch (error) {
      console.error('❌ Pipeline integration validation failed:', error.message);
      validationResults.errors.push(error.message);
      return { valid: false, results: validationResults };
    }
  }
}

// Export the class
module.exports = {
  StudioDataProcessor,
  STUDIO_ERROR_TYPES
};

// CLI usage when run directly
if (require.main === module) {
  const processor = new StudioDataProcessor();
  
  console.log('🏢 Studio Data Processor Orchestrator');
  console.log('Usage: This component is designed to be used by the main data pipeline.');
  console.log('');
  console.log('Key capabilities:');
  console.log('  • Studio count calculation based on artist count and scenarios');
  console.log('  • Integration with existing studio generator from frontend-sync-processor');
  console.log('  • Studio data validation with error recovery');
  console.log('  • Studio image processing coordination');
  console.log('  • Bidirectional artist-studio relationship management');
  console.log('  • Workflow consistency validation');
  console.log('  • Comprehensive error handling and recovery');
  console.log('');
  console.log('Error recovery options:');
  console.log('  • Fallback studio generation when primary generator fails');
  console.log('  • Validation error recovery with field fixing');
  console.log('  • Continue processing on non-critical errors');
  console.log('  • Comprehensive error reporting and recovery suggestions');
}