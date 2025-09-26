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
const { DATA_CONFIG } = require('./data-config');
const { STATE_MANAGER } = require('./state-manager');

/**
 * Import validation functions
 */
const { validateArtistData, validateStudioData, validateStyleData } = require('./data-seeder/simple-validator');

/**
 * Test scenarios configuration preserving all existing scenarios
 */
const TEST_SCENARIOS = {
  minimal: {
    description: 'Minimal dataset for quick testing',
    artists: ['artist-001', 'artist-002'],
    studios: ['studio-001'],
    styles: ['traditional', 'realism']
  },
  'search-basic': {
    description: 'Basic search functionality testing',
    artists: ['artist-001', 'artist-002', 'artist-003'],
    studios: ['studio-001', 'studio-002'],
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
    description: 'Complete test dataset with all styles',
    loadAll: true
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
    console.log('⏳ Waiting for LocalStack services to be ready...');
    
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
      const hostname = isContainer ? 'localstack' : 'localhost';
      
      const options = {
        hostname: hostname,
        port: 4566,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Host': 'tattoo-directory-local.eu-west-2.opensearch.localstack'
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
      return {
        artists: [...this.allData.artists],
        studios: [...this.allData.studios],
        styles: [...this.allData.styles]
      };
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
   * Seed all data types (full dataset)
   */
  async seedAllData() {
    console.log('🌱 Seeding complete dataset...');
    
    try {
      await this.loadAllTestData();
      
      // Setup OpenSearch index first
      await this.setupOpenSearchIndex();
      
      // Seed in dependency order
      await this.seedStyles(this.allData.styles);
      await this.seedStudios(this.allData.studios);
      await this.seedArtists(this.allData.artists);
      
      // Index in OpenSearch
      await this.indexArtistsInOpenSearch(this.allData.artists);
      await this.indexStudiosInOpenSearch(this.allData.studios);
      
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
    
    const scenario = TEST_SCENARIOS[scenarioName];
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}. Available scenarios: ${Object.keys(TEST_SCENARIOS).join(', ')}`);
    }

    console.log(`📋 ${scenario.description}`);
    
    try {
      await this.loadAllTestData();
      
      // Load scenario-specific studio data if available
      const scenarioStudioData = await this.loadScenarioStudioData(scenarioName);
      if (scenarioStudioData) {
        // Replace default studio data with scenario-specific data
        this.allData.studios = scenarioStudioData;
        console.log(`🏢 Using scenario-specific studio data for '${scenarioName}'`);
      }
      
      const filteredData = this.filterDataForScenario(scenario);
      
      // Setup OpenSearch index first
      await this.setupOpenSearchIndex();
      
      // Seed filtered data
      await this.seedStyles(filteredData.styles);
      await this.seedStudios(filteredData.studios);
      await this.seedArtists(filteredData.artists);
      
      // Index in OpenSearch
      await this.indexArtistsInOpenSearch(filteredData.artists);
      await this.indexStudiosInOpenSearch(filteredData.studios);
      
      console.log(`✅ Scenario '${scenarioName}' seeded successfully`);
      
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
        
        await this.dynamodb.put({
          TableName: this.tableName,
          Item: item
        }).promise();
        
        console.log(`✅ Seeded artist: ${artist.artistName}`);
        this.stats.artists.loaded++;
        
      } catch (error) {
        console.error(`❌ Failed to seed artist ${artist.artistName}:`, error.message);
        this.stats.artists.failed++;
        this.stats.errors.push({
          type: 'seeding_error',
          dataType: 'artist',
          id: artist.artistId,
          message: error.message,
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
        
        await this.dynamodb.put({
          TableName: this.tableName,
          Item: item
        }).promise();
        
        console.log(`✅ Seeded studio: ${studio.studioName}`);
        this.stats.studios.loaded++;
        
      } catch (error) {
        console.error(`❌ Failed to seed studio ${studio.studioName}:`, error.message);
        this.stats.studios.failed++;
        this.stats.errors.push({
          type: 'seeding_error',
          dataType: 'studio',
          id: studio.studioId,
          message: error.message,
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
        
        await this.dynamodb.put({
          TableName: this.tableName,
          Item: item
        }).promise();
        
        console.log(`✅ Seeded style: ${style.styleName}`);
        this.stats.styles.loaded++;
        
      } catch (error) {
        console.error(`❌ Failed to seed style ${style.styleName}:`, error.message);
        this.stats.styles.failed++;
        this.stats.errors.push({
          type: 'seeding_error',
          dataType: 'style',
          id: style.styleId,
          message: error.message,
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
      // Delete existing index if it exists
      try {
        await this.makeOpenSearchRequest('DELETE', `/${this.opensearchIndex}`);
        console.log('📋 Deleted existing OpenSearch index');
      } catch (error) {
        // Index doesn't exist, which is fine
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