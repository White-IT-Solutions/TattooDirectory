#!/usr/bin/env node

/**
 * Database Seeder Class
 * 
 * Handles DynamoDB and OpenSearch seeding operations with support for all 10 existing
 * scenarios. Extracted from existing seed.js and selective-seeder.js with enhanced
 * error handling, validation, and state management.
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { DATA_CONFIG } = require('../data-config');
const { STATE_MANAGER } = require('../utilities/state-manager');

/**
 * Import validation functions
 */
const { validateArtistData, validateStudioData, validateStyleData } = require('../data-seeder/simple-validator');

/**
 * Test scenarios configuration preserving all existing scenarios
 */
const TEST_SCENARIOS = {
  minimal: {
    description: 'Quick testing with minimal data including studios',
    artists: ['artist-001', 'artist-002', 'artist-003'],
    studios: ['studio-001', 'studio-002'],
    styles: ['traditional', 'realism']
  },
  'search-basic': {
    description: 'Basic search functionality testing with studios',
    artists: ['artist-001', 'artist-002', 'artist-003', 'artist-004', 'artist-005'],
    studios: ['studio-001', 'studio-002', 'studio-003'],
    styles: ['traditional', 'realism', 'blackwork']
  },
  'london-artists': {
    description: 'London-based artists for location testing',
    filter: (item) => item.locationDisplay && item.locationDisplay.includes('London'),
    minItems: 5
  },
  'high-rated': {
    description: 'High-rated artists for rating tests',
    filter: (item) => item.rating && item.rating >= 4.5,
    minItems: 3
  },
  'new-artists': {
    description: 'Recently joined artists for timeline tests',
    filter: (item) => {
      if (!item.experience || !item.experience.yearsActive) return false;
      return item.experience.yearsActive <= 2;
    },
    minItems: 4
  },
  'booking-available': {
    description: 'Artists with open booking for availability tests',
    filter: (item) => item.availability && item.availability.bookingOpen === true,
    minItems: 6
  },
  'portfolio-rich': {
    description: 'Artists with extensive portfolios for image testing',
    filter: (item) => item.portfolioImages && item.portfolioImages.length >= 8,
    minItems: 4
  },
  'multi-style': {
    description: 'Artists with multiple styles for complex filtering',
    filter: (item) => item.styles && item.styles.length >= 3,
    minItems: 3
  },
  'pricing-range': {
    description: 'Artists with various pricing for price filtering',
    artists: ['artist-001', 'artist-005', 'artist-010', 'artist-015', 'artist-020'],
    ensurePricingVariety: true
  },
  'full-dataset': {
    description: 'Complete test dataset with all 23 styles, 50 studios, and comprehensive metadata - ensures each style has at least 5 artists (150 artists)',
    loadAll: true,
    generateLarge: true,
    targetArtistCount: 150,
    targetStudioCount: 50
  },
  'performance-test': {
    description: 'Large dataset for performance testing (100+ artists, 40+ studios)',
    loadAll: true,
    generateLarge: true,
    targetArtistCount: 100,
    targetStudioCount: 40
  },
  'mega-dataset': {
    description: 'Extra large dataset for stress testing (250+ artists, 100+ studios)',
    loadAll: true,
    generateLarge: true,
    targetArtistCount: 250,
    targetStudioCount: 100
  },
  'studio-diverse': {
    description: 'Diverse studio types and specializations with varied artist assignments',
    loadAll: true,
    ensureStudioDiversity: true,
    targetArtistCount: 8,
    targetStudioCount: 5
  },
  'london-studios': {
    description: 'London-focused studios and artists with proper postcodes',
    filter: (item) => item.locationDisplay && item.locationDisplay.includes('London'),
    minItems: 5,
    targetStudioCount: 3
  },
  'high-rated-studios': {
    description: 'High-rated studios and artists (4.5+ stars)',
    filter: (item) => item.rating && item.rating >= 4.5,
    minItems: 3,
    targetStudioCount: 2
  }
};

/**
 * DatabaseSeeder class with comprehensive seeding functionality
 */
class DatabaseSeeder {
  constructor(config = DATA_CONFIG) {
    this.config = config;
    this.stateManager = STATE_MANAGER;
    
    // Configure AWS SDK for LocalStack
    AWS.config.update({
      region: config.services.aws.region,
      endpoint: config.services.aws.endpoint,
      accessKeyId: config.services.aws.accessKeyId,
      secretAccessKey: config.services.aws.secretAccessKey,
      s3ForcePathStyle: true
    });
    
    this.dynamodb = new AWS.DynamoDB.DocumentClient();
    this.dynamodbClient = new AWS.DynamoDB();
    this.tableName = config.services.dynamodb.tableName;
    this.opensearchIndex = config.services.opensearch.indexName;
    
    // Processing statistics
    this.stats = {
      artists: { loaded: 0, failed: 0 },
      studios: { loaded: 0, failed: 0 },
      styles: { loaded: 0, failed: 0 },
      opensearch: { indexed: 0, failed: 0 },
      errors: []
    };
    
    // Cache for loaded data
    this.allData = {
      artists: [],
      studios: [],
      styles: []
    };
  }

  /**
   * Wait for all required services to be ready
   */
  async waitForServices() {
    console.log('⏳ Waiting for services to be ready...');
    
    await this.waitForDynamoDB();
    await this.waitForOpenSearch();
    
    console.log('✅ All services are ready');
  }

  /**
   * Wait for DynamoDB to be ready
   */
  async waitForDynamoDB() {
    let retries = 30;
    while (retries > 0) {
      try {
        await this.dynamodbClient.describeTable({ TableName: this.tableName }).promise();
        console.log('✅ DynamoDB is ready');
        return;
      } catch (error) {
        console.log(`⏳ Waiting for DynamoDB... (${retries} retries left)`);
        retries--;
        await this.sleep(2000);
      }
    }
    throw new Error('❌ DynamoDB not ready after 60 seconds');
  }

  /**
   * Wait for OpenSearch to be ready
   */
  async waitForOpenSearch() {
    let retries = 30;
    while (retries > 0) {
      try {
        await this.makeOpenSearchRequest('GET', '/');
        console.log('✅ OpenSearch is ready');
        return;
      } catch (error) {
        console.log(`⏳ Waiting for OpenSearch... (${retries} retries left)`);
        retries--;
        await this.sleep(2000);
      }
    }
    throw new Error('❌ OpenSearch not ready after 60 seconds');
  }

  /**
   * Make HTTP request to OpenSearch
   */
  makeOpenSearchRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const isContainer = this.config.environment.isDocker;
      
      // Use dedicated OpenSearch container instead of LocalStack
      const hostname = isContainer ? 'tattoo-directory-opensearch' : 'localhost';
      const port = isContainer ? 9200 : 4571; // Internal port 9200, external port 4571
      
      const options = {
        hostname: hostname,
        port: port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  /**
   * Load test data from JSON files
   */
  async loadTestData(filename) {
    const testDataPath = path.join(this.config.paths.testDataDir, filename);
    
    if (!fs.existsSync(testDataPath)) {
      throw new Error(`Test data file not found: ${filename} at ${testDataPath}`);
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
      console.log(`📊 Loaded ${data.length} records from ${filename}`);
      return data;
    } catch (error) {
      throw new Error(`Failed to parse ${filename}: ${error.message}`);
    }
  }

  /**
   * Load scenario-specific studio data from studios directory
   */
  async loadScenarioStudioData(scenarioName) {
    const studioFilename = `${scenarioName}.json`;
    const studioDataPath = path.join(this.config.paths.studioTestDataDir, studioFilename);
    
    if (!fs.existsSync(studioDataPath)) {
      console.warn(`⚠️  Scenario-specific studio data not found: ${studioFilename}`);
      console.log(`   Falling back to default studio data`);
      return null;
    }
    
    try {
      const studioData = JSON.parse(fs.readFileSync(studioDataPath, 'utf8'));
      console.log(`🏢 Loaded ${studioData.length} scenario-specific studios from ${studioFilename}`);
      return studioData;
    } catch (error) {
      console.error(`❌ Failed to parse scenario studio data ${studioFilename}: ${error.message}`);
      return null;
    }
  }

  /**
   * Load all test data into cache
   */
  async loadAllTestData() {
    console.log('📊 Loading all test data...');
    
    const dataTypes = ['artists', 'studios', 'styles'];
    
    for (const type of dataTypes) {
      try {
        const data = await this.loadTestData(`${type}.json`);
        this.allData[type] = data;
        console.log(`✅ Loaded ${data.length} ${type} records`);
      } catch (error) {
        console.error(`❌ Failed to load ${type} data:`, error.message);
        this.stats.errors.push({
          type: 'data_loading_error',
          dataType: type,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Generate scenario-based data using the frontend sync processor
   */
  async generateScenarioData(scenarioName) {
    console.log(`🎯 Generating data for scenario: ${scenarioName}`);
    
    // Get scenario configuration from TEST_SCENARIOS
    const scenario = TEST_SCENARIOS[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}. Available scenarios: ${Object.keys(TEST_SCENARIOS).join(', ')}`);
    }

    // Import the frontend sync processor for data generation
    const { FrontendSyncProcessor } = require('./frontend-sync-processor');
    const frontendProcessor = new FrontendSyncProcessor(this.config);
    
    try {
      // Generate data based on scenario configuration from DATA_CONFIG
      const generatedData = await frontendProcessor.generateScenarioData(scenarioName, {
        artistCount: scenario.artistCount || 10,
        studioCount: scenario.studioCount || 5,
        styles: scenario.styles || ['traditional', 'realism'],
        locations: scenario.locations || ['London'],
        includeBusinessData: true,
        validateData: true
      });
      
      if (generatedData.success) {
        this.allData = {
          artists: generatedData.artists || [],
          studios: generatedData.studios || [],
          styles: generatedData.styles || []
        };
        
        console.log(`✅ Generated ${this.allData.artists.length} artists, ${this.allData.studios.length} studios, ${this.allData.styles.length} styles`);
        return true;
      } else {
        throw new Error(`Failed to generate scenario data: ${generatedData.error}`);
      }
    } catch (error) {
      console.error(`❌ Failed to generate scenario data:`, error.message);
      // Fall back to static data loading
      console.log('📊 Falling back to static test data...');
      await this.loadAllTestData();
      return false;
    }
  }

  /**
   * Filter data for a specific scenario
   */
  filterDataForScenario(scenario) {
    console.log(`🎯 Filtering data for scenario: ${scenario.description}`);
    
    const filtered = {
      artists: [],
      studios: [],
      styles: []
    };

    // Handle full dataset scenario
    if (scenario.loadAll) {
      let baseData = {
        artists: [...this.allData.artists],
        studios: [...this.allData.studios],
        styles: [...this.allData.styles]
      };
      
      // Handle large dataset generation for performance testing
      if (scenario.generateLarge && scenario.targetArtistCount) {
        baseData = this.generateLargeDataset(baseData, scenario);
      }
      
      return baseData;
    }

    // Handle specific ID-based selection
    if (scenario.artists) {
      filtered.artists = this.allData.artists.filter(artist => 
        scenario.artists.includes(artist.artistId)
      );
    }
    
    if (scenario.studios) {
      filtered.studios = this.allData.studios.filter(studio => 
        scenario.studios.includes(studio.studioId)
      );
    }
    
    if (scenario.styles) {
      filtered.styles = this.allData.styles.filter(style => 
        scenario.styles.includes(style.styleId)
      );
    }

    // Handle filter-based selection
    if (scenario.filter) {
      const filteredArtists = this.allData.artists.filter(scenario.filter);
      
      // Ensure minimum items if specified
      if (scenario.minItems && filteredArtists.length < scenario.minItems) {
        console.warn(`⚠️  Only found ${filteredArtists.length} items, need ${scenario.minItems}`);
        // Add random items to meet minimum
        const remaining = this.allData.artists.filter(artist => !filteredArtists.includes(artist));
        const additional = remaining.slice(0, scenario.minItems - filteredArtists.length);
        filtered.artists = [...filteredArtists, ...additional];
      } else {
        filtered.artists = filteredArtists;
      }
      
      // Include related studios and styles
      const artistStyles = new Set();
      const studioIds = new Set();
      
      filtered.artists.forEach(artist => {
        if (artist.styles) {
          artist.styles.forEach(style => artistStyles.add(style));
        }
        if (artist.studioId) {
          studioIds.add(artist.studioId);
        }
      });
      
      filtered.styles = this.allData.styles.filter(style => 
        artistStyles.has(style.styleId)
      );
      
      filtered.studios = this.allData.studios.filter(studio => 
        studioIds.has(studio.studioId)
      );
    }

    // Handle special requirements
    if (scenario.ensurePricingVariety) {
      this.ensurePricingVariety(filtered.artists);
    }

    console.log(`📊 Filtered data: ${filtered.artists.length} artists, ${filtered.studios.length} studios, ${filtered.styles.length} styles`);
    return filtered;
  }

  /**
   * Ensure pricing variety for testing
   */
  ensurePricingVariety(artists) {
    const pricingRanges = [
      { hourlyRate: 80, minimumCharge: 100 },
      { hourlyRate: 120, minimumCharge: 150 },
      { hourlyRate: 150, minimumCharge: 200 },
      { hourlyRate: 200, minimumCharge: 300 },
      { hourlyRate: 250, minimumCharge: 400 }
    ];

    artists.forEach((artist, index) => {
      if (!artist.pricing) {
        artist.pricing = {
          currency: 'GBP',
          ...pricingRanges[index % pricingRanges.length]
        };
      }
    });
  }

  /**
   * Generate large dataset for performance testing
   */
  generateLargeDataset(baseData, scenario) {
    console.log(`🔢 Generating large dataset: ${scenario.targetArtistCount} artists, ${scenario.targetStudioCount || 'auto'} studios`);
    
    const targetArtistCount = scenario.targetArtistCount || 100;
    const targetStudioCount = scenario.targetStudioCount || Math.ceil(targetArtistCount / 2.5);
    
    // Generate additional artists by duplicating and modifying existing ones
    const generatedArtists = [...baseData.artists];
    const baseArtistCount = baseData.artists.length;
    
    for (let i = baseArtistCount; i < targetArtistCount; i++) {
      const baseArtist = baseData.artists[i % baseArtistCount];
      const generatedArtist = this.generateVariantArtist(baseArtist, i);
      generatedArtists.push(generatedArtist);
    }
    
    // Generate additional studios
    const generatedStudios = [...baseData.studios];
    const baseStudioCount = baseData.studios.length;
    
    for (let i = baseStudioCount; i < targetStudioCount; i++) {
      const baseStudio = baseData.studios[i % baseStudioCount];
      const generatedStudio = this.generateVariantStudio(baseStudio, i);
      generatedStudios.push(generatedStudio);
    }
    
    console.log(`✅ Generated ${generatedArtists.length} artists and ${generatedStudios.length} studios`);
    
    return {
      artists: generatedArtists,
      studios: generatedStudios,
      styles: baseData.styles
    };
  }

  /**
   * Generate a variant of an existing artist for performance testing
   */
  generateVariantArtist(baseArtist, index) {
    const variant = JSON.parse(JSON.stringify(baseArtist)); // Deep clone
    
    // Generate unique ID
    variant.artistId = `artist-${String(index + 1).padStart(3, '0')}`;
    
    // Modify name
    const nameVariations = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Sage', 'River'];
    const surnameVariations = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    variant.name = `${nameVariations[index % nameVariations.length]} ${surnameVariations[Math.floor(index / nameVariations.length) % surnameVariations.length]}`;
    
    // Vary rating slightly
    if (variant.rating) {
      variant.rating = Math.max(3.0, Math.min(5.0, variant.rating + (Math.random() - 0.5) * 0.8));
      variant.rating = Math.round(variant.rating * 10) / 10;
    }
    
    // Vary pricing
    if (variant.pricing) {
      const multiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      variant.pricing.hourlyRate = Math.round(variant.pricing.hourlyRate * multiplier);
      variant.pricing.minimumCharge = Math.round(variant.pricing.minimumCharge * multiplier);
    }
    
    // Assign to a studio (distribute evenly)
    const studioIndex = index % 40; // Assuming up to 40 studios for performance test
    variant.studioId = `studio-${String(studioIndex + 1).padStart(3, '0')}`;
    
    return variant;
  }

  /**
   * Generate a variant of an existing studio for performance testing
   */
  generateVariantStudio(baseStudio, index) {
    const variant = JSON.parse(JSON.stringify(baseStudio)); // Deep clone
    
    // Generate unique ID
    variant.studioId = `studio-${String(index + 1).padStart(3, '0')}`;
    
    // Modify studio name
    const studioNames = ['Ink', 'Art', 'Tattoo', 'Studio', 'Gallery', 'Works', 'House', 'Parlour', 'Shop', 'Collective'];
    const studioTypes = ['Studio', 'Gallery', 'Parlour', 'House', 'Works', 'Collective', 'Shop', 'Space', 'Lab', 'Hub'];
    variant.studioName = `${studioNames[index % studioNames.length]} ${studioTypes[Math.floor(index / studioNames.length) % studioTypes.length]}`;
    
    // Vary location within UK cities
    const ukCities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol', 'Liverpool', 'Newcastle', 'Sheffield'];
    const cityIndex = index % ukCities.length;
    const city = ukCities[cityIndex];
    
    variant.address = `${Math.floor(Math.random() * 999) + 1} ${['High', 'Main', 'Church', 'King', 'Queen'][index % 5]} Street`;
    variant.city = city;
    variant.locationDisplay = `${variant.address}, ${city}`;
    
    // Generate realistic UK postcode for the city
    const postcodes = {
      'London': ['SW1A 1AA', 'E1 6AN', 'W1A 0AX', 'SE1 9SG', 'N1 9GU'],
      'Manchester': ['M1 1AA', 'M2 3AE', 'M3 4FP', 'M4 1AQ', 'M13 9PL'],
      'Birmingham': ['B1 1AA', 'B2 4QA', 'B3 1JJ', 'B4 6AT', 'B5 4RN'],
      'Leeds': ['LS1 1AA', 'LS2 7UE', 'LS3 1LX', 'LS4 2AU', 'LS6 2UE'],
      'Glasgow': ['G1 1AA', 'G2 3BZ', 'G3 6LP', 'G4 0QR', 'G12 8QQ']
    };
    
    const cityPostcodes = postcodes[city] || ['XX1 1XX'];
    variant.postcode = cityPostcodes[index % cityPostcodes.length];
    
    // Vary rating
    if (variant.rating) {
      variant.rating = Math.max(3.5, Math.min(5.0, variant.rating + (Math.random() - 0.5) * 0.6));
      variant.rating = Math.round(variant.rating * 10) / 10;
    }
    
    return variant;
  }

  /**
   * Seed all data types (full dataset)
   */
  async seedAllData() {
    console.log('🌱 Seeding complete dataset...');
    
    try {
      await this.loadAllTestData();
      
      // Ensure DynamoDB table exists
      await this.recreateTable();
      
      // Setup OpenSearch index first
      await this.setupOpenSearchIndex();
      
      // Seed in dependency order
      await this.seedStyles(this.allData.styles);
      await this.seedStudios(this.allData.studios);
      await this.seedArtists(this.allData.artists);
      
      // Index in OpenSearch
      await this.indexArtistsInOpenSearch(this.allData.artists);
      await this.indexStudiosInOpenSearch(this.allData.studios);
      
      // Setup bidirectional relationships
      await this.setupBidirectionalRelationships();
      
      // Fix image URLs to ensure all portfolio images are accessible
      await this.fixArtistImageUrls();
      
      return {
        success: true,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Full seeding failed:', error.message);
      this.stats.errors.push({
        type: 'full_seeding_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Seed data for a specific scenario
   */
  async seedScenario(scenarioName) {
    console.log(`🎯 Seeding scenario: ${scenarioName}`);
    
    // Get scenario configuration from TEST_SCENARIOS
    const scenario = TEST_SCENARIOS[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}. Available scenarios: ${Object.keys(TEST_SCENARIOS).join(', ')}`);
    }

    console.log(`📋 ${scenario.description}`);
    
    try {
      // Try to generate scenario-based data first
      const generatedData = await this.generateScenarioData(scenarioName);
      
      if (!generatedData) {
        // Fall back to static data approach
        await this.loadAllTestData();
        
        // Load scenario-specific studio data if available
        const scenarioStudioData = await this.loadScenarioStudioData(scenarioName);
        if (scenarioStudioData) {
          // Replace default studio data with scenario-specific data
          this.allData.studios = scenarioStudioData;
          console.log(`🏢 Using scenario-specific studio data for '${scenarioName}'`);
        }
        
        // Filter static data for the scenario
        const filteredData = this.filterDataForScenario(scenario);
        this.allData = filteredData;
      }
      
      // Ensure DynamoDB table exists
      await this.recreateTable();
      
      // Setup OpenSearch index first
      await this.setupOpenSearchIndex();
      
      // Seed the data (either generated or filtered static data)
      await this.seedStyles(this.allData.styles);
      await this.seedStudios(this.allData.studios);
      await this.seedArtists(this.allData.artists);
      
      // Index in OpenSearch
      await this.indexArtistsInOpenSearch(this.allData.artists);
      await this.indexStudiosInOpenSearch(this.allData.studios);
      
      // Setup bidirectional relationships
      await this.setupBidirectionalRelationships();
      
      // Fix image URLs to ensure all portfolio images are accessible
      await this.fixArtistImageUrls();
      
      console.log(`✅ Scenario '${scenarioName}' seeded successfully`);
      console.log(`📊 Final counts: ${this.allData.artists.length} artists, ${this.allData.studios.length} studios, ${this.allData.styles.length} styles`);
      
      return {
        success: true,
        scenario: scenarioName,
        stats: this.stats
      };
      
    } catch (error) {
      console.error(`❌ Scenario seeding failed:`, error.message);
      this.stats.errors.push({
        type: 'scenario_seeding_error',
        scenario: scenarioName,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        scenario: scenarioName,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Put item with retry logic and conditional writes to prevent duplicates
   */
  async putItemWithRetry(item, maxRetries = 3, delay = 1000, allowOverwrite = false) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const putParams = {
          TableName: this.tableName,
          Item: item
        };
        
        // Add conditional expression to prevent duplicates unless overwrite is allowed
        if (!allowOverwrite) {
          putParams.ConditionExpression = "attribute_not_exists(PK)";
        }
        
        await this.dynamodb.put(putParams).promise();
        return; // Success
      } catch (error) {
        // Handle conditional check failure (item already exists)
        if (error.code === 'ConditionalCheckFailedException') {
          console.log(`   Item already exists, skipping: ${item.PK}`);
          return; // Skip this item, it's already there
        }
        
        // Handle LocalStack internal failures with retry
        if (error.code === 'InternalFailure' && attempt < maxRetries) {
          console.log(`   Retry ${attempt}/${maxRetries} after LocalStack internal failure...`);
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        
        throw error; // Re-throw if not retryable or max retries reached
      }
    }
  }

  /**
   * Batch process items with rate limiting to prevent LocalStack overload
   */
  async processBatch(items, processor, batchSize = 3, delayBetweenBatches = 2000) {
    const results = { success: 0, failed: 0, errors: [] };
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(items.length/batchSize)} (${batch.length} items)`);
      
      // Process batch items in parallel but with limited concurrency
      const batchPromises = batch.map(async (item) => {
        try {
          await processor(item);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({ item: item.artistId || item.studioId || item.styleId, error: error.message });
        }
      });
      
      await Promise.all(batchPromises);
      
      // Delay between batches to prevent overwhelming LocalStack
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    return results;
  }

  /**
   * Seed artists data
   */
  async seedArtists(artists) {
    console.log(`🎨 Seeding ${artists.length} artists...`);
    
    for (const artist of artists) {
      try {
        // Validate artist data
        const validationErrors = validateArtistData(artist);
        if (validationErrors.length > 0) {
          console.error(`❌ Invalid artist data for ${artist.artistName}: ${validationErrors.join(', ')}`);
          this.stats.artists.failed++;
          this.stats.errors.push({
            type: 'validation_error',
            dataType: 'artist',
            id: artist.artistId,
            errors: validationErrors,
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Create DynamoDB item using LLD specification
        const primaryStyle = artist.styles[0];
        const shard = Math.floor(Math.random() * 10); // Random shard 0-9
        const normalizedName = artist.artistName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const item = {
          PK: `ARTIST#${artist.artistId}`,
          SK: `METADATA`,
          gsi1pk: `STYLE#${primaryStyle.toLowerCase()}#SHARD#${shard}`,
          gsi1sk: `GEOHASH#${artist.geohash}#ARTIST#${artist.artistId}`,
          gsi2pk: `ARTISTNAME#${normalizedName}`,
          gsi2sk: `ARTIST#${artist.artistId}`,
          gsi3pk: `INSTAGRAM#${artist.instagramHandle.toLowerCase()}`,
          ...artist,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await this.putItemWithRetry(item);
        
        console.log(`✅ Seeded artist: ${artist.artistName}`);
        this.stats.artists.loaded++;
        
        // Small delay to prevent overwhelming LocalStack
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to seed artist ${artist.artistName}:`, error.message);
        console.error(`   Table: ${this.tableName}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Error details:`, error);
        this.stats.artists.failed++;
        this.stats.errors.push({
          type: 'seeding_error',
          dataType: 'artist',
          id: artist.artistId,
          message: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Seed studios data with enhanced functionality
   */
  async seedStudios(studios) {
    console.log(`🏢 Seeding ${studios.length} studios...`);
    
    for (const studio of studios) {
      try {
        // Validate studio data
        const validationErrors = validateStudioData(studio);
        if (validationErrors.length > 0) {
          console.error(`❌ Invalid studio data for ${studio.studioName}: ${validationErrors.join(', ')}`);
          this.stats.studios.failed++;
          this.stats.errors.push({
            type: 'validation_error',
            dataType: 'studio',
            id: studio.studioId,
            errors: validationErrors,
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Create DynamoDB item with enhanced GSI structure
        const item = {
          PK: `STUDIO#${studio.studioId}`,
          SK: `PROFILE`,
          gsi1pk: `LOCATION#${studio.geohash}`,
          gsi1sk: `${studio.studioName}`,
          gsi2pk: `POSTCODE#${studio.postcode}`,
          gsi2sk: `${studio.studioName}`,
          gsi3pk: `SPECIALTY#${studio.specialties[0]}`,
          gsi3sk: `${studio.geohash}#${studio.studioId}`,
          ...studio,
          artistCount: studio.artists ? studio.artists.length : 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await this.putItemWithRetry(item);
        
        console.log(`✅ Seeded studio: ${studio.studioName}`);
        this.stats.studios.loaded++;
        
        // Small delay to prevent overwhelming LocalStack
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to seed studio ${studio.studioName}:`, error.message);
        console.error(`   Table: ${this.tableName}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Error details:`, error);
        this.stats.studios.failed++;
        this.stats.errors.push({
          type: 'seeding_error',
          dataType: 'studio',
          id: studio.studioId,
          message: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Seed only studios (studio-specific operation)
   */
  async seedStudiosOnly() {
    console.log('🏢 Seeding studios only...');
    
    try {
      await this.loadAllTestData();
      
      // Clear existing studio data only
      await this.clearStudioData();
      
      // Seed studios
      await this.seedStudios(this.allData.studios);
      
      // Index studios in OpenSearch
      await this.indexStudiosInOpenSearch(this.allData.studios);
      
      console.log('✅ Studio-only seeding completed');
      
      return {
        success: true,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Studio-only seeding failed:', error.message);
      this.stats.errors.push({
        type: 'studio_seeding_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Reset studio data while preserving artist data
   */
  async resetStudiosOnly() {
    console.log('🔄 Resetting studio data while preserving artists...');
    
    try {
      // Clear only studio data
      await this.clearStudioData();
      
      // Remove studio references from artists
      await this.removeStudioReferencesFromArtists();
      
      console.log('✅ Studio data reset completed');
      
      return {
        success: true,
        message: 'Studio data cleared, artist data preserved'
      };
      
    } catch (error) {
      console.error('❌ Studio reset failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Seed styles data
   */
  async seedStyles(styles) {
    console.log(`🎭 Seeding ${styles.length} styles...`);
    
    for (const style of styles) {
      try {
        // Validate style data
        const validationErrors = validateStyleData(style);
        if (validationErrors.length > 0) {
          console.error(`❌ Invalid style data for ${style.styleName}: ${validationErrors.join(', ')}`);
          this.stats.styles.failed++;
          this.stats.errors.push({
            type: 'validation_error',
            dataType: 'style',
            id: style.styleId,
            errors: validationErrors,
            timestamp: new Date().toISOString()
          });
          continue;
        }

        // Create DynamoDB item
        const item = {
          PK: `STYLE#${style.styleId}`,
          SK: `METADATA`,
          gsi1pk: `STYLE_CATEGORY#${style.difficulty}`,
          gsi1sk: `${style.styleName}`,
          ...style,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await this.putItemWithRetry(item);
        
        console.log(`✅ Seeded style: ${style.styleName}`);
        this.stats.styles.loaded++;
        
        // Small delay to prevent overwhelming LocalStack
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`❌ Failed to seed style ${style.styleName}:`, error.message);
        console.error(`   Table: ${this.tableName}`);
        console.error(`   Error code: ${error.code}`);
        console.error(`   Error details:`, error);
        this.stats.styles.failed++;
        this.stats.errors.push({
          type: 'seeding_error',
          dataType: 'style',
          id: style.styleId,
          message: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Setup OpenSearch index with proper mapping including studio support
   */
  async setupOpenSearchIndex() {
    console.log('🔍 Setting up OpenSearch index...');
    
    try {
      // Check if index exists first
      let indexExists = false;
      try {
        await this.makeOpenSearchRequest('HEAD', `/${this.opensearchIndex}`);
        indexExists = true;
        console.log('📋 OpenSearch index already exists');
        
        // Check if the mapping has portfolioImages field correctly mapped
        try {
          const mapping = await this.makeOpenSearchRequest('GET', `/${this.opensearchIndex}/_mapping`);
          const properties = mapping[this.opensearchIndex]?.mappings?.properties;
          
          if (!properties?.portfolioImages || properties.portfolioImages.type !== 'nested') {
            console.log('📋 Index mapping is outdated, recreating with correct portfolioImages mapping');
            // Delete the existing index
            await this.makeOpenSearchRequest('DELETE', `/${this.opensearchIndex}`);
            indexExists = false;
          } else {
            console.log('📋 Index mapping is correct, skipping creation');
            return;
          }
        } catch (mappingError) {
          console.log('📋 Could not check mapping, recreating index');
          await this.makeOpenSearchRequest('DELETE', `/${this.opensearchIndex}`);
          indexExists = false;
        }
      } catch (error) {
        // Index doesn't exist, we'll create it
        console.log('📋 OpenSearch index does not exist, creating new one');
      }

      // Create index with mapping for both artists and studios
      const indexMapping = {
        mappings: {
          properties: {
            // Common fields
            entityType: { type: 'keyword' }, // 'artist' or 'studio'
            location: { type: 'geo_point' },
            geohash: { type: 'keyword' },
            locationDisplay: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            rating: { type: 'float' },
            reviewCount: { type: 'integer' },
            
            // Artist-specific fields
            artistId: { type: 'keyword' },
            artistName: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            instagramHandle: { type: 'keyword' },
            styles: { type: 'keyword' },
            pricing: {
              properties: {
                hourlyRate: { type: 'integer' },
                minimumCharge: { type: 'integer' },
                currency: { type: 'keyword' }
              }
            },
            availability: {
              properties: {
                bookingOpen: { type: 'boolean' },
                nextAvailable: { type: 'date' },
                waitingList: { type: 'boolean' }
              }
            },
            experience: {
              properties: {
                yearsActive: { type: 'integer' },
                apprenticeshipCompleted: { type: 'boolean' }
              }
            },
            portfolioImages: { 
              type: 'nested',
              properties: {
                description: { type: 'text', analyzer: 'standard' },
                style: { type: 'keyword' },
                url: { type: 'keyword' },
                tags: { type: 'keyword' }
              }
            }, // Array of portfolio image objects
            
            // Studio-specific fields
            studioId: { type: 'keyword' },
            studioName: { 
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            address: {
              type: 'text',
              analyzer: 'standard'
            },
            postcode: { type: 'keyword' },
            specialties: { type: 'keyword' },
            artists: { type: 'keyword' },
            artistCount: { type: 'integer' },
            established: { type: 'integer' },
            contactInfo: {
              properties: {
                phone: { type: 'keyword' },
                email: { type: 'keyword' },
                website: { type: 'keyword' },
                instagram: { type: 'keyword' }
              }
            },
            openingHours: {
              properties: {
                monday: { type: 'keyword' },
                tuesday: { type: 'keyword' },
                wednesday: { type: 'keyword' },
                thursday: { type: 'keyword' },
                friday: { type: 'keyword' },
                saturday: { type: 'keyword' },
                sunday: { type: 'keyword' }
              }
            }
          }
        }
      };

      await this.makeOpenSearchRequest('PUT', `/${this.opensearchIndex}`, indexMapping);
      console.log('✅ OpenSearch index created successfully with studio support');
      
    } catch (error) {
      console.error('❌ Failed to setup OpenSearch index:', error.message);
      throw error;
    }
  }

  /**
   * Index artists in OpenSearch
   */
  async indexArtistsInOpenSearch(artists) {
    console.log(`🔍 Indexing ${artists.length} artists in OpenSearch...`);
    
    for (const artist of artists) {
      try {
        // Prepare document for OpenSearch
        const document = {
          ...artist,
          entityType: 'artist',
          location: {
            lat: artist.latitude,
            lon: artist.longitude
          }
        };

        await this.makeOpenSearchRequest(
          'PUT', 
          `/${this.opensearchIndex}/_doc/${artist.artistId}`,
          document
        );
        
        console.log(`✅ Indexed artist: ${artist.artistName}`);
        this.stats.opensearch.indexed++;
        
      } catch (error) {
        console.error(`❌ Failed to index artist ${artist.artistName}:`, error.message);
        this.stats.opensearch.failed++;
        this.stats.errors.push({
          type: 'indexing_error',
          dataType: 'artist',
          id: artist.artistId,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Refresh index to make documents searchable
    try {
      await this.makeOpenSearchRequest('POST', `/${this.opensearchIndex}/_refresh`);
      console.log('✅ OpenSearch index refreshed for artists');
    } catch (error) {
      console.error('❌ Failed to refresh OpenSearch index:', error.message);
    }
  }

  /**
   * Index studios in OpenSearch
   */
  async indexStudiosInOpenSearch(studios) {
    console.log(`🔍 Indexing ${studios.length} studios in OpenSearch...`);
    
    for (const studio of studios) {
      try {
        // Prepare document for OpenSearch
        const document = {
          ...studio,
          entityType: 'studio',
          location: {
            lat: studio.latitude,
            lon: studio.longitude
          }
        };

        await this.makeOpenSearchRequest(
          'PUT', 
          `/${this.opensearchIndex}/_doc/${studio.studioId}`,
          document
        );
        
        console.log(`✅ Indexed studio: ${studio.studioName}`);
        this.stats.opensearch.indexed++;
        
      } catch (error) {
        console.error(`❌ Failed to index studio ${studio.studioName}:`, error.message);
        this.stats.opensearch.failed++;
        this.stats.errors.push({
          type: 'indexing_error',
          dataType: 'studio',
          id: studio.studioId,
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Refresh index to make documents searchable
    try {
      await this.makeOpenSearchRequest('POST', `/${this.opensearchIndex}/_refresh`);
      console.log('✅ OpenSearch index refreshed for studios');
    } catch (error) {
      console.error('❌ Failed to refresh OpenSearch index:', error.message);
    }
  }

  /**
   * Recreate DynamoDB table to ensure clean state
   */
  async recreateTable() {
    console.log(`🔄 Recreating DynamoDB table to ensure clean state...`);
    
    try {
      // Delete the table if it exists
      try {
        await this.dynamodbClient.deleteTable({ TableName: this.tableName }).promise();
        console.log(`🗑️  Deleted existing table: ${this.tableName}`);
        
        // Wait for table to be deleted
        await this.dynamodbClient.waitFor('tableNotExists', { TableName: this.tableName }).promise();
        console.log(`⏳ Table deletion confirmed`);
      } catch (error) {
        if (error.code !== 'ResourceNotFoundException') {
          throw error;
        }
        console.log(`📋 Table ${this.tableName} does not exist, creating new one`);
      }
      
      // Create the table with the correct schema
      const tableParams = {
        TableName: this.tableName,
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      };
      
      await this.dynamodbClient.createTable(tableParams).promise();
      console.log(`🆕 Created new table: ${this.tableName}`);
      
      // Wait for table to be active
      await this.dynamodbClient.waitFor('tableExists', { TableName: this.tableName }).promise();
      console.log(`✅ Table is ready for use`);
      
    } catch (error) {
      console.error(`❌ Failed to recreate table:`, error.message);
      throw error;
    }
  }

  /**
   * Clear specific data types from DynamoDB table (fallback method)
   */
  async clearDataByType(dataType) {
    console.log(`🗑️  Clearing ${dataType} data...`);
    
    const prefixMap = {
      'artists': 'ARTIST#',
      'studios': 'STUDIO#', 
      'styles': 'STYLE#'
    };
    
    const prefix = prefixMap[dataType];
    if (!prefix) {
      throw new Error(`Unknown data type: ${dataType}`);
    }
    
    try {
      // Scan for items with the specific prefix
      const scanResult = await this.dynamodb.scan({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :prefix)',
        ExpressionAttributeValues: {
          ':prefix': prefix
        },
        ProjectionExpression: 'PK, SK'
      }).promise();
      
      if (scanResult.Items.length === 0) {
        console.log(`📋 No ${dataType} data found to clear`);
        return;
      }
      
      // Remove duplicates based on PK+SK combination
      const uniqueItems = [];
      const seenKeys = new Set();
      
      for (const item of scanResult.Items) {
        const keyString = `${item.PK}#${item.SK}`;
        if (!seenKeys.has(keyString)) {
          seenKeys.add(keyString);
          uniqueItems.push(item);
        }
      }
      
      console.log(`🔍 Found ${scanResult.Items.length} items, ${uniqueItems.length} unique keys`);
      
      // Delete items in batches
      const batchSize = 25; // DynamoDB batch write limit
      for (let i = 0; i < uniqueItems.length; i += batchSize) {
        const batch = uniqueItems.slice(i, i + batchSize);
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: { PK: item.PK, SK: item.SK }
          }
        }));
        
        await this.dynamodb.batchWrite({
          RequestItems: {
            [this.tableName]: deleteRequests
          }
        }).promise();
        
        console.log(`🗑️  Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueItems.length/batchSize)} (${batch.length} items)`);
      }
      
      console.log(`✅ Cleared ${uniqueItems.length} ${dataType} items`);
    } catch (error) {
      console.error(`❌ Failed to clear ${dataType} data:`, error.message);
      throw error;
    }
  }

  /**
   * Clear all data from DynamoDB and OpenSearch
   */
  async clearAllData() {
    console.log('🧹 Clearing all data...');
    
    try {
      // Clear DynamoDB data
      await this.clearDynamoDBData();
      
      // Clear OpenSearch data
      await this.clearOpenSearchData();
      
      console.log('✅ All data cleared successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to clear data:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear DynamoDB data
   */
  async clearDynamoDBData() {
    console.log('🗑️  Clearing DynamoDB data...');
    
    try {
      // Scan all items
      const scanResult = await this.dynamodb.scan({
        TableName: this.tableName,
        ProjectionExpression: 'PK, SK'
      }).promise();
      
      if (scanResult.Items.length === 0) {
        console.log('📋 DynamoDB table is already empty');
        return;
      }
      
      // Delete items in batches
      const batchSize = 25; // DynamoDB batch write limit
      for (let i = 0; i < scanResult.Items.length; i += batchSize) {
        const batch = scanResult.Items.slice(i, i + batchSize);
        
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              PK: item.PK,
              SK: item.SK
            }
          }
        }));
        
        await this.dynamodb.batchWrite({
          RequestItems: {
            [this.tableName]: deleteRequests
          }
        }).promise();
        
        console.log(`🗑️  Deleted ${deleteRequests.length} items from DynamoDB`);
      }
      
      console.log(`✅ Cleared ${scanResult.Items.length} items from DynamoDB`);
      
    } catch (error) {
      console.error('❌ Failed to clear DynamoDB data:', error.message);
      throw error;
    }
  }

  /**
   * Clear only studio data from DynamoDB
   */
  async clearStudioData() {
    console.log('🗑️  Clearing studio data from DynamoDB...');
    
    try {
      // Scan for studio items only
      const scanResult = await this.dynamodb.scan({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :studioPrefix)',
        ExpressionAttributeValues: {
          ':studioPrefix': 'STUDIO#'
        },
        ProjectionExpression: 'PK, SK'
      }).promise();
      
      if (scanResult.Items.length === 0) {
        console.log('📋 No studio data found in DynamoDB');
        return;
      }
      
      // Delete studio items in batches
      const batchSize = 25; // DynamoDB batch write limit
      for (let i = 0; i < scanResult.Items.length; i += batchSize) {
        const batch = scanResult.Items.slice(i, i + batchSize);
        
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              PK: item.PK,
              SK: item.SK
            }
          }
        }));
        
        await this.dynamodb.batchWrite({
          RequestItems: {
            [this.tableName]: deleteRequests
          }
        }).promise();
        
        console.log(`🗑️  Deleted ${deleteRequests.length} studio items from DynamoDB`);
      }
      
      // Clear studio documents from OpenSearch
      await this.clearStudioDataFromOpenSearch();
      
      console.log(`✅ Cleared ${scanResult.Items.length} studio items from DynamoDB`);
      
    } catch (error) {
      console.error('❌ Failed to clear studio data:', error.message);
      throw error;
    }
  }

  /**
   * Clear studio data from OpenSearch
   */
  async clearStudioDataFromOpenSearch() {
    console.log('🗑️  Clearing studio data from OpenSearch...');
    
    try {
      // Delete by query - remove all studio documents
      const deleteQuery = {
        query: {
          term: {
            entityType: 'studio'
          }
        }
      };

      await this.makeOpenSearchRequest(
        'POST', 
        `/${this.opensearchIndex}/_delete_by_query`,
        deleteQuery
      );
      
      console.log('✅ Cleared studio data from OpenSearch');
      
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('📋 OpenSearch index does not exist');
      } else {
        console.error('❌ Failed to clear studio data from OpenSearch:', error.message);
        throw error;
      }
    }
  }

  /**
   * Remove studio references from artist records
   */
  async removeStudioReferencesFromArtists() {
    console.log('🔗 Removing studio references from artist records...');
    
    try {
      // Scan for artist items that have studio references
      const scanResult = await this.dynamodb.scan({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :artistPrefix) AND attribute_exists(tattooStudio)',
        ExpressionAttributeValues: {
          ':artistPrefix': 'ARTIST#'
        }
      }).promise();
      
      if (scanResult.Items.length === 0) {
        console.log('📋 No artist records with studio references found');
        return;
      }
      
      // Update each artist to remove studio reference
      for (const artist of scanResult.Items) {
        try {
          const updatedArtist = { ...artist };
          delete updatedArtist.tattooStudio;
          
          await this.dynamodb.put({
            TableName: this.tableName,
            Item: {
              ...updatedArtist,
              updatedAt: new Date().toISOString()
            }
          }).promise();
          
          console.log(`✅ Removed studio reference from artist: ${artist.artistName}`);
          
        } catch (error) {
          console.error(`❌ Failed to update artist ${artist.artistName}:`, error.message);
        }
      }
      
      console.log(`✅ Updated ${scanResult.Items.length} artist records`);
      
    } catch (error) {
      console.error('❌ Failed to remove studio references from artists:', error.message);
      throw error;
    }
  }

  /**
   * Clear OpenSearch data
   */
  async clearOpenSearchData() {
    console.log('🗑️  Clearing OpenSearch data...');
    
    try {
      // Delete the entire index
      await this.makeOpenSearchRequest('DELETE', `/${this.opensearchIndex}`);
      console.log('✅ Cleared OpenSearch index');
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('📋 OpenSearch index does not exist');
      } else {
        console.error('❌ Failed to clear OpenSearch data:', error.message);
        throw error;
      }
    }
  }

  /**
   * Validate seeded data including studio consistency
   */
  async validateSeededData() {
    console.log('🔍 Validating seeded data...');
    
    try {
      // Check DynamoDB data
      const scanResult = await this.dynamodb.scan({
        TableName: this.tableName,
        Select: 'COUNT'
      }).promise();
      
      console.log(`📊 DynamoDB contains ${scanResult.Count} items`);
      
      // Check OpenSearch data
      const searchResult = await this.makeOpenSearchRequest('GET', `/${this.opensearchIndex}/_count`);
      console.log(`📊 OpenSearch contains ${searchResult.count} documents`);
      
      // Validate studio data consistency
      const studioValidation = await this.validateStudioDataConsistency();
      
      return {
        dynamodb: scanResult.Count,
        opensearch: searchResult.count,
        consistent: scanResult.Count > 0 && searchResult.count > 0,
        studioConsistency: studioValidation
      };
      
    } catch (error) {
      console.error('❌ Failed to validate seeded data:', error.message);
      throw error;
    }
  }

  /**
   * Validate studio data consistency across DynamoDB and OpenSearch
   */
  async validateStudioDataConsistency() {
    console.log('🔍 Validating studio data consistency...');
    
    try {
      // Get studio count from DynamoDB
      const dynamoStudioScan = await this.dynamodb.scan({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :studioPrefix)',
        ExpressionAttributeValues: {
          ':studioPrefix': 'STUDIO#'
        },
        Select: 'COUNT'
      }).promise();
      
      // Get studio count from OpenSearch
      const opensearchStudioQuery = {
        query: {
          term: {
            entityType: 'studio'
          }
        }
      };
      
      const opensearchStudioResult = await this.makeOpenSearchRequest(
        'POST',
        `/${this.opensearchIndex}/_count`,
        opensearchStudioQuery
      );
      
      const dynamoStudioCount = dynamoStudioScan.Count;
      const opensearchStudioCount = opensearchStudioResult.count;
      
      console.log(`📊 DynamoDB studios: ${dynamoStudioCount}`);
      console.log(`📊 OpenSearch studios: ${opensearchStudioCount}`);
      
      // Validate artist-studio relationships
      const relationshipValidation = await this.validateArtistStudioRelationships();
      
      const isConsistent = dynamoStudioCount === opensearchStudioCount && 
                          relationshipValidation.consistent;
      
      return {
        dynamoStudioCount,
        opensearchStudioCount,
        consistent: isConsistent,
        relationships: relationshipValidation
      };
      
    } catch (error) {
      console.error('❌ Failed to validate studio consistency:', error.message);
      return {
        dynamoStudioCount: 0,
        opensearchStudioCount: 0,
        consistent: false,
        error: error.message
      };
    }
  }

  /**
   * Validate artist-studio relationships are bidirectional and consistent
   */
  async validateArtistStudioRelationships() {
    console.log('🔗 Validating artist-studio relationships...');
    
    try {
      // Get all artists with studio references
      const artistScan = await this.dynamodb.scan({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :artistPrefix) AND attribute_exists(tattooStudio)',
        ExpressionAttributeValues: {
          ':artistPrefix': 'ARTIST#'
        }
      }).promise();
      
      // Get all studios
      const studioScan = await this.dynamodb.scan({
        TableName: this.tableName,
        FilterExpression: 'begins_with(PK, :studioPrefix)',
        ExpressionAttributeValues: {
          ':studioPrefix': 'STUDIO#'
        }
      }).promise();
      
      const artists = artistScan.Items;
      const studios = studioScan.Items;
      const errors = [];
      
      // Check that every artist's studio reference is valid
      for (const artist of artists) {
        if (artist.tattooStudio && artist.tattooStudio.studioId) {
          const referencedStudio = studios.find(s => s.studioId === artist.tattooStudio.studioId);
          if (!referencedStudio) {
            errors.push(`Artist ${artist.artistId} references non-existent studio ${artist.tattooStudio.studioId}`);
          } else if (!referencedStudio.artists || !referencedStudio.artists.includes(artist.artistId)) {
            errors.push(`Studio ${referencedStudio.studioId} doesn't list artist ${artist.artistId} in its artists array`);
          }
        }
      }
      
      // Check that every studio's artist list is valid
      for (const studio of studios) {
        if (studio.artists && Array.isArray(studio.artists)) {
          for (const artistId of studio.artists) {
            const referencedArtist = artists.find(a => a.artistId === artistId);
            if (!referencedArtist) {
              errors.push(`Studio ${studio.studioId} references non-existent artist ${artistId}`);
            } else if (!referencedArtist.tattooStudio || referencedArtist.tattooStudio.studioId !== studio.studioId) {
              errors.push(`Artist ${artistId} doesn't reference studio ${studio.studioId} correctly`);
            }
          }
        }
      }
      
      const isConsistent = errors.length === 0;
      
      if (isConsistent) {
        console.log('✅ Artist-studio relationships are consistent');
      } else {
        console.log(`❌ Found ${errors.length} relationship inconsistencies`);
        errors.forEach(error => console.log(`  - ${error}`));
      }
      
      return {
        consistent: isConsistent,
        errors,
        artistsWithStudios: artists.length,
        totalStudios: studios.length
      };
      
    } catch (error) {
      console.error('❌ Failed to validate relationships:', error.message);
      return {
        consistent: false,
        errors: [error.message],
        artistsWithStudios: 0,
        totalStudios: 0
      };
    }
  }

  /**
   * Setup bidirectional studio-artist relationships
   * Ensures all artists with studioInfo have proper tattooStudio references
   * and all studios have correct artist lists
   */
  async setupBidirectionalRelationships() {
    console.log('🔗 Setting up bidirectional studio-artist relationships...');
    
    try {
      // Get all artists and studios
      const [artistsResult, studiosResult] = await Promise.all([
        this.dynamodb.scan({
          TableName: this.tableName,
          FilterExpression: "begins_with(PK, :artistPrefix)",
          ExpressionAttributeValues: { ":artistPrefix": "ARTIST#" },
        }).promise(),
        
        this.dynamodb.scan({
          TableName: this.tableName,
          FilterExpression: "begins_with(PK, :studioPrefix)",
          ExpressionAttributeValues: { ":studioPrefix": "STUDIO#" },
        }).promise()
      ]);

      const artists = artistsResult.Items;
      const studios = studiosResult.Items;
      
      // Create studio name to studio mapping
      const studioNameToStudio = {};
      studios.forEach(studio => {
        if (studio.studioName) {
          studioNameToStudio[studio.studioName] = studio;
        }
      });

      // Build artist-to-studio mappings
      const studioArtistMappings = {}; // studioId -> [artistIds]
      const artistStudioMappings = {}; // artistId -> studioId
      let matchedArtists = 0;

      artists.forEach(artist => {
        const studioName = artist.studioInfo?.studioName;
        
        if (studioName && studioNameToStudio[studioName]) {
          const studio = studioNameToStudio[studioName];
          const studioId = studio.studioId;
          
          // Add to mappings
          if (!studioArtistMappings[studioId]) {
            studioArtistMappings[studioId] = [];
          }
          studioArtistMappings[studioId].push(artist.artistId);
          artistStudioMappings[artist.artistId] = studioId;
          matchedArtists++;
        }
      });

      console.log(`   Found ${matchedArtists} artists with matching studios`);

      // Update artists with proper studio references
      let updatedArtists = 0;
      for (const artist of artists) {
        const studioId = artistStudioMappings[artist.artistId];
        
        if (studioId) {
          const studio = studioNameToStudio[artist.studioInfo.studioName];
          
          // Create proper studio reference
          const studioReference = {
            studioId: studioId,
            studioName: studio.studioName,
            address: studio.address,
            postcode: studio.postcode
          };

          // Update artist with tattooStudio reference (for seeder compatibility)
          await this.dynamodb.update({
            TableName: this.tableName,
            Key: { PK: artist.PK, SK: artist.SK },
            UpdateExpression: "SET tattooStudio = :studioRef, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":studioRef": studioReference,
              ":updatedAt": new Date().toISOString(),
            },
          }).promise();

          updatedArtists++;
        }
      }

      // Update studios with artist lists
      let updatedStudios = 0;
      for (const studio of studios) {
        const expectedArtists = studioArtistMappings[studio.studioId] || [];
        const currentArtists = studio.artists || [];

        // Check if update is needed
        const needsUpdate = 
          expectedArtists.length !== currentArtists.length ||
          !expectedArtists.every(artistId => currentArtists.includes(artistId));

        if (needsUpdate) {
          await this.dynamodb.update({
            TableName: this.tableName,
            Key: { PK: studio.PK, SK: studio.SK },
            UpdateExpression: "SET artists = :artists, artistCount = :count, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":artists": expectedArtists,
              ":count": expectedArtists.length,
              ":updatedAt": new Date().toISOString(),
            },
          }).promise();

          updatedStudios++;
        }
      }

      console.log(`   ✅ Updated ${updatedArtists} artists and ${updatedStudios} studios with bidirectional relationships`);
      
      return {
        success: true,
        updatedArtists,
        updatedStudios,
        matchedArtists
      };
      
    } catch (error) {
      console.error('❌ Failed to setup bidirectional relationships:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fix artist image URLs to use valid S3 images
   * Replaces invalid numbered tattoo files with actual available images
   */
  async fixArtistImageUrls() {
    console.log('🖼️  Fixing artist image URLs...');
    
    try {
      // Get all available images from S3
      const s3 = new AWS.S3();
      const bucketName = this.config.services.s3.bucketName;
      
      let allObjects = [];
      let continuationToken = null;
      
      do {
        const params = {
          Bucket: bucketName,
          MaxKeys: 1000
        };
        
        if (continuationToken) {
          params.ContinuationToken = continuationToken;
        }
        
        const result = await s3.listObjectsV2(params).promise();
        allObjects = allObjects.concat(result.Contents || []);
        continuationToken = result.NextContinuationToken;
        
      } while (continuationToken);

      // Group images by style
      const imagesByStyle = {};
      allObjects.forEach(obj => {
        const key = obj.Key;
        const parts = key.split('/');
        
        if (parts.length >= 2 && parts[0] === 'styles') {
          const style = parts[1];
          if (!imagesByStyle[style]) {
            imagesByStyle[style] = [];
          }
          imagesByStyle[style].push(`http://localhost:4566/tattoo-directory-images/${key}`);
        }
      });

      // Get all artists
      const artistsResult = await this.dynamodb.scan({
        TableName: this.tableName,
        FilterExpression: "begins_with(PK, :artistPrefix)",
        ExpressionAttributeValues: {
          ":artistPrefix": "ARTIST#",
        },
      }).promise();

      const artists = artistsResult.Items;
      let updatedArtists = 0;
      let totalImagesFixed = 0;

      for (const artist of artists) {
        if (!artist.portfolioImages || !Array.isArray(artist.portfolioImages)) {
          continue;
        }

        let needsUpdate = false;
        const updatedPortfolioImages = [];

        for (const image of artist.portfolioImages) {
          const imageUrl = typeof image === 'string' ? image : image.url;
          
          // Check if this is a numbered tattoo file that might not exist
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          
          if (filename.startsWith('tattoo_') && filename.endsWith('.png')) {
            // Find a replacement image from the artist's primary style
            let replacementUrl = null;
            
            const primaryStyle = artist.styles?.[0];
            if (primaryStyle && imagesByStyle[primaryStyle]) {
              const availableImages = imagesByStyle[primaryStyle];
              const imageIndex = updatedPortfolioImages.length % availableImages.length;
              replacementUrl = availableImages[imageIndex];
            }
            
            // Fallback to any available style if primary style not found
            if (!replacementUrl) {
              const availableStyles = Object.keys(imagesByStyle);
              if (availableStyles.length > 0) {
                const fallbackStyle = availableStyles[0];
                const availableImages = imagesByStyle[fallbackStyle];
                const imageIndex = updatedPortfolioImages.length % availableImages.length;
                replacementUrl = availableImages[imageIndex];
              }
            }

            if (replacementUrl) {
              const updatedImage = typeof image === 'string' 
                ? replacementUrl
                : { ...image, url: replacementUrl };
              
              updatedPortfolioImages.push(updatedImage);
              needsUpdate = true;
              totalImagesFixed++;
            } else {
              updatedPortfolioImages.push(image);
            }
          } else {
            updatedPortfolioImages.push(image);
          }
        }

        // Update the artist if needed
        if (needsUpdate) {
          await this.dynamodb.update({
            TableName: this.tableName,
            Key: { PK: artist.PK, SK: artist.SK },
            UpdateExpression: "SET portfolioImages = :images, updatedAt = :updatedAt",
            ExpressionAttributeValues: {
              ":images": updatedPortfolioImages,
              ":updatedAt": new Date().toISOString(),
            },
          }).promise();

          updatedArtists++;
        }
      }

      console.log(`   ✅ Fixed ${totalImagesFixed} images for ${updatedArtists} artists`);
      
      return {
        success: true,
        updatedArtists,
        totalImagesFixed
      };
      
    } catch (error) {
      console.error('❌ Failed to fix image URLs:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available scenarios
   */
  getAvailableScenarios() {
    return Object.keys(TEST_SCENARIOS).map(name => ({
      name,
      description: TEST_SCENARIOS[name].description
    }));
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Incremental studio data update
   */
  async updateStudioDataIncremental(updatedStudios) {
    console.log(`🔄 Performing incremental update for ${updatedStudios.length} studios...`);
    
    try {
      for (const studio of updatedStudios) {
        // Validate studio data
        const validationErrors = validateStudioData(studio);
        if (validationErrors.length > 0) {
          console.error(`❌ Invalid studio data for ${studio.studioName}: ${validationErrors.join(', ')}`);
          this.stats.studios.failed++;
          continue;
        }

        // Update in DynamoDB
        const item = {
          PK: `STUDIO#${studio.studioId}`,
          SK: `PROFILE`,
          gsi1pk: `LOCATION#${studio.geohash}`,
          gsi1sk: `${studio.studioName}`,
          gsi2pk: `POSTCODE#${studio.postcode}`,
          gsi2sk: `${studio.studioName}`,
          gsi3pk: `SPECIALTY#${studio.specialties[0]}`,
          gsi3sk: `${studio.geohash}#${studio.studioId}`,
          ...studio,
          artistCount: studio.artists ? studio.artists.length : 0,
          updatedAt: new Date().toISOString()
        };
        
        await this.dynamodb.put({
          TableName: this.tableName,
          Item: item
        }).promise();

        // Update in OpenSearch
        const document = {
          ...studio,
          entityType: 'studio',
          location: {
            lat: studio.latitude,
            lon: studio.longitude
          }
        };

        await this.makeOpenSearchRequest(
          'PUT', 
          `/${this.opensearchIndex}/_doc/${studio.studioId}`,
          document
        );
        
        console.log(`✅ Updated studio: ${studio.studioName}`);
        this.stats.studios.loaded++;
      }

      // Refresh OpenSearch index
      await this.makeOpenSearchRequest('POST', `/${this.opensearchIndex}/_refresh`);
      
      console.log(`✅ Incremental update completed for ${updatedStudios.length} studios`);
      
      return {
        success: true,
        updatedCount: updatedStudios.length,
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Incremental studio update failed:', error.message);
      this.stats.errors.push({
        type: 'incremental_update_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    }
  }

  /**
   * Reset processing statistics
   */
  resetStats() {
    this.stats = {
      artists: { loaded: 0, failed: 0 },
      studios: { loaded: 0, failed: 0 },
      styles: { loaded: 0, failed: 0 },
      opensearch: { indexed: 0, failed: 0 },
      errors: []
    };
  }

  /**
   * Print statistics summary
   */
  printStats() {
    console.log('\n📈 Database Seeding Statistics:');
    console.log('┌─────────────┬─────────┬────────┐');
    console.log('│ Data Type   │ Loaded  │ Failed │');
    console.log('├─────────────┼─────────┼────────┤');
    console.log(`│ Artists     │ ${this.stats.artists.loaded.toString().padStart(7)} │ ${this.stats.artists.failed.toString().padStart(6)} │`);
    console.log(`│ Studios     │ ${this.stats.studios.loaded.toString().padStart(7)} │ ${this.stats.studios.failed.toString().padStart(6)} │`);
    console.log(`│ Styles      │ ${this.stats.styles.loaded.toString().padStart(7)} │ ${this.stats.styles.failed.toString().padStart(6)} │`);
    console.log(`│ OpenSearch  │ ${this.stats.opensearch.indexed.toString().padStart(7)} │ ${this.stats.opensearch.failed.toString().padStart(6)} │`);
    console.log('└─────────────┴─────────┴────────┘');
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  ${this.stats.errors.length} errors occurred during seeding`);
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the class and scenarios
module.exports = {
  DatabaseSeeder,
  TEST_SCENARIOS
};

// CLI usage when run directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  async function main() {
    try {
      await seeder.waitForServices();
      
      switch (command) {
        case 'seed-all':
          console.log('🌱 Seeding complete dataset...');
          const allResult = await seeder.seedAllData();
          seeder.printStats();
          if (!allResult.success) {
            process.exit(1);
          }
          break;
          
        case 'seed-scenario':
          const scenarioName = args[1];
          if (!scenarioName) {
            throw new Error('Scenario name is required');
          }
          const scenarioResult = await seeder.seedScenario(scenarioName);
          seeder.printStats();
          if (!scenarioResult.success) {
            process.exit(1);
          }
          break;
          
        case 'seed-studios':
          console.log('🏢 Seeding studios only...');
          const studiosResult = await seeder.seedStudiosOnly();
          seeder.printStats();
          if (!studiosResult.success) {
            process.exit(1);
          }
          break;
          
        case 'reset-studios':
          console.log('🔄 Resetting studio data...');
          const resetResult = await seeder.resetStudiosOnly();
          if (!resetResult.success) {
            console.error('❌ Studio reset failed:', resetResult.error);
            process.exit(1);
          }
          console.log('✅ Studio data reset completed');
          break;
          
        case 'validate-studios':
          console.log('🔍 Validating studio data...');
          const studioValidation = await seeder.validateStudioDataConsistency();
          console.log('📊 Studio Validation Results:');
          console.log(`  DynamoDB studios: ${studioValidation.dynamoStudioCount}`);
          console.log(`  OpenSearch studios: ${studioValidation.opensearchStudioCount}`);
          console.log(`  Consistent: ${studioValidation.consistent ? '✅' : '❌'}`);
          if (studioValidation.relationships) {
            console.log(`  Relationship consistency: ${studioValidation.relationships.consistent ? '✅' : '❌'}`);
            if (studioValidation.relationships.errors.length > 0) {
              console.log('  Relationship errors:');
              studioValidation.relationships.errors.forEach(error => {
                console.log(`    - ${error}`);
              });
            }
          }
          if (!studioValidation.consistent) {
            process.exit(1);
          }
          break;
          
        case 'clear':
          const clearResult = await seeder.clearAllData();
          if (!clearResult.success) {
            process.exit(1);
          }
          break;
          
        case 'clear-studios':
          console.log('🗑️  Clearing studio data only...');
          const clearStudiosResult = await seeder.clearStudioData();
          console.log('✅ Studio data cleared');
          break;
          
        case 'validate':
          const validation = await seeder.validateSeededData();
          console.log(`📊 Validation: ${validation.dynamodb} DynamoDB items, ${validation.opensearch} OpenSearch documents`);
          console.log(`📊 Consistency: ${validation.consistent ? '✅' : '❌'}`);
          if (validation.studioConsistency) {
            console.log(`📊 Studio consistency: ${validation.studioConsistency.consistent ? '✅' : '❌'}`);
          }
          if (!validation.consistent) {
            process.exit(1);
          }
          break;
          
        case 'list-scenarios':
          console.log('📋 Available scenarios:');
          seeder.getAvailableScenarios().forEach(scenario => {
            console.log(`  ${scenario.name}: ${scenario.description}`);
          });
          break;
          
        default:
          console.log('📋 Available commands:');
          console.log('  seed-all                    - Seed complete dataset');
          console.log('  seed-scenario <name>        - Seed specific scenario');
          console.log('  seed-studios                - Seed studios only');
          console.log('  reset-studios               - Reset studio data while preserving artists');
          console.log('  validate-studios            - Validate studio data consistency');
          console.log('  clear                       - Clear all data');
          console.log('  clear-studios               - Clear studio data only');
          console.log('  validate                    - Validate all seeded data');
          console.log('  list-scenarios              - List available scenarios');
          break;
      }
      
    } catch (error) {
      console.error('❌ Database seeder failed:', error.message);
      process.exit(1);
    }
  }

  main();
}